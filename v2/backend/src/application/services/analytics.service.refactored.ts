import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { StreamEntity } from '../../infrastructure/database/entities/stream.schema';
import { CommentEntity } from '../../infrastructure/database/entities/comment.schema';
import { RedisClientService } from '../../infrastructure/redis/redis-client.service';

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

/**
 * Analytics Service (Refactored)
 * - No in-memory state
 * - All data stored in Redis
 * - Scalable across multiple instances
 */
@Injectable()
export class AnalyticsServiceRefactored {
  private static readonly EVENTS_PREFIX = 'analytics:events:';
  private static readonly METRICS_PREFIX = 'analytics:metrics:';
  private static readonly SESSIONS_PREFIX = 'analytics:sessions:';
  private static readonly VIEWER_PREFIX = 'viewer:';

  constructor(
    @InjectRepository(StreamEntity)
    private streamRepository: Repository<StreamEntity>,
    @InjectRepository(CommentEntity)
    private commentRepository: Repository<CommentEntity>,
    @Inject('REDIS_CLIENT')
    private redisClient: RedisClientService,
  ) {}

  /**
   * Track viewer event (store in Redis, not memory)
   */
  async trackViewerEvent(event: ViewerEvent): Promise<void> {
    const eventKey = `${AnalyticsServiceRefactored.EVENTS_PREFIX}${event.streamId}`;
    
    // Store event in Redis list
    await this.redisClient.lpush(eventKey, JSON.stringify(event));
    await this.redisClient.expire(eventKey, 86400); // Keep for 24 hours
    
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
  }

  /**
   * Handle viewer join event
   */
  private async handleViewerJoin(event: ViewerEvent): Promise<void> {
    const streamId = event.streamId;
    const userId = event.userId || `anonymous_${Date.now()}`;
    
    // Track session start in Redis
    const sessionKey = `${AnalyticsServiceRefactored.SESSIONS_PREFIX}${streamId}:${userId}`;
    await this.redisClient.set(sessionKey, event.timestamp.toISOString(), 86400);
    
    // Add to viewers set
    await this.redisClient.sadd(`stream:${streamId}:viewers`, userId);
    
    // Update metrics
    await this.updateStreamMetrics(streamId, 'join');
  }

  /**
   * Handle viewer leave event
   */
  private async handleViewerLeave(event: ViewerEvent): Promise<void> {
    const streamId = event.streamId;
    const userId = event.userId || `anonymous_${Date.now()}`;
    
    // Calculate session duration
    const sessionKey = `${AnalyticsServiceRefactored.SESSIONS_PREFIX}${streamId}:${userId}`;
    const joinTimeStr = await this.redisClient.get(sessionKey);
    
    if (joinTimeStr) {
      const joinTime = new Date(joinTimeStr);
      const duration = event.timestamp.getTime() - joinTime.getTime();
      
      // Store session duration
      const sessionData = {
        userId,
        duration,
        joinTime: joinTimeStr,
        leaveTime: event.timestamp.toISOString(),
      };
      
      await this.redisClient.lpush(
        `${AnalyticsServiceRefactored.SESSIONS_PREFIX}${streamId}:history`,
        JSON.stringify(sessionData)
      );
      
      // Clean up session
      await this.redisClient.del(sessionKey);
    }
    
    // Remove from viewers set
    await this.redisClient.srem(`stream:${streamId}:viewers`, userId);
    
    // Update metrics
    await this.updateStreamMetrics(streamId, 'leave');
  }

  /**
   * Handle comment event
   */
  private async handleComment(event: ViewerEvent): Promise<void> {
    const streamId = event.streamId;
    
    // Increment comment counter
    await this.redisClient.incr(`stream:${streamId}:comments`);
    
    // Track popular moments
    const timestamp = Math.floor(event.timestamp.getTime() / 10000) * 10; // 10-second buckets
    const momentKey = `stream:${streamId}:moments:${timestamp}`;
    await this.redisClient.incr(momentKey);
    await this.redisClient.expire(momentKey, 3600); // Keep for 1 hour
    
    // Update metrics
    await this.updateStreamMetrics(streamId, 'comment');
  }

  /**
   * Update stream metrics in Redis
   */
  private async updateStreamMetrics(streamId: string, action: string): Promise<void> {
    const metricsKey = `${AnalyticsServiceRefactored.METRICS_PREFIX}${streamId}`;
    
    // Get current viewer count
    const viewerCount = await this.redisClient.scard(`stream:${streamId}:viewers`);
    
    // Get or create metrics
    const metricsStr = await this.redisClient.get(metricsKey);
    let metrics: StreamMetrics;
    
    if (metricsStr) {
      metrics = JSON.parse(metricsStr);
    } else {
      metrics = {
        streamId,
        currentViewers: 0,
        peakViewers: 0,
        averageViewTime: 0,
        totalComments: 0,
        engagementRate: 0,
        viewerRetention: [],
        popularMoments: [],
      };
    }
    
    // Update based on action
    metrics.currentViewers = viewerCount;
    metrics.peakViewers = Math.max(metrics.peakViewers, viewerCount);
    
    if (action === 'comment') {
      const commentCount = await this.redisClient.get(`stream:${streamId}:comments`);
      metrics.totalComments = parseInt(commentCount || '0', 10);
    }
    
    // Save updated metrics
    await this.redisClient.set(metricsKey, JSON.stringify(metrics), 3600);
  }

  /**
   * Get stream metrics from Redis
   */
  async getStreamMetrics(streamId: string): Promise<StreamMetrics> {
    const metricsKey = `${AnalyticsServiceRefactored.METRICS_PREFIX}${streamId}`;
    const metricsStr = await this.redisClient.get(metricsKey);
    
    if (metricsStr) {
      return JSON.parse(metricsStr);
    }
    
    // Return default metrics
    const currentViewers = await this.redisClient.scard(`stream:${streamId}:viewers`);
    return {
      streamId,
      currentViewers,
      peakViewers: currentViewers,
      averageViewTime: 0,
      totalComments: 0,
      engagementRate: 0,
      viewerRetention: [],
      popularMoments: [],
    };
  }

  /**
   * Get viewer analytics from Redis
   */
  async getViewerAnalytics(userId: string): Promise<ViewerAnalytics> {
    // Get viewer's watch history from Redis
    const historyKey = `${AnalyticsServiceRefactored.VIEWER_PREFIX}${userId}:history`;
    const watchHistory = await this.redisClient.lrange(historyKey, 0, -1);
    
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
    
    // Calculate engagement score
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
   * Get real-time dashboard data from Redis
   */
  async getRealTimeDashboard(): Promise<any> {
    const activeStreams = await this.streamRepository.count({
      where: { status: 'live' },
    });
    
    // Get all stream metrics from Redis
    const keys = await this.redisClient.getClient().keys(`${AnalyticsServiceRefactored.METRICS_PREFIX}*`);
    
    let totalViewers = 0;
    let totalComments = 0;
    const streamData = [];
    
    for (const key of keys) {
      const metricsStr = await this.redisClient.get(key);
      if (metricsStr) {
        const metrics: StreamMetrics = JSON.parse(metricsStr);
        
        if (metrics.currentViewers > 0) {
          totalViewers += metrics.currentViewers;
          totalComments += metrics.totalComments;
          
          const streamId = metrics.streamId;
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
              engagementRate: metrics.engagementRate,
            });
          }
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
}