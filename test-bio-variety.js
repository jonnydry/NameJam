// Test bio variety
const fetch = require('node-fetch');

async function testBioVariety() {
  const bios = [];
  
  for (let i = 0; i < 5; i++) {
    try {
      const response = await fetch('http://localhost:5000/api/generate-band-bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bandName: `Test Band ${i}`,
          genre: 'rock',
          mood: 'energetic'
        })
      });
      
      const data = await response.json();
      bios.push(data.bio);
      
      console.log(`\n=== Bio ${i + 1} ===`);
      console.log(data.bio.substring(0, 200) + '...');
      
    } catch (error) {
      console.error('Error:', error);
    }
  }
  
  // Check for uniqueness
  console.log('\n=== Uniqueness Check ===');
  const uniqueBios = new Set(bios);
  console.log(`Generated ${bios.length} bios, ${uniqueBios.size} are unique`);
  
  // Check for repeated phrases
  const phrases = [];
  bios.forEach(bio => {
    const sentences = bio.split('. ');
    phrases.push(...sentences);
  });
  
  const phraseCount = {};
  phrases.forEach(phrase => {
    phraseCount[phrase] = (phraseCount[phrase] || 0) + 1;
  });
  
  console.log('\n=== Most Common Phrases ===');
  Object.entries(phraseCount)
    .filter(([_, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([phrase, count]) => {
      console.log(`"${phrase.substring(0, 50)}..." appears ${count} times`);
    });
}

testBioVariety();