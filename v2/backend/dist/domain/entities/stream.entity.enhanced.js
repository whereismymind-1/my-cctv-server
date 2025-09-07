"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamEntity = void 0;
const stream_settings_vo_1 = require("../value-objects/stream-settings.vo");
const stream_status_vo_1 = require("../value-objects/stream-status.vo");
const stream_key_vo_1 = require("../value-objects/stream-key.vo");
class StreamEntity {
    constructor(id, ownerId, title, description, thumbnail, streamKey, settings, _status, _viewerCount, _peakViewers, _totalComments, createdAt, _startedAt, _endedAt, _lastActivityAt, ownerLevel = 1) {
        this.id = id;
        this.ownerId = ownerId;
        this.title = title;
        this.description = description;
        this.thumbnail = thumbnail;
        this.streamKey = streamKey;
        this.settings = settings;
        this._status = _status;
        this._viewerCount = _viewerCount;
        this._peakViewers = _peakViewers;
        this._totalComments = _totalComments;
        this.createdAt = createdAt;
        this._startedAt = _startedAt;
        this._endedAt = _endedAt;
        this._lastActivityAt = _lastActivityAt;
        this.ownerLevel = ownerLevel;
        this.validateInvariants();
    }
    validateInvariants() {
        if (!this.title || this.title.trim().length === 0) {
            throw new Error('Stream title cannot be empty');
        }
        if (this.title.length < StreamEntity.MIN_TITLE_LENGTH) {
            throw new Error(`Stream title must be at least ${StreamEntity.MIN_TITLE_LENGTH} character`);
        }
        if (this.title.length > StreamEntity.MAX_TITLE_LENGTH) {
            throw new Error(`Stream title cannot exceed ${StreamEntity.MAX_TITLE_LENGTH} characters`);
        }
        if (this.description && this.description.length > StreamEntity.MAX_DESCRIPTION_LENGTH) {
            throw new Error(`Stream description cannot exceed ${StreamEntity.MAX_DESCRIPTION_LENGTH} characters`);
        }
        if (this._viewerCount < 0) {
            throw new Error('Viewer count cannot be negative');
        }
        if (this._peakViewers < this._viewerCount) {
            throw new Error('Peak viewers cannot be less than current viewers');
        }
        this.validateStatusTransition();
    }
    validateStatusTransition() {
        if (this._status === stream_status_vo_1.StreamStatus.ENDED && !this._endedAt) {
            throw new Error('Ended stream must have end time');
        }
        if (this._status === stream_status_vo_1.StreamStatus.LIVE && !this._startedAt) {
            throw new Error('Live stream must have start time');
        }
        if (this._endedAt && this._startedAt && this._endedAt < this._startedAt) {
            throw new Error('Stream cannot end before it starts');
        }
    }
    start() {
        if (this._status !== stream_status_vo_1.StreamStatus.WAITING) {
            throw new Error(`Cannot start stream in ${this._status} status`);
        }
        this._status = stream_status_vo_1.StreamStatus.LIVE;
        this._startedAt = new Date();
        this._lastActivityAt = new Date();
    }
    end() {
        if (this._status !== stream_status_vo_1.StreamStatus.LIVE) {
            throw new Error(`Cannot end stream in ${this._status} status`);
        }
        this._status = stream_status_vo_1.StreamStatus.ENDED;
        this._endedAt = new Date();
        const duration = this._endedAt.getTime() - (this._startedAt?.getTime() || 0);
        const avgViewers = this.calculateAverageViewers();
        const engagement = this.calculateEngagement();
        return { duration, avgViewers, engagement };
    }
    addViewer() {
        if (this._status !== stream_status_vo_1.StreamStatus.LIVE) {
            throw new Error('Cannot add viewer to non-live stream');
        }
        if (this._viewerCount >= this.getMaxViewers()) {
            throw new Error('Stream has reached maximum viewer capacity');
        }
        this._viewerCount++;
        this._peakViewers = Math.max(this._peakViewers, this._viewerCount);
        this._lastActivityAt = new Date();
    }
    removeViewer() {
        if (this._viewerCount > 0) {
            this._viewerCount--;
            this._lastActivityAt = new Date();
        }
    }
    addComment() {
        if (!this.settings.allowComments) {
            throw new Error('Comments are disabled for this stream');
        }
        if (this._status !== stream_status_vo_1.StreamStatus.LIVE) {
            throw new Error('Cannot add comment to non-live stream');
        }
        this._totalComments++;
        this._lastActivityAt = new Date();
    }
    getMaxViewers() {
        if (this.ownerLevel >= 10)
            return 10000;
        if (this.ownerLevel >= 5)
            return 5000;
        if (this.ownerLevel >= 2)
            return 1000;
        return 100;
    }
    calculateAverageViewers() {
        return Math.round(this._peakViewers * 0.6);
    }
    calculateEngagement() {
        if (this._peakViewers === 0)
            return 0;
        const duration = this.getDuration();
        if (duration === 0)
            return 0;
        const commentsPerViewer = this._totalComments / this._peakViewers;
        const commentsPerMinute = this._totalComments / (duration / 60000);
        const score = Math.min(100, (commentsPerViewer * 20) + (commentsPerMinute * 10));
        return Math.round(score);
    }
    shouldAutoEnd() {
        if (this._status !== stream_status_vo_1.StreamStatus.LIVE)
            return false;
        const now = Date.now();
        const duration = now - (this._startedAt?.getTime() || 0);
        const inactivity = now - this._lastActivityAt.getTime();
        if (duration > StreamEntity.MAX_DURATION)
            return true;
        if (this._viewerCount === 0 && inactivity > 10 * 60 * 1000)
            return true;
        if (inactivity > 30 * 60 * 1000)
            return true;
        return false;
    }
    static canCreateNewStream(lastStreamEndedAt, activeStreamCount, userLevel) {
        if (userLevel === 0) {
            return { allowed: false, reason: 'Insufficient user level' };
        }
        if (activeStreamCount >= 1) {
            return { allowed: false, reason: 'Already have an active stream' };
        }
        if (lastStreamEndedAt) {
            const timeSince = Date.now() - lastStreamEndedAt.getTime();
            if (timeSince < StreamEntity.MIN_STREAM_INTERVAL) {
                const waitTime = Math.ceil((StreamEntity.MIN_STREAM_INTERVAL - timeSince) / 60000);
                return { allowed: false, reason: `Please wait ${waitTime} more minutes` };
            }
        }
        return { allowed: true };
    }
    getStreamQuality() {
        const engagement = this.calculateEngagement();
        const viewerRetention = this._viewerCount / Math.max(this._peakViewers, 1);
        if (engagement > 70 && viewerRetention > 0.8)
            return 'excellent';
        if (engagement > 40 && viewerRetention > 0.6)
            return 'good';
        if (engagement > 20 && viewerRetention > 0.4)
            return 'fair';
        return 'poor';
    }
    getMetrics() {
        return {
            duration: this.getDuration(),
            viewerCount: this._viewerCount,
            peakViewers: this._peakViewers,
            totalComments: this._totalComments,
            engagement: this.calculateEngagement(),
            quality: this.getStreamQuality(),
            avgViewers: this.calculateAverageViewers(),
        };
    }
    hasInappropriateContent() {
        const inappropriatePatterns = [
            /\b(scam|hack|cheat|exploit)\b/i,
            /\b(free\s+money|get\s+rich)\b/i,
            /\b(18\+|nsfw|adult)\b/i,
        ];
        const titleCheck = inappropriatePatterns.some(pattern => pattern.test(this.title));
        const descCheck = this.description ?
            inappropriatePatterns.some(pattern => pattern.test(this.description)) : false;
        return titleCheck || descCheck;
    }
    updateSettings(newSettings) {
        if (this._status === stream_status_vo_1.StreamStatus.ENDED) {
            throw new Error('Cannot update settings for ended stream');
        }
        this.settings.update(newSettings, this.ownerLevel);
    }
    canUserModerate(userId, userLevel) {
        if (userId === this.ownerId)
            return true;
        return userLevel > this.ownerLevel && userLevel >= 3;
    }
    getDuration() {
        if (!this._startedAt)
            return 0;
        const endTime = this._endedAt || new Date();
        return endTime.getTime() - this._startedAt.getTime();
    }
    static create(ownerId, ownerLevel, title, description, thumbnail) {
        const id = this.generateId();
        const streamKey = stream_key_vo_1.StreamKey.generate();
        const settings = stream_settings_vo_1.StreamSettings.createDefault(ownerLevel);
        return new StreamEntity(id, ownerId, title, description, thumbnail, streamKey, settings, stream_status_vo_1.StreamStatus.WAITING, 0, 0, 0, new Date(), null, null, new Date(), ownerLevel);
    }
    static generateId() {
        return `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    get status() { return this._status; }
    get viewerCount() { return this._viewerCount; }
    get peakViewers() { return this._peakViewers; }
    get totalComments() { return this._totalComments; }
    get startedAt() { return this._startedAt; }
    get endedAt() { return this._endedAt; }
    get lastActivityAt() { return this._lastActivityAt; }
    get isLive() { return this._status === stream_status_vo_1.StreamStatus.LIVE; }
    get isEnded() { return this._status === stream_status_vo_1.StreamStatus.ENDED; }
}
exports.StreamEntity = StreamEntity;
StreamEntity.MIN_TITLE_LENGTH = 1;
StreamEntity.MAX_TITLE_LENGTH = 100;
StreamEntity.MAX_DESCRIPTION_LENGTH = 500;
StreamEntity.MAX_DURATION = 12 * 60 * 60 * 1000;
StreamEntity.MIN_STREAM_INTERVAL = 5 * 60 * 1000;
//# sourceMappingURL=stream.entity.enhanced.js.map