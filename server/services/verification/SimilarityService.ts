/**
 * SimilarityService - Enhanced similarity matching with band/song-specific logic
 * Extracted from nameVerifier.ts to provide dedicated similarity analysis
 */

import { phoneticMatchingService } from '../phoneticMatchingService';
import { secureLog } from '../../utils/secureLogger';
import type { SimilarityScores, PlatformMatch } from '../../types/verification';

export interface SimilarityConfig {
  band: {
    exactThreshold: number; // Threshold for exact matches
    phoneticThreshold: number; // Threshold for phonetic matches
    partialThreshold: number; // Threshold for partial matches
    lengthRatio: number; // Minimum length ratio for similarity
  };
  song: {
    exactThreshold: number;
    phoneticThreshold: number;
    partialThreshold: number;
    lengthRatio: number;
  };
}

export class SimilarityService {
  private static instance: SimilarityService;
  private config: SimilarityConfig;

  private constructor() {
    // Band names require stricter matching than songs
    // Songs can have similar titles by different artists
    this.config = {
      band: {
        exactThreshold: 0.95, // Very strict for exact band name matches
        phoneticThreshold: 0.85, // Strict for phonetic similarity
        partialThreshold: 0.80, // Moderate for partial matches
        lengthRatio: 0.8 // Names must be reasonably similar length
      },
      song: {
        exactThreshold: 0.98, // Extremely strict for song exact matches
        phoneticThreshold: 0.90, // More lenient since songs can share titles
        partialThreshold: 0.85, // More lenient for partial matches
        lengthRatio: 0.7 // Songs can vary more in length
      }
    };
  }

  static getInstance(): SimilarityService {
    if (!SimilarityService.instance) {
      SimilarityService.instance = new SimilarityService();
    }
    return SimilarityService.instance;
  }

  /**
   * Calculate comprehensive similarity between two names with type-specific logic
   */
  calculateSimilarity(name1: string, name2: string, type: 'band' | 'song' = 'band'): SimilarityScores {
    try {
      // Get basic phonetic similarity
      const phoneticMatch = phoneticMatchingService.calculateSimilarity(name1, name2);
      
      // Get configuration for the specific type
      const typeConfig = this.config[type];
      
      // Determine match type based on thresholds
      let matchType: SimilarityScores['matchType'] = 'none';
      if (phoneticMatch.similarity >= typeConfig.exactThreshold) {
        matchType = 'exact';
      } else if (phoneticMatch.phoneticSimilarity >= typeConfig.phoneticThreshold) {
        matchType = 'phonetic';
      } else if (phoneticMatch.similarity >= typeConfig.partialThreshold) {
        matchType = 'partial';
      } else if (phoneticMatch.similarity > 0.3) {
        matchType = 'fuzzy';
      }
      
      // Calculate confidence based on match quality and type-specific logic
      let confidence = phoneticMatch.confidence;
      
      // Apply type-specific adjustments
      if (type === 'band') {
        // For bands, penalize single-word matches unless they're very unique
        const name1Words = name1.trim().split(/\s+/);
        const name2Words = name2.trim().split(/\s+/);
        
        if (name1Words.length === 1 && name2Words.length === 1) {
          if (name1Words[0].length < 8 && name1Words[0] !== name2Words[0]) {
            confidence *= 0.7; // Reduce confidence for short single-word matches
          }
        }
        
        // Check length ratio for bands
        const lengthRatio = Math.min(name1.length, name2.length) / Math.max(name1.length, name2.length);
        if (lengthRatio < typeConfig.lengthRatio) {
          confidence *= 0.8;
        }
      } else {
        // For songs, be more lenient with title variations
        // Songs often have similar titles but by different artists
        if (matchType === 'exact') {
          confidence = Math.max(confidence, 0.95);
        }
      }
      
      const result: SimilarityScores = {
        overallSimilarity: phoneticMatch.similarity,
        phoneticSimilarity: phoneticMatch.phoneticSimilarity,
        editDistance: phoneticMatch.editDistance,
        tokenSimilarity: phoneticMatch.tokenSimilarity,
        confidence,
        matchType,
        normalizedNames: {
          original: `${name1} | ${name2}`,
          normalized: `${phoneticMatch.similarity.toFixed(3)} (${matchType})`
        }
      };
      
      return result;
    } catch (error) {
      secureLog.error('Similarity calculation error:', error);
      return {
        overallSimilarity: 0,
        phoneticSimilarity: 0,
        editDistance: Math.max(name1.length, name2.length),
        tokenSimilarity: 0,
        confidence: 0,
        matchType: 'none',
        normalizedNames: {
          original: `${name1} | ${name2}`,
          normalized: 'error'
        }
      };
    }
  }

  /**
   * Enhanced similarity check with type-specific business logic
   * Replicates the logic from the original nameVerifier.ts
   */
  isCloseMatch(searchName: string, candidateName: string, type: 'band' | 'song'): boolean {
    const searchNormalized = searchName.toLowerCase().trim();
    const candidateNormalized = candidateName.toLowerCase().trim();
    
    if (type === 'band') {
      // BAND LOGIC: Stricter - band names should be unique
      // Ignore single-word results unless they're the exact search or long/unique words
      if (candidateNormalized.split(' ').length === 1 && 
          candidateNormalized.length < 8 && 
          candidateNormalized !== searchNormalized) {
        return false;
      }
      
      // For bands: exact match or very close similarity required
      const isExact = candidateNormalized === searchNormalized;
      if (isExact) return true;
      
      const similarity = this.calculateSimilarity(candidateNormalized, searchNormalized, 'band');
      const lengthRatio = Math.min(candidateNormalized.length, searchNormalized.length) / 
                          Math.max(candidateNormalized.length, searchNormalized.length);
      
      return similarity.overallSimilarity > 0.9 && lengthRatio > 0.8;
    } else {
      // SONG LOGIC: More lenient - multiple songs can have same title
      // Only flag if exact match or very similar with same/similar artist
      const isExact = candidateNormalized === searchNormalized;
      
      // For songs, we're more lenient since many songs can share titles
      // Only consider it taken if it's an exact match
      return isExact;
    }
  }

  /**
   * Batch similarity calculation for multiple candidates
   */
  calculateBatchSimilarity(
    searchName: string, 
    candidates: string[], 
    type: 'band' | 'song' = 'band'
  ): Array<{name: string, similarity: SimilarityScores}> {
    return candidates.map(candidate => ({
      name: candidate,
      similarity: this.calculateSimilarity(searchName, candidate, type)
    }));
  }

  /**
   * Find best matches from platform results
   */
  findBestMatches(
    searchName: string, 
    matches: PlatformMatch[], 
    type: 'band' | 'song',
    limit: number = 5
  ): PlatformMatch[] {
    return matches
      .map(match => ({
        ...match,
        similarity: this.calculateSimilarity(searchName, match.name, type).overallSimilarity
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  /**
   * Get thresholds for the specified type
   */
  getThresholds(type: 'band' | 'song'): SimilarityConfig['band'] | SimilarityConfig['song'] {
    return this.config[type];
  }

  /**
   * Update configuration (for testing or fine-tuning)
   */
  updateConfig(config: Partial<SimilarityConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Legacy method for backward compatibility
   * Matches the original calculateSimilarity from nameVerifier.ts
   */
  calculateLegacySimilarity(str1: string, str2: string): number {
    const phoneticMatch = phoneticMatchingService.calculateSimilarity(str1, str2);
    return phoneticMatch.similarity;
  }
}