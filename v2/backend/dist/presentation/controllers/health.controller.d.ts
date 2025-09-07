import { Repository } from 'typeorm';
import { UserEntity } from '../../infrastructure/database/entities/user.schema';
import { RedisService } from '../../infrastructure/redis/redis.service';
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
export declare class HealthController {
    private readonly userRepository;
    private readonly redisService;
    constructor(userRepository: Repository<UserEntity>, redisService: RedisService);
    healthCheck(): Promise<HealthStatus>;
    readinessCheck(): Promise<{
        ready: boolean;
        services: any;
    }>;
    livenessCheck(): Promise<{
        alive: boolean;
        timestamp: Date;
    }>;
    private checkDatabase;
    private checkRedis;
}
export {};
