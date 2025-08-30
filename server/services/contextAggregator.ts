/**
 * Context Aggregator Service
 * Collects and enriches context from all 5 APIs (Spotify, Last.fm, ConceptNet, Datamuse, PoetryDB)
 * to provide comprehensive musical and semantic context for AI generation
 */

import { SpotifyService } from './spotifyService';
import { LastFmService } from './lastfmService';
import { ConceptNetService } from './conceptNetService';
import { DatamuseService } from './datamuseService';
import { PoetryDbService } from './poetryDbService';
import { secureLog } from '../utils/secureLogger';
// Define generation parameters interface
export interface GenerationParams {
  genre: string;
  mood: string;
  wordCount?: number;
  type?: 'band' | 'song';
}

export interface EnrichedContext {
  // Direct vocabulary from APIs
  spotifyArtists: string[];
  spotifyTracks: string[];
  lastfmTags: string[];
  lastfmSimilarArtists: string[];
  
  // Semantic and linguistic context
  conceptNetAssociations: string[];
  datamuseWords: {
    related: string[];
    rhymes: string[];
    similar: string[];
    adjectives: string[];
  };
  poetryVocabulary: string[];
  
  // Processed insights
  genreCharacteristics: string[];
  moodDescriptors: string[];
  musicalTerms: string[];
  culturalReferences: string[];
  
  // Meta information
  primaryGenre: string;
  primaryMood: string;
  contextQuality: 'rich' | 'moderate' | 'basic';
}

export class ContextAggregatorService {
  private spotifyService: SpotifyService;
  private lastFmService: LastFmService;
  private conceptNetService: ConceptNetService;
  private datamuseService: DatamuseService;
  private poetryDbService: PoetryDbService;

  constructor() {
    this.spotifyService = new SpotifyService();
    this.lastFmService = new LastFmService();
    this.conceptNetService = new ConceptNetService();
    this.datamuseService = new DatamuseService();
    this.poetryDbService = new PoetryDbService();
  }

  async aggregateContext(params: GenerationParams): Promise<EnrichedContext> {
    const { genre, mood } = params;
    
    // Skip context aggregation for "general" genre to improve performance
    if (genre === 'general') {
      secureLog.info('⚡ Using minimal context for general genre');
      return this.getMinimalContext(mood);
    }
    
    secureLog.info(`🔄 Aggregating context for ${genre}/${mood}`);

    // Parallel API calls for all context
    const [
      spotifyContext,
      lastfmContext,
      conceptNetContext,
      datamuseContext,
      poetryContext
    ] = await Promise.all([
      this.getSpotifyContext(genre),
      this.getLastFmContext(genre),
      this.getConceptNetContext(genre, mood),
      this.getDatamuseContext(genre, mood),
      this.getPoetryContext(genre, mood)
    ]);

    // Process and enrich the combined context
    const enrichedContext = this.processAndEnrichContext({
      spotifyContext,
      lastfmContext,
      conceptNetContext,
      datamuseContext,
      poetryContext,
      genre,
      mood
    });

    secureLog.info(`✅ Aggregated ${enrichedContext.contextQuality} context with ${this.countTotalTerms(enrichedContext)} unique terms`);
    return enrichedContext;
  }

  private async getSpotifyContext(genre: string): Promise<{ artists: string[], tracks: string[] }> {
    try {
      // Search for artists and tracks related to the genre
      const [artists, tracks] = await Promise.all([
        this.spotifyService.searchArtists(genre, 20),
        this.spotifyService.searchTracks(genre, 20)
      ]);
      
      return {
        artists: artists.map(a => a.name),
        tracks: tracks.map(t => t.name)
      };
    } catch (error) {
      secureLog.warn('Spotify context fetch failed:', error);
      return { artists: [], tracks: [] };
    }
  }

  private async getLastFmContext(genre: string): Promise<{ tags: string[], similar: string[] }> {
    try {
      // Get genre vocabulary from Last.fm
      const vocabulary = await this.lastFmService.getGenreVocabulary(genre);
      
      return {
        tags: [...vocabulary.genreTerms, ...vocabulary.descriptiveWords].slice(0, 20),
        similar: vocabulary.relatedGenres.slice(0, 10)
      };
    } catch (error) {
      secureLog.warn('Last.fm context fetch failed:', error);
      return { tags: [], similar: [] };
    }
  }

  private async getConceptNetContext(genre: string, mood: string): Promise<string[]> {
    try {
      // Get related concepts for both genre and mood
      const [genreConcepts, moodConcepts] = await Promise.all([
        this.conceptNetService.getRelatedConcepts(genre),
        this.conceptNetService.getRelatedConcepts(mood)
      ]);
      
      // Combine and extract unique concept words
      const allConcepts = [...genreConcepts, ...moodConcepts];
      const uniqueWords = new Set<string>();
      
      allConcepts.forEach(concept => {
        if (concept.word) {
          uniqueWords.add(concept.word);
        }
      });
      
      return Array.from(uniqueWords);
    } catch (error) {
      secureLog.warn('ConceptNet context fetch failed:', error);
      return [];
    }
  }

  private async getDatamuseContext(genre: string, mood: string): Promise<any> {
    try {
      // Use findWords with different options for comprehensive vocabulary
      const [genreRelated, moodRelated, rhymes, adjectives] = await Promise.all([
        this.datamuseService.findWords({ meansLike: genre, maxResults: 50 }),
        this.datamuseService.findWords({ meansLike: mood, maxResults: 50 }),
        this.datamuseService.findWords({ rhymesWith: genre, maxResults: 20 }),
        this.datamuseService.findWords({ adjsForNoun: genre, maxResults: 30 })
      ]);

      return {
        related: [...genreRelated.map(w => w.word), ...moodRelated.map(w => w.word)],
        rhymes: rhymes.map(w => w.word),
        similar: [], // Similar sounding not needed for context
        adjectives: adjectives.map(w => w.word)
      };
    } catch (error) {
      secureLog.warn('Datamuse context fetch failed:', error);
      return { related: [], rhymes: [], similar: [], adjectives: [] };
    }
  }

  private async getPoetryContext(genre: string, mood: string): Promise<string[]> {
    try {
      const context = await this.poetryDbService.getPoetryContext(genre, mood);
      // Extract vocabulary from poetry context
      return context.vocabulary || [];
    } catch (error) {
      secureLog.warn('PoetryDB context fetch failed:', error);
      return [];
    }
  }

  private processAndEnrichContext(rawContext: any): EnrichedContext {
    const { spotifyContext, lastfmContext, conceptNetContext, datamuseContext, poetryContext, genre, mood } = rawContext;

    // Extract genre characteristics from all sources
    const genreCharacteristics = this.extractGenreCharacteristics(
      spotifyContext,
      lastfmContext,
      conceptNetContext
    );

    // Extract mood descriptors
    const moodDescriptors = this.extractMoodDescriptors(
      mood,
      datamuseContext,
      poetryContext
    );

    // Extract musical terms
    const musicalTerms = this.extractMusicalTerms(
      spotifyContext.tracks,
      lastfmContext.tags
    );

    // Extract cultural references
    const culturalReferences = this.extractCulturalReferences(
      spotifyContext.artists,
      lastfmContext.similar,
      conceptNetContext
    );

    // Determine context quality
    const contextQuality = this.assessContextQuality(rawContext);

    return {
      spotifyArtists: spotifyContext.artists.slice(0, 20),
      spotifyTracks: spotifyContext.tracks.slice(0, 20),
      lastfmTags: lastfmContext.tags.slice(0, 15),
      lastfmSimilarArtists: lastfmContext.similar.slice(0, 10),
      conceptNetAssociations: conceptNetContext.slice(0, 30),
      datamuseWords: {
        related: datamuseContext.related.slice(0, 40),
        rhymes: datamuseContext.rhymes.slice(0, 20),
        similar: datamuseContext.similar.slice(0, 20),
        adjectives: datamuseContext.adjectives.slice(0, 25)
      },
      poetryVocabulary: poetryContext.slice(0, 30),
      genreCharacteristics,
      moodDescriptors,
      musicalTerms,
      culturalReferences,
      primaryGenre: genre,
      primaryMood: mood,
      contextQuality
    };
  }

  private extractGenreCharacteristics(spotify: any, lastfm: any, conceptNet: string[]): string[] {
    const characteristics = new Set<string>();
    
    // Extract from track names
    spotify.tracks.forEach((track: string) => {
      const words = track.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 3 && !this.isCommonWord(word)) {
          characteristics.add(word);
        }
      });
    });

    // Extract from tags
    lastfm.tags.forEach((tag: string) => {
      if (!this.isGenericTag(tag)) {
        characteristics.add(tag.toLowerCase());
      }
    });

    // Add concept associations
    conceptNet.slice(0, 10).forEach(concept => characteristics.add(concept));

    return Array.from(characteristics).slice(0, 20);
  }

  private extractMoodDescriptors(mood: string, datamuse: any, poetry: string[]): string[] {
    const descriptors = new Set<string>([mood]);
    
    // Add adjectives that match the mood
    datamuse.adjectives.forEach((adj: string) => {
      if (this.matchesMood(adj, mood)) {
        descriptors.add(adj);
      }
    });

    // Add poetic words that evoke the mood
    poetry.forEach(word => {
      if (this.isEmotionalWord(word)) {
        descriptors.add(word);
      }
    });

    return Array.from(descriptors).slice(0, 15);
  }

  private extractMusicalTerms(tracks: string[], tags: string[]): string[] {
    const musicalWords = [
      'rhythm', 'melody', 'harmony', 'beat', 'sound', 'song', 'tune',
      'chord', 'note', 'pitch', 'tempo', 'groove', 'riff', 'hook'
    ];
    
    const terms = new Set<string>();
    
    // Find musical terms in track names
    tracks.forEach(track => {
      const words = track.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (musicalWords.includes(word) || word.includes('music')) {
          terms.add(word);
        }
      });
    });

    // Add relevant tags
    tags.forEach(tag => {
      if (this.isMusicalTag(tag)) {
        terms.add(tag.toLowerCase());
      }
    });

    return Array.from(terms).slice(0, 10);
  }

  private extractCulturalReferences(artists: string[], similar: string[], concepts: string[]): string[] {
    const references = new Set<string>();
    
    // Extract unique words from artist names
    artists.forEach(artist => {
      const words = artist.split(/\s+/);
      words.forEach(word => {
        if (word.length > 3 && !this.isCommonWord(word)) {
          references.add(word);
        }
      });
    });

    // Add cultural concepts
    concepts.forEach(concept => {
      if (this.isCulturalConcept(concept)) {
        references.add(concept);
      }
    });

    return Array.from(references).slice(0, 15);
  }

  private assessContextQuality(context: any): 'rich' | 'moderate' | 'basic' {
    let score = 0;
    
    if (context.spotifyContext.artists.length > 10) score++;
    if (context.spotifyContext.tracks.length > 10) score++;
    if (context.lastfmContext.tags.length > 5) score++;
    if (context.conceptNetContext.length > 10) score++;
    if (context.datamuseContext.related.length > 20) score++;
    if (context.poetryContext.length > 10) score++;

    if (score >= 5) return 'rich';
    if (score >= 3) return 'moderate';
    return 'basic';
  }

  private countTotalTerms(context: EnrichedContext): number {
    const allTerms = new Set([
      ...context.spotifyArtists,
      ...context.spotifyTracks,
      ...context.lastfmTags,
      ...context.conceptNetAssociations,
      ...context.datamuseWords.related,
      ...context.poetryVocabulary,
      ...context.genreCharacteristics,
      ...context.moodDescriptors
    ]);
    return allTerms.size;
  }

  private getMinimalContext(mood: string): EnrichedContext {
    return {
      // Empty arrays for minimal context
      spotifyArtists: [],
      spotifyTracks: [],
      lastfmTags: [],
      lastfmSimilarArtists: [],
      conceptNetAssociations: [],
      datamuseWords: {
        related: [],
        rhymes: [],
        similar: [],
        adjectives: []
      },
      poetryVocabulary: [],
      
      // Basic mood descriptors only
      genreCharacteristics: [],
      moodDescriptors: [mood],
      musicalTerms: [],
      culturalReferences: [],
      
      // Meta information
      primaryGenre: 'general',
      primaryMood: mood,
      contextQuality: 'basic'
    };
  }

  // Helper methods
  private isCommonWord(word: string): boolean {
    const common = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    return common.includes(word.toLowerCase());
  }

  private isGenericTag(tag: string): boolean {
    const generic = ['music', 'good', 'favorite', 'love', 'best', 'awesome'];
    return generic.includes(tag.toLowerCase());
  }

  private matchesMood(word: string, mood: string): boolean {
    const moodMap: Record<string, string[]> = {
      'dark': ['shadow', 'black', 'night', 'doom', 'grave'],
      'happy': ['bright', 'joy', 'sun', 'light', 'cheer'],
      'melancholy': ['sad', 'blue', 'rain', 'tear', 'sorrow'],
      'energetic': ['fire', 'power', 'rush', 'wild', 'fierce']
    };
    
    const moodWords = moodMap[mood] || [];
    return moodWords.some(m => word.includes(m));
  }

  private isEmotionalWord(word: string): boolean {
    const emotions = ['love', 'hate', 'fear', 'joy', 'sad', 'angry', 'hope', 'dream'];
    return emotions.some(e => word.toLowerCase().includes(e));
  }

  private isMusicalTag(tag: string): boolean {
    const musical = ['instrumental', 'acoustic', 'electronic', 'vocal', 'bass', 'guitar', 'drums'];
    return musical.some(m => tag.toLowerCase().includes(m));
  }

  private isCulturalConcept(concept: string): boolean {
    const cultural = ['art', 'culture', 'tradition', 'style', 'movement', 'era', 'scene'];
    return cultural.some(c => concept.toLowerCase().includes(c));
  }
}