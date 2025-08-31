import { z } from 'zod';

// Standardized error response schema for API endpoints
export const apiErrorSchema = z.object({
  error: z.string(),
  code: z.string().optional(),
  suggestion: z.string().optional(),
  details: z.any().optional(),
  timestamp: z.string().optional(),
  requestId: z.string().optional()
});

export type ApiError = z.infer<typeof apiErrorSchema>;

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Client-side error tracking schema
export const clientErrorSchema = z.object({
  message: z.string(),
  stack: z.string().optional(),
  componentStack: z.string().optional(),
  url: z.string(),
  userAgent: z.string(),
  timestamp: z.string(),
  severity: z.nativeEnum(ErrorSeverity),
  userId: z.string().optional(),
  context: z.record(z.any()).optional()
});

export type ClientError = z.infer<typeof clientErrorSchema>;

// Service availability status
export enum ServiceStatus {
  AVAILABLE = 'available',
  DEGRADED = 'degraded',
  UNAVAILABLE = 'unavailable'
}

// Service health schema
export const serviceHealthSchema = z.object({
  service: z.string(),
  status: z.nativeEnum(ServiceStatus),
  lastCheck: z.string(),
  responseTime: z.number().optional(),
  errorRate: z.number().optional()
});

export type ServiceHealth = z.infer<typeof serviceHealthSchema>;

// Graceful degradation configuration
export const degradationConfigSchema = z.object({
  service: z.string(),
  fallbackEnabled: z.boolean(),
  fallbackMessage: z.string(),
  retryAttempts: z.number(),
  retryDelay: z.number(),
  timeoutMs: z.number()
});

export type DegradationConfig = z.infer<typeof degradationConfigSchema>;

// Common error codes
export const ERROR_CODES = {
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  RATE_LIMITED: 'RATE_LIMITED',
  
  // Authentication errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CSRF_INVALID: 'CSRF_INVALID',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // Service errors
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  
  // Generation errors
  GENERATION_FAILED: 'GENERATION_FAILED',
  VERIFICATION_FAILED: 'VERIFICATION_FAILED',
  CONTEXT_LOADING_FAILED: 'CONTEXT_LOADING_FAILED',
  
  // Client errors
  COMPONENT_ERROR: 'COMPONENT_ERROR',
  RENDERING_ERROR: 'RENDERING_ERROR',
  STATE_ERROR: 'STATE_ERROR'
} as const;

// Helper functions for error handling
export class ErrorHandler {
  static createApiError(
    message: string, 
    code?: string, 
    suggestion?: string, 
    details?: any
  ): ApiError {
    return {
      error: message,
      code,
      suggestion,
      details,
      timestamp: new Date().toISOString(),
      requestId: this.generateRequestId()
    };
  }
  
  static createClientError(
    message: string,
    severity: ErrorSeverity,
    context?: Record<string, any>,
    stack?: string
  ): ClientError {
    return {
      message,
      stack,
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      timestamp: new Date().toISOString(),
      severity,
      context
    };
  }
  
  static isNetworkError(error: Error): boolean {
    return error.message.includes('fetch') || 
           error.message.includes('network') ||
           error.message.includes('Failed to fetch');
  }
  
  static isTimeoutError(error: Error): boolean {
    return error.message.includes('timeout') ||
           error.message.includes('AbortError');
  }
  
  static getErrorSeverity(error: Error): ErrorSeverity {
    if (this.isNetworkError(error)) return ErrorSeverity.MEDIUM;
    if (this.isTimeoutError(error)) return ErrorSeverity.LOW;
    if (error.message.includes('CSRF')) return ErrorSeverity.HIGH;
    return ErrorSeverity.MEDIUM;
  }
  
  private static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}