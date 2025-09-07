import { Repository } from 'typeorm';
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
export declare class AnalyticsServiceRefactored {
    private streamRepository;
    private commentRepository;
    private redisClient;
    private static readonly EVENTS_PREFIX;
    private static readonly METRICS_PREFIX;
    private static readonly SESSIONS_PREFIX;
    private static readonly VIEWER_PREFIX;
    constructor(streamRepository: Repository<StreamEntity>, commentRepository: Repository<CommentEntity>, redisClient: RedisClientService);
    trackViewerEvent(event: ViewerEvent): Promise<void>;
    private handleViewerJoin;
    private handleViewerLeave;
    private handleComment;
    private updateStreamMetrics;
    getStreamMetrics(streamId: string): Promise<StreamMetrics>;
    getViewerAnalytics(userId: string): Promise<ViewerAnalytics>;
    getRealTimeDashboard(): Promise<any>;
}
