/**
 * Performance optimizations for unified AI generation
 */

import { performance } from 'perf_hooks';
import { secureLog } from '../utils/secureLogger';

export class PerformanceTimer {
  private timers: Map<string, number> = new Map();
  
  start(name: string) {
    this.timers.set(name, performance.now());
  }
  
  end(name: string): number {
    const startTime = this.timers.get(name);
    if (!startTime) {
      secureLog.warn(`Timer ${name} was not started`);
      return 0;
    }
    const duration = performance.now() - startTime;
    this.timers.delete(name);
    return Math.round(duration);
  }
  
  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
    this.start(name);
    const result = await fn();
    const duration = this.end(name);
    secureLog.debug(`⏱️ ${name}: ${duration}ms`);
    return { result, duration };
  }
}

// Context cache for repeated requests
export class ContextCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes
  
  getCacheKey(genre: string, mood: string): string {
    return `${genre}:${mood}`;
  }
  
  get(genre: string, mood: string): any | null {
    const key = this.getCacheKey(genre, mood);
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }
    
    secureLog.debug(`📦 Using cached context for ${genre}/${mood}`);
    return cached.data;
  }
  
  set(genre: string, mood: string, data: any) {
    const key = this.getCacheKey(genre, mood);
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
  
  clear() {
    this.cache.clear();
  }
}

export const performanceTimer = new PerformanceTimer();
export const contextCache = new ContextCache();