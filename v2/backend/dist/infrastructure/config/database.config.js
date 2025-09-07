"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatabaseConfig = void 0;
const user_schema_1 = require("../database/entities/user.schema");
const stream_schema_1 = require("../database/entities/stream.schema");
const comment_schema_1 = require("../database/entities/comment.schema");
const getDatabaseConfig = (configService) => ({
    type: 'postgres',
    host: configService.get('DATABASE_HOST', 'localhost'),
    port: configService.get('DATABASE_PORT', 5432),
    username: configService.get('DATABASE_USER', 'admin'),
    password: configService.get('DATABASE_PASSWORD', 'password123'),
    database: configService.get('DATABASE_NAME', 'danmaku_live'),
    entities: [user_schema_1.UserEntity, stream_schema_1.StreamEntity, comment_schema_1.CommentEntity],
    synchronize: configService.get('NODE_ENV') === 'development',
    logging: configService.get('NODE_ENV') === 'development',
});
exports.getDatabaseConfig = getDatabaseConfig;
//# sourceMappingURL=database.config.js.map