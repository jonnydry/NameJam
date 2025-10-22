import { CacheEntry } from '../types/lyricTypes';
import { secureLog } from '../utils/secureLogger';

export class CacheService<T = any> {
  private cache: Map<string, CacheEntry<T>>;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly defaultTTL: number;
  private readonly maxSize: number;
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    sets: 0
  };

  constructor(defaultTTLSeconds: number = 3600, maxSize: number = 1000) {
    this.cache = new Map();
    this.defaultTTL = defaultTTLSeconds * 1000; // Convert to milliseconds
    this.maxSize = maxSize;
    this.startCleanupInterval();
  }

  /**
   * Get a value from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if entry has expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update hit count and stats
    entry.hits++;
    this.stats.hits++;
    
    return entry.data;
  }

  /**
   * Set a value in cache with optional custom TTL
   */
  set(key: string, data: T, ttlSeconds?: number): void {
    const ttl = ttlSeconds ? ttlSeconds * 1000 : this.defaultTTL;
    
    // Check size limit and evict LRU if necessary
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      hits: 0
    };

    this.cache.set(key, entry);
    this.stats.sets++;
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Delete a specific key from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.resetStats();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.stats.hits / (this.stats.hits + this.stats.misses) || 0;
    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100,
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }

  /**
   * Get or set with a factory function
   */
  async getOrSet(key: string, factory: () => Promise<T>, ttlSeconds?: number): Promise<T> {
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }

    const data = await factory();
    this.set(key, data, ttlSeconds);
    return data;
  }

  /**
   * Check if an entry has expired
   */
  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    this.cache.forEach((entry, key) => {
      const lastAccess = entry.timestamp + (entry.hits * 1000); // Rough LRU approximation
      if (lastAccess < oldestTime) {
        oldestTime = lastAccess;
        oldestKey = key;
      }
    });

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
    }
  }

  /**
   * Start periodic cleanup of expired entries
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, 60000); // Run every minute
  }

  /**
   * Clean up expired entries
   */
  private cleanupExpired(): void {
    let cleaned = 0;
    const keysToDelete: string[] = [];
    this.cache.forEach((entry, key) => {
      if (this.isExpired(entry)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => {
      this.cache.delete(key);
      cleaned++;
    });
    
    if (cleaned > 0) {
      secureLog.debug(`Cache cleanup: removed ${cleaned} expired entries`);
    }
  }

  /**
   * Reset statistics
   */
  private resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      sets: 0
    };
  }

  /**
   * Destroy the cache service and clean up intervals
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

// Singleton instances for different cache purposes
export const apiContextCache = new CacheService(3600, 100); // 1 hour TTL, max 100 entries
export const genreSeedCache = new CacheService(86400, 50); // 24 hour TTL, max 50 entries
export const lyricGenerationCache = new CacheService(1800, 200); // 30 min TTL, max 200 entries