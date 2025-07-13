import OpenAI from "openai";

export class AINameGeneratorService {
  private openai: OpenAI | null = null;
  private recentWords: string[] = [];
  private maxRecentWords = 20;

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

    // Use latest available Grok models (July 2025) - Grok 3 prioritized for reliability
    const models = ["grok-3", "grok-4", "grok-3-mini"];
    
    for (const model of models) {
      try {
        console.log(`Attempting model: ${model}`);
        // Add randomization to force variety
        const randomSeed = Math.random().toString(36).substring(7);
        const timestamp = Date.now() % 10000;
        
        // Build varied prompts with explicit variety instructions and recent word exclusions
        const avoidWords = ['shadows', 'shadow', 'echoes', 'echo', 'whispers', 'whisper', 'midnight', 'darkness', 'twilight', 'sorrow', 'eclipse'].concat(this.recentWords);
        const avoidString = avoidWords.slice(0, 15).join(', '); // Limit to prevent overly long prompts
        
        const promptVariations = [
          `Invent a unique ${type === 'band' ? 'band' : 'song'} name. AVOID these overused words: ${avoidString}`,
          `Come up with an original ${type === 'band' ? 'band' : 'song'} name using unexpected words. DON'T use: ${avoidString}`, 
          `Generate a creative ${type === 'band' ? 'band' : 'song'} name (be unconventional). Never use: ${avoidString}`,
          `Think of a fresh ${type === 'band' ? 'band' : 'song'} name with unusual combinations. Exclude: ${avoidString}`,
          `Create an innovative ${type === 'band' ? 'band' : 'song'} name that nobody would expect. Skip: ${avoidString}`
        ];
        
        let prompt = promptVariations[Math.floor(Math.random() * promptVariations.length)];
        
        // Add context if provided
        if (genre || mood) {
          const context = [];
          if (genre) context.push(genre);
          if (mood) context.push(mood);
          const vibeWords = ['vibe', 'feel', 'style', 'mood', 'energy'];
          prompt += ` with a ${context.join(' ')} ${vibeWords[Math.floor(Math.random() * vibeWords.length)]}`;
        }
        
        // Add word count if specified
        if (wordCount) {
          prompt += `. Use exactly ${wordCount} word${wordCount > 1 ? 's' : ''}.`;
        } else {
          prompt += '.';
        }
        
        // Add randomization elements to ensure uniqueness
        const instructions = [
          'Reply with only the name, nothing else.',
          'Just give me the name.',
          'Name only.',
          'Only the name, please.',
          'Just the name.'
        ];
        
        prompt += ` ${instructions[Math.floor(Math.random() * instructions.length)]}`;
        prompt += ` [Seed: ${randomSeed}${timestamp}]`;

        // Configure parameters based on model capabilities
        const requestParams: any = {
          model: model,
          messages: [
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 30,
          temperature: 1.0
        };

        // Model-specific parameter configuration
        if (model === 'grok-4') {
          // Grok 4 - minimal parameters for maximum compatibility
          requestParams.top_p = 0.95;
        } else if (model.includes('grok-3')) {
          // Grok 3 variants - full parameter support
          requestParams.top_p = 0.9;
          requestParams.frequency_penalty = 0.8;
          requestParams.presence_penalty = 0.6;
        } else {
          // Other models - basic parameters
          requestParams.top_p = 0.9;
        }

        const response = await this.openai.chat.completions.create(requestParams);

        const generatedName = response.choices[0]?.message?.content?.trim() || "";
        
        if (generatedName) {
          // Very basic cleaning - just remove quotes and common prefixes
          let cleanName = generatedName
            .replace(/^["'""']|["'""']$/g, '') // Remove quotes
            .replace(/^(Here's |Here is |How about |Try |I suggest |The name is |Band name: |Song title: |Title: |Name: )/i, '')
            .replace(/[.!?:,]$/g, '') // Remove ending punctuation
            .trim();
          
          // Check word count and track words for future avoidance
          if (wordCount && cleanName.split(/\s+/).length === wordCount) {
            console.log(`Successfully generated name "${cleanName}" using model: ${model}`);
            this.trackRecentWords(cleanName);
            return JSON.stringify({
              name: cleanName,
              model: model,
              source: 'xAI',
              type: type
            });
          } else if (!wordCount && cleanName.length > 0 && cleanName.length < 100) {
            console.log(`Successfully generated name "${cleanName}" using model: ${model}`);
            this.trackRecentWords(cleanName);
            return JSON.stringify({
              name: cleanName,
              model: model,
              source: 'xAI',
              type: type
            });
          }
        }
        
      } catch (error: any) {
        console.log(`Model ${model} failed with error:`, error.message);
        console.log(`Error details:`, error.response?.data || error.code || 'No additional details');
        console.log(`Request params used:`, JSON.stringify(requestParams, null, 2));
      }
    }

    // If all models fail, return fallback with JSON format
    const fallbackName = this.generateFallbackName(type, genre, mood, wordCount);
    return JSON.stringify({
      name: fallbackName,
      model: 'fallback',
      source: 'fallback',
      type: type
    });
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
    const finalName = result.slice(0, count).join(' ');
    this.trackRecentWords(finalName);
    return finalName;
  }

  private trackRecentWords(name: string): void {
    // Extract individual words and add to recent words list
    const words = name.toLowerCase().split(/\s+/).map(word => 
      word.replace(/[^a-z]/g, '') // Remove punctuation
    ).filter(word => word.length > 2); // Only track meaningful words
    
    // Add new words to the front of the array
    this.recentWords.unshift(...words);
    
    // Keep only the most recent words
    this.recentWords = this.recentWords.slice(0, this.maxRecentWords);
    
    // Remove duplicates while preserving order
    this.recentWords = [...new Set(this.recentWords)];
  }
}