import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindManyOptions } from 'typeorm';
import { Stream, StreamSettings } from '../../domain/entities/stream.entity';
import {
  IStreamRepository,
  StreamFilter,
  PaginationOptions,
  PaginatedResult,
} from '../../domain/repositories/stream.repository.interface';
import { StreamEntity } from '../database/entities/stream.schema';

@Injectable()
export class StreamRepository implements IStreamRepository {
  constructor(
    @InjectRepository(StreamEntity)
    private readonly repository: Repository<StreamEntity>,
  ) {}

  async findById(id: string): Promise<Stream | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['owner'],
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByStreamKey(streamKey: string): Promise<Stream | null> {
    const entity = await this.repository.findOne({
      where: { streamKey },
      relations: ['owner'],
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(
    filter?: StreamFilter,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<Stream>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (filter?.status) {
      where.status = filter.status;
    }
    
    if (filter?.ownerId) {
      where.ownerId = filter.ownerId;
    }
    
    if (filter?.search) {
      where.title = Like(`%${filter.search}%`);
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

  async save(stream: Stream): Promise<Stream> {
    const entity = this.toEntity(stream);
    const saved = await this.repository.save(entity);
    const withRelations = await this.repository.findOne({
      where: { id: saved.id },
      relations: ['owner'],
    });
    return this.toDomain(withRelations!);
  }

  async update(stream: Stream): Promise<Stream> {
    const entity = this.toEntity(stream);
    const updated = await this.repository.save(entity);
    const withRelations = await this.repository.findOne({
      where: { id: updated.id },
      relations: ['owner'],
    });
    return this.toDomain(withRelations!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async updateViewerCount(id: string, count: number): Promise<void> {
    await this.repository.update(id, {
      viewerCount: count,
      maxViewers: () => `GREATEST(max_viewers, ${count})`,
    } as any);
  }

  async findActiveStreams(): Promise<Stream[]> {
    const entities = await this.repository.find({
      where: { status: 'live' },
      relations: ['owner'],
    });
    return entities.map(entity => this.toDomain(entity));
  }

  async findByOwner(ownerId: string, includeEnded?: boolean): Promise<Stream[]> {
    const where: any = { ownerId };
    if (!includeEnded) {
      where.status = 'live';
    }
    
    const entities = await this.repository.find({
      where,
      relations: ['owner'],
      order: { createdAt: 'DESC' },
    });
    return entities.map(entity => this.toDomain(entity));
  }

  async findRecentStreams(days: number, limit?: number): Promise<Stream[]> {
    const date = new Date();
    date.setDate(date.getDate() - days);
    
    const query = this.repository.createQueryBuilder('stream')
      .leftJoinAndSelect('stream.owner', 'owner')
      .where('stream.createdAt >= :date', { date })
      .orderBy('stream.createdAt', 'DESC');
    
    if (limit) {
      query.limit(limit);
    }
    
    const entities = await query.getMany();
    return entities.map(entity => this.toDomain(entity));
  }

  async countActiveStreamsByOwner(ownerId: string): Promise<number> {
    return await this.repository.count({
      where: { ownerId, status: 'live' },
    });
  }

  async updateStreamStatus(id: string, status: 'waiting' | 'live' | 'ended'): Promise<void> {
    await this.repository.update(id, { status });
  }

  async getStreamStats(id: string): Promise<any> {
    const stream = await this.repository.findOne({ where: { id } });
    if (!stream) return null;
    
    return {
      totalViewers: stream.viewerCount,
      peakViewers: stream.maxViewers,
      duration: stream.endedAt && stream.startedAt ? 
        (stream.endedAt.getTime() - stream.startedAt.getTime()) / 1000 : 0,
      status: stream.status,
    };
  }

  async incrementViewerCount(id: string): Promise<void> {
    await this.repository.increment({ id }, 'viewerCount', 1);
    await this.repository.query(
      `UPDATE stream_entity SET max_viewers = GREATEST(max_viewers, viewer_count) WHERE id = $1`,
      [id]
    );
  }

  async decrementViewerCount(id: string): Promise<void> {
    await this.repository.decrement({ id }, 'viewerCount', 1);
  }

  async searchStreams(searchTerm: string, limit?: number): Promise<Stream[]> {
    const query = this.repository.createQueryBuilder('stream')
      .leftJoinAndSelect('stream.owner', 'owner')
      .where('stream.title ILIKE :search OR stream.description ILIKE :search', { 
        search: `%${searchTerm}%` 
      })
      .orderBy('stream.viewerCount', 'DESC');
    
    if (limit) {
      query.limit(limit);
    }
    
    const entities = await query.getMany();
    return entities.map(entity => this.toDomain(entity));
  }

  async getPopularStreams(limit: number): Promise<Stream[]> {
    const entities = await this.repository.find({
      where: { status: 'live' },
      relations: ['owner'],
      order: { viewerCount: 'DESC' },
      take: limit,
    });
    return entities.map(entity => this.toDomain(entity));
  }

  async recordStreamStart(id: string): Promise<void> {
    await this.repository.update(id, {
      status: 'live',
      startedAt: new Date(),
    });
  }

  async recordStreamEnd(id: string, stats: any): Promise<void> {
    await this.repository.update(id, {
      status: 'ended',
      endedAt: new Date(),
      maxViewers: stats.peakViewers || 0,
    });
  }

  async getOwnerStreamHistory(ownerId: string, days: number): Promise<Stream[]> {
    const date = new Date();
    date.setDate(date.getDate() - days);
    
    const entities = await this.repository.find({
      where: {
        ownerId,
        createdAt: { $gte: date } as any,
      },
      relations: ['owner'],
      order: { createdAt: 'DESC' },
    });
    return entities.map(entity => this.toDomain(entity));
  }

  async getMostViewedStreams(limit: number, timeRange?: number): Promise<Stream[]> {
    let where: any = {};
    
    if (timeRange) {
      const date = new Date();
      date.setDate(date.getDate() - timeRange);
      where.createdAt = { $gte: date };
    }
    
    const entities = await this.repository.find({
      where,
      relations: ['owner'],
      order: { maxViewers: 'DESC' },
      take: limit,
    });
    return entities.map(entity => this.toDomain(entity));
  }

  private toDomain(entity: StreamEntity): Stream {
    const settings: StreamSettings = {
      allowComments: entity.allowComments,
      commentCooldown: entity.commentCooldown,
      maxCommentLength: entity.maxCommentLength,
      allowAnonymous: entity.allowAnonymous,
    };

    return new Stream(
      entity.id,
      entity.ownerId,
      entity.title,
      entity.description,
      entity.thumbnailUrl,
      entity.streamKey,
      entity.status as any,
      entity.viewerCount,
      entity.maxViewers,
      settings,
      entity.startedAt,
      entity.endedAt,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  private toEntity(domain: Stream): StreamEntity {
    const entity = new StreamEntity();
    if (domain.id) entity.id = domain.id;
    entity.ownerId = domain.ownerId;
    entity.title = domain.title;
    entity.description = domain.description || '';
    entity.thumbnailUrl = domain.thumbnailUrl || '';
    entity.streamKey = domain.streamKey;
    entity.status = domain.status;
    entity.viewerCount = domain.viewerCount;
    entity.maxViewers = domain.maxViewers;
    entity.allowComments = domain.settings.allowComments;
    entity.commentCooldown = domain.settings.commentCooldown;
    entity.maxCommentLength = domain.settings.maxCommentLength;
    entity.allowAnonymous = domain.settings.allowAnonymous;
    entity.startedAt = domain.startedAt || new Date(0);
    entity.endedAt = domain.endedAt || new Date(0);
    entity.createdAt = domain.createdAt;
    entity.updatedAt = domain.updatedAt;
    return entity;
  }
}