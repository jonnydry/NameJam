/**
 * SpotifyStrategy - Platform adapter for Spotify verification
 * Wraps SpotifyService and normalizes responses to PlatformEvidence format
 */

import { BasePlatformVerifier } from './BasePlatformVerifier';
import { spotifyService } from '../spotifyService';
import type { PlatformEvidence } from '../../types/verification';

export class SpotifyStrategy extends BasePlatformVerifier {
  constructor() {
    super('spotify', 1.0); // Highest reliability
  }

  async isAvailable(): Promise<boolean> {
    return await spotifyService.isAvailable();
  }

  async verify(name: string, type: 'band' | 'song'): Promise<PlatformEvidence> {
    try {
      const startTime = Date.now();
      
      // Use existing Spotify service methods
      const results = type === 'band' 
        ? await spotifyService.verifyBandName(name)
        : await spotifyService.verifySongName(name);

      const responseTime = Date.now() - startTime;

      // Normalize Spotify results to standard format
      const matches = this.normalizeMatches(results.matches || [], name, type);

      return this.createPlatformEvidence(matches, name, type, responseTime);

    } catch (error) {
      const verificationError = this.handleError(
        error instanceof Error ? error : new Error(String(error)), 
        { name, type }
      );
      
      return this.createPlatformEvidence([], name, type, undefined, verificationError.message);
    }
  }

  protected extractMatchData(result: any): {
    name: string;
    artist?: string;
    album?: string;
    popularity?: number;
    genres?: string[];
    followers?: number;
    releaseDate?: string;
    url?: string;
    imageUrl?: string;
    preview?: string;
  } {
    return {
      name: result.name || '',
      artist: result.artist || result.artists?.[0]?.name,
      album: result.album?.name || result.album,
      popularity: result.popularity,
      genres: result.genres || result.artist?.genres,
      followers: result.followers,
      releaseDate: result.album?.release_date || result.releaseDate,
      url: result.url || result.external_urls?.spotify,
      imageUrl: result.imageUrl || result.images?.[0]?.url,
      preview: result.preview_url
    };
  }
}