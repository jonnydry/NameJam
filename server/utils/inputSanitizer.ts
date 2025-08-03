/**
 * Input sanitization utilities for enhanced security
 */

import { secureLog } from './secureLogger';

interface SanitizationOptions {
  maxLength?: number;
  allowedChars?: RegExp;
  stripHtml?: boolean;
  trimWhitespace?: boolean;
  toLowerCase?: boolean;
}

export class InputSanitizer {
  private static readonly SQL_INJECTION_PATTERNS = [
    /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute|script|javascript)\b)/gi,
    /(--|\/\*|\*\/|xp_|sp_)/gi,
    /(\'\s*(or|and)\s*\'\s*=\s*\')/gi
  ];

  private static readonly XSS_PATTERNS = [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<img[^>]*>/gi
  ];

  private static readonly PATH_TRAVERSAL_PATTERNS = [
    /\.\.\//g,
    /\.\.%2F/gi,
    /%2e%2e\//gi
  ];

  static sanitizeString(input: string, options: SanitizationOptions = {}): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    let sanitized = input;

    // Apply max length
    if (options.maxLength && sanitized.length > options.maxLength) {
      sanitized = sanitized.substring(0, options.maxLength);
    }

    // Strip HTML if requested
    if (options.stripHtml) {
      sanitized = sanitized.replace(/<[^>]*>/g, '');
    }

    // Remove dangerous patterns
    this.XSS_PATTERNS.forEach(pattern => {
      if (pattern.test(sanitized)) {
        secureLog.warn(`XSS pattern detected and removed from input`);
        sanitized = sanitized.replace(pattern, '');
      }
    });

    this.SQL_INJECTION_PATTERNS.forEach(pattern => {
      if (pattern.test(sanitized)) {
        secureLog.warn(`SQL injection pattern detected and removed from input`);
        sanitized = sanitized.replace(pattern, '');
      }
    });

    // Apply allowed characters filter
    if (options.allowedChars) {
      sanitized = sanitized.split('').filter(char => options.allowedChars!.test(char)).join('');
    }

    // Trim whitespace
    if (options.trimWhitespace) {
      sanitized = sanitized.trim();
    }

    // Convert to lowercase
    if (options.toLowerCase) {
      sanitized = sanitized.toLowerCase();
    }

    return sanitized;
  }

  static sanitizePath(path: string): string {
    if (!path || typeof path !== 'string') {
      return '';
    }

    let sanitized = path;

    // Remove path traversal attempts
    this.PATH_TRAVERSAL_PATTERNS.forEach(pattern => {
      if (pattern.test(sanitized)) {
        secureLog.warn(`Path traversal pattern detected and removed from input`);
        sanitized = sanitized.replace(pattern, '');
      }
    });

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');

    // Normalize path
    sanitized = sanitized.replace(/\/+/g, '/');

    return sanitized;
  }

  static sanitizeNameInput(name: string): string {
    return this.sanitizeString(name, {
      maxLength: 100,
      stripHtml: true,
      trimWhitespace: true,
      allowedChars: /[a-zA-Z0-9\s\-_'.!?&]/
    });
  }

  static sanitizeGenreInput(genre: string): string {
    return this.sanitizeString(genre, {
      maxLength: 50,
      stripHtml: true,
      trimWhitespace: true,
      allowedChars: /[a-zA-Z0-9\s\-&\/]/
    });
  }

  static sanitizeMoodInput(mood: string): string {
    return this.sanitizeString(mood, {
      maxLength: 50,
      stripHtml: true,
      trimWhitespace: true,
      toLowerCase: true,
      allowedChars: /[a-z\s\-]/
    });
  }

  static sanitizeSearchQuery(query: string): string {
    return this.sanitizeString(query, {
      maxLength: 200,
      stripHtml: true,
      trimWhitespace: true
    });
  }

  static escapeHtml(str: string): string {
    const htmlEscapes: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    };
    
    return str.replace(/[&<>"'/]/g, (match) => htmlEscapes[match]);
  }
}