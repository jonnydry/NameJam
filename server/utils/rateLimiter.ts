import { secureLog } from './secureLogger';

interface RateLimiterOptions {
  maxRequests: number;
  windowMs: number;
  delayMs?: number;
}

interface QueuedRequest {
  execute: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

export class RateLimiter {
  private requests: number[] = [];
  private queue: QueuedRequest[] = [];
  private processing = false;
  
  constructor(private options: RateLimiterOptions) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        execute: fn,
        resolve,
        reject
      });
      
      if (!this.processing) {
        this.processQueue();
      }
    });
  }
  
  private async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      // Clean up old requests outside the window
      const now = Date.now();
      this.requests = this.requests.filter(time => now - time < this.options.windowMs);
      
      // Check if we can make a request
      if (this.requests.length >= this.options.maxRequests) {
        // Calculate wait time until the oldest request expires
        const oldestRequest = this.requests[0];
        const waitTime = oldestRequest + this.options.windowMs - now;
        await this.delay(waitTime);
        continue;
      }
      
      // Process the next request
      const request = this.queue.shift()!;
      this.requests.push(now);
      
      try {
        const result = await request.execute();
        request.resolve(result);
      } catch (error) {
        request.reject(error);
      }
      
      // Add delay between requests if specified
      if (this.options.delayMs && this.queue.length > 0) {
        await this.delay(this.options.delayMs);
      }
    }
    
    this.processing = false;
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Exponential backoff retry wrapper
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a rate limit error (status 429 or specific error messages)
      const isRateLimitError = 
        error.status === 429 || 
        error.message?.toLowerCase().includes('rate limit') ||
        error.message?.toLowerCase().includes('too many requests');
      
      if (attempt < maxRetries - 1 && isRateLimitError) {
        const delay = initialDelay * Math.pow(2, attempt);
        secureLog.info(`Rate limit hit, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  
  throw lastError;
}

// Pre-configured rate limiters for each API
export const spotifyRateLimiter = new RateLimiter({
  maxRequests: 100,  // Spotify allows ~100 requests per minute
  windowMs: 60000,   // 1 minute
  delayMs: 100       // 100ms between requests
});

export const xaiRateLimiter = new RateLimiter({
  maxRequests: 60,   // Conservative estimate for XAI
  windowMs: 60000,   // 1 minute
  delayMs: 200       // 200ms between requests
});

export const lastFmRateLimiter = new RateLimiter({
  maxRequests: 5,    // Last.fm has strict limits: 5 requests per second
  windowMs: 1000,    // 1 second
  delayMs: 50        // 50ms between requests
});

export const musicBrainzRateLimiter = new RateLimiter({
  maxRequests: 1,    // MusicBrainz requires 1 request per second
  windowMs: 1000,    // 1 second
  delayMs: 100       // 100ms between requests
});