/**
 * Bandcamp API Service
 * Handles independent artists and underground music
 * Note: Bandcamp doesn't have an official public API
 * This service would need to be implemented via web scraping or unofficial APIs
 * Requires BANDCAMP_API_KEY environment variable (if using a third-party service)
 */

import { secureLog } from '../utils/secureLogger';

interface BandcampArtist {
  name: string;
  url: string;
  location?: string;
  genre?: string;
  followers?: number;
}

interface BandcampTrack {
  title: string;
  artist: string;
  album?: string;
  url: string;
  tags?: string[];
}

export class BandcampService {
  private static instance: BandcampService;
  private apiKey: string | null = null;
  
  static getInstance(): BandcampService {
    if (!BandcampService.instance) {
      BandcampService.instance = new BandcampService();
    }
    return BandcampService.instance;
  }

  constructor() {
    this.apiKey = process.env.BANDCAMP_API_KEY || null;
  }

  /**
   * Check if Bandcamp API is available
   * Note: Bandcamp doesn't have an official public API
   */
  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) {
      secureLog.debug('Bandcamp API unavailable - missing BANDCAMP_API_KEY');
      return false;
    }

    // TODO: Implement when we have a Bandcamp API solution
    // This could be via a third-party service or web scraping
    return false;
  }

  /**
   * Search for artists on Bandcamp
   * Note: Implementation pending - requires API key or scraping solution
   */
  async searchArtists(query: string, limit: number = 20): Promise<BandcampArtist[]> {
    if (!this.apiKey) {
      secureLog.debug('Bandcamp search skipped - no API key');
      return [];
    }

    try {
      // TODO: Implement Bandcamp artist search
      // This would depend on the chosen API solution (third-party service or scraping)
      
      secureLog.debug('Bandcamp artist search not yet implemented', { query });
      return [];

    } catch (error) {
      secureLog.error('Bandcamp artist search failed', { 
        error: error instanceof Error ? error.message : String(error), 
        query 
      });
      return [];
    }
  }

  /**
   * Search for tracks on Bandcamp
   * Note: Implementation pending - requires API key or scraping solution
   */
  async searchTracks(query: string, limit: number = 20): Promise<BandcampTrack[]> {
    if (!this.apiKey) {
      secureLog.debug('Bandcamp search skipped - no API key');
      return [];
    }

    try {
      // TODO: Implement Bandcamp track search
      
      secureLog.debug('Bandcamp track search not yet implemented', { query });
      return [];

    } catch (error) {
      secureLog.error('Bandcamp track search failed', { 
        error: error instanceof Error ? error.message : String(error), 
        query 
      });
      return [];
    }
  }

  /**
   * Verify artist name on Bandcamp
   */
  async verifyArtistName(name: string): Promise<{
    exists: boolean;
    matches: Array<{
      name: string;
      url: string;
      location?: string;
      genre?: string;
      confidence: number;
    }>;
  }> {
    try {
      const artists = await this.searchArtists(name, 10);
      
      if (artists.length === 0) {
        return { exists: false, matches: [] };
      }

      // Process matches and calculate confidence
      const matches = artists.map(artist => {
        const similarity = this.calculateSimilarity(name.toLowerCase(), artist.name.toLowerCase());
        return {
          name: artist.name,
          url: artist.url,
          location: artist.location,
          genre: artist.genre,
          confidence: similarity
        };
      });

      // Sort by confidence
      matches.sort((a, b) => b.confidence - a.confidence);

      // Check if we have a high confidence match
      const exists = matches.length > 0 && matches[0].confidence > 0.8;

      return { exists, matches };

    } catch (error) {
      secureLog.error('Bandcamp artist verification failed', { 
        error: error instanceof Error ? error.message : String(error), 
        name 
      });
      return { exists: false, matches: [] };
    }
  }

  /**
   * Verify song name on Bandcamp
   */
  async verifySongName(name: string): Promise<{
    exists: boolean;
    matches: Array<{
      name: string;
      artist: string;
      album?: string;
      url: string;
      confidence: number;
    }>;
  }> {
    try {
      const tracks = await this.searchTracks(name, 10);
      
      if (tracks.length === 0) {
        return { exists: false, matches: [] };
      }

      // Process matches and calculate confidence
      const matches = tracks.map(track => {
        const similarity = this.calculateSimilarity(name.toLowerCase(), track.title.toLowerCase());
        return {
          name: track.title,
          artist: track.artist,
          album: track.album,
          url: track.url,
          confidence: similarity
        };
      });

      // Sort by confidence
      matches.sort((a, b) => b.confidence - a.confidence);

      // Check if we have a high confidence match
      const exists = matches.length > 0 && matches[0].confidence > 0.8;

      return { exists, matches };

    } catch (error) {
      secureLog.error('Bandcamp song verification failed', { 
        error: error instanceof Error ? error.message : String(error), 
        name 
      });
      return { exists: false, matches: [] };
    }
  }

  /**
   * Calculate similarity between two strings (0-1)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1.0;
    
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
}

export const bandcampService = BandcampService.getInstance();