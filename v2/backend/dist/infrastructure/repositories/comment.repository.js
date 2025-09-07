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
exports.CommentRepository = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const comment_entity_1 = require("../../domain/entities/comment.entity");
const comment_schema_1 = require("../database/entities/comment.schema");
let CommentRepository = class CommentRepository {
    constructor(repository) {
        this.repository = repository;
    }
    async findById(id) {
        const entity = await this.repository.findOne({
            where: { id },
            relations: ['user'],
        });
        return entity ? this.toDomain(entity) : null;
    }
    async findByStream(streamId, pagination) {
        const limit = pagination?.limit || 100;
        const offset = pagination?.offset || 0;
        const orderBy = pagination?.orderBy || 'createdAt';
        const order = pagination?.order || 'DESC';
        const entities = await this.repository.find({
            where: { streamId },
            relations: ['user'],
            order: { [orderBy]: order },
            take: limit,
            skip: offset,
        });
        return entities.map(entity => this.toDomain(entity));
    }
    async findByUser(userId, limit = 50) {
        const entities = await this.repository.find({
            where: { userId },
            relations: ['user'],
            order: { createdAt: 'DESC' },
            take: limit,
        });
        return entities.map(entity => this.toDomain(entity));
    }
    async save(comment) {
        const entity = this.toEntity(comment);
        const saved = await this.repository.save(entity);
        const withRelations = await this.repository.findOne({
            where: { id: saved.id },
            relations: ['user'],
        });
        return this.toDomain(withRelations);
    }
    async delete(id) {
        await this.repository.delete(id);
    }
    async countByStream(streamId) {
        return await this.repository.count({ where: { streamId } });
    }
    async deleteByStream(streamId) {
        await this.repository.delete({ streamId });
    }
    async countByUser(userId) {
        return await this.repository.count({ where: { userId } });
    }
    async findAll(filter, pagination) {
        const where = {};
        if (filter.streamId)
            where.streamId = filter.streamId;
        if (filter.userId)
            where.userId = filter.userId;
        if (filter.hasCommand !== undefined) {
            where.command = filter.hasCommand ? { $ne: null } : null;
        }
        if (filter.startTime || filter.endTime) {
            where.createdAt = {};
            if (filter.startTime)
                where.createdAt.$gte = filter.startTime;
            if (filter.endTime)
                where.createdAt.$lte = filter.endTime;
        }
        const options = { where };
        if (pagination) {
            options.take = pagination.limit;
            options.skip = pagination.offset;
            options.order = {
                [pagination.orderBy || 'createdAt']: pagination.order || 'ASC'
            };
        }
        const entities = await this.repository.find(options);
        return entities.map(entity => this.toDomain(entity));
    }
    async saveMany(comments) {
        const entities = comments.map(comment => this.toEntity(comment));
        const saved = await this.repository.save(entities);
        return saved.map(entity => this.toDomain(entity));
    }
    async findByStreamAndTimeRange(streamId, startVpos, endVpos) {
        const entities = await this.repository.find({
            where: {
                streamId,
                vpos: { $gte: startVpos, $lte: endVpos },
            },
            order: { vpos: 'ASC' },
        });
        return entities.map(entity => this.toDomain(entity));
    }
    async findRecentByUser(userId, days) {
        const date = new Date();
        date.setDate(date.getDate() - days);
        const entities = await this.repository.find({
            where: {
                userId,
                createdAt: { $gte: date },
            },
            order: { createdAt: 'DESC' },
        });
        return entities.map(entity => this.toDomain(entity));
    }
    async getCommentStats(streamId) {
        const comments = await this.repository.find({
            where: { streamId },
        });
        const uniqueUsers = new Set(comments.map(c => c.userId)).size;
        const commandCounts = new Map();
        comments.forEach(c => {
            if (c.command) {
                commandCounts.set(c.command, (commandCounts.get(c.command) || 0) + 1);
            }
        });
        const topCommands = Array.from(commandCounts.entries())
            .map(([command, count]) => ({ command, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        return {
            totalComments: comments.length,
            uniqueUsers,
            commentsPerMinute: 0,
            peakCommentsPerMinute: 0,
            topCommands,
        };
    }
    async getPopularComments(streamId, limit) {
        const entities = await this.repository.find({
            where: { streamId },
            order: { createdAt: 'DESC' },
            take: limit,
        });
        return entities.map(entity => this.toDomain(entity));
    }
    async getCommentTimeline(streamId, intervalSeconds) {
        const comments = await this.repository.find({
            where: { streamId },
            order: { vpos: 'ASC' },
        });
        const timeline = [];
        const interval = intervalSeconds * 1000;
        if (comments.length === 0)
            return timeline;
        let currentInterval = 0;
        let count = 0;
        comments.forEach(comment => {
            const commentInterval = Math.floor(comment.vpos / interval);
            if (commentInterval > currentInterval) {
                timeline.push({ timestamp: currentInterval * interval, count });
                currentInterval = commentInterval;
                count = 1;
            }
            else {
                count++;
            }
        });
        if (count > 0) {
            timeline.push({ timestamp: currentInterval * interval, count });
        }
        return timeline;
    }
    async findReported(limit) {
        const entities = await this.repository.find({
            where: { isReported: true },
            order: { createdAt: 'DESC' },
            take: limit,
        });
        return entities.map(entity => this.toDomain(entity));
    }
    async findByUserInStream(userId, streamId) {
        const entities = await this.repository.find({
            where: { userId, streamId },
            order: { createdAt: 'DESC' },
        });
        return entities.map(entity => this.toDomain(entity));
    }
    async markAsDeleted(id, reason) {
        await this.repository.update(id, {
            deletedAt: new Date(),
            deletedReason: reason,
        });
    }
    toDomain(entity) {
        const style = comment_entity_1.Comment.parseCommand(entity.command);
        const comment = new comment_entity_1.Comment(entity.id, entity.streamId, entity.userId, entity.user?.username || 'Anonymous', entity.text, entity.command, style, 0, 1280, 0, 200, 4000, entity.vpos || 0, entity.createdAt);
        return comment;
    }
    toEntity(domain) {
        const entity = new comment_schema_1.CommentEntity();
        if (domain.id)
            entity.id = domain.id;
        entity.streamId = domain.streamId;
        entity.userId = domain.userId || '';
        entity.text = domain.text;
        entity.command = domain.command || '';
        entity.vpos = domain.vpos;
        entity.createdAt = domain.createdAt;
        return entity;
    }
};
exports.CommentRepository = CommentRepository;
exports.CommentRepository = CommentRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(comment_schema_1.CommentEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], CommentRepository);
//# sourceMappingURL=comment.repository.js.map