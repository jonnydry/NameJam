/**
 * iTunes/Apple Music API Service
 * Uses the free iTunes Search API - no authentication required
 * Provides comprehensive major label artist coverage
 */

import { withApiRetry, apiRetryConfigs } from '../utils/apiRetry';
import { secureLog } from '../utils/secureLogger';

interface iTunesArtist {
  artistId: number;
  artistName: string;
  primaryGenreName: string;
  artistLinkUrl?: string;
}

interface iTunesTrack {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName: string;
  primaryGenreName: string;
  releaseDate: string;
  trackViewUrl?: string;
}

interface iTunesSearchResponse {
  resultCount: number;
  results: (iTunesArtist | iTunesTrack)[];
}

export class iTunesService {
  private static instance: iTunesService;
  private readonly baseUrl = 'https://itunes.apple.com/search';
  
  static getInstance(): iTunesService {
    if (!iTunesService.instance) {
      iTunesService.instance = new iTunesService();
    }
    return iTunesService.instance;
  }

  /**
   * Search for artists on iTunes/Apple Music
   */
  async searchArtists(query: string, limit: number = 20): Promise<iTunesArtist[]> {
    try {
      const params = new URLSearchParams({
        term: query,
        entity: 'musicArtist',
        limit: limit.toString(),
        country: 'US'
      });

      const response = await withApiRetry(
        () => fetch(`${this.baseUrl}?${params}`),
        apiRetryConfigs.spotify
      );

      if (!response.ok) {
        throw new Error(`iTunes API error: ${response.status}`);
      }

      const data: iTunesSearchResponse = await response.json();
      
      return data.results
        .filter(result => 'artistId' in result)
        .map(result => result as iTunesArtist)
        .slice(0, limit);

    } catch (error) {
      secureLog.error('iTunes artist search failed', { 
        error: error instanceof Error ? error.message : String(error), 
        query 
      });
      return [];
    }
  }

  /**
   * Search for tracks on iTunes/Apple Music
   */
  async searchTracks(query: string, limit: number = 20): Promise<iTunesTrack[]> {
    try {
      const params = new URLSearchParams({
        term: query,
        entity: 'song',
        limit: limit.toString(),
        country: 'US'
      });

      const response = await withApiRetry(
        () => fetch(`${this.baseUrl}?${params}`),
        apiRetryConfigs.spotify
      );

      if (!response.ok) {
        throw new Error(`iTunes API error: ${response.status}`);
      }

      const data: iTunesSearchResponse = await response.json();
      
      return data.results
        .filter(result => 'trackId' in result)
        .map(result => result as iTunesTrack)
        .slice(0, limit);

    } catch (error) {
      secureLog.error('iTunes track search failed', { 
        error: error instanceof Error ? error.message : String(error), 
        query 
      });
      return [];
    }
  }

  /**
   * Verify band name on iTunes/Apple Music
   */
  async verifyBandName(name: string): Promise<{
    exists: boolean;
    matches: Array<{
      name: string;
      genres: string[];
      url?: string;
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
        const similarity = this.calculateSimilarity(name.toLowerCase(), artist.artistName.toLowerCase());
        return {
          name: artist.artistName,
          genres: [artist.primaryGenreName],
          url: artist.artistLinkUrl,
          confidence: similarity
        };
      });

      // Sort by confidence
      matches.sort((a, b) => b.confidence - a.confidence);

      // Check if we have a high confidence match
      const exists = matches.length > 0 && matches[0].confidence > 0.8;

      return { exists, matches };

    } catch (error) {
      secureLog.error('iTunes band verification failed', { 
        error: error instanceof Error ? error.message : String(error), 
        name 
      });
      return { exists: false, matches: [] };
    }
  }

  /**
   * Verify song name on iTunes/Apple Music
   */
  async verifySongName(name: string): Promise<{
    exists: boolean;
    matches: Array<{
      name: string;
      artist: string;
      album: string;
      genre: string;
      url?: string;
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
        const similarity = this.calculateSimilarity(name.toLowerCase(), track.trackName.toLowerCase());
        return {
          name: track.trackName,
          artist: track.artistName,
          album: track.collectionName,
          genre: track.primaryGenreName,
          url: track.trackViewUrl,
          confidence: similarity
        };
      });

      // Sort by confidence
      matches.sort((a, b) => b.confidence - a.confidence);

      // Check if we have a high confidence match
      const exists = matches.length > 0 && matches[0].confidence > 0.8;

      return { exists, matches };

    } catch (error) {
      secureLog.error('iTunes song verification failed', { 
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

  /**
   * Check if iTunes API is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}?term=test&entity=musicArtist&limit=1`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const itunesService = iTunesService.getInstance();