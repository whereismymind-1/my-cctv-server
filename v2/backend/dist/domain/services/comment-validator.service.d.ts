export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}
export declare class CommentValidator {
    private readonly maxLength;
    private readonly minLength;
    private readonly bannedWords;
    private readonly urlPattern;
    private readonly htmlTagPattern;
    private readonly excessiveSpacePattern;
    private readonly maxConsecutiveChars;
    constructor(maxLength?: number, minLength?: number, bannedWords?: string[]);
    validate(text: string): ValidationResult;
    sanitize(text: string): string;
    private isSpam;
    isValidCommand(command: string | null): boolean;
    addBannedWord(word: string): void;
    removeBannedWord(word: string): void;
    getBannedWords(): string[];
}
