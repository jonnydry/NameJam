import { ClientError, ErrorSeverity, ErrorHandler } from '@shared/errorSchemas';

class ErrorTrackingService {
  private errorQueue: ClientError[] = [];
  private isOnline = navigator.onLine;
  private batchSize = 10;
  private flushInterval = 30000; // 30 seconds
  
  constructor() {
    this.initializeOnlineStatusTracking();
    this.startPeriodicFlush();
    this.setupGlobalErrorHandlers();
  }
  
  // Track client-side errors
  trackError(
    error: Error, 
    context?: Record<string, any>, 
    severity?: ErrorSeverity
  ): void {
    const clientError = ErrorHandler.createClientError(
      error.message,
      severity || ErrorHandler.getErrorSeverity(error),
      context,
      error.stack
    );
    
    this.addToQueue(clientError);
    
    // For critical errors, send immediately
    if (clientError.severity === ErrorSeverity.CRITICAL) {
      this.flushErrors();
    }
  }
  
  // Track custom events (e.g., API failures, user actions)
  trackEvent(
    message: string, 
    severity: ErrorSeverity = ErrorSeverity.LOW,
    context?: Record<string, any>
  ): void {
    const clientError = ErrorHandler.createClientError(
      message,
      severity,
      context
    );
    
    this.addToQueue(clientError);
  }
  
  // Track performance issues
  trackPerformance(
    operation: string, 
    duration: number, 
    threshold: number = 5000
  ): void {
    if (duration > threshold) {
      this.trackEvent(
        `Slow operation: ${operation}`,
        ErrorSeverity.MEDIUM,
        { operation, duration, threshold }
      );
    }
  }
  
  private addToQueue(error: ClientError): void {
    this.errorQueue.push(error);
    
    // Prevent queue from growing too large
    if (this.errorQueue.length > 100) {
      this.errorQueue = this.errorQueue.slice(-50); // Keep only recent 50 errors
    }
    
    // Auto-flush if queue is full
    if (this.errorQueue.length >= this.batchSize) {
      this.flushErrors();
    }
  }
  
  private async flushErrors(): Promise<void> {
    if (this.errorQueue.length === 0 || !this.isOnline) {
      return;
    }
    
    const errorsToSend = this.errorQueue.splice(0, this.batchSize);
    
    try {
      await fetch('/api/client-errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ errors: errorsToSend }),
        credentials: 'include'
      });
    } catch (error) {
      // If sending fails, put errors back in queue
      this.errorQueue.unshift(...errorsToSend);
      console.warn('Failed to send error tracking data:', error);
    }
  }
  
  private initializeOnlineStatusTracking(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushErrors(); // Send queued errors when back online
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }
  
  private startPeriodicFlush(): void {
    setInterval(() => {
      this.flushErrors();
    }, this.flushInterval);
  }
  
  private setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(
        new Error(event.reason?.message || 'Unhandled promise rejection'),
        { 
          type: 'unhandledrejection',
          reason: event.reason 
        },
        ErrorSeverity.HIGH
      );
    });
    
    // Handle global JavaScript errors
    window.addEventListener('error', (event) => {
      this.trackError(
        new Error(event.message),
        {
          type: 'global_error',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        },
        ErrorSeverity.HIGH
      );
    });
  }
  
  // Public method to manually flush errors
  flush(): Promise<void> {
    return this.flushErrors();
  }
  
  // Get current queue status for debugging
  getQueueStatus(): { queueLength: number; isOnline: boolean } {
    return {
      queueLength: this.errorQueue.length,
      isOnline: this.isOnline
    };
  }
}

export const errorTrackingService = new ErrorTrackingService();