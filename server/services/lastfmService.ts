// Using native fetch API (available in Node.js 18+)
import { secureLog } from '../utils/secureLogger';

interface LastFmTag {
  name: string;
  count: number;
  url?: string;
}

interface LastFmResponse {
  toptags?: {
    tag: LastFmTag[] | LastFmTag;
  };
  similartags?: {
    tag: LastFmTag[] | LastFmTag;
  };
  topartists?: {
    artist: any[] | any;
  };
  tag?: LastFmTag[];
}

interface GenreVocabulary {
  genreTerms: string[];
  relatedGenres: string[];
  descriptiveWords: string[];
  confidence: number;
}

export class LastFmService {
  private readonly baseUrl = 'https://ws.audioscrobbler.com/2.0/';
  private readonly apiKey: string;
  private readonly cache = new Map<string, any>();
  private readonly cacheTimeout = 1000 * 60 * 60; // 1 hour cache

  constructor() {
    // Use a public Last.fm API key or environment variable
    this.apiKey = process.env.LASTFM_API_KEY || 'b25b959554ed76058ac220b7b2e0a026'; // Public demo key
  }

  /**
   * Get genre-specific vocabulary from Last.fm for enhanced name generation
   */
  async getGenreVocabulary(genre: string): Promise<GenreVocabulary> {
    const cacheKey = `genre_vocab_${genre.toLowerCase()}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      // Get genre information and similar genres
      const [genreInfo, similarGenres, topArtists] = await Promise.all([
        this.getGenreInfo(genre),
        this.getSimilarGenres(genre),
        this.getTopArtistsByGenre(genre, 10)
      ]);

      // Extract vocabulary from genre data
      const genreTerms = this.extractGenreTerms(genre, similarGenres);
      const descriptiveWords = await this.extractDescriptiveWords(topArtists, genre);
      
      const vocabulary: GenreVocabulary = {
        genreTerms,
        relatedGenres: similarGenres.map(g => g.name),
        descriptiveWords,
        confidence: this.calculateConfidence(genreInfo, similarGenres, topArtists)
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: vocabulary,
        timestamp: Date.now()
      });

      secureLog.debug(`Generated vocabulary for genre "${genre}":`, {
        genreTerms: vocabulary.genreTerms.length,
        relatedGenres: vocabulary.relatedGenres.length,
        descriptiveWords: vocabulary.descriptiveWords.length,
        confidence: vocabulary.confidence
      });

      return vocabulary;

    } catch (error) {
      secureLog.error(`Error fetching genre vocabulary for "${genre}", using XAI fallback:`, error);
      
      // Use XAI fallback when Last.fm fails
      try {
        const { xaiFallbackService } = await import('./xaiFallbackService');
        const fallbackVocabulary = await xaiFallbackService.generateLastFmFallback(genre);
        
        if (fallbackVocabulary.descriptiveWords.length > 0) {
          secureLog.info(`XAI fallback provided vocabulary for genre "${genre}"`);
          return {
            ...fallbackVocabulary,
            relatedGenres: []
          };
        }
      } catch (fallbackError) {
        secureLog.error('XAI fallback also failed:', fallbackError);
      }
      
      // Return minimal fallback vocabulary
      return {
        genreTerms: [genre],
        relatedGenres: [],
        descriptiveWords: [],
        confidence: 0.1
      };
    }
  }

  /**
   * Get information about a specific genre/tag
   */
  private async getGenreInfo(genre: string): Promise<any> {
    const params = new URLSearchParams({
      method: 'tag.getInfo',
      tag: genre,
      api_key: this.apiKey,
      format: 'json'
    });

    const response = await fetch(`${this.baseUrl}?${params}`);
    const data = await response.json() as any;
    return data.tag || null;
  }

  /**
   * Get genres similar to the specified genre
   */
  private async getSimilarGenres(genre: string, limit: number = 10): Promise<LastFmTag[]> {
    const params = new URLSearchParams({
      method: 'tag.getSimilar',
      tag: genre,
      api_key: this.apiKey,
      format: 'json',
      limit: limit.toString()
    });

    const response = await fetch(`${this.baseUrl}?${params}`);
    const data = await response.json() as LastFmResponse;
    
    if (data.similartags?.tag) {
      return Array.isArray(data.similartags.tag) ? data.similartags.tag : [data.similartags.tag];
    }
    
    return [];
  }

  /**
   * Get top artists for a specific genre
   */
  private async getTopArtistsByGenre(genre: string, limit: number = 20): Promise<any[]> {
    const params = new URLSearchParams({
      method: 'tag.getTopArtists',
      tag: genre,
      api_key: this.apiKey,
      format: 'json',
      limit: limit.toString()
    });

    const response = await fetch(`${this.baseUrl}?${params}`);
    const data = await response.json() as LastFmResponse;
    
    if (data.topartists?.artist) {
      return Array.isArray(data.topartists.artist) ? data.topartists.artist : [data.topartists.artist];
    }
    
    return [];
  }

  /**
   * Get genre tags for a specific artist
   */
  async getArtistGenres(artistName: string, limit: number = 10): Promise<LastFmTag[]> {
    const cacheKey = `artist_genres_${artistName.toLowerCase()}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const params = new URLSearchParams({
        method: 'artist.getTopTags',
        artist: artistName,
        api_key: this.apiKey,
        format: 'json',
        limit: limit.toString()
      });

      const response = await fetch(`${this.baseUrl}?${params}`);
      const data = await response.json() as LastFmResponse;
      
      let tags: LastFmTag[] = [];
      if (data.toptags?.tag) {
        tags = Array.isArray(data.toptags.tag) ? data.toptags.tag : [data.toptags.tag];
      }

      // Cache the result
      this.cache.set(cacheKey, {
        data: tags,
        timestamp: Date.now()
      });

      return tags;

    } catch (error) {
      secureLog.error(`Error fetching genres for artist "${artistName}":`, error);
      return [];
    }
  }

  /**
   * Get all popular genres from Last.fm
   */
  async getPopularGenres(limit: number = 50): Promise<LastFmTag[]> {
    const cacheKey = 'popular_genres';
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const params = new URLSearchParams({
        method: 'tag.getTopTags',
        api_key: this.apiKey,
        format: 'json',
        limit: limit.toString()
      });

      const response = await fetch(`${this.baseUrl}?${params}`);
      const data = await response.json() as LastFmResponse;
      
      let tags: LastFmTag[] = [];
      if (data.toptags?.tag) {
        tags = Array.isArray(data.toptags.tag) ? data.toptags.tag : [data.toptags.tag];
      }

      // Filter for music genres (exclude non-musical tags)
      const musicGenres = tags.filter(tag => this.isMusicGenre(tag.name));

      // Cache the result
      this.cache.set(cacheKey, {
        data: musicGenres,
        timestamp: Date.now()
      });

      return musicGenres;

    } catch (error) {
      secureLog.error('Error fetching popular genres:', error);
      return [];
    }
  }

  /**
   * Extract genre-related terms for vocabulary building
   */
  private extractGenreTerms(mainGenre: string, similarGenres: LastFmTag[]): string[] {
    const terms = new Set<string>();
    
    // Add main genre
    terms.add(mainGenre.toLowerCase());
    
    // Add similar genres
    similarGenres.forEach(genre => {
      const genreName = genre.name.toLowerCase();
      terms.add(genreName);
      
      // Extract compound words from genre names
      if (genreName.includes(' ')) {
        genreName.split(' ').forEach((word: string) => {
          if (word.length > 2) terms.add(word);
        });
      }
      
      // Extract hyphenated words
      if (genreName.includes('-')) {
        genreName.split('-').forEach((word: string) => {
          if (word.length > 2) terms.add(word);
        });
      }
    });

    return Array.from(terms);
  }

  /**
   * Extract descriptive words from artist names and genre context
   */
  private async extractDescriptiveWords(artists: any[], genre: string): Promise<string[]> {
    const descriptiveWords = new Set<string>();
    
    // Add genre-specific descriptive terms based on common patterns
    const genreDescriptors = this.getGenreDescriptors(genre);
    genreDescriptors.forEach((word: string) => descriptiveWords.add(word));
    
    // Extract meaningful words from artist names
    artists.slice(0, 10).forEach(artist => {
      if (artist.name) {
        const words = artist.name.toLowerCase()
          .replace(/[^a-z\s]/g, ' ')
          .split(/\s+/)
          .filter((word: string) => word.length > 2 && word.length < 12)
          .filter((word: string) => !this.isCommonWord(word));
        
        words.forEach((word: string) => descriptiveWords.add(word));
      }
    });

    return Array.from(descriptiveWords).slice(0, 20); // Limit to 20 words
  }

  /**
   * Get descriptive words commonly associated with specific genres
   */
  private getGenreDescriptors(genre: string): string[] {
    const descriptors: { [key: string]: string[] } = {
      rock: ['loud', 'electric', 'raw', 'power', 'drive', 'heavy', 'solid'],
      pop: ['catchy', 'bright', 'smooth', 'radio', 'chart', 'hit', 'sweet'],
      jazz: ['smooth', 'blue', 'swing', 'cool', 'hot', 'bebop', 'fusion'],
      electronic: ['synth', 'digital', 'pulse', 'beat', 'wave', 'circuit', 'neon'],
      metal: ['heavy', 'brutal', 'dark', 'iron', 'steel', 'forge', 'thunder'],
      folk: ['acoustic', 'roots', 'earth', 'wind', 'natural', 'simple', 'pure'],
      classical: ['symphony', 'elegant', 'grand', 'noble', 'refined', 'opus'],
      blues: ['soul', 'deep', 'mississippi', 'delta', 'raw', 'authentic'],
      reggae: ['island', 'rhythm', 'roots', 'natural', 'peaceful', 'spiritual'],
      punk: ['raw', 'rebel', 'fast', 'loud', 'street', 'underground', 'riot'],
      indie: ['alternative', 'underground', 'creative', 'unique', 'artisan'],
      country: ['rural', 'heartland', 'honest', 'simple', 'genuine', 'southern', 'cowboy', 'ranch', 'rodeo', 'barn', 'whiskey', 'boots', 'truck', 'dirt', 'road', 'spur', 'saddle', 'rusty', 'dusty', 'outlaw', 'lonesome', 'prairie', 'creek', 'trail', 'honky', 'tonk', 'fiddle', 'banjo'],
      hiphop: ['urban', 'street', 'rhythm', 'flow', 'beat', 'real', 'underground'],
      alternative: ['different', 'unique', 'alternative', 'independent', 'creative']
    };

    const genreKey = genre.toLowerCase().replace(/[^a-z]/g, '');
    return descriptors[genreKey] || descriptors[genre.toLowerCase()] || [];
  }

  /**
   * Filter out common/non-descriptive words
   */
  private isCommonWord(word: string): boolean {
    const commonWords = new Set([
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
      'by', 'from', 'up', 'about', 'into', 'over', 'after', 'band', 'music',
      'song', 'album', 'track', 'artist', 'group', 'sound', 'style', 'new',
      'old', 'good', 'bad', 'best', 'top', 'first', 'last', 'big', 'small'
    ]);
    
    return commonWords.has(word.toLowerCase());
  }

  /**
   * Check if a tag represents a music genre
   */
  private isMusicGenre(tagName: string): boolean {
    const nonMusicTags = new Set([
      'seen live', 'favorite', 'albums i own', 'beautiful', 'amazing',
      'love', 'awesome', 'cool', 'good', 'great', 'excellent', 'perfect',
      'male vocalists', 'female vocalists', 'british', 'american', 'canadian',
      'cover', 'remix', 'live', 'acoustic version', 'instrumental version'
    ]);
    
    return !nonMusicTags.has(tagName.toLowerCase()) && tagName.length < 25;
  }

  /**
   * Calculate confidence score based on data quality
   */
  private calculateConfidence(genreInfo: any, similarGenres: LastFmTag[], topArtists: any[]): number {
    let confidence = 0.5; // Base confidence
    
    if (genreInfo && genreInfo.wiki) confidence += 0.2;
    if (similarGenres.length > 5) confidence += 0.2;
    if (topArtists.length > 10) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.cache.clear();
    secureLog.debug('Last.fm service cache cleared');
  }
}

export const lastfmService = new LastFmService();