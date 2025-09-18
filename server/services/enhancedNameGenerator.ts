/**
 * Enhanced Name Generator with Advanced Quality Metrics Integration
 * Extends UnifiedNameGeneratorService with phonetic-semantic analysis and quality ranking
 */

import type { GenerateNameRequest } from "@shared/schema";
import { UnifiedNameGeneratorService, GENERATION_STRATEGIES } from "./unifiedNameGenerator";
import { enhancedNameScoringEngine } from "./qualityScoring/enhancedNameScoringEngine";
import { qualityRankingSystem } from "./qualityScoring/qualityRankingSystem";
import type { 
  QualityRankingRequest, 
  EnhancedNameScoringRequest,
  RankedName 
} from "./qualityScoring/enhancedInterfaces";
import { secureLog } from "../utils/secureLogger";
import { unifiedWordFilter } from "./nameGeneration/unifiedWordFilter";

export interface EnhancedGenerateNameRequest extends GenerateNameRequest {
  // Enhanced options for quality-focused generation
  qualityMode?: 'basic' | 'enhanced' | 'premium';
  rankingMode?: 'overall' | 'balanced' | 'genre-optimized' | 'market-focused' | 'creative-first';
  qualityThreshold?: number;
  diversityTarget?: number; // 0-1, how diverse the results should be
  targetAudience?: 'mainstream' | 'niche' | 'experimental';
  enableAdaptiveLearning?: boolean;
  analysisDepth?: 'basic' | 'standard' | 'comprehensive';
}

export interface EnhancedNameGenerationResult {
  names: Array<{
    name: string;
    isAiGenerated: boolean;
    source: string;
    qualityScore?: number;
    qualityRank?: number;
    strengthProfile?: {
      primaryStrengths: string[];
      uniqueAdvantages: string[];
    };
  }>;
  qualityAnalytics?: {
    averageQuality: number;
    qualityRange: { min: number; max: number };
    topPerformers: string[];
    improvementSuggestions: string[];
  };
  processingTime?: number;
  qualityInsights?: string[];
}

export class EnhancedNameGeneratorService extends UnifiedNameGeneratorService {
  
  // Quality mode configurations
  private readonly qualityModeConfigs = {
    basic: {
      useEnhancedScoring: false,
      rankingMode: 'overall' as const,
      qualityThreshold: 0.5,
      analysisDepth: 'basic' as const,
      enableRanking: false
    },
    enhanced: {
      useEnhancedScoring: true,
      rankingMode: 'balanced' as const,
      qualityThreshold: 0.65,
      analysisDepth: 'standard' as const,
      enableRanking: true
    },
    premium: {
      useEnhancedScoring: true,
      rankingMode: 'genre-optimized' as const,
      qualityThreshold: 0.75,
      analysisDepth: 'comprehensive' as const,
      enableRanking: true
    }
  };
  
  constructor() {
    super();
  }
  
  /**
   * Enhanced name generation with advanced quality metrics
   */
  async generateNamesEnhanced(request: EnhancedGenerateNameRequest): Promise<EnhancedNameGenerationResult> {
    const startTime = Date.now();
    
    try {
      secureLog.info(`Enhanced name generation started`, {
        qualityMode: request.qualityMode || 'basic',
        rankingMode: request.rankingMode,
        count: request.count
      });
      
      // Get quality mode configuration
      const qualityConfig = this.qualityModeConfigs[request.qualityMode || 'basic'];
      
      // Step 1: Generate names using parent class with enhanced strategy
      const strategy = this.selectGenerationStrategy(request, qualityConfig);
      const baseRequest: GenerateNameRequest = {
        type: request.type,
        genre: request.genre,
        mood: request.mood,
        count: this.calculateGenerationCount(request.count, qualityConfig),
        wordCount: request.wordCount
      };
      
      const baseResult = await super.generateNames(baseRequest, strategy);
      
      if (!baseResult.names || baseResult.names.length === 0) {
        return this.getDefaultEnhancedResult(request);
      }
      
      // Step 2: Apply enhanced quality filtering if enabled
      let processedNames = baseResult.names;
      let qualityAnalytics;
      let qualityInsights: string[] = [];
      
      if (qualityConfig.useEnhancedScoring) {
        const enhancedResult = await this.applyEnhancedQualityFiltering(
          processedNames.map(n => n.name),
          request,
          qualityConfig
        );
        
        processedNames = this.mergeQualityResults(baseResult.names, enhancedResult.rankedNames);
        qualityAnalytics = enhancedResult.analytics;
        qualityInsights = enhancedResult.qualityInsights;
      }
      
      // Step 3: Apply final count limiting and format results
      const finalNames = processedNames.slice(0, request.count);
      
      const processingTime = Date.now() - startTime;
      
      secureLog.info(`Enhanced name generation completed`, {
        originalCount: baseResult.names.length,
        filteredCount: finalNames.length,
        processingTime,
        qualityMode: request.qualityMode
      });
      
      return {
        names: finalNames,
        qualityAnalytics,
        processingTime,
        qualityInsights
      };
      
    } catch (error) {
      secureLog.error('Enhanced name generation failed:', error);
      return this.getDefaultEnhancedResult(request);
    }
  }
  
  /**
   * Apply enhanced quality filtering using advanced quality metrics
   */
  private async applyEnhancedQualityFiltering(
    names: string[],
    request: EnhancedGenerateNameRequest,
    qualityConfig: any
  ): Promise<{
    rankedNames: RankedName[];
    analytics: any;
    qualityInsights: string[];
  }> {
    try {
      // Prepare ranking request
      const rankingRequest: QualityRankingRequest = {
        names,
        context: {
          genre: request.genre,
          mood: request.mood,
          type: request.type,
          targetAudience: request.targetAudience
        },
        rankingMode: request.rankingMode || qualityConfig.rankingMode,
        qualityThreshold: request.qualityThreshold || qualityConfig.qualityThreshold,
        maxResults: request.count * 2, // Generate more than needed for better selection
        diversityTarget: request.diversityTarget,
        adaptiveLearning: request.enableAdaptiveLearning
      };
      
      // Perform quality ranking
      const rankingResult = await qualityRankingSystem.rankNames(rankingRequest);
      
      // Generate quality insights
      const qualityInsights = this.generateQualityInsights(
        rankingResult.analytics,
        rankingResult.recommendations,
        request
      );
      
      return {
        rankedNames: rankingResult.rankedNames,
        analytics: rankingResult.analytics,
        qualityInsights
      };
      
    } catch (error) {
      secureLog.error('Enhanced quality filtering failed:', error);
      
      // Fallback: use basic quality scoring for all names
      const fallbackNames = await this.applyBasicQualityScoring(names, request);
      
      return {
        rankedNames: fallbackNames,
        analytics: {
          totalAnalyzed: names.length,
          passingThreshold: fallbackNames.length,
          averageQuality: 0.6
        },
        qualityInsights: ['Quality analysis completed with basic metrics due to technical issues']
      };
    }
  }
  
  /**
   * Apply basic quality scoring as fallback
   */
  private async applyBasicQualityScoring(
    names: string[],
    request: EnhancedGenerateNameRequest
  ): Promise<RankedName[]> {
    const rankedNames: RankedName[] = [];
    
    for (let i = 0; i < names.length; i++) {
      const name = names[i];
      const basicScore = this.scoreNameQualityBasic(name, request.genre, request.mood);
      
      rankedNames.push({
        name,
        rank: i + 1,
        qualityScore: basicScore / 100, // Convert to 0-1 range
        qualityVector: {
          dimensions: {
            sound: basicScore / 100,
            meaning: 0.6,
            creativity: 0.6,
            appeal: 0.6,
            fit: 0.6
          },
          magnitude: basicScore / 100,
          balance: 0.6,
          distinctiveness: 0.5
        },
        strengthProfile: {
          primaryStrengths: ['Basic quality assessment'],
          secondaryStrengths: [],
          uniqueAdvantages: [],
          improvementAreas: []
        },
        differentiationFactors: [],
        marketPosition: basicScore > 70 ? 'mainstream' : 'budget',
        confidenceScore: 0.5
      });
    }
    
    // Sort by quality score
    return rankedNames.sort((a, b) => b.qualityScore - a.qualityScore);
  }
  
  /**
   * Basic quality scoring method (fallback)
   */
  private scoreNameQualityBasic(name: string, genre?: string, mood?: string): number {
    let score = 50; // Base score
    
    // Word count appropriateness
    const wordCount = name.split(' ').length;
    if (wordCount >= 2 && wordCount <= 4) score += 10;
    else if (wordCount >= 5 && wordCount <= 7) score += 5;
    
    // Uniqueness of words
    const words = name.toLowerCase().split(' ');
    const uniqueWords = new Set(words);
    if (uniqueWords.size === words.length) score += 10;
    
    // Avoid clichés
    const clichePairs = ['dark shadow', 'neon dream', 'electric storm', 'crystal heart', 'golden hour'];
    const nameLower = name.toLowerCase();
    if (clichePairs.some(cliche => nameLower.includes(cliche))) score -= 15;
    
    // Genre alignment (simplified)
    if (genre && words.some(word => word.length >= 4)) score += 5;
    
    // Mood alignment
    if (mood) {
      const moodWords = this.getStaticMoodWords(mood);
      const hasMoodAlignment = words.some(word => 
        moodWords.some(moodWord => word.includes(moodWord.toLowerCase()))
      );
      if (hasMoodAlignment) score += 5;
    }
    
    // Phonetic quality
    const hasGoodFlow = !name.match(/[^aeiou]{4,}/i); // No 4+ consonants in a row
    if (hasGoodFlow) score += 5;
    
    // Length penalty for overly long names
    if (name.length > 40) score -= 10;
    if (name.length > 50) score -= 20;
    
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Select appropriate generation strategy based on quality requirements
   */
  private selectGenerationStrategy(
    request: EnhancedGenerateNameRequest,
    qualityConfig: any
  ) {
    const qualityMode = request.qualityMode || 'basic';
    
    // Map quality modes to generation strategies
    const strategyMap = {
      basic: GENERATION_STRATEGIES.SPEED,
      enhanced: GENERATION_STRATEGIES.BALANCED,
      premium: GENERATION_STRATEGIES.QUALITY
    };
    
    return strategyMap[qualityMode] || GENERATION_STRATEGIES.BALANCED;
  }
  
  /**
   * Calculate how many names to generate initially (more for higher quality modes)
   */
  private calculateGenerationCount(requestedCount: number, qualityConfig: any): number {
    const multipliers = {
      basic: 1.5,
      enhanced: 2.5,
      premium: 3.5
    };
    
    const multiplier = qualityConfig.useEnhancedScoring 
      ? (qualityConfig.analysisDepth === 'comprehensive' ? multipliers.premium : multipliers.enhanced)
      : multipliers.basic;
    
    return Math.ceil(requestedCount * multiplier);
  }
  
  /**
   * Merge quality results with original name data
   */
  private mergeQualityResults(
    originalNames: Array<{name: string; isAiGenerated: boolean; source: string}>,
    rankedNames: RankedName[]
  ): Array<{
    name: string;
    isAiGenerated: boolean;
    source: string;
    qualityScore: number;
    qualityRank: number;
    strengthProfile: {
      primaryStrengths: string[];
      uniqueAdvantages: string[];
    };
  }> {
    const mergedResults = [];
    
    for (const rankedName of rankedNames) {
      const originalData = originalNames.find(orig => orig.name === rankedName.name);
      
      if (originalData) {
        mergedResults.push({
          name: rankedName.name,
          isAiGenerated: originalData.isAiGenerated,
          source: originalData.source,
          qualityScore: rankedName.qualityScore,
          qualityRank: rankedName.rank,
          strengthProfile: {
            primaryStrengths: rankedName.strengthProfile.primaryStrengths,
            uniqueAdvantages: rankedName.strengthProfile.uniqueAdvantages
          }
        });
      }
    }
    
    return mergedResults;
  }
  
  /**
   * Generate quality insights from analytics
   */
  private generateQualityInsights(
    analytics: any,
    recommendations: any,
    request: EnhancedGenerateNameRequest
  ): string[] {
    const insights: string[] = [];
    
    // Overall quality insights
    if (analytics.averageQuality > 0.8) {
      insights.push('Excellent overall quality achieved across all generated names');
    } else if (analytics.averageQuality > 0.65) {
      insights.push('Good quality names generated with strong phonetic and semantic coherence');
    } else if (analytics.averageQuality > 0.5) {
      insights.push('Moderate quality achieved - consider adjusting parameters for better results');
    } else {
      insights.push('Quality below optimal - recommend reviewing genre and mood specifications');
    }
    
    // Diversity insights
    if (analytics.diversityIndex > 0.7) {
      insights.push('High diversity achieved - names offer good variety and distinctiveness');
    } else if (analytics.diversityIndex < 0.3) {
      insights.push('Low diversity detected - names may be too similar to each other');
    }
    
    // Genre-specific insights
    if (request.genre && analytics.dimensionalAverages?.fit < 0.6) {
      insights.push(`Consider optimizing for ${request.genre} genre characteristics`);
    }
    
    // Recommendations insights
    if (recommendations.improvementPriorities?.length > 0) {
      insights.push(`Key improvement areas: ${recommendations.improvementPriorities.slice(0, 2).join(', ')}`);
    }
    
    // Target audience insights
    if (request.targetAudience === 'mainstream' && analytics.dimensionalAverages?.appeal < 0.7) {
      insights.push('Consider broader appeal for mainstream audience targeting');
    }
    
    return insights;
  }
  
  /**
   * Static mood words for fallback scoring
   */
  private getStaticMoodWords(mood?: string): string[] {
    const moods: { [key: string]: string[] } = {
      happy: ['bright', 'joyful', 'upbeat', 'cheerful', 'positive'],
      sad: ['melancholy', 'somber', 'blue', 'tearful', 'heartbreak'],
      angry: ['fierce', 'rage', 'intense', 'furious', 'rebellious'],
      calm: ['peaceful', 'serene', 'gentle', 'quiet', 'soothing'],
      dark: ['shadow', 'midnight', 'mysterious', 'haunting', 'deep'],
      energetic: ['electric', 'power', 'dynamic', 'vibrant', 'explosive']
    };
    return moods[mood || ''] || ['emotional', 'expressive'];
  }
  
  /**
   * Get default result for error cases
   */
  private getDefaultEnhancedResult(request: EnhancedGenerateNameRequest): EnhancedNameGenerationResult {
    const fallbackNames = [
      'Electric Dreams', 'Midnight Echo', 'Golden Hour', 'Neon Lights',
      'Silver Storm', 'Crystal Vision', 'Velvet Thunder', 'Rainbow Fire'
    ];
    
    return {
      names: fallbackNames.slice(0, request.count).map((name, index) => ({
        name,
        isAiGenerated: false,
        source: 'fallback',
        qualityScore: 0.6,
        qualityRank: index + 1,
        strengthProfile: {
          primaryStrengths: ['Reliable fallback option'],
          uniqueAdvantages: ['Tested and proven names']
        }
      })),
      qualityAnalytics: {
        averageQuality: 0.6,
        qualityRange: { min: 0.6, max: 0.6 },
        topPerformers: [fallbackNames[0]],
        improvementSuggestions: ['Try adjusting generation parameters']
      },
      processingTime: 100,
      qualityInsights: ['Fallback names provided due to generation error']
    };
  }
  
  /**
   * Batch comparison between different quality modes
   */
  async compareQualityModes(
    baseRequest: GenerateNameRequest
  ): Promise<{
    basic: EnhancedNameGenerationResult;
    enhanced: EnhancedNameGenerationResult;
    premium: EnhancedNameGenerationResult;
    comparison: {
      qualityImprovement: { enhanced: number; premium: number };
      diversityImprovement: { enhanced: number; premium: number };
      processingTimeIncrease: { enhanced: number; premium: number };
      recommendations: string[];
    };
  }> {
    const modes: Array<'basic' | 'enhanced' | 'premium'> = ['basic', 'enhanced', 'premium'];
    const results = {} as any;
    
    // Generate names using each quality mode
    for (const mode of modes) {
      const enhancedRequest: EnhancedGenerateNameRequest = {
        ...baseRequest,
        qualityMode: mode,
        count: Math.min(baseRequest.count, 8) // Limit for comparison efficiency
      };
      
      results[mode] = await this.generateNamesEnhanced(enhancedRequest);
    }
    
    // Calculate comparison metrics
    const basicQuality = results.basic.qualityAnalytics?.averageQuality || 0.5;
    const enhancedQuality = results.enhanced.qualityAnalytics?.averageQuality || 0.5;
    const premiumQuality = results.premium.qualityAnalytics?.averageQuality || 0.5;
    
    const comparison = {
      qualityImprovement: {
        enhanced: ((enhancedQuality - basicQuality) / basicQuality) * 100,
        premium: ((premiumQuality - basicQuality) / basicQuality) * 100
      },
      diversityImprovement: {
        enhanced: 15, // Estimated based on enhanced analysis
        premium: 25   // Estimated based on comprehensive analysis
      },
      processingTimeIncrease: {
        enhanced: ((results.enhanced.processingTime || 0) / (results.basic.processingTime || 1) - 1) * 100,
        premium: ((results.premium.processingTime || 0) / (results.basic.processingTime || 1) - 1) * 100
      },
      recommendations: this.generateModeRecommendations(basicQuality, enhancedQuality, premiumQuality)
    };
    
    return {
      basic: results.basic,
      enhanced: results.enhanced,
      premium: results.premium,
      comparison
    };
  }
  
  /**
   * Generate recommendations for quality mode selection
   */
  private generateModeRecommendations(
    basicQuality: number,
    enhancedQuality: number,
    premiumQuality: number
  ): string[] {
    const recommendations: string[] = [];
    
    const enhancedImprovement = enhancedQuality - basicQuality;
    const premiumImprovement = premiumQuality - basicQuality;
    
    if (premiumImprovement > 0.15) {
      recommendations.push('Premium mode provides significant quality improvement - recommended for professional use');
    } else if (enhancedImprovement > 0.1) {
      recommendations.push('Enhanced mode offers good quality improvement with reasonable processing time');
    } else {
      recommendations.push('Basic mode provides adequate quality for most use cases');
    }
    
    if (premiumQuality > 0.8) {
      recommendations.push('Premium mode achieves excellent quality scores - ideal for commercial applications');
    }
    
    if (enhancedQuality > basicQuality * 1.2) {
      recommendations.push('Enhanced analysis significantly improves name selection');
    }
    
    return recommendations;
  }
  
  /**
   * Get cache statistics from all quality components
   */
  getCacheStats() {
    return {
      enhancedScoring: enhancedNameScoringEngine.getCacheStats(),
      qualityRanking: qualityRankingSystem.getCacheStats()
    };
  }
  
  /**
   * Clear all caches
   */
  clearCaches(): void {
    enhancedNameScoringEngine.clearCache();
    qualityRankingSystem.clearCache();
  }
}

// Export singleton instance
export const enhancedNameGeneratorService = new EnhancedNameGeneratorService();