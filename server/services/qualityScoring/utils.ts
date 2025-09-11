/**
 * Shared utilities for quality scoring algorithms
 */

import type { ScoreBreakdown, ScoringWeights } from './interfaces';
import { COMMON_WORDS } from './config';

// Text analysis utilities
export class TextAnalyzer {
  
  /**
   * Calculate basic text metrics
   */
  static getTextMetrics(text: string) {
    const words = text.toLowerCase().split(/\s+/).filter(word => word.length > 0);
    const characters = text.replace(/\s/g, '').length;
    const syllables = this.countSyllables(text);
    
    return {
      wordCount: words.length,
      characterCount: characters,
      syllableCount: syllables,
      averageWordLength: characters / words.length,
      words: words
    };
  }
  
  /**
   * Estimate syllable count for rhythm analysis
   */
  static countSyllables(text: string): number {
    const word = text.toLowerCase();
    if (word.length <= 3) return 1;
    
    // Remove non-letters
    const cleanWord = word.replace(/[^a-z]/g, '');
    
    // Count vowel groups
    const vowelGroups = cleanWord.match(/[aeiouy]+/g);
    let syllables = vowelGroups ? vowelGroups.length : 1;
    
    // Adjust for silent e
    if (cleanWord.endsWith('e')) syllables--;
    
    // Ensure minimum of 1
    return Math.max(1, syllables);
  }
  
  /**
   * Check for alliteration (helps with memorability)
   */
  static hasAlliteration(text: string): boolean {
    const words = text.toLowerCase().split(/\s+/);
    if (words.length < 2) return false;
    
    const firstLetters = words.map(word => word.charAt(0));
    const letterCounts = firstLetters.reduce((counts, letter) => {
      counts[letter] = (counts[letter] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
    
    return Object.values(letterCounts).some(count => count >= 2);
  }
  
  /**
   * Analyze pronunciation difficulty
   */
  static getPronunciationDifficulty(text: string): number {
    const words = text.toLowerCase().split(/\s+/);
    let totalDifficulty = 0;
    
    for (const word of words) {
      let difficulty = 0;
      
      // Penalize long words
      if (word.length > 8) difficulty += 0.3;
      else if (word.length > 6) difficulty += 0.1;
      
      // Penalize consonant clusters
      const consonantClusters = word.match(/[bcdfghjklmnpqrstvwxz]{3,}/g);
      if (consonantClusters) difficulty += consonantClusters.length * 0.2;
      
      // Penalize difficult letter combinations
      const difficultCombos = ['sch', 'tch', 'dge', 'ght', 'ous'];
      for (const combo of difficultCombos) {
        if (word.includes(combo)) difficulty += 0.1;
      }
      
      totalDifficulty += difficulty;
    }
    
    // Return inverted score (higher = easier to pronounce)
    return Math.max(0, 1 - (totalDifficulty / words.length));
  }
}

// Creativity and uniqueness analysis
export class CreativityAnalyzer {
  
  /**
   * Calculate creativity score based on word choice and combinations
   */
  static getCreativityScore(text: string, genre?: string): number {
    const words = text.toLowerCase().split(/\s+/);
    let score = 0.5; // Base score
    
    // Bonus for unusual word combinations
    if (this.hasUnusualCombination(words)) score += 0.2;
    
    // Bonus for creative metaphors or imagery
    if (this.hasCreativeImagery(text)) score += 0.15;
    
    // Bonus for wordplay or clever construction
    if (this.hasWordplay(words)) score += 0.15;
    
    // Penalty for overused words
    const overusedPenalty = this.calculateOverusedPenalty(words);
    score -= overusedPenalty;
    
    // Genre-specific creativity bonuses
    if (genre) {
      score += this.getGenreCreativityBonus(words, genre);
    }
    
    return Math.max(0, Math.min(1, score));
  }
  
  /**
   * Check for unusual word combinations
   */
  private static hasUnusualCombination(words: string[]): boolean {
    if (words.length < 2) return false;
    
    // Look for unexpected adjective-noun combinations
    const adjectives = ['electric', 'velvet', 'crystal', 'shadow', 'golden', 'silent', 'burning'];
    const nouns = ['storm', 'whisper', 'revolution', 'dance', 'dream', 'echo', 'flame'];
    
    for (let i = 0; i < words.length - 1; i++) {
      const currentWord = words[i];
      const nextWord = words[i + 1];
      
      if (adjectives.includes(currentWord) && nouns.includes(nextWord)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Detect creative imagery or metaphors
   */
  private static hasCreativeImagery(text: string): boolean {
    const imageryWords = [
      'fire', 'ice', 'storm', 'ocean', 'mountain', 'shadow', 'light', 'darkness',
      'mirror', 'glass', 'steel', 'silk', 'diamond', 'gold', 'silver'
    ];
    
    const textLower = text.toLowerCase();
    return imageryWords.some(word => textLower.includes(word));
  }
  
  /**
   * Detect wordplay elements
   */
  private static hasWordplay(words: string[]): boolean {
    // Check for rhyming within the name/phrase
    if (words.length >= 2) {
      for (let i = 0; i < words.length - 1; i++) {
        if (this.doWordsRhyme(words[i], words[i + 1])) {
          return true;
        }
      }
    }
    
    // Check for puns or double meanings (basic detection)
    const punWords = ['band', 'note', 'key', 'scale', 'beat', 'bass', 'chord'];
    return words.some(word => punWords.includes(word));
  }
  
  /**
   * Simple rhyme detection
   */
  private static doWordsRhyme(word1: string, word2: string): boolean {
    if (word1.length < 2 || word2.length < 2) return false;
    
    const ending1 = word1.slice(-2);
    const ending2 = word2.slice(-2);
    
    return ending1 === ending2;
  }
  
  /**
   * Calculate penalty for overused words
   */
  private static calculateOverusedPenalty(words: string[]): number {
    let penalty = 0;
    
    for (const word of words) {
      if (COMMON_WORDS.overused.includes(word)) {
        penalty += 0.1;
      }
      if (COMMON_WORDS.cliches.some(cliche => cliche.includes(word))) {
        penalty += 0.15;
      }
    }
    
    return Math.min(0.5, penalty); // Cap penalty at 0.5
  }
  
  /**
   * Genre-specific creativity bonuses
   */
  private static getGenreCreativityBonus(words: string[], genre: string): number {
    const genreKeywords: Record<string, string[]> = {
      rock: ['thunder', 'lightning', 'storm', 'rebel', 'wild', 'edge'],
      metal: ['forge', 'steel', 'doom', 'chaos', 'void', 'shadow'],
      electronic: ['pulse', 'wave', 'circuit', 'neon', 'digital', 'cyber'],
      jazz: ['smooth', 'velvet', 'midnight', 'blue', 'cool', 'swing'],
      folk: ['river', 'mountain', 'wind', 'heart', 'story', 'home']
    };
    
    const keywords = genreKeywords[genre] || [];
    const matchCount = words.filter(word => keywords.includes(word)).length;
    
    return Math.min(0.2, matchCount * 0.05);
  }
}

// Scoring utilities
export class ScoringUtils {
  
  /**
   * Calculate weighted overall score from breakdown
   */
  static calculateOverallScore(breakdown: ScoreBreakdown, weights: ScoringWeights): number {
    return (
      breakdown.creativity * weights.creativity +
      breakdown.appropriateness * weights.appropriateness +
      breakdown.quality * weights.quality +
      breakdown.memorability * weights.memorability +
      breakdown.uniqueness * weights.uniqueness +
      breakdown.structure * weights.structure
    );
  }
  
  /**
   * Normalize score to 0-1 range
   */
  static normalizeScore(score: number): number {
    return Math.max(0, Math.min(1, score));
  }
  
  /**
   * Apply genre-specific bonuses to base score
   */
  static applyGenreBonus(baseScore: number, text: string, genre: string, bonusConfig: any): number {
    let bonus = 0;
    
    const textLower = text.toLowerCase();
    
    // Keyword bonuses
    if (bonusConfig.keywords) {
      const keywordMatches = bonusConfig.keywords.filter((keyword: string) => 
        textLower.includes(keyword)
      ).length;
      bonus += keywordMatches * bonusConfig.keywordBonus;
    }
    
    // Style element bonuses
    if (bonusConfig.styleElements) {
      bonus += this.calculateStyleBonus(text, bonusConfig.styleElements, bonusConfig.styleBonus);
    }
    
    return this.normalizeScore(baseScore + bonus);
  }
  
  /**
   * Calculate style-specific bonuses
   */
  private static calculateStyleBonus(text: string, styleElements: string[], bonusValue: number): number {
    let bonus = 0;
    
    for (const element of styleElements) {
      switch (element) {
        case 'alliteration':
          if (TextAnalyzer.hasAlliteration(text)) bonus += bonusValue;
          break;
        case 'hard_consonants':
          if (this.hasHardConsonants(text)) bonus += bonusValue;
          break;
        case 'smooth_words':
          if (this.hasSmoothSounds(text)) bonus += bonusValue;
          break;
        case 'rhythmic_elements':
          if (this.hasRhythmicElements(text)) bonus += bonusValue;
          break;
      }
    }
    
    return bonus;
  }
  
  /**
   * Check for hard consonant sounds (good for rock/metal)
   */
  private static hasHardConsonants(text: string): boolean {
    const hardConsonants = /[bckgdtpqx]/g;
    const matches = text.toLowerCase().match(hardConsonants);
    return matches ? matches.length >= 3 : false;
  }
  
  /**
   * Check for smooth sounds (good for jazz/soul)
   */
  private static hasSmoothSounds(text: string): boolean {
    const smoothSounds = /[lmnrsv]/g;
    const matches = text.toLowerCase().match(smoothSounds);
    return matches ? matches.length >= 3 : false;
  }
  
  /**
   * Check for rhythmic elements
   */
  private static hasRhythmicElements(text: string): boolean {
    // Simple check for repetitive sounds or patterns
    const words = text.toLowerCase().split(/\s+/);
    
    // Check for repeated starting sounds
    const startingSounds = words.map(word => word.charAt(0));
    const uniqueSounds = new Set(startingSounds);
    
    return uniqueSounds.size < startingSounds.length;
  }
  
  /**
   * Generate recommendations based on score breakdown
   */
  static generateRecommendations(breakdown: ScoreBreakdown, type: 'name' | 'lyric'): string[] {
    const recommendations: string[] = [];
    const threshold = 0.6; // Recommend improvements for scores below this
    
    if (breakdown.creativity < threshold) {
      recommendations.push(
        type === 'name' 
          ? 'Try more creative word combinations or unusual metaphors'
          : 'Use more original imagery and avoid common phrases'
      );
    }
    
    if (breakdown.appropriateness < threshold) {
      recommendations.push(
        type === 'name'
          ? 'Consider words that better match the genre and mood'
          : 'Ensure the lyrics fit the musical style and theme'
      );
    }
    
    if (breakdown.quality < threshold) {
      recommendations.push(
        type === 'name'
          ? 'Choose words that are easier to pronounce and remember'
          : 'Improve grammar, flow, and rhythm'
      );
    }
    
    if (breakdown.memorability < threshold) {
      recommendations.push(
        type === 'name'
          ? 'Add alliteration or rhythm to make it more memorable'
          : 'Create stronger emotional hooks and catchier phrases'
      );
    }
    
    if (breakdown.uniqueness < threshold) {
      recommendations.push(
        type === 'name'
          ? 'Avoid overused words and common clichés'
          : 'Use fresher language and avoid common lyrical clichés'
      );
    }
    
    if (breakdown.structure < threshold) {
      recommendations.push(
        type === 'name'
          ? 'Consider adjusting the length or word count'
          : 'Improve line structure and syllable distribution'
      );
    }
    
    return recommendations;
  }
}

// Performance monitoring utilities
export class PerformanceTracker {
  private static measurements: Map<string, number[]> = new Map();
  
  static startTiming(operation: string): () => number {
    const startTime = Date.now();
    
    return () => {
      const duration = Date.now() - startTime;
      this.recordTiming(operation, duration);
      return duration;
    };
  }
  
  static recordTiming(operation: string, duration: number): void {
    if (!this.measurements.has(operation)) {
      this.measurements.set(operation, []);
    }
    
    const measurements = this.measurements.get(operation)!;
    measurements.push(duration);
    
    // Keep only last 100 measurements
    if (measurements.length > 100) {
      measurements.shift();
    }
  }
  
  static getAverageTiming(operation: string): number {
    const measurements = this.measurements.get(operation);
    if (!measurements || measurements.length === 0) return 0;
    
    const sum = measurements.reduce((a, b) => a + b, 0);
    return sum / measurements.length;
  }
  
  static getAllTimings(): Record<string, { average: number; count: number }> {
    const result: Record<string, { average: number; count: number }> = {};
    
    for (const [operation, measurements] of this.measurements.entries()) {
      result[operation] = {
        average: this.getAverageTiming(operation),
        count: measurements.length
      };
    }
    
    return result;
  }
}