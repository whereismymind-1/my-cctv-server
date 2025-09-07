import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan } from 'typeorm';
import { StreamEntity } from '../../infrastructure/database/entities/stream.schema';
import { CommentEntity } from '../../infrastructure/database/entities/comment.schema';
import { RedisService } from '../../infrastructure/redis/redis.service';

export interface ViewerEvent {
  userId: string | null;
  streamId: string;
  event: 'join' | 'leave' | 'comment' | 'reaction';
  timestamp: Date;
  metadata?: any;
}

export interface StreamMetrics {
  streamId: string;
  currentViewers: number;
  peakViewers: number;
  averageViewTime: number;
  totalComments: number;
  engagementRate: number;
  viewerRetention: number[];
  popularMoments: Array<{
    timestamp: number;
    commentCount: number;
  }>;
}

export interface ViewerAnalytics {
  userId: string;
  totalWatchTime: number;
  favoriteStreams: string[];
  averageSessionDuration: number;
  commentFrequency: number;
  activeHours: number[];
  engagementScore: number;
}

export interface PlatformAnalytics {
  totalStreams: number;
  totalViewers: number;
  averageStreamDuration: number;
  peakConcurrentViewers: number;
  popularCategories: Array<{
    category: string;
    count: number;
  }>;
  timeBasedMetrics: Array<{
    hour: number;
    viewerCount: number;
    streamCount: number;
  }>;
}

@Injectable()
export class AnalyticsService {
  private viewerEvents: Map<string, ViewerEvent[]>;
  private streamMetrics: Map<string, StreamMetrics>;
  private viewerSessions: Map<string, Map<string, Date>>;

  constructor(
    @InjectRepository(StreamEntity)
    private streamRepository: Repository<StreamEntity>,
    @InjectRepository(CommentEntity)
    private commentRepository: Repository<CommentEntity>,
    private redisService: RedisService,
  ) {
    this.viewerEvents = new Map();
    this.streamMetrics = new Map();
    this.viewerSessions = new Map();
  }

  /**
   * Track viewer event
   */
  async trackViewerEvent(event: ViewerEvent): Promise<void> {
    // Store event
    const streamEvents = this.viewerEvents.get(event.streamId) || [];
    streamEvents.push(event);
    this.viewerEvents.set(event.streamId, streamEvents);

    // Update metrics based on event type
    switch (event.event) {
      case 'join':
        await this.handleViewerJoin(event);
        break;
      case 'leave':
        await this.handleViewerLeave(event);
        break;
      case 'comment':
        await this.handleComment(event);
        break;
    }

    // Store in Redis for real-time processing
    await this.redisService.getClient().lpush(
      `analytics:events:${event.streamId}`,
      JSON.stringify(event),
    );
    await this.redisService.getClient().expire(
      `analytics:events:${event.streamId}`,
      86400, // Keep for 24 hours
    );
  }

  /**
   * Handle viewer join event
   */
  private async handleViewerJoin(event: ViewerEvent): Promise<void> {
    const streamId = event.streamId;
    const userId = event.userId || `anonymous_${Date.now()}`;

    // Track session start
    if (!this.viewerSessions.has(streamId)) {
      this.viewerSessions.set(streamId, new Map());
    }
    this.viewerSessions.get(streamId)!.set(userId, event.timestamp);

    // Update current viewers in Redis
    await this.redisService.addViewer(streamId, userId);

    // Update metrics
    const metrics = await this.getStreamMetrics(streamId);
    metrics.currentViewers = await this.redisService.getViewerCount(streamId);
    metrics.peakViewers = Math.max(metrics.peakViewers, metrics.currentViewers);
    this.streamMetrics.set(streamId, metrics);
  }

  /**
   * Handle viewer leave event
   */
  private async handleViewerLeave(event: ViewerEvent): Promise<void> {
    const streamId = event.streamId;
    const userId = event.userId || `anonymous_${Date.now()}`;

    // Calculate session duration
    const sessions = this.viewerSessions.get(streamId);
    if (sessions && sessions.has(userId)) {
      const joinTime = sessions.get(userId)!;
      const duration = event.timestamp.getTime() - joinTime.getTime();
      
      // Store session duration
      await this.redisService.getClient().lpush(
        `analytics:sessions:${streamId}`,
        JSON.stringify({
          userId,
          duration,
          joinTime,
          leaveTime: event.timestamp,
        }),
      );
      
      sessions.delete(userId);
    }

    // Update current viewers
    await this.redisService.removeViewer(streamId, userId);

    // Update metrics
    const metrics = await this.getStreamMetrics(streamId);
    metrics.currentViewers = await this.redisService.getViewerCount(streamId);
    this.streamMetrics.set(streamId, metrics);
  }

  /**
   * Handle comment event
   */
  private async handleComment(event: ViewerEvent): Promise<void> {
    const streamId = event.streamId;
    
    // Update comment count
    const metrics = await this.getStreamMetrics(streamId);
    metrics.totalComments++;
    
    // Track popular moments (high comment activity)
    const timestamp = Math.floor(event.timestamp.getTime() / 10000) * 10; // 10-second buckets
    const moment = metrics.popularMoments.find(m => m.timestamp === timestamp);
    if (moment) {
      moment.commentCount++;
    } else {
      metrics.popularMoments.push({ timestamp, commentCount: 1 });
    }
    
    // Keep only top 10 popular moments
    metrics.popularMoments.sort((a, b) => b.commentCount - a.commentCount);
    metrics.popularMoments = metrics.popularMoments.slice(0, 10);
    
    this.streamMetrics.set(streamId, metrics);
  }

  /**
   * Get stream metrics
   */
  async getStreamMetrics(streamId: string): Promise<StreamMetrics> {
    if (!this.streamMetrics.has(streamId)) {
      const currentViewers = await this.redisService.getViewerCount(streamId);
      
      this.streamMetrics.set(streamId, {
        streamId,
        currentViewers,
        peakViewers: currentViewers,
        averageViewTime: 0,
        totalComments: 0,
        engagementRate: 0,
        viewerRetention: [],
        popularMoments: [],
      });
    }
    
    return this.streamMetrics.get(streamId)!;
  }

  /**
   * Calculate engagement rate
   */
  private calculateEngagementRate(
    viewerCount: number,
    commentCount: number,
    duration: number,
  ): number {
    if (viewerCount === 0 || duration === 0) return 0;
    
    // Engagement = (comments per viewer per minute)
    const commentsPerViewer = commentCount / viewerCount;
    const minutesDuration = duration / 60000;
    const engagementRate = (commentsPerViewer / minutesDuration) * 100;
    
    return Math.min(engagementRate, 100); // Cap at 100%
  }

  /**
   * Get viewer analytics
   */
  async getViewerAnalytics(userId: string): Promise<ViewerAnalytics> {
    // Get viewer's watch history from Redis
    const watchHistory = await this.redisService.getClient().lrange(
      `viewer:${userId}:history`,
      0,
      -1,
    );
    
    let totalWatchTime = 0;
    const streamCounts = new Map<string, number>();
    const sessionDurations: number[] = [];
    const activeHours = new Array(24).fill(0);
    
    for (const entry of watchHistory) {
      const data = JSON.parse(entry);
      totalWatchTime += data.duration || 0;
      sessionDurations.push(data.duration || 0);
      
      // Track favorite streams
      const count = streamCounts.get(data.streamId) || 0;
      streamCounts.set(data.streamId, count + 1);
      
      // Track active hours
      const hour = new Date(data.timestamp).getHours();
      activeHours[hour]++;
    }
    
    // Get comment frequency
    const comments = await this.commentRepository.count({
      where: { userId },
    });
    
    // Calculate engagement score (0-100)
    const avgSessionDuration = sessionDurations.length > 0
      ? sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length
      : 0;
    
    const engagementScore = Math.min(
      100,
      (avgSessionDuration / 3600000) * 20 + // Session duration factor
      (comments / 100) * 30 + // Comment factor
      (streamCounts.size / 10) * 50, // Variety factor
    );
    
    // Get favorite streams (top 5)
    const favoriteStreams = Array.from(streamCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([streamId]) => streamId);
    
    return {
      userId,
      totalWatchTime,
      favoriteStreams,
      averageSessionDuration: avgSessionDuration,
      commentFrequency: comments,
      activeHours,
      engagementScore: Math.round(engagementScore),
    };
  }

  /**
   * Get platform-wide analytics
   */
  async getPlatformAnalytics(
    startDate?: Date,
    endDate?: Date,
  ): Promise<PlatformAnalytics> {
    const now = new Date();
    const start = startDate || new Date(now.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours
    const end = endDate || now;
    
    // Get streams in time range
    const streams = await this.streamRepository.find({
      where: {
        createdAt: Between(start, end),
      },
    });
    
    // Calculate metrics
    const totalStreams = streams.length;
    const totalViewers = new Set(
      streams.flatMap(s => this.viewerEvents.get(s.id) || [])
        .filter(e => e.userId)
        .map(e => e.userId),
    ).size;
    
    const streamDurations = streams
      .filter(s => s.startedAt && s.endedAt)
      .map(s => s.endedAt!.getTime() - s.startedAt!.getTime());
    
    const averageStreamDuration = streamDurations.length > 0
      ? streamDurations.reduce((a, b) => a + b, 0) / streamDurations.length
      : 0;
    
    // Get peak concurrent viewers
    let peakConcurrentViewers = 0;
    for (const [, metrics] of this.streamMetrics) {
      peakConcurrentViewers = Math.max(peakConcurrentViewers, metrics.peakViewers);
    }
    
    // Time-based metrics (hourly)
    const timeBasedMetrics = new Array(24).fill(null).map((_, hour) => {
      const hourStreams = streams.filter(s => {
        const streamHour = new Date(s.createdAt).getHours();
        return streamHour === hour;
      });
      
      return {
        hour,
        viewerCount: 0, // Would need more detailed tracking
        streamCount: hourStreams.length,
      };
    });
    
    return {
      totalStreams,
      totalViewers,
      averageStreamDuration,
      peakConcurrentViewers,
      popularCategories: [], // Would need category tracking
      timeBasedMetrics,
    };
  }

  /**
   * Get real-time dashboard data
   */
  async getRealTimeDashboard(): Promise<any> {
    const activeStreams = await this.streamRepository.count({
      where: { status: 'live' },
    });
    
    let totalViewers = 0;
    let totalComments = 0;
    const streamData = [];
    
    for (const [streamId, metrics] of this.streamMetrics) {
      if (metrics.currentViewers > 0) {
        totalViewers += metrics.currentViewers;
        totalComments += metrics.totalComments;
        
        const stream = await this.streamRepository.findOne({
          where: { id: streamId },
          relations: ['owner'],
        });
        
        if (stream && stream.status === 'live') {
          streamData.push({
            id: stream.id,
            title: stream.title,
            owner: stream.owner.username,
            viewers: metrics.currentViewers,
            peakViewers: metrics.peakViewers,
            comments: metrics.totalComments,
            engagementRate: this.calculateEngagementRate(
              metrics.currentViewers,
              metrics.totalComments,
              Date.now() - (stream.startedAt?.getTime() || Date.now()),
            ),
          });
        }
      }
    }
    
    // Sort by viewers
    streamData.sort((a, b) => b.viewers - a.viewers);
    
    return {
      activeStreams,
      totalViewers,
      totalComments,
      averageEngagement: streamData.length > 0
        ? streamData.reduce((sum, s) => sum + s.engagementRate, 0) / streamData.length
        : 0,
      topStreams: streamData.slice(0, 10),
      timestamp: new Date(),
    };
  }

  /**
   * Export analytics data
   */
  async exportAnalytics(
    streamId: string,
    format: 'json' | 'csv' = 'json',
  ): Promise<string> {
    const metrics = await this.getStreamMetrics(streamId);
    const events = this.viewerEvents.get(streamId) || [];
    
    const data = {
      streamId,
      metrics,
      events: events.map(e => ({
        ...e,
        timestamp: e.timestamp.toISOString(),
      })),
      exportedAt: new Date().toISOString(),
    };
    
    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else {
      // CSV format
      const csv = [
        'Event,User ID,Timestamp,Metadata',
        ...events.map(e => 
          `${e.event},${e.userId || 'anonymous'},${e.timestamp.toISOString()},${JSON.stringify(e.metadata || {})}`
        ),
      ].join('\n');
      
      return csv;
    }
  }
}