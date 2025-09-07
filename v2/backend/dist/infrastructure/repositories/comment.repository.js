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
    async findByStream(streamId, limit = 100, offset = 0) {
        const entities = await this.repository.find({
            where: { streamId },
            relations: ['user'],
            order: { createdAt: 'DESC' },
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