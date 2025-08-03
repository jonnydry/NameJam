/**
 * Session secret rotation utility for enhanced security
 */

import crypto from 'crypto';
import { secureLog } from './secureLogger';

export class SessionSecretManager {
  private currentSecret: string;
  private previousSecret: string | null = null;
  private rotationInterval: NodeJS.Timeout | null = null;
  private rotationCallbacks: Array<(newSecret: string, oldSecret: string | null) => void> = [];

  constructor(initialSecret?: string) {
    this.currentSecret = initialSecret || this.generateSecret();
    this.startAutoRotation();
  }

  private generateSecret(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  private startAutoRotation(): void {
    // Rotate session secret every 24 hours
    this.rotationInterval = setInterval(() => {
      this.rotate();
    }, 24 * 60 * 60 * 1000);

    secureLog.info('Session secret auto-rotation started (24-hour interval)');
  }

  rotate(): void {
    this.previousSecret = this.currentSecret;
    this.currentSecret = this.generateSecret();
    
    secureLog.info('Session secret rotated successfully');
    
    // Notify all callbacks
    this.rotationCallbacks.forEach(callback => {
      callback(this.currentSecret, this.previousSecret);
    });
  }

  getSecrets(): { current: string; previous: string | null } {
    return {
      current: this.currentSecret,
      previous: this.previousSecret
    };
  }

  onRotation(callback: (newSecret: string, oldSecret: string | null) => void): void {
    this.rotationCallbacks.push(callback);
  }

  stop(): void {
    if (this.rotationInterval) {
      clearInterval(this.rotationInterval);
      this.rotationInterval = null;
    }
  }
}

// Enhanced rate limiting with distributed request protection
export interface DistributedRateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: any) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export class DistributedRateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor(private options: DistributedRateLimitOptions) {
    // Cleanup old entries every minute
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, data] of this.requests.entries()) {
        if (data.resetTime < now) {
          this.requests.delete(key);
        }
      }
    }, 60000);
  }

  private getKey(req: any): string {
    if (this.options.keyGenerator) {
      return this.options.keyGenerator(req);
    }
    
    // Default: combine IP, user agent, and session ID for better distributed protection
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const sessionId = req.session?.id || 'no-session';
    
    return crypto
      .createHash('sha256')
      .update(`${ip}-${userAgent}-${sessionId}`)
      .digest('hex');
  }

  async checkLimit(req: any): Promise<{ allowed: boolean; retryAfter?: number }> {
    const key = this.getKey(req);
    const now = Date.now();
    
    let requestData = this.requests.get(key);
    
    if (!requestData || requestData.resetTime < now) {
      // Create new window
      requestData = {
        count: 1,
        resetTime: now + this.options.windowMs
      };
      this.requests.set(key, requestData);
      return { allowed: true };
    }
    
    if (requestData.count >= this.options.maxRequests) {
      const retryAfter = Math.ceil((requestData.resetTime - now) / 1000);
      return { allowed: false, retryAfter };
    }
    
    requestData.count++;
    return { allowed: true };
  }

  recordResult(req: any, success: boolean): void {
    if ((success && this.options.skipSuccessfulRequests) ||
        (!success && this.options.skipFailedRequests)) {
      const key = this.getKey(req);
      const requestData = this.requests.get(key);
      if (requestData && requestData.count > 0) {
        requestData.count--;
      }
    }
  }

  stop(): void {
    clearInterval(this.cleanupInterval);
  }
}