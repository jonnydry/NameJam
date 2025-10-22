/**
 * SoundcloudStrategy - Platform adapter for SoundCloud verification
 * Wraps SoundCloudService and normalizes responses to PlatformEvidence format
 */

import { BasePlatformVerifier } from './BasePlatformVerifier';
import { soundcloudService } from '../soundcloudService';
import type { PlatformEvidence } from '../../types/verification';

export class SoundcloudStrategy extends BasePlatformVerifier {
  constructor() {
    super('soundcloud', 0.7); // Good for emerging/independent artists
  }

  async isAvailable(): Promise<boolean> {
    return await soundcloudService.isAvailable();
  }

  async verify(name: string, type: 'band' | 'song'): Promise<PlatformEvidence> {
    try {
      const startTime = Date.now();
      
      // Use existing SoundCloud service methods
      const results = type === 'band' 
        ? await soundcloudService.verifyArtistName(name)
        : await soundcloudService.verifySongName(name);

      const responseTime = Date.now() - startTime;

      // Normalize SoundCloud results to standard format
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
      name: result.name || result.username || result.title,
      artist: result.artist || result.user?.username || result.username,
      album: result.album,
      popularity: result.playback_count ? Math.min(result.playback_count / 10000, 100) : undefined,
      genres: result.genres || (result.genre ? [result.genre] : []),
      followers: result.followers_count,
      releaseDate: result.created_at || result.releaseDate,
      url: result.url || result.permalink_url,
      imageUrl: result.imageUrl || result.avatar_url,
      preview: result.stream_url
    };
  }
}