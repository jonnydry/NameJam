/**
 * Request Deduplication Middleware
 * Prevents duplicate concurrent requests by sharing results
 */

import type { Request, Response, NextFunction } from "express";
import { createHash } from "crypto";
import { secureLog } from "../../utils/secureLogger";

interface PendingRequest {
  promise: Promise<any>;
  timestamp: number;
}

interface CachedResult {
  data: any;
  timestamp: number;
  ttl: number;
}

class RequestDeduplicationService {
  private pendingRequests = new Map<string, PendingRequest>();
  private resultCache = new Map<string, CachedResult>();
  private readonly DEDUP_WINDOW_MS = 500; // 500ms window for deduplication
  private readonly CACHE_TTL_MS = 2000; // 2 seconds cache for results

  private generateRequestHash(req: Request): string {
    const keyData = {
      method: req.method,
      path: req.path,
      body: req.body,
      query: req.query
    };
    
    const keyString = JSON.stringify(keyData, Object.keys(keyData).sort());
    return createHash('md5').update(keyString).digest('hex');
  }

  private isExpired(timestamp: number, ttl: number): boolean {
    return Date.now() - timestamp > ttl;
  }

  private cleanupExpired(): void {
    const now = Date.now();
    
    // Clean up expired pending requests
    for (const [key, pending] of this.pendingRequests.entries()) {
      if (now - pending.timestamp > this.DEDUP_WINDOW_MS) {
        this.pendingRequests.delete(key);
      }
    }
    
    // Clean up expired cached results
    for (const [key, cached] of this.resultCache.entries()) {
      if (this.isExpired(cached.timestamp, cached.ttl)) {
        this.resultCache.delete(key);
      }
    }
  }

  async deduplicateRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Only deduplicate POST requests to generation endpoints
    if (req.method !== 'POST' || !req.path.includes('/api/generate-names')) {
      return next();
    }

    const requestHash = this.generateRequestHash(req);
    const now = Date.now();

    // Clean up expired entries periodically
    if (Math.random() < 0.1) { // 10% chance to cleanup
      this.cleanupExpired();
    }

    // Check if we have a cached result
    const cached = this.resultCache.get(requestHash);
    if (cached && !this.isExpired(cached.timestamp, cached.ttl)) {
      secureLog.debug(`Cache hit for request: ${requestHash.substring(0, 8)}...`);
      return res.json(cached.data);
    }

    // Check if there's already a pending request for this exact request
    const pending = this.pendingRequests.get(requestHash);
    if (pending && !this.isExpired(pending.timestamp, this.DEDUP_WINDOW_MS)) {
      secureLog.debug(`Deduplicating request: ${requestHash.substring(0, 8)}... (waiting for pending)`);
      
      try {
        const result = await pending.promise;
        
        // Cache the result for future identical requests
        this.resultCache.set(requestHash, {
          data: result,
          timestamp: now,
          ttl: this.CACHE_TTL_MS
        });
        
        return res.json(result);
      } catch (error) {
        // If the pending request failed, let this one proceed
        this.pendingRequests.delete(requestHash);
        secureLog.debug(`Pending request failed, proceeding with new request: ${requestHash.substring(0, 8)}...`);
      }
    }

    // This is a new request - wrap the response to cache the result
    const originalJson = res.json.bind(res);
    let responseData: any = null;

    res.json = function(data: any) {
      responseData = data;
      
      // Cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        this.resultCache.set(requestHash, {
          data: responseData,
          timestamp: Date.now(),
          ttl: this.CACHE_TTL_MS
        });
      }
      
      return originalJson(data);
    }.bind(this);

    // Create a promise that resolves when the response is sent
    const responsePromise = new Promise<any>((resolve, reject) => {
      const originalEnd = res.end.bind(res);
      res.end = function(chunk?: any, encoding?: any) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(responseData);
        } else {
          reject(new Error(`Request failed with status ${res.statusCode}`));
        }
        return originalEnd(chunk, encoding);
      };
    });

    // Store the pending request
    this.pendingRequests.set(requestHash, {
      promise: responsePromise,
      timestamp: now
    });

    // Clean up pending request after completion
    responsePromise.finally(() => {
      this.pendingRequests.delete(requestHash);
    });

    next();
  }

  getStats() {
    return {
      pendingRequests: this.pendingRequests.size,
      cachedResults: this.resultCache.size,
      dedupWindowMs: this.DEDUP_WINDOW_MS,
      cacheTtlMs: this.CACHE_TTL_MS
    };
  }
}

export const requestDeduplicationService = new RequestDeduplicationService();

export const requestDeduplicationMiddleware = requestDeduplicationService.deduplicateRequest.bind(requestDeduplicationService);
