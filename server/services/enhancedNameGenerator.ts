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

export class EnhancedNameGeneratorService {
  private datamuseService: DatamuseService;
  private spotifyService: SpotifyService;
  private wordSourceBuilder: WordSourceBuilder;
  private namePatterns: NameGenerationPatterns;
  private recentWords: Set<string> = new Set();
  private maxRecentWords: number = 100;

  constructor() {
    this.datamuseService = datamuseService;
    this.spotifyService = new SpotifyService();
    this.wordSourceBuilder = new WordSourceBuilder(
      this.datamuseService,
      this.spotifyService
    );
    this.namePatterns = new NameGenerationPatterns(this.datamuseService);
  }

  // Enhanced generation using Datamuse API for contextual relationships
  async generateEnhancedNames(request: GenerateNameRequest): Promise<Array<{name: string, isAiGenerated: boolean, source: string}>> {
    const { type, wordCount, count, mood, genre } = request;
    const names: Array<{name: string, isAiGenerated: boolean, source: string}> = [];

    secureLog.debug(`🚀 Enhanced generation: ${count} ${type} names with ${wordCount} words`);

    // Build contextual word sources using the modular builder
    const wordSources = await this.wordSourceBuilder.buildContextualWordSources(mood, genre, type);

    let attempts = 0;
    const maxAttempts = count * 10;

    while (names.length < count && attempts < maxAttempts) {
      attempts++;
      try {
        const result = await this.namePatterns.generateContextualNameWithCount(
          type, 
          wordCount, 
          wordSources, 
          mood, 
          genre
        );
        
        // Quality validation and check for repeated words
        const isValidWordCount = wordCount >= 4 ? 
          (result.actualWordCount >= 4 && result.actualWordCount <= 10) : 
          (result.actualWordCount === wordCount);
        
        if (result && result.name && isValidWordCount && 
            this.isValidName(result.name, result.actualWordCount) && 
            !names.find(n => n.name === result.name) && 
            !this.hasRecentWords(result.name)) {
          this.trackWords(result.name);
          names.push({ 
            name: result.name, 
            isAiGenerated: false, 
            source: 'datamuse-enhanced' 
          });
          secureLog.debug(`✅ Generated valid name: "${result.name}" (${result.actualWordCount} words)`);
        } else {
          secureLog.debug(`❌ Rejected name: "${result?.name}" - validation failed`);
        }
      } catch (error) {
        secureLog.error('Enhanced generation error:', error);
      }
    }
    
    // Ensure we always return the requested number of names by using fallback generation
    while (names.length < count) {
      const fallbackWordCount = wordCount >= 4 ? Math.floor(Math.random() * 7) + 4 : wordCount;
      const fallbackName = generateFallbackName(wordSources, fallbackWordCount);
      
      if (!names.find(n => n.name === fallbackName) && !this.hasRecentWords(fallbackName)) {
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

  // Get context for AI generation (used by other services)
  async getGenerationContext(mood?: string, genre?: string): Promise<{ datamuseContext: string[], spotifyContext: string[], lastfmContext: string[], conceptNetContext: string[] }> {
    const wordSources = await this.wordSourceBuilder.buildContextualWordSources(mood, genre, 'band');
    
    return {
      datamuseContext: [...wordSources.adjectives, ...wordSources.nouns, ...wordSources.verbs].slice(0, 10),
      spotifyContext: wordSources.spotifyWords?.slice(0, 10) || [],
      lastfmContext: wordSources.lastfmWords?.slice(0, 10) || [],
      conceptNetContext: wordSources.conceptNetWords?.slice(0, 10) || []
    };
  }
}

export const enhancedNameGenerator = new EnhancedNameGeneratorService();