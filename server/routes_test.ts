/**
 * Test endpoint for new smart name generation
 */

import { SmartNameGeneratorService } from './services/smartNameGenerator';

const smartGen = new SmartNameGeneratorService();

// Test different genres and moods
const testCases = [
  { type: 'band', genre: 'rock', mood: 'energetic', count: 3 },
  { type: 'band', genre: 'indie', mood: 'melancholy', count: 3 },
  { type: 'song', genre: 'pop', mood: 'romantic', count: 3 },
  { type: 'song', genre: 'rock', mood: 'dark', count: 3 }
];

async function testSmartGeneration() {
  console.log('🧠 Testing Smart Name Generation\n');
  
  for (const testCase of testCases) {
    console.log(`${testCase.type.toUpperCase()} - ${testCase.genre} (${testCase.mood}):`);
    try {
      const results = await smartGen.generateNames(testCase as any);
      results.forEach(result => console.log(`  ✓ ${result.name}`));
    } catch (error) {
      console.log(`  ❌ Error: ${error}`);
    }
    console.log('');
  }
}

// Run if this file is executed directly
if (require.main === module) {
  testSmartGeneration();
}