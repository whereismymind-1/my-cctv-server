#!/bin/bash

echo "🧪 Testing Backend-Frontend Integration"
echo "========================================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Backend URL
BACKEND_URL="http://localhost:3000"
FRONTEND_URL="http://localhost:5174"

echo -e "\n${YELLOW}1. Checking Backend Health${NC}"
backend_health=$(curl -s -o /dev/null -w "%{http_code}" $BACKEND_URL/health 2>/dev/null || echo "000")
if [ "$backend_health" = "200" ]; then
    echo -e "${GREEN}✅ Backend is running on $BACKEND_URL${NC}"
else
    echo -e "${RED}❌ Backend is not responding on $BACKEND_URL (HTTP $backend_health)${NC}"
fi

echo -e "\n${YELLOW}2. Checking Frontend${NC}"
frontend_health=$(curl -s -o /dev/null -w "%{http_code}" $FRONTEND_URL 2>/dev/null || echo "000")
if [ "$frontend_health" = "200" ]; then
    echo -e "${GREEN}✅ Frontend is running on $FRONTEND_URL${NC}"
else
    echo -e "${RED}❌ Frontend is not responding on $FRONTEND_URL (HTTP $frontend_health)${NC}"
fi

echo -e "\n${YELLOW}3. Testing API Endpoints${NC}"

# Test auth endpoints
echo -e "\n  Testing Auth Endpoints:"
register_response=$(curl -s -X POST $BACKEND_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser'$(date +%s)'","email":"test'$(date +%s)'@example.com","password":"password123"}' \
  -w "\n%{http_code}" 2>/dev/null)
register_code=$(echo "$register_response" | tail -n 1)
if [ "$register_code" = "201" ] || [ "$register_code" = "409" ]; then
    echo -e "  ${GREEN}✅ Auth register endpoint working${NC}"
else
    echo -e "  ${RED}❌ Auth register endpoint failed (HTTP $register_code)${NC}"
fi

# Test streams endpoint
echo -e "\n  Testing Stream Endpoints:"
streams_response=$(curl -s -o /dev/null -w "%{http_code}" $BACKEND_URL/api/streams 2>/dev/null || echo "000")
if [ "$streams_response" = "200" ]; then
    echo -e "  ${GREEN}✅ Streams endpoint working${NC}"
else
    echo -e "  ${RED}❌ Streams endpoint failed (HTTP $streams_response)${NC}"
fi

echo -e "\n${YELLOW}4. Testing WebSocket Connection${NC}"
# Note: This is a basic check, actual WebSocket testing would need a proper client
ws_upgrade=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Upgrade: websocket" \
  -H "Connection: Upgrade" \
  $BACKEND_URL/socket.io/ 2>/dev/null || echo "000")
if [ "$ws_upgrade" = "400" ] || [ "$ws_upgrade" = "200" ]; then
    echo -e "${GREEN}✅ WebSocket endpoint accessible${NC}"
else
    echo -e "${RED}❌ WebSocket endpoint not accessible (HTTP $ws_upgrade)${NC}"
fi

echo -e "\n${YELLOW}5. Summary${NC}"
echo "========================================"
if [ "$backend_health" = "200" ] && [ "$frontend_health" = "200" ]; then
    echo -e "${GREEN}✅ Both frontend and backend are running!${NC}"
    echo -e "${GREEN}✅ You can access the application at: $FRONTEND_URL${NC}"
    echo -e "\n${YELLOW}Next Steps:${NC}"
    echo "1. Open $FRONTEND_URL in your browser"
    echo "2. Check the browser console for any errors"
    echo "3. Try registering a new user"
    echo "4. Try joining a stream"
else
    echo -e "${RED}❌ Integration check failed. Please ensure both services are running.${NC}"
    echo -e "\n${YELLOW}To start the services:${NC}"
    echo "Backend:  cd backend && npm run start:dev"
    echo "Frontend: cd frontend && npm run dev"
fi