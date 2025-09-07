import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
export declare const getDatabaseConfig: (configService: ConfigService) => TypeOrmModuleOptions;
