// Test word count accuracy in name generation
import fetch from 'node-fetch';

async function testWordCount() {
  console.log('Testing word count accuracy...\n');
  
  // Test different word counts
  const testCases = [
    { wordCount: 1, expected: 1 },
    { wordCount: 2, expected: 2 },
    { wordCount: 3, expected: 3 },
    { wordCount: 4, expected: 4 },
    { wordCount: 5, expected: 5 },
    { wordCount: 6, expected: 6 }
  ];
  
  for (const testCase of testCases) {
    console.log(`Testing ${testCase.wordCount}-word generation:`);
    
    try {
      const response = await fetch('http://localhost:5000/api/generate-names', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'band',
          wordCount: testCase.wordCount,
          count: 5
        })
      });
      
      const data = await response.json();
      
      if (!data.results || !Array.isArray(data.results)) {
        console.error('Invalid response format');
        continue;
      }
      
      let allCorrect = true;
      for (const nameObj of data.results) {
        const actualWordCount = nameObj.name.split(' ').length;
        const isCorrect = actualWordCount === testCase.expected;
        
        console.log(`  ${isCorrect ? '✓' : '✗'} "${nameObj.name}" - ${actualWordCount} words`);
        
        if (!isCorrect) {
          allCorrect = false;
        }
      }
      
      console.log(`  Result: ${allCorrect ? 'PASS' : 'FAIL'}`);
      console.log('');
      
    } catch (error) {
      console.error(`Error testing ${testCase.wordCount}-word generation:`, error.message);
    }
  }
  
  // Test with mood and genre to ensure filtering doesn't break word count
  console.log('Testing with mood and genre filters:');
  
  try {
    const response = await fetch('http://localhost:5000/api/generate-names', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'band',
        wordCount: 3,
        count: 5,
        mood: 'dark',
        genre: 'metal'
      })
    });
    
    const data = await response.json();
    
    let allCorrect = true;
    for (const nameObj of data.results) {
      const actualWordCount = nameObj.name.split(' ').length;
      const isCorrect = actualWordCount === 3;
      
      console.log(`  ${isCorrect ? '✓' : '✗'} "${nameObj.name}" - ${actualWordCount} words`);
      
      if (!isCorrect) {
        allCorrect = false;
      }
    }
    
    console.log(`  Result: ${allCorrect ? 'PASS' : 'FAIL'}`);
    
  } catch (error) {
    console.error('Error testing with filters:', error.message);
  }
}

// Run the test
testWordCount().catch(console.error);