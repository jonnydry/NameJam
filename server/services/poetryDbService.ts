import { secureLog } from '../utils/secureLogger';
import { withRetry } from '../utils/rateLimiter';

interface PoetryLine {
  title: string;
  author: string;
  lines: string[];
  linecount: string;
}

interface PoetryContext {
  poeticPhrases: string[];
  vocabulary: string[];
  imagery: string[];
  themes: string[];
}

export class PoetryDbService {
  private cache = new Map<string, { data: PoetryContext; timestamp: number }>();
  private poetryBaseUrl = 'https://poetrydb.org';
  private readonly CACHE_TIMEOUT = 15 * 60 * 1000; // 15 minutes

  async getPoetryContext(genre?: string, mood?: string): Promise<PoetryContext> {
    const cacheKey = `poetry_${genre || 'all'}_${mood || 'all'}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TIMEOUT) {
      secureLog.debug('Using cached poetry context');
      return cached.data;
    }

    try {
      // Map genres and moods to poetry search terms
      const searchTerms = this.getPoetrySearchTerms(genre, mood);
      const poetryData = await this.fetchPoetryData(searchTerms);
      
      const context = this.extractPoetryContext(poetryData);
      
      // Cache the result
      this.cache.set(cacheKey, { data: context, timestamp: Date.now() });
      
      secureLog.info(`✅ Poetry context: ${context.poeticPhrases.length} phrases, ${context.vocabulary.length} words`);
      return context;
    } catch (error) {
      secureLog.error('Failed to fetch poetry context:', error);
      return this.getEmptyContext();
    }
  }

  private getPoetrySearchTerms(genre?: string, mood?: string): string[] {
    const terms: string[] = [];
    
    // Genre-based poetry mapping
    const genreMap: Record<string, string[]> = {
      'rock': ['thunder', 'storm', 'rebel', 'fire'],
      'jazz': ['night', 'moon', 'smoke', 'rhythm'],
      'folk': ['road', 'tree', 'wind', 'home'],
      'metal': ['darkness', 'death', 'rage', 'blood'],
      'electronic': ['dream', 'light', 'future', 'star'],
      'blues': ['rain', 'pain', 'soul', 'river'],
      'country': ['field', 'sunset', 'heart', 'road'],
      'hip-hop': ['street', 'city', 'struggle', 'rise'],
      'punk': ['rebel', 'chaos', 'break', 'scream'],
      'indie': ['wonder', 'dream', 'youth', 'lost'],
      'reggae': ['sun', 'island', 'peace', 'rhythm'],
      'classical': ['beauty', 'eternity', 'grace', 'sublime'],
      'jam band': ['journey', 'flow', 'cosmic', 'festival']
    };
    
    // Mood-based poetry mapping
    const moodMap: Record<string, string[]> = {
      'energetic': ['fire', 'dance', 'wild', 'bright'],
      'melancholic': ['sorrow', 'tears', 'memory', 'lost'],
      'mysterious': ['shadow', 'mist', 'secret', 'unknown'],
      'romantic': ['love', 'heart', 'kiss', 'passion'],
      'dark': ['night', 'death', 'grave', 'darkness'],
      'uplifting': ['light', 'hope', 'rise', 'dream'],
      'aggressive': ['war', 'rage', 'storm', 'break'],
      'peaceful': ['calm', 'gentle', 'quiet', 'serene'],
      'nostalgic': ['remember', 'past', 'youth', 'time'],
      'playful': ['laugh', 'dance', 'play', 'joy'],
      'spiritual': ['soul', 'heaven', 'divine', 'eternal'],
      'rebellious': ['rebel', 'break', 'wild', 'free']
    };
    
    if (genre && genreMap[genre]) {
      terms.push(...genreMap[genre]);
    }
    
    if (mood && moodMap[mood]) {
      terms.push(...moodMap[mood]);
    }
    
    // If no specific genre/mood, use general poetic terms
    if (terms.length === 0) {
      terms.push('love', 'time', 'dream', 'soul');
    }
    
    return terms;
  }

  private async fetchPoetryData(searchTerms: string[]): Promise<PoetryLine[]> {
    const allPoetry: PoetryLine[] = [];
    
    // Fetch poetry for each search term (limit to 3 terms for performance)
    const limitedTerms = searchTerms.slice(0, 3);
    
    for (const term of limitedTerms) {
      try {
        const url = `${this.poetryBaseUrl}/lines/${encodeURIComponent(term)}/author,title,lines`;
        
        const response = await withRetry(async () => {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`Poetry API error: ${res.status}`);
          return res;
        }, 2, 1000);
        
        const poems = await response.json();
        
        // Limit to 5 poems per search term
        if (Array.isArray(poems)) {
          allPoetry.push(...poems.slice(0, 5));
        }
      } catch (error) {
        secureLog.debug(`Failed to fetch poetry for term "${term}":`, error);
      }
    }
    
    return allPoetry;
  }

  private extractPoetryContext(poems: PoetryLine[]): PoetryContext {
    const poeticPhrases: Set<string> = new Set();
    const vocabulary: Set<string> = new Set();
    const imagery: Set<string> = new Set();
    const themes: Set<string> = new Set();
    
    for (const poem of poems) {
      if (!poem.lines || !Array.isArray(poem.lines)) continue;
      
      for (const line of poem.lines) {
        // Skip empty lines
        if (!line || line.trim().length === 0) continue;
        
        // Extract full lines as poetic phrases (limit length)
        if (line.length > 10 && line.length < 80) {
          poeticPhrases.add(line.trim());
        }
        
        // Extract meaningful words (3+ letters, not common words)
        const words = line.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
        const commonWords = new Set(['the', 'and', 'but', 'for', 'with', 'that', 'this', 'from', 'have', 'been', 'will', 'can', 'may', 'shall']);
        
        for (const word of words) {
          if (!commonWords.has(word)) {
            vocabulary.add(word);
            
            // Identify imagery words (nature, emotions, etc.)
            if (this.isImageryWord(word)) {
              imagery.add(word);
            }
            
            // Identify thematic words
            if (this.isThematicWord(word)) {
              themes.add(word);
            }
          }
        }
      }
    }
    
    return {
      poeticPhrases: Array.from(poeticPhrases).slice(0, 20),
      vocabulary: Array.from(vocabulary).slice(0, 50),
      imagery: Array.from(imagery).slice(0, 20),
      themes: Array.from(themes).slice(0, 10)
    };
  }

  private isImageryWord(word: string): boolean {
    const imageryPatterns = [
      'sun', 'moon', 'star', 'sky', 'cloud', 'rain', 'snow', 'wind',
      'tree', 'flower', 'rose', 'leaf', 'grass', 'mountain', 'sea', 'river',
      'fire', 'flame', 'smoke', 'shadow', 'light', 'dark', 'bright',
      'gold', 'silver', 'crystal', 'diamond', 'pearl',
      'heart', 'soul', 'eye', 'tear', 'smile', 'kiss'
    ];
    
    return imageryPatterns.some(pattern => word.includes(pattern));
  }

  private isThematicWord(word: string): boolean {
    const thematicPatterns = [
      'love', 'hate', 'death', 'life', 'time', 'eternity', 'dream',
      'hope', 'fear', 'joy', 'sorrow', 'pain', 'peace', 'war',
      'beauty', 'truth', 'freedom', 'destiny', 'fate', 'memory'
    ];
    
    return thematicPatterns.some(pattern => word.includes(pattern));
  }

  private getEmptyContext(): PoetryContext {
    return {
      poeticPhrases: [],
      vocabulary: [],
      imagery: [],
      themes: []
    };
  }
}

export const poetryDbService = new PoetryDbService();