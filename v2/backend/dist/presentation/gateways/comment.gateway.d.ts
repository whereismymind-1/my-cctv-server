import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
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
export declare class CommentGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly commentService;
    private readonly streamService;
    private readonly redisService;
    private readonly analyticsService;
    private readonly jwtService;
    server: Server;
    constructor(commentService: CommentService, streamService: StreamService, redisService: RedisService, analyticsService: AnalyticsService, jwtService: JwtService);
    handleConnection(client: AuthenticatedSocket): Promise<void>;
    handleDisconnect(client: AuthenticatedSocket): Promise<void>;
    handleJoinRoom(client: AuthenticatedSocket, data: {
        streamId: string;
    }): Promise<void>;
    handleLeaveRoom(client: AuthenticatedSocket, data: {
        streamId: string;
    }): Promise<void>;
    handleSendComment(client: AuthenticatedSocket, data: SendCommentDto): Promise<void>;
    broadcastStreamStatus(streamId: string, status: 'waiting' | 'live' | 'ended'): Promise<void>;
    getRoomViewerCount(streamId: string): Promise<number>;
}
export {};
