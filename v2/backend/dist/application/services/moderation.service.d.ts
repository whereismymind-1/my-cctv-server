import { RedisService } from '../../infrastructure/redis/redis.service';
interface ModerationResult {
    isAllowed: boolean;
    reason?: string;
    severity?: 'low' | 'medium' | 'high';
    suggestedAction?: 'warn' | 'mute' | 'ban';
}
export declare class ModerationService {
    private readonly redisService;
    private bannedWords;
    private spamPatterns;
    private blockedUsers;
    private userViolations;
    constructor(redisService: RedisService);
    private initializeBannedWords;
    private initializeSpamPatterns;
    loadBlockedUsersFromRedis(): Promise<void>;
    moderateComment(text: string, userId: string | null, streamId: string): Promise<ModerationResult>;
    private checkBannedWords;
    private checkSpamPatterns;
    private checkFloodProtection;
    private checkMessageSimilarity;
    private calculateSimilarity;
    private levenshteinDistance;
    blockUser(userId: string, duration?: number): Promise<void>;
    unblockUser(userId: string): Promise<void>;
    isUserBlocked(userId: string): boolean;
    private recordViolation;
    reportComment(commentId: string, reporterId: string, reason: string): Promise<void>;
    getModerationStats(): Promise<any>;
    addBannedWord(word: string): void;
    removeBannedWord(word: string): void;
    getBannedWords(): string[];
}
export {};
