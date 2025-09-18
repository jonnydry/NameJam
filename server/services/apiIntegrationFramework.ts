/**
 * Unified API Integration Framework for NameJam
 * 
 * This framework provides:
 * - Centralized API management and health monitoring
 * - Quality scoring for API responses
 * - Intelligent routing and load balancing
 * - Comprehensive error handling and recovery
 * - Performance optimization and metrics
 */

import { secureLog } from '../utils/secureLogger';
import { performanceMonitor } from './performanceMonitor';
import { CircuitBreakerRegistry } from '../utils/circuitBreaker';
import { withApiRetry } from '../utils/apiRetry';

export interface APIServiceConfig {
  name: string;
  baseUrl: string;
  timeout: number;
  rateLimit: {
    requests: number;
    windowMs: number;
  };
  circuitBreaker: {
    failureThreshold: number;
    recoveryTimeout: number;
    successThreshold: number;
  };
  priority: number; // Lower number = higher priority
  healthCheck: () => Promise<boolean>;
  qualityThreshold: number; // Minimum quality score (0-100)
}

export interface APIRequest {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  params?: Record<string, any>;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
}

export interface APIResponse<T = any> {
  data: T;
  metadata: {
    source: string;
    requestId: string;
    timestamp: number;
    duration: number;
    qualityScore: number;
    cacheHit: boolean;
    fallbackUsed: boolean;
  };
}

export interface HealthStatus {
  service: string;
  status: 'healthy' | 'degraded' | 'offline';
  latency: number;
  successRate: number;
  errorRate: number;
  circuitState: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  lastHealthCheck: number;
}

export class APIIntegrationFramework {
  private services = new Map<string, APIServiceConfig>();
  private healthStatus = new Map<string, HealthStatus>();
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private requestQueue: Array<{ 
    request: APIRequest; 
    resolve: Function; 
    reject: Function; 
    priority: number;
    timestamp: number;
  }> = [];
  private processing = false;
  private metrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    fallbacksUsed: 0,
    cacheHits: 0,
    averageResponseTime: 0
  };

  constructor() {
    // Health monitoring interval
    setInterval(() => this.performHealthChecks(), 30000); // Every 30 seconds
    
    // Process request queue
    setInterval(() => this.processRequestQueue(), 100); // Every 100ms
    
    // Clean expired cache entries
    setInterval(() => this.cleanCache(), 60000); // Every minute
    
    // Report metrics
    setInterval(() => this.reportMetrics(), 300000); // Every 5 minutes
  }

  /**
   * Register an API service with the framework
   */
  registerService(config: APIServiceConfig): void {
    this.services.set(config.name, config);
    
    // Initialize health status
    this.healthStatus.set(config.name, {
      service: config.name,
      status: 'offline',
      latency: 0,
      successRate: 100,
      errorRate: 0,
      circuitState: 'CLOSED',
      lastHealthCheck: 0
    });

    // Register circuit breaker
    CircuitBreakerRegistry.getBreaker(config.name, config.circuitBreaker);
    
    secureLog.info(`✅ Registered API service: ${config.name}`);
  }

  /**
   * Make an API request with full framework support
   */
  async makeRequest<T>(
    serviceName: string, 
    request: APIRequest,
    fallbackServices: string[] = []
  ): Promise<APIResponse<T>> {
    const requestId = this.generateRequestId();
    const operationId = `api-request-${requestId}`;
    
    performanceMonitor.startOperation(operationId, `${serviceName}-${request.endpoint}`, {
      service: serviceName,
      endpoint: request.endpoint,
      fallbacks: fallbackServices
    });

    try {
      this.metrics.totalRequests++;

      // Check cache first
      const cacheKey = this.generateCacheKey(serviceName, request);
      const cached = this.getFromCache(cacheKey);
      
      if (cached) {
        this.metrics.cacheHits++;
        const duration = performanceMonitor.endOperation(operationId) || 0;
        
        return {
          data: cached,
          metadata: {
            source: serviceName,
            requestId,
            timestamp: Date.now(),
            duration,
            qualityScore: 85, // Cached data gets default good score
            cacheHit: true,
            fallbackUsed: false
          }
        };
      }

      // Attempt primary service
      try {
        const result = await this.executeRequest<T>(serviceName, request, requestId);
        const duration = performanceMonitor.endOperation(operationId) || 0;
        
        // Cache successful results
        if (result.data && result.metadata.qualityScore >= 60) {
          this.setCache(cacheKey, result.data, this.getCacheTTL(serviceName));
        }

        this.metrics.successfulRequests++;
        return result;

      } catch (primaryError) {
        secureLog.warn(`Primary service ${serviceName} failed:`, primaryError);
        
        // Try fallback services
        for (const fallbackService of fallbackServices) {
          if (!this.isServiceHealthy(fallbackService)) {
            continue;
          }

          try {
            secureLog.info(`Attempting fallback to ${fallbackService} for ${serviceName}`);
            const result = await this.executeRequest<T>(fallbackService, request, requestId);
            const duration = performanceMonitor.endOperation(operationId) || 0;
            
            result.metadata.fallbackUsed = true;
            this.metrics.fallbacksUsed++;
            this.metrics.successfulRequests++;
            
            return result;

          } catch (fallbackError) {
            secureLog.warn(`Fallback service ${fallbackService} also failed:`, fallbackError);
            continue;
          }
        }

        // All services failed
        this.metrics.failedRequests++;
        const duration = performanceMonitor.endOperation(operationId) || 0;
        throw new Error(`All services failed for request: ${serviceName}${fallbackServices.length ? ` (fallbacks: ${fallbackServices.join(', ')})` : ''}`);
      }

    } catch (error) {
      performanceMonitor.endOperation(operationId);
      throw error;
    }
  }

  /**
   * Execute a request against a specific service
   */
  private async executeRequest<T>(
    serviceName: string, 
    request: APIRequest,
    requestId: string
  ): Promise<APIResponse<T>> {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not registered`);
    }

    const breaker = CircuitBreakerRegistry.getBreaker(serviceName);
    
    return breaker.execute(async () => {
      const startTime = Date.now();
      
      const response = await withApiRetry(async () => {
        const controller = new AbortController();
        const timeout = setTimeout(
          () => controller.abort(), 
          request.timeout || service.timeout
        );

        try {
          const url = new URL(request.endpoint, service.baseUrl);
          
          if (request.params) {
            Object.entries(request.params).forEach(([key, value]) => {
              url.searchParams.append(key, String(value));
            });
          }

          const fetchOptions: RequestInit = {
            method: request.method,
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'NameJam-API-Framework/1.0',
              ...request.headers
            },
            body: request.body ? JSON.stringify(request.body) : undefined,
            signal: controller.signal
          };

          const response = await fetch(url.toString(), fetchOptions);
          clearTimeout(timeout);

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          return data;

        } catch (error) {
          clearTimeout(timeout);
          throw error;
        }
      }, { maxRetries: request.retries || 3 });

      const duration = Date.now() - startTime;
      const qualityScore = await this.calculateQualityScore(response, serviceName);

      // Update service health
      this.updateServiceHealth(serviceName, true, duration);

      return {
        data: response,
        metadata: {
          source: serviceName,
          requestId,
          timestamp: Date.now(),
          duration,
          qualityScore,
          cacheHit: false,
          fallbackUsed: false
        }
      };
    });
  }

  /**
   * Calculate quality score for API response
   */
  private async calculateQualityScore(data: any, serviceName: string): Promise<number> {
    let score = 100;

    // Basic data validation
    if (!data) {
      score -= 50;
    }

    // Check data completeness
    if (typeof data === 'object') {
      const fields = Object.keys(data);
      if (fields.length === 0) {
        score -= 30;
      } else if (fields.length < 3) {
        score -= 15;
      }

      // Check for null/undefined values
      const nullValues = fields.filter(field => 
        data[field] == null || data[field] === ''
      );
      score -= (nullValues.length / fields.length) * 20;
    }

    // Service-specific quality checks
    if (serviceName === 'spotify') {
      if (Array.isArray(data?.artists?.items)) {
        score += data.artists.items.length > 0 ? 10 : -20;
      }
      if (Array.isArray(data?.tracks?.items)) {
        score += data.tracks.items.length > 0 ? 10 : -20;
      }
    } else if (serviceName === 'datamuse') {
      if (Array.isArray(data)) {
        score += data.length > 0 ? 10 : -30;
        score += data.length > 10 ? 5 : 0;
      }
    } else if (serviceName === 'lastfm') {
      if (data?.toptags?.tag || data?.similartags?.tag) {
        score += 10;
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Check if a service is healthy enough to use
   */
  private isServiceHealthy(serviceName: string): boolean {
    const health = this.healthStatus.get(serviceName);
    if (!health) return false;

    return health.status !== 'offline' && 
           health.successRate >= 50 &&
           health.circuitState !== 'OPEN';
  }

  /**
   * Update service health metrics
   */
  private updateServiceHealth(serviceName: string, success: boolean, latency: number): void {
    const health = this.healthStatus.get(serviceName);
    if (!health) return;

    // Update latency (moving average)
    health.latency = health.latency * 0.8 + latency * 0.2;

    // Update success/error rates (over last 100 requests)
    if (success) {
      health.successRate = Math.min(100, health.successRate + 1);
      health.errorRate = Math.max(0, health.errorRate - 1);
      health.status = health.successRate >= 80 ? 'healthy' : 'degraded';
    } else {
      health.successRate = Math.max(0, health.successRate - 2);
      health.errorRate = Math.min(100, health.errorRate + 2);
      health.status = health.successRate < 30 ? 'offline' : 
                     health.successRate < 60 ? 'degraded' : 'healthy';
    }

    // Update circuit breaker state
    const breaker = CircuitBreakerRegistry.getBreaker(serviceName);
    const status = breaker.getStatus();
    health.circuitState = status.state;
  }

  /**
   * Perform health checks on all registered services
   */
  private async performHealthChecks(): Promise<void> {
    const healthCheckPromises = Array.from(this.services.entries()).map(
      async ([name, config]) => {
        try {
          const startTime = Date.now();
          const healthy = await Promise.race([
            config.healthCheck(),
            new Promise<boolean>((_, reject) => 
              setTimeout(() => reject(new Error('Health check timeout')), 5000)
            )
          ]);
          const latency = Date.now() - startTime;
          
          this.updateServiceHealth(name, healthy, latency);
          
        } catch (error) {
          secureLog.debug(`Health check failed for ${name}:`, error);
          this.updateServiceHealth(name, false, 5000);
        }
      }
    );

    await Promise.allSettled(healthCheckPromises);
  }

  /**
   * Get comprehensive health status for all services
   */
  getHealthStatus(): Record<string, HealthStatus> {
    const status: Record<string, HealthStatus> = {};
    
    this.healthStatus.forEach((health, serviceName) => {
      status[serviceName] = { ...health };
    });

    return status;
  }

  /**
   * Get service with best health score for a given capability
   */
  getBestService(capability: string, services: string[]): string | null {
    const healthyServices = services
      .filter(service => this.isServiceHealthy(service))
      .map(service => ({
        name: service,
        health: this.healthStatus.get(service)!,
        config: this.services.get(service)!
      }))
      .sort((a, b) => {
        // Sort by priority first, then by success rate
        const priorityDiff = a.config.priority - b.config.priority;
        if (priorityDiff !== 0) return priorityDiff;
        
        return b.health.successRate - a.health.successRate;
      });

    return healthyServices.length > 0 ? healthyServices[0].name : null;
  }

  /**
   * Cache management
   */
  private generateCacheKey(serviceName: string, request: APIRequest): string {
    const key = `${serviceName}:${request.endpoint}:${JSON.stringify(request.params || {})}`;
    return Buffer.from(key).toString('base64');
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() > cached.timestamp + cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  private setCache(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private getCacheTTL(serviceName: string): number {
    // Service-specific cache TTL
    const ttlMap: Record<string, number> = {
      'spotify': 15 * 60 * 1000,    // 15 minutes
      'lastfm': 30 * 60 * 1000,     // 30 minutes
      'datamuse': 60 * 60 * 1000,   // 1 hour
      'conceptnet': 120 * 60 * 1000, // 2 hours
      'poetry': 240 * 60 * 1000     // 4 hours
    };
    
    return ttlMap[serviceName] || 30 * 60 * 1000; // Default 30 minutes
  }

  private cleanCache(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, cached] of this.cache.entries()) {
      if (now > cached.timestamp + cached.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      secureLog.debug(`Cleaned ${cleaned} expired cache entries`);
    }
  }

  /**
   * Request queue management
   */
  private async processRequestQueue(): Promise<void> {
    if (this.processing || this.requestQueue.length === 0) {
      return;
    }

    this.processing = true;
    
    try {
      // Sort by priority and timestamp
      this.requestQueue.sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority - b.priority; // Lower priority number = higher priority
        }
        return a.timestamp - b.timestamp; // Earlier timestamp first
      });

      // Process up to 5 requests in parallel
      const batch = this.requestQueue.splice(0, 5);
      
      await Promise.allSettled(batch.map(async (item) => {
        try {
          // Process the request (implementation would depend on request type)
          // This is a simplified version
          item.resolve({ processed: true });
        } catch (error) {
          item.reject(error);
        }
      }));

    } finally {
      this.processing = false;
    }
  }

  /**
   * Report metrics and statistics
   */
  private reportMetrics(): void {
    const uptime = process.uptime();
    const avgResponseTime = this.metrics.totalRequests > 0 
      ? this.metrics.averageResponseTime / this.metrics.totalRequests 
      : 0;

    const metrics = {
      framework: {
        uptime: Math.round(uptime),
        totalRequests: this.metrics.totalRequests,
        successRate: this.metrics.totalRequests > 0 
          ? Math.round((this.metrics.successfulRequests / this.metrics.totalRequests) * 100)
          : 0,
        fallbackRate: this.metrics.totalRequests > 0
          ? Math.round((this.metrics.fallbacksUsed / this.metrics.totalRequests) * 100)
          : 0,
        cacheHitRate: this.metrics.totalRequests > 0
          ? Math.round((this.metrics.cacheHits / this.metrics.totalRequests) * 100)
          : 0,
        averageResponseTime: Math.round(avgResponseTime)
      },
      services: this.getHealthStatus(),
      cache: {
        size: this.cache.size,
        memoryUsage: this.estimateCacheMemory()
      }
    };

    secureLog.info('🚀 API Framework Metrics:', metrics);
  }

  private estimateCacheMemory(): string {
    const sizeInBytes = JSON.stringify(Array.from(this.cache.values())).length;
    const sizeInMB = sizeInBytes / (1024 * 1024);
    return `${sizeInMB.toFixed(2)} MB`;
  }

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get framework statistics
   */
  getStatistics() {
    return {
      metrics: { ...this.metrics },
      services: this.getHealthStatus(),
      cache: {
        size: this.cache.size,
        hitRate: this.metrics.totalRequests > 0 
          ? (this.metrics.cacheHits / this.metrics.totalRequests) * 100 
          : 0
      },
      queueSize: this.requestQueue.length
    };
  }
}

// Export singleton instance
export const apiFramework = new APIIntegrationFramework();