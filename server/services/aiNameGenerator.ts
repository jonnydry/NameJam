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
      return this.generateFallbackName(type, genre, mood, wordCount);
    }

    // Try different models in order of preference
    const models = ["grok-2-1212", "grok-2-vision-1212", "grok-3-mini"];
    
    for (const model of models) {
      try {
        // Build a very simple prompt
        let prompt = `Create a ${type === 'band' ? 'band' : 'song'} name`;
        
        // Add context if provided
        if (genre || mood) {
          const context = [];
          if (genre) context.push(genre);
          if (mood) context.push(mood);
          prompt += ` with a ${context.join(' ')} vibe`;
        }
        
        // Add word count if specified
        if (wordCount) {
          prompt += `. Use exactly ${wordCount} word${wordCount > 1 ? 's' : ''}.`;
        } else {
          prompt += '.';
        }
        
        // Simple instruction
        prompt += ' Reply with only the name, nothing else.';

        const response = await this.openai.chat.completions.create({
          model: model,
          messages: [
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 30,
          temperature: 1.0  // Maximum randomness
        });

        const generatedName = response.choices[0]?.message?.content?.trim() || "";
        
        if (generatedName) {
          // Very basic cleaning - just remove quotes and common prefixes
          let cleanName = generatedName
            .replace(/^["'""']|["'""']$/g, '') // Remove quotes
            .replace(/^(Here's |Here is |How about |Try |I suggest |The name is |Band name: |Song title: |Title: |Name: )/i, '')
            .replace(/[.!?:,]$/g, '') // Remove ending punctuation
            .trim();
          
          // Check word count
          if (wordCount && cleanName.split(/\s+/).length === wordCount) {
            return cleanName;
          } else if (!wordCount && cleanName.length > 0 && cleanName.length < 100) {
            return cleanName;
          }
        }
        
      } catch (error: any) {
        console.log(`Model ${model} failed:`, error.message);
      }
    }

    // If all models fail, return fallback
    return this.generateFallbackName(type, genre, mood, wordCount);
  }

  private generateFallbackName(type: 'band' | 'song', genre?: string, mood?: string, wordCount?: number): string {
    // Simple fallback generation
    const words = {
      adjectives: [
        'Crystal', 'Velvet', 'Golden', 'Silver', 'Crimson', 'Azure', 'Emerald',
        'Electric', 'Cosmic', 'Solar', 'Lunar', 'Stellar', 'Quantum', 'Digital',
        'Wild', 'Free', 'Bold', 'Brave', 'Fierce', 'Gentle', 'Silent', 'Loud',
        'Ancient', 'Modern', 'Timeless', 'Eternal', 'Infinite', 'Final', 'First',
        'Neon', 'Chrome', 'Violet', 'Scarlet', 'Cobalt', 'Amber', 'Jade'
      ],
      nouns: [
        'Phoenix', 'Dragon', 'Tiger', 'Eagle', 'Wolf', 'Lion', 'Hawk',
        'Ocean', 'Mountain', 'River', 'Desert', 'Forest', 'Storm', 'Lightning',
        'Dream', 'Vision', 'Memory', 'Hope', 'Faith', 'Glory', 'Honor',
        'Fire', 'Ice', 'Wind', 'Earth', 'Star', 'Moon', 'Sun',
        'Machine', 'Engine', 'Circuit', 'Wave', 'Signal', 'Code', 'Matrix',
        'Heart', 'Soul', 'Mind', 'Spirit', 'Force', 'Power', 'Light'
      ],
      verbs: [
        'Rising', 'Falling', 'Dancing', 'Flying', 'Running', 'Breaking', 'Building',
        'Burning', 'Freezing', 'Melting', 'Growing', 'Fading', 'Shining', 'Glowing'
      ]
    };
    
    const count = wordCount || (Math.random() < 0.5 ? 2 : 3);
    const result = [];
    
    // Build name based on word count
    if (count === 1) {
      result.push(words.nouns[Math.floor(Math.random() * words.nouns.length)]);
    } else if (count === 2) {
      result.push(words.adjectives[Math.floor(Math.random() * words.adjectives.length)]);
      result.push(words.nouns[Math.floor(Math.random() * words.nouns.length)]);
    } else if (count === 3) {
      if (type === 'band' && Math.random() < 0.3) {
        result.push('The');
        result.push(words.adjectives[Math.floor(Math.random() * words.adjectives.length)]);
        result.push(words.nouns[Math.floor(Math.random() * words.nouns.length)]);
      } else {
        result.push(words.verbs[Math.floor(Math.random() * words.verbs.length)]);
        result.push(words.adjectives[Math.floor(Math.random() * words.adjectives.length)]);
        result.push(words.nouns[Math.floor(Math.random() * words.nouns.length)]);
      }
    } else {
      // For 4+ words, create a phrase
      const connectors = ['of', 'and', 'in', 'through', 'beyond'];
      result.push(words.adjectives[Math.floor(Math.random() * words.adjectives.length)]);
      result.push(words.nouns[Math.floor(Math.random() * words.nouns.length)]);
      result.push(connectors[Math.floor(Math.random() * connectors.length)]);
      result.push(words.nouns[Math.floor(Math.random() * words.nouns.length)]);
      
      // Add more words if needed
      while (result.length < count && result.length < 6) {
        if (result.length === count - 1) {
          result.push(words.nouns[Math.floor(Math.random() * words.nouns.length)]);
        } else {
          result.push(words.adjectives[Math.floor(Math.random() * words.adjectives.length)]);
        }
      }
    }
    
    // Ensure we have exactly the right word count
    return result.slice(0, count).join(' ');
  }
}