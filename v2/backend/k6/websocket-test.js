import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom metrics
const messagesSent = new Counter('messages_sent');
const messagesReceived = new Counter('messages_received');
const connectionErrors = new Rate('connection_errors');
const messageLatency = new Trend('message_latency');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 20 },   // Ramp up to 20 concurrent connections
    { duration: '1m', target: 50 },    // Ramp up to 50 connections
    { duration: '2m', target: 100 },   // Stay at 100 connections
    { duration: '1m', target: 50 },    // Scale down to 50
    { duration: '30s', target: 0 },    // Scale down to 0
  ],
  thresholds: {
    ws_connecting: ['p(95)<1000'],     // 95% of connections established within 1s
    ws_msgs_sent: ['rate>10'],         // Send at least 10 messages per second
    connection_errors: ['rate<0.05'],  // Connection error rate below 5%
  },
};

const WS_URL = 'ws://localhost:3000';
const STREAM_ID = '25962097-7c2f-46a6-9ea1-5fde40dcae93'; // Use existing test stream

// Niconico-style command presets
const COMMENT_COMMANDS = [
  '',
  'ue red',
  'shita blue',
  'big',
  'small green',
  'ue yellow big',
  'shita small',
];

// Sample comments
const SAMPLE_COMMENTS = [
  '草',
  'wwwww',
  '888888',
  'すごい！',
  'Nice!',
  'かわいい',
  'GG',
  'キタ━━━━(ﾟ∀ﾟ)━━━━!!',
  'おつかれ〜',
  'こんにちは',
];

export default function () {
  const url = `${WS_URL}/socket.io/?EIO=4&transport=websocket`;
  const params = {
    headers: {
      'Origin': 'http://localhost:5173',
    },
  };

  const response = ws.connect(url, params, function (socket) {
    let messageTimestamps = {};
    let isConnected = false;
    let roomJoined = false;

    socket.on('open', () => {
      console.log('WebSocket connection opened');
      isConnected = true;
      
      // Send Socket.IO handshake
      socket.send('40');
    });

    socket.on('message', (data) => {
      // Handle Socket.IO protocol messages
      if (data.startsWith('0')) {
        // Connection established, join room
        socket.send(`42["join_room",{"streamId":"${STREAM_ID}"}]`);
      } else if (data.includes('room_joined')) {
        roomJoined = true;
        console.log('Joined room successfully');
      } else if (data.includes('new_comment')) {
        messagesReceived.add(1);
        
        // Calculate latency if this is our comment
        const match = data.match(/"id":"([^"]+)"/);
        if (match && messageTimestamps[match[1]]) {
          const latency = Date.now() - messageTimestamps[match[1]];
          messageLatency.add(latency);
          delete messageTimestamps[match[1]];
        }
      } else if (data.includes('comment_sent')) {
        // Comment was sent successfully
        const match = data.match(/"commentId":"([^"]+)"/);
        if (match) {
          console.log(`Comment sent: ${match[1]}`);
        }
      }
    });

    socket.on('error', (e) => {
      console.error('WebSocket error:', e);
      connectionErrors.add(1);
    });

    socket.on('close', () => {
      console.log('WebSocket connection closed');
      isConnected = false;
    });

    // Wait for connection and room join
    socket.setTimeout(() => {
      if (!isConnected || !roomJoined) {
        console.error('Failed to establish connection or join room');
        connectionErrors.add(1);
        socket.close();
        return;
      }
    }, 5000);

    // Send comments periodically
    socket.setInterval(() => {
      if (roomJoined) {
        const comment = SAMPLE_COMMENTS[Math.floor(Math.random() * SAMPLE_COMMENTS.length)];
        const command = COMMENT_COMMANDS[Math.floor(Math.random() * COMMENT_COMMANDS.length)];
        const commentId = `test-${Date.now()}-${Math.random()}`;
        
        // Track timestamp for latency measurement
        messageTimestamps[commentId] = Date.now();
        
        // Send comment via Socket.IO protocol
        const message = JSON.stringify([
          'send_comment',
          {
            streamId: STREAM_ID,
            text: comment,
            command: command || undefined,
          },
        ]);
        
        socket.send(`42${message}`);
        messagesSent.add(1);
      }
    }, 2000 + Math.random() * 3000); // Send comment every 2-5 seconds

    // Send ping to keep connection alive
    socket.setInterval(() => {
      if (isConnected) {
        socket.send('2'); // Socket.IO ping
      }
    }, 25000);

    // Keep connection open for test duration
    socket.setTimeout(() => {
      console.log('Test duration reached, closing connection');
      socket.close();
    }, 60000); // Keep open for 1 minute
  });

  check(response, {
    'WebSocket connection established': (r) => r && r.status === 101,
  });
}

export function teardown(data) {
  console.log('WebSocket load test completed');
  console.log(`Total messages sent: ${messagesSent.value}`);
  console.log(`Total messages received: ${messagesReceived.value}`);
}