import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { StreamModule } from './stream/stream.module';
import { CommentModule } from './comment/comment.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { getDatabaseConfig } from './infrastructure/config/database.config';
import { HealthModule } from './health/health.module';
import { ModerationModule } from './moderation/moderation.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getDatabaseConfig,
    }),
    RedisModule,
    AuthModule,
    StreamModule,
    CommentModule,
    HealthModule,
    ModerationModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}