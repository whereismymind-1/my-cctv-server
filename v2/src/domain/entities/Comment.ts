import { ID, Timestamp } from '@shared/types';

/**
 * 니코니코 스타일 댓글 엔티티
 */

// 댓글 타입 (니코니코 스타일)
export enum CommentType {
  NORMAL = 'normal',      // 일반 유동 댓글 (오른쪽→왼쪽)
  TOP = 'top',           // 상단 고정 댓글
  BOTTOM = 'bottom',     // 하단 고정 댓글
  NAKA = 'naka',         // 중앙 표시 (중요 공지)
}

// 댓글 크기
export enum CommentSize {
  SMALL = 'small',       // 작은 크기 (75%)
  MEDIUM = 'medium',     // 중간 크기 (100%)
  BIG = 'big',          // 큰 크기 (150%)
}

// 댓글 색상 (니코니코 기본 색상)
export enum CommentColor {
  WHITE = '#FFFFFF',
  RED = '#FF0000',
  PINK = '#FF8080',
  ORANGE = '#FFC000',
  YELLOW = '#FFFF00',
  GREEN = '#00FF00',
  CYAN = '#00FFFF',
  BLUE = '#0000FF',
  PURPLE = '#C000FF',
  BLACK = '#000000',
}

// 댓글 위치 정보
export interface CommentPosition {
  x: number;              // X 좌표 (픽셀)
  y: number;              // Y 좌표 (픽셀)
  lane?: number;          // 레인 번호 (충돌 방지용)
  speed?: number;         // 이동 속도 (px/s)
}

// 댓글 스타일
export interface CommentStyle {
  type: CommentType;
  size: CommentSize;
  color: CommentColor | string;  // 커스텀 색상 허용
  font?: string;          // 폰트 (프리미엄 기능)
  opacity?: number;       // 투명도 (0-1)
  border?: boolean;       // 테두리 여부
  shadow?: boolean;       // 그림자 여부
}

// 댓글 메타데이터
export interface CommentMetadata {
  userId: ID;
  username?: string;
  userLevel?: number;     // 사용자 레벨
  isPremium?: boolean;    // 프리미엄 사용자 여부
  isOwner?: boolean;      // 방송 주인 여부
  isModerator?: boolean;  // 모더레이터 여부
  device?: string;        // 디바이스 정보
  ipHash?: string;        // IP 해시 (관리용)
}

// 댓글 엔티티
export class Comment {
  public readonly id: ID;
  public readonly roomId: ID;
  public readonly text: string;
  public readonly style: CommentStyle;
  public readonly position: CommentPosition;
  public readonly metadata: CommentMetadata;
  public readonly timestamp: Timestamp;
  public readonly duration: number;  // 표시 시간 (ms)
  public readonly vpos: number;      // 비디오 위치 (니코니코 스타일)
  
  private _isDeleted: boolean = false;
  private _isHidden: boolean = false;
  private _reportCount: number = 0;

  constructor(params: {
    id: ID;
    roomId: ID;
    text: string;
    style: CommentStyle;
    position: CommentPosition;
    metadata: CommentMetadata;
    timestamp: Timestamp;
    duration?: number;
    vpos?: number;
  }) {
    this.id = params.id;
    this.roomId = params.roomId;
    this.text = this.sanitizeText(params.text);
    this.style = params.style;
    this.position = params.position;
    this.metadata = params.metadata;
    this.timestamp = params.timestamp;
    this.duration = params.duration || this.calculateDuration();
    this.vpos = params.vpos || 0;
  }

  // 텍스트 정제
  private sanitizeText(text: string): string {
    // XSS 방지 및 길이 제한
    return text
      .replace(/<[^>]*>/g, '')  // HTML 태그 제거
      .slice(0, 75);             // 최대 75자
  }

  // 표시 시간 계산
  private calculateDuration(): number {
    if (this.style.type === CommentType.NORMAL) {
      // 유동 댓글: 화면 너비 + 텍스트 길이 기반
      return 4000 + (this.text.length * 50);
    } else {
      // 고정 댓글: 3초
      return 3000;
    }
  }

  // 댓글 삭제
  public delete(): void {
    this._isDeleted = true;
  }

  // 댓글 숨김
  public hide(): void {
    this._isHidden = true;
  }

  // 댓글 신고
  public report(): void {
    this._reportCount++;
    if (this._reportCount >= 3) {
      this.hide();
    }
  }

  // 충돌 체크
  public checkCollision(other: Comment): boolean {
    // 같은 레인에 있고, 시간이 겹치는지 확인
    if (this.position.lane !== other.position.lane) {
      return false;
    }

    const thisEnd = this.timestamp + this.duration;
    const otherEnd = other.timestamp + other.duration;

    return !(thisEnd < other.timestamp || this.timestamp > otherEnd);
  }

  // DTO 변환
  public toDTO() {
    return {
      id: this.id,
      roomId: this.roomId,
      text: this.text,
      style: this.style,
      position: this.position,
      metadata: {
        username: this.metadata.username,
        userLevel: this.metadata.userLevel,
        isPremium: this.metadata.isPremium,
      },
      timestamp: this.timestamp,
      duration: this.duration,
      vpos: this.vpos,
    };
  }

  // Getters
  public get isDeleted(): boolean {
    return this._isDeleted;
  }

  public get isHidden(): boolean {
    return this._isHidden;
  }

  public get reportCount(): number {
    return this._reportCount;
  }
}