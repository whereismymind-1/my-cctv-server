"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PresentationModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const application_module_1 = require("../application/application.module");
const auth_controller_1 = require("./controllers/auth.controller");
const stream_controller_1 = require("./controllers/stream.controller");
const analytics_controller_1 = require("./controllers/analytics.controller");
const moderation_controller_1 = require("./controllers/moderation.controller");
const health_controller_1 = require("./controllers/health.controller");
const comment_gateway_1 = require("./gateways/comment.gateway");
const user_schema_1 = require("../infrastructure/database/entities/user.schema");
let PresentationModule = class PresentationModule {
};
exports.PresentationModule = PresentationModule;
exports.PresentationModule = PresentationModule = __decorate([
    (0, common_1.Module)({
        imports: [
            application_module_1.ApplicationModule,
            typeorm_1.TypeOrmModule.forFeature([user_schema_1.UserEntity]),
        ],
        controllers: [
            auth_controller_1.AuthController,
            stream_controller_1.StreamController,
            analytics_controller_1.AnalyticsController,
            moderation_controller_1.ModerationController,
            health_controller_1.HealthController,
        ],
        providers: [
            comment_gateway_1.CommentGateway,
        ],
        exports: [],
    })
], PresentationModule);
//# sourceMappingURL=presentation.module.js.map