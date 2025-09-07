import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

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
  providers: [AppService],
})
export class AppModule {}