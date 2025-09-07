import { Comment } from '../entities/comment.entity';
export interface CommentFilter {
    streamId?: string;
    userId?: string;
    startTime?: Date;
    endTime?: Date;
    hasCommand?: boolean;
}
export interface CommentPagination {
    limit: number;
    offset: number;
    orderBy?: 'createdAt' | 'vpos';
    order?: 'ASC' | 'DESC';
}
export interface CommentStats {
    totalComments: number;
    uniqueUsers: number;
    commentsPerMinute: number;
    peakCommentsPerMinute: number;
    topCommands: Array<{
        command: string;
        count: number;
    }>;
}
export interface ICommentRepository {
    findById(id: string): Promise<Comment | null>;
    findAll(filter: CommentFilter, pagination?: CommentPagination): Promise<Comment[]>;
    save(comment: Comment): Promise<Comment>;
    saveMany(comments: Comment[]): Promise<Comment[]>;
    delete(id: string): Promise<void>;
    findByStream(streamId: string, pagination?: CommentPagination): Promise<Comment[]>;
    findByStreamAndTimeRange(streamId: string, startVpos: number, endVpos: number): Promise<Comment[]>;
    countByStream(streamId: string): Promise<number>;
    deleteByStream(streamId: string): Promise<void>;
    findByUser(userId: string, limit?: number): Promise<Comment[]>;
    findRecentByUser(userId: string, days: number): Promise<Comment[]>;
    countByUser(userId: string): Promise<number>;
    getCommentStats(streamId: string): Promise<CommentStats>;
    getPopularComments(streamId: string, limit: number): Promise<Comment[]>;
    getCommentTimeline(streamId: string, intervalSeconds: number): Promise<Array<{
        timestamp: number;
        count: number;
    }>>;
    findReported(limit: number): Promise<Comment[]>;
    findByUserInStream(userId: string, streamId: string): Promise<Comment[]>;
    markAsDeleted(id: string, reason: string): Promise<void>;
}
