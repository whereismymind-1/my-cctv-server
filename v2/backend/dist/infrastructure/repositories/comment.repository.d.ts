import { Repository } from 'typeorm';
import { Comment } from '../../domain/entities/comment.entity';
import { ICommentRepository, CommentPagination, CommentFilter } from '../../domain/repositories/comment.repository.interface';
import { CommentEntity } from '../database/entities/comment.schema';
export declare class CommentRepository implements ICommentRepository {
    private readonly repository;
    constructor(repository: Repository<CommentEntity>);
    findById(id: string): Promise<Comment | null>;
    findByStream(streamId: string, pagination?: CommentPagination): Promise<Comment[]>;
    findByUser(userId: string, limit?: number): Promise<Comment[]>;
    save(comment: Comment): Promise<Comment>;
    delete(id: string): Promise<void>;
    countByStream(streamId: string): Promise<number>;
    deleteByStream(streamId: string): Promise<void>;
    countByUser(userId: string): Promise<number>;
    findAll(filter: CommentFilter, pagination?: CommentPagination): Promise<Comment[]>;
    saveMany(comments: Comment[]): Promise<Comment[]>;
    findByStreamAndTimeRange(streamId: string, startVpos: number, endVpos: number): Promise<Comment[]>;
    findRecentByUser(userId: string, days: number): Promise<Comment[]>;
    getCommentStats(streamId: string): Promise<any>;
    getPopularComments(streamId: string, limit: number): Promise<Comment[]>;
    getCommentTimeline(streamId: string, intervalSeconds: number): Promise<Array<{
        timestamp: number;
        count: number;
    }>>;
    findReported(limit: number): Promise<Comment[]>;
    findByUserInStream(userId: string, streamId: string): Promise<Comment[]>;
    markAsDeleted(id: string, reason: string): Promise<void>;
    private toDomain;
    private toEntity;
}
