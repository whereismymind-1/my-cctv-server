import { Injectable } from '@nestjs/common';
import { ICacheRepository } from '../../domain/repositories/cache.repository.interface';
import { RedisClientService } from '../redis/redis-client.service';

/**
 * Redis implementation of Cache Repository
 * Infrastructure layer - implements domain interface
 */
@Injectable()
export class RedisCacheRepository implements ICacheRepository {
  constructor(private readonly redisClient: RedisClientService) {}

  async get(key: string): Promise<string | null> {
    return this.redisClient.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    await this.redisClient.set(key, value, ttl);
  }

  async delete(key: string): Promise<void> {
    await this.redisClient.del(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.redisClient.exists(key);
  }

  async increment(key: string): Promise<number> {
    return this.redisClient.incr(key);
  }

  async decrement(key: string): Promise<number> {
    return this.redisClient.decr(key);
  }

  async addToSet(key: string, member: string): Promise<void> {
    await this.redisClient.sadd(key, member);
  }

  async removeFromSet(key: string, member: string): Promise<void> {
    await this.redisClient.srem(key, member);
  }

  async getSetSize(key: string): Promise<number> {
    return this.redisClient.scard(key);
  }

  async getSetMembers(key: string): Promise<string[]> {
    return this.redisClient.smembers(key);
  }

  async pushToList(key: string, value: string): Promise<void> {
    await this.redisClient.lpush(key, value);
  }

  async getListRange(key: string, start: number, end: number): Promise<string[]> {
    return this.redisClient.lrange(key, start, end);
  }

  async trimList(key: string, start: number, end: number): Promise<void> {
    await this.redisClient.ltrim(key, start, end);
  }
}