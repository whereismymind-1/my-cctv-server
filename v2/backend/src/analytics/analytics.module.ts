import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from '../presentation/controllers/analytics.controller';
import { AnalyticsService } from '../application/services/analytics.service';
import { StreamEntity } from '../infrastructure/database/entities/stream.schema';
import { CommentEntity } from '../infrastructure/database/entities/comment.schema';
import { RedisModule } from '../infrastructure/redis/redis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([StreamEntity, CommentEntity]),
    RedisModule,
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}