import type { GenerateNameRequest } from "@shared/schema";
import type { AINameGeneratorService } from "./aiNameGenerator";
import { enhancedNameGenerator } from "./enhancedNameGenerator";
import { unifiedWordFilter } from "./nameGeneration/unifiedWordFilter";
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

  constructor() {
    // Initialize without AI dependency to avoid circular imports
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

  // Main generation method - routes between AI and Datamuse API
  async generateNames(request: GenerateNameRequest): Promise<Array<{name: string, isAiGenerated: boolean, source: string}>> {
    const { count = DEFAULT_GENERATION_COUNT } = request;
    
    // Start new generation session for word filtering
    const generationId = unifiedWordFilter.startNewGeneration();
    
    // Calculate AI vs Datamuse split
    const aiCount = Math.floor(count * AI_GENERATION_SPLIT);
    const datamuseCount = count - aiCount;

    secureLog.info(`🎯 Generating ${count} names: ${aiCount} AI + ${datamuseCount} Datamuse`);

    const results: Array<{name: string, isAiGenerated: boolean, source: string}> = [];

    // Generate AI names if available and requested
    if (aiCount > 0 && this.aiNameGenerator) {
      try {
        // Get context examples from Spotify/Last.fm if genre is specified
        let contextExamples: string[] = [];
        if (request.genre) {
          // Get real examples from enhanced name generator's API sources
          const generationContext = await enhancedNameGenerator.getGenerationContext(request.mood, request.genre);
          // Combine artist names from Spotify, Last.fm, and ConceptNet for context
          contextExamples = [...generationContext.spotifyContext, ...generationContext.lastfmContext, ...generationContext.conceptNetContext]
            .filter(w => w.length > MIN_WORD_LENGTH_FOR_CONTEXT && !w.includes(' ')) // Filter for quality
            .slice(0, MAX_CONTEXT_EXAMPLES);
        }
        
        // Generate AI names with retry logic
        const acceptedAiResults = await this.generateWithRetry(
          aiCount,
          AI_RETRY_MULTIPLIER,
          async () => this.aiNameGenerator!.generateAIName(
            request.type, 
            request.genre, 
            request.mood, 
            request.wordCount, 
            contextExamples
          ),
          generationId,
          'AI'
        );
        
        results.push(...acceptedAiResults);
        secureLog.info(`✅ Generated ${acceptedAiResults.length}/${aiCount} AI names`);
      } catch (error) {
        secureLog.warn("AI generation failed, using Datamuse fallback:", error);
        // Fallback to Datamuse if AI fails
        const fallbackResults = await enhancedNameGenerator.generateEnhancedNames({
          ...request,
          count: aiCount
        });
        results.push(...fallbackResults);
      }
    }

    // Generate Datamuse names for the remainder
    if (datamuseCount > 0) {
      try {
        // Get context for Datamuse generation too
        let datamuseContext: string[] = [];
        if (request.genre || request.mood) {
          const generationContext = await enhancedNameGenerator.getGenerationContext(request.mood, request.genre);
          datamuseContext = [
            ...generationContext.spotifyContext, 
            ...generationContext.lastfmContext, 
            ...generationContext.conceptNetContext
          ].filter(w => w.length > 2);
          secureLog.debug(`📚 Datamuse using context: ${datamuseContext.length} words`);
        }
        
        // Generate Datamuse names with retry logic
        const acceptedDatamuseResults = await this.generateWithRetry(
          datamuseCount,
          DATAMUSE_RETRY_MULTIPLIER,
          async () => {
            const results = await enhancedNameGenerator.generateEnhancedNames({
              ...request,
              count: 1 // Generate one at a time for better filtering control
            }, datamuseContext);
            return results[0] || null;
          },
          generationId,
          'Datamuse'
        );
        
        results.push(...acceptedDatamuseResults);
      } catch (error) {
        secureLog.warn("Datamuse generation failed:", error);
        // Provide simple fallback names if both systems fail
        const fallbackNames = this.generateSimpleFallback(request.type, datamuseCount);
        results.push(...fallbackNames);
      }
    }

    return results.slice(0, count);
  }

  // Simple fallback when both AI and Datamuse fail
  private generateSimpleFallback(type: string, count: number): Array<{name: string, isAiGenerated: boolean, source: string}> {
    const fallbackNames = type === 'band' 
      ? ['The Phoenix', 'Storm Rising', 'Electric Dreams', 'Shadow Fire', 'Crystal Echo']
      : ['Rising Storm', 'Electric Night', 'Shadow Dance', 'Crystal Light', 'Phoenix Song'];
    
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
      
      console.log(`🎯 Setlist generation: ${aiCount} AI + ${datamuseCount} Datamuse songs`);
      
      const results: Array<{name: string, isAiGenerated: boolean, source: string}> = [];
      
      // Generate AI songs if available and requested
      if (aiCount > 0 && this.aiNameGenerator) {
        try {
          // Get enhanced context from all sources (Spotify, Last.fm, ConceptNet)
          let contextExamples: string[] = [];
          if (enhancedRequest.genre) {
            const generationContext = await enhancedNameGenerator.getGenerationContext(enhancedRequest.mood, enhancedRequest.genre);
            contextExamples = [...generationContext.spotifyContext, ...generationContext.lastfmContext, ...generationContext.conceptNetContext]
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
          console.log(`✅ Generated ${aiResultsArray.length} AI setlist songs`);
        } catch (error) {
          console.error("AI setlist generation failed, using enhanced Datamuse fallback:", error);
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
        
        console.log(`✅ Generated ${results.length - aiCount} enhanced Datamuse setlist songs`);
      }
      
      // Final check: ensure we have exactly the number of songs requested
      if (results.length < totalCount) {
        const stillNeeded = totalCount - results.length;
        console.log(`⚠️ Still need ${stillNeeded} more songs, adding fallback...`);
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