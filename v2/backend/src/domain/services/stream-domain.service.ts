import { Injectable } from '@nestjs/common';

/**
 * Domain Service for Stream Business Logic
 * Contains pure business logic without infrastructure dependencies
 */
@Injectable()
export class StreamDomainService {
  private static readonly MIN_TITLE_LENGTH = 1;
  private static readonly MAX_TITLE_LENGTH = 100;
  private static readonly MAX_DESCRIPTION_LENGTH = 500;
  private static readonly MAX_CONCURRENT_STREAMS_PER_USER = 1;
  private static readonly MAX_STREAM_DURATION = 12 * 60 * 60 * 1000; // 12 hours
  private static readonly MIN_STREAM_INTERVAL = 5 * 60 * 1000; // 5 minutes between streams
  private static readonly DEFAULT_VIEWER_LIMIT = 10000;
  private static readonly DEFAULT_COMMENT_COOLDOWN = 1000; // 1 second
  private static readonly DEFAULT_MAX_COMMENT_LENGTH = 200;

  /**
   * Validate stream title
   */
  validateTitle(title: string): void {
    if (!title || title.trim().length === 0) {
      throw new Error('Stream title cannot be empty');
    }
    
    if (title.length < StreamDomainService.MIN_TITLE_LENGTH) {
      throw new Error(`Stream title must be at least ${StreamDomainService.MIN_TITLE_LENGTH} character`);
    }
    
    if (title.length > StreamDomainService.MAX_TITLE_LENGTH) {
      throw new Error(`Stream title cannot exceed ${StreamDomainService.MAX_TITLE_LENGTH} characters`);
    }
  }

  /**
   * Validate stream description
   */
  validateDescription(description: string | null): void {
    if (description && description.length > StreamDomainService.MAX_DESCRIPTION_LENGTH) {
      throw new Error(`Stream description cannot exceed ${StreamDomainService.MAX_DESCRIPTION_LENGTH} characters`);
    }
  }

  /**
   * Check if user can create a new stream
   */
  canCreateStream(
    userLevel: number,
    activeStreamCount: number,
    lastStreamEndedAt: Date | null,
  ): boolean {
    // Check concurrent stream limit
    if (activeStreamCount >= StreamDomainService.MAX_CONCURRENT_STREAMS_PER_USER) {
      return false;
    }
    
    // Check minimum interval between streams
    if (lastStreamEndedAt) {
      const timeSinceLastStream = Date.now() - lastStreamEndedAt.getTime();
      if (timeSinceLastStream < StreamDomainService.MIN_STREAM_INTERVAL) {
        return false;
      }
    }
    
    // Level 0 users cannot stream
    if (userLevel === 0) {
      return false;
    }
    
    return true;
  }

  /**
   * Calculate stream quality settings based on user level
   */
  getStreamQualitySettings(userLevel: number): {
    maxBitrate: number;
    maxResolution: string;
    maxFps: number;
    allowTranscoding: boolean;
  } {
    if (userLevel >= 10) {
      return {
        maxBitrate: 8000,
        maxResolution: '1920x1080',
        maxFps: 60,
        allowTranscoding: true,
      };
    }
    
    if (userLevel >= 5) {
      return {
        maxBitrate: 4500,
        maxResolution: '1280x720',
        maxFps: 60,
        allowTranscoding: true,
      };
    }
    
    if (userLevel >= 2) {
      return {
        maxBitrate: 2500,
        maxResolution: '1280x720',
        maxFps: 30,
        allowTranscoding: false,
      };
    }
    
    return {
      maxBitrate: 1500,
      maxResolution: '854x480',
      maxFps: 30,
      allowTranscoding: false,
    };
  }

  /**
   * Calculate viewer limit based on user level
   */
  getViewerLimit(userLevel: number): number {
    if (userLevel >= 10) {
      return StreamDomainService.DEFAULT_VIEWER_LIMIT;
    }
    
    if (userLevel >= 5) {
      return 5000;
    }
    
    if (userLevel >= 2) {
      return 1000;
    }
    
    return 100;
  }

  /**
   * Generate stream key
   */
  generateStreamKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = 'live_';
    
    for (let i = 0; i < 32; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return key;
  }

  /**
   * Calculate stream health score
   */
  calculateStreamHealth(
    droppedFrames: number,
    totalFrames: number,
    bitrate: number,
    targetBitrate: number,
    rtt: number, // Round-trip time in ms
  ): 'excellent' | 'good' | 'fair' | 'poor' {
    const frameDropRate = totalFrames > 0 ? droppedFrames / totalFrames : 0;
    const bitrateStability = targetBitrate > 0 ? bitrate / targetBitrate : 0;
    
    // Excellent: <1% frame drop, stable bitrate, low RTT
    if (frameDropRate < 0.01 && bitrateStability > 0.95 && rtt < 50) {
      return 'excellent';
    }
    
    // Good: <3% frame drop, mostly stable bitrate, acceptable RTT
    if (frameDropRate < 0.03 && bitrateStability > 0.85 && rtt < 100) {
      return 'good';
    }
    
    // Fair: <5% frame drop, somewhat stable bitrate
    if (frameDropRate < 0.05 && bitrateStability > 0.70 && rtt < 200) {
      return 'fair';
    }
    
    // Poor: High frame drop or unstable bitrate
    return 'poor';
  }

  /**
   * Check if stream should be auto-ended
   */
  shouldAutoEndStream(
    startedAt: Date,
    lastActivityAt: Date,
    viewerCount: number,
  ): boolean {
    const now = Date.now();
    const streamDuration = now - startedAt.getTime();
    const inactivityDuration = now - lastActivityAt.getTime();
    
    // End if exceeded max duration
    if (streamDuration > StreamDomainService.MAX_STREAM_DURATION) {
      return true;
    }
    
    // End if no viewers for 10 minutes
    if (viewerCount === 0 && inactivityDuration > 10 * 60 * 1000) {
      return true;
    }
    
    // End if no activity for 30 minutes
    if (inactivityDuration > 30 * 60 * 1000) {
      return true;
    }
    
    return false;
  }

  /**
   * Calculate stream statistics
   */
  calculateStreamStats(
    startedAt: Date,
    endedAt: Date | null,
    viewerEvents: Array<{ type: 'join' | 'leave'; timestamp: Date }>,
    commentCount: number,
  ): {
    duration: number;
    averageViewers: number;
    peakViewers: number;
    totalUniqueViewers: number;
    engagementRate: number;
  } {
    const duration = endedAt 
      ? endedAt.getTime() - startedAt.getTime()
      : Date.now() - startedAt.getTime();
    
    // Calculate viewer metrics
    let currentViewers = 0;
    let peakViewers = 0;
    const viewerDurations: number[] = [];
    const viewerJoinTimes = new Map<string, Date>();
    
    for (const event of viewerEvents) {
      if (event.type === 'join') {
        currentViewers++;
        peakViewers = Math.max(peakViewers, currentViewers);
      } else {
        currentViewers = Math.max(0, currentViewers - 1);
      }
    }
    
    const totalUniqueViewers = viewerJoinTimes.size;
    const averageViewers = viewerDurations.length > 0
      ? viewerDurations.reduce((a, b) => a + b, 0) / viewerDurations.length / duration
      : 0;
    
    // Calculate engagement rate (comments per viewer per hour)
    const hours = duration / (60 * 60 * 1000);
    const engagementRate = totalUniqueViewers > 0 && hours > 0
      ? (commentCount / totalUniqueViewers / hours)
      : 0;
    
    return {
      duration,
      averageViewers: Math.round(averageViewers),
      peakViewers,
      totalUniqueViewers,
      engagementRate: Math.min(100, Math.round(engagementRate * 10)),
    };
  }

  /**
   * Get default stream settings
   */
  getDefaultStreamSettings(userLevel: number): {
    allowComments: boolean;
    commentCooldown: number;
    maxCommentLength: number;
    allowAnonymous: boolean;
    moderationLevel: 'none' | 'low' | 'medium' | 'high';
    allowEmotes: boolean;
    allowLinks: boolean;
  } {
    return {
      allowComments: true,
      commentCooldown: userLevel >= 5 ? 500 : StreamDomainService.DEFAULT_COMMENT_COOLDOWN,
      maxCommentLength: StreamDomainService.DEFAULT_MAX_COMMENT_LENGTH,
      allowAnonymous: userLevel >= 2,
      moderationLevel: userLevel >= 5 ? 'low' : 'medium',
      allowEmotes: userLevel >= 2,
      allowLinks: userLevel >= 10,
    };
  }

  /**
   * Validate stream settings
   */
  validateStreamSettings(settings: any): void {
    if (settings.commentCooldown !== undefined) {
      if (settings.commentCooldown < 0 || settings.commentCooldown > 60000) {
        throw new Error('Comment cooldown must be between 0 and 60 seconds');
      }
    }
    
    if (settings.maxCommentLength !== undefined) {
      if (settings.maxCommentLength < 1 || settings.maxCommentLength > 500) {
        throw new Error('Max comment length must be between 1 and 500');
      }
    }
    
    if (settings.moderationLevel !== undefined) {
      const validLevels = ['none', 'low', 'medium', 'high'];
      if (!validLevels.includes(settings.moderationLevel)) {
        throw new Error('Invalid moderation level');
      }
    }
  }

  /**
   * Check if stream title contains inappropriate content
   */
  isInappropriateTitle(title: string): boolean {
    const inappropriatePatterns = [
      /\b(scam|hack|cheat|exploit)\b/i,
      /\b(free\s+money|get\s+rich)\b/i,
      /\b(18\+|nsfw|adult)\b/i,
    ];
    
    return inappropriatePatterns.some(pattern => pattern.test(title));
  }

  /**
   * Calculate stream revenue share (for future monetization)
   */
  calculateRevenueShare(
    userLevel: number,
    viewerMinutes: number,
    subscriptionRevenue: number,
    donationRevenue: number,
  ): {
    creatorShare: number;
    platformShare: number;
    totalRevenue: number;
  } {
    // Higher level users get better revenue share
    const creatorPercentage = Math.min(70, 50 + (userLevel * 2));
    const platformPercentage = 100 - creatorPercentage;
    
    // Calculate ad revenue based on viewer minutes
    const adRevenue = viewerMinutes * 0.002; // $0.002 per viewer minute
    
    const totalRevenue = adRevenue + subscriptionRevenue + donationRevenue;
    const creatorShare = (totalRevenue * creatorPercentage) / 100;
    const platformShare = (totalRevenue * platformPercentage) / 100;
    
    return {
      creatorShare: Math.round(creatorShare * 100) / 100,
      platformShare: Math.round(platformShare * 100) / 100,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
    };
  }

  /**
   * Determine stream category based on title and tags
   */
  categorizeStream(title: string, tags: string[]): string {
    const categories = {
      gaming: ['game', 'gaming', 'play', 'stream', 'fps', 'rpg', 'mmo'],
      music: ['music', 'song', 'sing', 'concert', 'band', 'dj', 'remix'],
      art: ['art', 'draw', 'paint', 'design', 'create', 'sketch'],
      talk: ['talk', 'chat', 'discussion', 'podcast', 'interview'],
      education: ['tutorial', 'learn', 'teach', 'course', 'lesson', 'how to'],
      cooking: ['cook', 'food', 'recipe', 'bake', 'kitchen'],
      tech: ['code', 'programming', 'tech', 'software', 'development'],
    };
    
    const lowerTitle = title.toLowerCase();
    const lowerTags = tags.map(t => t.toLowerCase());
    
    for (const [category, keywords] of Object.entries(categories)) {
      const matchCount = keywords.filter(keyword => 
        lowerTitle.includes(keyword) || 
        lowerTags.some(tag => tag.includes(keyword))
      ).length;
      
      if (matchCount > 0) {
        return category;
      }
    }
    
    return 'general';
  }
}