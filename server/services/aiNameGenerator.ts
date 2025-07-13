import OpenAI from "openai";

export class AINameGeneratorService {
  private openai: OpenAI | null = null;

  constructor() {
    // Initialize OpenAI only if API key is available
    if (process.env.XAI_API_KEY) {
      try {
        this.openai = new OpenAI({
          baseURL: "https://api.x.ai/v1",
          apiKey: process.env.XAI_API_KEY
        });
      } catch (error) {
        console.log("Failed to initialize OpenAI client:", error);
        this.openai = null;
      }
    }
  }

  async generateAIName(type: 'band' | 'song', genre?: string, mood?: string, wordCount?: number): Promise<string> {
    // If OpenAI client is not available, use fallback
    if (!this.openai) {
      return this.generateFallbackName(type, genre, mood);
    }

    // Try different models in order of preference
    const models = ["grok-2-1212", "grok-2-vision-1212", "grok-3-mini"];
    
    for (const model of models) {
      let attempts = 0;
      const maxAttempts = 3; // Try up to 3 times per model to get a non-repetitive result
      
      while (attempts < maxAttempts) {
        try {
          attempts++;
          const genreInfo = genre ? ` ${genre}` : '';
          const moodInfo = mood ? ` ${mood}` : '';
          const typeText = type === 'band' ? 'band' : 'song title';
          const wordCountInfo = wordCount ? ` with ${wordCount} word${wordCount > 1 ? 's' : ''}` : '';
          
          // Create varied prompts based on type
          let prompt;
          if (model === 'grok-3-mini') {
          // Ultra-simple prompts - maximum creativity
          const simplePrompts = type === 'band' ? [
            `Imagine a random name for a${genreInfo} band${moodInfo}${wordCountInfo}.`,
            `Random band name${genreInfo}${moodInfo}${wordCountInfo}.`,
            `Band name${genreInfo}${moodInfo}${wordCountInfo}.`
          ] : [
            `Imagine a random name for a${genreInfo} song${moodInfo}${wordCountInfo}.`,
            `Random song title${genreInfo}${moodInfo}${wordCountInfo}.`,
            `Song title${genreInfo}${moodInfo}${wordCountInfo}.`
          ];
          prompt = simplePrompts[Math.floor(Math.random() * simplePrompts.length)];
        } else {
          // Ultra-simple prompts for maximum creativity
          const randomSeed = Math.random();
          const complexPrompts = type === 'band' ? [
            `Imagine a random name for a${genreInfo} band${moodInfo}${wordCountInfo}.`,
            `Random band name${genreInfo}${moodInfo}${wordCountInfo}. Seed ${randomSeed}.`,
            `Band name${genreInfo}${moodInfo}${wordCountInfo}.`,
            `Create a${genreInfo} band name${moodInfo}${wordCountInfo}.`
          ] : [
            `Imagine a random name for a${genreInfo} song${moodInfo}${wordCountInfo}.`,
            `Random song title${genreInfo}${moodInfo}${wordCountInfo}. Seed ${randomSeed}.`,
            `Song title${genreInfo}${moodInfo}${wordCountInfo}.`,
            `Create a${genreInfo} song title${moodInfo}${wordCountInfo}.`
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
          // Clean up the response - remove quotes, "Band name:", markdown, etc.
          let cleanName = generatedName
            .replace(/^(Band name|Song title|Name|Title):\s*/i, '')
            .replace(/^["']|["']$/g, '')
            .replace(/^\d+\.\s*/, '')
            .replace(/\*\*/g, '')  // Remove markdown bold
            .replace(/\*/g, '')    // Remove markdown italics
            .replace(/_{2,}/g, '') // Remove markdown underlines
            .trim();
          
          // Check for repetitive patterns and reject them
          if (cleanName && !this.isRepetitivePattern(cleanName)) {
            return cleanName;
          } else if (cleanName) {
            console.log(`Model ${model} generated repetitive pattern: "${cleanName}", retrying... (attempt ${attempts}/${maxAttempts})`);
          }
        }
        
        if (attempts >= maxAttempts) {
          console.log(`Model ${model} reached max attempts, trying next model...`);
          break;
        }
        
        } catch (error: any) {
          console.log(`Model ${model} failed on attempt ${attempts}:`, error.message);
          break; // Exit retry loop and try next model
        }
      }
      
      // If we reach here, this model failed or reached max attempts
      console.log(`Model ${model} failed after ${attempts} attempts, trying next model...`);
    }

    // If all models fail, return fallback
    return this.generateFallbackName(type, genre, mood);
  }

  private isRepetitivePattern(name: string): boolean {
    const lowerName = name.toLowerCase();
    
    // Common "X of Y" patterns to avoid
    const ofPatterns = [
      /^echoes of /,
      /^shadows of /,
      /^whispers of /,
      /^fragments of /,
      /^dreams of /,
      /^tales of /,
      /^sounds of /,
      /^visions of /,
      /^memories of /,
      /^spirits of /,
      /^ghosts of /,
      /^voices of /,
      /^shades of /,
      /^glimpses of /,
      /^traces of /,
      /^remnants of /
    ];
    
    // Overused words to avoid at any position
    const overusedWords = [
      'echoes', 'echo',
      'shadows', 'shadow',
      'whispers', 'whisper',
      'darkness', 'dark',
      'midnight',
      'sorrow', 'sorrows',
      'twilight',
      'ethereal',
      'enigma',
      'abyss'
    ];
    
    // Check for "X of Y" patterns
    if (ofPatterns.some(pattern => pattern.test(lowerName))) {
      return true;
    }
    
    // Check if name contains overused words
    const words = lowerName.split(/\s+/);
    
    // Check each word in the name
    for (const word of words) {
      if (overusedWords.includes(word)) {
        return true; // Reject if ANY overused word is found
      }
    }
    
    return false;
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