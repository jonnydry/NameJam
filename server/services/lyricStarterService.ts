import { lyricOrchestrator } from './lyric/lyricOrchestrator';
import { LyricGenerationResult } from '../types/lyricTypes';
import { secureLog } from '../utils/secureLogger';

/**
 * LyricStarterService - Refactored to use the new orchestrator pattern
 * This maintains backward compatibility while using the improved architecture
 */
export class LyricStarterService {
  /**
   * Generate a lyric starter using the orchestrator
   * @param genre - Optional genre for contextual generation
   * @returns Promise with lyric result
   */
  async generateLyricStarter(genre?: string): Promise<LyricGenerationResult> {
    try {
      // Delegate to the orchestrator
      const result = await lyricOrchestrator.generateLyricStarter(genre);
      
      // Log success for monitoring
      secureLog.info(`Lyric generated successfully via orchestrator for genre: ${genre || 'contemporary'}`);
      
      return result;
    } catch (error) {
      // Log error and let orchestrator handle fallback
      secureLog.error('Error in LyricStarterService:', error);
      
      // The orchestrator should handle all errors and provide fallback
      // If we get here, something went very wrong
      throw error;
    }
  }

  /**
   * Get performance metrics from the orchestrator
   */
  getPerformanceMetrics() {
    return lyricOrchestrator.getPerformanceMetrics();
  }

  /**
   * Health check for the service
   */
  async healthCheck() {
    return lyricOrchestrator.healthCheck();
  }

  /**
   * Clear cache if needed
   */
  async clearCache() {
    return lyricOrchestrator.clearCache();
  }
}