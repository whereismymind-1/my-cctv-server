export declare enum StreamStatus {
    WAITING = "waiting",
    LIVE = "live",
    ENDED = "ended"
}
export declare class StreamSettingsDto {
    allowComments?: boolean;
    commentCooldown?: number;
    maxCommentLength?: number;
    allowAnonymous?: boolean;
}
export declare class CreateStreamDto {
    title: string;
    description?: string;
    thumbnail?: string;
    settings?: StreamSettingsDto;
}
export declare class UpdateStreamDto {
    title?: string;
    description?: string;
    thumbnail?: string;
    settings?: StreamSettingsDto;
}
export declare class StreamQueryDto {
    status?: StreamStatus;
    page?: number;
    limit?: number;
    search?: string;
}
export declare class StreamResponseDto {
    id: string;
    title: string;
    description?: string;
    thumbnail?: string;
    owner: {
        id: string;
        username: string;
        avatar?: string;
    };
    viewerCount: number;
    status: StreamStatus;
    settings?: {
        allowComments: boolean;
        commentCooldown: number;
        maxCommentLength: number;
        allowAnonymous: boolean;
    };
    streamKey?: string;
    streamUrl?: string;
    createdAt: Date;
    startedAt?: Date;
    endedAt?: Date;
}
