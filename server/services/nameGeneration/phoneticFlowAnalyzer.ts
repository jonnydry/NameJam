/**
 * Phonetic Flow Analyzer for Music Name Generation
 * Evaluates names for pronunciation, memorability, and sonic quality
 */

import { secureLog } from '../../utils/secureLogger';
import { CacheService } from '../cacheService';
import { 
  PHONETIC_PATTERNS, 
  UTILITY_PATTERNS, 
  PatternTester 
} from './regexConstants';

interface PhoneticScore {
  overall: number; // 0-100
  pronunciation: number; // How easy to pronounce
  flow: number; // How well words flow together
  memorability: number; // How memorable/catchy
  uniqueness: number; // How distinctive the sound pattern is
  issues: string[]; // List of detected issues
}

interface PhoneticCacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
  maxSize: number;
  warmingComplete: boolean;
}

export class PhoneticFlowAnalyzer {
  // Cache for phonetic analysis results
  private cache: CacheService<PhoneticScore>;
  private warmingComplete: boolean = false;
  
  // Common musical words for cache warming (expanded for better coverage)
  private readonly commonWords = [
    'music', 'sound', 'beat', 'rhythm', 'melody', 'harmony', 'song', 'band',
    'rock', 'jazz', 'blues', 'soul', 'funk', 'metal', 'punk', 'folk',
    'dream', 'shadow', 'light', 'fire', 'storm', 'echo', 'wave', 'flow',
    'heart', 'mind', 'spirit', 'love', 'hope', 'fear', 'rage', 'joy',
    'electric', 'cosmic', 'neon', 'dark', 'bright', 'wild', 'free', 'lost',
    'black', 'white', 'red', 'blue', 'gold', 'silver', 'green', 'purple',
    'crystal', 'diamond', 'emerald', 'ruby', 'sapphire', 'amber', 'jade',
    'midnight', 'dawn', 'sunset', 'twilight', 'aurora', 'starlight', 'moonlight',
    'thunder', 'lightning', 'rainbow', 'cloud', 'sky', 'ocean', 'mountain',
    'valley', 'river', 'forest', 'desert', 'canyon', 'island', 'bridge',
    'castle', 'tower', 'temple', 'palace', 'garden', 'meadow', 'field',
    'crimson', 'azure', 'violet', 'scarlet', 'emerald', 'amber', 'coral',
    'steel', 'iron', 'copper', 'bronze', 'platinum', 'titanium', 'chrome'
  ];
  
  // Consonant clusters that are hard to pronounce
  private readonly difficultClusters = [
    'xth', 'fth', 'sth', 'pth', 'kth', 'tch', 'dg',
    'ght', 'gth', 'ngth', 'xts', 'pts', 'cts', 'rsts'
  ];
  
  // Vowel patterns that flow well (now using precompiled patterns)
  private readonly goodVowelPatterns = [
    PHONETIC_PATTERNS.CONSONANT_BETWEEN_VOWELS, // consonant between vowels
    PHONETIC_PATTERNS.VOWEL_CLUSTERS, // 1-2 vowels between consonants
    PHONETIC_PATTERNS.STARTS_VOWEL_CONSONANTS, // starts with vowel followed by consonants
    PHONETIC_PATTERNS.ENDS_CONSONANTS_VOWEL // ends with consonants followed by vowel
  ];
  
  // Syllable stress patterns (now using precompiled patterns)
  private readonly stressPatterns = {
    iambic: PHONETIC_PATTERNS.IAMBIC, // weak-STRONG
    trochaic: PHONETIC_PATTERNS.TROCHAIC, // STRONG-weak
    dactylic: PHONETIC_PATTERNS.DACTYLIC, // STRONG-weak-weak
    anapestic: PHONETIC_PATTERNS.ANAPESTIC // weak-weak-STRONG
  };
  
  constructor() {
    // Initialize cache with 2 hour TTL and max 10000 entries for phonetic analysis
    this.cache = new CacheService<PhoneticScore>(7200, 10000);
    
    // Start cache warming in background
    this.warmCache();
  }
  
  /**
   * Analyze the phonetic quality of a name with caching
   */
  public analyzePhoneticFlow(name: string): PhoneticScore {
    // Normalize the name for consistent cache keys
    const cacheKey = this.normalizeCacheKey(name);
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached !== null) {
      secureLog.debug(`PhoneticFlowAnalyzer cache hit for: ${name}`);
      return cached;
    }
    
    // Cache miss - perform analysis
    secureLog.debug(`PhoneticFlowAnalyzer cache miss for: ${name}`);
    const result = this.performPhoneticAnalysis(name);
    
    // Cache the result
    this.cache.set(cacheKey, result);
    
    return result;
  }
  
  /**
   * Perform the actual phonetic analysis (uncached)
   */
  private performPhoneticAnalysis(name: string): PhoneticScore {
    const words = name.split(UTILITY_PATTERNS.SINGLE_SPACE);
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
    
    // Check for too many consecutive consonants (using precompiled pattern)
    const consonantRuns = lowerName.match(PHONETIC_PATTERNS.CONSECUTIVE_CONSONANTS);
    if (consonantRuns) {
      score -= consonantRuns.length * 15;
      issues.push(`Too many consecutive consonants: ${consonantRuns.join(', ')}`);
    }
    
    // Check for too many consecutive vowels (using precompiled pattern)
    const vowelRuns = lowerName.match(PHONETIC_PATTERNS.CONSECUTIVE_VOWELS);
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
    
    // Unique letter combinations (using precompiled pattern)
    const hasUnusualCombos = PHONETIC_PATTERNS.UNUSUAL_COMBINATIONS.test(name.toLowerCase());
    if (hasUnusualCombos) {
      score += 15;
    }
    
    // Mixed case patterns (like "McFly" or "LaRoux") (using precompiled pattern)
    const hasMixedCase = PHONETIC_PATTERNS.MIXED_CASE.test(name);
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
   * Helper: Check for distinctive sound patterns (using precompiled patterns)
   */
  private hasDistinctivePattern(name: string): boolean {
    return PHONETIC_PATTERNS.REPEATED_LETTERS.test(name) ||
           PHONETIC_PATTERNS.CAMEL_CASE.test(name) ||
           PHONETIC_PATTERNS.STARTS_NON_LETTER.test(name) ||
           PHONETIC_PATTERNS.CONTAINS_NUMBERS.test(name) ||
           PHONETIC_PATTERNS.SPECIAL_CHARACTERS.test(name);
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
  
  /**
   * Normalize cache key for consistent caching (using precompiled pattern)
   */
  private normalizeCacheKey(name: string): string {
    return name.toLowerCase().trim().replace(UTILITY_PATTERNS.MULTIPLE_SPACES, ' ');
  }
  
  /**
   * Warm the cache with common words and combinations
   */
  private async warmCache(): Promise<void> {
    try {
      secureLog.info('Starting phonetic analysis cache warming...');
      
      // Single words
      for (const word of this.commonWords) {
        const cacheKey = this.normalizeCacheKey(word);
        this.cache.set(cacheKey, this.performPhoneticAnalysis(word));
      }
      
      // Common two-word combinations (expanded for better coverage)
      const sampleCombinations = [
        'dark shadow', 'electric storm', 'neon dream', 'cosmic wave',
        'fire heart', 'silver moon', 'black rose', 'wild spirit',
        'lost soul', 'bright light', 'deep blue', 'golden hour',
        'metal storm', 'jazz fusion', 'rock solid', 'folk tale',
        'crystal vision', 'diamond dust', 'emerald city', 'ruby red',
        'sapphire sky', 'amber glow', 'jade wind', 'crimson tide',
        'azure wave', 'violet storm', 'scarlet fire', 'coral reef',
        'steel thunder', 'iron will', 'copper sun', 'bronze age',
        'platinum dreams', 'titanium soul', 'chrome heart', 'midnight echo',
        'dawn breaker', 'sunset rider', 'twilight zone', 'aurora borealis',
        'starlight symphony', 'moonlight sonata', 'thunder strike', 'lightning bolt',
        'rainbow bridge', 'cloud nine', 'sky high', 'ocean deep',
        'mountain peak', 'valley low', 'river flow', 'forest green',
        'desert storm', 'canyon echo', 'island breeze', 'bridge over',
        'castle rock', 'tower high', 'temple bell', 'palace guard',
        'garden party', 'meadow song', 'field of dreams', 'crystal clear',
        'diamond hard', 'emerald eyes', 'ruby lips', 'sapphire tears',
        'amber waves', 'jade stone', 'crimson dawn', 'azure sky',
        'violet night', 'scarlet letter', 'coral reef', 'steel resolve',
        'iron maiden', 'copper penny', 'bronze medal', 'platinum blonde',
        'titanium strength', 'chrome dome', 'midnight oil', 'dawn patrol',
        'sunset boulevard', 'twilight princess', 'aurora australis', 'starlight express',
        'moonlight serenade', 'thunder road', 'lightning rod', 'rainbow connection',
        'cloud atlas', 'sky fall', 'ocean drive', 'mountain top',
        'valley girl', 'river song', 'forest gump', 'desert rose',
        'canyon road', 'island time', 'bridge to nowhere', 'castle in the sky',
        'tower of power', 'temple of doom', 'palace intrigue', 'garden variety',
        'meadow lark', 'field marshal', 'crystal ball', 'diamond in the rough',
        'emerald isle', 'ruby slippers', 'sapphire blue', 'amber alert',
        'jade empire', 'crimson tide', 'azure dragon', 'violet hour',
        'scarlet fever', 'coral snake', 'steel magnolia', 'iron butterfly',
        'copper kettle', 'bronze age', 'platinum record', 'titanium white',
        'chrome yellow', 'midnight express', 'dawn of the dead', 'sunset strip',
        'twilight zone', 'aurora borealis', 'starlight hotel', 'moonlight mile',
        'thunder bay', 'lightning bug', 'rainbow warrior', 'cloud nine',
        'sky blue', 'ocean pearl', 'mountain dew', 'valley forge',
        'river phoenix', 'forest fire', 'desert storm', 'canyon country',
        'island nation', 'bridge city', 'castle rock', 'tower bridge',
        'temple bar', 'palace hotel', 'garden state', 'meadow brook',
        'field of honor', 'crystal palace', 'diamond head', 'emerald coast',
        'ruby mountain', 'sapphire sea', 'amber waves', 'jade mountain',
        'crimson king', 'azure coast', 'violet crown', 'scarlet letter',
        'coral sea', 'steel city', 'iron mountain', 'copper mountain',
        'bronze star', 'platinum coast', 'titanium valley', 'chrome city',
        'midnight sun', 'dawn patrol', 'sunset beach', 'twilight zone',
        'aurora sky', 'starlight drive', 'moonlight bay', 'thunder mountain',
        'lightning ridge', 'rainbow mountain', 'cloud peak', 'sky island',
        'ocean view', 'mountain view', 'valley view', 'river view',
        'forest view', 'desert view', 'canyon view', 'island view',
        'bridge view', 'castle view', 'tower view', 'temple view',
        'palace view', 'garden view', 'meadow view', 'field view'
      ];
      
      for (const combination of sampleCombinations) {
        const cacheKey = this.normalizeCacheKey(combination);
        this.cache.set(cacheKey, this.performPhoneticAnalysis(combination));
      }
      
      this.warmingComplete = true;
      secureLog.info(`Phonetic analysis cache warmed with ${this.commonWords.length + sampleCombinations.length} entries`);
    } catch (error) {
      secureLog.error('Error during cache warming:', error);
    }
  }
  
  /**
   * Get cache statistics for monitoring
   */
  public getCacheStats(): PhoneticCacheStats {
    const stats = this.cache.getStats();
    return {
      hits: stats.hits,
      misses: stats.misses,
      hitRate: stats.hitRate,
      size: stats.size,
      maxSize: stats.maxSize,
      warmingComplete: this.warmingComplete
    };
  }
  
  /**
   * Clear the cache (for testing or admin purposes)
   */
  public clearCache(): void {
    this.cache.clear();
    this.warmingComplete = false;
    secureLog.info('Phonetic analysis cache cleared');
  }
  
  /**
   * Pre-analyze and cache a list of names
   */
  public preAnalyze(names: string[]): void {
    for (const name of names) {
      this.analyzePhoneticFlow(name);
    }
    secureLog.info(`Pre-analyzed and cached ${names.length} names`);
  }
}

// Export singleton instance
export const phoneticFlowAnalyzer = new PhoneticFlowAnalyzer();