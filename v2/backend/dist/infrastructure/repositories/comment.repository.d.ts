import { Repository } from 'typeorm';
import { Comment } from '../../domain/entities/comment.entity';
import { ICommentRepository } from '../../domain/repositories/comment.repository.interface';
import { CommentEntity } from '../database/entities/comment.schema';
export declare class CommentRepository implements ICommentRepository {
    private readonly repository;
    constructor(repository: Repository<CommentEntity>);
    findById(id: string): Promise<Comment | null>;
    findByStream(streamId: string, limit?: number, offset?: number): Promise<Comment[]>;
    findByUser(userId: string, limit?: number): Promise<Comment[]>;
    save(comment: Comment): Promise<Comment>;
    delete(id: string): Promise<void>;
    countByStream(streamId: string): Promise<number>;
    deleteByStream(streamId: string): Promise<void>;
    private toDomain;
    private toEntity;
}
