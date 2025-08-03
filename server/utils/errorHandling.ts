/**
 * Enhanced error handling utilities with fallback mechanisms
 */

import { secureLog } from './secureLogger';

export interface FallbackOptions<T> {
  maxAttempts?: number;
  delayMs?: number;
  fallbackValue?: T;
  onError?: (error: any, attempt: number) => void;
  shouldRetry?: (error: any) => boolean;
}

export async function withFallback<T>(
  operation: () => Promise<T>,
  fallbackFn: () => Promise<T> | T,
  options: FallbackOptions<T> = {}
): Promise<T> {
  const {
    maxAttempts = 1,
    delayMs = 0,
    onError,
    shouldRetry = () => true
  } = options;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      secureLog.error(`Operation failed (attempt ${attempt}/${maxAttempts}):`, error.message);
      
      if (onError) {
        onError(error, attempt);
      }

      if (attempt < maxAttempts && shouldRetry(error)) {
        if (delayMs > 0) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
        continue;
      }

      // All attempts failed, use fallback
      secureLog.info('Using fallback mechanism');
      try {
        return await fallbackFn();
      } catch (fallbackError: any) {
        secureLog.error('Fallback also failed:', fallbackError.message);
        
        if (options.fallbackValue !== undefined) {
          secureLog.info('Using default fallback value');
          return options.fallbackValue;
        }
        
        throw error; // Throw original error if no fallback value
      }
    }
  }

  // Should never reach here
  throw new Error('Unexpected error in withFallback');
}

export interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
}

export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private successCount = 0;

  constructor(private options: CircuitBreakerOptions) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      const now = Date.now();
      if (now - this.lastFailureTime > this.options.resetTimeout) {
        this.state = 'HALF_OPEN';
        this.successCount = 0;
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      
      if (this.state === 'HALF_OPEN') {
        this.successCount++;
        if (this.successCount >= 3) {
          this.state = 'CLOSED';
          this.failures = 0;
          secureLog.info('Circuit breaker reset to CLOSED');
        }
      }
      
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordFailure(): void {
    const now = Date.now();
    
    if (now - this.lastFailureTime > this.options.monitoringPeriod) {
      this.failures = 1;
    } else {
      this.failures++;
    }
    
    this.lastFailureTime = now;

    if (this.failures >= this.options.failureThreshold) {
      this.state = 'OPEN';
      secureLog.warn(`Circuit breaker opened after ${this.failures} failures`);
    }
  }

  getState(): string {
    return this.state;
  }
}

// Database operation wrapper with retry logic
export async function withDatabaseRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  const retryableErrors = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND'];
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      const isRetryable = 
        error.code && retryableErrors.includes(error.code) ||
        error.message?.includes('connection') ||
        error.message?.includes('timeout');
      
      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }
      
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      secureLog.info(`Database operation failed, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Max retries exceeded');
}

// User-friendly error messages
export function getUserFriendlyError(error: any): string {
  if (error.code === 'ECONNREFUSED') {
    return 'The service is temporarily unavailable. Please try again in a few moments.';
  }
  
  if (error.code === 'ETIMEDOUT') {
    return 'The request took too long to complete. Please check your connection and try again.';
  }
  
  if (error.status === 429) {
    return 'You\'ve made too many requests. Please wait a moment before trying again.';
  }
  
  if (error.status === 503) {
    return 'The service is undergoing maintenance. Please try again later.';
  }
  
  if (error.message?.includes('validation')) {
    return 'Please check your input and try again.';
  }
  
  if (error.message?.includes('database')) {
    return 'We\'re having trouble saving your data. Please try again.';
  }
  
  return 'Something went wrong. Please try again or contact support if the problem persists.';
}