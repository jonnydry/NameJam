/**
 * Test script to verify PhoneticFlowAnalyzer caching implementation
 */

import { phoneticFlowAnalyzer } from './server/services/nameGeneration/phoneticFlowAnalyzer.js';

console.log('Testing PhoneticFlowAnalyzer caching implementation...\n');

// Test 1: Basic functionality
console.log('=== Test 1: Basic Analysis ===');
const testName = 'electric storm';
console.log(`Analyzing "${testName}" for the first time...`);
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

// Test 4: Multiple analyses to build cache
console.log('\n=== Test 4: Multiple Analyses ===');
const testNames = [
  'dark shadow',
  'cosmic wave', 
  'fire heart',
  'neon dream',
  'silver moon',
  'jazz fusion'
];

console.log('Analyzing multiple names...');
testNames.forEach((name, index) => {
  const result = phoneticFlowAnalyzer.analyzePhoneticFlow(name);
  console.log(`${index + 1}. "${name}" - Overall: ${result.overall}`);
});

// Test 5: Final cache statistics
console.log('\n=== Test 5: Final Cache Statistics ===');
const finalStats = phoneticFlowAnalyzer.getCacheStats();
console.log('Final Cache Stats:', finalStats);

// Test 6: Performance test
console.log('\n=== Test 6: Performance Test ===');
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
console.log(`Performance improvement: ${((time1 - time2) / time1 * 100).toFixed(1)}%`);

console.log('\nTest completed!');