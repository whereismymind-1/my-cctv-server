"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainModule = void 0;
const common_1 = require("@nestjs/common");
const stream_domain_service_1 = require("./services/stream-domain.service");
const analytics_domain_service_1 = require("./services/analytics-domain.service");
const moderation_domain_service_1 = require("./services/moderation-domain.service");
const comment_validator_service_1 = require("./services/comment-validator.service");
const lane_manager_service_1 = require("./services/lane-manager.service");
let DomainModule = class DomainModule {
};
exports.DomainModule = DomainModule;
exports.DomainModule = DomainModule = __decorate([
    (0, common_1.Module)({
        providers: [
            stream_domain_service_1.StreamDomainService,
            analytics_domain_service_1.AnalyticsDomainService,
            moderation_domain_service_1.ModerationDomainService,
            comment_validator_service_1.CommentValidator,
            lane_manager_service_1.LaneManager,
        ],
        exports: [
            stream_domain_service_1.StreamDomainService,
            analytics_domain_service_1.AnalyticsDomainService,
            moderation_domain_service_1.ModerationDomainService,
            comment_validator_service_1.CommentValidator,
            lane_manager_service_1.LaneManager,
        ],
    })
], DomainModule);
//# sourceMappingURL=domain.module.js.map