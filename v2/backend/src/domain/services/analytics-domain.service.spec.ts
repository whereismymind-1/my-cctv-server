import { AnalyticsDomainService } from './analytics-domain.service';

describe('AnalyticsDomainService', () => {
  let service: AnalyticsDomainService;

  beforeEach(() => {
    service = new AnalyticsDomainService();
  });

  describe('calculateEngagementScore', () => {
    it('should return 0 for no activity', () => {
      const score = service.calculateEngagementScore(0, 3600000, 0, 0);
      expect(score).toBe(0);
    });

    it('should calculate engagement score correctly', () => {
      const score = service.calculateEngagementScore(
        1800000, // 30 minutes view
        3600000, // 1 hour stream
        10, // 10 comments
        5, // 5 reactions
      );
      
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should cap score at 100', () => {
      const score = service.calculateEngagementScore(
        3600000, // Full stream watched
        3600000, // 1 hour stream
        1000, // Many comments
        500, // Many reactions
      );
      
      expect(score).toBe(100);
    });

    it('should handle zero stream duration', () => {
      const score = service.calculateEngagementScore(0, 0, 10, 5);
      expect(score).toBe(0);
    });
  });

  describe('getEngagementLevel', () => {
    it('should return correct engagement levels', () => {
      expect(service.getEngagementLevel(90)).toBe('very_high');
      expect(service.getEngagementLevel(70)).toBe('high');
      expect(service.getEngagementLevel(40)).toBe('medium');
      expect(service.getEngagementLevel(20)).toBe('low');
    });
  });

  describe('calculateRetentionCurve', () => {
    it('should return empty array for no sessions', () => {
      const curve = service.calculateRetentionCurve([], Date.now(), Date.now() + 3600000);
      expect(curve).toEqual([]);
    });

    it('should calculate retention points', () => {
      const startTime = Date.now();
      const sessions = [
        { joinTime: startTime, leaveTime: startTime + 1800000 }, // 30 min
        { joinTime: startTime + 600000, leaveTime: startTime + 2400000 }, // Join at 10min, leave at 40min
      ];
      
      const curve = service.calculateRetentionCurve(
        sessions,
        startTime,
        startTime + 3600000, // 1 hour
      );
      
      expect(curve.length).toBeGreaterThan(0);
      expect(curve[0].percentage).toBeLessThanOrEqual(100);
    });
  });

  describe('identifyPeakMoments', () => {
    it('should identify peak moments from events', () => {
      const events = [
        { timestamp: 1000, type: 'comment', value: 1 },
        { timestamp: 1500, type: 'comment', value: 1 },
        { timestamp: 2000, type: 'reaction', value: 1 },
        { timestamp: 65000, type: 'donation', value: 100 },
      ];
      
      const peaks = service.identifyPeakMoments(events);
      
      expect(peaks.length).toBeGreaterThan(0);
      expect(peaks[0]).toHaveProperty('timestamp');
      expect(peaks[0]).toHaveProperty('intensity');
      expect(peaks[0]).toHaveProperty('type');
    });

    it('should return empty array for no events', () => {
      const peaks = service.identifyPeakMoments([]);
      expect(peaks).toEqual([]);
    });

    it('should limit to top 10 moments', () => {
      const events = [];
      for (let i = 0; i < 100; i++) {
        events.push({
          timestamp: i * 60000,
          type: 'comment',
          value: Math.random() * 10,
        });
      }
      
      const peaks = service.identifyPeakMoments(events);
      expect(peaks.length).toBeLessThanOrEqual(10);
    });
  });

  describe('calculatePerformanceScore', () => {
    it('should calculate performance score correctly', () => {
      const score = service.calculatePerformanceScore(
        100, // viewerCount
        100, // expectedViewers
        0.5, // 50% engagement
        3600000, // 1 hour duration
        3600000, // 1 hour target
      );
      
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should handle zero expected values', () => {
      const score = service.calculatePerformanceScore(100, 0, 0.5, 3600000, 0);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('predictViewerCount', () => {
    it('should predict viewer count based on parameters', () => {
      const historicalAverages = new Map([
        ['5_20_gaming', 150],
      ]);
      
      const prediction = service.predictViewerCount(
        5, // Friday
        20, // 8pm
        'gaming',
        5, // Level 5 streamer
        historicalAverages,
      );
      
      expect(prediction).toBeGreaterThan(0);
    });

    it('should apply peak hour multiplier', () => {
      const historicalAverages = new Map();
      
      const normalPrediction = service.predictViewerCount(
        1, // Monday
        14, // 2pm
        'general',
        1,
        historicalAverages,
      );
      
      const peakPrediction = service.predictViewerCount(
        1, // Monday
        20, // 8pm (peak)
        'general',
        1,
        historicalAverages,
      );
      
      expect(peakPrediction).toBeGreaterThan(normalPrediction);
    });

    it('should apply weekend multiplier', () => {
      const historicalAverages = new Map();
      
      const weekdayPrediction = service.predictViewerCount(
        1, // Monday
        14, // 2pm
        'general',
        1,
        historicalAverages,
      );
      
      const weekendPrediction = service.predictViewerCount(
        0, // Sunday
        14, // 2pm
        'general',
        1,
        historicalAverages,
      );
      
      expect(weekendPrediction).toBeGreaterThan(weekdayPrediction);
    });
  });

  describe('calculateChurnRisk', () => {
    it('should return high risk for inactive users', () => {
      const lastView = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000); // 40 days ago
      const risk = service.calculateChurnRisk(
        lastView,
        0, // No watch time
        0, // No avg session
        0, // No favorites
        100, // Old user
      );
      
      expect(risk).toBe('high');
    });

    it('should return low risk for active users', () => {
      const lastView = new Date(); // Today
      const risk = service.calculateChurnRisk(
        lastView,
        20 * 60 * 60 * 1000, // 20 hours watch time
        30 * 60 * 1000, // 30 min avg session
        5, // 5 favorites
        100, // Old user
      );
      
      expect(risk).toBe('low');
    });

    it('should give grace period to new users', () => {
      const lastView = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
      const risk = service.calculateChurnRisk(
        lastView,
        0,
        0,
        0,
        3, // 3 days since registration
      );
      
      expect(risk).not.toBe('high');
    });
  });

  describe('calculateRecommendationScore', () => {
    it('should calculate recommendation score', () => {
      const preferences = [
        { category: 'gaming', weight: 0.8 },
        { category: 'tech', weight: 0.5 },
      ];
      
      const score = service.calculateRecommendationScore(
        preferences,
        'gaming',
        ['fps', 'multiplayer'],
        ['gaming', 'music'],
        0.7,
      );
      
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should encourage novelty', () => {
      const preferences = [{ category: 'gaming', weight: 0.5 }];
      
      const knownScore = service.calculateRecommendationScore(
        preferences,
        'gaming',
        [],
        ['gaming'], // Already watched
        0.5,
      );
      
      const novelScore = service.calculateRecommendationScore(
        preferences,
        'gaming',
        [],
        [], // Never watched
        0.5,
      );
      
      expect(novelScore).toBeGreaterThan(knownScore);
    });
  });

  describe('groupByTimePeriod', () => {
    it('should group data by hour', () => {
      const data = [
        { timestamp: new Date('2024-01-01T10:30:00') },
        { timestamp: new Date('2024-01-01T10:45:00') },
        { timestamp: new Date('2024-01-01T11:15:00') },
      ];
      
      const grouped = service.groupByTimePeriod(data, 'hour');
      
      expect(grouped.size).toBe(2);
    });

    it('should group data by day', () => {
      const data = [
        { timestamp: new Date('2024-01-01T10:00:00') },
        { timestamp: new Date('2024-01-01T20:00:00') },
        { timestamp: new Date('2024-01-02T10:00:00') },
      ];
      
      const grouped = service.groupByTimePeriod(data, 'day');
      
      expect(grouped.size).toBe(2);
    });

    it('should group data by week', () => {
      const data = [
        { timestamp: new Date('2024-01-01') },
        { timestamp: new Date('2024-01-05') },
        { timestamp: new Date('2024-01-08') },
      ];
      
      const grouped = service.groupByTimePeriod(data, 'week');
      
      expect(grouped.size).toBe(2);
    });

    it('should group data by month', () => {
      const data = [
        { timestamp: new Date('2024-01-15') },
        { timestamp: new Date('2024-01-20') },
        { timestamp: new Date('2024-02-10') },
      ];
      
      const grouped = service.groupByTimePeriod(data, 'month');
      
      expect(grouped.size).toBe(2);
    });
  });

  describe('calculateGrowthRate', () => {
    it('should calculate positive growth', () => {
      const growth = service.calculateGrowthRate(150, 100);
      
      expect(growth.rate).toBe(50);
      expect(growth.trend).toBe('up');
    });

    it('should calculate negative growth', () => {
      const growth = service.calculateGrowthRate(50, 100);
      
      expect(growth.rate).toBe(-50);
      expect(growth.trend).toBe('down');
    });

    it('should identify stable trend', () => {
      const growth = service.calculateGrowthRate(102, 100);
      
      expect(growth.rate).toBe(2);
      expect(growth.trend).toBe('stable');
    });

    it('should handle zero previous value', () => {
      const growth = service.calculateGrowthRate(100, 0);
      
      expect(growth.rate).toBe(100);
      expect(growth.trend).toBe('up');
    });
  });

  describe('calculatePercentileRank', () => {
    it('should calculate percentile rank correctly', () => {
      const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      
      expect(service.calculatePercentileRank(25, values)).toBe(20);
      expect(service.calculatePercentileRank(50, values)).toBe(40); // Fixed: 50 is at 40th percentile
      expect(service.calculatePercentileRank(75, values)).toBe(70);
    });

    it('should return 0 for lowest value', () => {
      const values = [10, 20, 30];
      expect(service.calculatePercentileRank(5, values)).toBe(0);
    });

    it('should return 100 for highest value', () => {
      const values = [10, 20, 30];
      expect(service.calculatePercentileRank(35, values)).toBe(100);
    });

    it('should handle empty array', () => {
      expect(service.calculatePercentileRank(50, [])).toBe(0);
    });
  });
});