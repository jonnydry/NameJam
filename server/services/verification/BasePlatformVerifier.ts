/**
 * BasePlatformVerifier - Abstract base class for platform verification strategies
 * Provides common functionality and error handling for all platform verifiers
 */

import { secureLog } from '../../utils/secureLogger';
import { SimilarityService } from './SimilarityService';
import type { 
  IPlatformVerifier, 
  PlatformEvidence, 
  PlatformMatch, 
  VerificationError 
} from '../../types/verification';

export abstract class BasePlatformVerifier implements IPlatformVerifier {
  protected similarityService: SimilarityService;
  
  constructor(
    public readonly platformName: string,
    public readonly reliability: number
  ) {
    this.similarityService = SimilarityService.getInstance();
  }

  abstract isAvailable(): Promise<boolean>;
  abstract verify(name: string, type: 'band' | 'song'): Promise<PlatformEvidence>;

  /**
   * Normalize raw platform matches to standardized format
   */
  protected normalizeMatches(
    rawResults: any[], 
    searchName: string, 
    type: 'band' | 'song'
  ): PlatformMatch[] {
    if (!Array.isArray(rawResults)) {
      return [];
    }

    return rawResults.map((result, index) => {
      const match = this.extractMatchData(result);
      const similarity = this.similarityService.calculateSimilarity(
        searchName, 
        match.name, 
        type
      );

      return {
        name: match.name,
        artist: match.artist,
        album: match.album,
        popularity: match.popularity,
        genres: match.genres,
        followers: match.followers,
        releaseDate: match.releaseDate,
        url: match.url,
        imageUrl: match.imageUrl,
        preview: match.preview,
        similarity: similarity.overallSimilarity,
        phoneticSimilarity: similarity.phoneticSimilarity,
        isExactMatch: similarity.matchType === 'exact',
        matchType: similarity.matchType,
        source: this.platformName as any
      };
    });
  }

  /**
   * Extract match data from platform-specific result format
   * Each platform implementation should override this
   */
  protected abstract extractMatchData(result: any): {
    name: string;
    artist?: string;
    album?: string;
    popularity?: number;
    genres?: string[];
    followers?: number;
    releaseDate?: string;
    url?: string;
    imageUrl?: string;
    preview?: string;
  };

  /**
   * Categorize matches into exact, similar, and partial groups
   */
  protected categorizeMatches(
    matches: PlatformMatch[], 
    searchName: string, 
    type: 'band' | 'song'
  ): {
    exactMatches: PlatformMatch[];
    similarMatches: PlatformMatch[];
    allMatches: PlatformMatch[];
  } {
    const thresholds = this.similarityService.getThresholds(type);
    
    const exactMatches = matches.filter(match => 
      match.similarity >= thresholds.exactThreshold || match.isExactMatch
    );
    
    const similarMatches = matches.filter(match => 
      match.similarity >= thresholds.phoneticThreshold && 
      match.similarity < thresholds.exactThreshold
    );

    return {
      exactMatches,
      similarMatches,
      allMatches: matches
    };
  }

  /**
   * Create standardized platform evidence
   */
  protected createPlatformEvidence(
    matches: PlatformMatch[],
    searchName: string,
    type: 'band' | 'song',
    responseTime?: number,
    error?: string
  ): PlatformEvidence {
    const categorized = this.categorizeMatches(matches, searchName, type);
    
    // Determine search quality based on results and errors
    let searchQuality: PlatformEvidence['searchQuality'] = 'good';
    if (error) {
      searchQuality = 'failed';
    } else if (matches.length === 0) {
      searchQuality = 'fair';
    } else if (categorized.exactMatches.length > 0) {
      searchQuality = 'excellent';
    } else if (categorized.similarMatches.length > 0) {
      searchQuality = 'good';
    }

    return {
      platform: this.platformName,
      available: !error,
      reliability: this.reliability,
      matches: categorized.allMatches,
      exactMatches: categorized.exactMatches,
      similarMatches: categorized.similarMatches,
      totalResults: matches.length,
      searchQuality,
      responseTime,
      error,
      metadata: {
        cached: false,
        searchMethod: 'api',
        rateLimited: false
      }
    };
  }

  /**
   * Standard error handling for platform requests
   */
  protected handleError(error: Error, context?: { name?: string; type?: string }): VerificationError {
    secureLog.error(`${this.platformName} verification error:`, {
      error: error.message,
      platform: this.platformName,
      ...context
    });

    // Determine error code based on error type
    let code: VerificationError['code'] = 'PLATFORM_ERROR';
    let retryable = true;

    if (error.message.includes('timeout')) {
      code = 'PLATFORM_TIMEOUT';
    } else if (error.message.includes('rate limit') || error.message.includes('429')) {
      code = 'RATE_LIMITED';
      retryable = false;
    } else if (error.message.includes('invalid') || error.message.includes('400')) {
      code = 'INVALID_INPUT';
      retryable = false;
    }

    return {
      code,
      message: `${this.platformName} verification failed: ${error.message}`,
      platform: this.platformName,
      originalError: error,
      retryable,
      timestamp: new Date(),
      context: {
        platform: this.platformName,
        ...context
      }
    };
  }

  /**
   * Execute verification with timeout and error handling
   */
  protected async executeWithTimeout<T>(
    operation: Promise<T>,
    timeoutMs: number = 10000,
    context?: { name?: string; type?: string }
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`${this.platformName} timeout after ${timeoutMs}ms`)), timeoutMs);
    });

    try {
      return await Promise.race([operation, timeoutPromise]);
    } catch (error) {
      throw this.handleError(error instanceof Error ? error : new Error(String(error)), context);
    }
  }

  /**
   * Check if result indicates name is available
   */
  protected isNameAvailable(evidence: PlatformEvidence, type: 'band' | 'song'): boolean {
    // If we couldn't search, assume available (graceful degradation)
    if (evidence.error || !evidence.available) {
      return true;
    }

    // If there are exact matches, name is taken
    if (evidence.exactMatches.length > 0) {
      return false;
    }

    // For bands, similar matches also indicate taken
    // For songs, only exact matches matter (multiple songs can have same title)
    if (type === 'band' && evidence.similarMatches.length > 0) {
      return false;
    }

    return true;
  }

  /**
   * Get platform-specific configuration
   */
  protected getConfig(): Record<string, any> {
    return {
      platform: this.platformName,
      reliability: this.reliability,
      timeout: 10000,
      maxResults: 50
    };
  }
}