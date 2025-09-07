const io = require('socket.io-client');

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjZGQ5NmNhNy1jMDY4LTQ5YTktOWE0Ny1mZDJhNGQwYjIwMmIiLCJ1c2VybmFtZSI6InRlc3R1c2VyMSIsImVtYWlsIjoidGVzdDFAZXhhbXBsZS5jb20iLCJpYXQiOjE3NTcyMDM3NjgsImV4cCI6MTc1NzgwODU2OH0.1MIpkvAPnVgSnSddUgr5PD4M7INQ5JTQnMcpspdin3g';
const STREAM_ID = '25962097-7c2f-46a6-9ea1-5fde40dcae93';

console.log('Connecting to WebSocket server...');

const socket = io('http://localhost:3000', {
  auth: {
    token: TOKEN
  },
  transports: ['websocket'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});

socket.on('connect', () => {
  console.log('✅ Connected to WebSocket server');
  console.log('Socket ID:', socket.id);
  
  // Join the stream room
  console.log('Joining stream room...');
  socket.emit('join_room', { streamId: STREAM_ID });
});

socket.on('room_joined', (data) => {
  console.log('✅ Joined room:', data);
  
  // Send a test comment
  console.log('Sending test comment...');
  socket.emit('send_comment', {
    streamId: STREAM_ID,
    text: 'Hello from WebSocket test!',
    command: 'ue red big'
  });
});

socket.on('comment_sent', (data) => {
  console.log('✅ Comment sent response:', data);
});

socket.on('new_comment', (comment) => {
  console.log('📝 New comment received:', comment);
});

socket.on('viewer_count', (data) => {
  console.log('👥 Viewer count update:', data);
});

socket.on('error', (error) => {
  console.error('❌ Error:', error);
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from WebSocket server');
});

// Exit after 10 seconds
setTimeout(() => {
  console.log('Test complete, disconnecting...');
  socket.disconnect();
  process.exit(0);
}, 10000);