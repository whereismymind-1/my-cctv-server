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
exports.StreamController = void 0;
const common_1 = require("@nestjs/common");
const stream_service_1 = require("../../application/services/stream.service");
const stream_dto_1 = require("../../application/dto/stream.dto");
const jwt_auth_guard_1 = require("../guards/jwt-auth.guard");
const public_decorator_1 = require("../decorators/public.decorator");
const current_user_decorator_1 = require("../decorators/current-user.decorator");
let StreamController = class StreamController {
    constructor(streamService) {
        this.streamService = streamService;
    }
    async getStreams(query) {
        return await this.streamService.getStreams(query);
    }
    async getStream(streamId, user) {
        return await this.streamService.getStream(streamId, user?.id);
    }
    async createStream(dto, user) {
        return await this.streamService.createStream(user.id, dto);
    }
    async updateStream(streamId, dto, user) {
        return await this.streamService.updateStream(streamId, user.id, dto);
    }
    async startStream(streamId, user) {
        await this.streamService.startStream(streamId, user.id);
        return {
            status: 'live',
            startedAt: new Date(),
        };
    }
    async endStream(streamId, user) {
        return await this.streamService.endStream(streamId, user.id);
    }
    async deleteStream(streamId, user) {
        await this.streamService.deleteStream(streamId, user.id);
    }
};
exports.StreamController = StreamController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [stream_dto_1.StreamQueryDto]),
    __metadata("design:returntype", Promise)
], StreamController.prototype, "getStreams", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], StreamController.prototype, "getStream", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [stream_dto_1.CreateStreamDto, Object]),
    __metadata("design:returntype", Promise)
], StreamController.prototype, "createStream", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, stream_dto_1.UpdateStreamDto, Object]),
    __metadata("design:returntype", Promise)
], StreamController.prototype, "updateStream", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(':id/start'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], StreamController.prototype, "startStream", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(':id/end'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], StreamController.prototype, "endStream", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], StreamController.prototype, "deleteStream", null);
exports.StreamController = StreamController = __decorate([
    (0, common_1.Controller)('api/streams'),
    __metadata("design:paramtypes", [stream_service_1.StreamService])
], StreamController);
//# sourceMappingURL=stream.controller.js.map