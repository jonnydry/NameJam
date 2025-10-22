/**
 * Test file for phonetic matching service
 * Run this to verify phonetic matching works correctly
 */

import { phoneticMatchingService } from '../services/phoneticMatchingService';
import { secureLog } from '../utils/secureLogger';

export function runPhoneticMatchingTests(): void {
  secureLog.info('🔊 Running Phonetic Matching Tests...');
  
  const results = phoneticMatchingService.testPhoneticMatching();
  
  console.log('\n📊 Phonetic Matching Test Results:');
  console.log('==================================');
  
  results.forEach(({ testName, result }) => {
    const status = result.similarity > 0.8 ? '✅ HIGH' : 
                   result.similarity > 0.6 ? '⚠️  MEDIUM' : 
                   result.similarity > 0.3 ? '📝 LOW' : '❌ NO MATCH';
    
    console.log(`\n${testName}:`);
    console.log(`  Overall Similarity: ${(result.similarity * 100).toFixed(1)}% ${status}`);
    console.log(`  Phonetic: ${(result.phoneticSimilarity * 100).toFixed(1)}%`);
    console.log(`  Edit Distance: ${result.editDistance}`);
    console.log(`  Token Similarity: ${(result.tokenSimilarity * 100).toFixed(1)}%`);
    console.log(`  Confidence: ${(result.confidence * 100).toFixed(1)}%`);
  });
  
  secureLog.info('✅ Phonetic matching tests completed');
}

// Test specific cases
export function testNameNormalization(): void {
  console.log('\n🔧 Testing Name Normalization:');
  console.log('==============================');
  
  const testNames = [
    'The Beatles',
    'Led Zeppelin',
    'Red Hot Chili Peppers',
    'AC/DC',
    'Guns N\' Roses',
    'Twenty One Pilots',
    'Panic! At The Disco',
    'Fall Out Boy'
  ];
  
  testNames.forEach(name => {
    const normalized = phoneticMatchingService.normalizeName(name);
    console.log(`\nOriginal: "${name}"`);
    console.log(`Canonical: "${normalized.canonical}"`);
    console.log(`Tokens: [${normalized.tokens.join(', ')}]`);
    console.log(`Metaphone: [${normalized.metaphoneKeys.join(', ')}]`);
    console.log(`Soundex: [${normalized.soundexKeys.join(', ')}]`);
  });
}