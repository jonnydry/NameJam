/**
 * Performance Monitor - Track and log performance metrics
 * Provides insights into context loading, API calls, and generation times
 */

import { secureLog } from '../utils/secureLogger';
import { optimizedContextService } from './optimizedContextService';

interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface AggregatedStats {
  operation: string;
  count: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  totalDuration: number;
  lastUpdated: number;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private aggregatedStats = new Map<string, AggregatedStats>();
  private maxMetricsHistory = 1000; // Keep last 1000 metrics
  
  // Track ongoing operations
  private activeOperations = new Map<string, { startTime: number; metadata?: any }>();

  constructor() {
    // Log performance summary every 10 minutes
    setInterval(() => this.logPerformanceSummary(), 10 * 60 * 1000);
    
    // Clean old metrics every hour
    setInterval(() => this.cleanOldMetrics(), 60 * 60 * 1000);
  }

  // Start tracking an operation
  startOperation(operationId: string, operationName: string, metadata?: any): void {
    this.activeOperations.set(operationId, {
      startTime: Date.now(),
      metadata: { operation: operationName, ...metadata }
    });
  }

  // End tracking an operation
  endOperation(operationId: string): number | null {
    const operation = this.activeOperations.get(operationId);
    if (!operation) return null;

    const duration = Date.now() - operation.startTime;
    this.activeOperations.delete(operationId);

    // Record the metric
    this.recordMetric(operation.metadata?.operation || 'unknown', duration, operation.metadata);
    
    return duration;
  }

  // Record a completed metric directly
  recordMetric(operation: string, duration: number, metadata?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      operation,
      duration,
      timestamp: Date.now(),
      metadata
    };

    this.metrics.push(metric);
    this.updateAggregatedStats(metric);

    // Log slow operations immediately
    if (duration > 5000) { // Over 5 seconds
      secureLog.warn(`🐌 Slow operation detected: ${operation} took ${duration}ms`, metadata);
    }

    // Maintain metrics history limit
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }
  }

  // Get performance stats for a specific operation
  getOperationStats(operation: string): AggregatedStats | null {
    return this.aggregatedStats.get(operation) || null;
  }

  // Get all performance stats
  getAllStats(): Record<string, AggregatedStats> {
    const stats: Record<string, AggregatedStats> = {};
    for (const [operation, stat] of this.aggregatedStats.entries()) {
      stats[operation] = { ...stat };
    }
    return stats;
  }

  // Get recent performance trends
  getRecentTrends(operation: string, minutes: number = 30): {
    avgDuration: number;
    count: number;
    trend: 'improving' | 'degrading' | 'stable';
  } {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    const recentMetrics = this.metrics
      .filter(m => m.operation === operation && m.timestamp >= cutoff)
      .sort((a, b) => a.timestamp - b.timestamp);

    if (recentMetrics.length < 2) {
      return { avgDuration: 0, count: 0, trend: 'stable' };
    }

    const avgDuration = recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length;
    
    // Compare first half vs second half to determine trend
    const midpoint = Math.floor(recentMetrics.length / 2);
    const firstHalf = recentMetrics.slice(0, midpoint);
    const secondHalf = recentMetrics.slice(midpoint);
    
    const firstAvg = firstHalf.reduce((sum, m) => sum + m.duration, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, m) => sum + m.duration, 0) / secondHalf.length;
    
    const improvement = ((firstAvg - secondAvg) / firstAvg) * 100;
    
    let trend: 'improving' | 'degrading' | 'stable' = 'stable';
    if (improvement > 10) trend = 'improving';
    else if (improvement < -10) trend = 'degrading';

    return { avgDuration, count: recentMetrics.length, trend };
  }

  // Log comprehensive performance summary
  private logPerformanceSummary(): void {
    const contextStats = optimizedContextService.getStats();
    const allStats = this.getAllStats();

    const summary = {
      timestamp: new Date().toISOString(),
      contextOptimization: {
        cacheHitRate: Math.round(contextStats.cacheHitRate),
        avgLoadTime: Math.round(contextStats.avgLoadTime),
        cacheSize: contextStats.cacheSize,
        parallelCalls: contextStats.parallelCalls
      },
      operationStats: Object.entries(allStats).reduce((acc, [op, stats]) => {
        acc[op] = {
          count: stats.count,
          avgDuration: Math.round(stats.avgDuration),
          minDuration: stats.minDuration,
          maxDuration: stats.maxDuration
        };
        return acc;
      }, {} as Record<string, any>),
      recentTrends: this.getRecentTrendsForAllOperations()
    };

    secureLog.info('📊 Performance Summary:', summary);

    // Identify performance alerts
    this.checkPerformanceAlerts(allStats);
  }

  private getRecentTrendsForAllOperations(): Record<string, any> {
    const trends: Record<string, any> = {};
    
    for (const [operation] of this.aggregatedStats.entries()) {
      const trend = this.getRecentTrends(operation, 30);
      if (trend.count > 0) {
        trends[operation] = {
          avgDuration: Math.round(trend.avgDuration),
          count: trend.count,
          trend: trend.trend
        };
      }
    }
    
    return trends;
  }

  private checkPerformanceAlerts(stats: Record<string, AggregatedStats>): void {
    const alerts = [];

    // Check for operations that are consistently slow
    for (const [operation, stat] of Object.entries(stats)) {
      if (stat.avgDuration > 10000 && stat.count > 5) { // Over 10s average with 5+ samples
        alerts.push(`${operation}: Consistently slow (${Math.round(stat.avgDuration)}ms avg)`);
      }
      
      if (stat.maxDuration > 30000) { // Any operation over 30s
        alerts.push(`${operation}: Peak duration very high (${Math.round(stat.maxDuration)}ms)`);
      }
    }

    // Check context optimization effectiveness
    const contextStats = optimizedContextService.getStats();
    if (contextStats.cacheHitRate < 30 && contextStats.cacheHits + contextStats.cacheMisses > 10) {
      alerts.push(`Context cache hit rate low: ${Math.round(contextStats.cacheHitRate)}%`);
    }

    if (alerts.length > 0) {
      secureLog.warn('⚠️ Performance Alerts:', alerts);
    }
  }

  private updateAggregatedStats(metric: PerformanceMetric): void {
    const existing = this.aggregatedStats.get(metric.operation);
    
    if (!existing) {
      this.aggregatedStats.set(metric.operation, {
        operation: metric.operation,
        count: 1,
        avgDuration: metric.duration,
        minDuration: metric.duration,
        maxDuration: metric.duration,
        totalDuration: metric.duration,
        lastUpdated: metric.timestamp
      });
    } else {
      existing.count++;
      existing.totalDuration += metric.duration;
      existing.avgDuration = existing.totalDuration / existing.count;
      existing.minDuration = Math.min(existing.minDuration, metric.duration);
      existing.maxDuration = Math.max(existing.maxDuration, metric.duration);
      existing.lastUpdated = metric.timestamp;
    }
  }

  private cleanOldMetrics(): void {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const oldCount = this.metrics.length;
    
    this.metrics = this.metrics.filter(m => m.timestamp > oneHourAgo);
    
    const cleaned = oldCount - this.metrics.length;
    if (cleaned > 0) {
      secureLog.debug(`Cleaned ${cleaned} old performance metrics`);
    }
  }

  // Generate performance report
  generateReport(): {
    summary: any;
    topSlowOperations: Array<{ operation: string; avgDuration: number; count: number }>;
    contextOptimization: any;
    recommendations: string[];
  } {
    const allStats = this.getAllStats();
    const contextStats = optimizedContextService.getStats();
    
    // Find slowest operations
    const topSlowOperations = Object.values(allStats)
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, 5)
      .map(stat => ({
        operation: stat.operation,
        avgDuration: Math.round(stat.avgDuration),
        count: stat.count
      }));

    // Generate recommendations
    const recommendations = this.generateRecommendations(allStats, contextStats);

    return {
      summary: {
        totalOperations: Object.values(allStats).reduce((sum, stat) => sum + stat.count, 0),
        avgResponseTime: Math.round(
          Object.values(allStats).reduce((sum, stat) => sum + stat.avgDuration, 0) / 
          Object.keys(allStats).length
        ),
        cacheEfficiency: Math.round(contextStats.cacheHitRate)
      },
      topSlowOperations,
      contextOptimization: {
        cacheHitRate: Math.round(contextStats.cacheHitRate),
        avgContextLoadTime: Math.round(contextStats.avgLoadTime),
        parallelCallsOptimization: contextStats.parallelCalls
      },
      recommendations
    };
  }

  private generateRecommendations(
    stats: Record<string, AggregatedStats>, 
    contextStats: any
  ): string[] {
    const recommendations = [];

    // Context optimization recommendations
    if (contextStats.cacheHitRate < 50) {
      recommendations.push('Increase context cache TTL to improve hit rate');
    }
    if (contextStats.avgLoadTime > 3000) {
      recommendations.push('Consider reducing context depth for faster responses');
    }

    // Operation-specific recommendations
    const slowOps = Object.values(stats).filter(stat => stat.avgDuration > 5000);
    if (slowOps.length > 0) {
      recommendations.push(`Optimize slow operations: ${slowOps.map(op => op.operation).join(', ')}`);
    }

    // General recommendations
    if (contextStats.parallelCalls < 10) {
      recommendations.push('Increase parallel API call batching for better throughput');
    }

    return recommendations;
  }
}

export const performanceMonitor = new PerformanceMonitor();