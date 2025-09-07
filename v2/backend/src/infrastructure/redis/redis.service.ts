import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.client = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
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

  // Comment management
  async addComment(streamId: string, comment: any): Promise<void> {
    const key = `stream:${streamId}:comments`;
    await this.client.lpush(key, JSON.stringify(comment));
    await this.client.ltrim(key, 0, 99); // Keep only last 100 comments
    await this.client.expire(key, 3600); // Expire after 1 hour
  }

  async getRecentComments(streamId: string, limit = 100): Promise<any[]> {
    const key = `stream:${streamId}:comments`;
    const comments = await this.client.lrange(key, 0, limit - 1);
    return comments.map(c => JSON.parse(c));
  }

  // Viewer management
  async addViewer(streamId: string, userId: string): Promise<void> {
    const key = `stream:${streamId}:viewers`;
    await this.client.sadd(key, userId);
    await this.client.expire(key, 3600);
    await this.updateViewerCount(streamId);
  }

  async removeViewer(streamId: string, userId: string): Promise<void> {
    const key = `stream:${streamId}:viewers`;
    await this.client.srem(key, userId);
    await this.updateViewerCount(streamId);
  }

  async getViewerCount(streamId: string): Promise<number> {
    const key = `stream:${streamId}:viewers`;
    return await this.client.scard(key);
  }

  private async updateViewerCount(streamId: string): Promise<void> {
    const count = await this.getViewerCount(streamId);
    const countKey = `stream:${streamId}:viewer_count`;
    await this.client.set(countKey, count, 'EX', 3600);
  }

  // Lane management for comments
  async assignLane(streamId: string): Promise<number> {
    const key = `stream:${streamId}:lanes`;
    const now = Date.now();
    
    // Clean up expired lanes
    const lanes = await this.client.hgetall(key);
    for (const [lane, timestamp] of Object.entries(lanes)) {
      if (parseInt(timestamp) < now) {
        await this.client.hdel(key, lane);
      }
    }

    // Find available lane
    for (let i = 0; i < 12; i++) {
      const occupied = await this.client.hget(key, i.toString());
      if (!occupied || parseInt(occupied) < now) {
        // Occupy lane for 4 seconds
        await this.client.hset(key, i.toString(), now + 4000);
        await this.client.expire(key, 3600);
        return i;
      }
    }

    // If all lanes occupied, return random lane
    return Math.floor(Math.random() * 12);
  }

  // Rate limiting
  async checkRateLimit(
    userId: string,
    streamId: string,
    limit = 30,
    window = 60,
  ): Promise<boolean> {
    const key = `rate:comment:${userId}:${streamId}`;
    const current = await this.client.incr(key);
    
    if (current === 1) {
      await this.client.expire(key, window);
    }
    
    return current <= limit;
  }

  // Session management
  async setUserSession(
    userId: string,
    data: { token: string; socketId?: string; currentStream?: string },
  ): Promise<void> {
    const key = `session:${userId}`;
    await this.client.hmset(key, data as any);
    await this.client.expire(key, 86400); // 24 hours
  }

  async getUserSession(userId: string): Promise<any> {
    const key = `session:${userId}`;
    return await this.client.hgetall(key);
  }

  async removeUserSession(userId: string): Promise<void> {
    const key = `session:${userId}`;
    await this.client.del(key);
  }

  // Cache management
  async cacheStream(streamId: string, data: any, ttl = 30): Promise<void> {
    const key = `cache:stream:${streamId}`;
    await this.client.set(key, JSON.stringify(data), 'EX', ttl);
  }

  async getCachedStream(streamId: string): Promise<any | null> {
    const key = `cache:stream:${streamId}`;
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  async invalidateStreamCache(streamId: string): Promise<void> {
    const key = `cache:stream:${streamId}`;
    await this.client.del(key);
  }

  // Moderation features
  async blockUser(userId: string, until: Date): Promise<void> {
    const key = `blocked:${userId}`;
    await this.client.set(key, until.toISOString(), 'EX', Math.floor((until.getTime() - Date.now()) / 1000));
  }

  async unblockUser(userId: string): Promise<void> {
    const key = `blocked:${userId}`;
    await this.client.del(key);
  }

  async getBlockedUsers(): Promise<Array<{ userId: string; blockedUntil: string }> | null> {
    const keys = await this.client.keys('blocked:*');
    if (keys.length === 0) return null;
    
    const users = [];
    for (const key of keys) {
      const userId = key.replace('blocked:', '');
      const blockedUntil = await this.client.get(key);
      if (blockedUntil) {
        users.push({ userId, blockedUntil });
      }
    }
    return users;
  }

  async incrementWithExpiry(key: string, expiry: number): Promise<number> {
    const current = await this.client.incr(key);
    if (current === 1) {
      await this.client.expire(key, expiry);
    }
    return current;
  }

  async getRecentUserMessages(key: string): Promise<string[]> {
    const messages = await this.client.lrange(key, 0, -1);
    return messages;
  }

  async addRecentUserMessage(key: string, message: string, ttl: number): Promise<void> {
    await this.client.lpush(key, message);
    await this.client.ltrim(key, 0, 9); // Keep last 10 messages
    await this.client.expire(key, ttl);
  }

  async addReport(report: { commentId: string; reporterId: string; reason: string; timestamp: Date }): Promise<void> {
    const key = 'reports:queue';
    await this.client.lpush(key, JSON.stringify(report));
    await this.client.expire(key, 86400); // Keep for 24 hours
  }

  async getReportCount(): Promise<number> {
    const key = 'reports:queue';
    return await this.client.llen(key);
  }

  async getRecentMessages(userId: string, streamId: string, limit: number): Promise<string[]> {
    const key = `recent:${userId}:${streamId}`;
    const messages = await this.client.lrange(key, 0, limit - 1);
    return messages;
  }

  async addRecentMessage(userId: string, streamId: string, message: string): Promise<void> {
    const key = `recent:${userId}:${streamId}`;
    await this.client.lpush(key, message);
    await this.client.ltrim(key, 0, 9); // Keep last 10 messages
    await this.client.expire(key, 300); // 5 minutes
  }

  // Generic methods
  getClient(): Redis {
    return this.client;
  }
}