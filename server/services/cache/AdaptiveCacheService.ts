/**
 * Adaptive Cache Service
 * Uses adapter pattern to support both memory and Redis caching
 */

import { CacheAdapter } from "./CacheAdapter";
import { MemoryCacheAdapter } from "./MemoryCacheAdapter";
import { RedisCacheAdapter } from "./RedisCacheAdapter";
import { secureLog } from "../../utils/secureLogger";
import { config } from "../../config";

export class AdaptiveCacheService<T = any> implements CacheAdapter<T> {
  private adapter: CacheAdapter<T>;
  private readonly adapterType: 'memory' | 'redis';

  constructor(adapterType: 'memory' | 'redis' = 'memory', redisClient?: any) {
    this.adapterType = adapterType;
    
    if (adapterType === 'redis' && redisClient) {
      this.adapter = new RedisCacheAdapter<T>(redisClient);
    } else {
      this.adapter = new MemoryCacheAdapter<T>(
        config.cache.maxSize,
        config.cache.defaultTTL
      );
    }

    secureLog.info(`Cache service initialized with ${adapterType} adapter`);
  }

  get(key: string): T | undefined {
    return this.adapter.get(key);
  }

  set(key: string, value: T, ttl?: number): void {
    this.adapter.set(key, value, ttl);
  }

  delete(key: string): boolean {
    return this.adapter.delete(key);
  }

  has(key: string): boolean {
    return this.adapter.has(key);
  }

  clear(): void {
    this.adapter.clear();
  }

  size(): number {
    return this.adapter.size();
  }

  keys(): string[] {
    return this.adapter.keys();
  }

  getStats() {
    return this.adapter.getStats();
  }

  getAdapterType(): string {
    return this.adapterType;
  }

  isRedisConnected(): boolean {
    if (this.adapterType === 'redis' && 'isConnected' in this.adapter) {
      return (this.adapter as any).isConnected();
    }
    return false;
  }

  async connect(): Promise<void> {
    if (this.adapterType === 'redis' && 'connect' in this.adapter) {
      await (this.adapter as any).connect();
    }
  }

  async disconnect(): Promise<void> {
    if (this.adapterType === 'redis' && 'disconnect' in this.adapter) {
      await (this.adapter as any).disconnect();
    }
  }
}

// Factory function to create cache instances
export function createCacheService<T = any>(
  type: 'memory' | 'redis' = 'memory',
  redisClient?: any
): AdaptiveCacheService<T> {
  return new AdaptiveCacheService<T>(type, redisClient);
}

// Pre-configured cache instances
export const contextCache = createCacheService('memory');
export const apiContextCache = createCacheService('memory');
export const genreSeedCache = createCacheService('memory');
export const lyricGenerationCache = createCacheService('memory');
export const phoneticCache = createCacheService('memory');
export const sessionCache = createCacheService('memory');
