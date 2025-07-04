export interface SocialMediaPlatform {
  name: string;
  baseUrl: string;
  available: boolean;
  profileUrl?: string;
  error?: string;
}

export interface SocialMediaResult {
  handle: string;
  platforms: SocialMediaPlatform[];
  overallAvailability: 'available' | 'partially_available' | 'unavailable';
}

export class SocialMediaChecker {
  private platforms = [
    { name: 'Instagram', baseUrl: 'https://www.instagram.com/', checkUrl: 'https://www.instagram.com/web/search/topsearch/?query=' },
    { name: 'Twitter/X', baseUrl: 'https://twitter.com/', checkUrl: 'https://twitter.com/' },
    { name: 'TikTok', baseUrl: 'https://www.tiktok.com/@', checkUrl: 'https://www.tiktok.com/@' },
    { name: 'YouTube', baseUrl: 'https://www.youtube.com/@', checkUrl: 'https://www.youtube.com/@' },
    { name: 'Facebook', baseUrl: 'https://www.facebook.com/', checkUrl: 'https://www.facebook.com/' },
    { name: 'Spotify', baseUrl: 'https://open.spotify.com/artist/', checkUrl: 'https://open.spotify.com/search/' },
    { name: 'SoundCloud', baseUrl: 'https://soundcloud.com/', checkUrl: 'https://soundcloud.com/' },
    { name: 'Bandcamp', baseUrl: 'https://bandcamp.com/', checkUrl: 'https://bandcamp.com/search?q=' }
  ];

  async checkHandleAvailability(handle: string): Promise<SocialMediaResult> {
    // Clean the handle - remove spaces, special characters except underscores and hyphens
    const cleanHandle = this.cleanHandle(handle);
    
    if (!this.isValidHandle(cleanHandle)) {
      return this.createErrorResult(handle, 'Invalid handle format');
    }

    const platformChecks = await Promise.allSettled(
      this.platforms.map(platform => this.checkPlatform(platform, cleanHandle))
    );

    const platforms: SocialMediaPlatform[] = platformChecks.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          name: this.platforms[index].name,
          baseUrl: this.platforms[index].baseUrl,
          available: false,
          error: 'Check failed'
        };
      }
    });

    const availableCount = platforms.filter(p => p.available).length;
    let overallAvailability: 'available' | 'partially_available' | 'unavailable';
    
    if (availableCount === platforms.length) {
      overallAvailability = 'available';
    } else if (availableCount > 0) {
      overallAvailability = 'partially_available';
    } else {
      overallAvailability = 'unavailable';
    }

    return {
      handle: cleanHandle,
      platforms,
      overallAvailability
    };
  }

  private cleanHandle(handle: string): string {
    // Remove spaces and convert to lowercase
    let cleaned = handle.toLowerCase().trim();
    
    // Remove special characters except underscores, hyphens, and alphanumeric
    cleaned = cleaned.replace(/[^a-z0-9_-]/g, '');
    
    // Remove multiple consecutive underscores or hyphens
    cleaned = cleaned.replace(/[_-]{2,}/g, '_');
    
    // Remove leading/trailing underscores or hyphens
    cleaned = cleaned.replace(/^[_-]+|[_-]+$/g, '');
    
    return cleaned;
  }

  private isValidHandle(handle: string): boolean {
    // Check if handle meets basic criteria
    if (!handle || handle.length < 2 || handle.length > 30) {
      return false;
    }

    // Must start with alphanumeric character
    if (!/^[a-z0-9]/.test(handle)) {
      return false;
    }

    // Must end with alphanumeric character
    if (!/[a-z0-9]$/.test(handle)) {
      return false;
    }

    return true;
  }

  private async checkPlatform(platform: { name: string; baseUrl: string; checkUrl: string }, handle: string): Promise<SocialMediaPlatform> {
    try {
      // Simulate checking each platform
      // In a real implementation, this would make HTTP requests to check availability
      const isAvailable = await this.simulatePlatformCheck(platform.name, handle);
      
      return {
        name: platform.name,
        baseUrl: platform.baseUrl,
        available: isAvailable,
        profileUrl: isAvailable ? undefined : `${platform.baseUrl}${handle}`
      };
    } catch (error) {
      return {
        name: platform.name,
        baseUrl: platform.baseUrl,
        available: false,
        error: 'Check failed'
      };
    }
  }

  private async simulatePlatformCheck(platformName: string, handle: string): Promise<boolean> {
    // Simulate realistic availability based on handle characteristics
    // This simulates the reality that shorter, simpler handles are more likely to be taken
    
    const handleScore = this.calculateHandleScore(handle);
    const platformPopularity = this.getPlatformPopularity(platformName);
    
    // Combine factors to determine availability
    const availabilityThreshold = 0.3 + (platformPopularity * 0.4);
    const random = Math.random();
    
    // Add some randomness but bias towards realistic results
    const adjustedScore = handleScore + (random * 0.3 - 0.15);
    
    return adjustedScore > availabilityThreshold;
  }

  private calculateHandleScore(handle: string): number {
    let score = 0;
    
    // Longer handles are more likely to be available
    if (handle.length > 10) score += 0.3;
    else if (handle.length < 5) score -= 0.2;
    
    // Handles with numbers or underscores are more likely to be available
    if (/\d/.test(handle)) score += 0.2;
    if (/_/.test(handle)) score += 0.1;
    
    // Common words are less likely to be available
    const commonWords = ['music', 'band', 'song', 'sound', 'official', 'the', 'and', 'rock', 'pop'];
    for (const word of commonWords) {
      if (handle.includes(word)) {
        score -= 0.3;
        break;
      }
    }
    
    // Random factor for uniqueness
    if (this.hasUniquePattern(handle)) score += 0.2;
    
    return Math.max(0, Math.min(1, score + 0.5)); // Normalize to 0-1 range
  }

  private getPlatformPopularity(platformName: string): number {
    // Return popularity factor (0-1) where higher means more competitive
    const popularity: { [key: string]: number } = {
      'Instagram': 0.9,
      'Twitter/X': 0.8,
      'TikTok': 0.85,
      'YouTube': 0.8,
      'Facebook': 0.7,
      'Spotify': 0.6,
      'SoundCloud': 0.5,
      'Bandcamp': 0.3
    };
    
    return popularity[platformName] || 0.5;
  }

  private hasUniquePattern(handle: string): boolean {
    // Check for unique patterns that might make a handle more likely to be available
    // Multiple word combinations, creative spelling, etc.
    
    // Has mix of letters and numbers in creative way
    if (/[a-z]+\d+[a-z]+/.test(handle)) return true;
    
    // Has creative separators
    if (handle.includes('_') && handle.length > 8) return true;
    
    // Looks like a compound word
    if (handle.length > 10 && !/\d/.test(handle)) return true;
    
    return false;
  }

  private createErrorResult(handle: string, error: string): SocialMediaResult {
    return {
      handle,
      platforms: this.platforms.map(p => ({
        name: p.name,
        baseUrl: p.baseUrl,
        available: false,
        error
      })),
      overallAvailability: 'unavailable'
    };
  }

  generateHandleSuggestions(baseName: string): string[] {
    const cleanBase = this.cleanHandle(baseName);
    const suggestions: string[] = [];
    
    // Add variations
    suggestions.push(`${cleanBase}music`);
    suggestions.push(`${cleanBase}band`);
    suggestions.push(`${cleanBase}official`);
    suggestions.push(`the${cleanBase}`);
    suggestions.push(`${cleanBase}_music`);
    suggestions.push(`${cleanBase}_band`);
    
    // Add with numbers
    for (let i = 1; i <= 5; i++) {
      suggestions.push(`${cleanBase}${i}`);
      suggestions.push(`${cleanBase}_${i}`);
    }
    
    // Add creative variations
    suggestions.push(`${cleanBase}sounds`);
    suggestions.push(`${cleanBase}beats`);
    suggestions.push(`${cleanBase}vibes`);
    
    // Filter to valid handles and return unique ones
    return [...new Set(suggestions)]
      .filter(s => this.isValidHandle(s))
      .slice(0, 10);
  }
}