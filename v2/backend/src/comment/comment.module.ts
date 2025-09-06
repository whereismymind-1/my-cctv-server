import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentService } from '../application/services/comment.service';
import { CommentGateway } from '../presentation/gateways/comment.gateway';
import { CommentRepository } from '../infrastructure/repositories/comment.repository';
import { CommentEntity } from '../infrastructure/database/entities/comment.schema';
import { StreamModule } from '../stream/stream.module';
import { AuthModule } from '../auth/auth.module';
import { StreamRepository } from '../infrastructure/repositories/stream.repository';
import { StreamEntity } from '../infrastructure/database/entities/stream.schema';

@Module({
  imports: [
    TypeOrmModule.forFeature([CommentEntity, StreamEntity]),
    StreamModule,
    AuthModule,
  ],
  providers: [
    CommentService,
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
  exports: [CommentService],
})
export class CommentModule {}
