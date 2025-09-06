import { 
  ComprehensiveAPIContext, 
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
   * Fetch Datamuse context
   */
  private async fetchDatamuseContext(genre: string, context: ComprehensiveAPIContext): Promise<void> {
    try {
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
        
    } catch (error) {
      secureLog.error('Error fetching Datamuse context:', error);
    }
  }

  /**
   * Fetch Spotify context
   */
  private async fetchSpotifyContext(genre: string, context: ComprehensiveAPIContext): Promise<void> {
    try {
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
    } catch (error) {
      secureLog.error('Error fetching Spotify context:', error);
    }
  }

  /**
   * Fetch Last.fm context
   */
  private async fetchLastFmContext(genre: string, context: ComprehensiveAPIContext): Promise<void> {
    try {
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
      
    } catch (error) {
      secureLog.error('Error fetching Last.fm context:', error);
    }
  }

  /**
   * Fetch ConceptNet context
   */
  private async fetchConceptNetContext(genre: string, context: ComprehensiveAPIContext): Promise<void> {
    try {
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
        
    } catch (error) {
      secureLog.error('Error fetching ConceptNet context:', error);
    }
  }

  /**
   * Fetch Poetry context
   */
  private async fetchPoetryContext(genre: string | undefined, context: ComprehensiveAPIContext): Promise<void> {
    try {
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
      
    } catch (error) {
      secureLog.error('Error fetching Poetry context:', error);
    }
  }

  // Helper methods (simplified versions from original service)
  
  private getGenreSeedWords(genre: string): string[] {
    const genreSeeds: Record<string, string[]> = {
      rock: ['electric', 'loud', 'rebel', 'guitar'],
      pop: ['catchy', 'bright', 'dance', 'radio'],
      country: ['home', 'road', 'heart', 'whiskey'],
      'hip-hop': ['street', 'real', 'flow', 'truth'],
      indie: ['dream', 'youth', 'city', 'night'],
      folk: ['story', 'wood', 'river', 'home'],
      metal: ['power', 'dark', 'rage', 'storm'],
      electronic: ['pulse', 'light', 'wave', 'future'],
      'jam band': ['groove', 'cosmic', 'journey', 'festival']
    };
    
    return genreSeeds[genre] || ['music', 'song', 'melody', 'rhythm'];
  }

  private getEmotionalSeeds(genre: string): string[] {
    const emotionalMap: Record<string, string[]> = {
      rock: ['anger', 'freedom', 'passion'],
      pop: ['love', 'joy', 'desire'],
      country: ['heartbreak', 'nostalgia', 'pride'],
      'hip-hop': ['struggle', 'success', 'respect'],
      indie: ['longing', 'wonder', 'melancholy'],
      folk: ['wisdom', 'peace', 'memory'],
      metal: ['fury', 'power', 'darkness'],
      electronic: ['euphoria', 'energy', 'transcendence'],
      'jam band': ['bliss', 'unity', 'exploration']
    };
    
    return emotionalMap[genre] || ['love', 'hope', 'dream'];
  }

  private getMoodKeywords(genre: string): string[] {
    const moodMap: Record<string, string[]> = {
      rock: ['energetic', 'rebellious', 'powerful'],
      pop: ['upbeat', 'romantic', 'fun'],
      country: ['heartfelt', 'nostalgic', 'honest'],
      'hip-hop': ['confident', 'raw', 'authentic'],
      indie: ['dreamy', 'introspective', 'alternative'],
      folk: ['acoustic', 'storytelling', 'traditional'],
      metal: ['aggressive', 'intense', 'heavy'],
      electronic: ['atmospheric', 'rhythmic', 'futuristic'],
      'jam band': ['psychedelic', 'improvisational', 'groovy']
    };
    
    return moodMap[genre] || ['emotional', 'expressive', 'moving'];
  }

  private getPoetryThemes(genre: string): string[] {
    const themeMap: Record<string, string[]> = {
      rock: ['rebellion', 'youth', 'freedom'],
      pop: ['love', 'dreams', 'celebration'],
      country: ['home', 'loss', 'tradition'],
      'hip-hop': ['struggle', 'identity', 'triumph'],
      indie: ['solitude', 'discovery', 'change'],
      folk: ['nature', 'wisdom', 'journey'],
      metal: ['chaos', 'power', 'darkness'],
      electronic: ['future', 'technology', 'transformation'],
      'jam band': ['consciousness', 'universe', 'community']
    };
    
    return themeMap[genre] || ['life', 'love', 'time'];
  }

  private isGoodLyricWord(word: string): boolean {
    if (!word || word.length < 2) return false;
    if (word.length > 15) return false;
    if (/^\d+$/.test(word)) return false;
    if (/[^a-z'-]/i.test(word)) return false;
    
    const commonWords = ['the', 'and', 'but', 'for', 'are', 'was', 'were', 'been', 'have', 'has', 'had', 'does', 'did'];
    if (commonWords.includes(word.toLowerCase())) return false;
    
    return true;
  }

  private isImageryWord(word: string): boolean {
    const imageryPatterns = [
      'sun', 'moon', 'star', 'sky', 'cloud', 'rain', 'storm',
      'fire', 'water', 'earth', 'wind', 'stone', 'mountain',
      'tree', 'flower', 'rose', 'ocean', 'river', 'wave',
      'light', 'dark', 'shadow', 'bright', 'color', 'gold'
    ];
    
    return imageryPatterns.some(pattern => word.includes(pattern));
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