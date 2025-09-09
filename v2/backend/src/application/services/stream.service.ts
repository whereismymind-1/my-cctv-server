import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { Stream } from '../../domain/entities/stream.entity';
import { IStreamRepository } from '../../domain/repositories/stream.repository.interface';
import { RedisService } from '../../infrastructure/redis/redis.service';
import {
  CreateStreamDto,
  UpdateStreamDto,
  StreamQueryDto,
  StreamResponseDto,
} from '../dto/stream.dto';

@Injectable()
export class StreamService {
  constructor(
    @Inject('STREAM_REPOSITORY')
    private readonly streamRepository: IStreamRepository,
    private readonly redisService: RedisService,
  ) {}

  async createStream(
    userId: string,
    dto: CreateStreamDto,
  ): Promise<StreamResponseDto> {
    const stream = Stream.create(
      userId,
      dto.title,
      dto.description,
      dto.settings,
    );

    const saved = await this.streamRepository.save(stream);
    
    return this.toResponseDto(saved, userId);
  }

  async getStream(streamId: string, userId?: string): Promise<StreamResponseDto> {
    // Try to get from cache first
    const cached = await this.redisService.getCachedStream(streamId);
    if (cached) {
      return cached;
    }

    const stream = await this.streamRepository.findById(streamId);
    if (!stream) {
      throw new NotFoundException('Stream not found');
    }

    const response = this.toResponseDto(stream, userId);
    
    // Cache the response
    await this.redisService.cacheStream(streamId, response);
    
    return response;
  }

  async getStreams(query: StreamQueryDto) {
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

  async updateStream(
    streamId: string,
    userId: string,
    dto: UpdateStreamDto,
  ): Promise<StreamResponseDto> {
    const stream = await this.streamRepository.findById(streamId);
    if (!stream) {
      throw new NotFoundException('Stream not found');
    }

    if (stream.ownerId !== userId) {
      throw new ForbiddenException('You are not the owner of this stream');
    }

    // Update fields
    if (dto.title) stream.title = dto.title;
    if (dto.description !== undefined) stream.description = dto.description;
    if (dto.thumbnail !== undefined) stream.thumbnailUrl = dto.thumbnail;
    if (dto.settings) stream.updateSettings(dto.settings);

    const updated = await this.streamRepository.update(stream);
    
    // Invalidate cache
    await this.redisService.invalidateStreamCache(streamId);
    
    return this.toResponseDto(updated, userId);
  }

  async startStream(streamId: string, userId: string): Promise<void> {
    const stream = await this.streamRepository.findById(streamId);
    if (!stream) {
      throw new NotFoundException('Stream not found');
    }

    if (stream.ownerId !== userId) {
      throw new ForbiddenException('You are not the owner of this stream');
    }

    try {
      stream.start();
    } catch (error) {
      throw new BadRequestException(error.message);
    }

    await this.streamRepository.update(stream);
    await this.redisService.invalidateStreamCache(streamId);
  }

  async endStream(streamId: string, userId: string): Promise<{
    status: string;
    endedAt: Date;
    duration: number;
    stats: {
      totalViewers: number;
      peakViewers: number;
      totalComments: number;
    };
  }> {
    const stream = await this.streamRepository.findById(streamId);
    if (!stream) {
      throw new NotFoundException('Stream not found');
    }

    if (stream.ownerId !== userId) {
      throw new ForbiddenException('You are not the owner of this stream');
    }

    try {
      stream.end();
    } catch (error) {
      throw new BadRequestException(error.message);
    }

    await this.streamRepository.update(stream);
    await this.redisService.invalidateStreamCache(streamId);

    const duration = stream.endedAt && stream.startedAt
      ? Math.floor((stream.endedAt.getTime() - stream.startedAt.getTime()) / 1000)
      : 0;

    // Get stats from Redis (simplified for now)
    const commentCount = (await this.redisService.getRecentComments(streamId)).length;

    return {
      status: stream.status,
      endedAt: stream.endedAt!,
      duration,
      stats: {
        totalViewers: stream.maxViewers,
        peakViewers: stream.maxViewers,
        totalComments: commentCount,
      },
    };
  }

  async deleteStream(streamId: string, userId: string): Promise<void> {
    const stream = await this.streamRepository.findById(streamId);
    if (!stream) {
      throw new NotFoundException('Stream not found');
    }

    if (stream.ownerId !== userId) {
      throw new ForbiddenException('You are not the owner of this stream');
    }

    if (stream.status === 'live') {
      throw new BadRequestException('Cannot delete a live stream');
    }

    await this.streamRepository.delete(streamId);
    await this.redisService.invalidateStreamCache(streamId);
  }

  async updateViewerCount(streamId: string, count: number): Promise<void> {
    await this.streamRepository.updateViewerCount(streamId, count);
    await this.redisService.invalidateStreamCache(streamId);
  }

  private toResponseDto(
    stream: Stream,
    currentUserId?: string,
  ): StreamResponseDto {
    const isOwner = currentUserId === stream.ownerId;

    const isLive = stream.status === 'live';
    const hlsUrl = `http://localhost:8080/hls/${stream.streamKey}.m3u8`;

    return {
      id: stream.id,
      title: stream.title,
      description: stream.description ?? undefined,
      thumbnail: stream.thumbnailUrl ?? undefined,
      owner: {
        id: stream.ownerId,
        username: 'TODO', // Will be populated when we have user info
        avatar: undefined,
      },
      viewerCount: stream.viewerCount,
      status: stream.status as any,
      settings: isOwner ? stream.settings : undefined,
      streamKey: isOwner ? stream.streamKey : undefined,
      // Playback URL (HLS) is provided when live
      streamUrl: isLive ? hlsUrl : undefined,
      createdAt: stream.createdAt,
      startedAt: stream.startedAt ?? undefined,
      endedAt: stream.endedAt ?? undefined,
    };
  }
}
