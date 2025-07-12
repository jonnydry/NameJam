import OpenAI from "openai";

export class AINameGeneratorService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      baseURL: "https://api.x.ai/v1",
      apiKey: process.env.XAI_API_KEY
    });
  }

  async generateAIName(type: 'band' | 'song', genre?: string, mood?: string): Promise<string> {
    // Try different models in order of preference
    const models = ["grok-2-1212", "grok-2-vision-1212", "grok-3-mini"];
    
    for (const model of models) {
      try {
        const genreInfo = genre ? ` ${genre}` : '';
        const moodInfo = mood ? ` ${mood}` : '';
        const typeText = type === 'band' ? 'band' : 'song title';
        
        // Create varied prompts based on type
        let prompt;
        if (model === 'grok-3-mini') {
          // Simpler prompts for Grok 3 mini
          const simplePrompts = type === 'band' ? [
            `Create a unique${genreInfo} band name with${moodInfo} energy. Make it creative and memorable. Just return the name, nothing else.`,
            `Generate a cool${genreInfo} band name that sounds${moodInfo}. Be original. Return only the name.`,
            `Invent a${genreInfo} band name with${moodInfo} vibes. Make it catchy. Name only.`
          ] : [
            `Create a unique${genreInfo} song title with${moodInfo} feeling. Make it poetic and memorable. Just return the title, nothing else.`,
            `Generate a cool${genreInfo} song title that sounds${moodInfo}. Be creative. Return only the title.`,
            `Invent a${genreInfo} song title with${moodInfo} vibes. Make it artistic. Title only.`
          ];
          prompt = simplePrompts[Math.floor(Math.random() * simplePrompts.length)];
        } else {
          // More complex prompts for other models
          const randomSeed = Math.random();
          const complexPrompts = type === 'band' ? [
            `Generate a wildly creative${genreInfo} band name with${moodInfo} energy. Seed: ${randomSeed}. Think outside the box - combine unexpected words, use wordplay, or create something that sounds legendary. Just the name, nothing else!`,
            `Invent an unforgettable${genreInfo} band name that captures${moodInfo} vibes. Random: ${randomSeed}. Be bold, be different, surprise me! Return only the band name.`,
            `Create a${genreInfo} band name that screams${moodInfo} attitude. Variation: ${randomSeed}. Make it sound like they could headline festivals. Name only!`,
            `Dream up a${genreInfo} band name with${moodInfo} soul. Randomizer: ${randomSeed}. Think of names that would look great on a marquee. Just the name!`
          ] : [
            `Generate a poetic${genreInfo} song title with${moodInfo} emotion. Seed: ${randomSeed}. Think of titles that tell a story, evoke imagery, or capture a moment. Just the title, nothing else!`,
            `Invent a memorable${genreInfo} song title that feels${moodInfo}. Random: ${randomSeed}. Be artistic, be deep, surprise me! Return only the song title.`,
            `Create a${genreInfo} song title that captures${moodInfo} essence. Variation: ${randomSeed}. Make it something people would remember and quote. Title only!`,
            `Dream up a${genreInfo} song title with${moodInfo} spirit. Randomizer: ${randomSeed}. Think of titles that would make great album tracks. Just the title!`
          ];
          prompt = complexPrompts[Math.floor(Math.random() * complexPrompts.length)];
        }

        const response = await this.openai.chat.completions.create({
          model: model,
          messages: [
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: model === 'grok-3-mini' ? 100 : 50,
          temperature: 0.9
        });

        const generatedName = response.choices[0]?.message?.content?.trim() || "";
        
        if (generatedName && generatedName !== "") {
          // Clean up the response - remove quotes, "Band name:", etc.
          let cleanName = generatedName
            .replace(/^(Band name|Song title|Name|Title):\s*/i, '')
            .replace(/^["']|["']$/g, '')
            .replace(/^\d+\.\s*/, '')
            .trim();
          
          if (cleanName) {
            return JSON.stringify({
              name: cleanName,
              model: model,
              source: 'ai',
              type: type
            });
          }
        }
        
        console.log(`Model ${model} returned empty or invalid content, trying next model...`);
        
      } catch (error: any) {
        console.log(`Model ${model} failed:`, error.message);
        // Continue to next model
      }
    }

    // If all models fail, return fallback
    return this.generateFallbackName(type, genre, mood);
  }

  private generateFallbackName(type: 'band' | 'song', genre?: string, mood?: string): string {
    const moodWords = {
      'dark': ['Shadow', 'Midnight', 'Void', 'Eclipse', 'Raven'],
      'bright': ['Sunshine', 'Crystal', 'Aurora', 'Radiant', 'Golden'],
      'mysterious': ['Enigma', 'Mystic', 'Phantom', 'Oracle', 'Cipher'],
      'energetic': ['Thunder', 'Lightning', 'Surge', 'Blaze', 'Spark'],
      'melancholy': ['Rain', 'Echo', 'Mist', 'Sorrow', 'Fade'],
      'ethereal': ['Dream', 'Celestial', 'Aether', 'Whisper', 'Float'],
      'aggressive': ['Fury', 'Rage', 'Storm', 'Chaos', 'Riot'],
      'peaceful': ['Harmony', 'Zen', 'Calm', 'Serene', 'Still'],
      'nostalgic': ['Memory', 'Yesterday', 'Vintage', 'Past', 'Time'],
      'futuristic': ['Neon', 'Cyber', 'Quantum', 'Digital', 'Tech'],
      'romantic': ['Heart', 'Rose', 'Love', 'Velvet', 'Sweet'],
      'epic': ['Titan', 'Legend', 'Saga', 'Hero', 'Empire']
    };

    const genreWords = {
      'rock': ['Stone', 'Fire', 'Electric', 'Wild', 'Free'],
      'metal': ['Steel', 'Iron', 'Forge', 'Blade', 'Crown'],
      'jazz': ['Blue', 'Smooth', 'Cool', 'Sweet', 'Note'],
      'electronic': ['Circuit', 'Wave', 'Digital', 'Pulse', 'Grid'],
      'folk': ['River', 'Mountain', 'Wind', 'Earth', 'Tree'],
      'classical': ['Symphony', 'Grace', 'Noble', 'Grand', 'Pure'],
      'hip-hop': ['Street', 'Flow', 'Beat', 'Real', 'Fresh'],
      'country': ['Road', 'Home', 'Field', 'Star', 'Heart'],
      'blues': ['Soul', 'Deep', 'True', 'Raw', 'Feel'],
      'reggae': ['Island', 'Sun', 'Rhythm', 'Peace', 'One'],
      'punk': ['Raw', 'Rebel', 'Fast', 'Loud', 'Real'],
      'indie': ['New', 'Strange', 'Art', 'Dream', 'Wild'],
      'pop': ['Bright', 'Star', 'Magic', 'Dance', 'Life'],
      'alternative': ['Different', 'Edge', 'Strange', 'New', 'Other']
    };

    const connectors = ['of', 'and', 'in', 'for', 'with', 'through', 'beyond'];
    const articles = type === 'band' ? ['The', ''] : [''];

    const moodList = mood && moodWords[mood] ? moodWords[mood] : ['Dream', 'Echo', 'Fire', 'Star', 'Light'];
    const genreList = genre && genreWords[genre] ? genreWords[genre] : ['Music', 'Sound', 'Beat', 'Song', 'Note'];

    const word1 = moodList[Math.floor(Math.random() * moodList.length)];
    const word2 = genreList[Math.floor(Math.random() * genreList.length)];
    const connector = connectors[Math.floor(Math.random() * connectors.length)];
    const article = articles[Math.floor(Math.random() * articles.length)];

    const patterns = [
      `${article}${article ? ' ' : ''}${word1} ${word2}`,
      `${word1} ${connector} ${word2}`,
      `${article}${article ? ' ' : ''}${word2} ${word1}`,
      `${word1}${word2}` // Compound word
    ];

    const fallbackName = patterns[Math.floor(Math.random() * patterns.length)].trim();

    return JSON.stringify({
      name: fallbackName,
      model: 'fallback',
      source: 'fallback',
      type: type
    });
  }
}