# 🏛️ 소프트웨어 레이어드 아키텍처

## 📌 개요

레이어드 아키텍처는 관심사를 분리하고 의존성을 관리하여 유지보수가 쉬운 시스템을 만듭니다.

### 핵심 원칙
1. **단방향 의존성**: 상위 레이어는 하위 레이어에만 의존
2. **관심사 분리**: 각 레이어는 명확한 책임을 가짐
3. **테스트 용이성**: 각 레이어를 독립적으로 테스트 가능
4. **확장성**: 레이어별로 독립적 확장 가능

### 레이어 구조
```
┌─────────────────────────────────────┐
│   Presentation Layer (표현 계층)     │ ← 사용자 인터페이스
├─────────────────────────────────────┤
│   Application Layer (응용 계층)      │ ← 비즈니스 워크플로우
├─────────────────────────────────────┤
│     Domain Layer (도메인 계층)       │ ← 핵심 비즈니스 로직
├─────────────────────────────────────┤
│  Infrastructure Layer (인프라 계층)  │ ← 외부 시스템 연동
└─────────────────────────────────────┘
```

---

## 🎨 Frontend 레이어드 아키텍처 (React + TypeScript)

### 1. Presentation Layer (UI 계층)
> **책임**: 사용자 인터페이스, 시각적 표현

#### 포함되는 코드
- React 컴포넌트 (UI만 담당)
- 스타일 (CSS/Tailwind)
- 애니메이션
- 레이아웃

#### 디렉토리 구조
```
frontend/src/
├── components/          # 프레젠테이션 컴포넌트
│   ├── common/         # 공통 UI 컴포넌트
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Modal.tsx
│   ├── stream/         # 스트림 관련 UI
│   │   ├── VideoPlayer.tsx
│   │   ├── StreamInfo.tsx
│   │   └── ViewerCount.tsx
│   └── comment/        # 댓글 관련 UI
│       ├── CommentCanvas.tsx
│       ├── CommentInput.tsx
│       └── CommentList.tsx
├── layouts/            # 레이아웃 컴포넌트
│   ├── MainLayout.tsx
│   └── StreamLayout.tsx
└── styles/            # 스타일 파일
    ├── globals.css
    └── tailwind.css
```

#### 코드 예시
```typescript
// components/comment/CommentInput.tsx
import React from 'react';

interface CommentInputProps {
  onSubmit: (text: string, command: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

// 순수한 UI 컴포넌트 - 비즈니스 로직 없음
export const CommentInput: React.FC<CommentInputProps> = ({
  onSubmit,
  disabled = false,
  placeholder = "댓글을 입력하세요..."
}) => {
  const [text, setText] = React.useState('');
  const [command, setCommand] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSubmit(text, command);
      setText('');
      setCommand('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={command}
        onChange={(e) => setCommand(e.target.value)}
        placeholder="명령어 (예: ue red)"
        className="px-3 py-2 border rounded"
        disabled={disabled}
      />
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className="flex-1 px-3 py-2 border rounded"
        disabled={disabled}
      />
      <button
        type="submit"
        disabled={disabled || !text.trim()}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        전송
      </button>
    </form>
  );
};
```

### 2. Application Layer (응용 계층)
> **책임**: 비즈니스 워크플로우, 상태 관리, 유즈케이스 조정

#### 포함되는 코드
- Custom Hooks (비즈니스 로직)
- 상태 관리 (Zustand Stores)
- 서비스 레이어
- 유효성 검증

#### 디렉토리 구조
```
frontend/src/
├── hooks/              # 커스텀 훅 (비즈니스 로직)
│   ├── useStream.ts
│   ├── useComment.ts
│   ├── useWebSocket.ts
│   └── useAuth.ts
├── stores/             # 상태 관리 (Zustand)
│   ├── authStore.ts
│   ├── streamStore.ts
│   └── commentStore.ts
├── services/           # 애플리케이션 서비스
│   ├── CommentService.ts
│   ├── StreamService.ts
│   └── AuthService.ts
└── validators/         # 유효성 검증
    ├── commentValidator.ts
    └── streamValidator.ts
```

#### 코드 예시
```typescript
// hooks/useComment.ts
import { useCallback } from 'react';
import { useCommentStore } from '@/stores/commentStore';
import { useWebSocket } from './useWebSocket';
import { CommentService } from '@/services/CommentService';
import { Comment } from '@/domain/models/Comment';

export const useComment = (streamId: string) => {
  const { comments, addComment, removeComment } = useCommentStore();
  const { socket, isConnected } = useWebSocket();
  const commentService = new CommentService();

  // 댓글 전송 비즈니스 로직
  const sendComment = useCallback(async (text: string, command?: string) => {
    try {
      // 1. 유효성 검증
      const validatedComment = await commentService.validate(text, command);
      
      // 2. 명령어 파싱
      const style = commentService.parseCommand(command);
      
      // 3. 댓글 객체 생성
      const comment = new Comment({
        text: validatedComment.text,
        style,
        streamId
      });
      
      // 4. WebSocket으로 전송
      socket?.emit('send_comment', comment.toDTO());
      
      // 5. 낙관적 업데이트
      addComment(comment);
      
      return { success: true };
    } catch (error) {
      console.error('Failed to send comment:', error);
      return { success: false, error };
    }
  }, [streamId, socket, commentService, addComment]);

  // WebSocket 이벤트 구독
  React.useEffect(() => {
    if (!socket) return;

    socket.on('new_comment', (data) => {
      const comment = Comment.fromDTO(data);
      addComment(comment);
    });

    socket.on('comment_deleted', (commentId) => {
      removeComment(commentId);
    });

    return () => {
      socket.off('new_comment');
      socket.off('comment_deleted');
    };
  }, [socket, addComment, removeComment]);

  return {
    comments,
    sendComment,
    isConnected
  };
};
```

```typescript
// stores/commentStore.ts
import { create } from 'zustand';
import { Comment } from '@/domain/models/Comment';

interface CommentStore {
  comments: Comment[];
  activeComments: Comment[];
  
  addComment: (comment: Comment) => void;
  removeComment: (commentId: string) => void;
  updateCommentPosition: (commentId: string, position: Position) => void;
  clearOldComments: () => void;
}

export const useCommentStore = create<CommentStore>((set, get) => ({
  comments: [],
  activeComments: [],
  
  addComment: (comment) => {
    set(state => ({
      comments: [...state.comments, comment],
      activeComments: [...state.activeComments, comment]
    }));
    
    // 5초 후 활성 댓글에서 제거
    setTimeout(() => {
      set(state => ({
        activeComments: state.activeComments.filter(c => c.id !== comment.id)
      }));
    }, 5000);
  },
  
  removeComment: (commentId) => {
    set(state => ({
      comments: state.comments.filter(c => c.id !== commentId),
      activeComments: state.activeComments.filter(c => c.id !== commentId)
    }));
  },
  
  updateCommentPosition: (commentId, position) => {
    set(state => ({
      activeComments: state.activeComments.map(c =>
        c.id === commentId ? { ...c, position } : c
      )
    }));
  },
  
  clearOldComments: () => {
    const now = Date.now();
    set(state => ({
      comments: state.comments.filter(c => now - c.timestamp < 300000) // 5분
    }));
  }
}));
```

### 3. Domain Layer (도메인 계층)
> **책임**: 핵심 비즈니스 로직, 도메인 모델, 비즈니스 규칙

#### 포함되는 코드
- 도메인 모델/엔티티
- 비즈니스 규칙
- 도메인 서비스
- 값 객체

#### 디렉토리 구조
```
frontend/src/domain/
├── models/             # 도메인 모델
│   ├── Comment.ts
│   ├── Stream.ts
│   ├── User.ts
│   └── Room.ts
├── valueObjects/       # 값 객체
│   ├── CommentStyle.ts
│   ├── CommentPosition.ts
│   └── StreamStatus.ts
├── services/           # 도메인 서비스
│   ├── CommentParser.ts
│   ├── LaneCalculator.ts
│   └── CollisionDetector.ts
└── rules/             # 비즈니스 규칙
    ├── CommentRules.ts
    └── StreamRules.ts
```

#### 코드 예시
```typescript
// domain/models/Comment.ts
import { CommentStyle } from '../valueObjects/CommentStyle';
import { CommentPosition } from '../valueObjects/CommentPosition';

export class Comment {
  public readonly id: string;
  public readonly text: string;
  public readonly userId: string;
  public readonly streamId: string;
  public readonly style: CommentStyle;
  public position: CommentPosition;
  public readonly timestamp: number;
  public readonly duration: number;

  constructor(params: {
    text: string;
    userId?: string;
    streamId: string;
    style?: Partial<CommentStyle>;
    command?: string;
  }) {
    // 도메인 규칙 적용
    this.id = this.generateId();
    this.text = this.sanitizeText(params.text);
    this.userId = params.userId || 'anonymous';
    this.streamId = params.streamId;
    this.style = new CommentStyle(params.style);
    this.position = new CommentPosition();
    this.timestamp = Date.now();
    this.duration = this.calculateDuration();
    
    // 비즈니스 규칙 검증
    this.validate();
  }

  private sanitizeText(text: string): string {
    // XSS 방지, 길이 제한 등
    return text
      .replace(/<[^>]*>/g, '')
      .trim()
      .slice(0, 200);
  }

  private calculateDuration(): number {
    // 텍스트 길이와 스타일에 따른 표시 시간 계산
    const baseTime = 4000;
    const charTime = this.text.length * 50;
    return Math.min(baseTime + charTime, 8000);
  }

  private validate(): void {
    if (!this.text || this.text.length === 0) {
      throw new Error('Comment text cannot be empty');
    }
    if (this.text.length > 200) {
      throw new Error('Comment text too long');
    }
  }

  // 충돌 검사 비즈니스 로직
  public checkCollision(other: Comment): boolean {
    if (this.position.lane !== other.position.lane) {
      return false;
    }
    
    const thisEnd = this.timestamp + this.duration;
    const otherEnd = other.timestamp + other.duration;
    
    return !(thisEnd < other.timestamp || this.timestamp > otherEnd);
  }

  public toDTO() {
    return {
      id: this.id,
      text: this.text,
      userId: this.userId,
      streamId: this.streamId,
      style: this.style.toDTO(),
      position: this.position.toDTO(),
      timestamp: this.timestamp,
      duration: this.duration
    };
  }

  public static fromDTO(dto: any): Comment {
    const comment = Object.create(Comment.prototype);
    return Object.assign(comment, dto);
  }

  private generateId(): string {
    return `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

```typescript
// domain/services/LaneCalculator.ts
import { Comment } from '../models/Comment';
import { CommentPosition } from '../valueObjects/CommentPosition';

export class LaneCalculator {
  private readonly laneCount: number = 12;
  private readonly laneHeight: number = 30;
  private readonly canvasWidth: number = 1280;
  private readonly canvasHeight: number = 720;
  private lanes: Map<number, Comment[]> = new Map();

  constructor() {
    // 레인 초기화
    for (let i = 0; i < this.laneCount; i++) {
      this.lanes.set(i, []);
    }
  }

  // 비즈니스 로직: 최적 레인 찾기
  public assignLane(comment: Comment): number {
    // 고정 댓글 처리
    if (comment.style.position === 'top') {
      return 0;
    }
    if (comment.style.position === 'bottom') {
      return this.laneCount - 1;
    }

    // 유동 댓글: 충돌 없는 레인 찾기
    for (let i = 0; i < this.laneCount; i++) {
      if (!this.hasCollisionInLane(comment, i)) {
        this.lanes.get(i)?.push(comment);
        this.cleanOldComments(i);
        return i;
      }
    }

    // 모든 레인이 차있으면 가장 빈 레인 선택
    return this.findLeastCrowdedLane();
  }

  private hasCollisionInLane(newComment: Comment, laneIndex: number): boolean {
    const laneComments = this.lanes.get(laneIndex) || [];
    
    for (const existing of laneComments) {
      if (this.detectCollision(newComment, existing)) {
        return true;
      }
    }
    
    return false;
  }

  private detectCollision(c1: Comment, c2: Comment): boolean {
    // 시간 기반 충돌 검사
    const c1End = c1.timestamp + c1.duration;
    const c2End = c2.timestamp + c2.duration;
    
    if (c1End < c2.timestamp || c1.timestamp > c2End) {
      return false;
    }
    
    // 위치 기반 충돌 검사
    const c1Speed = this.canvasWidth / c1.duration;
    const c2Speed = this.canvasWidth / c2.duration;
    
    // 더 복잡한 충돌 검사 로직...
    return true;
  }

  private findLeastCrowdedLane(): number {
    let minCount = Infinity;
    let bestLane = 0;
    
    this.lanes.forEach((comments, lane) => {
      if (comments.length < minCount) {
        minCount = comments.length;
        bestLane = lane;
      }
    });
    
    return bestLane;
  }

  private cleanOldComments(laneIndex: number): void {
    const now = Date.now();
    const laneComments = this.lanes.get(laneIndex) || [];
    
    this.lanes.set(
      laneIndex,
      laneComments.filter(c => now - c.timestamp < c.duration + 1000)
    );
  }
}
```

### 4. Infrastructure Layer (인프라 계층)
> **책임**: 외부 시스템과의 통신, 기술적 구현 세부사항

#### 포함되는 코드
- API 클라이언트
- WebSocket 연결
- 로컬 스토리지
- 외부 라이브러리 래퍼

#### 디렉토리 구조
```
frontend/src/infrastructure/
├── api/                # API 통신
│   ├── client.ts      # Axios 인스턴스
│   ├── authApi.ts
│   ├── streamApi.ts
│   └── commentApi.ts
├── websocket/          # WebSocket
│   ├── SocketClient.ts
│   └── SocketManager.ts
├── storage/            # 로컬 스토리지
│   ├── LocalStorage.ts
│   └── SessionStorage.ts
├── canvas/             # Canvas 렌더링
│   ├── CanvasRenderer.ts
│   └── CommentAnimator.ts
└── external/           # 외부 서비스
    └── VideoPlayer.ts
```

#### 코드 예시
```typescript
// infrastructure/websocket/SocketManager.ts
import { io, Socket } from 'socket.io-client';

export class SocketManager {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private listeners: Map<string, Function[]> = new Map();

  public connect(url: string, token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(url, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
        if (reason === 'io server disconnect') {
          // 서버가 연결을 끊은 경우 재연결 시도
          this.socket?.connect();
        }
      });
    });
  }

  public emit(event: string, data: any): void {
    if (!this.socket?.connected) {
      console.warn('Socket not connected');
      return;
    }
    this.socket.emit(event, data);
  }

  public on(event: string, handler: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(handler);
    this.socket?.on(event, handler);
  }

  public off(event: string, handler?: Function): void {
    if (handler) {
      this.socket?.off(event, handler);
      const handlers = this.listeners.get(event) || [];
      this.listeners.set(
        event,
        handlers.filter(h => h !== handler)
      );
    } else {
      this.socket?.off(event);
      this.listeners.delete(event);
    }
  }

  public disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.listeners.clear();
  }

  public get isConnected(): boolean {
    return this.socket?.connected || false;
  }
}
```

```typescript
// infrastructure/api/streamApi.ts
import { apiClient } from './client';
import { Stream } from '@/domain/models/Stream';

export class StreamApi {
  private readonly baseUrl = '/api/streams';

  async getStreams(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<Stream[]> {
    const response = await apiClient.get(this.baseUrl, { params });
    return response.data.streams.map((dto: any) => Stream.fromDTO(dto));
  }

  async getStream(id: string): Promise<Stream> {
    const response = await apiClient.get(`${this.baseUrl}/${id}`);
    return Stream.fromDTO(response.data);
  }

  async createStream(data: {
    title: string;
    description?: string;
  }): Promise<Stream> {
    const response = await apiClient.post(this.baseUrl, data);
    return Stream.fromDTO(response.data);
  }

  async startStream(id: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/${id}/start`);
  }

  async endStream(id: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/${id}/end`);
  }
}
```

---

## 🚀 Backend 레이어드 아키텍처 (NestJS + TypeScript)

### 1. Presentation Layer (표현 계층)
> **책임**: HTTP/WebSocket 요청 처리, DTO 변환, 응답 포맷팅

#### 포함되는 코드
- Controllers (REST API)
- Gateways (WebSocket)
- DTOs (Data Transfer Objects)
- 요청/응답 변환

#### 디렉토리 구조
```
backend/src/
├── controllers/        # REST API 컨트롤러
│   ├── auth.controller.ts
│   ├── stream.controller.ts
│   └── user.controller.ts
├── gateways/          # WebSocket 게이트웨이
│   ├── comment.gateway.ts
│   └── stream.gateway.ts
├── dto/               # DTO 정의
│   ├── auth/
│   │   ├── login.dto.ts
│   │   └── register.dto.ts
│   ├── stream/
│   │   ├── create-stream.dto.ts
│   │   └── update-stream.dto.ts
│   └── comment/
│       └── send-comment.dto.ts
└── pipes/             # 유효성 검증 파이프
    └── validation.pipe.ts
```

#### 코드 예시
```typescript
// controllers/stream.controller.ts
import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { StreamService } from '@/application/services/stream.service';
import { CreateStreamDto } from '@/dto/stream/create-stream.dto';
import { JwtAuthGuard } from '@/guards/jwt-auth.guard';
import { CurrentUser } from '@/decorators/current-user.decorator';

@Controller('api/streams')
export class StreamController {
  constructor(private readonly streamService: StreamService) {}

  @Get()
  async getStreams(
    @Query('status') status?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    // Presentation 책임: 요청 파라미터 받기, 응답 포맷팅
    const streams = await this.streamService.findAll({ status, page, limit });
    
    return {
      streams: streams.map(s => s.toDTO()),
      total: streams.length,
      page,
      limit,
    };
  }

  @Get(':id')
  async getStream(@Param('id') id: string) {
    const stream = await this.streamService.findById(id);
    return stream.toDTO();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createStream(
    @Body() dto: CreateStreamDto,
    @CurrentUser() user: any,
  ) {
    // DTO를 도메인 모델로 변환은 서비스 레이어에서
    const stream = await this.streamService.create(dto, user.id);
    return stream.toDTO();
  }

  @Post(':id/start')
  @UseGuards(JwtAuthGuard)
  async startStream(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    await this.streamService.start(id, user.id);
    return { status: 'live', startedAt: new Date() };
  }
}
```

```typescript
// gateways/comment.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CommentService } from '@/application/services/comment.service';
import { SendCommentDto } from '@/dto/comment/send-comment.dto';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: 'comments',
})
export class CommentGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly commentService: CommentService) {}

  async handleConnection(client: Socket) {
    // 인증 확인
    const token = client.handshake.auth.token;
    const user = await this.validateToken(token);
    
    if (!user) {
      client.disconnect();
      return;
    }
    
    client.data.user = user;
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    // 정리 작업
    this.commentService.handleDisconnect(client.id);
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { streamId: string },
  ) {
    await client.join(data.streamId);
    const viewerCount = await this.commentService.addViewer(data.streamId, client.data.user.id);
    
    // 룸의 모든 클라이언트에게 알림
    this.server.to(data.streamId).emit('viewer_count', { 
      streamId: data.streamId,
      count: viewerCount 
    });
    
    return { joined: true, streamId: data.streamId };
  }

  @SubscribeMessage('send_comment')
  async handleComment(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: SendCommentDto,
  ) {
    try {
      // Application Layer로 위임
      const comment = await this.commentService.processComment(
        dto,
        client.data.user,
      );
      
      // 룸의 모든 클라이언트에게 브로드캐스트
      this.server.to(dto.streamId).emit('new_comment', comment.toDTO());
      
      return { success: true, commentId: comment.id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  private async validateToken(token: string): Promise<any> {
    // JWT 검증 로직
    return null;
  }
}
```

### 2. Application Layer (응용 계층)
> **책임**: 유즈케이스 구현, 트랜잭션 관리, 워크플로우 조정

#### 포함되는 코드
- Application Services
- Use Cases
- 트랜잭션 스크립트
- 이벤트 핸들러

#### 디렉토리 구조
```
backend/src/application/
├── services/           # 애플리케이션 서비스
│   ├── auth.service.ts
│   ├── stream.service.ts
│   ├── comment.service.ts
│   └── user.service.ts
├── usecases/          # 유즈케이스
│   ├── SendCommentUseCase.ts
│   ├── CreateStreamUseCase.ts
│   └── StartStreamUseCase.ts
├── events/            # 이벤트 핸들러
│   ├── StreamEventHandler.ts
│   └── CommentEventHandler.ts
└── interfaces/        # 인터페이스
    ├── IStreamRepository.ts
    └── ICommentRepository.ts
```

#### 코드 예시
```typescript
// application/services/comment.service.ts
import { Injectable } from '@nestjs/common';
import { Comment } from '@/domain/entities/Comment';
import { LaneManager } from '@/domain/services/LaneManager';
import { CommentValidator } from '@/domain/services/CommentValidator';
import { ICommentRepository } from '../interfaces/ICommentRepository';
import { IStreamRepository } from '../interfaces/IStreamRepository';
import { RedisService } from '@/infrastructure/redis/redis.service';

@Injectable()
export class CommentService {
  constructor(
    private readonly commentRepository: ICommentRepository,
    private readonly streamRepository: IStreamRepository,
    private readonly laneManager: LaneManager,
    private readonly validator: CommentValidator,
    private readonly redis: RedisService,
  ) {}

  async processComment(dto: any, user: any): Promise<Comment> {
    // 1. 스트림 존재 확인
    const stream = await this.streamRepository.findById(dto.streamId);
    if (!stream || !stream.isLive()) {
      throw new Error('Stream is not live');
    }

    // 2. Rate Limiting 체크
    const canSend = await this.checkRateLimit(user.id, dto.streamId);
    if (!canSend) {
      throw new Error('Too many comments. Please wait.');
    }

    // 3. 댓글 유효성 검증
    const validatedText = await this.validator.validate(dto.text);

    // 4. 도메인 모델 생성
    const comment = new Comment({
      text: validatedText,
      userId: user.id,
      streamId: dto.streamId,
      command: dto.command,
    });

    // 5. 레인 할당
    const lane = await this.laneManager.assignLane(comment);
    comment.setLane(lane);

    // 6. 위치 계산
    comment.calculatePosition(stream.getCanvasSize());

    // 7. 영속화
    await this.commentRepository.save(comment);

    // 8. 캐시 업데이트
    await this.cacheComment(comment);

    // 9. 통계 업데이트
    await this.updateStatistics(dto.streamId);

    return comment;
  }

  private async checkRateLimit(userId: string, streamId: string): Promise<boolean> {
    const key = `rate:comment:${userId}:${streamId}`;
    const count = await this.redis.incr(key);
    
    if (count === 1) {
      await this.redis.expire(key, 60); // 60초
    }
    
    return count <= 30; // 분당 30개 제한
  }

  private async cacheComment(comment: Comment): Promise<void> {
    const key = `stream:${comment.streamId}:comments`;
    await this.redis.lpush(key, JSON.stringify(comment.toDTO()));
    await this.redis.ltrim(key, 0, 99); // 최근 100개만 유지
  }

  private async updateStatistics(streamId: string): Promise<void> {
    await this.redis.hincrby(`stream:${streamId}:stats`, 'comments', 1);
  }

  async addViewer(streamId: string, userId: string): Promise<number> {
    const key = `stream:${streamId}:viewers`;
    await this.redis.sadd(key, userId);
    return await this.redis.scard(key);
  }

  async removeViewer(streamId: string, userId: string): Promise<number> {
    const key = `stream:${streamId}:viewers`;
    await this.redis.srem(key, userId);
    return await this.redis.scard(key);
  }

  async handleDisconnect(clientId: string): Promise<void> {
    // 클라이언트 정리 로직
  }
}
```

```typescript
// application/usecases/SendCommentUseCase.ts
import { Injectable } from '@nestjs/common';
import { Comment } from '@/domain/entities/Comment';
import { Stream } from '@/domain/entities/Stream';

@Injectable()
export class SendCommentUseCase {
  constructor(
    private readonly streamRepo: IStreamRepository,
    private readonly commentRepo: ICommentRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(params: {
    text: string;
    command?: string;
    streamId: string;
    userId: string;
  }): Promise<Comment> {
    // 트랜잭션 시작
    return await this.transactionManager.run(async () => {
      // 1. 스트림 조회 및 검증
      const stream = await this.streamRepo.findById(params.streamId);
      if (!stream.canReceiveComments()) {
        throw new Error('Comments are disabled');
      }

      // 2. 댓글 생성
      const comment = stream.addComment({
        text: params.text,
        userId: params.userId,
        command: params.command,
      });

      // 3. 저장
      await this.commentRepo.save(comment);
      await this.streamRepo.save(stream);

      // 4. 이벤트 발행
      await this.eventBus.publish(new CommentCreatedEvent(comment));

      return comment;
    });
  }
}
```

### 3. Domain Layer (도메인 계층)
> **책임**: 핵심 비즈니스 로직, 도메인 모델, 비즈니스 규칙

#### 포함되는 코드
- Entities (엔티티)
- Value Objects (값 객체)
- Domain Services (도메인 서비스)
- Domain Events (도메인 이벤트)

#### 디렉토리 구조
```
backend/src/domain/
├── entities/          # 엔티티
│   ├── User.ts
│   ├── Stream.ts
│   ├── Comment.ts
│   └── Room.ts
├── valueObjects/      # 값 객체
│   ├── UserId.ts
│   ├── StreamId.ts
│   ├── CommentStyle.ts
│   └── CommentPosition.ts
├── services/          # 도메인 서비스
│   ├── LaneManager.ts
│   ├── CommentValidator.ts
│   ├── CommentFilter.ts
│   └── CollisionDetector.ts
├── events/           # 도메인 이벤트
│   ├── CommentCreated.ts
│   ├── StreamStarted.ts
│   └── UserJoined.ts
└── specifications/   # 명세 패턴
    ├── ActiveStreamSpec.ts
    └── ValidCommentSpec.ts
```

#### 코드 예시
```typescript
// domain/entities/Stream.ts
import { AggregateRoot } from '@/domain/base/AggregateRoot';
import { StreamId } from '../valueObjects/StreamId';
import { UserId } from '../valueObjects/UserId';
import { Comment } from './Comment';
import { StreamStartedEvent } from '../events/StreamStarted';

export class Stream extends AggregateRoot {
  private readonly id: StreamId;
  private readonly ownerId: UserId;
  private title: string;
  private description: string;
  private status: StreamStatus;
  private viewerCount: number;
  private readonly comments: Comment[];
  private readonly settings: StreamSettings;
  private startedAt?: Date;
  private endedAt?: Date;

  constructor(params: {
    id?: StreamId;
    ownerId: UserId;
    title: string;
    description?: string;
  }) {
    super();
    this.id = params.id || StreamId.generate();
    this.ownerId = params.ownerId;
    this.title = params.title;
    this.description = params.description || '';
    this.status = StreamStatus.WAITING;
    this.viewerCount = 0;
    this.comments = [];
    this.settings = new StreamSettings();
  }

  // 비즈니스 메서드
  public start(): void {
    if (this.status !== StreamStatus.WAITING) {
      throw new Error('Stream can only be started from waiting status');
    }
    
    this.status = StreamStatus.LIVE;
    this.startedAt = new Date();
    
    // 도메인 이벤트 발생
    this.addDomainEvent(new StreamStartedEvent(this.id, this.ownerId));
  }

  public end(): void {
    if (this.status !== StreamStatus.LIVE) {
      throw new Error('Only live streams can be ended');
    }
    
    this.status = StreamStatus.ENDED;
    this.endedAt = new Date();
  }

  public addComment(params: {
    text: string;
    userId: string;
    command?: string;
  }): Comment {
    if (!this.canReceiveComments()) {
      throw new Error('Stream cannot receive comments');
    }

    const comment = new Comment({
      streamId: this.id,
      userId: params.userId,
      text: params.text,
      command: params.command,
    });

    // 비즈니스 규칙 적용
    if (this.settings.requireModeration) {
      comment.markForModeration();
    }

    this.comments.push(comment);
    return comment;
  }

  public canReceiveComments(): boolean {
    return this.status === StreamStatus.LIVE && 
           this.settings.allowComments;
  }

  public isLive(): boolean {
    return this.status === StreamStatus.LIVE;
  }

  public isOwnedBy(userId: UserId): boolean {
    return this.ownerId.equals(userId);
  }

  public incrementViewers(): void {
    this.viewerCount++;
  }

  public decrementViewers(): void {
    if (this.viewerCount > 0) {
      this.viewerCount--;
    }
  }

  public getCanvasSize(): { width: number; height: number } {
    return {
      width: this.settings.canvasWidth,
      height: this.settings.canvasHeight,
    };
  }

  public toDTO() {
    return {
      id: this.id.value,
      ownerId: this.ownerId.value,
      title: this.title,
      description: this.description,
      status: this.status,
      viewerCount: this.viewerCount,
      settings: this.settings.toDTO(),
      startedAt: this.startedAt,
      endedAt: this.endedAt,
    };
  }
}

enum StreamStatus {
  WAITING = 'waiting',
  LIVE = 'live',
  ENDED = 'ended',
}

class StreamSettings {
  public allowComments: boolean = true;
  public requireModeration: boolean = false;
  public commentCooldown: number = 1000;
  public maxViewers: number = 1000;
  public canvasWidth: number = 1280;
  public canvasHeight: number = 720;

  toDTO() {
    return { ...this };
  }
}
```

```typescript
// domain/services/LaneManager.ts
import { Injectable } from '@nestjs/common';
import { Comment } from '../entities/Comment';
import { Lane } from '../valueObjects/Lane';

@Injectable()
export class LaneManager {
  private readonly lanes: Map<string, Lane[]> = new Map();
  private readonly laneCount = 12;
  private readonly laneHeight = 30;

  public assignLane(comment: Comment): number {
    const streamId = comment.streamId.value;
    
    if (!this.lanes.has(streamId)) {
      this.initializeLanes(streamId);
    }

    const streamLanes = this.lanes.get(streamId)!;
    
    // 도메인 규칙: 댓글 타입별 레인 할당
    if (comment.isFixed()) {
      return this.getFixedLane(comment);
    }

    // 충돌 없는 레인 찾기
    for (let i = 0; i < this.laneCount; i++) {
      const lane = streamLanes[i];
      if (!lane.hasCollision(comment)) {
        lane.addComment(comment);
        return i;
      }
    }

    // 가장 여유있는 레인 선택
    return this.findLeastCrowdedLane(streamLanes);
  }

  private initializeLanes(streamId: string): void {
    const lanes: Lane[] = [];
    for (let i = 0; i < this.laneCount; i++) {
      lanes.push(new Lane(i, this.laneHeight));
    }
    this.lanes.set(streamId, lanes);
  }

  private getFixedLane(comment: Comment): number {
    switch (comment.style.position) {
      case 'top':
        return 0;
      case 'bottom':
        return this.laneCount - 1;
      default:
        return Math.floor(this.laneCount / 2);
    }
  }

  private findLeastCrowdedLane(lanes: Lane[]): number {
    let minCount = Infinity;
    let bestLane = 0;

    lanes.forEach((lane, index) => {
      const count = lane.getCommentCount();
      if (count < minCount) {
        minCount = count;
        bestLane = index;
      }
    });

    return bestLane;
  }

  public clearStreamLanes(streamId: string): void {
    this.lanes.delete(streamId);
  }
}
```

### 4. Infrastructure Layer (인프라 계층)
> **책임**: 기술적 구현, 외부 시스템 통합, 데이터 영속성

#### 포함되는 코드
- Repository 구현
- 데이터베이스 접근
- 외부 API 클라이언트
- 캐시 구현

#### 디렉토리 구조
```
backend/src/infrastructure/
├── database/          # 데이터베이스
│   ├── repositories/
│   │   ├── UserRepository.ts
│   │   ├── StreamRepository.ts
│   │   └── CommentRepository.ts
│   ├── entities/      # TypeORM 엔티티
│   │   ├── UserEntity.ts
│   │   ├── StreamEntity.ts
│   │   └── CommentEntity.ts
│   └── migrations/
├── redis/            # Redis
│   ├── redis.service.ts
│   └── redis.module.ts
├── websocket/        # WebSocket
│   └── socket-io.adapter.ts
└── config/          # 설정
    ├── database.config.ts
    └── redis.config.ts
```

#### 코드 예시
```typescript
// infrastructure/database/repositories/StreamRepository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StreamEntity } from '../entities/StreamEntity';
import { Stream } from '@/domain/entities/Stream';
import { IStreamRepository } from '@/application/interfaces/IStreamRepository';
import { StreamId } from '@/domain/valueObjects/StreamId';

@Injectable()
export class StreamRepository implements IStreamRepository {
  constructor(
    @InjectRepository(StreamEntity)
    private readonly repository: Repository<StreamEntity>,
  ) {}

  async findById(id: string | StreamId): Promise<Stream | null> {
    const streamId = typeof id === 'string' ? id : id.value;
    const entity = await this.repository.findOne({
      where: { id: streamId },
    });

    if (!entity) {
      return null;
    }

    return this.toDomain(entity);
  }

  async findAll(params: {
    status?: string;
    page: number;
    limit: number;
  }): Promise<Stream[]> {
    const query = this.repository.createQueryBuilder('stream');

    if (params.status) {
      query.where('stream.status = :status', { status: params.status });
    }

    query
      .orderBy('stream.createdAt', 'DESC')
      .skip((params.page - 1) * params.limit)
      .limit(params.limit);

    const entities = await query.getMany();
    return entities.map(e => this.toDomain(e));
  }

  async save(stream: Stream): Promise<void> {
    const entity = this.toEntity(stream);
    await this.repository.save(entity);
  }

  async delete(id: string | StreamId): Promise<void> {
    const streamId = typeof id === 'string' ? id : id.value;
    await this.repository.delete(streamId);
  }

  private toDomain(entity: StreamEntity): Stream {
    // Entity를 도메인 모델로 변환
    return Stream.fromPersistence({
      id: new StreamId(entity.id),
      ownerId: new UserId(entity.ownerId),
      title: entity.title,
      description: entity.description,
      status: entity.status,
      viewerCount: entity.viewerCount,
      startedAt: entity.startedAt,
      endedAt: entity.endedAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  private toEntity(stream: Stream): StreamEntity {
    // 도메인 모델을 Entity로 변환
    const dto = stream.toDTO();
    const entity = new StreamEntity();
    
    entity.id = dto.id;
    entity.ownerId = dto.ownerId;
    entity.title = dto.title;
    entity.description = dto.description;
    entity.status = dto.status;
    entity.viewerCount = dto.viewerCount;
    entity.startedAt = dto.startedAt;
    entity.endedAt = dto.endedAt;
    
    return entity;
  }
}
```

```typescript
// infrastructure/redis/redis.service.ts
import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { InjectRedis } from '@liaoliaots/nestjs-redis';

@Injectable()
export class RedisService {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  // 기본 operations
  async get(key: string): Promise<string | null> {
    return await this.redis.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.redis.set(key, value, 'EX', ttl);
    } else {
      await this.redis.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  // Counter operations
  async incr(key: string): Promise<number> {
    return await this.redis.incr(key);
  }

  async decr(key: string): Promise<number> {
    return await this.redis.decr(key);
  }

  async expire(key: string, seconds: number): Promise<void> {
    await this.redis.expire(key, seconds);
  }

  // List operations
  async lpush(key: string, value: string): Promise<number> {
    return await this.redis.lpush(key, value);
  }

  async rpush(key: string, value: string): Promise<number> {
    return await this.redis.rpush(key, value);
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    return await this.redis.lrange(key, start, stop);
  }

  async ltrim(key: string, start: number, stop: number): Promise<void> {
    await this.redis.ltrim(key, start, stop);
  }

  // Set operations
  async sadd(key: string, member: string): Promise<number> {
    return await this.redis.sadd(key, member);
  }

  async srem(key: string, member: string): Promise<number> {
    return await this.redis.srem(key, member);
  }

  async smembers(key: string): Promise<string[]> {
    return await this.redis.smembers(key);
  }

  async scard(key: string): Promise<number> {
    return await this.redis.scard(key);
  }

  // Hash operations
  async hset(key: string, field: string, value: string): Promise<number> {
    return await this.redis.hset(key, field, value);
  }

  async hget(key: string, field: string): Promise<string | null> {
    return await this.redis.hget(key, field);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return await this.redis.hgetall(key);
  }

  async hincrby(key: string, field: string, increment: number): Promise<number> {
    return await this.redis.hincrby(key, field, increment);
  }
}
```

---

## 🔄 레이어 간 통신

### 의존성 방향
```
Presentation → Application → Domain ← Infrastructure
```

### 데이터 흐름 예시

#### 댓글 전송 플로우
```
1. Presentation Layer
   - CommentGateway가 WebSocket 메시지 수신
   - SendCommentDto 유효성 검증
   ↓
2. Application Layer
   - CommentService.processComment() 호출
   - Rate limiting 체크
   - 트랜잭션 관리
   ↓
3. Domain Layer
   - Comment 엔티티 생성
   - 비즈니스 규칙 적용
   - LaneManager로 레인 할당
   ↓
4. Infrastructure Layer
   - PostgreSQL에 저장
   - Redis 캐시 업데이트
   ↓
5. Application Layer
   - 이벤트 발행
   ↓
6. Presentation Layer
   - WebSocket으로 브로드캐스트
```

---

## 📁 전체 프로젝트 구조

```
project/
├── frontend/
│   ├── src/
│   │   ├── components/      # Presentation Layer
│   │   ├── layouts/
│   │   ├── hooks/           # Application Layer
│   │   ├── stores/
│   │   ├── services/
│   │   ├── domain/          # Domain Layer
│   │   │   ├── models/
│   │   │   ├── valueObjects/
│   │   │   └── services/
│   │   └── infrastructure/  # Infrastructure Layer
│   │       ├── api/
│   │       ├── websocket/
│   │       └── storage/
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── controllers/     # Presentation Layer
│   │   ├── gateways/
│   │   ├── dto/
│   │   ├── application/     # Application Layer
│   │   │   ├── services/
│   │   │   └── usecases/
│   │   ├── domain/          # Domain Layer
│   │   │   ├── entities/
│   │   │   ├── valueObjects/
│   │   │   └── services/
│   │   └── infrastructure/  # Infrastructure Layer
│   │       ├── database/
│   │       ├── redis/
│   │       └── config/
│   └── package.json
│
└── docker-compose.yml
```

---

## ✅ 레이어별 체크리스트

### Presentation Layer
- [ ] UI와 비즈니스 로직 분리
- [ ] DTO 유효성 검증
- [ ] 에러 메시지 포맷팅
- [ ] 요청/응답 변환

### Application Layer
- [ ] 유즈케이스 구현
- [ ] 트랜잭션 경계 설정
- [ ] 워크플로우 조정
- [ ] 이벤트 발행

### Domain Layer
- [ ] 비즈니스 규칙 캡슐화
- [ ] 도메인 모델 무결성
- [ ] 외부 의존성 없음
- [ ] 단위 테스트 가능

### Infrastructure Layer
- [ ] 인터페이스 구현
- [ ] 외부 시스템 통합
- [ ] 기술적 세부사항 숨김
- [ ] 교체 가능한 구현

---

## 🎯 핵심 이점

1. **유지보수성**: 각 레이어가 독립적으로 수정 가능
2. **테스트 용이성**: 레이어별 독립적 테스트
3. **확장성**: 레이어별 독립적 확장
4. **재사용성**: 도메인 로직 재사용
5. **명확한 책임**: 각 레이어의 역할이 명확

이 레이어드 아키텍처는 코드의 구조화와 유지보수를 크게 개선합니다.