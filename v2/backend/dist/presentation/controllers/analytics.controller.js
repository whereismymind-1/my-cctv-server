"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../guards/jwt-auth.guard");
const current_user_decorator_1 = require("../decorators/current-user.decorator");
const analytics_service_1 = require("../../application/services/analytics.service");
let AnalyticsController = class AnalyticsController {
    constructor(analyticsService) {
        this.analyticsService = analyticsService;
    }
    async trackEvent(user, dto) {
        await this.analyticsService.trackViewerEvent({
            userId: user?.id || null,
            streamId: dto.streamId,
            event: dto.event,
            timestamp: new Date(),
            metadata: dto.metadata,
        });
    }
    async getStreamAnalytics(streamId) {
        const metrics = await this.analyticsService.getStreamMetrics(streamId);
        return { success: true, data: metrics };
    }
    async getViewerAnalytics(userId, user) {
        if (userId !== user.id && user.role !== 'admin') {
            userId = user.id;
        }
        const analytics = await this.analyticsService.getViewerAnalytics(userId);
        return { success: true, data: analytics };
    }
    async getPlatformAnalytics(startDate, endDate) {
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
        const analytics = await this.analyticsService.getPlatformAnalytics(start, end);
        return { success: true, data: analytics };
    }
    async getDashboard() {
        const dashboard = await this.analyticsService.getRealTimeDashboard();
        return { success: true, data: dashboard };
    }
    async exportAnalytics(streamId, format = 'json', user) {
        const data = await this.analyticsService.exportAnalytics(streamId, format);
        return {
            success: true,
            data,
            format,
            filename: `analytics_${streamId}_${Date.now()}.${format}`,
        };
    }
};
exports.AnalyticsController = AnalyticsController;
__decorate([
    (0, common_1.Post)('track'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Track viewer event' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Event tracked successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "trackEvent", null);
__decorate([
    (0, common_1.Get)('stream/:streamId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get stream analytics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Stream analytics retrieved' }),
    __param(0, (0, common_1.Param)('streamId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getStreamAnalytics", null);
__decorate([
    (0, common_1.Get)('viewer/:userId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get viewer analytics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Viewer analytics retrieved' }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getViewerAnalytics", null);
__decorate([
    (0, common_1.Get)('platform'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get platform-wide analytics' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false, type: String }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Platform analytics retrieved' }),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getPlatformAnalytics", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get real-time dashboard data' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Dashboard data retrieved' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('export/:streamId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Export analytics data' }),
    (0, swagger_1.ApiQuery)({ name: 'format', required: false, enum: ['json', 'csv'] }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Analytics data exported' }),
    __param(0, (0, common_1.Param)('streamId')),
    __param(1, (0, common_1.Query)('format')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "exportAnalytics", null);
exports.AnalyticsController = AnalyticsController = __decorate([
    (0, swagger_1.ApiTags)('analytics'),
    (0, common_1.Controller)('api/analytics'),
    __metadata("design:paramtypes", [analytics_service_1.AnalyticsService])
], AnalyticsController);
//# sourceMappingURL=analytics.controller.js.map