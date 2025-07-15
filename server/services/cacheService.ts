import Redis from 'ioredis';

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

class CacheService {
  private redis: Redis | null = null;
  private memoryCache: Map<string, CacheEntry> = new Map();
  private readonly DEFAULT_TTL = 24 * 60 * 60; // 24 hours in seconds
  private readonly MEMORY_CACHE_LIMIT = 1000;

  constructor() {
    this.initializeRedis();
  }

  private initializeRedis() {
    try {
      // Check for Redis connection string in environment
      const redisUrl = process.env.REDIS_URL || process.env.REDISCLOUD_URL;
      
      if (redisUrl) {
        this.redis = new Redis(redisUrl, {
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3,
          lazyConnect: true,
          connectTimeout: 5000,
          commandTimeout: 3000,
        });

        this.redis.on('error', (error) => {
          console.warn('Redis connection error, falling back to memory cache:', error.message);
          this.redis = null;
        });

        this.redis.on('connect', () => {
          console.log('✓ Redis cache connected successfully');
        });
      } else {
        console.log('No Redis URL found, using memory cache only');
      }
    } catch (error) {
      console.warn('Failed to initialize Redis, using memory cache:', error);
      this.redis = null;
    }
  }

  async set(key: string, value: any, ttl: number = this.DEFAULT_TTL): Promise<void> {
    const entry: CacheEntry = {
      data: value,
      timestamp: Date.now(),
      ttl: ttl * 1000 // Convert to milliseconds for memory cache
    };

    try {
      if (this.redis) {
        await this.redis.setex(key, ttl, JSON.stringify(entry));
      }
    } catch (error) {
      console.warn('Redis set failed, using memory cache:', error);
    }

    // Always maintain memory cache as fallback
    this.setMemoryCache(key, entry);
  }

  async get(key: string): Promise<any> {
    try {
      if (this.redis) {
        const cached = await this.redis.get(key);
        if (cached) {
          const entry: CacheEntry = JSON.parse(cached);
          return entry.data;
        }
      }
    } catch (error) {
      console.warn('Redis get failed, falling back to memory cache:', error);
    }

    // Fallback to memory cache
    return this.getMemoryCache(key);
  }

  async del(key: string): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.del(key);
      }
    } catch (error) {
      console.warn('Redis del failed:', error);
    }

    this.memoryCache.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    try {
      if (this.redis) {
        const exists = await this.redis.exists(key);
        return exists === 1;
      }
    } catch (error) {
      console.warn('Redis exists failed, checking memory cache:', error);
    }

    return this.memoryCache.has(key) && !this.isExpired(key);
  }

  private setMemoryCache(key: string, entry: CacheEntry): void {
    // Clean up expired entries and limit cache size
    if (this.memoryCache.size >= this.MEMORY_CACHE_LIMIT) {
      this.cleanupMemoryCache();
    }

    this.memoryCache.set(key, entry);
  }

  private getMemoryCache(key: string): any {
    const entry = this.memoryCache.get(key);
    if (!entry) return null;

    if (this.isExpired(key)) {
      this.memoryCache.delete(key);
      return null;
    }

    return entry.data;
  }

  private isExpired(key: string): boolean {
    const entry = this.memoryCache.get(key);
    if (!entry) return true;

    return Date.now() > (entry.timestamp + entry.ttl);
  }

  private cleanupMemoryCache(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [key, entry] of this.memoryCache.entries()) {
      if (now > (entry.timestamp + entry.ttl)) {
        toDelete.push(key);
      }
    }

    toDelete.forEach(key => this.memoryCache.delete(key));

    // If still over limit, remove oldest entries
    if (this.memoryCache.size >= this.MEMORY_CACHE_LIMIT) {
      const entries = Array.from(this.memoryCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const removeCount = Math.floor(this.MEMORY_CACHE_LIMIT * 0.2); // Remove 20%
      for (let i = 0; i < removeCount; i++) {
        this.memoryCache.delete(entries[i][0]);
      }
    }
  }

  // Specialized methods for different cache types
  
  async cacheSpotifyVerification(name: string, type: 'band' | 'song', result: any): Promise<void> {
    const key = `spotify:${type}:${name.toLowerCase()}`;
    await this.set(key, result, 24 * 60 * 60); // 24 hours
  }

  async getCachedSpotifyVerification(name: string, type: 'band' | 'song'): Promise<any> {
    const key = `spotify:${type}:${name.toLowerCase()}`;
    return await this.get(key);
  }

  async cacheGeneratedNames(request: any, names: any[]): Promise<void> {
    const key = `names:${JSON.stringify(request)}`;
    await this.set(key, names, 60 * 60); // 1 hour for generated names
  }

  async getCachedGeneratedNames(request: any): Promise<any[]> {
    const key = `names:${JSON.stringify(request)}`;
    return await this.get(key);
  }

  async cacheLastFmVerification(name: string, type: 'band' | 'song', result: any): Promise<void> {
    const key = `lastfm:${type}:${name.toLowerCase()}`;
    await this.set(key, result, 12 * 60 * 60); // 12 hours
  }

  async getCachedLastFmVerification(name: string, type: 'band' | 'song'): Promise<any> {
    const key = `lastfm:${type}:${name.toLowerCase()}`;
    return await this.get(key);
  }

  async cacheMusicBrainzVerification(name: string, type: 'band' | 'song', result: any): Promise<void> {
    const key = `musicbrainz:${type}:${name.toLowerCase()}`;
    await this.set(key, result, 12 * 60 * 60); // 12 hours
  }

  async getCachedMusicBrainzVerification(name: string, type: 'band' | 'song'): Promise<any> {
    const key = `musicbrainz:${type}:${name.toLowerCase()}`;
    return await this.get(key);
  }

  // Health check method
  async healthCheck(): Promise<{ redis: boolean, memory: boolean }> {
    let redisHealth = false;
    
    try {
      if (this.redis) {
        await this.redis.ping();
        redisHealth = true;
      }
    } catch (error) {
      redisHealth = false;
    }

    return {
      redis: redisHealth,
      memory: this.memoryCache.size < this.MEMORY_CACHE_LIMIT
    };
  }

  // Statistics method
  getStats(): { memorySize: number, redisConnected: boolean } {
    return {
      memorySize: this.memoryCache.size,
      redisConnected: this.redis !== null
    };
  }
}

export const cacheService = new CacheService();