import OpenAI from "openai";
import { secureLog } from '../utils/secureLogger';

interface FallbackOptions {
  apiName: string;
  context: any;
  desiredFormat: string;
}

export class XAIFallbackService {
  private openai: OpenAI;
  private models = ['grok-beta', 'grok-2-1212', 'grok-vision-beta'];
  private cache = new Map<string, { data: any, timestamp: number }>();
  private cacheExpiry = 1000 * 60 * 30; // 30 minute cache
  
  constructor() {
    this.openai = new OpenAI({
      baseURL: "https://api.x.ai/v1",
      apiKey: process.env.XAI_API_KEY
    });
  }

  private getCacheKey(type: string, options: any): string {
    return `${type}_${JSON.stringify(options)}`;
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
    // Clean old cache entries
    if (this.cache.size > 100) {
      const oldestKey = Array.from(this.cache.keys())[0];
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Generate Datamuse-style word associations using XAI
   */
  async generateDatamuseFallback(options: {
    word?: string;
    theme?: string;
    type: 'adjectives' | 'nouns' | 'related';
    count: number;
  }): Promise<any[]> {
    // Check cache first
    const cacheKey = this.getCacheKey('datamuse', options);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      secureLog.debug('Using cached Datamuse fallback data');
      return cached;
    }

    // Create context-aware prompts for different query types
    const contextPrompts = {
      adjectives: `Generate ${options.count} descriptive adjectives${
        options.word ? ` that would naturally describe "${options.word}"` : ''
      }${options.theme ? ` in the context of ${options.theme} music` : ''}.
Focus on evocative, poetic words suitable for band/song names.
Include both common and unique adjectives.`,
      
      nouns: `Generate ${options.count} evocative nouns${
        options.word ? ` semantically related to "${options.word}"` : ''
      }${options.theme ? ` in the context of ${options.theme} music` : ''}.
Include concrete objects, abstract concepts, and places.
Focus on words with strong imagery.`,
      
      related: `Generate ${options.count} words conceptually associated with "${options.word}"${
        options.theme ? ` in the context of ${options.theme} music` : ''
      }.
Include various parts of speech and semantic relationships.
Focus on creative, unexpected connections.`
    };

    const prompt = contextPrompts[options.type] + `
Return as JSON object with "words" array: {"words": [{"word": "example", "score": 100}]}
Words should be single words only, no compounds or phrases.`;

    try {
      // Try each model with different temperature settings
      const temperatures = [0.9, 0.8, 1.0];
      
      for (let i = 0; i < this.models.length; i++) {
        const model = this.models[i];
        const temperature = temperatures[i % temperatures.length];
        
        try {
          const response = await this.openai.chat.completions.create({
            model,
            messages: [
              { 
                role: 'system', 
                content: `You are a linguistic expert specializing in creative word associations for music naming.
Your suggestions should be poetic, evocative, and suitable for band or song names.
Understand subtle semantic relationships and cultural connotations.` 
              },
              { role: 'user', content: prompt }
            ],
            temperature,
            max_tokens: 500,
            response_format: { type: 'json_object' }
          });

          const content = response.choices[0]?.message?.content;
          if (content) {
            try {
              const parsed = JSON.parse(content);
              const words = parsed?.words || parsed?.results || parsed?.data || parsed;
              
              if (Array.isArray(words) && words.length > 0) {
                const results = words.map((item: any, index: number) => {
                  const word = typeof item === 'string' ? item : (item?.word || '');
                  const score = item?.score || (100 - index * 5);
                  return { word, score };
                }).filter((item: any) => 
                  item.word && 
                  typeof item.word === 'string' &&
                  item.word.length > 2 && 
                  item.word.length < 20 &&
                  /^[a-zA-Z]+$/.test(item.word)
                );
                
                if (results.length > 0) {
                  // Cache successful results
                  this.setCache(cacheKey, results);
                  return results;
                }
              }
            } catch (jsonError) {
              secureLog.debug(`Failed to parse XAI JSON response: ${jsonError}`);
            }
          }
        } catch (error) {
          secureLog.debug(`XAI Datamuse fallback failed with ${model} at temp ${temperature}:`, error);
        }
      }
    } catch (error) {
      secureLog.error('XAI Datamuse fallback failed completely:', error);
    }

    return [];
  }

  /**
   * Generate Spotify-style artist/track data using XAI
   */
  async generateSpotifyFallback(options: {
    genre?: string;
    mood?: string;
    type: 'artists' | 'tracks';
    count: number;
  }): Promise<any[]> {
    // Check cache first
    const cacheKey = this.getCacheKey('spotify', options);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      secureLog.debug('Using cached Spotify fallback data');
      return cached;
    }

    // Enhanced context-aware prompts
    const genreContext = options.genre ? `in the ${options.genre} genre` : '';
    const moodContext = options.mood ? `with ${options.mood} mood/vibe` : '';
    
    const systemPrompts = {
      artists: `You are a music industry expert with deep knowledge of band/artist naming conventions.
Generate realistic artist names that feel authentic to the ${options.genre || 'general'} music scene.
Consider cultural relevance and genre-specific naming patterns.`,
      
      tracks: `You are a songwriter and music producer who understands song naming conventions.
Generate song titles that capture the essence of ${options.genre || 'various'} music.
Consider lyrical themes, emotional resonance, and genre-typical title structures.`
    };

    const prompt = `Generate ${options.count} ${options.type === 'artists' ? 'unique band/artist names' : 'compelling song titles'} ${genreContext} ${moodContext}.
${options.type === 'artists' ? 
  'Include both established-sounding and fresh, innovative names.' : 
  'Include both poetic/abstract titles and more direct, narrative ones.'}

Return as JSON object with "${options.type}" array:
${options.type === 'artists' 
  ? '{"artists": [{"name": "Artist Name", "genres": ["genre1", "genre2"], "popularity": 70}]}'
  : '{"tracks": [{"name": "Song Title", "artists": [{"name": "Artist"}], "popularity": 80}]}'}`;

    try {
      for (const model of this.models) {
        try {
          const response = await this.openai.chat.completions.create({
            model,
            messages: [
              { role: 'system', content: systemPrompts[options.type] },
              { role: 'user', content: prompt }
            ],
            temperature: options.type === 'artists' ? 0.85 : 0.9, // Slightly lower for artist names
            max_tokens: 600,
            response_format: { type: 'json_object' }
          });

          const content = response.choices[0]?.message?.content;
          if (content) {
            const parsed = JSON.parse(content);
            const items = parsed[options.type] || parsed.results || parsed.data || [];
            
            if (Array.isArray(items)) {
              // Enhance with proper formatting
              const results = items.slice(0, options.count).map((item: any, index: number) => {
                if (options.type === 'artists') {
                  return {
                    id: `fallback-artist-${Date.now()}-${index}`,
                    name: item.name || item,
                    genres: item.genres || [options.genre || 'alternative'].filter(Boolean),
                    popularity: item.popularity || Math.floor(Math.random() * 30) + 50
                  };
                } else {
                  return {
                    id: `fallback-track-${Date.now()}-${index}`,
                    name: item.name || item,
                    artists: item.artists || [{ name: 'Various Artists' }],
                    popularity: item.popularity || Math.floor(Math.random() * 30) + 40
                  };
                }
              });
              
              // Cache successful results
              this.setCache(cacheKey, results);
              return results;
            }
          }
        } catch (error) {
          secureLog.debug(`XAI Spotify fallback failed with ${model}:`, error);
        }
      }
    } catch (error) {
      secureLog.error('XAI Spotify fallback failed completely:', error);
    }

    return [];
  }

  /**
   * Generate Last.fm-style genre vocabulary using XAI
   */
  async generateLastFmFallback(genre: string): Promise<{
    genreTerms: string[];
    descriptiveWords: string[];
    confidence: number;
  }> {
    const prompt = `For the ${genre} music genre, generate:
1. 5 genre-specific terms
2. 10 descriptive words commonly associated with this genre
Return as JSON: {"genreTerms": ["term1"], "descriptiveWords": ["word1"]}`;

    try {
      for (const model of this.models) {
        try {
          const response = await this.openai.chat.completions.create({
            model,
            messages: [
              { role: 'system', content: 'You are a music genre expert with deep knowledge of musical styles.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.8,
            max_tokens: 300,
            response_format: { type: 'json_object' }
          });

          const content = response.choices[0]?.message?.content;
          if (content) {
            const parsed = JSON.parse(content);
            return {
              genreTerms: parsed.genreTerms || [],
              descriptiveWords: parsed.descriptiveWords || [],
              confidence: 0.7 // Indicates AI fallback
            };
          }
        } catch (error) {
          secureLog.debug(`XAI Last.fm fallback failed with ${model}:`, error);
        }
      }
    } catch (error) {
      secureLog.error('XAI Last.fm fallback failed completely:', error);
    }

    return {
      genreTerms: [genre],
      descriptiveWords: [],
      confidence: 0.3
    };
  }

  /**
   * Generate ConceptNet-style concept associations using XAI
   */
  async generateConceptNetFallback(word: string, type: 'general' | 'emotional' | 'genre'): Promise<string[]> {
    const prompts = {
      general: `List 10 concepts strongly associated with "${word}". Single words only.`,
      emotional: `List 10 emotional or feeling words associated with "${word}". Single words only.`,
      genre: `List 10 cultural or stylistic concepts associated with "${word}" music. Single words only.`
    };

    const prompt = prompts[type] + ' Return as JSON array: ["word1", "word2", ...]';

    try {
      for (const model of this.models) {
        try {
          const response = await this.openai.chat.completions.create({
            model,
            messages: [
              { role: 'system', content: 'You are a semantic association expert understanding conceptual relationships.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.8,
            max_tokens: 200,
            response_format: { type: 'json_object' }
          });

          const content = response.choices[0]?.message?.content;
          if (content) {
            const parsed = JSON.parse(content);
            const words = parsed.words || parsed.concepts || parsed.associations || parsed;
            
            if (Array.isArray(words)) {
              return words.filter((w: any) => 
                typeof w === 'string' && 
                w.length > 2 && 
                /^[a-zA-Z]+$/.test(w)
              ).slice(0, 10);
            }
          }
        } catch (error) {
          secureLog.debug(`XAI ConceptNet fallback failed with ${model}:`, error);
        }
      }
    } catch (error) {
      secureLog.error('XAI ConceptNet fallback failed completely:', error);
    }

    return [];
  }
}

// Export singleton instance
export const xaiFallbackService = new XAIFallbackService();