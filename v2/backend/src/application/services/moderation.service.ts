import { Injectable, Inject } from '@nestjs/common';
import { RedisService } from '../../infrastructure/redis/redis.service';

interface ModerationResult {
  isAllowed: boolean;
  reason?: string;
  severity?: 'low' | 'medium' | 'high';
  suggestedAction?: 'warn' | 'mute' | 'ban';
}

interface UserViolation {
  userId: string;
  count: number;
  lastViolation: Date;
  severity: 'low' | 'medium' | 'high';
}

@Injectable()
export class ModerationService {
  private bannedWords: Set<string>;
  private spamPatterns: RegExp[];
  private blockedUsers: Map<string, Date>;
  private userViolations: Map<string, UserViolation>;

  constructor(
    private readonly redisService: RedisService,
  ) {
    this.initializeBannedWords();
    this.initializeSpamPatterns();
    this.blockedUsers = new Map();
    this.userViolations = new Map();
    // Delay loading blocked users to ensure Redis is initialized
    setTimeout(() => this.loadBlockedUsersFromRedis(), 100);
  }

  private initializeBannedWords() {
    // Initialize with common inappropriate words (keeping it PG for this example)
    this.bannedWords = new Set([
      // Add actual banned words in production
      'spam',
      'scam',
      'hack',
      'cheat',
      'exploit',
      // Japanese inappropriate words
      'バカ',
      'アホ',
      // Add more as needed
    ]);
  }

  private initializeSpamPatterns() {
    this.spamPatterns = [
      // URL spam
      /https?:\/\/[^\s]+/gi,
      // Repeated characters (more than 10)
      /(.)\1{10,}/g,
      // All caps messages (more than 20 chars)
      /^[A-Z\s]{20,}$/,
      // Number spam
      /^\d{10,}$/,
      // Discord/Telegram invite links
      /discord\.gg\/[a-zA-Z0-9]+/gi,
      /t\.me\/[a-zA-Z0-9]+/gi,
      // Email addresses (potential phishing)
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    ];
  }

  async loadBlockedUsersFromRedis() {
    const blocked = await this.redisService.getBlockedUsers();
    if (blocked) {
      blocked.forEach(user => {
        this.blockedUsers.set(user.userId, new Date(user.blockedUntil));
      });
    }
  }

  /**
   * Check if a comment should be allowed
   */
  async moderateComment(
    text: string,
    userId: string | null,
    streamId: string,
  ): Promise<ModerationResult> {
    // Check if user is blocked
    if (userId && this.isUserBlocked(userId)) {
      return {
        isAllowed: false,
        reason: 'User is blocked',
        severity: 'high',
      };
    }

    // Check for banned words
    const bannedWordCheck = this.checkBannedWords(text);
    if (!bannedWordCheck.isAllowed) {
      this.recordViolation(userId, 'medium');
      return bannedWordCheck;
    }

    // Check for spam patterns
    const spamCheck = this.checkSpamPatterns(text);
    if (!spamCheck.isAllowed) {
      this.recordViolation(userId, 'low');
      return spamCheck;
    }

    // Check rate limiting (flood protection)
    if (userId) {
      const floodCheck = await this.checkFloodProtection(userId, streamId);
      if (!floodCheck.isAllowed) {
        this.recordViolation(userId, 'low');
        return floodCheck;
      }
    }

    // Check message similarity (prevent copy-paste spam)
    const similarityCheck = await this.checkMessageSimilarity(text, userId, streamId);
    if (!similarityCheck.isAllowed) {
      this.recordViolation(userId, 'low');
      return similarityCheck;
    }

    return { isAllowed: true };
  }

  /**
   * Check for banned words
   */
  private checkBannedWords(text: string): ModerationResult {
    const lowerText = text.toLowerCase();
    
    for (const word of this.bannedWords) {
      if (lowerText.includes(word.toLowerCase())) {
        return {
          isAllowed: false,
          reason: 'Message contains inappropriate content',
          severity: 'medium',
          suggestedAction: 'warn',
        };
      }
    }

    return { isAllowed: true };
  }

  /**
   * Check for spam patterns
   */
  private checkSpamPatterns(text: string): ModerationResult {
    for (const pattern of this.spamPatterns) {
      if (pattern.test(text)) {
        return {
          isAllowed: false,
          reason: 'Message appears to be spam',
          severity: 'low',
          suggestedAction: 'warn',
        };
      }
    }

    return { isAllowed: true };
  }

  /**
   * Check flood protection
   */
  private async checkFloodProtection(
    userId: string,
    streamId: string,
  ): Promise<ModerationResult> {
    const key = `flood:${userId}:${streamId}`;
    const count = await this.redisService.incrementWithExpiry(key, 60); // 1 minute window
    
    if (count > 10) { // More than 10 messages per minute
      return {
        isAllowed: false,
        reason: 'Sending messages too quickly',
        severity: 'low',
        suggestedAction: 'warn',
      };
    }

    return { isAllowed: true };
  }

  /**
   * Check message similarity to prevent copy-paste spam
   */
  private async checkMessageSimilarity(
    text: string,
    userId: string | null,
    streamId: string,
  ): Promise<ModerationResult> {
    if (!userId) return { isAllowed: true };

    const key = `recent:${userId}:${streamId}`;
    const recentMessages = await this.redisService.getRecentUserMessages(key);
    
    if (recentMessages && recentMessages.length > 0) {
      const similarCount = recentMessages.filter(msg => 
        this.calculateSimilarity(msg, text) > 0.8
      ).length;

      if (similarCount >= 3) { // 3 or more similar messages
        return {
          isAllowed: false,
          reason: 'Duplicate message detected',
          severity: 'low',
          suggestedAction: 'warn',
        };
      }
    }

    // Store this message for future comparison
    await this.redisService.addRecentUserMessage(key, text, 300); // Keep for 5 minutes

    return { isAllowed: true };
  }

  /**
   * Calculate similarity between two strings (0-1)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
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
   * Block a user
   */
  async blockUser(userId: string, duration: number = 3600000): Promise<void> {
    const until = new Date(Date.now() + duration);
    this.blockedUsers.set(userId, until);
    await this.redisService.blockUser(userId, until);
  }

  /**
   * Unblock a user
   */
  async unblockUser(userId: string): Promise<void> {
    this.blockedUsers.delete(userId);
    await this.redisService.unblockUser(userId);
  }

  /**
   * Check if user is blocked
   */
  isUserBlocked(userId: string): boolean {
    const blockExpiry = this.blockedUsers.get(userId);
    if (!blockExpiry) return false;
    
    if (blockExpiry > new Date()) {
      return true;
    } else {
      // Block has expired, remove it
      this.blockedUsers.delete(userId);
      return false;
    }
  }

  /**
   * Record a violation
   */
  private recordViolation(userId: string | null, severity: 'low' | 'medium' | 'high') {
    if (!userId) return;

    const existing = this.userViolations.get(userId);
    if (existing) {
      existing.count++;
      existing.lastViolation = new Date();
      existing.severity = severity;
      
      // Auto-block after multiple violations
      if (existing.count >= 5) {
        const duration = existing.count * 600000; // 10 minutes per violation
        this.blockUser(userId, duration);
      }
    } else {
      this.userViolations.set(userId, {
        userId,
        count: 1,
        lastViolation: new Date(),
        severity,
      });
    }
  }

  /**
   * Report a comment
   */
  async reportComment(
    commentId: string,
    reporterId: string,
    reason: string,
  ): Promise<void> {
    await this.redisService.addReport({
      commentId,
      reporterId,
      reason,
      timestamp: new Date(),
    });
  }

  /**
   * Get moderation statistics
   */
  async getModerationStats(): Promise<any> {
    return {
      blockedUsers: this.blockedUsers.size,
      activeViolations: this.userViolations.size,
      bannedWords: this.bannedWords.size,
      reports: await this.redisService.getReportCount(),
    };
  }

  /**
   * Add a banned word
   */
  addBannedWord(word: string): void {
    this.bannedWords.add(word.toLowerCase());
  }

  /**
   * Remove a banned word
   */
  removeBannedWord(word: string): void {
    this.bannedWords.delete(word.toLowerCase());
  }

  /**
   * Get all banned words
   */
  getBannedWords(): string[] {
    return Array.from(this.bannedWords);
  }
}