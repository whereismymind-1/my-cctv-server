# 📡 API & WebSocket 명세서

## 기본 정보

### Base URL
```
Development: http://localhost:3000/api
Production: https://api.yourdomain.com
```

### 인증
```http
Authorization: Bearer <JWT_TOKEN>
```

---

## 🔌 REST API

### 1. 인증 API

#### POST /api/auth/register
회원가입
```json
// Request
{
  "username": "user123",
  "email": "user@example.com",
  "password": "password123"
}

// Response (200 OK)
{
  "user": {
    "id": "uuid",
    "username": "user123",
    "email": "user@example.com"
  },
  "token": "jwt_token"
}
```

#### POST /api/auth/login
로그인
```json
// Request
{
  "email": "user@example.com",
  "password": "password123"
}

// Response (200 OK)
{
  "user": {
    "id": "uuid",
    "username": "user123"
  },
  "token": "jwt_token"
}
```

### 2. 스트림 API

#### GET /api/streams
스트림 목록
```json
// Query: ?status=live&page=1&limit=20

// Response (200 OK)
{
  "streams": [
    {
      "id": "stream_uuid",
      "title": "방송 제목",
      "owner": {
        "id": "user_uuid",
        "username": "streamer123"
      },
      "viewerCount": 152,
      "status": "live",
      "thumbnail": "https://...",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 20
}
```

#### GET /api/streams/:id
스트림 상세 정보
```json
// Response (200 OK)
{
  "id": "stream_uuid",
  "title": "방송 제목",
  "description": "방송 설명",
  "owner": {
    "id": "user_uuid",
    "username": "streamer123"
  },
  "viewerCount": 152,
  "status": "live",
  "settings": {
    "allowComments": true,
    "commentCooldown": 1000
  },
  "streamUrl": "rtmp://...",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

#### POST /api/streams
스트림 생성
```json
// Request
{
  "title": "새 방송",
  "description": "방송 설명"
}

// Response (201 Created)
{
  "id": "stream_uuid",
  "title": "새 방송",
  "streamKey": "stream_key_xxx",
  "streamUrl": "rtmp://server/live/stream_key_xxx"
}
```

#### POST /api/streams/:id/start
방송 시작
```json
// Response (200 OK)
{
  "status": "live",
  "startedAt": "2024-01-01T00:00:00Z"
}
```

#### POST /api/streams/:id/end
방송 종료
```json
// Response (200 OK)
{
  "status": "ended",
  "endedAt": "2024-01-01T00:00:00Z"
}
```

### 3. 댓글 API (보관용)

#### GET /api/streams/:streamId/comments
댓글 조회 (녹화된 댓글)
```json
// Query: ?limit=100&offset=0

// Response (200 OK)
{
  "comments": [
    {
      "id": "comment_uuid",
      "text": "안녕하세요",
      "command": "ue red big",
      "user": {
        "id": "user_uuid",
        "username": "viewer123"
      },
      "vpos": 12345,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 500
}
```

---

## 🔄 WebSocket Protocol

### 연결
```javascript
const socket = io('ws://localhost:3000', {
  auth: {
    token: 'jwt_token'
  }
});
```

### 이벤트

#### 1. 연결 관리

##### Client → Server: `join_room`
방 입장
```javascript
socket.emit('join_room', {
  streamId: 'stream_uuid'
});
```

##### Server → Client: `room_joined`
입장 완료
```javascript
socket.on('room_joined', {
  streamId: 'stream_uuid',
  viewerCount: 152
});
```

##### Client → Server: `leave_room`
방 퇴장
```javascript
socket.emit('leave_room', {
  streamId: 'stream_uuid'
});
```

#### 2. 댓글 시스템

##### Client → Server: `send_comment`
댓글 전송
```javascript
socket.emit('send_comment', {
  streamId: 'stream_uuid',
  text: '안녕하세요',
  command: 'ue red big'  // 선택사항
});
```

##### Server → Client: `new_comment`
새 댓글 수신
```javascript
socket.on('new_comment', {
  id: 'comment_uuid',
  text: '안녕하세요',
  user: {
    id: 'user_uuid',
    username: 'viewer123'
  },
  style: {
    position: 'top',    // 'scroll' | 'top' | 'bottom'
    color: '#FF0000',
    size: 'big'         // 'small' | 'medium' | 'big'
  },
  lane: 3,              // 레인 번호
  x: 1280,              // 시작 X 좌표
  y: 100,               // Y 좌표
  speed: 200,           // 픽셀/초
  duration: 4000        // 표시 시간 (ms)
});
```

#### 3. 상태 업데이트

##### Server → Client: `viewer_count`
시청자 수 업데이트
```javascript
socket.on('viewer_count', {
  streamId: 'stream_uuid',
  count: 153
});
```

##### Server → Client: `stream_status`
스트림 상태 변경
```javascript
socket.on('stream_status', {
  streamId: 'stream_uuid',
  status: 'ended'  // 'waiting' | 'live' | 'ended'
});
```

#### 4. 에러 처리

##### Server → Client: `error`
에러 메시지
```javascript
socket.on('error', {
  code: 'RATE_LIMIT',
  message: '댓글을 너무 빠르게 보내고 있습니다',
  retryAfter: 1000  // ms
});
```

---

## 🎮 댓글 명령어

### 명령어 형식
```
[위치] [색상] [크기]
```

### 위치 명령어
- `ue` / `top` - 상단 고정
- `shita` / `bottom` - 하단 고정
- (없음) - 기본 스크롤

### 색상 명령어
- `white`, `red`, `pink`, `orange`, `yellow`
- `green`, `cyan`, `blue`, `purple`, `black`

### 크기 명령어
- `small` - 작게
- `big` - 크게
- (없음) - 중간

### 예시
```
"ue red big"     → 상단, 빨강, 크게
"shita green"    → 하단, 초록, 중간
"big"            → 스크롤, 흰색, 크게
""               → 스크롤, 흰색, 중간 (기본값)
```

---

## ⚠️ 에러 코드

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `UNAUTHORIZED` | 인증 필요 | 401 |
| `FORBIDDEN` | 권한 없음 | 403 |
| `NOT_FOUND` | 리소스 없음 | 404 |
| `RATE_LIMIT` | 요청 제한 초과 | 429 |
| `VALIDATION_ERROR` | 입력값 오류 | 400 |
| `STREAM_OFFLINE` | 스트림 오프라인 | 503 |
| `SERVER_ERROR` | 서버 오류 | 500 |

---

## 🚦 Rate Limiting

### 제한 규칙
- **API 요청**: 분당 60회
- **댓글 전송**: 분당 30개
- **WebSocket 메시지**: 분당 100개

### 응답 헤더
```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1704067260
```

---

## 📝 예제 코드

### Frontend (React)
```typescript
// hooks/useWebSocket.ts
import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';

export const useWebSocket = (streamId: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    const newSocket = io('http://localhost:3000', {
      auth: {
        token: localStorage.getItem('token')
      }
    });

    newSocket.emit('join_room', { streamId });

    newSocket.on('new_comment', (comment) => {
      setComments(prev => [...prev, comment]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit('leave_room', { streamId });
      newSocket.close();
    };
  }, [streamId]);

  const sendComment = (text: string, command?: string) => {
    socket?.emit('send_comment', {
      streamId,
      text,
      command
    });
  };

  return { comments, sendComment };
};
```

### Backend (NestJS)
```typescript
// comment.gateway.ts
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class CommentGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('send_comment')
  async handleComment(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SendCommentDto,
  ) {
    // 1. Rate limiting check
    const canSend = await this.checkRateLimit(client.data.userId);
    if (!canSend) {
      client.emit('error', {
        code: 'RATE_LIMIT',
        message: 'Too many comments'
      });
      return;
    }

    // 2. Parse command
    const style = this.parseCommand(data.command);
    
    // 3. Assign lane
    const lane = this.laneManager.assignLane(data.streamId);
    
    // 4. Create comment object
    const comment = {
      id: uuid(),
      text: data.text,
      user: client.data.user,
      style,
      lane,
      x: 1280,
      y: lane * 30 + 50,
      speed: 200,
      duration: 4000
    };

    // 5. Broadcast to room
    this.server.to(data.streamId).emit('new_comment', comment);
    
    // 6. Save to database (async)
    this.commentService.save(comment);
  }
}
```

---

## 🧪 테스트

### cURL 예제
```bash
# 로그인
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# 스트림 목록
curl http://localhost:3000/api/streams?status=live \
  -H "Authorization: Bearer YOUR_TOKEN"

# 스트림 생성
curl -X POST http://localhost:3000/api/streams \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"테스트 방송","description":"설명"}'
```

### WebSocket 테스트
```javascript
// Node.js 테스트 스크립트
const io = require('socket.io-client');

const socket = io('http://localhost:3000', {
  auth: { token: 'your_token' }
});

socket.on('connect', () => {
  console.log('Connected');
  
  // Join room
  socket.emit('join_room', { streamId: 'test-stream' });
  
  // Send comment
  setTimeout(() => {
    socket.emit('send_comment', {
      streamId: 'test-stream',
      text: '테스트 댓글',
      command: 'ue red big'
    });
  }, 1000);
});

socket.on('new_comment', (comment) => {
  console.log('New comment:', comment);
});
```