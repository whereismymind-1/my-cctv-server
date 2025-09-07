"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var StreamDomainService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamDomainService = void 0;
const common_1 = require("@nestjs/common");
let StreamDomainService = StreamDomainService_1 = class StreamDomainService {
    validateTitle(title) {
        if (!title || title.trim().length === 0) {
            throw new Error('Stream title cannot be empty');
        }
        if (title.length < StreamDomainService_1.MIN_TITLE_LENGTH) {
            throw new Error(`Stream title must be at least ${StreamDomainService_1.MIN_TITLE_LENGTH} character`);
        }
        if (title.length > StreamDomainService_1.MAX_TITLE_LENGTH) {
            throw new Error(`Stream title cannot exceed ${StreamDomainService_1.MAX_TITLE_LENGTH} characters`);
        }
    }
    validateDescription(description) {
        if (description && description.length > StreamDomainService_1.MAX_DESCRIPTION_LENGTH) {
            throw new Error(`Stream description cannot exceed ${StreamDomainService_1.MAX_DESCRIPTION_LENGTH} characters`);
        }
    }
    canCreateStream(userLevel, activeStreamCount, lastStreamEndedAt) {
        if (activeStreamCount >= StreamDomainService_1.MAX_CONCURRENT_STREAMS_PER_USER) {
            return false;
        }
        if (lastStreamEndedAt) {
            const timeSinceLastStream = Date.now() - lastStreamEndedAt.getTime();
            if (timeSinceLastStream < StreamDomainService_1.MIN_STREAM_INTERVAL) {
                return false;
            }
        }
        if (userLevel === 0) {
            return false;
        }
        return true;
    }
    getStreamQualitySettings(userLevel) {
        if (userLevel >= 10) {
            return {
                maxBitrate: 8000,
                maxResolution: '1920x1080',
                maxFps: 60,
                allowTranscoding: true,
            };
        }
        if (userLevel >= 5) {
            return {
                maxBitrate: 4500,
                maxResolution: '1280x720',
                maxFps: 60,
                allowTranscoding: true,
            };
        }
        if (userLevel >= 2) {
            return {
                maxBitrate: 2500,
                maxResolution: '1280x720',
                maxFps: 30,
                allowTranscoding: false,
            };
        }
        return {
            maxBitrate: 1500,
            maxResolution: '854x480',
            maxFps: 30,
            allowTranscoding: false,
        };
    }
    getViewerLimit(userLevel) {
        if (userLevel >= 10) {
            return StreamDomainService_1.DEFAULT_VIEWER_LIMIT;
        }
        if (userLevel >= 5) {
            return 5000;
        }
        if (userLevel >= 2) {
            return 1000;
        }
        return 100;
    }
    generateStreamKey() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let key = 'live_';
        for (let i = 0; i < 32; i++) {
            key += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return key;
    }
    calculateStreamHealth(droppedFrames, totalFrames, bitrate, targetBitrate, rtt) {
        const frameDropRate = totalFrames > 0 ? droppedFrames / totalFrames : 0;
        const bitrateStability = targetBitrate > 0 ? bitrate / targetBitrate : 0;
        if (frameDropRate < 0.01 && bitrateStability > 0.95 && rtt < 50) {
            return 'excellent';
        }
        if (frameDropRate < 0.03 && bitrateStability > 0.85 && rtt < 100) {
            return 'good';
        }
        if (frameDropRate < 0.05 && bitrateStability > 0.70 && rtt < 200) {
            return 'fair';
        }
        return 'poor';
    }
    shouldAutoEndStream(startedAt, lastActivityAt, viewerCount) {
        const now = Date.now();
        const streamDuration = now - startedAt.getTime();
        const inactivityDuration = now - lastActivityAt.getTime();
        if (streamDuration > StreamDomainService_1.MAX_STREAM_DURATION) {
            return true;
        }
        if (viewerCount === 0 && inactivityDuration > 10 * 60 * 1000) {
            return true;
        }
        if (inactivityDuration > 30 * 60 * 1000) {
            return true;
        }
        return false;
    }
    calculateStreamStats(startedAt, endedAt, viewerEvents, commentCount) {
        const duration = endedAt
            ? endedAt.getTime() - startedAt.getTime()
            : Date.now() - startedAt.getTime();
        let currentViewers = 0;
        let peakViewers = 0;
        const viewerDurations = [];
        const viewerJoinTimes = new Map();
        for (const event of viewerEvents) {
            if (event.type === 'join') {
                currentViewers++;
                peakViewers = Math.max(peakViewers, currentViewers);
            }
            else {
                currentViewers = Math.max(0, currentViewers - 1);
            }
        }
        const totalUniqueViewers = viewerJoinTimes.size;
        const averageViewers = viewerDurations.length > 0
            ? viewerDurations.reduce((a, b) => a + b, 0) / viewerDurations.length / duration
            : 0;
        const hours = duration / (60 * 60 * 1000);
        const engagementRate = totalUniqueViewers > 0 && hours > 0
            ? (commentCount / totalUniqueViewers / hours)
            : 0;
        return {
            duration,
            averageViewers: Math.round(averageViewers),
            peakViewers,
            totalUniqueViewers,
            engagementRate: Math.min(100, Math.round(engagementRate * 10)),
        };
    }
    getDefaultStreamSettings(userLevel) {
        return {
            allowComments: true,
            commentCooldown: userLevel >= 5 ? 500 : StreamDomainService_1.DEFAULT_COMMENT_COOLDOWN,
            maxCommentLength: StreamDomainService_1.DEFAULT_MAX_COMMENT_LENGTH,
            allowAnonymous: userLevel >= 2,
            moderationLevel: userLevel >= 5 ? 'low' : 'medium',
            allowEmotes: userLevel >= 2,
            allowLinks: userLevel >= 10,
        };
    }
    validateStreamSettings(settings) {
        if (settings.commentCooldown !== undefined) {
            if (settings.commentCooldown < 0 || settings.commentCooldown > 60000) {
                throw new Error('Comment cooldown must be between 0 and 60 seconds');
            }
        }
        if (settings.maxCommentLength !== undefined) {
            if (settings.maxCommentLength < 1 || settings.maxCommentLength > 500) {
                throw new Error('Max comment length must be between 1 and 500');
            }
        }
        if (settings.moderationLevel !== undefined) {
            const validLevels = ['none', 'low', 'medium', 'high'];
            if (!validLevels.includes(settings.moderationLevel)) {
                throw new Error('Invalid moderation level');
            }
        }
    }
    isInappropriateTitle(title) {
        const inappropriatePatterns = [
            /\b(scam|hack|cheat|exploit)\b/i,
            /\b(free\s+money|get\s+rich)\b/i,
            /\b(18\+|nsfw|adult)\b/i,
        ];
        return inappropriatePatterns.some(pattern => pattern.test(title));
    }
    calculateRevenueShare(userLevel, viewerMinutes, subscriptionRevenue, donationRevenue) {
        const creatorPercentage = Math.min(70, 50 + (userLevel * 2));
        const platformPercentage = 100 - creatorPercentage;
        const adRevenue = viewerMinutes * 0.002;
        const totalRevenue = adRevenue + subscriptionRevenue + donationRevenue;
        const creatorShare = (totalRevenue * creatorPercentage) / 100;
        const platformShare = (totalRevenue * platformPercentage) / 100;
        return {
            creatorShare: Math.round(creatorShare * 100) / 100,
            platformShare: Math.round(platformShare * 100) / 100,
            totalRevenue: Math.round(totalRevenue * 100) / 100,
        };
    }
    categorizeStream(title, tags) {
        const categories = {
            gaming: ['game', 'gaming', 'play', 'stream', 'fps', 'rpg', 'mmo'],
            music: ['music', 'song', 'sing', 'concert', 'band', 'dj', 'remix'],
            art: ['art', 'draw', 'paint', 'design', 'create', 'sketch'],
            talk: ['talk', 'chat', 'discussion', 'podcast', 'interview'],
            education: ['tutorial', 'learn', 'teach', 'course', 'lesson', 'how to'],
            cooking: ['cook', 'food', 'recipe', 'bake', 'kitchen'],
            tech: ['code', 'programming', 'tech', 'software', 'development'],
        };
        const lowerTitle = title.toLowerCase();
        const lowerTags = tags.map(t => t.toLowerCase());
        for (const [category, keywords] of Object.entries(categories)) {
            const matchCount = keywords.filter(keyword => lowerTitle.includes(keyword) ||
                lowerTags.some(tag => tag.includes(keyword))).length;
            if (matchCount > 0) {
                return category;
            }
        }
        return 'general';
    }
};
exports.StreamDomainService = StreamDomainService;
StreamDomainService.MIN_TITLE_LENGTH = 1;
StreamDomainService.MAX_TITLE_LENGTH = 100;
StreamDomainService.MAX_DESCRIPTION_LENGTH = 500;
StreamDomainService.MAX_CONCURRENT_STREAMS_PER_USER = 1;
StreamDomainService.MAX_STREAM_DURATION = 12 * 60 * 60 * 1000;
StreamDomainService.MIN_STREAM_INTERVAL = 5 * 60 * 1000;
StreamDomainService.DEFAULT_VIEWER_LIMIT = 10000;
StreamDomainService.DEFAULT_COMMENT_COOLDOWN = 1000;
StreamDomainService.DEFAULT_MAX_COMMENT_LENGTH = 200;
exports.StreamDomainService = StreamDomainService = StreamDomainService_1 = __decorate([
    (0, common_1.Injectable)()
], StreamDomainService);
//# sourceMappingURL=stream-domain.service.js.map