export declare class ModerationDomainService {
    private readonly bannedWords;
    private readonly spamPatterns;
    private readonly maxViolationsBeforeBlock;
    private readonly defaultBlockDuration;
    constructor();
    private initializeBannedWords;
    private initializeSpamPatterns;
    containsBannedWords(text: string): boolean;
    isSpam(text: string): boolean;
    calculateSimilarity(str1: string, str2: string): number;
    private levenshteinDistance;
    determineSeverity(hasBannedWords: boolean, isSpam: boolean, similarityScore: number, violationCount: number): 'low' | 'medium' | 'high';
    shouldAutoBlock(violationCount: number): boolean;
    calculateBlockDuration(violationCount: number): number;
    areMessagesSimilar(msg1: string, msg2: string, threshold?: number): boolean;
    validateModerationAction(action: 'block' | 'unblock' | 'warn' | 'mute', moderatorLevel: number, targetUserLevel: number): boolean;
    getModerationReason(hasBannedWords: boolean, isSpam: boolean, isFlooding: boolean, isSimilar: boolean): string;
    getBannedWords(): string[];
    addBannedWord(word: string): void;
    removeBannedWord(word: string): void;
    getMaxViolationsBeforeBlock(): number;
}
