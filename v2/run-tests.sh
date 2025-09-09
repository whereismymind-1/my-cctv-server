#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🧪 Running Full Test Suite${NC}\n"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Backend Tests
echo -e "${YELLOW}📦 Backend Tests${NC}"
echo "================================"

cd backend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm ci
fi

# Run unit tests
echo -e "\n${GREEN}Running Unit Tests...${NC}"
npm run test 2>&1 | tee ../test-results-backend-unit.log

# Run e2e tests
echo -e "\n${GREEN}Running E2E Tests...${NC}"
npm run test:e2e 2>&1 | tee ../test-results-backend-e2e.log

# Run test coverage
echo -e "\n${GREEN}Generating Coverage Report...${NC}"
npm run test:cov 2>&1 | tee ../test-results-backend-coverage.log

cd ..

# Frontend Tests
echo -e "\n${YELLOW}🎨 Frontend Tests${NC}"
echo "================================"

cd frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm ci
fi

# Run tests
echo -e "\n${GREEN}Running Component Tests...${NC}"
npm run test 2>&1 | tee ../test-results-frontend.log

# Run test coverage
echo -e "\n${GREEN}Generating Coverage Report...${NC}"
npm run test:coverage 2>&1 | tee ../test-results-frontend-coverage.log

cd ..

# Integration Tests with Docker
echo -e "\n${YELLOW}🐳 Integration Tests (Docker)${NC}"
echo "================================"

# Start services with docker-compose
echo -e "${GREEN}Starting services...${NC}"
docker-compose up -d

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 10

# Check if services are running
echo -e "\n${GREEN}Service Status:${NC}"
docker-compose ps

# Run integration test script
echo -e "\n${GREEN}Running Integration Tests...${NC}"
./test-integration.sh 2>&1 | tee test-results-integration.log

# Stop services
echo -e "\n${GREEN}Stopping services...${NC}"
docker-compose down

# Summary
echo -e "\n${YELLOW}📊 Test Summary${NC}"
echo "================================"

# Check test results
BACKEND_UNIT_FAILED=$(grep -c "FAIL" test-results-backend-unit.log 2>/dev/null || echo "0")
BACKEND_E2E_FAILED=$(grep -c "FAIL" test-results-backend-e2e.log 2>/dev/null || echo "0")
FRONTEND_FAILED=$(grep -c "FAIL" test-results-frontend.log 2>/dev/null || echo "0")
INTEGRATION_FAILED=$(grep -c "FAIL" test-results-integration.log 2>/dev/null || echo "0")

TOTAL_FAILED=$((BACKEND_UNIT_FAILED + BACKEND_E2E_FAILED + FRONTEND_FAILED + INTEGRATION_FAILED))

if [ $TOTAL_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
else
    echo -e "${RED}❌ Some tests failed:${NC}"
    [ $BACKEND_UNIT_FAILED -gt 0 ] && echo -e "  ${RED}- Backend Unit Tests: $BACKEND_UNIT_FAILED failures${NC}"
    [ $BACKEND_E2E_FAILED -gt 0 ] && echo -e "  ${RED}- Backend E2E Tests: $BACKEND_E2E_FAILED failures${NC}"
    [ $FRONTEND_FAILED -gt 0 ] && echo -e "  ${RED}- Frontend Tests: $FRONTEND_FAILED failures${NC}"
    [ $INTEGRATION_FAILED -gt 0 ] && echo -e "  ${RED}- Integration Tests: $INTEGRATION_FAILED failures${NC}"
fi

echo -e "\n${YELLOW}📁 Test results saved to:${NC}"
echo "  - test-results-backend-unit.log"
echo "  - test-results-backend-e2e.log"
echo "  - test-results-backend-coverage.log"
echo "  - test-results-frontend.log"
echo "  - test-results-frontend-coverage.log"
echo "  - test-results-integration.log"

exit $TOTAL_FAILED