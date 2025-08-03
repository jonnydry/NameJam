import type { GenerateNameRequest } from "@shared/schema";
import type { AINameGeneratorService } from "./aiNameGenerator";
import { enhancedNameGenerator } from "./enhancedNameGenerator";
import { unifiedWordFilter } from "./nameGeneration/unifiedWordFilter";
import { poetryDbService } from "./poetryDbService";
import { ContextAggregatorService } from "./contextAggregator";
import { OptimizedContextAggregatorService } from "./optimizedContextAggregator";
import { secureLog } from "../utils/secureLogger";
import { 
  DEFAULT_GENERATION_COUNT, 
  AI_GENERATION_SPLIT,
  AI_RETRY_MULTIPLIER, 
  DATAMUSE_RETRY_MULTIPLIER, 
  BATCH_GENERATION_MULTIPLIER,
  MAX_CONTEXT_EXAMPLES,
  MIN_WORD_LENGTH_FOR_CONTEXT 
} from "./nameGeneration/constants";

export class NameGeneratorService {
  private aiNameGenerator: AINameGeneratorService | null = null;
  private contextAggregator: ContextAggregatorService;

  constructor() {
    // Initialize with optimized context aggregator for better performance
    this.contextAggregator = new OptimizedContextAggregatorService();
  }

  setAINameGenerator(aiService: AINameGeneratorService) {
    this.aiNameGenerator = aiService;
  }

  /**
   * Shared retry logic for name generation with word filtering
   */
  private async generateWithRetry(
    targetCount: number,
    retryMultiplier: number,
    generateFunction: () => Promise<string | { name: string; isAiGenerated: boolean; source: string } | null>,
    generationId: string,
    source: string
  ): Promise<Array<{name: string, isAiGenerated: boolean, source: string}>> {
    const maxAttempts = targetCount * retryMultiplier;
    let attempts = 0;
    const acceptedResults: Array<{name: string, isAiGenerated: boolean, source: string}> = [];
    
    while (acceptedResults.length < targetCount && attempts < maxAttempts) {
      const batchSize = Math.min(targetCount * BATCH_GENERATION_MULTIPLIER, maxAttempts - attempts);
      const promises = Array(batchSize).fill(null).map(() => 
        generateFunction().catch(error => {
          secureLog.warn(`${source} generation failed:`, error);
          return null;
        })
      );
      
      const batchResults = (await Promise.all(promises)).filter(result => result !== null);
      attempts += batchSize;
      
      // Process batch results
      for (const result of batchResults) {
        if (acceptedResults.length >= targetCount) break;
        
        // Handle both string results (AI) and object results (Datamuse)
        const name = typeof result === 'string' ? result : result.name;
        const isAiGenerated = source === 'AI';
        
        if (!unifiedWordFilter.shouldRejectName(name, generationId)) {
          unifiedWordFilter.acceptName(name, generationId);
          acceptedResults.push({
            name,
            isAiGenerated,
            source: source.toLowerCase()
          });
        } else {
          secureLog.debug(`🚫 ${source} name filtered: "${name}"`);
        }
      }
    }
    
    secureLog.info(`✅ Generated ${acceptedResults.length}/${targetCount} ${source} names (after filtering, ${attempts} attempts)`);
    return acceptedResults;
  }

  // Main generation method - optimized for sub-10 second response
  async generateNames(request: GenerateNameRequest): Promise<Array<{name: string, isAiGenerated: boolean, source: string}>> {
    const { count = DEFAULT_GENERATION_COUNT } = request;
    
    // Start new generation session for word filtering
    const generationId = unifiedWordFilter.startNewGeneration();

    // Check if we should use ultra-optimized mode for instant response
    if (!request.genre) {
      secureLog.info(`⚡ Using ultra-optimized mode for no specific genre`);
      const { UltraOptimizedNameGeneratorService } = await import('./ultraOptimizedNameGenerator');
      const ultraGenerator = new UltraOptimizedNameGeneratorService();
      const names = await ultraGenerator.generateNames(request);
      return names.map(n => ({ ...n, source: 'ultra' }));
    }

    secureLog.info(`🎯 Generating ${count} names with minimal context for speed`);

    const results: Array<{name: string, isAiGenerated: boolean, source: string}> = [];

    // Generate names with minimal context for speed
    if (this.aiNameGenerator) {
      try {
        // Skip heavy API calls - use minimal context
        const minimalContext = {
          spotifyArtists: [],
          spotifyTracks: [],
          lastfmTags: [request.genre || 'music'],
          lastfmSimilarArtists: [],
          conceptNetAssociations: [request.mood || 'creative'],
          datamuseWords: {
            related: ['music', 'sound', 'rhythm'],
            rhymes: [],
            similar: [],
            adjectives: []
          },
          poetryVocabulary: [],
          genreCharacteristics: [request.genre || 'general'],
          moodDescriptors: [request.mood || 'neutral'],
          musicalTerms: ['song', 'band'],
          culturalReferences: [],
          primaryGenre: request.genre || 'general',
          primaryMood: request.mood || 'neutral',
          contextQuality: 'basic' as const
        };
        
        // Generate with proper retries
        const acceptedAiResults = await this.generateWithRetry(
          count,
          AI_RETRY_MULTIPLIER,
          async () => this.aiNameGenerator!.generateAIName(
            request.type, 
            request.genre, 
            request.mood, 
            request.wordCount, 
            undefined,
            minimalContext
          ),
          generationId,
          'AI'
        );
        
        results.push(...acceptedAiResults);
        
        // If not enough results, use ultra-optimized fallback
        if (results.length < count) {
          secureLog.info(`Using ultra-optimized fallback for remaining ${count - results.length} names`);
          const { UltraOptimizedNameGeneratorService } = await import('./ultraOptimizedNameGenerator');
          const ultraGenerator = new UltraOptimizedNameGeneratorService();
          const fallbackNames = await ultraGenerator.generateNames({ ...request, count: count - results.length });
          results.push(...fallbackNames.map(n => ({ ...n, source: 'ultra' })));
        }
      } catch (error) {
        secureLog.warn("AI generation failed, using ultra-optimized fallback:", error);
        const { UltraOptimizedNameGeneratorService } = await import('./ultraOptimizedNameGenerator');
        const ultraGenerator = new UltraOptimizedNameGeneratorService();
        const names = await ultraGenerator.generateNames(request);
        return names.map(n => ({ ...n, source: 'ultra' }));
      }
    } else {
      // Use ultra-optimized generator when AI not available
      const { UltraOptimizedNameGeneratorService } = await import('./ultraOptimizedNameGenerator');
      const ultraGenerator = new UltraOptimizedNameGeneratorService();
      const names = await ultraGenerator.generateNames(request);
      return names.map(n => ({ ...n, source: 'ultra' }));
    }

    // Final check: ensure we have exactly the requested number of results
    if (results.length < count) {
      secureLog.warn(`Only generated ${results.length}/${count} names, adding simple fallback`);
      const remaining = count - results.length;
      const fallbackResults = this.generateSimpleFallback(request.type, remaining);
      results.push(...fallbackResults);
    }
    
    return results.slice(0, count);
  }

  // Simple fallback when both AI and Datamuse fail
  private generateSimpleFallback(type: string, count: number): Array<{name: string, isAiGenerated: boolean, source: string}> {
    // Generate unique fallback names with timestamp to avoid "taken" status
    const timestamp = Date.now();
    const uniqueSuffix = timestamp.toString().slice(-4);
    
    const baseFallbackBand = ['Mystic Echoes', 'Quantum Drift', 'Nebula Rising', 'Astral Void', 'Cosmic Flux'];
    const baseFallbackSong = ['Stellar Dreams', 'Quantum Leap', 'Nebula Dance', 'Astral Light', 'Cosmic Wave'];
    
    const fallbackNames = type === 'band' 
      ? baseFallbackBand.map(name => `${name} ${uniqueSuffix}`)
      : baseFallbackSong.map(name => `${name} ${uniqueSuffix}`);
    
    return Array.from({ length: count }, (_, i) => ({
      name: fallbackNames[i % fallbackNames.length],
      isAiGenerated: false,
      source: 'fallback'
    }));
  }

  // Enhanced setlist generation with AI and full feature integration
  async generateSetlistNames(request: GenerateNameRequest): Promise<Array<{name: string, isAiGenerated: boolean, source: string}>> {
    secureLog.info(`🎵 Generating enhanced setlist songs with AI + Datamuse + ConceptNet integration`);
    
    try {
      // Use the same enhanced generation as main names but with song focus
      const enhancedRequest = {
        ...request,
        type: 'song' as const,
        count: request.count || 1
      };
      
      // For setlists, use 30% AI, 70% traditional for more variety while maintaining quality
      const totalCount = enhancedRequest.count;
      const aiCount = Math.floor(totalCount * 0.3); // 30% AI
      const datamuseCount = totalCount - aiCount;
      
      secureLog.info(`🎯 Setlist generation: ${aiCount} AI + ${datamuseCount} Datamuse songs`);
      
      const results: Array<{name: string, isAiGenerated: boolean, source: string}> = [];
      
      // Generate AI songs if available and requested
      if (aiCount > 0 && this.aiNameGenerator) {
        try {
          // Get enhanced context from all sources (Spotify, Last.fm, ConceptNet)
          let contextExamples: string[] = [];
          if (enhancedRequest.genre) {
            const generationContext = await enhancedNameGenerator.getGenerationContext(enhancedRequest.mood, enhancedRequest.genre);
            contextExamples = [...generationContext.spotifyContext, ...generationContext.lastfmContext, ...generationContext.conceptNetContext, ...generationContext.poetryContext]
              .filter(w => w.length > 2 && !w.includes(' '))
              .slice(0, 15);
          }
          
          // Generate AI songs with setlist-specific context
          const aiResults = [];
          const wordCountOptions = [1, 2, 3, 4, 5, 6];
          const weights = [0.1, 0.2, 0.3, 0.25, 0.1, 0.05]; // Favor 2-4 words
          
          for (let i = 0; i < aiCount; i++) {
            // Select a random word count
            const rand = Math.random();
            let cumulative = 0;
            let selectedWordCount = 3; // default
            
            for (let j = 0; j < weights.length; j++) {
              cumulative += weights[j];
              if (rand <= cumulative) {
                selectedWordCount = wordCountOptions[j];
                break;
              }
            }
            
            const name = await this.aiNameGenerator.generateAIName(
              enhancedRequest.type, 
              enhancedRequest.genre, 
              enhancedRequest.mood, 
              selectedWordCount, 
              contextExamples
            );
            aiResults.push(name);
          }
          
          const aiResultsArray = aiResults.map(name => ({
            name,
            isAiGenerated: true,
            source: 'ai'
          }));
          
          results.push(...aiResultsArray);
          secureLog.info(`✅ Generated ${aiResultsArray.length} AI setlist songs`);
        } catch (error) {
          secureLog.error("AI setlist generation failed, using enhanced Datamuse fallback:", error);
          // Enhanced fallback with ConceptNet and Datamuse
          const fallbackResults = await enhancedNameGenerator.generateEnhancedNames({
            ...enhancedRequest,
            count: aiCount
          });
          results.push(...fallbackResults);
        }
      }
      
      // Generate enhanced Datamuse songs for the remainder
      if (datamuseCount > 0) {
        // Generate songs with varied word counts for more interesting setlists
        const wordCountOptions = [1, 2, 3, 4, 5, 6];
        const weights = [0.1, 0.2, 0.3, 0.25, 0.1, 0.05]; // Favor 2-4 words
        
        let generatedDatamuseSongs = 0;
        let attempts = 0;
        const maxAttempts = datamuseCount * 3; // Allow extra attempts
        
        while (generatedDatamuseSongs < datamuseCount && attempts < maxAttempts) {
          attempts++;
          
          // Select a random word count based on weights
          const rand = Math.random();
          let cumulative = 0;
          let selectedWordCount = 3; // default fallback
          
          for (let j = 0; j < weights.length; j++) {
            cumulative += weights[j];
            if (rand <= cumulative) {
              selectedWordCount = wordCountOptions[j];
              break;
            }
          }
          
          const songResults = await enhancedNameGenerator.generateEnhancedNames({
            ...enhancedRequest,
            wordCount: selectedWordCount,
            count: 1
          });
          
          if (songResults.length > 0) {
            results.push(songResults[0]);
            generatedDatamuseSongs++;
          }
        }
        
        // If we still don't have enough songs, use simple fallback
        if (generatedDatamuseSongs < datamuseCount) {
          const remaining = datamuseCount - generatedDatamuseSongs;
          const fallbackSongs = this.generateSimpleFallback('song', remaining);
          results.push(...fallbackSongs);
        }
        
        secureLog.info(`✅ Generated ${results.length - aiCount} enhanced Datamuse setlist songs`);
      }
      
      // Final check: ensure we have exactly the number of songs requested
      if (results.length < totalCount) {
        const stillNeeded = totalCount - results.length;
        secureLog.info(`⚠️ Still need ${stillNeeded} more songs, adding fallback...`);
        const extraFallback = this.generateSimpleFallback('song', stillNeeded);
        results.push(...extraFallback);
      }
      
      return results.slice(0, totalCount); // Ensure exact count
      
    } catch (error) {
      console.error("Enhanced setlist generation failed:", error);
      return this.generateSimpleFallback(request.type, request.count || 1);
    }
  }
}

export const nameGenerator = new NameGeneratorService();