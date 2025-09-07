import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
export declare class RedisService implements OnModuleInit, OnModuleDestroy {
    private configService;
    private client;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    addComment(streamId: string, comment: any): Promise<void>;
    getRecentComments(streamId: string, limit?: number): Promise<any[]>;
    addViewer(streamId: string, userId: string): Promise<void>;
    removeViewer(streamId: string, userId: string): Promise<void>;
    getViewerCount(streamId: string): Promise<number>;
    private updateViewerCount;
    assignLane(streamId: string): Promise<number>;
    checkRateLimit(userId: string, streamId: string, limit?: number, window?: number): Promise<boolean>;
    setUserSession(userId: string, data: {
        token: string;
        socketId?: string;
        currentStream?: string;
    }): Promise<void>;
    getUserSession(userId: string): Promise<any>;
    removeUserSession(userId: string): Promise<void>;
    cacheStream(streamId: string, data: any, ttl?: number): Promise<void>;
    getCachedStream(streamId: string): Promise<any | null>;
    invalidateStreamCache(streamId: string): Promise<void>;
    blockUser(userId: string, until: Date): Promise<void>;
    unblockUser(userId: string): Promise<void>;
    getBlockedUsers(): Promise<Array<{
        userId: string;
        blockedUntil: string;
    }> | null>;
    incrementWithExpiry(key: string, expiry: number): Promise<number>;
    getRecentUserMessages(key: string): Promise<string[]>;
    addRecentUserMessage(key: string, message: string, ttl: number): Promise<void>;
    addReport(report: {
        commentId: string;
        reporterId: string;
        reason: string;
        timestamp: Date;
    }): Promise<void>;
    getReportCount(): Promise<number>;
    getRecentMessages(userId: string, streamId: string, limit: number): Promise<string[]>;
    addRecentMessage(userId: string, streamId: string, message: string): Promise<void>;
    getClient(): Redis;
}
