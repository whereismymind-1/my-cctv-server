import { Repository } from 'typeorm';
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
export declare class AnalyticsService {
    private streamRepository;
    private commentRepository;
    private redisService;
    private viewerEvents;
    private streamMetrics;
    private viewerSessions;
    constructor(streamRepository: Repository<StreamEntity>, commentRepository: Repository<CommentEntity>, redisService: RedisService);
    trackViewerEvent(event: ViewerEvent): Promise<void>;
    private handleViewerJoin;
    private handleViewerLeave;
    private handleComment;
    getStreamMetrics(streamId: string): Promise<StreamMetrics>;
    private calculateEngagementRate;
    getViewerAnalytics(userId: string): Promise<ViewerAnalytics>;
    getPlatformAnalytics(startDate?: Date, endDate?: Date): Promise<PlatformAnalytics>;
    getRealTimeDashboard(): Promise<any>;
    exportAnalytics(streamId: string, format?: 'json' | 'csv'): Promise<string>;
}
