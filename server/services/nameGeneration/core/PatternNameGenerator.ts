/**
 * Pattern Name Generator
 * Handles pattern-based name generation using advanced pattern libraries
 */

import type { GenerateNameRequest } from "@shared/schema";
import { secureLog } from "../../../utils/secureLogger";
import { 
  advancedPatternLibrary, 
  PatternContext 
} from "../advancedPatternLibrary";
import { 
  patternSelectionEngine, 
  PatternSelectionCriteria 
} from "../patternSelectionEngine";
import { contextualPatternBuilder } from "../contextualPatternBuilder";
import { creativePatternCategories } from "../creativePatternCategories";
import { sampleWithoutReplacement } from "../stringUtils";
import { config } from "../../../config";

export interface GenerationResult {
  name: string;
  isAiGenerated: boolean;
  source: string;
}

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

export class PatternNameGenerator {
  private patternCache = new Map<string, string[]>();
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  async generateNames(
    request: GenerateNameRequest,
    context: ContextData,
    strategy: any
  ): Promise<GenerationResult[]> {
    const { type, genre, mood, wordCount, enableFusion, secondaryGenre, fusionIntensity, creativityLevel, preserveAuthenticity, culturalSensitivity } = request;
    
    try {
      // Build pattern context
      const patternContext: PatternContext = {
        genre: genre || 'general',
        mood: mood || 'neutral',
        type: type as 'band' | 'song',
        wordCount: typeof wordCount === 'string' ? 2 : (wordCount || 2),
        enableFusion: enableFusion || false,
        secondaryGenre: secondaryGenre,
        fusionIntensity: fusionIntensity || 0.5,
        creativityLevel: creativityLevel || 0.7,
        preserveAuthenticity: preserveAuthenticity || true,
        culturalSensitivity: culturalSensitivity || true
      };

      // Select appropriate patterns
      const selectionCriteria: PatternSelectionCriteria = {
        genre: patternContext.genre,
        mood: patternContext.mood,
        type: patternContext.type,
        wordCount: patternContext.wordCount,
        creativityLevel: patternContext.creativityLevel,
        enableFusion: patternContext.enableFusion
      };

      const selectedPatterns = patternSelectionEngine.selectPatterns(selectionCriteria);
      
      // Generate names using patterns
      const generatedNames = await this.generateWithPatterns(selectedPatterns, patternContext);
      
      // Convert to GenerationResult format
      return generatedNames.map(name => ({
        name,
        isAiGenerated: false,
        source: 'pattern'
      }));
      
    } catch (error) {
      secureLog.error('Pattern name generation failed:', error);
      return [];
    }
  }

  private async generateWithPatterns(patterns: any[], context: PatternContext): Promise<string[]> {
    const names: string[] = [];
    
    for (const pattern of patterns) {
      try {
        // Use contextual pattern builder
        const patternNames = contextualPatternBuilder.buildNames(pattern, context);
        names.push(...patternNames);
        
        // Add creative variations if creativity level is high
        if (context.creativityLevel && context.creativityLevel > 0.7) {
          const creativeNames = this.generateCreativeVariations(patternNames, context);
          names.push(...creativeNames);
        }
        
      } catch (error) {
        secureLog.warn(`Pattern generation failed for pattern ${pattern.id}:`, error);
      }
    }
    
    return names;
  }

  private generateCreativeVariations(names: string[], context: PatternContext): string[] {
    const variations: string[] = [];
    
    for (const name of names) {
      // Add creative suffixes/prefixes based on genre
      const creativeSuffixes = creativePatternCategories.getCreativeSuffixes(context.genre);
      const creativePrefixes = creativePatternCategories.getCreativePrefixes(context.genre);
      
      // Generate variations
      for (const suffix of creativeSuffixes.slice(0, 2)) {
        variations.push(`${name}${suffix}`);
      }
      
      for (const prefix of creativePrefixes.slice(0, 2)) {
        variations.push(`${prefix}${name}`);
      }
    }
    
    return variations;
  }

  generateFallbackNames(request: GenerateNameRequest, count: number): GenerationResult[] {
    const { type, genre, mood, wordCount } = request;
    
    // Simple fallback pattern generation
    const fallbackPatterns = [
      { pattern: '{adjective} {noun}', words: ['Dark', 'Light', 'Wild', 'Pure', 'Lost', 'Found'] },
      { pattern: '{noun} {verb}', words: ['Storm', 'Fire', 'Wave', 'Wind', 'Stone', 'Moon'] },
      { pattern: '{adjective} {noun} {suffix}', words: ['Eternal', 'Sacred', 'Hidden', 'Ancient'], suffixes: ['s', 'ing', 'ed'] }
    ];
    
    const names: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const pattern = fallbackPatterns[i % fallbackPatterns.length];
      const word1 = pattern.words[Math.floor(Math.random() * pattern.words.length)];
      const word2 = pattern.words[Math.floor(Math.random() * pattern.words.length)];
      
      let name = pattern.pattern
        .replace('{adjective}', word1)
        .replace('{noun}', word2)
        .replace('{verb}', word2)
        .replace('{suffix}', pattern.suffixes ? pattern.suffixes[Math.floor(Math.random() * pattern.suffixes.length)] : '');
      
      names.push(name);
    }
    
    return names.map(name => ({
      name,
      isAiGenerated: false,
      source: 'fallback-pattern'
    }));
  }

  getStats() {
    return {
      patternCacheSize: this.patternCache.size,
      cacheTTL: this.CACHE_TTL
    };
  }
}
