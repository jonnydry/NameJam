import { LyricGenerationResult } from '../../types/lyricTypes';
import { LyricContextGatherer } from './lyricContextGatherer';
import { LyricGenerator } from './lyricGenerator';
import { secureLog } from '../../utils/secureLogger';

/**
 * Orchestrator service that coordinates lyric generation
 * Follows single responsibility principle by delegating to specialized services
 */
export class LyricOrchestrator {
  private contextGatherer: LyricContextGatherer;
  private generator: LyricGenerator;
  private performanceMetrics = {
    totalRequests: 0,
    aiSuccesses: 0,
    fallbackUsed: 0,
    averageResponseTime: 0,
    cacheHits: 0
  };

  constructor() {
    this.contextGatherer = new LyricContextGatherer();
    this.generator = new LyricGenerator();
  }

  /**
   * Main entry point for generating lyric starters
   */
  async generateLyricStarter(genre?: string): Promise<LyricGenerationResult> {
    const startTime = Date.now();
    this.performanceMetrics.totalRequests++;

    try {
      // Step 1: Gather comprehensive context (with caching)
      secureLog.debug(`Starting lyric generation for genre: ${genre || 'contemporary'}`);
      const context = await this.contextGatherer.getComprehensiveContext(genre);
      
      // Step 2: Attempt AI generation with context
      const aiResult = await this.generator.generateWithAI(genre, context);
      
      if (aiResult) {
        this.performanceMetrics.aiSuccesses++;
        this.updatePerformanceMetrics(startTime);
        secureLog.info(`✅ AI lyric generated successfully for ${genre || 'contemporary'}`);
        return aiResult;
      }
      
      // Step 3: Fallback if AI generation fails
      secureLog.warn(`AI generation failed, using fallback for ${genre || 'contemporary'}`);
      const fallbackResult = this.generator.generateFallback(genre);
      this.performanceMetrics.fallbackUsed++;
      this.updatePerformanceMetrics(startTime);
      
      return fallbackResult;
      
    } catch (error) {
      // Last resort fallback
      secureLog.error('Critical error in lyric generation:', error);
      this.performanceMetrics.fallbackUsed++;
      this.updatePerformanceMetrics(startTime);
      
      return this.generator.generateFallback(genre);
    }
  }

  /**
   * Get performance metrics for monitoring
   */
  getPerformanceMetrics() {
    const successRate = this.performanceMetrics.totalRequests > 0
      ? (this.performanceMetrics.aiSuccesses / this.performanceMetrics.totalRequests) * 100
      : 0;
    
    const fallbackRate = this.performanceMetrics.totalRequests > 0
      ? (this.performanceMetrics.fallbackUsed / this.performanceMetrics.totalRequests) * 100
      : 0;

    return {
      ...this.performanceMetrics,
      successRate: Math.round(successRate * 100) / 100,
      fallbackRate: Math.round(fallbackRate * 100) / 100
    };
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(startTime: number) {
    const responseTime = Date.now() - startTime;
    
    // Calculate running average
    const totalRequests = this.performanceMetrics.totalRequests;
    const currentAverage = this.performanceMetrics.averageResponseTime;
    this.performanceMetrics.averageResponseTime = 
      ((currentAverage * (totalRequests - 1)) + responseTime) / totalRequests;
  }

  /**
   * Clear cache (useful for testing or manual cache invalidation)
   */
  async clearCache() {
    // This would clear the caches in the context gatherer and generator
    // For now, we'll just log the action
    secureLog.info('Cache clear requested for lyric services');
    // Could implement cache clearing logic here if needed
  }

  /**
   * Health check for the service
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  }> {
    const metrics = this.getPerformanceMetrics();
    
    // Determine health based on success rate
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (metrics.successRate >= 80) {
      status = 'healthy';
    } else if (metrics.successRate >= 50) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      details: {
        ...metrics,
        hasOpenAI: process.env.XAI_API_KEY ? true : false,
        timestamp: new Date().toISOString()
      }
    };
  }
}

// Export singleton instance
export const lyricOrchestrator = new LyricOrchestrator();