import { io, Socket } from 'socket.io-client';
import { WS_URL, WS_EVENTS } from '../config/api';
import {
  Comment,
  RoomJoinedData,
  ViewerCountData,
  StreamStatusData,
  CommentSentData,
  ErrorData,
} from '../types';

type EventCallbacks = {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onRoomJoined?: (data: RoomJoinedData) => void;
  onRoomLeft?: (data: { streamId: string }) => void;
  onNewComment?: (comment: Comment) => void;
  onCommentSent?: (data: CommentSentData) => void;
  onViewerCount?: (data: ViewerCountData) => void;
  onStreamStatus?: (data: StreamStatusData) => void;
  onError?: (error: ErrorData) => void;
};

class WebSocketService {
  private socket: Socket | null = null;
  private currentStreamId: string | null = null;
  private callbacks: EventCallbacks = {};

  connect(token?: string) {
    if (this.socket?.connected) {
      console.log('WebSocket already connected');
      return;
    }

    this.socket = io(WS_URL, {
      auth: token ? { token } : undefined,
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.callbacks.onConnect?.();
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      this.callbacks.onDisconnect?.();
    });

    this.socket.on(WS_EVENTS.ROOM_JOINED, (data: RoomJoinedData) => {
      console.log('Joined room:', data);
      this.currentStreamId = data.streamId;
      this.callbacks.onRoomJoined?.(data);
    });

    this.socket.on(WS_EVENTS.ROOM_LEFT, (data: { streamId: string }) => {
      console.log('Left room:', data);
      this.currentStreamId = null;
      this.callbacks.onRoomLeft?.(data);
    });

    this.socket.on(WS_EVENTS.NEW_COMMENT, (comment: Comment) => {
      console.log('New comment:', comment);
      this.callbacks.onNewComment?.(comment);
    });

    this.socket.on(WS_EVENTS.COMMENT_SENT, (data: CommentSentData) => {
      console.log('Comment sent:', data);
      this.callbacks.onCommentSent?.(data);
    });

    this.socket.on(WS_EVENTS.VIEWER_COUNT, (data: ViewerCountData) => {
      console.log('Viewer count update:', data);
      this.callbacks.onViewerCount?.(data);
    });

    this.socket.on(WS_EVENTS.STREAM_STATUS, (data: StreamStatusData) => {
      console.log('Stream status update:', data);
      this.callbacks.onStreamStatus?.(data);
    });

    this.socket.on(WS_EVENTS.ERROR, (error: ErrorData) => {
      console.error('WebSocket error:', error);
      this.callbacks.onError?.(error);
    });
  }

  setCallbacks(callbacks: EventCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  joinRoom(streamId: string) {
    if (!this.socket?.connected) {
      console.error('WebSocket not connected');
      return;
    }

    if (this.currentStreamId === streamId) {
      console.log('Already in room:', streamId);
      return;
    }

    this.socket.emit(WS_EVENTS.JOIN_ROOM, { streamId });
  }

  leaveRoom(streamId: string) {
    if (!this.socket?.connected) {
      console.error('WebSocket not connected');
      return;
    }

    this.socket.emit(WS_EVENTS.LEAVE_ROOM, { streamId });
  }

  sendComment(streamId: string, text: string, command?: string) {
    if (!this.socket?.connected) {
      console.error('WebSocket not connected');
      return;
    }

    if (this.currentStreamId !== streamId) {
      console.error('Not in the correct room');
      return;
    }

    this.socket.emit(WS_EVENTS.SEND_COMMENT, {
      streamId,
      text,
      command,
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentStreamId = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  getCurrentStreamId(): string | null {
    return this.currentStreamId;
  }
}

export const wsService = new WebSocketService();