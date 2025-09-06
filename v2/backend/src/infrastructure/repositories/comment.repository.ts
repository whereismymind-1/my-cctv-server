import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment, CommentStyle } from '../../domain/entities/comment.entity';
import { ICommentRepository } from '../../domain/repositories/comment.repository.interface';
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
    limit = 100,
    offset = 0,
  ): Promise<Comment[]> {
    const entities = await this.repository.find({
      where: { streamId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
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
    entity.userId = domain.userId;
    entity.text = domain.text;
    entity.command = domain.command;
    entity.vpos = domain.vpos;
    entity.createdAt = domain.createdAt;
    return entity;
  }
}