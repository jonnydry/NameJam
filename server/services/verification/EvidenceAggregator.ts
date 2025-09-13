/**
 * EvidenceAggregator - Combines and deduplicates evidence from multiple platforms
 * Implements intelligent matching and quality scoring for aggregated results
 */

import { SimilarityService } from './SimilarityService';
import { secureLog } from '../../utils/secureLogger';
import type { 
  IEvidenceAggregator, 
  PlatformEvidence, 
  PlatformMatch, 
  AggregatedEvidence 
} from '../../types/verification';

export interface AggregationConfig {
  duplicateThreshold: number; // Similarity threshold for duplicate detection
  minSimilarityForMerge: number; // Minimum similarity to merge matches
  qualityWeights: {
    exactMatches: number;
    platformReliability: number;
    responseTime: number;
    totalResults: number;
  };
  maxMatches: number; // Maximum matches to return per category
}

export class EvidenceAggregator implements IEvidenceAggregator {
  private static instance: EvidenceAggregator;
  private similarityService: SimilarityService;
  private config: AggregationConfig;

  private constructor() {
    this.similarityService = SimilarityService.getInstance();
    this.config = {
      duplicateThreshold: 0.85, // 85% similarity considered duplicate
      minSimilarityForMerge: 0.75, // 75% similarity required for merging
      qualityWeights: {
        exactMatches: 0.4,
        platformReliability: 0.3,
        responseTime: 0.15,
        totalResults: 0.15
      },
      maxMatches: 20 // Keep top 20 matches per category
    };
  }

  static getInstance(): EvidenceAggregator {
    if (!EvidenceAggregator.instance) {
      EvidenceAggregator.instance = new EvidenceAggregator();
    }
    return EvidenceAggregator.instance;
  }

  /**
   * Aggregate evidence from multiple platforms
   */
  aggregate(platformEvidence: Record<string, PlatformEvidence>): AggregatedEvidence {
    try {
      const allMatches: PlatformMatch[] = [];
      const sourcesChecked: string[] = [];
      const sourcesSuccessful: string[] = [];
      const sourcesFailed: string[] = [];
      let totalResults = 0;
      let totalReliability = 0;
      let reliabilityCount = 0;

      // Collect all matches and metadata from platforms
      Object.entries(platformEvidence).forEach(([platform, evidence]) => {
        sourcesChecked.push(platform);
        
        if (evidence.error || !evidence.available) {
          sourcesFailed.push(platform);
        } else {
          sourcesSuccessful.push(platform);
          allMatches.push(...evidence.matches);
          totalResults += evidence.totalResults;
          totalReliability += evidence.reliability;
          reliabilityCount++;
        }
      });

      // Calculate average reliability
      const averageReliability = reliabilityCount > 0 
        ? totalReliability / reliabilityCount 
        : 0;

      // Deduplicate matches intelligently
      const deduplicatedMatches = this.deduplicateMatches(allMatches);

      // Sort matches by quality (similarity, reliability, popularity)
      const sortedMatches = this.sortMatchesByQuality(deduplicatedMatches, platformEvidence);

      // Categorize matches
      const exactMatches = sortedMatches.filter(match => match.isExactMatch || match.similarity >= 0.95);
      const similarMatches = sortedMatches.filter(match => 
        !match.isExactMatch && 
        match.similarity >= 0.75 && 
        match.similarity < 0.95
      );

      // Limit results to prevent overwhelming response
      const limitedExactMatches = exactMatches.slice(0, this.config.maxMatches);
      const limitedSimilarMatches = similarMatches.slice(0, this.config.maxMatches);
      const limitedAllMatches = sortedMatches.slice(0, this.config.maxMatches * 2);

      // Calculate highest similarity
      const highestSimilarity = sortedMatches.length > 0 
        ? Math.max(...sortedMatches.map(m => m.similarity))
        : 0;

      // Determine aggregation quality
      const aggregationQuality = this.calculateAggregationQuality(platformEvidence);

      const result: AggregatedEvidence = {
        allMatches: limitedAllMatches,
        exactMatches: limitedExactMatches,
        similarMatches: limitedSimilarMatches,
        platformEvidence,
        totalResults,
        highestSimilarity,
        averageReliability,
        sourcesChecked,
        sourcesSuccessful,
        sourcesFailed,
        aggregationQuality
      };

      secureLog.debug('Evidence aggregated', {
        totalMatches: allMatches.length,
        deduplicatedMatches: deduplicatedMatches.length,
        exactMatches: limitedExactMatches.length,
        similarMatches: limitedSimilarMatches.length,
        sourcesSuccessful: sourcesSuccessful.length,
        sourcesFailed: sourcesFailed.length,
        averageReliability,
        highestSimilarity
      });

      return result;

    } catch (error) {
      secureLog.error('Evidence aggregation failed:', error);
      
      // Return empty evidence on error
      return {
        allMatches: [],
        exactMatches: [],
        similarMatches: [],
        platformEvidence,
        totalResults: 0,
        highestSimilarity: 0,
        averageReliability: 0,
        sourcesChecked: Object.keys(platformEvidence),
        sourcesSuccessful: [],
        sourcesFailed: Object.keys(platformEvidence),
        aggregationQuality: 'low'
      };
    }
  }

  /**
   * Intelligent deduplication of matches across platforms
   */
  deduplicateMatches(matches: PlatformMatch[]): PlatformMatch[] {
    if (matches.length === 0) return [];

    const deduplicated: PlatformMatch[] = [];
    const processed = new Set<string>();

    // Sort by quality first (higher similarity, higher reliability platforms)
    const sortedMatches = matches.sort((a, b) => {
      const aReliability = this.getPlatformReliability(a.source);
      const bReliability = this.getPlatformReliability(b.source);
      
      // Primary sort: similarity
      if (Math.abs(a.similarity - b.similarity) > 0.05) {
        return b.similarity - a.similarity;
      }
      
      // Secondary sort: platform reliability
      return bReliability - aReliability;
    });

    for (const match of sortedMatches) {
      let isDuplicate = false;
      const matchKey = this.createMatchKey(match);

      // Check if we've already processed a very similar match
      for (const existing of deduplicated) {
        const similarity = this.similarityService.calculateSimilarity(
          matchKey, 
          this.createMatchKey(existing)
        );

        if (similarity.overallSimilarity >= this.config.duplicateThreshold) {
          isDuplicate = true;
          
          // If this match is from a more reliable platform or has better data, merge it
          if (this.shouldMergeMatch(match, existing)) {
            const mergedMatch = this.mergeMatches(existing, match);
            const existingIndex = deduplicated.indexOf(existing);
            deduplicated[existingIndex] = mergedMatch;
          }
          break;
        }
      }

      if (!isDuplicate && !processed.has(matchKey)) {
        deduplicated.push(match);
        processed.add(matchKey);
      }
    }

    return deduplicated;
  }

  /**
   * Calculate overall aggregation quality based on platform evidence
   */
  calculateAggregationQuality(evidence: Record<string, PlatformEvidence>): 'high' | 'medium' | 'low' {
    const platforms = Object.values(evidence);
    const successfulPlatforms = platforms.filter(p => p.available && !p.error);
    const highQualityPlatforms = successfulPlatforms.filter(p => p.searchQuality === 'excellent' || p.searchQuality === 'good');
    
    const successRate = platforms.length > 0 ? successfulPlatforms.length / platforms.length : 0;
    const qualityRate = platforms.length > 0 ? highQualityPlatforms.length / platforms.length : 0;
    const avgReliability = successfulPlatforms.length > 0 
      ? successfulPlatforms.reduce((sum, p) => sum + p.reliability, 0) / successfulPlatforms.length
      : 0;

    // High quality: Most platforms successful, good search quality, high reliability
    if (successRate >= 0.75 && qualityRate >= 0.5 && avgReliability >= 0.8) {
      return 'high';
    }
    
    // Medium quality: Some platforms successful, decent quality
    if (successRate >= 0.5 && (qualityRate >= 0.3 || avgReliability >= 0.6)) {
      return 'medium';
    }
    
    // Low quality: Few platforms successful or poor search quality
    return 'low';
  }

  /**
   * Sort matches by overall quality score
   */
  private sortMatchesByQuality(
    matches: PlatformMatch[], 
    platformEvidence: Record<string, PlatformEvidence>
  ): PlatformMatch[] {
    return matches.sort((a, b) => {
      const scoreA = this.calculateMatchQualityScore(a, platformEvidence);
      const scoreB = this.calculateMatchQualityScore(b, platformEvidence);
      return scoreB - scoreA;
    });
  }

  /**
   * Calculate quality score for a match
   */
  private calculateMatchQualityScore(
    match: PlatformMatch, 
    platformEvidence: Record<string, PlatformEvidence>
  ): number {
    const weights = this.config.qualityWeights;
    let score = 0;

    // Similarity score (most important)
    score += match.similarity * 0.4;

    // Platform reliability
    const platformReliability = this.getPlatformReliability(match.source);
    score += platformReliability * weights.platformReliability;

    // Popularity/engagement bonus
    if (match.popularity) {
      score += Math.min(match.popularity / 100, 0.2); // Max 0.2 bonus
    }
    if (match.followers) {
      score += Math.min(Math.log10(match.followers) / 10, 0.1); // Logarithmic follower bonus
    }

    // Exact match bonus
    if (match.isExactMatch) {
      score += 0.3;
    }

    // Penalize very old content (for songs/tracks)
    if (match.releaseDate) {
      const releaseYear = new Date(match.releaseDate).getFullYear();
      const currentYear = new Date().getFullYear();
      const agePenalty = Math.max(0, (currentYear - releaseYear - 5) * 0.01); // Penalty for releases older than 5 years
      score -= Math.min(agePenalty, 0.1);
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Create a key for match deduplication
   */
  private createMatchKey(match: PlatformMatch): string {
    const name = match.name.toLowerCase().trim();
    const artist = match.artist?.toLowerCase().trim() || '';
    return `${name}|${artist}`;
  }

  /**
   * Determine if a new match should replace/merge with existing match
   */
  private shouldMergeMatch(newMatch: PlatformMatch, existingMatch: PlatformMatch): boolean {
    const newReliability = this.getPlatformReliability(newMatch.source);
    const existingReliability = this.getPlatformReliability(existingMatch.source);
    
    // Merge if new platform is more reliable
    if (newReliability > existingReliability + 0.1) return true;
    
    // Merge if new match has significantly better data
    if (newMatch.popularity && !existingMatch.popularity) return true;
    if (newMatch.followers && !existingMatch.followers) return true;
    if (newMatch.url && !existingMatch.url) return true;
    
    return false;
  }

  /**
   * Merge two similar matches, combining the best data from each
   */
  private mergeMatches(existing: PlatformMatch, newMatch: PlatformMatch): PlatformMatch {
    return {
      ...existing,
      // Use more reliable source
      source: this.getPlatformReliability(newMatch.source) > this.getPlatformReliability(existing.source) 
        ? newMatch.source : existing.source,
      // Take best available data
      popularity: newMatch.popularity || existing.popularity,
      followers: newMatch.followers || existing.followers,
      genres: [...(existing.genres || []), ...(newMatch.genres || [])].filter((v, i, a) => a.indexOf(v) === i),
      url: newMatch.url || existing.url,
      imageUrl: newMatch.imageUrl || existing.imageUrl,
      preview: newMatch.preview || existing.preview,
      // Use higher similarity
      similarity: Math.max(existing.similarity, newMatch.similarity),
      phoneticSimilarity: Math.max(existing.phoneticSimilarity, newMatch.phoneticSimilarity),
      // Exact match if either is exact
      isExactMatch: existing.isExactMatch || newMatch.isExactMatch
    };
  }

  /**
   * Get platform reliability score
   */
  private getPlatformReliability(source: string): number {
    const reliabilityMap: Record<string, number> = {
      spotify: 1.0,
      itunes: 0.9,
      bandcamp: 0.8,
      lastfm: 0.8,
      soundcloud: 0.7,
      musicbrainz: 0.7,
      famous: 0.9
    };
    return reliabilityMap[source] || 0.5;
  }

  /**
   * Get configuration for testing/tuning
   */
  getConfig(): AggregationConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AggregationConfig>): void {
    this.config = { ...this.config, ...config };
  }
}