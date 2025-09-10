import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CustomThrottlerGuard } from './infrastructure/guards/throttle.guard';

// Layered Architecture Modules
import { DomainModule } from './domain/domain.module';
import { ApplicationModule } from './application/application.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { PresentationModule } from './presentation/presentation.module';

// Configuration
import { getDatabaseConfig } from './infrastructure/config/database.config';

/**
 * Root Application Module
 * Follows Clean Architecture principles with clear layer separation:
 * - Domain Layer: Business logic and entities
 * - Application Layer: Use cases and application services
 * - Infrastructure Layer: External dependencies (DB, Redis, etc.)
 * - Presentation Layer: Controllers and external interfaces
 */
@Module({
  imports: [
    // Global configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // Rate limiting configuration
    ThrottlerModule.forRoot({
      ttl: 60, // Time window in seconds
      limit: 60, // Number of requests per time window
    }),
    
    // Database configuration
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getDatabaseConfig,
    }),
    
    // Clean Architecture Layers
    DomainModule,
    InfrastructureModule,
    ApplicationModule,
    PresentationModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class AppModule {}