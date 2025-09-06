import { LyricGenerationError } from '../types/lyricTypes';

/**
 * Custom error classes for the lyric generation service
 */

export class LyricAPIError extends Error implements LyricGenerationError {
  code: 'API_ERROR';
  originalError?: unknown;
  context?: string;

  constructor(message: string, originalError?: unknown, context?: string) {
    super(message);
    this.name = 'LyricAPIError';
    this.code = 'API_ERROR';
    this.originalError = originalError;
    this.context = context;
  }
}

export class LyricTimeoutError extends Error implements LyricGenerationError {
  code: 'TIMEOUT';
  originalError?: unknown;
  context?: string;

  constructor(message: string, timeoutMs: number, context?: string) {
    super(`${message} (timeout: ${timeoutMs}ms)`);
    this.name = 'LyricTimeoutError';
    this.code = 'TIMEOUT';
    this.context = context;
  }
}

export class LyricValidationError extends Error implements LyricGenerationError {
  code: 'VALIDATION_ERROR';
  originalError?: unknown;
  context?: string;

  constructor(message: string, context?: string) {
    super(message);
    this.name = 'LyricValidationError';
    this.code = 'VALIDATION_ERROR';
    this.context = context;
  }
}

export class LyricFallbackError extends Error implements LyricGenerationError {
  code: 'FALLBACK_ERROR';
  originalError?: unknown;
  context?: string;

  constructor(message: string, originalError?: unknown) {
    super(message);
    this.name = 'LyricFallbackError';
    this.code = 'FALLBACK_ERROR';
    this.originalError = originalError;
  }
}

/**
 * Error handler utility
 */
export class LyricErrorHandler {
  static handle(error: unknown, context?: string): LyricGenerationError {
    // If it's already a LyricGenerationError, return it
    if (error instanceof Error && 'code' in error) {
      return error as LyricGenerationError;
    }

    // Handle specific error types
    if (error instanceof TypeError) {
      return new LyricValidationError(error.message, context);
    }

    if (error instanceof Error) {
      if (error.message.includes('timeout') || error.message.includes('timed out')) {
        return new LyricTimeoutError(error.message, 10000, context);
      }
      
      if (error.message.includes('API') || error.message.includes('fetch')) {
        return new LyricAPIError(error.message, error, context);
      }
    }

    // Default to API error for unknown errors
    return new LyricAPIError(
      'An unknown error occurred',
      error,
      context
    );
  }

  static isRecoverable(error: LyricGenerationError): boolean {
    // Timeout and API errors are potentially recoverable with retry
    return error.code === 'TIMEOUT' || error.code === 'API_ERROR';
  }

  static shouldUseFallback(error: LyricGenerationError): boolean {
    // All errors should trigger fallback except validation errors
    return error.code !== 'VALIDATION_ERROR';
  }
}