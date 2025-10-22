/**
 * Quality scoring analytics and tracking
 * Provides insights into scoring performance and quality trends
 */

import type {
  QualityAnalytics,
  QualityTrend,
  ScoreDistribution,
  BatchAnalytics,
  QualityScore,
  ThresholdMode
} from './interfaces';
import { secureLog } from '../../utils/secureLogger';

export class QualityAnalyticsService {
  private analytics: QualityAnalytics;
  private recentScores: Array<{
    score: number;
    category: 'names' | 'lyrics';
    genre?: string;
    timestamp: number;
  }> = [];
  
  private maxHistorySize = 1000; // Keep last 1000 scores for analysis

  constructor() {
    this.analytics = this.initializeAnalytics();
  }

  /**
   * Record a quality score for analytics
   */
  recordScore(
    score: QualityScore,
    category: 'names' | 'lyrics',
    genre?: string,
    passedThreshold?: boolean,
    thresholdUsed?: ThresholdMode
  ): void {
    try {
      const timestamp = Date.now();
      
      // Update total counts
      this.analytics.totalScored++;
      
      // Update average scores
      const currentAvg = this.analytics.averageScores[category];
      const totalForCategory = this.getScoreCountForCategory(category);
      this.analytics.averageScores[category] = 
        ((currentAvg * (totalForCategory - 1)) + score.overall) / totalForCategory;
      
      // Update threshold rates
      if (passedThreshold && thresholdUsed) {
        this.updateThresholdRates(thresholdUsed, passedThreshold);
      }
      
      // Update genre performance
      if (genre) {
        const currentGenreAvg = this.analytics.genrePerformance.get(genre) || 0;
        const genreCount = this.getGenreScoreCount(genre);
        const newGenreAvg = ((currentGenreAvg * (genreCount - 1)) + score.overall) / genreCount;
        this.analytics.genrePerformance.set(genre, newGenreAvg);
      }
      
      // Update time metrics
      this.updateTimeMetrics(category, score.metadata.scoringTime);
      
      // Add to recent scores for trend analysis
      this.recentScores.push({
        score: score.overall,
        category,
        genre,
        timestamp
      });
      
      // Keep only recent scores
      if (this.recentScores.length > this.maxHistorySize) {
        this.recentScores.shift();
      }
      
      // Update quality trends (every 50 scores)
      if (this.analytics.totalScored % 50 === 0) {
        this.updateQualityTrends();
      }
      
    } catch (error) {
      secureLog.error('Error recording quality score:', error);
    }
  }

  /**
   * Generate batch analytics from scoring results
   */
  generateBatchAnalytics<T extends { score: QualityScore }>(
    results: T[],
    threshold: number,
    processingTime: number
  ): BatchAnalytics {
    if (results.length === 0) {
      return {
        totalProcessed: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        passedThreshold: 0,
        processingTime,
        distribution: this.createEmptyDistribution()
      };
    }

    const scores = results.map(r => r.score.overall);
    const passedCount = scores.filter(score => score >= threshold).length;
    
    return {
      totalProcessed: results.length,
      averageScore: scores.reduce((sum, score) => sum + score, 0) / scores.length,
      highestScore: Math.max(...scores),
      lowestScore: Math.min(...scores),
      passedThreshold: passedCount,
      processingTime,
      distribution: this.calculateScoreDistribution(scores)
    };
  }

  /**
   * Get current analytics snapshot
   */
  getAnalytics(): QualityAnalytics {
    return {
      ...this.analytics,
      genrePerformance: new Map(this.analytics.genrePerformance),
      qualityTrends: [...this.analytics.qualityTrends]
    };
  }

  /**
   * Get quality trends for a specific time period
   */
  getTrendsForPeriod(hours: number = 24, category?: 'names' | 'lyrics'): QualityTrend[] {
    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
    
    return this.analytics.qualityTrends.filter(trend => {
      return trend.timestamp >= cutoffTime && 
             (!category || trend.category === category);
    });
  }

  /**
   * Get performance by genre
   */
  getGenrePerformance(): Array<{ genre: string; averageScore: number; count: number }> {
    const results: Array<{ genre: string; averageScore: number; count: number }> = [];
    
    for (const [genre, avgScore] of this.analytics.genrePerformance.entries()) {
      const count = this.getGenreScoreCount(genre);
      results.push({ genre, averageScore: avgScore, count });
    }
    
    return results.sort((a, b) => b.averageScore - a.averageScore);
  }

  /**
   * Get threshold effectiveness analysis
   */
  getThresholdAnalysis(): {
    thresholds: Record<ThresholdMode, { rate: number; effectiveness: number }>;
    recommendations: string[];
  } {
    const analysis = {
      thresholds: {} as Record<ThresholdMode, { rate: number; effectiveness: number }>,
      recommendations: [] as string[]
    };
    
    // Calculate effectiveness for each threshold
    const thresholds: ThresholdMode[] = ['strict', 'moderate', 'lenient'];
    
    for (const threshold of thresholds) {
      const rate = this.analytics.thresholdRates[threshold];
      const effectiveness = this.calculateThresholdEffectiveness(threshold);
      
      analysis.thresholds[threshold] = { rate, effectiveness };
    }
    
    // Generate recommendations
    analysis.recommendations = this.generateThresholdRecommendations(analysis.thresholds);
    
    return analysis;
  }

  /**
   * Get recent score distribution
   */
  getRecentScoreDistribution(hours: number = 24): ScoreDistribution {
    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
    const recentScores = this.recentScores
      .filter(entry => entry.timestamp >= cutoffTime)
      .map(entry => entry.score);
    
    return this.calculateScoreDistribution(recentScores);
  }

  /**
   * Get performance insights and recommendations
   */
  getPerformanceInsights(): {
    insights: string[];
    recommendations: string[];
    metrics: {
      overallHealth: number;
      qualityConsistency: number;
      processsingEfficiency: number;
    };
  } {
    const insights: string[] = [];
    const recommendations: string[] = [];
    
    // Analyze overall performance
    const overallAvg = (this.analytics.averageScores.names + this.analytics.averageScores.lyrics) / 2;
    const health = overallAvg;
    
    if (health >= 0.75) {
      insights.push('Quality scoring is performing excellently with high average scores');
    } else if (health >= 0.60) {
      insights.push('Quality scoring is performing well with good average scores');
    } else {
      insights.push('Quality scoring may need adjustment - average scores are below optimal');
      recommendations.push('Consider adjusting scoring weights or reviewing algorithm parameters');
    }
    
    // Analyze consistency
    const consistency = this.calculateQualityConsistency();
    if (consistency < 0.7) {
      insights.push('Score distribution shows high variance - results may be inconsistent');
      recommendations.push('Review scoring algorithms for better consistency');
    }
    
    // Analyze processing efficiency
    const avgProcessingTime = (this.analytics.timeMetrics.averageNamingTime + 
                              this.analytics.timeMetrics.averageLyricTime) / 2;
    
    if (avgProcessingTime > 100) {
      insights.push('Scoring is taking longer than optimal - may impact response times');
      recommendations.push('Consider optimizing scoring algorithms for better performance');
    }
    
    // Genre-specific insights
    const topGenres = this.getGenrePerformance().slice(0, 3);
    if (topGenres.length > 0) {
      insights.push(`Best performing genres: ${topGenres.map(g => g.genre).join(', ')}`);
    }
    
    return {
      insights,
      recommendations,
      metrics: {
        overallHealth: health,
        qualityConsistency: consistency,
        processingEfficiency: Math.max(0, 1 - (avgProcessingTime / 200))
      }
    };
  }

  /**
   * Export analytics data for external analysis
   */
  exportAnalyticsData(): {
    summary: QualityAnalytics;
    recentScores: Array<{
      score: number;
      category: 'names' | 'lyrics';
      genre?: string;
      timestamp: number;
    }>;
    timestamp: string;
  } {
    return {
      summary: this.getAnalytics(),
      recentScores: [...this.recentScores],
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Reset analytics (useful for testing or periodic resets)
   */
  resetAnalytics(): void {
    this.analytics = this.initializeAnalytics();
    this.recentScores = [];
    secureLog.info('Quality scoring analytics reset');
  }

  // Private helper methods

  private initializeAnalytics(): QualityAnalytics {
    return {
      totalScored: 0,
      averageScores: {
        names: 0,
        lyrics: 0
      },
      thresholdRates: {
        strict: 0,
        moderate: 0,
        lenient: 0
      },
      genrePerformance: new Map(),
      timeMetrics: {
        averageNamingTime: 0,
        averageLyricTime: 0
      },
      qualityTrends: []
    };
  }

  private updateThresholdRates(threshold: ThresholdMode, passed: boolean): void {
    // Only update rates for tracked thresholds
    if (threshold === 'strict' || threshold === 'moderate' || threshold === 'lenient') {
      const currentRate = this.analytics.thresholdRates[threshold];
      const totalForThreshold = this.getThresholdUsageCount(threshold);
      
      // Calculate new rate (passed scores / total usage for this threshold)
      const passedCount = Math.round(currentRate * (totalForThreshold - 1)) + (passed ? 1 : 0);
      this.analytics.thresholdRates[threshold] = passedCount / totalForThreshold;
    }
  }

  private updateTimeMetrics(category: 'names' | 'lyrics', scoringTime: number): void {
    const metricKey = category === 'names' ? 'averageNamingTime' : 'averageLyricTime';
    const currentAvg = this.analytics.timeMetrics[metricKey];
    const count = this.getScoreCountForCategory(category);
    
    this.analytics.timeMetrics[metricKey] = 
      ((currentAvg * (count - 1)) + scoringTime) / count;
  }

  private updateQualityTrends(): void {
    const now = Date.now();
    const recentNames = this.recentScores
      .filter(s => s.category === 'names' && s.timestamp >= now - 24 * 60 * 60 * 1000);
    const recentLyrics = this.recentScores
      .filter(s => s.category === 'lyrics' && s.timestamp >= now - 24 * 60 * 60 * 1000);
    
    if (recentNames.length > 0) {
      const avgNameScore = recentNames.reduce((sum, s) => sum + s.score, 0) / recentNames.length;
      this.analytics.qualityTrends.push({
        timestamp: now,
        averageScore: avgNameScore,
        category: 'names'
      });
    }
    
    if (recentLyrics.length > 0) {
      const avgLyricScore = recentLyrics.reduce((sum, s) => sum + s.score, 0) / recentLyrics.length;
      this.analytics.qualityTrends.push({
        timestamp: now,
        averageScore: avgLyricScore,
        category: 'lyrics'
      });
    }
    
    // Keep only last 100 trends
    if (this.analytics.qualityTrends.length > 100) {
      this.analytics.qualityTrends = this.analytics.qualityTrends.slice(-100);
    }
  }

  private calculateScoreDistribution(scores: number[]): ScoreDistribution {
    if (scores.length === 0) {
      return this.createEmptyDistribution();
    }
    
    const distribution = {
      excellent: 0,   // 0.8-1.0
      good: 0,        // 0.6-0.8
      fair: 0,        // 0.4-0.6
      poor: 0,        // 0.2-0.4
      veryPoor: 0     // 0.0-0.2
    };
    
    scores.forEach(score => {
      if (score >= 0.8) distribution.excellent++;
      else if (score >= 0.6) distribution.good++;
      else if (score >= 0.4) distribution.fair++;
      else if (score >= 0.2) distribution.poor++;
      else distribution.veryPoor++;
    });
    
    return distribution;
  }

  private createEmptyDistribution(): ScoreDistribution {
    return {
      excellent: 0,
      good: 0,
      fair: 0,
      poor: 0,
      veryPoor: 0
    };
  }

  private calculateQualityConsistency(): number {
    if (this.recentScores.length < 10) return 1; // Not enough data
    
    const scores = this.recentScores.map(s => s.score);
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Lower standard deviation = higher consistency
    return Math.max(0, 1 - (standardDeviation * 2));
  }

  private calculateThresholdEffectiveness(threshold: ThresholdMode): number {
    // Only calculate effectiveness for tracked thresholds
    if (threshold !== 'strict' && threshold !== 'moderate' && threshold !== 'lenient') {
      return 0.5; // Default effectiveness for untracked thresholds
    }
    
    // Simple effectiveness metric based on pass rate and quality
    const passRate = this.analytics.thresholdRates[threshold];
    
    // Effectiveness is higher when pass rate is reasonable (not too high or too low)
    // and when the threshold successfully filters low-quality content
    if (passRate < 0.1) return 0.3; // Too strict
    if (passRate > 0.9) return 0.4; // Too lenient
    if (passRate >= 0.4 && passRate <= 0.7) return 0.9; // Good balance
    
    return 0.6; // Moderate effectiveness
  }

  private generateThresholdRecommendations(thresholds: Record<ThresholdMode, { rate: number; effectiveness: number }>): string[] {
    const recommendations: string[] = [];
    
    if (thresholds.strict.rate < 0.1) {
      recommendations.push('Strict threshold may be too restrictive - consider lowering it');
    }
    
    if (thresholds.lenient.rate > 0.9) {
      recommendations.push('Lenient threshold may not be filtering enough - consider raising it');
    }
    
    if (thresholds.moderate.effectiveness < 0.7) {
      recommendations.push('Moderate threshold may need adjustment for better effectiveness');
    }
    
    // Find best performing threshold
    const bestThreshold = Object.entries(thresholds)
      .reduce((best: { name: ThresholdMode; rate: number; effectiveness: number }, [name, data]) => 
        data.effectiveness > best.effectiveness ? { name: name as ThresholdMode, ...data } : best,
        { name: 'moderate' as ThresholdMode, rate: 0, effectiveness: 0 }
      );
    
    if (bestThreshold.effectiveness > 0.8) {
      recommendations.push(`${bestThreshold.name} threshold is performing well - consider using it as default`);
    }
    
    return recommendations;
  }

  private getScoreCountForCategory(category: 'names' | 'lyrics'): number {
    return this.recentScores.filter(s => s.category === category).length || 1;
  }

  private getGenreScoreCount(genre: string): number {
    return this.recentScores.filter(s => s.genre === genre).length || 1;
  }

  private getThresholdUsageCount(threshold: ThresholdMode): number {
    // This would need to be tracked separately in a real implementation
    // For now, return a reasonable estimate
    return Math.max(1, Math.floor(this.analytics.totalScored / 3));
  }
}

// Export singleton instance
export const qualityAnalytics = new QualityAnalyticsService();