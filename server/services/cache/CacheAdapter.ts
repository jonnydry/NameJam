/**
 * Cache Adapter Interface
 * Defines the contract for different cache implementations
 */

export interface CacheAdapter<T = any> {
  get(key: string): T | undefined;
  set(key: string, value: T, ttl?: number): void;
  delete(key: string): boolean;
  has(key: string): boolean;
  clear(): void;
  size(): number;
  keys(): string[];
  getStats(): {
    size: number;
    hitRate?: number;
    missRate?: number;
    evictions?: number;
  };
}
