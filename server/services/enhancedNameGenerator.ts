import { datamuseService, DatamuseService } from './datamuseService';
import { lastfmService } from './lastfmService';
import { SpotifyService } from './spotifyService';
import { conceptNetService } from './conceptNetService';
import type { GenerateNameRequest } from '@shared/schema';
import { secureLog } from '../utils/secureLogger';

// Import new modular components
import { EnhancedWordSource } from './nameGeneration/types';
import { WordSourceBuilder } from './nameGeneration/wordSourceBuilder';
import { NameGenerationPatterns } from './nameGeneration/nameGenerationPatterns';
import { 
  singularize, 
  capitalize, 
  generateFallbackName,
  getRandomWord
} from './nameGeneration/generationHelpers';
import { 
  isPoeticWord, 
  isProblematicWord 
} from './nameGeneration/wordValidation';
import { nameQualityControl } from './nameQualityControl';
import { WORD_SOURCE_CACHE_TIMEOUT } from './nameGeneration/constants';

export class EnhancedNameGeneratorService {
  private datamuseService: DatamuseService;
  private spotifyService: SpotifyService;
  private wordSourceBuilder: WordSourceBuilder;
  private namePatterns: NameGenerationPatterns;
  private recentWords: Set<string> = new Set();
  private maxRecentWords: number = 100;
  
  // Performance optimization: Cache for word sources
  private wordSourceCache: Map<string, { data: EnhancedWordSource; timestamp: number }> = new Map();
  private contextCache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTimeout: number = WORD_SOURCE_CACHE_TIMEOUT;

  constructor() {
    this.datamuseService = datamuseService;
    this.spotifyService = new SpotifyService();
    this.wordSourceBuilder = new WordSourceBuilder(
      this.datamuseService,
      this.spotifyService
    );
    this.namePatterns = new NameGenerationPatterns(this.datamuseService);
  }
  
  // Collect generation context from multiple APIs for enrichment
  async getGenerationContext(mood?: string, genre?: string): Promise<{
    spotifyContext: string[],
    lastfmContext: string[],
    conceptNetContext: string[]
  }> {
    // Performance: Check cache first
    const cacheKey = `context_${mood || 'none'}_${genre || 'none'}`;
    const cached = this.contextCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp < this.cacheTimeout)) {
      secureLog.debug(`💾 Using cached context for ${cacheKey}`);
      return cached.data;
    }
    
    const context = {
      spotifyContext: [] as string[],
      lastfmContext: [] as string[],
      conceptNetContext: [] as string[]
    };
    
    try {
      // Collect vocabulary from APIs in parallel for performance
      const promises = [];
      
      // Spotify context - get artists and tracks, then extract vocabulary
      if (genre) {
        promises.push(
          Promise.all([
            this.spotifyService.getGenreArtists(genre, 20),
            this.spotifyService.searchTracks(genre, 20)
          ]).then(([artists, tracks]) => {
            const vocab = this.spotifyService.extractVocabularyPatterns(artists, tracks);
            context.spotifyContext = vocab.filter(w => w.length > 3).slice(0, 15);
          }).catch((err: any) => secureLog.debug('Spotify context failed:', err))
        );
      }
      
      // Last.fm context
      if (genre) {
        promises.push(
          lastfmService.getGenreVocabulary(genre)
            .then((vocabulary) => {
              // Combine genre terms and descriptive words
              const vocab = [
                ...vocabulary.genreTerms,
                ...vocabulary.descriptiveWords,
                ...vocabulary.relatedGenres
              ].filter(w => w.length > 3 && w.length < 15)
                .slice(0, 15);
              context.lastfmContext = vocab;
            })
            .catch((err: any) => secureLog.debug('Last.fm context failed:', err))
        );
      }
      
      // ConceptNet context - use appropriate method based on input
      if (mood || genre) {
        const seed = mood || genre;
        promises.push(
          (genre ? conceptNetService.getGenreAssociations(genre) : 
           conceptNetService.getEmotionalAssociations(seed!))
            .then(concepts => {
              context.conceptNetContext = concepts.slice(0, 15);
            })
            .catch((err: any) => secureLog.debug('ConceptNet context failed:', err))
        );
      }
      
      await Promise.allSettled(promises);
      
      secureLog.debug(`📚 Collected context: Spotify(${context.spotifyContext.length}), Last.fm(${context.lastfmContext.length}), ConceptNet(${context.conceptNetContext.length})`);
      
      // Cache the result for performance
      this.contextCache.set(cacheKey, {
        data: context,
        timestamp: Date.now()
      });
      
    } catch (error) {
      secureLog.error('Context collection error:', error);
    }
    
    return context;
  }

  // Enhanced generation using Datamuse API for contextual relationships
  async generateEnhancedNames(request: GenerateNameRequest, apiContext?: string[]): Promise<Array<{name: string, isAiGenerated: boolean, source: string}>> {
    const { type, wordCount, count, mood, genre } = request;
    const names: Array<{name: string, isAiGenerated: boolean, source: string}> = [];

    secureLog.debug(`🚀 Enhanced generation: ${count} ${type} names with ${wordCount} words`);
    
    // If API context is provided, log it
    if (apiContext && apiContext.length > 0) {
      secureLog.debug(`📌 Using API context: ${apiContext.length} words - ${apiContext.slice(0, 5).join(', ')}...`);
    }

    // Performance: Check cache for word sources
    const wordSourceCacheKey = `words_${type}_${mood || 'none'}_${genre || 'none'}`;
    let wordSources: EnhancedWordSource;
    
    const cachedWordSources = this.wordSourceCache.get(wordSourceCacheKey);
    if (cachedWordSources && (Date.now() - cachedWordSources.timestamp < this.cacheTimeout)) {
      secureLog.debug(`💾 Using cached word sources for ${wordSourceCacheKey}`);
      wordSources = { ...cachedWordSources.data }; // Clone to avoid mutations
    } else {
      // Build contextual word sources using the modular builder
      wordSources = await this.wordSourceBuilder.buildContextualWordSources(mood, genre, type);
      
      // Cache the word sources
      this.wordSourceCache.set(wordSourceCacheKey, {
        data: { ...wordSources }, // Clone for cache
        timestamp: Date.now()
      });
    }
    
    // Enrich word sources with API context if provided
    if (apiContext && apiContext.length > 0) {
      // Add API context words to appropriate categories
      const contextWords = apiContext.filter(w => isPoeticWord(w) && !isProblematicWord(w));
      wordSources.contextualWords.unshift(...contextWords.slice(0, 10));
      wordSources.associatedWords.unshift(...contextWords.slice(10, 20));
      secureLog.debug(`💫 Enriched word sources with ${contextWords.length} API context words`);
    }

    let attempts = 0;
    const maxAttempts = count * 10;
    
    // Performance: Batch generate candidates for efficiency
    const batchSize = 5;
    const candidates: Array<{name: string, actualWordCount: number}> = [];

    while (names.length < count && attempts < maxAttempts) {
      attempts += batchSize;
      
      try {
        // Generate batch of candidates in parallel
        const batchPromises = Array(batchSize).fill(null).map(() => 
          this.namePatterns.generateContextualNameWithCount(
            type, 
            wordCount, 
            wordSources, 
            mood, 
            genre
          ).catch(() => null)
        );
        
        const batchResults = await Promise.all(batchPromises);
        
        // Filter and validate batch results
        for (const result of batchResults) {
          if (!result || !result.name) continue;
          
          const isValidWordCount = wordCount >= 4 ? 
            (result.actualWordCount >= 4 && result.actualWordCount <= 10) : 
            (result.actualWordCount === wordCount);
          
          if (isValidWordCount && 
              this.isValidName(result.name, result.actualWordCount) && 
              !names.find(n => n.name === result.name) && 
              !this.hasRecentWords(result.name)) {
            candidates.push(result);
          }
        }
        
        // Skip quality checks for performance - just add all valid candidates
        for (const candidate of candidates) {
          this.trackWords(candidate.name);
          names.push({ 
            name: candidate.name, 
            isAiGenerated: false, 
            source: 'datamuse-enhanced' 
          });
          secureLog.debug(`✅ Generated valid name: "${candidate.name}"`);
          
          if (names.length >= count) break;
        }
        
        // Clear processed candidates
        candidates.length = 0;
        
      } catch (error) {
        secureLog.error('Enhanced generation batch error:', error);
      }
    }
    
    // Ensure we always return the requested number of names by using fallback generation
    let fallbackAttempts = 0;
    const maxFallbackAttempts = count * 5;
    
    while (names.length < count && fallbackAttempts < maxFallbackAttempts) {
      fallbackAttempts++;
      const fallbackWordCount = wordCount >= 4 ? Math.floor(Math.random() * 7) + 4 : wordCount;
      const fallbackName = generateFallbackName(wordSources, fallbackWordCount);
      
      if (!names.find(n => n.name === fallbackName) && !this.hasRecentWords(fallbackName)) {
        // Skip quality check for performance - just add fallback name
        this.trackWords(fallbackName);
        names.push({ 
          name: fallbackName, 
          isAiGenerated: false, 
          source: 'fallback' 
        });
        secureLog.debug(`✅ Generated fallback name: "${fallbackName}"`);
      }
    }
    
    secureLog.debug(`✨ Final enhanced names: ${names.map(n => n.name).join(', ')}`);
    return names;
  }

  // Track recently used words
  private trackWords(name: string): void {
    const words = name.toLowerCase().split(' ').filter(w => w.length > 3);
    
    for (const word of words) {
      this.recentWords.add(word);
    }
    
    // Keep only the most recent words
    if (this.recentWords.size > this.maxRecentWords) {
      const wordsArray = Array.from(this.recentWords);
      this.recentWords = new Set(wordsArray.slice(-this.maxRecentWords));
    }
  }

  // Check if a name contains recent words
  private hasRecentWords(name: string): boolean {
    const words = name.toLowerCase().split(' ').filter(w => w.length > 3);
    return words.some(word => this.recentWords.has(word));
  }

  // Validate name quality
  private isValidName(name: string, actualWordCount: number): boolean {
    if (!name || name.trim().length === 0) return false;
    
    const words = name.split(' ').filter(w => w.length > 0);
    
    // Check word count matches
    if (words.length !== actualWordCount) return false;
    
    // Check for duplicate words within the name
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    if (uniqueWords.size !== words.length) return false;
    
    // Additional quality checks
    if (name.length > 60) return false;
    if (words.some(w => w.length > 15)) return false;
    if (words.some(w => /^\d+$/.test(w))) return false;
    
    return true;
  }


}

export const enhancedNameGenerator = new EnhancedNameGeneratorService();