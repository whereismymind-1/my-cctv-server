import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment, CommentStyle } from '../../domain/entities/comment.entity';
import { ICommentRepository, CommentPagination, CommentFilter } from '../../domain/repositories/comment.repository.interface';
import { CommentEntity } from '../database/entities/comment.schema';

@Injectable()
export class CommentRepository implements ICommentRepository {
  constructor(
    @InjectRepository(CommentEntity)
    private readonly repository: Repository<CommentEntity>,
  ) {}

  async findById(id: string): Promise<Comment | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['user'],
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByStream(
    streamId: string,
    pagination?: CommentPagination,
  ): Promise<Comment[]> {
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

  async findByUser(userId: string, limit = 50): Promise<Comment[]> {
    const entities = await this.repository.find({
      where: { userId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
    return entities.map(entity => this.toDomain(entity));
  }

  async save(comment: Comment): Promise<Comment> {
    const entity = this.toEntity(comment);
    const saved = await this.repository.save(entity);
    const withRelations = await this.repository.findOne({
      where: { id: saved.id },
      relations: ['user'],
    });
    return this.toDomain(withRelations!);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async countByStream(streamId: string): Promise<number> {
    return await this.repository.count({ where: { streamId } });
  }

  async deleteByStream(streamId: string): Promise<void> {
    await this.repository.delete({ streamId });
  }

  async countByUser(userId: string): Promise<number> {
    return await this.repository.count({ where: { userId } });
  }

  async findAll(filter: CommentFilter, pagination?: CommentPagination): Promise<Comment[]> {
    const where: any = {};
    
    if (filter.streamId) where.streamId = filter.streamId;
    if (filter.userId) where.userId = filter.userId;
    if (filter.hasCommand !== undefined) {
      where.command = filter.hasCommand ? { $ne: null } : null;
    }
    if (filter.startTime || filter.endTime) {
      where.createdAt = {};
      if (filter.startTime) where.createdAt.$gte = filter.startTime;
      if (filter.endTime) where.createdAt.$lte = filter.endTime;
    }
    
    const options: any = { where };
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

  async saveMany(comments: Comment[]): Promise<Comment[]> {
    const entities = comments.map(comment => this.toEntity(comment));
    const saved = await this.repository.save(entities);
    return saved.map(entity => this.toDomain(entity));
  }

  async findByStreamAndTimeRange(
    streamId: string,
    startVpos: number,
    endVpos: number
  ): Promise<Comment[]> {
    const entities = await this.repository.find({
      where: {
        streamId,
        vpos: { $gte: startVpos, $lte: endVpos } as any,
      },
      order: { vpos: 'ASC' },
    });
    return entities.map(entity => this.toDomain(entity));
  }

  async findRecentByUser(userId: string, days: number): Promise<Comment[]> {
    const date = new Date();
    date.setDate(date.getDate() - days);
    
    const entities = await this.repository.find({
      where: {
        userId,
        createdAt: { $gte: date } as any,
      },
      order: { createdAt: 'DESC' },
    });
    return entities.map(entity => this.toDomain(entity));
  }

  async getCommentStats(streamId: string): Promise<any> {
    const comments = await this.repository.find({
      where: { streamId },
    });
    
    const uniqueUsers = new Set(comments.map(c => c.userId)).size;
    const commandCounts = new Map<string, number>();
    
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

  async getPopularComments(streamId: string, limit: number): Promise<Comment[]> {
    const entities = await this.repository.find({
      where: { streamId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
    return entities.map(entity => this.toDomain(entity));
  }

  async getCommentTimeline(streamId: string, intervalSeconds: number): Promise<Array<{
    timestamp: number;
    count: number;
  }>> {
    const comments = await this.repository.find({
      where: { streamId },
      order: { vpos: 'ASC' },
    });
    
    const timeline: Array<{ timestamp: number; count: number }> = [];
    const interval = intervalSeconds * 1000;
    
    if (comments.length === 0) return timeline;
    
    let currentInterval = 0;
    let count = 0;
    
    comments.forEach(comment => {
      const commentInterval = Math.floor(comment.vpos / interval);
      if (commentInterval > currentInterval) {
        timeline.push({ timestamp: currentInterval * interval, count });
        currentInterval = commentInterval;
        count = 1;
      } else {
        count++;
      }
    });
    
    if (count > 0) {
      timeline.push({ timestamp: currentInterval * interval, count });
    }
    
    return timeline;
  }

  async findReported(limit: number): Promise<Comment[]> {
    const entities = await this.repository.find({
      where: { isReported: true } as any,
      order: { createdAt: 'DESC' },
      take: limit,
    });
    return entities.map(entity => this.toDomain(entity));
  }

  async findByUserInStream(userId: string, streamId: string): Promise<Comment[]> {
    const entities = await this.repository.find({
      where: { userId, streamId },
      order: { createdAt: 'DESC' },
    });
    return entities.map(entity => this.toDomain(entity));
  }

  async markAsDeleted(id: string, reason: string): Promise<void> {
    await this.repository.update(id, {
      deletedAt: new Date(),
      deletedReason: reason,
    } as any);
  }

  private toDomain(entity: CommentEntity): Comment {
    // Parse command to get style
    const style = Comment.parseCommand(entity.command);
    
    // Create comment with basic info
    const comment = new Comment(
      entity.id,
      entity.streamId,
      entity.userId,
      entity.user?.username || 'Anonymous',
      entity.text,
      entity.command,
      style,
      0, // Lane will be assigned dynamically
      1280, // Default X position
      0, // Y will be calculated based on lane
      200, // Default speed
      4000, // Default duration
      entity.vpos || 0,
      entity.createdAt,
    );

    return comment;
  }

  private toEntity(domain: Comment): CommentEntity {
    const entity = new CommentEntity();
    if (domain.id) entity.id = domain.id;
    entity.streamId = domain.streamId;
    entity.userId = domain.userId || '';
    entity.text = domain.text;
    entity.command = domain.command || '';
    entity.vpos = domain.vpos;
    entity.createdAt = domain.createdAt;
    return entity;
  }
}