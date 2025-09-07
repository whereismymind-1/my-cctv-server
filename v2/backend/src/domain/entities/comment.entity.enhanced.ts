import { CommentStyle } from '../value-objects/comment-style.vo';

/**
 * Enhanced Comment Domain Entity with Rich Business Logic
 * This follows DDD principles by encapsulating business rules within the entity
 */
export class CommentEntity {
  private static readonly MAX_TEXT_LENGTH = 200;
  private static readonly MIN_TEXT_LENGTH = 1;
  private static readonly DEFAULT_DURATION = 4000; // 4 seconds
  private static readonly DEFAULT_SPEED = 200; // pixels per second
  private static readonly SCREEN_WIDTH = 1280;
  private static readonly LANE_HEIGHT = 40;
  private static readonly TOTAL_LANES = 12;

  constructor(
    public readonly id: string,
    public readonly streamId: string,
    public readonly userId: string | null,
    public readonly username: string,
    public readonly text: string,
    public readonly command: string | null,
    public readonly style: CommentStyle,
    public readonly lane: number,
    public readonly x: number,
    public readonly y: number,
    public readonly speed: number,
    public readonly duration: number,
    public readonly vpos: number,
    public readonly createdAt: Date,
    private readonly userLevel: number = 1,
  ) {
    this.validateInvariants();
  }

  /**
   * Domain Invariants - Business rules that must always be true
   */
  private validateInvariants(): void {
    // Text validation
    if (!this.text || this.text.trim().length === 0) {
      throw new Error('Comment text cannot be empty');
    }
    
    if (this.text.length > CommentEntity.MAX_TEXT_LENGTH) {
      throw new Error(`Comment text cannot exceed ${CommentEntity.MAX_TEXT_LENGTH} characters`);
    }
    
    if (this.text.length < CommentEntity.MIN_TEXT_LENGTH) {
      throw new Error(`Comment text must be at least ${CommentEntity.MIN_TEXT_LENGTH} character`);
    }
    
    // Lane validation
    if (this.lane < 0 || this.lane >= CommentEntity.TOTAL_LANES) {
      throw new Error(`Invalid lane number. Must be between 0 and ${CommentEntity.TOTAL_LANES - 1}`);
    }
    
    // Physics validation
    if (this.speed <= 0) {
      throw new Error('Comment speed must be positive');
    }
    
    if (this.duration <= 0) {
      throw new Error('Comment duration must be positive');
    }

    // Style validation based on user level
    this.validateStylePermissions();
  }

  /**
   * Business Rule: Style permissions based on user level
   */
  private validateStylePermissions(): void {
    // Anonymous users can only use basic styles
    if (this.isAnonymous()) {
      if (this.style.size !== 'medium' || 
          this.style.color !== 'white' || 
          this.style.position !== 'scroll') {
        throw new Error('Anonymous users can only use basic comment styles');
      }
      return;
    }

    // Level-based style restrictions
    if (this.style.size === 'big' && this.userLevel < 3) {
      throw new Error('Big size comments require level 3 or higher');
    }

    if (this.style.position !== 'scroll' && this.userLevel < 4) {
      throw new Error('Fixed position comments require level 4 or higher');
    }

    const premiumColors = ['red', 'blue', 'green', 'purple', 'pink', 'orange'];
    if (premiumColors.includes(this.style.color) && this.userLevel < 2) {
      throw new Error('Premium colors require level 2 or higher');
    }
  }

  /**
   * Factory Method: Create a new comment with proper defaults
   */
  static create(
    streamId: string,
    userId: string | null,
    username: string,
    text: string,
    command: string | null,
    vpos: number,
    userLevel: number = 1,
  ): CommentEntity {
    const style = this.parseCommand(command, userLevel);
    const duration = this.calculateDuration(text, style);
    const speed = this.calculateSpeed(style, duration);
    
    return new CommentEntity(
      this.generateId(),
      streamId,
      userId,
      username,
      text,
      command,
      style,
      0, // Lane will be assigned by domain service
      CommentEntity.SCREEN_WIDTH,
      0, // Y will be calculated based on lane
      speed,
      duration,
      vpos,
      new Date(),
      userLevel,
    );
  }

  /**
   * Business Logic: Parse command with user level validation
   */
  private static parseCommand(command: string | null, userLevel: number): CommentStyle {
    const defaultStyle = CommentStyle.createDefault();
    
    if (!command) return defaultStyle;

    let requestedStyle = CommentStyle.fromCommand(command);
    
    // Validate permissions for requested style - create new instance with adjusted values
    let adjustedSize = requestedStyle.size;
    let adjustedPosition = requestedStyle.position;
    let adjustedColor = requestedStyle.color;
    
    if (requestedStyle.size === 'big' && userLevel < 3) {
      adjustedSize = 'medium';
    }
    
    if (requestedStyle.position !== 'scroll' && userLevel < 4) {
      adjustedPosition = 'scroll';
    }
    
    const premiumColors = ['red', 'blue', 'green', 'purple', 'pink', 'orange'];
    if (premiumColors.includes(requestedStyle.color) && userLevel < 2) {
      adjustedColor = 'white';
    }
    
    return new CommentStyle(adjustedPosition, adjustedColor, adjustedSize);
  }

  /**
   * Business Logic: Calculate optimal duration based on content
   */
  private static calculateDuration(text: string, style: CommentStyle): number {
    if (style.position !== 'scroll') {
      // Fixed comments stay longer
      return 5000;
    }
    
    // Base duration + time based on text length
    const baseTime = 3000;
    const timePerChar = 30;
    const calculated = baseTime + (text.length * timePerChar);
    
    // Limit between 3-8 seconds
    return Math.max(3000, Math.min(calculated, 8000));
  }

  /**
   * Business Logic: Calculate speed based on style
   */
  private static calculateSpeed(style: CommentStyle, duration: number): number {
    if (style.position !== 'scroll') {
      return 0; // Fixed comments don't move
    }
    
    // Calculate speed to cross screen in duration
    return (CommentEntity.SCREEN_WIDTH + 200) / (duration / 1000);
  }

  /**
   * Generate unique ID
   */
  private static generateId(): string {
    return `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Domain Logic: Check if comment is anonymous
   */
  isAnonymous(): boolean {
    return this.userId === null;
  }

  /**
   * Domain Logic: Check if comment is a command
   */
  isCommand(): boolean {
    return this.command !== null && this.command.length > 0;
  }

  /**
   * Domain Logic: Calculate current position
   */
  calculatePosition(currentTime: number): { x: number; y: number; visible: boolean } {
    const elapsedTime = currentTime - this.createdAt.getTime();
    
    if (elapsedTime < 0 || elapsedTime > this.duration) {
      return { x: -1, y: -1, visible: false };
    }
    
    let x = this.x;
    if (this.style.position === 'scroll') {
      x = this.x - (this.speed * (elapsedTime / 1000));
    }
    
    return { x, y: this.y, visible: true };
  }

  /**
   * Domain Logic: Check collision with another comment
   */
  collidesWith(other: CommentEntity, currentTime: number): boolean {
    // Different lanes never collide
    if (this.lane !== other.lane) {
      return false;
    }
    
    const thisPos = this.calculatePosition(currentTime);
    const otherPos = other.calculatePosition(currentTime);
    
    if (!thisPos.visible || !otherPos.visible) {
      return false;
    }
    
    // Estimate width based on text length
    const thisWidth = this.estimateWidth();
    const otherWidth = other.estimateWidth();
    
    // Check horizontal overlap
    return (
      thisPos.x < otherPos.x + otherWidth &&
      thisPos.x + thisWidth > otherPos.x
    );
  }

  /**
   * Domain Logic: Estimate comment width
   */
  private estimateWidth(): number {
    const charWidth = this.style.size === 'big' ? 15 : 
                      this.style.size === 'small' ? 8 : 10;
    return this.text.length * charWidth;
  }

  /**
   * Domain Logic: Get render priority
   */
  getRenderPriority(): number {
    let priority = 0;
    
    // User level adds priority
    priority += this.userLevel * 10;
    
    // Style modifiers
    if (this.style.size === 'big') priority += 5;
    if (this.style.position !== 'scroll') priority += 8;
    if (this.style.color !== 'white') priority += 2;
    
    // Commands have highest priority
    if (this.isCommand()) priority += 20;
    
    // Anonymous users have lowest priority
    if (this.isAnonymous()) priority -= 10;
    
    return priority;
  }

  /**
   * Domain Logic: Check if comment passes filter
   */
  passesFilter(filterLevel: 'none' | 'low' | 'medium' | 'high'): boolean {
    switch (filterLevel) {
      case 'none':
        return true;
        
      case 'low':
        // Filter obvious spam
        return !this.isSpam();
        
      case 'medium':
        // Filter spam and anonymous users
        return !this.isSpam() && !this.isAnonymous();
        
      case 'high':
        // Only show verified users with good standing
        return !this.isSpam() && !this.isAnonymous() && this.userLevel >= 2;
        
      default:
        return true;
    }
  }

  /**
   * Domain Logic: Detect spam patterns
   */
  private isSpam(): boolean {
    // Repeated characters
    if (/(.)\1{5,}/.test(this.text)) return true;
    
    // All caps
    if (this.text.length > 10 && this.text === this.text.toUpperCase()) return true;
    
    // Excessive punctuation
    if (/[!?]{3,}/.test(this.text)) return true;
    
    return false;
  }

  /**
   * Domain Logic: Check if comment can be moderated by user
   */
  canBeModeratedBy(moderatorLevel: number): boolean {
    // Can't moderate own comments
    if (this.userLevel === moderatorLevel) return false;
    
    // Need higher level to moderate
    return moderatorLevel > this.userLevel;
  }

  /**
   * Domain Logic: Convert to display format
   */
  toDisplayFormat(): {
    id: string;
    text: string;
    style: CommentStyle;
    lane: number;
    priority: number;
  } {
    return {
      id: this.id,
      text: this.text,
      style: this.style,
      lane: this.lane,
      priority: this.getRenderPriority(),
    };
  }

  /**
   * With methods for immutable updates
   */
  withLane(lane: number): CommentEntity {
    const y = lane * CommentEntity.LANE_HEIGHT;
    return new CommentEntity(
      this.id,
      this.streamId,
      this.userId,
      this.username,
      this.text,
      this.command,
      this.style,
      lane,
      this.x,
      y,
      this.speed,
      this.duration,
      this.vpos,
      this.createdAt,
      this.userLevel,
    );
  }

  withStyle(style: CommentStyle): CommentEntity {
    return new CommentEntity(
      this.id,
      this.streamId,
      this.userId,
      this.username,
      this.text,
      this.command,
      this.style,
      this.lane,
      this.x,
      this.y,
      this.speed,
      this.duration,
      this.vpos,
      this.createdAt,
      this.userLevel,
    );
  }
}