import { Comment, CommentType } from '../entities/Comment';

/**
 * 니코니코 스타일 댓글 레인 관리 서비스
 * 댓글 충돌을 방지하고 최적의 표시 위치를 계산
 */

export interface Lane {
  id: number;
  y: number;                    // Y 좌표
  height: number;               // 레인 높이
  comments: LaneComment[];      // 현재 레인의 댓글들
}

interface LaneComment {
  comment: Comment;
  startX: number;               // 시작 X 좌표
  endX: number;                 // 종료 X 좌표
  startTime: number;           // 시작 시간
  endTime: number;             // 종료 시간
  speed: number;               // 이동 속도 (px/ms)
}

export class CommentLaneManager {
  private lanes: Lane[] = [];
  private readonly canvasWidth: number;
  private readonly canvasHeight: number;
  private readonly laneHeight: number = 30;  // 기본 레인 높이
  private readonly margin: number = 5;        // 레인 간 여백

  constructor(canvasWidth: number = 1280, canvasHeight: number = 720) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.initializeLanes();
  }

  private initializeLanes(): void {
    const availableHeight = this.canvasHeight * 0.75;  // 화면의 75% 사용
    const laneCount = Math.floor(availableHeight / (this.laneHeight + this.margin));
    
    for (let i = 0; i < laneCount; i++) {
      this.lanes.push({
        id: i,
        y: i * (this.laneHeight + this.margin) + 50,  // 상단 50px 여백
        height: this.laneHeight,
        comments: [],
      });
    }
  }

  /**
   * 댓글에 최적의 레인 할당
   */
  public assignLane(comment: Comment): number {
    // 고정 댓글은 레인 할당 불필요
    if (comment.style.type !== CommentType.NORMAL) {
      return this.getFixedPosition(comment);
    }

    // 텍스트 너비 계산 (폰트 크기 고려)
    const textWidth = this.calculateTextWidth(comment);
    const speed = this.calculateSpeed(textWidth);
    
    const startTime = comment.timestamp;
    const endTime = startTime + comment.duration;
    const startX = this.canvasWidth;
    const endX = -textWidth;

    const laneComment: LaneComment = {
      comment,
      startX,
      endX,
      startTime,
      endTime,
      speed,
    };

    // 충돌 없는 레인 찾기
    const availableLane = this.findAvailableLane(laneComment);
    
    if (availableLane) {
      // 레인에 댓글 추가
      availableLane.comments.push(laneComment);
      
      // 오래된 댓글 정리
      this.cleanupOldComments(availableLane, startTime);
      
      return availableLane.id;
    }

    // 사용 가능한 레인이 없으면 가장 빈 레인 선택
    return this.findLeastCrowdedLane().id;
  }

  /**
   * 충돌 없는 레인 찾기
   */
  private findAvailableLane(newComment: LaneComment): Lane | null {
    for (const lane of this.lanes) {
      if (!this.hasCollision(lane, newComment)) {
        return lane;
      }
    }
    return null;
  }

  /**
   * 레인 내 충돌 체크
   */
  private hasCollision(lane: Lane, newComment: LaneComment): boolean {
    for (const existingComment of lane.comments) {
      // 시간이 겹치지 않으면 충돌 없음
      if (newComment.endTime < existingComment.startTime || 
          newComment.startTime > existingComment.endTime) {
        continue;
      }

      // 동일 시간대에 위치가 겹치는지 확인
      const newCommentX = this.getCommentPositionAtTime(
        newComment, 
        Math.max(newComment.startTime, existingComment.startTime)
      );
      
      const existingCommentX = this.getCommentPositionAtTime(
        existingComment,
        Math.max(newComment.startTime, existingComment.startTime)
      );

      const newCommentEndX = newCommentX - this.calculateTextWidth(newComment.comment);
      const existingCommentEndX = existingCommentX - this.calculateTextWidth(existingComment.comment);

      // X 좌표 충돌 체크 (여백 20px 고려)
      if (!(newCommentEndX > existingCommentX + 20 || 
            newCommentX < existingCommentEndX - 20)) {
        return true;  // 충돌 발생
      }
    }
    
    return false;
  }

  /**
   * 특정 시간의 댓글 위치 계산
   */
  private getCommentPositionAtTime(laneComment: LaneComment, time: number): number {
    const elapsed = time - laneComment.startTime;
    return laneComment.startX - (elapsed * laneComment.speed);
  }

  /**
   * 가장 여유있는 레인 찾기
   */
  private findLeastCrowdedLane(): Lane {
    let leastCrowded = this.lanes[0];
    let minComments = leastCrowded.comments.length;

    for (const lane of this.lanes) {
      if (lane.comments.length < minComments) {
        leastCrowded = lane;
        minComments = lane.comments.length;
      }
    }

    return leastCrowded;
  }

  /**
   * 오래된 댓글 정리
   */
  private cleanupOldComments(lane: Lane, currentTime: number): void {
    lane.comments = lane.comments.filter(
      comment => comment.endTime > currentTime - 1000  // 1초 여유
    );
  }

  /**
   * 고정 댓글 위치 계산
   */
  private getFixedPosition(comment: Comment): number {
    switch (comment.style.type) {
      case CommentType.TOP:
        return 0;  // 상단
      case CommentType.BOTTOM:
        return this.lanes.length - 1;  // 하단
      case CommentType.NAKA:
        return Math.floor(this.lanes.length / 2);  // 중앙
      default:
        return 0;
    }
  }

  /**
   * 텍스트 너비 계산 (근사치)
   */
  private calculateTextWidth(comment: Comment): number {
    const baseSize = comment.style.size === 'small' ? 12 : 
                    comment.style.size === 'big' ? 24 : 16;
    return comment.text.length * baseSize * 0.6;  // 대략적인 계산
  }

  /**
   * 댓글 이동 속도 계산
   */
  private calculateSpeed(textWidth: number): number {
    // 화면 너비 + 텍스트 너비를 4초에 통과
    const distance = this.canvasWidth + textWidth;
    return distance / 4000;  // px/ms
  }

  /**
   * 레인 Y 좌표 반환
   */
  public getLaneY(laneId: number): number {
    const lane = this.lanes.find(l => l.id === laneId);
    return lane ? lane.y : 0;
  }

  /**
   * 현재 활성 댓글 수 반환
   */
  public getActiveCommentCount(): number {
    return this.lanes.reduce((total, lane) => total + lane.comments.length, 0);
  }

  /**
   * 레인 상태 초기화
   */
  public reset(): void {
    this.lanes.forEach(lane => {
      lane.comments = [];
    });
  }
}