import OpenAI from "openai";
import { xaiRateLimiter, withRetry } from '../utils/rateLimiter';
import { secureLog } from '../utils/secureLogger';
import { nameQualityControl } from './nameQualityControl';

export class AINameGeneratorService {
  private openai: OpenAI | null = null;
  private recentWords: string[] = [];
  private maxRecentWords = 30; // Increased to track more words
  private modelRotation = 0; // Track model rotation for variety
  
  // Expanded forbidden words list
  private forbiddenWords = new Set([
    // Common overused music terms
    'shadow', 'echo', 'dream', 'midnight', 'fire', 'ice', 'storm', 
    'dark', 'light', 'night', 'soul', 'heart', 'love', 'forever',
    'always', 'tonight', 'rain', 'sky', 'moon', 'star', 'sun',
    // Clichéd combinations
    'velvet', 'cosmic', 'neon', 'crystal', 'diamond', 'golden',
    'silver', 'broken', 'fallen', 'rising', 'burning', 'frozen',
    // Additional overused terms
    'whisper', 'scream', 'thunder', 'lightning', 'heaven', 'hell',
    'angel', 'demon', 'phoenix', 'dragon', 'wolf', 'lion',
    // Prevent repetitive patterns (like quartz variations)
    'quartz', 'quartzine', 'quartzian', 'quantum', 'vortex', 
    'odyssey', 'frontier', 'abyss', 'abyssal', 'anthem'
  ]);

  constructor() {
    // Initialize OpenAI only if API key is available
    if (process.env.XAI_API_KEY) {
      try {
        this.openai = new OpenAI({
          baseURL: "https://api.x.ai/v1",
          apiKey: process.env.XAI_API_KEY
        });
      } catch (error) {
        secureLog.error("Failed to initialize OpenAI client:", error);
        this.openai = null;
      }
    }
  }

  async generateAIName(type: 'band' | 'song', genre?: string, mood?: string, wordCount?: number, contextExamples?: string[]): Promise<string> {
    // If OpenAI client is not available, use fallback
    if (!this.openai) {
      return this.generateFallbackName(type, genre, mood, wordCount);
    }

    // Use latest available Grok models with rotation for variety
    const models = ["grok-3", "grok-4", "grok-3-mini"];
    
    // Model rotation: cycle through models to ensure variety
    const startModelIndex = this.modelRotation % models.length;
    this.modelRotation++; // Increment for next generation
    
    // Reorder models array starting from rotation index
    const rotatedModels = [
      ...models.slice(startModelIndex),
      ...models.slice(0, startModelIndex)
    ];
    
    for (const model of rotatedModels) {
      // Try each model up to 1 time for faster response
      for (let attempt = 0; attempt < 1; attempt++) {
        try {
          secureLog.debug(`Attempting model: ${model} (rotation: ${this.modelRotation}, attempt ${attempt + 1})`);
          // Add randomization to force variety
          const randomSeed = Math.random().toString(36).substring(7);
          const timestamp = Date.now() % 10000;
          
          // For "4+" option (wordCount >= 4), use dynamic range of 4-10 words
          const dynamicWordCount = wordCount && wordCount >= 4 ? 
            Math.floor(Math.random() * 7) + 4 : // 4-10 words for "4+" option
            wordCount;
          
          // Dynamic temperature based on word count
          // Higher temperature for longer names to encourage creativity
          const dynamicTemperature = this.calculateDynamicTemperature(dynamicWordCount || wordCount || 2);
        
        // Build the system and user prompts based on type
        let systemPrompt: string;
        let userPrompt: string;
        
        if (type === 'band') {
          systemPrompt = `You are a creative naming specialist. Generate band names according to this JSON specification:
{
  "task": "Generate unique band name",
  "requirements": {
    "variety": "CRITICAL: Introduce entirely new vocabulary, themes, and stylistic approaches with EVERY generation",
    "mental_reset": "Reset your creative approach completely between requests - no patterns from previous generations",
    "originality": "Actively avoid common naming tropes (no 'The [Adjective] [Nouns]', no 'Shadow/Echo/Dream' clichés)",
    "exploration": "Explore unexpected linguistic territories and novel word combinations",
    "word_count": "Match exact requested word count (1-10 words)",
    "selection": "Internally brainstorm 5 names using different conceptual frameworks, select most original"
  },
  "output_format": {
    "structure": "JSON object with single key",
    "key": "band",
    "value": "string containing the band name",
    "example": {"band": "Kaleidoscope Breakfast"}
  },
  "forbidden_patterns": ["The [X] [Y]", "Shadow/Echo/Dream/Midnight", "Fire/Ice/Storm", "Dark/Light/Night"],
  "forbidden_words": ${JSON.stringify(Array.from(this.forbiddenWords))},
  "creative_direction": "Surprise and delight through fresh perspectives and unexpected word pairings"
}`;
          
          // Build mood/genre context
          const moodOrGenre = [];
          if (mood) moodOrGenre.push(mood);
          if (genre) moodOrGenre.push(genre);
          const context = moodOrGenre.length > 0 ? moodOrGenre.join(' ') : 'any style';
          
          // Add genre-specific instructions with real examples
          let genreInstructions = '';
          let examplesText = '';
          
          // Include real examples from Spotify/Last.fm if available
          if (contextExamples && contextExamples.length > 0) {
            const examplesSample = contextExamples.slice(0, 5).join(', ');
            examplesText = `\nStudy these real ${genre} ${type} names for inspiration: ${examplesSample}`;
          }
          
          if (genre?.toLowerCase() === 'jazz') {
            genreInstructions = '\nIMPORTANT: The name must evoke jazz music. Think of smoky clubs, saxophones, swing, bebop, improvisation, brass instruments, and jazz legends. Avoid electronic or futuristic terms.';
          } else if (genre?.toLowerCase() === 'electronic') {
            genreInstructions = '\nIMPORTANT: The name must evoke electronic music. Think of synthesizers, circuits, digital sounds, and modern technology.';
          } else if (genre?.toLowerCase() === 'rock') {
            genreInstructions = '\nIMPORTANT: The name must evoke rock music. Think of power, rebellion, guitars, and raw energy.';
          } else if (genre?.toLowerCase() === 'reggae') {
            genreInstructions = '\nIMPORTANT: The name must evoke reggae music. Think of islands, roots, consciousness, peace, Rastafari culture, and Caribbean vibes.';
          } else if (genre?.toLowerCase() === 'country') {
            genreInstructions = '\nIMPORTANT: The name must evoke country music. Think of rural life, trucks, whiskey, heartland values, and Southern culture.';
          }
          
          // Build user prompt with API context
          userPrompt = `{
  "request": {
    "mood_genre": "${context}",
    "word_count": ${dynamicWordCount || 2}
  },
  "api_context": ${contextExamples && contextExamples.length > 0 ? `{
    "discovered_vocabulary": "${contextExamples.slice(0, 15).join(', ')}",
    "sources": {
      "datamuse": "Linguistic patterns, rhymes, semantic relationships",
      "spotify": "Real ${genre || 'music'} artist naming trends",
      "lastfm": "Genre-specific vocabulary and cultural references",
      "conceptnet": "Conceptual associations and emotional connections"
    },
    "instruction": "Transform these API discoveries into entirely new creative combinations"
  }` : 'null'}
}${genreInstructions}${examplesText}`;
        } else {
          // For songs, use the exact JSON prompt structure requested
          systemPrompt = `You are a creative song title specialist. Generate song names according to this JSON specification:
{
  "task": "Generate unique song title",
  "requirements": {
    "perpetual_originality": "ESSENTIAL: Explore uncharted linguistic territory with EVERY generation",
    "fresh_vocabulary": "Introduce new words, unique emotional angles, and novel imagery never used before",
    "poetic_thinking": "Think like a poet discovering language for the first time",
    "emotional_capture": "Capture fleeting moments, emotions, or stories through unexpected word pairings",
    "word_count": "Match exact requested word count (1-10 words)",
    "selection": "Create 5 distinct titles using radically different approaches, select most evocative"
  },
  "output_format": {
    "structure": "JSON object with single key",
    "key": "song",
    "value": "string containing the song title",
    "example": {"song": "Velvet Whispers in Binary"}
  },
  "forbidden_patterns": ["Heart/Soul/Love", "Tonight/Forever/Always", "Dream/Shadow/Echo", "Fire/Rain/Sky"],
  "forbidden_words": ${JSON.stringify(Array.from(this.forbiddenWords))},
  "creative_direction": "Evoke emotions through novel imagery and unexpected linguistic discoveries"
}`;
          
          // Build mood/genre context
          const moodOrGenre = [];
          if (mood) moodOrGenre.push(mood);
          if (genre) moodOrGenre.push(genre);
          const context = moodOrGenre.length > 0 ? moodOrGenre.join(' ') : 'any style';
          
          // Add genre-specific instructions with real examples
          let genreInstructions = '';
          let examplesText = '';
          
          // Include real examples from Spotify/Last.fm if available
          if (contextExamples && contextExamples.length > 0) {
            const examplesSample = contextExamples.slice(0, 5).join(', ');
            examplesText = `\nStudy these real ${genre} ${type} names for inspiration: ${examplesSample}`;
          }
          
          if (genre?.toLowerCase() === 'jazz') {
            genreInstructions = '\nIMPORTANT: The name must evoke jazz music. Think of smoky clubs, saxophones, swing, bebop, improvisation, brass instruments, and jazz legends. Avoid electronic or futuristic terms.';
          } else if (genre?.toLowerCase() === 'electronic') {
            genreInstructions = '\nIMPORTANT: The name must evoke electronic music. Think of synthesizers, circuits, digital sounds, and modern technology.';
          } else if (genre?.toLowerCase() === 'rock') {
            genreInstructions = '\nIMPORTANT: The name must evoke rock music. Think of power, rebellion, guitars, and raw energy.';
          } else if (genre?.toLowerCase() === 'reggae') {
            genreInstructions = '\nIMPORTANT: The name must evoke reggae music. Think of islands, roots, consciousness, peace, Rastafari culture, and Caribbean vibes.';
          } else if (genre?.toLowerCase() === 'country') {
            genreInstructions = '\nIMPORTANT: The name must evoke country music. Think of rural life, trucks, whiskey, heartland values, and Southern culture.';
          }
          
          // Build user prompt with API context for songs
          userPrompt = `{
  "request": {
    "mood_genre": "${context}",
    "word_count": ${dynamicWordCount || 3}
  },
  "api_context": ${contextExamples && contextExamples.length > 0 ? `{
    "discovered_vocabulary": "${contextExamples.slice(0, 15).join(', ')}",
    "sources": {
      "datamuse": "Linguistic patterns, rhymes, semantic relationships for songs",
      "spotify": "Real ${genre || 'music'} song title patterns and trends",
      "lastfm": "Genre-specific lyrical vocabulary and themes",
      "conceptnet": "Emotional associations and conceptual connections"
    },
    "instruction": "Transform these API discoveries into emotionally evocative song titles"
  }` : 'null'}
}${genreInstructions}${examplesText}`;
        }
        
        // Add randomization seed to prevent identical responses
        userPrompt += `\n(Seed: ${randomSeed})`;

        // Configure parameters based on model capabilities
        const requestParams: any = {
          model: model,
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user",
              content: userPrompt
            }
          ],
          max_tokens: 30,
          temperature: dynamicTemperature,
          response_format: { type: "json_object" }
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

        const generatedContent = response.choices[0]?.message?.content?.trim() || "";
        
        if (generatedContent) {
          try {
            // Parse JSON response
            const parsed = JSON.parse(generatedContent);
            const cleanName = type === 'band' ? parsed.band : parsed.song;
            
            if (cleanName && typeof cleanName === 'string') {
              // Check if name contains recently used words
              const nameWords = cleanName.toLowerCase().split(/\s+/);
              const containsRecentWord = nameWords.some(word => 
                this.recentWords.slice(0, 5).includes(word.toLowerCase()) // Check against 5 most recent words
              );
              
              if (containsRecentWord) {
                secureLog.debug(`Rejected "${cleanName}" - contains recently used word`);
                continue; // Try again with same model
              }
              
              // Check for forbidden words
              const containsForbiddenWord = nameWords.some(word => 
                this.forbiddenWords.has(word.toLowerCase())
              );
              
              if (containsForbiddenWord) {
                secureLog.debug(`Rejected "${cleanName}" - contains forbidden word`);
                continue; // Try again with same model
              }
              
              // Check for duplicate words within the same name
              const uniqueWords = new Set(nameWords);
              if (uniqueWords.size !== nameWords.length) {
                secureLog.debug(`Rejected "${cleanName}" - contains duplicate words within the name`);
                continue; // Try again with same model
              }
              
              // Check word count and track words for future avoidance
              const actualWordCount = cleanName.split(/\s+/).length;
              const isValidWordCount = wordCount ? 
                (wordCount >= 4 ? actualWordCount >= 4 && actualWordCount <= 10 : actualWordCount === wordCount) :
                (cleanName.length > 0 && cleanName.length < 100);
                
              if (isValidWordCount) {
                // Skip quality check for performance - just track the words
                secureLog.info(`Successfully generated name "${cleanName}" using model: ${model}`);
                this.trackRecentWords(cleanName);
                return cleanName;
              }
            }
          } catch (parseError) {
            secureLog.error(`Failed to parse JSON response from model ${model}:`, generatedContent);
            continue;
          }
        }
        
        } catch (error: any) {
          secureLog.error(`Model ${model} failed with error:`, error.message);
          secureLog.debug(`Error details:`, error.response?.data || error.code || 'No additional details');
          // Continue to next attempt
        }
      }
    }

    // If all models fail, return fallback
    const fallbackName = this.generateFallbackName(type, genre, mood, wordCount);
    return fallbackName;
  }

  // Calculate dynamic temperature based on word count
  private calculateDynamicTemperature(wordCount: number): number {
    // Higher base temperatures with random variation to prevent patterns
    // Add random variation to break repetitive patterns
    
    let baseTemp: number;
    if (wordCount <= 2) {
      baseTemp = 1.2 + (wordCount - 1) * 0.1; // 1.2-1.3 for 1-2 words
    } else if (wordCount <= 4) {
      baseTemp = 1.4; // Higher for 3-4 words
    } else if (wordCount <= 7) {
      baseTemp = 1.5; // More creative for 5-7 words
    } else {
      baseTemp = 1.6; // Maximum creativity for 8-10 words
    }
    
    // Add random variation (±0.3) to prevent getting stuck in patterns
    const variation = (Math.random() - 0.5) * 0.6;
    return Math.max(0.9, Math.min(1.8, baseTemp + variation));
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
    
    // Also track word stems to prevent variations like quartz/quartzine/quartzian
    const stems = words.map(w => this.getWordStem(w));
    
    // Add new words and stems to the front of the array
    this.recentWords.unshift(...words, ...stems);
    
    // Keep only the most recent words
    this.recentWords = this.recentWords.slice(0, this.maxRecentWords);
    
    // Remove duplicates while preserving order
    this.recentWords = Array.from(new Set(this.recentWords));
    
    secureLog.debug(`Recent words tracked: ${this.recentWords.slice(0, 10).join(', ')}`);
  }
  
  private getWordStem(word: string): string {
    // Simple stemming to catch variations
    // Remove common suffixes to find root
    const suffixes = ['ine', 'ian', 'ium', 'ous', 'al', 'ic', 'ize', 'ify', 'ate', 'tion', 'sion'];
    let stem = word.toLowerCase();
    
    for (const suffix of suffixes) {
      if (stem.endsWith(suffix) && stem.length - suffix.length > 3) {
        stem = stem.slice(0, -suffix.length);
        break;
      }
    }
    
    return stem;
  }
}