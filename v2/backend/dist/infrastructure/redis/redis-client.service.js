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
exports.RedisClientService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = require("ioredis");
let RedisClientService = class RedisClientService {
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
        await this.client.ping();
    }
    async onModuleDestroy() {
        await this.client.quit();
    }
    getClient() {
        return this.client;
    }
    async get(key) {
        return this.client.get(key);
    }
    async set(key, value, ttl) {
        if (ttl) {
            return this.client.set(key, value, 'EX', ttl);
        }
        return this.client.set(key, value);
    }
    async del(key) {
        return this.client.del(key);
    }
    async exists(key) {
        const result = await this.client.exists(key);
        return result === 1;
    }
    async expire(key, ttl) {
        const result = await this.client.expire(key, ttl);
        return result === 1;
    }
    async ttl(key) {
        return this.client.ttl(key);
    }
    async incr(key) {
        return this.client.incr(key);
    }
    async decr(key) {
        return this.client.decr(key);
    }
    async hget(key, field) {
        return this.client.hget(key, field);
    }
    async hset(key, field, value) {
        return this.client.hset(key, field, value);
    }
    async hdel(key, field) {
        return this.client.hdel(key, field);
    }
    async hgetall(key) {
        return this.client.hgetall(key);
    }
    async sadd(key, member) {
        return this.client.sadd(key, member);
    }
    async srem(key, member) {
        return this.client.srem(key, member);
    }
    async scard(key) {
        return this.client.scard(key);
    }
    async smembers(key) {
        return this.client.smembers(key);
    }
    async lpush(key, value) {
        return this.client.lpush(key, value);
    }
    async rpush(key, value) {
        return this.client.rpush(key, value);
    }
    async lpop(key) {
        return this.client.lpop(key);
    }
    async rpop(key) {
        return this.client.rpop(key);
    }
    async lrange(key, start, stop) {
        return this.client.lrange(key, start, stop);
    }
    async ltrim(key, start, stop) {
        return this.client.ltrim(key, start, stop);
    }
    async zadd(key, score, member) {
        return this.client.zadd(key, score, member);
    }
    async zrem(key, member) {
        return this.client.zrem(key, member);
    }
    async zrange(key, start, stop, withScores) {
        if (withScores) {
            return this.client.zrange(key, start, stop, 'WITHSCORES');
        }
        return this.client.zrange(key, start, stop);
    }
    async zcard(key) {
        return this.client.zcard(key);
    }
};
exports.RedisClientService = RedisClientService;
exports.RedisClientService = RedisClientService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisClientService);
//# sourceMappingURL=redis-client.service.js.map