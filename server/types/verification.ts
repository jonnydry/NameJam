/**
 * Comprehensive TypeScript interfaces for the name verification pipeline system
 * These interfaces provide type safety and structure for the modular verification architecture
 */

import type { VerificationResult } from "@shared/schema";

/**
 * Input context for name verification
 */
export interface VerificationContext {
  name: string;
  type: 'band' | 'song';
  cacheEnabled?: boolean;
  maxCacheAge?: number;
  platforms?: string[];
  skipEasterEggs?: boolean;
  skipFamousArtists?: boolean;
}

/**
 * Individual match from any platform
 */
export interface PlatformMatch {
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
  similarity: number; // 0-1 similarity score to search term
  phoneticSimilarity: number; // 0-1 phonetic similarity score
  isExactMatch: boolean;
  matchType: 'exact' | 'phonetic' | 'partial' | 'fuzzy' | 'none';
  source: 'spotify' | 'itunes' | 'soundcloud' | 'bandcamp' | 'lastfm' | 'musicbrainz' | 'famous' | 'other';
}

/**
 * Normalized evidence from each platform
 */
export interface PlatformEvidence {
  platform: string;
  available: boolean;
  reliability: number; // 0-1 platform reliability weight
  matches: PlatformMatch[];
  exactMatches: PlatformMatch[];
  similarMatches: PlatformMatch[];
  totalResults: number;
  searchQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'failed';
  responseTime?: number;
  error?: string;
  metadata?: {
    apiVersion?: string;
    cached?: boolean;
    searchMethod?: string;
    rateLimited?: boolean;
  };
}

/**
 * Combined evidence from all platforms
 */
export interface AggregatedEvidence {
  allMatches: PlatformMatch[];
  exactMatches: PlatformMatch[];
  similarMatches: PlatformMatch[];
  platformEvidence: Record<string, PlatformEvidence>;
  totalResults: number;
  highestSimilarity: number;
  averageReliability: number;
  sourcesChecked: string[];
  sourcesSuccessful: string[];
  sourcesFailed: string[];
  aggregationQuality: 'high' | 'medium' | 'low';
}

/**
 * Similarity calculation results
 */
export interface SimilarityScores {
  overallSimilarity: number; // 0-1 combined similarity
  phoneticSimilarity: number; // 0-1 phonetic similarity
  editDistance: number; // Raw edit distance
  tokenSimilarity: number; // 0-1 token-based similarity
  semanticSimilarity?: number; // 0-1 semantic similarity (if available)
  confidence: number; // 0-1 confidence in the similarity calculation
  matchType: 'exact' | 'phonetic' | 'partial' | 'fuzzy' | 'none';
  normalizedNames: {
    original: string;
    normalized: string;
  };
}

/**
 * Name uniqueness scoring
 */
export interface UniquenessScore {
  score: number; // 0-1 uniqueness score (higher = more unique)
  factors: {
    commonWordPenalty: number; // Reduction for common words
    lengthBonus: number; // Bonus for appropriate length
    complexityBonus: number; // Bonus for complex combinations
    unusualTermBonus: number; // Bonus for unusual/technical terms
    genreRelevanceBonus: number; // Bonus for genre-appropriate terms
  };
  wordAnalysis: {
    totalWords: number;
    commonWords: string[];
    unusualWords: string[];
    technicalTerms: string[];
    genreTerms: string[];
  };
  recommendation: 'very-unique' | 'unique' | 'somewhat-unique' | 'common' | 'very-common';
}

/**
 * Intermediate decision before building final result
 */
export interface Decision {
  status: 'taken' | 'similar' | 'available' | 'uncertain';
  confidence: number; // 0-1 confidence score
  confidenceLevel: 'very-high' | 'high' | 'medium' | 'low' | 'very-low';
  primaryReason: DecisionReason;
  contributingFactors: DecisionFactor[];
  recommendedAction: 'avoid' | 'consider-alternatives' | 'proceed-with-caution' | 'safe-to-use';
  cacheTTL: number; // Recommended cache TTL in seconds
  metadata: {
    decisionTime: Date;
    evidenceQuality: 'high' | 'medium' | 'low';
    algorithmVersion: string;
    platforms: string[];
  };
}

/**
 * Reasons for verification decisions
 */
export type DecisionReason = 
  | 'exact-match-found'
  | 'similar-match-found'
  | 'famous-artist-match'
  | 'easter-egg-detected'
  | 'no-matches-found'
  | 'insufficient-evidence'
  | 'platform-unavailable'
  | 'verification-error';

/**
 * Contributing factors to decisions
 */
export interface DecisionFactor {
  type: 'platform-match' | 'similarity-score' | 'popularity-score' | 'uniqueness-score' | 'cache-hit' | 'famous-match' | 'easter-egg';
  weight: number; // 0-1 weight of this factor
  value: number; // 0-1 normalized value
  description: string;
  source?: string;
}

/**
 * Standardized verification errors
 */
export interface VerificationError {
  code: 'PLATFORM_TIMEOUT' | 'PLATFORM_ERROR' | 'RATE_LIMITED' | 'INVALID_INPUT' | 'CACHE_ERROR' | 'UNKNOWN_ERROR';
  message: string;
  platform?: string;
  originalError?: Error;
  retryable: boolean;
  timestamp: Date;
  context?: {
    name?: string;
    type?: string;
    platform?: string;
    requestId?: string;
  };
}

/**
 * Pipeline step interface
 */
export interface PipelineStep {
  name: string;
  execute<T, U>(input: T): Promise<U>;
  canShortCircuit?: boolean;
  priority?: number;
}

/**
 * Platform verifier interface
 */
export interface IPlatformVerifier {
  platformName: string;
  reliability: number;
  isAvailable(): Promise<boolean>;
  verify(name: string, type: 'band' | 'song'): Promise<PlatformEvidence>;
}

/**
 * Cache configuration for different decision types
 */
export interface CacheConfig {
  taken: number; // TTL for taken results
  similar: number; // TTL for similar results  
  available: number; // TTL for available results
  easterEgg: number; // TTL for easter eggs (usually 0)
  famousArtist: number; // TTL for famous artist results
  error: number; // TTL for error results
}

/**
 * Verification pipeline configuration
 */
export interface PipelineConfig {
  cache: CacheConfig;
  platforms: {
    enabled: string[];
    weights: Record<string, number>;
    timeouts: Record<string, number>;
  };
  similarity: {
    exactThreshold: number;
    phoneticThreshold: number;
    partialThreshold: number;
  };
  confidence: {
    minConfidence: number;
    highConfidenceThreshold: number;
    uncertaintyThreshold: number;
  };
  concurrency: {
    maxPlatforms: number;
    maxRetries: number;
    backoffMultiplier: number;
  };
}

/**
 * Verification pipeline interface
 */
export interface IVerificationPipeline {
  verify(context: VerificationContext): Promise<VerificationResult>;
  validateContext(context: VerificationContext): VerificationError | null;
  getConfig(): PipelineConfig;
  updateConfig(config: Partial<PipelineConfig>): void;
}

/**
 * Result builder interface
 */
export interface IResultBuilder {
  buildResult(
    context: VerificationContext,
    decision: Decision,
    evidence: AggregatedEvidence,
    similarNames?: string[],
    verificationLinks?: Array<{name: string, url: string, source: string}>
  ): VerificationResult;
}

/**
 * Evidence aggregator interface
 */
export interface IEvidenceAggregator {
  aggregate(platformEvidence: Record<string, PlatformEvidence>): AggregatedEvidence;
  deduplicateMatches(matches: PlatformMatch[]): PlatformMatch[];
  calculateAggregationQuality(evidence: Record<string, PlatformEvidence>): 'high' | 'medium' | 'low';
}

/**
 * Decision engine interface
 */
export interface IDecisionEngine {
  decide(
    context: VerificationContext,
    evidence: AggregatedEvidence,
    similarityScores?: SimilarityScores,
    uniquenessScore?: UniquenessScore
  ): Promise<Decision>;
  calculateConfidence(evidence: AggregatedEvidence, context: VerificationContext): number;
  determineRecommendedAction(decision: Decision): Decision['recommendedAction'];
}