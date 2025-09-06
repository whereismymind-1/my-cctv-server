export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class CommentValidator {
  private readonly maxLength: number;
  private readonly minLength: number;
  private readonly bannedWords: Set<string>;
  private readonly urlPattern = /https?:\/\/[^\s]+/gi;
  private readonly htmlTagPattern = /<[^>]*>/g;
  private readonly excessiveSpacePattern = /\s{3,}/g;
  private readonly maxConsecutiveChars = 15;

  constructor(
    maxLength = 200,
    minLength = 1,
    bannedWords: string[] = [],
  ) {
    this.maxLength = maxLength;
    this.minLength = minLength;
    this.bannedWords = new Set(bannedWords.map(w => w.toLowerCase()));
  }

  validate(text: string): ValidationResult {
    const errors: string[] = [];

    // Check if text is empty or only whitespace
    if (!text || text.trim().length === 0) {
      errors.push('Comment cannot be empty');
      return { isValid: false, errors };
    }

    // Sanitize text first
    const sanitized = this.sanitize(text);

    // Check length
    if (sanitized.length < this.minLength) {
      errors.push(`Comment must be at least ${this.minLength} character(s)`);
    }

    if (sanitized.length > this.maxLength) {
      errors.push(`Comment cannot exceed ${this.maxLength} characters`);
    }

    // Check for banned words
    const lowerText = sanitized.toLowerCase();
    for (const bannedWord of this.bannedWords) {
      if (lowerText.includes(bannedWord)) {
        errors.push(`Comment contains prohibited content`);
        break;
      }
    }

    // Check for spam patterns
    if (this.isSpam(sanitized)) {
      errors.push('Comment appears to be spam');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  sanitize(text: string): string {
    let sanitized = text;

    // Remove HTML tags
    sanitized = sanitized.replace(this.htmlTagPattern, '');

    // Remove URLs (optional, depending on policy)
    // sanitized = sanitized.replace(this.urlPattern, '[URL]');

    // Replace excessive spaces with single space
    sanitized = sanitized.replace(this.excessiveSpacePattern, ' ');

    // Trim whitespace
    sanitized = sanitized.trim();

    // Limit to max length if exceeded
    if (sanitized.length > this.maxLength) {
      sanitized = sanitized.substring(0, this.maxLength);
    }

    return sanitized;
  }

  private isSpam(text: string): boolean {
    // Check for repeated characters
    const repeatedCharPattern = new RegExp(`(.)\\1{${this.maxConsecutiveChars},}`, 'g');
    if (repeatedCharPattern.test(text)) {
      return true;
    }

    // Check for repeated words (more than 3 times)
    const words = text.toLowerCase().split(/\s+/);
    const wordCount = new Map<string, number>();
    
    for (const word of words) {
      if (word.length > 2) { // Only check words longer than 2 chars
        const count = (wordCount.get(word) || 0) + 1;
        wordCount.set(word, count);
        if (count > 3) {
          return true;
        }
      }
    }

    // Check if text is mostly uppercase (more than 70%)
    const upperCaseRatio = (text.match(/[A-Z]/g) || []).length / text.length;
    if (text.length > 10 && upperCaseRatio > 0.7) {
      return true;
    }

    // Check if text contains too many special characters
    const specialCharRatio = (text.match(/[^a-zA-Z0-9\s\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf\u1100-\u11ff\u3130-\u318f\uac00-\ud7af]/g) || []).length / text.length;
    if (specialCharRatio > 0.5) {
      return true;
    }

    return false;
  }

  isValidCommand(command: string | null): boolean {
    if (!command) return true;

    const validCommands = [
      'ue', 'top', 'shita', 'bottom',
      'white', 'red', 'pink', 'orange', 'yellow',
      'green', 'cyan', 'blue', 'purple', 'black',
      'small', 'medium', 'big',
    ];

    const parts = command.toLowerCase().split(' ').filter(p => p.length > 0);
    
    // Check if all parts are valid commands
    return parts.every(part => validCommands.includes(part));
  }

  addBannedWord(word: string): void {
    this.bannedWords.add(word.toLowerCase());
  }

  removeBannedWord(word: string): void {
    this.bannedWords.delete(word.toLowerCase());
  }

  getBannedWords(): string[] {
    return Array.from(this.bannedWords);
  }
}