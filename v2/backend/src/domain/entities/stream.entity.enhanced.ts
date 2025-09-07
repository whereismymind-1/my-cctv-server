import { StreamSettings } from '../value-objects/stream-settings.vo';
import { StreamStatus } from '../value-objects/stream-status.vo';
import { StreamKey } from '../value-objects/stream-key.vo';

/**
 * Enhanced Stream Domain Entity with Rich Business Logic
 * Follows DDD principles with encapsulated business rules
 */
export class StreamEntity {
  private static readonly MIN_TITLE_LENGTH = 1;
  private static readonly MAX_TITLE_LENGTH = 100;
  private static readonly MAX_DESCRIPTION_LENGTH = 500;
  private static readonly MAX_DURATION = 12 * 60 * 60 * 1000; // 12 hours
  private static readonly MIN_STREAM_INTERVAL = 5 * 60 * 1000; // 5 minutes

  constructor(
    public readonly id: string,
    public readonly ownerId: string,
    public readonly title: string,
    public readonly description: string | null,
    public readonly thumbnail: string | null,
    public readonly streamKey: StreamKey,
    public readonly settings: StreamSettings,
    private _status: StreamStatus,
    private _viewerCount: number,
    private _peakViewers: number,
    private _totalComments: number,
    public readonly createdAt: Date,
    private _startedAt: Date | null,
    private _endedAt: Date | null,
    private _lastActivityAt: Date,
    private readonly ownerLevel: number = 1,
  ) {
    this.validateInvariants();
  }

  /**
   * Domain Invariants - Business rules that must always be true
   */
  private validateInvariants(): void {
    // Title validation
    if (!this.title || this.title.trim().length === 0) {
      throw new Error('Stream title cannot be empty');
    }
    
    if (this.title.length < StreamEntity.MIN_TITLE_LENGTH) {
      throw new Error(`Stream title must be at least ${StreamEntity.MIN_TITLE_LENGTH} character`);
    }
    
    if (this.title.length > StreamEntity.MAX_TITLE_LENGTH) {
      throw new Error(`Stream title cannot exceed ${StreamEntity.MAX_TITLE_LENGTH} characters`);
    }
    
    // Description validation
    if (this.description && this.description.length > StreamEntity.MAX_DESCRIPTION_LENGTH) {
      throw new Error(`Stream description cannot exceed ${StreamEntity.MAX_DESCRIPTION_LENGTH} characters`);
    }
    
    // Viewer count validation
    if (this._viewerCount < 0) {
      throw new Error('Viewer count cannot be negative');
    }
    
    if (this._peakViewers < this._viewerCount) {
      throw new Error('Peak viewers cannot be less than current viewers');
    }
    
    // Status transitions validation
    this.validateStatusTransition();
  }

  /**
   * Business Rule: Validate status transitions
   */
  private validateStatusTransition(): void {
    if (this._status === StreamStatus.ENDED && !this._endedAt) {
      throw new Error('Ended stream must have end time');
    }
    
    if (this._status === StreamStatus.LIVE && !this._startedAt) {
      throw new Error('Live stream must have start time');
    }
    
    if (this._endedAt && this._startedAt && this._endedAt < this._startedAt) {
      throw new Error('Stream cannot end before it starts');
    }
  }

  /**
   * Domain Logic: Start the stream
   */
  start(): void {
    if (this._status !== StreamStatus.WAITING) {
      throw new Error(`Cannot start stream in ${this._status} status`);
    }
    
    this._status = StreamStatus.LIVE;
    this._startedAt = new Date();
    this._lastActivityAt = new Date();
  }

  /**
   * Domain Logic: End the stream
   */
  end(): { duration: number; avgViewers: number; engagement: number } {
    if (this._status !== StreamStatus.LIVE) {
      throw new Error(`Cannot end stream in ${this._status} status`);
    }
    
    this._status = StreamStatus.ENDED;
    this._endedAt = new Date();
    
    const duration = this._endedAt.getTime() - (this._startedAt?.getTime() || 0);
    const avgViewers = this.calculateAverageViewers();
    const engagement = this.calculateEngagement();
    
    return { duration, avgViewers, engagement };
  }

  /**
   * Domain Logic: Add viewer
   */
  addViewer(): void {
    if (this._status !== StreamStatus.LIVE) {
      throw new Error('Cannot add viewer to non-live stream');
    }
    
    if (this._viewerCount >= this.getMaxViewers()) {
      throw new Error('Stream has reached maximum viewer capacity');
    }
    
    this._viewerCount++;
    this._peakViewers = Math.max(this._peakViewers, this._viewerCount);
    this._lastActivityAt = new Date();
  }

  /**
   * Domain Logic: Remove viewer
   */
  removeViewer(): void {
    if (this._viewerCount > 0) {
      this._viewerCount--;
      this._lastActivityAt = new Date();
    }
  }

  /**
   * Domain Logic: Add comment
   */
  addComment(): void {
    if (!this.settings.allowComments) {
      throw new Error('Comments are disabled for this stream');
    }
    
    if (this._status !== StreamStatus.LIVE) {
      throw new Error('Cannot add comment to non-live stream');
    }
    
    this._totalComments++;
    this._lastActivityAt = new Date();
  }

  /**
   * Business Logic: Get maximum viewers based on owner level
   */
  private getMaxViewers(): number {
    if (this.ownerLevel >= 10) return 10000;
    if (this.ownerLevel >= 5) return 5000;
    if (this.ownerLevel >= 2) return 1000;
    return 100;
  }

  /**
   * Business Logic: Calculate average viewers
   */
  private calculateAverageViewers(): number {
    // Simplified calculation - in real system would track viewer history
    return Math.round(this._peakViewers * 0.6);
  }

  /**
   * Business Logic: Calculate engagement score
   */
  private calculateEngagement(): number {
    if (this._peakViewers === 0) return 0;
    
    const duration = this.getDuration();
    if (duration === 0) return 0;
    
    const commentsPerViewer = this._totalComments / this._peakViewers;
    const commentsPerMinute = this._totalComments / (duration / 60000);
    
    // Engagement score: 0-100
    const score = Math.min(100, (commentsPerViewer * 20) + (commentsPerMinute * 10));
    return Math.round(score);
  }

  /**
   * Domain Logic: Check if stream should auto-end
   */
  shouldAutoEnd(): boolean {
    if (this._status !== StreamStatus.LIVE) return false;
    
    const now = Date.now();
    const duration = now - (this._startedAt?.getTime() || 0);
    const inactivity = now - this._lastActivityAt.getTime();
    
    // End if exceeded max duration
    if (duration > StreamEntity.MAX_DURATION) return true;
    
    // End if no viewers for 10 minutes
    if (this._viewerCount === 0 && inactivity > 10 * 60 * 1000) return true;
    
    // End if no activity for 30 minutes
    if (inactivity > 30 * 60 * 1000) return true;
    
    return false;
  }

  /**
   * Domain Logic: Check if can start new stream
   */
  static canCreateNewStream(
    lastStreamEndedAt: Date | null,
    activeStreamCount: number,
    userLevel: number,
  ): { allowed: boolean; reason?: string } {
    // Level 0 users cannot stream
    if (userLevel === 0) {
      return { allowed: false, reason: 'Insufficient user level' };
    }
    
    // Check concurrent stream limit
    if (activeStreamCount >= 1) {
      return { allowed: false, reason: 'Already have an active stream' };
    }
    
    // Check minimum interval between streams
    if (lastStreamEndedAt) {
      const timeSince = Date.now() - lastStreamEndedAt.getTime();
      if (timeSince < StreamEntity.MIN_STREAM_INTERVAL) {
        const waitTime = Math.ceil((StreamEntity.MIN_STREAM_INTERVAL - timeSince) / 60000);
        return { allowed: false, reason: `Please wait ${waitTime} more minutes` };
      }
    }
    
    return { allowed: true };
  }

  /**
   * Domain Logic: Calculate stream quality
   */
  getStreamQuality(): 'excellent' | 'good' | 'fair' | 'poor' {
    const engagement = this.calculateEngagement();
    const viewerRetention = this._viewerCount / Math.max(this._peakViewers, 1);
    
    if (engagement > 70 && viewerRetention > 0.8) return 'excellent';
    if (engagement > 40 && viewerRetention > 0.6) return 'good';
    if (engagement > 20 && viewerRetention > 0.4) return 'fair';
    return 'poor';
  }

  /**
   * Domain Logic: Get stream metrics
   */
  getMetrics(): {
    duration: number;
    viewerCount: number;
    peakViewers: number;
    totalComments: number;
    engagement: number;
    quality: string;
    avgViewers: number;
  } {
    return {
      duration: this.getDuration(),
      viewerCount: this._viewerCount,
      peakViewers: this._peakViewers,
      totalComments: this._totalComments,
      engagement: this.calculateEngagement(),
      quality: this.getStreamQuality(),
      avgViewers: this.calculateAverageViewers(),
    };
  }

  /**
   * Domain Logic: Check if stream is inappropriate
   */
  hasInappropriateContent(): boolean {
    const inappropriatePatterns = [
      /\b(scam|hack|cheat|exploit)\b/i,
      /\b(free\s+money|get\s+rich)\b/i,
      /\b(18\+|nsfw|adult)\b/i,
    ];
    
    const titleCheck = inappropriatePatterns.some(pattern => pattern.test(this.title));
    const descCheck = this.description ? 
      inappropriatePatterns.some(pattern => pattern.test(this.description!)) : false;
    
    return titleCheck || descCheck;
  }

  /**
   * Domain Logic: Update settings with validation
   */
  updateSettings(newSettings: Partial<StreamSettings>): void {
    if (this._status === StreamStatus.ENDED) {
      throw new Error('Cannot update settings for ended stream');
    }
    
    // Merge and validate new settings
    this.settings.update(newSettings, this.ownerLevel);
  }

  /**
   * Domain Logic: Check if user can moderate
   */
  canUserModerate(userId: string, userLevel: number): boolean {
    // Owner can always moderate
    if (userId === this.ownerId) return true;
    
    // Moderators need higher level than stream owner
    return userLevel > this.ownerLevel && userLevel >= 3;
  }

  /**
   * Helper: Get duration
   */
  private getDuration(): number {
    if (!this._startedAt) return 0;
    const endTime = this._endedAt || new Date();
    return endTime.getTime() - this._startedAt.getTime();
  }

  /**
   * Factory Method: Create new stream
   */
  static create(
    ownerId: string,
    ownerLevel: number,
    title: string,
    description: string | null,
    thumbnail: string | null,
  ): StreamEntity {
    const id = this.generateId();
    const streamKey = StreamKey.generate();
    const settings = StreamSettings.createDefault(ownerLevel);
    
    return new StreamEntity(
      id,
      ownerId,
      title,
      description,
      thumbnail,
      streamKey,
      settings,
      StreamStatus.WAITING,
      0, // viewerCount
      0, // peakViewers
      0, // totalComments
      new Date(),
      null, // startedAt
      null, // endedAt
      new Date(), // lastActivityAt
      ownerLevel,
    );
  }

  /**
   * Generate unique ID
   */
  private static generateId(): string {
    return `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Getters
  get status(): StreamStatus { return this._status; }
  get viewerCount(): number { return this._viewerCount; }
  get peakViewers(): number { return this._peakViewers; }
  get totalComments(): number { return this._totalComments; }
  get startedAt(): Date | null { return this._startedAt; }
  get endedAt(): Date | null { return this._endedAt; }
  get lastActivityAt(): Date { return this._lastActivityAt; }
  get isLive(): boolean { return this._status === StreamStatus.LIVE; }
  get isEnded(): boolean { return this._status === StreamStatus.ENDED; }
}