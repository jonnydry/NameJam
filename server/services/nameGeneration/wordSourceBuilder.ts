import { DatamuseService } from '../datamuseService';
import { datamuseEnhancementService } from '../datamuseEnhancements';
import { lastfmService } from '../lastfmService';
import { SpotifyService } from '../spotifyService';
import { conceptNetService } from '../conceptNetService';
import { secureLog } from '../../utils/secureLogger';
import { EnhancedWordSource } from './types';
import { isPoeticWord, isProblematicWord } from './wordValidation';
import { isMusicallyAppropriate, filterWordsForMusic, getRealMusicExamples, getGenreWords } from './musicalWordFilter';
import { isBandName, deduplicateMultipleArrays, deduplicateArray } from './stringUtils';

export class WordSourceBuilder {
  private datamuseService: DatamuseService;
  private spotifyService: SpotifyService;

  constructor(datamuseService: DatamuseService, spotifyService: SpotifyService) {
    this.datamuseService = datamuseService;
    this.spotifyService = spotifyService;
  }

  // Build word sources using Datamuse's contextual relationships + external APIs
  async buildContextualWordSources(mood?: string, genre?: string, type?: string): Promise<EnhancedWordSource> {
    const sources: EnhancedWordSource = {
      // Original raw word arrays (kept for compatibility)
      adjectives: [],
      nouns: [],
      verbs: [],
      musicalTerms: [],
      contextualWords: [],
      associatedWords: [],
      genreTerms: [],
      lastfmWords: [],
      spotifyWords: [],
      conceptNetWords: [],
      
      // Pre-filtered collections (will be populated in cleanWordSources)
      validAdjectives: [],
      validNouns: [],
      validVerbs: [],
      validMusicalTerms: [],
      validContextualWords: [],
      validAssociatedWords: [],
      validGenreTerms: [],
      validLastfmWords: [],
      validSpotifyWords: [],
      validConceptNetWords: [],
      
      // Length-specific pre-filtered arrays
      shortWords: [],
      mediumWords: [],
      longWords: [],
      
      // Combined pre-filtered collections
      allValidWords: [],
      qualityNouns: [],
      qualityAdjectives: []
    };

    try {
      // Map moods/genres to more poetic seed words
      const poeticSeeds = this.getPoeticSeedWords(mood, genre);
      
      // Execute API calls in parallel for performance
      const apiPromises = [];
      
      // Parallel API calls for all external services
      secureLog.debug(`🔍 Checking external API conditions: genre="${genre}", mood="${mood}"`);
      if (genre || mood) {
        secureLog.debug(`🌐 Entering external API calls section`);
        
        // Last.fm API promise
        if (genre) {
          secureLog.debug(`🎵 Starting Last.fm API call for genre: ${genre}`);
          apiPromises.push(
            this.fetchLastFmData(genre, sources)
          );
        }
        
        // Spotify API promises
        if (genre) {
          apiPromises.push(
            this.fetchSpotifyGenreData(genre, sources)
          );
        }
        
        if (mood) {
          apiPromises.push(
            this.fetchSpotifyMoodData(mood, sources)
          );
        }
        
        // ConceptNet API promises
        if (genre) {
          apiPromises.push(
            this.fetchConceptNetGenreData(genre, sources)
          );
        }
        
        if (mood) {
          apiPromises.push(
            this.fetchConceptNetMoodData(mood, sources)
          );
        }
        
        if (poeticSeeds.emotional.length > 0) {
          apiPromises.push(
            this.fetchConceptNetCulturalData(poeticSeeds.emotional[0], sources)
          );
        }
      }
      
      // Wait for all parallel API calls to complete with timeout
      if (apiPromises.length > 0) {
        try {
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('External API timeout')), 15000); // 15 second timeout for external APIs
          });
          
          await Promise.race([
            Promise.allSettled(apiPromises),
            timeoutPromise
          ]);
          secureLog.debug(`🔄 External API calls completed`);
        } catch (error) {
          secureLog.warn(`⏰ External API calls timed out after 15 seconds, continuing with Datamuse-only generation`);
        }
      }
      
      // Add fallback genreTerms if none were fetched from external APIs
      if (genre && sources.genreTerms.length === 0) {
        const fallbackGenreTerms = this.getFallbackGenreTerms(genre);
        sources.genreTerms.push(...fallbackGenreTerms);
        secureLog.debug(`🔄 Added fallback genre terms for ${genre}:`, fallbackGenreTerms);
      }

      // Fetch Datamuse data
      await this.fetchDatamuseData(poeticSeeds, mood, genre, sources);
      
      // Clean up word sources
      this.cleanWordSources(sources);
      
    } catch (error) {
      secureLog.error('Error building contextual word sources:', error);
    }

    return sources;
  }

  private async fetchLastFmData(genre: string, sources: EnhancedWordSource): Promise<void> {
    try {
      const genreVocab = await lastfmService.getGenreVocabulary(genre);
      secureLog.debug(`📥 Last.fm response received:`, {
        genreTerms: genreVocab.genreTerms,
        descriptiveWords: genreVocab.descriptiveWords,
        relatedGenres: genreVocab.relatedGenres,
        confidence: genreVocab.confidence
      });
      
      sources.genreTerms.push(...genreVocab.genreTerms);
      sources.lastfmWords.push(...genreVocab.descriptiveWords);
      sources.contextualWords.push(...genreVocab.relatedGenres);
      
      secureLog.debug(`✅ Last.fm integration successful:`, {
        genreTerms: genreVocab.genreTerms.length,
        descriptiveWords: genreVocab.descriptiveWords.length,
        confidence: genreVocab.confidence
      });
    } catch (error) {
      secureLog.error('❌ Last.fm integration failed:', error);
    }
  }

  private async fetchSpotifyGenreData(genre: string, sources: EnhancedWordSource): Promise<void> {
    try {
      const [genreArtists, genreTracks] = await Promise.all([
        this.spotifyService.getGenreArtists(genre, 30),
        this.spotifyService.searchTracks(genre, 20)
      ]);
      const spotifyVocab = this.spotifyService.extractVocabularyPatterns(genreArtists, genreTracks);
      sources.spotifyWords.push(...spotifyVocab.filter(w => isPoeticWord(w)));
      secureLog.debug(`✅ Spotify genre integration: ${spotifyVocab.length} words extracted`);
    } catch (error) {
      secureLog.error('Spotify genre integration failed:', error);
    }
  }

  private async fetchSpotifyMoodData(mood: string, sources: EnhancedWordSource): Promise<void> {
    try {
      const [moodTracks, moodArtists] = await Promise.all([
        this.spotifyService.getMoodTracks(mood, 30),
        this.spotifyService.searchArtists(mood, 20)
      ]);
      const spotifyMoodVocab = this.spotifyService.extractVocabularyPatterns(moodArtists, moodTracks);
      sources.spotifyWords.push(...spotifyMoodVocab.filter(w => isPoeticWord(w)));
      secureLog.debug(`✅ Spotify mood integration: ${spotifyMoodVocab.length} words extracted`);
    } catch (error) {
      secureLog.error('Spotify mood integration failed:', error);
    }
  }

  private async fetchConceptNetGenreData(genre: string, sources: EnhancedWordSource): Promise<void> {
    try {
      secureLog.debug(`🧠 Starting ConceptNet API call for genre: ${genre}`);
      const genreAssociations = await conceptNetService.getGenreAssociations(genre);
      secureLog.debug(`📥 ConceptNet response received for genre:`, { 
        genre, 
        rawResults: genreAssociations.length,
        sampleResults: genreAssociations.slice(0, 5)
      });
      
      const filteredWords = genreAssociations.filter(w => isPoeticWord(w) && isMusicallyAppropriate(w));
      sources.conceptNetWords.push(...filteredWords);
      
      // Add genre-specific vocabulary from our curated list
      const genreVocab = getGenreWords(genre);
      sources.genreTerms.push(...genreVocab);
      
      secureLog.debug(`✅ ConceptNet genre integration: ${genreAssociations.length} concepts found, ${filteredWords.length} after filtering`);
    } catch (error) {
      secureLog.error('❌ ConceptNet genre integration failed:', error);
    }
  }

  private async fetchConceptNetMoodData(mood: string, sources: EnhancedWordSource): Promise<void> {
    try {
      const emotionalAssociations = await conceptNetService.getEmotionalAssociations(mood);
      sources.conceptNetWords.push(...emotionalAssociations.filter(w => isPoeticWord(w)));
      secureLog.debug(`✅ ConceptNet mood integration: ${emotionalAssociations.length} concepts found`);
    } catch (error) {
      secureLog.error('ConceptNet mood integration failed:', error);
    }
  }

  private async fetchConceptNetCulturalData(seed: string, sources: EnhancedWordSource): Promise<void> {
    try {
      const culturalConnections = await conceptNetService.getCulturalConnections(seed);
      sources.conceptNetWords.push(...culturalConnections.filter(w => isPoeticWord(w)));
    } catch (error) {
      secureLog.error('ConceptNet cultural connections failed:', error);
    }
  }

  // Enhanced multi-query method for better variety
  private async fetchEnhancedDatamuseWords(seedWord: string, type: 'noun' | 'adjective' | 'verb'): Promise<string[]> {
    try {
      // Use multi-query strategy
      const multiResults = await datamuseEnhancementService.multiQueryWords(seedWord, 30);
      
      // Mine relationships for deeper connections
      const relationshipResults = await datamuseEnhancementService.mineRelationships(seedWord, type);
      
      // Build contextual chain for creative associations
      const contextChain = await datamuseEnhancementService.buildContextualChain(seedWord, 2);
      
      // Combine all results
      const allWords = [
        ...multiResults.map(r => r.word),
        ...relationshipResults.map(r => r.word),
        ...contextChain.slice(1) // Skip the seed word itself
      ];
      
      // Filter and deduplicate with musical appropriateness
      const uniqueWords = Array.from(new Set(allWords))
        .filter(w => isPoeticWord(w) && !isProblematicWord(w) && isMusicallyAppropriate(w) && w.length >= 4 && w.length <= 12);
      
      secureLog.debug(`Enhanced Datamuse for "${seedWord}": ${uniqueWords.length} unique quality words`);
      
      return uniqueWords;
    } catch (error) {
      secureLog.error('Enhanced Datamuse fetch failed:', error);
      return [];
    }
  }

  private async fetchDatamuseData(poeticSeeds: any, mood: string | undefined, genre: string | undefined, sources: EnhancedWordSource): Promise<void> {
    const datamusePromises = [];
    
    // Get emotionally evocative words using enhanced multi-query
    const emotionalSeeds = poeticSeeds.emotional.slice(0, 2);
    datamusePromises.push(...emotionalSeeds.map((seed: string) =>
      this.fetchEnhancedDatamuseWords(seed, 'adjective').then(enhancedWords => {
        sources.contextualWords.push(...enhancedWords.slice(0, 8));
      }).catch(error => secureLog.error('Enhanced emotional words failed:', error))
    ));
    
    // Get sensory/imagery words using enhanced multi-query
    const sensorySeeds = poeticSeeds.sensory.slice(0, 2);
    datamusePromises.push(...sensorySeeds.map((seed: string) =>
      this.fetchEnhancedDatamuseWords(seed, 'noun').then(enhancedWords => {
        sources.associatedWords.push(...enhancedWords.slice(0, 10));
      }).catch(error => secureLog.error('Enhanced sensory words failed:', error))
    ));
    
    // Get musical/rhythmic words using enhanced multi-query
    const musicalSeeds = ['melody', 'rhythm'];
    datamusePromises.push(...musicalSeeds.map(seed =>
      this.fetchEnhancedDatamuseWords(seed, 'noun').then(enhancedWords => {
        sources.musicalTerms.push(...enhancedWords.slice(0, 5));
      }).catch(error => secureLog.error('Enhanced musical words failed:', error))
    ));
    
    // Get high-quality adjectives using enhanced multi-query
    const adjectiveSeeds = this.getAdjectiveSeeds(mood, genre).slice(0, 3);
    datamusePromises.push(...adjectiveSeeds.map(seed =>
      this.fetchEnhancedDatamuseWords(seed, 'adjective').then(enhancedWords => {
        sources.adjectives.push(...enhancedWords.slice(0, 10));
      }).catch(error => secureLog.error('Enhanced adjectives failed:', error))
    ));
    
    // Get poetic nouns using enhanced multi-query
    const nounSeeds = this.getNounSeeds(mood, genre).slice(0, 3);
    datamusePromises.push(...nounSeeds.map(seed =>
      this.fetchEnhancedDatamuseWords(seed, 'noun').then(enhancedWords => {
        sources.nouns.push(...enhancedWords.slice(0, 10));
      }).catch(error => secureLog.error('Enhanced nouns failed:', error))
    ));
    
    // Get verbs using enhanced multi-query
    const verbSeeds = this.getVerbSeeds(mood, genre).slice(0, 2);
    datamusePromises.push(...verbSeeds.map(seed =>
      this.fetchEnhancedDatamuseWords(seed, 'verb').then(enhancedWords => {
        const actionVerbs = enhancedWords.filter(w => this.isActionWord(w));
        sources.verbs.push(...actionVerbs.slice(0, 8));
      }).catch(error => secureLog.error('Enhanced verbs failed:', error))
    ));
    
    await Promise.allSettled(datamusePromises);
  }

  private cleanWordSources(sources: EnhancedWordSource): void {
    // Define word quality filter function (reusable)
    const qualityFilter = (word: string): boolean => {
      return word && 
        word.length > 2 && 
        !word.includes('_') &&
        !word.includes('-') &&
        !/^\d+$/.test(word) &&
        !isBandName(word) &&
        isPoeticWord(word) &&
        !isProblematicWord(word) &&
        isMusicallyAppropriate(word);
    };

    // Prepare arrays for bulk deduplication and filtering
    const rawArrayKeys = ['adjectives', 'nouns', 'verbs', 'musicalTerms', 'contextualWords', 
                         'associatedWords', 'genreTerms', 'lastfmWords', 'spotifyWords', 'conceptNetWords'];
    
    const arraysToProcess = rawArrayKeys.map(key => {
      const sourceKey = key as keyof EnhancedWordSource;
      return sources[sourceKey] as string[];
    });

    // OPTIMIZED: Use centralized bulk deduplication with performance monitoring
    const startTime = performance.now();
    const { arrays: deduplicatedArrays, metrics } = deduplicateMultipleArrays(
      arraysToProcess,
      { 
        caseInsensitive: true,
        preserveOrder: true,
        enableMetrics: true
      }
    );
    
    // Apply quality filtering AFTER deduplication (more efficient)
    const qualityFilteredArrays = deduplicatedArrays.map(array => 
      array.filter(qualityFilter).slice(0, 100) // Limit to 100 words per category
    );

    // Update sources with deduplicated and filtered arrays
    rawArrayKeys.forEach((key, index) => {
      const sourceKey = key as keyof EnhancedWordSource;
      const cleanedWords = qualityFilteredArrays[index];
      sources[sourceKey] = cleanedWords as any;
      
      // Populate corresponding pre-filtered arrays
      const validKey = ('valid' + key.charAt(0).toUpperCase() + key.slice(1)) as keyof EnhancedWordSource;
      (sources[validKey] as string[]) = [...cleanedWords];
    });

    // Create combined collections with single deduplication pass
    const allValidWordsArray = [
      ...sources.validAdjectives,
      ...sources.validNouns,
      ...sources.validVerbs,
      ...sources.validMusicalTerms,
      ...sources.validContextualWords,
      ...sources.validAssociatedWords,
      ...sources.validGenreTerms,
      ...sources.validLastfmWords,
      ...sources.validSpotifyWords,
      ...sources.validConceptNetWords
    ];
    
    // Single final deduplication for combined array
    sources.allValidWords = deduplicateArray(allValidWordsArray, true, true);
    
    // Log performance improvements from centralized deduplication
    const totalTime = performance.now() - startTime;
    if (metrics) {
      secureLog.debug('🚀 Optimized word deduplication completed:', {
        totalProcessingTime: `${totalTime.toFixed(2)}ms`,
        originalWords: metrics.originalCount,
        deduplicatedWords: metrics.deduplicatedCount,
        duplicatesRemoved: metrics.duplicatesRemoved,
        deduplicationEfficiency: `${((metrics.duplicatesRemoved / metrics.originalCount) * 100).toFixed(1)}%`,
        finalCombinedWords: sources.allValidWords.length
      });
    }

    // Create length-specific arrays
    sources.shortWords = sources.allValidWords.filter(w => w.length >= 3 && w.length <= 5);
    sources.mediumWords = sources.allValidWords.filter(w => w.length >= 6 && w.length <= 8);
    sources.longWords = sources.allValidWords.filter(w => w.length >= 9);

    // Create high-quality collections with additional scoring
    const scoreWord = (word: string): number => {
      let score = 0;
      if (word.length >= 5 && word.length <= 8) score += 2; // Optimal length
      if (/^.*ness$|^.*less$|^.*ful$|^.*ous$|^.*ent$|^.*ant$|^.*ive$|^.*ic$/.test(word)) score += 3; // Poetic endings
      if (['shadow', 'light', 'soul', 'heart', 'dream', 'fire', 'storm'].some(w => word.includes(w))) score += 2; // Core poetic words
      return score;
    };

    // Quality nouns for band/song names
    sources.qualityNouns = [...sources.validNouns, ...sources.validMusicalTerms, ...sources.validAssociatedWords]
      .filter(w => w.length >= 4 && w.length <= 10)
      .sort((a, b) => scoreWord(b) - scoreWord(a))
      .slice(0, 50);

    // Quality adjectives for descriptive names
    sources.qualityAdjectives = sources.validAdjectives
      .filter(w => w.length >= 4 && w.length <= 9)
      .sort((a, b) => scoreWord(b) - scoreWord(a))
      .slice(0, 40);

    secureLog.debug('🔧 Word sources pre-filtering complete:', {
      allValidWords: sources.allValidWords.length,
      shortWords: sources.shortWords.length,
      mediumWords: sources.mediumWords.length,
      longWords: sources.longWords.length,
      qualityNouns: sources.qualityNouns.length,
      qualityAdjectives: sources.qualityAdjectives.length
    });
  }

  // Helper methods
  private getPoeticSeedWords(mood?: string, genre?: string): { emotional: string[], sensory: string[] } {
    const seeds: { emotional: string[], sensory: string[] } = { emotional: [], sensory: [] };
    
    const moodSeeds: Record<string, { emotional: string[], sensory: string[] }> = {
      dark: { emotional: ['shadow', 'mystery', 'void'], sensory: ['black', 'cold', 'heavy'] },
      bright: { emotional: ['joy', 'light', 'hope'], sensory: ['shine', 'warm', 'glow'] },
      mysterious: { emotional: ['secret', 'unknown', 'enigma'], sensory: ['mist', 'veil', 'hidden'] },
      energetic: { emotional: ['power', 'force', 'surge'], sensory: ['electric', 'rush', 'blast'] },
      melancholy: { emotional: ['sorrow', 'longing', 'wistful'], sensory: ['rain', 'grey', 'fade'] },
      ethereal: { emotional: ['dream', 'spirit', 'transcend'], sensory: ['float', 'light', 'air'] },
      aggressive: { emotional: ['rage', 'fierce', 'fury'], sensory: ['sharp', 'loud', 'hard'] },
      peaceful: { emotional: ['calm', 'serene', 'gentle'], sensory: ['soft', 'quiet', 'smooth'] },
      nostalgic: { emotional: ['memory', 'past', 'yearning'], sensory: ['old', 'warm', 'faded'] },
      futuristic: { emotional: ['progress', 'vision', 'beyond'], sensory: ['chrome', 'neon', 'digital'] },
      romantic: { emotional: ['love', 'passion', 'desire'], sensory: ['rose', 'silk', 'velvet'] },
      epic: { emotional: ['glory', 'triumph', 'legend'], sensory: ['vast', 'grand', 'mighty'] }
    };
    
    const genreSeeds: Record<string, { emotional: string[], sensory: string[] }> = {
      rock: { emotional: ['rebel', 'freedom', 'raw'], sensory: ['loud', 'rough', 'electric'] },
      metal: { emotional: ['power', 'darkness', 'intensity'], sensory: ['heavy', 'sharp', 'iron'] },
      jazz: { emotional: ['soul', 'groove', 'cool'], sensory: ['smooth', 'warm', 'blue'] },
      electronic: { emotional: ['future', 'pulse', 'synthetic'], sensory: ['digital', 'bright', 'pulse'] },
      folk: { emotional: ['story', 'roots', 'simple'], sensory: ['wood', 'earth', 'natural'] },
      classical: { emotional: ['elegance', 'tradition', 'beauty'], sensory: ['grand', 'refined', 'timeless'] },
      'hip-hop': { emotional: ['street', 'flow', 'real'], sensory: ['urban', 'beat', 'bass'] },
      country: { emotional: ['home', 'heart', 'simple'], sensory: ['dust', 'road', 'barn'] },
      blues: { emotional: ['pain', 'soul', 'truth'], sensory: ['deep', 'raw', 'night'] },
      reggae: { emotional: ['peace', 'unity', 'spirit'], sensory: ['island', 'sun', 'wave'] },
      punk: { emotional: ['rebel', 'anger', 'chaos'], sensory: ['fast', 'loud', 'raw'] },
      indie: { emotional: ['unique', 'authentic', 'intimate'], sensory: ['soft', 'quirky', 'warm'] },
      pop: { emotional: ['fun', 'bright', 'catchy'], sensory: ['color', 'shine', 'bubble'] },
      alternative: { emotional: ['different', 'edge', 'mood'], sensory: ['texture', 'angle', 'shade'] }
    };
    
    if (mood && moodSeeds[mood]) {
      seeds.emotional = moodSeeds[mood].emotional;
      seeds.sensory = moodSeeds[mood].sensory;
    }
    
    if (genre && genreSeeds[genre]) {
      seeds.emotional = [...seeds.emotional, ...genreSeeds[genre].emotional];
      seeds.sensory = [...seeds.sensory, ...genreSeeds[genre].sensory];
    }
    
    if (seeds.emotional.length === 0) {
      seeds.emotional = ['soul', 'heart', 'dream'];
      seeds.sensory = ['light', 'sound', 'color'];
    }
    
    return seeds;
  }

  private getAdjectiveSeeds(mood?: string, genre?: string): string[] {
    const baseSeeds = ['bright', 'dark', 'wild'];
    
    if (mood === 'dark') return ['shadow', 'grim', 'haunting'];
    if (mood === 'bright') return ['radiant', 'vibrant', 'luminous'];
    if (mood === 'energetic') return ['electric', 'fierce', 'dynamic'];
    
    if (genre === 'metal') return ['heavy', 'brutal', 'savage'];
    if (genre === 'jazz') return ['smooth', 'cool', 'sophisticated'];
    if (genre === 'electronic') return ['digital', 'synthetic', 'cyber'];
    
    return baseSeeds;
  }

  private getNounSeeds(mood?: string, genre?: string): string[] {
    const baseSeeds = ['soul', 'heart', 'spirit'];
    
    if (mood === 'dark') return ['shadow', 'void', 'abyss'];
    if (mood === 'bright') return ['light', 'sun', 'star'];
    if (mood === 'mysterious') return ['enigma', 'mystery', 'secret'];
    
    if (genre === 'rock') return ['thunder', 'storm', 'power'];
    if (genre === 'folk') return ['river', 'mountain', 'tree'];
    if (genre === 'electronic') return ['pulse', 'wave', 'circuit'];
    
    return baseSeeds;
  }

  private getVerbSeeds(mood?: string, genre?: string): string[] {
    const baseSeeds = ['rise', 'fall', 'flow'];
    
    if (mood === 'aggressive') return ['strike', 'crush', 'explode'];
    if (mood === 'peaceful') return ['drift', 'float', 'breathe'];
    if (mood === 'energetic') return ['surge', 'pulse', 'ignite'];
    
    if (genre === 'rock') return ['rock', 'roll', 'thunder'];
    if (genre === 'jazz') return ['swing', 'groove', 'improvise'];
    
    return baseSeeds;
  }

  private isActionWord(word: string): boolean {
    if (!word || word.length < 3) return false;
    
    const actionEndings = ['ing', 'ed', 'er', 'es'];
    const actionPrefixes = ['re', 'un', 'dis', 'over', 'under', 'out'];
    const commonVerbs = [
      'run', 'jump', 'fly', 'dance', 'sing', 'play', 'fight', 'create',
      'destroy', 'build', 'break', 'make', 'take', 'give', 'move', 'shake',
      'rise', 'fall', 'burn', 'freeze', 'melt', 'flow', 'crash', 'explode',
      'whisper', 'scream', 'roar', 'echo', 'resonate', 'vibrate', 'pulse'
    ];
    
    if (commonVerbs.includes(word.toLowerCase())) return true;
    
    for (const ending of actionEndings) {
      if (word.endsWith(ending)) return true;
    }
    
    for (const prefix of actionPrefixes) {
      if (word.startsWith(prefix)) return true;
    }
    
    return false;
  }

  private getFallbackGenreTerms(genre: string): string[] {
    const genreTerms: Record<string, string[]> = {
      rock: ['guitar', 'electric', 'power', 'thunder'],
      metal: ['steel', 'iron', 'heavy', 'brutal'],
      jazz: ['blue', 'smooth', 'swing', 'groove'],
      electronic: ['digital', 'cyber', 'neon', 'pulse'],
      folk: ['acoustic', 'wooden', 'earth', 'roots'],
      classical: ['symphony', 'orchestra', 'grand', 'elegant'],
      'hip-hop': ['beat', 'flow', 'street', 'rhythm'],
      country: ['dust', 'road', 'truck', 'barn'],
      blues: ['soul', 'pain', 'night', 'deep'],
      reggae: ['island', 'sun', 'wave', 'peace'],
      punk: ['riot', 'anarchy', 'rebel', 'chaos'],
      indie: ['bedroom', 'vinyl', 'coffee', 'analog'],
      pop: ['sugar', 'candy', 'bubble', 'sparkle'],
      alternative: ['edge', 'strange', 'different', 'shadow']
    };
    
    return genreTerms[genre] || ['music', 'sound', 'rhythm', 'melody'];
  }
}