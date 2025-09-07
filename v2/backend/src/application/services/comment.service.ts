import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Comment } from '../../domain/entities/comment.entity';
import { ICommentRepository } from '../../domain/repositories/comment.repository.interface';
import { IStreamRepository } from '../../domain/repositories/stream.repository.interface';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { LaneManager } from '../../domain/services/lane-manager.service';
import { CommentValidator } from '../../domain/services/comment-validator.service';
import { SendCommentDto, CommentResponseDto } from '../dto/comment.dto';

@Injectable()
export class CommentService {
  private laneManager: LaneManager;
  private commentValidator: CommentValidator;

  constructor(
    @Inject('ICommentRepository')
    private readonly commentRepository: ICommentRepository,
    @Inject('IStreamRepository')
    private readonly streamRepository: IStreamRepository,
    private readonly redisService: RedisService,
  ) {
    this.laneManager = new LaneManager();
    this.commentValidator = new CommentValidator();
  }

  async sendComment(
    userId: string | null,
    username: string,
    dto: SendCommentDto,
  ): Promise<CommentResponseDto> {
    // Check if stream exists and is live
    const stream = await this.streamRepository.findById(dto.streamId);
    if (!stream) {
      throw new NotFoundException('Stream not found');
    }

    if (stream.status !== 'live') {
      throw new BadRequestException('Stream is not live');
    }

    // Check if user can comment
    if (!stream.canUserComment(userId)) {
      throw new ForbiddenException('Comments are not allowed');
    }

    // Rate limiting
    if (userId) {
      const canSend = await this.redisService.checkRateLimit(
        userId,
        dto.streamId,
        30, // 30 comments per minute
        60,
      );
      if (!canSend) {
        throw new BadRequestException('Too many comments. Please wait.');
      }
    }

    // Validate comment text
    const validation = this.commentValidator.validate(dto.text);
    if (!validation.isValid) {
      throw new BadRequestException(validation.errors.join(', '));
    }

    // Validate command if provided
    if (dto.command && !this.commentValidator.isValidCommand(dto.command)) {
      throw new BadRequestException('Invalid command format');
    }

    // Sanitize text
    const sanitizedText = this.commentValidator.sanitize(dto.text);

    // Create comment
    const comment = Comment.create(
      dto.streamId,
      userId,
      username,
      sanitizedText,
      dto.command ?? null,
      Date.now(), // Current video position
    );

    // Assign lane
    const laneAssignment = this.laneManager.assignLane();
    const commentWithLane = comment.withLaneAssignment(
      laneAssignment.lane,
      laneAssignment.y,
    );

    // Save to database (optional, for replay)
    const saved = await this.commentRepository.save(commentWithLane);

    // Add to Redis for real-time display
    await this.redisService.addComment(dto.streamId, this.toResponseDto(saved));

    return this.toResponseDto(saved);
  }

  async getComments(
    streamId: string,
    limit = 100,
    offset = 0,
  ): Promise<{ comments: CommentResponseDto[]; total: number }> {
    // Check if stream exists
    const stream = await this.streamRepository.findById(streamId);
    if (!stream) {
      throw new NotFoundException('Stream not found');
    }

    // Get from database (historical comments)
    const comments = await this.commentRepository.findByStream(
      streamId,
      limit,
      offset,
    );
    const total = await this.commentRepository.countByStream(streamId);

    return {
      comments: comments.map(c => this.toResponseDto(c)),
      total,
    };
  }

  async getRecentComments(streamId: string): Promise<CommentResponseDto[]> {
    // Get from Redis (recent/live comments)
    const recentComments = await this.redisService.getRecentComments(streamId);
    return recentComments;
  }

  async deleteComment(commentId: string, userId: string): Promise<void> {
    const comment = await this.commentRepository.findById(commentId);
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Check if user owns the comment or is stream owner
    const stream = await this.streamRepository.findById(comment.streamId);
    if (!stream) {
      throw new NotFoundException('Stream not found');
    }

    if (comment.userId !== userId && stream.ownerId !== userId) {
      throw new ForbiddenException('You cannot delete this comment');
    }

    await this.commentRepository.delete(commentId);
  }

  private toResponseDto(comment: Comment): CommentResponseDto {
    return {
      id: comment.id,
      text: comment.text,
      command: comment.command ?? undefined,
      user: {
        id: comment.userId || 'anonymous',
        username: comment.username,
        level: 1, // TODO: Get from user entity
      },
      style: {
        position: comment.style.position,
        color: comment.style.color,
        size: comment.style.size,
      },
      lane: comment.lane,
      x: comment.x,
      y: comment.y,
      speed: comment.speed,
      duration: comment.duration,
      vpos: comment.vpos,
      createdAt: comment.createdAt,
    };
  }
}