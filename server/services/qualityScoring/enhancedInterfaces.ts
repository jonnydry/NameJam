/**
 * Enhanced interfaces for advanced quality scoring with cross-dimensional metrics
 * Extends existing interfaces with phonetic-semantic integration
 */

import type { 
  QualityScore as BaseQualityScore,
  ScoreBreakdown as BaseScoreBreakdown,
  ScoreMetadata as BaseScoreMetadata,
  NameScoringRequest as BaseNameScoringRequest,
  NameQualityResult as BaseNameQualityResult,
  ScoringWeights as BaseScoringWeights
} from './interfaces';

// Enhanced scoring interfaces with cross-dimensional metrics
export interface EnhancedQualityScore extends BaseQualityScore {
  overall: number;
  breakdown: EnhancedScoreBreakdown;
  metadata: EnhancedScoreMetadata;
  crossDimensional: CrossDimensionalMetrics;
  qualityVector: QualityVector;
}

export interface EnhancedScoreBreakdown extends BaseScoreBreakdown {
  // Existing dimensions (0-1)
  creativity: number;
  appropriateness: number;
  quality: number;
  memorability: number;
  uniqueness: number;
  structure: number;
  
  // New phonetic dimensions (0-1)
  phoneticFlow: number;        // How well words flow together phonetically
  pronunciation: number;       // Ease of pronunciation
  phoneticMemorability: number; // Phonetic catchiness and impact
  
  // New semantic dimensions (0-1)
  semanticCoherence: number;   // How well words work together semantically
  emotionalResonance: number;  // Emotional impact and appropriateness
  culturalAppeal: number;      // Cultural relevance and appeal
  imageAssociation: number;    // Vivid imagery and visual associations
  
  // Cross-dimensional synergy (0-1)
  phoneticSemanticAlignment: number; // How well sound matches meaning
  genreOptimization: number;         // Optimization for specific genre
  marketAppeal: number;              // Commercial/audience appeal
}

export interface EnhancedScoreMetadata extends BaseScoreMetadata {
  scoringTime: number;
  algorithm: string;
  version: string;
  warnings: string[];
  confidence: number;
  
  // Enhanced metadata
  analysisDepth: 'basic' | 'standard' | 'comprehensive';
  dimensionsAnalyzed: string[];
  crossDimensionalSynergy: number;
  qualityConsistency: number;      // How consistent quality is across dimensions
  adaptiveAdjustments: string[];   // Any adaptive adjustments made
}

export interface CrossDimensionalMetrics {
  phonetic: {
    overall: number;
    pronunciation: number;
    flow: number;
    memorability: number;
    uniqueness: number;
  };
  semantic: {
    overall: number;
    coherence: number;
    emotionalResonance: number;
    culturalAppeal: number;
    contextualFit: number;
    imagery: number;
  };
  synergy: {
    phoneticSemanticAlignment: number;
    crossDimensionalHarmony: number;
    genreOptimization: number;
    marketSynergy: number;
  };
}

export interface QualityVector {
  // Multi-dimensional quality representation for comparison and ranking
  dimensions: {
    sound: number;        // Phonetic quality aggregate
    meaning: number;      // Semantic quality aggregate
    creativity: number;   // Creative innovation
    appeal: number;       // Broad appeal and marketability
    fit: number;          // Context and genre fit
  };
  magnitude: number;      // Overall quality magnitude
  balance: number;        // How well-balanced across dimensions (0-1)
  distinctiveness: number; // How distinctive this quality profile is
}

// Enhanced request interfaces
export interface EnhancedNameScoringRequest extends BaseNameScoringRequest {
  name: string;
  type: 'band' | 'song';
  genre?: string;
  mood?: string;
  isAiGenerated: boolean;
  wordCount?: number;
  
  // Enhanced context
  targetAudience?: 'mainstream' | 'niche' | 'experimental';
  culturalContext?: string;
  marketRegion?: string;
  analysisDepth?: 'basic' | 'standard' | 'comprehensive';
  priorityDimensions?: string[]; // Which dimensions to prioritize
}

export interface EnhancedNameQualityResult extends BaseNameQualityResult {
  name: string;
  score: EnhancedQualityScore;
  passesThreshold: boolean;
  recommendations?: string[];
  
  // Enhanced results
  qualityRanking: QualityRanking;
  competitiveAnalysis?: CompetitiveAnalysis;
  improvementSuggestions?: ImprovementSuggestion[];
}

export interface QualityRanking {
  rank: 'excellent' | 'good' | 'fair' | 'poor' | 'unacceptable';
  percentile: number;
  strengthAreas: string[];
  improvementAreas: string[];
  competitiveAdvantages: string[];
  marketPosition: 'premium' | 'mainstream' | 'budget' | 'experimental';
}

export interface CompetitiveAnalysis {
  similarNames: string[];
  differentiationFactors: string[];
  marketGaps: string[];
  positioningRecommendations: string[];
}

export interface ImprovementSuggestion {
  category: 'phonetic' | 'semantic' | 'creative' | 'contextual';
  priority: 'high' | 'medium' | 'low';
  suggestion: string;
  expectedImpact: number; // Estimated score improvement (0-1)
  difficulty: 'easy' | 'medium' | 'hard';
}

// Enhanced weighting system
export interface EnhancedScoringWeights extends BaseScoringWeights {
  // Traditional weights
  creativity: number;
  appropriateness: number;
  quality: number;
  memorability: number;
  uniqueness: number;
  structure: number;
  
  // New dimensional weights
  phoneticFlow: number;
  semanticCoherence: number;
  emotionalResonance: number;
  culturalAppeal: number;
  crossDimensionalSynergy: number;
}

// Advanced configuration
export interface AdvancedScoringConfig {
  weights: EnhancedScoringWeights;
  thresholds: EnhancedQualityThresholds;
  genreSpecific: GenreSpecificConfig;
  adaptive: AdaptiveConfig;
  performance: PerformanceConfig;
}

export interface EnhancedQualityThresholds {
  // Basic thresholds
  strict: number;
  moderate: number;
  lenient: number;
  emergency: number;
  
  // Dimensional thresholds
  phoneticMinimum: number;     // Minimum acceptable phonetic quality
  semanticMinimum: number;     // Minimum acceptable semantic quality
  synergyMinimum: number;      // Minimum acceptable synergy
  balanceRequirement: number;  // Required balance across dimensions
}

export interface GenreSpecificConfig {
  [genre: string]: {
    weights: Partial<EnhancedScoringWeights>;
    thresholds: Partial<EnhancedQualityThresholds>;
    bonuses: GenreBonus;
    penalties: GenrePenalty;
    optimization: GenreOptimization;
  };
}

export interface GenreBonus {
  phoneticPatterns: { pattern: string; bonus: number }[];
  semanticKeywords: { keyword: string; bonus: number }[];
  emotionalProfiles: { profile: string; bonus: number }[];
  culturalElements: { element: string; bonus: number }[];
}

export interface GenrePenalty {
  inappropriateWords: { word: string; penalty: number }[];
  conflictingEmotions: { emotion: string; penalty: number }[];
  culturalMismatches: { mismatch: string; penalty: number }[];
}

export interface GenreOptimization {
  phoneticTargets: {
    pronunciation: number;
    flow: number;
    memorability: number;
  };
  semanticTargets: {
    emotionalValence: number;
    arousal: number;
    culturalRelevance: number;
  };
  synergyTargets: {
    alignment: number;
    marketFit: number;
  };
}

export interface AdaptiveConfig {
  enabled: boolean;
  learningRate: number;
  feedbackWeight: number;
  adaptationThreshold: number;
  maxAdjustment: number;
}

export interface PerformanceConfig {
  maxAnalysisTime: number;
  cacheStrategy: 'aggressive' | 'moderate' | 'minimal';
  parallelProcessing: boolean;
  fallbackMode: 'basic' | 'cached' | 'approximate';
}

// Batch processing with enhanced features
export interface EnhancedBatchScoringRequest {
  names: EnhancedNameScoringRequest[];
  thresholdMode: 'strict' | 'moderate' | 'lenient' | 'custom' | 'adaptive';
  customThreshold?: number;
  maxResults?: number;
  
  // Enhanced batch options
  rankingMode: 'overall' | 'balanced' | 'genre-optimized' | 'market-focused';
  diversityTarget?: number;      // Target diversity in results (0-1)
  qualityFloor?: number;         // Minimum acceptable quality
  includeAnalytics?: boolean;
  compareWithBenchmarks?: boolean;
}

export interface EnhancedBatchScoringResult {
  results: EnhancedNameQualityResult[];
  filtered: EnhancedNameQualityResult[];
  analytics: EnhancedBatchAnalytics;
  benchmarks?: BenchmarkComparison;
  recommendations?: BatchRecommendations;
}

export interface EnhancedBatchAnalytics {
  totalProcessed: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passedThreshold: number;
  processingTime: number;
  
  // Enhanced analytics
  qualityDistribution: QualityDistribution;
  dimensionalAverages: DimensionalAverages;
  crossDimensionalCorrelations: CrossDimensionalCorrelations;
  genrePerformance: GenrePerformance;
  marketSegmentation: MarketSegmentation;
}

export interface QualityDistribution {
  excellent: number;
  good: number;
  fair: number;
  poor: number;
  unacceptable: number;
  
  // Dimensional distributions
  phoneticDistribution: ScoreDistribution;
  semanticDistribution: ScoreDistribution;
  synergyDistribution: ScoreDistribution;
}

export interface ScoreDistribution {
  high: number;      // 0.8-1.0
  good: number;      // 0.6-0.8
  fair: number;      // 0.4-0.6
  poor: number;      // 0.2-0.4
  veryPoor: number;  // 0.0-0.2
}

export interface DimensionalAverages {
  phonetic: {
    pronunciation: number;
    flow: number;
    memorability: number;
    uniqueness: number;
  };
  semantic: {
    coherence: number;
    emotionalResonance: number;
    culturalAppeal: number;
    imagery: number;
  };
  synergy: {
    alignment: number;
    harmony: number;
    optimization: number;
  };
}

export interface CrossDimensionalCorrelations {
  phoneticSemantic: number;      // Correlation between phonetic and semantic quality
  creativityAppeal: number;      // Correlation between creativity and appeal
  uniquenessMemorability: number; // Correlation between uniqueness and memorability
  qualityBalance: number;        // How correlated balance is with overall quality
}

export interface GenrePerformance {
  [genre: string]: {
    averageScore: number;
    topPerformers: string[];
    commonStrengths: string[];
    commonWeaknesses: string[];
    optimizationOpportunities: string[];
  };
}

export interface MarketSegmentation {
  mainstream: {
    count: number;
    averageScore: number;
    characteristics: string[];
  };
  niche: {
    count: number;
    averageScore: number;
    characteristics: string[];
  };
  experimental: {
    count: number;
    averageScore: number;
    characteristics: string[];
  };
}

export interface BenchmarkComparison {
  industryBenchmarks: {
    topTier: number;        // Top 10% industry score
    mainstream: number;     // Median industry score
    threshold: number;      // Minimum viable score
  };
  genreBenchmarks: {
    [genre: string]: {
      excellent: number;
      good: number;
      acceptable: number;
    };
  };
  performanceRelative: {
    aboveIndustry: number;  // Percentage above industry average
    topQuartile: number;    // Percentage in top quartile
    marketReady: number;    // Percentage meeting market standards
  };
}

export interface BatchRecommendations {
  overallStrategy: string[];
  dimensionalFocus: string[];
  genreSpecificAdvice: { [genre: string]: string[] };
  qualityImprovementPriorities: string[];
  marketPositioningAdvice: string[];
}

// Service response types
export interface EnhancedQualityScoringServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  analytics?: Partial<EnhancedBatchAnalytics>;
  performance?: {
    processingTime: number;
    cacheHits: number;
    cacheMisses: number;
    analysisDepth: string;
  };
}

// Export types for external use
export type QualityDimension = keyof EnhancedScoreBreakdown;
export type AnalysisMode = 'basic' | 'standard' | 'comprehensive';
export type RankingMode = 'overall' | 'balanced' | 'genre-optimized' | 'market-focused';
export type ThresholdMode = 'strict' | 'moderate' | 'lenient' | 'custom' | 'adaptive';