/**
 * CSRF Protection Service - Modern CSRF token management
 * Provides secure token generation and validation for forms and API calls
 */

import { randomBytes, createHmac } from 'crypto';
import { secureLog } from '../utils/secureLogger';
import type { Request, Response, NextFunction } from 'express';

interface CSRFToken {
  token: string;
  timestamp: number;
  sessionId: string;
}

export class CSRFService {
  private secret: string;
  private tokenExpiry: number = 1 * 60 * 60 * 1000; // 1 hour
  private activeSessions = new Map<string, CSRFToken>();

  constructor() {
    this.secret = process.env.CSRF_SECRET || this.generateSecret();
    
    // Clean expired tokens every 30 minutes
    setInterval(() => this.cleanExpiredTokens(), 30 * 60 * 1000);
  }

  generateToken(sessionId: string): string {
    const tokenData = randomBytes(16).toString('hex');
    const timestamp = Date.now();
    
    // Create HMAC signature
    const signature = this.createSignature(tokenData, timestamp, sessionId);
    const token = `${tokenData}.${timestamp}.${signature}`;
    
    // Store token for validation
    this.activeSessions.set(sessionId, {
      token,
      timestamp,
      sessionId
    });
    
    secureLog.debug(`Generated CSRF token for session: ${sessionId.substring(0, 8)}...`);
    return token;
  }

  validateToken(token: string, sessionId: string): boolean {
    if (!token || !sessionId) {
      secureLog.warn('CSRF validation failed: Missing token or session ID');
      return false;
    }

    try {
      const [tokenData, timestampStr, signature] = token.split('.');
      const timestamp = parseInt(timestampStr);
      
      // Check token format
      if (!tokenData || !timestampStr || !signature) {
        secureLog.warn('CSRF validation failed: Invalid token format');
        return false;
      }
      
      // Check expiry
      if (Date.now() - timestamp > this.tokenExpiry) {
        secureLog.warn('CSRF validation failed: Token expired');
        this.activeSessions.delete(sessionId);
        return false;
      }
      
      // Verify signature
      const expectedSignature = this.createSignature(tokenData, timestamp, sessionId);
      if (signature !== expectedSignature) {
        secureLog.warn('CSRF validation failed: Invalid signature');
        return false;
      }
      
      // Check if token exists in active sessions
      const storedToken = this.activeSessions.get(sessionId);
      if (!storedToken || storedToken.token !== token) {
        secureLog.warn('CSRF validation failed: Token not found in active sessions');
        return false;
      }
      
      secureLog.debug(`CSRF token validated for session: ${sessionId.substring(0, 8)}...`);
      return true;
      
    } catch (error) {
      secureLog.error('CSRF validation error:', error);
      return false;
    }
  }

  refreshToken(sessionId: string): string {
    // Remove old token
    this.activeSessions.delete(sessionId);
    
    // Generate new token
    return this.generateToken(sessionId);
  }

  private createSignature(tokenData: string, timestamp: number, sessionId: string): string {
    const payload = `${tokenData}.${timestamp}.${sessionId}`;
    return createHmac('sha256', this.secret)
      .update(payload)
      .digest('hex');
  }

  private generateSecret(): string {
    const secret = randomBytes(32).toString('hex');
    secureLog.warn('No CSRF_SECRET provided, generated random secret. Use Replit Secrets for consistency.');
    return secret;
  }

  private cleanExpiredTokens(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [sessionId, tokenData] of this.activeSessions.entries()) {
      if (now - tokenData.timestamp > this.tokenExpiry) {
        this.activeSessions.delete(sessionId);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      secureLog.debug(`Cleaned ${cleaned} expired CSRF tokens`);
    }
  }

  getStats() {
    return {
      activeTokens: this.activeSessions.size,
      tokenExpiry: this.tokenExpiry,
      secretConfigured: !!process.env.CSRF_SECRET
    };
  }
}

// Middleware for CSRF protection
export function createCSRFMiddleware(csrfService: CSRFService) {
  return {
    // Generate and attach CSRF token to requests (only when needed)
    generateToken: (req: Request & { session?: any }, res: Response, next: NextFunction) => {
      // Only generate token for specific endpoints that need it
      const needsCSRF = ['/api/generate-names', '/api/stash/', '/api/generate-bio', '/api/generate-lyric-starter'].some(path => 
        req.path.startsWith(path)
      );
      
      if (needsCSRF) {
        const sessionId = req.session?.id || req.sessionID || 'anonymous';
        const token = csrfService.generateToken(sessionId);
        
        // Attach token to request for use in templates
        (req as any).csrfToken = token;
        
        // Set token in response header for client access
        res.setHeader('X-CSRF-Token', token);
      }
      
      next();
    },

    // Validate CSRF token on state-changing requests
    validateToken: (req: Request & { session?: any }, res: Response, next: NextFunction) => {
      // Skip validation for GET, HEAD, OPTIONS
      if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
      }

      const sessionId = req.session?.id || req.sessionID || 'anonymous';
      const token = req.headers['x-csrf-token'] as string ||
                   req.body._csrf ||
                   req.query._csrf as string;

      // Strict validation for all environments
      if (!csrfService.validateToken(token, sessionId)) {
        secureLog.warn(`CSRF validation failed from ${req.ip}`, {
          method: req.method,
          url: req.url,
          userAgent: req.headers['user-agent'],
          sessionId: sessionId.substring(0, 8),
          hasToken: !!token
        });

        return res.status(403).json({
          error: 'Invalid CSRF token',
          code: 'CSRF_VALIDATION_FAILED'
        });
      }

      next();
    }
  };
}

export const csrfService = new CSRFService();
