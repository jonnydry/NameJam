import { spotifyService } from "./spotifyService";
import { itunesService } from "./itunesService";
import { soundcloudService } from "./soundcloudService";
import { bandcampService } from "./bandcampService";
import { lastFmRateLimiter, musicBrainzRateLimiter, withRetry } from '../utils/rateLimiter';
import { secureLog } from '../utils/secureLogger';

interface PlatformResult {
  source: string;
  result: any;
}

interface AggregatedResults {
  spotifyResults: any;
  itunesResults: any;
  soundcloudResults: any;
  bandcampResults: any;
  otherSearchResults: any[];
}

export class VerificationOrchestrator {
  private static instance: VerificationOrchestrator;

  private constructor() {}

  static getInstance(): VerificationOrchestrator {
    if (!VerificationOrchestrator.instance) {
      VerificationOrchestrator.instance = new VerificationOrchestrator();
    }
    return VerificationOrchestrator.instance;
  }

  /**
   * Verify name across all major platforms in parallel
   */
  async verifyAcrossPlatforms(name: string, type: 'band' | 'song'): Promise<AggregatedResults> {
    let spotifyResults: any = null;
    let itunesResults: any = null;
    let soundcloudResults: any = null;
    let bandcampResults: any = null;
    
    try {
      // Run all major platform checks in parallel for speed
      const promises = [];
      
      // Spotify (highest priority)
      if (await spotifyService.isAvailable()) {
        promises.push(
          type === 'band' 
            ? spotifyService.verifyBandName(name).then(result => ({ source: 'spotify', result }))
            : spotifyService.verifySongName(name).then(result => ({ source: 'spotify', result }))
        );
      }
      
      // iTunes/Apple Music (no auth needed)
      if (await itunesService.isAvailable()) {
        promises.push(
          type === 'band'
            ? itunesService.verifyBandName(name).then(result => ({ source: 'itunes', result }))
            : itunesService.verifySongName(name).then(result => ({ source: 'itunes', result }))
        );
      }
      
      // SoundCloud (if API key available)
      if (await soundcloudService.isAvailable()) {
        promises.push(
          type === 'band'
            ? soundcloudService.verifyArtistName(name).then(result => ({ source: 'soundcloud', result }))
            : soundcloudService.verifySongName(name).then(result => ({ source: 'soundcloud', result }))
        );
      }
      
      // Bandcamp (if API available)
      if (await bandcampService.isAvailable()) {
        promises.push(
          type === 'band'
            ? bandcampService.verifyArtistName(name).then(result => ({ source: 'bandcamp', result }))
            : bandcampService.verifySongName(name).then(result => ({ source: 'bandcamp', result }))
        );
      }
      
      // Execute all platform checks in parallel
      const results = await Promise.allSettled(promises);
      
      // Process results
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          const { source, result: data } = result.value as PlatformResult;
          switch (source) {
            case 'spotify':
              spotifyResults = data;
              break;
            case 'itunes':
              itunesResults = data;
              break;
            case 'soundcloud':
              soundcloudResults = data;
              break;
            case 'bandcamp':
              bandcampResults = data;
              break;
          }
        }
      });
      
    } catch (error) {
      // Continue to other sources if platform checks fail
      secureLog.error('Platform verification error', { error: error instanceof Error ? error.message : String(error), name });
    }

    // Other API sources as fallback (Last.fm, MusicBrainz)
    let otherSearchResults: any[] = [];
    
    try {
      const promises = [];
      
      // Add Last.fm search if API key is available
      if (process.env.LASTFM_API_KEY) {
        promises.push(this.searchLastFm(name, type).catch(() => []));
      }
      
      // Add MusicBrainz search (no key needed) 
      promises.push(this.searchRealMusicBrainz(name, type).catch(() => []));

      if (promises.length > 0) {
        otherSearchResults = await Promise.all(promises).then(results => results.flat());
      }
    } catch (error) {
      // Silent fallback to heuristics
      secureLog.debug('Other API search error', { error });
    }

    // Minimal logging for debugging when needed
    if (otherSearchResults.length > 5) {
      secureLog.debug(`Found ${otherSearchResults.length} results for "${name}"`);
    }

    return {
      spotifyResults,
      itunesResults,
      soundcloudResults,
      bandcampResults,
      otherSearchResults
    };
  }

  /**
   * Search Last.fm API
   */
  private async searchLastFm(name: string, type: 'band' | 'song'): Promise<any[]> {
    const apiKey = process.env.LASTFM_API_KEY;
    if (!apiKey) return [];

    try {
      const method = type === 'band' ? 'artist.search' : 'track.search';
      const param = type === 'band' ? 'artist' : 'track';
      const url = `http://ws.audioscrobbler.com/2.0/?method=${method}&${param}=${encodeURIComponent(name)}&api_key=${apiKey}&format=json&limit=10`;
      
      const response = await lastFmRateLimiter.execute(async () => {
        return withRetry(async () => {
          const resp = await fetch(url);
          return resp;
        }, 3, 2000);
      });
      if (!response.ok) {
        throw new Error(`Last.fm API responded with ${response.status}`);
      }
      
      const data = await response.json();
      
      if (type === 'band') {
        const artists = data.results?.artistmatches?.artist || [];
        return Array.isArray(artists) ? artists.map((artist: any) => ({
          name: artist.name,
          type: 'band'
        })) : [];
      } else {
        const tracks = data.results?.trackmatches?.track || [];
        return Array.isArray(tracks) ? tracks.map((track: any) => ({
          name: track.name,
          artist: track.artist,
          type: 'song'
        })) : [];
      }
    } catch (error: any) {
      console.error('Last.fm API error:', error);
      return [];
    }
  }

  /**
   * Search MusicBrainz API
   */
  private async searchRealMusicBrainz(name: string, type: 'band' | 'song'): Promise<any[]> {
    try {
      const userAgent = process.env.MUSICBRAINZ_USER_AGENT || 'NameJam/1.0 (contact@example.com)';
      const entity = type === 'band' ? 'artist' : 'recording';
      const url = `https://musicbrainz.org/ws/2/${entity}/?query=${encodeURIComponent(name)}&fmt=json&limit=10`;
      
      const response = await musicBrainzRateLimiter.execute(async () => {
        return withRetry(async () => {
          const resp = await fetch(url, {
            headers: {
              'User-Agent': userAgent
            }
          });
          return resp;
        }, 3, 2000);
      });
      
      if (!response.ok) {
        throw new Error(`MusicBrainz API responded with ${response.status}`);
      }
      
      const data = await response.json();
      
      if (type === 'band') {
        const artists = data.artists || [];
        return artists.map((artist: any) => ({
          name: artist.name,
          type: 'band'
        }));
      } else {
        const recordings = data.recordings || [];
        return recordings.map((recording: any) => ({
          name: recording.title,
          artist: recording['artist-credit']?.[0]?.name || 'Unknown',
          type: 'song'
        }));
      }
    } catch (error: any) {
      console.error('MusicBrainz API error:', error);
      return [];
    }
  }
}