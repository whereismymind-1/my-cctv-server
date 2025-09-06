# 🎬 실시간 댓글 오버레이 시스템 (Danmaku Live Stream)

> 니코니코 동화와 티비플 스타일의 실시간 댓글(弾幕/Danmaku) 시스템

## 📌 프로젝트 개요

### 핵심 목표
- **간단하고 실용적인** 실시간 댓글 오버레이 시스템
- **최소한의 기술 스택**으로 최대 효과
- **실제 구현 가능한** MVP 수준의 설계

### 주요 기능
1. **실시간 스트리밍**: RTMP/WebRTC 기반 비디오 스트리밍
2. **Danmaku 댓글**: 화면을 가로지르는 유동 댓글
3. **댓글 명령어**: 색상, 크기, 위치 제어 (니코니코 스타일)
4. **간단한 모더레이션**: 금칙어 필터, 신고 기능
5. **기본 통계**: 시청자 수, 댓글 수

### 참고 프로젝트
- [DPlayer](https://github.com/DIYgod/DPlayer) - 16k⭐ HTML5 danmaku 비디오 플레이어
- [niconico-twitch](https://github.com/tekigg/niconico-twitch) - 니코니코 스타일 Twitch 오버레이
- [DanMage](https://danmage.com/) - 브라우저 확장 danmaku 시스템

---

## 🏗️ 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend (React)                    │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │Video Player │  │Comment Canvas│  │   Chat UI    │  │
│  └─────────────┘  └──────────────┘  └──────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │ WebSocket
┌────────────────────────┴────────────────────────────────┐
│                    Backend (NestJS)                      │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  API Routes │  │WebSocket Hub │  │Stream Service│  │
│  └─────────────┘  └──────────────┘  └──────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │
        ┌────────────────┴────────────────┐
        │                                  │
   ┌────▼─────┐                    ┌──────▼──────┐
   │PostgreSQL│                    │    Redis    │
   │(Main DB) │                    │   (Cache)   │
   └──────────┘                    └─────────────┘
```

---

## 💻 Frontend (React + TypeScript)

### 기술 스택
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite (빠른 개발 환경)
- **State**: Zustand (간단한 상태 관리)
- **API**: React Query (서버 상태 관리)
- **Style**: Tailwind CSS (유틸리티 CSS)
- **Canvas**: HTML5 Canvas API (댓글 렌더링)

### 핵심 컴포넌트

#### 1. VideoPlayer
```typescript
// 간단한 비디오 플레이어 래퍼
interface VideoPlayerProps {
  streamUrl: string;
  onTimeUpdate: (time: number) => void;
}

// HLS.js 또는 네이티브 video 태그 사용
```

#### 2. DanmakuCanvas (댓글 렌더링)
```typescript
interface DanmakuComment {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  size: 'small' | 'medium' | 'big';
  type: 'scroll' | 'top' | 'bottom';
  speed: number;
}

// Canvas 2D Context로 댓글 렌더링
// requestAnimationFrame으로 60fps 애니메이션
```

#### 3. CommentInput
```typescript
// 니코니코 스타일 명령어 파싱
// "ue red big" → {position: 'top', color: 'red', size: 'big'}
```

### 디렉토리 구조 (간소화)
```
frontend/
├── src/
│   ├── components/
│   │   ├── VideoPlayer.tsx
│   │   ├── DanmakuCanvas.tsx
│   │   ├── CommentInput.tsx
│   │   └── ViewerList.tsx
│   ├── hooks/
│   │   ├── useWebSocket.ts
│   │   ├── useDanmaku.ts
│   │   └── useStream.ts
│   ├── stores/
│   │   └── streamStore.ts
│   ├── utils/
│   │   ├── danmakuParser.ts
│   │   └── commentCommands.ts
│   └── App.tsx
```

---

## 🚀 Backend (NestJS)

### 기술 스택
- **Framework**: NestJS (구조화된 Node.js)
- **WebSocket**: Socket.io (실시간 통신)
- **Database**: PostgreSQL (메인 데이터)
- **Cache**: Redis (세션, 실시간 데이터)
- **ORM**: TypeORM (데이터베이스 추상화)

### 핵심 모듈

#### 1. Stream Module
```typescript
// 스트림 생성, 관리
@Controller('streams')
export class StreamController {
  @Post()
  createStream(dto: CreateStreamDto) {}
  
  @Get(':id')
  getStream(id: string) {}
  
  @Post(':id/start')
  startStream(id: string) {}
}
```

#### 2. Comment Module
```typescript
// 댓글 처리 및 브로드캐스팅
@WebSocketGateway()
export class CommentGateway {
  @SubscribeMessage('comment')
  handleComment(client: Socket, data: CommentDto) {
    // 1. 유효성 검증
    // 2. 레인 할당
    // 3. 브로드캐스트
  }
}
```

#### 3. Lane Manager (충돌 방지)
```typescript
// 댓글이 겹치지 않도록 레인 관리
class LaneManager {
  assignLane(comment: Comment): number {
    // 빈 레인 찾기
    // 충돌 검사
    return laneNumber;
  }
}
```

### 디렉토리 구조 (간소화)
```
backend/
├── src/
│   ├── modules/
│   │   ├── stream/
│   │   ├── comment/
│   │   └── user/
│   ├── common/
│   │   ├── guards/
│   │   └── filters/
│   └── main.ts
```

---

## 🗄️ Database Schema (PostgreSQL + Redis)

### PostgreSQL Tables

#### users (사용자)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### streams (방송)
```sql
CREATE TABLE streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'waiting',
  viewer_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### comments (댓글 - 보관용)
```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID REFERENCES streams(id),
  user_id UUID REFERENCES users(id),
  text VARCHAR(200) NOT NULL,
  command VARCHAR(50),
  vpos INTEGER, -- 비디오 위치
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_comments_stream ON comments(stream_id, created_at);
```

### Redis Structure

```redis
# 실시간 댓글 큐
stream:{streamId}:comments -> List
  ["comment1_json", "comment2_json", ...]

# 활성 시청자
stream:{streamId}:viewers -> Set
  ["userId1", "userId2", ...]

# 댓글 레인 상태
stream:{streamId}:lanes -> Hash
  { "0": "occupiedUntil", "1": "occupiedUntil" }

# Rate Limiting
rate:comment:{userId} -> String (counter)
  TTL: 60 seconds
```

---

## 📡 WebSocket Protocol

### 이벤트 정의

#### Client → Server
```typescript
// 방 입장
socket.emit('join', { streamId, userId })

// 댓글 전송
socket.emit('comment', {
  text: "안녕하세요",
  command: "ue red big"  // 니코니코 명령어
})

// 하트비트
socket.emit('ping')
```

#### Server → Client
```typescript
// 새 댓글
socket.on('new_comment', {
  id: "comment_id",
  text: "안녕하세요",
  style: { color: "red", size: "big", position: "top" },
  x: 1280,
  y: 100,
  lane: 3
})

// 시청자 수 업데이트
socket.on('viewer_count', { count: 152 })
```

---

## 🎮 댓글 명령어 (니코니코 스타일)

### 위치 명령어
- `ue` / `top` - 상단 고정
- `shita` / `bottom` - 하단 고정
- `naka` - 중앙 (기본값: 유동)

### 크기 명령어
- `small` - 작은 크기
- `medium` - 중간 (기본값)
- `big` - 큰 크기

### 색상 명령어
- `white`, `red`, `pink`, `orange`, `yellow`
- `green`, `cyan`, `blue`, `purple`, `black`

### 사용 예시
```
"ue red big" → 상단 고정, 빨간색, 큰 크기
"shita green" → 하단 고정, 초록색, 중간 크기
"big" → 유동, 흰색, 큰 크기
```

---

## 🚦 성능 최적화

### Frontend
1. **Canvas 최적화**
   - 화면 밖 댓글 제거
   - requestAnimationFrame 사용
   - 댓글 개수 제한 (화면당 최대 50개)

2. **메모리 관리**
   - 댓글 객체 재사용
   - 5분 이상 지난 댓글 자동 삭제

### Backend
1. **캐싱 전략**
   - Redis로 실시간 데이터 처리
   - PostgreSQL은 영구 저장용

2. **Rate Limiting**
   - 사용자당 분당 30개 댓글 제한
   - IP당 분당 100개 요청 제한

---

## 🛠️ 개발 환경 설정

### Frontend
```bash
cd frontend
npm install
npm run dev  # Vite 개발 서버
```

### Backend
```bash
cd backend
npm install
npm run start:dev  # NestJS 개발 서버
```

### Docker Compose (개발용)
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: danmaku
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
  
  redis:
    image: redis:7
    ports:
      - "6379:6379"
```

---

## 📊 예상 성능

### 목표 지표
- **동시 시청자**: 500명
- **초당 댓글**: 100개
- **댓글 지연**: < 100ms
- **메모리 사용**: < 500MB

### 제한 사항
- 단일 서버 기준
- 복잡한 이펙트 없음
- 기본 모더레이션만 지원

---

## 🚀 향후 확장 가능성

### Phase 1 (현재)
- ✅ 기본 스트리밍
- ✅ Danmaku 댓글
- ✅ 간단한 명령어

### Phase 2 (추가 가능)
- [ ] 모바일 지원
- [ ] 이모티콘/스티커
- [ ] 사용자 레벨 시스템

### Phase 3 (장기)
- [ ] 클립 생성
- [ ] 다시보기
- [ ] 수익화 기능

---

## 📚 참고 자료

- [DPlayer Documentation](https://github.com/DIYgod/DPlayer)
- [니코니코 동화 API](https://site.nicovideo.jp/search-api-docs/search.html)
- [Canvas API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [NestJS Documentation](https://docs.nestjs.com/)

---

이 설계는 **실제 구현 가능한 MVP** 수준으로, 복잡한 기능 없이 핵심 기능에만 집중했습니다.