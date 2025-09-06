import { ID, Timestamp } from '@shared/types';
import { Comment } from './Comment';

/**
 * 방송 룸 엔티티
 */

export enum RoomStatus {
  WAITING = 'waiting',
  LIVE = 'live',
  ENDED = 'ended',
  ERROR = 'error',
}

export interface RoomSettings {
  maxViewers: number;
  maxCommentLength: number;
  commentCooldown: number;     // 댓글 쿨다운 (ms)
  allowAnonymous: boolean;
  allowColoredComments: boolean;
  allowPremiumComments: boolean;
  ngWords: string[];           // 금칙어 목록
  commentSpeed: number;        // 댓글 속도 배율
}

export interface RoomStatistics {
  totalViewers: number;
  currentViewers: number;
  peakViewers: number;
  totalComments: number;
  commentsPerMinute: number;
  startTime?: Timestamp;
  endTime?: Timestamp;
}

export class Room {
  public readonly id: ID;
  public readonly ownerId: ID;
  public readonly title: string;
  public readonly description: string;
  public readonly thumbnail?: string;
  
  private _status: RoomStatus;
  private _settings: RoomSettings;
  private _statistics: RoomStatistics;
  private _comments: Map<ID, Comment>;
  private _viewers: Set<ID>;
  private _moderators: Set<ID>;
  private _bannedUsers: Set<ID>;
  private _createdAt: Timestamp;
  private _updatedAt: Timestamp;

  constructor(params: {
    id: ID;
    ownerId: ID;
    title: string;
    description: string;
    thumbnail?: string;
    settings?: Partial<RoomSettings>;
  }) {
    this.id = params.id;
    this.ownerId = params.ownerId;
    this.title = params.title;
    this.description = params.description;
    this.thumbnail = params.thumbnail;
    
    this._status = RoomStatus.WAITING;
    this._settings = this.initializeSettings(params.settings);
    this._statistics = this.initializeStatistics();
    this._comments = new Map();
    this._viewers = new Set();
    this._moderators = new Set();
    this._bannedUsers = new Set();
    this._createdAt = Date.now();
    this._updatedAt = Date.now();
  }

  private initializeSettings(customSettings?: Partial<RoomSettings>): RoomSettings {
    return {
      maxViewers: 100,
      maxCommentLength: 75,
      commentCooldown: 1000,
      allowAnonymous: true,
      allowColoredComments: true,
      allowPremiumComments: true,
      ngWords: [],
      commentSpeed: 1.0,
      ...customSettings,
    };
  }

  private initializeStatistics(): RoomStatistics {
    return {
      totalViewers: 0,
      currentViewers: 0,
      peakViewers: 0,
      totalComments: 0,
      commentsPerMinute: 0,
    };
  }

  // 방송 시작
  public startStream(): void {
    if (this._status !== RoomStatus.WAITING) {
      throw new Error('Room is not in waiting status');
    }
    this._status = RoomStatus.LIVE;
    this._statistics.startTime = Date.now();
    this._updatedAt = Date.now();
  }

  // 방송 종료
  public endStream(): void {
    if (this._status !== RoomStatus.LIVE) {
      throw new Error('Room is not live');
    }
    this._status = RoomStatus.ENDED;
    this._statistics.endTime = Date.now();
    this._updatedAt = Date.now();
  }

  // 시청자 입장
  public addViewer(viewerId: ID): void {
    if (this._bannedUsers.has(viewerId)) {
      throw new Error('User is banned');
    }
    if (this._viewers.size >= this._settings.maxViewers) {
      throw new Error('Room is full');
    }
    
    this._viewers.add(viewerId);
    this._statistics.totalViewers++;
    this._statistics.currentViewers = this._viewers.size;
    
    if (this._statistics.currentViewers > this._statistics.peakViewers) {
      this._statistics.peakViewers = this._statistics.currentViewers;
    }
    
    this._updatedAt = Date.now();
  }

  // 시청자 퇴장
  public removeViewer(viewerId: ID): void {
    this._viewers.delete(viewerId);
    this._statistics.currentViewers = this._viewers.size;
    this._updatedAt = Date.now();
  }

  // 댓글 추가
  public addComment(comment: Comment): void {
    if (this._status !== RoomStatus.LIVE) {
      throw new Error('Room is not live');
    }
    if (this._bannedUsers.has(comment.metadata.userId)) {
      throw new Error('User is banned');
    }
    
    // 금칙어 체크
    if (this.containsNGWord(comment.text)) {
      throw new Error('Comment contains NG word');
    }
    
    this._comments.set(comment.id, comment);
    this._statistics.totalComments++;
    this._updatedAt = Date.now();
    
    // 분당 댓글 수 업데이트
    this.updateCommentsPerMinute();
  }

  // 댓글 삭제
  public deleteComment(commentId: ID): void {
    const comment = this._comments.get(commentId);
    if (comment) {
      comment.delete();
      this._updatedAt = Date.now();
    }
  }

  // 모더레이터 추가
  public addModerator(userId: ID): void {
    this._moderators.add(userId);
    this._updatedAt = Date.now();
  }

  // 사용자 차단
  public banUser(userId: ID): void {
    this._bannedUsers.add(userId);
    this._viewers.delete(userId);
    this._updatedAt = Date.now();
  }

  // 금칙어 체크
  private containsNGWord(text: string): boolean {
    const lowerText = text.toLowerCase();
    return this._settings.ngWords.some(ngWord => 
      lowerText.includes(ngWord.toLowerCase())
    );
  }

  // 분당 댓글 수 계산
  private updateCommentsPerMinute(): void {
    if (!this._statistics.startTime) return;
    
    const elapsedMinutes = (Date.now() - this._statistics.startTime) / 60000;
    if (elapsedMinutes > 0) {
      this._statistics.commentsPerMinute = 
        Math.round(this._statistics.totalComments / elapsedMinutes);
    }
  }

  // 방 설정 업데이트
  public updateSettings(settings: Partial<RoomSettings>): void {
    this._settings = { ...this._settings, ...settings };
    this._updatedAt = Date.now();
  }

  // 권한 체크
  public isOwner(userId: ID): boolean {
    return this.ownerId === userId;
  }

  public isModerator(userId: ID): boolean {
    return this._moderators.has(userId) || this.isOwner(userId);
  }

  public isBanned(userId: ID): boolean {
    return this._bannedUsers.has(userId);
  }

  // DTO 변환
  public toDTO() {
    return {
      id: this.id,
      ownerId: this.ownerId,
      title: this.title,
      description: this.description,
      thumbnail: this.thumbnail,
      status: this._status,
      settings: this._settings,
      statistics: this._statistics,
      viewerCount: this._viewers.size,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  // Getters
  public get status(): RoomStatus {
    return this._status;
  }

  public get settings(): RoomSettings {
    return { ...this._settings };
  }

  public get statistics(): RoomStatistics {
    return { ...this._statistics };
  }

  public get viewers(): ID[] {
    return Array.from(this._viewers);
  }

  public get comments(): Comment[] {
    return Array.from(this._comments.values());
  }

  public get isLive(): boolean {
    return this._status === RoomStatus.LIVE;
  }
}