import { AnalyticsService } from '../../application/services/analytics.service';
interface TrackEventDto {
    streamId: string;
    event: 'join' | 'leave' | 'comment' | 'reaction';
    metadata?: any;
}
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    trackEvent(user: any, dto: TrackEventDto): Promise<void>;
    getStreamAnalytics(streamId: string): Promise<{
        success: boolean;
        data: import("../../application/services/analytics.service").StreamMetrics;
    }>;
    getViewerAnalytics(userId: string, user: any): Promise<{
        success: boolean;
        data: import("../../application/services/analytics.service").ViewerAnalytics;
    }>;
    getPlatformAnalytics(startDate?: string, endDate?: string): Promise<{
        success: boolean;
        data: import("../../application/services/analytics.service").PlatformAnalytics;
    }>;
    getDashboard(): Promise<{
        success: boolean;
        data: any;
    }>;
    exportAnalytics(streamId: string, format: "json" | "csv" | undefined, user: any): Promise<{
        success: boolean;
        data: string;
        format: "json" | "csv";
        filename: string;
    }>;
}
export {};
