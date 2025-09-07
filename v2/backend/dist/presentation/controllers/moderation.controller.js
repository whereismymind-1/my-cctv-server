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
exports.ModerationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../guards/jwt-auth.guard");
const current_user_decorator_1 = require("../decorators/current-user.decorator");
const moderation_service_1 = require("../../application/services/moderation.service");
let ModerationController = class ModerationController {
    constructor(moderationService) {
        this.moderationService = moderationService;
    }
    async getModerationStats() {
        return await this.moderationService.getModerationStats();
    }
    async blockUser(user, dto) {
        const duration = dto.duration || 3600000;
        await this.moderationService.blockUser(dto.userId, duration);
        return { message: 'User blocked successfully' };
    }
    async unblockUser(user, userId) {
        await this.moderationService.unblockUser(userId);
        return { message: 'User unblocked successfully' };
    }
    async reportComment(user, dto) {
        await this.moderationService.reportComment(dto.commentId, user.id, dto.reason);
        return { message: 'Comment reported successfully' };
    }
    async getBannedWords() {
        const words = this.moderationService.getBannedWords();
        return { words };
    }
    async addBannedWord(user, dto) {
        this.moderationService.addBannedWord(dto.word);
        return { message: 'Banned word added successfully' };
    }
    async removeBannedWord(user, word) {
        this.moderationService.removeBannedWord(word);
        return { message: 'Banned word removed successfully' };
    }
};
exports.ModerationController = ModerationController;
__decorate([
    (0, common_1.Get)('stats'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Get moderation statistics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Moderation statistics retrieved' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ModerationController.prototype, "getModerationStats", null);
__decorate([
    (0, common_1.Post)('block'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Block a user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User blocked successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ModerationController.prototype, "blockUser", null);
__decorate([
    (0, common_1.Delete)('block/:userId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Unblock a user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User unblocked successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ModerationController.prototype, "unblockUser", null);
__decorate([
    (0, common_1.Post)('report'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Report a comment' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Comment reported successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ModerationController.prototype, "reportComment", null);
__decorate([
    (0, common_1.Get)('banned-words'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Get list of banned words' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Banned words retrieved' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ModerationController.prototype, "getBannedWords", null);
__decorate([
    (0, common_1.Post)('banned-words'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Add a banned word' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Banned word added successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ModerationController.prototype, "addBannedWord", null);
__decorate([
    (0, common_1.Delete)('banned-words/:word'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Remove a banned word' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Banned word removed successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('word')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ModerationController.prototype, "removeBannedWord", null);
exports.ModerationController = ModerationController = __decorate([
    (0, swagger_1.ApiTags)('moderation'),
    (0, common_1.Controller)('api/moderation'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [moderation_service_1.ModerationService])
], ModerationController);
//# sourceMappingURL=moderation.controller.js.map