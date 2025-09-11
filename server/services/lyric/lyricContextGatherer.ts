import { 
  ComprehensiveAPIContext, 
  StreamlinedCoreContext,
  DatamuseContext, 
  SpotifyContext, 
  LastFmContext, 
  ConceptNetContext, 
  PoetryContext 
} from '../../types/lyricTypes';
import { DatamuseService } from '../datamuseService';
import { SpotifyService } from '../spotifyService';
import { lastfmService } from '../lastfmService';
import { conceptNetService } from '../conceptNetService';
import { poetryDbService } from '../poetryDbService';
import { apiContextCache } from '../cacheService';
import { secureLog } from '../../utils/secureLogger';
import { lyricCircuitBreakers } from '../../utils/circuitBreaker';
import { getLyricConfig, GENRE_CONFIG, WORD_VALIDATION_CONFIG } from '../../config/lyricConfig';

export class LyricContextGatherer {
  private datamuseService: DatamuseService;
  private spotifyService: SpotifyService;

  constructor() {
    this.datamuseService = new DatamuseService();
    this.spotifyService = new SpotifyService();
  }

  /**
   * Get comprehensive API context with caching
   */
  async getComprehensiveContext(genre?: string): Promise<ComprehensiveAPIContext> {
    const cacheKey = `context:${genre || 'contemporary'}`;
    
    // Try to get from cache first
    const cached = apiContextCache.get(cacheKey) as ComprehensiveAPIContext | null;
    if (cached) {
      secureLog.debug(`🎯 Cache hit for genre context: ${genre}`);
      return cached;
    }

    // Build fresh context
    const context = await this.buildFreshContext(genre);
    
    // Cache the result
    apiContextCache.set(cacheKey, context, 3600); // Cache for 1 hour
    
    return context;
  }

  /**
   * Get streamlined context with only 3-4 essential elements for focused AI generation
   */
  async getStreamlinedContext(genre?: string): Promise<StreamlinedCoreContext> {
    const cacheKey = `streamlined:${genre || 'contemporary'}`;
    
    // Try to get from cache first
    const cached = apiContextCache.get(cacheKey) as StreamlinedCoreContext | null;
    if (cached) {
      secureLog.debug(`🎯 Cache hit for streamlined genre context: ${genre}`);
      return cached;
    }

    // Get comprehensive context first (this will be cached)
    const comprehensive = await this.getComprehensiveContext(genre);
    
    // Extract only the most essential elements
    const streamlined = this.extractStreamlinedContext(comprehensive);
    
    // Cache the streamlined result separately
    apiContextCache.set(cacheKey, streamlined, 3600); // Cache for 1 hour
    
    secureLog.debug(`🎵 Built streamlined context for ${genre || 'contemporary'}: focused on ${this.countStreamlinedItems(streamlined)} essential items`);
    
    return streamlined;
  }

  /**
   * Extract the most essential context elements from comprehensive data
   */
  private extractStreamlinedContext(comprehensive: ComprehensiveAPIContext): StreamlinedCoreContext {
    return {
      // 1. Core vocabulary (Datamuse) - Most important for genre authenticity
      vocabulary: {
        genreTerms: comprehensive.datamuse.genreWords
          .filter(word => this.isHighValueTerm(word))
          .slice(0, 8),
        emotionalTerms: comprehensive.datamuse.emotionalWords
          .filter(word => this.isHighValueTerm(word))
          .slice(0, 6)
      },
      
      // 2. Cultural context (Last.fm preferred) - For style and authenticity
      cultural: {
        artists: comprehensive.lastfm.topArtists
          .filter(artist => artist && artist.length > 1)
          .slice(0, 4),
        relatedGenres: comprehensive.lastfm.relatedGenres
          .filter(genre => genre && genre.length > 2)
          .slice(0, 3)
      },
      
      // 3. Poetic elements (Poetry) - For lyrical sophistication
      poetic: {
        vocabulary: comprehensive.poetry.vocabulary
          .filter(word => this.isPoeticallyUseful(word))
          .slice(0, 8),
        themes: comprehensive.poetry.themes
          .filter(theme => theme && theme.length > 2)
          .slice(0, 2)
      },
      
      // 4. Backup artists (Spotify) - Additional cultural context if Last.fm limited
      backup: {
        artists: comprehensive.spotify.genreArtists
          .filter(artist => artist && artist.length > 1)
          .filter(artist => !comprehensive.lastfm.topArtists.includes(artist)) // Avoid duplicates
          .slice(0, 3)
      }
    };
  }

  /**
   * Check if a term is high-value for lyric generation
   */
  private isHighValueTerm(word: string): boolean {
    if (!word || word.length < 3) return false;
    
    // Exclude overly common words that don't add value
    const lowValueWords = ['the', 'and', 'but', 'for', 'you', 'are', 'not', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'man', 'may'];
    if (lowValueWords.includes(word.toLowerCase())) return false;
    
    // Must be reasonably lyrical and not too technical
    return this.isGoodLyricWord(word);
  }

  /**
   * Check if a word is poetically useful
   */
  private isPoeticallyUseful(word: string): boolean {
    if (!this.isHighValueTerm(word)) return false;
    
    // Prefer words that are evocative, emotional, or imagistic
    const poeticIndicators = ['heart', 'soul', 'dream', 'light', 'dark', 'fire', 'water', 'sky', 'moon', 'star', 'shadow', 'wind', 'rain', 'song', 'dance', 'whisper', 'echo', 'memory', 'hope', 'fear', 'love', 'pain', 'joy', 'sorrow'];
    
    return poeticIndicators.some(indicator => 
      word.toLowerCase().includes(indicator) || 
      indicator.includes(word.toLowerCase())
    ) || word.length >= 5; // Longer words tend to be more sophisticated
  }

  /**
   * Count total items in streamlined context
   */
  private countStreamlinedItems(context: StreamlinedCoreContext): number {
    return [
      ...context.vocabulary.genreTerms,
      ...context.vocabulary.emotionalTerms,
      ...context.cultural.artists,
      ...context.cultural.relatedGenres,
      ...context.poetic.vocabulary,
      ...context.poetic.themes,
      ...context.backup.artists
    ].filter(Boolean).length;
  }

  /**
   * Build fresh context from all APIs
   */
  private async buildFreshContext(genre?: string): Promise<ComprehensiveAPIContext> {
    const context: ComprehensiveAPIContext = {
      datamuse: {
        genreWords: [],
        emotionalWords: [],
        rhymeWords: [],
        sensoryWords: []
      },
      spotify: {
        genreArtists: [],
        moodTracks: [],
        audioFeatures: null
      },
      lastfm: {
        genreInfo: null,
        topArtists: [],
        relatedGenres: []
      },
      conceptnet: {
        genreConcepts: [],
        emotionalConcepts: [],
        culturalAssociations: []
      },
      poetry: {
        poeticPhrases: [],
        vocabulary: [],
        imagery: [],
        themes: []
      }
    };

    try {
      // Execute all API calls in parallel for better performance
      const apiPromises = [];

      // Add all API fetch promises
      apiPromises.push(this.fetchDatamuseContext(genre || 'contemporary', context));
      
      if (genre) {
        apiPromises.push(this.fetchSpotifyContext(genre, context));
        apiPromises.push(this.fetchLastFmContext(genre, context));
        apiPromises.push(this.fetchConceptNetContext(genre, context));
      }
      
      apiPromises.push(this.fetchPoetryContext(genre, context));

      // Execute all API calls concurrently with timeout protection
      await Promise.allSettled(apiPromises);

      const totalWords = this.countTotalVocabulary(context);
      secureLog.debug(`🎵 Built comprehensive context for ${genre || 'contemporary'}: ${totalWords} total vocabulary items`);

    } catch (error) {
      secureLog.error('Error building comprehensive API context:', error);
    }

    return context;
  }

  /**
   * Fetch Datamuse context with circuit breaker
   */
  private async fetchDatamuseContext(genre: string, context: ComprehensiveAPIContext): Promise<void> {
    try {
      await lyricCircuitBreakers.datamuse.execute(async () => {
      const genreSeeds = this.getGenreSeedWords(genre);
      const emotionalSeeds = this.getEmotionalSeeds(genre);
      
      const primaryResults = await this.datamuseService.findWords({
        triggers: genreSeeds.slice(0, 2).join(','),
        topics: `${genre || 'music'} emotion lyrics`,
        maxResults: 40
      });
      
      const filteredPrimary = primaryResults
        .filter(w => this.isGoodLyricWord(w.word))
        .map(w => w.word);
      
      context.datamuse.genreWords = filteredPrimary.slice(0, 12);
      context.datamuse.emotionalWords = filteredPrimary.slice(12, 20);
      context.datamuse.sensoryWords = filteredPrimary.slice(20, 28);
      
      // Get rhyme words separately
      const rhymeResults = await this.datamuseService.findWords({
        rhymesWith: emotionalSeeds[0],
        maxResults: 20
      });
      
      context.datamuse.rhymeWords = rhymeResults
        .filter(w => this.isGoodLyricWord(w.word))
        .map(w => w.word)
        .slice(0, 8);
      });
    } catch (error) {
      secureLog.error('Error fetching Datamuse context:', error);
    }
  }

  /**
   * Fetch Spotify context with circuit breaker
   */
  private async fetchSpotifyContext(genre: string, context: ComprehensiveAPIContext): Promise<void> {
    try {
      await lyricCircuitBreakers.spotify.execute(async () => {
        if (await this.spotifyService.isAvailable()) {
        // Get genre-specific artists
        const genreArtists = await this.spotifyService.getGenreArtists(genre);
        context.spotify.genreArtists = genreArtists.slice(0, 10).map(artist => artist.name);
        
        // Get mood-based tracks for the genre
        const moodKeywords = this.getMoodKeywords(genre);
        const trackSearches = moodKeywords.map(mood => 
          this.spotifyService.searchTracks(`${mood} ${genre}`, 5)
        );
        
        const trackResults = await Promise.allSettled(trackSearches);
        const allTracks = trackResults
          .filter(r => r.status === 'fulfilled')
          .flatMap((r: any) => r.value || [])
          .filter(Boolean)
          .map((track: any) => track.name);
          
        context.spotify.moodTracks = [...new Set(allTracks)].slice(0, 15);
        
        // Try to get audio features for genre understanding
        const sampleTracks = await this.spotifyService.searchTracks(genre, 1);
        if (sampleTracks.length > 0) {
          // Note: getAudioFeatures would need to be implemented in SpotifyService
          // For now, we'll leave audioFeatures as null
          context.spotify.audioFeatures = null;
        }
      }
      });
    } catch (error) {
      secureLog.error('Error fetching Spotify context:', error);
    }
  }

  /**
   * Fetch Last.fm context with circuit breaker
   */
  private async fetchLastFmContext(genre: string, context: ComprehensiveAPIContext): Promise<void> {
    try {
      await lyricCircuitBreakers.lastfm.execute(async () => {
      // Get genre vocabulary which includes all the information we need
      const genreVocabulary = await lastfmService.getGenreVocabulary(genre);
      
      if (genreVocabulary) {
        // Set genre info (simplified as we don't have direct access to detailed info)
        context.lastfm.genreInfo = {
          name: genre,
          reach: genreVocabulary.confidence || 0,
          tags: genreVocabulary.genreTerms || []
        };
        
        // Set related genres
        context.lastfm.relatedGenres = genreVocabulary.relatedGenres || [];
        
        // We don't have direct access to artists, but we can use descriptive words
        context.lastfm.topArtists = genreVocabulary.descriptiveWords?.slice(0, 10) || [];
      }
      });
    } catch (error) {
      secureLog.error('Error fetching Last.fm context:', error);
    }
  }

  /**
   * Fetch ConceptNet context with circuit breaker
   */
  private async fetchConceptNetContext(genre: string, context: ComprehensiveAPIContext): Promise<void> {
    try {
      await lyricCircuitBreakers.conceptnet.execute(async () => {
      // Get genre-related concepts
      const genreConcepts = await conceptNetService.getRelatedConcepts(genre, 15);
      context.conceptnet.genreConcepts = genreConcepts
        .map(c => c.word)
        .filter(w => this.isGoodLyricWord(w))
        .slice(0, 10);
      
      // Get emotional associations
      const emotionalWords = ['love', 'pain', 'joy', 'sorrow', 'hope'];
      const emotionalResults = await Promise.allSettled(
        emotionalWords.map(emotion => 
          conceptNetService.getRelatedConcepts(`${genre} ${emotion}`, 5)
        )
      );
      
      context.conceptnet.emotionalConcepts = emotionalResults
        .filter(r => r.status === 'fulfilled')
        .flatMap((r: any) => r.value || [])
        .map(c => c.word)
        .filter(w => this.isGoodLyricWord(w))
        .slice(0, 12);
      
      // Get cultural associations using getCulturalConnections method
      const culturalConnections = await conceptNetService.getCulturalConnections(genre);
      context.conceptnet.culturalAssociations = culturalConnections
        .filter(w => this.isGoodLyricWord(w))
        .slice(0, 8);
      });
    } catch (error) {
      secureLog.error('Error fetching ConceptNet context:', error);
    }
  }

  /**
   * Fetch Poetry context with circuit breaker
   */
  private async fetchPoetryContext(genre: string | undefined, context: ComprehensiveAPIContext): Promise<void> {
    try {
      await lyricCircuitBreakers.poetry.execute(async () => {
      // Use the getPoetryContext method from poetryDbService
      const poetryContext = await poetryDbService.getPoetryContext(genre);
      
      if (poetryContext) {
        context.poetry.poeticPhrases = poetryContext.poeticPhrases || [];
        context.poetry.vocabulary = poetryContext.vocabulary || [];
        context.poetry.imagery = poetryContext.imagery || [];
        context.poetry.themes = poetryContext.themes || [];
      }
      
      // If we didn't get enough vocabulary, use the themes we would have used
      if (context.poetry.themes.length === 0) {
        context.poetry.themes = genre ? this.getPoetryThemes(genre) : ['love', 'nature', 'time'];
      }
      });
    } catch (error) {
      secureLog.error('Error fetching Poetry context:', error);
    }
  }

  // Helper methods (simplified versions from original service)
  
  private getGenreSeedWords(genre: string): string[] {
    return GENRE_CONFIG.seeds[genre] || GENRE_CONFIG.seeds.default;
  }

  private getEmotionalSeeds(genre: string): string[] {
    return GENRE_CONFIG.emotions[genre] || GENRE_CONFIG.emotions.default;
  }

  private getMoodKeywords(genre: string): string[] {
    return GENRE_CONFIG.moods[genre] || GENRE_CONFIG.moods.default;
  }

  private getPoetryThemes(genre: string): string[] {
    return GENRE_CONFIG.themes[genre] || GENRE_CONFIG.themes.default;
  }

  private isGoodLyricWord(word: string): boolean {
    if (!word || word.length < WORD_VALIDATION_CONFIG.minLength) return false;
    if (word.length > WORD_VALIDATION_CONFIG.maxLength) return false;
    
    // Check exclusion patterns
    for (const pattern of WORD_VALIDATION_CONFIG.excludePatterns) {
      if (pattern.test(word)) return false;
    }
    
    // Check common words
    if (WORD_VALIDATION_CONFIG.excludeCommonWords.includes(word.toLowerCase())) return false;
    
    return true;
  }

  private isImageryWord(word: string): boolean {
    return WORD_VALIDATION_CONFIG.imageryKeywords.some(pattern => word.includes(pattern));
  }

  private countTotalVocabulary(context: ComprehensiveAPIContext): number {
    return [
      ...context.datamuse.genreWords,
      ...context.datamuse.emotionalWords,
      ...context.datamuse.rhymeWords,
      ...context.datamuse.sensoryWords,
      ...context.spotify.genreArtists,
      ...context.spotify.moodTracks,
      ...context.lastfm.topArtists,
      ...context.lastfm.relatedGenres,
      ...context.conceptnet.genreConcepts,
      ...context.conceptnet.emotionalConcepts,
      ...context.conceptnet.culturalAssociations,
      ...context.poetry.vocabulary,
      ...context.poetry.imagery,
      ...context.poetry.themes
    ].filter(Boolean).length;
  }
}