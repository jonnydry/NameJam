/**
 * Diagnostic script to identify performance bottlenecks and validation issues
 */

import { performance } from 'perf_hooks';

// Test validation errors
async function testValidationError() {
  console.log('🔍 Testing validation error...\n');
  
  const response = await fetch('http://localhost:5000/api/generate-names', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'song',
      genre: 'country',
      mood: 'melancholic',
      wordCount: 1,
      count: 4
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    console.log('❌ Validation error details:', JSON.stringify(error, null, 2));
  } else {
    console.log('✅ Request succeeded');
  }
}

// Test performance with timing breakdown
async function testPerformanceBreakdown() {
  console.log('\n📊 Testing performance with timing breakdown...\n');
  
  const startTime = performance.now();
  
  // Make request with minimal context
  const response = await fetch('http://localhost:5000/api/generate-names', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'band',
      genre: 'jazz',
      mood: 'energetic',
      wordCount: 2,
      count: 2 // Reduced count for faster testing
    })
  });
  
  const endTime = performance.now();
  const totalTime = endTime - startTime;
  
  if (response.ok) {
    const data = await response.json();
    console.log(`✅ Total request time: ${Math.round(totalTime)}ms`);
    console.log(`📦 Response size: ${JSON.stringify(data).length} bytes`);
    console.log(`🎯 Names generated: ${data.results.length}`);
    
    // Analyze if names are AI-generated
    const aiNames = data.results.filter((r: any) => r.isAiGenerated);
    console.log(`🤖 AI-generated names: ${aiNames.length}/${data.results.length}`);
  } else {
    console.log(`❌ Request failed: ${response.status}`);
  }
}

// Test without genre (faster context)
async function testWithoutGenre() {
  console.log('\n⚡ Testing without genre (minimal context)...\n');
  
  const startTime = performance.now();
  
  const response = await fetch('http://localhost:5000/api/generate-names', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'band',
      wordCount: 2,
      count: 2
    })
  });
  
  const endTime = performance.now();
  
  if (response.ok) {
    console.log(`✅ Request time without genre: ${Math.round(endTime - startTime)}ms`);
  } else {
    const error = await response.json();
    console.log('❌ Error:', error);
  }
}

// Run all tests
async function runDiagnostics() {
  console.log('🚀 Running diagnostics...\n');
  console.log('=' .repeat(60));
  
  await testValidationError();
  console.log('\n' + '=' .repeat(60));
  
  await testPerformanceBreakdown();
  console.log('\n' + '=' .repeat(60));
  
  await testWithoutGenre();
  console.log('\n' + '=' .repeat(60));
  
  console.log('\n📋 DIAGNOSIS SUMMARY:');
  console.log('- Check if validation errors are due to enum mismatches');
  console.log('- Compare performance with/without genre (context aggregation time)');
  console.log('- Verify if AI generation is the bottleneck');
  console.log('- Consider caching context aggregation results');
}

runDiagnostics().catch(console.error);