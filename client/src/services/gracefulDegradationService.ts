import { ServiceStatus, ServiceHealth, DegradationConfig, ErrorSeverity } from '@shared/errorSchemas';
import { errorTrackingService } from './errorTrackingService';

class GracefulDegradationService {
  private serviceHealthMap = new Map<string, ServiceHealth>();
  private degradationConfigs = new Map<string, DegradationConfig>();
  private fallbackStates = new Map<string, any>();
  
  constructor() {
    this.initializeConfigs();
    this.startHealthMonitoring();
  }
  
  private initializeConfigs(): void {
    // Configure degradation for critical services
    const configs: DegradationConfig[] = [
      {
        service: 'name-generation',
        fallbackEnabled: true,
        fallbackMessage: 'Using simplified name generation (some features temporarily unavailable)',
        retryAttempts: 3,
        retryDelay: 1000,
        timeoutMs: 10000
      },
      {
        service: 'name-verification',
        fallbackEnabled: true,
        fallbackMessage: 'Name verification temporarily unavailable',
        retryAttempts: 2,
        retryDelay: 2000,
        timeoutMs: 8000
      },
      {
        service: 'context-loading',
        fallbackEnabled: true,
        fallbackMessage: 'Using basic generation (enhanced context unavailable)',
        retryAttempts: 2,
        retryDelay: 1500,
        timeoutMs: 5000
      }
    ];
    
    configs.forEach(config => {
      this.degradationConfigs.set(config.service, config);
    });
  }
  
  // Execute operation with graceful degradation
  async executeWithDegradation<T>(
    serviceName: string,
    operation: () => Promise<T>,
    fallbackOperation?: () => Promise<T>
  ): Promise<{ data: T | null; degraded: boolean; message?: string }> {
    const config = this.degradationConfigs.get(serviceName);
    
    if (!config) {
      throw new Error(`No degradation config found for service: ${serviceName}`);
    }
    
    let lastError: Error | null = null;
    
    // Try main operation with retries
    for (let attempt = 1; attempt <= config.retryAttempts; attempt++) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Operation timeout')), config.timeoutMs);
        });
        
        const data = await Promise.race([operation(), timeoutPromise]);
        
        // Operation succeeded
        this.updateServiceHealth(serviceName, ServiceStatus.AVAILABLE);
        return { data, degraded: false };
        
      } catch (error) {
        lastError = error as Error;
        errorTrackingService.trackError(
          lastError,
          { service: serviceName, attempt, totalAttempts: config.retryAttempts },
          attempt === config.retryAttempts ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM
        );
        
        // Wait before retry (except on last attempt)
        if (attempt < config.retryAttempts) {
          await this.delay(config.retryDelay * attempt); // Exponential backoff
        }
      }
    }
    
    // Main operation failed, try fallback
    this.updateServiceHealth(serviceName, ServiceStatus.DEGRADED);
    
    if (config.fallbackEnabled && fallbackOperation) {
      try {
        const fallbackData = await fallbackOperation();
        return { 
          data: fallbackData, 
          degraded: true, 
          message: config.fallbackMessage 
        };
      } catch (fallbackError) {
        errorTrackingService.trackError(
          fallbackError as Error,
          { service: serviceName, type: 'fallback_failed' },
          ErrorSeverity.HIGH
        );
      }
    }
    
    // Both main and fallback failed
    this.updateServiceHealth(serviceName, ServiceStatus.UNAVAILABLE);
    return { 
      data: null, 
      degraded: true, 
      message: `${serviceName} is temporarily unavailable. Please try again later.` 
    };
  }
  
  // Check if service is degraded
  isServiceDegraded(serviceName: string): boolean {
    const health = this.serviceHealthMap.get(serviceName);
    return health?.status === ServiceStatus.DEGRADED;
  }
  
  // Get service status
  getServiceStatus(serviceName: string): ServiceStatus {
    const health = this.serviceHealthMap.get(serviceName);
    return health?.status || ServiceStatus.AVAILABLE;
  }
  
  // Get all service health statuses
  getAllServiceHealth(): ServiceHealth[] {
    return Array.from(this.serviceHealthMap.values());
  }
  
  // Update service health
  private updateServiceHealth(serviceName: string, status: ServiceStatus): void {
    const existing = this.serviceHealthMap.get(serviceName);
    const health: ServiceHealth = {
      service: serviceName,
      status,
      lastCheck: new Date().toISOString(),
      responseTime: existing?.responseTime,
      errorRate: existing?.errorRate
    };
    
    this.serviceHealthMap.set(serviceName, health);
  }
  
  // Store fallback state
  setFallbackState(key: string, state: any): void {
    this.fallbackStates.set(key, state);
  }
  
  // Get fallback state
  getFallbackState(key: string): any {
    return this.fallbackStates.get(key);
  }
  
  // Clear fallback state
  clearFallbackState(key: string): void {
    this.fallbackStates.delete(key);
  }
  
  // Start monitoring service health
  private startHealthMonitoring(): void {
    // Check service health every 2 minutes
    setInterval(() => {
      this.performHealthCheck();
    }, 120000);
  }
  
  private async performHealthCheck(): Promise<void> {
    try {
      const response = await fetch('/api/health', {
        credentials: 'include'
      });
      
      if (response.ok) {
        // Update health for core services
        this.updateServiceHealth('api', ServiceStatus.AVAILABLE);
      } else {
        this.updateServiceHealth('api', ServiceStatus.DEGRADED);
      }
    } catch (error) {
      this.updateServiceHealth('api', ServiceStatus.UNAVAILABLE);
      errorTrackingService.trackError(
        error as Error,
        { type: 'health_check_failed' },
        ErrorSeverity.MEDIUM
      );
    }
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Get degradation status for UI
  getDegradationStatus(): {
    isDegraded: boolean;
    degradedServices: string[];
    message?: string;
  } {
    const degradedServices = Array.from(this.serviceHealthMap.entries())
      .filter(([_, health]) => health.status !== ServiceStatus.AVAILABLE)
      .map(([serviceName]) => serviceName);
    
    const isDegraded = degradedServices.length > 0;
    
    let message;
    if (isDegraded) {
      message = `Some features are running in limited mode. ${degradedServices.join(', ')} ${degradedServices.length === 1 ? 'is' : 'are'} temporarily affected.`;
    }
    
    return {
      isDegraded,
      degradedServices,
      message
    };
  }
}

export const gracefulDegradationService = new GracefulDegradationService();