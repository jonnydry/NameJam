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
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`
        },
        body: 'grant_type=client_credentials'
      });

      if (!response.ok) {
        throw new Error(`Spotify auth failed: ${response.status}`);
      }

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

    try {
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
        throw new Error(`Spotify search failed: ${response.status}`);
      }

      const data: SpotifySearchResult = await response.json();
      return data.artists?.items || [];
    } catch (error) {
      console.error('Spotify artist search failed:', error);
      return [];
    }
  }

  async searchTracks(query: string, limit: number = 10): Promise<SpotifyTrack[]> {
    const token = await this.getAccessToken();
    if (!token) {
      return [];
    }

    try {
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
        throw new Error(`Spotify search failed: ${response.status}`);
      }

      const data: SpotifySearchResult = await response.json();
      return data.tracks?.items || [];
    } catch (error) {
      console.error('Spotify track search failed:', error);
      return [];
    }
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
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) {
      return 1.0;
    }
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
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