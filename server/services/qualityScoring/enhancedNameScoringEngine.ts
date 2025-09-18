/**
 * Enhanced Name Scoring Engine with Cross-Dimensional Quality Metrics
 * Integrates phonetic, semantic, and synergy analysis for superior quality assessment
 */

import type {
  EnhancedNameScoringRequest,
  EnhancedNameQualityResult,
  EnhancedQualityScore,
  EnhancedScoreBreakdown,
  CrossDimensionalMetrics,
  QualityVector,
  QualityRanking,
  ImprovementSuggestion,
  EnhancedScoringWeights,
  AdvancedScoringConfig
} from './enhancedInterfaces';

import { phoneticSemanticAnalyzer } from './phoneticSemanticAnalyzer';
import { semanticAnalyzer } from './semanticAnalyzer';
import { phoneticFlowAnalyzer } from '../nameGeneration/phoneticFlowAnalyzer';
import { musicalityScoring, type MusicalityRequest } from './musicalityScoring';
import { TextAnalyzer, CreativityAnalyzer, ScoringUtils, PerformanceTracker } from './utils';
import { DEFAULT_NAME_WEIGHTS, GENRE_ADJUSTMENTS } from './config';
import { secureLog } from '../../utils/secureLogger';
import { CacheService } from '../cacheService';

export class EnhancedNameScoringEngine {
  private cache: CacheService<EnhancedNameQualityResult>;
  private algorithmVersion = '2.0.0';
  
  // Enhanced weighting configurations (normalized to sum to 1.0)
  private readonly enhancedWeights: EnhancedScoringWeights = {
    // Traditional dimensions (normalized proportionally)
    creativity: 0.091,         // 0.12 / 1.32
    appropriateness: 0.076,    // 0.10 / 1.32
    quality: 0.076,           // 0.10 / 1.32
    memorability: 0.068,      // 0.09 / 1.32
    uniqueness: 0.061,        // 0.08 / 1.32
    structure: 0.030,         // 0.04 / 1.32
    
    // New phonetic dimensions
    phoneticFlow: 0.076,      // 0.10 / 1.32
    
    // New semantic dimensions
    semanticCoherence: 0.061, // 0.08 / 1.32
    emotionalResonance: 0.045, // 0.06 / 1.32
    culturalAppeal: 0.045,    // 0.06 / 1.32
    
    // New musicality dimensions
    rhymeQuality: 0.091,      // 0.12 / 1.32
    rhythmQuality: 0.083,     // 0.11 / 1.32
    musicalCoherence: 0.061,  // 0.08 / 1.32
    vocalDeliverability: 0.053, // 0.07 / 1.32
    musicalSynergy: 0.038,    // 0.05 / 1.32
    
    // Cross-dimensional synergy
    crossDimensionalSynergy: 0.045  // 0.06 / 1.32
  };
  
  // Advanced configuration
  private readonly advancedConfig: AdvancedScoringConfig = {
    weights: this.enhancedWeights,
    thresholds: {
      strict: 0.80,
      moderate: 0.65,
      lenient: 0.50,
      emergency: 0.35,
      phoneticMinimum: 0.40,
      semanticMinimum: 0.40,
      synergyMinimum: 0.30,
      balanceRequirement: 0.60
    },
    genreSpecific: this.getGenreSpecificConfigs(),
    adaptive: {
      enabled: true,
      learningRate: 0.1,
      feedbackWeight: 0.3,
      adaptationThreshold: 0.05,
      maxAdjustment: 0.20
    },
    performance: {
      maxAnalysisTime: 2000,
      cacheStrategy: 'moderate',
      parallelProcessing: true,
      fallbackMode: 'cached'
    }
  };
  
  // Quality benchmarks for industry comparison
  private readonly industryBenchmarks = {
    topTier: 0.85,      // Top 10% of professional band/song names
    mainstream: 0.70,   // Median commercial success threshold
    threshold: 0.55,    // Minimum viable commercial quality
    experimental: 0.60  // Threshold for experimental/artistic projects
  };
  
  constructor() {
    // Initialize cache with 90 minutes TTL and max 1500 entries
    this.cache = new CacheService<EnhancedNameQualityResult>(5400, 1500);
  }
  
  /**
   * Score a single name with comprehensive analysis
   */
  async scoreNameEnhanced(request: EnhancedNameScoringRequest): Promise<EnhancedNameQualityResult> {
    const cacheKey = this.generateCacheKey(request);
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached !== null) {
      secureLog.debug(`EnhancedNameScoringEngine cache hit for: ${request.name}`);
      return cached;
    }
    
    const endTiming = PerformanceTracker.startTiming('enhanced_name_scoring');
    
    try {
      secureLog.debug(`Enhanced scoring for: ${request.name}`);
      
      // Perform comprehensive phonetic-semantic analysis
      const phoneticSemanticAnalysis = await phoneticSemanticAnalyzer.analyze(request.name, {
        genre: request.genre,
        mood: request.mood,
        type: request.type,
        targetAudience: request.targetAudience,
        culturalContext: request.culturalContext
      });
      
      // Perform musicality analysis
      const musicalityAnalysis = await musicalityScoring.analyzeMusicalName({
        name: request.name,
        type: request.type,
        genre: request.genre,
        mood: request.mood,
        targetAudience: request.targetAudience,
        culturalContext: request.culturalContext,
        analysisDepth: request.analysisDepth || 'standard'
      });
      
      // Calculate enhanced score breakdown
      const breakdown = await this.calculateEnhancedScoreBreakdown(
        request, 
        phoneticSemanticAnalysis,
        musicalityAnalysis
      );
      
      // Get contextual weights
      const weights = this.getContextualWeights(request);
      
      // Calculate cross-dimensional metrics
      const crossDimensional = this.extractCrossDimensionalMetrics(phoneticSemanticAnalysis);
      
      // Generate quality vector
      const qualityVector = this.generateQualityVector(breakdown, crossDimensional);
      
      // Calculate overall score with enhanced weighting
      const overall = this.calculateEnhancedOverallScore(breakdown, weights, qualityVector);
      
      // Create enhanced quality score
      const score: EnhancedQualityScore = {
        overall,
        breakdown,
        metadata: {
          scoringTime: endTiming(),
          algorithm: 'enhanced_name_scoring_v2',
          version: this.algorithmVersion,
          warnings: this.generateEnhancedWarnings(request, breakdown, qualityVector),
          confidence: this.calculateEnhancedConfidence(request, breakdown, qualityVector),
          analysisDepth: request.analysisDepth || 'standard',
          dimensionsAnalyzed: this.getDimensionsAnalyzed(request),
          crossDimensionalSynergy: crossDimensional.synergy.crossDimensionalHarmony / 100,
          qualityConsistency: this.calculateQualityConsistency(breakdown),
          adaptiveAdjustments: this.getAdaptiveAdjustments(request, breakdown)
        },
        crossDimensional,
        qualityVector
      };
      
      // Generate quality ranking
      const qualityRanking = this.generateQualityRanking(score, request);
      
      // Generate improvement suggestions
      const improvementSuggestions = this.generateImprovementSuggestions(
        breakdown, 
        crossDimensional, 
        qualityVector,
        request
      );
      
      // Generate comprehensive recommendations
      const recommendations = this.generateEnhancedRecommendations(
        breakdown,
        crossDimensional,
        qualityRanking,
        request
      );
      
      const result: EnhancedNameQualityResult = {
        name: request.name,
        score,
        passesThreshold: false, // Will be set by the main service
        recommendations,
        qualityRanking,
        improvementSuggestions
      };
      
      // Cache the result
      this.cache.set(cacheKey, result);
      
      return result;
      
    } catch (error) {
      endTiming();
      secureLog.error('Enhanced name scoring failed:', error);
      return this.getDefaultEnhancedResult(request);
    }
  }
  
  /**
   * Calculate enhanced score breakdown with all dimensions
   */
  private async calculateEnhancedScoreBreakdown(
    request: EnhancedNameScoringRequest,
    phoneticSemanticAnalysis: any,
    musicalityAnalysis: any
  ): Promise<EnhancedScoreBreakdown> {
    // Extract scores from phonetic-semantic analysis
    const phoneticScore = phoneticSemanticAnalysis.phoneticAnalysis;
    const semanticScore = phoneticSemanticAnalysis.semanticAnalysis.score;
    const synergyScore = phoneticSemanticAnalysis.score.synergy;
    
    // Traditional dimensions (enhanced)
    const creativity = this.calculateEnhancedCreativity(request, semanticScore);
    const appropriateness = this.calculateEnhancedAppropriateness(request, semanticScore);
    const quality = this.calculateEnhancedQuality(request, phoneticScore);
    const memorability = this.calculateEnhancedMemorability(request, phoneticScore, semanticScore);
    const uniqueness = this.calculateEnhancedUniqueness(request, phoneticScore, semanticScore);
    const structure = this.calculateEnhancedStructure(request);
    
    // New phonetic dimensions
    const phoneticFlow = phoneticScore.flow / 100;
    
    // New semantic dimensions
    const semanticCoherence = semanticScore.coherence / 100;
    const emotionalResonance = semanticScore.emotionalResonance / 100;
    const culturalAppeal = semanticScore.culturalAppeal / 100;
    const imageAssociation = semanticScore.imagery / 100;
    
    // Musicality dimensions
    const musicalScore = musicalityAnalysis.score;
    const rhymeQuality = musicalScore.breakdown.rhymeQuality / 100;
    const rhythmQuality = musicalScore.breakdown.rhythmQuality / 100;
    const musicalCoherence = musicalScore.breakdown.musicalCoherence / 100;
    const vocalDeliverability = musicalScore.breakdown.vocalDeliverability / 100;
    const musicCatchiness = musicalScore.breakdown.catchiness / 100;
    
    // Cross-dimensional synergy
    const phoneticSemanticAlignment = synergyScore.phoneticSemanticAlignment / 100;
    const genreOptimization = synergyScore.genreOptimization / 100;
    const marketAppeal = phoneticSemanticAnalysis.combinedMetrics.marketAppealIndex / 100;
    const musicalSynergy = musicalScore.synergy.reinforcement / 100;
    
    return {
      // Traditional dimensions
      creativity,
      appropriateness,
      quality,
      memorability,
      uniqueness,
      structure,
      
      // New phonetic dimensions
      phoneticFlow,
      pronunciation: phoneticScore.pronunciation / 100,
      phoneticMemorability: phoneticScore.memorability / 100,
      
      // New semantic dimensions
      semanticCoherence,
      emotionalResonance,
      culturalAppeal,
      imageAssociation,
      
      // New musicality dimensions
      rhymeQuality,
      rhythmQuality,
      musicalCoherence,
      vocalDeliverability,
      catchiness: musicCatchiness,
      
      // Cross-dimensional synergy
      phoneticSemanticAlignment,
      genreOptimization,
      marketAppeal,
      musicalSynergy
    };
  }
  
  /**
   * Enhanced creativity calculation incorporating semantic analysis
   */
  private calculateEnhancedCreativity(
    request: EnhancedNameScoringRequest,
    semanticScore: any
  ): number {
    let score = CreativityAnalyzer.getCreativityScore(request.name, request.genre);
    
    // Semantic creativity bonus
    const semanticCreativity = semanticScore.complexity / 100;
    score += semanticCreativity * 0.3;
    
    // Word relationship creativity
    if (semanticScore.coherence > 70) {
      score += 0.1; // Bonus for creative but coherent word combinations
    }
    
    // Genre-specific creativity adjustments
    if (request.genre) {
      score += this.getGenreCreativityBonus(request.name, request.genre, semanticScore);
    }
    
    return ScoringUtils.normalizeScore(score);
  }
  
  /**
   * Enhanced appropriateness with semantic context
   */
  private calculateEnhancedAppropriateness(
    request: EnhancedNameScoringRequest,
    semanticScore: any
  ): number {
    let score = 0.6; // Base score
    
    // Semantic appropriateness
    score += (semanticScore.contextualFit / 100) * 0.3;
    
    // Emotional appropriateness
    score += (semanticScore.emotionalResonance / 100) * 0.2;
    
    // Cultural appropriateness
    score += (semanticScore.culturalAppeal / 100) * 0.2;
    
    // Target audience appropriateness
    if (request.targetAudience) {
      score += this.getAudienceAppropriatenessBonus(semanticScore, request.targetAudience);
    }
    
    return ScoringUtils.normalizeScore(score);
  }
  
  /**
   * Enhanced quality with phonetic integration
   */
  private calculateEnhancedQuality(
    request: EnhancedNameScoringRequest,
    phoneticScore: any
  ): number {
    // Base quality from phonetic analysis
    let score = phoneticScore.pronunciation / 100 * 0.6;
    
    // Add flow quality
    score += phoneticScore.flow / 100 * 0.3;
    
    // Add basic text quality
    const textMetrics = TextAnalyzer.getTextMetrics(request.name);
    if (textMetrics.wordCount >= 2 && textMetrics.wordCount <= 3) {
      score += 0.1; // Optimal word count
    }
    
    return ScoringUtils.normalizeScore(score);
  }
  
  /**
   * Enhanced memorability combining phonetic and semantic factors
   */
  private calculateEnhancedMemorability(
    request: EnhancedNameScoringRequest,
    phoneticScore: any,
    semanticScore: any
  ): number {
    // Phonetic memorability (60% weight)
    const phoneticMemo = phoneticScore.memorability / 100 * 0.6;
    
    // Semantic memorability (40% weight)
    const semanticMemo = (semanticScore.emotionalResonance + semanticScore.imagery) / 200 * 0.4;
    
    let score = phoneticMemo + semanticMemo;
    
    // Synergy bonus for aligned phonetic-semantic memorability
    if (phoneticScore.memorability > 70 && semanticScore.emotionalResonance > 70) {
      score += 0.1;
    }
    
    return ScoringUtils.normalizeScore(score);
  }
  
  /**
   * Enhanced uniqueness with semantic novelty
   */
  private calculateEnhancedUniqueness(
    request: EnhancedNameScoringRequest,
    phoneticScore: any,
    semanticScore: any
  ): number {
    // Phonetic uniqueness (50% weight)
    const phoneticUnique = phoneticScore.uniqueness / 100 * 0.5;
    
    // Semantic uniqueness (50% weight)
    const semanticUnique = semanticScore.complexity / 100 * 0.5;
    
    let score = phoneticUnique + semanticUnique;
    
    // AI-generated penalty reduction if semantic novelty is high
    if (request.isAiGenerated && semanticScore.complexity > 60) {
      score += 0.05; // Reduced penalty for AI names with semantic complexity
    }
    
    return ScoringUtils.normalizeScore(score);
  }
  
  /**
   * Enhanced structure analysis
   */
  private calculateEnhancedStructure(request: EnhancedNameScoringRequest): number {
    const textMetrics = TextAnalyzer.getTextMetrics(request.name);
    let score = 0.7; // Base score
    
    // Optimal word count for type
    const optimalWordCount = request.type === 'band' ? 2 : 3;
    if (textMetrics.wordCount === optimalWordCount) {
      score += 0.2;
    } else if (Math.abs(textMetrics.wordCount - optimalWordCount) === 1) {
      score += 0.1;
    }
    
    // Length appropriateness
    if (textMetrics.characterCount >= 8 && textMetrics.characterCount <= 20) {
      score += 0.1;
    }
    
    return ScoringUtils.normalizeScore(score);
  }
  
  /**
   * Extract cross-dimensional metrics from phonetic-semantic analysis
   */
  private extractCrossDimensionalMetrics(phoneticSemanticAnalysis: any): CrossDimensionalMetrics {
    return {
      phonetic: {
        overall: phoneticSemanticAnalysis.phoneticAnalysis.overall,
        pronunciation: phoneticSemanticAnalysis.phoneticAnalysis.pronunciation,
        flow: phoneticSemanticAnalysis.phoneticAnalysis.flow,
        memorability: phoneticSemanticAnalysis.phoneticAnalysis.memorability,
        uniqueness: phoneticSemanticAnalysis.phoneticAnalysis.uniqueness
      },
      semantic: {
        overall: phoneticSemanticAnalysis.semanticAnalysis.score.overall,
        coherence: phoneticSemanticAnalysis.semanticAnalysis.score.coherence,
        emotionalResonance: phoneticSemanticAnalysis.semanticAnalysis.score.emotionalResonance,
        culturalAppeal: phoneticSemanticAnalysis.semanticAnalysis.score.culturalAppeal,
        contextualFit: phoneticSemanticAnalysis.semanticAnalysis.score.contextualFit,
        imagery: phoneticSemanticAnalysis.semanticAnalysis.score.imagery
      },
      synergy: {
        phoneticSemanticAlignment: phoneticSemanticAnalysis.score.synergy.phoneticSemanticAlignment,
        crossDimensionalHarmony: phoneticSemanticAnalysis.score.synergy.crossDimensionalHarmony,
        genreOptimization: phoneticSemanticAnalysis.score.synergy.genreOptimization,
        marketSynergy: phoneticSemanticAnalysis.combinedMetrics.marketAppealIndex
      }
    };
  }
  
  /**
   * Generate quality vector for multi-dimensional comparison
   */
  private generateQualityVector(
    breakdown: EnhancedScoreBreakdown,
    crossDimensional: CrossDimensionalMetrics
  ): QualityVector {
    // Aggregate dimensions
    const sound = (breakdown.phoneticFlow + breakdown.pronunciation + breakdown.phoneticMemorability) / 3;
    const meaning = (breakdown.semanticCoherence + breakdown.emotionalResonance + breakdown.culturalAppeal) / 3;
    const creativity = breakdown.creativity;
    const appeal = (breakdown.marketAppeal + breakdown.culturalAppeal) / 2;
    const fit = (breakdown.appropriateness + breakdown.genreOptimization) / 2;
    
    const dimensions = { sound, meaning, creativity, appeal, fit };
    
    // Calculate magnitude (overall quality strength)
    const magnitude = Math.sqrt(
      Math.pow(sound, 2) + Math.pow(meaning, 2) + Math.pow(creativity, 2) + 
      Math.pow(appeal, 2) + Math.pow(fit, 2)
    ) / Math.sqrt(5); // Normalize by number of dimensions
    
    // Calculate balance (how evenly distributed quality is)
    const values = Object.values(dimensions);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const balance = Math.max(0, 1 - Math.sqrt(variance));
    
    // Calculate distinctiveness (how unique this quality profile is)
    const distinctiveness = this.calculateDistinctiveness(dimensions);
    
    return {
      dimensions,
      magnitude,
      balance,
      distinctiveness
    };
  }
  
  /**
   * Calculate enhanced overall score with weighted dimensions
   */
  private calculateEnhancedOverallScore(
    breakdown: EnhancedScoreBreakdown,
    weights: EnhancedScoringWeights,
    qualityVector: QualityVector
  ): number {
    // Calculate weighted score with ALL enhanced dimensions
    let score = 
      // Traditional dimensions
      breakdown.creativity * weights.creativity +
      breakdown.appropriateness * weights.appropriateness +
      breakdown.quality * weights.quality +
      breakdown.memorability * weights.memorability +
      breakdown.uniqueness * weights.uniqueness +
      breakdown.structure * weights.structure +
      
      // Phonetic dimensions  
      breakdown.phoneticFlow * weights.phoneticFlow +
      
      // Semantic dimensions
      breakdown.semanticCoherence * weights.semanticCoherence +
      breakdown.emotionalResonance * weights.emotionalResonance +
      breakdown.culturalAppeal * weights.culturalAppeal +
      
      // Musicality dimensions (PREVIOUSLY MISSING!)
      breakdown.rhymeQuality * weights.rhymeQuality +
      breakdown.rhythmQuality * weights.rhythmQuality +
      breakdown.musicalCoherence * weights.musicalCoherence +
      breakdown.vocalDeliverability * weights.vocalDeliverability +
      breakdown.musicalSynergy * weights.musicalSynergy +
      
      // Cross-dimensional synergy
      breakdown.phoneticSemanticAlignment * weights.crossDimensionalSynergy;
    
    // Apply quality vector bonuses
    if (qualityVector.balance > 0.8) {
      score += 0.05; // Bonus for well-balanced quality
    }
    
    if (qualityVector.magnitude > 0.8) {
      score += 0.03; // Bonus for high overall magnitude
    }
    
    if (qualityVector.distinctiveness > 0.7) {
      score += 0.02; // Bonus for distinctive quality profile
    }
    
    return ScoringUtils.normalizeScore(score);
  }
  
  /**
   * Generate quality ranking based on benchmarks and analysis
   */
  private generateQualityRanking(
    score: EnhancedQualityScore,
    request: EnhancedNameScoringRequest
  ): QualityRanking {
    const overall = score.overall;
    
    // Determine rank
    let rank: QualityRanking['rank'];
    let percentile: number;
    
    if (overall >= 0.85) {
      rank = 'excellent';
      percentile = 95;
    } else if (overall >= 0.75) {
      rank = 'good';
      percentile = 80;
    } else if (overall >= 0.60) {
      rank = 'fair';
      percentile = 60;
    } else if (overall >= 0.45) {
      rank = 'poor';
      percentile = 30;
    } else {
      rank = 'unacceptable';
      percentile = 15;
    }
    
    // Identify strength areas
    const strengthAreas: string[] = [];
    if (score.breakdown.pronunciation > 0.8) strengthAreas.push('Excellent pronunciation');
    if (score.breakdown.semanticCoherence > 0.8) strengthAreas.push('Strong semantic coherence');
    if (score.breakdown.emotionalResonance > 0.8) strengthAreas.push('High emotional impact');
    if (score.breakdown.phoneticSemanticAlignment > 0.8) strengthAreas.push('Perfect sound-meaning alignment');
    if (score.qualityVector.balance > 0.8) strengthAreas.push('Well-balanced quality');
    
    // Identify improvement areas
    const improvementAreas: string[] = [];
    if (score.breakdown.pronunciation < 0.6) improvementAreas.push('Improve pronunciation ease');
    if (score.breakdown.semanticCoherence < 0.6) improvementAreas.push('Strengthen word relationships');
    if (score.breakdown.emotionalResonance < 0.6) improvementAreas.push('Enhance emotional impact');
    if (score.breakdown.culturalAppeal < 0.6) improvementAreas.push('Increase cultural appeal');
    
    // Identify competitive advantages
    const competitiveAdvantages: string[] = [];
    if (overall > this.industryBenchmarks.topTier) {
      competitiveAdvantages.push('Superior to industry top tier');
    }
    if (score.qualityVector.distinctiveness > 0.7) {
      competitiveAdvantages.push('Highly distinctive quality profile');
    }
    if (score.breakdown.phoneticSemanticAlignment > 0.75) {
      competitiveAdvantages.push('Exceptional sound-meaning synergy');
    }
    
    // Determine market position
    let marketPosition: QualityRanking['marketPosition'];
    if (overall >= 0.80) {
      marketPosition = 'premium';
    } else if (overall >= 0.65) {
      marketPosition = 'mainstream';
    } else if (overall >= 0.50) {
      marketPosition = 'budget';
    } else {
      marketPosition = 'experimental';
    }
    
    return {
      rank,
      percentile,
      strengthAreas,
      improvementAreas,
      competitiveAdvantages,
      marketPosition
    };
  }
  
  /**
   * Generate improvement suggestions
   */
  private generateImprovementSuggestions(
    breakdown: EnhancedScoreBreakdown,
    crossDimensional: CrossDimensionalMetrics,
    qualityVector: QualityVector,
    request: EnhancedNameScoringRequest
  ): ImprovementSuggestion[] {
    const suggestions: ImprovementSuggestion[] = [];
    
    // Phonetic improvements
    if (breakdown.pronunciation < 0.6) {
      suggestions.push({
        category: 'phonetic',
        priority: 'high',
        suggestion: 'Simplify pronunciation by reducing difficult consonant clusters',
        expectedImpact: 0.15,
        difficulty: 'medium'
      });
    }
    
    if (breakdown.phoneticFlow < 0.6) {
      suggestions.push({
        category: 'phonetic',
        priority: 'medium',
        suggestion: 'Improve word flow by adjusting syllable patterns and transitions',
        expectedImpact: 0.10,
        difficulty: 'medium'
      });
    }
    
    // Semantic improvements
    if (breakdown.semanticCoherence < 0.6) {
      suggestions.push({
        category: 'semantic',
        priority: 'high',
        suggestion: 'Choose words with stronger thematic connections',
        expectedImpact: 0.12,
        difficulty: 'hard'
      });
    }
    
    if (breakdown.emotionalResonance < 0.6) {
      suggestions.push({
        category: 'semantic',
        priority: 'medium',
        suggestion: 'Add words with more emotional impact or relevance',
        expectedImpact: 0.10,
        difficulty: 'medium'
      });
    }
    
    // Cross-dimensional improvements
    if (breakdown.phoneticSemanticAlignment < 0.6) {
      suggestions.push({
        category: 'semantic',
        priority: 'high',
        suggestion: 'Ensure the sound of words matches their meaning and emotional tone',
        expectedImpact: 0.15,
        difficulty: 'hard'
      });
    }
    
    // Contextual improvements
    if (breakdown.genreOptimization < 0.6 && request.genre) {
      suggestions.push({
        category: 'contextual',
        priority: 'medium',
        suggestion: `Optimize for ${request.genre} genre characteristics and audience expectations`,
        expectedImpact: 0.08,
        difficulty: 'medium'
      });
    }
    
    // Creative improvements
    if (breakdown.creativity < 0.6) {
      suggestions.push({
        category: 'creative',
        priority: 'low',
        suggestion: 'Experiment with more creative word combinations or metaphors',
        expectedImpact: 0.08,
        difficulty: 'hard'
      });
    }
    
    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }
  
  /**
   * Helper methods for scoring calculations
   */
  private getContextualWeights(request: EnhancedNameScoringRequest): EnhancedScoringWeights {
    if (!request.genre) return this.enhancedWeights;
    
    const genreConfig = this.advancedConfig.genreSpecific[request.genre];
    if (!genreConfig) return this.enhancedWeights;
    
    return { ...this.enhancedWeights, ...genreConfig.weights };
  }
  
  private getGenreSpecificConfigs() {
    // This would be expanded with full genre configurations
    return {
      rock: {
        weights: {
          phoneticFlow: 0.15,
          emotionalResonance: 0.12,
          memorability: 0.13
        },
        thresholds: {
          phoneticMinimum: 0.50
        },
        bonuses: {
          phoneticPatterns: [
            { pattern: 'hard_consonants', bonus: 0.05 },
            { pattern: 'strong_endings', bonus: 0.03 }
          ],
          semanticKeywords: [
            { keyword: 'fire', bonus: 0.03 },
            { keyword: 'storm', bonus: 0.03 },
            { keyword: 'electric', bonus: 0.02 }
          ],
          emotionalProfiles: [
            { profile: 'high_arousal', bonus: 0.05 }
          ],
          culturalElements: [
            { element: 'rebellion', bonus: 0.02 }
          ]
        },
        penalties: {
          inappropriateWords: [
            { word: 'gentle', penalty: 0.05 },
            { word: 'soft', penalty: 0.03 }
          ],
          conflictingEmotions: [
            { emotion: 'peaceful', penalty: 0.04 }
          ],
          culturalMismatches: [
            { mismatch: 'classical_terminology', penalty: 0.03 }
          ]
        },
        optimization: {
          phoneticTargets: {
            pronunciation: 0.75,
            flow: 0.70,
            memorability: 0.80
          },
          semanticTargets: {
            emotionalValence: 0.2,
            arousal: 0.8,
            culturalRelevance: 0.7
          },
          synergyTargets: {
            alignment: 0.75,
            marketFit: 0.70
          }
        }
      }
      // Additional genre configurations would be added here
    };
  }
  
  private getGenreCreativityBonus(name: string, genre: string, semanticScore: any): number {
    // Genre-specific creativity bonuses based on semantic analysis
    const genreCreativityMap: Record<string, number> = {
      'experimental': 0.1,
      'indie': 0.08,
      'electronic': 0.07,
      'metal': 0.05,
      'rock': 0.03,
      'folk': 0.02,
      'pop': 0.01
    };
    
    return genreCreativityMap[genre] || 0;
  }
  
  private getAudienceAppropriatenessBonus(semanticScore: any, targetAudience: string): number {
    const audienceBonus: Record<string, number> = {
      'mainstream': semanticScore.culturalAppeal > 70 ? 0.1 : -0.05,
      'niche': semanticScore.complexity > 60 ? 0.08 : 0,
      'experimental': semanticScore.complexity > 70 ? 0.12 : 0
    };
    
    return audienceBonus[targetAudience] || 0;
  }
  
  private calculateDistinctiveness(dimensions: any): number {
    // Calculate how distinctive this quality profile is
    // Higher values for unusual combinations of strengths
    const values = Object.values(dimensions) as number[];
    const range = Math.max(...values) - Math.min(...values);
    const variance = values.reduce((sum, val) => {
      const mean = values.reduce((s, v) => s + v, 0) / values.length;
      return sum + Math.pow(val - mean, 2);
    }, 0) / values.length;
    
    return Math.min(1, range * 0.7 + Math.sqrt(variance) * 0.3);
  }
  
  private generateCacheKey(request: EnhancedNameScoringRequest): string {
    return `enhanced_${request.name.toLowerCase()}_${JSON.stringify({
      type: request.type,
      genre: request.genre,
      mood: request.mood,
      targetAudience: request.targetAudience,
      analysisDepth: request.analysisDepth
    })}`;
  }
  
  private calculateQualityConsistency(breakdown: EnhancedScoreBreakdown): number {
    const scores = Object.values(breakdown);
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    return Math.max(0, 1 - Math.sqrt(variance));
  }
  
  private getDimensionsAnalyzed(request: EnhancedNameScoringRequest): string[] {
    const dimensions = [
      'phonetic', 'semantic', 'creative', 'cultural', 'emotional'
    ];
    
    if (request.genre) dimensions.push('genre-specific');
    if (request.targetAudience) dimensions.push('audience-targeted');
    if (request.analysisDepth === 'comprehensive') dimensions.push('cross-dimensional');
    
    return dimensions;
  }
  
  private getAdaptiveAdjustments(request: EnhancedNameScoringRequest, breakdown: EnhancedScoreBreakdown): string[] {
    const adjustments: string[] = [];
    
    if (request.genre && breakdown.genreOptimization < 0.6) {
      adjustments.push(`Genre optimization for ${request.genre}`);
    }
    
    if (request.targetAudience === 'mainstream' && breakdown.culturalAppeal < 0.7) {
      adjustments.push('Mainstream appeal enhancement');
    }
    
    return adjustments;
  }
  
  private generateEnhancedWarnings(
    request: EnhancedNameScoringRequest,
    breakdown: EnhancedScoreBreakdown,
    qualityVector: QualityVector
  ): string[] {
    const warnings: string[] = [];
    
    if (breakdown.phoneticSemanticAlignment < 0.4) {
      warnings.push('Poor alignment between sound and meaning');
    }
    
    if (qualityVector.balance < 0.5) {
      warnings.push('Unbalanced quality across dimensions');
    }
    
    if (breakdown.pronunciation < 0.4) {
      warnings.push('Very difficult pronunciation');
    }
    
    if (breakdown.culturalAppeal < 0.3) {
      warnings.push('Limited cultural appeal');
    }
    
    return warnings;
  }
  
  private calculateEnhancedConfidence(
    request: EnhancedNameScoringRequest,
    breakdown: EnhancedScoreBreakdown,
    qualityVector: QualityVector
  ): number {
    let confidence = 0.7; // Base confidence
    
    // Higher confidence for balanced quality
    confidence += qualityVector.balance * 0.2;
    
    // Higher confidence with genre context
    if (request.genre) confidence += 0.1;
    
    // Lower confidence for very short or very long names
    const nameLength = request.name.length;
    if (nameLength < 4 || nameLength > 25) {
      confidence -= 0.15;
    }
    
    return Math.max(0.3, Math.min(1.0, confidence));
  }
  
  private generateEnhancedRecommendations(
    breakdown: EnhancedScoreBreakdown,
    crossDimensional: CrossDimensionalMetrics,
    qualityRanking: QualityRanking,
    request: EnhancedNameScoringRequest
  ): string[] {
    const recommendations: string[] = [];
    
    // Priority recommendations based on ranking
    if (qualityRanking.rank === 'poor' || qualityRanking.rank === 'unacceptable') {
      recommendations.push('Consider fundamental changes to improve overall quality');
    }
    
    // Dimension-specific recommendations
    if (breakdown.pronunciation < 0.6) {
      recommendations.push('Simplify pronunciation for better accessibility');
    }
    
    if (breakdown.semanticCoherence < 0.6) {
      recommendations.push('Strengthen thematic connections between words');
    }
    
    if (breakdown.phoneticSemanticAlignment < 0.6) {
      recommendations.push('Ensure sound and meaning work together harmoniously');
    }
    
    // Strategic recommendations
    if (qualityRanking.marketPosition === 'experimental' && request.targetAudience === 'mainstream') {
      recommendations.push('Increase mainstream appeal for broader market reach');
    }
    
    return recommendations;
  }
  
  private getDefaultEnhancedResult(request: EnhancedNameScoringRequest): EnhancedNameQualityResult {
    const defaultBreakdown: EnhancedScoreBreakdown = {
      creativity: 0.5, appropriateness: 0.5, quality: 0.5, memorability: 0.5,
      uniqueness: 0.5, structure: 0.5, phoneticFlow: 0.5, pronunciation: 0.5,
      phoneticMemorability: 0.5, semanticCoherence: 0.5, emotionalResonance: 0.5,
      culturalAppeal: 0.5, imageAssociation: 0.5, phoneticSemanticAlignment: 0.5,
      genreOptimization: 0.5, marketAppeal: 0.5
    };
    
    return {
      name: request.name,
      score: {
        overall: 0.5,
        breakdown: defaultBreakdown,
        metadata: {
          scoringTime: 0,
          algorithm: 'enhanced_name_scoring_v2_fallback',
          version: this.algorithmVersion,
          warnings: ['Analysis failed - using fallback scores'],
          confidence: 0.3,
          analysisDepth: 'basic',
          dimensionsAnalyzed: ['basic'],
          crossDimensionalSynergy: 0.5,
          qualityConsistency: 0.5,
          adaptiveAdjustments: []
        },
        crossDimensional: {
          phonetic: { overall: 50, pronunciation: 50, flow: 50, memorability: 50, uniqueness: 50 },
          semantic: { overall: 50, coherence: 50, emotionalResonance: 50, culturalAppeal: 50, contextualFit: 50, imagery: 50 },
          synergy: { phoneticSemanticAlignment: 50, crossDimensionalHarmony: 50, genreOptimization: 50, marketSynergy: 50 }
        },
        qualityVector: {
          dimensions: { sound: 0.5, meaning: 0.5, creativity: 0.5, appeal: 0.5, fit: 0.5 },
          magnitude: 0.5,
          balance: 0.5,
          distinctiveness: 0.5
        }
      },
      passesThreshold: false,
      recommendations: ['Unable to generate recommendations due to analysis error'],
      qualityRanking: {
        rank: 'fair',
        percentile: 50,
        strengthAreas: [],
        improvementAreas: ['Complete analysis to identify areas for improvement'],
        competitiveAdvantages: [],
        marketPosition: 'experimental'
      },
      improvementSuggestions: []
    };
  }
  
  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cache.getStats();
  }
  
  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const enhancedNameScoringEngine = new EnhancedNameScoringEngine();