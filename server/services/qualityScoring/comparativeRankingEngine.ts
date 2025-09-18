/**
 * Comparative Ranking Engine
 * Provides multi-dimensional name comparison, competitive analysis, and intelligent ranking
 */

import type {
  EnhancedNameQualityResult,
  EnhancedScoreBreakdown,
  QualityVector,
  CrossDimensionalMetrics,
  EnhancedNameScoringRequest,
  QualityRanking,
  CompetitiveAnalysis,
  ImprovementSuggestion
} from './enhancedInterfaces';

import { enhancedNameScoringEngine } from './enhancedNameScoringEngine';
import { secureLog } from '../../utils/secureLogger';
import { CacheService } from '../cacheService';

export interface ComparativeRankingRequest {
  names: string[];
  context: {
    genre?: string;
    mood?: string;
    type: 'band' | 'song';
    targetAudience?: 'mainstream' | 'niche' | 'experimental';
    userPreferences?: UserPreferences;
    benchmarkContext?: BenchmarkContext;
  };
  rankingOptions: {
    mode: 'comprehensive' | 'contextual' | 'market-focused' | 'creative-first' | 'balanced';
    priorityDimensions?: string[];
    diversityWeight?: number; // 0-1, how much to weight diversity vs quality
    explanationLevel: 'basic' | 'detailed' | 'comprehensive';
    includeCompetitiveAnalysis: boolean;
    maxResults?: number;
  };
}

export interface ComparativeRankingResult {
  rankedNames: ComparativeRankedName[];
  analytics: ComparativeAnalytics;
  competitiveAnalysis: OverallCompetitiveAnalysis;
  qualityInsights: QualityInsights;
  recommendations: RankingRecommendations;
  metadata: ComparativeMetadata;
}

export interface ComparativeRankedName {
  name: string;
  rank: number;
  overallScore: number;
  qualityProfile: QualityProfile;
  competitivePosition: CompetitivePosition;
  strengthAreas: StrengthArea[];
  improvementOpportunities: ImprovementOpportunity[];
  marketPosition: MarketPosition;
  explanation: RankingExplanation;
  confidenceScore: number;
}

export interface QualityProfile {
  dimensions: QualityDimensionScores;
  vector: QualityVector;
  breakdown: EnhancedScoreBreakdown;
  crossDimensional: CrossDimensionalMetrics;
  qualityRanking: QualityRanking;
  uniqueFactors: string[];
}

export interface QualityDimensionScores {
  phonetic: number;
  semantic: number;
  creativity: number;
  marketability: number;
  contextualFit: number;
  memorability: number;
  pronunciation: number;
  distinctiveness: number;
}

export interface CompetitivePosition {
  relativeRank: number;
  percentileScore: number;
  outperforms: string[];
  underperforms: string[];
  differentiationFactors: DifferentiationFactor[];
  competitiveAdvantages: string[];
  competitiveGaps: string[];
}

export interface DifferentiationFactor {
  dimension: string;
  advantage: 'strong' | 'moderate' | 'weak';
  description: string;
  impact: number; // 0-1
}

export interface StrengthArea {
  dimension: string;
  score: number;
  percentileRank: number;
  description: string;
  marketValue: 'high' | 'medium' | 'low';
}

export interface ImprovementOpportunity {
  dimension: string;
  currentScore: number;
  potentialScore: number;
  difficulty: 'easy' | 'medium' | 'hard';
  impact: 'high' | 'medium' | 'low';
  suggestion: string;
}

export interface MarketPosition {
  segment: 'premium' | 'mainstream' | 'budget' | 'experimental';
  appeal: 'broad' | 'niche' | 'specialized';
  viability: 'high' | 'medium' | 'low';
  riskLevel: 'low' | 'medium' | 'high';
  targetMatch: number; // 0-1, how well it matches intended target
}

export interface RankingExplanation {
  primaryReasons: string[];
  detailedAnalysis: DetailedAnalysis;
  comparisonPoints: ComparisonPoint[];
  qualityHighlights: string[];
  cautionAreas: string[];
}

export interface DetailedAnalysis {
  strengthSummary: string;
  improvementSummary: string;
  marketingSummary: string;
  competitiveSummary: string;
  overallAssessment: string;
}

export interface ComparisonPoint {
  comparedTo: string;
  dimension: string;
  advantage: string;
  quantification: string;
}

export interface ComparativeAnalytics {
  totalAnalyzed: number;
  qualityDistribution: QualityDistributionStats;
  dimensionalAnalysis: DimensionalAnalysisStats;
  competitiveSpread: CompetitiveSpreadStats;
  diversityMetrics: DiversityMetrics;
  trendAnalysis: TrendAnalysis;
}

export interface QualityDistributionStats {
  mean: number;
  median: number;
  standardDeviation: number;
  range: { min: number; max: number };
  quartiles: { q1: number; q2: number; q3: number };
  outliers: { low: string[]; high: string[] };
}

export interface DimensionalAnalysisStats {
  phoneticStats: DimensionStats;
  semanticStats: DimensionStats;
  creativityStats: DimensionStats;
  marketabilityStats: DimensionStats;
  correlations: DimensionCorrelations;
}

export interface DimensionStats {
  mean: number;
  variance: number;
  topPerformers: string[];
  underperformers: string[];
  distribution: number[];
}

export interface DimensionCorrelations {
  phoneticSemantic: number;
  creativityMarketability: number;
  pronunciationMemorability: number;
  contextualFitOverall: number;
}

export interface CompetitiveSpreadStats {
  competitiveGaps: number;
  clusteringIndex: number;
  differentiationScore: number;
  marketCoverage: number;
}

export interface DiversityMetrics {
  diversityIndex: number;
  clusterCount: number;
  averageIntraClusterDistance: number;
  averageInterClusterDistance: number;
}

export interface TrendAnalysis {
  qualityTrend: 'improving' | 'stable' | 'declining';
  emergingStrengths: string[];
  decliningAreas: string[];
  innovationIndex: number;
}

export interface OverallCompetitiveAnalysis {
  marketLandscape: MarketLandscape;
  positioningMap: PositioningMap;
  strategicRecommendations: StrategicRecommendation[];
  opportunityGaps: OpportunityGap[];
  threatAnalysis: ThreatAnalysis;
}

export interface MarketLandscape {
  segments: MarketSegment[];
  competitiveIntensity: 'low' | 'medium' | 'high';
  differentiationOpportunities: string[];
  marketSaturation: number; // 0-1
}

export interface MarketSegment {
  name: string;
  size: number;
  representatives: string[];
  characteristics: string[];
  competitiveGaps: string[];
}

export interface PositioningMap {
  dimensions: { x: string; y: string };
  positions: NamePosition[];
  clusters: PositionCluster[];
  emptySpaces: EmptySpace[];
}

export interface NamePosition {
  name: string;
  x: number;
  y: number;
  size: number; // Represents overall quality
  color: string; // Represents market segment
}

export interface PositionCluster {
  center: { x: number; y: number };
  members: string[];
  characteristics: string[];
  competitiveIntensity: number;
}

export interface EmptySpace {
  x: number;
  y: number;
  opportunity: string;
  marketPotential: number;
}

export interface StrategicRecommendation {
  category: 'positioning' | 'differentiation' | 'improvement' | 'market-entry';
  priority: 'high' | 'medium' | 'low';
  recommendation: string;
  rationale: string;
  expectedImpact: number;
  implementationDifficulty: number;
}

export interface OpportunityGap {
  description: string;
  marketSize: number;
  competitiveVacancy: number;
  accessibilityScore: number;
  strategicValue: number;
}

export interface ThreatAnalysis {
  competitivePressure: number;
  marketSaturation: number;
  substitutionRisk: number;
  overallThreatLevel: 'low' | 'medium' | 'high';
  mitigationStrategies: string[];
}

export interface QualityInsights {
  keyFindings: string[];
  qualityPatterns: QualityPattern[];
  dimensionalInsights: DimensionalInsight[];
  crossDimensionalSynergies: SynergyInsight[];
  industryComparisons: IndustryComparison[];
}

export interface QualityPattern {
  pattern: string;
  frequency: number;
  impact: string;
  examples: string[];
}

export interface DimensionalInsight {
  dimension: string;
  insight: string;
  significance: 'high' | 'medium' | 'low';
  actionableAdvice: string;
}

export interface SynergyInsight {
  dimensions: string[];
  synergyLevel: number;
  description: string;
  optimization: string;
}

export interface IndustryComparison {
  benchmark: string;
  ourPerformance: number;
  industryAverage: number;
  percentileRank: number;
  competitiveAdvantage: boolean;
}

export interface RankingRecommendations {
  topChoices: TopChoice[];
  diversifiedPortfolio: string[];
  contextualBest: ContextualBest[];
  strategicAdvice: string[];
  nextSteps: string[];
}

export interface TopChoice {
  name: string;
  reason: string;
  useCase: string;
  confidenceLevel: number;
}

export interface ContextualBest {
  context: string;
  name: string;
  rationale: string;
}

export interface ComparativeMetadata {
  analysisTime: number;
  algorithm: string;
  version: string;
  confidence: number;
  analysisDepth: string;
  cacheHits: number;
  computationIntensity: 'light' | 'moderate' | 'intensive';
}

export interface UserPreferences {
  priorityDimensions: string[];
  creativityWeight: number;
  marketabilityWeight: number;
  uniquenessWeight: number;
  contextualFitWeight: number;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  targetAudience: 'mainstream' | 'niche' | 'experimental';
}

export interface BenchmarkContext {
  industryBenchmarks: Record<string, number>;
  genreBenchmarks: Record<string, number>;
  competitorNames: string[];
  marketStandards: Record<string, number>;
}

export class ComparativeRankingEngine {
  private cache: CacheService<ComparativeRankingResult>;
  private algorithmVersion = '1.0.0';
  
  // Weighting profiles for different ranking modes
  private readonly rankingModeWeights = {
    comprehensive: {
      quality: 0.25,
      competitiveness: 0.20,
      creativity: 0.15,
      marketability: 0.15,
      contextualFit: 0.15,
      uniqueness: 0.10
    },
    contextual: {
      contextualFit: 0.35,
      quality: 0.25,
      marketability: 0.20,
      creativity: 0.10,
      competitiveness: 0.10
    },
    'market-focused': {
      marketability: 0.40,
      competitiveness: 0.25,
      quality: 0.20,
      contextualFit: 0.10,
      creativity: 0.05
    },
    'creative-first': {
      creativity: 0.40,
      uniqueness: 0.25,
      quality: 0.20,
      contextualFit: 0.10,
      marketability: 0.05
    },
    balanced: {
      quality: 0.20,
      creativity: 0.20,
      marketability: 0.20,
      contextualFit: 0.20,
      competitiveness: 0.10,
      uniqueness: 0.10
    }
  };
  
  constructor() {
    // Initialize cache with 1 hour TTL and max 200 entries for complex ranking results
    this.cache = new CacheService<ComparativeRankingResult>(3600, 200);
  }
  
  /**
   * Perform comprehensive comparative ranking of names
   */
  async rankNamesComparatively(request: ComparativeRankingRequest): Promise<ComparativeRankingResult> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(request);
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached !== null) {
      secureLog.debug(`ComparativeRankingEngine cache hit for ${request.names.length} names`);
      return cached;
    }
    
    secureLog.info(`Starting comparative ranking for ${request.names.length} names with mode: ${request.rankingOptions.mode}`);
    
    try {
      // Score all names using enhanced scoring engine
      const scoredNames = await this.scoreAllNames(request.names, request.context);
      
      // Perform comparative analysis between names
      const comparativeAnalysis = this.performComparativeAnalysis(scoredNames, request);
      
      // Generate competitive analysis
      const competitiveAnalysis = this.generateCompetitiveAnalysis(scoredNames, request);
      
      // Calculate final rankings with comparative weights
      const rankedNames = this.calculateComparativeRankings(
        scoredNames, 
        comparativeAnalysis, 
        request
      );
      
      // Apply diversity optimization if requested
      const optimizedRanking = this.optimizeForDiversity(rankedNames, request);
      
      // Generate comprehensive analytics
      const analytics = this.generateComparativeAnalytics(scoredNames, optimizedRanking);
      
      // Generate quality insights
      const qualityInsights = this.generateQualityInsights(scoredNames, analytics);
      
      // Generate strategic recommendations
      const recommendations = this.generateRankingRecommendations(
        optimizedRanking, 
        analytics, 
        qualityInsights, 
        request
      );
      
      const result: ComparativeRankingResult = {
        rankedNames: optimizedRanking.slice(0, request.rankingOptions.maxResults),
        analytics,
        competitiveAnalysis,
        qualityInsights,
        recommendations,
        metadata: {
          analysisTime: Date.now() - startTime,
          algorithm: 'comparative_ranking_v1',
          version: this.algorithmVersion,
          confidence: this.calculateOverallConfidence(optimizedRanking),
          analysisDepth: request.rankingOptions.explanationLevel,
          cacheHits: 0,
          computationIntensity: this.assessComputationIntensity(request)
        }
      };
      
      // Cache the result
      this.cache.set(cacheKey, result);
      
      secureLog.info(`Comparative ranking completed in ${result.metadata.analysisTime}ms`);
      
      return result;
      
    } catch (error) {
      secureLog.error('Comparative ranking failed:', error);
      throw new Error(`Comparative ranking failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Score all names using enhanced scoring engine
   */
  private async scoreAllNames(
    names: string[], 
    context: ComparativeRankingRequest['context']
  ): Promise<EnhancedNameQualityResult[]> {
    const scoringPromises = names.map(name => 
      enhancedNameScoringEngine.scoreNameEnhanced({
        name,
        type: context.type,
        genre: context.genre,
        mood: context.mood,
        isAiGenerated: true,
        targetAudience: context.targetAudience,
        culturalContext: context.userPreferences?.targetAudience,
        analysisDepth: 'comprehensive'
      })
    );
    
    return Promise.all(scoringPromises);
  }
  
  /**
   * Perform detailed comparative analysis between names
   */
  private performComparativeAnalysis(
    scoredNames: EnhancedNameQualityResult[],
    request: ComparativeRankingRequest
  ): Map<string, CompetitivePosition> {
    const analysis = new Map<string, CompetitivePosition>();
    
    for (let i = 0; i < scoredNames.length; i++) {
      const currentName = scoredNames[i];
      const competitivePosition = this.analyzeCompetitivePosition(
        currentName, 
        scoredNames, 
        i,
        request
      );
      analysis.set(currentName.name, competitivePosition);
    }
    
    return analysis;
  }
  
  /**
   * Analyze competitive position of a single name against others
   */
  private analyzeCompetitivePosition(
    targetName: EnhancedNameQualityResult,
    allNames: EnhancedNameQualityResult[],
    targetIndex: number,
    request: ComparativeRankingRequest
  ): CompetitivePosition {
    const others = allNames.filter((_, index) => index !== targetIndex);
    
    // Calculate relative performance
    const betterThan = others.filter(other => 
      targetName.score.overall > other.score.overall
    );
    const worseThan = others.filter(other => 
      targetName.score.overall < other.score.overall
    );
    
    const percentileScore = (betterThan.length / others.length) * 100;
    
    // Identify differentiation factors
    const differentiationFactors = this.calculateDifferentiationFactors(
      targetName, 
      others
    );
    
    // Find competitive advantages and gaps
    const { advantages, gaps } = this.identifyCompetitiveAdvantagesAndGaps(
      targetName, 
      others
    );
    
    return {
      relativeRank: targetIndex + 1,
      percentileScore,
      outperforms: betterThan.map(n => n.name),
      underperforms: worseThan.map(n => n.name),
      differentiationFactors,
      competitiveAdvantages: advantages,
      competitiveGaps: gaps
    };
  }
  
  /**
   * Calculate differentiation factors for a name
   */
  private calculateDifferentiationFactors(
    targetName: EnhancedNameQualityResult,
    competitors: EnhancedNameQualityResult[]
  ): DifferentiationFactor[] {
    const factors: DifferentiationFactor[] = [];
    const targetBreakdown = targetName.score.breakdown;
    
    // Analyze each dimension for differentiation
    const dimensions = [
      'phoneticFlow', 'semanticCoherence', 'creativity', 'uniqueness',
      'memorability', 'culturalAppeal', 'marketAppeal'
    ];
    
    for (const dimension of dimensions) {
      const targetScore = targetBreakdown[dimension as keyof EnhancedScoreBreakdown] as number;
      const competitorScores = competitors.map(c => 
        c.score.breakdown[dimension as keyof EnhancedScoreBreakdown] as number
      );
      
      const averageCompetitor = competitorScores.reduce((sum, score) => sum + score, 0) / competitorScores.length;
      const advantageGap = targetScore - averageCompetitor;
      
      if (Math.abs(advantageGap) > 0.1) { // Significant difference threshold
        const advantage = this.classifyAdvantage(advantageGap);
        factors.push({
          dimension,
          advantage,
          description: this.generateDifferentiationDescription(dimension, advantageGap, advantage),
          impact: Math.abs(advantageGap)
        });
      }
    }
    
    return factors.sort((a, b) => b.impact - a.impact);
  }
  
  /**
   * Classify advantage level based on score gap
   */
  private classifyAdvantage(gap: number): 'strong' | 'moderate' | 'weak' {
    const absGap = Math.abs(gap);
    if (absGap > 0.25) return 'strong';
    if (absGap > 0.15) return 'moderate';
    return 'weak';
  }
  
  /**
   * Generate human-readable differentiation description
   */
  private generateDifferentiationDescription(
    dimension: string, 
    gap: number, 
    advantage: 'strong' | 'moderate' | 'weak'
  ): string {
    const isPositive = gap > 0;
    const direction = isPositive ? 'superior' : 'inferior';
    const intensityMap = {
      strong: isPositive ? 'significantly' : 'substantially',
      moderate: isPositive ? 'notably' : 'considerably', 
      weak: isPositive ? 'slightly' : 'somewhat'
    };
    
    const dimensionLabels: Record<string, string> = {
      phoneticFlow: 'phonetic flow and pronunciation',
      semanticCoherence: 'semantic meaning and coherence',
      creativity: 'creative innovation',
      uniqueness: 'distinctiveness and uniqueness',
      memorability: 'memorability and impact',
      culturalAppeal: 'cultural appeal and relevance',
      marketAppeal: 'commercial market appeal'
    };
    
    return `${intensityMap[advantage]} ${direction} ${dimensionLabels[dimension] || dimension}`;
  }
  
  /**
   * Identify competitive advantages and gaps
   */
  private identifyCompetitiveAdvantagesAndGaps(
    targetName: EnhancedNameQualityResult,
    competitors: EnhancedNameQualityResult[]
  ): { advantages: string[]; gaps: string[] } {
    const advantages: string[] = [];
    const gaps: string[] = [];
    
    const targetVector = targetName.score.qualityVector;
    const targetBreakdown = targetName.score.breakdown;
    
    // Check phonetic advantages
    if (targetBreakdown.phoneticFlow > 0.8) {
      advantages.push('Excellent phonetic flow and pronunciation');
    }
    
    // Check semantic advantages  
    if (targetBreakdown.semanticCoherence > 0.8) {
      advantages.push('Strong semantic coherence and meaning');
    }
    
    // Check creativity advantages
    if (targetBreakdown.creativity > 0.8) {
      advantages.push('High creative innovation');
    }
    
    // Check market advantages
    if (targetBreakdown.marketAppeal > 0.8) {
      advantages.push('Strong commercial market appeal');
    }
    
    // Check balance advantages
    if (targetVector.balance > 0.8) {
      advantages.push('Exceptional balance across all quality dimensions');
    }
    
    // Identify gaps (areas where target is significantly behind)
    const competitorAverages = this.calculateCompetitorAverages(competitors);
    
    if (targetBreakdown.memorability < competitorAverages.memorability - 0.15) {
      gaps.push('Lower memorability compared to alternatives');
    }
    
    if (targetBreakdown.uniqueness < competitorAverages.uniqueness - 0.15) {
      gaps.push('Less distinctive than other options');
    }
    
    if (targetBreakdown.marketAppeal < competitorAverages.marketAppeal - 0.15) {
      gaps.push('Lower commercial appeal potential');
    }
    
    return { advantages, gaps };
  }
  
  /**
   * Calculate average scores across competitors
   */
  private calculateCompetitorAverages(competitors: EnhancedNameQualityResult[]): Record<string, number> {
    const dimensions = ['memorability', 'uniqueness', 'marketAppeal', 'creativity', 'phoneticFlow'];
    const averages: Record<string, number> = {};
    
    for (const dimension of dimensions) {
      const scores = competitors.map(c => 
        c.score.breakdown[dimension as keyof EnhancedScoreBreakdown] as number
      );
      averages[dimension] = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    }
    
    return averages;
  }
  
  /**
   * Generate overall competitive analysis
   */
  private generateCompetitiveAnalysis(
    scoredNames: EnhancedNameQualityResult[],
    request: ComparativeRankingRequest
  ): OverallCompetitiveAnalysis {
    const marketLandscape = this.analyzeMarketLandscape(scoredNames, request);
    const positioningMap = this.generatePositioningMap(scoredNames);
    const strategicRecommendations = this.generateStrategicRecommendations(scoredNames, marketLandscape);
    const opportunityGaps = this.identifyOpportunityGaps(scoredNames, positioningMap);
    const threatAnalysis = this.analyzeThreatLandscape(scoredNames);
    
    return {
      marketLandscape,
      positioningMap,
      strategicRecommendations,
      opportunityGaps,
      threatAnalysis
    };
  }
  
  /**
   * Analyze market landscape and segments
   */
  private analyzeMarketLandscape(
    scoredNames: EnhancedNameQualityResult[],
    request: ComparativeRankingRequest
  ): MarketLandscape {
    // Cluster names by market characteristics
    const segments = this.identifyMarketSegments(scoredNames);
    
    // Calculate competitive intensity
    const competitiveIntensity = this.calculateCompetitiveIntensity(scoredNames);
    
    // Identify differentiation opportunities
    const differentiationOpportunities = this.findDifferentiationOpportunities(scoredNames);
    
    // Calculate market saturation
    const marketSaturation = this.calculateMarketSaturation(scoredNames, segments);
    
    return {
      segments,
      competitiveIntensity,
      differentiationOpportunities,
      marketSaturation
    };
  }
  
  /**
   * Identify market segments based on name characteristics
   */
  private identifyMarketSegments(scoredNames: EnhancedNameQualityResult[]): MarketSegment[] {
    const segments: MarketSegment[] = [];
    
    // Premium segment (high overall quality)
    const premium = scoredNames.filter(name => name.score.overall > 0.8);
    if (premium.length > 0) {
      segments.push({
        name: 'Premium',
        size: premium.length,
        representatives: premium.slice(0, 3).map(n => n.name),
        characteristics: ['High overall quality', 'Strong market appeal', 'Professional sound'],
        competitiveGaps: this.identifySegmentGaps(premium, 'premium')
      });
    }
    
    // Creative segment (high creativity, moderate market appeal)
    const creative = scoredNames.filter(name => 
      name.score.breakdown.creativity > 0.75 && name.score.breakdown.marketAppeal < 0.7
    );
    if (creative.length > 0) {
      segments.push({
        name: 'Creative/Artistic',
        size: creative.length,
        representatives: creative.slice(0, 3).map(n => n.name),
        characteristics: ['High creativity', 'Unique approach', 'Artistic appeal'],
        competitiveGaps: this.identifySegmentGaps(creative, 'creative')
      });
    }
    
    // Mainstream segment (balanced across dimensions)
    const mainstream = scoredNames.filter(name => 
      name.score.qualityVector.balance > 0.7 && 
      name.score.breakdown.marketAppeal > 0.6
    );
    if (mainstream.length > 0) {
      segments.push({
        name: 'Mainstream',
        size: mainstream.length,
        representatives: mainstream.slice(0, 3).map(n => n.name),
        characteristics: ['Well-balanced', 'Broad appeal', 'Safe choice'],
        competitiveGaps: this.identifySegmentGaps(mainstream, 'mainstream')
      });
    }
    
    return segments;
  }
  
  /**
   * Identify gaps within a market segment
   */
  private identifySegmentGaps(names: EnhancedNameQualityResult[], segmentType: string): string[] {
    const gaps: string[] = [];
    
    // Calculate average scores for the segment
    const avgScores = this.calculateSegmentAverages(names);
    
    // Identify weak areas
    if (avgScores.memorability < 0.6) {
      gaps.push('Limited memorability within segment');
    }
    
    if (avgScores.uniqueness < 0.6) {
      gaps.push('Insufficient differentiation within segment');
    }
    
    if (avgScores.phoneticFlow < 0.6) {
      gaps.push('Poor phonetic appeal within segment');
    }
    
    return gaps;
  }
  
  /**
   * Calculate average scores for a segment
   */
  private calculateSegmentAverages(names: EnhancedNameQualityResult[]): Record<string, number> {
    const dimensions = ['memorability', 'uniqueness', 'phoneticFlow', 'marketAppeal'];
    const averages: Record<string, number> = {};
    
    for (const dimension of dimensions) {
      const scores = names.map(n => n.score.breakdown[dimension as keyof EnhancedScoreBreakdown] as number);
      averages[dimension] = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    }
    
    return averages;
  }
  
  /**
   * Calculate competitive intensity
   */
  private calculateCompetitiveIntensity(scoredNames: EnhancedNameQualityResult[]): 'low' | 'medium' | 'high' {
    // Calculate quality variance - low variance = high competitive intensity
    const scores = scoredNames.map(n => n.score.overall);
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    
    if (variance < 0.01) return 'high';   // Very similar scores = intense competition
    if (variance < 0.04) return 'medium'; // Moderate spread
    return 'low';                         // Wide spread = low competitive intensity
  }
  
  /**
   * Find differentiation opportunities
   */
  private findDifferentiationOpportunities(scoredNames: EnhancedNameQualityResult[]): string[] {
    const opportunities: string[] = [];
    
    // Analyze dimensional gaps
    const dimensionalAverages = this.calculateOverallDimensionalAverages(scoredNames);
    
    if (dimensionalAverages.creativity < 0.6) {
      opportunities.push('Creative innovation gap - opportunity for more creative names');
    }
    
    if (dimensionalAverages.uniqueness < 0.6) {
      opportunities.push('Uniqueness gap - opportunity for more distinctive names');
    }
    
    if (dimensionalAverages.phoneticFlow < 0.6) {
      opportunities.push('Phonetic appeal gap - opportunity for better sound quality');
    }
    
    if (dimensionalAverages.culturalAppeal < 0.6) {
      opportunities.push('Cultural relevance gap - opportunity for more culturally resonant names');
    }
    
    return opportunities;
  }
  
  /**
   * Calculate overall dimensional averages
   */
  private calculateOverallDimensionalAverages(scoredNames: EnhancedNameQualityResult[]): Record<string, number> {
    const dimensions = ['creativity', 'uniqueness', 'phoneticFlow', 'culturalAppeal', 'marketAppeal'];
    const averages: Record<string, number> = {};
    
    for (const dimension of dimensions) {
      const scores = scoredNames.map(n => n.score.breakdown[dimension as keyof EnhancedScoreBreakdown] as number);
      averages[dimension] = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    }
    
    return averages;
  }
  
  /**
   * Calculate market saturation
   */
  private calculateMarketSaturation(scoredNames: EnhancedNameQualityResult[], segments: MarketSegment[]): number {
    // Market saturation based on how evenly distributed names are across quality spectrum
    const qualityBuckets = [0, 0, 0, 0, 0]; // 0-0.2, 0.2-0.4, 0.4-0.6, 0.6-0.8, 0.8-1.0
    
    scoredNames.forEach(name => {
      const bucketIndex = Math.min(Math.floor(name.score.overall * 5), 4);
      qualityBuckets[bucketIndex]++;
    });
    
    // Calculate evenness of distribution (higher = more saturated)
    const total = scoredNames.length;
    const expectedPerBucket = total / 5;
    const variance = qualityBuckets.reduce((sum, count) => 
      sum + Math.pow(count - expectedPerBucket, 2), 0) / 5;
    
    // Normalize to 0-1 scale
    return Math.min(variance / (expectedPerBucket * expectedPerBucket), 1);
  }
  
  /**
   * Generate positioning map for visualization
   */
  private generatePositioningMap(scoredNames: EnhancedNameQualityResult[]): PositioningMap {
    // Use creativity vs marketability as primary positioning dimensions
    const positions: NamePosition[] = scoredNames.map(name => ({
      name: name.name,
      x: name.score.breakdown.creativity,
      y: name.score.breakdown.marketAppeal,
      size: name.score.overall,
      color: this.determineMarketSegmentColor(name)
    }));
    
    // Identify clusters
    const clusters = this.identifyPositionClusters(positions);
    
    // Find empty spaces (opportunities)
    const emptySpaces = this.findEmptySpaces(positions);
    
    return {
      dimensions: { x: 'Creativity', y: 'Market Appeal' },
      positions,
      clusters,
      emptySpaces
    };
  }
  
  /**
   * Determine market segment color for positioning map
   */
  private determineMarketSegmentColor(name: EnhancedNameQualityResult): string {
    if (name.score.overall > 0.8) return 'premium';
    if (name.score.breakdown.creativity > 0.75) return 'creative';
    if (name.score.qualityVector.balance > 0.7) return 'mainstream';
    return 'budget';
  }
  
  /**
   * Identify position clusters for competitive analysis
   */
  private identifyPositionClusters(positions: NamePosition[]): PositionCluster[] {
    // Simple clustering based on proximity in 2D space
    const clusters: PositionCluster[] = [];
    const processed = new Set<string>();
    const clusterRadius = 0.2; // Distance threshold for clustering
    
    positions.forEach(position => {
      if (processed.has(position.name)) return;
      
      // Find nearby positions
      const nearby = positions.filter(other => {
        if (processed.has(other.name) || other.name === position.name) return false;
        const distance = Math.sqrt(
          Math.pow(position.x - other.x, 2) + Math.pow(position.y - other.y, 2)
        );
        return distance <= clusterRadius;
      });
      
      if (nearby.length > 0) {
        const clusterMembers = [position, ...nearby];
        const centerX = clusterMembers.reduce((sum, p) => sum + p.x, 0) / clusterMembers.length;
        const centerY = clusterMembers.reduce((sum, p) => sum + p.y, 0) / clusterMembers.length;
        
        clusters.push({
          center: { x: centerX, y: centerY },
          members: clusterMembers.map(p => p.name),
          characteristics: this.determineClusterCharacteristics(clusterMembers),
          competitiveIntensity: clusterMembers.length / positions.length
        });
        
        clusterMembers.forEach(member => processed.add(member.name));
      } else {
        processed.add(position.name);
      }
    });
    
    return clusters;
  }
  
  /**
   * Determine cluster characteristics
   */
  private determineClusterCharacteristics(clusterMembers: NamePosition[]): string[] {
    const characteristics: string[] = [];
    
    const avgX = clusterMembers.reduce((sum, p) => sum + p.x, 0) / clusterMembers.length;
    const avgY = clusterMembers.reduce((sum, p) => sum + p.y, 0) / clusterMembers.length;
    const avgSize = clusterMembers.reduce((sum, p) => sum + p.size, 0) / clusterMembers.length;
    
    if (avgX > 0.7) characteristics.push('High creativity');
    if (avgY > 0.7) characteristics.push('Strong market appeal');
    if (avgSize > 0.7) characteristics.push('High overall quality');
    if (avgX < 0.4) characteristics.push('Conservative approach');
    if (avgY < 0.4) characteristics.push('Niche market focus');
    
    return characteristics;
  }
  
  /**
   * Find empty spaces in positioning map
   */
  private findEmptySpaces(positions: NamePosition[]): EmptySpace[] {
    const emptySpaces: EmptySpace[] = [];
    const gridSize = 0.25; // Grid resolution for finding empty spaces
    
    // Search grid for empty areas
    for (let x = gridSize; x < 1; x += gridSize) {
      for (let y = gridSize; y < 1; y += gridSize) {
        // Check if this area has any nearby positions
        const hasNearby = positions.some(pos => {
          const distance = Math.sqrt(Math.pow(pos.x - x, 2) + Math.pow(pos.y - y, 2));
          return distance < gridSize * 0.7; // 70% of grid size
        });
        
        if (!hasNearby) {
          emptySpaces.push({
            x,
            y,
            opportunity: this.describeOpportunity(x, y),
            marketPotential: this.assessMarketPotential(x, y)
          });
        }
      }
    }
    
    return emptySpaces;
  }
  
  /**
   * Describe opportunity in empty space
   */
  private describeOpportunity(x: number, y: number): string {
    if (x > 0.7 && y > 0.7) return 'High creativity + High market appeal';
    if (x > 0.7 && y < 0.4) return 'High creativity + Niche appeal';
    if (x < 0.4 && y > 0.7) return 'Conservative + High market appeal';
    if (x < 0.4 && y < 0.4) return 'Conservative + Niche appeal';
    if (x > 0.5 && y > 0.5) return 'Balanced creativity and market appeal';
    return 'Moderate positioning opportunity';
  }
  
  /**
   * Assess market potential of empty space
   */
  private assessMarketPotential(x: number, y: number): number {
    // Higher potential for balanced high scores
    const distance = Math.sqrt(Math.pow(x - 0.8, 2) + Math.pow(y - 0.8, 2));
    return Math.max(0, 1 - distance);
  }
  
  /**
   * Generate strategic recommendations
   */
  private generateStrategicRecommendations(
    scoredNames: EnhancedNameQualityResult[],
    marketLandscape: MarketLandscape
  ): StrategicRecommendation[] {
    const recommendations: StrategicRecommendation[] = [];
    
    // Analyze current positioning and suggest improvements
    const topName = scoredNames.reduce((prev, current) => 
      current.score.overall > prev.score.overall ? current : prev
    );
    
    // Positioning recommendations
    if (topName.score.breakdown.creativity > 0.8 && topName.score.breakdown.marketAppeal < 0.6) {
      recommendations.push({
        category: 'positioning',
        priority: 'high',
        recommendation: 'Focus on creative differentiation while improving commercial appeal',
        rationale: 'Strong creative foundation with opportunity to broaden market reach',
        expectedImpact: 0.15,
        implementationDifficulty: 0.6
      });
    }
    
    // Differentiation recommendations
    if (marketLandscape.competitiveIntensity === 'high') {
      recommendations.push({
        category: 'differentiation',
        priority: 'high',
        recommendation: 'Pursue unique phonetic or semantic differentiation',
        rationale: 'High competitive intensity requires strong differentiation',
        expectedImpact: 0.2,
        implementationDifficulty: 0.7
      });
    }
    
    // Improvement recommendations
    const weakestDimension = this.findWeakestDimension(scoredNames);
    if (weakestDimension) {
      recommendations.push({
        category: 'improvement',
        priority: 'medium',
        recommendation: `Strengthen ${weakestDimension.dimension} across the portfolio`,
        rationale: `Portfolio shows weakness in ${weakestDimension.dimension} (avg: ${weakestDimension.avgScore.toFixed(2)})`,
        expectedImpact: 0.1,
        implementationDifficulty: 0.5
      });
    }
    
    return recommendations.sort((a, b) => {
      // Sort by priority then by expected impact
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.expectedImpact - a.expectedImpact;
    });
  }
  
  /**
   * Find weakest dimension across all names
   */
  private findWeakestDimension(scoredNames: EnhancedNameQualityResult[]): { dimension: string; avgScore: number } | null {
    const dimensions = ['creativity', 'memorability', 'uniqueness', 'phoneticFlow', 'marketAppeal'];
    let weakest: { dimension: string; avgScore: number } | null = null;
    
    for (const dimension of dimensions) {
      const scores = scoredNames.map(n => 
        n.score.breakdown[dimension as keyof EnhancedScoreBreakdown] as number
      );
      const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      
      if (!weakest || avgScore < weakest.avgScore) {
        weakest = { dimension, avgScore };
      }
    }
    
    return weakest;
  }
  
  /**
   * Identify opportunity gaps in the market
   */
  private identifyOpportunityGaps(
    scoredNames: EnhancedNameQualityResult[],
    positioningMap: PositioningMap
  ): OpportunityGap[] {
    return positioningMap.emptySpaces.map(space => ({
      description: space.opportunity,
      marketSize: this.estimateMarketSize(space),
      competitiveVacancy: this.calculateCompetitiveVacancy(space, positioningMap.positions),
      accessibilityScore: this.assessAccessibility(space),
      strategicValue: space.marketPotential
    })).sort((a, b) => b.strategicValue - a.strategicValue);
  }
  
  /**
   * Estimate market size for opportunity
   */
  private estimateMarketSize(space: EmptySpace): number {
    // Simple heuristic based on position
    if (space.x > 0.7 && space.y > 0.7) return 0.8; // High creativity + market appeal = large market
    if (space.x < 0.4 && space.y > 0.7) return 0.6; // Conservative + market appeal = medium market
    if (space.x > 0.7 && space.y < 0.4) return 0.4; // Creative + niche = small market
    return 0.3; // Default small market
  }
  
  /**
   * Calculate competitive vacancy (how empty the space is)
   */
  private calculateCompetitiveVacancy(space: EmptySpace, positions: NamePosition[]): number {
    const nearbyCount = positions.filter(pos => {
      const distance = Math.sqrt(Math.pow(pos.x - space.x, 2) + Math.pow(pos.y - space.y, 2));
      return distance < 0.3; // Within 30% distance
    }).length;
    
    return Math.max(0, 1 - (nearbyCount / positions.length));
  }
  
  /**
   * Assess accessibility of opportunity
   */
  private assessAccessibility(space: EmptySpace): number {
    // Higher accessibility for moderate positions (easier to achieve)
    const extremeness = Math.max(Math.abs(space.x - 0.5), Math.abs(space.y - 0.5)) * 2;
    return 1 - extremeness;
  }
  
  /**
   * Analyze threat landscape
   */
  private analyzeThreatLandscape(scoredNames: EnhancedNameQualityResult[]): ThreatAnalysis {
    // Calculate competitive pressure
    const competitivePressure = this.calculateCompetitivePressure(scoredNames);
    
    // Calculate market saturation
    const marketSaturation = this.calculateThreatBasedSaturation(scoredNames);
    
    // Calculate substitution risk
    const substitutionRisk = this.calculateSubstitutionRisk(scoredNames);
    
    // Overall threat level
    const overallThreatLevel = this.determineOverallThreatLevel(
      competitivePressure, 
      marketSaturation, 
      substitutionRisk
    );
    
    // Mitigation strategies
    const mitigationStrategies = this.generateMitigationStrategies(
      competitivePressure, 
      marketSaturation, 
      substitutionRisk
    );
    
    return {
      competitivePressure,
      marketSaturation,
      substitutionRisk,
      overallThreatLevel,
      mitigationStrategies
    };
  }
  
  /**
   * Calculate competitive pressure
   */
  private calculateCompetitivePressure(scoredNames: EnhancedNameQualityResult[]): number {
    // High pressure when many names have similar high scores
    const highQualityNames = scoredNames.filter(n => n.score.overall > 0.7);
    return Math.min(1, highQualityNames.length / scoredNames.length);
  }
  
  /**
   * Calculate threat-based saturation
   */
  private calculateThreatBasedSaturation(scoredNames: EnhancedNameQualityResult[]): number {
    // Saturation based on quality density in high-value areas
    const topTier = scoredNames.filter(n => n.score.overall > 0.8);
    return Math.min(1, (topTier.length / Math.max(1, scoredNames.length * 0.2)) * 0.5);
  }
  
  /**
   * Calculate substitution risk
   */
  private calculateSubstitutionRisk(scoredNames: EnhancedNameQualityResult[]): number {
    // Risk when names are very similar to each other
    const similarities = this.calculatePairwiseSimilarities(scoredNames);
    const avgSimilarity = similarities.reduce((sum, sim) => sum + sim, 0) / similarities.length;
    return avgSimilarity;
  }
  
  /**
   * Calculate pairwise similarities between names
   */
  private calculatePairwiseSimilarities(scoredNames: EnhancedNameQualityResult[]): number[] {
    const similarities: number[] = [];
    
    for (let i = 0; i < scoredNames.length; i++) {
      for (let j = i + 1; j < scoredNames.length; j++) {
        const similarity = this.calculateNameSimilarity(scoredNames[i], scoredNames[j]);
        similarities.push(similarity);
      }
    }
    
    return similarities;
  }
  
  /**
   * Calculate similarity between two names
   */
  private calculateNameSimilarity(name1: EnhancedNameQualityResult, name2: EnhancedNameQualityResult): number {
    const vector1 = name1.score.qualityVector;
    const vector2 = name2.score.qualityVector;
    
    // Calculate cosine similarity between quality vectors
    const dimensions1 = Object.values(vector1.dimensions);
    const dimensions2 = Object.values(vector2.dimensions);
    
    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;
    
    for (let i = 0; i < dimensions1.length; i++) {
      dotProduct += dimensions1[i] * dimensions2[i];
      magnitude1 += dimensions1[i] * dimensions1[i];
      magnitude2 += dimensions2[i] * dimensions2[i];
    }
    
    const magnitudeProduct = Math.sqrt(magnitude1) * Math.sqrt(magnitude2);
    return magnitudeProduct > 0 ? dotProduct / magnitudeProduct : 0;
  }
  
  /**
   * Determine overall threat level
   */
  private determineOverallThreatLevel(
    competitivePressure: number,
    marketSaturation: number,
    substitutionRisk: number
  ): 'low' | 'medium' | 'high' {
    const avgThreat = (competitivePressure + marketSaturation + substitutionRisk) / 3;
    
    if (avgThreat > 0.7) return 'high';
    if (avgThreat > 0.4) return 'medium';
    return 'low';
  }
  
  /**
   * Generate mitigation strategies
   */
  private generateMitigationStrategies(
    competitivePressure: number,
    marketSaturation: number,
    substitutionRisk: number
  ): string[] {
    const strategies: string[] = [];
    
    if (competitivePressure > 0.6) {
      strategies.push('Focus on unique differentiation to stand out from competitors');
      strategies.push('Emphasize distinctive phonetic or semantic elements');
    }
    
    if (marketSaturation > 0.6) {
      strategies.push('Explore niche market positioning opportunities');
      strategies.push('Consider breakthrough creative approaches');
    }
    
    if (substitutionRisk > 0.6) {
      strategies.push('Develop stronger brand identity elements');
      strategies.push('Increase memorability and emotional connection');
    }
    
    return strategies;
  }
  
  /**
   * Calculate comparative rankings with weighted scoring
   */
  private calculateComparativeRankings(
    scoredNames: EnhancedNameQualityResult[],
    comparativeAnalysis: Map<string, CompetitivePosition>,
    request: ComparativeRankingRequest
  ): ComparativeRankedName[] {
    const modeWeights = this.rankingModeWeights[request.rankingOptions.mode];
    
    const rankedNames = scoredNames.map(name => {
      const competitivePosition = comparativeAnalysis.get(name.name)!;
      const finalScore = this.calculateFinalComparativeScore(name, competitivePosition, modeWeights, request);
      
      return {
        name: name.name,
        rank: 0, // Will be assigned after sorting
        overallScore: finalScore,
        qualityProfile: this.buildQualityProfile(name),
        competitivePosition,
        strengthAreas: this.identifyStrengthAreas(name),
        improvementOpportunities: this.identifyImprovementOpportunities(name),
        marketPosition: this.assessMarketPosition(name),
        explanation: this.generateRankingExplanation(name, competitivePosition, request),
        confidenceScore: name.score.metadata.confidence,
        _sortScore: finalScore // For sorting
      };
    });
    
    // Sort by final score
    rankedNames.sort((a, b) => (b as any)._sortScore - (a as any)._sortScore);
    
    // Assign ranks and remove sort score
    return rankedNames.map((name, index) => {
      const { _sortScore, ...cleanName } = name as any;
      return { ...cleanName, rank: index + 1 };
    });
  }
  
  /**
   * Calculate final comparative score
   */
  private calculateFinalComparativeScore(
    name: EnhancedNameQualityResult,
    competitivePosition: CompetitivePosition,
    weights: any,
    request: ComparativeRankingRequest
  ): number {
    const breakdown = name.score.breakdown;
    const vector = name.score.qualityVector;
    
    // Base quality score
    const qualityScore = name.score.overall * (weights.quality || 0.2);
    
    // Competitive advantage score (based on percentile)
    const competitiveScore = (competitivePosition.percentileScore / 100) * (weights.competitiveness || 0.2);
    
    // Creativity score
    const creativityScore = breakdown.creativity * (weights.creativity || 0.2);
    
    // Market appeal score
    const marketabilityScore = breakdown.marketAppeal * (weights.marketability || 0.2);
    
    // Contextual fit score
    const contextualFitScore = breakdown.appropriateness * (weights.contextualFit || 0.1);
    
    // Uniqueness score
    const uniquenessScore = breakdown.uniqueness * (weights.uniqueness || 0.1);
    
    // Apply user preference adjustments if provided
    let finalScore = qualityScore + competitiveScore + creativityScore + 
                    marketabilityScore + contextualFitScore + uniquenessScore;
    
    if (request.context.userPreferences) {
      finalScore = this.applyUserPreferences(finalScore, name, request.context.userPreferences);
    }
    
    return Math.min(1, Math.max(0, finalScore));
  }
  
  /**
   * Apply user preferences to adjust score
   */
  private applyUserPreferences(
    baseScore: number,
    name: EnhancedNameQualityResult,
    preferences: UserPreferences
  ): number {
    let adjustment = 0;
    const breakdown = name.score.breakdown;
    
    // Apply dimensional preference weights
    if (preferences.priorityDimensions.includes('creativity')) {
      adjustment += (breakdown.creativity - 0.5) * preferences.creativityWeight * 0.1;
    }
    
    if (preferences.priorityDimensions.includes('marketability')) {
      adjustment += (breakdown.marketAppeal - 0.5) * preferences.marketabilityWeight * 0.1;
    }
    
    if (preferences.priorityDimensions.includes('uniqueness')) {
      adjustment += (breakdown.uniqueness - 0.5) * preferences.uniquenessWeight * 0.1;
    }
    
    if (preferences.priorityDimensions.includes('contextualFit')) {
      adjustment += (breakdown.appropriateness - 0.5) * preferences.contextualFitWeight * 0.1;
    }
    
    // Apply risk tolerance
    if (preferences.riskTolerance === 'conservative' && breakdown.uniqueness > 0.8) {
      adjustment -= 0.05; // Penalize very unique names for conservative users
    } else if (preferences.riskTolerance === 'aggressive' && breakdown.uniqueness < 0.6) {
      adjustment -= 0.05; // Penalize conventional names for aggressive users
    }
    
    return baseScore + adjustment;
  }
  
  /**
   * Build comprehensive quality profile
   */
  private buildQualityProfile(name: EnhancedNameQualityResult): QualityProfile {
    const breakdown = name.score.breakdown;
    
    return {
      dimensions: {
        phonetic: breakdown.phoneticFlow,
        semantic: breakdown.semanticCoherence,
        creativity: breakdown.creativity,
        marketability: breakdown.marketAppeal,
        contextualFit: breakdown.appropriateness,
        memorability: breakdown.memorability,
        pronunciation: breakdown.pronunciation,
        distinctiveness: name.score.qualityVector.distinctiveness
      },
      vector: name.score.qualityVector,
      breakdown,
      crossDimensional: name.score.crossDimensional,
      qualityRanking: name.qualityRanking,
      uniqueFactors: this.identifyUniqueFactors(name)
    };
  }
  
  /**
   * Identify unique factors for a name
   */
  private identifyUniqueFactors(name: EnhancedNameQualityResult): string[] {
    const factors: string[] = [];
    const breakdown = name.score.breakdown;
    const vector = name.score.qualityVector;
    
    if (breakdown.phoneticFlow > 0.9) factors.push('Exceptional phonetic flow');
    if (breakdown.semanticCoherence > 0.9) factors.push('Perfect semantic coherence');
    if (breakdown.creativity > 0.9) factors.push('Highly innovative');
    if (vector.balance > 0.9) factors.push('Perfectly balanced');
    if (breakdown.phoneticSemanticAlignment > 0.9) factors.push('Perfect sound-meaning alignment');
    if (breakdown.culturalAppeal > 0.9) factors.push('Strong cultural resonance');
    
    return factors;
  }
  
  /**
   * Identify strength areas for a name
   */
  private identifyStrengthAreas(name: EnhancedNameQualityResult): StrengthArea[] {
    const breakdown = name.score.breakdown;
    const strengths: StrengthArea[] = [];
    
    const dimensions = [
      { key: 'phoneticFlow', label: 'Phonetic Flow', marketValue: 'high' as const },
      { key: 'semanticCoherence', label: 'Semantic Coherence', marketValue: 'high' as const },
      { key: 'creativity', label: 'Creativity', marketValue: 'medium' as const },
      { key: 'marketAppeal', label: 'Market Appeal', marketValue: 'high' as const },
      { key: 'memorability', label: 'Memorability', marketValue: 'high' as const },
      { key: 'uniqueness', label: 'Uniqueness', marketValue: 'medium' as const }
    ];
    
    for (const dimension of dimensions) {
      const score = breakdown[dimension.key as keyof EnhancedScoreBreakdown] as number;
      if (score > 0.7) {
        strengths.push({
          dimension: dimension.label,
          score,
          percentileRank: score * 100, // Simplified percentile
          description: this.generateStrengthDescription(dimension.label, score),
          marketValue: dimension.marketValue
        });
      }
    }
    
    return strengths.sort((a, b) => b.score - a.score);
  }
  
  /**
   * Generate strength description
   */
  private generateStrengthDescription(dimension: string, score: number): string {
    const level = score > 0.9 ? 'exceptional' : score > 0.8 ? 'strong' : 'good';
    
    const descriptions: Record<string, string> = {
      'Phonetic Flow': `${level} pronunciation and sound quality`,
      'Semantic Coherence': `${level} meaning and conceptual clarity`,
      'Creativity': `${level} originality and innovation`,
      'Market Appeal': `${level} commercial potential`,
      'Memorability': `${level} impact and recall value`,
      'Uniqueness': `${level} distinctiveness`
    };
    
    return descriptions[dimension] || `${level} performance in ${dimension}`;
  }
  
  /**
   * Identify improvement opportunities
   */
  private identifyImprovementOpportunities(name: EnhancedNameQualityResult): ImprovementOpportunity[] {
    const breakdown = name.score.breakdown;
    const opportunities: ImprovementOpportunity[] = [];
    
    const dimensions = [
      { key: 'phoneticFlow', label: 'Phonetic Flow', difficulty: 'medium' as const },
      { key: 'semanticCoherence', label: 'Semantic Coherence', difficulty: 'hard' as const },
      { key: 'creativity', label: 'Creativity', difficulty: 'hard' as const },
      { key: 'marketAppeal', label: 'Market Appeal', difficulty: 'medium' as const },
      { key: 'memorability', label: 'Memorability', difficulty: 'easy' as const },
      { key: 'uniqueness', label: 'Uniqueness', difficulty: 'medium' as const }
    ];
    
    for (const dimension of dimensions) {
      const currentScore = breakdown[dimension.key as keyof EnhancedScoreBreakdown] as number;
      if (currentScore < 0.7) {
        const potentialScore = Math.min(1, currentScore + 0.2);
        const impact = potentialScore - currentScore > 0.15 ? 'high' : 
                      potentialScore - currentScore > 0.1 ? 'medium' : 'low';
        
        opportunities.push({
          dimension: dimension.label,
          currentScore,
          potentialScore,
          difficulty: dimension.difficulty,
          impact: impact as 'high' | 'medium' | 'low',
          suggestion: this.generateImprovementSuggestion(dimension.label, currentScore)
        });
      }
    }
    
    return opportunities.sort((a, b) => {
      // Sort by impact then by difficulty (easier first)
      const impactOrder = { high: 3, medium: 2, low: 1 };
      const difficultyOrder = { easy: 3, medium: 2, hard: 1 };
      
      const impactDiff = impactOrder[b.impact] - impactOrder[a.impact];
      if (impactDiff !== 0) return impactDiff;
      
      return difficultyOrder[b.difficulty] - difficultyOrder[a.difficulty];
    });
  }
  
  /**
   * Generate improvement suggestion
   */
  private generateImprovementSuggestion(dimension: string, currentScore: number): string {
    const suggestions: Record<string, string> = {
      'Phonetic Flow': currentScore < 0.4 ? 'Consider names with smoother consonant-vowel patterns' :
                      'Look for names with better syllable flow',
      'Semantic Coherence': currentScore < 0.4 ? 'Choose words that relate more clearly to music or band identity' :
                           'Ensure words work well together conceptually',
      'Creativity': currentScore < 0.4 ? 'Explore more unique word combinations or invented words' :
                   'Add creative elements like wordplay or metaphors',
      'Market Appeal': currentScore < 0.4 ? 'Consider broader audience appeal and accessibility' :
                      'Balance uniqueness with mainstream appeal',
      'Memorability': currentScore < 0.4 ? 'Choose shorter, punchier names with strong sounds' :
                     'Enhance rhythm and catchiness',
      'Uniqueness': currentScore < 0.4 ? 'Avoid common music terminology and clichés' :
                   'Add distinctive elements to stand out'
    };
    
    return suggestions[dimension] || `Improve ${dimension} through careful word selection`;
  }
  
  /**
   * Assess market position
   */
  private assessMarketPosition(name: EnhancedNameQualityResult): MarketPosition {
    const breakdown = name.score.breakdown;
    const overall = name.score.overall;
    
    // Determine segment
    let segment: 'premium' | 'mainstream' | 'budget' | 'experimental';
    if (overall > 0.8) segment = 'premium';
    else if (breakdown.creativity > 0.8 && breakdown.marketAppeal < 0.6) segment = 'experimental';
    else if (breakdown.marketAppeal > 0.7) segment = 'mainstream';
    else segment = 'budget';
    
    // Determine appeal
    let appeal: 'broad' | 'niche' | 'specialized';
    if (breakdown.marketAppeal > 0.7 && breakdown.appropriateness > 0.7) appeal = 'broad';
    else if (breakdown.uniqueness > 0.8 || breakdown.creativity > 0.8) appeal = 'specialized';
    else appeal = 'niche';
    
    // Determine viability
    let viability: 'high' | 'medium' | 'low';
    if (overall > 0.75) viability = 'high';
    else if (overall > 0.55) viability = 'medium';
    else viability = 'low';
    
    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high';
    if (breakdown.uniqueness > 0.8 || breakdown.creativity > 0.8) riskLevel = 'high';
    else if (breakdown.marketAppeal < 0.5) riskLevel = 'medium';
    else riskLevel = 'low';
    
    // Calculate target match (how well it matches intended context)
    const targetMatch = (breakdown.appropriateness + breakdown.contextualFit) / 2;
    
    return {
      segment,
      appeal,
      viability,
      riskLevel,
      targetMatch
    };
  }
  
  /**
   * Generate ranking explanation
   */
  private generateRankingExplanation(
    name: EnhancedNameQualityResult,
    competitivePosition: CompetitivePosition,
    request: ComparativeRankingRequest
  ): RankingExplanation {
    const breakdown = name.score.breakdown;
    const overall = name.score.overall;
    
    // Primary reasons for ranking
    const primaryReasons: string[] = [];
    if (overall > 0.8) primaryReasons.push('Exceptional overall quality');
    if (competitivePosition.percentileScore > 80) primaryReasons.push('Strong competitive position');
    if (breakdown.marketAppeal > 0.8) primaryReasons.push('High market appeal');
    if (breakdown.creativity > 0.8) primaryReasons.push('Strong creative innovation');
    if (breakdown.phoneticFlow > 0.8) primaryReasons.push('Excellent sound quality');
    
    // Detailed analysis
    const detailedAnalysis: DetailedAnalysis = {
      strengthSummary: this.generateStrengthSummary(breakdown),
      improvementSummary: this.generateImprovementSummary(breakdown),
      marketingSummary: this.generateMarketingSummary(breakdown),
      competitiveSummary: this.generateCompetitiveSummary(competitivePosition),
      overallAssessment: this.generateOverallAssessment(overall, competitivePosition)
    };
    
    // Comparison points
    const comparisonPoints = this.generateComparisonPoints(name, competitivePosition);
    
    // Quality highlights
    const qualityHighlights = this.generateQualityHighlights(breakdown);
    
    // Caution areas
    const cautionAreas = this.generateCautionAreas(breakdown);
    
    return {
      primaryReasons,
      detailedAnalysis,
      comparisonPoints,
      qualityHighlights,
      cautionAreas
    };
  }
  
  /**
   * Generate strength summary
   */
  private generateStrengthSummary(breakdown: EnhancedScoreBreakdown): string {
    const strengths: string[] = [];
    
    if (breakdown.phoneticFlow > 0.7) strengths.push('phonetic appeal');
    if (breakdown.semanticCoherence > 0.7) strengths.push('semantic clarity');
    if (breakdown.creativity > 0.7) strengths.push('creative innovation');
    if (breakdown.marketAppeal > 0.7) strengths.push('market viability');
    if (breakdown.memorability > 0.7) strengths.push('memorability');
    
    if (strengths.length === 0) return 'Shows potential with room for development';
    if (strengths.length === 1) return `Primary strength in ${strengths[0]}`;
    if (strengths.length === 2) return `Strong ${strengths[0]} and ${strengths[1]}`;
    
    return `Multiple strengths including ${strengths.slice(0, 2).join(', ')}, and ${strengths.slice(2).join(', ')}`;
  }
  
  /**
   * Generate improvement summary
   */
  private generateImprovementSummary(breakdown: EnhancedScoreBreakdown): string {
    const improvements: string[] = [];
    
    if (breakdown.phoneticFlow < 0.6) improvements.push('phonetic flow');
    if (breakdown.semanticCoherence < 0.6) improvements.push('semantic coherence');
    if (breakdown.creativity < 0.6) improvements.push('creativity');
    if (breakdown.marketAppeal < 0.6) improvements.push('market appeal');
    if (breakdown.memorability < 0.6) improvements.push('memorability');
    
    if (improvements.length === 0) return 'Strong across all dimensions';
    if (improvements.length === 1) return `Could benefit from improved ${improvements[0]}`;
    
    return `Opportunities for improvement in ${improvements.slice(0, 2).join(' and ')}`;
  }
  
  /**
   * Generate marketing summary
   */
  private generateMarketingSummary(breakdown: EnhancedScoreBreakdown): string {
    const marketScore = breakdown.marketAppeal;
    const culturalScore = breakdown.culturalAppeal;
    
    if (marketScore > 0.8 && culturalScore > 0.8) {
      return 'Excellent commercial potential with strong cultural appeal';
    } else if (marketScore > 0.7) {
      return 'Good commercial viability for mainstream markets';
    } else if (culturalScore > 0.7) {
      return 'Strong cultural resonance for targeted audiences';
    } else if (marketScore > 0.5) {
      return 'Moderate commercial potential, may suit niche markets';
    } else {
      return 'Limited commercial appeal, better suited for experimental projects';
    }
  }
  
  /**
   * Generate competitive summary
   */
  private generateCompetitiveSummary(competitivePosition: CompetitivePosition): string {
    const percentile = competitivePosition.percentileScore;
    
    if (percentile > 90) {
      return 'Exceptional competitive position, outperforms nearly all alternatives';
    } else if (percentile > 75) {
      return 'Strong competitive advantage over most alternatives';
    } else if (percentile > 50) {
      return 'Solid competitive position, performs better than average';
    } else if (percentile > 25) {
      return 'Below-average competitive position with room for improvement';
    } else {
      return 'Weak competitive position, significant improvements needed';
    }
  }
  
  /**
   * Generate overall assessment
   */
  private generateOverallAssessment(
    overall: number, 
    competitivePosition: CompetitivePosition
  ): string {
    const qualityLevel = overall > 0.8 ? 'excellent' : overall > 0.6 ? 'good' : 'fair';
    const competitiveLevel = competitivePosition.percentileScore > 75 ? 'strong' : 
                            competitivePosition.percentileScore > 50 ? 'moderate' : 'weak';
    
    return `${qualityLevel.charAt(0).toUpperCase() + qualityLevel.slice(1)} quality name with ${competitiveLevel} competitive positioning`;
  }
  
  /**
   * Generate comparison points
   */
  private generateComparisonPoints(
    name: EnhancedNameQualityResult,
    competitivePosition: CompetitivePosition
  ): ComparisonPoint[] {
    const points: ComparisonPoint[] = [];
    
    // Add top comparison points based on competitive advantages
    competitivePosition.differentiationFactors.slice(0, 3).forEach(factor => {
      const comparedNames = competitivePosition.underperforms.slice(0, 2);
      if (comparedNames.length > 0) {
        points.push({
          comparedTo: comparedNames.join(' and '),
          dimension: factor.dimension,
          advantage: factor.description,
          quantification: `${(factor.impact * 100).toFixed(0)}% stronger`
        });
      }
    });
    
    return points;
  }
  
  /**
   * Generate quality highlights
   */
  private generateQualityHighlights(breakdown: EnhancedScoreBreakdown): string[] {
    const highlights: string[] = [];
    
    if (breakdown.phoneticSemanticAlignment > 0.8) {
      highlights.push('Perfect alignment between sound and meaning');
    }
    
    if (breakdown.phoneticFlow > 0.85) {
      highlights.push('Exceptional pronunciation and flow');
    }
    
    if (breakdown.creativity > 0.85) {
      highlights.push('Highly innovative and original');
    }
    
    if (breakdown.memorability > 0.85) {
      highlights.push('Very memorable and impactful');
    }
    
    if (breakdown.culturalAppeal > 0.85) {
      highlights.push('Strong cultural resonance');
    }
    
    return highlights;
  }
  
  /**
   * Generate caution areas
   */
  private generateCautionAreas(breakdown: EnhancedScoreBreakdown): string[] {
    const cautions: string[] = [];
    
    if (breakdown.pronunciation < 0.5) {
      cautions.push('May be difficult to pronounce');
    }
    
    if (breakdown.marketAppeal < 0.4) {
      cautions.push('Limited commercial appeal');
    }
    
    if (breakdown.appropriateness < 0.5) {
      cautions.push('May not fit well with intended genre/context');
    }
    
    if (breakdown.memorability < 0.4) {
      cautions.push('May lack memorability and impact');
    }
    
    if (breakdown.uniqueness < 0.3) {
      cautions.push('May be too generic or common');
    }
    
    return cautions;
  }
  
  /**
   * Optimize ranking for diversity
   */
  private optimizeForDiversity(
    rankedNames: ComparativeRankedName[],
    request: ComparativeRankingRequest
  ): ComparativeRankedName[] {
    const diversityWeight = request.rankingOptions.diversityWeight || 0;
    
    if (diversityWeight === 0 || rankedNames.length <= 1) {
      return rankedNames;
    }
    
    // Use greedy algorithm to select diverse set
    const diversified: ComparativeRankedName[] = [];
    const remaining = [...rankedNames];
    
    // Always start with the highest-rated name
    if (remaining.length > 0) {
      diversified.push(remaining.shift()!);
    }
    
    // Select subsequent names balancing quality and diversity
    while (remaining.length > 0 && diversified.length < rankedNames.length) {
      let bestCandidate = remaining[0];
      let bestScore = this.calculateDiversityAdjustedScore(
        bestCandidate, 
        diversified, 
        diversityWeight
      );
      let bestIndex = 0;
      
      for (let i = 1; i < remaining.length; i++) {
        const candidate = remaining[i];
        const score = this.calculateDiversityAdjustedScore(
          candidate, 
          diversified, 
          diversityWeight
        );
        
        if (score > bestScore) {
          bestScore = score;
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
   * Calculate diversity-adjusted score
   */
  private calculateDiversityAdjustedScore(
    candidate: ComparativeRankedName,
    existingSelection: ComparativeRankedName[],
    diversityWeight: number
  ): number {
    const qualityScore = candidate.overallScore;
    
    if (existingSelection.length === 0) {
      return qualityScore;
    }
    
    // Calculate diversity bonus based on how different this candidate is
    let diversityScore = 1.0;
    for (const existing of existingSelection) {
      const similarity = this.calculateQualityProfileSimilarity(
        candidate.qualityProfile, 
        existing.qualityProfile
      );
      diversityScore *= (1 - similarity);
    }
    
    // Combine quality and diversity
    return qualityScore * (1 - diversityWeight) + diversityScore * diversityWeight;
  }
  
  /**
   * Calculate similarity between quality profiles
   */
  private calculateQualityProfileSimilarity(
    profile1: QualityProfile,
    profile2: QualityProfile
  ): number {
    const dims1 = Object.values(profile1.dimensions);
    const dims2 = Object.values(profile2.dimensions);
    
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
   * Generate comparative analytics
   */
  private generateComparativeAnalytics(
    scoredNames: EnhancedNameQualityResult[],
    rankedNames: ComparativeRankedName[]
  ): ComparativeAnalytics {
    const scores = scoredNames.map(n => n.score.overall);
    
    // Quality distribution statistics
    const qualityDistribution: QualityDistributionStats = {
      mean: scores.reduce((sum, score) => sum + score, 0) / scores.length,
      median: this.calculateMedian(scores),
      standardDeviation: this.calculateStandardDeviation(scores),
      range: { min: Math.min(...scores), max: Math.max(...scores) },
      quartiles: this.calculateQuartiles(scores),
      outliers: this.identifyOutliers(scoredNames)
    };
    
    // Dimensional analysis
    const dimensionalAnalysis = this.generateDimensionalAnalysisStats(scoredNames);
    
    // Competitive spread analysis
    const competitiveSpread = this.generateCompetitiveSpreadStats(rankedNames);
    
    // Diversity metrics
    const diversityMetrics = this.calculateDiversityMetrics(rankedNames);
    
    // Trend analysis
    const trendAnalysis = this.generateTrendAnalysis(scoredNames);
    
    return {
      totalAnalyzed: scoredNames.length,
      qualityDistribution,
      dimensionalAnalysis,
      competitiveSpread,
      diversityMetrics,
      trendAnalysis
    };
  }
  
  /**
   * Calculate median value
   */
  private calculateMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }
  
  /**
   * Calculate standard deviation
   */
  private calculateStandardDeviation(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }
  
  /**
   * Calculate quartiles
   */
  private calculateQuartiles(values: number[]): { q1: number; q2: number; q3: number } {
    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;
    
    return {
      q1: sorted[Math.floor(n * 0.25)],
      q2: this.calculateMedian(sorted),
      q3: sorted[Math.floor(n * 0.75)]
    };
  }
  
  /**
   * Identify outliers in scored names
   */
  private identifyOutliers(scoredNames: EnhancedNameQualityResult[]): { low: string[]; high: string[] } {
    const scores = scoredNames.map(n => n.score.overall);
    const q1 = scores[Math.floor(scores.length * 0.25)];
    const q3 = scores[Math.floor(scores.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    
    const low: string[] = [];
    const high: string[] = [];
    
    scoredNames.forEach(name => {
      if (name.score.overall < lowerBound) {
        low.push(name.name);
      } else if (name.score.overall > upperBound) {
        high.push(name.name);
      }
    });
    
    return { low, high };
  }
  
  /**
   * Generate dimensional analysis statistics
   */
  private generateDimensionalAnalysisStats(scoredNames: EnhancedNameQualityResult[]): DimensionalAnalysisStats {
    const dimensions = ['phoneticFlow', 'semanticCoherence', 'creativity', 'marketAppeal'];
    
    const stats: Record<string, DimensionStats> = {};
    const correlations = this.calculateDimensionCorrelations(scoredNames);
    
    for (const dimension of dimensions) {
      const scores = scoredNames.map(n => 
        n.score.breakdown[dimension as keyof EnhancedScoreBreakdown] as number
      );
      
      const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
      
      // Find top and bottom performers
      const indexed = scoredNames.map((name, index) => ({ name: name.name, score: scores[index] }));
      indexed.sort((a, b) => b.score - a.score);
      
      stats[dimension] = {
        mean,
        variance,
        topPerformers: indexed.slice(0, 3).map(item => item.name),
        underperformers: indexed.slice(-3).map(item => item.name),
        distribution: this.createDistribution(scores)
      };
    }
    
    return {
      phoneticStats: stats.phoneticFlow,
      semanticStats: stats.semanticCoherence,
      creativityStats: stats.creativity,
      marketabilityStats: stats.marketAppeal,
      correlations
    };
  }
  
  /**
   * Calculate correlations between dimensions
   */
  private calculateDimensionCorrelations(scoredNames: EnhancedNameQualityResult[]): DimensionCorrelations {
    const phoneticScores = scoredNames.map(n => n.score.breakdown.phoneticFlow);
    const semanticScores = scoredNames.map(n => n.score.breakdown.semanticCoherence);
    const creativityScores = scoredNames.map(n => n.score.breakdown.creativity);
    const marketabilityScores = scoredNames.map(n => n.score.breakdown.marketAppeal);
    const pronunciationScores = scoredNames.map(n => n.score.breakdown.pronunciation);
    const memorabilityScores = scoredNames.map(n => n.score.breakdown.memorability);
    const contextualFitScores = scoredNames.map(n => n.score.breakdown.appropriateness);
    const overallScores = scoredNames.map(n => n.score.overall);
    
    return {
      phoneticSemantic: this.calculateCorrelation(phoneticScores, semanticScores),
      creativityMarketability: this.calculateCorrelation(creativityScores, marketabilityScores),
      pronunciationMemorability: this.calculateCorrelation(pronunciationScores, memorabilityScores),
      contextualFitOverall: this.calculateCorrelation(contextualFitScores, overallScores)
    };
  }
  
  /**
   * Calculate Pearson correlation coefficient
   */
  private calculateCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
    const sumY2 = y.reduce((sum, val) => sum + val * val, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }
  
  /**
   * Create distribution array for scores
   */
  private createDistribution(scores: number[]): number[] {
    const buckets = [0, 0, 0, 0, 0]; // 0-0.2, 0.2-0.4, 0.4-0.6, 0.6-0.8, 0.8-1.0
    
    scores.forEach(score => {
      const bucket = Math.min(Math.floor(score * 5), 4);
      buckets[bucket]++;
    });
    
    return buckets;
  }
  
  /**
   * Generate competitive spread statistics
   */
  private generateCompetitiveSpreadStats(rankedNames: ComparativeRankedName[]): CompetitiveSpreadStats {
    const scores = rankedNames.map(n => n.overallScore);
    
    // Calculate competitive gaps (distance between consecutive ranks)
    const gaps = [];
    for (let i = 1; i < scores.length; i++) {
      gaps.push(scores[i - 1] - scores[i]);
    }
    const competitiveGaps = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
    
    // Clustering index (how clustered vs spread out the scores are)
    const std = this.calculateStandardDeviation(scores);
    const range = Math.max(...scores) - Math.min(...scores);
    const clusteringIndex = range > 0 ? 1 - (std / range) : 1;
    
    // Differentiation score (average uniqueness of top performers)
    const topHalf = rankedNames.slice(0, Math.ceil(rankedNames.length / 2));
    const differentiationScore = topHalf.reduce((sum, name) => 
      sum + name.qualityProfile.dimensions.distinctiveness, 0) / topHalf.length;
    
    // Market coverage (how well the names cover different market segments)
    const segments = new Set(rankedNames.map(n => n.marketPosition.segment));
    const marketCoverage = segments.size / 4; // Normalize by total possible segments
    
    return {
      competitiveGaps,
      clusteringIndex,
      differentiationScore,
      marketCoverage
    };
  }
  
  /**
   * Calculate diversity metrics
   */
  private calculateDiversityMetrics(rankedNames: ComparativeRankedName[]): DiversityMetrics {
    // Diversity index using Simpson's diversity index
    const profiles = rankedNames.map(n => n.qualityProfile);
    let diversityIndex = 0;
    
    for (let i = 0; i < profiles.length; i++) {
      for (let j = i + 1; j < profiles.length; j++) {
        const similarity = this.calculateQualityProfileSimilarity(profiles[i], profiles[j]);
        diversityIndex += (1 - similarity);
      }
    }
    
    diversityIndex = diversityIndex / ((profiles.length * (profiles.length - 1)) / 2);
    
    // Simple clustering analysis
    const clusterThreshold = 0.8; // Similarity threshold for clustering
    const clusters: ComparativeRankedName[][] = [];
    const clustered = new Set<number>();
    
    for (let i = 0; i < rankedNames.length; i++) {
      if (clustered.has(i)) continue;
      
      const cluster = [rankedNames[i]];
      clustered.add(i);
      
      for (let j = i + 1; j < rankedNames.length; j++) {
        if (clustered.has(j)) continue;
        
        const similarity = this.calculateQualityProfileSimilarity(
          rankedNames[i].qualityProfile,
          rankedNames[j].qualityProfile
        );
        
        if (similarity > clusterThreshold) {
          cluster.push(rankedNames[j]);
          clustered.add(j);
        }
      }
      
      clusters.push(cluster);
    }
    
    // Calculate intra and inter-cluster distances
    let totalIntraDistance = 0;
    let intraCount = 0;
    
    for (const cluster of clusters) {
      for (let i = 0; i < cluster.length; i++) {
        for (let j = i + 1; j < cluster.length; j++) {
          const similarity = this.calculateQualityProfileSimilarity(
            cluster[i].qualityProfile,
            cluster[j].qualityProfile
          );
          totalIntraDistance += (1 - similarity);
          intraCount++;
        }
      }
    }
    
    const averageIntraClusterDistance = intraCount > 0 ? totalIntraDistance / intraCount : 0;
    
    let totalInterDistance = 0;
    let interCount = 0;
    
    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        for (const name1 of clusters[i]) {
          for (const name2 of clusters[j]) {
            const similarity = this.calculateQualityProfileSimilarity(
              name1.qualityProfile,
              name2.qualityProfile
            );
            totalInterDistance += (1 - similarity);
            interCount++;
          }
        }
      }
    }
    
    const averageInterClusterDistance = interCount > 0 ? totalInterDistance / interCount : 0;
    
    return {
      diversityIndex,
      clusterCount: clusters.length,
      averageIntraClusterDistance,
      averageInterClusterDistance
    };
  }
  
  /**
   * Generate trend analysis
   */
  private generateTrendAnalysis(scoredNames: EnhancedNameQualityResult[]): TrendAnalysis {
    // Simple trend analysis based on score distribution
    const scores = scoredNames.map(n => n.score.overall);
    const topQuartile = scores.filter(s => s >= 0.75).length / scores.length;
    
    let qualityTrend: 'improving' | 'stable' | 'declining';
    if (topQuartile > 0.4) qualityTrend = 'improving';
    else if (topQuartile > 0.2) qualityTrend = 'stable';
    else qualityTrend = 'declining';
    
    // Identify emerging strengths
    const emergingStrengths: string[] = [];
    const dimensionalAverages = this.calculateOverallDimensionalAverages(scoredNames);
    
    if (dimensionalAverages.creativity > 0.7) emergingStrengths.push('Creative innovation');
    if (dimensionalAverages.phoneticFlow > 0.7) emergingStrengths.push('Phonetic quality');
    if (dimensionalAverages.culturalAppeal > 0.7) emergingStrengths.push('Cultural relevance');
    
    // Identify declining areas
    const decliningAreas: string[] = [];
    if (dimensionalAverages.marketAppeal < 0.5) decliningAreas.push('Market appeal');
    if (dimensionalAverages.memorability < 0.5) decliningAreas.push('Memorability');
    if (dimensionalAverages.uniqueness < 0.5) decliningAreas.push('Uniqueness');
    
    // Innovation index
    const innovationIndex = (dimensionalAverages.creativity + dimensionalAverages.uniqueness) / 2;
    
    return {
      qualityTrend,
      emergingStrengths,
      decliningAreas,
      innovationIndex
    };
  }
  
  /**
   * Generate quality insights
   */
  private generateQualityInsights(
    scoredNames: EnhancedNameQualityResult[],
    analytics: ComparativeAnalytics
  ): QualityInsights {
    const keyFindings = this.generateKeyFindings(analytics);
    const qualityPatterns = this.identifyQualityPatterns(scoredNames);
    const dimensionalInsights = this.generateDimensionalInsights(analytics);
    const crossDimensionalSynergies = this.identifyDimensionalSynergies(scoredNames);
    const industryComparisons = this.generateIndustryComparisons(analytics);
    
    return {
      keyFindings,
      qualityPatterns,
      dimensionalInsights,
      crossDimensionalSynergies,
      industryComparisons
    };
  }
  
  /**
   * Generate key findings
   */
  private generateKeyFindings(analytics: ComparativeAnalytics): string[] {
    const findings: string[] = [];
    
    if (analytics.qualityDistribution.mean > 0.7) {
      findings.push('Overall high quality across the portfolio');
    } else if (analytics.qualityDistribution.mean < 0.5) {
      findings.push('Quality improvement needed across the portfolio');
    }
    
    if (analytics.diversityMetrics.diversityIndex > 0.7) {
      findings.push('Good diversity in name characteristics');
    } else if (analytics.diversityMetrics.diversityIndex < 0.3) {
      findings.push('Limited diversity - names are quite similar');
    }
    
    if (analytics.competitiveSpread.differentiationScore > 0.7) {
      findings.push('Strong differentiation potential');
    }
    
    if (analytics.trendAnalysis.innovationIndex > 0.7) {
      findings.push('High innovation and creativity levels');
    }
    
    return findings;
  }
  
  /**
   * Identify quality patterns
   */
  private identifyQualityPatterns(scoredNames: EnhancedNameQualityResult[]): QualityPattern[] {
    const patterns: QualityPattern[] = [];
    
    // High creativity + low market appeal pattern
    const creativeNiche = scoredNames.filter(n => 
      n.score.breakdown.creativity > 0.7 && n.score.breakdown.marketAppeal < 0.5
    );
    
    if (creativeNiche.length > 0) {
      patterns.push({
        pattern: 'High creativity with limited market appeal',
        frequency: creativeNiche.length / scoredNames.length,
        impact: 'May limit commercial viability',
        examples: creativeNiche.slice(0, 3).map(n => n.name)
      });
    }
    
    // Balanced quality pattern
    const balanced = scoredNames.filter(n => n.score.qualityVector.balance > 0.7);
    
    if (balanced.length > 0) {
      patterns.push({
        pattern: 'Well-balanced across all dimensions',
        frequency: balanced.length / scoredNames.length,
        impact: 'Reduces risk and broadens appeal',
        examples: balanced.slice(0, 3).map(n => n.name)
      });
    }
    
    return patterns;
  }
  
  /**
   * Generate dimensional insights
   */
  private generateDimensionalInsights(analytics: ComparativeAnalytics): DimensionalInsight[] {
    const insights: DimensionalInsight[] = [];
    
    // Phonetic insights
    if (analytics.dimensionalAnalysis.phoneticStats.mean > 0.7) {
      insights.push({
        dimension: 'Phonetic Quality',
        insight: 'Strong phonetic appeal across the portfolio',
        significance: 'high',
        actionableAdvice: 'Leverage phonetic strengths in marketing and branding'
      });
    } else if (analytics.dimensionalAnalysis.phoneticStats.mean < 0.5) {
      insights.push({
        dimension: 'Phonetic Quality',
        insight: 'Phonetic appeal needs improvement',
        significance: 'high',
        actionableAdvice: 'Focus on pronunciation and sound flow in future generations'
      });
    }
    
    // Semantic insights
    if (analytics.dimensionalAnalysis.semanticStats.variance > 0.1) {
      insights.push({
        dimension: 'Semantic Coherence',
        insight: 'High variance in semantic quality',
        significance: 'medium',
        actionableAdvice: 'Standardize semantic evaluation criteria'
      });
    }
    
    // Creativity insights
    if (analytics.dimensionalAnalysis.creativityStats.mean > 0.8) {
      insights.push({
        dimension: 'Creativity',
        insight: 'Exceptional creative innovation',
        significance: 'high',
        actionableAdvice: 'Balance creativity with market considerations'
      });
    }
    
    return insights;
  }
  
  /**
   * Identify dimensional synergies
   */
  private identifyDimensionalSynergies(scoredNames: EnhancedNameQualityResult[]): SynergyInsight[] {
    const synergies: SynergyInsight[] = [];
    
    // Find names with high phonetic-semantic alignment
    const alignedNames = scoredNames.filter(n => 
      n.score.breakdown.phoneticSemanticAlignment > 0.8
    );
    
    if (alignedNames.length > 0) {
      synergies.push({
        dimensions: ['Phonetic', 'Semantic'],
        synergyLevel: alignedNames.reduce((sum, n) => 
          sum + n.score.breakdown.phoneticSemanticAlignment, 0) / alignedNames.length,
        description: 'Strong alignment between sound and meaning',
        optimization: 'Prioritize names with natural sound-meaning connections'
      });
    }
    
    // Find creativity-marketability synergies
    const creativelySounds = scoredNames.filter(n => 
      n.score.breakdown.creativity > 0.7 && n.score.breakdown.marketAppeal > 0.7
    );
    
    if (creativelySounds.length > 0) {
      synergies.push({
        dimensions: ['Creativity', 'Market Appeal'],
        synergyLevel: creativelySounds.length / scoredNames.length,
        description: 'Successfully balances innovation with commercial viability',
        optimization: 'Develop processes to maintain creative-commercial balance'
      });
    }
    
    return synergies;
  }
  
  /**
   * Generate industry comparisons
   */
  private generateIndustryComparisons(analytics: ComparativeAnalytics): IndustryComparison[] {
    // Placeholder industry benchmarks - in real implementation, these would come from data
    const industryBenchmarks = {
      'Overall Quality': 0.65,
      'Phonetic Appeal': 0.62,
      'Creative Innovation': 0.58,
      'Market Viability': 0.70,
      'Memorability': 0.60
    };
    
    const comparisons: IndustryComparison[] = [];
    
    comparisons.push({
      benchmark: 'Overall Quality',
      ourPerformance: analytics.qualityDistribution.mean,
      industryAverage: industryBenchmarks['Overall Quality'],
      percentileRank: (analytics.qualityDistribution.mean / industryBenchmarks['Overall Quality']) * 50 + 50,
      competitiveAdvantage: analytics.qualityDistribution.mean > industryBenchmarks['Overall Quality']
    });
    
    comparisons.push({
      benchmark: 'Phonetic Appeal',
      ourPerformance: analytics.dimensionalAnalysis.phoneticStats.mean,
      industryAverage: industryBenchmarks['Phonetic Appeal'],
      percentileRank: (analytics.dimensionalAnalysis.phoneticStats.mean / industryBenchmarks['Phonetic Appeal']) * 50 + 50,
      competitiveAdvantage: analytics.dimensionalAnalysis.phoneticStats.mean > industryBenchmarks['Phonetic Appeal']
    });
    
    return comparisons;
  }
  
  /**
   * Generate ranking recommendations
   */
  private generateRankingRecommendations(
    rankedNames: ComparativeRankedName[],
    analytics: ComparativeAnalytics,
    qualityInsights: QualityInsights,
    request: ComparativeRankingRequest
  ): RankingRecommendations {
    // Top choices with explanations
    const topChoices: TopChoice[] = rankedNames.slice(0, 3).map((name, index) => ({
      name: name.name,
      reason: this.generateTopChoiceReason(name, index),
      useCase: this.generateUseCase(name),
      confidenceLevel: name.confidenceScore
    }));
    
    // Diversified portfolio selection
    const diversifiedPortfolio = this.selectDiversifiedPortfolio(rankedNames);
    
    // Contextual best choices
    const contextualBest = this.generateContextualBest(rankedNames, request);
    
    // Strategic advice
    const strategicAdvice = this.generateStrategicAdvice(analytics, qualityInsights);
    
    // Next steps
    const nextSteps = this.generateNextSteps(rankedNames, analytics);
    
    return {
      topChoices,
      diversifiedPortfolio,
      contextualBest,
      strategicAdvice,
      nextSteps
    };
  }
  
  /**
   * Generate reason for top choice
   */
  private generateTopChoiceReason(name: ComparativeRankedName, rank: number): string {
    const strengths = name.strengthAreas.slice(0, 2).map(s => s.dimension.toLowerCase());
    
    if (rank === 0) {
      return `Highest overall quality with exceptional ${strengths.join(' and ')}`;
    } else if (rank === 1) {
      return `Strong alternative with excellent ${strengths.join(' and ')}`;
    } else {
      return `Solid choice featuring good ${strengths.join(' and ')}`;
    }
  }
  
  /**
   * Generate use case for name
   */
  private generateUseCase(name: ComparativeRankedName): string {
    const marketPosition = name.marketPosition;
    
    if (marketPosition.segment === 'premium') {
      return 'Best for professional releases and mainstream appeal';
    } else if (marketPosition.segment === 'experimental') {
      return 'Ideal for artistic projects and creative expression';
    } else if (marketPosition.segment === 'mainstream') {
      return 'Perfect for broad audience appeal and commercial success';
    } else {
      return 'Suitable for independent releases and niche markets';
    }
  }
  
  /**
   * Select diversified portfolio
   */
  private selectDiversifiedPortfolio(rankedNames: ComparativeRankedName[]): string[] {
    const portfolio: string[] = [];
    const segments = new Set<string>();
    
    // Select one from each market segment, prioritizing quality
    for (const name of rankedNames) {
      if (!segments.has(name.marketPosition.segment)) {
        portfolio.push(name.name);
        segments.add(name.marketPosition.segment);
        
        if (portfolio.length >= 4) break; // Limit portfolio size
      }
    }
    
    // Fill remaining slots with highest quality
    if (portfolio.length < 3) {
      for (const name of rankedNames) {
        if (!portfolio.includes(name.name)) {
          portfolio.push(name.name);
          if (portfolio.length >= 3) break;
        }
      }
    }
    
    return portfolio;
  }
  
  /**
   * Generate contextual best choices
   */
  private generateContextualBest(
    rankedNames: ComparativeRankedName[],
    request: ComparativeRankingRequest
  ): ContextualBest[] {
    const contextualBest: ContextualBest[] = [];
    
    // Best for creativity
    const mostCreative = rankedNames.reduce((prev, current) => 
      current.qualityProfile.dimensions.creativity > prev.qualityProfile.dimensions.creativity ? current : prev
    );
    
    contextualBest.push({
      context: 'Creative Innovation',
      name: mostCreative.name,
      rationale: 'Highest creativity score with strong artistic appeal'
    });
    
    // Best for market appeal
    const mostMarketary = rankedNames.reduce((prev, current) => 
      current.qualityProfile.dimensions.marketability > prev.qualityProfile.dimensions.marketability ? current : prev
    );
    
    contextualBest.push({
      context: 'Market Success',
      name: mostMarketary.name,
      rationale: 'Highest market appeal with commercial viability'
    });
    
    // Best for pronunciation
    const mostPronunceable = rankedNames.reduce((prev, current) => 
      current.qualityProfile.dimensions.pronunciation > prev.qualityProfile.dimensions.pronunciation ? current : prev
    );
    
    contextualBest.push({
      context: 'Easy Pronunciation',
      name: mostPronunceable.name,
      rationale: 'Clearest pronunciation and phonetic accessibility'
    });
    
    return contextualBest;
  }
  
  /**
   * Generate strategic advice
   */
  private generateStrategicAdvice(
    analytics: ComparativeAnalytics,
    qualityInsights: QualityInsights
  ): string[] {
    const advice: string[] = [];
    
    if (analytics.qualityDistribution.mean < 0.6) {
      advice.push('Focus on improving overall quality standards in name generation');
    }
    
    if (analytics.diversityMetrics.diversityIndex < 0.4) {
      advice.push('Increase diversity in naming approaches and styles');
    }
    
    if (analytics.trendAnalysis.innovationIndex < 0.5) {
      advice.push('Invest in more creative and innovative naming strategies');
    }
    
    if (analytics.competitiveSpread.marketCoverage < 0.5) {
      advice.push('Expand coverage across different market segments');
    }
    
    // Add insights-based advice
    qualityInsights.dimensionalInsights.forEach(insight => {
      if (insight.significance === 'high') {
        advice.push(insight.actionableAdvice);
      }
    });
    
    return advice;
  }
  
  /**
   * Generate next steps
   */
  private generateNextSteps(
    rankedNames: ComparativeRankedName[],
    analytics: ComparativeAnalytics
  ): string[] {
    const steps: string[] = [];
    
    // Always include top recommendation
    if (rankedNames.length > 0) {
      steps.push(`Consider "${rankedNames[0].name}" as the primary choice`);
    }
    
    // Quality-based steps
    if (analytics.qualityDistribution.mean < 0.7) {
      steps.push('Generate additional names to improve quality options');
    }
    
    // Diversity-based steps
    if (analytics.diversityMetrics.diversityIndex < 0.5) {
      steps.push('Explore different creative approaches for more variety');
    }
    
    // Competition-based steps
    if (analytics.competitiveSpread.competitiveGaps < 0.1) {
      steps.push('Focus on differentiation to stand out from alternatives');
    }
    
    // Market positioning steps
    const premiumCount = rankedNames.filter(n => n.marketPosition.segment === 'premium').length;
    if (premiumCount === 0) {
      steps.push('Consider generating names targeting premium market segment');
    }
    
    return steps;
  }
  
  /**
   * Calculate overall confidence in rankings
   */
  private calculateOverallConfidence(rankedNames: ComparativeRankedName[]): number {
    if (rankedNames.length === 0) return 0;
    
    const avgConfidence = rankedNames.reduce((sum, name) => sum + name.confidenceScore, 0) / rankedNames.length;
    
    // Adjust confidence based on score spread
    const scores = rankedNames.map(n => n.overallScore);
    const spread = Math.max(...scores) - Math.min(...scores);
    const spreadAdjustment = Math.min(spread, 0.1); // Cap adjustment
    
    return Math.min(1, avgConfidence + spreadAdjustment);
  }
  
  /**
   * Assess computation intensity
   */
  private assessComputationIntensity(request: ComparativeRankingRequest): 'light' | 'moderate' | 'intensive' {
    const nameCount = request.names.length;
    const explanationLevel = request.rankingOptions.explanationLevel;
    const includeCompetitive = request.rankingOptions.includeCompetitiveAnalysis;
    
    let intensity = 0;
    
    // Name count factor
    if (nameCount > 10) intensity += 2;
    else if (nameCount > 5) intensity += 1;
    
    // Explanation level factor
    if (explanationLevel === 'comprehensive') intensity += 2;
    else if (explanationLevel === 'detailed') intensity += 1;
    
    // Competitive analysis factor
    if (includeCompetitive) intensity += 1;
    
    if (intensity >= 4) return 'intensive';
    if (intensity >= 2) return 'moderate';
    return 'light';
  }
  
  /**
   * Generate cache key for request
   */
  private generateCacheKey(request: ComparativeRankingRequest): string {
    const keyData = {
      names: request.names.sort(), // Sort for consistent caching
      context: request.context,
      mode: request.rankingOptions.mode,
      priorities: request.rankingOptions.priorityDimensions?.sort(),
      diversityWeight: request.rankingOptions.diversityWeight,
      explanationLevel: request.rankingOptions.explanationLevel,
      includeCompetitive: request.rankingOptions.includeCompetitiveAnalysis
    };
    
    return `comparative_ranking_${JSON.stringify(keyData)}`;
  }
}

// Export singleton instance
export const comparativeRankingEngine = new ComparativeRankingEngine();