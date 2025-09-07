import { ModerationService } from '../../application/services/moderation.service';
interface BlockUserDto {
    userId: string;
    duration?: number;
    reason?: string;
}
interface ReportCommentDto {
    commentId: string;
    reason: string;
}
interface AddBannedWordDto {
    word: string;
}
export declare class ModerationController {
    private readonly moderationService;
    constructor(moderationService: ModerationService);
    getModerationStats(): Promise<any>;
    blockUser(user: any, dto: BlockUserDto): Promise<{
        message: string;
    }>;
    unblockUser(user: any, userId: string): Promise<{
        message: string;
    }>;
    reportComment(user: any, dto: ReportCommentDto): Promise<{
        message: string;
    }>;
    getBannedWords(): Promise<{
        words: string[];
    }>;
    addBannedWord(user: any, dto: AddBannedWordDto): Promise<{
        message: string;
    }>;
    removeBannedWord(user: any, word: string): Promise<{
        message: string;
    }>;
}
export {};
