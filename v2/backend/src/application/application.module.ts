import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

// Application Services
import { AuthService } from './services/auth.service';
import { StreamService } from './services/stream.service';
import { CommentService } from './services/comment.service';
import { ModerationService } from './services/moderation.service';
import { AnalyticsService } from './services/analytics.service';
import { AnalyticsServiceRefactored } from './services/analytics.service.refactored';

// Domain Services (imported from domain module)
import { DomainModule } from '../domain/domain.module';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';

// Database entities for AnalyticsService
import { StreamEntity } from '../infrastructure/database/entities/stream.schema';
import { CommentEntity } from '../infrastructure/database/entities/comment.schema';

/**
 * Application Module
 * Groups all application layer services and controllers
 * Depends on Domain and Infrastructure modules
 */
@Module({
  imports: [
    DomainModule,
    InfrastructureModule,
    TypeOrmModule.forFeature([StreamEntity, CommentEntity]), // For AnalyticsService
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET', 'default-secret'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN', '24h'),
        },
      }),
    }),
  ],
  providers: [
    AuthService,
    StreamService,
    CommentService,
    ModerationService,
    AnalyticsService,
    AnalyticsServiceRefactored,
  ],
  exports: [
    AuthService,
    StreamService,
    CommentService,
    ModerationService,
    AnalyticsService,
    AnalyticsServiceRefactored,
    JwtModule, // Export for WebSocket gateways
  ],
})
export class ApplicationModule {}