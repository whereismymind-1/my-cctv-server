"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const jwt_1 = require("@nestjs/jwt");
const comment_service_1 = require("../../application/services/comment.service");
const stream_service_1 = require("../../application/services/stream.service");
const redis_service_1 = require("../../infrastructure/redis/redis.service");
const analytics_service_1 = require("../../application/services/analytics.service");
const comment_dto_1 = require("../../application/dto/comment.dto");
let CommentGateway = class CommentGateway {
    constructor(commentService, streamService, redisService, analyticsService, jwtService) {
        this.commentService = commentService;
        this.streamService = streamService;
        this.redisService = redisService;
        this.analyticsService = analyticsService;
        this.jwtService = jwtService;
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];
            if (token) {
                try {
                    const payload = this.jwtService.verify(token);
                    client.userId = payload.sub;
                    client.username = payload.username;
                }
                catch {
                    client.userId = undefined;
                    client.username = `Guest_${client.id.substring(0, 6)}`;
                }
            }
            else {
                client.userId = undefined;
                client.username = `Guest_${client.id.substring(0, 6)}`;
            }
            console.log(`Client connected: ${client.id} (${client.username})`);
        }
        catch (error) {
            console.error('Connection error:', error);
            client.disconnect();
        }
    }
    async handleDisconnect(client) {
        console.log(`Client disconnected: ${client.id}`);
        if (client.currentRoom) {
            await this.handleLeaveRoom(client, { streamId: client.currentRoom });
        }
    }
    async handleJoinRoom(client, data) {
        try {
            const { streamId } = data;
            if (client.currentRoom) {
                await this.handleLeaveRoom(client, { streamId: client.currentRoom });
            }
            await client.join(streamId);
            client.currentRoom = streamId;
            const viewerId = client.userId || client.id;
            await this.redisService.addViewer(streamId, viewerId);
            await this.analyticsService.trackViewerEvent({
                userId: client.userId || null,
                streamId,
                event: 'join',
                timestamp: new Date(),
                metadata: { socketId: client.id },
            });
            const viewerCount = await this.redisService.getViewerCount(streamId);
            await this.streamService.updateViewerCount(streamId, viewerCount);
            client.emit('room_joined', {
                streamId,
                viewerCount,
                roomSettings: {
                    commentCooldown: 1000,
                    maxCommentLength: 200,
                },
            });
            this.server.to(streamId).emit('viewer_count', {
                streamId,
                count: viewerCount,
            });
            const recentComments = await this.commentService.getRecentComments(streamId);
            for (const comment of recentComments) {
                client.emit('new_comment', comment);
            }
        }
        catch (error) {
            console.error('Join room error:', error);
            client.emit('error', {
                code: 'JOIN_FAILED',
                message: 'Failed to join room',
            });
        }
    }
    async handleLeaveRoom(client, data) {
        try {
            const { streamId } = data;
            await client.leave(streamId);
            const viewerId = client.userId || client.id;
            await this.redisService.removeViewer(streamId, viewerId);
            await this.analyticsService.trackViewerEvent({
                userId: client.userId || null,
                streamId,
                event: 'leave',
                timestamp: new Date(),
                metadata: { socketId: client.id },
            });
            const viewerCount = await this.redisService.getViewerCount(streamId);
            await this.streamService.updateViewerCount(streamId, viewerCount);
            this.server.to(streamId).emit('viewer_count', {
                streamId,
                count: viewerCount,
            });
            client.currentRoom = undefined;
            client.emit('room_left', { streamId });
        }
        catch (error) {
            console.error('Leave room error:', error);
        }
    }
    async handleSendComment(client, data) {
        try {
            const comment = await this.commentService.sendComment(client.userId ?? null, client.username || 'Anonymous', data);
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
            this.server.to(data.streamId).emit('new_comment', comment);
            client.emit('comment_sent', {
                success: true,
                commentId: comment.id,
            });
        }
        catch (error) {
            console.error('Send comment error:', error);
            let errorMessage = 'Failed to send comment';
            let errorCode = 'COMMENT_FAILED';
            let retryAfter = undefined;
            if (error.message.includes('Too many comments')) {
                errorCode = 'RATE_LIMIT';
                errorMessage = error.message;
                retryAfter = 1000;
            }
            else if (error.message.includes('not live')) {
                errorCode = 'STREAM_OFFLINE';
                errorMessage = 'Stream is not live';
            }
            else if (error.message.includes('not allowed')) {
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
    async broadcastStreamStatus(streamId, status) {
        this.server.to(streamId).emit('stream_status', {
            streamId,
            status,
        });
    }
    async getRoomViewerCount(streamId) {
        const room = this.server.sockets.adapter.rooms.get(streamId);
        return room ? room.size : 0;
    }
};
exports.CommentGateway = CommentGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], CommentGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join_room'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CommentGateway.prototype, "handleJoinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leave_room'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CommentGateway.prototype, "handleLeaveRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('send_comment'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, comment_dto_1.SendCommentDto]),
    __metadata("design:returntype", Promise)
], CommentGateway.prototype, "handleSendComment", null);
exports.CommentGateway = CommentGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
            credentials: true,
        },
        namespace: '/',
    }),
    __metadata("design:paramtypes", [comment_service_1.CommentService,
        stream_service_1.StreamService,
        redis_service_1.RedisService,
        analytics_service_1.AnalyticsService,
        jwt_1.JwtService])
], CommentGateway);
//# sourceMappingURL=comment.gateway.js.map