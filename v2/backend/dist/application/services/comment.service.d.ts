import { ICommentRepository } from '../../domain/repositories/comment.repository.interface';
import { IStreamRepository } from '../../domain/repositories/stream.repository.interface';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { ModerationService } from './moderation.service';
import { SendCommentDto, CommentResponseDto } from '../dto/comment.dto';
export declare class CommentService {
    private readonly commentRepository;
    private readonly streamRepository;
    private readonly redisService;
    private readonly moderationService;
    private laneManager;
    private commentValidator;
    constructor(commentRepository: ICommentRepository, streamRepository: IStreamRepository, redisService: RedisService, moderationService: ModerationService);
    sendComment(userId: string | null, username: string, dto: SendCommentDto): Promise<CommentResponseDto>;
    getComments(streamId: string, limit?: number, offset?: number): Promise<{
        comments: CommentResponseDto[];
        total: number;
    }>;
    getRecentComments(streamId: string): Promise<CommentResponseDto[]>;
    deleteComment(commentId: string, userId: string): Promise<void>;
    private toResponseDto;
}
