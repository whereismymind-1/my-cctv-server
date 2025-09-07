import { Module } from '@nestjs/common';
import { ModerationController } from '../presentation/controllers/moderation.controller';
import { CommentModule } from '../comment/comment.module';
import { RedisModule } from '../infrastructure/redis/redis.module';

@Module({
  imports: [CommentModule, RedisModule],
  controllers: [ModerationController],
})
export class ModerationModule {}