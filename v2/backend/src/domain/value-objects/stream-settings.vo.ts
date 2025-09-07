/**
 * Stream Settings Value Object
 * Immutable object representing stream configuration
 */
export class StreamSettings {
  constructor(
    public readonly allowComments: boolean,
    public readonly commentCooldown: number, // milliseconds
    public readonly maxCommentLength: number,
    public readonly allowAnonymous: boolean,
    public readonly moderationLevel: 'none' | 'low' | 'medium' | 'high',
    public readonly allowEmotes: boolean,
    public readonly allowLinks: boolean,
  ) {
    this.validate();
  }

  /**
   * Validate settings
   */
  private validate(): void {
    if (this.commentCooldown < 0 || this.commentCooldown > 60000) {
      throw new Error('Comment cooldown must be between 0 and 60 seconds');
    }
    
    if (this.maxCommentLength < 1 || this.maxCommentLength > 500) {
      throw new Error('Max comment length must be between 1 and 500');
    }
    
    const validLevels = ['none', 'low', 'medium', 'high'];
    if (!validLevels.includes(this.moderationLevel)) {
      throw new Error('Invalid moderation level');
    }
  }

  /**
   * Update settings (returns new instance)
   */
  update(changes: Partial<StreamSettings>, userLevel: number): StreamSettings {
    // Apply level-based restrictions
    const allowedChanges = this.applyLevelRestrictions(changes, userLevel);
    
    return new StreamSettings(
      allowedChanges.allowComments ?? this.allowComments,
      allowedChanges.commentCooldown ?? this.commentCooldown,
      allowedChanges.maxCommentLength ?? this.maxCommentLength,
      allowedChanges.allowAnonymous ?? this.allowAnonymous,
      allowedChanges.moderationLevel ?? this.moderationLevel,
      allowedChanges.allowEmotes ?? this.allowEmotes,
      allowedChanges.allowLinks ?? this.allowLinks,
    );
  }

  /**
   * Apply user level restrictions to settings
   */
  private applyLevelRestrictions(
    changes: Partial<StreamSettings>,
    userLevel: number,
  ): Partial<StreamSettings> {
    const restricted = { ...changes };
    
    // Level restrictions
    if (userLevel < 2) {
      delete restricted.allowAnonymous; // Can't enable anonymous
      delete restricted.allowEmotes; // Can't enable emotes
    }
    
    if (userLevel < 5) {
      if (restricted.commentCooldown !== undefined && restricted.commentCooldown < 500) {
        restricted.commentCooldown = 500; // Minimum 500ms cooldown
      }
      if (restricted.moderationLevel === 'none') {
        restricted.moderationLevel = 'low'; // Can't disable moderation
      }
    }
    
    if (userLevel < 10) {
      delete restricted.allowLinks; // Can't enable links
    }
    
    return restricted;
  }

  /**
   * Create default settings based on user level
   */
  static createDefault(userLevel: number): StreamSettings {
    return new StreamSettings(
      true, // allowComments
      userLevel >= 5 ? 500 : 1000, // commentCooldown
      200, // maxCommentLength
      userLevel >= 2, // allowAnonymous
      userLevel >= 5 ? 'low' : 'medium', // moderationLevel
      userLevel >= 2, // allowEmotes
      userLevel >= 10, // allowLinks
    );
  }

  /**
   * Check if settings are equal
   */
  equals(other: StreamSettings): boolean {
    return (
      this.allowComments === other.allowComments &&
      this.commentCooldown === other.commentCooldown &&
      this.maxCommentLength === other.maxCommentLength &&
      this.allowAnonymous === other.allowAnonymous &&
      this.moderationLevel === other.moderationLevel &&
      this.allowEmotes === other.allowEmotes &&
      this.allowLinks === other.allowLinks
    );
  }

  /**
   * Convert to plain object
   */
  toObject(): Record<string, any> {
    return {
      allowComments: this.allowComments,
      commentCooldown: this.commentCooldown,
      maxCommentLength: this.maxCommentLength,
      allowAnonymous: this.allowAnonymous,
      moderationLevel: this.moderationLevel,
      allowEmotes: this.allowEmotes,
      allowLinks: this.allowLinks,
    };
  }
}