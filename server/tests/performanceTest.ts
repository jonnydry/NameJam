/**
 * Performance Test Script for Unified AI Generation
 * Tests the new context aggregation and AI generation system
 */

import { performance } from 'perf_hooks';

interface TestResult {
  testName: string;
  duration: number;
  success: boolean;
  error?: string;
  responseSize?: number;
  contextQuality?: string;
}

const API_URL = 'http://localhost:5000/api/generate-names';

async function runTest(testName: string, payload: any): Promise<TestResult> {
  const startTime = performance.now();
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return {
      testName,
      duration: Math.round(duration),
      success: true,
      responseSize: JSON.stringify(data).length,
      contextQuality: data.contextQuality
    };
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    return {
      testName,
      duration: Math.round(duration),
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function runPerformanceTests() {
  console.log('🚀 Starting Performance Tests for Unified AI Generation\n');
  console.log('=' .repeat(80));
  
  const tests = [
    {
      name: 'Basic Jazz Band (2 words)',
      payload: {
        type: 'band',
        genre: 'jazz',
        mood: 'energetic',
        wordCount: 2,
        count: 4
      }
    },
    {
      name: 'Electronic Song (3 words)',
      payload: {
        type: 'song',
        genre: 'electronic',
        mood: 'ethereal',  // Fixed: 'dreamy' is not a valid mood
        wordCount: 3,
        count: 4
      }
    },
    {
      name: 'Rock Band (4+ words)',
      payload: {
        type: 'band',
        genre: 'rock',
        mood: 'aggressive',
        wordCount: 4,
        count: 4
      }
    },
    {
      name: 'Country Song (1 word)',
      payload: {
        type: 'song',
        genre: 'country',
        mood: 'melancholy',  // Fixed enum value
        wordCount: 1,
        count: 4
      }
    },
    {
      name: 'General Band (no genre)',
      payload: {
        type: 'band',
        mood: 'uplifting',
        wordCount: 2,
        count: 4
      }
    }
  ];
  
  const results: TestResult[] = [];
  
  // Run tests sequentially to avoid overwhelming the server
  for (const test of tests) {
    console.log(`\n📋 Running: ${test.name}`);
    console.log(`   Payload: ${JSON.stringify(test.payload)}`);
    
    const result = await runTest(test.name, test.payload);
    results.push(result);
    
    if (result.success) {
      console.log(`   ✅ Success in ${result.duration}ms`);
      console.log(`   📊 Response size: ${result.responseSize} bytes`);
      if (result.contextQuality) {
        console.log(`   🎯 Context quality: ${result.contextQuality}`);
      }
    } else {
      console.log(`   ❌ Failed: ${result.error}`);
    }
    
    // Wait between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Performance Summary
  console.log('\n' + '=' .repeat(80));
  console.log('📊 PERFORMANCE SUMMARY\n');
  
  const successfulTests = results.filter(r => r.success);
  const failedTests = results.filter(r => !r.success);
  
  if (successfulTests.length > 0) {
    const avgDuration = successfulTests.reduce((sum, r) => sum + r.duration, 0) / successfulTests.length;
    const minDuration = Math.min(...successfulTests.map(r => r.duration));
    const maxDuration = Math.max(...successfulTests.map(r => r.duration));
    
    console.log(`✅ Successful tests: ${successfulTests.length}/${results.length}`);
    console.log(`⏱️  Average response time: ${Math.round(avgDuration)}ms`);
    console.log(`⚡ Fastest response: ${minDuration}ms`);
    console.log(`🐌 Slowest response: ${maxDuration}ms`);
  }
  
  if (failedTests.length > 0) {
    console.log(`\n❌ Failed tests: ${failedTests.length}`);
    failedTests.forEach(test => {
      console.log(`   - ${test.testName}: ${test.error}`);
    });
  }
  
  // Performance Analysis
  console.log('\n📈 PERFORMANCE ANALYSIS:');
  
  if (successfulTests.length > 0) {
    const avgTime = successfulTests.reduce((sum, r) => sum + r.duration, 0) / successfulTests.length;
    
    if (avgTime < 5000) {
      console.log('🎯 Excellent: Average response time under 5 seconds');
    } else if (avgTime < 10000) {
      console.log('✅ Good: Average response time under 10 seconds');
    } else if (avgTime < 20000) {
      console.log('⚠️  Warning: Average response time over 10 seconds');
    } else {
      console.log('❌ Critical: Average response time over 20 seconds');
    }
  }
  
  console.log('\n' + '=' .repeat(80));
}

// Run the tests
runPerformanceTests().catch(console.error);