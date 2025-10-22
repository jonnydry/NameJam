/**
 * Quality Scoring Service - Main orchestrator
 * Provides unified API for scoring both names and lyrics
 */

import type {
  NameScoringRequest,
  NameQualityResult,
  NameBatchScoringRequest,
  LyricScoringRequest,
  LyricQualityResult,
  LyricBatchScoringRequest,
  BatchScoringResult,
  QualityScoringServiceResponse,
  ThresholdMode,
  QualityThresholds,
  QualityAnalytics
} from './interfaces';

import { NameScoringEngine } from './nameScoring';
import { LyricScoringEngine } from './lyricScoring';
import { qualityAnalytics } from './analytics';
import { QUALITY_THRESHOLDS, PERFORMANCE_CONFIG, validateConfig, DEFAULT_CONFIG } from './config';
import { PerformanceTracker } from './utils';
import { secureLog } from '../../utils/secureLogger';

export class QualityScoringService {
  private nameEngine: NameScoringEngine;
  private lyricEngine: LyricScoringEngine;
  private config: typeof DEFAULT_CONFIG;
  
  constructor(config?: Partial<typeof DEFAULT_CONFIG>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Validate configuration
    if (!validateConfig(this.config)) {
      secureLog.warn('Invalid quality scoring configuration, using defaults');
      this.config = DEFAULT_CONFIG;
    }
    
    this.nameEngine = new NameScoringEngine();
    this.lyricEngine = new LyricScoringEngine();
    
    secureLog.info('Quality Scoring Service initialized', {
      version: this.config.version,
      algorithm: this.config.defaultAlgorithm
    });
  }

  // =============================================================================
  // Name Scoring API
  // =============================================================================

  /**
   * Score a single name for quality
   */
  async scoreName(request: NameScoringRequest, thresholdMode: ThresholdMode = 'moderate'): Promise<QualityScoringServiceResponse<NameQualityResult>> {
    try {
      const result = await this.nameEngine.scoreName(request);
      const threshold = this.getThreshold(thresholdMode);
      
      result.passesThreshold = result.score.overall >= threshold;
      
      // Record analytics
      qualityAnalytics.recordScore(
        result.score,
        'names',
        request.genre,
        result.passesThreshold,
        thresholdMode
      );
      
      return {
        success: true,
        data: result
      };
      
    } catch (error) {
      secureLog.error('Name scoring failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Name scoring failed'
      };
    }
  }

  /**
   * Score multiple names and filter by quality threshold
   */
  async scoreNames(request: NameBatchScoringRequest): Promise<QualityScoringServiceResponse<BatchScoringResult<NameQualityResult>>> {
    const endTiming = PerformanceTracker.startTiming('batch_name_scoring');
    
    try {
      if (request.names.length === 0) {
        return {
          success: true,
          data: {
            results: [],
            filtered: [],
            analytics: {
              totalProcessed: 0,
              averageScore: 0,
              highestScore: 0,
              lowestScore: 0,
              passedThreshold: 0,
              processingTime: endTiming(),
              distribution: { excellent: 0, good: 0, fair: 0, poor: 0, veryPoor: 0 }
            }
          }
        };
      }

      // Limit batch size for performance
      const namesToProcess = request.names.slice(0, PERFORMANCE_CONFIG.maxBatchSize);
      if (request.names.length > PERFORMANCE_CONFIG.maxBatchSize) {
        secureLog.warn(`Batch size ${request.names.length} exceeds limit, processing first ${PERFORMANCE_CONFIG.maxBatchSize}`);
      }

      // Score all names
      const scorePromises = namesToProcess.map(nameRequest => 
        this.nameEngine.scoreName(nameRequest)
      );
      
      const results = await Promise.all(scorePromises);
      const threshold = this.getThreshold(request.thresholdMode, request.customThreshold);
      
      // Apply threshold filtering
      results.forEach(result => {
        result.passesThreshold = result.score.overall >= threshold;
      });
      
      // Filter results that pass threshold
      let filtered = results.filter(result => result.passesThreshold);
      
      // Apply max results limit
      if (request.maxResults && filtered.length > request.maxResults) {
        // Sort by score and take top results
        filtered = filtered
          .sort((a, b) => b.score.overall - a.score.overall)
          .slice(0, request.maxResults);
      }
      
      const processingTime = endTiming();
      const analytics = qualityAnalytics.generateBatchAnalytics(results, threshold, processingTime);
      
      // Record analytics for each result
      results.forEach(result => {
        const nameRequest = namesToProcess.find(req => req.name === result.name);
        qualityAnalytics.recordScore(
          result.score,
          'names',
          nameRequest?.genre,
          result.passesThreshold,
          request.thresholdMode
        );
      });
      
      return {
        success: true,
        data: {
          results,
          filtered,
          analytics
        },
        analytics
      };
      
    } catch (error) {
      endTiming();
      secureLog.error('Batch name scoring failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Batch name scoring failed'
      };
    }
  }

  // =============================================================================
  // Lyric Scoring API
  // =============================================================================

  /**
   * Score a single lyric for quality
   */
  async scoreLyric(request: LyricScoringRequest, thresholdMode: ThresholdMode = 'moderate'): Promise<QualityScoringServiceResponse<LyricQualityResult>> {
    try {
      const result = await this.lyricEngine.scoreLyric(request);
      const threshold = this.getThreshold(thresholdMode);
      
      result.passesThreshold = result.score.overall >= threshold;
      
      // Record analytics
      qualityAnalytics.recordScore(
        result.score,
        'lyrics',
        request.genre,
        result.passesThreshold,
        thresholdMode
      );
      
      return {
        success: true,
        data: result
      };
      
    } catch (error) {
      secureLog.error('Lyric scoring failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Lyric scoring failed'
      };
    }
  }

  /**
   * Score multiple lyrics and filter by quality threshold
   */
  async scoreLyrics(request: LyricBatchScoringRequest): Promise<QualityScoringServiceResponse<BatchScoringResult<LyricQualityResult>>> {
    const endTiming = PerformanceTracker.startTiming('batch_lyric_scoring');
    
    try {
      if (request.lyrics.length === 0) {
        return {
          success: true,
          data: {
            results: [],
            filtered: [],
            analytics: {
              totalProcessed: 0,
              averageScore: 0,
              highestScore: 0,
              lowestScore: 0,
              passedThreshold: 0,
              processingTime: endTiming(),
              distribution: { excellent: 0, good: 0, fair: 0, poor: 0, veryPoor: 0 }
            }
          }
        };
      }

      // Limit batch size for performance
      const lyricsToProcess = request.lyrics.slice(0, PERFORMANCE_CONFIG.maxBatchSize);
      if (request.lyrics.length > PERFORMANCE_CONFIG.maxBatchSize) {
        secureLog.warn(`Batch size ${request.lyrics.length} exceeds limit, processing first ${PERFORMANCE_CONFIG.maxBatchSize}`);
      }

      // Score all lyrics
      const scorePromises = lyricsToProcess.map(lyricRequest => 
        this.lyricEngine.scoreLyric(lyricRequest)
      );
      
      const results = await Promise.all(scorePromises);
      const threshold = this.getThreshold(request.thresholdMode, request.customThreshold);
      
      // Apply threshold filtering
      results.forEach(result => {
        result.passesThreshold = result.score.overall >= threshold;
      });
      
      // Filter results that pass threshold
      let filtered = results.filter(result => result.passesThreshold);
      
      // Apply max results limit
      if (request.maxResults && filtered.length > request.maxResults) {
        // Sort by score and take top results
        filtered = filtered
          .sort((a, b) => b.score.overall - a.score.overall)
          .slice(0, request.maxResults);
      }
      
      const processingTime = endTiming();
      const analytics = qualityAnalytics.generateBatchAnalytics(results, threshold, processingTime);
      
      // Record analytics for each result
      results.forEach(result => {
        const lyricRequest = lyricsToProcess.find(req => req.lyric === result.lyric);
        qualityAnalytics.recordScore(
          result.score,
          'lyrics',
          lyricRequest?.genre,
          result.passesThreshold,
          request.thresholdMode
        );
      });
      
      return {
        success: true,
        data: {
          results,
          filtered,
          analytics
        },
        analytics
      };
      
    } catch (error) {
      endTiming();
      secureLog.error('Batch lyric scoring failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Batch lyric scoring failed'
      };
    }
  }

  // =============================================================================
  // Analytics and Monitoring API
  // =============================================================================

  /**
   * Get current quality analytics
   */
  getAnalytics(): QualityAnalytics {
    return qualityAnalytics.getAnalytics();
  }

  /**
   * Get performance insights and recommendations
   */
  getPerformanceInsights() {
    return qualityAnalytics.getPerformanceInsights();
  }

  /**
   * Get threshold effectiveness analysis
   */
  getThresholdAnalysis() {
    return qualityAnalytics.getThresholdAnalysis();
  }

  /**
   * Get quality trends for a specific time period
   */
  getQualityTrends(hours: number = 24, category?: 'names' | 'lyrics') {
    return qualityAnalytics.getTrendsForPeriod(hours, category);
  }

  /**
   * Get genre performance analysis
   */
  getGenrePerformance() {
    return qualityAnalytics.getGenrePerformance();
  }

  /**
   * Export analytics data
   */
  exportAnalytics() {
    return qualityAnalytics.exportAnalyticsData();
  }

  // =============================================================================
  // Configuration and Utility Methods
  // =============================================================================

  /**
   * Update service configuration
   */
  updateConfig(newConfig: Partial<typeof DEFAULT_CONFIG>): boolean {
    try {
      const mergedConfig = { ...this.config, ...newConfig };
      
      if (!validateConfig(mergedConfig)) {
        secureLog.error('Invalid configuration provided');
        return false;
      }
      
      this.config = mergedConfig;
      secureLog.info('Quality scoring configuration updated');
      return true;
      
    } catch (error) {
      secureLog.error('Configuration update failed:', error);
      return false;
    }
  }

  /**
   * Get current configuration
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Health check for the service
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  }> {
    try {
      const analytics = this.getAnalytics();
      const performance = PerformanceTracker.getAllTimings();
      const insights = this.getPerformanceInsights();
      
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      
      // Determine health based on performance metrics
      if (insights.metrics.overallHealth < 0.6) {
        status = 'unhealthy';
      } else if (insights.metrics.overallHealth < 0.75 || 
                 insights.metrics.processsingEfficiency < 0.7) {
        status = 'degraded';
      }
      
      return {
        status,
        details: {
          totalScored: analytics.totalScored,
          averageScores: analytics.averageScores,
          performanceMetrics: performance,
          healthMetrics: insights.metrics,
          configVersion: this.config.version,
          timestamp: new Date().toISOString()
        }
      };
      
    } catch (error) {
      secureLog.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Health check failed',
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Reset analytics (useful for testing)
   */
  resetAnalytics(): void {
    qualityAnalytics.resetAnalytics();
  }

  // =============================================================================
  // Private Helper Methods
  // =============================================================================

  /**
   * Get threshold value based on mode
   */
  private getThreshold(mode: ThresholdMode, customValue?: number): number {
    if (mode === 'custom' && customValue !== undefined) {
      return Math.max(0, Math.min(1, customValue));
    }
    
    return this.config.thresholds[mode as keyof QualityThresholds] || 
           this.config.thresholds.moderate;
  }
}

// Export main service class and utilities
export { qualityAnalytics } from './analytics';
export { QUALITY_THRESHOLDS, GENRE_ADJUSTMENTS } from './config';
export type * from './interfaces';

// Export singleton instance for easy use
export const qualityScoring = new QualityScoringService();