# 🗄️ 데이터베이스 설계

## 개요
- **PostgreSQL**: 메인 데이터베이스 (영구 저장)
- **Redis**: 캐시 & 실시간 데이터

---

## 📊 PostgreSQL Schema

### 1. users 테이블
사용자 정보 저장

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
```

### 2. streams 테이블
방송 정보 저장

```sql
CREATE TABLE streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  stream_key VARCHAR(100) UNIQUE,
  status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'live', 'ended')),
  viewer_count INTEGER DEFAULT 0,
  max_viewers INTEGER DEFAULT 0,
  allow_comments BOOLEAN DEFAULT TRUE,
  comment_cooldown INTEGER DEFAULT 1000, -- milliseconds
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_streams_owner ON streams(owner_id);
CREATE INDEX idx_streams_status ON streams(status);
CREATE INDEX idx_streams_created ON streams(created_at DESC);
```

### 3. comments 테이블
댓글 아카이브 (선택적 저장)

```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  text VARCHAR(200) NOT NULL,
  command VARCHAR(50), -- 니코니코 스타일 명령어
  vpos INTEGER, -- 비디오 재생 위치 (ms)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_comments_stream ON comments(stream_id);
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_comments_created ON comments(created_at DESC);
```

### 4. follows 테이블 (선택사항)
팔로우 관계

```sql
CREATE TABLE follows (
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (follower_id, following_id)
);

-- 인덱스
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);
```

### 5. stream_stats 테이블 (선택사항)
방송 통계

```sql
CREATE TABLE stream_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
  total_viewers INTEGER DEFAULT 0,
  peak_viewers INTEGER DEFAULT 0,
  total_comments INTEGER DEFAULT 0,
  avg_watch_time INTEGER DEFAULT 0, -- seconds
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_stream_stats_stream ON stream_stats(stream_id);
```

---

## 🔴 Redis Structure

### 1. 실시간 댓글
```redis
# 댓글 큐 (List)
# 최근 100개 댓글만 유지
stream:{streamId}:comments
  LPUSH comment_json
  LTRIM 0 99

# 예시
stream:abc123:comments -> [
  '{"id":"1","text":"안녕","user":"kim","lane":3,...}',
  '{"id":"2","text":"반가워","user":"lee","lane":5,...}'
]
```

### 2. 활성 시청자
```redis
# 시청자 Set
stream:{streamId}:viewers -> SADD userId
  
# 시청자 수
stream:{streamId}:viewer_count -> INCR/DECR

# 예시
stream:abc123:viewers -> ["user1", "user2", "user3"]
stream:abc123:viewer_count -> 3
```

### 3. 댓글 레인 관리
```redis
# 레인 점유 상태 (Hash)
stream:{streamId}:lanes
  HSET lane_number occupied_until_timestamp
  
# 예시
stream:abc123:lanes -> {
  "0": "1704067260000",
  "1": "1704067258000",
  "2": "1704067255000"
}
```

### 4. Rate Limiting
```redis
# 댓글 제한 (String with TTL)
rate:comment:{userId}:{streamId} -> COUNT
  INCR
  EXPIRE 60

# API 제한
rate:api:{userId} -> COUNT
  INCR
  EXPIRE 60

# 예시
rate:comment:user123:stream456 -> 5  # 60초 동안 5개 댓글
rate:api:user123 -> 45  # 60초 동안 45개 API 호출
```

### 5. 세션 관리
```redis
# 사용자 세션 (Hash)
session:{userId}
  HSET token "jwt_token"
  HSET socketId "socket_id"
  HSET currentStream "stream_id"
  EXPIRE 86400  # 24시간

# 예시
session:user123 -> {
  "token": "eyJhbGc...",
  "socketId": "abc123",
  "currentStream": "stream456"
}
```

### 6. 캐시
```redis
# 스트림 정보 캐시 (String with TTL)
cache:stream:{streamId} -> JSON
  SET stream_info_json
  EXPIRE 30

# 사용자 정보 캐시
cache:user:{userId} -> JSON
  SET user_info_json
  EXPIRE 300

# 예시
cache:stream:abc123 -> '{"id":"abc123","title":"방송중","viewerCount":152}'
cache:user:user123 -> '{"id":"user123","username":"김철수","level":5}'
```

---

## 🛠️ 데이터베이스 초기화

### PostgreSQL 설정
```sql
-- 데이터베이스 생성
CREATE DATABASE danmaku_live;

-- 확장 기능 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 테이블 생성 (위의 스키마 실행)

-- 기본 사용자 생성 (테스트용)
INSERT INTO users (username, email, password_hash) 
VALUES ('testuser', 'test@example.com', '$2b$10$...');
```

### Redis 설정
```bash
# Redis 시작
redis-server

# 설정 확인
redis-cli
> CONFIG SET maxmemory 256mb
> CONFIG SET maxmemory-policy allkeys-lru
```

---

## 📈 데이터 흐름

### 댓글 처리 흐름
```
1. 사용자가 댓글 입력
   ↓
2. WebSocket으로 서버 전송
   ↓
3. Rate Limiting 체크 (Redis)
   ↓
4. 레인 할당 (Redis)
   ↓
5. 모든 시청자에게 브로드캐스트
   ↓
6. Redis에 임시 저장 (실시간 표시용)
   ↓
7. PostgreSQL에 영구 저장 (선택적, 다시보기용)
```

### 스트림 시작/종료 흐름
```
시작:
1. PostgreSQL: streams 테이블 status = 'live'
2. Redis: 활성 스트림 Set에 추가
3. Redis: 시청자/댓글 구조 초기화

종료:
1. PostgreSQL: streams 테이블 status = 'ended'
2. PostgreSQL: 통계 저장
3. Redis: 모든 임시 데이터 삭제
```

---

## 🔧 유지보수

### 정기 작업

#### 1. PostgreSQL
```sql
-- 매일: 오래된 댓글 삭제 (30일 이상)
DELETE FROM comments 
WHERE created_at < NOW() - INTERVAL '30 days';

-- 매주: 테이블 최적화
VACUUM ANALYZE comments;
VACUUM ANALYZE streams;

-- 매월: 인덱스 재구성
REINDEX TABLE comments;
REINDEX TABLE streams;
```

#### 2. Redis
```bash
# 메모리 사용량 확인
redis-cli INFO memory

# 오래된 키 정리 (자동으로 TTL 설정됨)
# LRU 정책으로 자동 관리

# 백업 (선택사항)
redis-cli BGSAVE
```

---

## 📊 성능 고려사항

### PostgreSQL
- **Connection Pool**: 20-50 연결
- **Query Timeout**: 5초
- **Slow Query Log**: 100ms 이상

### Redis
- **Max Memory**: 256MB-1GB
- **Eviction Policy**: allkeys-lru
- **Persistence**: AOF 비활성화 (성능 우선)

### 예상 용량
- **사용자 1,000명**: ~1MB
- **스트림 100개/일**: ~10MB
- **댓글 10,000개/일**: ~5MB
- **Redis 메모리**: ~100MB (피크 시)

---

## 🚀 확장 계획

### 단기 (현재 구조로 가능)
- 동시 시청자: ~500명
- 동시 스트림: ~10개
- 초당 댓글: ~100개

### 중기 (읽기 전용 복제본 추가)
- 동시 시청자: ~2,000명
- 동시 스트림: ~50개
- 초당 댓글: ~500개

### 장기 (샤딩 필요)
- 동시 시청자: 10,000명+
- 동시 스트림: 200개+
- 초당 댓글: 2,000개+

---

## 🐳 Docker Compose

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: danmaku_postgres
    environment:
      POSTGRES_DB: danmaku_live
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: password123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql

  redis:
    image: redis:7-alpine
    container_name: danmaku_redis
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

---

이 데이터베이스 설계는 **실용적이고 확장 가능한** 구조로, 초기 MVP부터 중규모 서비스까지 대응 가능합니다.