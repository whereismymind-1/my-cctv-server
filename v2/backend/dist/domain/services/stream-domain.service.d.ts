export declare class StreamDomainService {
    private static readonly MIN_TITLE_LENGTH;
    private static readonly MAX_TITLE_LENGTH;
    private static readonly MAX_DESCRIPTION_LENGTH;
    private static readonly MAX_CONCURRENT_STREAMS_PER_USER;
    private static readonly MAX_STREAM_DURATION;
    private static readonly MIN_STREAM_INTERVAL;
    private static readonly DEFAULT_VIEWER_LIMIT;
    private static readonly DEFAULT_COMMENT_COOLDOWN;
    private static readonly DEFAULT_MAX_COMMENT_LENGTH;
    validateTitle(title: string): void;
    validateDescription(description: string | null): void;
    canCreateStream(userLevel: number, activeStreamCount: number, lastStreamEndedAt: Date | null): boolean;
    getStreamQualitySettings(userLevel: number): {
        maxBitrate: number;
        maxResolution: string;
        maxFps: number;
        allowTranscoding: boolean;
    };
    getViewerLimit(userLevel: number): number;
    generateStreamKey(): string;
    calculateStreamHealth(droppedFrames: number, totalFrames: number, bitrate: number, targetBitrate: number, rtt: number): 'excellent' | 'good' | 'fair' | 'poor';
    shouldAutoEndStream(startedAt: Date, lastActivityAt: Date, viewerCount: number): boolean;
    calculateStreamStats(startedAt: Date, endedAt: Date | null, viewerEvents: Array<{
        type: 'join' | 'leave';
        timestamp: Date;
    }>, commentCount: number): {
        duration: number;
        averageViewers: number;
        peakViewers: number;
        totalUniqueViewers: number;
        engagementRate: number;
    };
    getDefaultStreamSettings(userLevel: number): {
        allowComments: boolean;
        commentCooldown: number;
        maxCommentLength: number;
        allowAnonymous: boolean;
        moderationLevel: 'none' | 'low' | 'medium' | 'high';
        allowEmotes: boolean;
        allowLinks: boolean;
    };
    validateStreamSettings(settings: any): void;
    isInappropriateTitle(title: string): boolean;
    calculateRevenueShare(userLevel: number, viewerMinutes: number, subscriptionRevenue: number, donationRevenue: number): {
        creatorShare: number;
        platformShare: number;
        totalRevenue: number;
    };
    categorizeStream(title: string, tags: string[]): string;
}
