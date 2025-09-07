import { ModerationDomainService } from './moderation-domain.service';

describe('ModerationDomainService', () => {
  let service: ModerationDomainService;

  beforeEach(() => {
    service = new ModerationDomainService();
  });

  describe('containsBannedWords', () => {
    it('should detect banned words', () => {
      expect(service.containsBannedWords('This is spam content')).toBe(true);
      expect(service.containsBannedWords('This is a scam')).toBe(true);
      expect(service.containsBannedWords('hack the system')).toBe(true);
    });

    it('should be case insensitive', () => {
      expect(service.containsBannedWords('SPAM')).toBe(true);
      expect(service.containsBannedWords('SpAm')).toBe(true);
    });

    it('should return false for clean text', () => {
      expect(service.containsBannedWords('This is clean text')).toBe(false);
      expect(service.containsBannedWords('Hello world')).toBe(false);
    });

    it('should detect Japanese banned words', () => {
      expect(service.containsBannedWords('バカ')).toBe(true);
      expect(service.containsBannedWords('アホ')).toBe(true);
    });
  });

  describe('isSpam', () => {
    it('should detect URLs', () => {
      expect(service.isSpam('Visit http://example.com')).toBe(true);
      expect(service.isSpam('Check https://spam.site')).toBe(true);
    });

    it('should detect repeated characters', () => {
      expect(service.isSpam('aaaaaaaaaaaaaaaa')).toBe(true);
      expect(service.isSpam('!!!!!!!!!!!!!!!!')).toBe(true);
    });

    it('should detect all caps messages', () => {
      expect(service.isSpam('THIS IS ALL CAPS MESSAGE SPAM')).toBe(true);
    });

    it('should detect number spam', () => {
      expect(service.isSpam('12345678901234567890')).toBe(true);
    });

    it('should detect Discord invites', () => {
      expect(service.isSpam('Join discord.gg/abc123')).toBe(true);
    });

    it('should detect Telegram invites', () => {
      expect(service.isSpam('Join t.me/channel')).toBe(true);
    });

    it('should detect email addresses', () => {
      expect(service.isSpam('Contact spam@example.com')).toBe(true);
    });

    it('should return false for normal messages', () => {
      expect(service.isSpam('This is a normal message')).toBe(false);
      expect(service.isSpam('Hello everyone!')).toBe(false);
    });
  });

  describe('calculateSimilarity', () => {
    it('should return 1 for identical strings', () => {
      expect(service.calculateSimilarity('hello', 'hello')).toBe(1);
    });

    it('should return 0 for completely different strings', () => {
      expect(service.calculateSimilarity('abc', 'xyz')).toBeLessThan(0.1);
    });

    it('should calculate partial similarity', () => {
      const similarity = service.calculateSimilarity('hello', 'hallo');
      expect(similarity).toBeGreaterThan(0.7);
      expect(similarity).toBeLessThan(1);
    });

    it('should handle empty strings', () => {
      expect(service.calculateSimilarity('', '')).toBe(1);
      expect(service.calculateSimilarity('hello', '')).toBe(0);
    });

    it('should be symmetric', () => {
      const sim1 = service.calculateSimilarity('test1', 'test2');
      const sim2 = service.calculateSimilarity('test2', 'test1');
      expect(sim1).toBe(sim2);
    });
  });

  describe('determineSeverity', () => {
    it('should return high severity for many violations', () => {
      const severity = service.determineSeverity(false, false, 0, 10);
      expect(severity).toBe('high');
    });

    it('should return medium severity for banned words', () => {
      const severity = service.determineSeverity(true, false, 0, 0);
      expect(severity).toBe('medium');
    });

    it('should return low severity for spam', () => {
      const severity = service.determineSeverity(false, true, 0, 0);
      expect(severity).toBe('low');
    });

    it('should return low severity for high similarity', () => {
      const severity = service.determineSeverity(false, false, 0.9, 0);
      expect(severity).toBe('low');
    });
  });

  describe('shouldAutoBlock', () => {
    it('should auto-block after 5 violations', () => {
      expect(service.shouldAutoBlock(5)).toBe(true);
      expect(service.shouldAutoBlock(10)).toBe(true);
    });

    it('should not auto-block under 5 violations', () => {
      expect(service.shouldAutoBlock(0)).toBe(false);
      expect(service.shouldAutoBlock(4)).toBe(false);
    });
  });

  describe('calculateBlockDuration', () => {
    it('should return 1 hour for default', () => {
      expect(service.calculateBlockDuration(3)).toBe(3600000);
    });

    it('should return 6 hours for 5-9 violations', () => {
      expect(service.calculateBlockDuration(5)).toBe(3600000 * 6);
      expect(service.calculateBlockDuration(7)).toBe(3600000 * 6);
    });

    it('should return 24 hours for 10+ violations', () => {
      expect(service.calculateBlockDuration(10)).toBe(86400000);
      expect(service.calculateBlockDuration(15)).toBe(86400000);
    });
  });

  describe('areMessagesSimilar', () => {
    it('should detect similar messages', () => {
      expect(service.areMessagesSimilar('hello world', 'hello world')).toBe(true);
      expect(service.areMessagesSimilar('test message', 'test massage')).toBe(true);
    });

    it('should not flag different messages', () => {
      expect(service.areMessagesSimilar('hello', 'goodbye')).toBe(false);
      expect(service.areMessagesSimilar('yes', 'no')).toBe(false);
    });

    it('should use custom threshold', () => {
      expect(service.areMessagesSimilar('test', 'text', 0.5)).toBe(true);
      expect(service.areMessagesSimilar('test', 'text', 0.9)).toBe(false);
    });
  });

  describe('validateModerationAction', () => {
    it('should not allow moderation of higher level users', () => {
      expect(service.validateModerationAction('block', 3, 5)).toBe(false);
      expect(service.validateModerationAction('warn', 2, 2)).toBe(false);
    });

    it('should allow block action for level 3+', () => {
      expect(service.validateModerationAction('block', 3, 1)).toBe(true);
      expect(service.validateModerationAction('block', 2, 1)).toBe(false);
    });

    it('should allow unblock action for level 3+', () => {
      expect(service.validateModerationAction('unblock', 3, 1)).toBe(true);
      expect(service.validateModerationAction('unblock', 2, 1)).toBe(false);
    });

    it('should allow mute action for level 2+', () => {
      expect(service.validateModerationAction('mute', 2, 1)).toBe(true);
      expect(service.validateModerationAction('mute', 1, 0)).toBe(false);
    });

    it('should allow warn action for level 1+', () => {
      expect(service.validateModerationAction('warn', 1, 0)).toBe(true);
      expect(service.validateModerationAction('warn', 3, 1)).toBe(true);
    });
  });

  describe('getModerationReason', () => {
    it('should return appropriate reason for banned words', () => {
      const reason = service.getModerationReason(true, false, false, false);
      expect(reason).toBe('Your message contains inappropriate content');
    });

    it('should return appropriate reason for spam', () => {
      const reason = service.getModerationReason(false, true, false, false);
      expect(reason).toBe('Your message was detected as spam');
    });

    it('should return appropriate reason for flooding', () => {
      const reason = service.getModerationReason(false, false, true, false);
      expect(reason).toBe('You are sending messages too quickly');
    });

    it('should return appropriate reason for similar messages', () => {
      const reason = service.getModerationReason(false, false, false, true);
      expect(reason).toBe('Please avoid sending duplicate messages');
    });

    it('should return default reason', () => {
      const reason = service.getModerationReason(false, false, false, false);
      expect(reason).toBe('Your message violated community guidelines');
    });
  });

  describe('banned words management', () => {
    it('should add and remove banned words', () => {
      const initialCount = service.getBannedWords().length;
      
      service.addBannedWord('testword');
      expect(service.getBannedWords()).toContain('testword');
      expect(service.containsBannedWords('contains testword here')).toBe(true);
      
      service.removeBannedWord('testword');
      expect(service.getBannedWords()).not.toContain('testword');
      expect(service.containsBannedWords('contains testword here')).toBe(false);
      expect(service.getBannedWords().length).toBe(initialCount);
    });

    it('should handle case insensitive add/remove', () => {
      service.addBannedWord('TestWord');
      expect(service.getBannedWords()).toContain('testword');
      
      service.removeBannedWord('TESTWORD');
      expect(service.getBannedWords()).not.toContain('testword');
    });
  });

  describe('getMaxViolationsBeforeBlock', () => {
    it('should return the configured max violations', () => {
      expect(service.getMaxViolationsBeforeBlock()).toBe(5);
    });
  });
});