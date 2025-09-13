/**
 * ItunesStrategy - Platform adapter for iTunes/Apple Music verification
 * Wraps iTunesService and normalizes responses to PlatformEvidence format
 */

import { BasePlatformVerifier } from './BasePlatformVerifier';
import { itunesService } from '../itunesService';
import type { PlatformEvidence } from '../../types/verification';

export class ItunesStrategy extends BasePlatformVerifier {
  constructor() {
    super('itunes', 0.9); // High reliability - major platform
  }

  async isAvailable(): Promise<boolean> {
    return await itunesService.isAvailable();
  }

  async verify(name: string, type: 'band' | 'song'): Promise<PlatformEvidence> {
    try {
      const startTime = Date.now();
      
      // Use existing iTunes service methods
      const results = type === 'band' 
        ? await itunesService.verifyBandName(name)
        : await itunesService.verifySongName(name);

      const responseTime = Date.now() - startTime;

      // Normalize iTunes results to standard format
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
      name: result.name || result.artistName || result.trackName,
      artist: result.artist || result.artistName,
      album: result.album || result.collectionName,
      popularity: undefined, // iTunes doesn't provide popularity scores
      genres: result.genres || (result.primaryGenreName ? [result.primaryGenreName] : []),
      followers: undefined, // iTunes doesn't provide follower counts
      releaseDate: result.releaseDate,
      url: result.url || result.artistLinkUrl || result.trackViewUrl,
      imageUrl: result.imageUrl || result.artworkUrl100,
      preview: result.previewUrl
    };
  }
}