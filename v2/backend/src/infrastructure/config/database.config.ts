import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { UserEntity } from '../database/entities/user.schema';
import { StreamEntity } from '../database/entities/stream.schema';
import { CommentEntity } from '../database/entities/comment.schema';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get<string>('DATABASE_HOST', 'localhost'),
  port: configService.get<number>('DATABASE_PORT', 5432),
  username: configService.get<string>('DATABASE_USER', 'admin'),
  password: configService.get<string>('DATABASE_PASSWORD', 'password123'),
  database: configService.get<string>('DATABASE_NAME', 'danmaku_live'),
  entities: [UserEntity, StreamEntity, CommentEntity],
  synchronize: configService.get<string>('NODE_ENV') === 'development',
  logging: configService.get<string>('NODE_ENV') === 'development',
});