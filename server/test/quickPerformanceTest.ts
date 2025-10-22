/**
 * Quick Performance Test - Streamlined version for rapid assessment
 * Focuses on key optimization measurements with faster execution
 */

import { performanceMonitor } from '../services/performanceMonitor';
import { PhoneticFlowAnalyzer } from '../services/nameGeneration/phoneticFlowAnalyzer';
import { UnifiedNameGeneratorService, GENERATION_STRATEGIES } from '../services/unifiedNameGenerator';
import { deduplicateArray } from '../services/nameGeneration/stringUtils';
import { PatternTester } from '../services/nameGeneration/regexConstants';
import { secureLog } from '../utils/secureLogger';

interface QuickTestResult {
  testName: string;
  optimizedTime: number;
  unoptimizedTime?: number;
  improvementPercent?: number;
  metadata: any;
}

export class QuickPerformanceTest {
  private nameGenerator: UnifiedNameGeneratorService;
  private phoneticAnalyzer: PhoneticFlowAnalyzer;
  
  constructor() {
    this.nameGenerator = new UnifiedNameGeneratorService();
    this.phoneticAnalyzer = new PhoneticFlowAnalyzer();
  }

  async runQuickTests(): Promise<{
    results: QuickTestResult[];
    summary: any;
  }> {
    secureLog.info('🚀 Running Quick Performance Tests');
    const results: QuickTestResult[] = [];
    
    try {
      // Test 1: Basic name generation performance
      results.push(await this.testBasicGeneration());
      
      // Test 2: Phonetic cache effectiveness
      results.push(await this.testPhoneticCache());
      
      // Test 3: Regex pattern optimization
      results.push(await this.testRegexOptimization());
      
      // Test 4: Word deduplication
      results.push(await this.testDeduplication());
      
      // Test 5: Bulk generation
      results.push(await this.testBulkGeneration());
      
      // Generate summary
      const summary = this.generateQuickSummary(results);
      
      secureLog.info('✅ Quick Performance Tests Completed');
      return { results, summary };
      
    } catch (error) {
      secureLog.error('❌ Quick performance tests failed:', error);
      throw error;
    }
  }

  private async testBasicGeneration(): Promise<QuickTestResult> {
    secureLog.info('🧪 Testing Basic Name Generation');
    
    const testRequest = {
      type: 'band' as const,
      genre: 'rock' as any,
      mood: 'energetic' as any,
      count: 3
    };
    
    const startTime = Date.now();
    const result = await this.nameGenerator.generateNames(testRequest);
    const duration = Date.now() - startTime;
    
    return {
      testName: 'Basic Name Generation',
      optimizedTime: duration,
      metadata: {
        namesGenerated: result.length,
        strategy: 'comprehensive',
        quality: result.length > 0 ? this.calculateAverageQuality(result.map(item => item.name)) : 0,
        throughput: (result.length / duration) * 1000,
        cacheHit: false // metadata not available in current API
      }
    };
  }

  private async testPhoneticCache(): Promise<QuickTestResult> {
    secureLog.info('🧪 Testing Phonetic Cache Performance');
    
    const testNames = [
      'Dark Shadow', 'Electric Storm', 'Midnight Blues', 'Golden Hour',
      'Silver Lining', 'Red Moon Rising', 'Crystal Vision', 'Thunder Road'
    ];
    
    // Cold cache test
    const coldStart = Date.now();
    testNames.forEach(name => this.phoneticAnalyzer.analyzePhoneticFlow(name));
    const coldDuration = Date.now() - coldStart;
    
    // Warm cache test
    const warmStart = Date.now();
    testNames.forEach(name => this.phoneticAnalyzer.analyzePhoneticFlow(name));
    const warmDuration = Date.now() - warmStart;
    
    const improvementPercent = ((coldDuration - warmDuration) / coldDuration) * 100;
    
    return {
      testName: 'Phonetic Analysis Caching',
      optimizedTime: warmDuration,
      unoptimizedTime: coldDuration,
      improvementPercent,
      metadata: {
        namesAnalyzed: testNames.length,
        coldCacheTime: coldDuration,
        warmCacheTime: warmDuration,
        avgTimePerNameCold: coldDuration / testNames.length,
        avgTimePerNameWarm: warmDuration / testNames.length,
        cacheEffectiveness: improvementPercent > 50 ? 'High' : improvementPercent > 25 ? 'Moderate' : 'Low'
      }
    };
  }

  private async testRegexOptimization(): Promise<QuickTestResult> {
    secureLog.info('🧪 Testing Regex Pattern Optimization');
    
    const testWords = [
      'beautiful', 'wonderful', 'magnificent', 'running', 'jumping', 'singing',
      'quickly', 'slowly', 'darkness', 'lightness', 'happiness', 'music',
      'guitar', 'piano', 'drums', 'rhythm', 'melody', 'harmony'
    ];
    
    // Optimized test (precompiled patterns)
    const optimizedStart = Date.now();
    const optimizedResults = testWords.map(word => ({
      hasGoodFlow: PatternTester.hasGoodPhoneticFlow(word),
      hasProblematicSuffixes: PatternTester.hasProblematicSuffixes(word),
      passesValidation: PatternTester.passesBasicValidation(word),
      wordType: PatternTester.getWordType(word)
    }));
    const optimizedTime = Date.now() - optimizedStart;
    
    // Unoptimized test (runtime compilation)
    const unoptimizedStart = Date.now();
    const unoptimizedResults = testWords.map(word => ({
      hasGoodFlow: !/[^aeiou]{4,}/.test(word),
      hasProblematicSuffixes: /(inging|eded)$/.test(word),
      passesValidation: /^[a-zA-Z]+$/.test(word) && word.length > 2,
      wordType: /ly$/.test(word) ? 'adjective' : /ing$/.test(word) ? 'verb' : 'noun'
    }));
    const unoptimizedTime = Date.now() - unoptimizedStart;
    
    const improvementPercent = ((unoptimizedTime - optimizedTime) / unoptimizedTime) * 100;
    
    return {
      testName: 'Regex Pattern Optimization',
      optimizedTime,
      unoptimizedTime,
      improvementPercent,
      metadata: {
        wordsProcessed: testWords.length,
        optimizedOpsPerSecond: (testWords.length / optimizedTime) * 1000,
        unoptimizedOpsPerSecond: (testWords.length / unoptimizedTime) * 1000,
        resultsMatch: JSON.stringify(optimizedResults) === JSON.stringify(unoptimizedResults)
      }
    };
  }

  private async testDeduplication(): Promise<QuickTestResult> {
    secureLog.info('🧪 Testing Word Deduplication');
    
    // Create test data with duplicates
    const uniqueWords = ['rock', 'metal', 'blues', 'jazz', 'funk', 'soul', 'pop', 'punk'];
    const duplicatedWords = [...uniqueWords, ...uniqueWords, ...uniqueWords]; // 3x duplication
    
    // Optimized deduplication
    const optimizedStart = Date.now();
    const optimizedResult = deduplicateArray(duplicatedWords);
    const optimizedTime = Date.now() - optimizedStart;
    
    // Unoptimized deduplication (nested loops)
    const unoptimizedStart = Date.now();
    const unoptimizedResult = this.deduplicateUnoptimized(duplicatedWords);
    const unoptimizedTime = Date.now() - unoptimizedStart;
    
    const improvementPercent = ((unoptimizedTime - optimizedTime) / unoptimizedTime) * 100;
    
    return {
      testName: 'Word Deduplication',
      optimizedTime,
      unoptimizedTime,
      improvementPercent,
      metadata: {
        inputWords: duplicatedWords.length,
        outputWords: optimizedResult.length,
        duplicatesRemoved: duplicatedWords.length - optimizedResult.length,
        optimizedThroughput: (duplicatedWords.length / optimizedTime) * 1000,
        unoptimizedThroughput: (duplicatedWords.length / unoptimizedTime) * 1000,
        resultsMatch: optimizedResult.length === unoptimizedResult.length
      }
    };
  }

  private async testBulkGeneration(): Promise<QuickTestResult> {
    secureLog.info('🧪 Testing Bulk Generation Performance');
    
    const bulkRequests = Array.from({ length: 5 }, (_, i) => ({
      type: 'band' as const,
      genre: ['rock', 'jazz', 'electronic', 'metal', 'folk'][i],
      mood: 'energetic'
    }));
    
    const startTime = Date.now();
    const startMemory = process.memoryUsage();
    
    const results = await Promise.allSettled(
      bulkRequests.map(req => this.nameGenerator.generateNames({
        type: req.type,
        genre: req.genre as any,
        mood: req.mood as any,
        count: 3
      }))
    );
    
    const duration = Date.now() - startTime;
    const endMemory = process.memoryUsage();
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const totalNames = results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .reduce((sum, r) => sum + r.value.length, 0);
    
    return {
      testName: 'Bulk Name Generation',
      optimizedTime: duration,
      metadata: {
        totalRequests: bulkRequests.length,
        successfulRequests: successful,
        totalNamesGenerated: totalNames,
        throughput: (successful / duration) * 1000,
        memoryUsed: Math.round((endMemory.heapUsed - startMemory.heapUsed) / 1024),
        avgNamesPerRequest: totalNames / successful,
        avgTimePerRequest: duration / successful
      }
    };
  }

  private calculateAverageQuality(names: string[]): number {
    let totalScore = 0;
    for (const name of names) {
      const phoneticScore = this.phoneticAnalyzer.analyzePhoneticFlow(name);
      totalScore += phoneticScore.overall;
    }
    return totalScore / names.length;
  }

  private deduplicateUnoptimized(words: string[]): string[] {
    const result: string[] = [];
    for (const word of words) {
      if (!result.includes(word)) {
        result.push(word);
      }
    }
    return result;
  }

  private generateQuickSummary(results: QuickTestResult[]): any {
    const improvements = results
      .filter(r => r.improvementPercent !== undefined)
      .map(r => r.improvementPercent!);
    
    const avgImprovement = improvements.length > 0 ? 
      improvements.reduce((sum, imp) => sum + imp, 0) / improvements.length : 0;
    
    const totalOptimizedTime = results.reduce((sum, r) => sum + r.optimizedTime, 0);
    const totalUnoptimizedTime = results.reduce((sum, r) => sum + (r.unoptimizedTime || 0), 0);
    
    return {
      executionTime: new Date().toISOString(),
      testsRun: results.length,
      averageImprovement: Math.round(avgImprovement),
      totalOptimizedTime,
      totalUnoptimizedTime,
      overallSpeedup: totalUnoptimizedTime > 0 ? 
        `${Math.round(((totalUnoptimizedTime - totalOptimizedTime) / totalUnoptimizedTime) * 100)}%` : 'N/A',
      
      // Individual test summaries
      testSummaries: results.map(r => ({
        test: r.testName,
        optimizedTime: r.optimizedTime,
        improvement: r.improvementPercent ? `${Math.round(r.improvementPercent)}%` : 'N/A',
        status: r.improvementPercent && r.improvementPercent > 0 ? '✅ Improved' : 
               r.improvementPercent === undefined ? '📊 Baseline' : '❌ Degraded'
      })),
      
      // Performance insights
      insights: this.generateInsights(results),
      
      // Recommendations
      recommendations: this.generateRecommendations(results, avgImprovement)
    };
  }

  private generateInsights(results: QuickTestResult[]): string[] {
    const insights: string[] = [];
    
    // Cache effectiveness
    const cacheTest = results.find(r => r.testName.includes('Cache'));
    if (cacheTest && cacheTest.improvementPercent) {
      if (cacheTest.improvementPercent > 70) {
        insights.push('🔥 Phonetic analysis caching is highly effective');
      } else if (cacheTest.improvementPercent > 30) {
        insights.push('✅ Phonetic analysis caching provides good improvement');
      } else {
        insights.push('⚠️ Phonetic analysis caching has limited impact');
      }
    }
    
    // Regex optimization
    const regexTest = results.find(r => r.testName.includes('Regex'));
    if (regexTest && regexTest.improvementPercent) {
      if (regexTest.improvementPercent > 40) {
        insights.push('🚀 Precompiled regex patterns provide significant speedup');
      } else {
        insights.push('📈 Precompiled regex patterns provide modest improvement');
      }
    }
    
    // Deduplication
    const dedupTest = results.find(r => r.testName.includes('Deduplication'));
    if (dedupTest && dedupTest.improvementPercent) {
      if (dedupTest.improvementPercent > 50) {
        insights.push('⚡ Optimized deduplication is much faster than naive approach');
      }
    }
    
    // Quality assessment
    const generationTest = results.find(r => r.testName.includes('Generation'));
    if (generationTest && generationTest.metadata.quality > 70) {
      insights.push('💎 Name quality remains high after optimizations');
    }
    
    return insights;
  }

  private generateRecommendations(results: QuickTestResult[], avgImprovement: number): string[] {
    const recommendations: string[] = [];
    
    if (avgImprovement > 50) {
      recommendations.push('🎯 Optimization strategy is highly effective - consider applying similar patterns elsewhere');
    } else if (avgImprovement > 25) {
      recommendations.push('✅ Good optimization results - monitor performance in production');
    } else if (avgImprovement > 0) {
      recommendations.push('📈 Some improvement achieved - consider additional optimization strategies');
    }
    
    // Memory recommendations
    const bulkTest = results.find(r => r.testName.includes('Bulk'));
    if (bulkTest && bulkTest.metadata.memoryUsed > 1000) { // 1MB
      recommendations.push('💾 Monitor memory usage in high-load scenarios');
    }
    
    // Throughput recommendations
    if (bulkTest && bulkTest.metadata.throughput < 1) {
      recommendations.push('⚡ Consider implementing request batching for better throughput');
    }
    
    return recommendations;
  }
}

// Export for direct execution
export async function runQuickPerformanceTest(): Promise<void> {
  const tester = new QuickPerformanceTest();
  const { results, summary } = await tester.runQuickTests();
  
  // Log results
  console.log('\n================================');
  console.log('🎯 QUICK PERFORMANCE TEST RESULTS');
  console.log('================================');
  
  console.log(`📊 Tests Run: ${summary.testsRun}`);
  console.log(`⚡ Average Improvement: ${summary.averageImprovement}%`);
  console.log(`🔧 Overall Speedup: ${summary.overallSpeedup}`);
  
  console.log('\n📈 Individual Test Results:');
  summary.testSummaries.forEach((test: any) => {
    console.log(`${test.status} ${test.test}: ${test.optimizedTime}ms (${test.improvement} improvement)`);
  });
  
  if (summary.insights.length > 0) {
    console.log('\n💡 Key Insights:');
    summary.insights.forEach((insight: string) => console.log(`   ${insight}`));
  }
  
  if (summary.recommendations.length > 0) {
    console.log('\n🔮 Recommendations:');
    summary.recommendations.forEach((rec: string) => console.log(`   ${rec}`));
  }
  
  console.log('================================\n');
  
  // Save results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fs = await import('fs');
  const path = await import('path');
  
  const reportPath = path.join('./performance-reports', `quick-performance-${timestamp}.json`);
  fs.writeFileSync(reportPath, JSON.stringify({ results, summary }, null, 2));
  console.log(`📄 Report saved: ${reportPath}`);
}