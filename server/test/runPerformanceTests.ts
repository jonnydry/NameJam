#!/usr/bin/env node

/**
 * Performance Test Runner
 * Executes comprehensive performance tests and generates detailed reports
 */

import { PerformanceTestSuite } from './performanceTestSuite';
import { performanceMonitor } from '../services/performanceMonitor';
import { secureLog } from '../utils/secureLogger';
import * as fs from 'fs';
import * as path from 'path';

interface TestRunConfig {
  outputDir: string;
  includeDetailedLogs: boolean;
  runStressTests: boolean;
  warmupIterations: number;
}

class PerformanceTestRunner {
  private config: TestRunConfig;
  private testSuite: PerformanceTestSuite;
  
  constructor(config: Partial<TestRunConfig> = {}) {
    this.config = {
      outputDir: './performance-reports',
      includeDetailedLogs: true,
      runStressTests: false,
      warmupIterations: 3,
      ...config
    };
    
    this.testSuite = new PerformanceTestSuite();
    
    // Ensure output directory exists
    this.ensureOutputDirectory();
  }

  /**
   * Run the complete performance test suite
   */
  async runTests(): Promise<void> {
    const startTime = Date.now();
    secureLog.info('🚀 Starting Performance Test Runner');
    
    try {
      // Warmup phase
      if (this.config.warmupIterations > 0) {
        await this.performWarmup();
      }

      // Record initial system state
      const initialSystemState = this.captureSystemState();

      // Execute comprehensive test suite
      secureLog.info('📊 Executing comprehensive performance tests...');
      const testResults = await this.testSuite.runComprehensiveTests();

      // Record final system state
      const finalSystemState = this.captureSystemState();

      // Generate reports
      const reportData = {
        timestamp: new Date().toISOString(),
        testDuration: Date.now() - startTime,
        systemStateInitial: initialSystemState,
        systemStateFinal: finalSystemState,
        testResults: testResults.results,
        optimizationComparisons: testResults.comparisons,
        summary: testResults.summary,
        performanceMonitorStats: performanceMonitor.getAllStats(),
        recommendations: this.generateRecommendations(testResults)
      };

      // Save results
      await this.saveResults(reportData);
      
      // Display summary
      this.displaySummary(reportData);

      secureLog.info(`✅ Performance testing completed in ${Date.now() - startTime}ms`);
      
    } catch (error) {
      secureLog.error('❌ Performance test execution failed:', error);
      throw error;
    }
  }

  /**
   * Perform warmup iterations to stabilize performance measurements
   */
  private async performWarmup(): Promise<void> {
    secureLog.info(`🔥 Performing ${this.config.warmupIterations} warmup iterations...`);
    
    for (let i = 0; i < this.config.warmupIterations; i++) {
      try {
        // Create a simple warmup test suite
        const warmupSuite = new PerformanceTestSuite();
        await warmupSuite['testSingleNameGeneration'](); // Access private method for warmup
        secureLog.debug(`Warmup iteration ${i + 1}/${this.config.warmupIterations} completed`);
      } catch (error) {
        secureLog.warn(`Warmup iteration ${i + 1} failed:`, error);
      }
    }
    
    secureLog.info('🔥 Warmup completed, starting actual tests...');
  }

  /**
   * Capture current system state for comparison
   */
  private captureSystemState(): any {
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    return {
      timestamp: Date.now(),
      memoryUsage: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        external: Math.round(memoryUsage.external / 1024 / 1024), // MB
        arrayBuffers: Math.round(memoryUsage.arrayBuffers / 1024 / 1024) // MB
      },
      uptime: Math.round(uptime),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    };
  }

  /**
   * Generate performance recommendations based on test results
   */
  private generateRecommendations(testResults: any): string[] {
    const recommendations: string[] = [];
    
    // Analyze optimization effectiveness
    const avgImprovement = testResults.comparisons.reduce((sum: number, comp: any) => 
      sum + comp.improvementPercent, 0) / testResults.comparisons.length;
    
    if (avgImprovement > 50) {
      recommendations.push('✅ Excellent optimization effectiveness - consider applying similar patterns to other services');
    } else if (avgImprovement > 25) {
      recommendations.push('✅ Good optimization results - monitor performance in production');
    } else {
      recommendations.push('⚠️ Limited optimization impact - consider additional performance strategies');
    }

    // Cache effectiveness analysis
    const cacheTests = testResults.comparisons.filter((comp: any) => comp.cacheHitRate);
    if (cacheTests.length > 0) {
      const avgCacheHitRate = cacheTests.reduce((sum: number, test: any) => 
        sum + test.cacheHitRate, 0) / cacheTests.length;
      
      if (avgCacheHitRate > 80) {
        recommendations.push('✅ Excellent cache effectiveness - caching strategy is working well');
      } else if (avgCacheHitRate > 50) {
        recommendations.push('⚠️ Moderate cache effectiveness - consider cache tuning');
      } else {
        recommendations.push('❌ Poor cache effectiveness - review caching strategy');
      }
    }

    // Memory usage analysis
    const memoryTests = testResults.results.filter((test: any) => test.memoryUsage);
    if (memoryTests.length > 0) {
      const highMemoryTests = memoryTests.filter((test: any) => 
        test.memoryUsage.heapUsed > 50 * 1024 * 1024); // 50MB
      
      if (highMemoryTests.length > 0) {
        recommendations.push('⚠️ High memory usage detected in some operations - monitor memory leaks');
      }
    }

    // Quality preservation analysis
    const qualityTests = testResults.results.filter((test: any) => test.qualityScore);
    if (qualityTests.length > 0) {
      const avgQuality = qualityTests.reduce((sum: number, test: any) => 
        sum + test.qualityScore, 0) / qualityTests.length;
      
      if (avgQuality < 70) {
        recommendations.push('❌ Quality degradation detected - review optimization impact on output quality');
      } else if (avgQuality > 85) {
        recommendations.push('✅ Quality preserved well during optimization');
      }
    }

    // Performance trends
    const slowOperations = testResults.results.filter((test: any) => 
      test.operationsPerSecond && test.operationsPerSecond < 10);
    
    if (slowOperations.length > 0) {
      recommendations.push(`⚠️ ${slowOperations.length} operations with low throughput - investigate bottlenecks`);
    }

    // Circuit breaker effectiveness
    const circuitBreakerTests = testResults.results.filter((test: any) => 
      test.testName.includes('Circuit Breaker'));
    
    if (circuitBreakerTests.length > 0) {
      const circuitTest = circuitBreakerTests[0];
      if (circuitTest.metadata?.successRate) {
        const successRate = parseFloat(circuitTest.metadata.successRate);
        if (successRate > 90) {
          recommendations.push('✅ Circuit breaker working effectively');
        } else if (successRate < 70) {
          recommendations.push('⚠️ Circuit breaker may be too aggressive - consider tuning');
        }
      }
    }

    return recommendations;
  }

  /**
   * Save test results to files
   */
  private async saveResults(reportData: any): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    try {
      // Save comprehensive JSON report
      const jsonReportPath = path.join(this.config.outputDir, `performance-report-${timestamp}.json`);
      fs.writeFileSync(jsonReportPath, JSON.stringify(reportData, null, 2));
      secureLog.info(`📄 Detailed report saved: ${jsonReportPath}`);

      // Save human-readable summary
      const textReportPath = path.join(this.config.outputDir, `performance-summary-${timestamp}.txt`);
      const textReport = this.generateTextReport(reportData);
      fs.writeFileSync(textReportPath, textReport);
      secureLog.info(`📄 Summary report saved: ${textReportPath}`);

      // Save CSV data for analysis
      const csvReportPath = path.join(this.config.outputDir, `performance-data-${timestamp}.csv`);
      const csvData = this.generateCSVReport(reportData);
      fs.writeFileSync(csvReportPath, csvData);
      secureLog.info(`📊 CSV data saved: ${csvReportPath}`);

    } catch (error) {
      secureLog.error('Failed to save performance reports:', error);
    }
  }

  /**
   * Generate human-readable text report
   */
  private generateTextReport(reportData: any): string {
    const report = [];
    
    report.push('================================');
    report.push('PERFORMANCE TEST REPORT');
    report.push('================================');
    report.push(`Test Date: ${reportData.timestamp}`);
    report.push(`Test Duration: ${(reportData.testDuration / 1000).toFixed(2)} seconds`);
    report.push('');

    // System Information
    report.push('SYSTEM INFORMATION:');
    report.push(`Node.js Version: ${reportData.systemStateInitial.nodeVersion}`);
    report.push(`Platform: ${reportData.systemStateInitial.platform} ${reportData.systemStateInitial.arch}`);
    report.push(`Initial Memory Usage: ${reportData.systemStateInitial.memoryUsage.heapUsed}MB`);
    report.push(`Final Memory Usage: ${reportData.systemStateFinal.memoryUsage.heapUsed}MB`);
    report.push('');

    // Test Summary
    report.push('TEST SUMMARY:');
    report.push(`Total Tests Executed: ${reportData.testResults.length}`);
    report.push(`Optimization Comparisons: ${reportData.optimizationComparisons.length}`);
    
    if (reportData.summary?.performanceMetrics) {
      const metrics = reportData.summary.performanceMetrics;
      report.push(`Average Generation Time: ${metrics.averageGenerationTime?.toFixed(2)}ms`);
      report.push(`Average Operations/Second: ${metrics.averageOperationsPerSecond?.toFixed(2)}`);
      report.push(`Average Quality Score: ${metrics.averageQualityScore?.toFixed(2)}/100`);
      report.push(`Memory Efficiency: ${metrics.totalMemoryEfficiency}`);
    }
    report.push('');

    // Optimization Results
    report.push('OPTIMIZATION EFFECTIVENESS:');
    reportData.optimizationComparisons.forEach((comp: any) => {
      report.push(`${comp.testName}:`);
      report.push(`  - Performance Improvement: ${comp.improvementPercent.toFixed(1)}%`);
      report.push(`  - Quality Maintained: ${comp.qualityMaintained ? 'Yes' : 'No'}`);
      if (comp.cacheHitRate !== undefined) {
        report.push(`  - Cache Hit Rate: ${comp.cacheHitRate}%`);
      }
    });
    report.push('');

    // Top Performing Operations
    if (reportData.summary?.fastestOperations) {
      report.push('FASTEST OPERATIONS:');
      reportData.summary.fastestOperations.forEach((op: any, index: number) => {
        report.push(`${index + 1}. ${op.testName}: ${op.operationsPerSecond} ops/sec`);
      });
      report.push('');
    }

    // Performance Alerts
    if (reportData.summary?.performanceAlerts && reportData.summary.performanceAlerts.length > 0) {
      report.push('PERFORMANCE ALERTS:');
      reportData.summary.performanceAlerts.forEach((alert: string) => {
        report.push(`⚠️  ${alert}`);
      });
      report.push('');
    }

    // Recommendations
    if (reportData.recommendations && reportData.recommendations.length > 0) {
      report.push('RECOMMENDATIONS:');
      reportData.recommendations.forEach((rec: string) => {
        report.push(`• ${rec}`);
      });
      report.push('');
    }

    // Individual Test Results
    report.push('DETAILED TEST RESULTS:');
    report.push('========================');
    reportData.testResults.forEach((test: any) => {
      report.push(`Test: ${test.testName}`);
      report.push(`Duration: ${test.duration}ms`);
      if (test.operationsPerSecond) {
        report.push(`Operations/Second: ${test.operationsPerSecond.toFixed(2)}`);
      }
      if (test.qualityScore) {
        report.push(`Quality Score: ${test.qualityScore.toFixed(2)}/100`);
      }
      if (test.memoryUsage) {
        report.push(`Memory Used: ${Math.round(test.memoryUsage.heapUsed / 1024)}KB`);
      }
      if (test.metadata) {
        report.push(`Metadata: ${JSON.stringify(test.metadata, null, 2)}`);
      }
      report.push('---');
    });

    return report.join('\n');
  }

  /**
   * Generate CSV report for data analysis
   */
  private generateCSVReport(reportData: any): string {
    const headers = [
      'TestName',
      'Duration',
      'OperationsPerSecond', 
      'QualityScore',
      'MemoryUsed',
      'TestType',
      'Notes'
    ];

    const rows = [headers.join(',')];

    reportData.testResults.forEach((test: any) => {
      const row = [
        `"${test.testName}"`,
        test.duration || 0,
        test.operationsPerSecond || 0,
        test.qualityScore || 0,
        test.memoryUsage?.heapUsed || 0,
        `"${this.determineTestType(test.testName)}"`,
        `"${JSON.stringify(test.metadata || {})}"`
      ];
      rows.push(row.join(','));
    });

    return rows.join('\n');
  }

  /**
   * Display test summary in console
   */
  private displaySummary(reportData: any): void {
    console.log('\n================================');
    console.log('🎯 PERFORMANCE TEST SUMMARY');
    console.log('================================');
    
    if (reportData.summary?.performanceMetrics) {
      const metrics = reportData.summary.performanceMetrics;
      console.log(`📊 Average Generation Time: ${metrics.averageGenerationTime?.toFixed(2)}ms`);
      console.log(`⚡ Average Operations/Sec: ${metrics.averageOperationsPerSecond?.toFixed(2)}`);
      console.log(`💎 Average Quality Score: ${metrics.averageQualityScore?.toFixed(2)}/100`);
      console.log(`💾 Memory Efficiency: ${metrics.totalMemoryEfficiency}`);
    }

    console.log('\n🚀 OPTIMIZATION IMPROVEMENTS:');
    reportData.optimizationComparisons.forEach((comp: any) => {
      const icon = comp.improvementPercent > 50 ? '🔥' : comp.improvementPercent > 25 ? '✅' : '📈';
      console.log(`${icon} ${comp.testName}: ${comp.improvementPercent.toFixed(1)}% improvement`);
    });

    if (reportData.summary?.performanceAlerts && reportData.summary.performanceAlerts.length > 0) {
      console.log('\n⚠️  PERFORMANCE ALERTS:');
      reportData.summary.performanceAlerts.forEach((alert: string) => {
        console.log(`   • ${alert}`);
      });
    }

    if (reportData.recommendations && reportData.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      reportData.recommendations.forEach((rec: string) => {
        console.log(`   • ${rec}`);
      });
    }

    console.log(`\n✅ Test completed in ${(reportData.testDuration / 1000).toFixed(2)} seconds`);
    console.log('📄 Detailed reports saved to:', this.config.outputDir);
    console.log('================================\n');
  }

  /**
   * Determine test type for categorization
   */
  private determineTestType(testName: string): string {
    if (testName.includes('Single Generation')) return 'Basic';
    if (testName.includes('Bulk Generation')) return 'Load';
    if (testName.includes('Cache')) return 'Caching';
    if (testName.includes('Regex')) return 'Optimization';
    if (testName.includes('Filtering')) return 'Optimization';
    if (testName.includes('Deduplication')) return 'Optimization';
    if (testName.includes('Circuit Breaker')) return 'Resilience';
    if (testName.includes('Memory')) return 'Resource';
    if (testName.includes('Quality')) return 'Quality';
    return 'Other';
  }

  /**
   * Ensure output directory exists
   */
  private ensureOutputDirectory(): void {
    if (!fs.existsSync(this.config.outputDir)) {
      fs.mkdirSync(this.config.outputDir, { recursive: true });
      secureLog.info(`📁 Created output directory: ${this.config.outputDir}`);
    }
  }
}

// Execute if run directly
async function main(): Promise<void> {
  const runner = new PerformanceTestRunner({
    outputDir: './performance-reports',
    includeDetailedLogs: true,
    runStressTests: false,
    warmupIterations: 2
  });

  try {
    await runner.runTests();
    process.exit(0);
  } catch (error) {
    console.error('Performance test execution failed:', error);
    process.exit(1);
  }
}

// Check if this file is being run directly (ES module compatible)
const isMainModule = process.argv[1] && process.argv[1].includes('runPerformanceTests.ts');
if (isMainModule) {
  main().catch(console.error);
}

export { PerformanceTestRunner };