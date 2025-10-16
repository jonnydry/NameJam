/**
 * Ranking Intelligence System
 * Provides adaptive ranking algorithms with user preference learning and optimization
 */

import type {
  EnhancedNameQualityResult,
  EnhancedScoreBreakdown,
  QualityVector,
  EnhancedNameScoringRequest
} from './enhancedInterfaces';

import type { UserPreferences, UserFeedback } from '@shared/schema';
import { secureLog } from '../../utils/secureLogger';
import { CacheService } from '../cacheService';

export interface RankingIntelligenceRequest {
  names: EnhancedNameQualityResult[];
  context: RankingContext;
  preferences: UserPreferences;
  learningConfig: LearningConfiguration;
  optimizationTargets: OptimizationTargets;
}

export interface RankingContext {
  userId?: string;
  sessionId?: string;
  genre?: string;
  mood?: string;
  type: 'band' | 'song';
  targetAudience?: 'mainstream' | 'niche' | 'experimental';
  useCase: 'creative' | 'commercial' | 'personal' | 'professional';
  timeContext?: 'immediate' | 'planned' | 'exploratory';
  culturalContext?: string;
  collaborationMode?: 'solo' | 'band' | 'producer';
}

export interface LearningConfiguration {
  enabled: boolean;
  personalizedLearning: boolean;
  aggregateLearning: boolean;
  learningSpeed: 'conservative' | 'moderate' | 'aggressive';
  adaptationScope: 'session' | 'user' | 'global';
  feedbackWeight: number; // 0-1, how much to weight explicit feedback vs implicit signals
  temporalDecay: number; // How quickly old preferences fade
  confidenceThreshold: number; // Minimum confidence to apply learned preferences
}

export interface OptimizationTargets {
  primaryObjective: 'quality' | 'diversity' | 'personalization' | 'surprise' | 'balance';
  secondaryObjectives: string[];
  qualityFloor: number; // Minimum acceptable quality
  diversityTarget: number; // 0-1, desired diversity level
  noveltyWeight: number; // 0-1, preference for novel vs proven patterns
  riskTolerance: 'conservative' | 'moderate' | 'adventurous';
  explanationDetail: 'minimal' | 'standard' | 'detailed';
}

export interface IntelligentRankingResult {
  rankedNames: IntelligentRankedName[];
  learningInsights: LearningInsights;
  personalizationMetrics: PersonalizationMetrics;
  optimizationAnalysis: OptimizationAnalysis;
  adaptiveAdjustments: AdaptiveAdjustment[];
  recommendations: IntelligentRecommendations;
  metadata: RankingIntelligenceMetadata;
}

export interface IntelligentRankedName {
  name: string;
  rank: number;
  intelligentScore: number;
  qualityScore: number;
  personalizedScore: number;
  diversityScore: number;
  noveltyScore: number;
  confidenceScore: number;
  
  // Detailed analysis
  qualityProfile: QualityProfile;
  personalizationProfile: PersonalizationProfile;
  learningContribution: LearningContribution;
  competitiveAnalysis: CompetitiveAnalysis;
  
  // User-facing information
  explanation: IntelligentExplanation;
  strengths: IntelligentStrength[];
  opportunities: IntelligentOpportunity[];
  riskAssessment: RiskAssessment;
  useCaseAlignment: UseCaseAlignment;
}

export interface QualityProfile {
  dimensions: QualityDimensionProfile;
  crossDimensional: CrossDimensionalProfile;
  trends: QualityTrends;
  benchmarks: QualityBenchmarks;
}

export interface QualityDimensionProfile {
  phonetic: { score: number; trend: string; percentile: number };
  semantic: { score: number; trend: string; percentile: number };
  creativity: { score: number; trend: string; percentile: number };
  marketability: { score: number; trend: string; percentile: number };
  memorability: { score: number; trend: string; percentile: number };
  appropriateness: { score: number; trend: string; percentile: number };
}

export interface CrossDimensionalProfile {
  balance: number;
  synergy: number;
  consistency: number;
  optimization: string[];
}

export interface QualityTrends {
  overallTrend: 'improving' | 'stable' | 'declining';
  dimensionalTrends: Record<string, 'improving' | 'stable' | 'declining'>;
  predictedTrajectory: string;
}

export interface QualityBenchmarks {
  industryPercentile: number;
  genrePercentile: number;
  userHistoryPercentile: number;
  sessionPercentile: number;
}

export interface PersonalizationProfile {
  userAlignmentScore: number;
  preferenceMatches: PreferenceMatch[];
  historicalSimilarity: number;
  learningConfidence: number;
  adaptationFactors: AdaptationFactor[];
}

export interface PreferenceMatch {
  dimension: string;
  userPreference: number;
  nameScore: number;
  alignment: number;
  importance: number;
  confidence: number;
}

export interface AdaptationFactor {
  type: 'explicit_feedback' | 'implicit_behavior' | 'temporal_pattern' | 'contextual_preference';
  factor: string;
  weight: number;
  confidence: number;
  influence: string;
}

export interface LearningContribution {
  personalizedAdjustment: number;
  aggregateInfluence: number;
  noveltyBonus: number;
  experienceWeight: number;
  learningSource: string[];
}

export interface CompetitiveAnalysis {
  competitiveRank: number;
  differentiationStrength: number;
  marketPosition: string;
  competitiveAdvantages: string[];
  vulnerabilities: string[];
}

export interface IntelligentExplanation {
  primaryReason: string;
  supportingReasons: string[];
  personalizationReason?: string;
  qualityReason: string;
  competitiveReason: string;
  riskFactors: string[];
  confidenceExplanation: string;
}

export interface IntelligentStrength {
  category: 'quality' | 'personalization' | 'competitive' | 'creative' | 'market';
  strength: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  evidence: string[];
}

export interface IntelligentOpportunity {
  category: 'improvement' | 'optimization' | 'positioning' | 'development';
  opportunity: string;
  potential: 'high' | 'medium' | 'low';
  effort: 'easy' | 'medium' | 'hard';
  suggestion: string;
}

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high';
  riskFactors: RiskFactor[];
  mitigationStrategies: string[];
  confidenceLevel: number;
}

export interface RiskFactor {
  type: 'quality' | 'market' | 'cultural' | 'pronunciation' | 'uniqueness';
  risk: string;
  severity: 'low' | 'medium' | 'high';
  probability: number;
  impact: string;
}

export interface UseCaseAlignment {
  alignmentScore: number;
  suitability: 'excellent' | 'good' | 'fair' | 'poor';
  bestUseCases: string[];
  cautionUseCases: string[];
  optimization: string[];
}

export interface LearningInsights {
  userModelUpdates: UserModelUpdate[];
  patternDiscoveries: PatternDiscovery[];
  preferenceEvolution: PreferenceEvolution;
  learningVelocity: LearningVelocity;
  knowledgeGaps: KnowledgeGap[];
}

export interface UserModelUpdate {
  dimension: string;
  oldValue: number;
  newValue: number;
  confidence: number;
  evidence: string[];
  impact: string;
}

export interface PatternDiscovery {
  pattern: string;
  frequency: number;
  significance: 'high' | 'medium' | 'low';
  context: string[];
  implications: string[];
}

export interface PreferenceEvolution {
  stability: 'stable' | 'evolving' | 'fluctuating';
  trendDirection: string;
  changeMagnitude: number;
  confidenceLevel: number;
  keyChanges: string[];
}

export interface LearningVelocity {
  overallSpeed: 'fast' | 'moderate' | 'slow';
  dimensionalSpeeds: Record<string, 'fast' | 'moderate' | 'slow'>;
  adaptationRate: number;
  convergenceEstimate: string;
}

export interface KnowledgeGap {
  area: string;
  gapSize: number;
  importance: 'high' | 'medium' | 'low';
  suggestionToFill: string;
  dataNeeded: string[];
}

export interface PersonalizationMetrics {
  personalizationScore: number;
  adaptationAccuracy: number;
  learningProgress: number;
  userSatisfactionEstimate: number;
  diversityBalance: number;
  noveltyBalance: number;
  personalizationCoverage: PersonalizationCoverage;
}

export interface PersonalizationCoverage {
  dimensions: Record<string, number>;
  contexts: Record<string, number>;
  overallCoverage: number;
  confidenceDistribution: number[];
}

export interface OptimizationAnalysis {
  objectiveAchievement: ObjectiveAchievement;
  tradeoffAnalysis: TradeoffAnalysis;
  optimizationOpportunities: OptimizationOpportunity[];
  performanceMetrics: PerformanceMetrics;
  recommendedAdjustments: RecommendedAdjustment[];
}

export interface ObjectiveAchievement {
  primaryObjective: { target: string; achievement: number; gap: number };
  secondaryObjectives: Array<{ target: string; achievement: number; gap: number }>;
  overallSuccess: number;
  criticalGaps: string[];
}

export interface TradeoffAnalysis {
  qualityVsDiversity: TradeoffMetric;
  qualityVsPersonalization: TradeoffMetric;
  diversityVsPersonalization: TradeoffMetric;
  noveltyVsReliability: TradeoffMetric;
  overallBalance: number;
}

export interface TradeoffMetric {
  currentBalance: number;
  optimalBalance: number;
  tension: 'low' | 'medium' | 'high';
  recommendation: string;
}

export interface OptimizationOpportunity {
  area: string;
  currentPerformance: number;
  potentialImprovement: number;
  implementationCost: 'low' | 'medium' | 'high';
  expectedBenefit: string;
  priority: 'high' | 'medium' | 'low';
}

export interface PerformanceMetrics {
  rankingAccuracy: number;
  userSatisfactionScore: number;
  diversityAchievement: number;
  learningEffectiveness: number;
  adaptationSpeed: number;
  stabilityScore: number;
}

export interface RecommendedAdjustment {
  type: 'weight_adjustment' | 'threshold_change' | 'algorithm_tweak' | 'learning_rate';
  parameter: string;
  currentValue: number;
  recommendedValue: number;
  expectedImpact: string;
  confidence: number;
}

export interface AdaptiveAdjustment {
  type: 'personalization' | 'optimization' | 'learning' | 'balancing';
  adjustment: string;
  magnitude: number;
  confidence: number;
  rationale: string;
  expectedOutcome: string;
}

export interface IntelligentRecommendations {
  topRecommendations: TopRecommendation[];
  contextualRecommendations: ContextualRecommendation[];
  learningRecommendations: LearningRecommendation[];
  systemRecommendations: SystemRecommendation[];
  userGuidance: UserGuidance;
}

export interface TopRecommendation {
  name: string;
  category: 'best_overall' | 'best_personal' | 'best_creative' | 'best_safe' | 'best_unique';
  reason: string;
  confidence: number;
  useCase: string;
}

export interface ContextualRecommendation {
  context: string;
  recommendation: string;
  rationale: string;
  applicability: number;
}

export interface LearningRecommendation {
  area: string;
  recommendation: string;
  benefit: string;
  effort: 'low' | 'medium' | 'high';
}

export interface SystemRecommendation {
  component: string;
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
  expectedImpact: string;
}

export interface UserGuidance {
  primaryGuidance: string;
  tips: string[];
  warnings: string[];
  nextSteps: string[];
  learningOpportunities: string[];
}

export interface RankingIntelligenceMetadata {
  processingTime: number;
  algorithmVersion: string;
  learningDataVersion: number;
  personalizationLevel: 'none' | 'basic' | 'moderate' | 'advanced';
  confidenceLevel: number;
  adaptationsApplied: number;
  cacheStatus: string;
}

export interface UserLearningModel {
  userId: string;
  preferenceProfile: PreferenceProfile;
  behaviorPatterns: BehaviorPattern[];
  qualityAssociations: QualityAssociation[];
  contextualPreferences: ContextualPreference[];
  learningHistory: LearningEvent[];
  modelMetadata: ModelMetadata;
}

export interface PreferenceProfile {
  dimensions: Record<string, PreferenceDimension>;
  overallPreferences: OverallPreferences;
  confidence: Record<string, number>;
  stability: Record<string, number>;
  lastUpdated: number;
}

export interface PreferenceDimension {
  weight: number;
  threshold: number;
  tolerance: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  confidence: number;
  evidenceCount: number;
}

export interface OverallPreferences {
  riskTolerance: number;
  creativityPreference: number;
  marketabilityImportance: number;
  uniquenessDesire: number;
  qualityStandards: number;
  diversityAppetite: number;
}

export interface BehaviorPattern {
  pattern: string;
  frequency: number;
  strength: number;
  contexts: string[];
  reliability: number;
  lastObserved: number;
}

export interface QualityAssociation {
  qualityAttribute: string;
  userValue: number;
  systemValue: number;
  alignment: number;
  confidence: number;
  observations: number;
}

export interface ContextualPreference {
  context: string;
  preferences: Record<string, number>;
  strength: number;
  applicability: string[];
  reliability: number;
}

export interface LearningEvent {
  timestamp: number;
  eventType: 'explicit_feedback' | 'implicit_choice' | 'usage_pattern' | 'preference_expression';
  data: any;
  impact: number;
  confidence: number;
}

export interface ModelMetadata {
  version: number;
  trainingData: number;
  accuracy: number;
  coverage: number;
  lastTraining: number;
  nextUpdate: number;
}

export class RankingIntelligence {
  private cache: CacheService<IntelligentRankingResult>;
  private userModelCache: CacheService<UserLearningModel>;
  
  // User learning models storage
  private userModels: Map<string, UserLearningModel> = new Map();
  
  // Aggregate learning data
  private aggregatePatterns: Map<string, PatternDiscovery> = new Map();
  private globalPreferences: PreferenceProfile;
  
  // Algorithm configuration
  private readonly algorithmVersion = '2.0.0';
  private readonly defaultLearningRate = 0.1;
  private readonly temporalDecayRate = 0.95;
  
  // Ranking algorithm weights for different optimization targets
  private readonly optimizationWeights = {
    quality: {
      qualityScore: 0.6,
      personalizedScore: 0.15,
      diversityScore: 0.1,
      noveltyScore: 0.1,
      competitiveScore: 0.05
    },
    diversity: {
      diversityScore: 0.4,
      qualityScore: 0.3,
      noveltyScore: 0.2,
      personalizedScore: 0.1,
      competitiveScore: 0.0
    },
    personalization: {
      personalizedScore: 0.5,
      qualityScore: 0.25,
      diversityScore: 0.15,
      noveltyScore: 0.1,
      competitiveScore: 0.0
    },
    surprise: {
      noveltyScore: 0.4,
      diversityScore: 0.3,
      qualityScore: 0.2,
      personalizedScore: 0.1,
      competitiveScore: 0.0
    },
    balance: {
      qualityScore: 0.25,
      personalizedScore: 0.25,
      diversityScore: 0.25,
      noveltyScore: 0.15,
      competitiveScore: 0.1
    }
  };
  
  constructor() {
    // Initialize caches
    this.cache = new CacheService<IntelligentRankingResult>(1800, 100); // 30 minutes
    this.userModelCache = new CacheService<UserLearningModel>(3600, 1000); // 1 hour
    
    // Initialize global preferences with neutral defaults
    this.globalPreferences = this.createDefaultPreferenceProfile();
    
    // Load existing models and patterns
    this.loadUserModels();
    this.loadAggregatePatterns();
  }
  
  /**
   * Apply intelligent ranking with adaptive learning
   */
  async applyIntelligentRanking(request: RankingIntelligenceRequest): Promise<IntelligentRankingResult> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(request);
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached !== null && !request.learningConfig.enabled) {
      secureLog.debug(`RankingIntelligence cache hit for ${request.names.length} names`);
      return cached;
    }
    
    secureLog.info(`Applying intelligent ranking to ${request.names.length} names with objective: ${request.optimizationTargets.primaryObjective}`);
    
    try {
      // Get or create user model
      const userModel = await this.getUserModel(request.context.userId, request.preferences);
      
      // Calculate intelligent scores for each name
      const intelligentNames = await this.calculateIntelligentScores(
        request.names,
        request.context,
        userModel,
        request.optimizationTargets
      );
      
      // Apply adaptive ranking based on optimization targets
      const rankedNames = this.applyAdaptiveRanking(
        intelligentNames,
        request.optimizationTargets,
        userModel
      );
      
      // Generate learning insights
      const learningInsights = this.generateLearningInsights(
        rankedNames,
        userModel,
        request.context
      );
      
      // Calculate personalization metrics
      const personalizationMetrics = this.calculatePersonalizationMetrics(
        rankedNames,
        userModel,
        request.optimizationTargets
      );
      
      // Perform optimization analysis
      const optimizationAnalysis = this.performOptimizationAnalysis(
        rankedNames,
        request.optimizationTargets,
        userModel
      );
      
      // Generate adaptive adjustments
      const adaptiveAdjustments = this.generateAdaptiveAdjustments(
        rankedNames,
        learningInsights,
        optimizationAnalysis,
        request.learningConfig
      );
      
      // Generate intelligent recommendations
      const recommendations = this.generateIntelligentRecommendations(
        rankedNames,
        learningInsights,
        optimizationAnalysis,
        request.context
      );
      
      // Update user model if learning is enabled
      if (request.learningConfig.enabled && request.context.userId) {
        await this.updateUserModel(
          request.context.userId,
          rankedNames,
          request.context,
          learningInsights
        );
      }
      
      const result: IntelligentRankingResult = {
        rankedNames,
        learningInsights,
        personalizationMetrics,
        optimizationAnalysis,
        adaptiveAdjustments,
        recommendations,
        metadata: {
          processingTime: Date.now() - startTime,
          algorithmVersion: this.algorithmVersion,
          learningDataVersion: userModel?.modelMetadata.version || 0,
          personalizationLevel: this.assessPersonalizationLevel(userModel),
          confidenceLevel: this.calculateOverallConfidence(rankedNames),
          adaptationsApplied: adaptiveAdjustments.length,
          cacheStatus: cached ? 'hit' : 'miss'
        }
      };
      
      // Cache the result
      this.cache.set(cacheKey, result);
      
      secureLog.info(`Intelligent ranking completed in ${result.metadata.processingTime}ms`);
      
      return result;
      
    } catch (error) {
      secureLog.error('Intelligent ranking failed:', error);
      throw new Error(`Intelligent ranking failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Get or create user learning model
   */
  private async getUserModel(userId?: string, preferences?: UserPreferences): Promise<UserLearningModel | null> {
    if (!userId) {
      return null; // No personalization without user ID
    }
    
    // Check cache first
    const cached = this.userModelCache.get(userId);
    if (cached !== null) {
      return cached;
    }
    
    // Try to load from persistent storage
    let userModel = this.userModels.get(userId);
    
    if (!userModel) {
      // Create new user model
      userModel = this.createNewUserModel(userId, preferences);
      this.userModels.set(userId, userModel);
    } else {
      // Update with current preferences if provided
      if (preferences) {
        userModel = this.updateModelWithPreferences(userModel, preferences);
      }
    }
    
    // Cache the model
    this.userModelCache.set(userId, userModel);
    
    return userModel;
  }
  
  /**
   * Create new user learning model
   */
  private createNewUserModel(userId: string, preferences?: UserPreferences): UserLearningModel {
    const now = Date.now();
    
    return {
      userId,
      preferenceProfile: this.createPreferenceProfileFromUserPreferences(preferences),
      behaviorPatterns: [],
      qualityAssociations: [],
      contextualPreferences: [],
      learningHistory: [],
      modelMetadata: {
        version: 1,
        trainingData: 0,
        accuracy: 0,
        coverage: 0,
        lastTraining: now,
        nextUpdate: now + 24 * 60 * 60 * 1000 // 24 hours
      }
    };
  }
  
  /**
   * Create preference profile from user preferences
   */
  private createPreferenceProfileFromUserPreferences(preferences?: UserPreferences): PreferenceProfile {
    const defaultProfile = this.createDefaultPreferenceProfile();
    
    if (!preferences) {
      return defaultProfile;
    }
    
    // Convert user preferences to preference profile
    const profile: PreferenceProfile = {
      ...defaultProfile,
      overallPreferences: {
        riskTolerance: this.mapRiskTolerance(preferences.qualityThreshold),
        creativityPreference: (preferences.creativityWeight || 5) / 10,
        marketabilityImportance: (preferences.availabilityWeight || 5) / 10,
        uniquenessDesire: (preferences.uniquenessWeight || 5) / 10,
        qualityStandards: this.mapQualityStandards(preferences.qualityThreshold),
        diversityAppetite: 0.5 // Default, no direct mapping
      }
    };
    
    return profile;
  }
  
  /**
   * Map risk tolerance from quality threshold
   */
  private mapRiskTolerance(qualityThreshold?: string): number {
    switch (qualityThreshold) {
      case 'strict': return 0.2;
      case 'moderate': return 0.5;
      case 'lenient': return 0.8;
      default: return 0.5;
    }
  }
  
  /**
   * Map quality standards from quality threshold
   */
  private mapQualityStandards(qualityThreshold?: string): number {
    switch (qualityThreshold) {
      case 'strict': return 0.9;
      case 'moderate': return 0.7;
      case 'lenient': return 0.5;
      default: return 0.7;
    }
  }
  
  /**
   * Create default preference profile
   */
  private createDefaultPreferenceProfile(): PreferenceProfile {
    const dimensions = ['phonetic', 'semantic', 'creativity', 'marketability', 'memorability', 'appropriateness'];
    const dimensionPreferences: Record<string, PreferenceDimension> = {};
    
    dimensions.forEach(dimension => {
      dimensionPreferences[dimension] = {
        weight: 1.0,
        threshold: 0.5,
        tolerance: 0.2,
        trend: 'stable',
        confidence: 0.1, // Low confidence for defaults
        evidenceCount: 0
      };
    });
    
    return {
      dimensions: dimensionPreferences,
      overallPreferences: {
        riskTolerance: 0.5,
        creativityPreference: 0.5,
        marketabilityImportance: 0.5,
        uniquenessDesire: 0.5,
        qualityStandards: 0.7,
        diversityAppetite: 0.5
      },
      confidence: Object.fromEntries(dimensions.map(d => [d, 0.1])),
      stability: Object.fromEntries(dimensions.map(d => [d, 1.0])),
      lastUpdated: Date.now()
    };
  }
  
  /**
   * Update model with current preferences
   */
  private updateModelWithPreferences(model: UserLearningModel, preferences: UserPreferences): UserLearningModel {
    const updatedProfile = this.createPreferenceProfileFromUserPreferences(preferences);
    
    // Merge with existing profile, giving more weight to established preferences
    const mergedProfile: PreferenceProfile = {
      ...model.preferenceProfile,
      overallPreferences: {
        ...model.preferenceProfile.overallPreferences,
        ...updatedProfile.overallPreferences
      },
      lastUpdated: Date.now()
    };
    
    return {
      ...model,
      preferenceProfile: mergedProfile
    };
  }
  
  /**
   * Calculate intelligent scores for all names
   */
  private async calculateIntelligentScores(
    names: EnhancedNameQualityResult[],
    context: RankingContext,
    userModel: UserLearningModel | null,
    targets: OptimizationTargets
  ): Promise<IntelligentRankedName[]> {
    return Promise.all(names.map(async (name, index) => {
      // Calculate base quality score
      const qualityScore = name.score.overall;
      
      // Calculate personalized score
      const personalizedScore = userModel ? 
        this.calculatePersonalizedScore(name, userModel, context) : qualityScore;
      
      // Calculate diversity score
      const diversityScore = this.calculateDiversityScore(name, names, index);
      
      // Calculate novelty score
      const noveltyScore = this.calculateNoveltyScore(name, userModel, context);
      
      // Calculate competitive score
      const competitiveScore = this.calculateCompetitiveScore(name, names);
      
      // Calculate intelligent score (weighted combination)
      const intelligentScore = this.calculateIntelligentScore(
        { qualityScore, personalizedScore, diversityScore, noveltyScore, competitiveScore },
        targets.primaryObjective
      );
      
      // Calculate confidence score
      const confidenceScore = this.calculateConfidenceScore(name, userModel, context);
      
      // Build comprehensive profile
      const qualityProfile = this.buildQualityProfile(name, names);
      const personalizationProfile = userModel ? 
        this.buildPersonalizationProfile(name, userModel, context) : null;
      const learningContribution = this.calculateLearningContribution(name, userModel);
      const competitiveAnalysis = this.buildCompetitiveAnalysis(name, names);
      
      // Generate explanations and assessments
      const explanation = this.generateIntelligentExplanation(
        name, personalizedScore, intelligentScore, userModel, context
      );
      const strengths = this.identifyIntelligentStrengths(name, userModel);
      const opportunities = this.identifyIntelligentOpportunities(name, userModel);
      const riskAssessment = this.assessRisks(name, context);
      const useCaseAlignment = this.assessUseCaseAlignment(name, context);
      
      return {
        name: name.name,
        rank: 0, // Will be assigned after sorting
        intelligentScore,
        qualityScore,
        personalizedScore,
        diversityScore,
        noveltyScore,
        confidenceScore,
        qualityProfile,
        personalizationProfile,
        learningContribution,
        competitiveAnalysis,
        explanation,
        strengths,
        opportunities,
        riskAssessment,
        useCaseAlignment
      };
    }));
  }
  
  /**
   * Calculate personalized score based on user model
   */
  private calculatePersonalizedScore(
    name: EnhancedNameQualityResult,
    userModel: UserLearningModel,
    context: RankingContext
  ): number {
    const breakdown = name.score.breakdown;
    const profile = userModel.preferenceProfile;
    
    let personalizedScore = 0;
    let totalWeight = 0;
    
    // Apply dimensional preferences
    const dimensionMappings: Array<[string, keyof EnhancedScoreBreakdown]> = [
      ['phonetic', 'phoneticFlow'],
      ['semantic', 'semanticCoherence'],
      ['creativity', 'creativity'],
      ['marketability', 'marketAppeal'],
      ['memorability', 'memorability'],
      ['appropriateness', 'appropriateness']
    ];
    
    for (const [dimension, breakdownKey] of dimensionMappings) {
      const dimensionPref = profile.dimensions[dimension];
      if (dimensionPref) {
        const nameScore = breakdown[breakdownKey] as number;
        const weight = dimensionPref.weight * dimensionPref.confidence;
        
        // Apply preference threshold and tolerance
        let adjustedScore = nameScore;
        if (nameScore < dimensionPref.threshold - dimensionPref.tolerance) {
          adjustedScore *= 0.5; // Penalty for being below preference
        } else if (nameScore > dimensionPref.threshold + dimensionPref.tolerance) {
          adjustedScore = Math.min(1, adjustedScore * 1.2); // Bonus for exceeding preference
        }
        
        personalizedScore += adjustedScore * weight;
        totalWeight += weight;
      }
    }
    
    // Apply overall preferences
    const overallPrefs = profile.overallPreferences;
    
    // Risk tolerance adjustment
    const riskLevel = this.calculateNameRiskLevel(name);
    const riskAlignment = 1 - Math.abs(riskLevel - overallPrefs.riskTolerance);
    personalizedScore += riskAlignment * 0.1;
    totalWeight += 0.1;
    
    // Quality standards adjustment
    if (name.score.overall >= overallPrefs.qualityStandards) {
      personalizedScore += 0.1;
    } else {
      personalizedScore *= 0.9; // Slight penalty for not meeting standards
    }
    totalWeight += 0.1;
    
    // Apply contextual preferences if available
    const contextualPref = userModel.contextualPreferences.find(cp => 
      cp.context === context.type || cp.context === context.genre
    );
    
    if (contextualPref) {
      const contextWeight = contextualPref.strength * contextualPref.reliability;
      for (const [dimension, preference] of Object.entries(contextualPref.preferences)) {
        const breakdownKey = this.mapDimensionToBreakdown(dimension);
        if (breakdownKey) {
          const nameScore = breakdown[breakdownKey] as number;
          const alignment = 1 - Math.abs(nameScore - preference);
          personalizedScore += alignment * contextWeight * 0.05;
          totalWeight += contextWeight * 0.05;
        }
      }
    }
    
    return totalWeight > 0 ? personalizedScore / totalWeight : name.score.overall;
  }
  
  /**
   * Map dimension name to breakdown key
   */
  private mapDimensionToBreakdown(dimension: string): keyof EnhancedScoreBreakdown | null {
    const mapping: Record<string, keyof EnhancedScoreBreakdown> = {
      'phonetic': 'phoneticFlow',
      'semantic': 'semanticCoherence',
      'creativity': 'creativity',
      'marketability': 'marketAppeal',
      'memorability': 'memorability',
      'appropriateness': 'appropriateness'
    };
    
    return mapping[dimension] || null;
  }
  
  /**
   * Calculate diversity score relative to other names
   */
  private calculateDiversityScore(
    name: EnhancedNameQualityResult,
    allNames: EnhancedNameQualityResult[],
    index: number
  ): number {
    if (allNames.length <= 1) return 1.0;
    
    let diversityScore = 0;
    let comparisons = 0;
    
    const nameVector = name.score?.qualityVector;
    if (!nameVector) return 1.0; // If no vector, assume high diversity
    
    for (let i = 0; i < allNames.length; i++) {
      if (i === index) continue;
      
      const otherVector = allNames[i].score?.qualityVector;
      if (!otherVector) continue; // Skip if other vector is missing
      
      const similarity = this.calculateVectorSimilarity(nameVector, otherVector);
      diversityScore += (1 - similarity);
      comparisons++;
    }
    
    return comparisons > 0 ? diversityScore / comparisons : 1.0;
  }
  
  /**
   * Calculate vector similarity between two quality vectors
   */
  private calculateVectorSimilarity(vector1: QualityVector, vector2: QualityVector): number {
    // Safety checks for undefined vectors or dimensions
    if (!vector1 || !vector2 || !vector1.dimensions || !vector2.dimensions) {
      return 0;
    }
    
    const dims1 = Object.values(vector1.dimensions);
    const dims2 = Object.values(vector2.dimensions);
    
    // Ensure both dimension arrays have the same length
    if (dims1.length !== dims2.length || dims1.length === 0) {
      return 0;
    }
    
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
   * Calculate novelty score
   */
  private calculateNoveltyScore(
    name: EnhancedNameQualityResult,
    userModel: UserLearningModel | null,
    context: RankingContext
  ): number {
    let noveltyScore = name.score.breakdown.uniqueness;
    
    // Adjust based on user's historical patterns
    if (userModel) {
      const historicalSimilarity = this.calculateHistoricalSimilarity(name, userModel);
      noveltyScore = noveltyScore * (1 - historicalSimilarity);
    }
    
    // Adjust based on global patterns
    const globalNovelty = this.calculateGlobalNovelty(name);
    noveltyScore = (noveltyScore + globalNovelty) / 2;
    
    return Math.min(1, Math.max(0, noveltyScore));
  }
  
  /**
   * Calculate historical similarity to user's past choices
   */
  private calculateHistoricalSimilarity(
    name: EnhancedNameQualityResult,
    userModel: UserLearningModel
  ): number {
    // Simplified implementation - would analyze user's learning history
    // for actual similarity to previously chosen or highly-rated names
    
    const associations = userModel.qualityAssociations;
    if (associations.length === 0) return 0;
    
    let totalSimilarity = 0;
    const breakdown = name.score.breakdown;
    
    for (const association of associations) {
      const breakdownKey = this.mapDimensionToBreakdown(association.qualityAttribute);
      if (breakdownKey) {
        const nameValue = breakdown[breakdownKey] as number;
        const similarity = 1 - Math.abs(nameValue - association.userValue);
        totalSimilarity += similarity * association.confidence;
      }
    }
    
    return associations.length > 0 ? totalSimilarity / associations.length : 0;
  }
  
  /**
   * Calculate global novelty relative to aggregate patterns
   */
  private calculateGlobalNovelty(name: EnhancedNameQualityResult): number {
    // Simplified implementation - would compare against global pattern database
    const breakdown = name.score.breakdown;
    
    // Use creativity and uniqueness as proxies for global novelty
    return (breakdown.creativity + breakdown.uniqueness) / 2;
  }
  
  /**
   * Calculate competitive score relative to other names
   */
  private calculateCompetitiveScore(
    name: EnhancedNameQualityResult,
    allNames: EnhancedNameQualityResult[]
  ): number {
    if (allNames.length <= 1) return 1.0;
    
    const nameScore = name.score.overall;
    const betterThan = allNames.filter(n => nameScore > n.score.overall).length;
    
    return betterThan / (allNames.length - 1);
  }
  
  /**
   * Calculate intelligent score (weighted combination)
   */
  private calculateIntelligentScore(
    scores: {
      qualityScore: number;
      personalizedScore: number;
      diversityScore: number;
      noveltyScore: number;
      competitiveScore: number;
    },
    primaryObjective: OptimizationTargets['primaryObjective']
  ): number {
    const weights = this.optimizationWeights[primaryObjective];
    
    return (
      scores.qualityScore * weights.qualityScore +
      scores.personalizedScore * weights.personalizedScore +
      scores.diversityScore * weights.diversityScore +
      scores.noveltyScore * weights.noveltyScore +
      scores.competitiveScore * weights.competitiveScore
    );
  }
  
  /**
   * Calculate confidence score
   */
  private calculateConfidenceScore(
    name: EnhancedNameQualityResult,
    userModel: UserLearningModel | null,
    context: RankingContext
  ): number {
    let confidence = name.score.metadata.confidence;
    
    // Adjust based on user model confidence
    if (userModel) {
      const modelConfidence = this.calculateModelConfidence(userModel);
      confidence = (confidence + modelConfidence) / 2;
    }
    
    // Adjust based on context familiarity
    const contextConfidence = this.calculateContextConfidence(context);
    confidence = (confidence * 2 + contextConfidence) / 3;
    
    return Math.min(1, Math.max(0, confidence));
  }
  
  /**
   * Calculate model confidence
   */
  private calculateModelConfidence(userModel: UserLearningModel): number {
    const metadata = userModel.modelMetadata;
    
    // Base confidence on training data volume and accuracy
    const dataConfidence = Math.min(1, metadata.trainingData / 100);
    const accuracyConfidence = metadata.accuracy;
    const coverageConfidence = metadata.coverage;
    
    return (dataConfidence + accuracyConfidence + coverageConfidence) / 3;
  }
  
  /**
   * Calculate context confidence
   */
  private calculateContextConfidence(context: RankingContext): number {
    // Higher confidence for common contexts
    let confidence = 0.7; // Base confidence
    
    if (context.genre) confidence += 0.1;
    if (context.type) confidence += 0.1;
    if (context.useCase) confidence += 0.1;
    
    return Math.min(1, confidence);
  }
  
  /**
   * Calculate name risk level
   */
  private calculateNameRiskLevel(name: EnhancedNameQualityResult): number {
    const breakdown = name.score.breakdown;
    
    // Risk factors: high uniqueness, low market appeal, pronunciation difficulty
    const riskFactors = [
      breakdown.uniqueness, // High uniqueness = higher risk
      1 - breakdown.marketAppeal, // Low market appeal = higher risk
      1 - breakdown.pronunciation, // Pronunciation difficulty = higher risk
      breakdown.creativity * 0.5 // High creativity = moderate risk
    ];
    
    return riskFactors.reduce((sum, factor) => sum + factor, 0) / riskFactors.length;
  }
  
  /**
   * Apply adaptive ranking based on optimization targets
   */
  private applyAdaptiveRanking(
    names: IntelligentRankedName[],
    targets: OptimizationTargets,
    userModel: UserLearningModel | null
  ): IntelligentRankedName[] {
    // Sort by intelligent score
    const sorted = [...names].sort((a, b) => b.intelligentScore - a.intelligentScore);
    
    // Apply quality floor filter
    const qualityFiltered = sorted.filter(name => name.qualityScore >= targets.qualityFloor);
    
    // Apply diversity optimization if needed
    const diversityOptimized = targets.diversityTarget > 0 ? 
      this.optimizeForDiversity(qualityFiltered, targets.diversityTarget) : qualityFiltered;
    
    // Apply risk tolerance if user model available
    const riskFiltered = userModel ? 
      this.applyRiskTolerance(diversityOptimized, userModel) : diversityOptimized;
    
    // Assign final ranks
    return riskFiltered.map((name, index) => ({
      ...name,
      rank: index + 1
    }));
  }
  
  /**
   * Optimize ranking for diversity
   */
  private optimizeForDiversity(
    names: IntelligentRankedName[],
    diversityTarget: number
  ): IntelligentRankedName[] {
    if (diversityTarget <= 0 || names.length <= 1) {
      return names;
    }
    
    const diversified: IntelligentRankedName[] = [];
    const remaining = [...names];
    
    // Always include the top-ranked name
    if (remaining.length > 0) {
      diversified.push(remaining.shift()!);
    }
    
    // Select subsequent names balancing quality and diversity
    while (remaining.length > 0 && diversified.length < names.length) {
      let bestCandidate = remaining[0];
      let bestScore = this.calculateDiversityAdjustedScore(
        bestCandidate,
        diversified,
        diversityTarget
      );
      let bestIndex = 0;
      
      for (let i = 1; i < remaining.length; i++) {
        const candidate = remaining[i];
        const score = this.calculateDiversityAdjustedScore(
          candidate,
          diversified,
          diversityTarget
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
    
    return diversified;
  }
  
  /**
   * Calculate diversity-adjusted score
   */
  private calculateDiversityAdjustedScore(
    candidate: IntelligentRankedName,
    existingSelection: IntelligentRankedName[],
    diversityTarget: number
  ): number {
    const qualityWeight = 1 - diversityTarget;
    const diversityWeight = diversityTarget;
    
    const qualityScore = candidate.intelligentScore;
    let diversityScore = 1.0;
    
    // Calculate diversity relative to existing selection
    for (const existing of existingSelection) {
      const similarity = this.calculateProfileSimilarity(candidate, existing);
      diversityScore *= (1 - similarity);
    }
    
    return qualityScore * qualityWeight + diversityScore * diversityWeight;
  }
  
  /**
   * Calculate profile similarity between two names
   */
  private calculateProfileSimilarity(name1: IntelligentRankedName, name2: IntelligentRankedName): number {
    // Use quality profiles for similarity calculation
    const profile1 = name1.qualityProfile.dimensions;
    const profile2 = name2.qualityProfile.dimensions;
    
    const dimensions = Object.keys(profile1);
    let similarity = 0;
    
    for (const dimension of dimensions) {
      const score1 = profile1[dimension as keyof QualityDimensionProfile].score;
      const score2 = profile2[dimension as keyof QualityDimensionProfile].score;
      similarity += 1 - Math.abs(score1 - score2);
    }
    
    return similarity / dimensions.length;
  }
  
  /**
   * Apply risk tolerance filtering
   */
  private applyRiskTolerance(
    names: IntelligentRankedName[],
    userModel: UserLearningModel
  ): IntelligentRankedName[] {
    const riskTolerance = userModel.preferenceProfile.overallPreferences.riskTolerance;
    
    // Filter names based on risk assessment
    return names.filter(name => {
      const nameRisk = this.calculateNameRiskFromAssessment(name.riskAssessment);
      return nameRisk <= riskTolerance + 0.2; // Allow slight tolerance margin
    });
  }
  
  /**
   * Calculate name risk from risk assessment
   */
  private calculateNameRiskFromAssessment(riskAssessment: RiskAssessment): number {
    switch (riskAssessment.overallRisk) {
      case 'low': return 0.2;
      case 'medium': return 0.5;
      case 'high': return 0.8;
      default: return 0.5;
    }
  }
  
  /**
   * Build quality profile for a name
   */
  private buildQualityProfile(
    name: EnhancedNameQualityResult,
    allNames: EnhancedNameQualityResult[]
  ): QualityProfile {
    const breakdown = name.score.breakdown;
    
    // Build dimensional profiles with safe property access
    const phoneticFlow = (breakdown as any).phoneticFlow ?? 0.75;
    const semanticCoherence = (breakdown as any).semanticCoherence ?? 0.75;
    const marketAppeal = (breakdown as any).marketAppeal ?? 0.75;
    
    const dimensions: QualityDimensionProfile = {
      phonetic: {
        score: phoneticFlow,
        trend: 'stable', // Would be calculated from historical data
        percentile: this.calculatePercentile(phoneticFlow, allNames.map(n => (n.score?.breakdown as any)?.phoneticFlow ?? 0.75))
      },
      semantic: {
        score: semanticCoherence,
        trend: 'stable',
        percentile: this.calculatePercentile(semanticCoherence, allNames.map(n => (n.score?.breakdown as any)?.semanticCoherence ?? 0.75))
      },
      creativity: {
        score: breakdown.creativity,
        trend: 'stable',
        percentile: this.calculatePercentile(breakdown.creativity, allNames.map(n => n.score?.breakdown?.creativity ?? 0.75))
      },
      marketability: {
        score: marketAppeal,
        trend: 'stable',
        percentile: this.calculatePercentile(marketAppeal, allNames.map(n => (n.score?.breakdown as any)?.marketAppeal ?? 0.75))
      },
      memorability: {
        score: breakdown.memorability,
        trend: 'stable',
        percentile: this.calculatePercentile(breakdown.memorability, allNames.map(n => n.score?.breakdown?.memorability ?? 0.75))
      },
      appropriateness: {
        score: breakdown.appropriateness,
        trend: 'stable',
        percentile: this.calculatePercentile(breakdown.appropriateness, allNames.map(n => n.score?.breakdown?.appropriateness ?? 0.75))
      }
    };
    
    // Build cross-dimensional profile
    const crossDimensional: CrossDimensionalProfile = {
      balance: name.score.qualityVector.balance,
      synergy: name.score.crossDimensional.synergy.crossDimensionalHarmony,
      consistency: this.calculateConsistency(breakdown),
      optimization: this.identifyOptimizationAreas(breakdown)
    };
    
    // Build quality trends
    const trends: QualityTrends = {
      overallTrend: 'stable', // Would be calculated from historical data
      dimensionalTrends: {
        phonetic: 'stable',
        semantic: 'stable',
        creativity: 'stable',
        marketability: 'stable'
      },
      predictedTrajectory: 'Maintains current quality level'
    };
    
    // Build benchmarks
    const benchmarks: QualityBenchmarks = {
      industryPercentile: this.calculatePercentile(name.score.overall, allNames.map(n => n.score.overall)),
      genrePercentile: this.calculatePercentile(name.score.overall, allNames.map(n => n.score.overall)), // Simplified
      userHistoryPercentile: 75, // Placeholder
      sessionPercentile: this.calculatePercentile(name.score.overall, allNames.map(n => n.score.overall))
    };
    
    return {
      dimensions,
      crossDimensional,
      trends,
      benchmarks
    };
  }
  
  /**
   * Calculate percentile rank
   */
  private calculatePercentile(value: number, allValues: number[]): number {
    const sortedValues = [...allValues].sort((a, b) => a - b);
    const rank = sortedValues.filter(v => v <= value).length;
    return (rank / sortedValues.length) * 100;
  }
  
  /**
   * Calculate consistency across dimensions
   */
  private calculateConsistency(breakdown: EnhancedScoreBreakdown): number {
    const scores = [
      (breakdown as any).phoneticFlow ?? 0.75,
      (breakdown as any).semanticCoherence ?? 0.75,
      breakdown.creativity,
      breakdown.memorability,
      (breakdown as any).marketAppeal ?? 0.75,
      breakdown.appropriateness
    ];
    
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    
    // Convert variance to consistency (lower variance = higher consistency)
    return Math.max(0, 1 - variance * 4);
  }
  
  /**
   * Identify optimization areas
   */
  private identifyOptimizationAreas(breakdown: EnhancedScoreBreakdown): string[] {
    const areas: string[] = [];
    
    const phoneticFlow = (breakdown as any).phoneticFlow ?? 0.75;
    const semanticCoherence = (breakdown as any).semanticCoherence ?? 0.75;
    const marketAppeal = (breakdown as any).marketAppeal ?? 0.75;
    
    if (phoneticFlow < 0.6) areas.push('Phonetic flow improvement');
    if (semanticCoherence < 0.6) areas.push('Semantic clarity enhancement');
    if (breakdown.creativity < 0.6) areas.push('Creative innovation');
    if (breakdown.memorability < 0.6) areas.push('Memorability boost');
    if (marketAppeal < 0.6) areas.push('Market appeal optimization');
    
    return areas;
  }
  
  /**
   * Build personalization profile
   */
  private buildPersonalizationProfile(
    name: EnhancedNameQualityResult,
    userModel: UserLearningModel,
    context: RankingContext
  ): PersonalizationProfile | null {
    const breakdown = name.score.breakdown;
    const userPrefs = userModel.preferenceProfile;
    
    // Calculate user alignment score
    const userAlignmentScore = this.calculateUserAlignment(breakdown, userPrefs);
    
    // Build preference matches
    const preferenceMatches: PreferenceMatch[] = [];
    const dimensionMappings: Array<[string, keyof EnhancedScoreBreakdown]> = [
      ['phonetic', 'phoneticFlow'],
      ['semantic', 'semanticCoherence'],
      ['creativity', 'creativity'],
      ['marketability', 'marketAppeal'],
      ['memorability', 'memorability'],
      ['appropriateness', 'appropriateness']
    ];
    
    for (const [dimension, breakdownKey] of dimensionMappings) {
      const userPref = userPrefs.dimensions[dimension];
      const nameScore = breakdown[breakdownKey] as number;
      
      if (userPref) {
        const alignment = 1 - Math.abs(nameScore - userPref.threshold);
        preferenceMatches.push({
          dimension,
          userPreference: userPref.threshold,
          nameScore,
          alignment,
          importance: userPref.weight,
          confidence: userPref.confidence
        });
      }
    }
    
    // Calculate historical similarity
    const historicalSimilarity = this.calculateHistoricalSimilarity(name, userModel);
    
    // Calculate learning confidence
    const learningConfidence = this.calculateModelConfidence(userModel);
    
    // Build adaptation factors
    const adaptationFactors: AdaptationFactor[] = [
      {
        type: 'explicit_feedback',
        factor: 'User preference settings',
        weight: 0.4,
        confidence: 0.8,
        influence: 'Moderate adjustment to dimensional weights'
      },
      {
        type: 'implicit_behavior',
        factor: 'Historical choice patterns',
        weight: 0.3,
        confidence: historicalSimilarity,
        influence: 'Alignment with past preferences'
      }
    ];
    
    return {
      userAlignmentScore,
      preferenceMatches,
      historicalSimilarity,
      learningConfidence,
      adaptationFactors
    };
  }
  
  /**
   * Calculate user alignment
   */
  private calculateUserAlignment(
    breakdown: EnhancedScoreBreakdown,
    userPrefs: PreferenceProfile
  ): number {
    let totalAlignment = 0;
    let totalWeight = 0;
    
    const dimensionMappings: Array<[string, keyof EnhancedScoreBreakdown]> = [
      ['phonetic', 'phoneticFlow'],
      ['semantic', 'semanticCoherence'],
      ['creativity', 'creativity'],
      ['marketability', 'marketAppeal'],
      ['memorability', 'memorability'],
      ['appropriateness', 'appropriateness']
    ];
    
    for (const [dimension, breakdownKey] of dimensionMappings) {
      const userPref = userPrefs.dimensions[dimension];
      const nameScore = breakdown[breakdownKey] as number;
      
      if (userPref) {
        const alignment = 1 - Math.abs(nameScore - userPref.threshold);
        const weight = userPref.weight * userPref.confidence;
        
        totalAlignment += alignment * weight;
        totalWeight += weight;
      }
    }
    
    return totalWeight > 0 ? totalAlignment / totalWeight : 0.5;
  }
  
  /**
   * Calculate learning contribution
   */
  private calculateLearningContribution(
    name: EnhancedNameQualityResult,
    userModel: UserLearningModel | null
  ): LearningContribution {
    if (!userModel) {
      return {
        personalizedAdjustment: 0,
        aggregateInfluence: 0,
        noveltyBonus: 0,
        experienceWeight: 0,
        learningSource: []
      };
    }
    
    const personalizedAdjustment = this.calculatePersonalizedAdjustment(name, userModel);
    const aggregateInfluence = this.calculateAggregateInfluence(name);
    const noveltyBonus = this.calculateNoveltyScore(name, userModel, {} as RankingContext);
    const experienceWeight = Math.min(1, userModel.modelMetadata.trainingData / 100);
    
    const learningSource: string[] = [];
    if (userModel.modelMetadata.trainingData > 0) learningSource.push('User history');
    if (this.aggregatePatterns.size > 0) learningSource.push('Aggregate patterns');
    
    return {
      personalizedAdjustment,
      aggregateInfluence,
      noveltyBonus,
      experienceWeight,
      learningSource
    };
  }
  
  /**
   * Calculate personalized adjustment
   */
  private calculatePersonalizedAdjustment(
    name: EnhancedNameQualityResult,
    userModel: UserLearningModel
  ): number {
    const personalizedScore = this.calculatePersonalizedScore(name, userModel, {} as RankingContext);
    const baseScore = name.score.overall;
    
    return personalizedScore - baseScore;
  }
  
  /**
   * Calculate aggregate influence
   */
  private calculateAggregateInfluence(name: EnhancedNameQualityResult): number {
    // Simplified - would check against aggregate pattern database
    return 0.05; // Small positive influence from aggregate learning
  }
  
  /**
   * Build competitive analysis
   */
  private buildCompetitiveAnalysis(
    name: EnhancedNameQualityResult,
    allNames: EnhancedNameQualityResult[]
  ): CompetitiveAnalysis {
    const nameScore = name.score.overall;
    const betterThan = allNames.filter(n => nameScore > n.score.overall);
    const competitiveRank = allNames.length - betterThan.length;
    
    const differentiationStrength = name.score.qualityVector.distinctiveness;
    
    // Determine market position
    let marketPosition: string;
    if (nameScore > 0.8) marketPosition = 'Premium';
    else if (nameScore > 0.6) marketPosition = 'Mainstream';
    else if (nameScore > 0.4) marketPosition = 'Budget';
    else marketPosition = 'Entry-level';
    
    // Identify competitive advantages
    const competitiveAdvantages: string[] = [];
    const breakdown = name.score.breakdown;
    
    const phoneticFlow = (breakdown as any).phoneticFlow ?? 0.75;
    const marketAppeal = (breakdown as any).marketAppeal ?? 0.75;
    const pronunciation = (breakdown as any).pronunciation ?? 0.75;
    
    if (breakdown.creativity > 0.8) competitiveAdvantages.push('High creativity');
    if (breakdown.memorability > 0.8) competitiveAdvantages.push('Strong memorability');
    if (phoneticFlow > 0.8) competitiveAdvantages.push('Excellent sound quality');
    if (marketAppeal > 0.8) competitiveAdvantages.push('Broad market appeal');
    
    // Identify vulnerabilities
    const vulnerabilities: string[] = [];
    if (pronunciation < 0.5) vulnerabilities.push('Pronunciation difficulty');
    if (marketAppeal < 0.4) vulnerabilities.push('Limited market appeal');
    if (breakdown.memorability < 0.4) vulnerabilities.push('Low memorability');
    
    return {
      competitiveRank,
      differentiationStrength,
      marketPosition,
      competitiveAdvantages,
      vulnerabilities
    };
  }
  
  /**
   * Generate intelligent explanation
   */
  private generateIntelligentExplanation(
    name: EnhancedNameQualityResult,
    personalizedScore: number,
    intelligentScore: number,
    userModel: UserLearningModel | null,
    context: RankingContext
  ): IntelligentExplanation {
    const breakdown = name.score.breakdown;
    
    const marketAppeal = (breakdown as any).marketAppeal ?? 0.75;
    const phoneticFlow = (breakdown as any).phoneticFlow ?? 0.75;
    const semanticCoherence = (breakdown as any).semanticCoherence ?? 0.75;
    const pronunciation = (breakdown as any).pronunciation ?? 0.75;
    
    // Primary reason
    let primaryReason: string;
    if (breakdown.creativity > 0.8) {
      primaryReason = 'Exceptional creativity and innovation';
    } else if (marketAppeal > 0.8) {
      primaryReason = 'Strong commercial market appeal';
    } else if (breakdown.memorability > 0.8) {
      primaryReason = 'High memorability and impact';
    } else if (name.score.overall > 0.8) {
      primaryReason = 'Excellent overall quality';
    } else {
      primaryReason = 'Balanced quality across dimensions';
    }
    
    // Supporting reasons
    const supportingReasons: string[] = [];
    if (phoneticFlow > 0.7) supportingReasons.push('Good phonetic flow and pronunciation');
    if (semanticCoherence > 0.7) supportingReasons.push('Clear semantic meaning');
    if (breakdown.appropriateness > 0.7) supportingReasons.push('Well-suited to context');
    if (name.score.qualityVector?.balance && name.score.qualityVector.balance > 0.7) supportingReasons.push('Well-balanced across all dimensions');
    
    // Personalization reason
    let personalizationReason: string | undefined;
    if (userModel && Math.abs(personalizedScore - name.score.overall) > 0.1) {
      personalizationReason = personalizedScore > name.score.overall ?
        'Aligns well with your personal preferences' :
        'May not fully match your typical preferences';
    }
    
    // Quality reason
    const qualityReason = `Quality score: ${(name.score.overall * 100).toFixed(1)}%`;
    
    // Competitive reason
    const competitiveReason = `Competitive position in this selection`;
    
    // Risk factors
    const riskFactors: string[] = [];
    if (pronunciation < 0.5) riskFactors.push('May be difficult to pronounce');
    if (marketAppeal < 0.4) riskFactors.push('Limited commercial appeal');
    if (breakdown.uniqueness > 0.9) riskFactors.push('Very unique - may be polarizing');
    
    // Confidence explanation
    const confidenceExplanation = `Based on quality assessment and ${userModel ? 'personalization' : 'general'} analysis`;
    
    return {
      primaryReason,
      supportingReasons,
      personalizationReason,
      qualityReason,
      competitiveReason,
      riskFactors,
      confidenceExplanation
    };
  }
  
  /**
   * Identify intelligent strengths
   */
  private identifyIntelligentStrengths(
    name: EnhancedNameQualityResult,
    userModel: UserLearningModel | null
  ): IntelligentStrength[] {
    const strengths: IntelligentStrength[] = [];
    const breakdown = name.score.breakdown;
    
    const phoneticFlow = (breakdown as any).phoneticFlow ?? 0.75;
    const marketAppeal = (breakdown as any).marketAppeal ?? 0.75;
    
    // Quality strengths
    if (phoneticFlow > 0.8) {
      strengths.push({
        category: 'quality',
        strength: 'Excellent phonetic appeal',
        impact: 'high',
        confidence: 0.9,
        evidence: [`Phonetic flow score: ${(phoneticFlow * 100).toFixed(1)}%`]
      });
    }
    
    if (breakdown.creativity > 0.8) {
      strengths.push({
        category: 'creative',
        strength: 'High creative innovation',
        impact: 'high',
        confidence: 0.85,
        evidence: [`Creativity score: ${(breakdown.creativity * 100).toFixed(1)}%`]
      });
    }
    
    if (marketAppeal > 0.8) {
      strengths.push({
        category: 'market',
        strength: 'Strong commercial potential',
        impact: 'high',
        confidence: 0.8,
        evidence: [`Market appeal score: ${(marketAppeal * 100).toFixed(1)}%`]
      });
    }
    
    // Personalization strengths
    if (userModel) {
      const alignment = this.calculateUserAlignment(breakdown, userModel.preferenceProfile);
      if (alignment > 0.8) {
        strengths.push({
          category: 'personalization',
          strength: 'Excellent match for your preferences',
          impact: 'high',
          confidence: alignment,
          evidence: ['Strong alignment with your preference profile']
        });
      }
    }
    
    // Competitive strengths
    if (name.score.qualityVector.distinctiveness > 0.8) {
      strengths.push({
        category: 'competitive',
        strength: 'Highly distinctive profile',
        impact: 'medium',
        confidence: 0.75,
        evidence: ['Unique quality characteristics compared to alternatives']
      });
    }
    
    return strengths.sort((a, b) => {
      const impactOrder = { high: 3, medium: 2, low: 1 };
      return impactOrder[b.impact] - impactOrder[a.impact];
    });
  }
  
  /**
   * Identify intelligent opportunities
   */
  private identifyIntelligentOpportunities(
    name: EnhancedNameQualityResult,
    userModel: UserLearningModel | null
  ): IntelligentOpportunity[] {
    const opportunities: IntelligentOpportunity[] = [];
    const breakdown = name.score.breakdown;
    
    // Improvement opportunities
    if (breakdown.memorability < 0.6) {
      opportunities.push({
        category: 'improvement',
        opportunity: 'Enhance memorability',
        potential: 'medium',
        effort: 'medium',
        suggestion: 'Consider variations that are more catchy or rhythmic'
      });
    }
    
    if (breakdown.marketAppeal < 0.6) {
      opportunities.push({
        category: 'improvement',
        opportunity: 'Increase market appeal',
        potential: 'high',
        effort: 'medium',
        suggestion: 'Explore variations with broader commercial appeal'
      });
    }
    
    // Optimization opportunities
    if (name.score.qualityVector.balance < 0.7) {
      opportunities.push({
        category: 'optimization',
        opportunity: 'Improve dimensional balance',
        potential: 'medium',
        effort: 'hard',
        suggestion: 'Work on strengthening weaker quality dimensions'
      });
    }
    
    // Positioning opportunities
    if (breakdown.uniqueness > 0.8 && breakdown.marketAppeal < 0.5) {
      opportunities.push({
        category: 'positioning',
        opportunity: 'Leverage uniqueness for niche markets',
        potential: 'high',
        effort: 'easy',
        suggestion: 'Position as premium/artistic choice for specific audiences'
      });
    }
    
    return opportunities.sort((a, b) => {
      const potentialOrder = { high: 3, medium: 2, low: 1 };
      const effortOrder = { easy: 3, medium: 2, hard: 1 };
      
      const potentialDiff = potentialOrder[b.potential] - potentialOrder[a.potential];
      if (potentialDiff !== 0) return potentialDiff;
      
      return effortOrder[b.effort] - effortOrder[a.effort];
    });
  }
  
  /**
   * Assess risks for a name
   */
  private assessRisks(name: EnhancedNameQualityResult, context: RankingContext): RiskAssessment {
    const breakdown = name.score.breakdown;
    const riskFactors: RiskFactor[] = [];
    
    // Pronunciation risk
    if (breakdown.pronunciation < 0.5) {
      riskFactors.push({
        type: 'pronunciation',
        risk: 'Difficult pronunciation',
        severity: breakdown.pronunciation < 0.3 ? 'high' : 'medium',
        probability: 1 - breakdown.pronunciation,
        impact: 'Reduced accessibility and memorability'
      });
    }
    
    // Market risk
    if (breakdown.marketAppeal < 0.4) {
      riskFactors.push({
        type: 'market',
        risk: 'Limited market appeal',
        severity: breakdown.marketAppeal < 0.2 ? 'high' : 'medium',
        probability: 1 - breakdown.marketAppeal,
        impact: 'Reduced commercial viability'
      });
    }
    
    // Cultural risk
    if (breakdown.culturalAppeal < 0.5) {
      riskFactors.push({
        type: 'cultural',
        risk: 'Cultural appropriateness concerns',
        severity: breakdown.culturalAppeal < 0.3 ? 'high' : 'medium',
        probability: 1 - breakdown.culturalAppeal,
        impact: 'Potential cultural sensitivity issues'
      });
    }
    
    // Uniqueness risk
    if (breakdown.uniqueness > 0.9) {
      riskFactors.push({
        type: 'uniqueness',
        risk: 'Extremely unique - may be polarizing',
        severity: 'medium',
        probability: 0.4,
        impact: 'Strong reactions - either loved or disliked'
      });
    }
    
    // Overall risk assessment
    const severityScores = { low: 1, medium: 2, high: 3 };
    const avgSeverity = riskFactors.length > 0 ?
      riskFactors.reduce((sum, rf) => sum + severityScores[rf.severity], 0) / riskFactors.length : 1;
    
    let overallRisk: 'low' | 'medium' | 'high';
    if (avgSeverity >= 2.5) overallRisk = 'high';
    else if (avgSeverity >= 1.5) overallRisk = 'medium';
    else overallRisk = 'low';
    
    // Mitigation strategies
    const mitigationStrategies: string[] = [];
    if (riskFactors.some(rf => rf.type === 'pronunciation')) {
      mitigationStrategies.push('Provide pronunciation guidance');
    }
    if (riskFactors.some(rf => rf.type === 'market')) {
      mitigationStrategies.push('Target specific niche audiences');
    }
    if (riskFactors.some(rf => rf.type === 'cultural')) {
      mitigationStrategies.push('Verify cultural appropriateness with target communities');
    }
    
    const confidenceLevel = Math.max(0.5, 1 - (riskFactors.length * 0.1));
    
    return {
      overallRisk,
      riskFactors,
      mitigationStrategies,
      confidenceLevel
    };
  }
  
  /**
   * Assess use case alignment
   */
  private assessUseCaseAlignment(
    name: EnhancedNameQualityResult,
    context: RankingContext
  ): UseCaseAlignment {
    const breakdown = name.score.breakdown;
    
    const marketAppeal = (breakdown as any).marketAppeal ?? 0.75;
    const pronunciation = (breakdown as any).pronunciation ?? 0.75;
    const semanticCoherence = (breakdown as any).semanticCoherence ?? 0.75;
    const phoneticFlow = (breakdown as any).phoneticFlow ?? 0.75;
    
    // Calculate alignment score based on use case
    let alignmentScore = 0.5; // Base score
    
    switch (context.useCase) {
      case 'commercial':
        alignmentScore = (marketAppeal * 0.4 + 
                         breakdown.memorability * 0.3 + 
                         pronunciation * 0.2 + 
                         breakdown.appropriateness * 0.1);
        break;
      case 'creative':
        alignmentScore = (breakdown.creativity * 0.4 + 
                         breakdown.uniqueness * 0.3 + 
                         semanticCoherence * 0.2 + 
                         breakdown.appropriateness * 0.1);
        break;
      case 'personal':
        alignmentScore = (breakdown.memorability * 0.3 + 
                         phoneticFlow * 0.3 + 
                         semanticCoherence * 0.2 + 
                         breakdown.creativity * 0.2);
        break;
      case 'professional':
        alignmentScore = (breakdown.appropriateness * 0.3 + 
                         marketAppeal * 0.25 + 
                         pronunciation * 0.25 + 
                         breakdown.memorability * 0.2);
        break;
    }
    
    // Determine suitability
    let suitability: 'excellent' | 'good' | 'fair' | 'poor';
    if (alignmentScore > 0.8) suitability = 'excellent';
    else if (alignmentScore > 0.6) suitability = 'good';
    else if (alignmentScore > 0.4) suitability = 'fair';
    else suitability = 'poor';
    
    // Best use cases
    const bestUseCases: string[] = [];
    if (breakdown.marketAppeal > 0.7) bestUseCases.push('Commercial releases');
    if (breakdown.creativity > 0.7) bestUseCases.push('Artistic projects');
    if (breakdown.memorability > 0.7) bestUseCases.push('Live performances');
    if (breakdown.pronunciation > 0.8) bestUseCases.push('Radio/podcast mentions');
    
    // Caution use cases
    const cautionUseCases: string[] = [];
    if (breakdown.pronunciation < 0.5) cautionUseCases.push('Radio announcements');
    if (breakdown.marketAppeal < 0.4) cautionUseCases.push('Mainstream commercial use');
    if (breakdown.memorability < 0.4) cautionUseCases.push('Brand recognition campaigns');
    
    // Optimization suggestions
    const optimization: string[] = [];
    if (alignmentScore < 0.6) {
      optimization.push('Consider context-specific variations');
      optimization.push('Test with target audience');
    }
    
    return {
      alignmentScore,
      suitability,
      bestUseCases,
      cautionUseCases,
      optimization
    };
  }
  
  /**
   * Generate learning insights
   */
  private generateLearningInsights(
    rankedNames: IntelligentRankedName[],
    userModel: UserLearningModel | null,
    context: RankingContext
  ): LearningInsights {
    const userModelUpdates: UserModelUpdate[] = [];
    const patternDiscoveries: PatternDiscovery[] = [];
    
    // User model updates (if available)
    if (userModel) {
      // Check for preference confirmations or shifts
      const topName = rankedNames[0];
      if (topName && topName.personalizationProfile) {
        for (const match of topName.personalizationProfile.preferenceMatches) {
          if (match.alignment > 0.8) {
            userModelUpdates.push({
              dimension: match.dimension,
              oldValue: match.userPreference,
              newValue: match.userPreference, // Confirmed
              confidence: match.confidence * 1.1,
              evidence: ['High alignment with top-ranked choice'],
              impact: 'Reinforced preference confidence'
            });
          }
        }
      }
    }
    
    // Pattern discoveries
    const creativeNames = rankedNames.filter(n => n.qualityProfile.dimensions.creativity.score > 0.7);
    if (creativeNames.length > rankedNames.length * 0.6) {
      patternDiscoveries.push({
        pattern: 'Strong preference for creative names',
        frequency: creativeNames.length / rankedNames.length,
        significance: 'medium',
        context: [context.type, context.genre || 'any'],
        implications: ['Consider prioritizing creativity in future generations']
      });
    }
    
    // Preference evolution
    const preferenceEvolution: PreferenceEvolution = {
      stability: 'stable', // Would be calculated from historical data
      trendDirection: 'Toward higher quality standards',
      changeMagnitude: 0.05,
      confidenceLevel: 0.7,
      keyChanges: ['Increased emphasis on pronunciation quality']
    };
    
    // Learning velocity
    const learningVelocity: LearningVelocity = {
      overallSpeed: 'moderate',
      dimensionalSpeeds: {
        quality: 'fast',
        personalization: 'moderate',
        context: 'slow'
      },
      adaptationRate: 0.1,
      convergenceEstimate: 'Converging on stable preferences within 10-15 sessions'
    };
    
    // Knowledge gaps
    const knowledgeGaps: KnowledgeGap[] = [];
    if (!userModel || userModel.modelMetadata.trainingData < 10) {
      knowledgeGaps.push({
        area: 'User preferences',
        gapSize: 0.8,
        importance: 'high',
        suggestionToFill: 'Collect more explicit feedback',
        dataNeeded: ['User ratings', 'Choice patterns', 'Explicit preferences']
      });
    }
    
    return {
      userModelUpdates,
      patternDiscoveries,
      preferenceEvolution,
      learningVelocity,
      knowledgeGaps
    };
  }
  
  /**
   * Calculate personalization metrics
   */
  private calculatePersonalizationMetrics(
    rankedNames: IntelligentRankedName[],
    userModel: UserLearningModel | null,
    targets: OptimizationTargets
  ): PersonalizationMetrics {
    if (!userModel) {
      return {
        personalizationScore: 0,
        adaptationAccuracy: 0,
        learningProgress: 0,
        userSatisfactionEstimate: 0.5,
        diversityBalance: 0.5,
        noveltyBalance: 0.5,
        personalizationCoverage: {
          dimensions: {},
          contexts: {},
          overallCoverage: 0,
          confidenceDistribution: [0, 0, 0, 0, 0]
        }
      };
    }
    
    // Calculate personalization score
    const personalizedNames = rankedNames.filter(n => n.personalizationProfile?.userAlignmentScore > 0.7);
    const personalizationScore = personalizedNames.length / rankedNames.length;
    
    // Calculate adaptation accuracy
    const adaptationAccuracy = this.calculateModelConfidence(userModel);
    
    // Calculate learning progress
    const learningProgress = Math.min(1, userModel.modelMetadata.trainingData / 50);
    
    // Estimate user satisfaction
    const topName = rankedNames[0];
    const userSatisfactionEstimate = topName?.personalizationProfile?.userAlignmentScore || 0.5;
    
    // Calculate diversity balance
    const diversityScores = rankedNames.map(n => n.diversityScore);
    const avgDiversity = diversityScores.reduce((sum, score) => sum + score, 0) / diversityScores.length;
    const diversityBalance = Math.min(1, avgDiversity / targets.diversityTarget);
    
    // Calculate novelty balance
    const noveltyScores = rankedNames.map(n => n.noveltyScore);
    const avgNovelty = noveltyScores.reduce((sum, score) => sum + score, 0) / noveltyScores.length;
    const noveltyBalance = Math.min(1, avgNovelty / targets.noveltyWeight);
    
    // Calculate personalization coverage
    const dimensions = Object.keys(userModel.preferenceProfile.dimensions);
    const dimensionCoverage: Record<string, number> = {};
    
    for (const dimension of dimensions) {
      const pref = userModel.preferenceProfile.dimensions[dimension];
      dimensionCoverage[dimension] = pref.confidence;
    }
    
    const overallCoverage = Object.values(dimensionCoverage).reduce((sum, cov) => sum + cov, 0) / dimensions.length;
    
    const confidenceDistribution = [0, 0, 0, 0, 0]; // 0-0.2, 0.2-0.4, 0.4-0.6, 0.6-0.8, 0.8-1.0
    Object.values(dimensionCoverage).forEach(confidence => {
      const bucket = Math.min(4, Math.floor(confidence * 5));
      confidenceDistribution[bucket]++;
    });
    
    return {
      personalizationScore,
      adaptationAccuracy,
      learningProgress,
      userSatisfactionEstimate,
      diversityBalance,
      noveltyBalance,
      personalizationCoverage: {
        dimensions: dimensionCoverage,
        contexts: { [userModel.userId]: overallCoverage },
        overallCoverage,
        confidenceDistribution
      }
    };
  }
  
  /**
   * Perform optimization analysis
   */
  private performOptimizationAnalysis(
    rankedNames: IntelligentRankedName[],
    targets: OptimizationTargets,
    userModel: UserLearningModel | null
  ): OptimizationAnalysis {
    // Objective achievement analysis
    const objectiveAchievement = this.analyzeObjectiveAchievement(rankedNames, targets);
    
    // Tradeoff analysis
    const tradeoffAnalysis = this.analyzeTradeoffs(rankedNames, targets);
    
    // Optimization opportunities
    const optimizationOpportunities = this.identifyOptimizationOpportunities(rankedNames, targets);
    
    // Performance metrics
    const performanceMetrics = this.calculatePerformanceMetrics(rankedNames, userModel);
    
    // Recommended adjustments
    const recommendedAdjustments = this.generateRecommendedAdjustments(
      objectiveAchievement,
      tradeoffAnalysis,
      targets
    );
    
    return {
      objectiveAchievement,
      tradeoffAnalysis,
      optimizationOpportunities,
      performanceMetrics,
      recommendedAdjustments
    };
  }
  
  /**
   * Analyze objective achievement
   */
  private analyzeObjectiveAchievement(
    rankedNames: IntelligentRankedName[],
    targets: OptimizationTargets
  ): ObjectiveAchievement {
    // Calculate achievement for primary objective
    let primaryAchievement = 0;
    switch (targets.primaryObjective) {
      case 'quality':
        primaryAchievement = rankedNames.reduce((sum, name) => sum + name.qualityScore, 0) / rankedNames.length;
        break;
      case 'diversity':
        primaryAchievement = rankedNames.reduce((sum, name) => sum + name.diversityScore, 0) / rankedNames.length;
        break;
      case 'personalization':
        primaryAchievement = rankedNames.reduce((sum, name) => sum + name.personalizedScore, 0) / rankedNames.length;
        break;
      case 'surprise':
        primaryAchievement = rankedNames.reduce((sum, name) => sum + name.noveltyScore, 0) / rankedNames.length;
        break;
      case 'balance':
        const scores = rankedNames.map(n => [n.qualityScore, n.personalizedScore, n.diversityScore, n.noveltyScore]);
        primaryAchievement = scores.reduce((sum, nameScores) => {
          const balance = 1 - this.calculateVariance(nameScores);
          return sum + balance;
        }, 0) / scores.length;
        break;
    }
    
    // Calculate secondary objectives achievement
    const secondaryObjectives = targets.secondaryObjectives.map(objective => ({
      target: objective,
      achievement: 0.7, // Simplified calculation
      gap: 0.3
    }));
    
    const overallSuccess = (primaryAchievement + 
      secondaryObjectives.reduce((sum, obj) => sum + obj.achievement, 0) / secondaryObjectives.length) / 2;
    
    const criticalGaps: string[] = [];
    if (primaryAchievement < 0.6) {
      criticalGaps.push(`Primary objective (${targets.primaryObjective}) underperforming`);
    }
    
    return {
      primaryObjective: {
        target: targets.primaryObjective,
        achievement: primaryAchievement,
        gap: 1 - primaryAchievement
      },
      secondaryObjectives,
      overallSuccess,
      criticalGaps
    };
  }
  
  /**
   * Analyze tradeoffs
   */
  private analyzeTradeoffs(
    rankedNames: IntelligentRankedName[],
    targets: OptimizationTargets
  ): TradeoffAnalysis {
    // Calculate current balances
    const avgQuality = rankedNames.reduce((sum, name) => sum + name.qualityScore, 0) / rankedNames.length;
    const avgDiversity = rankedNames.reduce((sum, name) => sum + name.diversityScore, 0) / rankedNames.length;
    const avgPersonalization = rankedNames.reduce((sum, name) => sum + name.personalizedScore, 0) / rankedNames.length;
    const avgNovelty = rankedNames.reduce((sum, name) => sum + name.noveltyScore, 0) / rankedNames.length;
    
    // Quality vs Diversity tradeoff
    const qualityVsDiversity: TradeoffMetric = {
      currentBalance: avgQuality / (avgQuality + avgDiversity),
      optimalBalance: 0.6, // Prefer quality slightly
      tension: this.calculateTension(avgQuality, avgDiversity),
      recommendation: avgQuality > avgDiversity * 2 ? 'Increase diversity' : 
                     avgDiversity > avgQuality * 2 ? 'Focus on quality' : 'Well balanced'
    };
    
    // Quality vs Personalization tradeoff
    const qualityVsPersonalization: TradeoffMetric = {
      currentBalance: avgQuality / (avgQuality + avgPersonalization),
      optimalBalance: 0.5,
      tension: this.calculateTension(avgQuality, avgPersonalization),
      recommendation: 'Maintain current balance'
    };
    
    // Diversity vs Personalization tradeoff
    const diversityVsPersonalization: TradeoffMetric = {
      currentBalance: avgDiversity / (avgDiversity + avgPersonalization),
      optimalBalance: 0.4,
      tension: this.calculateTension(avgDiversity, avgPersonalization),
      recommendation: 'Favor personalization slightly'
    };
    
    // Novelty vs Reliability tradeoff
    const noveltyVsReliability: TradeoffMetric = {
      currentBalance: avgNovelty / (avgNovelty + avgQuality),
      optimalBalance: targets.riskTolerance === 'adventurous' ? 0.6 : 0.3,
      tension: this.calculateTension(avgNovelty, avgQuality),
      recommendation: 'Balance based on risk tolerance'
    };
    
    const overallBalance = (
      Math.abs(qualityVsDiversity.currentBalance - qualityVsDiversity.optimalBalance) +
      Math.abs(qualityVsPersonalization.currentBalance - qualityVsPersonalization.optimalBalance) +
      Math.abs(diversityVsPersonalization.currentBalance - diversityVsPersonalization.optimalBalance) +
      Math.abs(noveltyVsReliability.currentBalance - noveltyVsReliability.optimalBalance)
    ) / 4;
    
    return {
      qualityVsDiversity,
      qualityVsPersonalization,
      diversityVsPersonalization,
      noveltyVsReliability,
      overallBalance: 1 - overallBalance
    };
  }
  
  /**
   * Calculate tension between two metrics
   */
  private calculateTension(metric1: number, metric2: number): 'low' | 'medium' | 'high' {
    const difference = Math.abs(metric1 - metric2);
    if (difference > 0.4) return 'high';
    if (difference > 0.2) return 'medium';
    return 'low';
  }
  
  /**
   * Identify optimization opportunities
   */
  private identifyOptimizationOpportunities(
    rankedNames: IntelligentRankedName[],
    targets: OptimizationTargets
  ): OptimizationOpportunity[] {
    const opportunities: OptimizationOpportunity[] = [];
    
    // Quality floor opportunity
    const belowFloor = rankedNames.filter(name => name.qualityScore < targets.qualityFloor);
    if (belowFloor.length > 0) {
      opportunities.push({
        area: 'Quality floor compliance',
        currentPerformance: (rankedNames.length - belowFloor.length) / rankedNames.length,
        potentialImprovement: 1 - ((rankedNames.length - belowFloor.length) / rankedNames.length),
        implementationCost: 'medium',
        expectedBenefit: 'Improved quality consistency',
        priority: 'high'
      });
    }
    
    // Diversity optimization
    const avgDiversity = rankedNames.reduce((sum, name) => sum + name.diversityScore, 0) / rankedNames.length;
    if (avgDiversity < targets.diversityTarget) {
      opportunities.push({
        area: 'Diversity enhancement',
        currentPerformance: avgDiversity,
        potentialImprovement: targets.diversityTarget - avgDiversity,
        implementationCost: 'low',
        expectedBenefit: 'More varied selection',
        priority: 'medium'
      });
    }
    
    // Personalization opportunity
    if (rankedNames.some(name => name.personalizedScore < name.qualityScore)) {
      opportunities.push({
        area: 'Personalization improvement',
        currentPerformance: 0.6, // Placeholder
        potentialImprovement: 0.2,
        implementationCost: 'high',
        expectedBenefit: 'Better user alignment',
        priority: 'medium'
      });
    }
    
    return opportunities.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }
  
  /**
   * Calculate performance metrics
   */
  private calculatePerformanceMetrics(
    rankedNames: IntelligentRankedName[],
    userModel: UserLearningModel | null
  ): PerformanceMetrics {
    // Ranking accuracy (how well rankings match expected quality)
    let rankingAccuracy = 0;
    for (let i = 0; i < rankedNames.length - 1; i++) {
      if (rankedNames[i].intelligentScore >= rankedNames[i + 1].intelligentScore) {
        rankingAccuracy += 1;
      }
    }
    rankingAccuracy /= Math.max(1, rankedNames.length - 1);
    
    // User satisfaction score (based on personalization alignment)
    const userSatisfactionScore = userModel ?
      rankedNames.reduce((sum, name) => sum + (name.personalizationProfile?.userAlignmentScore || 0.5), 0) / rankedNames.length :
      0.5;
    
    // Diversity achievement
    const diversityAchievement = rankedNames.reduce((sum, name) => sum + name.diversityScore, 0) / rankedNames.length;
    
    // Learning effectiveness (how well the system is learning)
    const learningEffectiveness = userModel ?
      Math.min(1, userModel.modelMetadata.trainingData / 20) : 0;
    
    // Adaptation speed (how quickly the system adapts)
    const adaptationSpeed = 0.7; // Placeholder - would be calculated from historical data
    
    // Stability score (how consistent the rankings are)
    const stabilityScore = 0.8; // Placeholder - would be calculated from ranking consistency
    
    return {
      rankingAccuracy,
      userSatisfactionScore,
      diversityAchievement,
      learningEffectiveness,
      adaptationSpeed,
      stabilityScore
    };
  }
  
  /**
   * Generate recommended adjustments
   */
  private generateRecommendedAdjustments(
    objectiveAchievement: ObjectiveAchievement,
    tradeoffAnalysis: TradeoffAnalysis,
    targets: OptimizationTargets
  ): RecommendedAdjustment[] {
    const adjustments: RecommendedAdjustment[] = [];
    
    // Adjust primary objective weight if underperforming
    if (objectiveAchievement.primaryObjective.achievement < 0.6) {
      adjustments.push({
        type: 'weight_adjustment',
        parameter: `${targets.primaryObjective}_weight`,
        currentValue: 0.4, // Placeholder
        recommendedValue: 0.6,
        expectedImpact: `Improved ${targets.primaryObjective} performance`,
        confidence: 0.8
      });
    }
    
    // Adjust diversity target if imbalanced
    if (tradeoffAnalysis.qualityVsDiversity.tension === 'high') {
      adjustments.push({
        type: 'threshold_change',
        parameter: 'diversity_target',
        currentValue: targets.diversityTarget,
        recommendedValue: targets.diversityTarget * 1.2,
        expectedImpact: 'Better quality-diversity balance',
        confidence: 0.7
      });
    }
    
    return adjustments;
  }
  
  /**
   * Generate adaptive adjustments
   */
  private generateAdaptiveAdjustments(
    rankedNames: IntelligentRankedName[],
    learningInsights: LearningInsights,
    optimizationAnalysis: OptimizationAnalysis,
    learningConfig: LearningConfiguration
  ): AdaptiveAdjustment[] {
    const adjustments: AdaptiveAdjustment[] = [];
    
    // Learning-based adjustments
    if (learningConfig.enabled && learningInsights.userModelUpdates.length > 0) {
      adjustments.push({
        type: 'personalization',
        adjustment: 'Updated user preference weights',
        magnitude: 0.1,
        confidence: 0.8,
        rationale: 'Based on observed preference patterns',
        expectedOutcome: 'Improved personalization accuracy'
      });
    }
    
    // Optimization-based adjustments
    if (optimizationAnalysis.objectiveAchievement.overallSuccess < 0.7) {
      adjustments.push({
        type: 'optimization',
        adjustment: 'Rebalanced objective weights',
        magnitude: 0.15,
        confidence: 0.7,
        rationale: 'Primary objective underperforming',
        expectedOutcome: 'Better objective achievement'
      });
    }
    
    // Balancing adjustments
    if (optimizationAnalysis.tradeoffAnalysis.overallBalance < 0.6) {
      adjustments.push({
        type: 'balancing',
        adjustment: 'Improved tradeoff balance',
        magnitude: 0.1,
        confidence: 0.6,
        rationale: 'Detected imbalanced tradeoffs',
        expectedOutcome: 'More balanced ranking outcomes'
      });
    }
    
    return adjustments;
  }
  
  /**
   * Generate intelligent recommendations
   */
  private generateIntelligentRecommendations(
    rankedNames: IntelligentRankedName[],
    learningInsights: LearningInsights,
    optimizationAnalysis: OptimizationAnalysis,
    context: RankingContext
  ): IntelligentRecommendations {
    // Top recommendations
    const topRecommendations: TopRecommendation[] = [
      {
        name: rankedNames[0]?.name || '',
        category: 'best_overall',
        reason: 'Highest intelligent ranking score',
        confidence: rankedNames[0]?.confidenceScore || 0,
        useCase: 'Primary choice for most applications'
      }
    ];
    
    // Find best in each category
    const mostCreative = rankedNames.reduce((prev, current) => 
      current.qualityProfile.dimensions.creativity.score > prev.qualityProfile.dimensions.creativity.score ? current : prev
    );
    
    if (mostCreative && mostCreative.name !== topRecommendations[0].name) {
      topRecommendations.push({
        name: mostCreative.name,
        category: 'best_creative',
        reason: 'Highest creativity score',
        confidence: mostCreative.confidenceScore,
        useCase: 'Best for artistic or innovative projects'
      });
    }
    
    // Contextual recommendations
    const contextualRecommendations: ContextualRecommendation[] = [
      {
        context: `${context.type} names`,
        recommendation: 'Focus on the top 3 ranked names for best results',
        rationale: 'Highest quality and best fit for your context',
        applicability: 0.9
      }
    ];
    
    // Learning recommendations
    const learningRecommendations: LearningRecommendation[] = [];
    if (learningInsights.knowledgeGaps.length > 0) {
      learningRecommendations.push({
        area: 'User preferences',
        recommendation: 'Provide more explicit feedback to improve personalization',
        benefit: 'Better tailored name suggestions',
        effort: 'low'
      });
    }
    
    // System recommendations
    const systemRecommendations: SystemRecommendation[] = [];
    if (optimizationAnalysis.objectiveAchievement.overallSuccess < 0.7) {
      systemRecommendations.push({
        component: 'Ranking algorithm',
        recommendation: 'Adjust objective weights for better performance',
        priority: 'medium',
        expectedImpact: 'Improved ranking quality'
      });
    }
    
    // User guidance
    const userGuidance: UserGuidance = {
      primaryGuidance: 'The top-ranked name represents the best overall choice based on quality and your preferences',
      tips: [
        'Consider the risk assessment when making your final choice',
        'Review the strengths and opportunities for context-specific needs',
        'Try different ranking modes for alternative perspectives'
      ],
      warnings: rankedNames[0]?.riskAssessment.riskFactors.map(rf => rf.risk) || [],
      nextSteps: [
        'Test your chosen name with your target audience',
        'Consider trademark and domain availability',
        'Develop the name further with visual identity'
      ],
      learningOpportunities: [
        'Rate the suggested names to improve future recommendations',
        'Explore different creative contexts to expand your options'
      ]
    };
    
    return {
      topRecommendations,
      contextualRecommendations,
      learningRecommendations,
      systemRecommendations,
      userGuidance
    };
  }
  
  /**
   * Update user model with new data
   */
  private async updateUserModel(
    userId: string,
    rankedNames: IntelligentRankedName[],
    context: RankingContext,
    learningInsights: LearningInsights
  ): Promise<void> {
    const userModel = this.userModels.get(userId);
    if (!userModel) return;
    
    // Update learning history
    const learningEvent: LearningEvent = {
      timestamp: Date.now(),
      eventType: 'implicit_choice',
      data: {
        topChoice: rankedNames[0]?.name,
        context,
        rankings: rankedNames.map(n => ({ name: n.name, rank: n.rank, score: n.intelligentScore }))
      },
      impact: 0.1,
      confidence: 0.7
    };
    
    userModel.learningHistory.push(learningEvent);
    
    // Apply user model updates from learning insights
    for (const update of learningInsights.userModelUpdates) {
      const dimension = userModel.preferenceProfile.dimensions[update.dimension];
      if (dimension) {
        dimension.weight = update.newValue;
        dimension.confidence = Math.min(1, dimension.confidence + 0.05);
        dimension.evidenceCount += 1;
      }
    }
    
    // Update model metadata
    userModel.modelMetadata.trainingData += 1;
    userModel.modelMetadata.lastTraining = Date.now();
    userModel.modelMetadata.version += 1;
    
    // Update cache
    this.userModelCache.set(userId, userModel);
    
    secureLog.debug(`Updated user model for ${userId}: version ${userModel.modelMetadata.version}`);
  }
  
  /**
   * Calculate variance of values
   */
  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  }
  
  /**
   * Assess personalization level
   */
  private assessPersonalizationLevel(userModel: UserLearningModel | null): 'none' | 'basic' | 'moderate' | 'advanced' {
    if (!userModel) return 'none';
    
    const trainingData = userModel.modelMetadata.trainingData;
    const coverage = userModel.modelMetadata.coverage;
    
    if (trainingData >= 50 && coverage >= 0.8) return 'advanced';
    if (trainingData >= 20 && coverage >= 0.6) return 'moderate';
    if (trainingData >= 5 && coverage >= 0.3) return 'basic';
    return 'none';
  }
  
  /**
   * Calculate overall confidence
   */
  private calculateOverallConfidence(rankedNames: IntelligentRankedName[]): number {
    if (rankedNames.length === 0) return 0;
    
    return rankedNames.reduce((sum, name) => sum + name.confidenceScore, 0) / rankedNames.length;
  }
  
  /**
   * Load user models from persistent storage
   */
  private loadUserModels(): void {
    // In a real implementation, this would load from database
    // For now, initialize empty
    this.userModels.clear();
  }
  
  /**
   * Load aggregate patterns from persistent storage
   */
  private loadAggregatePatterns(): void {
    // In a real implementation, this would load from database
    // For now, initialize empty
    this.aggregatePatterns.clear();
  }
  
  /**
   * Generate cache key for ranking request
   */
  private generateCacheKey(request: RankingIntelligenceRequest): string {
    const keyData = {
      names: request.names.map(n => n.name).sort(),
      context: request.context,
      preferences: request.preferences,
      optimization: request.optimizationTargets,
      learning: request.learningConfig.enabled
    };
    
    return `intelligent_ranking_${JSON.stringify(keyData)}`;
  }
}

// Export singleton instance
export const rankingIntelligence = new RankingIntelligence();