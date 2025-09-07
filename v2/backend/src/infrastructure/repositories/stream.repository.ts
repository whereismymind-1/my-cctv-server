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