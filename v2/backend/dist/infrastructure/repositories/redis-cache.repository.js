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
exports.RedisCacheRepository = void 0;
const common_1 = require("@nestjs/common");
const redis_client_service_1 = require("../redis/redis-client.service");
let RedisCacheRepository = class RedisCacheRepository {
    constructor(redisClient) {
        this.redisClient = redisClient;
    }
    async get(key) {
        return this.redisClient.get(key);
    }
    async set(key, value, ttl) {
        await this.redisClient.set(key, value, ttl);
    }
    async delete(key) {
        await this.redisClient.del(key);
    }
    async exists(key) {
        return this.redisClient.exists(key);
    }
    async increment(key) {
        return this.redisClient.incr(key);
    }
    async decrement(key) {
        return this.redisClient.decr(key);
    }
    async addToSet(key, member) {
        await this.redisClient.sadd(key, member);
    }
    async removeFromSet(key, member) {
        await this.redisClient.srem(key, member);
    }
    async getSetSize(key) {
        return this.redisClient.scard(key);
    }
    async getSetMembers(key) {
        return this.redisClient.smembers(key);
    }
    async pushToList(key, value) {
        await this.redisClient.lpush(key, value);
    }
    async getListRange(key, start, end) {
        return this.redisClient.lrange(key, start, end);
    }
    async trimList(key, start, end) {
        await this.redisClient.ltrim(key, start, end);
    }
};
exports.RedisCacheRepository = RedisCacheRepository;
exports.RedisCacheRepository = RedisCacheRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_client_service_1.RedisClientService])
], RedisCacheRepository);
//# sourceMappingURL=redis-cache.repository.js.map