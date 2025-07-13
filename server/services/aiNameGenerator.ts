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
          const wordCountInfo = wordCount ? ` using exactly ${wordCount} word${wordCount > 1 ? 's' : ''}` : '';
          
          // Create varied prompts based on type
          let prompt;
          if (model === 'grok-3-mini') {
          // Simpler prompts for Grok 3 mini
          const simplePrompts = type === 'band' ? [
            `Create a unique${genreInfo} band name with${moodInfo} energy${wordCountInfo}. Avoid overused words like "Echo", "Shadow", "Fire". Make it creative and memorable. Just return the name, nothing else.`,
            `Generate a cool${genreInfo} band name that sounds${moodInfo}${wordCountInfo}. Skip tired formulas like "Echoes of" or "The Dark". Be original. Return only the name.`,
            `Invent a${genreInfo} band name with${moodInfo} vibes${wordCountInfo}. Think fresh and unexpected. Make it catchy. Name only.`,
            `Craft a memorable${genreInfo} band name with${moodInfo} character${wordCountInfo}. Avoid clichés. Be creative and surprising. Name only.`,
            `Dream up a catchy${genreInfo} band name that embodies${moodInfo} spirit${wordCountInfo}. Mix unexpected elements. Be original. Name only.`
          ] : [
            `Create a unique${genreInfo} song title with${moodInfo} feeling${wordCountInfo}. Avoid overused patterns like "Echoes of". Make it poetic and memorable. Just return the title, nothing else.`,
            `Generate a cool${genreInfo} song title that sounds${moodInfo}${wordCountInfo}. Skip clichés like "Shadow" or "Night". Be creative. Return only the title.`,
            `Invent a${genreInfo} song title with${moodInfo} vibes${wordCountInfo}. Think fresh and artistic. Title only.`,
            `Craft a striking${genreInfo} song title with${moodInfo} atmosphere${wordCountInfo}. Avoid predictable words. Be innovative. Title only.`,
            `Dream up an evocative${genreInfo} song title that captures${moodInfo} essence${wordCountInfo}. Mix unexpected imagery. Be memorable. Title only.`
          ];
          prompt = simplePrompts[Math.floor(Math.random() * simplePrompts.length)];
        } else {
          // More complex prompts for other models
          const randomSeed = Math.random();
          const complexPrompts = type === 'band' ? [
            `Generate a wildly creative${genreInfo} band name with${moodInfo} energy${wordCountInfo}. Seed: ${randomSeed}. Avoid clichés like "Echoes of", "Shadow", "Dark". Create something completely unique and fresh. IMPORTANT: Use exactly ${wordCount || 3} words only. Just the name!`,
            `Invent an unforgettable${genreInfo} band name that captures${moodInfo} vibes${wordCountInfo}. Random: ${randomSeed}. Avoid overused words like "Echo", "Shadow", "Fire", "Night". Be bold and original! IMPORTANT: Exactly ${wordCount || 3} words only. Return only the band name.`,
            `Create a${genreInfo} band name that screams${moodInfo} attitude${wordCountInfo}. Variation: ${randomSeed}. Don't use tired formulas - think of something musicians would actually choose. IMPORTANT: Must be exactly ${wordCount || 3} words. Name only!`,
            `Dream up a${genreInfo} band name with${moodInfo} soul${wordCountInfo}. Randomizer: ${randomSeed}. Mix unexpected elements, use wordplay, avoid predictable patterns. IMPORTANT: Exactly ${wordCount || 3} words only. Just the name!`,
            `Craft a unique${genreInfo} band name with${moodInfo} character${wordCountInfo}. Seed: ${randomSeed}. Think like a real musician - be creative, not formulaic. IMPORTANT: Use exactly ${wordCount || 3} words only. Just the name!`,
            `Invent a fresh${genreInfo} band name that embodies${moodInfo} feelings${wordCountInfo}. Random: ${randomSeed}. Surprise me with something nobody would expect! IMPORTANT: Exactly ${wordCount || 3} words only. Return only the band name.`
          ] : [
            `Generate a poetic${genreInfo} song title with${moodInfo} emotion${wordCountInfo}. Seed: ${randomSeed}. Avoid overused patterns like "Echoes of". Create something unique and evocative. IMPORTANT: Use exactly ${wordCount || 2} words only. Just the title!`,
            `Invent a memorable${genreInfo} song title that feels${moodInfo}${wordCountInfo}. Random: ${randomSeed}. Skip clichés like "Shadow", "Night", "Dreams". Be artistic and original! IMPORTANT: Exactly ${wordCount || 2} words only. Return only the song title.`,
            `Create a${genreInfo} song title that captures${moodInfo} essence${wordCountInfo}. Variation: ${randomSeed}. Think of something quotable but avoid tired formulas. IMPORTANT: Must be exactly ${wordCount || 2} words. Title only!`,
            `Dream up a${genreInfo} song title with${moodInfo} spirit${wordCountInfo}. Randomizer: ${randomSeed}. Mix unexpected imagery, be surprising and fresh. IMPORTANT: Exactly ${wordCount || 2} words only. Just the title!`,
            `Craft a striking${genreInfo} song title with${moodInfo} atmosphere${wordCountInfo}. Seed: ${randomSeed}. Avoid predictable words - be innovative and memorable. IMPORTANT: Use exactly ${wordCount || 2} words only. Just the title!`,
            `Invent a compelling${genreInfo} song title that channels${moodInfo} energy${wordCountInfo}. Random: ${randomSeed}. Think like a songwriter - be creative, not formulaic. IMPORTANT: Exactly ${wordCount || 2} words only. Return only the song title.`
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
    
    // Common repetitive patterns to avoid
    const avoidPatterns = [
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
      /^remnants of /,
      /^the dark /,
      /^midnight /,
      /^shadow /,
      /^black /
    ];
    
    return avoidPatterns.some(pattern => pattern.test(lowerName));
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