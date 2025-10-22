/**
 * BandcampStrategy - Platform adapter for Bandcamp verification
 * Wraps BandcampService and normalizes responses to PlatformEvidence format
 */

import { BasePlatformVerifier } from './BasePlatformVerifier';
import { bandcampService } from '../bandcampService';
import type { PlatformEvidence } from '../../types/verification';

export class BandcampStrategy extends BasePlatformVerifier {
  constructor() {
    super('bandcamp', 0.8); // High reliability for indie/underground music
  }

  async isAvailable(): Promise<boolean> {
    return await bandcampService.isAvailable();
  }

  async verify(name: string, type: 'band' | 'song'): Promise<PlatformEvidence> {
    try {
      const startTime = Date.now();
      
      // Use existing Bandcamp service methods
      const results = type === 'band' 
        ? await bandcampService.verifyArtistName(name)
        : await bandcampService.verifySongName(name);

      const responseTime = Date.now() - startTime;

      // Normalize Bandcamp results to standard format
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
      name: result.name || result.artist || result.title,
      artist: result.artist || result.band,
      album: result.album,
      popularity: result.popularity,
      genres: result.genres || (result.genre ? [result.genre] : []),
      followers: result.followers,
      releaseDate: result.releaseDate || result.date,
      url: result.url || result.bandcamp_url,
      imageUrl: result.imageUrl || result.artwork,
      preview: result.preview || result.sample_url
    };
  }
}