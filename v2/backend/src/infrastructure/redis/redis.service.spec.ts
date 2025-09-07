import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

// Mock ioredis
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    ttl: jest.fn(),
    incr: jest.fn(),
    decr: jest.fn(),
    hget: jest.fn(),
    hset: jest.fn(),
    hdel: jest.fn(),
    hgetall: jest.fn(),
    sadd: jest.fn(),
    srem: jest.fn(),
    scard: jest.fn(),
    smembers: jest.fn(),
    lpush: jest.fn(),
    lrange: jest.fn(),
    ltrim: jest.fn(),
    zadd: jest.fn(),
    zrem: jest.fn(),
    zrange: jest.fn(),
    zcard: jest.fn(),
    on: jest.fn(),
    ping: jest.fn().mockResolvedValue('PONG'),
    quit: jest.fn(),
  }));
});

describe('RedisService', () => {
  let service: RedisService;
  let configService: ConfigService;
  let redisClient: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: any = {
                'REDIS_HOST': 'localhost',
                'REDIS_PORT': 6379,
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
    configService = module.get<ConfigService>(ConfigService);
    redisClient = service.getClient();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should create Redis client with correct config', () => {
      expect(Redis).toHaveBeenCalledWith({
        host: 'localhost',
        port: 6379,
      });
    });

    it('should return Redis client', () => {
      expect(service.getClient()).toBeDefined();
    });
  });

  describe('cache operations', () => {
    it('should cache stream data', async () => {
      redisClient.setex.mockResolvedValue('OK');
      await service.cacheStream('stream-1', { title: 'Test' }, 60);
      
      expect(redisClient.setex).toHaveBeenCalledWith(
        'stream:cache:stream-1',
        60,
        JSON.stringify({ title: 'Test' })
      );
    });

    it('should get cached stream', async () => {
      redisClient.get.mockResolvedValue(JSON.stringify({ title: 'Test' }));
      const result = await service.getCachedStream('stream-1');
      
      expect(redisClient.get).toHaveBeenCalledWith('stream:cache:stream-1');
      expect(result).toEqual({ title: 'Test' });
    });

    it('should return null for missing cached stream', async () => {
      redisClient.get.mockResolvedValue(null);
      const result = await service.getCachedStream('stream-1');
      
      expect(result).toBeNull();
    });

    it('should invalidate stream cache', async () => {
      redisClient.del.mockResolvedValue(1);
      await service.invalidateStreamCache('stream-1');
      
      expect(redisClient.del).toHaveBeenCalledWith('stream:cache:stream-1');
    });
  });

  describe('viewer management', () => {
    it('should add viewer to stream', async () => {
      redisClient.sadd.mockResolvedValue(1);
      await service.addViewer('stream1', 'user1');
      
      expect(redisClient.sadd).toHaveBeenCalledWith(
        'stream:viewers:stream1',
        'user1'
      );
    });

    it('should remove viewer from stream', async () => {
      redisClient.srem.mockResolvedValue(1);
      await service.removeViewer('stream1', 'user1');
      
      expect(redisClient.srem).toHaveBeenCalledWith('stream:viewers:stream1', 'user1');
    });

    it('should get viewer count', async () => {
      redisClient.scard.mockResolvedValue(5);
      const result = await service.getViewerCount('stream1');
      
      expect(redisClient.scard).toHaveBeenCalledWith('stream:viewers:stream1');
      expect(result).toBe(5);
    });

    it('should return 0 for stream with no viewers', async () => {
      redisClient.scard.mockResolvedValue(0);
      const result = await service.getViewerCount('stream1');
      
      expect(result).toBe(0);
    });
  });

  describe('comment management', () => {
    it('should add comment', async () => {
      const comment = { text: 'Hello', userId: 'user1' };
      redisClient.lpush.mockResolvedValue(1);
      redisClient.ltrim.mockResolvedValue('OK');
      
      await service.addComment('stream1', comment);
      
      expect(redisClient.lpush).toHaveBeenCalledWith(
        'stream:comments:stream1',
        JSON.stringify(comment)
      );
      expect(redisClient.ltrim).toHaveBeenCalledWith('stream:comments:stream1', 0, 999);
    });

    it('should get recent comments', async () => {
      const comments = [
        JSON.stringify({ text: 'Comment 1' }),
        JSON.stringify({ text: 'Comment 2' }),
      ];
      redisClient.lrange.mockResolvedValue(comments);
      
      const result = await service.getRecentComments('stream1', 10);
      
      expect(redisClient.lrange).toHaveBeenCalledWith('stream:comments:stream1', 0, 9);
      expect(result).toEqual([
        { text: 'Comment 1' },
        { text: 'Comment 2' },
      ]);
    });
  });

});