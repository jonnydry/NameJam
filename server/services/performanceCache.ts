import NodeCache from 'node-cache';

class PerformanceCache {
  private nameCache: NodeCache;
  private verificationCache: NodeCache;
  
  constructor() {
    // Name generation cache - 10 minutes TTL
    this.nameCache = new NodeCache({ 
      stdTTL: 600, // 10 minutes
      checkperiod: 120, // Check for expired keys every 2 minutes
      maxKeys: 10000 // Limit to 10k entries
    });
    
    // Verification cache - 1 hour TTL
    this.verificationCache = new NodeCache({ 
      stdTTL: 3600, // 1 hour
      checkperiod: 600, // Check for expired keys every 10 minutes
      maxKeys: 50000 // Limit to 50k entries
    });
  }

  // Name generation caching
  getCachedNames(key: string): any {
    return this.nameCache.get(key);
  }

  setCachedNames(key: string, names: any): void {
    this.nameCache.set(key, names);
  }

  // Verification caching
  getCachedVerification(name: string, type: string): any {
    const key = `${name.toLowerCase()}_${type}`;
    return this.verificationCache.get(key);
  }

  setCachedVerification(name: string, type: string, result: any): void {
    const key = `${name.toLowerCase()}_${type}`;
    this.verificationCache.set(key, result);
  }

  // Cache statistics for monitoring
  getStats() {
    return {
      nameCache: this.nameCache.getStats(),
      verificationCache: this.verificationCache.getStats()
    };
  }

  // Clear caches (for admin use)
  clearAll(): void {
    this.nameCache.flushAll();
    this.verificationCache.flushAll();
  }
}

export const performanceCache = new PerformanceCache();