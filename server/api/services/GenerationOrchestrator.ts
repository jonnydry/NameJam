/**
 * Generation Orchestrator
 * Coordinates the complete name generation flow independently from HTTP layer
 */

import type { GenerateNameRequest } from "@shared/schema";
import { secureLog } from "../../utils/secureLogger";
import { UnifiedNameGeneratorService, GENERATION_STRATEGIES } from "../../services/unifiedNameGenerator";
import { qualityRankingSystem } from "../../services/qualityScoring/qualityRankingSystem";
import { parallelVerificationService } from "../../services/parallelVerification";
import { unifiedWordFilter } from "../../services/nameGeneration/unifiedWordFilter";
import { optimizedContextService } from "../../services/optimizedContextService";
import { config } from "../../config";

export interface GenerationContext {
  sessionId: string;
  userPreferences?: any;
  adaptiveStrategy: string;
  contextCacheHit: boolean;
}

export interface GenerationResult {
  names: Array<{
    name: string;
    isAiGenerated: boolean;
    source: string;
    qualityScore?: number;
    qualityRank?: number;
    strengthProfile?: any;
    differentiationFactors?: string[];
    marketPosition?: string;
    confidenceScore?: number;
  }>;
  verification: Array<{
    status: string;
    confidence?: number;
    confidenceLevel?: string;
    explanation?: string;
    details?: string;
    verificationLinks?: string[];
  }>;
  rankingMetadata?: {
    totalAnalyzed: number;
    qualifiedNames: number;
    averageQuality: number;
    qualityRange: { min: number; max: number };
    diversityIndex: number;
    rankingMode: string;
    qualityThreshold: number;
    adaptiveLearning: boolean;
    recommendations: string[];
    qualityDistribution: {
      excellent: number;
      good: number;
      fair: number;
      poor: number;
    };
    dimensionalAverages: any;
  };
  performance: {
    generationTime: number;
    verificationTime: number;
    rankingTime: number;
    totalTime: number;
  };
}

export class GenerationOrchestrator {
  private nameGenerator: UnifiedNameGeneratorService;

  constructor(nameGenerator?: UnifiedNameGeneratorService) {
    this.nameGenerator = nameGenerator || new UnifiedNameGeneratorService();
  }

  async generateNames(
    request: GenerateNameRequest,
    context: GenerationContext
  ): Promise<GenerationResult> {
    const startTime = Date.now();
    let generationTime = 0;
    let verificationTime = 0;
    let rankingTime = 0;

    try {
      secureLog.info(`🎯 Orchestrating generation: ${request.count} ${request.type} names for ${request.genre || 'general'} genre using ${context.adaptiveStrategy} strategy`);

      // Step 1: Generate names
      const generationStart = Date.now();
      const strategy = GENERATION_STRATEGIES[context.adaptiveStrategy as keyof typeof GENERATION_STRATEGIES] || GENERATION_STRATEGIES.BALANCED;
      const generationId = unifiedWordFilter.startNewGeneration(context.sessionId);
      const names = await this.nameGenerator.generateNames(request, strategy);
      generationTime = Date.now() - generationStart;

      if (names.length === 0) {
        throw new Error('No names generated');
      }

      // Step 2: Apply quality ranking (if not SPEED strategy)
      let intelligentlyRankedNames = names;
      let rankingMetadata = null;

      if (context.adaptiveStrategy !== 'SPEED') {
        const rankingStart = Date.now();
        try {
          const rankingResult = await this.applyQualityRanking(names, request, context);
          intelligentlyRankedNames = rankingResult.names;
          rankingMetadata = rankingResult.metadata;
          rankingTime = Date.now() - rankingStart;
        } catch (error) {
          secureLog.error('Quality ranking failed, using basic filtering:', error);
          intelligentlyRankedNames = names.slice(0, request.count);
          rankingTime = Date.now() - rankingStart;
        }
      } else {
        intelligentlyRankedNames = names.slice(0, request.count);
        rankingTime = 0;
      }

      // Step 3: Verify names
      const verificationStart = Date.now();
      const verification = await this.verifyNames(intelligentlyRankedNames.map(n => n.name));
      verificationTime = Date.now() - verificationStart;

      // Step 4: Track names in filter
      intelligentlyRankedNames.forEach(name => {
        unifiedWordFilter.acceptName(name.name, generationId, request.type, context.sessionId);
      });

      const totalTime = Date.now() - startTime;

      return {
        names: intelligentlyRankedNames,
        verification,
        rankingMetadata,
        performance: {
          generationTime,
          verificationTime,
          rankingTime,
          totalTime
        }
      };

    } catch (error) {
      secureLog.error('Generation orchestration failed:', error);
      throw error;
    }
  }

  private async applyQualityRanking(
    names: any[],
    request: GenerateNameRequest,
    context: GenerationContext
  ): Promise<{ names: any[], metadata: any }> {
    const rankingMode = this.determineRankingMode(request, context.userPreferences);
    const qualityThreshold = this.getQualityThreshold(request, context.userPreferences);

    const qualityRankingRequest = {
      names: names.map(n => n.name),
      context: {
        genre: request.genre,
        mood: request.mood,
        type: request.type,
        targetAudience: 'mainstream' as const
      },
      rankingMode: rankingMode as any,
      qualityThreshold,
      maxResults: request.count,
      diversityTarget: 0.7,
      adaptiveLearning: true
    };

    const rankingResult = await qualityRankingSystem.rankNames(qualityRankingRequest);
    const topRankedNames = rankingResult.rankedNames.slice(0, request.count);

    const rankedNames = topRankedNames.map(rankedName => {
      const originalName = names.find(n => n.name === rankedName.name);
      if (!originalName) {
        throw new Error(`Original name not found for ranked name: ${rankedName.name}`);
      }

      return {
        ...originalName,
        qualityScore: rankedName.qualityScore,
        qualityRank: rankedName.rank,
        strengthProfile: rankedName.strengthProfile,
        differentiationFactors: rankedName.differentiationFactors,
        marketPosition: rankedName.marketPosition,
        confidenceScore: rankedName.confidenceScore
      };
    });

    const metadata = {
      totalAnalyzed: rankingResult.analytics.totalAnalyzed,
      qualifiedNames: rankingResult.analytics.passingThreshold,
      averageQuality: rankingResult.analytics.averageQuality,
      qualityRange: rankingResult.analytics.qualityRange,
      diversityIndex: rankingResult.analytics.diversityIndex,
      rankingMode,
      qualityThreshold,
      adaptiveLearning: true,
      recommendations: rankingResult.recommendations,
      qualityDistribution: {
        excellent: rankingResult.qualityDistribution.excellent.length,
        good: rankingResult.qualityDistribution.good.length,
        fair: rankingResult.qualityDistribution.fair.length,
        poor: rankingResult.qualityDistribution.poor.length
      },
      dimensionalAverages: rankingResult.analytics.dimensionalAverages
    };

    return { names: rankedNames, metadata };
  }

  private async verifyNames(names: string[]): Promise<any[]> {
    return await parallelVerificationService.verifyNamesInParallel(names);
  }

  private determineRankingMode(request: any, userPreferences: any): string {
    if (userPreferences?.preferredRankingMode) {
      return userPreferences.preferredRankingMode;
    }

    if (request.genre === 'experimental' || request.genre === 'avant-garde') {
      return 'creative-first';
    }

    if (request.genre === 'pop' || request.genre === 'commercial') {
      return 'market-focused';
    }

    if (request.genre) {
      return 'genre-optimized';
    }

    return 'balanced';
  }

  private getQualityThreshold(request: any, userPreferences: any): number {
    if (userPreferences?.qualityThreshold) {
      const thresholdMapping = {
        'very-high': 0.85,
        'high': 0.75,
        'medium': 0.65,
        'low': 0.55,
        'very-low': 0.45
      };
      return thresholdMapping[userPreferences.qualityThreshold] || 0.65;
    }

    const complexGenres = ['experimental', 'avant-garde', 'progressive', 'fusion'];
    if (request.genre && complexGenres.includes(request.genre)) {
      return 0.6;
    }

    return 0.65;
  }
}
