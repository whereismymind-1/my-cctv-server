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
exports.StreamRepository = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const stream_entity_1 = require("../../domain/entities/stream.entity");
const stream_schema_1 = require("../database/entities/stream.schema");
let StreamRepository = class StreamRepository {
    constructor(repository) {
        this.repository = repository;
    }
    async findById(id) {
        const entity = await this.repository.findOne({
            where: { id },
            relations: ['owner'],
        });
        return entity ? this.toDomain(entity) : null;
    }
    async findByStreamKey(streamKey) {
        const entity = await this.repository.findOne({
            where: { streamKey },
            relations: ['owner'],
        });
        return entity ? this.toDomain(entity) : null;
    }
    async findAll(filter, pagination) {
        const page = pagination?.page || 1;
        const limit = pagination?.limit || 20;
        const skip = (page - 1) * limit;
        const where = {};
        if (filter?.status) {
            where.status = filter.status;
        }
        if (filter?.ownerId) {
            where.ownerId = filter.ownerId;
        }
        if (filter?.search) {
            where.title = (0, typeorm_2.Like)(`%${filter.search}%`);
        }
        const [entities, total] = await this.repository.findAndCount({
            where,
            relations: ['owner'],
            skip,
            take: limit,
            order: {
                createdAt: 'DESC',
            },
        });
        const items = entities.map(entity => this.toDomain(entity));
        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async save(stream) {
        const entity = this.toEntity(stream);
        const saved = await this.repository.save(entity);
        const withRelations = await this.repository.findOne({
            where: { id: saved.id },
            relations: ['owner'],
        });
        return this.toDomain(withRelations);
    }
    async update(stream) {
        const entity = this.toEntity(stream);
        const updated = await this.repository.save(entity);
        const withRelations = await this.repository.findOne({
            where: { id: updated.id },
            relations: ['owner'],
        });
        return this.toDomain(withRelations);
    }
    async delete(id) {
        await this.repository.delete(id);
    }
    async updateViewerCount(id, count) {
        await this.repository.update(id, {
            viewerCount: count,
            maxViewers: () => `GREATEST(max_viewers, ${count})`,
        });
    }
    async findActiveStreams() {
        const entities = await this.repository.find({
            where: { status: 'live' },
            relations: ['owner'],
        });
        return entities.map(entity => this.toDomain(entity));
    }
    toDomain(entity) {
        const settings = {
            allowComments: entity.allowComments,
            commentCooldown: entity.commentCooldown,
            maxCommentLength: entity.maxCommentLength,
            allowAnonymous: entity.allowAnonymous,
        };
        return new stream_entity_1.Stream(entity.id, entity.ownerId, entity.title, entity.description, entity.thumbnailUrl, entity.streamKey, entity.status, entity.viewerCount, entity.maxViewers, settings, entity.startedAt, entity.endedAt, entity.createdAt, entity.updatedAt);
    }
    toEntity(domain) {
        const entity = new stream_schema_1.StreamEntity();
        if (domain.id)
            entity.id = domain.id;
        entity.ownerId = domain.ownerId;
        entity.title = domain.title;
        entity.description = domain.description;
        entity.thumbnailUrl = domain.thumbnailUrl;
        entity.streamKey = domain.streamKey;
        entity.status = domain.status;
        entity.viewerCount = domain.viewerCount;
        entity.maxViewers = domain.maxViewers;
        entity.allowComments = domain.settings.allowComments;
        entity.commentCooldown = domain.settings.commentCooldown;
        entity.maxCommentLength = domain.settings.maxCommentLength;
        entity.allowAnonymous = domain.settings.allowAnonymous;
        entity.startedAt = domain.startedAt;
        entity.endedAt = domain.endedAt;
        entity.createdAt = domain.createdAt;
        entity.updatedAt = domain.updatedAt;
        return entity;
    }
};
exports.StreamRepository = StreamRepository;
exports.StreamRepository = StreamRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(stream_schema_1.StreamEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], StreamRepository);
//# sourceMappingURL=stream.repository.js.map