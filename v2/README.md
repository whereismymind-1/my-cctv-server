# 🎥 CCTV Live Streaming Server v2

실시간 댓글 스트리밍 서비스 (니코니코/티비플 스타일)

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- OBS Studio or ffmpeg (for streaming)

### 1. Start All Services
```bash
./start-streaming.sh
```

This will start:
- ✅ PostgreSQL Database (port 5432)
- ✅ Redis Cache (port 6379)
- ✅ RTMP/HLS Server (ports 1935, 8080)
- ✅ Backend API (port 3000)
- ✅ Frontend App (port 5174)

### 2. Access the Application
- **Frontend**: http://localhost:5174
- **API Docs**: http://localhost:3000/api-docs (when enabled)
- **HLS Streams**: http://localhost:8080/hls/{streamKey}.m3u8

### 3. Stream Your Content

#### Using OBS:
1. Settings → Stream
2. Service: Custom
3. Server: `rtmp://localhost:1935/live`
4. Stream Key: (get from app after creating stream)

#### Using ffmpeg:
```bash
# macOS
ffmpeg -f avfoundation -i "0:0" -vcodec libx264 -preset veryfast -acodec aac -f flv rtmp://localhost:1935/live/{streamKey}

# Windows
ffmpeg -f dshow -i video="Camera Name":audio="Microphone Name" -vcodec libx264 -preset veryfast -acodec aac -f flv rtmp://localhost:1935/live/{streamKey}

# Linux
ffmpeg -f v4l2 -i /dev/video0 -f alsa -i default -vcodec libx264 -preset veryfast -acodec aac -f flv rtmp://localhost:1935/live/{streamKey}
```

## 🧪 Testing

### Run All Tests
```bash
./run-tests.sh
```

### Individual Test Suites
```bash
# Backend
cd backend
npm test              # Unit tests
npm run test:e2e      # E2E tests
npm run test:cov      # Coverage

# Frontend
cd frontend
npm test              # Component tests
npm run test:coverage # Coverage
```

## 🏗️ Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend   │────▶│  Database   │
│    (React)  │     │   (NestJS)  │     │ (PostgreSQL)│
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                     
       │                   ▼                     
       │            ┌─────────────┐             
       │            │    Redis    │             
       │            │   (Cache)   │             
       │            └─────────────┘             
       ▼                                         
┌─────────────┐                                 
│ RTMP Server │                                 
│(nginx-rtmp) │                                 
└─────────────┘                                 
```

### Tech Stack
- **Frontend**: React + TypeScript + Vite + Zustand + TanStack Query
- **Backend**: NestJS + TypeScript + Socket.io + TypeORM
- **Database**: PostgreSQL + Redis
- **Streaming**: nginx-rtmp (RTMP/HLS)
- **Testing**: Jest + Vitest + Testing Library

## 📁 Project Structure

```
v2/
├── backend/                # NestJS backend application
│   ├── src/
│   │   ├── domain/        # Business logic & entities
│   │   ├── application/   # Use cases & services
│   │   ├── infrastructure/# Database & external services
│   │   └── presentation/  # Controllers & WebSocket
│   └── test/              # E2E tests
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # Page components
│   │   ├── stores/        # Zustand stores
│   │   └── shared/        # Shared utilities
│   └── test/              # Component tests
├── nginx-rtmp/            # RTMP server configuration
└── docker-compose.yml     # Docker orchestration
```

## 🔧 Development

### Local Development (without Docker)

#### Backend
```bash
cd backend
npm install
npm run start:dev
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables

Create `.env` files:

#### backend/.env
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/cctv_db
JWT_SECRET=your-secret-key-change-this
REDIS_HOST=localhost
REDIS_PORT=6379
CORS_ORIGIN=http://localhost:5174
```

#### frontend/.env
```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

## 📊 Test Coverage Status

| Module | Coverage | Status |
|--------|----------|--------|
| Backend Domain | 80%+ | ✅ |
| Backend Application | 70%+ | ✅ |
| Backend Infrastructure | 60%+ | ✅ |
| Frontend Components | 50%+ | ✅ |
| E2E Tests | Complete | ✅ |

## 🚦 Production Readiness

### ✅ Completed
- [x] RTMP/HLS streaming server
- [x] WebSocket real-time comments
- [x] Authentication & Authorization
- [x] Unit & Integration tests
- [x] Error handling middleware
- [x] Docker containerization

### ⚠️ TODO for Production
- [ ] SSL/TLS certificates
- [ ] Rate limiting
- [ ] Monitoring & Logging (Sentry, etc)
- [ ] CI/CD pipeline
- [ ] Load balancing
- [ ] Database migrations
- [ ] Backup strategy

## 📝 API Documentation

When running in development mode, API documentation is available at:
http://localhost:3000/api-docs

## 🛟 Troubleshooting

### Port Already in Use
```bash
# Find and kill process using port
lsof -ti:3000 | xargs kill -9
```

### Docker Issues
```bash
# Reset everything
docker-compose down -v
docker system prune -a
```

### Database Connection Issues
```bash
# Check PostgreSQL logs
docker-compose logs postgres
```

## 📄 License

MIT