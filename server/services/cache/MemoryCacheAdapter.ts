/**
 * Memory Cache Adapter
 * In-memory implementation of the cache adapter
 */

import { CacheAdapter } from "./CacheAdapter";
import { secureLog } from "../../utils/secureLogger";

interface CacheEntry<T> {
  value: T;
  expiry: number;
  accessCount: number;
  lastAccessed: number;
}

export class MemoryCacheAdapter<T = any> implements CacheAdapter<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private readonly maxSize: number;
  private readonly defaultTTL: number;
  private hits = 0;
  private misses = 0;
  private evictions = 0;

  constructor(maxSize: number = 1000, defaultTTL: number = 1800) {
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL * 1000; // Convert to milliseconds
    
    // Start cleanup interval
    this.startCleanup();
  }

  private startCleanup(): void {
    setInterval(() => {
      this.cleanup();
    }, 60000); // Cleanup every minute
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiry > 0 && now > entry.expiry) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      secureLog.debug(`Memory cache: Cleaned up ${cleaned} expired entries`);
    }
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.misses++;
      return undefined;
    }

    // Check if expired
    if (entry.expiry > 0 && Date.now() > entry.expiry) {
      this.cache.delete(key);
      this.misses++;
      return undefined;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.hits++;
    
    return entry.value;
  }

  set(key: string, value: T, ttl?: number): void {
    const now = Date.now();
    const expiry = ttl ? now + (ttl * 1000) : (ttl === 0 ? 0 : now + this.defaultTTL);

    // Check if we need to evict
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    this.cache.set(key, {
      value,
      expiry,
      accessCount: 0,
      lastAccessed: now
    });
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    // Check if expired
    if (entry.expiry > 0 && Date.now() > entry.expiry) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }

  size(): number {
    return this.cache.size;
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  private evictLRU(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.evictions++;
    }
  }

  getStats() {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      hitRate: total > 0 ? this.hits / total : 0,
      missRate: total > 0 ? this.misses / total : 0,
      evictions: this.evictions
    };
  }
}
