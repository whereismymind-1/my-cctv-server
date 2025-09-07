"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InfrastructureModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const redis_client_service_1 = require("./redis/redis-client.service");
const redis_service_1 = require("./redis/redis.service");
const redis_cache_repository_1 = require("./repositories/redis-cache.repository");
const user_schema_1 = require("./database/entities/user.schema");
const stream_schema_1 = require("./database/entities/stream.schema");
const comment_schema_1 = require("./database/entities/comment.schema");
const user_repository_1 = require("./repositories/user.repository");
const stream_repository_1 = require("./repositories/stream.repository");
const comment_repository_1 = require("./repositories/comment.repository");
let InfrastructureModule = class InfrastructureModule {
};
exports.InfrastructureModule = InfrastructureModule;
exports.InfrastructureModule = InfrastructureModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                user_schema_1.UserEntity,
                stream_schema_1.StreamEntity,
                comment_schema_1.CommentEntity,
            ]),
        ],
        providers: [
            redis_client_service_1.RedisClientService,
            redis_service_1.RedisService,
            {
                provide: 'REDIS_CLIENT',
                useClass: redis_client_service_1.RedisClientService,
            },
            {
                provide: 'CACHE_REPOSITORY',
                useClass: redis_cache_repository_1.RedisCacheRepository,
            },
            {
                provide: 'USER_REPOSITORY',
                useClass: user_repository_1.UserRepository,
            },
            {
                provide: 'STREAM_REPOSITORY',
                useClass: stream_repository_1.StreamRepository,
            },
            {
                provide: 'COMMENT_REPOSITORY',
                useClass: comment_repository_1.CommentRepository,
            },
        ],
        exports: [
            'CACHE_REPOSITORY',
            'USER_REPOSITORY',
            'STREAM_REPOSITORY',
            'COMMENT_REPOSITORY',
            'REDIS_CLIENT',
            redis_client_service_1.RedisClientService,
            redis_service_1.RedisService,
        ],
    })
], InfrastructureModule);
//# sourceMappingURL=infrastructure.module.js.map