import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const successRate = new Rate('success');
const apiLatency = new Trend('api_latency');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Ramp up to 10 users
    { duration: '1m', target: 50 },    // Ramp up to 50 users
    { duration: '2m', target: 100 },   // Ramp up to 100 users
    { duration: '2m', target: 200 },   // Ramp up to 200 users
    { duration: '1m', target: 100 },   // Scale down to 100 users
    { duration: '30s', target: 0 },    // Scale down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    errors: ['rate<0.1'],              // Error rate must be below 10%
    success: ['rate>0.9'],             // Success rate must be above 90%
  },
};

const BASE_URL = 'http://localhost:3000';

// Helper function to generate random data
function generateUser() {
  const randomId = Math.random().toString(36).substring(7);
  return {
    username: `user_${randomId}`,
    email: `user_${randomId}@test.com`,
    password: 'password123',
  };
}

export function setup() {
  // Setup code - create test data if needed
  console.log('Setting up load test...');
  
  // Register a test user and get token
  const user = generateUser();
  const registerRes = http.post(
    `${BASE_URL}/api/auth/register`,
    JSON.stringify(user),
    { headers: { 'Content-Type': 'application/json' } }
  );
  
  if (registerRes.status === 201) {
    const data = JSON.parse(registerRes.body);
    return { token: data.token, userId: data.user.id };
  }
  
  return {};
}

export default function (data) {
  // Test 1: Health check endpoint
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'Health check status is 200': (r) => r.status === 200,
    'Health check response time < 100ms': (r) => r.timings.duration < 100,
  });
  apiLatency.add(healthRes.timings.duration);
  
  // Test 2: Get streams list
  const streamsRes = http.get(`${BASE_URL}/api/streams?status=live`);
  const streamsSuccess = check(streamsRes, {
    'Streams list status is 200': (r) => r.status === 200,
    'Streams response time < 300ms': (r) => r.timings.duration < 300,
  });
  successRate.add(streamsSuccess);
  errorRate.add(!streamsSuccess);
  apiLatency.add(streamsRes.timings.duration);
  
  // Test 3: Authenticated request - Create stream
  if (data.token) {
    const createStreamRes = http.post(
      `${BASE_URL}/api/streams`,
      JSON.stringify({
        title: `Load Test Stream ${Date.now()}`,
        description: 'Stream created during load testing',
        settings: {
          allowComments: true,
          commentCooldown: 1000,
          maxCommentLength: 200,
          allowAnonymous: false,
        },
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.token}`,
        },
      }
    );
    
    const createSuccess = check(createStreamRes, {
      'Create stream status is 201': (r) => r.status === 201,
      'Create stream response time < 500ms': (r) => r.timings.duration < 500,
    });
    successRate.add(createSuccess);
    errorRate.add(!createSuccess);
    apiLatency.add(createStreamRes.timings.duration);
    
    // If stream created successfully, test starting it
    if (createStreamRes.status === 201) {
      const stream = JSON.parse(createStreamRes.body);
      sleep(0.5);
      
      const startStreamRes = http.post(
        `${BASE_URL}/api/streams/${stream.id}/start`,
        null,
        {
          headers: {
            'Authorization': `Bearer ${data.token}`,
          },
        }
      );
      
      check(startStreamRes, {
        'Start stream status is 200': (r) => r.status === 200,
      });
    }
  }
  
  // Test 4: User registration (stress test)
  const newUser = generateUser();
  const registerRes = http.post(
    `${BASE_URL}/api/auth/register`,
    JSON.stringify(newUser),
    { headers: { 'Content-Type': 'application/json' } }
  );
  
  const registerSuccess = check(registerRes, {
    'Register status is 201 or 409': (r) => r.status === 201 || r.status === 409,
    'Register response time < 1000ms': (r) => r.timings.duration < 1000,
  });
  successRate.add(registerSuccess);
  errorRate.add(!registerSuccess);
  apiLatency.add(registerRes.timings.duration);
  
  // Simulate user think time
  sleep(Math.random() * 2 + 1);
}

export function teardown(data) {
  // Cleanup code
  console.log('Load test completed');
}