/**
 * Test script to verify PhoneticFlowAnalyzer caching implementation
 */

const { phoneticFlowAnalyzer } = require('./services/nameGeneration/phoneticFlowAnalyzer.js');

async function testCaching() {
  console.log('Testing PhoneticFlowAnalyzer caching implementation...\n');

  // Test 1: Basic functionality
  console.log('=== Test 1: Basic Analysis ===');
  const testName = 'electric storm';
  console.log(`Analyzing "${testName}" for the first time...`);
  
  try {
    const result1 = phoneticFlowAnalyzer.analyzePhoneticFlow(testName);
    console.log('Result:', {
      overall: result1.overall,
      pronunciation: result1.pronunciation,
      flow: result1.flow,
      memorability: result1.memorability,
      uniqueness: result1.uniqueness,
      issueCount: result1.issues.length
    });

    // Test 2: Cache hit
    console.log('\n=== Test 2: Cache Hit ===');
    console.log(`Analyzing "${testName}" again (should be cached)...`);
    const result2 = phoneticFlowAnalyzer.analyzePhoneticFlow(testName);
    console.log('Result:', {
      overall: result2.overall,
      pronunciation: result2.pronunciation,
      flow: result2.flow,
      memorability: result2.memorability,
      uniqueness: result2.uniqueness,
      issueCount: result2.issues.length
    });

    // Test 3: Cache statistics
    console.log('\n=== Test 3: Cache Statistics ===');
    const stats = phoneticFlowAnalyzer.getCacheStats();
    console.log('Cache Stats:', stats);

    // Test 4: Performance test
    console.log('\n=== Test 4: Performance Test ===');
    const perfTestName = 'metal storm';

    // First run (cache miss)
    const start1 = Date.now();
    phoneticFlowAnalyzer.analyzePhoneticFlow(perfTestName);
    const time1 = Date.now() - start1;

    // Second run (cache hit)
    const start2 = Date.now();
    phoneticFlowAnalyzer.analyzePhoneticFlow(perfTestName);
    const time2 = Date.now() - start2;

    console.log(`First analysis (cache miss): ${time1}ms`);
    console.log(`Second analysis (cache hit): ${time2}ms`);
    
    if (time1 > time2) {
      console.log(`Performance improvement: ${((time1 - time2) / time1 * 100).toFixed(1)}%`);
    } else {
      console.log('Note: Cache hit should be faster than cache miss');
    }

    console.log('\nTest completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testCaching();