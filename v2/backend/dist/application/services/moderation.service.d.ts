import { ModerationDomainService } from '../../domain/services/moderation-domain.service';
import { ICacheRepository } from '../../domain/repositories/cache.repository.interface';
interface ModerationResult {
    isAllowed: boolean;
    reason?: string;
    severity?: 'low' | 'medium' | 'high';
    suggestedAction?: 'warn' | 'mute' | 'ban';
}
export declare class ModerationService {
    private readonly cacheRepository;
    private readonly moderationDomainService;
    private static readonly BLOCKED_USERS_KEY;
    private static readonly VIOLATIONS_PREFIX;
    private static readonly RECENT_MESSAGES_PREFIX;
    private static readonly REPORTS_KEY;
    constructor(cacheRepository: ICacheRepository, moderationDomainService: ModerationDomainService);
    moderateComment(text: string, userId: string | null, streamId: string): Promise<ModerationResult>;
    private isUserBlocked;
    private checkFlooding;
    private storeRecentMessage;
    private getViolationCount;
    private recordViolation;
    blockUser(userId: string, duration: number): Promise<void>;
    unblockUser(userId: string): Promise<void>;
    reportComment(commentId: string, reporterId: string, reason: string): Promise<void>;
    getModerationStats(): Promise<any>;
    getBannedWords(): string[];
    addBannedWord(word: string): void;
    removeBannedWord(word: string): void;
}
export {};
