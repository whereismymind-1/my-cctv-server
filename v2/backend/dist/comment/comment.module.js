"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const comment_service_1 = require("../application/services/comment.service");
const moderation_service_1 = require("../application/services/moderation.service");
const comment_gateway_1 = require("../presentation/gateways/comment.gateway");
const comment_repository_1 = require("../infrastructure/repositories/comment.repository");
const comment_schema_1 = require("../infrastructure/database/entities/comment.schema");
const stream_module_1 = require("../stream/stream.module");
const auth_module_1 = require("../auth/auth.module");
const stream_repository_1 = require("../infrastructure/repositories/stream.repository");
const stream_schema_1 = require("../infrastructure/database/entities/stream.schema");
const analytics_module_1 = require("../analytics/analytics.module");
let CommentModule = class CommentModule {
};
exports.CommentModule = CommentModule;
exports.CommentModule = CommentModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([comment_schema_1.CommentEntity, stream_schema_1.StreamEntity]),
            stream_module_1.StreamModule,
            auth_module_1.AuthModule,
            (0, common_1.forwardRef)(() => analytics_module_1.AnalyticsModule),
        ],
        providers: [
            comment_service_1.CommentService,
            moderation_service_1.ModerationService,
            comment_gateway_1.CommentGateway,
            {
                provide: 'ICommentRepository',
                useClass: comment_repository_1.CommentRepository,
            },
            {
                provide: 'IStreamRepository',
                useClass: stream_repository_1.StreamRepository,
            },
            comment_repository_1.CommentRepository,
            stream_repository_1.StreamRepository,
        ],
        exports: [comment_service_1.CommentService, moderation_service_1.ModerationService],
    })
], CommentModule);
//# sourceMappingURL=comment.module.js.map