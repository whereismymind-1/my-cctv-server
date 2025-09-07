export type StreamStatus = 'waiting' | 'live' | 'ended';
export interface StreamSettings {
    allowComments: boolean;
    commentCooldown: number;
    maxCommentLength: number;
    allowAnonymous: boolean;
}
export declare class Stream {
    readonly id: string;
    readonly ownerId: string;
    title: string;
    description: string | null;
    thumbnailUrl: string | null;
    readonly streamKey: string;
    status: StreamStatus;
    viewerCount: number;
    maxViewers: number;
    settings: StreamSettings;
    startedAt: Date | null;
    endedAt: Date | null;
    readonly createdAt: Date;
    updatedAt: Date;
    constructor(id: string, ownerId: string, title: string, description: string | null, thumbnailUrl: string | null, streamKey: string, status: StreamStatus, viewerCount: number, maxViewers: number, settings: StreamSettings, startedAt: Date | null, endedAt: Date | null, createdAt: Date, updatedAt: Date);
    static create(ownerId: string, title: string, description?: string, settings?: Partial<StreamSettings>): Stream;
    private static generateStreamKey;
    start(): void;
    end(): void;
    updateViewerCount(count: number): void;
    updateSettings(settings: Partial<StreamSettings>): void;
    canUserComment(userId: string | null): boolean;
}
