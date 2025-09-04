/**
 * Phonetic Flow Analyzer for Music Name Generation
 * Evaluates names for pronunciation, memorability, and sonic quality
 */

import { secureLog } from '../../utils/secureLogger';

interface PhoneticScore {
  overall: number; // 0-100
  pronunciation: number; // How easy to pronounce
  flow: number; // How well words flow together
  memorability: number; // How memorable/catchy
  uniqueness: number; // How distinctive the sound pattern is
  issues: string[]; // List of detected issues
}

export class PhoneticFlowAnalyzer {
  // Consonant clusters that are hard to pronounce
  private readonly difficultClusters = [
    'xth', 'fth', 'sth', 'pth', 'kth', 'tch', 'dg',
    'ght', 'gth', 'ngth', 'xts', 'pts', 'cts', 'rsts'
  ];
  
  // Vowel patterns that flow well
  private readonly goodVowelPatterns = [
    /[aeiou][^aeiou][aeiou]/, // consonant between vowels
    /[^aeiou][aeiou]{1,2}[^aeiou]/, // 1-2 vowels between consonants
    /^[aeiou][^aeiou]+/, // starts with vowel followed by consonants
    /[^aeiou]+[aeiou]$/ // ends with consonants followed by vowel
  ];
  
  // Syllable stress patterns (simplified)
  private readonly stressPatterns = {
    iambic: /^[a-z]{1,2}[A-Z][a-z]+/, // weak-STRONG
    trochaic: /^[A-Z][a-z]+[a-z]{1,2}$/, // STRONG-weak
    dactylic: /^[A-Z][a-z]{2}[a-z]+/, // STRONG-weak-weak
    anapestic: /^[a-z]{2}[A-Z][a-z]+/ // weak-weak-STRONG
  };
  
  /**
   * Analyze the phonetic quality of a name
   */
  public analyzePhoneticFlow(name: string): PhoneticScore {
    const words = name.split(/\s+/);
    const issues: string[] = [];
    
    // Calculate individual scores
    const pronunciationScore = this.scorePronunciation(name, words, issues);
    const flowScore = this.scoreFlow(words, issues);
    const memorabilityScore = this.scoreMemorability(name, words, issues);
    const uniquenessScore = this.scoreUniqueness(name, words);
    
    // Weight the overall score
    const overall = Math.round(
      pronunciationScore * 0.3 +
      flowScore * 0.25 +
      memorabilityScore * 0.25 +
      uniquenessScore * 0.2
    );
    
    return {
      overall,
      pronunciation: pronunciationScore,
      flow: flowScore,
      memorability: memorabilityScore,
      uniqueness: uniquenessScore,
      issues
    };
  }
  
  /**
   * Score how easy the name is to pronounce
   */
  private scorePronunciation(name: string, words: string[], issues: string[]): number {
    let score = 100;
    const lowerName = name.toLowerCase();
    
    // Check for difficult consonant clusters
    for (const cluster of this.difficultClusters) {
      if (lowerName.includes(cluster)) {
        score -= 10;
        issues.push(`Difficult consonant cluster: "${cluster}"`);
      }
    }
    
    // Check for too many consecutive consonants
    const consonantRuns = lowerName.match(/[^aeiou]{4,}/g);
    if (consonantRuns) {
      score -= consonantRuns.length * 15;
      issues.push(`Too many consecutive consonants: ${consonantRuns.join(', ')}`);
    }
    
    // Check for too many consecutive vowels
    const vowelRuns = lowerName.match(/[aeiou]{4,}/g);
    if (vowelRuns) {
      score -= vowelRuns.length * 10;
      issues.push(`Too many consecutive vowels: ${vowelRuns.join(', ')}`);
    }
    
    // Penalize words that are too long
    for (const word of words) {
      if (word.length > 12) {
        score -= 10;
        issues.push(`Word too long: "${word}" (${word.length} characters)`);
      }
    }
    
    // Check for awkward letter combinations
    const awkwardCombos = ['xc', 'qw', 'kx', 'vb', 'zx', 'qz'];
    for (const combo of awkwardCombos) {
      if (lowerName.includes(combo)) {
        score -= 8;
        issues.push(`Awkward letter combination: "${combo}"`);
      }
    }
    
    return Math.max(0, score);
  }
  
  /**
   * Score how well the words flow together
   */
  private scoreFlow(words: string[], issues: string[]): number {
    if (words.length === 1) return 85; // Single words have neutral flow
    
    let score = 100;
    
    // Check transitions between words
    for (let i = 0; i < words.length - 1; i++) {
      const currentEnd = words[i].slice(-1).toLowerCase();
      const nextStart = words[i + 1][0].toLowerCase();
      
      // Penalize same consonant sounds at boundaries (like "Dark King")
      if (this.isSimilarConsonant(currentEnd, nextStart)) {
        score -= 10;
        issues.push(`Repetitive consonant boundary: "${words[i]}" → "${words[i + 1]}"`);
      }
      
      // Reward vowel-consonant or consonant-vowel transitions
      const isCurrentVowel = 'aeiou'.includes(currentEnd);
      const isNextVowel = 'aeiou'.includes(nextStart);
      if (isCurrentVowel !== isNextVowel) {
        score += 5; // Bonus for good transitions
      }
    }
    
    // Check for rhythm and cadence
    const syllableCounts = words.map(w => this.countSyllables(w));
    const rhythmScore = this.evaluateRhythm(syllableCounts);
    score = score * 0.7 + rhythmScore * 0.3;
    
    // Penalize excessive alliteration (more than 2 words starting with same sound)
    const firstLetters = words.map(w => w[0].toLowerCase());
    const letterCounts = new Map<string, number>();
    for (const letter of firstLetters) {
      letterCounts.set(letter, (letterCounts.get(letter) || 0) + 1);
    }
    for (const [letter, count] of letterCounts) {
      if (count > 2) {
        score -= (count - 2) * 15;
        issues.push(`Excessive alliteration: ${count} words start with "${letter}"`);
      }
    }
    
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Score how memorable the name is
   */
  private scoreMemorability(name: string, words: string[], issues: string[]): number {
    let score = 50; // Start at neutral
    
    // Optimal length for memorability
    const totalLength = name.length;
    if (totalLength >= 8 && totalLength <= 20) {
      score += 20;
    } else if (totalLength < 5) {
      score -= 10;
      issues.push('Name might be too short to be memorable');
    } else if (totalLength > 30) {
      score -= 20;
      issues.push('Name is too long to be easily memorable');
    }
    
    // Word count affects memorability
    if (words.length === 2 || words.length === 3) {
      score += 15; // Optimal word count
    } else if (words.length === 1) {
      score += 10; // Single words can be memorable if unique
    } else if (words.length > 5) {
      score -= 20;
      issues.push('Too many words reduce memorability');
    }
    
    // Check for rhyme or assonance (increases memorability)
    if (this.hasRhyme(words)) {
      score += 15;
    }
    if (this.hasAssonance(words)) {
      score += 10;
    }
    
    // Check for distinctive sound patterns
    if (this.hasDistinctivePattern(name)) {
      score += 15;
    }
    
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Score how unique the sound pattern is
   */
  private scoreUniqueness(name: string, words: string[]): number {
    let score = 50; // Start at neutral
    
    // Uncommon starting letters add uniqueness
    const firstLetter = name[0].toLowerCase();
    const commonStarters = ['t', 's', 'b', 'd', 'r', 'c', 'm'];
    const uncommonStarters = ['x', 'z', 'q', 'y', 'v', 'j'];
    
    if (uncommonStarters.includes(firstLetter)) {
      score += 20;
    } else if (!commonStarters.includes(firstLetter)) {
      score += 10;
    }
    
    // Unique letter combinations
    const hasUnusualCombos = /[qx]|[zj]|[vy]/.test(name.toLowerCase());
    if (hasUnusualCombos) {
      score += 15;
    }
    
    // Mixed case patterns (like "McFly" or "LaRoux")
    const hasMixedCase = /[a-z][A-Z]/.test(name);
    if (hasMixedCase) {
      score += 10;
    }
    
    // Unique word structures
    const hasCompoundWord = words.some(w => w.length > 8 && /[A-Z]/.test(w.slice(1)));
    if (hasCompoundWord) {
      score += 10;
    }
    
    return Math.max(0, Math.min(100, score));
  }
  
  /**
   * Helper: Count syllables in a word (approximation)
   */
  private countSyllables(word: string): number {
    word = word.toLowerCase();
    let count = 0;
    let previousWasVowel = false;
    
    for (let i = 0; i < word.length; i++) {
      const isVowel = 'aeiou'.includes(word[i]);
      if (isVowel && !previousWasVowel) {
        count++;
      }
      previousWasVowel = isVowel;
    }
    
    // Adjust for silent e
    if (word.endsWith('e') && count > 1) {
      count--;
    }
    
    return Math.max(1, count);
  }
  
  /**
   * Helper: Check if consonants sound similar
   */
  private isSimilarConsonant(c1: string, c2: string): boolean {
    const similarGroups = [
      ['b', 'p'],
      ['d', 't'],
      ['g', 'k', 'c'],
      ['f', 'v'],
      ['s', 'z', 'c'],
      ['m', 'n']
    ];
    
    for (const group of similarGroups) {
      if (group.includes(c1) && group.includes(c2)) {
        return true;
      }
    }
    
    return c1 === c2;
  }
  
  /**
   * Helper: Evaluate rhythm based on syllable patterns
   */
  private evaluateRhythm(syllableCounts: number[]): number {
    if (syllableCounts.length === 1) return 70;
    
    // Check for pleasing patterns
    const pattern = syllableCounts.join('-');
    
    // Good patterns
    const goodPatterns = [
      '1-2', '2-1', // Iambic/Trochaic
      '2-2', '3-3', // Balanced
      '1-2-1', '2-1-2', // Symmetrical
      '1-2-3', '3-2-1' // Progressive
    ];
    
    if (goodPatterns.includes(pattern)) {
      return 90;
    }
    
    // Check for reasonable variation
    const max = Math.max(...syllableCounts);
    const min = Math.min(...syllableCounts);
    if (max - min <= 2) {
      return 75;
    }
    
    return 60;
  }
  
  /**
   * Helper: Check for rhyme
   */
  private hasRhyme(words: string[]): boolean {
    if (words.length < 2) return false;
    
    for (let i = 0; i < words.length - 1; i++) {
      for (let j = i + 1; j < words.length; j++) {
        const end1 = words[i].slice(-2).toLowerCase();
        const end2 = words[j].slice(-2).toLowerCase();
        if (end1 === end2 && end1.length >= 2) {
          return true;
        }
      }
    }
    return false;
  }
  
  /**
   * Helper: Check for assonance (repeated vowel sounds)
   */
  private hasAssonance(words: string[]): boolean {
    const vowelPatterns = words.map(w => 
      w.toLowerCase().replace(/[^aeiou]/g, '')
    );
    
    for (let i = 0; i < vowelPatterns.length - 1; i++) {
      if (vowelPatterns[i].length >= 2 && 
          vowelPatterns[i] === vowelPatterns[i + 1]) {
        return true;
      }
    }
    return false;
  }
  
  /**
   * Helper: Check for distinctive sound patterns
   */
  private hasDistinctivePattern(name: string): boolean {
    const patterns = [
      /(.)\1{2,}/, // Repeated letters (like "Buzzz")
      /[A-Z][a-z]+[A-Z]/, // CamelCase variation
      /^\W/, // Starts with non-letter
      /\d/, // Contains numbers
      /[!?&]/ // Contains special characters
    ];
    
    return patterns.some(p => p.test(name));
  }
  
  /**
   * Get a quality assessment message
   */
  public getQualityAssessment(score: PhoneticScore): string {
    if (score.overall >= 80) {
      return 'Excellent phonetic quality - flows naturally and memorably';
    } else if (score.overall >= 65) {
      return 'Good phonetic quality - generally pleasant to say';
    } else if (score.overall >= 50) {
      return 'Moderate phonetic quality - some awkward elements';
    } else {
      return 'Poor phonetic quality - difficult to pronounce or remember';
    }
  }
}

// Export singleton instance
export const phoneticFlowAnalyzer = new PhoneticFlowAnalyzer();