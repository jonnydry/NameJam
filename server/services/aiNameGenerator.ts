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

  async generateAIName(type: 'band' | 'song', genre?: string, mood?: string, wordCount?: number, contextExamples?: string[]): Promise<string> {
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
        
        // Build the system and user prompts based on type
        let systemPrompt: string;
        let userPrompt: string;
        
        if (type === 'band') {
          systemPrompt = "You are a highly creative AI specializing in generating unique, entertaining band names. Your outputs must be varied and surprising each time, even for identical inputs, to ensure repeatable entertainment. Avoid repeating names across generations. Do not use real-world band names; invent original ones. Based on the user's specified mood or genre and the exact number of words (1 to 6), internally generate 5 band names. Each name must consist precisely of that number of words. Then, decide on the best one among them based on creativity, relevance to the mood/genre, and entertainment value. Output strictly in JSON format with one key: 'band' (a single string). No additional text.";
          
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
          
          userPrompt = `Mood or genre: ${context}${genreInstructions}${examplesText}\nNumber of words: ${wordCount || 2}`;
        } else {
          // For songs, use the exact JSON prompt structure requested
          systemPrompt = "You are a highly creative AI specializing in generating unique, entertaining song names. Your outputs must be varied and surprising each time, even for identical inputs, to ensure repeatable entertainment. Avoid repeating names across generations. Do not use real-world song names; invent original ones. Based on the user's specified mood or genre and the exact number of words (1 to 6), internally generate 5 song names. Each name must consist precisely of that number of words. Then, decide on the best one among them based on creativity, relevance to the mood/genre, and entertainment value. Output strictly in JSON format with one key: 'song' (a single string). No additional text.";
          
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
          
          userPrompt = `Mood or genre: ${context}${genreInstructions}${examplesText}\nNumber of words: ${wordCount || 3}`;
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
          temperature: 1.2,
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
                console.log(`Rejected "${cleanName}" - contains recently used word`);
                continue; // Try again with same model
              }
              
              // Check word count and track words for future avoidance
              if (wordCount && cleanName.split(/\s+/).length === wordCount) {
                console.log(`Successfully generated name "${cleanName}" using model: ${model}`);
                this.trackRecentWords(cleanName);
                return cleanName;
              } else if (!wordCount && cleanName.length > 0 && cleanName.length < 100) {
                console.log(`Successfully generated name "${cleanName}" using model: ${model}`);
                this.trackRecentWords(cleanName);
                return cleanName;
              }
            }
          } catch (parseError) {
            console.log(`Failed to parse JSON response from model ${model}:`, generatedContent);
            continue;
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

    // If all models fail, return fallback
    const fallbackName = this.generateFallbackName(type, genre, mood, wordCount);
    return fallbackName;
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