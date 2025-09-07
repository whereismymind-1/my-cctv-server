"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const stream_schema_1 = require("../../infrastructure/database/entities/stream.schema");
const comment_schema_1 = require("../../infrastructure/database/entities/comment.schema");
const redis_service_1 = require("../../infrastructure/redis/redis.service");
let AnalyticsService = class AnalyticsService {
    constructor(streamRepository, commentRepository, redisService) {
        this.streamRepository = streamRepository;
        this.commentRepository = commentRepository;
        this.redisService = redisService;
        this.viewerEvents = new Map();
        this.streamMetrics = new Map();
        this.viewerSessions = new Map();
    }
    async trackViewerEvent(event) {
        const streamEvents = this.viewerEvents.get(event.streamId) || [];
        streamEvents.push(event);
        this.viewerEvents.set(event.streamId, streamEvents);
        switch (event.event) {
            case 'join':
                await this.handleViewerJoin(event);
                break;
            case 'leave':
                await this.handleViewerLeave(event);
                break;
            case 'comment':
                await this.handleComment(event);
                break;
        }
        await this.redisService.getClient().lpush(`analytics:events:${event.streamId}`, JSON.stringify(event));
        await this.redisService.getClient().expire(`analytics:events:${event.streamId}`, 86400);
    }
    async handleViewerJoin(event) {
        const streamId = event.streamId;
        const userId = event.userId || `anonymous_${Date.now()}`;
        if (!this.viewerSessions.has(streamId)) {
            this.viewerSessions.set(streamId, new Map());
        }
        this.viewerSessions.get(streamId).set(userId, event.timestamp);
        await this.redisService.addViewer(streamId, userId);
        const metrics = await this.getStreamMetrics(streamId);
        metrics.currentViewers = await this.redisService.getViewerCount(streamId);
        metrics.peakViewers = Math.max(metrics.peakViewers, metrics.currentViewers);
        this.streamMetrics.set(streamId, metrics);
    }
    async handleViewerLeave(event) {
        const streamId = event.streamId;
        const userId = event.userId || `anonymous_${Date.now()}`;
        const sessions = this.viewerSessions.get(streamId);
        if (sessions && sessions.has(userId)) {
            const joinTime = sessions.get(userId);
            const duration = event.timestamp.getTime() - joinTime.getTime();
            await this.redisService.getClient().lpush(`analytics:sessions:${streamId}`, JSON.stringify({
                userId,
                duration,
                joinTime,
                leaveTime: event.timestamp,
            }));
            sessions.delete(userId);
        }
        await this.redisService.removeViewer(streamId, userId);
        const metrics = await this.getStreamMetrics(streamId);
        metrics.currentViewers = await this.redisService.getViewerCount(streamId);
        this.streamMetrics.set(streamId, metrics);
    }
    async handleComment(event) {
        const streamId = event.streamId;
        const metrics = await this.getStreamMetrics(streamId);
        metrics.totalComments++;
        const timestamp = Math.floor(event.timestamp.getTime() / 10000) * 10;
        const moment = metrics.popularMoments.find(m => m.timestamp === timestamp);
        if (moment) {
            moment.commentCount++;
        }
        else {
            metrics.popularMoments.push({ timestamp, commentCount: 1 });
        }
        metrics.popularMoments.sort((a, b) => b.commentCount - a.commentCount);
        metrics.popularMoments = metrics.popularMoments.slice(0, 10);
        this.streamMetrics.set(streamId, metrics);
    }
    async getStreamMetrics(streamId) {
        if (!this.streamMetrics.has(streamId)) {
            const currentViewers = await this.redisService.getViewerCount(streamId);
            this.streamMetrics.set(streamId, {
                streamId,
                currentViewers,
                peakViewers: currentViewers,
                averageViewTime: 0,
                totalComments: 0,
                engagementRate: 0,
                viewerRetention: [],
                popularMoments: [],
            });
        }
        return this.streamMetrics.get(streamId);
    }
    calculateEngagementRate(viewerCount, commentCount, duration) {
        if (viewerCount === 0 || duration === 0)
            return 0;
        const commentsPerViewer = commentCount / viewerCount;
        const minutesDuration = duration / 60000;
        const engagementRate = (commentsPerViewer / minutesDuration) * 100;
        return Math.min(engagementRate, 100);
    }
    async getViewerAnalytics(userId) {
        const watchHistory = await this.redisService.getClient().lrange(`viewer:${userId}:history`, 0, -1);
        let totalWatchTime = 0;
        const streamCounts = new Map();
        const sessionDurations = [];
        const activeHours = new Array(24).fill(0);
        for (const entry of watchHistory) {
            const data = JSON.parse(entry);
            totalWatchTime += data.duration || 0;
            sessionDurations.push(data.duration || 0);
            const count = streamCounts.get(data.streamId) || 0;
            streamCounts.set(data.streamId, count + 1);
            const hour = new Date(data.timestamp).getHours();
            activeHours[hour]++;
        }
        const comments = await this.commentRepository.count({
            where: { userId },
        });
        const avgSessionDuration = sessionDurations.length > 0
            ? sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length
            : 0;
        const engagementScore = Math.min(100, (avgSessionDuration / 3600000) * 20 +
            (comments / 100) * 30 +
            (streamCounts.size / 10) * 50);
        const favoriteStreams = Array.from(streamCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([streamId]) => streamId);
        return {
            userId,
            totalWatchTime,
            favoriteStreams,
            averageSessionDuration: avgSessionDuration,
            commentFrequency: comments,
            activeHours,
            engagementScore: Math.round(engagementScore),
        };
    }
    async getPlatformAnalytics(startDate, endDate) {
        const now = new Date();
        const start = startDate || new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const end = endDate || now;
        const streams = await this.streamRepository.find({
            where: {
                createdAt: (0, typeorm_2.Between)(start, end),
            },
        });
        const totalStreams = streams.length;
        const totalViewers = new Set(streams.flatMap(s => this.viewerEvents.get(s.id) || [])
            .filter(e => e.userId)
            .map(e => e.userId)).size;
        const streamDurations = streams
            .filter(s => s.startedAt && s.endedAt)
            .map(s => s.endedAt.getTime() - s.startedAt.getTime());
        const averageStreamDuration = streamDurations.length > 0
            ? streamDurations.reduce((a, b) => a + b, 0) / streamDurations.length
            : 0;
        let peakConcurrentViewers = 0;
        for (const [, metrics] of this.streamMetrics) {
            peakConcurrentViewers = Math.max(peakConcurrentViewers, metrics.peakViewers);
        }
        const timeBasedMetrics = new Array(24).fill(null).map((_, hour) => {
            const hourStreams = streams.filter(s => {
                const streamHour = new Date(s.createdAt).getHours();
                return streamHour === hour;
            });
            return {
                hour,
                viewerCount: 0,
                streamCount: hourStreams.length,
            };
        });
        return {
            totalStreams,
            totalViewers,
            averageStreamDuration,
            peakConcurrentViewers,
            popularCategories: [],
            timeBasedMetrics,
        };
    }
    async getRealTimeDashboard() {
        const activeStreams = await this.streamRepository.count({
            where: { status: 'live' },
        });
        let totalViewers = 0;
        let totalComments = 0;
        const streamData = [];
        for (const [streamId, metrics] of this.streamMetrics) {
            if (metrics.currentViewers > 0) {
                totalViewers += metrics.currentViewers;
                totalComments += metrics.totalComments;
                const stream = await this.streamRepository.findOne({
                    where: { id: streamId },
                    relations: ['owner'],
                });
                if (stream && stream.status === 'live') {
                    streamData.push({
                        id: stream.id,
                        title: stream.title,
                        owner: stream.owner.username,
                        viewers: metrics.currentViewers,
                        peakViewers: metrics.peakViewers,
                        comments: metrics.totalComments,
                        engagementRate: this.calculateEngagementRate(metrics.currentViewers, metrics.totalComments, Date.now() - (stream.startedAt?.getTime() || Date.now())),
                    });
                }
            }
        }
        streamData.sort((a, b) => b.viewers - a.viewers);
        return {
            activeStreams,
            totalViewers,
            totalComments,
            averageEngagement: streamData.length > 0
                ? streamData.reduce((sum, s) => sum + s.engagementRate, 0) / streamData.length
                : 0,
            topStreams: streamData.slice(0, 10),
            timestamp: new Date(),
        };
    }
    async exportAnalytics(streamId, format = 'json') {
        const metrics = await this.getStreamMetrics(streamId);
        const events = this.viewerEvents.get(streamId) || [];
        const data = {
            streamId,
            metrics,
            events: events.map(e => ({
                ...e,
                timestamp: e.timestamp.toISOString(),
            })),
            exportedAt: new Date().toISOString(),
        };
        if (format === 'json') {
            return JSON.stringify(data, null, 2);
        }
        else {
            const csv = [
                'Event,User ID,Timestamp,Metadata',
                ...events.map(e => `${e.event},${e.userId || 'anonymous'},${e.timestamp.toISOString()},${JSON.stringify(e.metadata || {})}`),
            ].join('\n');
            return csv;
        }
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(stream_schema_1.StreamEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(comment_schema_1.CommentEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        redis_service_1.RedisService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map