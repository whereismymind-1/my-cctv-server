# 📚 CLAUDE.md - Development Guidelines & API Reference

> This document contains critical information for Claude to understand and work with this project effectively.

## 🎯 Project Overview

**Project**: Danmaku Live Streaming Service (니코니코/티비플 스타일)  
**Tech Stack**: 
- Frontend: React + TypeScript + Vite + Zustand + React Query
- Backend: NestJS + TypeScript + Socket.io
- Database: PostgreSQL + Redis
- Architecture: Layered Architecture

## 🏗️ Architecture Summary

### Layered Structure
```
Presentation → Application → Domain ← Infrastructure
```

### Directory Structure
```
v2/
├── frontend/          # React application
├── backend/           # NestJS application
├── ARCHITECTURE.md    # System architecture
├── API_SPEC.md       # API specification
├── DATABASE.md       # Database schema
├── SOFTWARE_ARCHITECTURE.md  # Layered architecture details
└── PRODUCTION_ROADMAP.md    # Production roadmap
```

---

## 📡 API Documentation

### Base Configuration
```typescript
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.yourdomain.com' 
  : 'http://localhost:3000';

const WS_URL = process.env.NODE_ENV === 'production'
  ? 'wss://api.yourdomain.com'
  : 'ws://localhost:3000';
```

### Authentication
All protected endpoints require JWT token in header:
```http
Authorization: Bearer <JWT_TOKEN>
```

---

## 🔌 REST API Endpoints

### Auth Endpoints

#### POST /api/auth/register
```typescript
// Request
interface RegisterDto {
  username: string;     // 3-20 chars, alphanumeric
  email: string;        // valid email
  password: string;     // min 8 chars
}

// Response (201 Created)
interface RegisterResponse {
  user: {
    id: string;
    username: string;
    email: string;
    level: number;
    createdAt: string;
  };
  token: string;
}

// Errors
400 - Validation error (username taken, invalid email)
409 - Conflict (email already exists)
500 - Server error
```

#### POST /api/auth/login
```typescript
// Request
interface LoginDto {
  email: string;
  password: string;
}

// Response (200 OK)
interface LoginResponse {
  user: {
    id: string;
    username: string;
    email: string;
    level: number;
  };
  token: string;
}

// Errors
401 - Invalid credentials
429 - Too many attempts
500 - Server error
```

#### POST /api/auth/refresh
```typescript
// Request
interface RefreshDto {
  refreshToken: string;
}

// Response (200 OK)
interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

// Errors
401 - Invalid or expired token
```

### Stream Endpoints

#### GET /api/streams
```typescript
// Query Parameters
interface StreamsQuery {
  status?: 'live' | 'ended' | 'waiting';  // Filter by status
  page?: number;        // Default: 1
  limit?: number;       // Default: 20, Max: 100
  search?: string;      // Search in title/description
}

// Response (200 OK)
interface StreamsResponse {
  streams: Stream[];
  total: number;
  page: number;
  limit: number;
}

interface Stream {
  id: string;
  title: string;
  description: string;
  thumbnail: string | null;
  owner: {
    id: string;
    username: string;
    avatar: string | null;
  };
  viewerCount: number;
  status: 'live' | 'ended' | 'waiting';
  createdAt: string;
  startedAt: string | null;
}
```

#### GET /api/streams/:id
```typescript
// Response (200 OK)
interface StreamDetailResponse {
  id: string;
  title: string;
  description: string;
  thumbnail: string | null;
  streamKey: string;        // Only for owner
  streamUrl: string;        // RTMP URL for streaming
  owner: {
    id: string;
    username: string;
    avatar: string | null;
    level: number;
  };
  viewerCount: number;
  maxViewers: number;
  status: 'live' | 'ended' | 'waiting';
  settings: {
    allowComments: boolean;
    commentCooldown: number;  // milliseconds
    maxCommentLength: number;
    allowAnonymous: boolean;
  };
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
}

// Errors
404 - Stream not found
```

#### POST /api/streams 🔒
```typescript
// Request
interface CreateStreamDto {
  title: string;           // 1-100 chars
  description?: string;    // Max 500 chars
  thumbnail?: string;      // Base64 or URL
  settings?: {
    allowComments?: boolean;
    commentCooldown?: number;
    maxCommentLength?: number;
  };
}

// Response (201 Created)
interface CreateStreamResponse {
  id: string;
  title: string;
  streamKey: string;      // Secret key for OBS/streaming software
  streamUrl: string;      // RTMP URL
  status: 'waiting';
}

// Errors
400 - Validation error
401 - Unauthorized
429 - Rate limit (max 5 streams per hour)
```

#### POST /api/streams/:id/start 🔒
```typescript
// Response (200 OK)
interface StartStreamResponse {
  status: 'live';
  startedAt: string;
}

// Errors
400 - Stream already live or ended
401 - Unauthorized (not owner)
404 - Stream not found
```

#### POST /api/streams/:id/end 🔒
```typescript
// Response (200 OK)
interface EndStreamResponse {
  status: 'ended';
  endedAt: string;
  duration: number;  // seconds
  stats: {
    totalViewers: number;
    peakViewers: number;
    totalComments: number;
  };
}

// Errors
400 - Stream not live
401 - Unauthorized (not owner)
404 - Stream not found
```

#### DELETE /api/streams/:id 🔒
```typescript
// Response (204 No Content)

// Errors
401 - Unauthorized (not owner)
404 - Stream not found
409 - Cannot delete live stream
```

### Comment Endpoints (for archived comments)

#### GET /api/streams/:streamId/comments
```typescript
// Query Parameters
interface CommentsQuery {
  limit?: number;     // Default: 100, Max: 500
  offset?: number;    // Default: 0
  userId?: string;    // Filter by user
}

// Response (200 OK)
interface CommentsResponse {
  comments: Comment[];
  total: number;
  hasMore: boolean;
}

interface Comment {
  id: string;
  text: string;
  command: string | null;  // Niconico style command
  user: {
    id: string;
    username: string;
    level: number;
  };
  vpos: number;           // Video position in ms
  createdAt: string;
}
```

### User Endpoints

#### GET /api/users/me 🔒
```typescript
// Response (200 OK)
interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar: string | null;
  level: number;
  exp: number;
  createdAt: string;
  stats: {
    totalStreams: number;
    totalComments: number;
    totalWatchTime: number;  // seconds
  };
}
```

#### PUT /api/users/me 🔒
```typescript
// Request
interface UpdateProfileDto {
  username?: string;
  avatar?: string;  // Base64 or URL
}

// Response (200 OK)
interface UpdateProfileResponse {
  user: UserProfile;
}

// Errors
400 - Validation error
409 - Username taken
```

---

## 🔄 WebSocket Events

### Connection
```typescript
const socket = io(WS_URL, {
  auth: {
    token: localStorage.getItem('token')
  },
  transports: ['websocket'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});
```

### Client → Server Events

#### join_room
```typescript
// Join a stream room
socket.emit('join_room', {
  streamId: string;
});

// Response event: room_joined
socket.on('room_joined', (data: {
  streamId: string;
  viewerCount: number;
  roomSettings: {
    commentCooldown: number;
    maxCommentLength: number;
  };
}) => {});
```

#### leave_room
```typescript
// Leave current room
socket.emit('leave_room', {
  streamId: string;
});
```

#### send_comment
```typescript
// Send a comment
socket.emit('send_comment', {
  streamId: string;
  text: string;           // Max 200 chars
  command?: string;       // Optional: "ue red big"
});

// Success response
socket.on('comment_sent', (data: {
  success: boolean;
  commentId?: string;
  error?: string;
}) => {});
```

### Server → Client Events

#### new_comment
```typescript
// Receive new comment
socket.on('new_comment', (comment: {
  id: string;
  text: string;
  user: {
    id: string;
    username: string;
    level: number;
  };
  style: {
    position: 'scroll' | 'top' | 'bottom';
    color: string;      // Hex color
    size: 'small' | 'medium' | 'big';
  };
  lane: number;         // 0-11 lane number
  x: number;           // Starting X position
  y: number;           // Y position
  speed: number;       // pixels per second
  duration: number;    // milliseconds
}) => {});
```

#### viewer_count
```typescript
// Viewer count update
socket.on('viewer_count', (data: {
  streamId: string;
  count: number;
}) => {});
```

#### stream_status
```typescript
// Stream status change
socket.on('stream_status', (data: {
  streamId: string;
  status: 'waiting' | 'live' | 'ended';
}) => {});
```

#### error
```typescript
// Error message
socket.on('error', (error: {
  code: string;
  message: string;
  retryAfter?: number;  // milliseconds
}) => {});

// Error codes:
// RATE_LIMIT - Too many comments
// STREAM_OFFLINE - Stream is not live
// UNAUTHORIZED - Not authenticated
// ROOM_FULL - Max viewers reached
```

---

## 🎮 Comment Commands (Niconico Style)

### Command Format
```
[position] [color] [size]
```

### Position Commands
- `ue` / `top` - Fixed at top
- `shita` / `bottom` - Fixed at bottom
- (none) - Scrolling (default)

### Color Commands
- `white` (default)
- `red`, `pink`, `orange`, `yellow`
- `green`, `cyan`, `blue`, `purple`
- `black`

### Size Commands
- `small` - 75% size
- `medium` - 100% size (default)
- `big` - 150% size

### Examples
```
"ue red big"      → Top, Red, Large
"shita green"     → Bottom, Green, Medium
"big"             → Scrolling, White, Large
"red"             → Scrolling, Red, Medium
""                → Scrolling, White, Medium (all defaults)
```

---

## 🚦 Rate Limiting

### Limits
```typescript
const RATE_LIMITS = {
  api: {
    requests: 60,       // per minute
    window: 60000      // 1 minute
  },
  comments: {
    requests: 30,       // per minute per stream
    window: 60000      // 1 minute
  },
  streams: {
    create: 5,          // per hour
    window: 3600000    // 1 hour
  },
  auth: {
    login: 5,           // per 15 minutes
    window: 900000     // 15 minutes
  }
};
```

### Rate Limit Headers
```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1704067260000
```

---

## ⚠️ Error Handling

### Error Response Format
```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: number;
}
```

### Common Error Codes
```typescript
const ERROR_CODES = {
  // Auth errors (4xx)
  UNAUTHORIZED: 'Authentication required',
  INVALID_TOKEN: 'Invalid or expired token',
  FORBIDDEN: 'Access denied',
  
  // Validation errors (4xx)
  VALIDATION_ERROR: 'Input validation failed',
  NOT_FOUND: 'Resource not found',
  CONFLICT: 'Resource already exists',
  
  // Rate limiting (429)
  RATE_LIMIT: 'Too many requests',
  
  // Server errors (5xx)
  INTERNAL_ERROR: 'Internal server error',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable'
};
```

---

## 🧪 Testing the API

### Setup Test Environment
```bash
# Start services
docker-compose up -d

# Run migrations
npm run migration:run

# Seed test data
npm run seed
```

### Test Credentials
```typescript
// Test users (development only)
const TEST_USERS = [
  {
    email: 'test1@example.com',
    password: 'password123',
    username: 'testuser1'
  },
  {
    email: 'test2@example.com',
    password: 'password123',
    username: 'testuser2'
  }
];

// Test stream
const TEST_STREAM = {
  id: 'test-stream-001',
  streamKey: 'test-key-12345'
};
```

### cURL Examples
```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Create stream (with token)
curl -X POST http://localhost:3000/api/streams \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"My Stream","description":"Test stream"}'

# Get streams
curl http://localhost:3000/api/streams?status=live

# WebSocket test (Node.js)
const io = require('socket.io-client');
const socket = io('http://localhost:3000', {
  auth: { token: 'YOUR_TOKEN' }
});

socket.emit('join_room', { streamId: 'test-stream-001' });
socket.emit('send_comment', {
  streamId: 'test-stream-001',
  text: 'Hello World',
  command: 'ue red big'
});
```

---

## 🔧 Development Commands

### Backend
```bash
cd backend

# Development
npm run start:dev

# Testing
npm test                    # Unit tests
npm run test:e2e           # E2E tests
npm run test:cov           # Coverage report

# Database
npm run migration:generate  # Generate migration
npm run migration:run       # Run migrations
npm run migration:revert    # Revert last migration

# Build
npm run build
npm run start:prod
```

### Frontend
```bash
cd frontend

# Development
npm run dev

# Testing
npm test                    # Unit tests
npm run test:coverage      # Coverage report
npm run test:e2e           # Cypress E2E tests

# Build
npm run build
npm run preview
```

---

## 📝 Code Style Guidelines

### TypeScript
```typescript
// Use interfaces for data structures
interface Comment {
  id: string;
  text: string;
}

// Use types for unions/intersections
type Status = 'waiting' | 'live' | 'ended';

// Use enums for constants
enum CommentSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  BIG = 'big'
}

// Prefer async/await over promises
async function fetchData(): Promise<Data> {
  try {
    const result = await api.get('/data');
    return result.data;
  } catch (error) {
    throw new Error('Failed to fetch data');
  }
}
```

### File Naming
```
- Components: PascalCase.tsx (VideoPlayer.tsx)
- Hooks: camelCase.ts (useWebSocket.ts)
- Services: PascalCase.ts (CommentService.ts)
- Utils: camelCase.ts (parseCommand.ts)
- Tests: *.test.ts or *.spec.ts
```

### Commit Messages
```
feat: Add comment animation
fix: Resolve WebSocket reconnection issue
docs: Update API documentation
test: Add unit tests for LaneManager
refactor: Simplify comment parsing logic
style: Format code with prettier
chore: Update dependencies
```

---

## 🚨 Important Notes

### Security
- Always sanitize user input
- Use parameterized queries
- Implement rate limiting
- Validate JWT tokens
- Enable CORS properly
- Use HTTPS in production

### Performance
- Canvas: Max 50 comments on screen
- WebSocket: Max 1000 concurrent connections per server
- API: Response time < 200ms (p95)
- Database: Use connection pooling
- Redis: Use for session and real-time data only

### Testing Requirements
- Overall coverage: 50%+
- Domain layer: 80%+
- Application layer: 70%+
- Infrastructure layer: 60%+
- Presentation layer: 50%+

---

## 📚 Reference Documentation

- [Architecture](./ARCHITECTURE.md) - System overview
- [API Spec](./API_SPEC.md) - Detailed API documentation
- [Database](./DATABASE.md) - Database schema
- [Software Architecture](./SOFTWARE_ARCHITECTURE.md) - Layered architecture
- [Production Roadmap](./PRODUCTION_ROADMAP.md) - Development phases

---

## 🔄 Version History

- v1.0.0 - Initial API design
- v1.0.1 - Added WebSocket events
- v1.0.2 - Added rate limiting
- v1.0.3 - Added testing guidelines

Last Updated: 2024-01-01