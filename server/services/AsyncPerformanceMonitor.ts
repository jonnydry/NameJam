/**
 * Async Performance Monitor
 * Enhanced performance monitoring with async metric batching and event-driven architecture
 */

import { EventEmitter } from "events";
import { secureLog } from "../utils/secureLogger";
import { config } from "../config";

interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
  success: boolean;
  error?: string;
}

interface AggregatedStats {
  operation: string;
  count: number;
  successCount: number;
  errorCount: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  totalDuration: number;
  lastUpdated: number;
  p50: number;
  p95: number;
  p99: number;
}

interface BatchMetrics {
  metrics: PerformanceMetric[];
  timestamp: number;
  batchId: string;
}

export class AsyncPerformanceMonitor extends EventEmitter {
  private metrics: PerformanceMetric[] = [];
  private aggregatedStats = new Map<string, AggregatedStats>();
  private activeOperations = new Map<string, { startTime: number; metadata?: any }>();
  private batchQueue: PerformanceMetric[] = [];
  private processing = false;
  private readonly maxMetricsHistory = 10000;
  private readonly batchSize = 100;
  private readonly batchInterval = 5000; // 5 seconds
  private readonly cleanupInterval = 60 * 60 * 1000; // 1 hour

  constructor() {
    super();
    this.startBatchProcessing();
    this.startCleanup();
    this.startMetricsExport();
  }

  private startBatchProcessing(): void {
    setInterval(() => {
      this.processBatch();
    }, this.batchInterval);
  }

  private startCleanup(): void {
    setInterval(() => {
      this.cleanOldMetrics();
    }, this.cleanupInterval);
  }

  private startMetricsExport(): void {
    if (config.monitoring.enableMetrics) {
      setInterval(() => {
        this.exportMetrics();
      }, config.monitoring.metricsInterval);
    }
  }

  private async processBatch(): Promise<void> {
    if (this.batchQueue.length === 0 || this.processing) {
      return;
    }

    this.processing = true;
    const batch = this.batchQueue.splice(0, this.batchSize);
    
    try {
      // Process metrics in batch
      for (const metric of batch) {
        this.addMetric(metric);
      }

      // Emit batch processed event
      this.emit('batchProcessed', {
        batchId: `batch_${Date.now()}`,
        count: batch.length,
        timestamp: Date.now()
      });

      // Log performance summary if batch is large enough
      if (batch.length >= this.batchSize) {
        this.logPerformanceSummary();
      }
    } catch (error) {
      secureLog.error('Batch processing error:', error);
    } finally {
      this.processing = false;
    }
  }

  private addMetric(metric: PerformanceMetric): void {
    // Add to metrics array
    this.metrics.push(metric);
    
    // Update aggregated stats
    this.updateAggregatedStats(metric);
    
    // Emit metric event
    this.emit('metric', metric);
  }

  private updateAggregatedStats(metric: PerformanceMetric): void {
    const existing = this.aggregatedStats.get(metric.operation);
    
    if (!existing) {
      this.aggregatedStats.set(metric.operation, {
        operation: metric.operation,
        count: 1,
        successCount: metric.success ? 1 : 0,
        errorCount: metric.success ? 0 : 1,
        avgDuration: metric.duration,
        minDuration: metric.duration,
        maxDuration: metric.duration,
        totalDuration: metric.duration,
        lastUpdated: Date.now(),
        p50: metric.duration,
        p95: metric.duration,
        p99: metric.duration
      });
    } else {
      existing.count++;
      if (metric.success) {
        existing.successCount++;
      } else {
        existing.errorCount++;
      }
      
      existing.totalDuration += metric.duration;
      existing.avgDuration = existing.totalDuration / existing.count;
      existing.minDuration = Math.min(existing.minDuration, metric.duration);
      existing.maxDuration = Math.max(existing.maxDuration, metric.duration);
      existing.lastUpdated = Date.now();
      
      // Update percentiles (simplified calculation)
      this.updatePercentiles(existing, metric.duration);
    }
  }

  private updatePercentiles(stats: AggregatedStats, duration: number): void {
    // Simplified percentile calculation
    // In production, you'd want to use a proper percentile calculation library
    if (duration <= stats.p50) {
      stats.p50 = duration;
    }
    if (duration >= stats.p95) {
      stats.p95 = duration;
    }
    if (duration >= stats.p99) {
      stats.p99 = duration;
    }
  }

  startOperation(operationId: string, operationName: string, metadata?: any): void {
    this.activeOperations.set(operationId, {
      startTime: Date.now(),
      metadata: { operation: operationName, ...metadata }
    });
  }

  endOperation(operationId: string, success: boolean = true, error?: string): void {
    const operation = this.activeOperations.get(operationId);
    
    if (!operation) {
      secureLog.warn(`Operation ${operationId} not found in active operations`);
      return;
    }

    const duration = Date.now() - operation.startTime;
    const metric: PerformanceMetric = {
      operation: operation.metadata?.operation || 'unknown',
      duration,
      timestamp: Date.now(),
      metadata: operation.metadata,
      success,
      error
    };

    // Add to batch queue for async processing
    this.batchQueue.push(metric);
    
    // Remove from active operations
    this.activeOperations.delete(operationId);
    
    // Emit operation completed event
    this.emit('operationCompleted', {
      operationId,
      operation: metric.operation,
      duration,
      success,
      error
    });
  }

  recordMetric(operation: string, duration: number, metadata?: any, success: boolean = true, error?: string): void {
    const metric: PerformanceMetric = {
      operation,
      duration,
      timestamp: Date.now(),
      metadata,
      success,
      error
    };

    this.batchQueue.push(metric);
  }

  private cleanOldMetrics(): void {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
    const initialCount = this.metrics.length;
    
    this.metrics = this.metrics.filter(metric => metric.timestamp > cutoff);
    
    const removed = initialCount - this.metrics.length;
    if (removed > 0) {
      secureLog.debug(`Cleaned up ${removed} old metrics`);
    }
  }

  private logPerformanceSummary(): void {
    const summary = this.generateReport();
    secureLog.info('Performance Summary:', {
      totalOperations: summary.totalOperations,
      averageResponseTime: summary.averageResponseTime,
      topOperations: summary.topOperations.slice(0, 5),
      errorRate: summary.errorRate,
      cacheHitRate: summary.cacheHitRate
    });
  }

  private async exportMetrics(): Promise<void> {
    try {
      const report = this.generateReport();
      
      // Emit metrics for external monitoring systems
      this.emit('metricsExport', {
        timestamp: Date.now(),
        report,
        environment: process.env.NODE_ENV || 'development'
      });
      
      // In production, you might want to send this to monitoring services
      // like DataDog, New Relic, or Prometheus
      
    } catch (error) {
      secureLog.error('Metrics export failed:', error);
    }
  }

  generateReport() {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    
    // Filter recent metrics
    const recentMetrics = this.metrics.filter(m => m.timestamp > oneHourAgo);
    
    // Calculate totals
    const totalOperations = recentMetrics.length;
    const successfulOperations = recentMetrics.filter(m => m.success).length;
    const errorRate = totalOperations > 0 ? (totalOperations - successfulOperations) / totalOperations : 0;
    
    // Calculate average response time
    const totalDuration = recentMetrics.reduce((sum, m) => sum + m.duration, 0);
    const averageResponseTime = totalOperations > 0 ? totalDuration / totalOperations : 0;
    
    // Get top operations by count
    const operationCounts = new Map<string, number>();
    recentMetrics.forEach(m => {
      operationCounts.set(m.operation, (operationCounts.get(m.operation) || 0) + 1);
    });
    
    const topOperations = Array.from(operationCounts.entries())
      .map(([operation, count]) => ({ operation, count }))
      .sort((a, b) => b.count - a.count);
    
    // Calculate cache hit rate (if available in metadata)
    const cacheMetrics = recentMetrics.filter(m => m.metadata?.cacheHit !== undefined);
    const cacheHits = cacheMetrics.filter(m => m.metadata?.cacheHit).length;
    const cacheHitRate = cacheMetrics.length > 0 ? cacheHits / cacheMetrics.length : 0;
    
    return {
      timestamp: now,
      totalOperations,
      successfulOperations,
      errorRate: Math.round(errorRate * 100) / 100,
      averageResponseTime: Math.round(averageResponseTime),
      topOperations,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      activeOperations: this.activeOperations.size,
      queuedMetrics: this.batchQueue.length,
      aggregatedStats: Array.from(this.aggregatedStats.values())
    };
  }

  getActiveOperations(): Map<string, any> {
    return new Map(this.activeOperations);
  }

  getQueueStats() {
    return {
      queueLength: this.batchQueue.length,
      processing: this.processing,
      batchSize: this.batchSize,
      batchInterval: this.batchInterval
    };
  }

  // Health check endpoint data
  getHealthData() {
    const report = this.generateReport();
    return {
      status: 'healthy',
      timestamp: Date.now(),
      metrics: {
        totalOperations: report.totalOperations,
        errorRate: report.errorRate,
        averageResponseTime: report.averageResponseTime,
        activeOperations: report.activeOperations
      },
      system: {
        queuedMetrics: report.queuedMetrics,
        processing: this.processing,
        memoryUsage: process.memoryUsage()
      }
    };
  }

  // Graceful shutdown
  async shutdown(): Promise<void> {
    secureLog.info('Shutting down async performance monitor...');
    
    // Process remaining metrics
    if (this.batchQueue.length > 0) {
      await this.processBatch();
    }
    
    // Emit shutdown event
    this.emit('shutdown');
    
    secureLog.info('Async performance monitor shutdown complete');
  }
}

// Singleton instance
export const asyncPerformanceMonitor = new AsyncPerformanceMonitor();
