/**
 * New Unified Name Generator
 * Uses the coordinator pattern with focused services
 */

import type { GenerateNameRequest } from "@shared/schema";
import { secureLog } from "../../utils/secureLogger";
import { NameGenerationCoordinator, GenerationStrategy } from "./core/NameGenerationCoordinator";
import { AINameGenerator } from "./core/AINameGenerator";
import { PatternNameGenerator } from "./core/PatternNameGenerator";
import { ContextEnricher } from "./core/ContextEnricher";
import { VarietyOptimizer } from "./core/VarietyOptimizer";
import { config } from "../../config";

// Predefined strategy configurations
export const GENERATION_STRATEGIES = {
  QUALITY: {
    contextDepth: 'comprehensive' as const,
    useAI: true,
    cacheTimeout: 0,
    maxResponseTime: 30000,
    enableVarietyOptimizations: true
  },
  BALANCED: {
    contextDepth: 'standard' as const,
    useAI: true,
    cacheTimeout: 15 * 60 * 1000,
    maxResponseTime: 15000,
    enableVarietyOptimizations: true
  },
  SPEED: {
    contextDepth: 'minimal' as const,
    useAI: true,
    cacheTimeout: 30 * 60 * 1000,
    maxResponseTime: 5000,
    enableVarietyOptimizations: false
  }
} as const;

export class NewUnifiedNameGeneratorService {
  private coordinator: NameGenerationCoordinator;

  constructor() {
    // Initialize services
    const aiGenerator = new AINameGenerator();
    const patternGenerator = new PatternNameGenerator();
    const contextEnricher = new ContextEnricher();
    const varietyOptimizer = new VarietyOptimizer();
    
    // Create coordinator with services
    this.coordinator = new NameGenerationCoordinator(
      aiGenerator,
      patternGenerator,
      contextEnricher,
      varietyOptimizer
    );
    
    secureLog.info('New Unified Name Generator Service initialized with coordinator pattern');
  }

  async generateNames(
    request: GenerateNameRequest,
    strategy: GenerationStrategy = GENERATION_STRATEGIES.BALANCED
  ): Promise<Array<{name: string, isAiGenerated: boolean, source: string}>> {
    try {
      secureLog.debug(`Generating names with strategy: ${strategy.contextDepth}`);
      
      const results = await this.coordinator.generateNames(request, strategy);
      
      secureLog.debug(`Generated ${results.length} names`);
      return results;
      
    } catch (error) {
      secureLog.error('Name generation failed:', error);
      throw error;
    }
  }

  getStats() {
    return this.coordinator.getStats();
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      // Test with a simple request
      const testRequest: GenerateNameRequest = {
        type: 'band',
        count: 1,
        wordCount: 2
      };
      
      const results = await this.generateNames(testRequest, GENERATION_STRATEGIES.SPEED);
      return results.length > 0;
    } catch (error) {
      secureLog.error('Health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const newUnifiedNameGenerator = new NewUnifiedNameGeneratorService();
