#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting K6 Load Tests${NC}"
echo "================================"

# Check if k6 is installed
if ! command -v k6 &> /dev/null; then
    echo -e "${RED}❌ k6 is not installed${NC}"
    echo "Please install k6 first: brew install k6"
    exit 1
fi

# Check if backend is running
if ! curl -s http://localhost:3000/health > /dev/null; then
    echo -e "${RED}❌ Backend server is not running${NC}"
    echo "Please start the backend server first"
    exit 1
fi

# Run REST API load test
echo -e "\n${YELLOW}📊 Running REST API Load Test...${NC}"
echo "--------------------------------"
k6 run load-test.js --out json=results/api-test-results.json

# Check if first test passed
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ REST API Load Test Completed${NC}"
else
    echo -e "${RED}❌ REST API Load Test Failed${NC}"
    exit 1
fi

# Run WebSocket load test
echo -e "\n${YELLOW}📊 Running WebSocket Load Test...${NC}"
echo "--------------------------------"
k6 run websocket-test.js --out json=results/ws-test-results.json

# Check if second test passed
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ WebSocket Load Test Completed${NC}"
else
    echo -e "${RED}❌ WebSocket Load Test Failed${NC}"
    exit 1
fi

# Generate summary report
echo -e "\n${GREEN}📈 Test Summary${NC}"
echo "================"
echo "Results saved to:"
echo "  - results/api-test-results.json"
echo "  - results/ws-test-results.json"

# Optional: Generate HTML report if k6-reporter is installed
if command -v k6-reporter &> /dev/null; then
    echo -e "\n${YELLOW}📄 Generating HTML Reports...${NC}"
    k6-reporter results/api-test-results.json --output results/api-report.html
    k6-reporter results/ws-test-results.json --output results/ws-report.html
    echo -e "${GREEN}✅ HTML Reports Generated${NC}"
fi

echo -e "\n${GREEN}🎉 All tests completed successfully!${NC}"