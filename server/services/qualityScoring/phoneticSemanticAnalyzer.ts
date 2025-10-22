/**
 * Phonetic-Semantic Analyzer for Advanced Quality Scoring
 * Combines phonetic flow analysis with semantic meaning for superior name quality assessment
 */

import { phoneticFlowAnalyzer } from '../nameGeneration/phoneticFlowAnalyzer';
import { semanticAnalyzer, type SemanticAnalysis } from './semanticAnalyzer';
import { secureLog } from '../../utils/secureLogger';
import { CacheService } from '../cacheService';

export interface PhoneticSemanticScore {
  overall: number;              // 0-100 combined quality score
  phonetic: {
    pronunciation: number;      // Ease of pronunciation (0-100)
    flow: number;              // Phonetic flow between words (0-100)
    memorability: number;      // Phonetic memorability (0-100)
    uniqueness: number;        // Phonetic uniqueness (0-100)
  };
  semantic: {
    coherence: number;         // Semantic coherence (0-100)
    emotionalResonance: number; // Emotional impact (0-100)
    culturalAppeal: number;    // Cultural appropriateness (0-100)
    contextualFit: number;     // Genre/mood fit (0-100)
    imagery: number;           // Visual imagery strength (0-100)
  };
  synergy: {
    phoneticSemanticAlignment: number; // How well sound matches meaning (0-100)
    crossDimensionalHarmony: number;   // Overall harmony between dimensions (0-100)
    genreOptimization: number;         // Genre-specific optimization (0-100)
  };
  issues: string[];
  recommendations: string[];
}

export interface PhoneticSemanticAnalysis {
  score: PhoneticSemanticScore;
  phoneticAnalysis: any; // From phoneticFlowAnalyzer
  semanticAnalysis: SemanticAnalysis;
  combinedMetrics: CombinedMetrics;
  qualityRanking: QualityRanking;
}

export interface CombinedMetrics {
  totalQualityScore: number;    // Weighted combination of all factors
  memorabilityIndex: number;    // Combined phonetic + semantic memorability
  appropriatenessIndex: number; // Combined fit for context
  innovationIndex: number;      // Creativity + uniqueness balance
  marketAppealIndex: number;    // Commercial/audience appeal
  dimensionalBalance: number;   // How well balanced across all dimensions
}

export interface QualityRanking {
  rank: 'excellent' | 'good' | 'fair' | 'poor' | 'unacceptable';
  percentile: number;           // Quality percentile (0-100)
  strengthAreas: string[];      // Areas of excellence
  improvementAreas: string[];   // Areas needing improvement
  competitiveAdvantages: string[]; // Unique selling points
}

export interface AnalysisContext {
  genre?: string;
  mood?: string;
  type?: 'band' | 'song';
  targetAudience?: 'mainstream' | 'niche' | 'experimental';
  culturalContext?: string;
  marketRegion?: string;
}

export class PhoneticSemanticAnalyzer {
  private cache: CacheService<PhoneticSemanticAnalysis>;
  
  // Weighting configurations for different contexts
  private readonly contextualWeights = {
    default: {
      phonetic: 0.4,
      semantic: 0.4,
      synergy: 0.2
    },
    rock: {
      phonetic: 0.45, // Pronunciation important for shouting along
      semantic: 0.35,
      synergy: 0.2
    },
    jazz: {
      phonetic: 0.35,
      semantic: 0.45, // Sophistication important
      synergy: 0.2
    },
    electronic: {
      phonetic: 0.3,
      semantic: 0.4,
      synergy: 0.3    // Innovation through combination
    },
    folk: {
      phonetic: 0.4,
      semantic: 0.5,  // Storytelling and meaning key
      synergy: 0.1
    },
    metal: {
      phonetic: 0.5,  // Power and impact crucial
      semantic: 0.3,
      synergy: 0.2
    }
  };
  
  // Quality benchmarks for ranking
  private readonly qualityBenchmarks = {
    excellent: { min: 85, percentile: 95 },
    good: { min: 70, percentile: 80 },
    fair: { min: 55, percentile: 60 },
    poor: { min: 40, percentile: 30 },
    unacceptable: { min: 0, percentile: 15 }
  };
  
  constructor() {
    // Initialize cache with 1 hour TTL and max 2000 entries
    this.cache = new CacheService<PhoneticSemanticAnalysis>(3600, 2000);
  }
  
  /**
   * Perform comprehensive phonetic-semantic analysis
   */
  async analyze(name: string, context?: AnalysisContext): Promise<PhoneticSemanticAnalysis> {
    const cacheKey = `${name.toLowerCase()}_${JSON.stringify(context || {})}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached !== null) {
      secureLog.debug(`PhoneticSemanticAnalyzer cache hit for: ${name}`);
      return cached;
    }
    
    secureLog.debug(`PhoneticSemanticAnalyzer analyzing: ${name}`);
    
    try {
      // Perform parallel analysis
      const [phoneticAnalysis, semanticAnalysis] = await Promise.all([
        this.performPhoneticAnalysis(name),
        this.performSemanticAnalysis(name, context)
      ]);
      
      // Calculate synergy metrics
      const synergyMetrics = this.calculateSynergyMetrics(
        phoneticAnalysis, 
        semanticAnalysis, 
        context
      );
      
      // Generate combined score
      const combinedScore = this.generateCombinedScore(
        phoneticAnalysis,
        semanticAnalysis,
        synergyMetrics,
        context
      );
      
      // Calculate combined metrics
      const combinedMetrics = this.calculateCombinedMetrics(
        phoneticAnalysis,
        semanticAnalysis,
        synergyMetrics,
        context
      );
      
      // Generate quality ranking
      const qualityRanking = this.generateQualityRanking(
        combinedScore,
        combinedMetrics,
        context
      );
      
      // Generate comprehensive recommendations
      const recommendations = this.generateCombinedRecommendations(
        phoneticAnalysis,
        semanticAnalysis,
        synergyMetrics,
        combinedScore,
        context
      );
      
      const analysis: PhoneticSemanticAnalysis = {
        score: {
          ...combinedScore,
          recommendations
        },
        phoneticAnalysis,
        semanticAnalysis,
        combinedMetrics,
        qualityRanking
      };
      
      // Cache the result
      this.cache.set(cacheKey, analysis);
      
      return analysis;
      
    } catch (error) {
      secureLog.error('PhoneticSemanticAnalyzer failed:', error);
      return this.getDefaultAnalysis(name, context);
    }
  }
  
  /**
   * Perform phonetic analysis using existing analyzer
   */
  private async performPhoneticAnalysis(name: string): Promise<any> {
    return phoneticFlowAnalyzer.analyzePhoneticFlow(name);
  }
  
  /**
   * Perform semantic analysis using existing analyzer
   */
  private async performSemanticAnalysis(name: string, context?: AnalysisContext): Promise<SemanticAnalysis> {
    return semanticAnalyzer.analyzeSemantics(name, {
      genre: context?.genre,
      mood: context?.mood,
      type: context?.type
    });
  }
  
  /**
   * Calculate synergy between phonetic and semantic elements
   */
  private calculateSynergyMetrics(
    phoneticAnalysis: any,
    semanticAnalysis: SemanticAnalysis,
    context?: AnalysisContext
  ): any {
    // Phonetic-Semantic Alignment: How well sound matches meaning
    const alignment = this.calculatePhoneticSemanticAlignment(
      phoneticAnalysis,
      semanticAnalysis
    );
    
    // Cross-dimensional Harmony: Overall coherence
    const harmony = this.calculateCrossDimensionalHarmony(
      phoneticAnalysis,
      semanticAnalysis
    );
    
    // Genre Optimization: How well optimized for the specific genre
    const genreOptimization = this.calculateGenreOptimization(
      phoneticAnalysis,
      semanticAnalysis,
      context
    );
    
    return {
      phoneticSemanticAlignment: alignment,
      crossDimensionalHarmony: harmony,
      genreOptimization: genreOptimization,
      synergyScore: (alignment + harmony + genreOptimization) / 3
    };
  }
  
  /**
   * Calculate how well phonetic qualities match semantic meaning
   */
  private calculatePhoneticSemanticAlignment(
    phoneticAnalysis: any,
    semanticAnalysis: SemanticAnalysis
  ): number {
    let alignmentScore = 50; // Base score
    
    // High arousal emotions should have dynamic phonetics
    if (semanticAnalysis.emotionalProfile.arousal > 0.7) {
      if (phoneticAnalysis.flow > 70 && phoneticAnalysis.uniqueness > 60) {
        alignmentScore += 20;
      } else {
        alignmentScore -= 10;
      }
    }
    
    // Positive emotions should have pleasant phonetics
    if (semanticAnalysis.emotionalProfile.valence > 0.5) {
      if (phoneticAnalysis.pronunciation > 70) {
        alignmentScore += 15;
      }
    }
    
    // Dark/heavy semantic content should have substantial phonetics
    const darkWords = ['dark', 'black', 'death', 'doom', 'shadow'];
    const haseDarkContent = semanticAnalysis.semanticCohesion > 0.6 && 
      semanticAnalysis.emotionalProfile.valence < -0.3;
    
    if (haseDarkContent) {
      if (phoneticAnalysis.memorability > 60) {
        alignmentScore += 15;
      }
    }
    
    // Light/ethereal content should have flowing phonetics
    const lightWords = ['light', 'bright', 'ethereal', 'dream'];
    const hasLightContent = semanticAnalysis.emotionalProfile.valence > 0.3;
    
    if (hasLightContent) {
      if (phoneticAnalysis.flow > 75) {
        alignmentScore += 15;
      }
    }
    
    return Math.max(0, Math.min(100, alignmentScore));
  }
  
  /**
   * Calculate overall harmony between all dimensions
   */
  private calculateCrossDimensionalHarmony(
    phoneticAnalysis: any,
    semanticAnalysis: SemanticAnalysis
  ): number {
    // Both high = excellent
    if (phoneticAnalysis.overall > 75 && semanticAnalysis.score.overall > 75) {
      return 90;
    }
    
    // Both moderate = good balance
    if (phoneticAnalysis.overall > 50 && semanticAnalysis.score.overall > 50) {
      return 70;
    }
    
    // One very high, one low = imbalanced
    const phoneticNorm = phoneticAnalysis.overall;
    const semanticNorm = semanticAnalysis.score.overall;
    const difference = Math.abs(phoneticNorm - semanticNorm);
    
    if (difference > 30) {
      return 40; // Poor harmony
    } else if (difference > 15) {
      return 60; // Moderate harmony
    } else {
      return 80; // Good harmony
    }
  }
  
  /**
   * Calculate genre-specific optimization
   */
  private calculateGenreOptimization(
    phoneticAnalysis: any,
    semanticAnalysis: SemanticAnalysis,
    context?: AnalysisContext
  ): number {
    if (!context?.genre) return 60; // Neutral if no genre specified
    
    const genreOptimizations: Record<string, (p: any, s: SemanticAnalysis) => number> = {
      'rock': (p, s) => {
        let score = 50;
        if (p.pronunciation > 70) score += 15; // Easy to shout along
        if (s.emotionalProfile.arousal > 0.6) score += 15; // High energy
        if (s.score.emotionalResonance > 60) score += 10; // Strong emotions
        return score;
      },
      
      'jazz': (p, s) => {
        let score = 50;
        if (p.flow > 75) score += 15; // Smooth flow
        if (s.score.complexity > 60) score += 15; // Sophistication
        if (s.emotionalProfile.valence > 0) score += 10; // Generally positive
        return score;
      },
      
      'metal': (p, s) => {
        let score = 50;
        if (p.memorability > 70) score += 15; // Powerful impact
        if (s.emotionalProfile.dominance > 0.6) score += 15; // Strong/aggressive
        if (p.uniqueness > 60) score += 10; // Distinctive sound
        return score;
      },
      
      'electronic': (p, s) => {
        let score = 50;
        if (p.uniqueness > 70) score += 15; // Innovative sounds
        if (s.score.culturalAppeal > 60) score += 10; // Modern appeal
        if (s.imageAssociations.length > 0) score += 15; // Visual imagery
        return score;
      },
      
      'folk': (p, s) => {
        let score = 50;
        if (p.pronunciation > 80) score += 15; // Easy to sing along
        if (s.score.coherence > 70) score += 15; // Clear storytelling
        if (s.emotionalProfile.emotionalCoherence > 0.7) score += 10; // Consistent emotion
        return score;
      }
    };
    
    const optimizer = genreOptimizations[context.genre];
    return optimizer ? optimizer(phoneticAnalysis, semanticAnalysis) : 60;
  }
  
  /**
   * Generate combined quality score
   */
  private generateCombinedScore(
    phoneticAnalysis: any,
    semanticAnalysis: SemanticAnalysis,
    synergyMetrics: any,
    context?: AnalysisContext
  ): PhoneticSemanticScore {
    // Get contextual weights
    const weights = this.getContextualWeights(context?.genre);
    
    // Calculate weighted overall score
    const overall = Math.round(
      (phoneticAnalysis.overall * weights.phonetic) +
      (semanticAnalysis.score.overall * weights.semantic) +
      (synergyMetrics.synergyScore * weights.synergy)
    );
    
    // Combine issues from both analyses
    const issues = [
      ...(phoneticAnalysis.issues || []),
      ...(semanticAnalysis.score.issues || [])
    ];
    
    return {
      overall: Math.max(0, Math.min(100, overall)),
      phonetic: {
        pronunciation: phoneticAnalysis.pronunciation,
        flow: phoneticAnalysis.flow,
        memorability: phoneticAnalysis.memorability,
        uniqueness: phoneticAnalysis.uniqueness
      },
      semantic: {
        coherence: semanticAnalysis.score.coherence,
        emotionalResonance: semanticAnalysis.score.emotionalResonance,
        culturalAppeal: semanticAnalysis.score.culturalAppeal,
        contextualFit: semanticAnalysis.score.contextualFit,
        imagery: semanticAnalysis.score.imagery
      },
      synergy: {
        phoneticSemanticAlignment: synergyMetrics.phoneticSemanticAlignment,
        crossDimensionalHarmony: synergyMetrics.crossDimensionalHarmony,
        genreOptimization: synergyMetrics.genreOptimization
      },
      issues,
      recommendations: [] // Will be populated by generateCombinedRecommendations
    };
  }
  
  /**
   * Calculate combined metrics for holistic evaluation
   */
  private calculateCombinedMetrics(
    phoneticAnalysis: any,
    semanticAnalysis: SemanticAnalysis,
    synergyMetrics: any,
    context?: AnalysisContext
  ): CombinedMetrics {
    // Total Quality Score (weighted combination)
    const weights = this.getContextualWeights(context?.genre);
    const totalQualityScore = 
      (phoneticAnalysis.overall * weights.phonetic) +
      (semanticAnalysis.score.overall * weights.semantic) +
      (synergyMetrics.synergyScore * weights.synergy);
    
    // Memorability Index (phonetic + semantic memorability)
    const memorabilityIndex = 
      (phoneticAnalysis.memorability * 0.6) +
      (semanticAnalysis.score.emotionalResonance * 0.4);
    
    // Appropriateness Index (context fit)
    const appropriatenessIndex = 
      (semanticAnalysis.score.contextualFit * 0.7) +
      (synergyMetrics.genreOptimization * 0.3);
    
    // Innovation Index (creativity + uniqueness)
    const innovationIndex = 
      (phoneticAnalysis.uniqueness * 0.5) +
      (semanticAnalysis.score.complexity * 0.5);
    
    // Market Appeal Index (cultural appeal + memorability)
    const marketAppealIndex = 
      (semanticAnalysis.score.culturalAppeal * 0.6) +
      (memorabilityIndex * 0.4);
    
    // Dimensional Balance (how well-rounded the name is)
    const phoneticStdDev = this.calculateStandardDeviation([
      phoneticAnalysis.pronunciation,
      phoneticAnalysis.flow,
      phoneticAnalysis.memorability,
      phoneticAnalysis.uniqueness
    ]);
    
    const semanticStdDev = this.calculateStandardDeviation([
      semanticAnalysis.score.coherence,
      semanticAnalysis.score.emotionalResonance,
      semanticAnalysis.score.culturalAppeal,
      semanticAnalysis.score.contextualFit,
      semanticAnalysis.score.imagery
    ]);
    
    const avgStdDev = (phoneticStdDev + semanticStdDev) / 2;
    const dimensionalBalance = Math.max(0, 100 - (avgStdDev * 2)); // Lower std dev = better balance
    
    return {
      totalQualityScore: Math.round(totalQualityScore),
      memorabilityIndex: Math.round(memorabilityIndex),
      appropriatenessIndex: Math.round(appropriatenessIndex),
      innovationIndex: Math.round(innovationIndex),
      marketAppealIndex: Math.round(marketAppealIndex),
      dimensionalBalance: Math.round(dimensionalBalance)
    };
  }
  
  /**
   * Generate quality ranking based on benchmarks
   */
  private generateQualityRanking(
    score: PhoneticSemanticScore,
    metrics: CombinedMetrics,
    context?: AnalysisContext
  ): QualityRanking {
    // Determine rank based on overall score
    let rank: QualityRanking['rank'] = 'unacceptable';
    let percentile = 0;
    
    for (const [rankName, benchmark] of Object.entries(this.qualityBenchmarks)) {
      if (score.overall >= benchmark.min) {
        rank = rankName as QualityRanking['rank'];
        percentile = benchmark.percentile;
        break;
      }
    }
    
    // Identify strength areas (scores > 75)
    const strengthAreas: string[] = [];
    if (score.phonetic.pronunciation > 75) strengthAreas.push('Excellent pronunciation');
    if (score.phonetic.flow > 75) strengthAreas.push('Smooth phonetic flow');
    if (score.semantic.coherence > 75) strengthAreas.push('Strong semantic coherence');
    if (score.semantic.emotionalResonance > 75) strengthAreas.push('High emotional impact');
    if (score.synergy.phoneticSemanticAlignment > 75) strengthAreas.push('Perfect sound-meaning match');
    if (metrics.memorabilityIndex > 75) strengthAreas.push('Highly memorable');
    if (metrics.innovationIndex > 75) strengthAreas.push('Creative and unique');
    
    // Identify improvement areas (scores < 60)
    const improvementAreas: string[] = [];
    if (score.phonetic.pronunciation < 60) improvementAreas.push('Improve pronunciation ease');
    if (score.semantic.coherence < 60) improvementAreas.push('Strengthen word relationships');
    if (score.semantic.emotionalResonance < 60) improvementAreas.push('Enhance emotional impact');
    if (score.synergy.crossDimensionalHarmony < 60) improvementAreas.push('Better balance between sound and meaning');
    if (metrics.appropriatenessIndex < 60) improvementAreas.push('Better genre/context fit');
    
    // Identify competitive advantages
    const competitiveAdvantages: string[] = [];
    if (metrics.totalQualityScore > 80) competitiveAdvantages.push('Superior overall quality');
    if (metrics.dimensionalBalance > 75) competitiveAdvantages.push('Well-balanced across all dimensions');
    if (score.synergy.phoneticSemanticAlignment > 70) competitiveAdvantages.push('Exceptional sound-meaning synergy');
    if (metrics.marketAppealIndex > 75) competitiveAdvantages.push('Strong commercial appeal');
    
    return {
      rank,
      percentile,
      strengthAreas,
      improvementAreas,
      competitiveAdvantages
    };
  }
  
  /**
   * Generate comprehensive recommendations
   */
  private generateCombinedRecommendations(
    phoneticAnalysis: any,
    semanticAnalysis: SemanticAnalysis,
    synergyMetrics: any,
    score: PhoneticSemanticScore,
    context?: AnalysisContext
  ): string[] {
    const recommendations: string[] = [];
    
    // Phonetic recommendations
    if (score.phonetic.pronunciation < 60) {
      recommendations.push('Simplify pronunciation by reducing consonant clusters');
    }
    if (score.phonetic.flow < 60) {
      recommendations.push('Improve word flow by adjusting syllable patterns');
    }
    
    // Semantic recommendations
    if (score.semantic.coherence < 60) {
      recommendations.push('Choose words with stronger thematic connections');
    }
    if (score.semantic.emotionalResonance < 60) {
      recommendations.push('Add words with more emotional impact');
    }
    
    // Synergy recommendations
    if (score.synergy.phoneticSemanticAlignment < 60) {
      recommendations.push('Ensure the sound of words matches their meaning');
    }
    if (score.synergy.genreOptimization < 60 && context?.genre) {
      recommendations.push(`Optimize for ${context.genre} genre characteristics`);
    }
    
    // Context-specific recommendations
    if (context?.targetAudience === 'mainstream' && score.semantic.culturalAppeal < 70) {
      recommendations.push('Choose words with broader mainstream appeal');
    }
    if (context?.targetAudience === 'experimental' && score.phonetic.uniqueness < 70) {
      recommendations.push('Experiment with more unique sound combinations');
    }
    
    return recommendations;
  }
  
  /**
   * Get contextual weights based on genre
   */
  private getContextualWeights(genre?: string) {
    return this.contextualWeights[genre as keyof typeof this.contextualWeights] || 
           this.contextualWeights.default;
  }
  
  /**
   * Calculate standard deviation for balance assessment
   */
  private calculateStandardDeviation(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.sqrt(avgSquaredDiff);
  }
  
  /**
   * Return default analysis for error cases
   */
  private getDefaultAnalysis(name: string, context?: AnalysisContext): PhoneticSemanticAnalysis {
    const defaultScore: PhoneticSemanticScore = {
      overall: 50,
      phonetic: { pronunciation: 50, flow: 50, memorability: 50, uniqueness: 50 },
      semantic: { coherence: 50, emotionalResonance: 50, culturalAppeal: 50, contextualFit: 50, imagery: 50 },
      synergy: { phoneticSemanticAlignment: 50, crossDimensionalHarmony: 50, genreOptimization: 50 },
      issues: ['Analysis incomplete due to error'],
      recommendations: ['Unable to generate recommendations due to analysis error']
    };
    
    return {
      score: defaultScore,
      phoneticAnalysis: { overall: 50, pronunciation: 50, flow: 50, memorability: 50, uniqueness: 50, issues: [] },
      semanticAnalysis: semanticAnalyzer['getDefaultAnalysis'](name),
      combinedMetrics: {
        totalQualityScore: 50,
        memorabilityIndex: 50,
        appropriatenessIndex: 50,
        innovationIndex: 50,
        marketAppealIndex: 50,
        dimensionalBalance: 50
      },
      qualityRanking: {
        rank: 'fair',
        percentile: 50,
        strengthAreas: [],
        improvementAreas: ['Complete analysis to identify areas for improvement'],
        competitiveAdvantages: []
      }
    };
  }
  
  /**
   * Batch analyze multiple names for comparison
   */
  async batchAnalyze(
    names: string[], 
    context?: AnalysisContext
  ): Promise<PhoneticSemanticAnalysis[]> {
    const analyses = await Promise.all(
      names.map(name => this.analyze(name, context))
    );
    
    // Sort by overall score descending
    return analyses.sort((a, b) => b.score.overall - a.score.overall);
  }
  
  /**
   * Compare two names directly
   */
  async compare(
    name1: string, 
    name2: string, 
    context?: AnalysisContext
  ): Promise<{
    name1Analysis: PhoneticSemanticAnalysis;
    name2Analysis: PhoneticSemanticAnalysis;
    comparison: {
      winner: string;
      winnerAdvantages: string[];
      closeAreas: string[];
      significantDifferences: string[];
    };
  }> {
    const [analysis1, analysis2] = await Promise.all([
      this.analyze(name1, context),
      this.analyze(name2, context)
    ]);
    
    const score1 = analysis1.score.overall;
    const score2 = analysis2.score.overall;
    const winner = score1 > score2 ? name1 : name2;
    const winnerAnalysis = score1 > score2 ? analysis1 : analysis2;
    const loserAnalysis = score1 > score2 ? analysis2 : analysis1;
    
    const winnerAdvantages = winnerAnalysis.qualityRanking.strengthAreas;
    const closeAreas: string[] = [];
    const significantDifferences: string[] = [];
    
    // Identify close areas (< 10 point difference)
    const scoreDiff = Math.abs(score1 - score2);
    if (scoreDiff < 10) {
      closeAreas.push('Overall quality scores are very close');
    } else {
      significantDifferences.push(`${winner} has significantly higher overall quality (+${scoreDiff} points)`);
    }
    
    return {
      name1Analysis: analysis1,
      name2Analysis: analysis2,
      comparison: {
        winner,
        winnerAdvantages,
        closeAreas,
        significantDifferences
      }
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
export const phoneticSemanticAnalyzer = new PhoneticSemanticAnalyzer();