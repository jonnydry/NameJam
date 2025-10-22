/**
 * Optimized Cache Service with Tiered TTL Strategy
 * 
 * Implements intelligent caching based on data type and volatility:
 * - Hot data: Frequently accessed, short TTL
 * - Warm data: Moderately accessed, medium TTL  
 * - Cold data: Rarely accessed, long TTL
 * - Static data: Never changes, very long TTL
 */

import { secureLog } from '../utils/secureLogger';

export interface CacheTier {
  name: string;
  ttl: number;
  maxSize: number;
  priority: number;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  tier: string;
  size: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  sets: number;
  hitRate: number;
  memoryUsage: number;
  tierStats: Record<string, { hits: number; misses: number; size: number }>;
}

export class OptimizedCacheService<T = any> {
  private cache: Map<string, CacheEntry<T>>;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly tiers: Record<string, CacheTier>;
  private stats: CacheStats;
  private readonly maxMemoryMB: number;

  constructor(maxMemoryMB: number = 100) {
    this.cache = new Map();
    this.maxMemoryMB = maxMemoryMB;
    
    // Define cache tiers based on data volatility and access patterns
    this.tiers = {
      'hot': {
        name: 'Hot Data',
        ttl: 5 * 60 * 1000,      // 5 minutes - frequently changing data
        maxSize: 1000,
        priority: 1
      },
      'warm': {
        name: 'Warm Data', 
        ttl: 30 * 60 * 1000,     // 30 minutes - moderately stable data
        maxSize: 5000,
        priority: 2
      },
      'cold': {
        name: 'Cold Data',
        ttl: 2 * 60 * 60 * 1000, // 2 hours - stable data
        maxSize: 10000,
        priority: 3
      },
      'static': {
        name: 'Static Data',
        ttl: 24 * 60 * 60 * 1000, // 24 hours - never changes
        maxSize: 20000,
        priority: 4
      }
    };

    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      sets: 0,
      hitRate: 0,
      memoryUsage: 0,
      tierStats: Object.keys(this.tiers).reduce((acc, tier) => {
        acc[tier] = { hits: 0, misses: 0, size: 0 };
        return acc;
      }, {} as Record<string, { hits: number; misses: number; size: number }>)
    };

    this.startCleanupInterval();
  }

  /**
   * Get data from cache with tier-aware access tracking
   */
  get(key: string, tier: keyof typeof this.tiers = 'warm'): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      this.stats.tierStats[tier].misses++;
      return null;
    }

    // Check if entry has expired
    const now = Date.now();
    if (now - entry.timestamp > this.tiers[entry.tier].ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.tierStats[tier].misses++;
      return null;
    }

    // Update access tracking
    entry.accessCount++;
    entry.lastAccessed = now;
    
    this.stats.hits++;
    this.stats.tierStats[entry.tier].hits++;
    this.stats.hitRate = this.stats.hits / (this.stats.hits + this.stats.misses);

    return entry.data;
  }

  /**
   * Set data in cache with intelligent tier selection
   */
  set(key: string, data: T, tier: keyof typeof this.tiers = 'warm'): void {
    const now = Date.now();
    const dataSize = this.estimateSize(data);
    
    // Check memory limits
    if (this.stats.memoryUsage + dataSize > this.maxMemoryMB * 1024 * 1024) {
      this.evictLeastUsed();
    }

    // Check tier size limits
    const tierSize = this.getTierSize(tier);
    if (tierSize >= this.tiers[tier].maxSize) {
      this.evictTier(tier);
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      accessCount: 1,
      lastAccessed: now,
      tier,
      size: dataSize
    };

    this.cache.set(key, entry);
    this.stats.sets++;
    this.stats.memoryUsage += dataSize;
    this.stats.tierStats[tier].size++;
  }

  /**
   * Set data with automatic tier detection based on data type
   */
  setWithAutoTier(key: string, data: T, dataType?: string): void {
    const tier = this.detectOptimalTier(dataType, key);
    this.set(key, data, tier);
  }

  /**
   * Detect optimal cache tier based on data characteristics
   */
  private detectOptimalTier(dataType?: string, key?: string): keyof typeof this.tiers {
    // Data type-based tier detection
    if (dataType) {
      switch (dataType.toLowerCase()) {
        case 'spotify_artists':
        case 'spotify_tracks':
        case 'real_time_data':
          return 'hot';
        
        case 'datamuse_words':
        case 'conceptnet_associations':
        case 'genre_vocabulary':
          return 'warm';
        
        case 'verification_results':
        case 'name_generation':
        case 'cached_names':
          return 'cold';
        
        case 'static_genre_data':
        case 'musical_terms':
        case 'poetry_patterns':
          return 'static';
      }
    }

    // Key pattern-based detection
    if (key) {
      if (key.includes('realtime') || key.includes('live')) return 'hot';
      if (key.includes('genre') || key.includes('mood')) return 'warm';
      if (key.includes('verification') || key.includes('generated')) return 'cold';
      if (key.includes('static') || key.includes('reference')) return 'static';
    }

    return 'warm'; // Default tier
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return {
      ...this.stats,
      memoryUsage: this.stats.memoryUsage / (1024 * 1024) // Convert to MB
    };
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      sets: 0,
      hitRate: 0,
      memoryUsage: 0,
      tierStats: Object.keys(this.tiers).reduce((acc, tier) => {
        acc[tier] = { hits: 0, misses: 0, size: 0 };
        return acc;
      }, {} as Record<string, { hits: number; misses: number; size: number }>)
    };
  }

  /**
   * Clear specific tier
   */
  clearTier(tier: keyof typeof this.tiers): void {
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tier === tier) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => {
      const entry = this.cache.get(key);
      if (entry) {
        this.stats.memoryUsage -= entry.size;
        this.stats.tierStats[tier].size--;
        this.cache.delete(key);
      }
    });
  }

  /**
   * Get tier size
   */
  private getTierSize(tier: keyof typeof this.tiers): number {
    return this.stats.tierStats[tier].size;
  }

  /**
   * Estimate data size in bytes
   */
  private estimateSize(data: any): number {
    try {
      return JSON.stringify(data).length * 2; // Rough estimate
    } catch {
      return 1024; // Default 1KB if serialization fails
    }
  }

  /**
   * Evict least used entries when memory limit is reached
   */
  private evictLeastUsed(): void {
    const entries = Array.from(this.cache.entries())
      .map(([key, entry]) => ({ key, entry }))
      .sort((a, b) => {
        // Sort by access count and last accessed time
        const scoreA = a.entry.accessCount / (Date.now() - a.entry.lastAccessed + 1);
        const scoreB = b.entry.accessCount / (Date.now() - b.entry.lastAccessed + 1);
        return scoreA - scoreB;
      });

    // Evict 10% of entries or at least 1
    const toEvict = Math.max(1, Math.floor(entries.length * 0.1));
    
    for (let i = 0; i < toEvict; i++) {
      const { key, entry } = entries[i];
      this.cache.delete(key);
      this.stats.evictions++;
      this.stats.memoryUsage -= entry.size;
      this.stats.tierStats[entry.tier].size--;
    }
  }

  /**
   * Evict entries from specific tier
   */
  private evictTier(tier: keyof typeof this.tiers): void {
    const tierEntries = Array.from(this.cache.entries())
      .filter(([_, entry]) => entry.tier === tier)
      .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

    // Evict oldest 20% of tier entries
    const toEvict = Math.max(1, Math.floor(tierEntries.length * 0.2));
    
    for (let i = 0; i < toEvict; i++) {
      const [key, entry] = tierEntries[i];
      this.cache.delete(key);
      this.stats.evictions++;
      this.stats.memoryUsage -= entry.size;
      this.stats.tierStats[tier].size--;
    }
  }

  /**
   * Start cleanup interval for expired entries
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, 60000); // Cleanup every minute
  }

  /**
   * Clean up expired entries
   */
  private cleanupExpired(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.tiers[entry.tier].ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => {
      const entry = this.cache.get(key);
      if (entry) {
        this.stats.memoryUsage -= entry.size;
        this.stats.tierStats[entry.tier].size--;
        this.cache.delete(key);
      }
    });

    if (keysToDelete.length > 0) {
      secureLog.debug(`Cache cleanup: removed ${keysToDelete.length} expired entries`);
    }
  }

  /**
   * Destroy cache service
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

// Export singleton instance
export const optimizedCache = new OptimizedCacheService();
