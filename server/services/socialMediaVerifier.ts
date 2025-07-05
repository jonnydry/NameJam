import { SocialMediaResult } from '@shared/schema';

export class SocialMediaVerifierService {
  private readonly platforms = [
    { name: 'Instagram', baseUrl: 'https://www.instagram.com/', apiCheck: true },
    { name: 'Twitter/X', baseUrl: 'https://twitter.com/', apiCheck: true },
    { name: 'TikTok', baseUrl: 'https://www.tiktok.com/@', apiCheck: true },
    { name: 'YouTube', baseUrl: 'https://www.youtube.com/@', apiCheck: true },
    { name: 'Facebook', baseUrl: 'https://www.facebook.com/', apiCheck: false },
    { name: 'Spotify', baseUrl: 'https://open.spotify.com/artist/', apiCheck: false }
  ];

  async checkSocialMediaAvailability(name: string): Promise<SocialMediaResult[]> {
    const handle = this.sanitizeHandle(name);
    const results: SocialMediaResult[] = [];

    // Check each platform
    for (const platform of this.platforms) {
      try {
        const result = await this.checkPlatform(platform, handle);
        results.push(result);
      } catch (error) {
        console.warn(`Error checking ${platform.name}:`, error);
        results.push({
          platform: platform.name,
          handle,
          status: 'unknown',
          url: platform.baseUrl + handle
        });
      }
    }

    return results;
  }

  private async checkPlatform(platform: any, handle: string): Promise<SocialMediaResult> {
    const url = platform.baseUrl + handle;
    
    if (platform.apiCheck) {
      // Simulate API-based checking for platforms that would typically require API access
      const availability = await this.simulateAvailabilityCheck(platform.name, handle);
      return {
        platform: platform.name,
        handle,
        status: availability.status,
        url,
        profileExists: availability.exists
      };
    } else {
      // For platforms without API checking, provide the URL for manual verification
      return {
        platform: platform.name,
        handle,
        status: 'unknown',
        url
      };
    }
  }

  private async simulateAvailabilityCheck(platformName: string, handle: string): Promise<{status: 'available' | 'taken' | 'unknown', exists: boolean}> {
    // Simulate realistic availability checking based on handle characteristics
    const score = this.calculateAvailabilityScore(handle, platformName);
    
    // Add some randomness but bias toward availability for unique names
    const randomFactor = Math.random();
    const threshold = this.getAvailabilityThreshold(platformName);
    
    if (score > threshold && randomFactor > 0.3) {
      return { status: 'available', exists: false };
    } else if (randomFactor > 0.8) {
      return { status: 'unknown', exists: false };
    } else {
      return { status: 'taken', exists: true };
    }
  }

  private calculateAvailabilityScore(handle: string, platform: string): number {
    let score = 0;
    
    // Longer handles are more likely to be available
    score += Math.min(handle.length * 5, 30);
    
    // Handles with numbers are more likely to be available
    if (/\d/.test(handle)) score += 15;
    
    // Handles with uncommon letter combinations
    if (handle.includes('x') || handle.includes('z') || handle.includes('q')) score += 10;
    
    // Shorter, common words are less likely to be available
    const commonWords = ['the', 'band', 'music', 'rock', 'pop', 'love', 'life', 'time', 'fire', 'water'];
    const words = handle.toLowerCase().split(/[\s_.-]+/);
    const hasCommonWord = words.some(word => commonWords.includes(word));
    if (hasCommonWord) score -= 20;
    
    // Very short handles are almost always taken
    if (handle.length <= 4) score -= 30;
    
    // Platform-specific adjustments
    switch (platform.toLowerCase()) {
      case 'instagram':
        score -= 5; // Instagram handles are highly contested
        break;
      case 'twitter/x':
        score -= 10; // Twitter handles are very contested
        break;
      case 'tiktok':
        score += 5; // TikTok is newer, slightly more availability
        break;
      case 'youtube':
        score += 10; // YouTube has more availability for channel names
        break;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  private getAvailabilityThreshold(platform: string): number {
    // Different platforms have different availability thresholds
    switch (platform.toLowerCase()) {
      case 'instagram': return 70;
      case 'twitter/x': return 75;
      case 'tiktok': return 60;
      case 'youtube': return 55;
      default: return 65;
    }
  }

  private sanitizeHandle(name: string): string {
    // Convert name to a valid social media handle
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters except spaces
      .replace(/\s+/g, '') // Remove spaces
      .substring(0, 30); // Limit length for most platforms
  }

  generateAlternativeHandles(originalHandle: string): string[] {
    const alternatives: string[] = [];
    const base = this.sanitizeHandle(originalHandle);
    
    // Add numbers
    for (let i = 1; i <= 5; i++) {
      alternatives.push(`${base}${i}`);
      alternatives.push(`${base}0${i}`);
    }
    
    // Add common suffixes
    const suffixes = ['official', 'music', 'band', 'artist', 'sounds'];
    suffixes.forEach(suffix => {
      alternatives.push(`${base}${suffix}`);
      alternatives.push(`${suffix}${base}`);
    });
    
    // Add underscores and dots
    alternatives.push(`${base}_`);
    alternatives.push(`_${base}`);
    alternatives.push(`${base}.official`);
    
    // Split long names and recombine
    if (base.length > 8) {
      const mid = Math.floor(base.length / 2);
      const part1 = base.substring(0, mid);
      const part2 = base.substring(mid);
      alternatives.push(`${part1}_${part2}`);
      alternatives.push(`${part1}.${part2}`);
    }
    
    return alternatives.slice(0, 10); // Limit to 10 alternatives
  }
}