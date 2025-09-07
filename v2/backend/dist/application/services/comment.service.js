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
exports.CommentService = void 0;
const common_1 = require("@nestjs/common");
const comment_entity_1 = require("../../domain/entities/comment.entity");
const redis_service_1 = require("../../infrastructure/redis/redis.service");
const lane_manager_service_1 = require("../../domain/services/lane-manager.service");
const comment_validator_service_1 = require("../../domain/services/comment-validator.service");
const moderation_service_1 = require("./moderation.service");
let CommentService = class CommentService {
    constructor(commentRepository, streamRepository, redisService, moderationService) {
        this.commentRepository = commentRepository;
        this.streamRepository = streamRepository;
        this.redisService = redisService;
        this.moderationService = moderationService;
        this.laneManager = new lane_manager_service_1.LaneManager();
        this.commentValidator = new comment_validator_service_1.CommentValidator();
    }
    async sendComment(userId, username, dto) {
        const stream = await this.streamRepository.findById(dto.streamId);
        if (!stream) {
            throw new common_1.NotFoundException('Stream not found');
        }
        if (stream.status !== 'live') {
            throw new common_1.BadRequestException('Stream is not live');
        }
        if (!stream.canUserComment(userId)) {
            throw new common_1.ForbiddenException('Comments are not allowed');
        }
        if (userId) {
            const canSend = await this.redisService.checkRateLimit(userId, dto.streamId, 30, 60);
            if (!canSend) {
                throw new common_1.BadRequestException('Too many comments. Please wait.');
            }
        }
        const moderationResult = await this.moderationService.moderateComment(dto.text, userId, dto.streamId);
        if (!moderationResult.isAllowed) {
            throw new common_1.BadRequestException(moderationResult.reason || 'Comment not allowed');
        }
        const validation = this.commentValidator.validate(dto.text);
        if (!validation.isValid) {
            throw new common_1.BadRequestException(validation.errors.join(', '));
        }
        if (dto.command && !this.commentValidator.isValidCommand(dto.command)) {
            throw new common_1.BadRequestException('Invalid command format');
        }
        const sanitizedText = this.commentValidator.sanitize(dto.text);
        const comment = comment_entity_1.Comment.create(dto.streamId, userId, username, sanitizedText, dto.command ?? null, Date.now());
        const laneAssignment = this.laneManager.assignLane();
        const commentWithLane = comment.withLaneAssignment(laneAssignment.lane, laneAssignment.y);
        const saved = await this.commentRepository.save(commentWithLane);
        await this.redisService.addComment(dto.streamId, this.toResponseDto(saved));
        return this.toResponseDto(saved);
    }
    async getComments(streamId, limit = 100, offset = 0) {
        const stream = await this.streamRepository.findById(streamId);
        if (!stream) {
            throw new common_1.NotFoundException('Stream not found');
        }
        const comments = await this.commentRepository.findByStream(streamId, limit, offset);
        const total = await this.commentRepository.countByStream(streamId);
        return {
            comments: comments.map(c => this.toResponseDto(c)),
            total,
        };
    }
    async getRecentComments(streamId) {
        const recentComments = await this.redisService.getRecentComments(streamId);
        return recentComments;
    }
    async deleteComment(commentId, userId) {
        const comment = await this.commentRepository.findById(commentId);
        if (!comment) {
            throw new common_1.NotFoundException('Comment not found');
        }
        const stream = await this.streamRepository.findById(comment.streamId);
        if (!stream) {
            throw new common_1.NotFoundException('Stream not found');
        }
        if (comment.userId !== userId && stream.ownerId !== userId) {
            throw new common_1.ForbiddenException('You cannot delete this comment');
        }
        await this.commentRepository.delete(commentId);
    }
    toResponseDto(comment) {
        return {
            id: comment.id,
            text: comment.text,
            command: comment.command ?? undefined,
            user: {
                id: comment.userId || 'anonymous',
                username: comment.username,
                level: 1,
            },
            style: {
                position: comment.style.position,
                color: comment.style.color,
                size: comment.style.size,
            },
            lane: comment.lane,
            x: comment.x,
            y: comment.y,
            speed: comment.speed,
            duration: comment.duration,
            vpos: comment.vpos,
            createdAt: comment.createdAt,
        };
    }
};
exports.CommentService = CommentService;
exports.CommentService = CommentService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('ICommentRepository')),
    __param(1, (0, common_1.Inject)('IStreamRepository')),
    __metadata("design:paramtypes", [Object, Object, redis_service_1.RedisService,
        moderation_service_1.ModerationService])
], CommentService);
//# sourceMappingURL=comment.service.js.map