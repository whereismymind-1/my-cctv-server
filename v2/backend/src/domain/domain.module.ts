import { Module } from '@nestjs/common';

// Domain Services
import { StreamDomainService } from './services/stream-domain.service';
import { AnalyticsDomainService } from './services/analytics-domain.service';
import { ModerationDomainService } from './services/moderation-domain.service';
import { CommentValidator } from './services/comment-validator.service';
import { LaneManager } from './services/lane-manager.service';

/**
 * Domain Module
 * Contains pure business logic without infrastructure dependencies
 * Domain services, entities, value objects, and domain events
 */
@Module({
  providers: [
    StreamDomainService,
    AnalyticsDomainService,
    ModerationDomainService,
    CommentValidator,
    LaneManager,
  ],
  exports: [
    StreamDomainService,
    AnalyticsDomainService,
    ModerationDomainService,
    CommentValidator,
    LaneManager,
  ],
})
export class DomainModule {}