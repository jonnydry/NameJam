/**
 * Unified Name Generator - Single service with configurable strategies
 * Consolidates intelligent, optimized, and basic generation approaches
 */

import type { GenerateNameRequest } from "@shared/schema";
import { secureLog } from "../utils/secureLogger";
import { unifiedWordFilter } from "./nameGeneration/unifiedWordFilter";
import { datamuseService } from "./datamuseService";
import { spotifyService } from "./spotifyService";
import { lastfmService } from "./lastfmService";
import { optimizedContextService, OptimizedContext } from "./optimizedContextService";
import { performanceMonitor } from "./performanceMonitor";
import { sampleWithoutReplacement, RetryCircuitBreaker } from "./nameGeneration/stringUtils";
import { createEnhancedWordSource } from "./nameGeneration/enhancedWordSourceUtils";
import { NamePromptBuilder, NameGenerationRequest } from "./nameGeneration/namePromptBuilder";
import { 
  advancedPatternLibrary, 
  PatternContext 
} from "./nameGeneration/advancedPatternLibrary";
import { 
  patternSelectionEngine, 
  PatternSelectionCriteria 
} from "./nameGeneration/patternSelectionEngine";
import { contextualPatternBuilder } from "./nameGeneration/contextualPatternBuilder";
import { creativePatternCategories } from "./nameGeneration/creativePatternCategories";
import { 
  crossGenreFusionEngine, 
  CrossGenreFusionRequest, 
  CrossGenreFusionResult 
} from "./nameGeneration/crossGenreFusionEngine";
import { GenreType } from "./nameGeneration/genreCompatibilityMatrix";
import OpenAI from "openai";

// Strategy configuration
export interface GenerationStrategy {
  contextDepth: 'minimal' | 'standard' | 'comprehensive';
  useAI: boolean;
  cacheTimeout: number; // in milliseconds
  maxResponseTime: number; // in milliseconds
  enableVarietyOptimizations: boolean;
}

// Predefined strategy configurations
export const GENERATION_STRATEGIES = {
  QUALITY: {
    contextDepth: 'comprehensive' as const,
    useAI: true,
    cacheTimeout: 0, // No caching for maximum freshness
    maxResponseTime: 30000, // 30 seconds
    enableVarietyOptimizations: true
  },
  BALANCED: {
    contextDepth: 'standard' as const,
    useAI: true,
    cacheTimeout: 2 * 60 * 1000, // 2 minutes
    maxResponseTime: 15000, // 15 seconds
    enableVarietyOptimizations: true
  },
  SPEED: {
    contextDepth: 'minimal' as const,
    useAI: false,
    cacheTimeout: 5 * 60 * 1000, // 5 minutes
    maxResponseTime: 5000, // 5 seconds
    enableVarietyOptimizations: false
  }
} as const;

interface GenerationContext {
  genreKeywords: string[];
  moodWords: string[];
  relatedArtists: string[];
  genreTags: string[];
  wordAssociations: string[];
  audioCharacteristics: string[];
  culturalReferences: string[];
}

interface CachedContext {
  context: GenerationContext;
  timestamp: number;
  strategy: GenerationStrategy;
}

interface RobustParsingOptions {
  expectedFields: string[];
  maxNameLength: number;
  minNameLength: number;
  expectedCount: number;
}

export class UnifiedNameGeneratorService {
  private openai: OpenAI;
  private contextCache = new Map<string, CachedContext>();
  private parsingStats = new Map<string, { uses: number, totalExtracted: number, totalExpected: number }>();
  
  // Circuit breakers for retry pattern optimization
  private generationCircuitBreaker = new RetryCircuitBreaker(5, 1000);
  private filteringCircuitBreaker = new RetryCircuitBreaker(3, 500);

  constructor() {
    this.openai = new OpenAI({ 
      baseURL: "https://api.x.ai/v1", 
      apiKey: process.env.XAI_API_KEY 
    });
  }

  /**
   * Robust JSON parsing utility with multiple extraction strategies
   */
  private parseAIResponseRobustly(
    content: string, 
    options: RobustParsingOptions
  ): { names: string[], parseMethod: string, issues: string[] } {
    const issues: string[] = [];
    const { expectedFields, maxNameLength, minNameLength, expectedCount } = options;
    
    secureLog.debug('Attempting robust parsing on content length:', content.length);
    
    // Strategy 1: Clean JSON extraction with preprocessing
    try {
      const result = this.tryCleanJsonExtraction(content, expectedFields);
      if (result.names.length > 0) {
        const validatedNames = this.validateExtractedNames(result.names, { maxNameLength, minNameLength, expectedCount });
        if (validatedNames.valid.length > 0) {
          secureLog.debug(`Clean JSON extraction succeeded: ${validatedNames.valid.length} names`);
          return { 
            names: validatedNames.valid, 
            parseMethod: 'clean_json', 
            issues: validatedNames.issues 
          };
        }
        issues.push('Clean JSON extracted but names failed validation');
      }
    } catch (error) {
      issues.push(`Clean JSON failed: ${error}`);
      secureLog.debug('Clean JSON extraction failed:', error);
    }
    
    // Strategy 2: Loose JSON extraction (multiple attempts)
    try {
      const result = this.tryLooseJsonExtraction(content, expectedFields);
      if (result.names.length > 0) {
        const validatedNames = this.validateExtractedNames(result.names, { maxNameLength, minNameLength, expectedCount });
        if (validatedNames.valid.length > 0) {
          secureLog.debug(`Loose JSON extraction succeeded: ${validatedNames.valid.length} names`);
          return { 
            names: validatedNames.valid, 
            parseMethod: 'loose_json', 
            issues: [...issues, ...validatedNames.issues] 
          };
        }
        issues.push('Loose JSON extracted but names failed validation');
      }
    } catch (error) {
      issues.push(`Loose JSON failed: ${error}`);
      secureLog.debug('Loose JSON extraction failed:', error);
    }
    
    // Strategy 3: Structured text parsing (looking for patterns)
    try {
      const result = this.tryStructuredTextParsing(content);
      if (result.names.length > 0) {
        const validatedNames = this.validateExtractedNames(result.names, { maxNameLength, minNameLength, expectedCount });
        if (validatedNames.valid.length > 0) {
          secureLog.debug(`Structured text parsing succeeded: ${validatedNames.valid.length} names`);
          return { 
            names: validatedNames.valid, 
            parseMethod: 'structured_text', 
            issues: [...issues, ...validatedNames.issues] 
          };
        }
        issues.push('Structured text extracted but names failed validation');
      }
    } catch (error) {
      issues.push(`Structured text parsing failed: ${error}`);
      secureLog.debug('Structured text parsing failed:', error);
    }
    
    // Strategy 4: Enhanced line parsing (improved version of current fallback)
    try {
      const result = this.tryEnhancedLineParsing(content);
      const validatedNames = this.validateExtractedNames(result.names, { maxNameLength, minNameLength, expectedCount });
      secureLog.debug(`Enhanced line parsing: ${validatedNames.valid.length} valid names from ${result.names.length} extracted`);
      return { 
        names: validatedNames.valid, 
        parseMethod: 'enhanced_line', 
        issues: [...issues, ...validatedNames.issues] 
      };
    } catch (error) {
      issues.push(`Enhanced line parsing failed: ${error}`);
      secureLog.error('All parsing strategies failed:', error);
      return { names: [], parseMethod: 'failed', issues: [...issues, `Final fallback failed: ${error}`] };
    }
  }
  
  /**
   * Strategy 1: Clean JSON extraction with preprocessing
   */
  private tryCleanJsonExtraction(content: string, expectedFields: string[]): { names: string[] } {
    // Preprocess content to clean common AI formatting issues
    let cleanContent = content
      .replace(/```json\s*/gi, '')  // Remove markdown JSON blocks
      .replace(/```\s*/g, '')       // Remove remaining markdown blocks
      .replace(/^[^{]*(?={)/, '')   // Remove text before first { (removed 's' flag)
      .replace(/}[^}]*$/, '}')      // Remove text after last } (removed 's' flag)
      .trim();
    
    // Try to find and extract the most complete JSON object
    const jsonCandidates = this.findJsonCandidates(cleanContent);
    
    for (const candidate of jsonCandidates) {
      try {
        const parsed = JSON.parse(candidate);
        const names = this.extractNamesFromParsedJson(parsed, expectedFields);
        if (names.length > 0) {
          return { names };
        }
      } catch (error) {
        // Continue to next candidate
        continue;
      }
    }
    
    throw new Error('No valid JSON candidates found');
  }
  
  /**
   * Strategy 2: Loose JSON extraction (handles malformed JSON)
   */
  private tryLooseJsonExtraction(content: string, expectedFields: string[]): { names: string[] } {
    // More aggressive JSON boundary detection
    const jsonPatterns = [
      /{[^}]*}/g,                    // Any content between braces
      /\{[\s\S]*?\}/g,               // Multiline JSON objects
      /"(?:band_names|song_titles)"[\s\S]*?\]/g  // Specific field patterns
    ];
    
    for (const pattern of jsonPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        for (const match of matches) {
          try {
            // Try to fix common JSON issues
            const fixedJson = this.fixCommonJsonIssues(match);
            const parsed = JSON.parse(fixedJson);
            const names = this.extractNamesFromParsedJson(parsed, expectedFields);
            if (names.length > 0) {
              return { names };
            }
          } catch (error) {
            // Try partial extraction even if JSON is malformed
            const partialNames = this.extractNamesFromMalformedJson(match, expectedFields);
            if (partialNames.length > 0) {
              return { names: partialNames };
            }
          }
        }
      }
    }
    
    throw new Error('No extractable JSON found in loose parsing');
  }
  
  /**
   * Strategy 3: Structured text parsing (pattern-based extraction)
   */
  private tryStructuredTextParsing(content: string): { names: string[] } {
    const names: string[] = [];
    
    // Look for quoted strings that could be names
    const quotedPatterns = [
      /"([^"]+)"/g,           // Double quotes
      /'([^']+)'/g,           // Single quotes  
      /"([^"]{3,50})"/g       // Reasonable length quoted strings
    ];
    
    for (const pattern of quotedPatterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const candidate = match[1].trim();
        if (this.looksLikeName(candidate)) {
          names.push(candidate);
        }
      }
    }
    
    // Look for list-like patterns
    const listPatterns = [
      /^\s*-\s*(.+)$/gm,       // Dash lists
      /^\s*\*\s*(.+)$/gm,      // Asterisk lists
      /^\s*\d+\.\s*(.+)$/gm    // Numbered lists
    ];
    
    for (const pattern of listPatterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const candidate = match[1].trim().replace(/["']/g, ''); // Remove quotes
        if (this.looksLikeName(candidate)) {
          names.push(candidate);
        }
      }
    }
    
    return { names: [...new Set(names)] }; // Remove duplicates
  }
  
  /**
   * Strategy 4: Enhanced line parsing (improved fallback)
   */
  private tryEnhancedLineParsing(content: string): { names: string[] } {
    const lines = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    const names: string[] = [];
    
    for (const line of lines) {
      // Skip obvious non-name lines
      if (this.shouldSkipLine(line)) {
        continue;
      }
      
      // Clean the line of common prefixes and formatting
      let cleaned = line
        .replace(/^[-•*]\s*/, '')           // Remove list markers
        .replace(/^\d+\.\s*/, '')          // Remove numbers
        .replace(/^["']|["']$/g, '')       // Remove outer quotes
        .replace(/,$/, '')                 // Remove trailing comma
        .trim();
      
      if (this.looksLikeName(cleaned) && cleaned.length >= 3 && cleaned.length <= 50) {
        names.push(cleaned);
      }
    }
    
    return { names: [...new Set(names)] }; // Remove duplicates
  }
  
  /**
   * Helper: Find potential JSON candidates in content
   */
  private findJsonCandidates(content: string): string[] {
    const candidates: string[] = [];
    
    // Find all potential JSON objects by brace matching
    let braceCount = 0;
    let start = -1;
    
    for (let i = 0; i < content.length; i++) {
      if (content[i] === '{') {
        if (braceCount === 0) {
          start = i;
        }
        braceCount++;
      } else if (content[i] === '}') {
        braceCount--;
        if (braceCount === 0 && start !== -1) {
          candidates.push(content.substring(start, i + 1));
          start = -1;
        }
      }
    }
    
    // Sort by length descending (prefer longer, more complete JSON)
    return candidates.sort((a, b) => b.length - a.length);
  }
  
  /**
   * Helper: Extract names from successfully parsed JSON
   */
  private extractNamesFromParsedJson(parsed: any, expectedFields: string[]): string[] {
    const names: string[] = [];
    
    for (const field of expectedFields) {
      if (parsed[field] && Array.isArray(parsed[field])) {
        for (const item of parsed[field]) {
          if (typeof item === 'string') {
            names.push(item.trim());
          }
        }
      }
    }
    
    return names.filter(name => name.length > 0);
  }
  
  /**
   * Helper: Fix common JSON formatting issues
   */
  private fixCommonJsonIssues(jsonStr: string): string {
    return jsonStr
      .replace(/,\s*}/g, '}')           // Remove trailing commas
      .replace(/,\s*\]/g, ']')         // Remove trailing commas in arrays
      .replace(/([^"\s])\s*([}\]])/g, '$1$2')  // Remove spaces before closing
      .replace(/([{\[])\s*([^"\s])/g, '$1"$2')  // Add missing quotes after opening
      .replace(/([^"\s])\s*:/g, '"$1":')      // Fix unquoted keys
      .trim();
  }
  
  /**
   * Helper: Extract names from malformed JSON using regex
   */
  private extractNamesFromMalformedJson(jsonStr: string, expectedFields: string[]): string[] {
    const names: string[] = [];
    
    for (const field of expectedFields) {
      // Look for the field pattern and extract array-like content
      const fieldPattern = new RegExp(`"${field}"\s*:\s*\[([^\]]+)\]`, 'i');
      const match = jsonStr.match(fieldPattern);
      
      if (match) {
        // Extract quoted strings from the array content
        const arrayContent = match[1];
        const quotedStrings = arrayContent.match(/"([^"]+)"/g);
        
        if (quotedStrings) {
          for (const quoted of quotedStrings) {
            const name = quoted.replace(/"/g, '').trim();
            if (name.length > 0) {
              names.push(name);
            }
          }
        }
      }
    }
    
    return names;
  }
  
  /**
   * Helper: Check if a string looks like a valid name
   */
  private looksLikeName(str: string): boolean {
    // Basic heuristics for what looks like a band/song name
    if (str.length < 2 || str.length > 100) return false;
    
    // Exclude obvious non-names
    const excludePatterns = [
      /^\s*(here|these|are|some|examples?|names?)\s*:?\s*$/i,
      /^\s*(band|song)\s*(names?|titles?)\s*:?\s*$/i,
      /^\s*\d+\s*$/, // Just numbers
      /^\s*[{}\[\]()]+\s*$/, // Just brackets/braces
      /^\s*[.,;:!?]+\s*$/, // Just punctuation
      /^\s*(sure|okay|certainly|of course)\s*[.,!]*\s*$/i
    ];
    
    for (const pattern of excludePatterns) {
      if (pattern.test(str)) return false;
    }
    
    // Must contain at least one letter
    if (!/[a-zA-Z]/.test(str)) return false;
    
    // Check for reasonable character distribution
    const alphaRatio = (str.match(/[a-zA-Z]/g) || []).length / str.length;
    if (alphaRatio < 0.3) return false; // At least 30% letters
    
    return true;
  }
  
  /**
   * Helper: Check if a line should be skipped during line parsing
   */
  private shouldSkipLine(line: string): boolean {
    const skipPatterns = [
      /^\s*{.*}\s*$/,                    // JSON objects
      /^\s*\[.*\]\s*$/,                  // JSON arrays
      /^\s*(sure|okay|here|these)\s*:/i, // Conversational starters
      /^\s*```/,                        // Code blocks
      /^\s*#{1,6}\s/,                    // Markdown headers
      /^\s*\*\*.*\*\*\s*$/,              // Bold markdown
      /^\s*band[_\s]*names?\s*:?\s*$/i,  // Field labels
      /^\s*song[_\s]*titles?\s*:?\s*$/i, // Field labels
      /^\s*\{\s*$/,                      // Opening brace only
      /^\s*\}\s*$/,                      // Closing brace only
      /^\s*"?\s*:?\s*\[?\s*$/,           // Incomplete JSON syntax
      /^\s*"(band_names|song_titles|names|titles|results|data)"\s*:?\s*$/i, // JSON keys
      /^\s*(band_names|song_titles|names|titles|results|data)\s*:?\s*$/i,   // Unquoted JSON keys
      /^\s*"(band_names|song_titles)"\s*:\s*\[/i, // JSON key with array start
      /^\s*:\s*\[/,                      // Colon array pattern
      /^\s*\]\s*,?\s*$/,                 // Array closing bracket
      /^\s*,\s*$/                        // Lone comma
    ];
    
    return skipPatterns.some(pattern => pattern.test(line));
  }
  
  /**
   * Helper: Check if a string is a reserved JSON key that should not be treated as a name
   */
  private isReservedWord(name: string): boolean {
    const normalizedName = name.toLowerCase().replace(/[^a-z_]/g, '');
    const reservedWords = [
      'band_names', 'bandnames', 'song_titles', 'songtitles', 'names', 'titles',
      'results', 'data', 'response', 'output', 'array', 'list', 'items'
    ];
    
    return reservedWords.includes(normalizedName);
  }

  /**
   * Helper: Validate extracted names
   */
  private validateExtractedNames(
    names: string[], 
    options: { maxNameLength: number, minNameLength: number, expectedCount: number }
  ): { valid: string[], invalid: string[], issues: string[] } {
    const valid: string[] = [];
    const invalid: string[] = [];
    const issues: string[] = [];
    
    const { maxNameLength, minNameLength, expectedCount } = options;
    
    for (const name of names) {
      const trimmed = name.trim();
      
      // Reserved word validation (critical bug fix)
      if (this.isReservedWord(trimmed)) {
        invalid.push(trimmed);
        issues.push(`Reserved JSON key filtered: "${trimmed}"`);
        secureLog.debug(`🔍 Filtered reserved word: "${trimmed}"`);
        continue;
      }
      
      // Length validation
      if (trimmed.length < minNameLength) {
        invalid.push(trimmed);
        issues.push(`Name too short: "${trimmed}"`);
        continue;
      }
      
      if (trimmed.length > maxNameLength) {
        invalid.push(trimmed);
        issues.push(`Name too long: "${trimmed.substring(0, 20)}..."`);
        continue;
      }
      
      // Quality validation
      if (!this.looksLikeName(trimmed)) {
        invalid.push(trimmed);
        issues.push(`Doesn't look like a name: "${trimmed}"`);
        continue;
      }
      
      valid.push(trimmed);
    }
    
    // Check if we got reasonable coverage
    if (valid.length < Math.ceil(expectedCount * 0.5)) {
      issues.push(`Low extraction rate: ${valid.length}/${expectedCount} expected`);
    }
    
    return { valid: [...new Set(valid)], invalid, issues };
  }
  
  /**
   * Helper: Log parsing method usage for monitoring and optimization
   */
  private logParsingMethodUsage(method: string, extractedCount: number, expectedCount: number): void {
    const successRate = expectedCount > 0 ? (extractedCount / expectedCount * 100).toFixed(1) : '0.0';
    
    secureLog.info(`Parsing method: ${method}, extracted: ${extractedCount}/${expectedCount} (${successRate}%)`);
    
    // Track method effectiveness for future optimization
    if (!this.parsingStats) {
      this.parsingStats = new Map<string, { uses: number, totalExtracted: number, totalExpected: number }>();
    }
    
    const stats = this.parsingStats.get(method) || { uses: 0, totalExtracted: 0, totalExpected: 0 };
    stats.uses += 1;
    stats.totalExtracted += extractedCount;
    stats.totalExpected += expectedCount;
    this.parsingStats.set(method, stats);
    
    // Log aggregated stats periodically
    if (stats.uses % 10 === 0) {
      const avgSuccessRate = stats.totalExpected > 0 ? (stats.totalExtracted / stats.totalExpected * 100).toFixed(1) : '0.0';
      secureLog.info(`Parsing method ${method} stats: ${stats.uses} uses, ${avgSuccessRate}% avg success rate`);
    }
  }
  

  async generateNames(
    request: GenerateNameRequest, 
    strategy: GenerationStrategy = GENERATION_STRATEGIES.QUALITY
  ): Promise<Array<{name: string, isAiGenerated: boolean, source: string}>> {
    const { type, genre, mood, count = 4, wordCount, enableFusion, secondaryGenre, fusionIntensity, creativityLevel, preserveAuthenticity, culturalSensitivity } = request;
    const generationId = unifiedWordFilter.startNewGeneration();
    const operationId = `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Start performance monitoring
    performanceMonitor.startOperation(operationId, 'unified_name_generation', {
      type, genre, mood, count, wordCount, strategy: strategy.contextDepth, enableFusion, secondaryGenre
    });
    
    secureLog.info(`🎯 Unified generation: ${count} ${type} names for ${genre || 'general'} genre using ${strategy.contextDepth} strategy ${enableFusion ? `with ${secondaryGenre} fusion` : ''}`);
    
    const startTime = Date.now();
    
    // Handle cross-genre fusion if enabled
    if (enableFusion && genre && secondaryGenre && genre !== secondaryGenre) {
      try {
        return await this.generateWithCrossGenreFusion(request, strategy, generationId, operationId);
      } catch (error) {
        secureLog.error('Cross-genre fusion failed, falling back to standard generation:', error);
        // Fall through to standard generation as fallback
      }
    }
    
    try {
      // 1. Gather context based on strategy
      const context = await this.gatherContextWithStrategy(genre, mood, type, strategy);
      
      // 2. Generate names based on strategy
      let names: string[];
      if (strategy.useAI) {
        names = await this.generateWithAI(context, type, genre, mood, count, wordCount, strategy);
      } else {
        names = await this.generateWithPatterns(context, type, genre, mood, count, wordCount);
      }
      
      // 3. Apply repetition filtering and ensure we have enough names - OPTIMIZED
      let filteredNames = this.applyRepetitionFiltering(names, generationId, type);
      
      // OPTIMIZED: Use circuit breaker with intelligent bulk generation instead of retry loops
      if (filteredNames.length < count) {
        const needed = count - filteredNames.length;
        secureLog.info(`Need ${needed} more names after filtering, using optimized bulk generation`);
        
        await this.filteringCircuitBreaker.attempt(
          async () => {
            // Generate significantly more names upfront to account for filtering
            const generateCount = Math.max(needed * 3, count * 2);
            
            let additionalNames: string[];
            if (strategy.useAI) {
              additionalNames = await this.generateWithAI(context, type, genre, mood, generateCount, wordCount, strategy);
            } else {
              additionalNames = await this.generateWithPatterns(context, type, genre, mood, generateCount, wordCount);
            }
            
            // Filter and efficiently select the best candidates
            const additionalFiltered = this.applyRepetitionFiltering(additionalNames, generationId, type);
            const uniqueNew = additionalFiltered.filter(name => !filteredNames.includes(name));
            
            // Use efficient sampling to select the best names
            const selectedNew = sampleWithoutReplacement(uniqueNew, needed);
            filteredNames = [...filteredNames, ...selectedNew];
            
            if (filteredNames.length < count) {
              throw new Error(`Still need ${count - filteredNames.length} names after bulk generation`);
            }
          },
          async () => {
            // Graceful fallback: generate simple fallback names
            secureLog.info(`Using graceful fallback for remaining ${count - filteredNames.length} names`);
            const fallbackNames = await this.generateFallbackNames(type, genre, mood, count - filteredNames.length);
            const fallbackFiltered = fallbackNames
              .map(item => item.name)
              .filter(name => !filteredNames.includes(name));
            filteredNames = [...filteredNames, ...fallbackFiltered.slice(0, count - filteredNames.length)];
          }
        );
      }
      
      // Log final result  
      secureLog.info(`Generated ${filteredNames.length}/${count} names using optimized approach`);
      
      // 4. Apply quality scoring and select best names
      const scoredNames = filteredNames.map((name: string) => ({
        name,
        score: this.scoreNameQuality(name, genre, mood)
      }));
      
      // Sort by quality score and take the best ones
      scoredNames.sort((a: any, b: any) => b.score - a.score);
      const finalNames = scoredNames.slice(0, count).map((item: any) => item.name);
      
      // Track only the final selected names in the filter
      finalNames.forEach((name: string) => unifiedWordFilter.acceptName(name, generationId, type));
      const elapsedTime = Date.now() - startTime;
      
      // End performance monitoring
      performanceMonitor.endOperation(operationId);
      
      secureLog.info(`✅ Generated ${finalNames.length} names in ${elapsedTime}ms using ${strategy.contextDepth} strategy`);
      
      return finalNames.map((name: string) => ({
        name,
        isAiGenerated: strategy.useAI,
        source: this.getSourceName(strategy)
      }));
      
    } catch (error) {
      // End performance monitoring even on error
      performanceMonitor.endOperation(operationId);
      secureLog.error('Unified generation error:', error);
      return this.generateFallbackNames(type, genre, mood, count);
    }
  }

  private async gatherContextWithStrategy(
    genre: string | undefined, 
    mood: string | undefined, 
    type: string | undefined, 
    strategy: GenerationStrategy
  ): Promise<GenerationContext> {
    // Use optimized context service for better performance
    const priority = strategy.contextDepth === 'minimal' ? 'speed' : 'quality';
    const maxWaitTime = strategy.maxResponseTime / 2; // Reserve half time for generation
    
    try {
      const optimizedContext = await optimizedContextService.getContext(
        genre, 
        mood, 
        priority, 
        maxWaitTime
      );
      
      // Convert to legacy format for compatibility
      return this.convertToLegacyContext(optimizedContext);
    } catch (error) {
      secureLog.warn('Optimized context failed, falling back to legacy method:', error);
      return this.gatherContextLegacy(genre, mood, type, strategy);
    }
  }

  private async gatherContextLegacy(
    genre: string | undefined, 
    mood: string | undefined, 
    type: string | undefined, 
    strategy: GenerationStrategy
  ): Promise<GenerationContext> {
    const cacheKey = `${genre || 'none'}-${mood || 'none'}-${type || 'none'}-${strategy.contextDepth}`;
    
    // Check cache if strategy allows it
    if (strategy.cacheTimeout > 0) {
      const cached = this.contextCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < strategy.cacheTimeout) {
        secureLog.debug('Using cached context');
        return cached.context;
      }
    }
    
    const context: GenerationContext = {
      genreKeywords: [],
      moodWords: [],
      relatedArtists: [],
      genreTags: [],
      wordAssociations: [],
      audioCharacteristics: [],
      culturalReferences: []
    };

    const promises = [];

    switch (strategy.contextDepth) {
      case 'comprehensive':
        // Full context gathering (like IntelligentNameGeneratorService)
        if (genre) {
          // Parallel Datamuse calls instead of sequential
          promises.push(
            datamuseService.findSimilarWords(genre, 10)
              .then((words: any[]) => {
                context.genreKeywords = words.map((w: any) => w.word);
              })
              .catch((err: any) => secureLog.debug('Datamuse similar words error:', err))
          );
          
          promises.push(
            datamuseService.findAdjectivesForNoun(genre, 8)
              .then((adjectives: any[]) => {
                context.wordAssociations = adjectives.map((a: any) => a.word);
              })
              .catch((err: any) => secureLog.debug('Datamuse adjectives error:', err))
          );
          
          promises.push(
            spotifyService.getGenreArtists(genre, 5)
              .then((artists: any[]) => {
                context.relatedArtists = artists.map((a: any) => a.name);
                context.audioCharacteristics = this.getAudioCharacteristics(genre);
              })
              .catch((err: any) => secureLog.debug('Spotify genre error:', err))
          );
          
          promises.push(
            lastfmService.getGenreVocabulary(genre)
              .then((vocabulary: any) => {
                context.genreTags = vocabulary.descriptiveWords.slice(0, 8);
                context.culturalReferences = this.extractCulturalReferences(vocabulary.descriptiveWords);
              })
              .catch((err: any) => secureLog.debug('Last.fm genre error:', err))
          );
        }
        
        if (mood) {
          promises.push(
            datamuseService.findSimilarWords(mood, 8)
              .then((words: any[]) => {
                context.moodWords = words.map((w: any) => w.word);
              })
              .catch((err: any) => secureLog.debug('Datamuse mood error:', err))
          );
        }
        break;
        
      case 'standard':
        // Moderate context gathering
        if (genre) {
          promises.push(
            datamuseService.findSimilarWords(genre, 6)
              .then((words: any[]) => {
                context.genreKeywords = words.map((w: any) => w.word);
              })
              .catch((err: any) => secureLog.debug('Datamuse genre error:', err))
          );
          
          promises.push(
            spotifyService.getGenreArtists(genre, 3)
              .then((artists: any[]) => {
                context.relatedArtists = artists.map((a: any) => a.name);
              })
              .catch((err: any) => secureLog.debug('Spotify genre error:', err))
          );
        }
        
        if (mood) {
          promises.push(
            datamuseService.findSimilarWords(mood, 4)
              .then((words: any[]) => {
                context.moodWords = words.map((w: any) => w.word);
              })
              .catch((err: any) => secureLog.debug('Datamuse mood error:', err))
          );
        }
        break;
        
      case 'minimal':
        // Basic context with static fallbacks
        context.genreKeywords = this.getStaticGenreKeywords(genre);
        context.moodWords = this.getStaticMoodWords(mood);
        context.audioCharacteristics = this.getAudioCharacteristics(genre || '');
        break;
    }

    // Randomize genre/mood when none specified to get varied API context
    if (!genre && !mood && strategy.contextDepth !== 'minimal') {
      const availableGenres = ['indie', 'alternative', 'pop', 'electronic', 'folk', 'ambient'];
      const availableMoods = ['energetic', 'dreamy', 'uplifting', 'mysterious', 'nostalgic'];
      
      // Randomly pick one to ensure variety while maintaining API context richness
      const shouldUseGenre = Math.random() > 0.5;
      if (shouldUseGenre) {
        const randomGenre = availableGenres[Math.floor(Math.random() * availableGenres.length)];
        secureLog.debug(`Randomized to genre: ${randomGenre} for context diversity`);
        
        promises.push(
          datamuseService.findSimilarWords(randomGenre, 6)
            .then((words: any[]) => {
              context.genreKeywords = words.map((w: any) => w.word);
            })
            .catch((err: any) => secureLog.debug('Random genre context error:', err))
        );
        
        promises.push(
          spotifyService.getGenreArtists(randomGenre, 3)
            .then((artists: any[]) => {
              context.relatedArtists = artists.map((a: any) => a.name);
            })
            .catch((err: any) => secureLog.debug('Random Spotify error:', err))
        );
      } else {
        const randomMood = availableMoods[Math.floor(Math.random() * availableMoods.length)];
        secureLog.debug(`Randomized to mood: ${randomMood} for context diversity`);
        
        promises.push(
          datamuseService.findSimilarWords(randomMood, 4)
            .then((words: any[]) => {
              context.moodWords = words.map((w: any) => w.word);
            })
            .catch((err: any) => secureLog.debug('Random mood context error:', err))
        );
      }
    }

    await Promise.all(promises);
    
    // Cache the result if strategy allows it
    if (strategy.cacheTimeout > 0) {
      this.contextCache.set(cacheKey, {
        context,
        timestamp: Date.now(),
        strategy
      });
    }
    
    secureLog.debug('Gathered context:', {
      genreKeywords: context.genreKeywords.length,
      moodWords: context.moodWords.length,
      relatedArtists: context.relatedArtists.length,
      genreTags: context.genreTags.length
    });

    return context;
  }

  private async generateWithAI(
    context: GenerationContext,
    type: string,
    genre: string | undefined,
    mood: string | undefined,
    count: number = 4,
    wordCount: number | string | undefined,
    strategy: GenerationStrategy = GENERATION_STRATEGIES.QUALITY
  ): Promise<string[]> {
    // Build focused context for grok-4-fast (top 3-5 items per category)
    const focusedContext = {
      topArtists: context.relatedArtists.slice(0, 3),
      topKeywords: [...context.genreKeywords, ...context.moodWords, ...context.genreTags].slice(0, 5),
      topAssociations: context.wordAssociations.slice(0, 3)
    };

    // Build optimized request for NamePromptBuilder
    const request: NameGenerationRequest = {
      type: type as 'band' | 'song',
      genre: genre || 'general',
      mood,
      count,
      wordCount,
      context: focusedContext
    };

    // Get optimized prompt and config from NamePromptBuilder
    const { messages, config } = NamePromptBuilder.buildPrompt(request, strategy);
    
    return await this.generateWithOptimizedXAI(messages, config, count);
  }

  private async generateWithPatterns(
    context: GenerationContext,
    type: string,
    genre: string | undefined,
    mood: string | undefined,
    count: number = 4,
    wordCount: number | string | undefined
  ): Promise<string[]> {
    // Import pattern-based generation components
    const { NameGenerationPatterns } = await import('./nameGeneration/nameGenerationPatterns');
    const { WordSourceBuilder } = await import('./nameGeneration/wordSourceBuilder');
    
    const wordSourceBuilder = new WordSourceBuilder(datamuseService, spotifyService);
    const namePatterns = new NameGenerationPatterns(datamuseService);
    
    // Build word sources from context and convert to proper EnhancedWordSource
    const basicWordSource = {
      adjectives: [...context.genreKeywords, ...context.moodWords].slice(0, 10),
      nouns: [...context.genreTags, ...context.audioCharacteristics].slice(0, 10),
      verbs: ['play', 'sing', 'dance', 'rock', 'groove'].slice(0, 5),
      musicalTerms: context.audioCharacteristics.slice(0, 5),
      contextualWords: context.culturalReferences.slice(0, 5),
      associatedWords: context.wordAssociations.slice(0, 8),
      genreTerms: context.genreTags.slice(0, 5),
      lastfmWords: context.genreTags.slice(0, 3),
      spotifyWords: context.relatedArtists.slice(0, 3),
      conceptNetWords: context.wordAssociations.slice(0, 3)
    };
    
    // Convert to proper EnhancedWordSource with all required filtered properties
    const wordSources = createEnhancedWordSource(basicWordSource);
    
    const normalizedWordCount = typeof wordCount === 'string' && wordCount === "4+" ? 4 : (typeof wordCount === 'number' ? wordCount : 2);
    
    // OPTIMIZED: Use circuit breaker with bulk generation instead of retry loops
    let names: string[] = [];
    
    await this.generationCircuitBreaker.attempt(
      async () => {
        // Generate more names than needed upfront to ensure we get enough unique ones
        const generateCount = Math.max(count * 3, count + 10);
        const candidates: string[] = [];
        
        // Batch generate names to avoid retry loops
        for (let i = 0; i < generateCount; i++) {
          try {
            const result = await namePatterns.generateContextualNameWithCount(
              type,
              normalizedWordCount,
              wordSources,
              mood || undefined,
              genre || undefined
            );
            
            if (result && result.name && !candidates.includes(result.name)) {
              candidates.push(result.name);
            }
          } catch (error) {
            secureLog.debug('Pattern generation error:', error);
            // Continue with other generations instead of failing entirely
          }
        }
        
        // Use efficient sampling to select the needed count
        names = sampleWithoutReplacement(candidates, count);
        
        if (names.length < count) {
          throw new Error(`Generated ${names.length}/${count} names, need fallback`);
        }
      },
      async () => {
        // Graceful fallback: ensure we have the requested count
        secureLog.info(`Using fallback names for remaining ${count - names.length} names`);
        
        const fallbackNames = [
          'Electric Dreams', 'Midnight Echo', 'Golden Hour', 'Neon Lights',
          'Silver Storm', 'Crystal Vision', 'Velvet Thunder', 'Rainbow Fire',
          'Azure Wave', 'Diamond Dust', 'Cosmic Dance', 'Starlight Symphony'
        ];
        
        const needed = count - names.length;
        const fallbackSelected = sampleWithoutReplacement(
          fallbackNames.filter(name => !names.includes(name)), 
          needed
        );
        
        // Fill any remaining slots with unique variations
        while (names.length + fallbackSelected.length < count) {
          const base = fallbackNames[Math.floor(Math.random() * fallbackNames.length)];
          const variation = `${base} ${Math.random().toString(36).substr(2, 3)}`;
          if (!names.includes(variation) && !fallbackSelected.includes(variation)) {
            fallbackSelected.push(variation);
          }
        }
        
        names = [...names, ...fallbackSelected.slice(0, needed)];
      }
    );
    
    return names;
  }

  private buildAIPrompt(
    processedContext: {artists: string, keywords: string, associations: string},
    type: string,
    genre?: string,
    mood?: string,
    count: number = 4,
    wordCount?: number | string,
    strategy: GenerationStrategy = GENERATION_STRATEGIES.QUALITY
  ): string {
    const isband = type === 'band';
    const creativity = strategy.contextDepth === 'comprehensive' ? 'wildly creative' : 'creative';
    
    const basePrompt = `You are a ${creativity} AI that generates original ${isband ? 'band names' : 'song titles'}. Create names that are memorable, fun, and fit the given genre and mood.

Requirements:
- Genre: ${genre || 'general'} 
- Mood: ${mood || 'neutral'}
- Word count: ${this.formatWordCount(wordCount)}
- Make each name unique - don't repeat significant words across different names
- Be original and creative, not copies of existing ${isband ? 'bands' : 'songs'}

${this.getSimpleMoodGuidance(mood)}

Context for inspiration:
- Artists/bands: ${processedContext.artists}
- Keywords: ${processedContext.keywords}
- Associations: ${processedContext.associations}

Generate ${count} creative ${isband ? 'band names' : 'song titles'} in JSON format:

{
  "${isband ? 'band_names' : 'song_titles'}": ["Name 1", "Name 2", "Name 3", "Name 4"]
}`;

    return basePrompt;
  }

  private getSimpleMoodGuidance(mood?: string): string {
    if (!mood) return '';
    
    const guidance: { [key: string]: string } = {
      happy: 'Use bright, energetic words that evoke joy and celebration.',
      sad: 'Use melancholic words that evoke longing or reflection.',
      dark: 'Use mysterious, shadowy words that create atmosphere.',
      angry: 'Use intense, powerful words that convey raw energy.',
      calm: 'Use peaceful, gentle words that suggest tranquility.',
      energetic: 'Use dynamic, high-energy words that pulse with movement.'
    };
    
    return guidance[mood] ? `Mood guidance: ${guidance[mood]}` : '';
  }

  // Simplified context processing methods
  private processContextForVariety(context: GenerationContext, genre?: string): {artists: string, keywords: string, associations: string} {
    return this.processContextBasic(context);
  }

  private processContextBasic(context: GenerationContext): {artists: string, keywords: string, associations: string} {
    // Combine all available keywords for variety
    const allKeywords = [
      ...context.genreKeywords,
      ...context.genreTags, 
      ...context.moodWords,
      ...context.audioCharacteristics
    ];
    
    return {
      artists: context.relatedArtists.slice(0, 3).join(', '),
      keywords: allKeywords.slice(0, 8).join(', '),
      associations: context.wordAssociations.slice(0, 4).join(', ')
    };
  }

  private async generateWithOptimizedXAI(
    messages: Array<{ role: "system" | "user"; content: string }>, 
    config: { model: string; temperature: number; max_tokens: number; response_format: { type: "json_object" } },
    count: number
  ): Promise<string[]> {
    // Enhanced generation with single retry for empty-content cases
    for (let attempt = 1; attempt <= 2; attempt++) {
      const isRetry = attempt > 1;
      const currentTemp = isRetry ? config.temperature + 0.2 : config.temperature; // Bump temperature on retry
      
      try {
        secureLog.info(`🚀 grok-4-fast generation (attempt ${attempt}): ${currentTemp} temp, ${config.max_tokens} tokens${isRetry ? ' (retry with higher temp)' : ''}`);
        
        const response = await this.openai.chat.completions.create({
          model: config.model,
          messages,
          temperature: currentTemp,
          max_tokens: config.max_tokens,
          response_format: config.response_format
        });

        const content = response.choices[0].message.content?.trim();
        if (!content) {
          if (isRetry) {
            throw new Error('No content generated by grok-4-fast after retry');
          }
          secureLog.debug('Empty content on first attempt, retrying with higher temperature');
          continue; // Retry with higher temperature
        }

        // Improved JSON parsing with lightweight retry for grok-4-fast
        let names: string[] = [];
        
        try {
          // Primary parsing: Expect clean JSON due to response_format
          const parsed = JSON.parse(content);
          const extractedNames = parsed.band_names || parsed.song_titles || parsed.names || [];
          
          if (Array.isArray(extractedNames) && extractedNames.length > 0) {
            names = extractedNames
              .filter((name: any) => typeof name === 'string' && name.trim().length > 0)
              .map((name: string) => name.trim())
              .slice(0, count);
            
            secureLog.info(`✅ Clean JSON parsing: extracted ${names.length}/${count} names`);
          } else {
            throw new Error('Invalid JSON structure - no names array found');
          }
        } catch (parseError) {
          // Lightweight retry: Try simpler newline parsing if JSON fails
          secureLog.debug('JSON parsing failed, trying newline fallback');
          
          const lines = content.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0 && !line.startsWith('{') && !line.startsWith('}'))
            .map(line => line.replace(/^[-*•]\s*/, '').replace(/^\d+\.\s*/, '').replace(/['"]/g, '').trim())
            .filter(line => line.length > 2 && line.length < 100);
          
          names = lines.slice(0, count);
          secureLog.info(`⚙️ Fallback parsing: extracted ${names.length}/${count} names`);
        }
        
        // Remove duplicates and ensure minimum quality
        const uniqueNames = [...new Set(names)].filter(name => 
          name.length >= 2 && 
          name.length <= 100 && 
          /^[a-zA-Z0-9\s\-'&.]+$/.test(name)
        );
        
        // Check if we have sufficient results or should retry
        if (uniqueNames.length === 0) {
          if (isRetry) {
            throw new Error('No valid names generated after retry');
          }
          secureLog.debug('No valid names on first attempt, retrying with higher temperature');
          continue; // Retry with higher temperature
        }
        
        // If insufficient results but some found, check if we should retry
        if (uniqueNames.length < count && !isRetry) {
          secureLog.debug(`Generated ${uniqueNames.length}/${count} names on first attempt, retrying for more`);
          continue; // Retry with higher temperature for better results
        }
        
        secureLog.info(`✅ Generation successful: ${uniqueNames.length}/${count} names (attempt ${attempt})`);
        return uniqueNames.slice(0, count);

      } catch (error) {
        if (isRetry) {
          secureLog.error('Optimized XAI generation failed after retry:', error);
          throw error;
        }
        secureLog.debug('Generation error on first attempt, retrying:', error);
        continue; // Retry with higher temperature
      }
    }
    
    // Fallback: If both attempts failed, throw error
    throw new Error('Failed to generate names after retry attempts');
  }

  // Quality scoring for generated names
  private scoreNameQuality(name: string, genre?: string, mood?: string): number {
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
    
    // Alliteration penalty (if excessive)
    const firstLetters = words.map(w => w[0].toLowerCase());
    const mostCommonLetter = firstLetters.sort((a, b) => 
      firstLetters.filter(l => l === b).length - firstLetters.filter(l => l === a).length
    )[0];
    const alliterationCount = firstLetters.filter(l => l === mostCommonLetter).length;
    if (alliterationCount >= 3 && words.length >= 3) score -= 10;
    
    // Length penalty for overly long names
    if (name.length > 40) score -= 10;
    if (name.length > 50) score -= 20;
    
    // Bonus for clever wordplay or puns (basic detection)
    const punIndicators = ['play', 'way', 'sound', 'beat', 'soul', 'bass', 'rock', 'wave'];
    const hasPotentialPun = words.some(word => 
      punIndicators.some(pun => word.includes(pun) && word !== pun)
    );
    if (hasPotentialPun) score += 8;
    
    return Math.max(0, Math.min(100, score));
  }

  private generateBasicFallbackNames(count: number): string[] {
    const basicFallbacks = [
      'Electric Dreams', 'Midnight Echo', 'Golden Hour', 'Neon Lights',
      'Cosmic Voyage', 'Silver Thread', 'Azure Sky', 'Crimson Wave',
      'Velvet Storm', 'Diamond Dust', 'Emerald City', 'Ruby Moon',
      'Sapphire Sound', 'Crystal Vision', 'Amber Glow', 'Jade Wind'
    ];
    return basicFallbacks.slice(0, count);
  }

  private generateFallbackNames(type: string, genre?: string, mood?: string, count: number = 4): Array<{name: string, isAiGenerated: boolean, source: string}> {
    // Curated fallback database with genre/mood variants
    const curatedFallbacks: { [key: string]: { [key: string]: string[] } } = {
      general: {
        neutral: ['Electric Dreams', 'Midnight Echo', 'Golden Hour', 'Neon Lights'],
        happy: ['Sunshine Parade', 'Rainbow Bridge', 'Crystal Celebration', 'Joy Division'],
        sad: ['Rain Shadows', 'Melancholy Moon', 'Broken Compass', 'Silent Rivers'],
        dark: ['Shadow Puppets', 'Void Walkers', 'Obsidian Hearts', 'Phantom Limb'],
        energetic: ['Voltage Spike', 'Kinetic Rush', 'Thunder Squad', 'Pulse Riders']
      },
      rock: {
        neutral: ['Amplifier Gods', 'Distortion Theory', 'Feedback Loop', 'Power Surge'],
        angry: ['Riot Act', 'Broken Chains', 'Rage Cage', 'Rebel Yell'],
        energetic: ['Electric Mayhem', 'Sonic Boom', 'Thunder Strike', 'Velocity']
      },
      indie: {
        neutral: ['Analog Kids', 'Vintage Future', 'Cassette Dreams', 'DIY Orchestra'],
        sad: ['Rainy Day Committee', 'Melancholy Collective', 'Nostalgia Club', 'Fading Polaroids'],
        mysterious: ['Secret Handshake', 'Hidden Tracks', 'Mystery Machine', 'Unknown Sender']
      },
      electronic: {
        neutral: ['Circuit Breakers', 'Digital Natives', 'Pixel Pushers', 'Binary Stars'],
        energetic: ['Bass Drops', 'Frequency Modulation', 'Sync Rate', 'Beat Grid'],
        dark: ['Glitch Mob', 'Dark Web', 'System Error', 'Corrupted Data']
      },
      'jam band': {
        neutral: ['Cosmic Voyage', 'Groove Merchants', 'Festival Circuit', 'Journey Home'],
        happy: ['Sunshine Daydream', 'Good Vibes Tribe', 'Happy Accident', 'Color Wheel'],
        mysterious: ['Space Oddity', 'Mystic Travelers', 'Astral Projection', 'Time Spiral']
      }
    };

    // Select appropriate fallbacks
    const genreFallbacks = curatedFallbacks[genre || 'general'] || curatedFallbacks.general;
    const moodFallbacks = genreFallbacks[mood || 'neutral'] || genreFallbacks.neutral;
    const fallbackNames = [...moodFallbacks];
    
    // Add some general fallbacks if needed
    if (fallbackNames.length < count) {
      fallbackNames.push(
        'Velvet Revolution',
        'Paper Tigers',
        'Mirror Lake',
        'Cloud Nine',
        'Phoenix Rising',
        'Aurora Borealis',
        'Quantum Leap',
        'Time Capsule'
      );
    }

    return fallbackNames.slice(0, count).map(name => ({
      name,
      isAiGenerated: false,
      source: 'fallback'
    }));
  }

  // Static data methods for minimal strategy
  private getStaticGenreKeywords(genre?: string): string[] {
    const keywords: { [key: string]: string[] } = {
      blues: ['soulful', 'raw', 'emotional', 'twelve-bar', 'guitar'],
      rock: ['power', 'electric', 'loud', 'energy', 'guitar'],
      jazz: ['smooth', 'improvisation', 'saxophone', 'swing', 'bebop'],
      pop: ['catchy', 'mainstream', 'melody', 'radio', 'commercial'],
      folk: ['acoustic', 'traditional', 'storytelling', 'roots', 'authentic']
    };
    return keywords[genre || ''] || ['musical', 'creative', 'artistic'];
  }

  private getStaticMoodWords(mood?: string): string[] {
    const moods: { [key: string]: string[] } = {
      happy: ['bright', 'joyful', 'upbeat', 'cheerful', 'positive'],
      sad: ['melancholy', 'somber', 'blue', 'tearful', 'heartbreak'],
      angry: ['fierce', 'rage', 'intense', 'furious', 'rebellious'],
      calm: ['peaceful', 'serene', 'gentle', 'quiet', 'soothing'],
      dark: ['shadow', 'midnight', 'mysterious', 'haunting', 'deep']
    };
    return moods[mood || ''] || ['emotional', 'expressive'];
  }

  // Utility methods from IntelligentNameGeneratorService
  private formatWordCount(wordCount?: number | string): string {
    if (!wordCount) return 'any';
    if (wordCount === '4+' || wordCount === 4.1) return '4-10';
    return wordCount.toString();
  }

  private isValidWordCount(actualCount: number, requestedCount: number | string): boolean {
    if (!requestedCount) return true;
    if (requestedCount === '4+' || requestedCount === 4.1) {
      return actualCount >= 4 && actualCount <= 10;
    }
    
    const targetCount = Number(requestedCount);
    const tolerance = targetCount <= 3 ? 1 : 2;
    return Math.abs(actualCount - targetCount) <= tolerance;
  }

  private convertToLegacyContext(optimizedContext: OptimizedContext): GenerationContext {
    return {
      genreKeywords: optimizedContext.genreKeywords || [],
      moodWords: optimizedContext.moodWords || [],
      relatedArtists: optimizedContext.relatedArtists || [],
      genreTags: optimizedContext.genreTags || [],
      wordAssociations: optimizedContext.wordAssociations || [],
      audioCharacteristics: optimizedContext.audioCharacteristics || [],
      culturalReferences: optimizedContext.culturalReferences || []
    };
  }

  private getSourceName(strategy: GenerationStrategy): string {
    if (strategy.useAI) {
      return strategy.contextDepth === 'comprehensive' ? 'intelligent' : 
             strategy.contextDepth === 'standard' ? 'balanced' : 'fast-ai';
    } else {
      return 'optimized';
    }
  }

  private getAudioCharacteristics(genre: string): string[] {
    const characteristics: { [key: string]: string[] } = {
      rock: ['high energy', 'guitar-driven', 'powerful drums', 'raw vocals'],
      pop: ['catchy melodies', 'danceable beats', 'polished production', 'radio-friendly'],
      indie: ['alternative sound', 'artistic expression', 'experimental elements', 'authentic feel'],
      electronic: ['synthesized sounds', 'digital production', 'rhythmic patterns', 'ambient textures'],
      hip_hop: ['strong beats', 'rhythmic vocals', 'urban culture', 'contemporary themes'],
      folk: ['acoustic instruments', 'storytelling', 'traditional roots', 'organic sound'],
      jazz: ['improvisation', 'complex harmonies', 'swing rhythms', 'instrumental focus'],
      classical: ['orchestral arrangements', 'composed structure', 'formal precision', 'timeless elegance'],
      'jam band': ['improvisation', 'extended jams', 'psychedelic elements', 'festival culture']
    };
    
    return characteristics[genre] || ['musical expression', 'creative sound', 'artistic vision'];
  }

  private extractCulturalReferences(words: string[]): string[] {
    const cultural = words.filter(word => 
      word.includes('90s') || word.includes('80s') || word.includes('70s') ||
      word.includes('american') || word.includes('british') || word.includes('classic') ||
      word.includes('modern') || word.includes('contemporary') || word.includes('vintage')
    );
    return cultural.slice(0, 5);
  }


  // Apply repetition filtering to remove duplicate words across names
  private applyRepetitionFiltering(names: string[], generationId: string, nameType?: string): string[] {
    const filteredNames: string[] = [];
    
    for (const name of names) {
      if (!unifiedWordFilter.shouldRejectName(name, generationId, nameType)) {
        filteredNames.push(name);
      } else {
        secureLog.debug(`Filtered out repetitive name: "${name}"`);
      }
    }
    
    secureLog.info(`Repetition filtering: ${names.length} → ${filteredNames.length} names (${names.length - filteredNames.length} filtered)`);
    return filteredNames;
  }

  /**
   * Generate names using cross-genre fusion system
   */
  private async generateWithCrossGenreFusion(
    request: GenerateNameRequest, 
    strategy: GenerationStrategy,
    generationId: string,
    operationId: string
  ): Promise<Array<{name: string, isAiGenerated: boolean, source: string}>> {
    const { 
      type, genre, secondaryGenre, mood, count = 4, wordCount,
      fusionIntensity = 'moderate', 
      creativityLevel = 'balanced',
      preserveAuthenticity = true,
      culturalSensitivity = true
    } = request;

    secureLog.info(`🎨 Cross-genre fusion: ${genre} + ${secondaryGenre} (${fusionIntensity} intensity, ${creativityLevel} creativity)`);

    try {
      // 1. Gather enhanced context for both genres
      const context = await this.gatherContextWithStrategy(genre, mood, type, strategy);
      
      // Convert GenerationContext to the expected enhanced word source format
      const basicWordSource = {
        adjectives: [...context.genreKeywords, ...context.moodWords].slice(0, 10),
        nouns: [...context.genreTags, ...context.audioCharacteristics].slice(0, 10),
        verbs: ['play', 'sing', 'dance', 'rock', 'groove'].slice(0, 5),
        musicalTerms: context.audioCharacteristics.slice(0, 5),
        contextualWords: context.culturalReferences.slice(0, 5),
        associatedWords: context.wordAssociations.slice(0, 8),
        genreTerms: context.genreTags.slice(0, 5),
        lastfmWords: context.genreTags.slice(0, 3),
        spotifyWords: context.relatedArtists.slice(0, 3),
        conceptNetWords: context.wordAssociations.slice(0, 3)
      };
      
      const sources = createEnhancedWordSource(basicWordSource);

      // 2. Build cross-genre fusion request
      const fusionRequest: CrossGenreFusionRequest = {
        primaryGenre: genre as GenreType,
        secondaryGenre: secondaryGenre as GenreType,
        mood,
        wordCount: wordCount === '4+' ? 5 : (wordCount || 2),
        count: Math.max(count * 2, 8), // Generate more for filtering
        fusionIntensity,
        creativityLevel,
        preserveAuthenticity,
        targetAudience: strategy.contextDepth === 'comprehensive' ? 'experimental' : 'mainstream'
      };

      // 3. Generate fused names using cross-genre fusion engine
      const fusionResults = await crossGenreFusionEngine.generateFusedNames(fusionRequest, sources);
      secureLog.info(`🎨 Fusion engine generated ${fusionResults.length} names`);

      if (fusionResults.length === 0) {
        throw new Error('Cross-genre fusion engine returned no results');
      }

      // 4. Convert fusion results to unified format
      let generatedNames = fusionResults.map((result: CrossGenreFusionResult, index: number) => ({
        name: result.name,
        isAiGenerated: false, // Fusion is pattern-based, not AI
        source: `fusion_${result.fusionMetadata.fusionStyle}`,
        qualityScore: result.qualityScore,
        fusionMetadata: result.fusionMetadata,
        sortOrder: index
      }));

      // 5. Apply intelligent sorting - prioritize quality and authenticity
      generatedNames.sort((a, b) => {
        // Primary sort: Quality score (higher is better)
        if (Math.abs(a.qualityScore - b.qualityScore) > 0.1) {
          return b.qualityScore - a.qualityScore;
        }
        // Secondary sort: Authenticity if preserveAuthenticity is true
        if (preserveAuthenticity) {
          const authDiff = b.fusionMetadata.authenticity - a.fusionMetadata.authenticity;
          if (Math.abs(authDiff) > 0.1) {
            return authDiff;
          }
        }
        // Tertiary sort: Innovation factor for creative requests
        if (creativityLevel === 'innovative' || creativityLevel === 'revolutionary') {
          return b.fusionMetadata.innovationFactor - a.fusionMetadata.innovationFactor;
        }
        // Default: Original order
        return a.sortOrder - b.sortOrder;
      });

      // 6. Apply repetition filtering
      let filteredNames = this.applyRepetitionFiltering(
        generatedNames.map(n => n.name), 
        generationId, 
        type
      );

      // 7. Ensure we have enough names
      if (filteredNames.length < count) {
        const needed = count - filteredNames.length;
        secureLog.info(`🎨 Need ${needed} more fusion names, generating additional batch`);

        // Generate more with slightly different parameters
        const additionalRequest = {
          ...fusionRequest,
          count: needed * 2,
          fusionIntensity: fusionIntensity === 'subtle' ? 'moderate' : fusionIntensity,
          creativityLevel: creativityLevel === 'conservative' ? 'balanced' : creativityLevel
        };

        const additionalResults = await crossGenreFusionEngine.generateFusedNames(additionalRequest, sources);
        const additionalFiltered = this.applyRepetitionFiltering(
          additionalResults.map(r => r.name),
          generationId,
          type
        );

        filteredNames.push(...additionalFiltered.slice(0, needed));
      }

      // 8. Final selection and tracking
      const finalNames = filteredNames.slice(0, count);
      
      // Track generated names in the filter
      finalNames.forEach(name => unifiedWordFilter.acceptName(name, generationId));

      // Record performance metrics
      performanceMonitor.endOperation(operationId, {
        success: true,
        fusionGenerated: finalNames.length,
        fusionEngine: 'cross_genre_fusion',
        primaryGenre: genre,
        secondaryGenre: secondaryGenre,
        fusionIntensity,
        creativityLevel
      });

      secureLog.info(`🎨 Cross-genre fusion successful: Generated ${finalNames.length} ${genre}-${secondaryGenre} fusion names`);

      return finalNames.map(name => ({
        name,
        isAiGenerated: false,
        source: `fusion_${genre}_${secondaryGenre}`
      }));

    } catch (error) {
      secureLog.error('Cross-genre fusion generation failed:', error);
      
      // Record failure metrics
      performanceMonitor.endOperation(operationId, {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown fusion error',
        fusionEngine: 'cross_genre_fusion_failed'
      });

      throw error; // Let the main method handle fallback
    }
  }

}

// Singleton instance with aggressive caching configuration
class CachedUnifiedNameGeneratorService extends UnifiedNameGeneratorService {
  private aggressiveCache = new Map<string, { names: string[], timestamp: number }>();
  private readonly AGGRESSIVE_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

  async generateNames(
    request: GenerateNameRequest, 
    strategy: GenerationStrategy = GENERATION_STRATEGIES.QUALITY
  ): Promise<Array<{name: string, isAiGenerated: boolean, source: string}>> {
    // Create cache key from request parameters
    const cacheKey = `${request.type}-${request.genre}-${request.mood}-${request.wordCount}-${request.count}`;
    
    // Check aggressive cache for speed mode
    if (strategy.contextDepth === 'minimal') {
      const cached = this.aggressiveCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < this.AGGRESSIVE_CACHE_TTL) {
        secureLog.debug('Using aggressive cache for speed mode');
        
        // Start new generation to ensure proper word tracking
        const generationId = unifiedWordFilter.startNewGeneration();
        const cachedNames = cached.names.slice(0, request.count || 4);
        
        // Track cached names in the filter to maintain consistency
        cachedNames.forEach(name => unifiedWordFilter.acceptName(name, generationId));
        
        return cachedNames.map(name => ({
          name,
          isAiGenerated: false,
          source: 'cached'
        }));
      }
    }
    
    // Generate names using parent method
    const result = await super.generateNames(request, strategy);
    
    // Store in aggressive cache
    if (result.length > 0) {
      this.aggressiveCache.set(cacheKey, {
        names: result.map(r => r.name),
        timestamp: Date.now()
      });
      
      // Clean old cache entries
      if (this.aggressiveCache.size > 100) {
        const now = Date.now();
        for (const [key, value] of this.aggressiveCache.entries()) {
          if (now - value.timestamp > this.AGGRESSIVE_CACHE_TTL) {
            this.aggressiveCache.delete(key);
          }
        }
      }
    }
    
    return result;
  }
}

export const unifiedNameGenerator = new CachedUnifiedNameGeneratorService();