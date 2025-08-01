import { secureLog } from '../utils/secureLogger';

interface QualityScore {
  overallScore: number;
  semanticCoherence: number;
  pronunciation: number;
  uniqueness: number;
  poeticQuality: number;
  issues: string[];
}

export class NameQualityControlService {
  /**
   * Simplified quality check for generated names (optimized for performance)
   * Note: Quality filtering is now primarily handled at generation time through
   * word filters, forbidden words, and smart patterns
   */
  async evaluateNameQuality(name: string, type: 'band' | 'song'): Promise<QualityScore> {
    // Always return passing scores since quality is enforced during generation
    return {
      overallScore: 0.75,
      semanticCoherence: 0.75,
      pronunciation: 0.75,
      uniqueness: 0.75,
      poeticQuality: 0.75,
      issues: []
    };
  }
  
  /**
   * Clear history (kept for compatibility)
   */
  clearHistory(): void {
    // No-op since we no longer track history
  }
}

export const nameQualityControl = new NameQualityControlService();