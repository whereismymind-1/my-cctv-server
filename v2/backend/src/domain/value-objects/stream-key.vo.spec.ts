import { StreamKey } from './stream-key.vo';

describe('StreamKey Value Object', () => {
  describe('constructor', () => {
    it('should create valid stream key', () => {
      const validKey = 'live_' + 'a'.repeat(32);
      const streamKey = new StreamKey(validKey);
      
      expect(streamKey.toString()).toBe(validKey);
    });

    it('should throw error for empty key', () => {
      expect(() => new StreamKey('')).toThrow('Stream key cannot be empty');
    });

    it('should throw error for invalid prefix', () => {
      expect(() => new StreamKey('invalid_' + 'a'.repeat(32)))
        .toThrow('Invalid stream key format');
    });

    it('should throw error for invalid length', () => {
      expect(() => new StreamKey('live_' + 'a'.repeat(31)))
        .toThrow('Invalid stream key length');
      
      expect(() => new StreamKey('live_' + 'a'.repeat(33)))
        .toThrow('Invalid stream key length');
    });

    it('should throw error for invalid characters', () => {
      expect(() => new StreamKey('live_' + 'a'.repeat(31) + '!'))
        .toThrow('Stream key contains invalid characters');
      
      expect(() => new StreamKey('live_' + 'a'.repeat(31) + ' '))
        .toThrow('Stream key contains invalid characters');
    });
  });

  describe('generate', () => {
    it('should generate valid stream key', () => {
      const key = StreamKey.generate();
      
      expect(key).toBeInstanceOf(StreamKey);
      expect(key.toString()).toMatch(/^live_[a-zA-Z0-9]{32}$/);
    });

    it('should generate unique keys', () => {
      const key1 = StreamKey.generate();
      const key2 = StreamKey.generate();
      
      expect(key1.toString()).not.toBe(key2.toString());
    });
  });

  describe('fromString', () => {
    it('should create stream key from valid string', () => {
      const validKey = 'live_' + 'A'.repeat(32);
      const streamKey = StreamKey.fromString(validKey);
      
      expect(streamKey.toString()).toBe(validKey);
    });

    it('should throw error for invalid string', () => {
      expect(() => StreamKey.fromString('invalid'))
        .toThrow('Invalid stream key format');
    });
  });

  describe('getObfuscated', () => {
    it('should obfuscate stream key correctly', () => {
      const key = 'live_ABCDEFGH' + 'X'.repeat(24);
      const streamKey = new StreamKey(key);
      const obfuscated = streamKey.getObfuscated();
      
      expect(obfuscated).toBe('live_ABCDEFGH' + '*'.repeat(24));
    });

    it('should show only first 8 characters', () => {
      const streamKey = StreamKey.generate();
      const obfuscated = streamKey.getObfuscated();
      const visible = obfuscated.substring(5, 13); // Skip 'live_' prefix
      
      expect(visible).not.toContain('*');
      expect(obfuscated.substring(13)).toBe('*'.repeat(24));
    });
  });

  describe('equals', () => {
    it('should return true for equal keys', () => {
      const keyString = 'live_' + 'A'.repeat(32);
      const key1 = new StreamKey(keyString);
      const key2 = new StreamKey(keyString);
      
      expect(key1.equals(key2)).toBe(true);
    });

    it('should return false for different keys', () => {
      const key1 = StreamKey.generate();
      const key2 = StreamKey.generate();
      
      expect(key1.equals(key2)).toBe(false);
    });
  });

  describe('getRtmpUrl', () => {
    it('should generate correct RTMP URL', () => {
      const streamKey = StreamKey.generate();
      const serverUrl = 'rtmp://stream.example.com';
      const rtmpUrl = streamKey.getRtmpUrl(serverUrl);
      
      expect(rtmpUrl).toBe(`${serverUrl}/live/${streamKey.toString()}`);
    });
  });

  describe('isValid', () => {
    it('should return true for valid keys', () => {
      const validKey = 'live_' + 'a'.repeat(32);
      expect(StreamKey.isValid(validKey)).toBe(true);
    });

    it('should return false for invalid keys', () => {
      expect(StreamKey.isValid('')).toBe(false);
      expect(StreamKey.isValid('invalid')).toBe(false);
      expect(StreamKey.isValid('live_short')).toBe(false);
      expect(StreamKey.isValid('live_' + '!'.repeat(32))).toBe(false);
    });
  });
});