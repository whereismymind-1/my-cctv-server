"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsDomainService = void 0;
const common_1 = require("@nestjs/common");
let AnalyticsDomainService = class AnalyticsDomainService {
    calculateEngagementScore(viewDuration, streamDuration, commentCount, reactionCount) {
        if (streamDuration === 0 || viewDuration === 0)
            return 0;
        const watchPercentage = Math.min(viewDuration / streamDuration, 1);
        const watchScore = watchPercentage * 40;
        const viewMinutes = viewDuration / 60000;
        const commentsPerMinute = viewMinutes > 0 ? (commentCount / viewMinutes) : 0;
        const commentScore = Math.min(commentsPerMinute * 10, 30);
        const reactionsPerMinute = viewMinutes > 0 ? (reactionCount / viewMinutes) : 0;
        const reactionScore = Math.min(reactionsPerMinute * 15, 30);
        return Math.round(watchScore + commentScore + reactionScore);
    }
    getEngagementLevel(score) {
        if (score >= 80)
            return 'very_high';
        if (score >= 60)
            return 'high';
        if (score >= 30)
            return 'medium';
        return 'low';
    }
    calculateRetentionCurve(viewerSessions, streamStartTime, streamEndTime) {
        const points = [];
        const interval = 60000;
        const maxViewers = viewerSessions.length;
        if (maxViewers === 0)
            return [];
        for (let time = streamStartTime; time <= streamEndTime; time += interval) {
            const activeViewers = viewerSessions.filter(session => session.joinTime <= time && session.leaveTime >= time).length;
            points.push({
                timestamp: time,
                viewerCount: activeViewers,
                percentage: (activeViewers / maxViewers) * 100,
            });
        }
        return points;
    }
    identifyPeakMoments(events, windowSize = 60000) {
        const moments = [];
        const eventsByWindow = new Map();
        for (const event of events) {
            const window = Math.floor(event.timestamp / windowSize) * windowSize;
            if (!eventsByWindow.has(window)) {
                eventsByWindow.set(window, []);
            }
            eventsByWindow.get(window).push(event);
        }
        for (const [window, windowEvents] of eventsByWindow) {
            const intensity = this.calculateMomentIntensity(windowEvents);
            if (intensity > 0) {
                moments.push({
                    timestamp: window,
                    intensity,
                    type: this.determineMomentType(windowEvents),
                });
            }
        }
        return moments
            .sort((a, b) => b.intensity - a.intensity)
            .slice(0, 10);
    }
    calculateMomentIntensity(events) {
        let intensity = 0;
        for (const event of events) {
            switch (event.type) {
                case 'comment':
                    intensity += 1;
                    break;
                case 'reaction':
                    intensity += 0.5;
                    break;
                case 'donation':
                    intensity += event.value || 10;
                    break;
                case 'subscription':
                    intensity += 5;
                    break;
                case 'viewer_spike':
                    intensity += event.value || 2;
                    break;
            }
        }
        return intensity;
    }
    determineMomentType(events) {
        const typeCounts = new Map();
        for (const event of events) {
            typeCounts.set(event.type, (typeCounts.get(event.type) || 0) + 1);
        }
        let maxCount = 0;
        let dominantType = 'mixed';
        for (const [type, count] of typeCounts) {
            if (count > maxCount) {
                maxCount = count;
                dominantType = type;
            }
        }
        return dominantType;
    }
    calculatePerformanceScore(viewerCount, expectedViewers, engagementRate, streamDuration, targetDuration) {
        const viewerRatio = expectedViewers > 0 ? viewerCount / expectedViewers : 1;
        const viewerScore = Math.min(viewerRatio * 40, 40);
        const engagementScore = Math.min(engagementRate * 30, 30);
        const durationRatio = targetDuration > 0 ? streamDuration / targetDuration : 1;
        const durationScore = Math.min(durationRatio * 30, 30);
        return Math.round(viewerScore + engagementScore + durationScore);
    }
    predictViewerCount(dayOfWeek, hourOfDay, category, streamerLevel, historicalAverages) {
        const key = `${dayOfWeek}_${hourOfDay}_${category}`;
        let basePrediction = historicalAverages.get(key) || 100;
        const peakHours = [19, 20, 21, 22];
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        if (peakHours.includes(hourOfDay)) {
            basePrediction *= 1.5;
        }
        if (isWeekend) {
            basePrediction *= 1.3;
        }
        const levelMultiplier = 1 + (streamerLevel * 0.1);
        basePrediction *= levelMultiplier;
        const categoryMultipliers = {
            gaming: 1.4,
            music: 1.2,
            talk: 1.1,
            education: 0.9,
            general: 1.0,
        };
        basePrediction *= categoryMultipliers[category] || 1.0;
        return Math.round(basePrediction);
    }
    calculateChurnRisk(lastViewDate, totalWatchTime, averageSessionDuration, favoriteStreamCount, daysSinceRegistration) {
        const daysSinceLastView = (Date.now() - lastViewDate.getTime()) / (24 * 60 * 60 * 1000);
        let riskScore = 0;
        if (daysSinceLastView > 30)
            riskScore += 40;
        else if (daysSinceLastView > 14)
            riskScore += 25;
        else if (daysSinceLastView > 7)
            riskScore += 10;
        const engagementHours = totalWatchTime / (60 * 60 * 1000);
        if (engagementHours < 1)
            riskScore += 30;
        else if (engagementHours < 5)
            riskScore += 15;
        else if (engagementHours < 10)
            riskScore += 5;
        const avgSessionMinutes = averageSessionDuration / 60000;
        if (avgSessionMinutes < 5)
            riskScore += 20;
        else if (avgSessionMinutes < 15)
            riskScore += 10;
        if (favoriteStreamCount === 0)
            riskScore += 10;
        else if (favoriteStreamCount === 1)
            riskScore += 5;
        if (daysSinceRegistration < 7) {
            riskScore *= 0.5;
        }
        if (riskScore >= 60)
            return 'high';
        if (riskScore >= 30)
            return 'medium';
        return 'low';
    }
    calculateRecommendationScore(viewerPreferences, streamCategory, streamTags, viewerWatchHistory, popularityScore) {
        let score = 0;
        const categoryPreference = viewerPreferences.find(p => p.category === streamCategory);
        if (categoryPreference) {
            score += categoryPreference.weight * 40;
        }
        if (streamTags.length > 0) {
            const relevantTags = streamTags.filter(tag => viewerPreferences.some(p => p.category.includes(tag.toLowerCase())));
            score += Math.min((relevantTags.length / streamTags.length) * 20, 20);
        }
        const isNew = !viewerWatchHistory.includes(streamCategory);
        if (isNew) {
            score += 20;
        }
        score += Math.min(popularityScore * 20, 20);
        return Math.round(score);
    }
    groupByTimePeriod(data, period) {
        const grouped = new Map();
        for (const item of data) {
            const key = this.getTimePeriodKey(item.timestamp, period);
            if (!grouped.has(key)) {
                grouped.set(key, []);
            }
            grouped.get(key).push(item);
        }
        return grouped;
    }
    getTimePeriodKey(date, period) {
        const year = date.getFullYear();
        const month = date.getMonth();
        const day = date.getDate();
        const hour = date.getHours();
        const week = Math.floor(day / 7);
        switch (period) {
            case 'hour':
                return `${year}-${month}-${day}-${hour}`;
            case 'day':
                return `${year}-${month}-${day}`;
            case 'week':
                return `${year}-${month}-W${week}`;
            case 'month':
                return `${year}-${month}`;
            default:
                return `${year}-${month}-${day}`;
        }
    }
    calculateGrowthRate(currentValue, previousValue) {
        if (previousValue === 0) {
            return { rate: 100, trend: 'up' };
        }
        const rate = ((currentValue - previousValue) / previousValue) * 100;
        let trend;
        if (rate > 5)
            trend = 'up';
        else if (rate < -5)
            trend = 'down';
        else
            trend = 'stable';
        return { rate: Math.round(rate * 10) / 10, trend };
    }
    calculatePercentileRank(value, allValues) {
        if (allValues.length === 0)
            return 0;
        const sorted = [...allValues].sort((a, b) => a - b);
        let count = 0;
        for (const v of sorted) {
            if (v < value) {
                count++;
            }
            else {
                break;
            }
        }
        if (count === sorted.length)
            return 100;
        if (count === 0)
            return 0;
        return Math.round((count / sorted.length) * 100);
    }
};
exports.AnalyticsDomainService = AnalyticsDomainService;
AnalyticsDomainService.ENGAGEMENT_THRESHOLD = {
    LOW: 0.1,
    MEDIUM: 0.3,
    HIGH: 0.5,
};
AnalyticsDomainService.RETENTION_BUCKETS = [
    { name: '0-1min', start: 0, end: 60000 },
    { name: '1-5min', start: 60000, end: 300000 },
    { name: '5-15min', start: 300000, end: 900000 },
    { name: '15-30min', start: 900000, end: 1800000 },
    { name: '30-60min', start: 1800000, end: 3600000 },
    { name: '60min+', start: 3600000, end: Infinity },
];
exports.AnalyticsDomainService = AnalyticsDomainService = __decorate([
    (0, common_1.Injectable)()
], AnalyticsDomainService);
//# sourceMappingURL=analytics-domain.service.js.map