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

export class UnifiedNameGeneratorService {
  private openai: OpenAI;
  private contextCache = new Map<string, CachedContext>();

  constructor() {
    this.openai = new OpenAI({ 
      baseURL: "https://api.x.ai/v1", 
      apiKey: process.env.XAI_API_KEY 
    });
  }

  async generateNames(
    request: GenerateNameRequest, 
    strategy: GenerationStrategy = GENERATION_STRATEGIES.QUALITY
  ): Promise<Array<{name: string, isAiGenerated: boolean, source: string}>> {
    const { type, genre, mood, count = 4, wordCount } = request;
    const generationId = unifiedWordFilter.startNewGeneration();
    const operationId = `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Start performance monitoring
    performanceMonitor.startOperation(operationId, 'unified_name_generation', {
      type, genre, mood, count, wordCount, strategy: strategy.contextDepth
    });
    
    secureLog.info(`🎯 Unified generation: ${count} ${type} names for ${genre || 'general'} genre using ${strategy.contextDepth} strategy`);
    
    const startTime = Date.now();
    
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
      
      // 3. Apply final filtering and formatting
      const finalNames = names.slice(0, count);
      const elapsedTime = Date.now() - startTime;
      
      // End performance monitoring
      performanceMonitor.endOperation(operationId);
      
      secureLog.info(`✅ Generated ${finalNames.length} names in ${elapsedTime}ms using ${strategy.contextDepth} strategy`);
      
      return finalNames.map(name => ({
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
    const processedContext = strategy.enableVarietyOptimizations 
      ? this.processContextForVariety(context, genre)
      : this.processContextBasic(context);
    
    const generateCount = (wordCount === '4+' || wordCount === 4.1) ? Math.max(count + 4, 8) : count;
    const prompt = this.buildAIPrompt(processedContext, type, genre, mood, generateCount, wordCount, strategy);
    
    return await this.generateWithXAI(prompt, generateCount, wordCount);
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
    
    // Build word sources from context to match EnhancedWordSource interface
    const wordSources = {
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
    
    const names: string[] = [];
    const normalizedWordCount = typeof wordCount === 'string' && wordCount === "4+" ? 4 : (typeof wordCount === 'number' ? wordCount : 2);
    let attempts = 0;
    const maxAttempts = count * 10;
    
    while (names.length < count && attempts < maxAttempts) {
      attempts++;
      
      try {
        const result = await namePatterns.generateContextualNameWithCount(
          type,
          normalizedWordCount,
          wordSources,
          mood || undefined,
          genre || undefined
        );
        
        if (result && result.name) {
          if (!names.includes(result.name)) {
            names.push(result.name);
          }
        }
      } catch (error) {
        secureLog.debug('Pattern generation error:', error);
      }
    }
    
    // Fill remaining slots with fallback names if needed
    while (names.length < count) {
      const fallbackNames = ['Electric Dreams', 'Midnight Echo', 'Golden Hour', 'Neon Lights'];
      const fallback = fallbackNames[names.length % fallbackNames.length];
      if (!names.includes(fallback)) {
        names.push(fallback);
      } else {
        names.push(`${fallback} ${names.length + 1}`);
      }
    }
    
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
    const creativity = strategy.contextDepth === 'comprehensive' ? 'wildly creative and humorous' : 
                     strategy.contextDepth === 'standard' ? 'creative and entertaining' : 'creative';
    
    const basePrompt = `You are a ${creativity} AI specializing in generating unique, entertaining, and fun ${isband ? 'band names' : 'song titles'}. Your goal is to craft names that are clever, punny, absurd, or delightfully unexpected, while tying into the specified genre and mood. Ensure all names are original and not direct copies of existing ${isband ? 'bands' : 'songs'}—use inspiration from the provided context to remix ideas in fresh ways.

User inputs:
- Genre: ${genre || 'general'} (infuse the names with elements typical of this genre)
- Mood: ${mood || 'neutral'} (make the names evoke this emotion through word choice or imagery)
- Word count: ${this.formatWordCount(wordCount)} (strictly adhere to this)

IMPORTANT: Avoid excessive alliteration! Don't make all words start with the same letter. Mix different sounds for natural, varied names.`;

    if (strategy.enableVarietyOptimizations) {
      return basePrompt + `

AVOID REPETITION: ${this.getRepetitionAvoidanceInstructions(genre)} Don't overuse obvious genre terms like "${this.getCommonGenreTerms(genre).join('", "')}" - use them sparingly if at all.

Context for inspiration (curated selection):
- Similar artists/bands in this genre: ${processedContext.artists} (draw subtle influences like themes, styles, or wordplay from these)
- Creative keywords and trends: ${processedContext.keywords} (remix elements into new, fun twists for ${isband ? 'band names' : 'song titles'})
- Word associations: ${processedContext.associations} (use these for creative wordplay)

Task:
1. Brainstorm and generate 8 unique ${isband ? 'band names' : 'song titles'} that fit the genre, mood, and word count. Make them entertaining—aim for humor, irony, or whimsy.
2. Evaluate the 8 names critically based on these criteria:
   - Originality (not too similar to real ${isband ? 'bands' : 'songs'} or the context sources)
   - Entertainment value (how fun, clever, or punny they are)
   - Fit to genre and mood (evokes the right style and emotion)
   - Adherence to word count (exact match to ${this.formatWordCount(wordCount)})
   - Overall appeal (memorable and engaging)
3. Select the top 4 best names from the 8 based on your evaluation.
4. Ensure everything is fun and engaging; avoid anything offensive or bland.

Output in strict JSON format for easy parsing:
{
  "${isband ? 'band_names' : 'song_titles'}": ["Best ${isband ? 'Band Name' : 'Song Title'} 1", "Best ${isband ? 'Band Name' : 'Song Title'} 2", "Best ${isband ? 'Band Name' : 'Song Title'} 3", "Best ${isband ? 'Band Name' : 'Song Title'} 4"]
}

CRITICAL: Return ONLY the JSON object above, no additional text, explanations, or evaluation details. Just the pure JSON.

Be inventive and let the context spark wild ideas!`;
    } else {
      return basePrompt + `

Context for inspiration:
- Similar artists/bands in this genre: ${processedContext.artists}
- Keywords and trends: ${processedContext.keywords}
- Word associations: ${processedContext.associations}

Generate ${count} ${isband ? 'band names' : 'song titles'} that fit the genre, mood, and word count.

Output in strict JSON format:
{
  "${isband ? 'band_names' : 'song_titles'}": ["Name 1", "Name 2", "Name 3", "Name 4"]
}

Return ONLY the JSON object above.`;
    }
  }

  // Helper methods from IntelligentNameGeneratorService
  private processContextForVariety(context: GenerationContext, genre?: string): {artists: string, keywords: string, associations: string} {
    const shuffleArray = <T>(array: T[]): T[] => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    const allKeywords = [...context.genreKeywords, ...context.genreTags, ...context.moodWords];
    const commonTerms = this.getCommonGenreTerms(genre);
    
    const uniqueTerms = allKeywords.filter(term => !commonTerms.includes(term.toLowerCase()));
    const someCommonTerms = shuffleArray(allKeywords.filter(term => commonTerms.includes(term.toLowerCase()))).slice(0, 2);
    
    const weightedKeywords = [...shuffleArray(uniqueTerms).slice(0, 8), ...someCommonTerms];
    
    return {
      artists: shuffleArray(context.relatedArtists).slice(0, 4).join(', '),
      keywords: shuffleArray(weightedKeywords).slice(0, 10).join(', '),
      associations: shuffleArray(context.wordAssociations).slice(0, 6).join(', ')
    };
  }

  private processContextBasic(context: GenerationContext): {artists: string, keywords: string, associations: string} {
    const allKeywords = [...context.genreKeywords, ...context.genreTags, ...context.moodWords];
    
    return {
      artists: context.relatedArtists.slice(0, 4).join(', '),
      keywords: allKeywords.slice(0, 10).join(', '),
      associations: context.wordAssociations.slice(0, 6).join(', ')
    };
  }

  private async generateWithXAI(prompt: string, count: number, wordCount?: number | string): Promise<string[]> {
    try {
      const response = await this.openai.chat.completions.create({
        model: "grok-3",
        messages: [{ role: "user", content: prompt }],
        temperature: 1.1,
        max_tokens: 300
      });

      const content = response.choices[0].message.content?.trim();
      if (!content) {
        throw new Error('No content generated by XAI');
      }

      let names: string[] = [];
      
      if (content.includes('"band_names"') || content.includes('"song_titles"')) {
        try {
          const jsonStart = content.indexOf('{');
          const jsonEnd = content.lastIndexOf('}');
          if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
            const jsonContent = content.substring(jsonStart, jsonEnd + 1);
            const parsed = JSON.parse(jsonContent);
            if (parsed.band_names && Array.isArray(parsed.band_names)) {
              names = parsed.band_names.map((name: string) => name.trim());
            } else if (parsed.song_titles && Array.isArray(parsed.song_titles)) {
              names = parsed.song_titles.map((name: string) => name.trim());
            }
          }
        } catch (error) {
          secureLog.debug('Failed to parse JSON, falling back to line parsing');
        }
      }
      
      if (names.length === 0) {
        names = content
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0 && !line.match(/^\d+\./) && line.length < 150)
          .map(line => line.replace(/^[-•]\s*/, ''))
          .filter(line => line.length > 0);
      }

      // Word count validation if specified
      if (wordCount) {
        const validNames = names.filter(name => {
          const actualWordCount = name.split(/\s+/).length;
          return this.isValidWordCount(actualWordCount, wordCount);
        });
        
        if (validNames.length > 0) {
          names = validNames;
        }
      }

      const uniqueNames = [...new Set(names)].slice(0, count);
      return uniqueNames;

    } catch (error) {
      secureLog.error('XAI generation error:', error);
      throw error;
    }
  }

  private generateFallbackNames(type: string, genre?: string, mood?: string, count: number = 4): Array<{name: string, isAiGenerated: boolean, source: string}> {
    const fallbackNames = [
      'Electric Dreams',
      'Midnight Echo', 
      'Golden Hour',
      'Neon Lights',
      'Silver Rain',
      'Cosmic Light',
      'Rising Storm',
      'Ocean Waves'
    ];

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

  private getRepetitionAvoidanceInstructions(genre?: string): string {
    const genreSpecific: { [key: string]: string } = {
      blues: "Avoid overusing 'delta', 'mississippi', 'soul' repeatedly.",
      rock: "Don't repeatedly use 'electric', 'thunder', 'metal'.",
      jazz: "Avoid constantly using 'swing', 'bebop', 'smooth'.",
      country: "Don't overuse 'nashville', 'honky', 'barn' in every name.",
      folk: "Avoid repetitive use of 'acoustic', 'roots', 'mountain'.",
      indie: "Don't constantly use 'alternative', 'underground', 'indie'.",
      pop: "Avoid overusing 'radio', 'hit', 'chart', 'mainstream' repeatedly.",
      hip_hop: "Don't constantly use 'urban', 'street', 'flow', 'beat'.",
      electronic: "Avoid repetitive use of 'digital', 'synth', 'techno', 'beat'.",
      metal: "Don't overuse 'heavy', 'death', 'black', 'thrash' in every name.",
      punk: "Avoid constantly using 'anarchy', 'riot', 'rebel', 'dead'.",
      reggae: "Don't repeatedly use 'rasta', 'island', 'jamaica', 'irie'.",
      classical: "Avoid overusing 'symphony', 'orchestra', 'baroque', 'chamber'.",
      r_b: "Don't constantly use 'smooth', 'soulful', 'rhythm', 'groove'.",
      rnb: "Don't constantly use 'smooth', 'soulful', 'rhythm', 'groove'.",
      gospel: "Avoid repetitive use of 'praise', 'holy', 'church', 'blessed'.",
      'jam band': "Don't overuse 'cosmic', 'groove', 'festival', 'journey' repeatedly.",
      'jam_band': "Don't overuse 'cosmic', 'groove', 'festival', 'journey' repeatedly.",
      grunge: "Avoid constantly using 'dirty', 'seattle', 'flannel', 'angst'.",
      alternative: "Don't repeatedly use 'alt', 'underground', 'indie', 'experimental'.",
      ambient: "Avoid overusing 'atmospheric', 'ethereal', 'soundscape', 'drone'.",
      house: "Don't constantly use 'club', 'dance', 'beat', 'underground'.",
      dubstep: "Avoid repetitive use of 'bass', 'drop', 'wobble', 'electronic'."
    };
    
    return genreSpecific[genre || ''] || "Avoid repetitive use of the most obvious genre keywords.";
  }

  private getCommonGenreTerms(genre?: string): string[] {
    const commonTerms: { [key: string]: string[] } = {
      blues: ['delta', 'mississippi', 'soul', 'deep', 'raw', 'authentic'],
      rock: ['electric', 'thunder', 'metal', 'heavy', 'hard', 'wild'],
      jazz: ['swing', 'bebop', 'smooth', 'cool', 'hot', 'blue'],
      country: ['nashville', 'honky', 'barn', 'whiskey', 'highway', 'southern'],
      folk: ['acoustic', 'roots', 'mountain', 'traditional', 'american', 'old'],
      indie: ['alternative', 'underground', 'indie', 'hipster', 'cool', 'artsy'],
      pop: ['radio', 'hit', 'chart', 'mainstream', 'catchy', 'commercial'],
      hip_hop: ['urban', 'street', 'flow', 'beat', 'rap', 'hood'],
      electronic: ['digital', 'synth', 'electronic', 'techno', 'beat', 'dance'],
      metal: ['heavy', 'death', 'black', 'thrash', 'brutal', 'core'],
      punk: ['anarchy', 'riot', 'rebel', 'dead', 'chaos', 'raw'],
      reggae: ['rasta', 'island', 'jamaica', 'irie', 'roots', 'one'],
      classical: ['symphony', 'orchestra', 'baroque', 'chamber', 'opus', 'concerto'],
      r_b: ['smooth', 'soulful', 'rhythm', 'groove', 'silky', 'velvet'],
      rnb: ['smooth', 'soulful', 'rhythm', 'groove', 'silky', 'velvet'],
      gospel: ['praise', 'holy', 'church', 'blessed', 'hallelujah', 'choir'],
      'jam band': ['cosmic', 'groove', 'festival', 'journey', 'space', 'phish'],
      'jam_band': ['cosmic', 'groove', 'festival', 'journey', 'space', 'phish'],
      grunge: ['dirty', 'seattle', 'flannel', 'angst', 'nirvana', 'distorted'],
      alternative: ['alt', 'underground', 'indie', 'experimental', 'different', 'unique'],
      ambient: ['atmospheric', 'ethereal', 'soundscape', 'drone', 'floating', 'space'],
      house: ['club', 'dance', 'beat', 'underground', 'bass', 'four'],
      dubstep: ['bass', 'drop', 'wobble', 'electronic', 'heavy', 'skrillex']
    };
    
    return commonTerms[genre || ''] || [];
  }
}

export const unifiedNameGenerator = new UnifiedNameGeneratorService();