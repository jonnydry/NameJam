/**
 * Redis Cache Adapter
 * Redis implementation of the cache adapter (optional)
 */

import { CacheAdapter } from "./CacheAdapter";
import { secureLog } from "../../utils/secureLogger";

export class RedisCacheAdapter<T = any> implements CacheAdapter<T> {
  private redis: any;
  private readonly keyPrefix: string;
  private connected = false;

  constructor(redisClient?: any, keyPrefix: string = 'namejam:') {
    this.redis = redisClient;
    this.keyPrefix = keyPrefix;
    
    if (this.redis) {
      this.connected = true;
    }
  }

  private getKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }

  private async executeRedisCommand(command: string, ...args: any[]): Promise<any> {
    if (!this.connected || !this.redis) {
      throw new Error('Redis not connected');
    }

    try {
      return await this.redis[command](...args);
    } catch (error) {
      secureLog.error('Redis command failed:', error);
      throw error;
    }
  }

  async get(key: string): Promise<T | undefined> {
    try {
      const value = await this.executeRedisCommand('get', this.getKey(key));
      return value ? JSON.parse(value) : undefined;
    } catch (error) {
      secureLog.error('Redis get failed:', error);
      return undefined;
    }
  }

  async set(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      const redisKey = this.getKey(key);
      
      if (ttl && ttl > 0) {
        await this.executeRedisCommand('setex', redisKey, ttl, serialized);
      } else {
        await this.executeRedisCommand('set', redisKey, serialized);
      }
    } catch (error) {
      secureLog.error('Redis set failed:', error);
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const result = await this.executeRedisCommand('del', this.getKey(key));
      return result > 0;
    } catch (error) {
      secureLog.error('Redis delete failed:', error);
      return false;
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      const result = await this.executeRedisCommand('exists', this.getKey(key));
      return result === 1;
    } catch (error) {
      secureLog.error('Redis exists failed:', error);
      return false;
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = await this.executeRedisCommand('keys', `${this.keyPrefix}*`);
      if (keys.length > 0) {
        await this.executeRedisCommand('del', ...keys);
      }
    } catch (error) {
      secureLog.error('Redis clear failed:', error);
    }
  }

  async size(): Promise<number> {
    try {
      const keys = await this.executeRedisCommand('keys', `${this.keyPrefix}*`);
      return keys.length;
    } catch (error) {
      secureLog.error('Redis size failed:', error);
      return 0;
    }
  }

  async keys(): Promise<string[]> {
    try {
      const keys = await this.executeRedisCommand('keys', `${this.keyPrefix}*`);
      return keys.map((key: string) => key.replace(this.keyPrefix, ''));
    } catch (error) {
      secureLog.error('Redis keys failed:', error);
      return [];
    }
  }

  async getStats() {
    try {
      const info = await this.executeRedisCommand('info', 'memory');
      const size = await this.size();
      
      return {
        size,
        hitRate: 0, // Redis doesn't provide hit rate by default
        missRate: 0,
        evictions: 0
      };
    } catch (error) {
      secureLog.error('Redis stats failed:', error);
      return {
        size: 0,
        hitRate: 0,
        missRate: 0,
        evictions: 0
      };
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  async connect(): Promise<void> {
    if (this.redis) {
      try {
        await this.redis.ping();
        this.connected = true;
        secureLog.info('Redis cache adapter connected');
      } catch (error) {
        this.connected = false;
        secureLog.error('Redis connection failed:', error);
      }
    }
  }

  async disconnect(): Promise<void> {
    if (this.redis) {
      try {
        await this.redis.quit();
        this.connected = false;
        secureLog.info('Redis cache adapter disconnected');
      } catch (error) {
        secureLog.error('Redis disconnect failed:', error);
      }
    }
  }
}
