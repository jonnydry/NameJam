/**
 * Name Generation Coordinator
 * Orchestrates the complete name generation flow using specialized services
 */

import type { GenerateNameRequest } from "@shared/schema";
import { secureLog } from "../../../utils/secureLogger";
import { performanceMonitor } from "../../performanceMonitor";
import { unifiedWordFilter } from "../unifiedWordFilter";
import { AINameGenerator } from "./AINameGenerator";
import { PatternNameGenerator } from "./PatternNameGenerator";
import { ContextEnricher } from "./ContextEnricher";
import { VarietyOptimizer } from "./VarietyOptimizer";
import { config } from "../../../config";

export interface GenerationStrategy {
  contextDepth: 'minimal' | 'standard' | 'comprehensive';
  useAI: boolean;
  cacheTimeout: number;
  maxResponseTime: number;
  enableVarietyOptimizations: boolean;
}

export interface GenerationResult {
  name: string;
  isAiGenerated: boolean;
  source: string;
}

export class NameGenerationCoordinator {
  private aiGenerator: AINameGenerator;
  private patternGenerator: PatternNameGenerator;
  private contextEnricher: ContextEnricher;
  private varietyOptimizer: VarietyOptimizer;

  constructor(
    aiGenerator?: AINameGenerator,
    patternGenerator?: PatternNameGenerator,
    contextEnricher?: ContextEnricher,
    varietyOptimizer?: VarietyOptimizer
  ) {
    this.aiGenerator = aiGenerator || new AINameGenerator();
    this.patternGenerator = patternGenerator || new PatternNameGenerator();
    this.contextEnricher = contextEnricher || new ContextEnricher();
    this.varietyOptimizer = varietyOptimizer || new VarietyOptimizer();
  }

  async generateNames(
    request: GenerateNameRequest,
    strategy: GenerationStrategy
  ): Promise<GenerationResult[]> {
    const { type, genre, mood, count = 4, wordCount, enableFusion, secondaryGenre, fusionIntensity, creativityLevel, preserveAuthenticity, culturalSensitivity } = request;
    const generationId = unifiedWordFilter.startNewGeneration();
    const operationId = `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Start performance monitoring
    performanceMonitor.startOperation(operationId, 'unified_name_generation', {
      type, genre, mood, count, wordCount, strategy: strategy.contextDepth, enableFusion, secondaryGenre
    });

    try {
      // Step 1: Gather context based on strategy
      const context = await this.contextEnricher.gatherContext(request, strategy);
      
      // Step 2: Generate names using appropriate methods
      let allNames: GenerationResult[] = [];
      
      if (strategy.useAI) {
        const aiNames = await this.aiGenerator.generateNames(request, context, strategy);
        allNames = [...allNames, ...aiNames];
      }
      
      // Always include pattern-based generation for variety
      const patternNames = await this.patternGenerator.generateNames(request, context, strategy);
      allNames = [...allNames, ...patternNames];
      
      // Step 3: Apply variety optimizations if enabled
      if (strategy.enableVarietyOptimizations) {
        allNames = await this.varietyOptimizer.optimizeVariety(allNames, request, generationId);
      }
      
      // Step 4: Apply repetition filtering
      const filteredNames = this.applyRepetitionFiltering(allNames, generationId);
      
      // Step 5: Ensure we have enough names
      const finalNames = this.ensureSufficientNames(filteredNames, request, strategy);
      
      // End performance monitoring
      performanceMonitor.endOperation(operationId, true);
      
      return finalNames;
      
    } catch (error) {
      performanceMonitor.endOperation(operationId, false, error instanceof Error ? error.message : 'Unknown error');
      secureLog.error('Name generation failed:', error);
      throw error;
    }
  }

  private applyRepetitionFiltering(names: GenerationResult[], generationId: string): GenerationResult[] {
    return names.filter(nameResult => {
      const isAccepted = unifiedWordFilter.acceptName(nameResult.name, generationId);
      if (!isAccepted) {
        secureLog.debug(`Filtered out repetitive name: ${nameResult.name}`);
      }
      return isAccepted;
    });
  }

  private ensureSufficientNames(
    names: GenerationResult[], 
    request: GenerateNameRequest, 
    strategy: GenerationStrategy
  ): GenerationResult[] {
    const targetCount = request.count || config.generation.defaultCount;
    
    if (names.length >= targetCount) {
      return names.slice(0, targetCount);
    }
    
    // If we don't have enough names, generate more using fallback methods
    secureLog.warn(`Only generated ${names.length} names, need ${targetCount}. Generating additional names.`);
    
    // Use pattern generation as fallback since it's faster
    const additionalNames = this.patternGenerator.generateFallbackNames(request, targetCount - names.length);
    
    return [...names, ...additionalNames].slice(0, targetCount);
  }

  getStats() {
    return {
      aiGenerator: this.aiGenerator.getPoolStats(),
      patternGenerator: this.patternGenerator.getStats(),
      contextEnricher: this.contextEnricher.getStats(),
      varietyOptimizer: this.varietyOptimizer.getStats()
    };
  }
}
