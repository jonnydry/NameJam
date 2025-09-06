import { secureLog } from './secureLogger';

/**
 * Circuit Breaker States
 */
enum CircuitState {
  CLOSED = 'CLOSED',   // Normal operation
  OPEN = 'OPEN',       // Failures exceeded threshold, blocking calls
  HALF_OPEN = 'HALF_OPEN' // Testing if service recovered
}

/**
 * Circuit Breaker Options
 */
interface CircuitBreakerOptions {
  failureThreshold: number;     // Number of failures before opening
  recoveryTimeout: number;       // Time in ms before trying half-open
  successThreshold: number;      // Successful calls needed to close from half-open
  monitoringPeriod: number;      // Time window for counting failures (ms)
  fallbackFunction?: () => any; // Optional fallback when circuit is open
}

/**
 * Circuit Breaker Implementation
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: number = 0;
  private nextAttempt: number = 0;
  private readonly name: string;
  private readonly options: CircuitBreakerOptions;
  private failureTimestamps: number[] = [];

  constructor(name: string, options: Partial<CircuitBreakerOptions> = {}) {
    this.name = name;
    this.options = {
      failureThreshold: options.failureThreshold || 5,
      recoveryTimeout: options.recoveryTimeout || 60000, // 1 minute
      successThreshold: options.successThreshold || 3,
      monitoringPeriod: options.monitoringPeriod || 60000, // 1 minute
      fallbackFunction: options.fallbackFunction
    };
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if we should attempt recovery
    if (this.state === CircuitState.OPEN) {
      if (Date.now() >= this.nextAttempt) {
        this.state = CircuitState.HALF_OPEN;
        secureLog.info(`Circuit breaker ${this.name} entering HALF_OPEN state`);
      } else {
        // Circuit is open and not ready for retry
        if (this.options.fallbackFunction) {
          secureLog.debug(`Circuit breaker ${this.name} is OPEN, using fallback`);
          return this.options.fallbackFunction();
        }
        throw new Error(`Circuit breaker ${this.name} is OPEN`);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Record a successful call
   */
  private onSuccess(): void {
    this.failureCount = 0;
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      
      if (this.successCount >= this.options.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.successCount = 0;
        this.failureTimestamps = [];
        secureLog.info(`Circuit breaker ${this.name} is now CLOSED (recovered)`);
      }
    } else {
      // Reset failure timestamps on success in CLOSED state
      this.failureTimestamps = this.failureTimestamps.filter(
        timestamp => Date.now() - timestamp < this.options.monitoringPeriod
      );
    }
  }

  /**
   * Record a failed call
   */
  private onFailure(): void {
    const now = Date.now();
    this.lastFailureTime = now;
    this.failureTimestamps.push(now);
    
    // Remove old failure timestamps outside monitoring period
    this.failureTimestamps = this.failureTimestamps.filter(
      timestamp => now - timestamp < this.options.monitoringPeriod
    );
    
    if (this.state === CircuitState.HALF_OPEN) {
      // Failure in half-open state immediately opens the circuit
      this.openCircuit();
    } else if (this.state === CircuitState.CLOSED) {
      // Check if failures exceed threshold within monitoring period
      if (this.failureTimestamps.length >= this.options.failureThreshold) {
        this.openCircuit();
      }
    }
  }

  /**
   * Open the circuit breaker
   */
  private openCircuit(): void {
    this.state = CircuitState.OPEN;
    this.nextAttempt = Date.now() + this.options.recoveryTimeout;
    this.successCount = 0;
    
    secureLog.warn(`Circuit breaker ${this.name} is now OPEN due to ${this.failureTimestamps.length} failures`);
  }

  /**
   * Get circuit breaker status
   */
  getStatus(): {
    state: CircuitState;
    failureCount: number;
    successCount: number;
    nextAttempt?: Date;
  } {
    return {
      state: this.state,
      failureCount: this.failureTimestamps.length,
      successCount: this.successCount,
      nextAttempt: this.state === CircuitState.OPEN 
        ? new Date(this.nextAttempt) 
        : undefined
    };
  }

  /**
   * Manually reset the circuit breaker
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.failureTimestamps = [];
    this.lastFailureTime = 0;
    this.nextAttempt = 0;
    
    secureLog.info(`Circuit breaker ${this.name} has been manually reset`);
  }

  /**
   * Check if circuit is currently blocking calls
   */
  isOpen(): boolean {
    return this.state === CircuitState.OPEN && Date.now() < this.nextAttempt;
  }

  /**
   * Check if circuit is testing recovery
   */
  isHalfOpen(): boolean {
    return this.state === CircuitState.HALF_OPEN;
  }

  /**
   * Check if circuit is operating normally
   */
  isClosed(): boolean {
    return this.state === CircuitState.CLOSED;
  }
}

/**
 * Circuit Breaker Registry for managing multiple breakers
 */
export class CircuitBreakerRegistry {
  private static breakers: Map<string, CircuitBreaker> = new Map();

  /**
   * Get or create a circuit breaker
   */
  static getBreaker(name: string, options?: Partial<CircuitBreakerOptions>): CircuitBreaker {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker(name, options));
    }
    return this.breakers.get(name)!;
  }

  /**
   * Get status of all circuit breakers
   */
  static getAllStatus(): Record<string, any> {
    const status: Record<string, any> = {};
    
    this.breakers.forEach((breaker, name) => {
      status[name] = breaker.getStatus();
    });
    
    return status;
  }

  /**
   * Reset all circuit breakers
   */
  static resetAll(): void {
    this.breakers.forEach(breaker => breaker.reset());
    secureLog.info('All circuit breakers have been reset');
  }

  /**
   * Remove a circuit breaker
   */
  static removeBreaker(name: string): void {
    this.breakers.delete(name);
  }
}

// Pre-configured circuit breakers for lyric services
export const lyricCircuitBreakers = {
  datamuse: CircuitBreakerRegistry.getBreaker('datamuse', {
    failureThreshold: 3,
    recoveryTimeout: 30000, // 30 seconds
    successThreshold: 2
  }),
  
  spotify: CircuitBreakerRegistry.getBreaker('spotify', {
    failureThreshold: 3,
    recoveryTimeout: 45000, // 45 seconds
    successThreshold: 2
  }),
  
  lastfm: CircuitBreakerRegistry.getBreaker('lastfm', {
    failureThreshold: 3,
    recoveryTimeout: 30000, // 30 seconds
    successThreshold: 2
  }),
  
  conceptnet: CircuitBreakerRegistry.getBreaker('conceptnet', {
    failureThreshold: 3,
    recoveryTimeout: 30000, // 30 seconds
    successThreshold: 2
  }),
  
  poetry: CircuitBreakerRegistry.getBreaker('poetry', {
    failureThreshold: 3,
    recoveryTimeout: 30000, // 30 seconds
    successThreshold: 2
  }),
  
  openai: CircuitBreakerRegistry.getBreaker('openai', {
    failureThreshold: 5,
    recoveryTimeout: 60000, // 1 minute
    successThreshold: 3
  })
};