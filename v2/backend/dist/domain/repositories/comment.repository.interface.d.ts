import { Comment } from '../entities/comment.entity';
export interface CommentFilter {
    streamId: string;
    userId?: string;
    limit?: number;
    offset?: number;
}
export interface ICommentRepository {
    findById(id: string): Promise<Comment | null>;
    findByStream(streamId: string, limit?: number, offset?: number): Promise<Comment[]>;
    findByUser(userId: string, limit?: number): Promise<Comment[]>;
    save(comment: Comment): Promise<Comment>;
    delete(id: string): Promise<void>;
    countByStream(streamId: string): Promise<number>;
    deleteByStream(streamId: string): Promise<void>;
}
