/**
 * Secure Logging Utilities
 * Prevents sensitive data from being logged
 */

const SENSITIVE_PATTERNS = [
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email addresses
  /\bxai-[A-Za-z0-9_-]+/g, // XAI API keys
  /\bsk-[A-Za-z0-9_-]+/g, // OpenAI API keys
  /\bsess:[A-Za-z0-9+/=]+/g, // Session tokens
  /\baccess_token['":\s]+[A-Za-z0-9_-]+/g, // Access tokens
  /\brefresh_token['":\s]+[A-Za-z0-9_-]+/g, // Refresh tokens
  /\bpassword['":\s]+[^"'}\s]+/g, // Password fields
  /\bsecret['":\s]+[^"'}\s]+/g, // Secret fields
  /\btoken['":\s]+[A-Za-z0-9_-]{10,}/g, // Generic tokens
];

const SENSITIVE_REPLACEMENT = '[REDACTED]';

/**
 * Sanitizes log message by removing sensitive data
 */
export function sanitizeLogMessage(message: string): string {
  let sanitized = message;
  
  SENSITIVE_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, SENSITIVE_REPLACEMENT);
  });
  
  return sanitized;
}

/**
 * Secure logger that automatically sanitizes sensitive data
 */
export const secureLog = {
  info: (message: string, ...args: any[]) => {
    console.log(sanitizeLogMessage(message), ...args.map(arg => 
      typeof arg === 'string' ? sanitizeLogMessage(arg) : arg
    ));
  },
  
  warn: (message: string, ...args: any[]) => {
    console.warn(sanitizeLogMessage(message), ...args.map(arg => 
      typeof arg === 'string' ? sanitizeLogMessage(arg) : arg
    ));
  },
  
  error: (message: string, ...args: any[]) => {
    console.error(sanitizeLogMessage(message), ...args.map(arg => 
      typeof arg === 'string' ? sanitizeLogMessage(arg) : arg
    ));
  },
  
  debug: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(sanitizeLogMessage(message), ...args.map(arg => 
        typeof arg === 'string' ? sanitizeLogMessage(arg) : arg
      ));
    }
  }
};

/**
 * Sanitizes API response for logging
 * Removes sensitive fields from objects
 */
export function sanitizeApiResponse(response: any): any {
  if (!response || typeof response !== 'object') {
    return response;
  }
  
  const sensitiveFields = [
    'access_token',
    'refresh_token', 
    'session_id',
    'password',
    'secret',
    'api_key',
    'email',
    'claims'
  ];
  
  const sanitized = { ...response };
  
  sensitiveFields.forEach(field => {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
}