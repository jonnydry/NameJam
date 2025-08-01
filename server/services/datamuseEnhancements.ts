import { datamuseService, DatamuseService } from './datamuseService';
import { secureLog } from '../utils/secureLogger';

interface EnhancedDatamuseResult {
  word: string;
  score: number;
  source: string; // 'meansLike' | 'soundsLike' | 'relation' | 'chain'
  frequency?: number;
  tags?: string[];
}

export class DatamuseEnhancementService {
  private datamuseService: DatamuseService;
  
  constructor() {
    this.datamuseService = datamuseService;
  }

  /**
   * Multi-query strategy: Query using multiple approaches and combine results
   */
  async multiQueryWords(seedWord: string, maxResults = 50): Promise<EnhancedDatamuseResult[]> {
    const results: EnhancedDatamuseResult[] = [];
    const uniqueWords = new Set<string>();
    
    try {
      // Query 1: Semantic similarity (meansLike)
      const [semanticResults, phoneticResults, relationResults] = await Promise.all([
        // Semantic similarity
        this.datamuseService.findWords({
          meansLike: seedWord,
          maxResults: 30,
          metadata: 'fprs' // frequency, pronunciation, rhymes, syllables
        }).catch(() => []),
        
        // Phonetic similarity (soundsLike) 
        this.datamuseService.findWords({
          soundsLike: seedWord,
          maxResults: 20,
          metadata: 'fprs'
        }).catch(() => []),
        
        // Relationship mining (rel_jjb for nouns described by adjective)
        this.datamuseService.findWords({
          nounsForAdj: seedWord,
          maxResults: 20,
          metadata: 'fprs'
        }).catch(() => [])
      ]);
      
      // Process semantic results with frequency filtering
      semanticResults.forEach(word => {
        if (!uniqueWords.has(word.word.toLowerCase()) && this.passesFrequencyFilter(word)) {
          uniqueWords.add(word.word.toLowerCase());
          results.push({
            word: word.word,
            score: word.score * 1.2, // Boost semantic matches
            source: 'meansLike',
            frequency: word.tags?.find(t => t.startsWith('f:'))?.split(':')[1] ? 
              parseFloat(word.tags.find(t => t.startsWith('f:'))!.split(':')[1]) : 0,
            tags: word.tags
          });
        }
      });
      
      // Process phonetic results
      phoneticResults.forEach(word => {
        if (!uniqueWords.has(word.word.toLowerCase()) && this.passesFrequencyFilter(word)) {
          uniqueWords.add(word.word.toLowerCase());
          results.push({
            word: word.word,
            score: word.score * 0.8, // Slightly lower weight for phonetic
            source: 'soundsLike',
            frequency: word.tags?.find(t => t.startsWith('f:'))?.split(':')[1] ? 
              parseFloat(word.tags.find(t => t.startsWith('f:'))!.split(':')[1]) : 0,
            tags: word.tags
          });
        }
      });
      
      // Process relationship results
      relationResults.forEach(word => {
        if (!uniqueWords.has(word.word.toLowerCase()) && this.passesFrequencyFilter(word)) {
          uniqueWords.add(word.word.toLowerCase());
          results.push({
            word: word.word,
            score: word.score,
            source: 'relation',
            frequency: word.tags?.find(t => t.startsWith('f:'))?.split(':')[1] ? 
              parseFloat(word.tags.find(t => t.startsWith('f:'))!.split(':')[1]) : 0,
            tags: word.tags
          });
        }
      });
      
      // Sort by combined score and frequency
      results.sort((a, b) => {
        const scoreA = a.score + (a.frequency || 0) * 0.001; // Small frequency boost
        const scoreB = b.score + (b.frequency || 0) * 0.001;
        return scoreB - scoreA;
      });
      
      secureLog.debug(`Multi-query for "${seedWord}": ${results.length} unique results from ${semanticResults.length + phoneticResults.length + relationResults.length} total`);
      
      return results.slice(0, maxResults);
      
    } catch (error) {
      secureLog.error('Multi-query error:', error);
      return [];
    }
  }

  /**
   * Contextual chains: Follow word associations 2-3 levels deep
   */
  async buildContextualChain(startWord: string, depth = 2): Promise<string[]> {
    const chain: string[] = [startWord];
    const visited = new Set<string>([startWord.toLowerCase()]);
    
    try {
      let currentWord = startWord;
      
      for (let level = 0; level < depth; level++) {
        // Get associated words
        const associations = await this.datamuseService.findWords({
          meansLike: currentWord,
          maxResults: 10,
          metadata: 'fprs'
        });
        
        // Filter for quality and novelty
        const validAssociations = associations
          .filter(w => 
            !visited.has(w.word.toLowerCase()) &&
            this.passesFrequencyFilter(w) &&
            w.word.length >= 4 &&
            w.word.length <= 12
          )
          .sort((a, b) => b.score - a.score);
        
        if (validAssociations.length > 0) {
          // Pick from top 3 for variety
          const nextIndex = Math.floor(Math.random() * Math.min(3, validAssociations.length));
          const nextWord = validAssociations[nextIndex].word;
          
          chain.push(nextWord);
          visited.add(nextWord.toLowerCase());
          currentWord = nextWord;
          
          secureLog.debug(`Chain level ${level + 1}: ${startWord} → ${nextWord}`);
        } else {
          break; // No more valid associations
        }
      }
      
      return chain;
      
    } catch (error) {
      secureLog.error('Contextual chain error:', error);
      return chain;
    }
  }

  /**
   * Enhanced relationship mining with multiple relation types
   */
  async mineRelationships(word: string, type: 'noun' | 'adjective' | 'verb'): Promise<EnhancedDatamuseResult[]> {
    const results: EnhancedDatamuseResult[] = [];
    const uniqueWords = new Set<string>();
    
    try {
      const queries = [];
      
      if (type === 'noun') {
        // Get adjectives that describe this noun
        queries.push(
          this.datamuseService.findWords({
            adjsForNoun: word,
            maxResults: 20,
            metadata: 'fprs'
          }).catch(() => [])
        );
        
        // Get words that often follow this noun
        queries.push(
          this.datamuseService.findWords({
            frequentFollowers: word,
            maxResults: 15,
            metadata: 'fprs'
          }).catch(() => [])
        );
      } else if (type === 'adjective') {
        // Get nouns described by this adjective
        queries.push(
          this.datamuseService.findWords({
            nounsForAdj: word,
            maxResults: 20,
            metadata: 'fprs'
          }).catch(() => [])
        );
        
        // Get synonyms
        queries.push(
          this.datamuseService.findWords({
            synonyms: word,
            maxResults: 15,
            metadata: 'fprs'
          }).catch(() => [])
        );
      } else {
        // For verbs, get related action words
        queries.push(
          this.datamuseService.findWords({
            meansLike: word,
            topics: 'action movement',
            maxResults: 20,
            metadata: 'fprs'
          }).catch(() => [])
        );
      }
      
      const allResults = await Promise.all(queries);
      
      // Process all results
      allResults.flat().forEach(word => {
        if (word && !uniqueWords.has(word.word.toLowerCase()) && this.passesFrequencyFilter(word)) {
          uniqueWords.add(word.word.toLowerCase());
          results.push({
            word: word.word,
            score: word.score,
            source: 'relation',
            frequency: word.tags?.find(t => t.startsWith('f:'))?.split(':')[1] ? 
              parseFloat(word.tags.find(t => t.startsWith('f:'))!.split(':')[1]) : 0,
            tags: word.tags
          });
        }
      });
      
      // Sort by score
      results.sort((a, b) => b.score - a.score);
      
      secureLog.debug(`Relationship mining for ${type} "${word}": ${results.length} results`);
      
      return results;
      
    } catch (error) {
      secureLog.error('Relationship mining error:', error);
      return [];
    }
  }

  /**
   * Frequency filter: Avoid overly common or overly rare words
   */
  private passesFrequencyFilter(word: any): boolean {
    if (!word.tags) return true; // No frequency data, allow it
    
    // Extract frequency from tags (format: "f:12.345")
    const freqTag = word.tags.find((t: string) => t.startsWith('f:'));
    if (!freqTag) return true;
    
    const frequency = parseFloat(freqTag.split(':')[1]);
    
    // Filter out extremely common words (frequency > 100) 
    // and very rare words (frequency < 0.01)
    return frequency >= 0.01 && frequency <= 100;
  }

  /**
   * Get words with specific patterns for creative combinations
   */
  async getPatternWords(pattern: string, maxResults = 20): Promise<string[]> {
    try {
      const results = await this.datamuseService.findWords({
        spelledLike: pattern,
        maxResults,
        metadata: 'fprs'
      });
      
      return results
        .filter(w => this.passesFrequencyFilter(w))
        .map(w => w.word)
        .slice(0, maxResults);
        
    } catch (error) {
      secureLog.error('Pattern words error:', error);
      return [];
    }
  }
}

export const datamuseEnhancementService = new DatamuseEnhancementService();