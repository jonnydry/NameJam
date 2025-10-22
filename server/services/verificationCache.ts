import NodeCache from 'node-cache';
import type { VerificationResult } from "@shared/schema";
import { secureLog } from '../utils/secureLogger';

interface CacheStats {
  hits: number;
  misses: number;
  keys: number;
  hitRate: number;
}

export class VerificationCache {
  private static instance: VerificationCache;
  private cache: NodeCache;
  private stats: CacheStats;

  private constructor() {
    // Cache configuration:
    // - TTL: 1 hour (3600 seconds) - verification results don't change frequently
    // - Check period: 10 minutes (600 seconds) - cleanup expired entries
    // - Max keys: 10000 - prevent memory bloat
    this.cache = new NodeCache({
      stdTTL: 3600, // 1 hour default TTL
      checkperiod: 600, // Check for expired keys every 10 minutes
      maxKeys: 10000, // Maximum number of keys to store
      deleteOnExpire: true,
      useClones: false // Don't clone data for better performance
    });

    this.stats = {
      hits: 0,
      misses: 0,
      keys: 0,
      hitRate: 0
    };

    // Set up event listeners for monitoring
    this.cache.on('expired', (key, value) => {
      secureLog.debug(`Cache expired: ${key}`);
    });

    this.cache.on('set', (key, value) => {
      this.stats.keys = this.cache.keys().length;
    });

    this.cache.on('del', (key, value) => {
      this.stats.keys = this.cache.keys().length;
    });

    // Log cache stats periodically (every 30 minutes)
    setInterval(() => {
      this.logStats();
    }, 1800000);
  }

  static getInstance(): VerificationCache {
    if (!VerificationCache.instance) {
      VerificationCache.instance = new VerificationCache();
    }
    return VerificationCache.instance;
  }

  /**
   * Generate a cache key for a verification request
   */
  private generateKey(name: string, type: 'band' | 'song'): string {
    // Normalize the name to ensure consistent caching
    const normalizedName = name.toLowerCase().trim().replace(/\s+/g, ' ');
    return `verify:${type}:${normalizedName}`;
  }

  /**
   * Get a cached verification result
   */
  get(name: string, type: 'band' | 'song'): VerificationResult | null {
    const key = this.generateKey(name, type);
    const result = this.cache.get<VerificationResult>(key);
    
    if (result) {
      this.stats.hits++;
      secureLog.debug(`Cache hit for: ${key}`);
    } else {
      this.stats.misses++;
    }
    
    this.updateHitRate();
    return result || null;
  }

  /**
   * Store a verification result in cache
   */
  set(name: string, type: 'band' | 'song', result: VerificationResult, ttl?: number): void {
    const key = this.generateKey(name, type);
    
    // Don't cache error states or low confidence results
    if ((result.confidence !== undefined && result.confidence < 0.3) || 
        (result.explanation && result.explanation.includes('technical issues'))) {
      secureLog.debug(`Skipping cache for low confidence/error result: ${key}`);
      return;
    }
    
    // Use custom TTL if provided, otherwise use default
    const success = ttl ? this.cache.set(key, result, ttl) : this.cache.set(key, result);
    
    if (success) {
      secureLog.debug(`Cached result for: ${key}`);
    } else {
      secureLog.warn(`Failed to cache result for: ${key}`);
    }
  }

  /**
   * Clear specific cache entry
   */
  delete(name: string, type: 'band' | 'song'): void {
    const key = this.generateKey(name, type);
    this.cache.del(key);
    secureLog.debug(`Deleted cache entry: ${key}`);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.flushAll();
    this.stats = {
      hits: 0,
      misses: 0,
      keys: 0,
      hitRate: 0
    };
    secureLog.info('Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    this.stats.keys = this.cache.keys().length;
    return { ...this.stats };
  }

  /**
   * Update hit rate calculation
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  /**
   * Log cache statistics
   */
  private logStats(): void {
    const stats = this.getStats();
    secureLog.info('Cache Statistics', {
      hits: stats.hits,
      misses: stats.misses,
      hitRate: `${stats.hitRate.toFixed(2)}%`,
      keys: stats.keys
    });
  }

  /**
   * Warm up cache with common names (optional)
   */
  async warmUp(commonNames: Array<{name: string, type: 'band' | 'song'}>): Promise<void> {
    secureLog.info(`Warming up cache with ${commonNames.length} common names`);
    
    // This would be called with pre-verification results for common searches
    // Implementation depends on having a list of common searches to pre-cache
    
    // Note: Actual warming would require calling the verification service
    // This is just the interface for it
  }
}