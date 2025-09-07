import { Injectable } from '@nestjs/common';

/**
 * Domain Service for Analytics Business Logic
 * Pure business logic for analytics calculations and metrics
 */
@Injectable()
export class AnalyticsDomainService {
  private static readonly ENGAGEMENT_THRESHOLD = {
    LOW: 0.1,    // 10% engagement
    MEDIUM: 0.3, // 30% engagement
    HIGH: 0.5,   // 50% engagement
  };

  private static readonly RETENTION_BUCKETS = [
    { name: '0-1min', start: 0, end: 60000 },
    { name: '1-5min', start: 60000, end: 300000 },
    { name: '5-15min', start: 300000, end: 900000 },
    { name: '15-30min', start: 900000, end: 1800000 },
    { name: '30-60min', start: 1800000, end: 3600000 },
    { name: '60min+', start: 3600000, end: Infinity },
  ];

  /**
   * Calculate engagement score based on various metrics
   */
  calculateEngagementScore(
    viewDuration: number,
    streamDuration: number,
    commentCount: number,
    reactionCount: number,
  ): number {
    if (streamDuration === 0 || viewDuration === 0) return 0;
    
    // Watch time percentage (0-40 points)
    const watchPercentage = Math.min(viewDuration / streamDuration, 1);
    const watchScore = watchPercentage * 40;
    
    // Comment activity (0-30 points)
    const viewMinutes = viewDuration / 60000;
    const commentsPerMinute = viewMinutes > 0 ? (commentCount / viewMinutes) : 0;
    const commentScore = Math.min(commentsPerMinute * 10, 30);
    
    // Reaction activity (0-30 points)
    const reactionsPerMinute = viewMinutes > 0 ? (reactionCount / viewMinutes) : 0;
    const reactionScore = Math.min(reactionsPerMinute * 15, 30);
    
    return Math.round(watchScore + commentScore + reactionScore);
  }

  /**
   * Determine engagement level
   */
  getEngagementLevel(score: number): 'low' | 'medium' | 'high' | 'very_high' {
    if (score >= 80) return 'very_high';
    if (score >= 60) return 'high';
    if (score >= 30) return 'medium';
    return 'low';
  }

  /**
   * Calculate viewer retention curve
   */
  calculateRetentionCurve(
    viewerSessions: Array<{ joinTime: number; leaveTime: number }>,
    streamStartTime: number,
    streamEndTime: number,
  ): Array<{ timestamp: number; viewerCount: number; percentage: number }> {
    const points: Array<{ timestamp: number; viewerCount: number; percentage: number }> = [];
    const interval = 60000; // 1 minute intervals
    const maxViewers = viewerSessions.length;
    
    if (maxViewers === 0) return [];
    
    // Generate retention points at regular intervals
    for (let time = streamStartTime; time <= streamEndTime; time += interval) {
      const activeViewers = viewerSessions.filter(session => 
        session.joinTime <= time && session.leaveTime >= time
      ).length;
      
      points.push({
        timestamp: time,
        viewerCount: activeViewers,
        percentage: (activeViewers / maxViewers) * 100,
      });
    }
    
    return points;
  }

  /**
   * Identify peak moments based on activity
   */
  identifyPeakMoments(
    events: Array<{ timestamp: number; type: string; value?: number }>,
    windowSize: number = 60000, // 1 minute window
  ): Array<{ timestamp: number; intensity: number; type: string }> {
    const moments: Array<{ timestamp: number; intensity: number; type: string }> = [];
    const eventsByWindow = new Map<number, Array<any>>();
    
    // Group events by time window
    for (const event of events) {
      const window = Math.floor(event.timestamp / windowSize) * windowSize;
      if (!eventsByWindow.has(window)) {
        eventsByWindow.set(window, []);
      }
      eventsByWindow.get(window)!.push(event);
    }
    
    // Calculate intensity for each window
    for (const [window, windowEvents] of eventsByWindow) {
      const intensity = this.calculateMomentIntensity(windowEvents);
      
      if (intensity > 0) {
        moments.push({
          timestamp: window,
          intensity,
          type: this.determineMomentType(windowEvents),
        });
      }
    }
    
    // Sort by intensity and return top moments
    return moments
      .sort((a, b) => b.intensity - a.intensity)
      .slice(0, 10);
  }

  /**
   * Calculate moment intensity
   */
  private calculateMomentIntensity(events: Array<any>): number {
    let intensity = 0;
    
    for (const event of events) {
      switch (event.type) {
        case 'comment':
          intensity += 1;
          break;
        case 'reaction':
          intensity += 0.5;
          break;
        case 'donation':
          intensity += event.value || 10;
          break;
        case 'subscription':
          intensity += 5;
          break;
        case 'viewer_spike':
          intensity += event.value || 2;
          break;
      }
    }
    
    return intensity;
  }

  /**
   * Determine the type of peak moment
   */
  private determineMomentType(events: Array<any>): string {
    const typeCounts = new Map<string, number>();
    
    for (const event of events) {
      typeCounts.set(event.type, (typeCounts.get(event.type) || 0) + 1);
    }
    
    // Find dominant type
    let maxCount = 0;
    let dominantType = 'mixed';
    
    for (const [type, count] of typeCounts) {
      if (count > maxCount) {
        maxCount = count;
        dominantType = type;
      }
    }
    
    return dominantType;
  }

  /**
   * Calculate stream performance score
   */
  calculatePerformanceScore(
    viewerCount: number,
    expectedViewers: number,
    engagementRate: number,
    streamDuration: number,
    targetDuration: number,
  ): number {
    // Viewer performance (0-40 points)
    const viewerRatio = expectedViewers > 0 ? viewerCount / expectedViewers : 1;
    const viewerScore = Math.min(viewerRatio * 40, 40);
    
    // Engagement performance (0-30 points)
    const engagementScore = Math.min(engagementRate * 30, 30);
    
    // Duration performance (0-30 points)
    const durationRatio = targetDuration > 0 ? streamDuration / targetDuration : 1;
    const durationScore = Math.min(durationRatio * 30, 30);
    
    return Math.round(viewerScore + engagementScore + durationScore);
  }

  /**
   * Predict viewer count based on historical data
   */
  predictViewerCount(
    dayOfWeek: number,
    hourOfDay: number,
    category: string,
    streamerLevel: number,
    historicalAverages: Map<string, number>,
  ): number {
    // Base prediction from historical average
    const key = `${dayOfWeek}_${hourOfDay}_${category}`;
    let basePrediction = historicalAverages.get(key) || 100;
    
    // Time multipliers
    const peakHours = [19, 20, 21, 22]; // 7pm-10pm
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    if (peakHours.includes(hourOfDay)) {
      basePrediction *= 1.5;
    }
    
    if (isWeekend) {
      basePrediction *= 1.3;
    }
    
    // Streamer level multiplier
    const levelMultiplier = 1 + (streamerLevel * 0.1);
    basePrediction *= levelMultiplier;
    
    // Category popularity multipliers
    const categoryMultipliers: Record<string, number> = {
      gaming: 1.4,
      music: 1.2,
      talk: 1.1,
      education: 0.9,
      general: 1.0,
    };
    
    basePrediction *= categoryMultipliers[category] || 1.0;
    
    return Math.round(basePrediction);
  }

  /**
   * Calculate churn risk for a viewer
   */
  calculateChurnRisk(
    lastViewDate: Date,
    totalWatchTime: number,
    averageSessionDuration: number,
    favoriteStreamCount: number,
    daysSinceRegistration: number,
  ): 'low' | 'medium' | 'high' {
    const daysSinceLastView = (Date.now() - lastViewDate.getTime()) / (24 * 60 * 60 * 1000);
    let riskScore = 0;
    
    // Recency (0-40 points)
    if (daysSinceLastView > 30) riskScore += 40;
    else if (daysSinceLastView > 14) riskScore += 25;
    else if (daysSinceLastView > 7) riskScore += 10;
    
    // Engagement (0-30 points)
    const engagementHours = totalWatchTime / (60 * 60 * 1000);
    if (engagementHours < 1) riskScore += 30;
    else if (engagementHours < 5) riskScore += 15;
    else if (engagementHours < 10) riskScore += 5;
    
    // Session quality (0-20 points)
    const avgSessionMinutes = averageSessionDuration / 60000;
    if (avgSessionMinutes < 5) riskScore += 20;
    else if (avgSessionMinutes < 15) riskScore += 10;
    
    // Loyalty (0-10 points)
    if (favoriteStreamCount === 0) riskScore += 10;
    else if (favoriteStreamCount === 1) riskScore += 5;
    
    // Adjust for new users
    if (daysSinceRegistration < 7) {
      riskScore *= 0.5; // New users get grace period
    }
    
    if (riskScore >= 60) return 'high';
    if (riskScore >= 30) return 'medium';
    return 'low';
  }

  /**
   * Calculate content recommendation score
   */
  calculateRecommendationScore(
    viewerPreferences: { category: string; weight: number }[],
    streamCategory: string,
    streamTags: string[],
    viewerWatchHistory: string[],
    popularityScore: number,
  ): number {
    let score = 0;
    
    // Category match (0-40 points)
    const categoryPreference = viewerPreferences.find(p => p.category === streamCategory);
    if (categoryPreference) {
      score += categoryPreference.weight * 40;
    }
    
    // Tag relevance (0-20 points)
    if (streamTags.length > 0) {
      const relevantTags = streamTags.filter(tag => 
        viewerPreferences.some(p => p.category.includes(tag.toLowerCase()))
      );
      score += Math.min((relevantTags.length / streamTags.length) * 20, 20);
    }
    
    // Novelty factor (0-20 points)
    const isNew = !viewerWatchHistory.includes(streamCategory);
    if (isNew) {
      score += 20; // Encourage discovery
    }
    
    // Popularity factor (0-20 points)
    score += Math.min(popularityScore * 20, 20);
    
    return Math.round(score);
  }

  /**
   * Group analytics data by time period
   */
  groupByTimePeriod<T extends { timestamp: Date }>(
    data: T[],
    period: 'hour' | 'day' | 'week' | 'month',
  ): Map<string, T[]> {
    const grouped = new Map<string, T[]>();
    
    for (const item of data) {
      const key = this.getTimePeriodKey(item.timestamp, period);
      
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      
      grouped.get(key)!.push(item);
    }
    
    return grouped;
  }

  /**
   * Get time period key for grouping
   */
  private getTimePeriodKey(date: Date, period: string): string {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const hour = date.getHours();
    const week = Math.floor(day / 7);
    
    switch (period) {
      case 'hour':
        return `${year}-${month}-${day}-${hour}`;
      case 'day':
        return `${year}-${month}-${day}`;
      case 'week':
        return `${year}-${month}-W${week}`;
      case 'month':
        return `${year}-${month}`;
      default:
        return `${year}-${month}-${day}`;
    }
  }

  /**
   * Calculate growth rate
   */
  calculateGrowthRate(
    currentValue: number,
    previousValue: number,
  ): { rate: number; trend: 'up' | 'down' | 'stable' } {
    if (previousValue === 0) {
      return { rate: 100, trend: 'up' };
    }
    
    const rate = ((currentValue - previousValue) / previousValue) * 100;
    
    let trend: 'up' | 'down' | 'stable';
    if (rate > 5) trend = 'up';
    else if (rate < -5) trend = 'down';
    else trend = 'stable';
    
    return { rate: Math.round(rate * 10) / 10, trend };
  }

  /**
   * Calculate percentile rank
   */
  calculatePercentileRank(value: number, allValues: number[]): number {
    if (allValues.length === 0) return 0;
    
    const sorted = [...allValues].sort((a, b) => a - b);
    let count = 0;
    
    for (const v of sorted) {
      if (v < value) {
        count++;
      } else {
        break;
      }
    }
    
    if (count === sorted.length) return 100;
    if (count === 0) return 0;
    
    return Math.round((count / sorted.length) * 100);
  }
}