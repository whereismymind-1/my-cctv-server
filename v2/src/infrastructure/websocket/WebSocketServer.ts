import WebSocket from 'ws';
import { Server as HTTPServer } from 'http';
import { ID, WebSocketMessage } from '@shared/types';

/**
 * WebSocket 서버 구현
 */

export interface WebSocketClient {
  id: ID;
  ws: WebSocket;
  userId?: ID;
  roomId?: ID;
  isAlive: boolean;
  joinedAt: number;
  lastActivity: number;
  metadata?: Record<string, unknown>;
}

export interface WebSocketServerOptions {
  port?: number;
  server?: HTTPServer;
  heartbeatInterval?: number;
  maxClients?: number;
  maxMessageSize?: number;
}

export class WebSocketServer {
  private wss: WebSocket.Server;
  private clients: Map<ID, WebSocketClient> = new Map();
  private rooms: Map<ID, Set<ID>> = new Map();  // roomId -> clientIds
  private heartbeatInterval?: NodeJS.Timeout;
  private readonly options: Required<WebSocketServerOptions>;

  constructor(options: WebSocketServerOptions = {}) {
    this.options = {
      port: options.port || 8080,
      server: options.server || undefined!,
      heartbeatInterval: options.heartbeatInterval || 30000,
      maxClients: options.maxClients || 1000,
      maxMessageSize: options.maxMessageSize || 1024 * 1024, // 1MB
    };

    // WebSocket 서버 생성
    this.wss = new WebSocket.Server(
      this.options.server 
        ? { server: this.options.server }
        : { port: this.options.port }
    );

    this.initialize();
  }

  private initialize(): void {
    this.wss.on('connection', this.handleConnection.bind(this));
    this.startHeartbeat();
  }

  /**
   * 새 연결 처리
   */
  private handleConnection(ws: WebSocket, request: any): void {
    // 최대 클라이언트 수 체크
    if (this.clients.size >= this.options.maxClients) {
      ws.close(1008, 'Server is full');
      return;
    }

    const clientId = this.generateClientId();
    const client: WebSocketClient = {
      id: clientId,
      ws,
      isAlive: true,
      joinedAt: Date.now(),
      lastActivity: Date.now(),
    };

    this.clients.set(clientId, client);
    console.log(`Client connected: ${clientId}`);

    // 연결 확인 메시지
    this.sendToClient(clientId, {
      type: 'connected',
      timestamp: Date.now(),
      data: { clientId },
    });

    // 이벤트 핸들러 설정
    ws.on('message', (data) => this.handleMessage(clientId, data));
    ws.on('pong', () => this.handlePong(clientId));
    ws.on('close', () => this.handleDisconnect(clientId));
    ws.on('error', (error) => this.handleError(clientId, error));
  }

  /**
   * 메시지 처리
   */
  private handleMessage(clientId: ID, data: WebSocket.Data): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.lastActivity = Date.now();

    try {
      // 메시지 크기 체크
      const messageSize = Buffer.byteLength(data.toString());
      if (messageSize > this.options.maxMessageSize) {
        this.sendError(clientId, 'Message too large');
        return;
      }

      const message = JSON.parse(data.toString()) as WebSocketMessage;
      
      // 메시지 타입별 처리
      switch (message.type) {
        case 'join_room':
          this.handleJoinRoom(clientId, message.data as { roomId: ID });
          break;
        
        case 'leave_room':
          this.handleLeaveRoom(clientId);
          break;
        
        case 'comment':
          this.handleComment(clientId, message);
          break;
        
        case 'ping':
          this.sendToClient(clientId, {
            type: 'pong',
            timestamp: Date.now(),
            data: null,
          });
          break;
        
        default:
          // 커스텀 이벤트 처리를 위해 이벤트 발생
          this.emit('message', { clientId, message });
      }
    } catch (error) {
      console.error(`Error processing message from ${clientId}:`, error);
      this.sendError(clientId, 'Invalid message format');
    }
  }

  /**
   * 방 입장 처리
   */
  private handleJoinRoom(clientId: ID, data: { roomId: ID }): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    const { roomId } = data;

    // 이전 방에서 나가기
    if (client.roomId) {
      this.handleLeaveRoom(clientId);
    }

    // 새 방 입장
    client.roomId = roomId;
    
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId)!.add(clientId);

    // 입장 확인
    this.sendToClient(clientId, {
      type: 'joined_room',
      timestamp: Date.now(),
      data: { roomId, viewerCount: this.rooms.get(roomId)!.size },
    });

    // 다른 사용자들에게 알림
    this.broadcastToRoom(roomId, {
      type: 'viewer_joined',
      timestamp: Date.now(),
      data: { viewerCount: this.rooms.get(roomId)!.size },
    }, clientId);
  }

  /**
   * 방 퇴장 처리
   */
  private handleLeaveRoom(clientId: ID): void {
    const client = this.clients.get(clientId);
    if (!client || !client.roomId) return;

    const roomId = client.roomId;
    const room = this.rooms.get(roomId);
    
    if (room) {
      room.delete(clientId);
      
      if (room.size === 0) {
        this.rooms.delete(roomId);
      } else {
        // 다른 사용자들에게 알림
        this.broadcastToRoom(roomId, {
          type: 'viewer_left',
          timestamp: Date.now(),
          data: { viewerCount: room.size },
        });
      }
    }

    client.roomId = undefined;
  }

  /**
   * 댓글 처리
   */
  private handleComment(clientId: ID, message: WebSocketMessage): void {
    const client = this.clients.get(clientId);
    if (!client || !client.roomId) {
      this.sendError(clientId, 'Not in a room');
      return;
    }

    // 방의 모든 사용자에게 브로드캐스트
    this.broadcastToRoom(client.roomId, {
      type: 'comment',
      id: message.id,
      timestamp: Date.now(),
      data: message.data,
    });
  }

  /**
   * Heartbeat (연결 상태 확인)
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach((client, clientId) => {
        if (!client.isAlive) {
          // 응답 없으면 연결 종료
          this.handleDisconnect(clientId);
          return;
        }

        client.isAlive = false;
        client.ws.ping();
      });
    }, this.options.heartbeatInterval);
  }

  private handlePong(clientId: ID): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.isAlive = true;
    }
  }

  /**
   * 연결 종료 처리
   */
  private handleDisconnect(clientId: ID): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    console.log(`Client disconnected: ${clientId}`);

    // 방에서 제거
    if (client.roomId) {
      this.handleLeaveRoom(clientId);
    }

    // WebSocket 종료
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.close();
    }

    // 클라이언트 제거
    this.clients.delete(clientId);
  }

  /**
   * 에러 처리
   */
  private handleError(clientId: ID, error: Error): void {
    console.error(`WebSocket error for client ${clientId}:`, error);
    this.handleDisconnect(clientId);
  }

  /**
   * 메시지 전송 메서드들
   */
  public sendToClient(clientId: ID, message: WebSocketMessage): void {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  }

  public sendError(clientId: ID, error: string): void {
    this.sendToClient(clientId, {
      type: 'error',
      timestamp: Date.now(),
      data: { error },
    });
  }

  public broadcastToRoom(
    roomId: ID, 
    message: WebSocketMessage, 
    excludeClientId?: ID
  ): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.forEach(clientId => {
      if (clientId !== excludeClientId) {
        this.sendToClient(clientId, message);
      }
    });
  }

  public broadcast(message: WebSocketMessage, excludeClientId?: ID): void {
    this.clients.forEach((client, clientId) => {
      if (clientId !== excludeClientId) {
        this.sendToClient(clientId, message);
      }
    });
  }

  /**
   * 바이너리 데이터 전송 (스트림용)
   */
  public sendBinaryToClient(clientId: ID, data: Buffer): void {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(data);
    }
  }

  public broadcastBinaryToRoom(roomId: ID, data: Buffer, excludeClientId?: ID): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.forEach(clientId => {
      if (clientId !== excludeClientId) {
        this.sendBinaryToClient(clientId, data);
      }
    });
  }

  /**
   * 유틸리티 메서드
   */
  private generateClientId(): ID {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public getClient(clientId: ID): WebSocketClient | undefined {
    return this.clients.get(clientId);
  }

  public getRoomClients(roomId: ID): WebSocketClient[] {
    const room = this.rooms.get(roomId);
    if (!room) return [];

    return Array.from(room)
      .map(clientId => this.clients.get(clientId))
      .filter(Boolean) as WebSocketClient[];
  }

  public getClientCount(): number {
    return this.clients.size;
  }

  public getRoomCount(roomId: ID): number {
    return this.rooms.get(roomId)?.size || 0;
  }

  /**
   * 이벤트 에미터 (외부 연동용)
   */
  private eventHandlers: Map<string, Function[]> = new Map();

  public on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

  /**
   * 서버 종료
   */
  public close(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.clients.forEach(client => {
      client.ws.close();
    });

    this.wss.close();
  }
}