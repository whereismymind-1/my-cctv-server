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
var AnalyticsServiceRefactored_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsServiceRefactored = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const stream_schema_1 = require("../../infrastructure/database/entities/stream.schema");
const comment_schema_1 = require("../../infrastructure/database/entities/comment.schema");
const redis_client_service_1 = require("../../infrastructure/redis/redis-client.service");
let AnalyticsServiceRefactored = AnalyticsServiceRefactored_1 = class AnalyticsServiceRefactored {
    constructor(streamRepository, commentRepository, redisClient) {
        this.streamRepository = streamRepository;
        this.commentRepository = commentRepository;
        this.redisClient = redisClient;
    }
    async trackViewerEvent(event) {
        const eventKey = `${AnalyticsServiceRefactored_1.EVENTS_PREFIX}${event.streamId}`;
        await this.redisClient.lpush(eventKey, JSON.stringify(event));
        await this.redisClient.expire(eventKey, 86400);
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
    }
    async handleViewerJoin(event) {
        const streamId = event.streamId;
        const userId = event.userId || `anonymous_${Date.now()}`;
        const sessionKey = `${AnalyticsServiceRefactored_1.SESSIONS_PREFIX}${streamId}:${userId}`;
        await this.redisClient.set(sessionKey, event.timestamp.toISOString(), 86400);
        await this.redisClient.sadd(`stream:${streamId}:viewers`, userId);
        await this.updateStreamMetrics(streamId, 'join');
    }
    async handleViewerLeave(event) {
        const streamId = event.streamId;
        const userId = event.userId || `anonymous_${Date.now()}`;
        const sessionKey = `${AnalyticsServiceRefactored_1.SESSIONS_PREFIX}${streamId}:${userId}`;
        const joinTimeStr = await this.redisClient.get(sessionKey);
        if (joinTimeStr) {
            const joinTime = new Date(joinTimeStr);
            const duration = event.timestamp.getTime() - joinTime.getTime();
            const sessionData = {
                userId,
                duration,
                joinTime: joinTimeStr,
                leaveTime: event.timestamp.toISOString(),
            };
            await this.redisClient.lpush(`${AnalyticsServiceRefactored_1.SESSIONS_PREFIX}${streamId}:history`, JSON.stringify(sessionData));
            await this.redisClient.del(sessionKey);
        }
        await this.redisClient.srem(`stream:${streamId}:viewers`, userId);
        await this.updateStreamMetrics(streamId, 'leave');
    }
    async handleComment(event) {
        const streamId = event.streamId;
        await this.redisClient.incr(`stream:${streamId}:comments`);
        const timestamp = Math.floor(event.timestamp.getTime() / 10000) * 10;
        const momentKey = `stream:${streamId}:moments:${timestamp}`;
        await this.redisClient.incr(momentKey);
        await this.redisClient.expire(momentKey, 3600);
        await this.updateStreamMetrics(streamId, 'comment');
    }
    async updateStreamMetrics(streamId, action) {
        const metricsKey = `${AnalyticsServiceRefactored_1.METRICS_PREFIX}${streamId}`;
        const viewerCount = await this.redisClient.scard(`stream:${streamId}:viewers`);
        const metricsStr = await this.redisClient.get(metricsKey);
        let metrics;
        if (metricsStr) {
            metrics = JSON.parse(metricsStr);
        }
        else {
            metrics = {
                streamId,
                currentViewers: 0,
                peakViewers: 0,
                averageViewTime: 0,
                totalComments: 0,
                engagementRate: 0,
                viewerRetention: [],
                popularMoments: [],
            };
        }
        metrics.currentViewers = viewerCount;
        metrics.peakViewers = Math.max(metrics.peakViewers, viewerCount);
        if (action === 'comment') {
            const commentCount = await this.redisClient.get(`stream:${streamId}:comments`);
            metrics.totalComments = parseInt(commentCount || '0', 10);
        }
        await this.redisClient.set(metricsKey, JSON.stringify(metrics), 3600);
    }
    async getStreamMetrics(streamId) {
        const metricsKey = `${AnalyticsServiceRefactored_1.METRICS_PREFIX}${streamId}`;
        const metricsStr = await this.redisClient.get(metricsKey);
        if (metricsStr) {
            return JSON.parse(metricsStr);
        }
        const currentViewers = await this.redisClient.scard(`stream:${streamId}:viewers`);
        return {
            streamId,
            currentViewers,
            peakViewers: currentViewers,
            averageViewTime: 0,
            totalComments: 0,
            engagementRate: 0,
            viewerRetention: [],
            popularMoments: [],
        };
    }
    async getViewerAnalytics(userId) {
        const historyKey = `${AnalyticsServiceRefactored_1.VIEWER_PREFIX}${userId}:history`;
        const watchHistory = await this.redisClient.lrange(historyKey, 0, -1);
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
    async getRealTimeDashboard() {
        const activeStreams = await this.streamRepository.count({
            where: { status: 'live' },
        });
        const keys = await this.redisClient.getClient().keys(`${AnalyticsServiceRefactored_1.METRICS_PREFIX}*`);
        let totalViewers = 0;
        let totalComments = 0;
        const streamData = [];
        for (const key of keys) {
            const metricsStr = await this.redisClient.get(key);
            if (metricsStr) {
                const metrics = JSON.parse(metricsStr);
                if (metrics.currentViewers > 0) {
                    totalViewers += metrics.currentViewers;
                    totalComments += metrics.totalComments;
                    const streamId = metrics.streamId;
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
                            engagementRate: metrics.engagementRate,
                        });
                    }
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
};
exports.AnalyticsServiceRefactored = AnalyticsServiceRefactored;
AnalyticsServiceRefactored.EVENTS_PREFIX = 'analytics:events:';
AnalyticsServiceRefactored.METRICS_PREFIX = 'analytics:metrics:';
AnalyticsServiceRefactored.SESSIONS_PREFIX = 'analytics:sessions:';
AnalyticsServiceRefactored.VIEWER_PREFIX = 'viewer:';
exports.AnalyticsServiceRefactored = AnalyticsServiceRefactored = AnalyticsServiceRefactored_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(stream_schema_1.StreamEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(comment_schema_1.CommentEntity)),
    __param(2, (0, common_1.Inject)('REDIS_CLIENT')),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        redis_client_service_1.RedisClientService])
], AnalyticsServiceRefactored);
//# sourceMappingURL=analytics.service.refactored.js.map