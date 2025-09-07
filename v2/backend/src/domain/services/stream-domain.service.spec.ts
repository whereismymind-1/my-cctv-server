import { StreamDomainService } from './stream-domain.service';

describe('StreamDomainService', () => {
  let service: StreamDomainService;

  beforeEach(() => {
    service = new StreamDomainService();
  });

  describe('validateTitle', () => {
    it('should accept valid titles', () => {
      expect(() => service.validateTitle('Valid Title')).not.toThrow();
      expect(() => service.validateTitle('A')).not.toThrow();
      expect(() => service.validateTitle('X'.repeat(100))).not.toThrow();
    });

    it('should reject empty titles', () => {
      expect(() => service.validateTitle('')).toThrow('Stream title cannot be empty');
      expect(() => service.validateTitle('   ')).toThrow('Stream title cannot be empty');
    });

    it('should reject titles that are too long', () => {
      expect(() => service.validateTitle('X'.repeat(101))).toThrow(
        'Stream title cannot exceed 100 characters'
      );
    });
  });

  describe('validateDescription', () => {
    it('should accept valid descriptions', () => {
      expect(() => service.validateDescription('Valid description')).not.toThrow();
      expect(() => service.validateDescription(null)).not.toThrow();
      expect(() => service.validateDescription('X'.repeat(500))).not.toThrow();
    });

    it('should reject descriptions that are too long', () => {
      expect(() => service.validateDescription('X'.repeat(501))).toThrow(
        'Stream description cannot exceed 500 characters'
      );
    });
  });

  describe('canCreateStream', () => {
    it('should allow stream creation for eligible users', () => {
      expect(service.canCreateStream(1, 0, null)).toBe(true);
      expect(service.canCreateStream(5, 0, null)).toBe(true);
    });

    it('should prevent concurrent streams', () => {
      expect(service.canCreateStream(1, 1, null)).toBe(false);
    });

    it('should enforce minimum interval between streams', () => {
      const recentEnd = new Date(Date.now() - 2 * 60 * 1000); // 2 minutes ago
      expect(service.canCreateStream(1, 0, recentEnd)).toBe(false);
      
      const oldEnd = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
      expect(service.canCreateStream(1, 0, oldEnd)).toBe(true);
    });

    it('should prevent level 0 users from streaming', () => {
      expect(service.canCreateStream(0, 0, null)).toBe(false);
    });
  });

  describe('getStreamQualitySettings', () => {
    it('should return appropriate settings for level 10+', () => {
      const settings = service.getStreamQualitySettings(10);
      expect(settings.maxBitrate).toBe(8000);
      expect(settings.maxResolution).toBe('1920x1080');
      expect(settings.maxFps).toBe(60);
      expect(settings.allowTranscoding).toBe(true);
    });

    it('should return appropriate settings for level 5-9', () => {
      const settings = service.getStreamQualitySettings(5);
      expect(settings.maxBitrate).toBe(4500);
      expect(settings.maxResolution).toBe('1280x720');
      expect(settings.maxFps).toBe(60);
      expect(settings.allowTranscoding).toBe(true);
    });

    it('should return appropriate settings for level 2-4', () => {
      const settings = service.getStreamQualitySettings(2);
      expect(settings.maxBitrate).toBe(2500);
      expect(settings.maxResolution).toBe('1280x720');
      expect(settings.maxFps).toBe(30);
      expect(settings.allowTranscoding).toBe(false);
    });

    it('should return basic settings for level 1', () => {
      const settings = service.getStreamQualitySettings(1);
      expect(settings.maxBitrate).toBe(1500);
      expect(settings.maxResolution).toBe('854x480');
      expect(settings.maxFps).toBe(30);
      expect(settings.allowTranscoding).toBe(false);
    });
  });

  describe('getViewerLimit', () => {
    it('should return correct viewer limits', () => {
      expect(service.getViewerLimit(10)).toBe(10000);
      expect(service.getViewerLimit(5)).toBe(5000);
      expect(service.getViewerLimit(2)).toBe(1000);
      expect(service.getViewerLimit(1)).toBe(100);
    });
  });

  describe('generateStreamKey', () => {
    it('should generate unique stream keys', () => {
      const key1 = service.generateStreamKey();
      const key2 = service.generateStreamKey();
      
      expect(key1).toMatch(/^live_[a-zA-Z0-9]{32}$/);
      expect(key2).toMatch(/^live_[a-zA-Z0-9]{32}$/);
      expect(key1).not.toBe(key2);
    });
  });

  describe('calculateStreamHealth', () => {
    it('should return excellent for perfect conditions', () => {
      const health = service.calculateStreamHealth(0, 1000, 5000, 5000, 30);
      expect(health).toBe('excellent');
    });

    it('should return good for acceptable conditions', () => {
      const health = service.calculateStreamHealth(20, 1000, 4500, 5000, 80);
      expect(health).toBe('good');
    });

    it('should return fair for moderate issues', () => {
      const health = service.calculateStreamHealth(45, 1000, 3600, 5000, 180);
      expect(health).toBe('fair');
    });

    it('should return poor for bad conditions', () => {
      const health = service.calculateStreamHealth(100, 1000, 2000, 5000, 300);
      expect(health).toBe('poor');
    });

    it('should handle zero total frames', () => {
      const health = service.calculateStreamHealth(0, 0, 5000, 5000, 30);
      expect(health).toBe('excellent');
    });
  });

  describe('shouldAutoEndStream', () => {
    it('should end stream after max duration', () => {
      const startedAt = new Date(Date.now() - 13 * 60 * 60 * 1000); // 13 hours ago
      const lastActivity = new Date();
      
      expect(service.shouldAutoEndStream(startedAt, lastActivity, 100)).toBe(true);
    });

    it('should end stream with no viewers after 10 minutes', () => {
      const startedAt = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
      const lastActivity = new Date(Date.now() - 11 * 60 * 1000); // 11 minutes ago
      
      expect(service.shouldAutoEndStream(startedAt, lastActivity, 0)).toBe(true);
    });

    it('should end stream with no activity after 30 minutes', () => {
      const startedAt = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
      const lastActivity = new Date(Date.now() - 31 * 60 * 1000); // 31 minutes ago
      
      expect(service.shouldAutoEndStream(startedAt, lastActivity, 10)).toBe(true);
    });

    it('should not end active stream', () => {
      const startedAt = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
      const lastActivity = new Date();
      
      expect(service.shouldAutoEndStream(startedAt, lastActivity, 10)).toBe(false);
    });
  });

  describe('calculateStreamStats', () => {
    it('should calculate stats correctly', () => {
      const startedAt = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
      const endedAt = new Date();
      const events = [
        { type: 'join' as const, timestamp: new Date(Date.now() - 50 * 60 * 1000) },
        { type: 'join' as const, timestamp: new Date(Date.now() - 40 * 60 * 1000) },
        { type: 'leave' as const, timestamp: new Date(Date.now() - 20 * 60 * 1000) },
      ];
      
      const stats = service.calculateStreamStats(startedAt, endedAt, events, 50);
      
      expect(stats.duration).toBeCloseTo(60 * 60 * 1000, -3);
      expect(stats.peakViewers).toBe(2);
      expect(stats.totalUniqueViewers).toBe(0); // Since we didn't track unique IDs
      expect(stats.engagementRate).toBeGreaterThanOrEqual(0);
      expect(stats.engagementRate).toBeLessThanOrEqual(100);
    });

    it('should handle ongoing streams', () => {
      const startedAt = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
      const events: any[] = [];
      
      const stats = service.calculateStreamStats(startedAt, null, events, 10);
      
      expect(stats.duration).toBeCloseTo(30 * 60 * 1000, -3);
    });
  });

  describe('getDefaultStreamSettings', () => {
    it('should return appropriate settings for high level users', () => {
      const settings = service.getDefaultStreamSettings(10);
      expect(settings.commentCooldown).toBe(500);
      expect(settings.moderationLevel).toBe('low');
      expect(settings.allowAnonymous).toBe(true);
      expect(settings.allowEmotes).toBe(true);
      expect(settings.allowLinks).toBe(true);
    });

    it('should return restricted settings for low level users', () => {
      const settings = service.getDefaultStreamSettings(1);
      expect(settings.commentCooldown).toBe(1000);
      expect(settings.moderationLevel).toBe('medium');
      expect(settings.allowAnonymous).toBe(false);
      expect(settings.allowEmotes).toBe(false);
      expect(settings.allowLinks).toBe(false);
    });
  });

  describe('validateStreamSettings', () => {
    it('should accept valid settings', () => {
      expect(() => service.validateStreamSettings({
        commentCooldown: 5000,
        maxCommentLength: 200,
        moderationLevel: 'high',
      })).not.toThrow();
    });

    it('should reject invalid comment cooldown', () => {
      expect(() => service.validateStreamSettings({
        commentCooldown: -1,
      })).toThrow('Comment cooldown must be between 0 and 60 seconds');
      
      expect(() => service.validateStreamSettings({
        commentCooldown: 70000,
      })).toThrow('Comment cooldown must be between 0 and 60 seconds');
    });

    it('should reject invalid max comment length', () => {
      expect(() => service.validateStreamSettings({
        maxCommentLength: 0,
      })).toThrow('Max comment length must be between 1 and 500');
      
      expect(() => service.validateStreamSettings({
        maxCommentLength: 501,
      })).toThrow('Max comment length must be between 1 and 500');
    });

    it('should reject invalid moderation level', () => {
      expect(() => service.validateStreamSettings({
        moderationLevel: 'invalid',
      })).toThrow('Invalid moderation level');
    });
  });

  describe('isInappropriateTitle', () => {
    it('should detect inappropriate titles', () => {
      expect(service.isInappropriateTitle('Free money scam')).toBe(true);
      expect(service.isInappropriateTitle('hack the system')).toBe(true);
      expect(service.isInappropriateTitle('get rich quick')).toBe(true);
      expect(service.isInappropriateTitle('18+ adult content')).toBe(true);
      expect(service.isInappropriateTitle('NSFW adult stream')).toBe(true);
    });

    it('should allow appropriate titles', () => {
      expect(service.isInappropriateTitle('Gaming Stream')).toBe(false);
      expect(service.isInappropriateTitle('Music and Chat')).toBe(false);
      expect(service.isInappropriateTitle('Coding Tutorial')).toBe(false);
    });
  });

  describe('calculateRevenueShare', () => {
    it('should calculate revenue share based on user level', () => {
      const share = service.calculateRevenueShare(5, 1000, 100, 50);
      
      expect(share.totalRevenue).toBeGreaterThan(0);
      expect(share.creatorShare).toBeGreaterThan(0);
      expect(share.platformShare).toBeGreaterThan(0);
      expect(share.creatorShare + share.platformShare).toBeCloseTo(share.totalRevenue, 1);
    });

    it('should give better share to higher level users', () => {
      const share1 = service.calculateRevenueShare(1, 1000, 100, 50);
      const share10 = service.calculateRevenueShare(10, 1000, 100, 50);
      
      expect(share10.creatorShare / share10.totalRevenue).toBeGreaterThan(
        share1.creatorShare / share1.totalRevenue
      );
    });

    it('should cap creator share at 70%', () => {
      const share = service.calculateRevenueShare(20, 1000, 100, 50);
      const creatorPercentage = (share.creatorShare / share.totalRevenue) * 100;
      
      expect(creatorPercentage).toBeLessThanOrEqual(70);
    });
  });

  describe('categorizeStream', () => {
    it('should categorize gaming streams', () => {
      expect(service.categorizeStream('Playing Minecraft', ['game'])).toBe('gaming');
      expect(service.categorizeStream('FPS Stream', [])).toBe('gaming');
    });

    it('should categorize music streams', () => {
      expect(service.categorizeStream('DJ Set', ['music'])).toBe('music');
      expect(service.categorizeStream('Live Concert', [])).toBe('music');
    });

    it('should categorize art streams', () => {
      expect(service.categorizeStream('Drawing Session', ['art'])).toBe('art');
      expect(service.categorizeStream('Digital Painting', [])).toBe('art');
    });

    it('should categorize tech streams', () => {
      expect(service.categorizeStream('Programming Workshop', ['tech'])).toBe('tech');
      expect(service.categorizeStream('Software Development', [])).toBe('tech');
    });

    it('should return general for uncategorized streams', () => {
      expect(service.categorizeStream('Random Live', [])).toBe('general');
      expect(service.categorizeStream('Test Live', [])).toBe('general');
    });
  });
});