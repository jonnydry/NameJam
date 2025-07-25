import fetch from 'node-fetch';

interface DatamuseWord {
  word: string;
  score: number;
  tags?: string[];
  defs?: string[];
  numSyllables?: number;
}

interface DatamuseOptions {
  meansLike?: string;           // ml - synonyms
  soundsLike?: string;          // sl - phonetically similar
  spelledLike?: string;         // sp - spelling pattern
  rhymesWith?: string;          // rel_rhy - perfect rhymes
  nearRhymes?: string;          // rel_nry - near rhymes
  synonyms?: string;            // rel_syn - synonyms
  antonyms?: string;            // rel_ant - antonyms
  triggers?: string;            // rel_trg - statistical associations
  adjsForNoun?: string;         // rel_jja - adjectives for this noun
  nounsForAdj?: string;         // rel_jjb - nouns for this adjective
  moreSpecific?: string;        // rel_spc - hyponyms
  moreGeneral?: string;         // rel_gen - hypernyms
  frequentFollowers?: string;   // rel_bga - words that often follow
  frequentPredecessors?: string; // rel_bgb - words that often precede
  topics?: string;              // context hint for theme
  leftContext?: string;         // lc - word appearing before
  rightContext?: string;        // rc - word appearing after
  maxResults?: number;          // max - limit results (default 10, max 1000)
  metadata?: string;            // md - include definitions, pronunciation, etc.
}

export class DatamuseService {
  private baseUrl = 'https://api.datamuse.com';
  private cache = new Map<string, DatamuseWord[]>();
  private cacheTimeout = 10 * 60 * 1000; // 10 minutes

  // Get cache key for request
  private getCacheKey(options: DatamuseOptions): string {
    return JSON.stringify(options);
  }

  // Main method to find words based on constraints
  async findWords(options: DatamuseOptions): Promise<DatamuseWord[]> {
    const cacheKey = this.getCacheKey(options);
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const params = new URLSearchParams();
      
      // Add all the relationship parameters
      if (options.meansLike) params.append('ml', options.meansLike);
      if (options.soundsLike) params.append('sl', options.soundsLike);
      if (options.spelledLike) params.append('sp', options.spelledLike);
      if (options.rhymesWith) params.append('rel_rhy', options.rhymesWith);
      if (options.nearRhymes) params.append('rel_nry', options.nearRhymes);
      if (options.synonyms) params.append('rel_syn', options.synonyms);
      if (options.antonyms) params.append('rel_ant', options.antonyms);
      if (options.triggers) params.append('rel_trg', options.triggers);
      if (options.adjsForNoun) params.append('rel_jja', options.adjsForNoun);
      if (options.nounsForAdj) params.append('rel_jjb', options.nounsForAdj);
      if (options.moreSpecific) params.append('rel_spc', options.moreSpecific);
      if (options.moreGeneral) params.append('rel_gen', options.moreGeneral);
      if (options.frequentFollowers) params.append('rel_bga', options.frequentFollowers);
      if (options.frequentPredecessors) params.append('rel_bgb', options.frequentPredecessors);
      if (options.topics) params.append('topics', options.topics);
      if (options.leftContext) params.append('lc', options.leftContext);
      if (options.rightContext) params.append('rc', options.rightContext);
      
      // Default to 50 results for better variety
      params.append('max', (options.maxResults || 50).toString());
      
      // Include basic metadata
      params.append('md', options.metadata || 'prs'); // pronunciation, part of speech, syllables

      const url = `${this.baseUrl}/words?${params.toString()}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // Increased to 15 seconds

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'NameJam/1.0'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Datamuse API error: ${response.status}`);
      }

      const words = await response.json() as DatamuseWord[];
      
      // Cache the results
      this.cache.set(cacheKey, words);
      
      // Clean cache after timeout
      setTimeout(() => {
        this.cache.delete(cacheKey);
      }, this.cacheTimeout);

      return words;
    } catch (error) {
      console.error('Datamuse API error:', error);
      return []; // Return empty array on error for graceful fallback
    }
  }

  // Specialized methods for name generation

  // Find words associated with a genre/mood theme
  async findThematicWords(theme: string, maxResults = 30): Promise<DatamuseWord[]> {
    return this.findWords({
      topics: theme,
      maxResults,
      metadata: 'prs'
    });
  }

  // Find adjectives that commonly go with a noun
  async findAdjectivesForNoun(noun: string, maxResults = 20): Promise<DatamuseWord[]> {
    return this.findWords({
      adjsForNoun: noun,
      maxResults,
      metadata: 'prs'
    });
  }

  // Find nouns that commonly go with an adjective
  async findNounsForAdjective(adjective: string, maxResults = 20): Promise<DatamuseWord[]> {
    return this.findWords({
      nounsForAdj: adjective,
      maxResults,
      metadata: 'prs'
    });
  }

  // Find words statistically associated with a concept
  async findAssociatedWords(concept: string, maxResults = 30): Promise<DatamuseWord[]> {
    return this.findWords({
      triggers: concept,
      maxResults,
      metadata: 'prs'
    });
  }

  // Find synonyms/similar meaning words
  async findSimilarWords(word: string, maxResults = 25): Promise<DatamuseWord[]> {
    return this.findWords({
      meansLike: word,
      maxResults,
      metadata: 'prs'
    });
  }

  // Find words that rhyme (useful for song titles)
  async findRhymingWords(word: string, maxResults = 20): Promise<DatamuseWord[]> {
    return this.findWords({
      rhymesWith: word,
      maxResults,
      metadata: 'prs'
    });
  }

  // Find words that often appear together
  async findWordsThatFollow(word: string, maxResults = 20): Promise<DatamuseWord[]> {
    return this.findWords({
      frequentFollowers: word,
      maxResults,
      metadata: 'prs'
    });
  }

  async findWordsThatPrecede(word: string, maxResults = 20): Promise<DatamuseWord[]> {
    return this.findWords({
      frequentPredecessors: word,
      maxResults,
      metadata: 'prs'
    });
  }

  // Get cache statistics
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  // Clear cache manually
  clearCache(): void {
    this.cache.clear();
  }
}

export const datamuseService = new DatamuseService();