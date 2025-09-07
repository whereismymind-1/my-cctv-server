"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const auth_service_1 = require("./services/auth.service");
const stream_service_1 = require("./services/stream.service");
const comment_service_1 = require("./services/comment.service");
const moderation_service_1 = require("./services/moderation.service");
const analytics_service_1 = require("./services/analytics.service");
const analytics_service_refactored_1 = require("./services/analytics.service.refactored");
const domain_module_1 = require("../domain/domain.module");
const infrastructure_module_1 = require("../infrastructure/infrastructure.module");
const stream_schema_1 = require("../infrastructure/database/entities/stream.schema");
const comment_schema_1 = require("../infrastructure/database/entities/comment.schema");
let ApplicationModule = class ApplicationModule {
};
exports.ApplicationModule = ApplicationModule;
exports.ApplicationModule = ApplicationModule = __decorate([
    (0, common_1.Module)({
        imports: [
            domain_module_1.DomainModule,
            infrastructure_module_1.InfrastructureModule,
            typeorm_1.TypeOrmModule.forFeature([stream_schema_1.StreamEntity, comment_schema_1.CommentEntity]),
            jwt_1.JwtModule.registerAsync({
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    secret: configService.get('JWT_SECRET', 'default-secret'),
                    signOptions: {
                        expiresIn: configService.get('JWT_EXPIRES_IN', '24h'),
                    },
                }),
            }),
        ],
        providers: [
            auth_service_1.AuthService,
            stream_service_1.StreamService,
            comment_service_1.CommentService,
            moderation_service_1.ModerationService,
            analytics_service_1.AnalyticsService,
            analytics_service_refactored_1.AnalyticsServiceRefactored,
        ],
        exports: [
            auth_service_1.AuthService,
            stream_service_1.StreamService,
            comment_service_1.CommentService,
            moderation_service_1.ModerationService,
            analytics_service_1.AnalyticsService,
            analytics_service_refactored_1.AnalyticsServiceRefactored,
            jwt_1.JwtModule,
        ],
    })
], ApplicationModule);
//# sourceMappingURL=application.module.js.map