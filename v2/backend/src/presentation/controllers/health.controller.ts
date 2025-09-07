import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../infrastructure/database/entities/user.schema';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { Public } from '../decorators/public.decorator';

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: Date;
  uptime: number;
  services: {
    database: boolean;
    redis: boolean;
  };
  version: string;
  environment: string;
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly redisService: RedisService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 503, description: 'Service is unhealthy' })
  async healthCheck(): Promise<HealthStatus> {
    const dbHealth = await this.checkDatabase();
    const redisHealth = await this.checkRedis();
    
    const isHealthy = dbHealth && redisHealth;
    
    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date(),
      uptime: process.uptime(),
      services: {
        database: dbHealth,
        redis: redisHealth,
      },
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };
  }

  @Public()
  @Get('ready')
  @ApiOperation({ summary: 'Readiness check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  async readinessCheck(): Promise<{ ready: boolean; services: any }> {
    const dbHealth = await this.checkDatabase();
    const redisHealth = await this.checkRedis();
    
    return {
      ready: dbHealth && redisHealth,
      services: {
        database: dbHealth,
        redis: redisHealth,
      },
    };
  }

  @Public()
  @Get('live')
  @ApiOperation({ summary: 'Liveness check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  async livenessCheck(): Promise<{ alive: boolean; timestamp: Date }> {
    return {
      alive: true,
      timestamp: new Date(),
    };
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      await this.userRepository.query('SELECT 1');
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  private async checkRedis(): Promise<boolean> {
    try {
      const client = this.redisService.getClient();
      const result = await client.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('Redis health check failed:', error);
      return false;
    }
  }
}