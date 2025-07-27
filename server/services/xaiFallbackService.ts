import OpenAI from "openai";
import { secureLog } from '../utils/secureLogger';

interface FallbackOptions {
  apiName: string;
  context: any;
  desiredFormat: string;
}

export class XAIFallbackService {
  private openai: OpenAI;
  private models = ['grok-3', 'grok-4', 'grok-3-mini'];
  
  constructor() {
    this.openai = new OpenAI({
      baseURL: "https://api.x.ai/v1",
      apiKey: process.env.XAI_API_KEY
    });
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
    const prompt = `Generate ${options.count} ${options.type} ${
      options.word ? `related to "${options.word}"` : ''
    }${options.theme ? ` with theme "${options.theme}"` : ''}.
Return as JSON array of objects with format: [{"word": "example", "score": 100}]
Words should be single words only, creative and contextually appropriate.`;

    try {
      for (const model of this.models) {
        try {
          const response = await this.openai.chat.completions.create({
            model,
            messages: [
              { role: 'system', content: 'You are a linguistic expert generating contextual word associations.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.9,
            max_tokens: 500,
            response_format: { type: 'json_object' }
          });

          const content = response.choices[0]?.message?.content;
          if (content) {
            const parsed = JSON.parse(content);
            const words = parsed.words || parsed.results || parsed.data || parsed;
            
            if (Array.isArray(words)) {
              return words.map((item: any, index: number) => ({
                word: typeof item === 'string' ? item : item.word,
                score: 100 - index * 5 // Simulated score
              }));
            }
          }
        } catch (error) {
          secureLog.debug(`XAI Datamuse fallback failed with ${model}:`, error);
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
    const prompt = `Generate ${options.count} ${options.type === 'artists' ? 'band/artist names' : 'song titles'} ${
      options.genre ? `in the ${options.genre} genre` : ''
    }${options.mood ? ` with ${options.mood} mood` : ''}.
Return as JSON array: ${options.type === 'artists' 
  ? '[{"name": "Artist Name", "genres": ["genre1"], "popularity": 70}]'
  : '[{"name": "Song Title", "artists": [{"name": "Artist"}], "popularity": 80}]'}`;

    try {
      for (const model of this.models) {
        try {
          const response = await this.openai.chat.completions.create({
            model,
            messages: [
              { role: 'system', content: 'You are a music expert generating realistic artist and track names.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.9,
            max_tokens: 500,
            response_format: { type: 'json_object' }
          });

          const content = response.choices[0]?.message?.content;
          if (content) {
            const parsed = JSON.parse(content);
            const items = parsed.artists || parsed.tracks || parsed.results || parsed.data || parsed;
            
            if (Array.isArray(items)) {
              return items.slice(0, options.count);
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