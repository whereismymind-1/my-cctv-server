import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CommentService } from '../../application/services/comment.service';
import { StreamService } from '../../application/services/stream.service';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { AnalyticsService } from '../../application/services/analytics.service';
import { SendCommentDto } from '../../application/dto/comment.dto';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
  currentRoom?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/',
})
export class CommentGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly commentService: CommentService,
    private readonly streamService: StreamService,
    private readonly redisService: RedisService,
    private readonly analyticsService: AnalyticsService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Try to authenticate the user
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];
      
      if (token) {
        try {
          const payload = this.jwtService.verify(token);
          client.userId = payload.sub;
          client.username = payload.username;
        } catch {
          // Invalid token, continue as anonymous
          client.userId = undefined;
          client.username = `Guest_${client.id.substring(0, 6)}`;
        }
      } else {
        // Anonymous user
        client.userId = undefined;
        client.username = `Guest_${client.id.substring(0, 6)}`;
      }

      console.log(`Client connected: ${client.id} (${client.username})`);
    } catch (error) {
      console.error('Connection error:', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    console.log(`Client disconnected: ${client.id}`);
    
    // Leave room and update viewer count
    if (client.currentRoom) {
      await this.handleLeaveRoom(client, { streamId: client.currentRoom });
    }
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { streamId: string },
  ) {
    try {
      const { streamId } = data;

      // Leave current room if in one
      if (client.currentRoom) {
        await this.handleLeaveRoom(client, { streamId: client.currentRoom });
      }

      // Join new room
      await client.join(streamId);
      client.currentRoom = streamId;

      // Add viewer to Redis
      const viewerId = client.userId || client.id;
      await this.redisService.addViewer(streamId, viewerId);

      // Track analytics event
      await this.analyticsService.trackViewerEvent({
        userId: client.userId || null,
        streamId,
        event: 'join',
        timestamp: new Date(),
        metadata: { socketId: client.id },
      });

      // Get current viewer count
      const viewerCount = await this.redisService.getViewerCount(streamId);
      
      // Update stream viewer count
      await this.streamService.updateViewerCount(streamId, viewerCount);

      // Send confirmation to client
      client.emit('room_joined', {
        streamId,
        viewerCount,
        roomSettings: {
          commentCooldown: 1000,
          maxCommentLength: 200,
        },
      });

      // Broadcast viewer count update to room
      this.server.to(streamId).emit('viewer_count', {
        streamId,
        count: viewerCount,
      });

      // Send recent comments to the new viewer
      const recentComments = await this.commentService.getRecentComments(streamId);
      for (const comment of recentComments) {
        client.emit('new_comment', comment);
      }

    } catch (error) {
      console.error('Join room error:', error);
      client.emit('error', {
        code: 'JOIN_FAILED',
        message: 'Failed to join room',
      });
    }
  }

  @SubscribeMessage('leave_room')
  async handleLeaveRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { streamId: string },
  ) {
    try {
      const { streamId } = data;

      // Leave room
      await client.leave(streamId);
      
      // Remove viewer from Redis
      const viewerId = client.userId || client.id;
      await this.redisService.removeViewer(streamId, viewerId);

      // Track analytics event
      await this.analyticsService.trackViewerEvent({
        userId: client.userId || null,
        streamId,
        event: 'leave',
        timestamp: new Date(),
        metadata: { socketId: client.id },
      });

      // Get updated viewer count
      const viewerCount = await this.redisService.getViewerCount(streamId);
      
      // Update stream viewer count
      await this.streamService.updateViewerCount(streamId, viewerCount);

      // Broadcast viewer count update to room
      this.server.to(streamId).emit('viewer_count', {
        streamId,
        count: viewerCount,
      });

      client.currentRoom = undefined;
      
      client.emit('room_left', { streamId });

    } catch (error) {
      console.error('Leave room error:', error);
    }
  }

  @SubscribeMessage('send_comment')
  async handleSendComment(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: SendCommentDto,
  ) {
    try {
      // Process comment
      const comment = await this.commentService.sendComment(
        client.userId ?? null,
        client.username || 'Anonymous',
        data,
      );

      // Track analytics event
      await this.analyticsService.trackViewerEvent({
        userId: client.userId || null,
        streamId: data.streamId,
        event: 'comment',
        timestamp: new Date(),
        metadata: { 
          commentId: comment.id,
          text: data.text,
          command: data.command,
        },
      });

      // Broadcast to all users in the room
      this.server.to(data.streamId).emit('new_comment', comment);

      // Send success confirmation to sender
      client.emit('comment_sent', {
        success: true,
        commentId: comment.id,
      });

    } catch (error) {
      console.error('Send comment error:', error);
      
      let errorMessage = 'Failed to send comment';
      let errorCode = 'COMMENT_FAILED';
      let retryAfter = undefined;

      if (error.message.includes('Too many comments')) {
        errorCode = 'RATE_LIMIT';
        errorMessage = error.message;
        retryAfter = 1000; // 1 second
      } else if (error.message.includes('not live')) {
        errorCode = 'STREAM_OFFLINE';
        errorMessage = 'Stream is not live';
      } else if (error.message.includes('not allowed')) {
        errorCode = 'FORBIDDEN';
        errorMessage = 'Comments are not allowed';
      }

      client.emit('comment_sent', {
        success: false,
        error: errorMessage,
      });

      client.emit('error', {
        code: errorCode,
        message: errorMessage,
        retryAfter,
      });
    }
  }

  // Broadcast stream status changes
  async broadcastStreamStatus(streamId: string, status: 'waiting' | 'live' | 'ended') {
    this.server.to(streamId).emit('stream_status', {
      streamId,
      status,
    });
  }

  // Get connected clients count for a room
  async getRoomViewerCount(streamId: string): Promise<number> {
    const room = this.server.sockets.adapter.rooms.get(streamId);
    return room ? room.size : 0;
  }
}