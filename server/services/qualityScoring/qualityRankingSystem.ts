/**
 * Quality Ranking System with Multi-Dimensional Vectors
 * Provides comparative ranking, threshold filtering, and adaptive learning for music name quality assessment
 */

import type {
  EnhancedNameQualityResult,
  QualityVector,
  EnhancedScoreBreakdown,
  CrossDimensionalMetrics,
  EnhancedNameScoringRequest
} from './enhancedInterfaces';

import type { UserFeedback } from '@shared/schema';
import { enhancedNameScoringEngine } from './enhancedNameScoringEngine';
import { comparativeRankingEngine } from './comparativeRankingEngine';
import { qualityThresholdManager } from './qualityThresholdManager';
import { rankingIntelligence } from './rankingIntelligence';
import { secureLog } from '../../utils/secureLogger';
import { CacheService } from '../cacheService';

export interface QualityRankingRequest {
  names: string[];
  context?: {
    genre?: string;
    mood?: string;
    type?: 'band' | 'song';
    targetAudience?: 'mainstream' | 'niche' | 'experimental';
  };
  rankingMode: 'overall' | 'balanced' | 'genre-optimized' | 'market-focused' | 'creative-first';
  qualityThreshold?: number;
  maxResults?: number;
  diversityTarget?: number; // 0-1, how diverse the results should be
  adaptiveLearning?: boolean;
}

export interface QualityRankingResult {
  rankedNames: RankedName[];
  analytics: RankingAnalytics;
  qualityDistribution: QualityDistribution;
  recommendations: RankingRecommendations;
  adaptiveFeedback?: AdaptiveFeedback;
}

export interface RankedName {
  name: string;
  rank: number;
  qualityScore: number;
  qualityVector: QualityVector;
  strengthProfile: StrengthProfile;
  differentiationFactors: string[];
  marketPosition: 'premium' | 'mainstream' | 'budget' | 'experimental';
  confidenceScore: number;
}

export interface StrengthProfile {
  primaryStrengths: string[];
  secondaryStrengths: string[];
  uniqueAdvantages: string[];
  improvementAreas: string[];
}

export interface QualityDistribution {
  excellent: RankedName[];
  good: RankedName[];
  fair: RankedName[];
  poor: RankedName[];
  belowThreshold: RankedName[];
}

export interface RankingAnalytics {
  totalAnalyzed: number;
  passingThreshold: number;
  averageQuality: number;
  qualityRange: { min: number; max: number };
  dimensionalAverages: DimensionalAverages;
  correlationMatrix: CorrelationMatrix;
  clusterAnalysis: ClusterAnalysis;
  diversityIndex: number;
}

export interface DimensionalAverages {
  sound: number;
  meaning: number;
  creativity: number;
  appeal: number;
  fit: number;
  balance: number;
  distinctiveness: number;
}

export interface CorrelationMatrix {
  soundMeaning: number;
  creativityAppeal: number;
  appealFit: number;
  balanceQuality: number;
  distinctivenessCreativity: number;
}

export interface ClusterAnalysis {
  clusters: QualityCluster[];
  recommendations: string[];
}

export interface QualityCluster {
  id: string;
  centerVector: QualityVector;
  members: string[];
  characteristics: string[];
  marketAppeal: number;
}

export interface RankingRecommendations {
  topChoices: string[];
  diversifiedSelection: string[];
  genreOptimized: string[];
  improvementPriorities: string[];
  strategicAdvice: string[];
}

export interface AdaptiveFeedback {
  weightAdjustments: Record<string, number>;
  thresholdAdjustments: number;
  learningInsights: string[];
  confidenceUpdates: Record<string, number>;
}

export interface QualityThresholds {
  strict: number;
  moderate: number;
  lenient: number;
  adaptive: number;
}

export interface AdaptiveLearningConfig {
  enabled: boolean;
  learningRate: number;
  feedbackWeight: number;
  minimumSamples: number;
  decayFactor: number;
  maxAdjustment: number;
}

export class QualityRankingSystem {
  private cache: CacheService<QualityRankingResult>;
  private learningCache: CacheService<AdaptiveFeedback>;
  
  // Quality thresholds for different modes
  private readonly qualityThresholds: QualityThresholds = {
    strict: 0.80,     // Only excellent quality
    moderate: 0.65,   // Good and above
    lenient: 0.50,    // Fair and above
    adaptive: 0.60    // Dynamically adjusted
  };
  
  // Adaptive learning configuration
  private readonly adaptiveConfig: AdaptiveLearningConfig = {
    enabled: true,
    learningRate: 0.05,
    feedbackWeight: 0.3,
    minimumSamples: 10,
    decayFactor: 0.95,
    maxAdjustment: 0.15
  };
  
  // Weighting profiles for different ranking modes
  private readonly rankingWeights = {
    overall: {
      qualityScore: 0.4,
      balance: 0.25,
      distinctiveness: 0.2,
      marketAppeal: 0.15
    },
    balanced: {
      qualityScore: 0.3,
      balance: 0.4,
      distinctiveness: 0.15,
      marketAppeal: 0.15
    },
    'genre-optimized': {
      qualityScore: 0.35,
      genreSpecific: 0.3,
      contextFit: 0.2,
      marketAppeal: 0.15
    },
    'market-focused': {
      qualityScore: 0.25,
      marketAppeal: 0.4,
      memorability: 0.2,
      culturalAppeal: 0.15
    },
    'creative-first': {
      creativity: 0.4,
      uniqueness: 0.3,
      distinctiveness: 0.2,
      qualityScore: 0.1
    }
  };
  
  // Learning history for adaptive adjustments
  private learningHistory: Map<string, UserFeedback[]> = new Map();
  
  constructor() {
    // Initialize caches
    this.cache = new CacheService<QualityRankingResult>(1800, 500); // 30 minutes
    this.learningCache = new CacheService<AdaptiveFeedback>(86400, 1000); // 24 hours
    
    // Load existing learning data
    this.loadLearningHistory();
  }
  
  /**
   * Rank names with comprehensive quality analysis using intelligent ranking system
   */
  async rankNames(request: QualityRankingRequest): Promise<QualityRankingResult> {
    const cacheKey = this.generateCacheKey(request);
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached !== null) {
      secureLog.debug(`QualityRankingSystem cache hit for ranking request`);
      return cached;
    }
    
    secureLog.info(`Ranking ${request.names.length} names with mode: ${request.rankingMode}`);
    
    try {
      // Score all names using enhanced scoring engine
      const scoredNames = await this.scoreAllNames(request.names, request.context);
      
      // Apply intelligent quality threshold filtering
      const thresholdConfig = this.buildThresholdConfig(request);
      const qualityGateResult = await qualityThresholdManager.applyQualityGate(scoredNames, thresholdConfig);
      
      // Use comparative ranking engine for intelligent ranking
      // Extract just the name strings from qualified results
      const qualifiedNameStrings = qualityGateResult.qualifiedNames.map(result => result.name);
      const comparativeRequest = this.buildComparativeRankingRequest(qualifiedNameStrings, request);
      const comparativeResult = await comparativeRankingEngine.rankNamesComparatively(comparativeRequest);
      
      // Apply ranking intelligence for adaptive learning and personalization
      if (request.adaptiveLearning) {
        const intelligenceRequest = this.buildRankingIntelligenceRequest(qualityGateResult.qualifiedNames, request);
        const intelligenceResult = await rankingIntelligence.applyIntelligentRanking(intelligenceRequest);
        
        // Merge intelligence insights with comparative results
        const enhancedResult = this.mergeIntelligenceResults(comparativeResult, intelligenceResult);
        
        // Convert to legacy format for compatibility
        const legacyResult = this.convertToLegacyFormat(enhancedResult, qualityGateResult, scoredNames, request);
        
        // Cache and return
        this.cache.set(cacheKey, legacyResult);
        return legacyResult;
      } else {
        // Use standard comparative ranking without adaptive learning
        const legacyResult = this.convertComparativeToLegacyFormat(comparativeResult, qualityGateResult, scoredNames, request);
        
        // Cache and return
        this.cache.set(cacheKey, legacyResult);
        return legacyResult;
      }
      
    } catch (error) {
      secureLog.error('Quality ranking failed:', error);
      return this.getDefaultRankingResult(request);
    }
  }
  
  /**
   * Score all names using enhanced scoring engine
   */
  private async scoreAllNames(
    names: string[], 
    context?: QualityRankingRequest['context']
  ): Promise<EnhancedNameQualityResult[]> {
    const scoringPromises = names.map(name => 
      enhancedNameScoringEngine.scoreNameEnhanced({
        name,
        type: context?.type || 'band',
        genre: context?.genre,
        mood: context?.mood,
        isAiGenerated: true, // Assume AI-generated for ranking
        targetAudience: context?.targetAudience,
        analysisDepth: 'comprehensive'
      })
    );
    
    return Promise.all(scoringPromises);
  }
  
  /**
   * Build threshold configuration for quality gate filtering
   */
  private buildThresholdConfig(request: QualityRankingRequest): any {
    return {
      mode: request.qualityThreshold ? 'custom' : 'adaptive',
      context: {
        genre: request.context?.genre,
        mood: request.context?.mood,
        type: request.context?.type || 'band',
        targetAudience: request.context?.targetAudience,
        qualityPriority: this.mapRankingModeToQualityPriority(request.rankingMode)
      },
      requirements: {
        minimumOverallScore: request.qualityThreshold || this.getBaseThresholdForMode(request.rankingMode),
        dimensionalMinimums: this.getDimensionalMinimumsForMode(request.rankingMode),
        balanceRequirement: 0.4,
        consistencyRequirement: 0.3
      },
      adaptiveSettings: {
        enabled: request.adaptiveLearning || false,
        learningRate: this.adaptiveConfig.learningRate,
        feedbackWeight: this.adaptiveConfig.feedbackWeight,
        adaptationThreshold: 0.1,
        maxAdjustment: this.adaptiveConfig.maxAdjustment
      },
      emergencyFallback: {
        enabled: true,
        fallbackThreshold: 0.3,
        minimumResults: Math.max(1, Math.floor(request.maxResults || 10) / 2),
        escalationSteps: [
          {
            condition: 'insufficient_results',
            action: 'lower_threshold',
            parameters: {},
            thresholdAdjustment: -0.1
          }
        ],
        qualityWarnings: true
      }
    };
  }
  
  /**
   * Build comparative ranking request
   */
  private buildComparativeRankingRequest(names: any[], request: QualityRankingRequest): any {
    return {
      names,
      context: {
        genre: request.context?.genre,
        mood: request.context?.mood,
        type: request.context?.type || 'band',
        targetAudience: request.context?.targetAudience,
        useCase: this.mapRankingModeToUseCase(request.rankingMode)
      },
      rankingOptions: {
        mode: this.mapRankingModeToComparativeMode(request.rankingMode),
        priorityDimensions: this.getPriorityDimensionsForMode(request.rankingMode),
        diversityWeight: request.diversityTarget || 0.2,
        explanationLevel: 'standard',
        includeCompetitiveAnalysis: true,
        maxResults: request.maxResults
      }
    };
  }
  
  /**
   * Build ranking intelligence request
   */
  private buildRankingIntelligenceRequest(names: any[], request: QualityRankingRequest): any {
    return {
      names,
      context: {
        genre: request.context?.genre,
        mood: request.context?.mood,
        type: request.context?.type || 'band',
        targetAudience: request.context?.targetAudience,
        useCase: this.mapRankingModeToUseCase(request.rankingMode)
      },
      preferences: {
        // Would come from user preferences in a real implementation
        creativityWeight: 5,
        availabilityWeight: 5,
        uniquenessWeight: 5,
        qualityThreshold: 'moderate'
      },
      learningConfig: {
        enabled: request.adaptiveLearning || false,
        personalizedLearning: true,
        aggregateLearning: true,
        learningSpeed: 'moderate',
        adaptationScope: 'user',
        feedbackWeight: this.adaptiveConfig.feedbackWeight,
        temporalDecay: this.adaptiveConfig.decayFactor,
        confidenceThreshold: 0.5
      },
      optimizationTargets: {
        primaryObjective: this.mapRankingModeToObjective(request.rankingMode),
        secondaryObjectives: ['quality', 'diversity'],
        qualityFloor: request.qualityThreshold || this.getBaseThresholdForMode(request.rankingMode),
        diversityTarget: request.diversityTarget || 0.3,
        noveltyWeight: 0.2,
        riskTolerance: 'moderate',
        explanationDetail: 'standard'
      }
    };
  }
  
  /**
   * Merge intelligence results with comparative results
   */
  private mergeIntelligenceResults(comparativeResult: any, intelligenceResult: any): any {
    // Combine the insights from both engines
    return {
      ...comparativeResult,
      intelligenceInsights: intelligenceResult.learningInsights,
      personalizationMetrics: intelligenceResult.personalizationMetrics,
      adaptiveAdjustments: intelligenceResult.adaptiveAdjustments,
      enhancedRecommendations: intelligenceResult.recommendations
    };
  }
  
  /**
   * Convert enhanced results to legacy format for compatibility
   */
  private convertToLegacyFormat(
    enhancedResult: any, 
    qualityGateResult: any, 
    allNames: EnhancedNameQualityResult[], 
    request: QualityRankingRequest
  ): QualityRankingResult {
    // Convert comparative ranked names to legacy RankedName format
    const rankedNames: RankedName[] = enhancedResult.rankedNames.map((name: any) => ({
      name: name.name,
      rank: name.rank,
      qualityScore: name.overallScore,
      qualityVector: name.qualityProfile.vector,
      strengthProfile: this.convertToLegacyStrengthProfile(name.strengths || []),
      differentiationFactors: name.competitivePosition.differentiationFactors.map((f: any) => f.description),
      marketPosition: name.marketPosition.segment,
      confidenceScore: name.confidenceScore
    }));
    
    // Generate legacy analytics
    const analytics = this.generateEnhancedRankingAnalytics(enhancedResult, allNames);
    
    // Generate legacy quality distribution
    const qualityDistribution = this.generateQualityDistribution(allNames, qualityGateResult.thresholdUsed);
    
    // Generate legacy recommendations
    const recommendations = this.convertToLegacyRecommendations(enhancedResult.recommendations);
    
    // Generate legacy adaptive feedback
    const adaptiveFeedback = request.adaptiveLearning ? {
      weightAdjustments: this.extractWeightAdjustments(enhancedResult.adaptiveAdjustments),
      thresholdAdjustments: qualityGateResult.thresholdUsed - this.getBaseThresholdForMode(request.rankingMode),
      learningInsights: enhancedResult.intelligenceInsights.keyFindings,
      confidenceUpdates: this.extractConfidenceUpdates(enhancedResult.personalizationMetrics)
    } : undefined;
    
    return {
      rankedNames,
      analytics,
      qualityDistribution,
      recommendations,
      adaptiveFeedback
    };
  }
  
  /**
   * Convert comparative results to legacy format (without intelligence)
   */
  private convertComparativeToLegacyFormat(
    comparativeResult: any, 
    qualityGateResult: any, 
    allNames: EnhancedNameQualityResult[], 
    request: QualityRankingRequest
  ): QualityRankingResult {
    // Convert comparative ranked names to legacy RankedName format
    const rankedNames: RankedName[] = comparativeResult.rankedNames.map((name: any) => ({
      name: name.name,
      rank: name.rank,
      qualityScore: name.overallScore,
      qualityVector: name.qualityProfile.vector,
      strengthProfile: this.convertToLegacyStrengthProfile(name.strengths || []),
      differentiationFactors: name.competitivePosition.differentiationFactors.map((f: any) => f.description),
      marketPosition: name.marketPosition.segment,
      confidenceScore: name.confidenceScore
    }));
    
    // Generate analytics from comparative result
    const analytics = this.generateComparativeRankingAnalytics(comparativeResult, allNames);
    
    // Generate quality distribution
    const qualityDistribution = this.generateQualityDistribution(allNames, qualityGateResult.thresholdUsed);
    
    // Generate recommendations
    const recommendations = this.convertToLegacyRecommendations(comparativeResult.recommendations);
    
    return {
      rankedNames,
      analytics,
      qualityDistribution,
      recommendations
    };
  }
  
  /**
   * Helper methods for mapping between systems
   */
  private mapRankingModeToQualityPriority(mode: QualityRankingRequest['rankingMode']): string {
    const mapping = {
      'overall': 'balanced',
      'balanced': 'balanced',
      'genre-optimized': 'balanced',
      'market-focused': 'strict',
      'creative-first': 'quantity-focused'
    };
    return mapping[mode] || 'balanced';
  }
  
  private mapRankingModeToUseCase(mode: QualityRankingRequest['rankingMode']): string {
    const mapping = {
      'overall': 'professional',
      'balanced': 'personal',
      'genre-optimized': 'creative',
      'market-focused': 'commercial',
      'creative-first': 'creative'
    };
    return mapping[mode] || 'personal';
  }
  
  private mapRankingModeToComparativeMode(mode: QualityRankingRequest['rankingMode']): string {
    const mapping = {
      'overall': 'comprehensive',
      'balanced': 'balanced',
      'genre-optimized': 'contextual',
      'market-focused': 'market-focused',
      'creative-first': 'creative-first'
    };
    return mapping[mode] || 'comprehensive';
  }
  
  private mapRankingModeToObjective(mode: QualityRankingRequest['rankingMode']): string {
    const mapping = {
      'overall': 'quality',
      'balanced': 'balance',
      'genre-optimized': 'personalization',
      'market-focused': 'quality',
      'creative-first': 'surprise'
    };
    return mapping[mode] || 'quality';
  }
  
  private getBaseThresholdForMode(mode: QualityRankingRequest['rankingMode']): number {
    const thresholds = {
      'overall': this.qualityThresholds.moderate,
      'balanced': this.qualityThresholds.moderate,
      'genre-optimized': this.qualityThresholds.lenient,
      'market-focused': this.qualityThresholds.strict,
      'creative-first': this.qualityThresholds.lenient
    };
    return thresholds[mode] || this.qualityThresholds.moderate;
  }
  
  private getDimensionalMinimumsForMode(mode: QualityRankingRequest['rankingMode']): any {
    // Return default dimensional minimums - would be customized per mode
    return {
      phoneticFlow: 0.5,
      semanticCoherence: 0.5,
      creativity: 0.4,
      memorability: 0.5,
      marketAppeal: 0.4,
      appropriateness: 0.6,
      uniqueness: 0.3,
      pronunciation: 0.5
    };
  }
  
  private getPriorityDimensionsForMode(mode: QualityRankingRequest['rankingMode']): string[] {
    const priorities = {
      'overall': ['quality', 'balance'],
      'balanced': ['balance', 'quality'],
      'genre-optimized': ['appropriateness', 'contextualFit'],
      'market-focused': ['marketability', 'memorability'],
      'creative-first': ['creativity', 'uniqueness']
    };
    return priorities[mode] || ['quality'];
  }
  
  private convertToLegacyStrengthProfile(strengths: any[]): StrengthProfile {
    // Ensure strengths is defined and is an array
    const safeStrengths = Array.isArray(strengths) ? strengths : [];
    
    const primary = safeStrengths.filter(s => s && s.impact === 'high').map(s => s.strength || s);
    const secondary = safeStrengths.filter(s => s && s.impact === 'medium').map(s => s.strength || s);
    
    return {
      primaryStrengths: primary.slice(0, 3),
      secondaryStrengths: secondary.slice(0, 3),
      uniqueAdvantages: safeStrengths.filter(s => s && s.category === 'competitive').map(s => s.strength || s),
      improvementAreas: [] // Would be extracted from opportunities
    };
  }
  
  private generateEnhancedRankingAnalytics(enhancedResult: any, allNames: EnhancedNameQualityResult[]): RankingAnalytics {
    const analytics = enhancedResult.analytics;
    
    return {
      totalAnalyzed: allNames.length,
      passingThreshold: enhancedResult.rankedNames.length,
      averageQuality: analytics.qualityDistribution.mean,
      qualityRange: { 
        min: analytics.qualityDistribution.range.min, 
        max: analytics.qualityDistribution.range.max 
      },
      dimensionalAverages: this.calculateDimensionalAverages(allNames),
      correlationMatrix: this.calculateCorrelationMatrix(allNames),
      clusterAnalysis: this.performClusterAnalysis(allNames),
      diversityIndex: analytics.diversityMetrics.diversityIndex
    };
  }
  
  private generateComparativeRankingAnalytics(comparativeResult: any, allNames: EnhancedNameQualityResult[]): RankingAnalytics {
    return {
      totalAnalyzed: allNames.length,
      passingThreshold: comparativeResult.rankedNames.length,
      averageQuality: comparativeResult.analytics.qualityDistribution.mean,
      qualityRange: { 
        min: comparativeResult.analytics.qualityDistribution.range.min, 
        max: comparativeResult.analytics.qualityDistribution.range.max 
      },
      dimensionalAverages: this.calculateDimensionalAverages(allNames),
      correlationMatrix: this.calculateCorrelationMatrix(allNames),
      clusterAnalysis: this.performClusterAnalysis(allNames),
      diversityIndex: comparativeResult.analytics.diversityMetrics.diversityIndex
    };
  }
  
  private convertToLegacyRecommendations(recommendations: any): RankingRecommendations {
    // Provide safe fallbacks for undefined/null properties
    const topRecommendations = recommendations?.topRecommendations || [];
    const contextualRecommendations = recommendations?.contextualRecommendations || [];
    const systemRecommendations = recommendations?.systemRecommendations || [];
    const userGuidance = recommendations?.userGuidance || {};
    const tips = userGuidance.tips || [];
    
    // Debug logging to track recommendation structure
    secureLog.debug(`Converting recommendations to legacy format`, {
      hasTopRecommendations: !!recommendations?.topRecommendations,
      topRecommendationsLength: topRecommendations.length,
      hasContextualRecommendations: !!recommendations?.contextualRecommendations,
      hasSystemRecommendations: !!recommendations?.systemRecommendations,
      hasUserGuidance: !!recommendations?.userGuidance,
      recommendationsKeys: recommendations ? Object.keys(recommendations) : []
    });
    
    return {
      topChoices: topRecommendations.map((r: any) => r?.name || r).slice(0, 3),
      diversifiedSelection: topRecommendations.slice(0, 5).map((r: any) => r?.name || r),
      genreOptimized: contextualRecommendations
        .filter((r: any) => r && r.context && typeof r.context.includes === 'function' && r.context.includes('genre'))
        .map((r: any) => r.recommendation || r)
        .slice(0, 3),
      improvementPriorities: systemRecommendations
        .map((r: any) => r?.recommendation || r)
        .slice(0, 5),
      strategicAdvice: Array.isArray(tips) ? tips : []
    };
  }
  
  private extractWeightAdjustments(adaptiveAdjustments: any[]): Record<string, number> {
    const adjustments: Record<string, number> = {};
    
    // Ensure adaptiveAdjustments is an array
    const safeAdjustments = Array.isArray(adaptiveAdjustments) ? adaptiveAdjustments : [];
    
    safeAdjustments
      .filter(adj => adj && (adj.type === 'personalization' || adj.type === 'optimization'))
      .forEach(adj => {
        if (adj.adjustment && typeof adj.magnitude === 'number') {
          adjustments[adj.adjustment] = adj.magnitude;
        }
      });
    
    return adjustments;
  }
  
  private extractConfidenceUpdates(personalizationMetrics: any): Record<string, number> {
    // Provide safe fallbacks for undefined/null metrics
    const metrics = personalizationMetrics || {};
    
    return {
      personalization: typeof metrics.personalizationScore === 'number' ? metrics.personalizationScore : 0.5,
      adaptation: typeof metrics.adaptationAccuracy === 'number' ? metrics.adaptationAccuracy : 0.5,
      learning: typeof metrics.learningProgress === 'number' ? metrics.learningProgress : 0.5
    };
  }
  
  /**
   * Apply quality threshold filtering
   */
  private applyQualityThreshold(
    scoredNames: EnhancedNameQualityResult[], 
    threshold: number
  ): EnhancedNameQualityResult[] {
    return scoredNames.filter(result => result.score.overall >= threshold);
  }
  
  /**
   * Get effective threshold based on request and adaptive learning
   */
  private getEffectiveThreshold(
    request: QualityRankingRequest,
    scoredNames: EnhancedNameQualityResult[]
  ): number {
    if (request.qualityThreshold) {
      return request.qualityThreshold;
    }
    
    // Use adaptive threshold if learning is enabled
    if (request.adaptiveLearning && this.adaptiveConfig.enabled) {
      return this.getAdaptiveThreshold(request.context);
    }
    
    // Use mode-appropriate threshold
    const modeThresholds = {
      'overall': this.qualityThresholds.moderate,
      'balanced': this.qualityThresholds.moderate,
      'genre-optimized': this.qualityThresholds.lenient,
      'market-focused': this.qualityThresholds.strict,
      'creative-first': this.qualityThresholds.lenient
    };
    
    return modeThresholds[request.rankingMode] || this.qualityThresholds.moderate;
  }
  
  /**
   * Rank names based on specified mode
   */
  private rankByMode(
    names: EnhancedNameQualityResult[],
    mode: QualityRankingRequest['rankingMode'],
    context?: QualityRankingRequest['context']
  ): RankedName[] {
    const weights = this.rankingWeights[mode];
    
    const rankedNames = names.map((result, index) => {
      const rankingScore = this.calculateRankingScore(result, weights, mode, context);
      
      return {
        name: result.name,
        rank: 0, // Will be set after sorting
        qualityScore: result.score.overall,
        qualityVector: result.score.qualityVector,
        strengthProfile: this.generateStrengthProfile(result),
        differentiationFactors: this.generateDifferentiationFactors(result, names),
        marketPosition: result.qualityRanking.marketPosition,
        confidenceScore: result.score.metadata.confidence,
        _rankingScore: rankingScore // Internal use for sorting
      };
    });
    
    // Sort by ranking score
    rankedNames.sort((a, b) => (b as any)._rankingScore - (a as any)._rankingScore);
    
    // Assign ranks and remove internal score
    return rankedNames.map((name, index) => {
      const { _rankingScore, ...cleanName } = name as any;
      return { ...cleanName, rank: index + 1 };
    });
  }
  
  /**
   * Calculate ranking score based on mode and weights
   */
  private calculateRankingScore(
    result: EnhancedNameQualityResult,
    weights: any,
    mode: QualityRankingRequest['rankingMode'],
    context?: QualityRankingRequest['context']
  ): number {
    const vector = result.score.qualityVector;
    const breakdown = result.score.breakdown;
    
    let score = 0;
    
    switch (mode) {
      case 'overall':
        score = 
          result.score.overall * weights.qualityScore +
          vector.balance * weights.balance +
          vector.distinctiveness * weights.distinctiveness +
          breakdown.marketAppeal * weights.marketAppeal;
        break;
        
      case 'balanced':
        score = 
          result.score.overall * weights.qualityScore +
          vector.balance * weights.balance +
          vector.distinctiveness * weights.distinctiveness +
          breakdown.marketAppeal * weights.marketAppeal;
        break;
        
      case 'genre-optimized':
        score = 
          result.score.overall * weights.qualityScore +
          breakdown.genreOptimization * weights.genreSpecific +
          breakdown.appropriateness * weights.contextFit +
          breakdown.marketAppeal * weights.marketAppeal;
        break;
        
      case 'market-focused':
        score = 
          result.score.overall * weights.qualityScore +
          breakdown.marketAppeal * weights.marketAppeal +
          breakdown.memorability * weights.memorability +
          breakdown.culturalAppeal * weights.culturalAppeal;
        break;
        
      case 'creative-first':
        score = 
          breakdown.creativity * weights.creativity +
          breakdown.uniqueness * weights.uniqueness +
          vector.distinctiveness * weights.distinctiveness +
          result.score.overall * weights.qualityScore;
        break;
        
      default:
        score = result.score.overall;
    }
    
    return score;
  }
  
  /**
   * Optimize ranking for diversity
   */
  private optimizeForDiversity(
    rankedNames: RankedName[], 
    diversityTarget: number
  ): RankedName[] {
    if (diversityTarget <= 0 || rankedNames.length <= 1) {
      return rankedNames;
    }
    
    const diversified: RankedName[] = [];
    const remaining = [...rankedNames];
    
    // Always include the top-ranked name
    if (remaining.length > 0) {
      diversified.push(remaining.shift()!);
    }
    
    // Add names that maximize diversity while maintaining quality
    while (remaining.length > 0 && diversified.length < rankedNames.length) {
      let bestCandidate = remaining[0];
      let bestDiversityScore = 0;
      let bestIndex = 0;
      
      for (let i = 0; i < remaining.length; i++) {
        const candidate = remaining[i];
        const diversityScore = this.calculateDiversityScore(candidate, diversified, diversityTarget);
        
        if (diversityScore > bestDiversityScore) {
          bestDiversityScore = diversityScore;
          bestCandidate = candidate;
          bestIndex = i;
        }
      }
      
      diversified.push(bestCandidate);
      remaining.splice(bestIndex, 1);
    }
    
    // Re-rank the diversified results
    return diversified.map((name, index) => ({ ...name, rank: index + 1 }));
  }
  
  /**
   * Calculate diversity score for a candidate relative to existing selection
   */
  private calculateDiversityScore(
    candidate: RankedName, 
    existing: RankedName[], 
    diversityTarget: number
  ): number {
    const qualityWeight = 1 - diversityTarget;
    const diversityWeight = diversityTarget;
    
    // Quality component
    const qualityScore = candidate.qualityScore;
    
    // Diversity component - how different this candidate is from existing
    let diversityScore = 1.0;
    
    for (const existingName of existing) {
      const similarity = this.calculateVectorSimilarity(
        candidate.qualityVector, 
        existingName.qualityVector
      );
      diversityScore *= (1 - similarity);
    }
    
    return qualityScore * qualityWeight + diversityScore * diversityWeight;
  }
  
  /**
   * Calculate similarity between two quality vectors
   */
  private calculateVectorSimilarity(vector1: QualityVector, vector2: QualityVector): number {
    const dims1 = Object.values(vector1.dimensions);
    const dims2 = Object.values(vector2.dimensions);
    
    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;
    
    for (let i = 0; i < dims1.length; i++) {
      dotProduct += dims1[i] * dims2[i];
      magnitude1 += dims1[i] * dims1[i];
      magnitude2 += dims2[i] * dims2[i];
    }
    
    const magnitudeProduct = Math.sqrt(magnitude1) * Math.sqrt(magnitude2);
    return magnitudeProduct > 0 ? dotProduct / magnitudeProduct : 0;
  }
  
  /**
   * Generate strength profile for a name
   */
  private generateStrengthProfile(result: EnhancedNameQualityResult): StrengthProfile {
    const breakdown = result.score.breakdown;
    const vector = result.score.qualityVector;
    
    const scores = {
      'Pronunciation': breakdown.pronunciation,
      'Phonetic Flow': breakdown.phoneticFlow,
      'Semantic Coherence': breakdown.semanticCoherence,
      'Emotional Resonance': breakdown.emotionalResonance,
      'Cultural Appeal': breakdown.culturalAppeal,
      'Creativity': breakdown.creativity,
      'Uniqueness': breakdown.uniqueness,
      'Market Appeal': breakdown.marketAppeal,
      'Genre Optimization': breakdown.genreOptimization,
      'Balance': vector.balance,
      'Distinctiveness': vector.distinctiveness
    };
    
    const sortedScores = Object.entries(scores).sort(([,a], [,b]) => b - a);
    
    const primaryStrengths = sortedScores
      .filter(([, score]) => score >= 0.75)
      .slice(0, 3)
      .map(([name]) => name);
    
    const secondaryStrengths = sortedScores
      .filter(([, score]) => score >= 0.65 && score < 0.75)
      .slice(0, 3)
      .map(([name]) => name);
    
    const uniqueAdvantages = [];
    if (vector.distinctiveness > 0.8) uniqueAdvantages.push('Highly distinctive profile');
    if (breakdown.phoneticSemanticAlignment > 0.8) uniqueAdvantages.push('Perfect sound-meaning alignment');
    if (vector.balance > 0.8) uniqueAdvantages.push('Exceptionally well-balanced');
    
    const improvementAreas = sortedScores
      .filter(([, score]) => score < 0.6)
      .slice(0, 3)
      .map(([name]) => name);
    
    return {
      primaryStrengths,
      secondaryStrengths,
      uniqueAdvantages,
      improvementAreas
    };
  }
  
  /**
   * Generate differentiation factors for a name
   */
  private generateDifferentiationFactors(
    result: EnhancedNameQualityResult, 
    allResults: EnhancedNameQualityResult[]
  ): string[] {
    const factors: string[] = [];
    const vector = result.score.qualityVector;
    const breakdown = result.score.breakdown;
    
    // Calculate percentile rankings for key dimensions
    const dimensions = {
      'sound quality': vector.dimensions.sound,
      'semantic depth': vector.dimensions.meaning,
      'creative innovation': vector.dimensions.creativity,
      'market appeal': vector.dimensions.appeal,
      'genre fit': vector.dimensions.fit
    };
    
    for (const [dimension, score] of Object.entries(dimensions)) {
      const betterThan = allResults.filter(r => {
        const otherScore = this.getDimensionScore(r, dimension);
        return score > otherScore;
      }).length;
      
      const percentile = (betterThan / allResults.length) * 100;
      
      if (percentile >= 90) {
        factors.push(`Top 10% in ${dimension}`);
      } else if (percentile >= 75) {
        factors.push(`Top 25% in ${dimension}`);
      }
    }
    
    // Special differentiation factors
    if (breakdown.phoneticSemanticAlignment > 0.8) {
      factors.push('Exceptional sound-meaning synergy');
    }
    
    if (vector.balance > 0.8 && vector.magnitude > 0.7) {
      factors.push('High quality with excellent balance');
    }
    
    if (vector.distinctiveness > 0.8) {
      factors.push('Unique quality profile');
    }
    
    return factors;
  }
  
  /**
   * Generate ranking analytics
   */
  private generateRankingAnalytics(
    allResults: EnhancedNameQualityResult[],
    finalResults: RankedName[]
  ): RankingAnalytics {
    const scores = allResults.map(r => r.score.overall);
    
    // Basic statistics
    const averageQuality = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const minQuality = Math.min(...scores);
    const maxQuality = Math.max(...scores);
    
    // Dimensional averages
    const dimensionalAverages = this.calculateDimensionalAverages(allResults);
    
    // Correlation matrix
    const correlationMatrix = this.calculateCorrelationMatrix(allResults);
    
    // Cluster analysis
    const clusterAnalysis = this.performClusterAnalysis(allResults);
    
    // Diversity index
    const diversityIndex = this.calculateDiversityIndex(finalResults);
    
    return {
      totalAnalyzed: allResults.length,
      passingThreshold: finalResults.length,
      averageQuality,
      qualityRange: { min: minQuality, max: maxQuality },
      dimensionalAverages,
      correlationMatrix,
      clusterAnalysis,
      diversityIndex
    };
  }
  
  /**
   * Generate quality distribution
   */
  private generateQualityDistribution(
    allResults: EnhancedNameQualityResult[],
    threshold: number
  ): QualityDistribution {
    const excellent: RankedName[] = [];
    const good: RankedName[] = [];
    const fair: RankedName[] = [];
    const poor: RankedName[] = [];
    const belowThreshold: RankedName[] = [];
    
    allResults.forEach(result => {
      const score = result.score.overall;
      const rankedName: RankedName = {
        name: result.name,
        rank: 0,
        qualityScore: score,
        qualityVector: result.score.qualityVector,
        strengthProfile: this.generateStrengthProfile(result),
        differentiationFactors: [],
        marketPosition: result.qualityRanking.marketPosition,
        confidenceScore: result.score.metadata.confidence
      };
      
      if (score < threshold) {
        belowThreshold.push(rankedName);
      } else if (score >= 0.85) {
        excellent.push(rankedName);
      } else if (score >= 0.70) {
        good.push(rankedName);
      } else if (score >= 0.55) {
        fair.push(rankedName);
      } else {
        poor.push(rankedName);
      }
    });
    
    return { excellent, good, fair, poor, belowThreshold };
  }
  
  /**
   * Generate ranking recommendations
   */
  private generateRankingRecommendations(
    rankedNames: RankedName[],
    analytics: RankingAnalytics,
    request: QualityRankingRequest
  ): RankingRecommendations {
    const topChoices = rankedNames.slice(0, 3).map(r => r.name);
    
    // Diversified selection prioritizes variety
    const diversifiedSelection = this.selectDiversifiedNames(rankedNames, 5);
    
    // Genre optimized selection
    const genreOptimized = rankedNames
      .filter(r => r.strengthProfile.primaryStrengths.includes('Genre Optimization'))
      .slice(0, 3)
      .map(r => r.name);
    
    // Improvement priorities
    const improvementPriorities = this.identifyImprovementPriorities(analytics);
    
    // Strategic advice
    const strategicAdvice = this.generateStrategicAdvice(rankedNames, analytics, request);
    
    return {
      topChoices,
      diversifiedSelection,
      genreOptimized,
      improvementPriorities,
      strategicAdvice
    };
  }
  
  /**
   * Generate adaptive feedback for learning
   */
  private generateAdaptiveFeedback(
    rankedNames: RankedName[],
    analytics: RankingAnalytics,
    request: QualityRankingRequest
  ): AdaptiveFeedback {
    const contextKey = this.getContextKey(request.context);
    
    // Get historical feedback for this context
    const historicalFeedback = this.learningHistory.get(contextKey) || [];
    
    // Calculate weight adjustments based on performance
    const weightAdjustments = this.calculateWeightAdjustments(
      rankedNames, 
      analytics, 
      historicalFeedback
    );
    
    // Calculate threshold adjustments
    const thresholdAdjustments = this.calculateThresholdAdjustments(
      analytics, 
      historicalFeedback
    );
    
    // Generate learning insights
    const learningInsights = this.generateLearningInsights(
      analytics, 
      historicalFeedback
    );
    
    // Update confidence based on consistency
    const confidenceUpdates = this.calculateConfidenceUpdates(
      rankedNames, 
      historicalFeedback
    );
    
    return {
      weightAdjustments,
      thresholdAdjustments,
      learningInsights,
      confidenceUpdates
    };
  }
  
  /**
   * Helper methods for calculations
   */
  private calculateDimensionalAverages(results: EnhancedNameQualityResult[]): DimensionalAverages {
    const totals = {
      sound: 0, meaning: 0, creativity: 0, appeal: 0, fit: 0, balance: 0, distinctiveness: 0
    };
    
    results.forEach(result => {
      const vector = result.score.qualityVector;
      totals.sound += vector.dimensions.sound;
      totals.meaning += vector.dimensions.meaning;
      totals.creativity += vector.dimensions.creativity;
      totals.appeal += vector.dimensions.appeal;
      totals.fit += vector.dimensions.fit;
      totals.balance += vector.balance;
      totals.distinctiveness += vector.distinctiveness;
    });
    
    const count = results.length;
    return {
      sound: totals.sound / count,
      meaning: totals.meaning / count,
      creativity: totals.creativity / count,
      appeal: totals.appeal / count,
      fit: totals.fit / count,
      balance: totals.balance / count,
      distinctiveness: totals.distinctiveness / count
    };
  }
  
  private calculateCorrelationMatrix(results: EnhancedNameQualityResult[]): CorrelationMatrix {
    // Simplified correlation calculations
    return {
      soundMeaning: this.calculateCorrelation(
        results.map(r => r.score.qualityVector.dimensions.sound),
        results.map(r => r.score.qualityVector.dimensions.meaning)
      ),
      creativityAppeal: this.calculateCorrelation(
        results.map(r => r.score.qualityVector.dimensions.creativity),
        results.map(r => r.score.qualityVector.dimensions.appeal)
      ),
      appealFit: this.calculateCorrelation(
        results.map(r => r.score.qualityVector.dimensions.appeal),
        results.map(r => r.score.qualityVector.dimensions.fit)
      ),
      balanceQuality: this.calculateCorrelation(
        results.map(r => r.score.qualityVector.balance),
        results.map(r => r.score.overall)
      ),
      distinctivenessCreativity: this.calculateCorrelation(
        results.map(r => r.score.qualityVector.distinctiveness),
        results.map(r => r.score.qualityVector.dimensions.creativity)
      )
    };
  }
  
  private calculateCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }
  
  // Additional helper methods would be implemented here...
  // (Cluster analysis, diversity calculations, adaptive learning methods, etc.)
  
  private performClusterAnalysis(results: EnhancedNameQualityResult[]): ClusterAnalysis {
    // Simplified clustering - would implement k-means or similar
    return {
      clusters: [{
        id: 'high-quality',
        centerVector: results[0]?.score.qualityVector || {} as QualityVector,
        members: results.filter(r => r.score.overall > 0.7).map(r => r.name),
        characteristics: ['High overall quality', 'Balanced metrics'],
        marketAppeal: 0.8
      }],
      recommendations: ['Focus on high-quality cluster characteristics']
    };
  }
  
  private calculateDiversityIndex(names: RankedName[]): number {
    // Simplified diversity calculation
    if (names.length <= 1) return 0;
    
    let totalSimilarity = 0;
    let comparisons = 0;
    
    for (let i = 0; i < names.length - 1; i++) {
      for (let j = i + 1; j < names.length; j++) {
        totalSimilarity += this.calculateVectorSimilarity(
          names[i].qualityVector,
          names[j].qualityVector
        );
        comparisons++;
      }
    }
    
    const averageSimilarity = totalSimilarity / comparisons;
    return 1 - averageSimilarity; // Higher diversity = lower similarity
  }
  
  // Placeholder implementations for complex methods
  private getAdaptiveThreshold(context?: any): number {
    return this.qualityThresholds.adaptive;
  }
  
  private getDimensionScore(result: EnhancedNameQualityResult, dimension: string): number {
    const vector = result.score.qualityVector;
    switch (dimension) {
      case 'sound quality': return vector.dimensions.sound;
      case 'semantic depth': return vector.dimensions.meaning;
      case 'creative innovation': return vector.dimensions.creativity;
      case 'market appeal': return vector.dimensions.appeal;
      case 'genre fit': return vector.dimensions.fit;
      default: return 0;
    }
  }
  
  private selectDiversifiedNames(rankedNames: RankedName[], count: number): string[] {
    return rankedNames.slice(0, count).map(r => r.name);
  }
  
  private identifyImprovementPriorities(analytics: RankingAnalytics): string[] {
    const priorities: string[] = [];
    
    if (analytics.dimensionalAverages.sound < 0.6) {
      priorities.push('Improve phonetic quality and pronunciation');
    }
    if (analytics.dimensionalAverages.meaning < 0.6) {
      priorities.push('Enhance semantic coherence and meaning');
    }
    if (analytics.diversityIndex < 0.5) {
      priorities.push('Increase diversity in name generation');
    }
    
    return priorities;
  }
  
  private generateStrategicAdvice(
    rankedNames: RankedName[],
    analytics: RankingAnalytics,
    request: QualityRankingRequest
  ): string[] {
    const advice: string[] = [];
    
    if (analytics.averageQuality < 0.6) {
      advice.push('Consider refining generation parameters to improve overall quality');
    }
    
    if (request.rankingMode === 'market-focused' && analytics.dimensionalAverages.appeal < 0.7) {
      advice.push('Focus on names with broader market appeal');
    }
    
    return advice;
  }
  
  // Adaptive learning method placeholders
  private loadLearningHistory(): void {
    // Would load from persistent storage
  }
  
  private getContextKey(context?: any): string {
    return context ? JSON.stringify(context) : 'default';
  }
  
  private calculateWeightAdjustments(
    rankedNames: RankedName[],
    analytics: RankingAnalytics,
    historicalFeedback: UserFeedback[]
  ): Record<string, number> {
    return {};
  }
  
  private calculateThresholdAdjustments(
    analytics: RankingAnalytics,
    historicalFeedback: UserFeedback[]
  ): number {
    return 0;
  }
  
  private generateLearningInsights(
    analytics: RankingAnalytics,
    historicalFeedback: UserFeedback[]
  ): string[] {
    return ['Adaptive learning in progress'];
  }
  
  private calculateConfidenceUpdates(
    rankedNames: RankedName[],
    historicalFeedback: UserFeedback[]
  ): Record<string, number> {
    return {};
  }
  
  private generateCacheKey(request: QualityRankingRequest): string {
    return `ranking_${JSON.stringify(request)}`;
  }
  
  private getDefaultRankingResult(request: QualityRankingRequest): QualityRankingResult {
    return {
      rankedNames: [],
      analytics: {
        totalAnalyzed: 0,
        passingThreshold: 0,
        averageQuality: 0,
        qualityRange: { min: 0, max: 0 },
        dimensionalAverages: {
          sound: 0, meaning: 0, creativity: 0, appeal: 0, fit: 0, balance: 0, distinctiveness: 0
        },
        correlationMatrix: {
          soundMeaning: 0, creativityAppeal: 0, appealFit: 0, balanceQuality: 0, distinctivenessCreativity: 0
        },
        clusterAnalysis: {
          clusters: [],
          recommendations: []
        },
        diversityIndex: 0
      },
      qualityDistribution: {
        excellent: [], good: [], fair: [], poor: [], belowThreshold: []
      },
      recommendations: {
        topChoices: [],
        diversifiedSelection: [],
        genreOptimized: [],
        improvementPriorities: ['Unable to analyze due to error'],
        strategicAdvice: []
      }
    };
  }
  
  /**
   * Public methods for interaction
   */
  
  // Record user feedback for adaptive learning
  recordUserFeedback(
    name: string,
    feedback: UserFeedback,
    context?: QualityRankingRequest['context']
  ): void {
    const contextKey = this.getContextKey(context);
    const history = this.learningHistory.get(contextKey) || [];
    history.push({ ...feedback, name, timestamp: Date.now() });
    
    // Keep only recent feedback (last 100 entries)
    if (history.length > 100) {
      history.shift();
    }
    
    this.learningHistory.set(contextKey, history);
  }
  
  // Get cache statistics
  getCacheStats() {
    return {
      ranking: this.cache.getStats(),
      learning: this.learningCache.getStats()
    };
  }
  
  // Clear caches
  clearCache(): void {
    this.cache.clear();
    this.learningCache.clear();
  }
}

// UserFeedback interface is imported from @shared/schema

// Export singleton instance
export const qualityRankingSystem = new QualityRankingSystem();