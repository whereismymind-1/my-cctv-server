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
exports.StreamService = void 0;
const common_1 = require("@nestjs/common");
const stream_entity_1 = require("../../domain/entities/stream.entity");
const redis_service_1 = require("../../infrastructure/redis/redis.service");
let StreamService = class StreamService {
    constructor(streamRepository, redisService) {
        this.streamRepository = streamRepository;
        this.redisService = redisService;
    }
    async createStream(userId, dto) {
        const stream = stream_entity_1.Stream.create(userId, dto.title, dto.description, dto.settings);
        const saved = await this.streamRepository.save(stream);
        return this.toResponseDto(saved, userId);
    }
    async getStream(streamId, userId) {
        const cached = await this.redisService.getCachedStream(streamId);
        if (cached) {
            return cached;
        }
        const stream = await this.streamRepository.findById(streamId);
        if (!stream) {
            throw new common_1.NotFoundException('Stream not found');
        }
        const response = this.toResponseDto(stream, userId);
        await this.redisService.cacheStream(streamId, response);
        return response;
    }
    async getStreams(query) {
        const filter = {
            status: query.status,
            search: query.search,
        };
        const pagination = {
            page: query.page || 1,
            limit: query.limit || 20,
        };
        const result = await this.streamRepository.findAll(filter, pagination);
        return {
            streams: result.items.map(stream => this.toResponseDto(stream)),
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages,
        };
    }
    async updateStream(streamId, userId, dto) {
        const stream = await this.streamRepository.findById(streamId);
        if (!stream) {
            throw new common_1.NotFoundException('Stream not found');
        }
        if (stream.ownerId !== userId) {
            throw new common_1.ForbiddenException('You are not the owner of this stream');
        }
        if (dto.title)
            stream.title = dto.title;
        if (dto.description !== undefined)
            stream.description = dto.description;
        if (dto.thumbnail !== undefined)
            stream.thumbnailUrl = dto.thumbnail;
        if (dto.settings)
            stream.updateSettings(dto.settings);
        const updated = await this.streamRepository.update(stream);
        await this.redisService.invalidateStreamCache(streamId);
        return this.toResponseDto(updated, userId);
    }
    async startStream(streamId, userId) {
        const stream = await this.streamRepository.findById(streamId);
        if (!stream) {
            throw new common_1.NotFoundException('Stream not found');
        }
        if (stream.ownerId !== userId) {
            throw new common_1.ForbiddenException('You are not the owner of this stream');
        }
        try {
            stream.start();
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
        await this.streamRepository.update(stream);
        await this.redisService.invalidateStreamCache(streamId);
    }
    async endStream(streamId, userId) {
        const stream = await this.streamRepository.findById(streamId);
        if (!stream) {
            throw new common_1.NotFoundException('Stream not found');
        }
        if (stream.ownerId !== userId) {
            throw new common_1.ForbiddenException('You are not the owner of this stream');
        }
        try {
            stream.end();
        }
        catch (error) {
            throw new common_1.BadRequestException(error.message);
        }
        await this.streamRepository.update(stream);
        await this.redisService.invalidateStreamCache(streamId);
        const duration = stream.endedAt && stream.startedAt
            ? Math.floor((stream.endedAt.getTime() - stream.startedAt.getTime()) / 1000)
            : 0;
        const commentCount = (await this.redisService.getRecentComments(streamId)).length;
        return {
            status: stream.status,
            endedAt: stream.endedAt,
            duration,
            stats: {
                totalViewers: stream.maxViewers,
                peakViewers: stream.maxViewers,
                totalComments: commentCount,
            },
        };
    }
    async deleteStream(streamId, userId) {
        const stream = await this.streamRepository.findById(streamId);
        if (!stream) {
            throw new common_1.NotFoundException('Stream not found');
        }
        if (stream.ownerId !== userId) {
            throw new common_1.ForbiddenException('You are not the owner of this stream');
        }
        if (stream.status === 'live') {
            throw new common_1.BadRequestException('Cannot delete a live stream');
        }
        await this.streamRepository.delete(streamId);
        await this.redisService.invalidateStreamCache(streamId);
    }
    async updateViewerCount(streamId, count) {
        await this.streamRepository.updateViewerCount(streamId, count);
        await this.redisService.invalidateStreamCache(streamId);
    }
    toResponseDto(stream, currentUserId) {
        const isOwner = currentUserId === stream.ownerId;
        return {
            id: stream.id,
            title: stream.title,
            description: stream.description,
            thumbnail: stream.thumbnailUrl,
            owner: {
                id: stream.ownerId,
                username: 'TODO',
                avatar: null,
            },
            viewerCount: stream.viewerCount,
            status: stream.status,
            settings: isOwner ? stream.settings : undefined,
            streamKey: isOwner ? stream.streamKey : undefined,
            streamUrl: isOwner ? `rtmp://localhost/live/${stream.streamKey}` : undefined,
            createdAt: stream.createdAt,
            startedAt: stream.startedAt,
            endedAt: stream.endedAt,
        };
    }
};
exports.StreamService = StreamService;
exports.StreamService = StreamService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('IStreamRepository')),
    __metadata("design:paramtypes", [Object, redis_service_1.RedisService])
], StreamService);
//# sourceMappingURL=stream.service.js.map