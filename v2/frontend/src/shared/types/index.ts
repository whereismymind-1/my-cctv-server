// User types
export interface User {
  id: string;
  username: string;
  email: string;
  level: number;
  avatarUrl?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Stream types
export type StreamStatus = 'waiting' | 'live' | 'ended';

export interface StreamSettings {
  allowComments: boolean;
  commentCooldown: number;
  maxCommentLength: number;
  allowAnonymous: boolean;
}

export interface Stream {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  owner: {
    id: string;
    username: string;
    avatar?: string;
  };
  viewerCount: number;
  status: StreamStatus;
  settings?: StreamSettings;
  streamKey?: string;
  streamUrl?: string;
  createdAt: Date;
  startedAt?: Date;
  endedAt?: Date;
}

// Comment types
export type CommentPosition = 'scroll' | 'top' | 'bottom';
export type CommentSize = 'small' | 'medium' | 'big';

export interface CommentStyle {
  position: CommentPosition;
  color: string;
  size: CommentSize;
}

export interface Comment {
  id: string;
  text: string;
  command?: string;
  user: {
    id: string;
    username: string;
    level: number;
  };
  style: CommentStyle;
  lane: number;
  x: number;
  y: number;
  speed: number;
  duration: number;
  vpos: number;
  createdAt: Date;
}

// WebSocket types
export interface RoomJoinedData {
  streamId: string;
  viewerCount: number;
  roomSettings: {
    commentCooldown: number;
    maxCommentLength: number;
  };
}

export interface ViewerCountData {
  streamId: string;
  count: number;
}

export interface StreamStatusData {
  streamId: string;
  status: StreamStatus;
}

export interface CommentSentData {
  success: boolean;
  commentId?: string;
  error?: string;
}

export interface ErrorData {
  code: string;
  message: string;
  retryAfter?: number;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  username: string;
  email: string;
  password: string;
}

export interface CreateStreamForm {
  title: string;
  description?: string;
  settings?: Partial<StreamSettings>;
}

export interface SendCommentForm {
  text: string;
  command?: string;
}