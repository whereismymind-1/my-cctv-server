import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { UserEntity } from './src/infrastructure/entities/user.entity';
import { StreamEntity } from './src/infrastructure/entities/stream.entity';
import { CommentEntity } from './src/infrastructure/entities/comment.entity';

// Load environment variables
config();

const configService = new ConfigService();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: configService.get('DB_HOST', 'localhost'),
  port: configService.get('DB_PORT', 5432),
  username: configService.get('DB_USER', 'postgres'),
  password: configService.get('DB_PASSWORD', 'postgres'),
  database: configService.get('DB_NAME', 'cctv_db'),
  entities: [UserEntity, StreamEntity, CommentEntity],
  migrations: ['src/infrastructure/migrations/*.ts'],
  synchronize: false,
  logging: configService.get('NODE_ENV') === 'development',
});