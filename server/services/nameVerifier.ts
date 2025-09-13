import type { VerificationResult } from "@shared/schema";
import { VerificationPipeline } from './verification/VerificationPipeline';
import { secureLog } from '../utils/secureLogger';
import type { VerificationContext } from '../types/verification';

export class NameVerifierService {
  private pipeline: VerificationPipeline;

  constructor() {
    this.pipeline = VerificationPipeline.getInstance();
  }

  async verifyName(name: string, type: 'band' | 'song'): Promise<VerificationResult> {
    try {
      // Create verification context
      const context: VerificationContext = {
        name: name.trim(),
        type,
        cacheEnabled: true,
        platforms: ['spotify', 'itunes', 'soundcloud', 'bandcamp'],
        skipEasterEggs: false,
        skipFamousArtists: false
      };

      // Delegate to verification pipeline
      const result = await this.pipeline.verify(context);
      
      secureLog.debug('Name verification completed', {
        name: context.name,
        type: context.type,
        status: result.status,
        confidence: result.confidence
      });

      return result;

    } catch (error) {
      secureLog.error('Name verification error:', {
        error: error instanceof Error ? error.message : String(error),
        name,
        type
      });

      // Fallback result for any errors
      return {
        status: 'available',
        confidence: 0.5,
        confidenceLevel: 'medium',
        explanation: 'Verification incomplete due to technical issues',
        details: 'Verification temporarily unavailable - name appears to be available.',
        verificationLinks: []
      };
    }
  }

}
