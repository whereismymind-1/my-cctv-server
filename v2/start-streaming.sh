#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Starting CCTV Streaming Server${NC}\n"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Start all services
echo -e "${GREEN}Starting services with Docker Compose...${NC}"
docker-compose up -d

# Wait for services to be ready
echo -e "\n${YELLOW}Waiting for services to initialize...${NC}"
sleep 5

# Show service status
echo -e "\n${GREEN}Service Status:${NC}"
docker-compose ps

echo -e "\n${BLUE}📺 Services are running!${NC}"
echo "================================"
echo -e "${GREEN}Frontend:${NC} http://localhost:5174"
echo -e "${GREEN}Backend API:${NC} http://localhost:3000"
echo -e "${GREEN}RTMP Ingest:${NC} rtmp://localhost:1935/live/{streamKey}"
echo -e "${GREEN}HLS Playback:${NC} http://localhost:8080/hls/{streamKey}.m3u8"
echo -e "${GREEN}PostgreSQL:${NC} localhost:5432"
echo -e "${GREEN}Redis:${NC} localhost:6379"
echo "================================"

echo -e "\n${YELLOW}📝 Quick Start Guide:${NC}"
echo "1. Open http://localhost:5174 in your browser"
echo "2. Register/Login to create an account"
echo "3. Create a new stream to get your stream key"
echo "4. Configure OBS or ffmpeg:"
echo "   - Server: rtmp://localhost:1935/live"
echo "   - Stream Key: {your-stream-key}"
echo "5. Start streaming and watch at http://localhost:5174/stream/{id}"

echo -e "\n${YELLOW}🛑 To stop all services:${NC}"
echo "   docker-compose down"

echo -e "\n${YELLOW}📊 To view logs:${NC}"
echo "   docker-compose logs -f [service-name]"
echo "   Services: postgres, redis, rtmp, backend, frontend"