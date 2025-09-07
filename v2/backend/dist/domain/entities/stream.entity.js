"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Stream = void 0;
class Stream {
    constructor(id, ownerId, title, description, thumbnailUrl, streamKey, status, viewerCount, maxViewers, settings, startedAt, endedAt, createdAt, updatedAt) {
        this.id = id;
        this.ownerId = ownerId;
        this.title = title;
        this.description = description;
        this.thumbnailUrl = thumbnailUrl;
        this.streamKey = streamKey;
        this.status = status;
        this.viewerCount = viewerCount;
        this.maxViewers = maxViewers;
        this.settings = settings;
        this.startedAt = startedAt;
        this.endedAt = endedAt;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    static create(ownerId, title, description, settings) {
        const now = new Date();
        const defaultSettings = {
            allowComments: true,
            commentCooldown: 1000,
            maxCommentLength: 200,
            allowAnonymous: false,
            ...settings,
        };
        return new Stream('', ownerId, title, description || null, null, Stream.generateStreamKey(), 'waiting', 0, 0, defaultSettings, null, null, now, now);
    }
    static generateStreamKey() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let key = '';
        for (let i = 0; i < 32; i++) {
            key += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return key;
    }
    start() {
        if (this.status !== 'waiting') {
            throw new Error('Stream can only be started from waiting status');
        }
        this.status = 'live';
        this.startedAt = new Date();
        this.updatedAt = new Date();
    }
    end() {
        if (this.status !== 'live') {
            throw new Error('Only live streams can be ended');
        }
        this.status = 'ended';
        this.endedAt = new Date();
        this.updatedAt = new Date();
    }
    updateViewerCount(count) {
        this.viewerCount = count;
        if (count > this.maxViewers) {
            this.maxViewers = count;
        }
        this.updatedAt = new Date();
    }
    updateSettings(settings) {
        this.settings = { ...this.settings, ...settings };
        this.updatedAt = new Date();
    }
    canUserComment(userId) {
        if (!this.settings.allowComments)
            return false;
        if (!userId && !this.settings.allowAnonymous)
            return false;
        if (this.status !== 'live')
            return false;
        return true;
    }
}
exports.Stream = Stream;
//# sourceMappingURL=stream.entity.js.map