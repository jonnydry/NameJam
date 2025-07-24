// Quick test to demonstrate enhanced Datamuse generation vs traditional method
import { enhancedNameGenerator } from './server/services/enhancedNameGenerator.js';
import { NameGeneratorService } from './server/services/nameGenerator.js';

async function testEnhancedGeneration() {
  console.log('🧪 Testing Enhanced Datamuse Generation vs Traditional Method\n');
  
  const nameGenerator = new NameGeneratorService();
  
  const testCases = [
    { type: 'band', wordCount: 2, mood: 'dark', genre: 'rock' },
    { type: 'song', wordCount: 3, mood: 'melancholy', genre: 'folk' },
    { type: 'band', wordCount: 2, mood: 'energetic', genre: 'electronic' }
  ];

  for (const testCase of testCases) {
    console.log(`\n📊 Test: ${testCase.type} - ${testCase.wordCount} words - ${testCase.mood} ${testCase.genre}`);
    console.log('=' .repeat(70));
    
    try {
      // Traditional generation (static vocabulary)
      console.log('\n🔵 TRADITIONAL (Static Vocabulary):');
      const traditionalResults = await nameGenerator.generateTraditionalNames({
        ...testCase,
        count: 3
      });
      traditionalResults.forEach((result, i) => {
        console.log(`${i+1}. ${result.name} (source: ${result.source})`);
      });

      // Enhanced generation (Datamuse API)
      console.log('\n🚀 ENHANCED (Datamuse Contextual):');
      const enhancedResults = await enhancedNameGenerator.generateEnhancedNames({
        ...testCase,
        count: 3
      });
      enhancedResults.forEach((result, i) => {
        console.log(`${i+1}. ${result.name} (source: ${result.source})`);
      });

    } catch (error) {
      console.error(`❌ Error in test case:`, error.message);
    }
  }

  console.log('\n\n🎯 KEY IMPROVEMENTS WITH DATAMUSE API:');
  console.log('• Contextual word relationships based on real language usage');
  console.log('• Statistical associations from massive text corpora'); 
  console.log('• Semantic word pairing (e.g., "ocean" → "deep", "blue")');
  console.log('• Thematic filtering for genre/mood consistency');
  console.log('• 100,000 free API calls per day for authentic data');
}

testEnhancedGeneration().catch(console.error);