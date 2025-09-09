/**
 * Confidence Calculator Service
 * Calculates confidence scores for name verification results
 * Factors in source reliability, match strength, popularity, and result count
 */

import { phoneticMatchingService } from './phoneticMatchingService';
import { secureLog } from '../utils/secureLogger';

export interface ConfidenceFactors {
  exactMatch: boolean;
  phoneticSimilarity: number;
  sourceReliability: number;
  popularityScore: number;
  resultCount: number;
  matchQuality: 'exact' | 'phonetic' | 'partial' | 'none';
}

export interface ConfidenceResult {
  confidence: number; // 0-1 score
  confidenceLevel: 'very-high' | 'high' | 'medium' | 'low' | 'very-low';
  explanation: string;
  factors: ConfidenceFactors;
}

export class ConfidenceCalculatorService {
  private static instance: ConfidenceCalculatorService;

  static getInstance(): ConfidenceCalculatorService {
    if (!ConfidenceCalculatorService.instance) {
      ConfidenceCalculatorService.instance = new ConfidenceCalculatorService();
    }
    return ConfidenceCalculatorService.instance;
  }

  // Source reliability weights (higher = more reliable)
  private readonly sourceWeights = {
    spotify: 1.0,        // Most reliable - official streaming platform
    itunes: 0.9,         // Apple Music - major platform, comprehensive catalog
    soundcloud: 0.7,     // Good for emerging/independent artists
    bandcamp: 0.8,       // High reliability for indie/underground music
    lastfm: 0.8,         // Good community data
    musicbrainz: 0.7,    // Good metadata but less complete
    famous: 0.9,         // Known famous artists database
    similar: 0.6         // Similarity matches
  };

  calculateAvailabilityConfidence(
    searchName: string,
    spotifyResults?: any,
    lastfmResults?: any,
    musicbrainzResults?: any,
    famousMatches?: string[],
    itunesResults?: any,
    soundcloudResults?: any,
    bandcampResults?: any
  ): ConfidenceResult {
    try {
      // Initialize factors
      const factors: ConfidenceFactors = {
        exactMatch: false,
        phoneticSimilarity: 0,
        sourceReliability: 0,
        popularityScore: 0,
        resultCount: 0,
        matchQuality: 'none'
      };

      let confidence = 0;
      let explanation = '';
      let totalWeight = 0;

      // Check Spotify results (highest priority)
      if (spotifyResults && spotifyResults.exists) {
        const match = spotifyResults.matches[0];
        const similarity = phoneticMatchingService.calculateSimilarity(searchName, match.name);
        
        factors.exactMatch = similarity.similarity > 0.95;
        factors.phoneticSimilarity = Math.max(factors.phoneticSimilarity, similarity.phoneticSimilarity);
        factors.popularityScore = Math.max(factors.popularityScore, match.popularity || 0);
        factors.resultCount += spotifyResults.matches.length;
        factors.sourceReliability = Math.max(factors.sourceReliability, this.sourceWeights.spotify);

        if (factors.exactMatch) {
          factors.matchQuality = 'exact';
          confidence += 0.9 * this.sourceWeights.spotify;
          explanation = `Found exact match on Spotify: "${match.name}" with ${match.popularity || 0}% popularity`;
        } else if (similarity.phoneticSimilarity > 0.8) {
          factors.matchQuality = 'phonetic';
          confidence += 0.7 * this.sourceWeights.spotify;
          explanation = `Found similar-sounding match on Spotify: "${match.name}" (${Math.round(similarity.similarity * 100)}% similar)`;
        } else {
          factors.matchQuality = 'partial';
          confidence += 0.5 * this.sourceWeights.spotify;
          explanation = `Found related match on Spotify: "${match.name}"`;
        }
        totalWeight += this.sourceWeights.spotify;
      }

      // Check famous artists database
      if (famousMatches && famousMatches.length > 0) {
        const bestMatch = famousMatches[0];
        const similarity = phoneticMatchingService.calculateSimilarity(searchName, bestMatch);
        
        factors.exactMatch = factors.exactMatch || similarity.similarity > 0.95;
        factors.phoneticSimilarity = Math.max(factors.phoneticSimilarity, similarity.phoneticSimilarity);
        factors.resultCount += famousMatches.length;
        factors.sourceReliability = Math.max(factors.sourceReliability, this.sourceWeights.famous);

        if (similarity.similarity > 0.95) {
          confidence += 0.85 * this.sourceWeights.famous;
          if (!explanation) {
            explanation = `Found exact match in famous artists database: "${bestMatch}"`;
          }
        } else if (similarity.phoneticSimilarity > 0.8) {
          confidence += 0.6 * this.sourceWeights.famous;
          if (!explanation) {
            explanation = `Found similar famous artist: "${bestMatch}" (${Math.round(similarity.similarity * 100)}% similar)`;
          }
        }
        totalWeight += this.sourceWeights.famous;
      }

      // Check iTunes/Apple Music results
      if (itunesResults && itunesResults.exists) {
        const match = itunesResults.matches[0];
        const similarity = phoneticMatchingService.calculateSimilarity(searchName, match.name);
        
        factors.exactMatch = factors.exactMatch || similarity.similarity > 0.95;
        factors.phoneticSimilarity = Math.max(factors.phoneticSimilarity, similarity.phoneticSimilarity);
        factors.resultCount += itunesResults.matches.length;
        factors.sourceReliability = Math.max(factors.sourceReliability, this.sourceWeights.itunes);

        if (similarity.similarity > 0.95) {
          confidence += 0.8 * this.sourceWeights.itunes;
          if (!explanation) {
            explanation = `Found exact match on Apple Music: "${match.name}"`;
          }
        } else if (similarity.phoneticSimilarity > 0.8) {
          confidence += 0.6 * this.sourceWeights.itunes;
          if (!explanation) {
            explanation = `Found similar match on Apple Music: "${match.name}"`;
          }
        }
        totalWeight += this.sourceWeights.itunes;
      }

      // Check SoundCloud results
      if (soundcloudResults && soundcloudResults.exists) {
        const match = soundcloudResults.matches[0];
        const similarity = phoneticMatchingService.calculateSimilarity(searchName, match.name || match.username);
        
        factors.phoneticSimilarity = Math.max(factors.phoneticSimilarity, similarity.phoneticSimilarity);
        factors.resultCount += soundcloudResults.matches.length;
        factors.sourceReliability = Math.max(factors.sourceReliability, this.sourceWeights.soundcloud);

        if (similarity.similarity > 0.95 && !factors.exactMatch) {
          confidence += 0.6 * this.sourceWeights.soundcloud;
          if (!explanation) {
            explanation = `Found exact match on SoundCloud: "${match.name || match.username}"`;
          }
        } else if (similarity.phoneticSimilarity > 0.8 && factors.matchQuality === 'none') {
          confidence += 0.4 * this.sourceWeights.soundcloud;
          if (!explanation) {
            explanation = `Found similar match on SoundCloud: "${match.name || match.username}"`;
          }
        }
        totalWeight += this.sourceWeights.soundcloud;
      }

      // Check Bandcamp results
      if (bandcampResults && bandcampResults.exists) {
        const match = bandcampResults.matches[0];
        const similarity = phoneticMatchingService.calculateSimilarity(searchName, match.name);
        
        factors.phoneticSimilarity = Math.max(factors.phoneticSimilarity, similarity.phoneticSimilarity);
        factors.resultCount += bandcampResults.matches.length;
        factors.sourceReliability = Math.max(factors.sourceReliability, this.sourceWeights.bandcamp);

        if (similarity.similarity > 0.95 && !factors.exactMatch) {
          confidence += 0.7 * this.sourceWeights.bandcamp;
          if (!explanation) {
            explanation = `Found exact match on Bandcamp: "${match.name}"`;
          }
        } else if (similarity.phoneticSimilarity > 0.8 && factors.matchQuality === 'none') {
          confidence += 0.5 * this.sourceWeights.bandcamp;
          if (!explanation) {
            explanation = `Found similar match on Bandcamp: "${match.name}"`;
          }
        }
        totalWeight += this.sourceWeights.bandcamp;
      }

      // Check Last.fm results
      if (lastfmResults && lastfmResults.length > 0) {
        const bestMatch = lastfmResults[0];
        const similarity = phoneticMatchingService.calculateSimilarity(searchName, bestMatch.name);
        
        factors.phoneticSimilarity = Math.max(factors.phoneticSimilarity, similarity.phoneticSimilarity);
        factors.resultCount += lastfmResults.length;
        factors.sourceReliability = Math.max(factors.sourceReliability, this.sourceWeights.lastfm);

        if (similarity.similarity > 0.95 && !factors.exactMatch) {
          confidence += 0.7 * this.sourceWeights.lastfm;
          if (!explanation) {
            explanation = `Found exact match on Last.fm: "${bestMatch.name}"`;
          }
        } else if (similarity.phoneticSimilarity > 0.8 && factors.matchQuality === 'none') {
          confidence += 0.5 * this.sourceWeights.lastfm;
          if (!explanation) {
            explanation = `Found similar match on Last.fm: "${bestMatch.name}"`;
          }
        }
        totalWeight += this.sourceWeights.lastfm;
      }

      // If no matches found, high confidence it's available
      if (totalWeight === 0) {
        confidence = 0.9;
        explanation = 'No matches found across multiple music databases - highly likely available';
        factors.matchQuality = 'none';
      } else {
        // Normalize confidence by total weight
        confidence = Math.min(confidence / Math.max(totalWeight, 1), 1);
      }

      // Adjust confidence based on result count (more results = higher confidence)
      if (factors.resultCount > 3) {
        confidence = Math.min(confidence + 0.1, 1);
        explanation += ` (found ${factors.resultCount} total matches)`;
      }

      // Determine confidence level
      const confidenceLevel = this.getConfidenceLevel(confidence);

      // For taken names, invert confidence (high confidence = high confidence it's taken)
      // For available names, keep confidence as-is (high confidence = high confidence it's available)
      const finalConfidence = factors.matchQuality !== 'none' ? confidence : confidence;

      return {
        confidence: finalConfidence,
        confidenceLevel,
        explanation,
        factors
      };

    } catch (error) {
      secureLog.error('Error calculating confidence', { error: error instanceof Error ? error.message : String(error), searchName });
      return {
        confidence: 0.5,
        confidenceLevel: 'medium',
        explanation: 'Unable to calculate confidence - verification incomplete',
        factors: {
          exactMatch: false,
          phoneticSimilarity: 0,
          sourceReliability: 0,
          popularityScore: 0,
          resultCount: 0,
          matchQuality: 'none'
        }
      };
    }
  }

  private getConfidenceLevel(confidence: number): 'very-high' | 'high' | 'medium' | 'low' | 'very-low' {
    if (confidence >= 0.9) return 'very-high';
    if (confidence >= 0.75) return 'high';
    if (confidence >= 0.5) return 'medium';
    if (confidence >= 0.25) return 'low';
    return 'very-low';
  }

  /**
   * Generate user-friendly confidence explanations
   */
  generateExplanation(result: ConfidenceResult, status: 'available' | 'similar' | 'taken'): string {
    const { confidence, factors } = result;
    const percentage = Math.round(confidence * 100);

    if (status === 'available') {
      if (confidence >= 0.9) {
        return `${percentage}% confidence: No matches found across multiple music databases`;
      } else if (confidence >= 0.75) {
        return `${percentage}% confidence: Only found weak matches or unrelated results`;
      } else {
        return `${percentage}% confidence: Some similar names exist but availability unclear`;
      }
    } else if (status === 'taken') {
      if (factors.exactMatch) {
        return `${percentage}% confidence: Found exact match with ${factors.popularityScore > 50 ? 'high' : 'moderate'} popularity`;
      } else if (factors.phoneticSimilarity > 0.8) {
        return `${percentage}% confidence: Found very similar-sounding name`;
      } else {
        return `${percentage}% confidence: Found related matches`;
      }
    } else { // similar
      return `${percentage}% confidence: Found ${factors.phoneticSimilarity > 0.8 ? 'phonetically similar' : 'related'} names`;
    }
  }
}

export const confidenceCalculator = ConfidenceCalculatorService.getInstance();