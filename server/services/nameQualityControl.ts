import { conceptNetService } from './conceptNetService';
import { secureLog } from '../utils/secureLogger';

interface QualityScore {
  overallScore: number;
  semanticCoherence: number;
  pronunciation: number;
  uniqueness: number;
  poeticQuality: number;
  issues: string[];
}

export class NameQualityControlService {
  private recentSemanticConcepts: Map<string, Set<string>> = new Map();
  private maxSemanticHistory = 100;
  
  /**
   * Comprehensive quality check for generated names
   */
  async evaluateNameQuality(name: string, type: 'band' | 'song'): Promise<QualityScore> {
    const words = name.toLowerCase().split(/\s+/);
    const issues: string[] = [];
    
    // Check semantic coherence
    const semanticScore = await this.checkSemanticCoherence(words);
    if (semanticScore < 0.3) {
      issues.push('Low semantic coherence between words');
    }
    
    // Check pronunciation difficulty
    const pronunciationScore = this.checkPronunciation(name);
    if (pronunciationScore < 0.5) {
      issues.push('Difficult to pronounce');
    }
    
    // Check uniqueness (semantic uniqueness)
    const uniquenessScore = await this.checkSemanticUniqueness(words);
    if (uniquenessScore < 0.5) {
      issues.push('Too similar to recent names semantically');
    }
    
    // Check poetic quality
    const poeticScore = this.checkPoeticQuality(name, words);
    if (poeticScore < 0.4) {
      issues.push('Low poetic quality');
    }
    
    // Calculate overall score
    const overallScore = (
      semanticScore * 0.3 +
      pronunciationScore * 0.2 +
      uniquenessScore * 0.3 +
      poeticScore * 0.2
    );
    
    return {
      overallScore,
      semanticCoherence: semanticScore,
      pronunciation: pronunciationScore,
      uniqueness: uniquenessScore,
      poeticQuality: poeticScore,
      issues
    };
  }
  
  /**
   * Check semantic coherence between words using ConceptNet
   */
  private async checkSemanticCoherence(words: string[]): Promise<number> {
    if (words.length < 2) return 1.0; // Single word names are coherent by default
    
    try {
      let totalCoherence = 0;
      let comparisons = 0;
      
      // Check semantic relationships between adjacent words
      for (let i = 0; i < words.length - 1; i++) {
        const word1 = words[i];
        const word2 = words[i + 1];
        
        // Skip very short words
        if (word1.length < 3 || word2.length < 3) continue;
        
        // Get related concepts for both words
        const [concepts1, concepts2] = await Promise.all([
          conceptNetService.getRelatedConcepts(word1, 10).catch(() => []),
          conceptNetService.getRelatedConcepts(word2, 10).catch(() => [])
        ]);
        
        // Calculate overlap in concepts - extract words from ConceptNetWord objects
        const set1 = new Set(concepts1.map(c => c.word.toLowerCase()));
        const set2 = new Set(concepts2.map(c => c.word.toLowerCase()));
        const intersection = new Set(Array.from(set1).filter(x => set2.has(x)));
        
        // Calculate Jaccard similarity
        const union = new Set([...Array.from(set1), ...Array.from(set2)]);
        const similarity = union.size > 0 ? intersection.size / union.size : 0;
        
        totalCoherence += similarity;
        comparisons++;
      }
      
      // Return average coherence
      return comparisons > 0 ? totalCoherence / comparisons : 0.5;
      
    } catch (error) {
      secureLog.error('Semantic coherence check failed:', error);
      return 0.5; // Default to neutral score on error
    }
  }
  
  /**
   * Check pronunciation difficulty
   */
  private checkPronunciation(name: string): number {
    const words = name.toLowerCase().split(/\s+/);
    let totalScore = 0;
    
    for (const word of words) {
      let wordScore = 1.0;
      
      // Check for difficult consonant clusters
      const consonantClusters = word.match(/[bcdfghjklmnpqrstvwxyz]{3,}/g) || [];
      wordScore -= consonantClusters.length * 0.2;
      
      // Check for vowel patterns (easier to pronounce)
      const vowelPattern = word.match(/[aeiou]/g) || [];
      const consonantPattern = word.match(/[bcdfghjklmnpqrstvwxyz]/g) || [];
      const vowelRatio = vowelPattern.length / (word.length || 1);
      
      // Ideal vowel ratio is around 0.4
      if (vowelRatio < 0.2 || vowelRatio > 0.6) {
        wordScore -= 0.2;
      }
      
      // Check for repeated letters (harder to pronounce)
      const repeatedLetters = word.match(/(.)\1{2,}/g) || [];
      wordScore -= repeatedLetters.length * 0.15;
      
      // Check syllable count (2-4 syllables is ideal)
      const syllableCount = this.countSyllables(word);
      if (syllableCount === 1 || syllableCount > 5) {
        wordScore -= 0.2;
      }
      
      totalScore += Math.max(0, wordScore);
    }
    
    return Math.min(1, totalScore / words.length);
  }
  
  /**
   * Count syllables in a word (approximation)
   */
  private countSyllables(word: string): number {
    word = word.toLowerCase();
    let count = 0;
    const vowels = 'aeiouy';
    let previousWasVowel = false;
    
    for (let i = 0; i < word.length; i++) {
      const isVowel = vowels.includes(word[i]);
      if (isVowel && !previousWasVowel) {
        count++;
      }
      previousWasVowel = isVowel;
    }
    
    // Adjust for silent e
    if (word.endsWith('e') && count > 1) {
      count--;
    }
    
    // Ensure at least one syllable
    return Math.max(1, count);
  }
  
  /**
   * Check semantic uniqueness against recent names
   */
  private async checkSemanticUniqueness(words: string[]): Promise<number> {
    // Extract semantic concepts from current name
    const currentConcepts = new Set<string>();
    
    for (const word of words) {
      if (word.length < 3) continue;
      
      try {
        const concepts = await conceptNetService.getConceptualAssociations(word);
        concepts.slice(0, 5).forEach(c => currentConcepts.add(c.toLowerCase()));
      } catch (error) {
        // Continue if concept lookup fails
      }
    }
    
    // Compare against recent semantic concepts
    let totalSimilarity = 0;
    let comparisons = 0;
    
    for (const [recentName, recentConcepts] of Array.from(this.recentSemanticConcepts.entries())) {
      const intersection = new Set(Array.from(currentConcepts).filter(x => recentConcepts.has(x)));
      const union = new Set([...Array.from(currentConcepts), ...Array.from(recentConcepts)]);
      
      if (union.size > 0) {
        const similarity = intersection.size / union.size;
        totalSimilarity += similarity;
        comparisons++;
      }
    }
    
    // Calculate uniqueness score (inverse of average similarity)
    const avgSimilarity = comparisons > 0 ? totalSimilarity / comparisons : 0;
    const uniquenessScore = 1 - avgSimilarity;
    
    // Store current concepts for future comparisons
    const nameKey = words.join(' ');
    this.recentSemanticConcepts.set(nameKey, currentConcepts);
    
    // Maintain history size
    if (this.recentSemanticConcepts.size > this.maxSemanticHistory) {
      const firstKey = this.recentSemanticConcepts.keys().next().value;
      if (firstKey !== undefined) {
        this.recentSemanticConcepts.delete(firstKey);
      }
    }
    
    return uniquenessScore;
  }
  
  /**
   * Check poetic quality
   */
  private checkPoeticQuality(name: string, words: string[]): number {
    let score = 0.5; // Base score
    
    // Reward alliteration
    if (this.hasAlliteration(words)) {
      score += 0.2;
    }
    
    // Reward assonance (similar vowel sounds)
    if (this.hasAssonance(words)) {
      score += 0.15;
    }
    
    // Reward rhythm (balanced syllable counts)
    if (this.hasGoodRhythm(words)) {
      score += 0.15;
    }
    
    // Penalize tongue twisters
    if (this.isTongueTwister(name)) {
      score -= 0.3;
    }
    
    // Reward emotional resonance (words with strong connotations)
    const emotionalScore = this.checkEmotionalResonance(words);
    score += emotionalScore * 0.2;
    
    return Math.max(0, Math.min(1, score));
  }
  
  /**
   * Check for alliteration
   */
  private hasAlliteration(words: string[]): boolean {
    if (words.length < 2) return false;
    
    const significantWords = words.filter(w => w.length > 2);
    if (significantWords.length < 2) return false;
    
    const firstLetters = significantWords.map(w => w[0].toLowerCase());
    const letterCounts = firstLetters.reduce((acc, letter) => {
      acc[letter] = (acc[letter] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Check if any letter appears in at least half of the words
    return Object.values(letterCounts).some(count => count >= significantWords.length / 2);
  }
  
  /**
   * Check for assonance (similar vowel sounds)
   */
  private hasAssonance(words: string[]): boolean {
    const vowelPatterns = words.map(word => {
      return word.toLowerCase().replace(/[^aeiou]/g, '');
    }).filter(pattern => pattern.length > 0);
    
    // Check for repeated vowel patterns
    for (let i = 0; i < vowelPatterns.length - 1; i++) {
      for (let j = i + 1; j < vowelPatterns.length; j++) {
        if (vowelPatterns[i] === vowelPatterns[j] && vowelPatterns[i].length > 1) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * Check rhythm quality
   */
  private hasGoodRhythm(words: string[]): boolean {
    const syllableCounts = words.map(w => this.countSyllables(w));
    
    // Check for patterns like 1-2-1, 2-1-2, etc.
    if (syllableCounts.length === 3) {
      const [a, b, c] = syllableCounts;
      return (a === c && a !== b) || (a + c === b * 2);
    }
    
    // For longer names, check for general balance
    const avg = syllableCounts.reduce((sum, c) => sum + c, 0) / syllableCounts.length;
    const variance = syllableCounts.reduce((sum, c) => sum + Math.pow(c - avg, 2), 0) / syllableCounts.length;
    
    return variance < 1.5; // Low variance indicates good rhythm
  }
  
  /**
   * Check if name is a tongue twister
   */
  private isTongueTwister(name: string): boolean {
    const cleaned = name.toLowerCase().replace(/[^a-z]/g, '');
    
    // Check for repeated consonant patterns
    const consonants = cleaned.replace(/[aeiou]/g, '');
    for (let i = 0; i < consonants.length - 2; i++) {
      if (consonants[i] === consonants[i + 1] && consonants[i] === consonants[i + 2]) {
        return true;
      }
    }
    
    // Check for difficult transitions
    const difficultPairs = ['thr', 'shr', 'str', 'spr', 'scr'];
    return difficultPairs.some(pair => cleaned.includes(pair));
  }
  
  /**
   * Check emotional resonance
   */
  private checkEmotionalResonance(words: string[]): number {
    const emotionalWords = [
      'love', 'heart', 'soul', 'dream', 'hope', 'light', 'dark', 'fire',
      'storm', 'thunder', 'whisper', 'scream', 'dance', 'fly', 'rise',
      'fall', 'break', 'heal', 'ghost', 'shadow', 'star', 'moon', 'sun'
    ];
    
    const emotionalCount = words.filter(word => 
      emotionalWords.some(ew => word.toLowerCase().includes(ew))
    ).length;
    
    return emotionalCount / words.length;
  }
  
  /**
   * Clear semantic history (for testing or reset)
   */
  clearHistory(): void {
    this.recentSemanticConcepts.clear();
  }
}

export const nameQualityControl = new NameQualityControlService();