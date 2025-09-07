import { Injectable } from '@nestjs/common';

/**
 * Domain Service for Moderation
 * Contains core business logic for content moderation
 * This is pure business logic without infrastructure dependencies
 */
@Injectable()
export class ModerationDomainService {
  private readonly bannedWords: Set<string>;
  private readonly spamPatterns: RegExp[];
  private readonly maxViolationsBeforeBlock = 5;
  private readonly defaultBlockDuration = 3600000; // 1 hour

  constructor() {
    this.bannedWords = this.initializeBannedWords();
    this.spamPatterns = this.initializeSpamPatterns();
  }

  private initializeBannedWords(): Set<string> {
    return new Set([
      'spam',
      'scam',
      'hack',
      'cheat',
      'exploit',
      'バカ',
      'アホ',
    ]);
  }

  private initializeSpamPatterns(): RegExp[] {
    return [
      /https?:\/\/[^\s]+/gi,           // URLs
      /(.)\1{10,}/g,                    // Repeated characters
      /^[A-Z\s]{20,}$/,                 // All caps
      /^\d{10,}$/,                      // Number spam
      /discord\.gg\/[a-zA-Z0-9]+/gi,   // Discord invites
      /t\.me\/[a-zA-Z0-9]+/gi,         // Telegram invites
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, // Emails
    ];
  }

  /**
   * Check if text contains banned words
   * Pure domain logic
   */
  containsBannedWords(text: string): boolean {
    const lowerText = text.toLowerCase();
    for (const word of this.bannedWords) {
      if (lowerText.includes(word.toLowerCase())) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if text matches spam patterns
   * Pure domain logic
   */
  isSpam(text: string): boolean {
    return this.spamPatterns.some(pattern => {
      pattern.lastIndex = 0; // Reset regex state
      return pattern.test(text);
    });
  }

  /**
   * Calculate text similarity using Levenshtein distance
   * Pure algorithm, no dependencies
   */
  calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Determine moderation severity based on content
   * Business rule: different types of violations have different severities
   */
  determineSeverity(
    hasBannedWords: boolean,
    isSpam: boolean,
    similarityScore: number,
    violationCount: number,
  ): 'low' | 'medium' | 'high' {
    if (violationCount >= this.maxViolationsBeforeBlock) {
      return 'high';
    }
    if (hasBannedWords) {
      return 'medium';
    }
    if (isSpam || similarityScore > 0.8) {
      return 'low';
    }
    return 'low';
  }

  /**
   * Determine if user should be auto-blocked
   * Business rule: auto-block after 5 violations
   */
  shouldAutoBlock(violationCount: number): boolean {
    return violationCount >= this.maxViolationsBeforeBlock;
  }

  /**
   * Calculate block duration based on violation count
   * Business rule: progressive penalties
   */
  calculateBlockDuration(violationCount: number): number {
    if (violationCount >= 10) {
      return 86400000; // 24 hours
    }
    if (violationCount >= 5) {
      return 3600000 * 6; // 6 hours
    }
    return this.defaultBlockDuration;
  }

  /**
   * Check if messages are too similar (flood detection)
   * Business rule: 80% similarity threshold
   */
  areMessagesSimilar(msg1: string, msg2: string, threshold = 0.8): boolean {
    return this.calculateSimilarity(msg1, msg2) > threshold;
  }

  /**
   * Validate moderation action
   * Business rules for what actions are allowed
   */
  validateModerationAction(
    action: 'block' | 'unblock' | 'warn' | 'mute',
    moderatorLevel: number,
    targetUserLevel: number,
  ): boolean {
    // Moderators can only moderate users of lower level
    if (targetUserLevel >= moderatorLevel) {
      return false;
    }
    
    // Level requirements for different actions
    switch (action) {
      case 'block':
        return moderatorLevel >= 3;
      case 'unblock':
        return moderatorLevel >= 3;
      case 'mute':
        return moderatorLevel >= 2;
      case 'warn':
        return moderatorLevel >= 1;
      default:
        return false;
    }
  }

  /**
   * Get moderation reason message
   * Business logic for user-facing messages
   */
  getModerationReason(
    hasBannedWords: boolean,
    isSpam: boolean,
    isFlooding: boolean,
    isSimilar: boolean,
  ): string {
    if (hasBannedWords) {
      return 'Your message contains inappropriate content';
    }
    if (isSpam) {
      return 'Your message was detected as spam';
    }
    if (isFlooding) {
      return 'You are sending messages too quickly';
    }
    if (isSimilar) {
      return 'Please avoid sending duplicate messages';
    }
    return 'Your message violated community guidelines';
  }

  // Getters for configuration
  getBannedWords(): string[] {
    return Array.from(this.bannedWords);
  }

  addBannedWord(word: string): void {
    this.bannedWords.add(word.toLowerCase());
  }

  removeBannedWord(word: string): void {
    this.bannedWords.delete(word.toLowerCase());
  }

  getMaxViolationsBeforeBlock(): number {
    return this.maxViolationsBeforeBlock;
  }
}