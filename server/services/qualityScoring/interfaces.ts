/**
 * Type definitions and interfaces for the Quality Scoring Service
 */

// Common scoring interfaces
export interface QualityScore {
  overall: number;        // Overall score 0-1 (weighted average)
  breakdown: ScoreBreakdown;
  metadata: ScoreMetadata;
}

export interface ScoreBreakdown {
  creativity: number;     // 0-1: Originality and creative elements
  appropriateness: number; // 0-1: Genre/context appropriateness  
  quality: number;        // 0-1: Technical quality (grammar, flow)
  memorability: number;   // 0-1: Impact and memorability
  uniqueness: number;     // 0-1: Avoids clichés and common phrases
  structure: number;      // 0-1: Appropriate length/structure
}

export interface ScoreMetadata {
  scoringTime: number;    // Time taken to score (ms)
  algorithm: string;      // Scoring algorithm used
  version: string;        // Algorithm version
  warnings: string[];     // Any scoring warnings or notes
  confidence: number;     // Confidence in the scoring (0-1)
}

// Name-specific interfaces
export interface NameScoringRequest {
  name: string;
  type: 'band' | 'song';
  genre?: string;
  mood?: string;
  isAiGenerated: boolean;
  wordCount?: number;
}

export interface NameQualityResult {
  name: string;
  score: QualityScore;
  passesThreshold: boolean;
  recommendations?: string[];
}

// Lyric-specific interfaces
export interface LyricScoringRequest {
  lyric: string;
  genre?: string;
  songSection?: string;
  model?: string;
  targetLength?: 'short' | 'medium' | 'long' | 'couplet';
}

export interface LyricQualityResult {
  lyric: string;
  score: QualityScore;
  passesThreshold: boolean;
  recommendations?: string[];
}

// Batch scoring interfaces
export interface NameBatchScoringRequest {
  names: NameScoringRequest[];
  thresholdMode: 'strict' | 'moderate' | 'lenient' | 'custom';
  customThreshold?: number;
  maxResults?: number;
}

export interface LyricBatchScoringRequest {
  lyrics: LyricScoringRequest[];
  thresholdMode: 'strict' | 'moderate' | 'lenient' | 'custom';
  customThreshold?: number;
  maxResults?: number;
}

export interface BatchScoringResult<T> {
  results: T[];
  filtered: T[];           // Results that pass threshold
  analytics: BatchAnalytics;
}

export interface BatchAnalytics {
  totalProcessed: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passedThreshold: number;
  processingTime: number;
  distribution: ScoreDistribution;
}

export interface ScoreDistribution {
  excellent: number;       // 0.8-1.0
  good: number;           // 0.6-0.8
  fair: number;           // 0.4-0.6
  poor: number;           // 0.2-0.4
  veryPoor: number;       // 0.0-0.2
}

// Configuration interfaces
export interface ScoringWeights {
  creativity: number;
  appropriateness: number;
  quality: number;
  memorability: number;
  uniqueness: number;
  structure: number;
}

export interface QualityThresholds {
  strict: number;         // 0.75+ for high-quality content
  moderate: number;       // 0.60+ for good content
  lenient: number;        // 0.45+ for acceptable content
  emergency: number;      // 0.30+ for fallback when few results
}

export interface GenreAdjustments {
  [genre: string]: {
    weights: Partial<ScoringWeights>;
    bonuses: {
      keywords: string[];
      keywordBonus: number;
      styleElements: string[];
      styleBonus: number;
    };
  };
}

// Analytics and tracking interfaces
export interface QualityAnalytics {
  totalScored: number;
  averageScores: {
    names: number;
    lyrics: number;
  };
  thresholdRates: {
    strict: number;
    moderate: number;
    lenient: number;
  };
  genrePerformance: Map<string, number>;
  timeMetrics: {
    averageNamingTime: number;
    averageLyricTime: number;
  };
  qualityTrends: QualityTrend[];
}

export interface QualityTrend {
  timestamp: number;
  averageScore: number;
  category: 'names' | 'lyrics';
  genre?: string;
}

// Service response interfaces
export interface QualityScoringServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  analytics?: Partial<BatchAnalytics>;
}

// Exception classes
export class QualityScoringError extends Error {
  code: 'SCORING_ERROR' | 'THRESHOLD_ERROR' | 'CONFIG_ERROR' | 'PERFORMANCE_ERROR';
  context: string;
  
  constructor(message: string, code: QualityScoringError['code'], context: string) {
    super(message);
    this.name = 'QualityScoringError';
    this.code = code;
    this.context = context;
  }
}

// Utility types
export type ScoringMode = 'names' | 'lyrics' | 'both';
export type ThresholdMode = 'strict' | 'moderate' | 'lenient' | 'custom' | 'emergency';
export type ScoringAlgorithm = 'heuristic_v1' | 'weighted_v1' | 'genre_adjusted_v1';