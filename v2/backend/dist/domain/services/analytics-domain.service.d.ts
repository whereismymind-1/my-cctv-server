export declare class AnalyticsDomainService {
    private static readonly ENGAGEMENT_THRESHOLD;
    private static readonly RETENTION_BUCKETS;
    calculateEngagementScore(viewDuration: number, streamDuration: number, commentCount: number, reactionCount: number): number;
    getEngagementLevel(score: number): 'low' | 'medium' | 'high' | 'very_high';
    calculateRetentionCurve(viewerSessions: Array<{
        joinTime: number;
        leaveTime: number;
    }>, streamStartTime: number, streamEndTime: number): Array<{
        timestamp: number;
        viewerCount: number;
        percentage: number;
    }>;
    identifyPeakMoments(events: Array<{
        timestamp: number;
        type: string;
        value?: number;
    }>, windowSize?: number): Array<{
        timestamp: number;
        intensity: number;
        type: string;
    }>;
    private calculateMomentIntensity;
    private determineMomentType;
    calculatePerformanceScore(viewerCount: number, expectedViewers: number, engagementRate: number, streamDuration: number, targetDuration: number): number;
    predictViewerCount(dayOfWeek: number, hourOfDay: number, category: string, streamerLevel: number, historicalAverages: Map<string, number>): number;
    calculateChurnRisk(lastViewDate: Date, totalWatchTime: number, averageSessionDuration: number, favoriteStreamCount: number, daysSinceRegistration: number): 'low' | 'medium' | 'high';
    calculateRecommendationScore(viewerPreferences: {
        category: string;
        weight: number;
    }[], streamCategory: string, streamTags: string[], viewerWatchHistory: string[], popularityScore: number): number;
    groupByTimePeriod<T extends {
        timestamp: Date;
    }>(data: T[], period: 'hour' | 'day' | 'week' | 'month'): Map<string, T[]>;
    private getTimePeriodKey;
    calculateGrowthRate(currentValue: number, previousValue: number): {
        rate: number;
        trend: 'up' | 'down' | 'stable';
    };
    calculatePercentileRank(value: number, allValues: number[]): number;
}
