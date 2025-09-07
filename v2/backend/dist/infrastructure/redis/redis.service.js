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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = require("ioredis");
let RedisService = class RedisService {
    constructor(configService) {
        this.configService = configService;
    }
    async onModuleInit() {
        this.client = new ioredis_1.default({
            host: this.configService.get('REDIS_HOST', 'localhost'),
            port: this.configService.get('REDIS_PORT', 6379),
            retryStrategy: (times) => {
                if (times > 3) {
                    return null;
                }
                return Math.min(times * 100, 3000);
            },
        });
        this.client.on('error', (err) => {
            console.error('Redis Client Error', err);
        });
        this.client.on('connect', () => {
            console.log('Redis Client Connected');
        });
    }
    async onModuleDestroy() {
        await this.client.quit();
    }
    async addComment(streamId, comment) {
        const key = `stream:${streamId}:comments`;
        await this.client.lpush(key, JSON.stringify(comment));
        await this.client.ltrim(key, 0, 99);
        await this.client.expire(key, 3600);
    }
    async getRecentComments(streamId, limit = 100) {
        const key = `stream:${streamId}:comments`;
        const comments = await this.client.lrange(key, 0, limit - 1);
        return comments.map(c => JSON.parse(c));
    }
    async addViewer(streamId, userId) {
        const key = `stream:${streamId}:viewers`;
        await this.client.sadd(key, userId);
        await this.client.expire(key, 3600);
        await this.updateViewerCount(streamId);
    }
    async removeViewer(streamId, userId) {
        const key = `stream:${streamId}:viewers`;
        await this.client.srem(key, userId);
        await this.updateViewerCount(streamId);
    }
    async getViewerCount(streamId) {
        const key = `stream:${streamId}:viewers`;
        return await this.client.scard(key);
    }
    async updateViewerCount(streamId) {
        const count = await this.getViewerCount(streamId);
        const countKey = `stream:${streamId}:viewer_count`;
        await this.client.set(countKey, count, 'EX', 3600);
    }
    async assignLane(streamId) {
        const key = `stream:${streamId}:lanes`;
        const now = Date.now();
        const lanes = await this.client.hgetall(key);
        for (const [lane, timestamp] of Object.entries(lanes)) {
            if (parseInt(timestamp) < now) {
                await this.client.hdel(key, lane);
            }
        }
        for (let i = 0; i < 12; i++) {
            const occupied = await this.client.hget(key, i.toString());
            if (!occupied || parseInt(occupied) < now) {
                await this.client.hset(key, i.toString(), now + 4000);
                await this.client.expire(key, 3600);
                return i;
            }
        }
        return Math.floor(Math.random() * 12);
    }
    async checkRateLimit(userId, streamId, limit = 30, window = 60) {
        const key = `rate:comment:${userId}:${streamId}`;
        const current = await this.client.incr(key);
        if (current === 1) {
            await this.client.expire(key, window);
        }
        return current <= limit;
    }
    async setUserSession(userId, data) {
        const key = `session:${userId}`;
        await this.client.hmset(key, data);
        await this.client.expire(key, 86400);
    }
    async getUserSession(userId) {
        const key = `session:${userId}`;
        return await this.client.hgetall(key);
    }
    async removeUserSession(userId) {
        const key = `session:${userId}`;
        await this.client.del(key);
    }
    async cacheStream(streamId, data, ttl = 30) {
        const key = `cache:stream:${streamId}`;
        await this.client.set(key, JSON.stringify(data), 'EX', ttl);
    }
    async getCachedStream(streamId) {
        const key = `cache:stream:${streamId}`;
        const data = await this.client.get(key);
        return data ? JSON.parse(data) : null;
    }
    async invalidateStreamCache(streamId) {
        const key = `cache:stream:${streamId}`;
        await this.client.del(key);
    }
    getClient() {
        return this.client;
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisService);
//# sourceMappingURL=redis.service.js.map