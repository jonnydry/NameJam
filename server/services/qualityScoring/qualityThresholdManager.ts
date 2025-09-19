/**
 * Quality Threshold Manager
 * Manages dynamic quality thresholds, quality gates, and adaptive filtering
 */

import type { 
  EnhancedNameQualityResult,
  EnhancedScoreBreakdown,
  ThresholdMode
} from './enhancedInterfaces';

import type { UserPreferences, UserFeedback } from '@shared/schema';
import { secureLog } from '../../utils/secureLogger';
import { CacheService } from '../cacheService';

export interface QualityThresholdConfig {
  mode: ThresholdMode;
  context: ThresholdContext;
  requirements: QualityRequirements;
  adaptiveSettings: AdaptiveThresholdSettings;
  emergencyFallback: EmergencyFallbackConfig;
}

export interface ThresholdContext {
  genre?: string;
  mood?: string;
  type: 'band' | 'song';
  userPreferences?: UserPreferences;
  targetAudience?: 'mainstream' | 'niche' | 'experimental';
  marketContext?: 'commercial' | 'artistic' | 'educational';
  urgency?: 'low' | 'medium' | 'high';
  qualityPriority?: 'strict' | 'balanced' | 'quantity-focused';
}

export interface QualityRequirements {
  minimumOverallScore: number;
  dimensionalMinimums: DimensionalMinimums;
  balanceRequirement: number;
  consistencyRequirement: number;
  marketabilityFloor?: number;
  creativityFloor?: number;
  pronunciationFloor?: number;
  exclusionCriteria: ExclusionCriteria;
}

export interface DimensionalMinimums {
  phoneticFlow: number;
  semanticCoherence: number;
  creativity: number;
  memorability: number;
  marketAppeal: number;
  appropriateness: number;
  uniqueness: number;
  pronunciation: number;
}

export interface ExclusionCriteria {
  maxPronunciationDifficulty: number;
  minMemorabilityScore: number;
  maxSimilarityToExisting: number;
  culturalAppropriatenessMin: number;
  offensiveContentCheck: boolean;
  lengthLimits: { min: number; max: number };
}

export interface AdaptiveThresholdSettings {
  enabled: boolean;
  learningRate: number;
  feedbackWindow: number; // Number of recent feedback items to consider
  adaptationSensitivity: number; // How quickly to adapt to changes
  stabilityBias: number; // Resistance to frequent changes
  userSpecificAdaptation: boolean;
  contextualAdaptation: boolean;
  timeBasedDecay: number; // How older feedback loses influence
}

export interface EmergencyFallbackConfig {
  enabled: boolean;
  fallbackThreshold: number;
  minimumResults: number;
  escalationSteps: FallbackStep[];
  qualityWarnings: boolean;
}

export interface FallbackStep {
  condition: 'insufficient_results' | 'all_below_threshold' | 'system_timeout';
  action: 'lower_threshold' | 'expand_criteria' | 'use_cached' | 'generate_more';
  parameters: Record<string, any>;
  thresholdAdjustment: number;
}

export interface QualityGateResult {
  passed: boolean;
  qualifiedNames: EnhancedNameQualityResult[];
  rejectedNames: RejectedName[];
  thresholdUsed: number;
  gateAnalysis: QualityGateAnalysis;
  adaptations: ThresholdAdaptation[];
  recommendations: QualityGateRecommendation[];
}

export interface RejectedName {
  name: string;
  score: number;
  rejectionReasons: RejectionReason[];
  improvementPotential: number;
  nearMissFactors: string[];
}

export interface RejectionReason {
  category: 'overall_quality' | 'dimensional_minimum' | 'balance' | 'exclusion_criteria';
  criterion: string;
  actualValue: number;
  requiredValue: number;
  severity: 'critical' | 'major' | 'minor';
  explanation: string;
}

export interface QualityGateAnalysis {
  totalProcessed: number;
  passRate: number;
  averageQuality: number;
  qualityDistribution: QualityDistributionAnalysis;
  dimensionalPerformance: DimensionalPerformanceAnalysis;
  thresholdEffectiveness: ThresholdEffectivenessAnalysis;
  adaptationOpportunities: AdaptationOpportunity[];
}

export interface QualityDistributionAnalysis {
  mean: number;
  median: number;
  standardDeviation: number;
  skewness: number;
  qualityBrackets: QualityBracket[];
  outlierAnalysis: OutlierAnalysis;
}

export interface QualityBracket {
  range: { min: number; max: number };
  count: number;
  percentage: number;
  characteristics: string[];
}

export interface OutlierAnalysis {
  highOutliers: string[];
  lowOutliers: string[];
  outlierThreshold: number;
  outlierImpact: string;
}

export interface DimensionalPerformanceAnalysis {
  strongestDimensions: DimensionPerformance[];
  weakestDimensions: DimensionPerformance[];
  correlationInsights: CorrelationInsight[];
  improvementPriorities: ImprovementPriority[];
}

export interface DimensionPerformance {
  dimension: string;
  averageScore: number;
  passRate: number;
  variance: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface CorrelationInsight {
  dimensions: [string, string];
  correlation: number;
  significance: 'high' | 'medium' | 'low';
  insight: string;
  actionableAdvice: string;
}

export interface ImprovementPriority {
  dimension: string;
  priority: 'high' | 'medium' | 'low';
  currentPerformance: number;
  targetPerformance: number;
  impact: string;
  difficulty: 'easy' | 'medium' | 'hard';
  strategies: string[];
}

export interface ThresholdEffectivenessAnalysis {
  currentThreshold: number;
  optimalThreshold: number;
  effectivenessScore: number;
  thresholdImpact: ThresholdImpact;
  adjustmentRecommendation: 'increase' | 'decrease' | 'maintain' | 'contextualize';
  confidenceLevel: number;
}

export interface ThresholdImpact {
  qualityImprovement: number;
  quantityReduction: number;
  userSatisfactionImpact: number;
  diversityImpact: number;
  balanceAssessment: string;
}

export interface AdaptationOpportunity {
  type: 'threshold_adjustment' | 'dimensional_weighting' | 'context_specific' | 'user_specific';
  description: string;
  impact: number;
  confidence: number;
  implementation: string;
  expectedOutcome: string;
}

export interface ThresholdAdaptation {
  type: 'threshold_lowered' | 'threshold_raised' | 'criteria_adjusted' | 'weights_modified';
  trigger: string;
  oldValue: number;
  newValue: number;
  reason: string;
  expectedImpact: string;
}

export interface QualityGateRecommendation {
  category: 'threshold_optimization' | 'quality_improvement' | 'process_enhancement' | 'user_experience';
  priority: 'high' | 'medium' | 'low';
  recommendation: string;
  rationale: string;
  implementation: string;
  expectedBenefit: string;
  timeframe: 'immediate' | 'short_term' | 'long_term';
}

export interface ThresholdLearningData {
  userId?: string;
  context: ThresholdContext;
  originalThreshold: number;
  adaptedThreshold: number;
  feedback: UserFeedback[];
  outcome: ThresholdOutcome;
  timestamp: number;
}

export interface ThresholdOutcome {
  userSatisfaction: number;
  qualityImprovement: number;
  quantityImpact: number;
  usagePattern: string;
  successMetrics: Record<string, number>;
}

export interface QualityBenchmark {
  context: string;
  threshold: number;
  passRate: number;
  averageQuality: number;
  userSatisfaction: number;
  lastUpdated: number;
  sampleSize: number;
}

export class QualityThresholdManager {
  private cache: CacheService<QualityGateResult>;
  private learningCache: CacheService<ThresholdLearningData>;
  private benchmarkCache: CacheService<QualityBenchmark>;
  
  // Predefined threshold configurations
  private readonly baseThresholds: Record<ThresholdMode, number> = {
    strict: 0.80,
    moderate: 0.65,
    lenient: 0.50,
    custom: 0.60,
    adaptive: 0.65 // Starting point for adaptive mode
  };
  
  // Context-specific threshold adjustments
  private readonly contextAdjustments = {
    genre: {
      'classical': 0.05,   // Higher standards for classical
      'experimental': -0.10, // Lower for experimental
      'pop': 0.02,         // Slightly higher for pop
      'rock': 0.00,        // Baseline
      'jazz': 0.03,        // Higher for jazz
      'electronic': -0.05,  // Lower for electronic
      'folk': 0.02,       // Slightly higher for folk
      'metal': -0.02,      // Slightly lower for metal
      'country': 0.01,     // Slightly higher for country
      'hip-hop': -0.03,    // Lower for hip-hop
      'blues': 0.02,       // Slightly higher for blues
      'reggae': 0.00,      // Baseline
      'punk': -0.08,       // Lower for punk
      'indie': -0.05,      // Lower for indie
      'alternative': -0.03  // Lower for alternative
    },
    targetAudience: {
      'mainstream': 0.05,    // Higher for mainstream
      'niche': -0.05,        // Lower for niche
      'experimental': -0.15   // Much lower for experimental
    },
    marketContext: {
      'commercial': 0.08,    // Higher for commercial
      'artistic': -0.10,     // Lower for artistic
      'educational': 0.03    // Slightly higher for educational
    },
    urgency: {
      'low': 0.05,      // Can afford to be picky
      'medium': 0.00,   // Baseline
      'high': -0.10     // Need results quickly
    }
  };
  
  // Default dimensional minimums for different contexts
  private readonly defaultDimensionalMinimums: Record<string, DimensionalMinimums> = {
    commercial: {
      phoneticFlow: 0.60,
      semanticCoherence: 0.55,
      creativity: 0.45,
      memorability: 0.70,
      marketAppeal: 0.75,
      appropriateness: 0.65,
      uniqueness: 0.40,
      pronunciation: 0.70
    },
    artistic: {
      phoneticFlow: 0.50,
      semanticCoherence: 0.60,
      creativity: 0.75,
      memorability: 0.55,
      marketAppeal: 0.35,
      appropriateness: 0.60,
      uniqueness: 0.70,
      pronunciation: 0.55
    },
    balanced: {
      phoneticFlow: 0.55,
      semanticCoherence: 0.55,
      creativity: 0.55,
      memorability: 0.60,
      marketAppeal: 0.55,
      appropriateness: 0.60,
      uniqueness: 0.50,
      pronunciation: 0.60
    }
  };
  
  // Learning data storage
  private learningHistory: Map<string, ThresholdLearningData[]> = new Map();
  private benchmarkData: Map<string, QualityBenchmark> = new Map();
  
  constructor() {
    // Initialize caches
    this.cache = new CacheService<QualityGateResult>(1800, 300); // 30 minutes
    this.learningCache = new CacheService<ThresholdLearningData>(86400, 1000); // 24 hours
    this.benchmarkCache = new CacheService<QualityBenchmark>(7200, 200); // 2 hours
    
    // Load existing learning data and benchmarks
    this.loadLearningHistory();
    this.loadBenchmarkData();
  }
  
  /**
   * Apply quality threshold filtering to names
   */
  async applyQualityGate(
    names: EnhancedNameQualityResult[],
    config: QualityThresholdConfig
  ): Promise<QualityGateResult> {
    const cacheKey = this.generateCacheKey(names, config);
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached !== null) {
      secureLog.debug(`QualityThresholdManager cache hit for ${names.length} names`);
      return cached;
    }
    
    secureLog.info(`Applying quality gate to ${names.length} names with mode: ${config.mode}`);
    
    try {
      // Calculate effective threshold
      const effectiveThreshold = await this.calculateEffectiveThreshold(config, names);
      
      // Apply quality requirements
      const requirements = this.buildQualityRequirements(config, effectiveThreshold);
      
      // Filter names through quality gate
      const { qualified, rejected } = this.filterNamesByQuality(names, requirements);
      
      // Apply emergency fallback if needed
      const fallbackResult = await this.applyEmergencyFallback(
        qualified, 
        rejected, 
        config, 
        effectiveThreshold
      );
      
      // Generate quality gate analysis
      const gateAnalysis = this.generateQualityGateAnalysis(
        names, 
        fallbackResult.qualified, 
        fallbackResult.rejected, 
        effectiveThreshold
      );
      
      // Generate adaptations and recommendations
      const adaptations = this.generateThresholdAdaptations(config, gateAnalysis);
      const recommendations = this.generateQualityGateRecommendations(gateAnalysis, config);
      
      // Learn from this application for future improvements
      if (config.adaptiveSettings.enabled) {
        this.recordLearningData(config, effectiveThreshold, gateAnalysis, fallbackResult);
      }
      
      const result: QualityGateResult = {
        passed: fallbackResult.qualified.length > 0,
        qualifiedNames: fallbackResult.qualified,
        rejectedNames: fallbackResult.rejected,
        thresholdUsed: fallbackResult.finalThreshold,
        gateAnalysis,
        adaptations,
        recommendations
      };
      
      // Cache the result
      this.cache.set(cacheKey, result);
      
      secureLog.info(`Quality gate applied: ${fallbackResult.qualified.length}/${names.length} names qualified`);
      
      return result;
      
    } catch (error) {
      secureLog.error('Quality gate application failed:', error);
      
      // Return emergency fallback result
      return {
        passed: true,
        qualifiedNames: names.slice(0, Math.min(3, names.length)), // Return top 3 as emergency
        rejectedNames: names.slice(3).map(name => ({
          name: name.name,
          score: name.score.overall,
          rejectionReasons: [{
            category: 'overall_quality',
            criterion: 'emergency_fallback',
            actualValue: name.score.overall,
            requiredValue: 0,
            severity: 'critical',
            explanation: 'Emergency fallback due to system error'
          }],
          improvementPotential: 0,
          nearMissFactors: []
        })),
        thresholdUsed: 0,
        gateAnalysis: this.getEmptyGateAnalysis(),
        adaptations: [],
        recommendations: [{
          category: 'process_enhancement',
          priority: 'high',
          recommendation: 'Investigate quality gate system failure',
          rationale: 'System error occurred during quality evaluation',
          implementation: 'Check logs and system health',
          expectedBenefit: 'Restored quality filtering',
          timeframe: 'immediate'
        }]
      };
    }
  }
  
  /**
   * Calculate effective threshold based on configuration and context
   */
  private async calculateEffectiveThreshold(
    config: QualityThresholdConfig,
    names: EnhancedNameQualityResult[]
  ): Promise<number> {
    let baseThreshold = this.baseThresholds[config.mode];
    
    // Apply custom threshold if provided
    if (config.mode === 'custom' && config.requirements.minimumOverallScore) {
      baseThreshold = config.requirements.minimumOverallScore;
    }
    
    // Apply adaptive threshold if enabled
    if (config.mode === 'adaptive' && config.adaptiveSettings.enabled) {
      baseThreshold = await this.calculateAdaptiveThreshold(config, names);
    }
    
    // Apply contextual adjustments
    let adjustedThreshold = this.applyContextualAdjustments(baseThreshold, config.context);
    
    // Apply user preference adjustments
    if (config.context.userPreferences) {
      adjustedThreshold = this.applyUserPreferenceAdjustments(
        adjustedThreshold, 
        config.context.userPreferences
      );
    }
    
    // Ensure threshold stays within reasonable bounds
    return Math.min(Math.max(adjustedThreshold, 0.20), 0.95);
  }
  
  /**
   * Calculate adaptive threshold based on learning data
   */
  private async calculateAdaptiveThreshold(
    config: QualityThresholdConfig,
    names: EnhancedNameQualityResult[]
  ): Promise<number> {
    const contextKey = this.generateContextKey(config.context);
    const learningData = this.learningHistory.get(contextKey) || [];
    
    if (learningData.length === 0) {
      return this.baseThresholds.adaptive; // No learning data, use default
    }
    
    // Calculate weighted average of successful thresholds
    const recentData = learningData
      .filter(data => Date.now() - data.timestamp < config.adaptiveSettings.feedbackWindow * 24 * 60 * 60 * 1000)
      .sort((a, b) => b.timestamp - a.timestamp);
    
    if (recentData.length === 0) {
      return this.baseThresholds.adaptive;
    }
    
    let weightedSum = 0;
    let totalWeight = 0;
    
    recentData.forEach((data, index) => {
      // More recent data gets higher weight
      const ageWeight = Math.pow(config.adaptiveSettings.timeBasedDecay, index);
      
      // Success weight based on user satisfaction and quality improvement
      const successWeight = (data.outcome.userSatisfaction + data.outcome.qualityImprovement) / 2;
      
      const combinedWeight = ageWeight * successWeight;
      
      weightedSum += data.adaptedThreshold * combinedWeight;
      totalWeight += combinedWeight;
    });
    
    const adaptiveThreshold = totalWeight > 0 ? weightedSum / totalWeight : this.baseThresholds.adaptive;
    
    // Apply stability bias to prevent too frequent changes
    const currentThreshold = this.baseThresholds.adaptive;
    const stabilityFactor = 1 - config.adaptiveSettings.stabilityBias;
    
    return currentThreshold * config.adaptiveSettings.stabilityBias + 
           adaptiveThreshold * stabilityFactor;
  }
  
  /**
   * Apply contextual adjustments to threshold
   */
  private applyContextualAdjustments(baseThreshold: number, context: ThresholdContext): number {
    let adjusted = baseThreshold;
    
    // Genre adjustments
    if (context.genre && this.contextAdjustments.genre[context.genre]) {
      adjusted += this.contextAdjustments.genre[context.genre];
    }
    
    // Target audience adjustments
    if (context.targetAudience && this.contextAdjustments.targetAudience[context.targetAudience]) {
      adjusted += this.contextAdjustments.targetAudience[context.targetAudience];
    }
    
    // Market context adjustments
    if (context.marketContext && this.contextAdjustments.marketContext[context.marketContext]) {
      adjusted += this.contextAdjustments.marketContext[context.marketContext];
    }
    
    // Urgency adjustments
    if (context.urgency && this.contextAdjustments.urgency[context.urgency]) {
      adjusted += this.contextAdjustments.urgency[context.urgency];
    }
    
    // Quality priority adjustments
    if (context.qualityPriority) {
      switch (context.qualityPriority) {
        case 'strict':
          adjusted += 0.10;
          break;
        case 'quantity-focused':
          adjusted -= 0.15;
          break;
        default: // balanced
          break;
      }
    }
    
    return adjusted;
  }
  
  /**
   * Apply user preference adjustments
   */
  private applyUserPreferenceAdjustments(
    threshold: number, 
    preferences: UserPreferences
  ): number {
    let adjusted = threshold;
    
    // Convert preference weights (1-10) to adjustment factors
    const qualityWeight = (preferences.availabilityWeight || 5) / 10;
    const creativityTolerance = (preferences.creativityWeight || 5) / 10;
    
    // Higher quality preference increases threshold
    if (qualityWeight > 0.7) {
      adjusted += 0.05;
    } else if (qualityWeight < 0.3) {
      adjusted -= 0.05;
    }
    
    // Higher creativity tolerance can lower market appeal requirements
    if (creativityTolerance > 0.7) {
      adjusted -= 0.03; // Allow more creative, potentially less mainstream names
    }
    
    // Quality threshold preference
    switch (preferences.qualityThreshold) {
      case 'strict':
        adjusted += 0.10;
        break;
      case 'lenient':
        adjusted -= 0.10;
        break;
      default: // moderate
        break;
    }
    
    return adjusted;
  }
  
  /**
   * Build quality requirements based on configuration
   */
  private buildQualityRequirements(
    config: QualityThresholdConfig, 
    threshold: number
  ): QualityRequirements {
    // Start with provided requirements or defaults
    const baseRequirements = config.requirements || {} as QualityRequirements;
    
    // Set minimum overall score
    const minimumOverallScore = baseRequirements.minimumOverallScore || threshold;
    
    // Determine dimensional minimums based on context
    const contextType = config.context.marketContext || 'balanced';
    const baseDimensionalMinimums = this.defaultDimensionalMinimums[contextType] || 
                                   this.defaultDimensionalMinimums.balanced;
    
    // Apply threshold scaling to dimensional minimums
    const thresholdScale = threshold / 0.65; // Scale relative to moderate threshold
    const dimensionalMinimums: DimensionalMinimums = {} as DimensionalMinimums;
    
    Object.entries(baseDimensionalMinimums).forEach(([dimension, value]) => {
      dimensionalMinimums[dimension as keyof DimensionalMinimums] = Math.min(
        value * thresholdScale, 
        0.90 // Cap at 90%
      );
    });
    
    // Override with any provided dimensional minimums
    if (baseRequirements.dimensionalMinimums) {
      Object.assign(dimensionalMinimums, baseRequirements.dimensionalMinimums);
    }
    
    // Build exclusion criteria
    const exclusionCriteria: ExclusionCriteria = {
      maxPronunciationDifficulty: 0.5, // Higher = more difficult
      minMemorabilityScore: dimensionalMinimums.memorability,
      maxSimilarityToExisting: 0.8,
      culturalAppropriatenessMin: 0.5,
      offensiveContentCheck: true,
      lengthLimits: { min: 1, max: 50 },
      ...baseRequirements.exclusionCriteria
    };
    
    return {
      minimumOverallScore,
      dimensionalMinimums,
      balanceRequirement: baseRequirements.balanceRequirement || 0.4,
      consistencyRequirement: baseRequirements.consistencyRequirement || 0.3,
      marketabilityFloor: baseRequirements.marketabilityFloor,
      creativityFloor: baseRequirements.creativityFloor,
      pronunciationFloor: baseRequirements.pronunciationFloor,
      exclusionCriteria
    };
  }
  
  /**
   * Filter names by quality requirements
   */
  private filterNamesByQuality(
    names: EnhancedNameQualityResult[],
    requirements: QualityRequirements
  ): { qualified: EnhancedNameQualityResult[]; rejected: RejectedName[] } {
    const qualified: EnhancedNameQualityResult[] = [];
    const rejected: RejectedName[] = [];
    
    for (const name of names) {
      const rejectionReasons = this.evaluateQualityRequirements(name, requirements);
      
      if (rejectionReasons.length === 0) {
        qualified.push(name);
      } else {
        rejected.push({
          name: name.name,
          score: name.score.overall,
          rejectionReasons,
          improvementPotential: this.calculateImprovementPotential(name, requirements),
          nearMissFactors: this.identifyNearMissFactors(name, requirements, rejectionReasons)
        });
      }
    }
    
    return { qualified, rejected };
  }
  
  /**
   * Evaluate quality requirements for a name
   */
  private evaluateQualityRequirements(
    name: EnhancedNameQualityResult,
    requirements: QualityRequirements
  ): RejectionReason[] {
    const reasons: RejectionReason[] = [];
    const breakdown = name.score.breakdown;
    const vector = name.score.qualityVector;
    
    // Defensive check: if breakdown is undefined, skip dimensional checks
    if (!breakdown) {
      console.warn(`Missing breakdown for name "${name.name}" - skipping dimensional quality checks`);
      return reasons; // Return early with only overall score check
    }
    
    // Check overall score
    if (name.score.overall < requirements.minimumOverallScore) {
      reasons.push({
        category: 'overall_quality',
        criterion: 'minimum_overall_score',
        actualValue: name.score.overall,
        requiredValue: requirements.minimumOverallScore,
        severity: 'critical',
        explanation: `Overall score ${(name.score.overall * 100).toFixed(1)}% below required ${(requirements.minimumOverallScore * 100).toFixed(1)}%`
      });
    }
    
    // Check dimensional minimums
    const dimensionalChecks: Array<[keyof DimensionalMinimums, keyof EnhancedScoreBreakdown]> = [
      ['phoneticFlow', 'phoneticFlow'],
      ['semanticCoherence', 'semanticCoherence'],
      ['creativity', 'creativity'],
      ['memorability', 'memorability'],
      ['marketAppeal', 'marketAppeal'],
      ['appropriateness', 'appropriateness'],
      ['uniqueness', 'uniqueness'],
      ['pronunciation', 'pronunciation']
    ];
    
    for (const [requirementKey, breakdownKey] of dimensionalChecks) {
      const requiredValue = requirements.dimensionalMinimums[requirementKey];
      const actualValue = breakdown[breakdownKey] as number;
      
      if (actualValue < requiredValue) {
        const severity = (requiredValue - actualValue) > 0.2 ? 'critical' : 
                        (requiredValue - actualValue) > 0.1 ? 'major' : 'minor';
        
        reasons.push({
          category: 'dimensional_minimum',
          criterion: requirementKey,
          actualValue,
          requiredValue,
          severity,
          explanation: `${requirementKey} score ${(actualValue * 100).toFixed(1)}% below required ${(requiredValue * 100).toFixed(1)}%`
        });
      }
    }
    
    // Check balance requirement
    if (vector.balance < requirements.balanceRequirement) {
      reasons.push({
        category: 'balance',
        criterion: 'dimensional_balance',
        actualValue: vector.balance,
        requiredValue: requirements.balanceRequirement,
        severity: 'major',
        explanation: `Insufficient balance across quality dimensions`
      });
    }
    
    // Check exclusion criteria
    const exclusion = requirements.exclusionCriteria;
    
    // Pronunciation difficulty check (inverse of pronunciation score)
    const pronunciationDifficulty = 1 - breakdown.pronunciation;
    if (pronunciationDifficulty > exclusion.maxPronunciationDifficulty) {
      reasons.push({
        category: 'exclusion_criteria',
        criterion: 'pronunciation_difficulty',
        actualValue: pronunciationDifficulty,
        requiredValue: exclusion.maxPronunciationDifficulty,
        severity: 'major',
        explanation: 'Name is too difficult to pronounce'
      });
    }
    
    // Memorability check
    if (breakdown.memorability < exclusion.minMemorabilityScore) {
      reasons.push({
        category: 'exclusion_criteria',
        criterion: 'memorability',
        actualValue: breakdown.memorability,
        requiredValue: exclusion.minMemorabilityScore,
        severity: 'major',
        explanation: 'Insufficient memorability'
      });
    }
    
    // Cultural appropriateness check
    if (breakdown.culturalAppeal < exclusion.culturalAppropriatenessMin) {
      reasons.push({
        category: 'exclusion_criteria',
        criterion: 'cultural_appropriateness',
        actualValue: breakdown.culturalAppeal,
        requiredValue: exclusion.culturalAppropriatenessMin,
        severity: 'critical',
        explanation: 'Cultural appropriateness concerns'
      });
    }
    
    // Length limits check
    const nameLength = name.name.length;
    if (nameLength < exclusion.lengthLimits.min || nameLength > exclusion.lengthLimits.max) {
      reasons.push({
        category: 'exclusion_criteria',
        criterion: 'length_limits',
        actualValue: nameLength,
        requiredValue: exclusion.lengthLimits.min, // Use min as reference
        severity: 'minor',
        explanation: `Name length ${nameLength} outside acceptable range ${exclusion.lengthLimits.min}-${exclusion.lengthLimits.max}`
      });
    }
    
    return reasons;
  }
  
  /**
   * Calculate improvement potential for rejected name
   */
  private calculateImprovementPotential(
    name: EnhancedNameQualityResult,
    requirements: QualityRequirements
  ): number {
    const breakdown = name.score.breakdown;
    let totalGap = 0;
    let maxPossibleGap = 0;
    
    // Calculate gaps for each dimension
    const dimensionalChecks: Array<[keyof DimensionalMinimums, keyof EnhancedScoreBreakdown]> = [
      ['phoneticFlow', 'phoneticFlow'],
      ['semanticCoherence', 'semanticCoherence'], 
      ['creativity', 'creativity'],
      ['memorability', 'memorability'],
      ['marketAppeal', 'marketAppeal'],
      ['appropriateness', 'appropriateness'],
      ['uniqueness', 'uniqueness'],
      ['pronunciation', 'pronunciation']
    ];
    
    for (const [requirementKey, breakdownKey] of dimensionalChecks) {
      const requiredValue = requirements.dimensionalMinimums[requirementKey];
      const actualValue = breakdown[breakdownKey] as number;
      
      if (actualValue < requiredValue) {
        const gap = requiredValue - actualValue;
        const maxGap = 1 - actualValue; // Maximum possible improvement
        
        totalGap += gap;
        maxPossibleGap += maxGap;
      }
    }
    
    // Add overall score gap
    if (name.score.overall < requirements.minimumOverallScore) {
      const overallGap = requirements.minimumOverallScore - name.score.overall;
      const maxOverallGap = 1 - name.score.overall;
      
      totalGap += overallGap;
      maxPossibleGap += maxOverallGap;
    }
    
    return maxPossibleGap > 0 ? 1 - (totalGap / maxPossibleGap) : 0;
  }
  
  /**
   * Identify near miss factors for rejected names
   */
  private identifyNearMissFactors(
    name: EnhancedNameQualityResult,
    requirements: QualityRequirements,
    rejectionReasons: RejectionReason[]
  ): string[] {
    const nearMissFactors: string[] = [];
    
    // Check for minor issues that are close to passing
    const minorReasons = rejectionReasons.filter(r => r.severity === 'minor');
    const closeGaps = rejectionReasons.filter(r => 
      r.severity === 'major' && (r.requiredValue - r.actualValue) < 0.1
    );
    
    if (minorReasons.length > 0) {
      nearMissFactors.push('Has only minor quality issues');
    }
    
    if (closeGaps.length > 0) {
      nearMissFactors.push(`Close to meeting ${closeGaps.map(r => r.criterion).join(', ')} requirements`);
    }
    
    // Check for strong dimensions that could compensate
    const breakdown = name.score.breakdown;
    const strongDimensions: string[] = [];
    
    if (breakdown.creativity > 0.8) strongDimensions.push('creativity');
    if (breakdown.memorability > 0.8) strongDimensions.push('memorability');
    if (breakdown.phoneticFlow > 0.8) strongDimensions.push('phonetic flow');
    if (breakdown.marketAppeal > 0.8) strongDimensions.push('market appeal');
    
    if (strongDimensions.length > 0) {
      nearMissFactors.push(`Excellent ${strongDimensions.join(' and ')}`);
    }
    
    // Check overall quality relative to threshold
    const gap = requirements.minimumOverallScore - name.score.overall;
    if (gap < 0.05) {
      nearMissFactors.push('Very close to overall quality threshold');
    }
    
    return nearMissFactors;
  }
  
  /**
   * Apply emergency fallback if insufficient results
   */
  private async applyEmergencyFallback(
    qualified: EnhancedNameQualityResult[],
    rejected: RejectedName[],
    config: QualityThresholdConfig,
    originalThreshold: number
  ): Promise<{ qualified: EnhancedNameQualityResult[]; rejected: RejectedName[]; finalThreshold: number }> {
    if (!config.emergencyFallback.enabled) {
      return { qualified, rejected, finalThreshold: originalThreshold };
    }
    
    // Check if we need emergency fallback
    const needsFallback = qualified.length < config.emergencyFallback.minimumResults;
    
    if (!needsFallback) {
      return { qualified, rejected, finalThreshold: originalThreshold };
    }
    
    secureLog.warn(`Emergency fallback triggered: ${qualified.length} < ${config.emergencyFallback.minimumResults} required`);
    
    let currentThreshold = originalThreshold;
    let currentQualified = qualified;
    let currentRejected = rejected;
    
    // Apply fallback steps
    for (const step of config.emergencyFallback.escalationSteps) {
      if (currentQualified.length >= config.emergencyFallback.minimumResults) {
        break;
      }
      
      switch (step.action) {
        case 'lower_threshold':
          currentThreshold = Math.max(
            currentThreshold + step.thresholdAdjustment,
            config.emergencyFallback.fallbackThreshold
          );
          
          // Re-evaluate with lower threshold
          const newRequirements = this.buildQualityRequirements(config, currentThreshold);
          const allNames = [...currentQualified, ...currentRejected.map(r => ({
            name: r.name,
            score: { overall: r.score },
            // Minimal mock structure - in real implementation would retrieve full results
          } as any))];
          
          const reeval = this.filterNamesByQuality(allNames, newRequirements);
          currentQualified = reeval.qualified;
          currentRejected = reeval.rejected;
          
          secureLog.info(`Threshold lowered to ${currentThreshold.toFixed(3)}, now have ${currentQualified.length} qualified names`);
          break;
          
        case 'expand_criteria':
          // Relax specific criteria based on parameters
          // Implementation would expand specific dimensional requirements
          break;
          
        case 'use_cached':
          // Use cached results from similar contexts
          // Implementation would retrieve cached high-quality names
          break;
          
        default:
          break;
      }
    }
    
    return { 
      qualified: currentQualified, 
      rejected: currentRejected, 
      finalThreshold: currentThreshold 
    };
  }
  
  /**
   * Generate quality gate analysis
   */
  private generateQualityGateAnalysis(
    allNames: EnhancedNameQualityResult[],
    qualified: EnhancedNameQualityResult[],
    rejected: RejectedName[],
    threshold: number
  ): QualityGateAnalysis {
    const totalProcessed = allNames.length;
    const passRate = qualified.length / totalProcessed;
    const averageQuality = allNames.reduce((sum, name) => sum + name.score.overall, 0) / totalProcessed;
    
    // Quality distribution analysis
    const qualityDistribution = this.analyzeQualityDistribution(allNames);
    
    // Dimensional performance analysis
    const dimensionalPerformance = this.analyzeDimensionalPerformance(allNames);
    
    // Threshold effectiveness analysis
    const thresholdEffectiveness = this.analyzeThresholdEffectiveness(
      allNames, 
      qualified, 
      rejected, 
      threshold
    );
    
    // Adaptation opportunities
    const adaptationOpportunities = this.identifyAdaptationOpportunities(
      qualityDistribution,
      dimensionalPerformance,
      thresholdEffectiveness
    );
    
    return {
      totalProcessed,
      passRate,
      averageQuality,
      qualityDistribution,
      dimensionalPerformance,
      thresholdEffectiveness,
      adaptationOpportunities
    };
  }
  
  /**
   * Analyze quality distribution
   */
  private analyzeQualityDistribution(names: EnhancedNameQualityResult[]): QualityDistributionAnalysis {
    const scores = names.map(n => n.score.overall);
    
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const sortedScores = [...scores].sort((a, b) => a - b);
    const median = sortedScores[Math.floor(sortedScores.length / 2)];
    
    // Calculate standard deviation
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Calculate skewness
    const skewness = scores.reduce((sum, score) => sum + Math.pow((score - mean) / standardDeviation, 3), 0) / scores.length;
    
    // Create quality brackets
    const brackets = [
      { range: { min: 0.8, max: 1.0 }, name: 'Excellent' },
      { range: { min: 0.6, max: 0.8 }, name: 'Good' },
      { range: { min: 0.4, max: 0.6 }, name: 'Fair' },
      { range: { min: 0.2, max: 0.4 }, name: 'Poor' },
      { range: { min: 0.0, max: 0.2 }, name: 'Very Poor' }
    ];
    
    const qualityBrackets: QualityBracket[] = brackets.map(bracket => {
      const inRange = names.filter(n => 
        n.score.overall >= bracket.range.min && n.score.overall < bracket.range.max
      );
      
      return {
        range: bracket.range,
        count: inRange.length,
        percentage: (inRange.length / names.length) * 100,
        characteristics: this.identifyBracketCharacteristics(inRange, bracket.name)
      };
    });
    
    // Outlier analysis
    const q1 = sortedScores[Math.floor(scores.length * 0.25)];
    const q3 = sortedScores[Math.floor(scores.length * 0.75)];
    const iqr = q3 - q1;
    const outlierThreshold = 1.5 * iqr;
    
    const highOutliers = names
      .filter(n => n.score.overall > q3 + outlierThreshold)
      .map(n => n.name);
    
    const lowOutliers = names
      .filter(n => n.score.overall < q1 - outlierThreshold)
      .map(n => n.name);
    
    const outlierAnalysis: OutlierAnalysis = {
      highOutliers,
      lowOutliers,
      outlierThreshold,
      outlierImpact: this.assessOutlierImpact(highOutliers, lowOutliers, names.length)
    };
    
    return {
      mean,
      median,
      standardDeviation,
      skewness,
      qualityBrackets,
      outlierAnalysis
    };
  }
  
  /**
   * Identify characteristics of quality brackets
   */
  private identifyBracketCharacteristics(names: EnhancedNameQualityResult[], bracketName: string): string[] {
    if (names.length === 0) return [];
    
    const characteristics: string[] = [];
    
    // Calculate average dimensional scores
    const avgDimensions = this.calculateAverageDimensions(names);
    
    // Identify strong dimensions for this bracket
    const strongDimensions = Object.entries(avgDimensions)
      .filter(([, value]) => value > 0.7)
      .map(([dimension]) => dimension);
    
    // Identify weak dimensions
    const weakDimensions = Object.entries(avgDimensions)
      .filter(([, value]) => value < 0.5)
      .map(([dimension]) => dimension);
    
    if (strongDimensions.length > 0) {
      characteristics.push(`Strong in ${strongDimensions.join(', ')}`);
    }
    
    if (weakDimensions.length > 0) {
      characteristics.push(`Weak in ${weakDimensions.join(', ')}`);
    }
    
    // Bracket-specific characteristics
    switch (bracketName.toLowerCase()) {
      case 'excellent':
        characteristics.push('Consistently high quality', 'Market ready');
        break;
      case 'good':
        characteristics.push('Above average quality', 'Generally acceptable');
        break;
      case 'fair':
        characteristics.push('Room for improvement', 'Selective use cases');
        break;
      case 'poor':
        characteristics.push('Below standards', 'Needs significant improvement');
        break;
      case 'very poor':
        characteristics.push('Major quality issues', 'Not recommended');
        break;
    }
    
    return characteristics;
  }
  
  /**
   * Calculate average dimensional scores
   */
  private calculateAverageDimensions(names: EnhancedNameQualityResult[]): Record<string, number> {
    const dimensions = ['phoneticFlow', 'semanticCoherence', 'creativity', 'memorability', 'marketAppeal'];
    const averages: Record<string, number> = {};
    
    for (const dimension of dimensions) {
      const scores = names.map(n => 
        n.score.breakdown[dimension as keyof EnhancedScoreBreakdown] as number
      );
      averages[dimension] = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    }
    
    return averages;
  }
  
  /**
   * Assess outlier impact
   */
  private assessOutlierImpact(
    highOutliers: string[], 
    lowOutliers: string[], 
    totalCount: number
  ): string {
    const totalOutliers = highOutliers.length + lowOutliers.length;
    const outlierPercentage = (totalOutliers / totalCount) * 100;
    
    if (outlierPercentage > 20) {
      return 'High variance in quality - consider reviewing generation process';
    } else if (outlierPercentage > 10) {
      return 'Moderate quality variance - some exceptional and poor performers';
    } else if (highOutliers.length > lowOutliers.length) {
      return 'Some exceptional high-quality names identified';
    } else if (lowOutliers.length > highOutliers.length) {
      return 'Some notably low-quality names requiring attention';
    } else {
      return 'Quality distribution is well-balanced';
    }
  }
  
  /**
   * Analyze dimensional performance
   */
  private analyzeDimensionalPerformance(names: EnhancedNameQualityResult[]): DimensionalPerformanceAnalysis {
    const dimensions = ['phoneticFlow', 'semanticCoherence', 'creativity', 'memorability', 'marketAppeal'];
    const performances: DimensionPerformance[] = [];
    
    for (const dimension of dimensions) {
      const scores = names.map(n => 
        n.score.breakdown[dimension as keyof EnhancedScoreBreakdown] as number
      );
      
      const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      const passThreshold = 0.6; // Arbitrary threshold for "passing"
      const passRate = scores.filter(score => score >= passThreshold).length / scores.length;
      
      const mean = averageScore;
      const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
      
      performances.push({
        dimension,
        averageScore,
        passRate,
        variance,
        trend: 'stable' // Would be calculated from historical data
      });
    }
    
    // Sort to identify strongest and weakest
    const sortedByAverage = [...performances].sort((a, b) => b.averageScore - a.averageScore);
    const strongestDimensions = sortedByAverage.slice(0, 3);
    const weakestDimensions = sortedByAverage.slice(-3);
    
    // Generate correlation insights
    const correlationInsights = this.generateCorrelationInsights(names);
    
    // Generate improvement priorities
    const improvementPriorities = this.generateImprovementPriorities(weakestDimensions);
    
    return {
      strongestDimensions,
      weakestDimensions,
      correlationInsights,
      improvementPriorities
    };
  }
  
  /**
   * Generate correlation insights
   */
  private generateCorrelationInsights(names: EnhancedNameQualityResult[]): CorrelationInsight[] {
    const insights: CorrelationInsight[] = [];
    
    // Calculate some key correlations
    const phoneticScores = names.map(n => n.score.breakdown.phoneticFlow);
    const semanticScores = names.map(n => n.score.breakdown.semanticCoherence);
    const creativityScores = names.map(n => n.score.breakdown.creativity);
    const marketScores = names.map(n => n.score.breakdown.marketAppeal);
    
    const phoneticSemanticCorr = this.calculateCorrelation(phoneticScores, semanticScores);
    const creativityMarketCorr = this.calculateCorrelation(creativityScores, marketScores);
    
    if (Math.abs(phoneticSemanticCorr) > 0.5) {
      insights.push({
        dimensions: ['phoneticFlow', 'semanticCoherence'],
        correlation: phoneticSemanticCorr,
        significance: Math.abs(phoneticSemanticCorr) > 0.7 ? 'high' : 'medium',
        insight: phoneticSemanticCorr > 0 ? 
          'Names with good phonetic flow tend to have better semantic coherence' :
          'Phonetic flow and semantic coherence show inverse relationship',
        actionableAdvice: phoneticSemanticCorr > 0 ?
          'Focus on word combinations that sound good and make sense together' :
          'Balance phonetic appeal with semantic clarity'
      });
    }
    
    if (Math.abs(creativityMarketCorr) > 0.3) {
      insights.push({
        dimensions: ['creativity', 'marketAppeal'],
        correlation: creativityMarketCorr,
        significance: Math.abs(creativityMarketCorr) > 0.5 ? 'high' : 'medium',
        insight: creativityMarketCorr > 0 ?
          'Creative names tend to have broader market appeal' :
          'Trade-off between creativity and mainstream market appeal',
        actionableAdvice: creativityMarketCorr > 0 ?
          'Continue pursuing creative approaches for market success' :
          'Balance creative innovation with commercial viability'
      });
    }
    
    return insights;
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
   * Generate improvement priorities
   */
  private generateImprovementPriorities(weakestDimensions: DimensionPerformance[]): ImprovementPriority[] {
    return weakestDimensions.map(dimension => {
      const priority = dimension.averageScore < 0.4 ? 'high' : 
                     dimension.averageScore < 0.6 ? 'medium' : 'low';
      
      const targetPerformance = Math.min(dimension.averageScore + 0.2, 0.85);
      
      const strategies = this.generateImprovementStrategies(dimension.dimension);
      
      return {
        dimension: dimension.dimension,
        priority,
        currentPerformance: dimension.averageScore,
        targetPerformance,
        impact: this.assessImprovementImpact(dimension.dimension, priority),
        difficulty: this.assessImprovementDifficulty(dimension.dimension),
        strategies
      };
    });
  }
  
  /**
   * Generate improvement strategies for dimension
   */
  private generateImprovementStrategies(dimension: string): string[] {
    const strategies: Record<string, string[]> = {
      phoneticFlow: [
        'Focus on smooth consonant-vowel patterns',
        'Test pronunciation with diverse speakers',
        'Avoid difficult consonant clusters'
      ],
      semanticCoherence: [
        'Ensure word meanings complement each other',
        'Choose words from related semantic fields',
        'Verify metaphorical connections make sense'
      ],
      creativity: [
        'Explore unconventional word combinations',
        'Use creative wordplay and linguistic devices',
        'Draw inspiration from diverse sources'
      ],
      memorability: [
        'Create strong phonetic hooks',
        'Use memorable rhythmic patterns',
        'Incorporate emotional resonance'
      ],
      marketAppeal: [
        'Research target audience preferences',
        'Balance uniqueness with accessibility',
        'Consider commercial viability factors'
      ]
    };
    
    return strategies[dimension] || ['Improve through careful selection and testing'];
  }
  
  /**
   * Assess improvement impact
   */
  private assessImprovementImpact(dimension: string, priority: string): string {
    const impactMap: Record<string, Record<string, string>> = {
      phoneticFlow: {
        high: 'Significantly improves name accessibility and appeal',
        medium: 'Moderately enhances name quality',
        low: 'Minor improvement in overall quality'
      },
      semanticCoherence: {
        high: 'Major improvement in name meaning and clarity',
        medium: 'Better conceptual understanding',
        low: 'Slight enhancement in clarity'
      },
      creativity: {
        high: 'Dramatically increases name uniqueness and appeal',
        medium: 'Notable improvement in distinctiveness',
        low: 'Minor creative enhancement'
      },
      memorability: {
        high: 'Substantial improvement in name recall and impact',
        medium: 'Better name recognition',
        low: 'Slight improvement in memorability'
      },
      marketAppeal: {
        high: 'Major boost in commercial viability',
        medium: 'Improved market positioning',
        low: 'Minor commercial enhancement'
      }
    };
    
    return impactMap[dimension]?.[priority] || 'Improvement in name quality';
  }
  
  /**
   * Assess improvement difficulty
   */
  private assessImprovementDifficulty(dimension: string): 'easy' | 'medium' | 'hard' {
    const difficultyMap: Record<string, 'easy' | 'medium' | 'hard'> = {
      phoneticFlow: 'medium',
      semanticCoherence: 'hard',
      creativity: 'hard',
      memorability: 'easy',
      marketAppeal: 'medium'
    };
    
    return difficultyMap[dimension] || 'medium';
  }
  
  /**
   * Analyze threshold effectiveness
   */
  private analyzeThresholdEffectiveness(
    allNames: EnhancedNameQualityResult[],
    qualified: EnhancedNameQualityResult[],
    rejected: RejectedName[],
    threshold: number
  ): ThresholdEffectivenessAnalysis {
    const qualifiedScores = qualified.map(n => n.score.overall);
    const rejectedScores = rejected.map(n => n.score);
    
    // Calculate quality improvement
    const averageQualityAll = allNames.reduce((sum, n) => sum + n.score.overall, 0) / allNames.length;
    const averageQualityQualified = qualified.length > 0 ?
      qualifiedScores.reduce((sum, score) => sum + score, 0) / qualifiedScores.length : 0;
    
    const qualityImprovement = averageQualityQualified - averageQualityAll;
    
    // Calculate quantity reduction
    const quantityReduction = 1 - (qualified.length / allNames.length);
    
    // Estimate user satisfaction impact (heuristic)
    const userSatisfactionImpact = Math.min(qualityImprovement * 2, 0.5) - quantityReduction * 0.3;
    
    // Calculate diversity impact
    const diversityImpact = this.calculateDiversityImpact(qualified, allNames);
    
    const thresholdImpact: ThresholdImpact = {
      qualityImprovement,
      quantityReduction,
      userSatisfactionImpact,
      diversityImpact,
      balanceAssessment: this.assessThresholdBalance(qualityImprovement, quantityReduction)
    };
    
    // Calculate optimal threshold (simplified)
    const optimalThreshold = this.calculateOptimalThreshold(allNames, threshold);
    
    // Calculate effectiveness score
    const effectivenessScore = Math.max(0, Math.min(1, 
      qualityImprovement * 0.5 + 
      (1 - quantityReduction) * 0.3 + 
      (userSatisfactionImpact + 1) * 0.2
    ));
    
    // Determine adjustment recommendation
    const adjustmentRecommendation = this.determineThresholdAdjustment(
      threshold, 
      optimalThreshold, 
      thresholdImpact
    );
    
    const confidenceLevel = this.calculateConfidenceLevel(allNames.length, effectivenessScore);
    
    return {
      currentThreshold: threshold,
      optimalThreshold,
      effectivenessScore,
      thresholdImpact,
      adjustmentRecommendation,
      confidenceLevel
    };
  }
  
  /**
   * Calculate diversity impact of threshold
   */
  private calculateDiversityImpact(
    qualified: EnhancedNameQualityResult[],
    allNames: EnhancedNameQualityResult[]
  ): number {
    if (qualified.length === 0) return -1;
    
    // Simplified diversity calculation based on score variance
    const qualifiedVariance = this.calculateVariance(qualified.map(n => n.score.overall));
    const allVariance = this.calculateVariance(allNames.map(n => n.score.overall));
    
    return allVariance > 0 ? (qualifiedVariance / allVariance) - 1 : 0;
  }
  
  /**
   * Calculate variance
   */
  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  }
  
  /**
   * Assess threshold balance
   */
  private assessThresholdBalance(qualityImprovement: number, quantityReduction: number): string {
    if (qualityImprovement > 0.1 && quantityReduction < 0.3) {
      return 'Excellent balance - significant quality improvement with minimal quantity impact';
    } else if (qualityImprovement > 0.05 && quantityReduction < 0.5) {
      return 'Good balance - notable quality improvement with acceptable quantity reduction';
    } else if (quantityReduction > 0.7) {
      return 'Too restrictive - excessive quantity reduction may limit options';
    } else if (qualityImprovement < 0.02) {
      return 'Too lenient - insufficient quality improvement';
    } else {
      return 'Moderate balance - room for optimization';
    }
  }
  
  /**
   * Calculate optimal threshold (simplified heuristic)
   */
  private calculateOptimalThreshold(names: EnhancedNameQualityResult[], currentThreshold: number): number {
    const scores = names.map(n => n.score.overall).sort((a, b) => b - a);
    
    // Find threshold that keeps top 50-70% while maximizing quality
    const targetQuantity = Math.ceil(scores.length * 0.6);
    const candidateThreshold = scores[targetQuantity - 1];
    
    // Don't suggest changes that are too dramatic
    const maxChange = 0.15;
    const clampedThreshold = Math.max(
      Math.min(candidateThreshold, currentThreshold + maxChange),
      currentThreshold - maxChange
    );
    
    return clampedThreshold;
  }
  
  /**
   * Determine threshold adjustment recommendation
   */
  private determineThresholdAdjustment(
    current: number,
    optimal: number,
    impact: ThresholdImpact
  ): 'increase' | 'decrease' | 'maintain' | 'contextualize' {
    const difference = optimal - current;
    
    if (Math.abs(difference) < 0.05) {
      return 'maintain';
    } else if (difference > 0.05 && impact.qualityImprovement < 0.05) {
      return 'increase';
    } else if (difference < -0.05 && impact.quantityReduction > 0.6) {
      return 'decrease';
    } else if (impact.userSatisfactionImpact < -0.2) {
      return 'contextualize'; // Suggest context-specific thresholds
    } else {
      return 'maintain';
    }
  }
  
  /**
   * Calculate confidence level in analysis
   */
  private calculateConfidenceLevel(sampleSize: number, effectivenessScore: number): number {
    // Higher confidence with larger samples and better effectiveness
    const sampleConfidence = Math.min(sampleSize / 20, 1); // Full confidence at 20+ samples
    const effectivenessConfidence = effectivenessScore;
    
    return (sampleConfidence + effectivenessConfidence) / 2;
  }
  
  /**
   * Identify adaptation opportunities
   */
  private identifyAdaptationOpportunities(
    qualityDistribution: QualityDistributionAnalysis,
    dimensionalPerformance: DimensionalPerformanceAnalysis,
    thresholdEffectiveness: ThresholdEffectivenessAnalysis
  ): AdaptationOpportunity[] {
    const opportunities: AdaptationOpportunity[] = [];
    
    // Threshold adjustment opportunities
    if (thresholdEffectiveness.adjustmentRecommendation !== 'maintain') {
      opportunities.push({
        type: 'threshold_adjustment',
        description: `${thresholdEffectiveness.adjustmentRecommendation} threshold from ${thresholdEffectiveness.currentThreshold.toFixed(3)} to ${thresholdEffectiveness.optimalThreshold.toFixed(3)}`,
        impact: Math.abs(thresholdEffectiveness.optimalThreshold - thresholdEffectiveness.currentThreshold),
        confidence: thresholdEffectiveness.confidenceLevel,
        implementation: 'Adjust base threshold or apply context-specific modifiers',
        expectedOutcome: `Improved balance between quality and quantity`
      });
    }
    
    // Dimensional weighting opportunities
    const weakDimensions = dimensionalPerformance.weakestDimensions.filter(d => d.averageScore < 0.5);
    if (weakDimensions.length > 0) {
      opportunities.push({
        type: 'dimensional_weighting',
        description: `Adjust weighting for weak dimensions: ${weakDimensions.map(d => d.dimension).join(', ')}`,
        impact: 0.15,
        confidence: 0.7,
        implementation: 'Modify dimensional minimum requirements or scoring weights',
        expectedOutcome: 'Better balance across quality dimensions'
      });
    }
    
    // Context-specific opportunities
    if (qualityDistribution.skewness > 0.5 || qualityDistribution.skewness < -0.5) {
      opportunities.push({
        type: 'context_specific',
        description: 'Implement context-specific thresholds for different use cases',
        impact: 0.2,
        confidence: 0.6,
        implementation: 'Create threshold profiles for different genres, audiences, or contexts',
        expectedOutcome: 'More appropriate quality gates for specific contexts'
      });
    }
    
    return opportunities.sort((a, b) => b.impact * b.confidence - a.impact * a.confidence);
  }
  
  /**
   * Generate threshold adaptations
   */
  private generateThresholdAdaptations(
    config: QualityThresholdConfig,
    analysis: QualityGateAnalysis
  ): ThresholdAdaptation[] {
    const adaptations: ThresholdAdaptation[] = [];
    
    // Check if emergency fallback was triggered
    if (analysis.thresholdEffectiveness.currentThreshold !== this.baseThresholds[config.mode]) {
      adaptations.push({
        type: 'threshold_lowered',
        trigger: 'emergency_fallback',
        oldValue: this.baseThresholds[config.mode],
        newValue: analysis.thresholdEffectiveness.currentThreshold,
        reason: 'Insufficient results with original threshold',
        expectedImpact: 'Increased quantity with acceptable quality trade-off'
      });
    }
    
    // Check for automatic quality adjustments
    if (analysis.passRate < 0.2 && analysis.averageQuality > 0.6) {
      adaptations.push({
        type: 'criteria_adjusted',
        trigger: 'low_pass_rate_with_good_quality',
        oldValue: 0,
        newValue: 1,
        reason: 'Quality criteria too restrictive for available names',
        expectedImpact: 'Better balance between quality standards and result availability'
      });
    }
    
    return adaptations;
  }
  
  /**
   * Generate quality gate recommendations
   */
  private generateQualityGateRecommendations(
    analysis: QualityGateAnalysis,
    config: QualityThresholdConfig
  ): QualityGateRecommendation[] {
    const recommendations: QualityGateRecommendation[] = [];
    
    // Threshold optimization recommendations
    if (analysis.thresholdEffectiveness.adjustmentRecommendation !== 'maintain') {
      const action = analysis.thresholdEffectiveness.adjustmentRecommendation;
      recommendations.push({
        category: 'threshold_optimization',
        priority: 'high',
        recommendation: `${action.charAt(0).toUpperCase() + action.slice(1)} quality threshold`,
        rationale: `Current threshold effectiveness: ${(analysis.thresholdEffectiveness.effectivenessScore * 100).toFixed(1)}%`,
        implementation: `Adjust threshold to ${analysis.thresholdEffectiveness.optimalThreshold.toFixed(3)}`,
        expectedBenefit: analysis.thresholdEffectiveness.thresholdImpact.balanceAssessment,
        timeframe: 'immediate'
      });
    }
    
    // Quality improvement recommendations
    const weakDimensions = analysis.dimensionalPerformance.weakestDimensions
      .filter(d => d.averageScore < 0.5);
    
    if (weakDimensions.length > 0) {
      recommendations.push({
        category: 'quality_improvement',
        priority: 'medium',
        recommendation: `Focus on improving ${weakDimensions.map(d => d.dimension).join(', ')}`,
        rationale: `These dimensions show consistently low performance`,
        implementation: 'Enhance generation algorithms or add specific quality checks',
        expectedBenefit: 'Higher overall pass rates and better name quality',
        timeframe: 'short_term'
      });
    }
    
    // Process enhancement recommendations
    if (analysis.passRate < 0.3) {
      recommendations.push({
        category: 'process_enhancement',
        priority: 'high',
        recommendation: 'Review name generation process for quality issues',
        rationale: `Only ${(analysis.passRate * 100).toFixed(1)}% of names are meeting quality standards`,
        implementation: 'Analyze generation patterns and improve quality control',
        expectedBenefit: 'Higher success rates and reduced waste',
        timeframe: 'short_term'
      });
    }
    
    // User experience recommendations
    if (analysis.thresholdEffectiveness.thresholdImpact.userSatisfactionImpact < -0.1) {
      recommendations.push({
        category: 'user_experience',
        priority: 'medium',
        recommendation: 'Implement adaptive thresholds based on user feedback',
        rationale: 'Current threshold settings may be impacting user satisfaction',
        implementation: 'Enable learning from user preferences and feedback',
        expectedBenefit: 'Better user satisfaction and more relevant results',
        timeframe: 'long_term'
      });
    }
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }
  
  /**
   * Record learning data for adaptive improvement
   */
  private recordLearningData(
    config: QualityThresholdConfig,
    threshold: number,
    analysis: QualityGateAnalysis,
    result: { qualified: EnhancedNameQualityResult[]; rejected: RejectedName[]; finalThreshold: number }
  ): void {
    if (!config.adaptiveSettings.enabled) return;
    
    const contextKey = this.generateContextKey(config.context);
    const learningData: ThresholdLearningData = {
      userId: config.context.userPreferences?.userId,
      context: config.context,
      originalThreshold: threshold,
      adaptedThreshold: result.finalThreshold,
      feedback: [], // Would be populated from actual user feedback
      outcome: {
        userSatisfaction: 0.7, // Placeholder - would come from user feedback
        qualityImprovement: analysis.thresholdEffectiveness.thresholdImpact.qualityImprovement,
        quantityImpact: analysis.thresholdEffectiveness.thresholdImpact.quantityReduction,
        usagePattern: this.determineUsagePattern(result.qualified.length, analysis.totalProcessed),
        successMetrics: {
          passRate: analysis.passRate,
          averageQuality: analysis.averageQuality,
          effectivenessScore: analysis.thresholdEffectiveness.effectivenessScore
        }
      },
      timestamp: Date.now()
    };
    
    // Store learning data
    const existing = this.learningHistory.get(contextKey) || [];
    existing.push(learningData);
    
    // Keep only recent data (based on feedback window)
    const cutoff = Date.now() - config.adaptiveSettings.feedbackWindow * 24 * 60 * 60 * 1000;
    const filtered = existing.filter(data => data.timestamp > cutoff);
    
    this.learningHistory.set(contextKey, filtered);
    
    // Cache the learning data
    this.learningCache.set(`${contextKey}_${learningData.timestamp}`, learningData);
  }
  
  /**
   * Determine usage pattern
   */
  private determineUsagePattern(qualifiedCount: number, totalCount: number): string {
    const ratio = qualifiedCount / totalCount;
    
    if (ratio > 0.8) return 'high_acceptance';
    if (ratio > 0.5) return 'moderate_acceptance';
    if (ratio > 0.2) return 'selective_acceptance';
    return 'low_acceptance';
  }
  
  /**
   * Generate context key for caching and learning
   */
  private generateContextKey(context: ThresholdContext): string {
    const keyComponents = [
      context.type,
      context.genre || 'any',
      context.targetAudience || 'any',
      context.marketContext || 'any',
      context.qualityPriority || 'balanced'
    ];
    
    return keyComponents.join('_');
  }
  
  /**
   * Load learning history from persistent storage
   */
  private loadLearningHistory(): void {
    // In a real implementation, this would load from database
    // For now, initialize empty
    this.learningHistory.clear();
  }
  
  /**
   * Load benchmark data from persistent storage
   */
  private loadBenchmarkData(): void {
    // In a real implementation, this would load from database
    // For now, initialize with some defaults
    this.benchmarkData.clear();
    
    // Add some default benchmarks
    this.benchmarkData.set('commercial_mainstream', {
      context: 'Commercial Mainstream',
      threshold: 0.70,
      passRate: 0.45,
      averageQuality: 0.68,
      userSatisfaction: 0.75,
      lastUpdated: Date.now(),
      sampleSize: 100
    });
  }
  
  /**
   * Get empty gate analysis for error cases
   */
  private getEmptyGateAnalysis(): QualityGateAnalysis {
    return {
      totalProcessed: 0,
      passRate: 0,
      averageQuality: 0,
      qualityDistribution: {
        mean: 0,
        median: 0,
        standardDeviation: 0,
        skewness: 0,
        qualityBrackets: [],
        outlierAnalysis: {
          highOutliers: [],
          lowOutliers: [],
          outlierThreshold: 0,
          outlierImpact: 'No data available'
        }
      },
      dimensionalPerformance: {
        strongestDimensions: [],
        weakestDimensions: [],
        correlationInsights: [],
        improvementPriorities: []
      },
      thresholdEffectiveness: {
        currentThreshold: 0,
        optimalThreshold: 0,
        effectivenessScore: 0,
        thresholdImpact: {
          qualityImprovement: 0,
          quantityReduction: 0,
          userSatisfactionImpact: 0,
          diversityImpact: 0,
          balanceAssessment: 'No analysis available'
        },
        adjustmentRecommendation: 'maintain',
        confidenceLevel: 0
      },
      adaptationOpportunities: []
    };
  }
  
  /**
   * Generate cache key for gate results
   */
  private generateCacheKey(names: EnhancedNameQualityResult[], config: QualityThresholdConfig): string {
    const nameKeys = names.map(n => n.name).sort().join(',');
    const configKey = JSON.stringify({
      mode: config.mode,
      context: config.context,
      requirements: config.requirements
    });
    
    return `threshold_gate_${Buffer.from(nameKeys + configKey).toString('base64').substring(0, 32)}`;
  }
}

// Export singleton instance
export const qualityThresholdManager = new QualityThresholdManager();