import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicationModule } from '../application/application.module';

// Controllers
import { AuthController } from './controllers/auth.controller';
import { StreamController } from './controllers/stream.controller';
import { AnalyticsController } from './controllers/analytics.controller';
import { ModerationController } from './controllers/moderation.controller';
import { HealthController } from './controllers/health.controller';

// WebSocket Gateways
import { CommentGateway } from './gateways/comment.gateway';

// Entity for HealthController
import { UserEntity } from '../infrastructure/database/entities/user.schema';

/**
 * Presentation Module
 * Handles all external interfaces (REST API, WebSocket, GraphQL, etc.)
 * Controllers and Gateways that expose application services
 */
@Module({
  imports: [
    ApplicationModule,
    TypeOrmModule.forFeature([UserEntity]), // For HealthController
  ],
  controllers: [
    AuthController,
    StreamController,
    AnalyticsController,
    ModerationController,
    HealthController,
  ],
  providers: [
    CommentGateway,
  ],
  exports: [],
})
export class PresentationModule {}