export type StreamStatus = 'waiting' | 'live' | 'ended';

export interface StreamSettings {
  allowComments: boolean;
  commentCooldown: number;
  maxCommentLength: number;
  allowAnonymous: boolean;
}

export class Stream {
  constructor(
    public readonly id: string,
    public readonly ownerId: string,
    public title: string,
    public description: string | null,
    public thumbnailUrl: string | null,
    public readonly streamKey: string,
    public status: StreamStatus,
    public viewerCount: number,
    public maxViewers: number,
    public settings: StreamSettings,
    public startedAt: Date | null,
    public endedAt: Date | null,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}

  static create(
    ownerId: string,
    title: string,
    description?: string,
    settings?: Partial<StreamSettings>,
  ): Stream {
    const now = new Date();
    const defaultSettings: StreamSettings = {
      allowComments: true,
      commentCooldown: 1000,
      maxCommentLength: 200,
      allowAnonymous: false,
      ...settings,
    };

    return new Stream(
      '', // ID will be generated
      ownerId,
      title,
      description || null,
      null,
      Stream.generateStreamKey(),
      'waiting',
      0,
      0,
      defaultSettings,
      null,
      null,
      now,
      now,
    );
  }

  private static generateStreamKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = '';
    for (let i = 0; i < 32; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  }

  start(): void {
    if (this.status !== 'waiting') {
      throw new Error('Stream can only be started from waiting status');
    }
    this.status = 'live';
    this.startedAt = new Date();
    this.updatedAt = new Date();
  }

  end(): void {
    if (this.status !== 'live') {
      throw new Error('Only live streams can be ended');
    }
    this.status = 'ended';
    this.endedAt = new Date();
    this.updatedAt = new Date();
  }

  updateViewerCount(count: number): void {
    this.viewerCount = count;
    if (count > this.maxViewers) {
      this.maxViewers = count;
    }
    this.updatedAt = new Date();
  }

  updateSettings(settings: Partial<StreamSettings>): void {
    this.settings = { ...this.settings, ...settings };
    this.updatedAt = new Date();
  }

  canUserComment(userId: string | null): boolean {
    if (!this.settings.allowComments) return false;
    if (!userId && !this.settings.allowAnonymous) return false;
    if (this.status !== 'live') return false;
    return true;
  }
}