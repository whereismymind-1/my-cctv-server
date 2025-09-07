import { Injectable, Inject } from '@nestjs/common';
import { ModerationDomainService } from '../../domain/services/moderation-domain.service';
import { ICacheRepository } from '../../domain/repositories/cache.repository.interface';

interface ModerationResult {
  isAllowed: boolean;
  reason?: string;
  severity?: 'low' | 'medium' | 'high';
  suggestedAction?: 'warn' | 'mute' | 'ban';
}

/**
 * Moderation Application Service (Refactored)
 * - No in-memory state (stateless, scalable)
 * - Depends on abstractions, not implementations
 * - Orchestrates domain services
 */
@Injectable()
export class ModerationService {
  private static readonly BLOCKED_USERS_KEY = 'blocked_users';
  private static readonly VIOLATIONS_PREFIX = 'violations:';
  private static readonly RECENT_MESSAGES_PREFIX = 'recent:';
  private static readonly REPORTS_KEY = 'moderation:reports';
  
  constructor(
    @Inject('CACHE_REPOSITORY')
    private readonly cacheRepository: ICacheRepository,
    private readonly moderationDomainService: ModerationDomainService,
  ) {}

  /**
   * Check if a comment should be allowed
   * Orchestrates domain logic with infrastructure
   */
  async moderateComment(
    text: string,
    userId: string | null,
    streamId: string,
  ): Promise<ModerationResult> {
    // Check if user is blocked (from cache, not memory)
    if (userId && await this.isUserBlocked(userId)) {
      return {
        isAllowed: false,
        reason: 'User is blocked',
        severity: 'high',
      };
    }

    // Use domain service for content analysis
    const hasBannedWords = this.moderationDomainService.containsBannedWords(text);
    const isSpam = this.moderationDomainService.isSpam(text);
    
    // Check for flooding using cache
    const isFlooding = userId ? await this.checkFlooding(userId, streamId, text) : false;
    
    // Get violation count from cache
    const violationCount = userId ? await this.getViolationCount(userId) : 0;
    
    // Domain logic for severity
    const severity = this.moderationDomainService.determineSeverity(
      hasBannedWords,
      isSpam,
      0,
      violationCount,
    );

    if (hasBannedWords) {
      if (userId) await this.recordViolation(userId, 'banned_words', streamId);
      return {
        isAllowed: false,
        reason: this.moderationDomainService.getModerationReason(true, false, false, false),
        severity,
      };
    }

    if (isSpam) {
      if (userId) await this.recordViolation(userId, 'spam', streamId);
      return {
        isAllowed: false,
        reason: this.moderationDomainService.getModerationReason(false, true, false, false),
        severity,
      };
    }

    if (isFlooding) {
      if (userId) await this.recordViolation(userId, 'flooding', streamId);
      return {
        isAllowed: false,
        reason: this.moderationDomainService.getModerationReason(false, false, true, false),
        severity,
      };
    }

    // Store message for future flood detection
    if (userId) {
      await this.storeRecentMessage(userId, streamId, text);
    }

    return { isAllowed: true };
  }

  /**
   * Check if user is blocked (from cache, not memory)
   */
  private async isUserBlocked(userId: string): Promise<boolean> {
    const blockedUntil = await this.cacheRepository.get(`blocked:${userId}`);
    if (!blockedUntil) return false;
    
    const blockExpiry = new Date(blockedUntil);
    if (blockExpiry > new Date()) {
      return true;
    }
    
    // Block expired, remove it
    await this.cacheRepository.delete(`blocked:${userId}`);
    return false;
  }

  /**
   * Check for flooding using cache
   */
  private async checkFlooding(
    userId: string,
    streamId: string,
    text: string,
  ): Promise<boolean> {
    const key = `${ModerationService.RECENT_MESSAGES_PREFIX}${userId}:${streamId}`;
    const recentMessages = await this.cacheRepository.getListRange(key, 0, 9);
    
    // Check for similar messages
    const hasSimilar = recentMessages.some(msg => 
      this.moderationDomainService.areMessagesSimilar(msg, text)
    );
    
    return hasSimilar;
  }

  /**
   * Store recent message in cache
   */
  private async storeRecentMessage(
    userId: string,
    streamId: string,
    text: string,
  ): Promise<void> {
    const key = `${ModerationService.RECENT_MESSAGES_PREFIX}${userId}:${streamId}`;
    await this.cacheRepository.pushToList(key, text);
    await this.cacheRepository.trimList(key, 0, 9); // Keep last 10
    await this.cacheRepository.set(key, '1', 300); // Expire in 5 minutes
  }

  /**
   * Get violation count from cache
   */
  private async getViolationCount(userId: string): Promise<number> {
    const key = `${ModerationService.VIOLATIONS_PREFIX}${userId}`;
    const count = await this.cacheRepository.get(key);
    return count ? parseInt(count, 10) : 0;
  }

  /**
   * Record violation in cache
   */
  private async recordViolation(
    userId: string,
    type: string,
    streamId: string,
  ): Promise<void> {
    const key = `${ModerationService.VIOLATIONS_PREFIX}${userId}`;
    const newCount = await this.cacheRepository.increment(key);
    
    // Set expiry for violations counter (24 hours)
    await this.cacheRepository.set(key, newCount.toString(), 86400);
    
    // Check if should auto-block
    if (this.moderationDomainService.shouldAutoBlock(newCount)) {
      const blockDuration = this.moderationDomainService.calculateBlockDuration(newCount);
      await this.blockUser(userId, blockDuration);
    }
    
    // Log violation details
    const violationLog = JSON.stringify({
      userId,
      type,
      streamId,
      timestamp: new Date().toISOString(),
      count: newCount,
    });
    await this.cacheRepository.pushToList(`violations:log:${userId}`, violationLog);
  }

  /**
   * Block user (in cache, not memory)
   */
  async blockUser(userId: string, duration: number): Promise<void> {
    const until = new Date(Date.now() + duration);
    await this.cacheRepository.set(
      `blocked:${userId}`,
      until.toISOString(),
      Math.floor(duration / 1000), // TTL in seconds
    );
  }

  /**
   * Unblock user
   */
  async unblockUser(userId: string): Promise<void> {
    await this.cacheRepository.delete(`blocked:${userId}`);
  }

  /**
   * Report a comment
   */
  async reportComment(
    commentId: string,
    reporterId: string,
    reason: string,
  ): Promise<void> {
    const report = JSON.stringify({
      commentId,
      reporterId,
      reason,
      timestamp: new Date().toISOString(),
    });
    await this.cacheRepository.pushToList(ModerationService.REPORTS_KEY, report);
  }

  /**
   * Get moderation statistics
   */
  async getModerationStats(): Promise<any> {
    const reports = await this.cacheRepository.getListRange(
      ModerationService.REPORTS_KEY,
      0,
      -1,
    );
    
    return {
      bannedWordsCount: this.moderationDomainService.getBannedWords().length,
      reportsCount: reports.length,
      // Note: blocked users count would require scanning keys
      // In production, use a dedicated counter
    };
  }

  /**
   * Get list of banned words
   */
  getBannedWords(): string[] {
    return this.moderationDomainService.getBannedWords();
  }

  /**
   * Add a banned word
   */
  addBannedWord(word: string): void {
    this.moderationDomainService.addBannedWord(word);
  }

  /**
   * Remove a banned word
   */
  removeBannedWord(word: string): void {
    this.moderationDomainService.removeBannedWord(word);
  }
}