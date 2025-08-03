/**
 * Rate limiter for parallel verification to prevent overwhelming external APIs
 */

import { secureLog } from '../utils/secureLogger';

interface RateLimitConfig {
  maxConcurrent: number;
  minDelayMs: number;
  maxBurstSize: number;
}

export class ParallelVerificationRateLimiter {
  private activeRequests = 0;
  private requestQueue: Array<() => void> = [];
  private lastRequestTime = 0;
  private burstCount = 0;
  private burstResetTime = 0;

  constructor(private config: RateLimitConfig) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Wait if we're at max concurrent requests
    while (this.activeRequests >= this.config.maxConcurrent) {
      await new Promise<void>(resolve => {
        this.requestQueue.push(resolve);
      });
    }

    // Check burst limit (prevent too many requests in a short time)
    const now = Date.now();
    if (now - this.burstResetTime > 10000) { // Reset burst count every 10 seconds
      this.burstCount = 0;
      this.burstResetTime = now;
    }

    if (this.burstCount >= this.config.maxBurstSize) {
      const waitTime = 10000 - (now - this.burstResetTime);
      secureLog.debug(`Rate limit burst protection: waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.burstCount = 0;
      this.burstResetTime = Date.now();
    }

    // Enforce minimum delay between requests
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.config.minDelayMs) {
      await new Promise(resolve => 
        setTimeout(resolve, this.config.minDelayMs - timeSinceLastRequest)
      );
    }

    this.activeRequests++;
    this.burstCount++;
    this.lastRequestTime = Date.now();

    try {
      return await operation();
    } finally {
      this.activeRequests--;
      
      // Process queued requests
      if (this.requestQueue.length > 0) {
        const resolve = this.requestQueue.shift()!;
        resolve();
      }
    }
  }

  getStats() {
    return {
      activeRequests: this.activeRequests,
      queueLength: this.requestQueue.length,
      burstCount: this.burstCount,
      config: this.config
    };
  }
}

// Create rate limiters for different verification services
export const verificationRateLimiters = {
  spotify: new ParallelVerificationRateLimiter({
    maxConcurrent: 2,
    minDelayMs: 100,
    maxBurstSize: 10
  }),
  lastfm: new ParallelVerificationRateLimiter({
    maxConcurrent: 2,
    minDelayMs: 200,
    maxBurstSize: 8
  }),
  musicbrainz: new ParallelVerificationRateLimiter({
    maxConcurrent: 1,
    minDelayMs: 1000, // MusicBrainz requires 1 request per second
    maxBurstSize: 3
  }),
  combined: new ParallelVerificationRateLimiter({
    maxConcurrent: 4, // Total concurrent across all services
    minDelayMs: 50,
    maxBurstSize: 15
  })
};