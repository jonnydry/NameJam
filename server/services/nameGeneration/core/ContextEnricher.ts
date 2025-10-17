/**
 * Context Enricher
 * Handles context gathering and enrichment for name generation
 */

import type { GenerateNameRequest } from "@shared/schema";
import { secureLog } from "../../../utils/secureLogger";
import { optimizedContextService, OptimizedContext } from "../../optimizedContextService";
import { config } from "../../../config";

export interface ContextData {
  genre?: string;
  mood?: string;
  type: string;
  wordCount?: number | string;
  enableFusion?: boolean;
  secondaryGenre?: string;
  fusionIntensity?: number;
  creativityLevel?: number;
  preserveAuthenticity?: boolean;
  culturalSensitivity?: boolean;
}

export interface GenerationStrategy {
  contextDepth: 'minimal' | 'standard' | 'comprehensive';
  useAI: boolean;
  cacheTimeout: number;
  maxResponseTime: number;
  enableVarietyOptimizations: boolean;
}

export class ContextEnricher {
  private contextCache = new Map<string, { context: ContextData; timestamp: number }>();
  private readonly CACHE_TTL = 15 * 60 * 1000; // 15 minutes

  async gatherContext(
    request: GenerateNameRequest,
    strategy: GenerationStrategy
  ): Promise<ContextData> {
    const { type, genre, mood, wordCount, enableFusion, secondaryGenre, fusionIntensity, creativityLevel, preserveAuthenticity, culturalSensitivity } = request;
    
    // Create cache key
    const cacheKey = `${type}-${genre || 'none'}-${mood || 'none'}-${wordCount || 'default'}-${strategy.contextDepth}`;
    
    // Check cache first
    const cached = this.contextCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
      secureLog.debug(`Context cache hit for key: ${cacheKey}`);
      return cached.context;
    }
    
    try {
      let context: ContextData;
      
      if (strategy.contextDepth === 'minimal') {
        context = await this.gatherMinimalContext(request);
      } else if (strategy.contextDepth === 'standard') {
        context = await this.gatherStandardContext(request);
      } else {
        context = await this.gatherComprehensiveContext(request);
      }
      
      // Cache the result
      this.contextCache.set(cacheKey, {
        context,
        timestamp: Date.now()
      });
      
      return context;
      
    } catch (error) {
      secureLog.error('Context gathering failed:', error);
      // Return minimal context as fallback
      return this.getMinimalFallbackContext(request);
    }
  }

  private async gatherMinimalContext(request: GenerateNameRequest): Promise<ContextData> {
    const { type, genre, mood, wordCount } = request;
    
    return {
      type,
      genre: genre || 'general',
      mood: mood || 'neutral',
      wordCount: wordCount || 2,
      enableFusion: false,
      creativityLevel: 0.5
    };
  }

  private async gatherStandardContext(request: GenerateNameRequest): Promise<ContextData> {
    const { type, genre, mood, wordCount, enableFusion, secondaryGenre, fusionIntensity, creativityLevel } = request;
    
    // Use optimized context service for standard context
    const optimizedContext = await optimizedContextService.getContext(
      genre || 'general',
      mood || 'neutral',
      'standard'
    );
    
    return {
      type,
      genre: genre || 'general',
      mood: mood || 'neutral',
      wordCount: wordCount || 2,
      enableFusion: enableFusion || false,
      secondaryGenre,
      fusionIntensity: fusionIntensity || 0.5,
      creativityLevel: creativityLevel || 0.7,
      preserveAuthenticity: true,
      culturalSensitivity: true,
      // Add enriched data from optimized context
      ...optimizedContext
    };
  }

  private async gatherComprehensiveContext(request: GenerateNameRequest): Promise<ContextData> {
    const { type, genre, mood, wordCount, enableFusion, secondaryGenre, fusionIntensity, creativityLevel, preserveAuthenticity, culturalSensitivity } = request;
    
    // Use optimized context service for comprehensive context
    const optimizedContext = await optimizedContextService.getContext(
      genre || 'general',
      mood || 'neutral',
      'comprehensive'
    );
    
    return {
      type,
      genre: genre || 'general',
      mood: mood || 'neutral',
      wordCount: wordCount || 2,
      enableFusion: enableFusion || false,
      secondaryGenre,
      fusionIntensity: fusionIntensity || 0.5,
      creativityLevel: creativityLevel || 0.8,
      preserveAuthenticity: preserveAuthenticity || true,
      culturalSensitivity: culturalSensitivity || true,
      // Add all enriched data from optimized context
      ...optimizedContext
    };
  }

  private getMinimalFallbackContext(request: GenerateNameRequest): ContextData {
    const { type, genre, mood, wordCount } = request;
    
    return {
      type,
      genre: genre || 'general',
      mood: mood || 'neutral',
      wordCount: wordCount || 2,
      enableFusion: false,
      creativityLevel: 0.5
    };
  }

  getStats() {
    const now = Date.now();
    const validEntries = Array.from(this.contextCache.entries()).filter(
      ([, data]) => (now - data.timestamp) < this.CACHE_TTL
    );
    
    return {
      cacheSize: validEntries.length,
      totalCacheSize: this.contextCache.size,
      cacheTTL: this.CACHE_TTL,
      hitRate: 0 // Could be calculated if we track hits/misses
    };
  }

  clearCache(): void {
    this.contextCache.clear();
    secureLog.info('Context cache cleared');
  }
}
