/**
 * SoundCloud API Service
 * Handles emerging artists, remixes, and independent music
 * Requires SOUNDCLOUD_CLIENT_ID environment variable
 */

import { withApiRetry, apiRetryConfigs } from '../utils/apiRetry';
import { secureLog } from '../utils/secureLogger';

interface SoundCloudUser {
  id: number;
  username: string;
  full_name?: string;
  permalink_url: string;
  followers_count: number;
  track_count: number;
  genre?: string;
}

interface SoundCloudTrack {
  id: number;
  title: string;
  user: {
    username: string;
    permalink_url: string;
  };
  permalink_url: string;
  genre?: string;
  playback_count: number;
  created_at: string;
}

interface SoundCloudSearchResponse {
  collection: (SoundCloudUser | SoundCloudTrack)[];
  next_href?: string;
}

export class SoundCloudService {
  private static instance: SoundCloudService;
  private readonly baseUrl = 'https://api.soundcloud.com';
  private clientId: string | null = null;
  
  static getInstance(): SoundCloudService {
    if (!SoundCloudService.instance) {
      SoundCloudService.instance = new SoundCloudService();
    }
    return SoundCloudService.instance;
  }

  constructor() {
    this.clientId = process.env.SOUNDCLOUD_CLIENT_ID || null;
  }

  /**
   * Check if SoundCloud API is available (has client ID)
   */
  async isAvailable(): Promise<boolean> {
    if (!this.clientId) {
      secureLog.debug('SoundCloud API unavailable - missing SOUNDCLOUD_CLIENT_ID');
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/users?q=test&client_id=${this.clientId}&limit=1`);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Search for users/artists on SoundCloud
   */
  async searchArtists(query: string, limit: number = 20): Promise<SoundCloudUser[]> {
    if (!this.clientId) {
      secureLog.debug('SoundCloud search skipped - no client ID');
      return [];
    }

    try {
      const params = new URLSearchParams({
        q: query,
        client_id: this.clientId,
        limit: limit.toString()
      });

      const response = await withApiRetry(
        () => fetch(`${this.baseUrl}/users?${params}`),
        apiRetryConfigs.musicbrainz // More conservative config
      );

      if (!response.ok) {
        throw new Error(`SoundCloud API error: ${response.status}`);
      }

      const data: SoundCloudUser[] = await response.json();
      return data.slice(0, limit);

    } catch (error) {
      secureLog.error('SoundCloud artist search failed', { 
        error: error instanceof Error ? error.message : String(error), 
        query 
      });
      return [];
    }
  }

  /**
   * Search for tracks on SoundCloud
   */
  async searchTracks(query: string, limit: number = 20): Promise<SoundCloudTrack[]> {
    if (!this.clientId) {
      secureLog.debug('SoundCloud search skipped - no client ID');
      return [];
    }

    try {
      const params = new URLSearchParams({
        q: query,
        client_id: this.clientId,
        limit: limit.toString()
      });

      const response = await withApiRetry(
        () => fetch(`${this.baseUrl}/tracks?${params}`),
        apiRetryConfigs.musicbrainz
      );

      if (!response.ok) {
        throw new Error(`SoundCloud API error: ${response.status}`);
      }

      const data: SoundCloudTrack[] = await response.json();
      return data.slice(0, limit);

    } catch (error) {
      secureLog.error('SoundCloud track search failed', { 
        error: error instanceof Error ? error.message : String(error), 
        query 
      });
      return [];
    }
  }

  /**
   * Verify band/artist name on SoundCloud
   */
  async verifyArtistName(name: string): Promise<{
    exists: boolean;
    matches: Array<{
      name: string;
      username: string;
      url: string;
      followers: number;
      tracks: number;
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
        const similarity = this.calculateSimilarity(name.toLowerCase(), artist.username.toLowerCase());
        return {
          name: artist.full_name || artist.username,
          username: artist.username,
          url: artist.permalink_url,
          followers: artist.followers_count,
          tracks: artist.track_count,
          confidence: similarity
        };
      });

      // Sort by confidence
      matches.sort((a, b) => b.confidence - a.confidence);

      // Check if we have a high confidence match
      const exists = matches.length > 0 && matches[0].confidence > 0.8;

      return { exists, matches };

    } catch (error) {
      secureLog.error('SoundCloud artist verification failed', { 
        error: error instanceof Error ? error.message : String(error), 
        name 
      });
      return { exists: false, matches: [] };
    }
  }

  /**
   * Verify song name on SoundCloud
   */
  async verifySongName(name: string): Promise<{
    exists: boolean;
    matches: Array<{
      name: string;
      artist: string;
      url: string;
      plays: number;
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
          artist: track.user.username,
          url: track.permalink_url,
          plays: track.playback_count,
          confidence: similarity
        };
      });

      // Sort by confidence
      matches.sort((a, b) => b.confidence - a.confidence);

      // Check if we have a high confidence match
      const exists = matches.length > 0 && matches[0].confidence > 0.8;

      return { exists, matches };

    } catch (error) {
      secureLog.error('SoundCloud song verification failed', { 
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

export const soundcloudService = SoundCloudService.getInstance();