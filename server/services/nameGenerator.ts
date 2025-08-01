import type { GenerateNameRequest } from "@shared/schema";
import type { AINameGeneratorService } from "./aiNameGenerator";
import { enhancedNameGenerator } from "./enhancedNameGenerator";
import { secureLog } from "../utils/secureLogger";

export class NameGeneratorService {
  private aiNameGenerator: AINameGeneratorService | null = null;

  constructor() {
    // Initialize without AI dependency to avoid circular imports
  }

  setAINameGenerator(aiService: AINameGeneratorService) {
    this.aiNameGenerator = aiService;
  }

  // Main generation method - routes between AI and Datamuse API
  async generateNames(request: GenerateNameRequest): Promise<Array<{name: string, isAiGenerated: boolean, source: string}>> {
    const { count = 8 } = request;
    
    // Calculate AI vs Datamuse split (50% AI, 50% Datamuse)
    const aiCount = Math.floor(count / 2); // Half the names from AI
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
            .filter(w => w.length > 2 && !w.includes(' ')) // Filter for quality
            .slice(0, 15); // Increased to 15 examples for richer context
        }
        
        // Generate multiple AI names sequentially to ensure anti-repetition works
        const aiResults = [];
        for (let i = 0; i < aiCount; i++) {
          const name = await this.aiNameGenerator.generateAIName(request.type, request.genre, request.mood, request.wordCount, contextExamples);
          aiResults.push(name);
        }
        
        const aiResultsArray = aiResults.map(name => ({
          name,
          isAiGenerated: true,
          source: 'ai'
        }));
        
        results.push(...aiResultsArray);
        secureLog.info(`✅ Generated ${aiResultsArray.length} AI names`);
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
        
        const datamuseResults = await enhancedNameGenerator.generateEnhancedNames({
          ...request,
          count: datamuseCount
        }, datamuseContext);
        results.push(...datamuseResults);
        secureLog.info(`✅ Generated ${datamuseResults.length} Datamuse names`);
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