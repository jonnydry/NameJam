// Simple test of Datamuse API capabilities
const fetch = require('node-fetch');

async function testDatamuseAPI() {
  console.log('🚀 Testing Datamuse API for Enhanced Name Generation\n');
  
  const examples = [
    {
      description: 'Words that often follow "dark"',
      url: 'https://api.datamuse.com/words?lc=dark&max=8'
    },
    {
      description: 'Adjectives that describe "storm"',  
      url: 'https://api.datamuse.com/words?rel_jjb=storm&max=8'
    },
    {
      description: 'Words related to "music" concept',
      url: 'https://api.datamuse.com/words?ml=music&max=8'
    },
    {
      description: 'Words that sound like they belong with "rock"',
      url: 'https://api.datamuse.com/words?rel_trg=rock&max=8'
    }
  ];

  for (const example of examples) {
    console.log(`📊 ${example.description}:`);
    
    try {
      const response = await fetch(example.url);
      const words = await response.json();
      
      const results = words.map(w => w.word).slice(0, 6);
      console.log(`   ${results.join(', ')}\n`);
      
    } catch (error) {
      console.error(`   Error: ${error.message}\n`);
    }
  }

  console.log('🎯 HOW THIS IMPROVES NAME GENERATION:');
  console.log('');
  console.log('TRADITIONAL METHOD (Static Lists):');
  console.log('• Random: "Dark" + "Storm" = "Dark Storm"');
  console.log('• Limited: Only uses pre-defined 3,000 word vocabulary');
  console.log('• Repetitive: Same combinations appear frequently');
  console.log('');
  console.log('ENHANCED METHOD (Datamuse API):');
  console.log('• Contextual: "Dark" → "matter", "side", "knight", "energy"'); 
  console.log('• Statistical: Based on real language usage patterns');
  console.log('• Thematic: Words that actually relate to musical concepts');
  console.log('• Unlimited: 300,000+ word database with relationships');
  console.log('');
  console.log('RESULT: Names like "Dark Matter" or "Storm Rising" instead of random combinations');
}

testDatamuseAPI().catch(console.error);