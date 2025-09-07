import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Infrastructure services
import { RedisClientService } from './redis/redis-client.service';
import { RedisService } from './redis/redis.service';
import { RedisCacheRepository } from './repositories/redis-cache.repository';

// Database entities
import { UserEntity } from './database/entities/user.schema';
import { StreamEntity } from './database/entities/stream.schema';
import { CommentEntity } from './database/entities/comment.schema';

// Repository implementations
import { UserRepository } from './repositories/user.repository';
import { StreamRepository } from './repositories/stream.repository';
import { CommentRepository } from './repositories/comment.repository';

/**
 * Infrastructure Module
 * Provides all infrastructure services and repositories
 * Uses dependency injection tokens for abstraction
 */
@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      StreamEntity,
      CommentEntity,
    ]),
  ],
  providers: [
    // Redis infrastructure
    RedisClientService,
    RedisService,
    
    // Redis client binding for AnalyticsServiceRefactored
    {
      provide: 'REDIS_CLIENT',
      useClass: RedisClientService,
    },
    
    // Cache repository (interface binding)
    {
      provide: 'CACHE_REPOSITORY',
      useClass: RedisCacheRepository,
    },
    
    // User repository (interface binding)
    {
      provide: 'USER_REPOSITORY',
      useClass: UserRepository,
    },
    
    // Stream repository (interface binding)
    {
      provide: 'STREAM_REPOSITORY',
      useClass: StreamRepository,
    },
    
    // Comment repository (interface binding)
    {
      provide: 'COMMENT_REPOSITORY',
      useClass: CommentRepository,
    },
  ],
  exports: [
    'CACHE_REPOSITORY',
    'USER_REPOSITORY',
    'STREAM_REPOSITORY',
    'COMMENT_REPOSITORY',
    'REDIS_CLIENT', // Export for AnalyticsServiceRefactored
    RedisClientService, // Export for testing
    RedisService, // Export for WebSocket gateways
  ],
})
export class InfrastructureModule {}