interface CacheEntry {
  result: any;
  timestamp: number;
}

class VerificationCache {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  private readonly maxSize = 1000; // Maximum number of entries

  private getCacheKey(name: string, type: string): string {
    return `${type}:${name.toLowerCase().trim()}`;
  }

  get(name: string, type: string): any | null {
    const key = this.getCacheKey(name, type);
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }

    return entry.result;
  }

  set(name: string, type: string, result: any): void {
    const key = this.getCacheKey(name, type);
    
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      result,
      timestamp: Date.now()
    });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Export singleton instance
export const verificationCache = new VerificationCache();