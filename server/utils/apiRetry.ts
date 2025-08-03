/**
 * Universal API retry utility with exponential backoff
 */

import { secureLog } from './secureLogger';

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableErrors?: string[];
  onRetry?: (attempt: number, error: any) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNREFUSED'],
  onRetry: (attempt, error) => {
    secureLog.debug(`Retry attempt ${attempt} after error: ${error.message}`);
  }
};

export async function withApiRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;
  
  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Check if error is retryable
      const isRetryable = 
        error.code && opts.retryableErrors.includes(error.code) ||
        error.response?.status >= 500 ||
        error.response?.status === 429; // Rate limit
      
      if (!isRetryable || attempt === opts.maxRetries) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        opts.initialDelay * Math.pow(opts.backoffMultiplier, attempt),
        opts.maxDelay
      );
      
      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 0.3 * delay;
      const totalDelay = delay + jitter;
      
      opts.onRetry(attempt + 1, error);
      
      await new Promise(resolve => setTimeout(resolve, totalDelay));
    }
  }
  
  throw lastError;
}

// Specific retry configurations for different services
export const apiRetryConfigs = {
  spotify: {
    maxRetries: 3,
    initialDelay: 1000,
    retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND'],
  },
  lastfm: {
    maxRetries: 2,
    initialDelay: 500,
    retryableErrors: ['ECONNRESET', 'ETIMEDOUT'],
  },
  musicbrainz: {
    maxRetries: 2,
    initialDelay: 2000, // MusicBrainz requires slower rate
    retryableErrors: ['ECONNRESET', 'ETIMEDOUT'],
  },
  conceptnet: {
    maxRetries: 2,
    initialDelay: 500,
    retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND'],
  },
  poetrydb: {
    maxRetries: 3,
    initialDelay: 500,
    retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND'],
  }
};