import { StreamSettings } from './stream-settings.vo';

describe('StreamSettings Value Object', () => {
  describe('constructor', () => {
    it('should create valid stream settings', () => {
      const settings = new StreamSettings(
        true, // allowComments
        1000, // commentCooldown
        200, // maxCommentLength
        true, // allowAnonymous
        'medium', // moderationLevel
        true, // allowEmotes
        false, // allowLinks
      );

      expect(settings.allowComments).toBe(true);
      expect(settings.commentCooldown).toBe(1000);
      expect(settings.maxCommentLength).toBe(200);
      expect(settings.allowAnonymous).toBe(true);
      expect(settings.moderationLevel).toBe('medium');
      expect(settings.allowEmotes).toBe(true);
      expect(settings.allowLinks).toBe(false);
    });

    it('should throw error for invalid comment cooldown', () => {
      expect(() => new StreamSettings(
        true, 70001, 200, true, 'medium', true, false
      )).toThrow();
      
      expect(() => new StreamSettings(
        true, -1, 200, true, 'medium', true, false
      )).toThrow('Comment cooldown must be between 0 and 60 seconds');
      
      expect(() => new StreamSettings(
        true, 70000, 200, true, 'medium', true, false
      )).toThrow('Comment cooldown must be between 0 and 60 seconds');
    });

    it('should throw error for invalid max comment length', () => {
      expect(() => new StreamSettings(
        true, 1000, 0, true, 'medium', true, false
      )).toThrow('Max comment length must be between 1 and 500');
      
      expect(() => new StreamSettings(
        true, 1000, 501, true, 'medium', true, false
      )).toThrow('Max comment length must be between 1 and 500');
    });

    it('should throw error for invalid moderation level', () => {
      expect(() => new StreamSettings(
        true, 1000, 200, true, 'invalid' as any, true, false
      )).toThrow('Invalid moderation level');
    });
  });

  describe('update', () => {
    let baseSettings: StreamSettings;

    beforeEach(() => {
      baseSettings = new StreamSettings(
        true, 1000, 200, true, 'medium', true, false
      );
    });

    it('should update settings and return new instance', () => {
      const updated = baseSettings.update({
        commentCooldown: 2000,
        maxCommentLength: 150,
      }, 10);

      expect(updated).not.toBe(baseSettings); // New instance
      expect(updated.commentCooldown).toBe(2000);
      expect(updated.maxCommentLength).toBe(150);
      expect(updated.allowComments).toBe(true); // Unchanged
    });

    it('should apply level restrictions for low level users', () => {
      const updated = baseSettings.update({
        allowAnonymous: true,
        allowEmotes: true,
        commentCooldown: 100,
      }, 1); // Level 1 user

      // Level 1 can't enable anonymous or emotes
      expect(updated.allowAnonymous).toBe(baseSettings.allowAnonymous);
      expect(updated.allowEmotes).toBe(baseSettings.allowEmotes);
      expect(updated.commentCooldown).toBe(500); // Level 1 has minimum 500ms cooldown
    });

    it('should enforce minimum cooldown for mid-level users', () => {
      const updated = baseSettings.update({
        commentCooldown: 100,
        moderationLevel: 'none',
      }, 3); // Level 3 user

      expect(updated.commentCooldown).toBe(500); // Enforced minimum
      expect(updated.moderationLevel).toBe('low'); // Can't disable moderation
    });

    it('should allow all settings for high level users', () => {
      const updated = baseSettings.update({
        allowLinks: true,
        commentCooldown: 100,
        moderationLevel: 'none',
      }, 10); // Level 10 user

      expect(updated.allowLinks).toBe(true);
      expect(updated.commentCooldown).toBe(100);
      expect(updated.moderationLevel).toBe('none');
    });
  });

  describe('createDefault', () => {
    it('should create appropriate defaults for level 1', () => {
      const settings = StreamSettings.createDefault(1);
      
      expect(settings.allowComments).toBe(true);
      expect(settings.commentCooldown).toBe(1000);
      expect(settings.maxCommentLength).toBe(200);
      expect(settings.allowAnonymous).toBe(false);
      expect(settings.moderationLevel).toBe('medium');
      expect(settings.allowEmotes).toBe(false);
      expect(settings.allowLinks).toBe(false);
    });

    it('should create appropriate defaults for level 5', () => {
      const settings = StreamSettings.createDefault(5);
      
      expect(settings.commentCooldown).toBe(500);
      expect(settings.allowAnonymous).toBe(true);
      expect(settings.moderationLevel).toBe('low');
      expect(settings.allowEmotes).toBe(true);
      expect(settings.allowLinks).toBe(false);
    });

    it('should create appropriate defaults for level 10', () => {
      const settings = StreamSettings.createDefault(10);
      
      expect(settings.allowLinks).toBe(true);
    });
  });

  describe('equals', () => {
    it('should return true for equal settings', () => {
      const settings1 = new StreamSettings(
        true, 1000, 200, true, 'medium', true, false
      );
      const settings2 = new StreamSettings(
        true, 1000, 200, true, 'medium', true, false
      );
      
      expect(settings1.equals(settings2)).toBe(true);
    });

    it('should return false for different settings', () => {
      const settings1 = new StreamSettings(
        true, 1000, 200, true, 'medium', true, false
      );
      const settings2 = new StreamSettings(
        true, 2000, 200, true, 'medium', true, false
      );
      
      expect(settings1.equals(settings2)).toBe(false);
    });
  });

  describe('toObject', () => {
    it('should convert to plain object', () => {
      const settings = new StreamSettings(
        true, 1000, 200, true, 'medium', true, false
      );
      
      const obj = settings.toObject();
      
      expect(obj).toEqual({
        allowComments: true,
        commentCooldown: 1000,
        maxCommentLength: 200,
        allowAnonymous: true,
        moderationLevel: 'medium',
        allowEmotes: true,
        allowLinks: false,
      });
    });
  });
});