import OpenAI from "openai";
import { xaiRateLimiter, withRetry } from '../utils/rateLimiter';

export class AINameGeneratorService {
  private openai: OpenAI | null = null;
  private recentWords: string[] = [];
  private maxRecentWords = 30; // Increased to track more words

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
      // Try each model up to 1 time for faster response
      for (let attempt = 0; attempt < 1; attempt++) {
        try {
          console.log(`Attempting model: ${model} (attempt ${attempt + 1})`);
          // Add randomization to force variety
          const randomSeed = Math.random().toString(36).substring(7);
          const timestamp = Date.now() % 10000;
        
        // Build enhanced prompts with creativity guidance and recent word exclusions
        const overusedWords = ['shadows', 'shadow', 'echoes', 'echo', 'whispers', 'whisper', 'midnight', 'darkness', 'twilight', 'sorrow', 'eclipse', 'velvet', 'cosmic', 'neon'];
        const recentWordsToAvoid = this.recentWords.slice(0, 10); // Focus on most recent 10 words
        const avoidWords = [...new Set([...recentWordsToAvoid, ...overusedWords])]; // Combine and deduplicate
        const avoidString = avoidWords.slice(0, 15).join(', '); // Show more words to avoid
        
        const creativityTechniques = [
          'unexpected color-object combinations',
          'scientific terms with emotional words',
          'geometric shapes meeting natural elements',
          'kitchen items as metaphors',
          'weather phenomena with urban elements',
          'architectural terms with organic words',
          'vintage technology with nature',
          'mathematical concepts with emotions',
          'textile words with cosmic elements',
          'transportation with abstract concepts'
        ];
        
        const promptVariations = type === 'band' ? [
          `Create a realistic band name that sounds like it could be a famous rock/alternative band. Think of names like Arctic Monkeys, Black Keys, Red Hot Chili Peppers, or Foo Fighters. MUST AVOID: ${avoidString}`,
          `Generate a memorable band name similar to successful bands like Pearl Jam, Stone Temple Pilots, or Kings of Leon. Make it catchy and pronounceable. FORBIDDEN: ${avoidString}`,
          `Think of a band name that would fit alongside bands like Radiohead, Coldplay, or Imagine Dragons. Keep it simple but distinctive. BANNED: ${avoidString}`,
          `Create a band name in the style of indie/alternative bands like The Strokes, White Stripes, or Vampire Weekend. PROHIBITED: ${avoidString}`,
          `Generate a band name that sounds like it belongs on a music festival lineup with bands like Fleet Foxes, Arcade Fire, or The National. AVOID: ${avoidString}`,
          `Think of a band name similar to successful acts like Florence + The Machine, Two Door Cinema Club, or Foster the People. EXCLUDE: ${avoidString}`,
          `Create a band name that would work for rock/indie bands like The XX, Tame Impala, or MGMT. Keep it realistic and memorable. NO: ${avoidString}`
        ] : [
          `Create a memorable song title that sounds like it could be a hit single. Think of titles like "Bohemian Rhapsody", "Sweet Child O' Mine", or "Mr. Brightside". AVOID: ${avoidString}`,
          `Generate a song title similar to classic hits like "Hotel California", "Stairway to Heaven", or "Come As You Are". FORBIDDEN: ${avoidString}`,
          `Think of a song title that would fit alongside hits like "Wonderwall", "Seven Nation Army", or "Use Somebody". BANNED: ${avoidString}`,
          `Create a song title in the style of popular songs like "Somebody That I Used to Know", "Pumped Up Kicks", or "Take Me to Church". PROHIBITED: ${avoidString}`,
          `Generate a song title that sounds like it belongs on the radio with songs like "Uptown Funk", "Shape of You", or "Blinding Lights". EXCLUDE: ${avoidString}`,
          `Think of a song title similar to hits like "Rolling in the Deep", "Bad Romance", or "Can't Stop the Feeling". NO: ${avoidString}`
        ];
        
        let prompt = promptVariations[Math.floor(Math.random() * promptVariations.length)];
        
        // Add enhanced context if provided
        if (genre || mood) {
          const context = [];
          if (genre) context.push(genre);
          if (mood) context.push(mood);
          
          const contextDescriptors = [
            'that captures the essence of',
            'reflecting the spirit of',
            'embodying the atmosphere of',
            'channeling the energy of',
            'expressing the feeling of',
            'inspired by the world of',
            'evoking the mood of'
          ];
          
          prompt += ` ${contextDescriptors[Math.floor(Math.random() * contextDescriptors.length)]} ${context.join(' ')} music`;
        }
        
        // Add word count and quality instructions
        if (wordCount) {
          prompt += `. IMPORTANT: Use exactly ${wordCount} word${wordCount > 1 ? 's' : ''} - no more, no less.`;
        } else {
          prompt += '. Keep it concise but memorable.';
        }
        
        // Enhanced instructions for realistic output
        const qualityInstructions = type === 'band' ? [
          'Make it sound like a real band that could exist. Reply with just the name.',
          'Keep it simple and memorable like successful bands. Just the name.',
          'Think of something people would actually say and remember. Name only.',
          'Make it realistic and catchy like bands on the radio. Only the name.',
          'Create something that sounds professional and marketable. Just the name.'
        ] : [
          'Make it sound like a real song title that could be a hit. Reply with just the title.',
          'Keep it memorable like songs people sing along to. Just the title.',
          'Think of something that would work on the radio. Title only.',
          'Make it catchy like popular songs everyone knows. Only the title.',
          'Create something that sounds like a real hit song. Just the title.'
        ];
        
        prompt += ` ${qualityInstructions[Math.floor(Math.random() * qualityInstructions.length)]}`;
        
        // Add subtle randomization to prevent identical responses
        prompt += ` (Variant: ${randomSeed.slice(0,3)})`;

        // Configure parameters based on model capabilities
        const requestParams: any = {
          model: model,
          messages: [
            {
              role: "system",
              content: `You are an expert ${type === 'band' ? 'band' : 'song'} naming specialist who creates realistic, commercially viable names that sound like they belong in the music industry.

CRITICAL: You MUST avoid using ANY of the forbidden words listed in the prompt. This is your top priority.

Your goal is to create ${type === 'band' ? 'band names' : 'song titles'} that:

REALISM STANDARDS:
- Sound like they could be real ${type === 'band' ? 'bands' : 'songs'} that exist today
- Are memorable and easy to pronounce
- Would work in professional music contexts
- Feel natural when spoken aloud
- Have commercial appeal like successful ${type === 'band' ? 'bands' : 'songs'}

STRUCTURAL GUIDELINES:
For ${wordCount} words:
${wordCount === 1 ? '- Single impactful words like "Radiohead" or "Nirvana"' : ''}
${wordCount === 2 ? '- Classic combinations like "Black Keys", "White Stripes", "Arctic Monkeys"' : ''}
${wordCount === 3 ? '- Popular patterns like "Red Hot Chili", "Foster the People", "Panic at the"' : ''}
${wordCount >= 4 ? '- Natural phrases that flow well, avoiding overly abstract combinations' : ''}

QUALITY REQUIREMENTS:
- Must sound like real ${type === 'band' ? 'band' : 'song'} names
- Should be memorable and catchy
- Avoid overly abstract or nonsensical combinations
- Keep it grounded and realistic
- Make it something people would actually use and remember`
            },
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 25,
          temperature: 1.2
        };

        // Model-specific parameter configuration
        if (model === 'grok-4') {
          // Grok 4 - minimal parameters for maximum compatibility
          requestParams.top_p = 0.95;
        } else if (model === 'grok-3') {
          // Grok 3 full - supports all parameters
          requestParams.top_p = 0.9;
          requestParams.frequency_penalty = 0.8;
          requestParams.presence_penalty = 0.6;
        } else if (model === 'grok-3-mini') {
          // Grok 3 mini - limited parameter support
          requestParams.top_p = 0.9;
          // No frequency_penalty or presence_penalty for mini
        } else {
          // Other models - basic parameters
          requestParams.top_p = 0.9;
        }

        const response = await xaiRateLimiter.execute(async () => {
          return withRetry(async () => {
            const resp = await this.openai!.chat.completions.create(requestParams);
            return resp;
          }, 1, 1000); // Reduced to 1 retry with 1 second delay for faster response
        });

        const generatedName = response.choices[0]?.message?.content?.trim() || "";
        
        if (generatedName) {
          // Very basic cleaning - just remove quotes and common prefixes
          let cleanName = generatedName
            .replace(/^["'""']|["'""']$/g, '') // Remove quotes
            .replace(/^(Here's |Here is |How about |Try |I suggest |The name is |Band name: |Song title: |Title: |Name: )/i, '')
            .replace(/[.!?:,]$/g, '') // Remove ending punctuation
            .trim();
          
          // Check if name contains recently used words
          const nameWords = cleanName.toLowerCase().split(/\s+/);
          const containsRecentWord = nameWords.some(word => 
            this.recentWords.slice(0, 5).includes(word.toLowerCase()) // Check against 5 most recent words
          );
          
          if (containsRecentWord) {
            console.log(`Rejected "${cleanName}" - contains recently used word`);
            continue; // Try again with same model
          }
          
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
          // Continue to next attempt
        }
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
    
    console.log(`Recent words tracked: ${this.recentWords.slice(0, 10).join(', ')}`);
  }
}