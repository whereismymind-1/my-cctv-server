import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentService } from '../application/services/comment.service';
import { ModerationService } from '../application/services/moderation.service';
import { CommentGateway } from '../presentation/gateways/comment.gateway';
import { CommentRepository } from '../infrastructure/repositories/comment.repository';
import { CommentEntity } from '../infrastructure/database/entities/comment.schema';
import { StreamModule } from '../stream/stream.module';
import { AuthModule } from '../auth/auth.module';
import { StreamRepository } from '../infrastructure/repositories/stream.repository';
import { StreamEntity } from '../infrastructure/database/entities/stream.schema';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CommentEntity, StreamEntity]),
    StreamModule,
    AuthModule,
    forwardRef(() => AnalyticsModule),
  ],
  providers: [
    CommentService,
    ModerationService,
    CommentGateway,
    {
      provide: 'ICommentRepository',
      useClass: CommentRepository,
    },
    {
      provide: 'IStreamRepository',
      useClass: StreamRepository,
    },
    CommentRepository,
    StreamRepository,
  ],
  exports: [CommentService, ModerationService],
})
export class CommentModule {}
