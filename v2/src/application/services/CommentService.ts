import { ID, Result } from '@shared/types';
import { Comment, CommentStyle, CommentType } from '@domain/entities/Comment';
import { Room } from '@domain/entities/Room';
import { CommentLaneManager } from '@domain/services/CommentLaneManager';
import { WebSocketServer } from '@infrastructure/websocket/WebSocketServer';

/**
 * 댓글 애플리케이션 서비스
 * 댓글 처리의 전체 워크플로우를 관리
 */

export interface SendCommentDTO {
  roomId: ID;
  userId: ID;
  text: string;
  style?: Partial<CommentStyle>;
  command?: string;  // 니코니코 스타일 명령어 (예: "ue red big")
}

export interface CommentDTO {
  id: ID;
  roomId: ID;
  text: string;
  style: CommentStyle;
  x: number;
  y: number;
  lane: number;
  duration: number;
  timestamp: number;
  username?: string;
  userLevel?: number;
}

export class CommentService {
  private rooms: Map<ID, Room> = new Map();
  private laneManagers: Map<ID, CommentLaneManager> = new Map();
  private commentHistory: Map<ID, Comment[]> = new Map();
  private userCooldowns: Map<string, number> = new Map();  // userId-roomId -> timestamp

  constructor(
    private readonly wsServer: WebSocketServer
  ) {}

  /**
   * 댓글 전송 처리
   */
  public async sendComment(dto: SendCommentDTO): Promise<Result<CommentDTO>> {
    try {
      // 1. 방 확인
      const room = this.rooms.get(dto.roomId);
      if (!room) {
        return { success: false, error: new Error('Room not found') };
      }

      if (!room.isLive) {
        return { success: false, error: new Error('Room is not live') };
      }

      // 2. 쿨다운 체크
      const cooldownKey = `${dto.userId}-${dto.roomId}`;
      const lastCommentTime = this.userCooldowns.get(cooldownKey);
      const now = Date.now();

      if (lastCommentTime && now - lastCommentTime < room.settings.commentCooldown) {
        return { 
          success: false, 
          error: new Error(`Cooldown: ${room.settings.commentCooldown - (now - lastCommentTime)}ms`) 
        };
      }

      // 3. 스타일 파싱 (니코니코 명령어 처리)
      const style = this.parseCommentStyle(dto.command, dto.style);

      // 4. 댓글 생성
      const comment = new Comment({
        id: this.generateCommentId(),
        roomId: dto.roomId,
        text: dto.text,
        style,
        position: { x: 0, y: 0 },  // 임시 위치
        metadata: {
          userId: dto.userId,
          username: `User_${dto.userId.substr(0, 6)}`,  // 실제로는 DB에서 조회
          userLevel: 1,
          isPremium: false,
        },
        timestamp: now,
      });

      // 5. 레인 할당
      const laneManager = this.getLaneManager(dto.roomId);
      const laneId = laneManager.assignLane(comment);
      comment.position.lane = laneId;
      comment.position.y = laneManager.getLaneY(laneId);

      // 6. 초기 X 위치 설정
      if (comment.style.type === CommentType.NORMAL) {
        comment.position.x = 1280;  // 화면 오른쪽 밖
        comment.position.speed = (1280 + this.calculateTextWidth(comment)) / comment.duration;
      } else {
        comment.position.x = 640;  // 화면 중앙 (고정 댓글)
      }

      // 7. 방에 댓글 추가
      room.addComment(comment);

      // 8. 히스토리 저장
      this.addToHistory(dto.roomId, comment);

      // 9. 쿨다운 업데이트
      this.userCooldowns.set(cooldownKey, now);

      // 10. 브로드캐스트
      const commentDTO = this.toCommentDTO(comment);
      this.broadcastComment(dto.roomId, commentDTO);

      return { success: true, value: commentDTO };

    } catch (error) {
      console.error('Error sending comment:', error);
      return { success: false, error: error as Error };
    }
  }

  /**
   * 니코니코 스타일 명령어 파싱
   */
  private parseCommentStyle(command?: string, customStyle?: Partial<CommentStyle>): CommentStyle {
    const defaultStyle: CommentStyle = {
      type: CommentType.NORMAL,
      size: 'medium',
      color: '#FFFFFF',
      opacity: 1,
      border: false,
      shadow: false,
    };

    if (!command) {
      return { ...defaultStyle, ...customStyle };
    }

    // 명령어 파싱 (예: "ue red big")
    const commands = command.toLowerCase().split(' ');
    const style = { ...defaultStyle };

    commands.forEach(cmd => {
      // 위치 명령
      if (cmd === 'ue' || cmd === 'top') style.type = CommentType.TOP;
      if (cmd === 'shita' || cmd === 'bottom') style.type = CommentType.BOTTOM;
      if (cmd === 'naka' || cmd === 'center') style.type = CommentType.NAKA;

      // 크기 명령
      if (cmd === 'small') style.size = 'small';
      if (cmd === 'big') style.size = 'big';

      // 색상 명령
      if (cmd === 'red') style.color = '#FF0000';
      if (cmd === 'pink') style.color = '#FF8080';
      if (cmd === 'orange') style.color = '#FFC000';
      if (cmd === 'yellow') style.color = '#FFFF00';
      if (cmd === 'green') style.color = '#00FF00';
      if (cmd === 'cyan') style.color = '#00FFFF';
      if (cmd === 'blue') style.color = '#0000FF';
      if (cmd === 'purple') style.color = '#C000FF';
      if (cmd === 'black') style.color = '#000000';

      // 프리미엄 명령
      if (cmd === 'shadow') style.shadow = true;
      if (cmd === 'border') style.border = true;
    });

    return { ...style, ...customStyle };
  }

  /**
   * 텍스트 너비 계산 (근사치)
   */
  private calculateTextWidth(comment: Comment): number {
    const baseSize = comment.style.size === 'small' ? 12 : 
                    comment.style.size === 'big' ? 24 : 16;
    return comment.text.length * baseSize * 0.6;
  }

  /**
   * 댓글 브로드캐스트
   */
  private broadcastComment(roomId: ID, comment: CommentDTO): void {
    this.wsServer.broadcastToRoom(roomId, {
      type: 'new_comment',
      timestamp: Date.now(),
      data: comment,
    });
  }

  /**
   * 댓글 DTO 변환
   */
  private toCommentDTO(comment: Comment): CommentDTO {
    return {
      id: comment.id,
      roomId: comment.roomId,
      text: comment.text,
      style: comment.style,
      x: comment.position.x,
      y: comment.position.y,
      lane: comment.position.lane || 0,
      duration: comment.duration,
      timestamp: comment.timestamp,
      username: comment.metadata.username,
      userLevel: comment.metadata.userLevel,
    };
  }

  /**
   * 레인 매니저 획득
   */
  private getLaneManager(roomId: ID): CommentLaneManager {
    if (!this.laneManagers.has(roomId)) {
      this.laneManagers.set(roomId, new CommentLaneManager());
    }
    return this.laneManagers.get(roomId)!;
  }

  /**
   * 히스토리 관리
   */
  private addToHistory(roomId: ID, comment: Comment): void {
    if (!this.commentHistory.has(roomId)) {
      this.commentHistory.set(roomId, []);
    }
    
    const history = this.commentHistory.get(roomId)!;
    history.push(comment);

    // 최대 1000개까지만 보관
    if (history.length > 1000) {
      history.shift();
    }
  }

  /**
   * 방 등록
   */
  public registerRoom(room: Room): void {
    this.rooms.set(room.id, room);
    this.laneManagers.set(room.id, new CommentLaneManager());
    this.commentHistory.set(room.id, []);
  }

  /**
   * 방 제거
   */
  public unregisterRoom(roomId: ID): void {
    this.rooms.delete(roomId);
    this.laneManagers.delete(roomId);
    this.commentHistory.delete(roomId);
    
    // 해당 방의 쿨다운 정리
    Array.from(this.userCooldowns.keys())
      .filter(key => key.endsWith(`-${roomId}`))
      .forEach(key => this.userCooldowns.delete(key));
  }

  /**
   * 댓글 히스토리 조회
   */
  public getCommentHistory(roomId: ID, limit: number = 100): CommentDTO[] {
    const history = this.commentHistory.get(roomId) || [];
    return history
      .slice(-limit)
      .map(comment => this.toCommentDTO(comment));
  }

  /**
   * 댓글 삭제
   */
  public deleteComment(roomId: ID, commentId: ID): Result<void> {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, error: new Error('Room not found') };
    }

    room.deleteComment(commentId);

    // 삭제 알림 브로드캐스트
    this.wsServer.broadcastToRoom(roomId, {
      type: 'comment_deleted',
      timestamp: Date.now(),
      data: { commentId },
    });

    return { success: true, value: undefined };
  }

  /**
   * 통계 조회
   */
  public getStatistics(roomId: ID) {
    const room = this.rooms.get(roomId);
    const laneManager = this.laneManagers.get(roomId);
    const history = this.commentHistory.get(roomId) || [];

    return {
      totalComments: room?.statistics.totalComments || 0,
      activeComments: laneManager?.getActiveCommentCount() || 0,
      historyCount: history.length,
      commentsPerMinute: room?.statistics.commentsPerMinute || 0,
    };
  }

  private generateCommentId(): ID {
    return `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}