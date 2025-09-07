export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

export const API_ENDPOINTS = {
  auth: {
    register: '/api/auth/register',
    login: '/api/auth/login',
    refresh: '/api/auth/refresh',
    me: '/api/users/me',
  },
  streams: {
    list: '/api/streams',
    create: '/api/streams',
    detail: (id: string) => `/api/streams/${id}`,
    start: (id: string) => `/api/streams/${id}/start`,
    end: (id: string) => `/api/streams/${id}/end`,
    delete: (id: string) => `/api/streams/${id}`,
    comments: (id: string) => `/api/streams/${id}/comments`,
  },
  health: {
    check: '/health',
    ready: '/health/ready',
    live: '/health/live',
  },
};

export const WS_EVENTS = {
  // Client to Server
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  SEND_COMMENT: 'send_comment',
  
  // Server to Client
  ROOM_JOINED: 'room_joined',
  ROOM_LEFT: 'room_left',
  NEW_COMMENT: 'new_comment',
  COMMENT_SENT: 'comment_sent',
  VIEWER_COUNT: 'viewer_count',
  STREAM_STATUS: 'stream_status',
  ERROR: 'error',
} as const;