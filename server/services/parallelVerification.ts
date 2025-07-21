import type { VerificationResult } from "@shared/schema";
import { spotifyService } from "./spotifyService";
import { performanceCache } from "./performanceCache";

export class ParallelVerificationService {
  private famousNames = new Set([
    'the beatles', 'rolling stones', 'queen', 'led zeppelin', 'pink floyd',
    'nirvana', 'metallica', 'radiohead', 'u2', 'coldplay', 'oasis',
    'guns n roses', 'red hot chili peppers', 'pearl jam', 'foo fighters'
  ]);

  async verifyNamesInParallel(names: Array<{name: string, type: 'band' | 'song'}>): Promise<VerificationResult[]> {
    // Check cache first for all names
    const results: VerificationResult[] = [];
    const uncachedNames: Array<{name: string, type: 'band' | 'song', index: number}> = [];

    for (let i = 0; i < names.length; i++) {
      const { name, type } = names[i];
      
      // Check for easter eggs first
      if (this.isEasterEgg(name)) {
        results[i] = {
          status: 'available',
          details: 'We love you. Go to bed. <3',
          verificationLinks: []
        };
        continue;
      }

      // Check cache
      const cached = performanceCache.getCachedVerification(name, type);
      if (cached) {
        results[i] = cached;
      } else {
        uncachedNames.push({ name, type, index: i });
      }
    }

    // Verify uncached names in parallel with limited concurrency
    if (uncachedNames.length > 0) {
      const verificationPromises = uncachedNames.map(async ({ name, type, index }) => {
        try {
          const result = await this.verifyNameFast(name, type);
          // Cache the result
          performanceCache.setCachedVerification(name, type, result);
          return { result, index };
        } catch (error) {
          // Fallback result for errors
          return {
            result: {
              status: 'available' as const,
              details: 'Verification temporarily unavailable',
              verificationLinks: this.generateVerificationLinks(name, type)
            },
            index
          };
        }
      });

      // Execute with limited concurrency (max 3 parallel requests)
      const batchSize = 3;
      for (let i = 0; i < verificationPromises.length; i += batchSize) {
        const batch = verificationPromises.slice(i, i + batchSize);
        const batchResults = await Promise.allSettled(batch);
        
        batchResults.forEach((result) => {
          if (result.status === 'fulfilled') {
            results[result.value.index] = result.value.result;
          }
        });
      }
    }

    return results;
  }

  private async verifyNameFast(name: string, type: 'band' | 'song'): Promise<VerificationResult> {
    const verificationLinks = this.generateVerificationLinks(name, type);

    // Quick Spotify check only (skip other APIs for speed)
    try {
      if (await spotifyService.isAvailable()) {
        const spotifyResults = type === 'band' 
          ? await spotifyService.verifyBandName(name)
          : await spotifyService.verifySongName(name);

        if (spotifyResults && spotifyResults.exists) {
          const match = spotifyResults.matches[0];
          const details = type === 'band' 
            ? `Found on Spotify: "${match.name}" (${'genres' in match ? match.genres?.join(', ') || 'Various genres' : 'Band'})`
            : `Found on Spotify: "${match.name}" ${'artist' in match ? `by ${match.artist}` : ''}`;
          
          return {
            status: 'taken',
            details,
            verificationLinks
          };
        }
      }
    } catch (error) {
      // Continue to basic check if Spotify fails
    }

    // Basic availability (no other API calls for speed)
    return {
      status: 'available',
      details: 'No existing entries found in our databases.',
      verificationLinks
    };
  }

  private isEasterEgg(name: string): boolean {
    const normalizedName = name.toLowerCase().replace(/[^a-z]/g, '');
    if (normalizedName === 'namejam') return true;
    
    const lowerName = name.toLowerCase().trim();
    return this.famousNames.has(lowerName);
  }

  private generateVerificationLinks(name: string, type: string) {
    const encodedName = encodeURIComponent(name);
    const searchQuery = type === 'band' ? `${encodedName} band` : `${encodedName} song`;
    
    return [
      {
        name: 'Spotify',
        url: `https://open.spotify.com/search/${encodedName}`,
        source: 'spotify'
      },
      {
        name: 'Google',
        url: `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`,
        source: 'google'
      },
      {
        name: 'YouTube',
        url: `https://www.youtube.com/results?search_query=${encodedName}`,
        source: 'youtube'
      }
    ];
  }
}

export const parallelVerificationService = new ParallelVerificationService();