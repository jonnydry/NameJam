import { spotifyRateLimiter, withRetry } from '../utils/rateLimiter';
import { xaiFallbackService } from './xaiFallbackService';
import { secureLog } from '../utils/secureLogger';
import { phoneticMatchingService } from './phoneticMatchingService';
import { withApiRetry, apiRetryConfigs } from '../utils/apiRetry';

interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface SpotifyArtist {
  id: string;
  name: string;
  popularity: number;
  genres: string[];
}

interface SpotifyTrack {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  popularity: number;
  album: {
    name: string;
    release_date: string;
  };
}

interface SpotifySearchResult {
  artists?: {
    items: SpotifyArtist[];
  };
  tracks?: {
    items: SpotifyTrack[];
  };
}

export class SpotifyService {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private clientId: string;
  private clientSecret: string;

  constructor() {
    this.clientId = process.env.SPOTIFY_CLIENT_ID || '';
    this.clientSecret = process.env.SPOTIFY_CLIENT_SECRET || '';
    
    if (!this.clientId || !this.clientSecret) {
      console.warn('Spotify credentials not found. Spotify verification will be disabled.');
    }
  }

  private async getAccessToken(): Promise<string | null> {
    if (!this.clientId || !this.clientSecret) {
      return null;
    }

    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await withApiRetry(async () => {
        const res = await fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`
          },
          body: 'grant_type=client_credentials'
        });

        if (!res.ok) {
          throw new Error(`Spotify auth failed: ${res.status}`);
        }
        return res;
      }, apiRetryConfigs.spotify);

      const data: SpotifyTokenResponse = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Refresh 1 minute early

      return this.accessToken;
    } catch (error) {
      console.error('Failed to get Spotify access token:', error);
      return null;
    }
  }

  async searchArtists(query: string, limit: number = 10): Promise<SpotifyArtist[]> {
    const token = await this.getAccessToken();
    if (!token) {
      return [];
    }

    return spotifyRateLimiter.execute(async () => {
      return withRetry(async () => {
        const encodedQuery = encodeURIComponent(query);
        const response = await fetch(
          `https://api.spotify.com/v1/search?q=${encodedQuery}&type=artist&limit=${limit}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (!response.ok) {
          const error: any = new Error(`Spotify search failed: ${response.status}`);
          error.status = response.status;
          throw error;
        }

        const data: SpotifySearchResult = await response.json();
        return data.artists?.items || [];
      }, 3, 1000);
    }).catch(async error => {
      secureLog.error('Spotify artist search failed, using XAI fallback:', error);
      
      // Use XAI fallback when Spotify fails
      try {
        const fallbackArtists = await xaiFallbackService.generateSpotifyFallback({
          genre: query.toLowerCase(),
          type: 'artists',
          count: limit
        });
        
        if (fallbackArtists.length > 0) {
          secureLog.info(`XAI fallback provided ${fallbackArtists.length} artists for Spotify request`);
          return fallbackArtists;
        }
      } catch (fallbackError) {
        secureLog.error('XAI fallback also failed:', fallbackError);
      }
      
      return [];
    });
  }

  async searchTracks(query: string, limit: number = 10): Promise<SpotifyTrack[]> {
    const token = await this.getAccessToken();
    if (!token) {
      return [];
    }

    return spotifyRateLimiter.execute(async () => {
      return withRetry(async () => {
        const encodedQuery = encodeURIComponent(query);
        const response = await fetch(
          `https://api.spotify.com/v1/search?q=${encodedQuery}&type=track&limit=${limit}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (!response.ok) {
          const error: any = new Error(`Spotify search failed: ${response.status}`);
          error.status = response.status;
          throw error;
        }

        const data: SpotifySearchResult = await response.json();
        return data.tracks?.items || [];
      }, 3, 1000);
    }).catch(async error => {
      secureLog.error('Spotify track search failed, using XAI fallback:', error);
      
      // Use XAI fallback when Spotify fails
      try {
        const fallbackTracks = await xaiFallbackService.generateSpotifyFallback({
          genre: query.toLowerCase(),
          type: 'tracks',
          count: limit
        });
        
        if (fallbackTracks.length > 0) {
          secureLog.info(`XAI fallback provided ${fallbackTracks.length} tracks for Spotify request`);
          return fallbackTracks;
        }
      } catch (fallbackError) {
        secureLog.error('XAI fallback also failed:', fallbackError);
      }
      
      return [];
    });
  }

  // Map non-standard genres to Spotify genre seeds
  private mapGenreToSpotifySeeds(genre: string): string {
    const genreMap: Record<string, string> = {
      'jam band': 'jam funk psychedelic',
      'hip-hop': 'hip hop',
      // Add more mappings as needed
    };
    
    return genreMap[genre.toLowerCase()] || genre;
  }

  // Get genre-specific artists for vocabulary inspiration
  async getGenreArtists(genre: string, limit: number = 50): Promise<SpotifyArtist[]> {
    const token = await this.getAccessToken();
    if (!token) {
      return [];
    }

    // Map genre to Spotify-compatible search terms
    const mappedGenre = this.mapGenreToSpotifySeeds(genre);

    return spotifyRateLimiter.execute(async () => {
      return withRetry(async () => {
        // Search for artists by genre
        const encodedGenre = encodeURIComponent(`genre:"${mappedGenre}"`);
        const response = await fetch(
          `https://api.spotify.com/v1/search?q=${encodedGenre}&type=artist&limit=${limit}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (!response.ok) {
          // Fallback to searching by mapped genre name
          const fallbackResponse = await fetch(
            `https://api.spotify.com/v1/search?q=${encodeURIComponent(mappedGenre)}&type=artist&limit=${limit}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );
          
          if (!fallbackResponse.ok) {
            throw new Error(`Spotify genre search failed: ${fallbackResponse.status}`);
          }
          
          const fallbackData: SpotifySearchResult = await fallbackResponse.json();
          return fallbackData.artists?.items || [];
        }

        const data: SpotifySearchResult = await response.json();
        return data.artists?.items || [];
      }, 3, 1000);
    }).catch(error => {
      console.error('Spotify genre artist search failed:', error);
      return [];
    });
  }

  // Get mood-based tracks using audio features
  async getMoodTracks(mood: string, limit: number = 50): Promise<SpotifyTrack[]> {
    const token = await this.getAccessToken();
    if (!token) {
      return [];
    }

    // Map moods to Spotify audio feature ranges
    const moodFeatures: Record<string, string> = {
      'dark': 'min_valence=0.0&max_valence=0.3&min_energy=0.0&max_energy=0.5',
      'bright': 'min_valence=0.7&max_valence=1.0&min_energy=0.6&max_energy=1.0',
      'energetic': 'min_energy=0.8&max_energy=1.0&min_tempo=120',
      'peaceful': 'min_valence=0.4&max_valence=0.7&max_energy=0.4&max_tempo=100',
      'melancholy': 'min_valence=0.0&max_valence=0.4&min_energy=0.2&max_energy=0.6',
      'aggressive': 'min_energy=0.8&max_energy=1.0&min_loudness=-10',
      'ethereal': 'min_acousticness=0.6&min_instrumentalness=0.5',
      'mysterious': 'min_instrumentalness=0.3&min_valence=0.2&max_valence=0.6'
    };

    const features = moodFeatures[mood] || '';
    
    return spotifyRateLimiter.execute(async () => {
      return withRetry(async () => {
        // Use recommendations endpoint for mood-based search
        const seedGenres = this.getMoodGenres(mood).slice(0, 5).join(',');
        const response = await fetch(
          `https://api.spotify.com/v1/recommendations?seed_genres=${seedGenres}&${features}&limit=${limit}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (!response.ok) {
          // Fallback to search
          const fallbackQuery = this.getMoodKeywords(mood).join(' OR ');
          const fallbackResponse = await fetch(
            `https://api.spotify.com/v1/search?q=${encodeURIComponent(fallbackQuery)}&type=track&limit=${limit}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );
          
          if (!fallbackResponse.ok) {
            throw new Error(`Spotify mood search failed: ${fallbackResponse.status}`);
          }
          
          const fallbackData: SpotifySearchResult = await fallbackResponse.json();
          return fallbackData.tracks?.items || [];
        }

        const data: any = await response.json();
        return data.tracks || [];
      }, 3, 1000);
    }).catch(error => {
      console.error('Spotify mood track search failed:', error);
      return [];
    });
  }

  // Helper method to get genre seeds for moods
  private getMoodGenres(mood: string): string[] {
    const moodGenreMap: Record<string, string[]> = {
      'dark': ['metal', 'gothic', 'industrial', 'black-metal'],
      'bright': ['pop', 'dance', 'power-pop', 'synth-pop'],
      'energetic': ['edm', 'punk', 'drum-and-bass', 'hardcore'],
      'peaceful': ['ambient', 'new-age', 'acoustic', 'folk'],
      'melancholy': ['blues', 'sad', 'singer-songwriter', 'emo'],
      'aggressive': ['death-metal', 'hardcore', 'metalcore', 'grindcore'],
      'ethereal': ['ambient', 'dream-pop', 'shoegaze', 'trip-hop'],
      'mysterious': ['dark-ambient', 'experimental', 'idm', 'minimal-techno'],
      'nostalgic': ['indie', 'indie-pop', 'lo-fi', 'synthwave'],
      'futuristic': ['electronic', 'techno', 'idm', 'dubstep'],
      'romantic': ['soul', 'r-n-b', 'jazz', 'bossa-nova'],
      'epic': ['symphonic-metal', 'power-metal', 'orchestral', 'soundtrack']
    };
    
    return moodGenreMap[mood] || ['pop', 'rock', 'indie'];
  }

  // Helper method to get mood keywords
  private getMoodKeywords(mood: string): string[] {
    const moodKeywords: Record<string, string[]> = {
      'dark': ['shadow', 'darkness', 'night', 'black'],
      'bright': ['sunshine', 'happy', 'joy', 'light'],
      'energetic': ['energy', 'power', 'electric', 'fire'],
      'peaceful': ['calm', 'peace', 'serene', 'quiet'],
      'melancholy': ['sad', 'sorrow', 'lonely', 'tears'],
      'aggressive': ['anger', 'rage', 'fury', 'violent'],
      'ethereal': ['dream', 'float', 'celestial', 'heaven'],
      'mysterious': ['mystery', 'enigma', 'secret', 'unknown']
    };
    
    return moodKeywords[mood] || [mood];
  }

  // Extract vocabulary patterns from artist/track names
  extractVocabularyPatterns(artists: SpotifyArtist[], tracks: SpotifyTrack[]): string[] {
    const vocabulary: Set<string> = new Set();
    
    // Extract words from artist names
    artists.forEach(artist => {
      const words = artist.name.split(/[\s\-&,]+/)
        .filter(word => word.length > 2 && !/^the$/i.test(word))
        .map(word => word.toLowerCase());
      words.forEach(word => vocabulary.add(word));
    });
    
    // Extract words from track names
    tracks.forEach(track => {
      const words = track.name.split(/[\s\-&,\(\)]+/)
        .filter(word => word.length > 2 && !/^the$/i.test(word))
        .map(word => word.toLowerCase());
      words.forEach(word => vocabulary.add(word));
    });
    
    return Array.from(vocabulary);
  }

  async verifyBandName(name: string): Promise<{
    exists: boolean;
    matches: Array<{
      name: string;
      popularity: number;
      genres: string[];
      spotifyId: string;
    }>;
  }> {
    const artists = await this.searchArtists(name, 10);
    
    // Look for exact matches (case insensitive)
    const exactMatches = artists.filter(artist => 
      artist.name.toLowerCase() === name.toLowerCase()
    );

    // Look for very close matches
    const closeMatches = artists.filter(artist => {
      const similarity = this.calculateSimilarity(artist.name.toLowerCase(), name.toLowerCase());
      return similarity > 0.85 && artist.name.toLowerCase() !== name.toLowerCase();
    });

    const allMatches = [...exactMatches, ...closeMatches].map(artist => ({
      name: artist.name,
      popularity: artist.popularity,
      genres: artist.genres,
      spotifyId: artist.id
    }));

    return {
      exists: exactMatches.length > 0,
      matches: allMatches
    };
  }

  async verifySongName(name: string): Promise<{
    exists: boolean;
    matches: Array<{
      name: string;
      artist: string;
      popularity: number;
      album: string;
      releaseDate: string;
      spotifyId: string;
    }>;
  }> {
    const tracks = await this.searchTracks(name, 10);
    
    // Look for exact matches (case insensitive)
    const exactMatches = tracks.filter(track => 
      track.name.toLowerCase() === name.toLowerCase()
    );

    // Look for very close matches
    const closeMatches = tracks.filter(track => {
      const similarity = this.calculateSimilarity(track.name.toLowerCase(), name.toLowerCase());
      return similarity > 0.85 && track.name.toLowerCase() !== name.toLowerCase();
    });

    const allMatches = [...exactMatches, ...closeMatches].map(track => ({
      name: track.name,
      artist: track.artists[0]?.name || 'Unknown Artist',
      popularity: track.popularity,
      album: track.album.name,
      releaseDate: track.album.release_date,
      spotifyId: track.id
    }));

    return {
      exists: exactMatches.length > 0,
      matches: allMatches
    };
  }

  private calculateSimilarity(str1: string, str2: string): number {
    // Enhanced similarity calculation using phonetic matching
    const phoneticMatch = phoneticMatchingService.calculateSimilarity(str1, str2);
    return phoneticMatch.similarity;
  }

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

  async isAvailable(): Promise<boolean> {
    return !!(this.clientId && this.clientSecret);
  }
}

export const spotifyService = new SpotifyService();