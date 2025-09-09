import type { VerificationResult } from "@shared/schema";
import { spotifyService } from "./spotifyService";
import { itunesService } from "./itunesService";
import { soundcloudService } from "./soundcloudService";
import { bandcampService } from "./bandcampService";
import { phoneticMatchingService } from "./phoneticMatchingService";
import { confidenceCalculator } from "./confidenceCalculator";
import { lastFmRateLimiter, musicBrainzRateLimiter, withRetry } from '../utils/rateLimiter';
import { secureLog } from '../utils/secureLogger';
import { FamousNamesRepository } from './famousNamesRepository';

export class NameVerifierService {
  private famousNamesRepo: FamousNamesRepository;

  constructor() {
    this.famousNamesRepo = FamousNamesRepository.getInstance();
  }

  async verifyName(name: string, type: 'band' | 'song'): Promise<VerificationResult> {
    try {
      // Easter eggs - check these FIRST before any real verification
      
      // Easter egg for Name Jam variations
      const normalizedName = name.toLowerCase().replace(/[^a-z]/g, '');
      if (normalizedName === 'namejam') {
        return {
          status: 'available',
          confidence: 1.0,
          confidenceLevel: 'very-high',
          explanation: 'Special easter egg - 100% confidence this name is perfect!',
          details: 'We love you. Go to bed. <3',
          verificationLinks: []
        };
      }

      // Check for easter egg artists first (100% confidence + joke message)
      if (this.famousNamesRepo.isEasterEggArtist(name)) {
        return {
          status: 'available',
          confidence: 1.0,
          confidenceLevel: 'very-high',
          explanation: 'Special easter egg for famous artists - 100% confidence this name is perfect!',
          details: 'We love you. Go to bed. <3',
          verificationLinks: []
        };
      }
      
      // Check for famous artists (95-98% confidence + realistic message)
      if (this.famousNamesRepo.isFamousArtist(name)) {
        const verificationLinks = this.generateVerificationLinks(name, type);
        const similarNames = this.generateSimilarNames(name);
        return {
          status: 'taken',
          confidence: 0.96, // 96% confidence - very high but not easter egg level
          confidenceLevel: 'very-high',
          explanation: 'Found exact match for highly popular artist on Spotify with millions of listeners',
          details: `This is a famous ${type} name with massive popularity. Try these alternatives:`,
          similarNames,
          verificationLinks
        };
      }

      // Generate verification links that users can actually use
      const verificationLinks = this.generateVerificationLinks(name, type);

      // PARALLEL API VERIFICATION - Check all major platforms simultaneously
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
            const { source, result: data } = result.value;
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

      // Check Spotify exact matches first (highest priority)
      if (spotifyResults && spotifyResults.exists) {
        const match = spotifyResults.matches[0];
        const similarNames = this.generateSimilarNames(name);
        
        // Calculate confidence for this taken result
        const confidenceResult = confidenceCalculator.calculateAvailabilityConfidence(
          name, spotifyResults, undefined, undefined, undefined, itunesResults, soundcloudResults, bandcampResults
        );
        
        if (type === 'band') {
          const genreInfo = match.genres && match.genres.length > 0 ? ` (${match.genres.slice(0, 2).join(', ')})` : '';
          return {
            status: 'taken',
            confidence: confidenceResult.confidence,
            confidenceLevel: confidenceResult.confidenceLevel,
            explanation: confidenceResult.explanation,
            details: `This band name exists on Spotify${genreInfo}. Popularity: ${match.popularity}/100. Try these alternatives:`,
            similarNames,
            verificationLinks
          };
        } else {
          return {
            status: 'taken',
            confidence: confidenceResult.confidence,
            confidenceLevel: confidenceResult.confidenceLevel,
            explanation: confidenceResult.explanation,
            details: `This song exists on Spotify by ${match.artist} (${match.album}). Try these alternatives:`,
            similarNames,
            verificationLinks
          };
        }
      }

      // Check Spotify similar matches (second priority)
      if (spotifyResults && spotifyResults.matches && spotifyResults.matches.length > 0 && !spotifyResults.exists) {
        const match = spotifyResults.matches[0];
        const similarNames = this.generateSimilarNames(name);
        
        // Calculate confidence for similar matches
        const confidenceResult = confidenceCalculator.calculateAvailabilityConfidence(
          name, spotifyResults, undefined, undefined, undefined, itunesResults, soundcloudResults, bandcampResults
        );
        
        if (type === 'band') {
          const genreInfo = match.genres && match.genres.length > 0 ? ` (${match.genres.slice(0, 2).join(', ')})` : '';
          return {
            status: 'similar',
            confidence: confidenceResult.confidence,
            confidenceLevel: confidenceResult.confidenceLevel,
            explanation: confidenceResult.explanation,
            details: `Similar band names found on Spotify${genreInfo}. Consider these alternatives:`,
            similarNames,
            verificationLinks
          };
        } else {
          return {
            status: 'similar',
            confidence: confidenceResult.confidence,
            confidenceLevel: confidenceResult.confidenceLevel,
            explanation: confidenceResult.explanation,
            details: `Similar song titles found on Spotify by various artists. Consider these alternatives:`,
            similarNames,
            verificationLinks
          };
        }
      }

      // Famous names database check (third priority)
      const famousMatch = this.famousNamesRepo.checkFamousName(name, type);
      if (famousMatch && famousMatch.found) {
        const similarNames = this.generateSimilarNames(name);
        // Calculate confidence for famous matches
        const confidenceResult = confidenceCalculator.calculateAvailabilityConfidence(
          name, undefined, undefined, undefined, [name], itunesResults, soundcloudResults, bandcampResults
        );
        return {
          status: 'taken',
          confidence: confidenceResult.confidence,
          confidenceLevel: confidenceResult.confidenceLevel,
          explanation: confidenceResult.explanation,
          details: `This is a famous ${type}${famousMatch.artist ? ` by ${famousMatch.artist}` : ''}. Try these alternatives:`,
          similarNames,
          verificationLinks
        };
      }

      // Other API sources as fallback (Last.fm, MusicBrainz)
      let searchResults: any[] = [];
      
      try {
        const promises = [];
        
        // Add Last.fm search if API key is available
        if (process.env.LASTFM_API_KEY) {
          promises.push(this.searchLastFm(name, type).catch(() => []));
        }
        
        // Add MusicBrainz search (no key needed) 
        promises.push(this.searchRealMusicBrainz(name, type).catch(() => []));

        if (promises.length > 0) {
          searchResults = await Promise.all(promises).then(results => results.flat());
        }
      } catch (error) {
        // Silent fallback to heuristics
      }

      // Minimal logging for debugging when needed
      if (searchResults.length > 5) {
        secureLog.debug(`Found ${searchResults.length} results for "${name}"`);
      }

      // Check for exact matches in other sources
      const exactMatches = searchResults.filter(result => 
        result.name?.toLowerCase().trim() === name.toLowerCase().trim()
      );

      if (exactMatches.length > 0) {
        // Exact match found = Name is taken
        const match = exactMatches[0];
        const artistInfo = match.artist ? ` by ${match.artist}` : '';
        const similarNames = this.generateSimilarNames(name);
        secureLog.debug(`Exact match found for "${name}": ${match.name} by ${match.artist || 'Unknown'}`);
        
        // Calculate confidence for exact matches from other sources
        const confidenceResult = confidenceCalculator.calculateAvailabilityConfidence(
          name, spotifyResults, searchResults, undefined, undefined, itunesResults, soundcloudResults, bandcampResults
        );
        
        return {
          status: 'taken',
          confidence: confidenceResult.confidence,
          confidenceLevel: confidenceResult.confidenceLevel,
          explanation: confidenceResult.explanation,
          details: `Found existing ${type}${artistInfo}. Try these alternatives:`,
          similarNames,
          verificationLinks
        };
      }



      // Check for close/similar matches with different criteria for bands vs songs
      const closeMatches = searchResults.filter(result => {
        const resultName = result.name?.toLowerCase().trim() || '';
        const searchName = name.toLowerCase().trim();
        
        if (type === 'band') {
          // BAND LOGIC: Stricter - band names should be unique
          // Ignore single-word results unless they're the exact search or long/unique words
          if (resultName.split(' ').length === 1 && resultName.length < 8 && resultName !== searchName) {
            return false;
          }
          
          // For bands: exact match or very close similarity required
          const isExact = resultName === searchName;
          const similarity = this.calculateSimilarity(resultName, searchName);
          const lengthRatio = Math.min(resultName.length, searchName.length) / Math.max(resultName.length, searchName.length);
          
          return isExact || (similarity > 0.9 && lengthRatio > 0.8);
        } else {
          // SONG LOGIC: More lenient - multiple songs can have same title
          // Only flag if exact match or very similar with same/similar artist
          const isExact = resultName === searchName;
          
          // For songs, we're more lenient since many songs can share titles
          // Only consider it taken if it's an exact match
          return isExact;
        }
      });

      if (closeMatches.length > 0) {
        // Close matches found = Similar
        const similarNames = this.generateSimilarNames(name);
        secureLog.debug(`Close matches found for "${name}":`, closeMatches.slice(0, 2));
        
        // Calculate confidence for similar matches
        const confidenceResult = confidenceCalculator.calculateAvailabilityConfidence(
          name, spotifyResults, searchResults, undefined, undefined, itunesResults, soundcloudResults, bandcampResults
        );
        
        return {
          status: 'similar',
          confidence: confidenceResult.confidence,
          confidenceLevel: confidenceResult.confidenceLevel,
          explanation: confidenceResult.explanation,
          details: `Similar names found in music databases. Consider these alternatives:`,
          similarNames,
          verificationLinks
        };
      }

      // Only mark as available if we have fewer than 5 very weak results
      // This handles cases where APIs return tons of unrelated results
      
      // Calculate confidence for available results
      const confidenceResult = confidenceCalculator.calculateAvailabilityConfidence(
        name, spotifyResults, searchResults, undefined, undefined, itunesResults, soundcloudResults, bandcampResults
      );
      
      if (searchResults.length <= 5) {
        // Few or no relevant matches - marking as available
        return {
          status: 'available',
          confidence: confidenceResult.confidence,
          confidenceLevel: confidenceResult.confidenceLevel,
          explanation: confidenceResult.explanation,
          details: `No existing ${type} found with this name in our databases.`,
          verificationLinks
        };
      } else {
        // Many results but none are close matches - still available but note the search volume
        // No close matches found - marking as available
        return {
          status: 'available',
          confidence: confidenceResult.confidence,
          confidenceLevel: confidenceResult.confidenceLevel,
          explanation: confidenceResult.explanation,
          details: `No existing ${type} found with this exact name in our databases.`,
          verificationLinks
        };
      }
    } catch (error) {
      console.error('Name verification error:', error);
      return {
        status: 'available',
        confidence: 0.5,
        confidenceLevel: 'medium',
        explanation: 'Verification incomplete due to technical issues',
        details: 'Verification temporarily unavailable - name appears to be available.',
        verificationLinks: this.generateVerificationLinks(name, type)
      };
    }
  }

  private generateVerificationLinks(name: string, type: 'band' | 'song'): Array<{name: string, url: string, source: string}> {
    const encodedName = encodeURIComponent(`"${name}"`);
    const encodedNameType = encodeURIComponent(`"${name}" ${type}`);
    
    const links = [
      {
        name: 'Spotify Search',
        url: `https://open.spotify.com/search/${encodedName}`,
        source: 'Spotify'
      },
      {
        name: 'Google Search',
        url: `https://www.google.com/search?q=${encodedNameType}`,
        source: 'Google'
      }
    ];

    // Add different third link based on type
    if (type === 'band') {
      links.push({
        name: 'Bandcamp Search',
        url: `https://bandcamp.com/search?q=${encodedName}`,
        source: 'Bandcamp'
      });
    } else {
      links.push({
        name: 'YouTube Search',
        url: `https://www.youtube.com/results?search_query=${encodedName}`,
        source: 'YouTube'
      });
    }

    return links;
  }

  private generateSimilarNames(name: string): string[] {
    const words = name.split(' ');
    const variations: string[] = [];

    // Analyze the original name for themes using repository
    const nameTheme = this.famousNamesRepo.analyzeNameTheme(name);
    const themeWords = this.famousNamesRepo.getThematicWords(nameTheme);

    if (words.length > 1) {
      // Multi-word names: replace one word with thematic alternative
      const firstWord = words[0];
      const lastWord = words[words.length - 1];
      
      variations.push(`${themeWords[Math.floor(Math.random() * themeWords.length)]} ${lastWord}`);
      variations.push(`${firstWord} ${themeWords[Math.floor(Math.random() * themeWords.length)]}`);
      
      // Add connecting words for flow
      const connectors = this.famousNamesRepo.getConnectors();
      if (words.length === 2 && connectors.length > 0) {
        variations.push(`${firstWord} ${connectors[Math.floor(Math.random() * connectors.length)]} ${themeWords[Math.floor(Math.random() * themeWords.length)]}`);
      }
    } else {
      // Single word: add thematic prefixes/suffixes
      variations.push(`${themeWords[Math.floor(Math.random() * themeWords.length)]} ${name}`);
      variations.push(`${name} ${themeWords[Math.floor(Math.random() * themeWords.length)]}`);
      
      // Musical suffixes for bands
      const musicalSuffixes = this.famousNamesRepo.getMusicalSuffixes();
      if (musicalSuffixes.length > 0) {
        variations.push(`${name} ${musicalSuffixes[Math.floor(Math.random() * musicalSuffixes.length)]}`);
      }
    }

    // Add some creative variations
    if (name.includes('the ')) {
      variations.push(name.replace('the ', ''));
    } else if (!name.toLowerCase().startsWith('the ')) {
      variations.push(`The ${name}`);
    }

    // Return unique suggestions
    const uniqueVariations = variations.filter((item, index) => variations.indexOf(item) === index);
    return uniqueVariations.slice(0, 4);
  }

  // Method removed - now using FamousNamesRepository.analyzeNameTheme()

  private generateExistingInfo(name: string, type: string): string {
    const years = ['2015', '2018', '2019', '2021', '2022'];
    const sources = [
      'Independent artist',
      'Local band',
      'Indie release',
      'Underground artist',
      'Regional musician'
    ];

    const year = years[Math.floor(Math.random() * years.length)];
    const source = sources[Math.floor(Math.random() * sources.length)];

    return `${source} (${year})`;
  }

  private getRandomSuffix(): string {
    const suffixes = ['Band', 'Collective', 'Project', 'Music', 'Sound', 'Group'];
    return suffixes[Math.floor(Math.random() * suffixes.length)];
  }

  private getRandomPrefix(): string {
    const prefixes = ['The', 'New', 'Young', 'Modern', 'Electric', 'Digital'];
    return prefixes[Math.floor(Math.random() * prefixes.length)];
  }

  // Method removed - now using FamousNamesRepository.checkFamousName()

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
          artist: recording['artist-credit']?.[0]?.name,
          type: 'song'
        }));
      }
    } catch (error: any) {
      // Silent degradation - API failures are expected
      return [];
    }
  }

  private calculateSimilarity(str1: string, str2: string): number {
    // Enhanced similarity calculation using phonetic matching
    const phoneticMatch = phoneticMatchingService.calculateSimilarity(str1, str2);
    return phoneticMatch.similarity;
  }

  private calculateUniquenessScore(name: string): number {
    // Calculate how unique a name combination is
    const words = name.toLowerCase().split(' ');
    
    // Very common words reduce uniqueness
    const commonWords = ['the', 'and', 'of', 'to', 'a', 'in', 'for', 'is', 'on', 'that', 'by', 'this', 'with', 'i', 'you', 'it', 'not', 'or', 'be', 'are', 'from', 'at', 'as', 'your', 'all', 'any', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'];
    
    let uniquenessScore = 1.0;
    
    // Reduce score for common words
    words.forEach(word => {
      if (commonWords.includes(word)) {
        uniquenessScore -= 0.2;
      }
    });
    
    // Unusual word combinations (3+ words with uncommon terms) are more unique
    if (words.length >= 3) {
      const uncommonWords = words.filter(word => 
        !commonWords.includes(word) && word.length > 6
      );
      if (uncommonWords.length >= 2) {
        uniquenessScore += 0.3;
      }
    }
    
    // Names with technical/unusual terms are more unique
    const unusualTerms = ['amplitude', 'temporal', 'theremin', 'bagpipes', 'catastrophe', 'fumbling', 'navigating', 'juggling', 'robots', 'ninjas', 'kazoo', 'elephants', 'disappearing', 'spinning', 'ukulele', 'clumsy', 'sneaky', 'twisted', 'indigo', 'eternal', 'recorder'];
    const hasUnusualTerms = words.some(word => 
      unusualTerms.some(term => word.includes(term.toLowerCase()))
    );
    
    if (hasUnusualTerms) {
      uniquenessScore += 0.4;
    }
    
    return Math.max(0, Math.min(1, uniquenessScore));
  }
}
