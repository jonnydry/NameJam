import fetch from 'node-fetch';
import memoize from 'memoizee';

/**
 * Enhanced Word API Service
 * Integrates multiple free APIs to enhance native name generation
 */
export class WordApiService {
  private cache = new Map<string, any>();
  
  constructor() {
    console.log('✓ WordApiService initialized');
  }

  /**
   * Datamuse API - Find words with semantic relationships
   * Free: 100,000 requests/day, no API key needed
   */
  private async datamuse(params: Record<string, string>): Promise<any[]> {
    const queryString = new URLSearchParams(params).toString();
    const cacheKey = `datamuse:${queryString}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await fetch(`https://api.datamuse.com/words?${queryString}`);
      if (!response.ok) return [];
      
      const data = await response.json();
      this.cache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.log('Datamuse API unavailable, using fallback');
      return [];
    }
  }

  /**
   * Get rhymes for a word (perfect and near rhymes)
   */
  async getRhymes(word: string, maxResults = 15): Promise<string[]> {
    const [perfectRhymes, nearRhymes] = await Promise.all([
      this.datamuse({ rel_rhy: word, max: String(Math.floor(maxResults * 0.7)) }),
      this.datamuse({ rel_nry: word, max: String(Math.floor(maxResults * 0.3)) })
    ]);
    
    const allRhymes = [...perfectRhymes, ...nearRhymes];
    return allRhymes.map(item => item.word).slice(0, maxResults);
  }

  /**
   * Get words that sound similar to input word
   */
  async getSimilarSounding(word: string, maxResults = 10): Promise<string[]> {
    const results = await this.datamuse({ sl: word, max: String(maxResults) });
    return results.map(item => item.word);
  }

  /**
   * Get synonyms and related words
   */
  async getRelatedWords(word: string, maxResults = 15): Promise<string[]> {
    const [synonyms, meanings] = await Promise.all([
      this.datamuse({ rel_syn: word, max: String(Math.floor(maxResults * 0.6)) }),
      this.datamuse({ ml: word, max: String(Math.floor(maxResults * 0.4)) })
    ]);
    
    const allRelated = [...synonyms, ...meanings];
    return allRelated.map(item => item.word).slice(0, maxResults);
  }

  /**
   * Get words that often appear before/after the given word
   */
  async getContextWords(word: string): Promise<{ before: string[], after: string[] }> {
    const [before, after] = await Promise.all([
      this.datamuse({ rc: word, max: '8' }), // right context (words that come before)
      this.datamuse({ lc: word, max: '8' })  // left context (words that come after)
    ]);
    
    return {
      before: before.map(item => item.word),
      after: after.map(item => item.word)
    };
  }

  /**
   * Find words with specific spelling patterns
   */
  async getPatternWords(pattern: string, maxResults = 10): Promise<string[]> {
    const results = await this.datamuse({ sp: pattern, max: String(maxResults) });
    return results.map(item => item.word);
  }

  /**
   * Get words related to a topic/theme
   */
  async getTopicWords(topic: string, maxResults = 20): Promise<string[]> {
    const results = await this.datamuse({ ml: topic, topics: topic, max: String(maxResults) });
    return results.map(item => item.word);
  }

  /**
   * Enhanced alliteration - find words starting with same sound
   */
  async getAlliterativeWords(startWord: string, maxResults = 12): Promise<string[]> {
    // Get first sound/phoneme pattern
    const pattern = startWord.charAt(0).toLowerCase() + '*';
    const results = await this.datamuse({ sp: pattern, max: String(maxResults * 2) });
    
    // Filter for words that actually sound similar at the start
    const filtered = results.filter(item => 
      item.word.toLowerCase().charAt(0) === startWord.toLowerCase().charAt(0)
    );
    
    return filtered.map(item => item.word).slice(0, maxResults);
  }

  /**
   * Generate semantic word pairs for two-word names
   */
  async getSemanticPairs(concept: string): Promise<Array<{word1: string, word2: string}>> {
    const relatedWords = await this.getRelatedWords(concept, 10);
    const contextWords = await this.getContextWords(concept);
    
    const pairs: Array<{word1: string, word2: string}> = [];
    
    // Concept + related word pairs
    for (const related of relatedWords.slice(0, 5)) {
      pairs.push({ word1: concept, word2: related });
      pairs.push({ word1: related, word2: concept });
    }
    
    // Context-based pairs
    for (const before of contextWords.before.slice(0, 3)) {
      pairs.push({ word1: before, word2: concept });
    }
    
    for (const after of contextWords.after.slice(0, 3)) {
      pairs.push({ word1: concept, word2: after });
    }
    
    return pairs.slice(0, 15);
  }

  /**
   * Generate thematic word clusters for longer names
   */
  async getThematicCluster(theme: string, wordCount: number): Promise<string[]> {
    const [topicWords, relatedWords, rhymes] = await Promise.all([
      this.getTopicWords(theme, 8),
      this.getRelatedWords(theme, 8),
      this.getRhymes(theme, 6)
    ]);
    
    const allWords = [...topicWords, ...relatedWords, ...rhymes];
    const uniqueWords = Array.from(new Set(allWords));
    
    // Return requested word count, ensuring variety
    return this.shuffleArray(uniqueWords).slice(0, wordCount);
  }

  /**
   * Enhanced word relationship discovery
   */
  async getWordRelationships(baseWord: string): Promise<{
    rhymes: string[],
    synonyms: string[],
    soundSimilar: string[],
    contextBefore: string[],
    contextAfter: string[],
    alliterative: string[]
  }> {
    const [rhymes, synonyms, soundSimilar, context, alliterative] = await Promise.all([
      this.getRhymes(baseWord, 8),
      this.getRelatedWords(baseWord, 8),
      this.getSimilarSounding(baseWord, 6),
      this.getContextWords(baseWord),
      this.getAlliterativeWords(baseWord, 8)
    ]);

    return {
      rhymes,
      synonyms,
      soundSimilar,
      contextBefore: context.before,
      contextAfter: context.after,
      alliterative
    };
  }

  private shuffleArray(array: any[]): any[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Cache cleanup - run periodically
   */
  clearCache(): void {
    this.cache.clear();
    console.log('Word API cache cleared');
  }
}

export const wordApiService = new WordApiService();