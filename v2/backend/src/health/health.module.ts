import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from '../presentation/controllers/health.controller';
import { UserEntity } from '../infrastructure/database/entities/user.schema';
import { RedisModule } from '../infrastructure/redis/redis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    RedisModule,
  ],
  controllers: [HealthController],
})
export class HealthModule {}