/**
 * Rhyme Detection Engine for Musical Name Generation
 * Analyzes rhyming patterns, assonance, consonance, and phonetic similarity
 */

import { secureLog } from '../../utils/secureLogger';
import { CacheService } from '../cacheService';
import { 
  PHONETIC_PATTERNS, 
  UTILITY_PATTERNS
} from '../nameGeneration/regexConstants';

export interface RhymeAnalysis {
  overall: number;              // Overall rhyme quality score (0-100)
  patterns: RhymePattern[];     // Detected rhyme patterns
  internalRhymes: InternalRhyme[]; // Rhymes within the name
  phoneticSimilarity: number;   // Phonetic cohesion score (0-100)
  rhymeScheme: string;          // Detected rhyme scheme (e.g., "AABA")
  musicality: RhymeMusicality;  // Musical quality metrics
  issues: string[];            // Any detected issues
  recommendations: string[];    // Improvement suggestions
}

export interface RhymePattern {
  type: 'perfect' | 'near' | 'slant' | 'assonance' | 'consonance' | 'alliteration';
  words: string[];
  positions: number[];
  strength: number;             // 0-100 strength of the rhyme
  phoneticMatch: string;        // The matching phonetic element
}

export interface InternalRhyme {
  word1: string;
  word2: string;
  position1: number;
  position2: number;
  type: 'perfect' | 'near' | 'assonance' | 'consonance';
  strength: number;
}

export interface RhymeMusicality {
  catchiness: number;           // How catchy the rhyme pattern is (0-100)
  memorability: number;         // How memorable (0-100)
  flow: number;                // How well it flows (0-100)
  impact: number;              // Overall impact (0-100)
  genreFit: number;            // Fit for musical genres (0-100)
}

export interface RhymeContext {
  genre?: string;
  type?: 'band' | 'song';
  mood?: string;
  targetAudience?: 'mainstream' | 'niche' | 'experimental';
}

export class RhymeDetectionEngine {
  private cache: CacheService<RhymeAnalysis>;
  
  // Phonetic mapping for rhyme detection
  private readonly phoneticMap = {
    // Vowel sounds (simplified phonetic representation)
    'a': ['a', 'ay', 'ai', 'ae'],
    'e': ['e', 'ee', 'ea', 'ie'],
    'i': ['i', 'y', 'igh', 'ie'],
    'o': ['o', 'oa', 'ow', 'ou'],
    'u': ['u', 'oo', 'ue', 'ew'],
    
    // Consonant clusters
    'th': ['th'],
    'sh': ['sh', 'tion', 'sion'],
    'ch': ['ch', 'tch'],
    'ph': ['ph', 'f'],
    'gh': ['gh', 'f'],
    'ck': ['ck', 'k', 'c'],
    'ng': ['ng', 'n']
  };
  
  // Common rhyme endings grouped by sound
  private readonly commonRhymeEndings = {
    'ight': ['light', 'bright', 'night', 'sight', 'fight', 'right'],
    'ound': ['sound', 'ground', 'found', 'bound', 'round'],
    'eart': ['heart', 'start', 'part', 'art', 'smart'],
    'ire': ['fire', 'wire', 'dire', 'tire', 'inspire'],
    'ream': ['dream', 'stream', 'cream', 'beam', 'team'],
    'ock': ['rock', 'shock', 'block', 'clock', 'stock'],
    'ead': ['head', 'dead', 'red', 'said', 'thread'],
    'ay': ['day', 'way', 'play', 'say', 'stay'],
    'ow': ['flow', 'grow', 'show', 'know', 'glow'],
    'aze': ['maze', 'blaze', 'craze', 'haze', 'gaze']
  };
  
  // Genre-specific rhyme preferences
  private readonly genrePreferences = {
    rock: {
      perfectRhymes: 0.7,      // Prefers strong, clear rhymes
      nearRhymes: 0.6,
      alliteration: 0.8,       // Strong consonant sounds
      assonance: 0.5
    },
    metal: {
      perfectRhymes: 0.8,      // Very strong rhymes for power
      nearRhymes: 0.5,
      alliteration: 0.9,       // Heavy alliteration
      assonance: 0.4
    },
    folk: {
      perfectRhymes: 0.6,      // More subtle rhyming
      nearRhymes: 0.8,         // Appreciates near rhymes
      alliteration: 0.5,
      assonance: 0.7           // Values vowel harmony
    },
    jazz: {
      perfectRhymes: 0.5,      // More sophisticated patterns
      nearRhymes: 0.9,         // Complex near rhymes
      alliteration: 0.6,
      assonance: 0.8           // Rich vowel play
    },
    pop: {
      perfectRhymes: 0.9,      // Clear, catchy rhymes
      nearRhymes: 0.7,
      alliteration: 0.7,
      assonance: 0.6
    },
    electronic: {
      perfectRhymes: 0.6,      // Experimental patterns
      nearRhymes: 0.7,
      alliteration: 0.8,       // Repetitive sounds
      assonance: 0.7
    }
  };
  
  constructor() {
    // Initialize cache with 2 hour TTL and max 3000 entries
    this.cache = new CacheService<RhymeAnalysis>(7200, 3000);
  }
  
  /**
   * Analyze rhyme patterns in a name
   */
  public analyzeRhymes(name: string, context?: RhymeContext): RhymeAnalysis {
    const cacheKey = `${name.toLowerCase()}_${JSON.stringify(context || {})}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached !== null) {
      secureLog.debug(`RhymeDetectionEngine cache hit for: ${name}`);
      return cached;
    }
    
    secureLog.debug(`RhymeDetectionEngine analyzing: ${name}`);
    
    const words = name.toLowerCase().split(UTILITY_PATTERNS.SINGLE_SPACE);
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    try {
      // Detect all rhyme patterns
      const patterns = this.detectRhymePatterns(words);
      
      // Find internal rhymes
      const internalRhymes = this.findInternalRhymes(words);
      
      // Calculate phonetic similarity
      const phoneticSimilarity = this.calculatePhoneticSimilarity(words);
      
      // Determine rhyme scheme
      const rhymeScheme = this.determineRhymeScheme(patterns, words.length);
      
      // Calculate musicality metrics
      const musicality = this.calculateRhymeMusicality(
        patterns, 
        internalRhymes, 
        phoneticSimilarity,
        context
      );
      
      // Calculate overall score
      const overall = this.calculateOverallRhymeScore(
        patterns,
        internalRhymes,
        phoneticSimilarity,
        musicality,
        context
      );
      
      // Generate recommendations
      this.generateRecommendations(patterns, musicality, context, recommendations, issues);
      
      const analysis: RhymeAnalysis = {
        overall,
        patterns,
        internalRhymes,
        phoneticSimilarity,
        rhymeScheme,
        musicality,
        issues,
        recommendations
      };
      
      // Cache the result
      this.cache.set(cacheKey, analysis);
      
      return analysis;
      
    } catch (error) {
      secureLog.error('Rhyme analysis failed:', error);
      return this.getDefaultAnalysis(name);
    }
  }
  
  /**
   * Detect various rhyme patterns in word list
   */
  private detectRhymePatterns(words: string[]): RhymePattern[] {
    const patterns: RhymePattern[] = [];
    
    if (words.length < 2) return patterns;
    
    // Check all word pairs for rhymes
    for (let i = 0; i < words.length; i++) {
      for (let j = i + 1; j < words.length; j++) {
        const word1 = words[i];
        const word2 = words[j];
        
        // Perfect rhymes
        const perfectRhyme = this.checkPerfectRhyme(word1, word2);
        if (perfectRhyme.strength > 0.7) {
          patterns.push({
            type: 'perfect',
            words: [word1, word2],
            positions: [i, j],
            strength: perfectRhyme.strength * 100,
            phoneticMatch: perfectRhyme.match
          });
        }
        
        // Near rhymes
        const nearRhyme = this.checkNearRhyme(word1, word2);
        if (nearRhyme.strength > 0.6) {
          patterns.push({
            type: 'near',
            words: [word1, word2],
            positions: [i, j],
            strength: nearRhyme.strength * 100,
            phoneticMatch: nearRhyme.match
          });
        }
        
        // Assonance (vowel sounds)
        const assonance = this.checkAssonance(word1, word2);
        if (assonance.strength > 0.6) {
          patterns.push({
            type: 'assonance',
            words: [word1, word2],
            positions: [i, j],
            strength: assonance.strength * 100,
            phoneticMatch: assonance.match
          });
        }
        
        // Consonance (consonant sounds)
        const consonance = this.checkConsonance(word1, word2);
        if (consonance.strength > 0.6) {
          patterns.push({
            type: 'consonance',
            words: [word1, word2],
            positions: [i, j],
            strength: consonance.strength * 100,
            phoneticMatch: consonance.match
          });
        }
        
        // Alliteration (initial consonants)
        const alliteration = this.checkAlliteration(word1, word2);
        if (alliteration.strength > 0.7) {
          patterns.push({
            type: 'alliteration',
            words: [word1, word2],
            positions: [i, j],
            strength: alliteration.strength * 100,
            phoneticMatch: alliteration.match
          });
        }
      }
    }
    
    return patterns;
  }
  
  /**
   * Check for perfect rhymes (identical ending sounds)
   */
  private checkPerfectRhyme(word1: string, word2: string): { strength: number; match: string } {
    // Get suffixes of different lengths
    const suffixes1 = this.getWordSuffixes(word1);
    const suffixes2 = this.getWordSuffixes(word2);
    
    let bestMatch = '';
    let bestStrength = 0;
    
    for (const suffix1 of suffixes1) {
      for (const suffix2 of suffixes2) {
        if (suffix1.length >= 2 && suffix1 === suffix2) {
          const strength = Math.min(suffix1.length / Math.max(word1.length, word2.length), 1);
          if (strength > bestStrength) {
            bestStrength = strength;
            bestMatch = suffix1;
          }
        }
      }
    }
    
    return { strength: bestStrength, match: bestMatch };
  }
  
  /**
   * Check for near rhymes (similar but not identical sounds)
   */
  private checkNearRhyme(word1: string, word2: string): { strength: number; match: string } {
    const endings1 = this.getPhoneticEndings(word1);
    const endings2 = this.getPhoneticEndings(word2);
    
    let bestStrength = 0;
    let bestMatch = '';
    
    for (const ending1 of endings1) {
      for (const ending2 of endings2) {
        const similarity = this.calculatePhoneticSimilarity([ending1, ending2]);
        if (similarity > bestStrength) {
          bestStrength = similarity / 100;
          bestMatch = `${ending1}~${ending2}`;
        }
      }
    }
    
    return { strength: bestStrength, match: bestMatch };
  }
  
  /**
   * Check for assonance (vowel sound repetition)
   */
  private checkAssonance(word1: string, word2: string): { strength: number; match: string } {
    const vowels1 = this.extractVowelPattern(word1);
    const vowels2 = this.extractVowelPattern(word2);
    
    if (vowels1.length === 0 || vowels2.length === 0) {
      return { strength: 0, match: '' };
    }
    
    const commonVowels = vowels1.filter(v => vowels2.includes(v));
    const strength = commonVowels.length / Math.max(vowels1.length, vowels2.length);
    
    return {
      strength,
      match: commonVowels.join(',')
    };
  }
  
  /**
   * Check for consonance (consonant sound repetition)
   */
  private checkConsonance(word1: string, word2: string): { strength: number; match: string } {
    const consonants1 = this.extractConsonantPattern(word1);
    const consonants2 = this.extractConsonantPattern(word2);
    
    if (consonants1.length === 0 || consonants2.length === 0) {
      return { strength: 0, match: '' };
    }
    
    const commonConsonants = consonants1.filter(c => consonants2.includes(c));
    const strength = commonConsonants.length / Math.max(consonants1.length, consonants2.length);
    
    return {
      strength,
      match: commonConsonants.join(',')
    };
  }
  
  /**
   * Check for alliteration (initial consonant repetition)
   */
  private checkAlliteration(word1: string, word2: string): { strength: number; match: string } {
    const initial1 = this.getInitialConsonantCluster(word1);
    const initial2 = this.getInitialConsonantCluster(word2);
    
    if (initial1 === initial2 && initial1.length > 0) {
      return {
        strength: 1.0,
        match: initial1
      };
    }
    
    // Check for similar initial consonants
    const similarity = this.compareConsonantClusters(initial1, initial2);
    return {
      strength: similarity,
      match: similarity > 0.5 ? `${initial1}~${initial2}` : ''
    };
  }
  
  /**
   * Find internal rhymes within words
   */
  private findInternalRhymes(words: string[]): InternalRhyme[] {
    const internalRhymes: InternalRhyme[] = [];
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      
      // Skip words too short to have internal rhymes
      if (word.length < 4) continue;
      
      // Look for internal rhyming patterns
      const syllables = this.breakIntoSyllables(word);
      if (syllables.length >= 2) {
        for (let j = 0; j < syllables.length; j++) {
          for (let k = j + 1; k < syllables.length; k++) {
            const rhyme = this.checkPerfectRhyme(syllables[j], syllables[k]);
            if (rhyme.strength > 0.6) {
              internalRhymes.push({
                word1: syllables[j],
                word2: syllables[k],
                position1: j,
                position2: k,
                type: 'perfect',
                strength: rhyme.strength * 100
              });
            }
          }
        }
      }
    }
    
    return internalRhymes;
  }
  
  /**
   * Calculate phonetic similarity across all words
   */
  private calculatePhoneticSimilarity(words: string[]): number {
    if (words.length < 2) return 50;
    
    let totalSimilarity = 0;
    let comparisons = 0;
    
    for (let i = 0; i < words.length; i++) {
      for (let j = i + 1; j < words.length; j++) {
        const phoneticWord1 = this.getPhoneticRepresentation(words[i]);
        const phoneticWord2 = this.getPhoneticRepresentation(words[j]);
        
        const similarity = this.comparePhoneticPatterns(phoneticWord1, phoneticWord2);
        totalSimilarity += similarity;
        comparisons++;
      }
    }
    
    return comparisons > 0 ? (totalSimilarity / comparisons) * 100 : 50;
  }
  
  /**
   * Determine rhyme scheme pattern
   */
  private determineRhymeScheme(patterns: RhymePattern[], wordCount: number): string {
    if (wordCount < 2) return 'X';
    if (wordCount === 2) {
      const hasRhyme = patterns.some(p => p.type === 'perfect' || p.type === 'near');
      return hasRhyme ? 'AA' : 'AB';
    }
    
    // For 3+ words, analyze the pattern
    const rhymeGroups: string[] = new Array(wordCount).fill('');
    let currentLetter = 'A';
    const letterMap = new Map<string, string>();
    
    for (let i = 0; i < wordCount; i++) {
      const word = i.toString();
      let assigned = false;
      
      // Find if this word rhymes with a previous word
      for (const pattern of patterns) {
        if (pattern.positions.includes(i) && (pattern.type === 'perfect' || pattern.type === 'near')) {
          const otherPos = pattern.positions.find(pos => pos !== i);
          if (otherPos !== undefined && rhymeGroups[otherPos]) {
            rhymeGroups[i] = rhymeGroups[otherPos];
            assigned = true;
            break;
          }
        }
      }
      
      // If not assigned, give it a new letter
      if (!assigned) {
        rhymeGroups[i] = currentLetter;
        currentLetter = String.fromCharCode(currentLetter.charCodeAt(0) + 1);
      }
    }
    
    return rhymeGroups.join('');
  }
  
  /**
   * Calculate overall musicality metrics
   */
  private calculateRhymeMusicality(
    patterns: RhymePattern[],
    internalRhymes: InternalRhyme[],
    phoneticSimilarity: number,
    context?: RhymeContext
  ): RhymeMusicality {
    const genrePrefs = context?.genre && context.genre in this.genrePreferences 
      ? this.genrePreferences[context.genre as keyof typeof this.genrePreferences] 
      : this.genrePreferences.pop;
    
    // Calculate catchiness based on pattern strength and type
    let catchiness = 50;
    for (const pattern of patterns) {
      const weight = genrePrefs?.[pattern.type === 'perfect' ? 'perfectRhymes' : 'nearRhymes'] || 0.7;
      catchiness += (pattern.strength * weight * 0.3);
    }
    catchiness = Math.min(100, catchiness);
    
    // Calculate memorability
    const hasStrongRhymes = patterns.some(p => p.strength > 80);
    const hasAlliteration = patterns.some(p => p.type === 'alliteration');
    let memorability = phoneticSimilarity * 0.6;
    if (hasStrongRhymes) memorability += 25;
    if (hasAlliteration) memorability += 15;
    if (internalRhymes.length > 0) memorability += 10;
    memorability = Math.min(100, memorability);
    
    // Calculate flow
    const perfectRhymes = patterns.filter(p => p.type === 'perfect').length;
    const nearRhymes = patterns.filter(p => p.type === 'near').length;
    let flow = 60;
    flow += perfectRhymes * 15;
    flow += nearRhymes * 10;
    flow += Math.min(internalRhymes.length * 5, 20);
    flow = Math.min(100, flow);
    
    // Calculate impact
    const strongPatterns = patterns.filter(p => p.strength > 75).length;
    let impact = (strongPatterns * 20) + (phoneticSimilarity * 0.4);
    impact = Math.min(100, impact);
    
    // Calculate genre fit
    let genreFit = 70; // Default
    if (genrePrefs) {
      genreFit = 0;
      for (const pattern of patterns) {
        const pref = genrePrefs[pattern.type === 'perfect' ? 'perfectRhymes' : 
                             pattern.type === 'alliteration' ? 'alliteration' : 'nearRhymes'];
        genreFit += (pattern.strength * pref * 0.8);
      }
      genreFit = Math.min(100, Math.max(30, genreFit));
    }
    
    return {
      catchiness: Math.round(catchiness),
      memorability: Math.round(memorability),
      flow: Math.round(flow),
      impact: Math.round(impact),
      genreFit: Math.round(genreFit)
    };
  }
  
  /**
   * Calculate overall rhyme score
   */
  private calculateOverallRhymeScore(
    patterns: RhymePattern[],
    internalRhymes: InternalRhyme[],
    phoneticSimilarity: number,
    musicality: RhymeMusicality,
    context?: RhymeContext
  ): number {
    // Base score from patterns
    let score = 40; // Base score
    
    // Add points for different types of patterns
    for (const pattern of patterns) {
      switch (pattern.type) {
        case 'perfect':
          score += pattern.strength * 0.4;
          break;
        case 'near':
          score += pattern.strength * 0.3;
          break;
        case 'assonance':
          score += pattern.strength * 0.2;
          break;
        case 'consonance':
          score += pattern.strength * 0.2;
          break;
        case 'alliteration':
          score += pattern.strength * 0.3;
          break;
      }
    }
    
    // Add points for internal rhymes
    score += Math.min(internalRhymes.length * 5, 15);
    
    // Add phonetic similarity bonus
    score += phoneticSimilarity * 0.2;
    
    // Weight by musicality
    const musicalityWeight = (musicality.catchiness + musicality.memorability + 
                             musicality.flow + musicality.impact) / 4;
    score = score * (0.7 + (musicalityWeight / 100) * 0.3);
    
    return Math.round(Math.min(100, Math.max(0, score)));
  }
  
  /**
   * Generate improvement recommendations
   */
  private generateRecommendations(
    patterns: RhymePattern[],
    musicality: RhymeMusicality,
    context: RhymeContext | undefined,
    recommendations: string[],
    issues: string[]
  ): void {
    // Check for lack of rhyming
    if (patterns.length === 0) {
      issues.push('No rhyming patterns detected');
      recommendations.push('Consider adding words that rhyme or have similar sounds');
    }
    
    // Check musicality scores
    if (musicality.catchiness < 50) {
      recommendations.push('Enhance catchiness with stronger rhymes or alliteration');
    }
    
    if (musicality.flow < 60) {
      recommendations.push('Improve flow by ensuring smoother sound transitions between words');
    }
    
    if (musicality.memorability < 60) {
      recommendations.push('Add memorable elements like perfect rhymes or strong consonants');
    }
    
    if (context?.genre) {
      const prefs = context.genre in this.genrePreferences 
        ? this.genrePreferences[context.genre as keyof typeof this.genrePreferences]
        : null;
      if (prefs && musicality.genreFit < 60) {
        if (context.genre === 'rock' || context.genre === 'metal') {
          recommendations.push('Add more alliteration and strong consonants for genre appeal');
        } else if (context.genre === 'folk') {
          recommendations.push('Consider subtle near rhymes and vowel harmony');
        } else if (context.genre === 'jazz') {
          recommendations.push('Experiment with sophisticated near rhymes and complex patterns');
        }
      }
    }
  }
  
  // Helper methods
  private getWordSuffixes(word: string): string[] {
    const suffixes: string[] = [];
    for (let i = 1; i <= Math.min(word.length, 4); i++) {
      suffixes.push(word.slice(-i));
    }
    return suffixes;
  }
  
  private getPhoneticEndings(word: string): string[] {
    // Simplified phonetic ending extraction
    const endings: string[] = [];
    const len = word.length;
    
    if (len >= 2) endings.push(word.slice(-2));
    if (len >= 3) endings.push(word.slice(-3));
    if (len >= 4) endings.push(word.slice(-4));
    
    return endings;
  }
  
  private extractVowelPattern(word: string): string[] {
    return word.match(/[aeiou]/g) || [];
  }
  
  private extractConsonantPattern(word: string): string[] {
    return word.match(/[bcdfghjklmnpqrstvwxyz]/g) || [];
  }
  
  private getInitialConsonantCluster(word: string): string {
    const match = word.match(/^[bcdfghjklmnpqrstvwxyz]+/);
    return match ? match[0] : '';
  }
  
  private compareConsonantClusters(cluster1: string, cluster2: string): number {
    if (cluster1 === cluster2) return 1.0;
    if (cluster1.length === 0 || cluster2.length === 0) return 0;
    
    // Simple similarity based on common letters
    const common = cluster1.split('').filter(c => cluster2.includes(c)).length;
    return common / Math.max(cluster1.length, cluster2.length);
  }
  
  private breakIntoSyllables(word: string): string[] {
    // Simplified syllable breaking
    const syllables = word.split(/[aeiou][bcdfghjklmnpqrstvwxyz]*/);
    return syllables.filter(s => s.length > 0);
  }
  
  private getPhoneticRepresentation(word: string): string {
    // Simplified phonetic representation
    let phonetic = word.toLowerCase();
    
    // Replace common phonetic patterns
    phonetic = phonetic.replace(/ph/g, 'f');
    phonetic = phonetic.replace(/gh/g, 'f');
    phonetic = phonetic.replace(/ck/g, 'k');
    phonetic = phonetic.replace(/qu/g, 'kw');
    
    return phonetic;
  }
  
  private comparePhoneticPatterns(pattern1: string, pattern2: string): number {
    if (pattern1 === pattern2) return 1.0;
    
    const len1 = pattern1.length;
    const len2 = pattern2.length;
    const maxLen = Math.max(len1, len2);
    
    let matches = 0;
    for (let i = 0; i < Math.min(len1, len2); i++) {
      if (pattern1[i] === pattern2[i]) matches++;
    }
    
    return matches / maxLen;
  }
  
  private getDefaultAnalysis(name: string): RhymeAnalysis {
    return {
      overall: 40,
      patterns: [],
      internalRhymes: [],
      phoneticSimilarity: 50,
      rhymeScheme: 'X',
      musicality: {
        catchiness: 40,
        memorability: 40,
        flow: 40,
        impact: 40,
        genreFit: 50
      },
      issues: ['Analysis failed - using default values'],
      recommendations: ['Try simpler word combinations for better analysis']
    };
  }
  
  /**
   * Public method to get cache statistics
   */
  public getCacheStats() {
    return {
      size: (this.cache as any).cache ? (this.cache as any).cache.size : 0,
      hitRate: (this.cache as any).hitRate || 0,
      maxSize: 3000
    };
  }
}

// Export singleton instance
export const rhymeDetectionEngine = new RhymeDetectionEngine();