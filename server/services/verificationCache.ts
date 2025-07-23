// Simple in-memory LRU cache for verification results
export class VerificationCache {
  private cache: Map<string, { result: any; timestamp: number }> = new Map();
  private maxSize = 1000;
  private ttl = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  // Normalize key for consistent caching
  private normalizeKey(name: string, type: string): string {
    return `${type}:${name.toLowerCase().trim()}`;
  }

  // Get cached result if it exists and is not expired
  get(name: string, type: string): any | null {
    const key = this.normalizeKey(name, type);
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    // Check if expired
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, cached);
    
    return cached.result;
  }

  // Set a cache entry
  set(name: string, type: string, result: any): void {
    const key = this.normalizeKey(name, type);
    
    // Remove oldest entry if at max size
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    
    this.cache.set(key, {
      result,
      timestamp: Date.now()
    });
  }

  // Clear expired entries
  clearExpired(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.cache.forEach((value, key) => {
      if (now - value.timestamp > this.ttl) {
        keysToDelete.push(key);
      }
    });
    
    // Delete expired keys
    keysToDelete.forEach(key => {
      this.cache.delete(key);
    });
  }

  // Get cache stats
  getStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }
}

export const verificationCache = new VerificationCache();

// Clear expired entries every hour
setInterval(() => {
  verificationCache.clearExpired();
}, 60 * 60 * 1000);