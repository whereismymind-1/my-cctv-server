/**
 * Stream Key Value Object
 * Immutable object representing a stream's authentication key
 */
export class StreamKey {
  private static readonly KEY_LENGTH = 32;
  private static readonly KEY_PREFIX = 'live_';
  
  constructor(private readonly value: string) {
    this.validate();
  }

  /**
   * Validate stream key format
   */
  private validate(): void {
    if (!this.value || this.value.length === 0) {
      throw new Error('Stream key cannot be empty');
    }
    
    if (!this.value.startsWith(StreamKey.KEY_PREFIX)) {
      throw new Error('Invalid stream key format');
    }
    
    const keyPart = this.value.substring(StreamKey.KEY_PREFIX.length);
    if (keyPart.length !== StreamKey.KEY_LENGTH) {
      throw new Error('Invalid stream key length');
    }
    
    if (!/^[a-zA-Z0-9]+$/.test(keyPart)) {
      throw new Error('Stream key contains invalid characters');
    }
  }

  /**
   * Generate a new stream key
   */
  static generate(): StreamKey {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = StreamKey.KEY_PREFIX;
    
    for (let i = 0; i < StreamKey.KEY_LENGTH; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return new StreamKey(key);
  }

  /**
   * Create from existing value
   */
  static fromString(value: string): StreamKey {
    return new StreamKey(value);
  }

  /**
   * Get the obfuscated version for display
   */
  getObfuscated(): string {
    const visibleChars = 8;
    const keyPart = this.value.substring(StreamKey.KEY_PREFIX.length);
    const visible = keyPart.substring(0, visibleChars);
    const hidden = '*'.repeat(keyPart.length - visibleChars);
    
    return `${StreamKey.KEY_PREFIX}${visible}${hidden}`;
  }

  /**
   * Get the full key value
   */
  toString(): string {
    return this.value;
  }

  /**
   * Check equality
   */
  equals(other: StreamKey): boolean {
    return this.value === other.value;
  }

  /**
   * Get RTMP URL with this key
   */
  getRtmpUrl(serverUrl: string): string {
    return `${serverUrl}/live/${this.value}`;
  }

  /**
   * Validate if a string is a valid stream key
   */
  static isValid(value: string): boolean {
    try {
      new StreamKey(value);
      return true;
    } catch {
      return false;
    }
  }
}