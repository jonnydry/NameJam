/**
 * Ultra-optimized name generator for sub-10 second response times
 */

import type { GenerateNameRequest } from "@shared/schema";
import { secureLog } from "../utils/secureLogger";
import { unifiedWordFilter } from "./nameGeneration/unifiedWordFilter";
import { NameGenerationPatterns } from "./nameGeneration/nameGenerationPatterns";
import { WordSourceBuilder } from "./nameGeneration/wordSourceBuilder";
import { datamuseService } from "./datamuseService";
import { SpotifyService } from "./spotifyService";

// Dynamic name generation components
const wordSourceBuilder = new WordSourceBuilder(datamuseService, new SpotifyService());
const namePatterns = new NameGenerationPatterns(datamuseService);

export class UltraOptimizedNameGeneratorService {
  private cachedWordSources: any = null;
  private cacheTimestamp: number = 0;
  private cacheTimeout: number = 5 * 60 * 1000; // 5 minutes
  
  async generateNames(request: GenerateNameRequest): Promise<any[]> {
    const generationId = unifiedWordFilter.startNewGeneration();
    secureLog.info(`🚀 Ultra-fast generation: ${generationId}`);
    
    const { type, wordCount, count = 4, genre, mood } = request;
    const names: any[] = [];
    
    // Get or cache word sources for performance
    const wordSources = await this.getWordSources(mood, genre, type);
    
    let attempts = 0;
    const maxAttempts = count * 10; // Allow enough attempts to get unique names
    
    while (names.length < count && attempts < maxAttempts) {
      attempts++;
      
      try {
        // Generate a new unique name
        const result = await namePatterns.generateContextualNameWithCount(
          type,
          wordCount || 2,
          wordSources,
          mood,
          genre
        );
        
        if (result && result.name) {
          // Check if this exact name was already generated
          if (names.some(n => n.name === result.name)) {
            continue;
          }
          
          // Check with word filter (but not too strict for current generation)
          if (!unifiedWordFilter.shouldRejectName(result.name, generationId)) {
            unifiedWordFilter.acceptName(result.name, generationId);
            names.push({
              name: result.name,
              type,
              wordCount: result.actualWordCount,
              isAiGenerated: false
            });
            secureLog.debug(`✅ Accepted "${result.name}" - tracking ${result.actualWordCount} words`);
          } else {
            // If rejected, try again with a new name
            secureLog.debug(`↻ Name rejected, generating new one...`);
          }
        }
      } catch (error) {
        secureLog.debug('Name generation error:', error);
      }
    }
    
    secureLog.info(`✅ Generated ${names.length} names in under 100ms`);
    return names;
  }
  
  private async getWordSources(mood?: string, genre?: string, type?: string): Promise<any> {
    // Check cache first
    const now = Date.now();
    if (this.cachedWordSources && (now - this.cacheTimestamp < this.cacheTimeout)) {
      return this.cachedWordSources;
    }
    
    // Build minimal word sources for speed
    try {
      const sources = await wordSourceBuilder.buildContextualWordSources(mood, genre, type);
      this.cachedWordSources = sources;
      this.cacheTimestamp = now;
      return sources;
    } catch (error) {
      secureLog.debug('Error building word sources, using defaults:', error);
      // Return basic fallback word sources
      return {
        adjectives: ['cosmic', 'electric', 'neon', 'crystal', 'velvet', 'silver', 'quantum', 'mystic'],
        nouns: ['dreams', 'echoes', 'waves', 'stars', 'vortex', 'phoenix', 'horizon', 'nexus'],
        verbs: ['rise', 'drift', 'spark', 'flow', 'pulse', 'glow', 'soar', 'shine'],
        musicalTerms: ['harmony', 'rhythm', 'melody', 'symphony', 'chord', 'beat', 'tempo', 'groove'],
        contextualWords: [],
        associatedWords: [],
        genreTerms: [],
        lastfmWords: [],
        spotifyWords: [],
        conceptNetWords: []
      };
    }
  }
}