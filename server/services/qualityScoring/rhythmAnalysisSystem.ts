/**
 * Rhythm Analysis System for Musical Name Generation
 * Analyzes syllable patterns, stress, meter, and rhythmic flow for musical appeal
 */

import { secureLog } from '../../utils/secureLogger';
import { CacheService } from '../cacheService';
import { UTILITY_PATTERNS } from '../nameGeneration/regexConstants';

export interface RhythmAnalysis {
  overall: number;                    // Overall rhythm quality score (0-100)
  syllablePattern: SyllablePattern;   // Syllable structure analysis
  stressPattern: StressPattern;       // Stress/emphasis pattern
  meter: MeterAnalysis;               // Detected meter type
  flow: RhythmicFlow;                 // Flow between words
  musicality: RhythmMusicality;       // Musical rhythm qualities
  timing: TimingAnalysis;             // Musical timing characteristics
  issues: string[];                   // Detected rhythm issues
  recommendations: string[];          // Improvement suggestions
}

export interface SyllablePattern {
  totalSyllables: number;
  syllableDistribution: number[];     // Syllables per word
  balance: number;                    // How balanced the distribution is (0-100)
  complexity: number;                 // Complexity score (0-100)
  pattern: string;                    // Pattern notation (e.g., "2-3-1")
}

export interface StressPattern {
  pattern: string;                    // Stress pattern notation (e.g., "w-S-w")
  primaryStresses: number[];          // Positions of primary stress
  secondaryStresses: number[];        // Positions of secondary stress
  naturalness: number;                // How natural the stress feels (0-100)
  emphasis: number;                   // Overall emphasis strength (0-100)
}

export interface MeterAnalysis {
  type: MeterType;
  confidence: number;                 // Confidence in meter detection (0-100)
  regularity: number;                 // How regular the meter is (0-100)
  musicalFit: number;                 // How well it fits musical contexts (0-100)
  timeSignature: string;              // Suggested musical time signature
}

export type MeterType = 'iambic' | 'trochaic' | 'dactylic' | 'anapestic' | 'spondaic' | 'pyrrhic' | 'mixed' | 'free';

export interface RhythmicFlow {
  overallFlow: number;                // Overall rhythmic flow (0-100)
  wordTransitions: WordTransition[];  // Flow between word pairs
  continuity: number;                 // Rhythmic continuity (0-100)
  momentum: number;                   // Forward momentum (0-100)
  smoothness: number;                 // Smoothness of transitions (0-100)
}

export interface WordTransition {
  from: string;
  to: string;
  flowScore: number;                  // How well they flow together (0-100)
  stressMatch: boolean;               // Whether stress patterns align
  syllableBalance: number;            // Balance in syllable count
}

export interface RhythmMusicality {
  danceability: number;               // How danceable the rhythm feels (0-100)
  energy: number;                     // Rhythmic energy level (0-100)
  catchiness: number;                 // How catchy the rhythm is (0-100)
  memorability: number;               // Rhythmic memorability (0-100)
  genreAlignment: number;             // Alignment with genre expectations (0-100)
}

export interface TimingAnalysis {
  bpm: number;                        // Estimated beats per minute
  subdivision: string;                // Note subdivision (quarter, eighth, etc.)
  syncopation: number;                // Amount of syncopation (0-100)
  groove: string;                     // Groove type (straight, swing, latin, etc.)
  musicalPhrase: string;              // Musical phrase structure
}

export interface RhythmContext {
  genre?: string;
  type?: 'band' | 'song';
  mood?: string;
  tempo?: 'slow' | 'medium' | 'fast' | 'variable';
  targetAudience?: 'mainstream' | 'niche' | 'experimental';
}

export class RhythmAnalysisSystem {
  private cache: CacheService<RhythmAnalysis>;
  
  // Syllable detection patterns
  private readonly vowelPattern = /[aeiouy]+/gi;
  private readonly consonantCluster = /[bcdfghjklmnpqrstvwxz]{2,}/gi;
  private readonly silentE = /e$/i;
  
  // Stress patterns for common words (simplified)
  private readonly stressMap = new Map([
    // Common single-syllable words (always stressed)
    ['rock', 'S'], ['fire', 'S'], ['dark', 'S'], ['light', 'S'],
    ['dream', 'S'], ['heart', 'S'], ['soul', 'S'], ['mind', 'S'],
    
    // Common two-syllable words
    ['music', 'Sw'], ['shadow', 'Sw'], ['thunder', 'Sw'], ['silver', 'Sw'],
    ['electric', 'wSw'], ['acoustic', 'wSw'], ['mysterious', 'wSww'],
    ['beautiful', 'Sww'], ['wonderful', 'Sww'],
    
    // Musical terms
    ['rhythm', 'Sw'], ['melody', 'Sww'], ['harmony', 'Sww'],
    ['symphony', 'Sww'], ['acoustic', 'wSw'], ['electric', 'wSw']
  ]);
  
  // Genre-specific rhythm preferences
  private readonly genreRhythmPrefs = {
    rock: {
      preferredMeters: ['trochaic', 'iambic'],
      energyTarget: 80,
      syllableRange: [2, 6],
      stressPattern: 'strong',
      timing: { bpm: [120, 180], groove: 'straight' }
    },
    metal: {
      preferredMeters: ['trochaic', 'spondaic'],
      energyTarget: 90,
      syllableRange: [1, 4],
      stressPattern: 'very_strong',
      timing: { bpm: [140, 200], groove: 'straight' }
    },
    jazz: {
      preferredMeters: ['mixed', 'syncopated'],
      energyTarget: 60,
      syllableRange: [3, 8],
      stressPattern: 'subtle',
      timing: { bpm: [80, 160], groove: 'swing' }
    },
    folk: {
      preferredMeters: ['iambic', 'anapestic'],
      energyTarget: 50,
      syllableRange: [2, 6],
      stressPattern: 'natural',
      timing: { bpm: [60, 120], groove: 'straight' }
    },
    electronic: {
      preferredMeters: ['mixed', 'free'],
      energyTarget: 75,
      syllableRange: [1, 6],
      stressPattern: 'synthetic',
      timing: { bpm: [100, 180], groove: 'quantized' }
    },
    pop: {
      preferredMeters: ['iambic', 'trochaic'],
      energyTarget: 70,
      syllableRange: [2, 5],
      stressPattern: 'balanced',
      timing: { bpm: [100, 140], groove: 'straight' }
    }
  };
  
  // Musical time signatures mapped to syllable patterns
  private readonly timeSignatureMap = {
    '4/4': [2, 4, 6, 8],
    '3/4': [3, 6, 9],
    '2/4': [2, 4, 6],
    '6/8': [3, 6],
    '12/8': [6, 12],
    '5/4': [5, 10],
    '7/8': [7, 14]
  };
  
  constructor() {
    // Initialize cache with 2 hour TTL and max 2500 entries
    this.cache = new CacheService<RhythmAnalysis>(7200, 2500);
  }
  
  /**
   * Analyze rhythm patterns in a name
   */
  public analyzeRhythm(name: string, context?: RhythmContext): RhythmAnalysis {
    const cacheKey = `${name.toLowerCase()}_${JSON.stringify(context || {})}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached !== null) {
      secureLog.debug(`RhythmAnalysisSystem cache hit for: ${name}`);
      return cached;
    }
    
    secureLog.debug(`RhythmAnalysisSystem analyzing: ${name}`);
    
    const words = name.split(UTILITY_PATTERNS.SINGLE_SPACE);
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    try {
      // Analyze syllable patterns
      const syllablePattern = this.analyzeSyllablePattern(words);
      
      // Analyze stress patterns
      const stressPattern = this.analyzeStressPattern(words, syllablePattern);
      
      // Detect meter
      const meter = this.detectMeter(syllablePattern, stressPattern, context);
      
      // Analyze rhythmic flow
      const flow = this.analyzeRhythmicFlow(words, syllablePattern, stressPattern);
      
      // Calculate musicality
      const musicality = this.calculateRhythmMusicality(
        syllablePattern,
        stressPattern,
        meter,
        flow,
        context
      );
      
      // Analyze timing characteristics
      const timing = this.analyzeMusicalTiming(
        syllablePattern,
        stressPattern,
        meter,
        context
      );
      
      // Calculate overall score
      const overall = this.calculateOverallRhythmScore(
        syllablePattern,
        stressPattern,
        meter,
        flow,
        musicality,
        timing,
        context
      );
      
      // Generate recommendations
      this.generateRhythmRecommendations(
        syllablePattern,
        stressPattern,
        meter,
        flow,
        musicality,
        context,
        recommendations,
        issues
      );
      
      const analysis: RhythmAnalysis = {
        overall,
        syllablePattern,
        stressPattern,
        meter,
        flow,
        musicality,
        timing,
        issues,
        recommendations
      };
      
      // Cache the result
      this.cache.set(cacheKey, analysis);
      
      return analysis;
      
    } catch (error) {
      secureLog.error('Rhythm analysis failed:', error);
      return this.getDefaultAnalysis(name);
    }
  }
  
  /**
   * Analyze syllable distribution pattern
   */
  private analyzeSyllablePattern(words: string[]): SyllablePattern {
    const syllableCounts = words.map(word => this.countSyllables(word));
    const totalSyllables = syllableCounts.reduce((sum, count) => sum + count, 0);
    
    // Calculate balance (how evenly distributed syllables are)
    const averageSyllables = totalSyllables / words.length;
    const variance = syllableCounts.reduce((sum, count) => 
      sum + Math.pow(count - averageSyllables, 2), 0) / words.length;
    const balance = Math.max(0, 100 - (variance * 20)); // Lower variance = better balance
    
    // Calculate complexity
    const uniqueCounts = new Set(syllableCounts).size;
    const complexity = Math.min(100, (uniqueCounts / words.length) * 100 + variance * 10);
    
    // Generate pattern notation
    const pattern = syllableCounts.join('-');
    
    return {
      totalSyllables,
      syllableDistribution: syllableCounts,
      balance: Math.round(balance),
      complexity: Math.round(complexity),
      pattern
    };
  }
  
  /**
   * Count syllables in a word
   */
  private countSyllables(word: string): number {
    if (word.length <= 2) return 1;
    
    const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
    
    // Count vowel groups
    let syllables = (cleanWord.match(this.vowelPattern) || []).length;
    
    // Adjust for silent 'e'
    if (this.silentE.test(cleanWord) && syllables > 1) {
      syllables--;
    }
    
    // Handle consonant clusters that might indicate syllable breaks
    const clusters = cleanWord.match(this.consonantCluster) || [];
    syllables += Math.floor(clusters.length / 3); // Very rough approximation
    
    // Minimum of 1 syllable per word
    return Math.max(1, syllables);
  }
  
  /**
   * Analyze stress patterns
   */
  private analyzeStressPattern(words: string[], syllablePattern: SyllablePattern): StressPattern {
    let fullPattern = '';
    const primaryStresses: number[] = [];
    const secondaryStresses: number[] = [];
    let position = 0;
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const syllableCount = syllablePattern.syllableDistribution[i];
      
      // Get stress pattern for this word
      const wordStress = this.getWordStressPattern(word, syllableCount);
      fullPattern += wordStress;
      
      // Record stress positions
      for (let j = 0; j < wordStress.length; j++) {
        if (wordStress[j] === 'S') {
          primaryStresses.push(position + j);
        } else if (wordStress[j] === 's') {
          secondaryStresses.push(position + j);
        }
      }
      
      position += syllableCount;
      if (i < words.length - 1) fullPattern += '-';
    }
    
    // Calculate naturalness (how natural the stress pattern feels)
    const naturalness = this.calculateStressNaturalness(fullPattern, words);
    
    // Calculate emphasis strength
    const emphasis = this.calculateEmphasisStrength(primaryStresses, secondaryStresses, syllablePattern.totalSyllables);
    
    return {
      pattern: fullPattern,
      primaryStresses,
      secondaryStresses,
      naturalness: Math.round(naturalness),
      emphasis: Math.round(emphasis)
    };
  }
  
  /**
   * Get stress pattern for a single word
   */
  private getWordStressPattern(word: string, syllableCount: number): string {
    const lowerWord = word.toLowerCase();
    
    // Check if we have a known pattern
    if (this.stressMap.has(lowerWord)) {
      return this.stressMap.get(lowerWord)!;
    }
    
    // Default patterns based on syllable count
    switch (syllableCount) {
      case 1:
        return 'S'; // Single syllables are usually stressed
      case 2:
        // Most 2-syllable words are trochaic (Sw) in English
        return word.endsWith('ing') || word.endsWith('ed') || word.endsWith('ly') ? 'Sw' : 'Sw';
      case 3:
        // Common 3-syllable patterns
        if (word.endsWith('tion') || word.endsWith('sion')) return 'wSw';
        return 'Sww'; // Default dactylic
      case 4:
        return 'wSww'; // Default pattern for 4 syllables
      default:
        // For longer words, alternate with primary stress on odd positions
        let pattern = '';
        for (let i = 0; i < syllableCount; i++) {
          pattern += (i % 2 === 0) ? ((i === 0 || i === 2) ? 'S' : 's') : 'w';
        }
        return pattern;
    }
  }
  
  /**
   * Calculate how natural a stress pattern feels
   */
  private calculateStressNaturalness(pattern: string, words: string[]): number {
    let naturalness = 70; // Base score
    
    // Penalize patterns that don't start with stress
    if (!pattern.startsWith('S') && !pattern.startsWith('w')) {
      naturalness -= 10;
    }
    
    // Reward alternating patterns
    const cleanPattern = pattern.replace(/-/g, '');
    let alternating = true;
    for (let i = 1; i < cleanPattern.length; i++) {
      if (cleanPattern[i] === cleanPattern[i-1] && cleanPattern[i] !== 's') {
        alternating = false;
        break;
      }
    }
    if (alternating) naturalness += 15;
    
    // Bonus for known good patterns
    if (pattern.includes('Sw') || pattern.includes('wS')) naturalness += 10;
    
    // Penalize too many unstressed syllables in a row
    if (pattern.includes('www')) naturalness -= 15;
    if (pattern.includes('wwww')) naturalness -= 25;
    
    return Math.max(0, Math.min(100, naturalness));
  }
  
  /**
   * Calculate emphasis strength
   */
  private calculateEmphasisStrength(
    primaryStresses: number[], 
    secondaryStresses: number[], 
    totalSyllables: number
  ): number {
    const primaryRatio = primaryStresses.length / totalSyllables;
    const secondaryRatio = secondaryStresses.length / totalSyllables;
    
    // Optimal ratio is around 1 primary stress per 2-3 syllables
    const optimalPrimaryRatio = 1 / 2.5;
    const primaryScore = Math.max(0, 100 - Math.abs(primaryRatio - optimalPrimaryRatio) * 200);
    
    // Secondary stresses add to emphasis but shouldn't dominate
    const secondaryBonus = Math.min(20, secondaryRatio * 50);
    
    return primaryScore + secondaryBonus;
  }
  
  /**
   * Detect meter type
   */
  private detectMeter(
    syllablePattern: SyllablePattern, 
    stressPattern: StressPattern,
    context?: RhythmContext
  ): MeterAnalysis {
    const pattern = stressPattern.pattern.replace(/-/g, '');
    
    // Analyze stress patterns to determine meter
    let meterType: MeterType = 'mixed';
    let confidence = 50;
    
    // Check for common meters
    if (this.isIambic(pattern)) {
      meterType = 'iambic';
      confidence = 85;
    } else if (this.isTrochaic(pattern)) {
      meterType = 'trochaic';
      confidence = 85;
    } else if (this.isDactylic(pattern)) {
      meterType = 'dactylic';
      confidence = 80;
    } else if (this.isAnapestic(pattern)) {
      meterType = 'anapestic';
      confidence = 80;
    } else if (this.isSpondaic(pattern)) {
      meterType = 'spondaic';
      confidence = 75;
    } else if (this.isPyrrhic(pattern)) {
      meterType = 'pyrrhic';
      confidence = 70;
    }
    
    // Calculate regularity
    const regularity = this.calculateMeterRegularity(pattern, meterType);
    
    // Calculate musical fit
    const musicalFit = this.calculateMusicalFit(meterType, syllablePattern, context);
    
    // Determine time signature
    const timeSignature = this.determineTimeSignature(syllablePattern, meterType);
    
    return {
      type: meterType,
      confidence: Math.round(confidence),
      regularity: Math.round(regularity),
      musicalFit: Math.round(musicalFit),
      timeSignature
    };
  }
  
  // Meter detection helpers
  private isIambic(pattern: string): boolean {
    return /^(wS)+$/.test(pattern) || pattern.includes('wS');
  }
  
  private isTrochaic(pattern: string): boolean {
    return /^(Sw)+$/.test(pattern) || pattern.startsWith('S');
  }
  
  private isDactylic(pattern: string): boolean {
    return /^(Sww)+$/.test(pattern) || pattern.includes('Sww');
  }
  
  private isAnapestic(pattern: string): boolean {
    return /^(wwS)+$/.test(pattern) || pattern.includes('wwS');
  }
  
  private isSpondaic(pattern: string): boolean {
    return /^(SS)+$/.test(pattern) || pattern.includes('SS');
  }
  
  private isPyrrhic(pattern: string): boolean {
    return /^(ww)+$/.test(pattern) || (pattern.includes('ww') && !pattern.includes('S'));
  }
  
  private calculateMeterRegularity(pattern: string, meterType: MeterType): number {
    // Implementation for calculating how regular the meter is
    if (meterType === 'mixed' || meterType === 'free') return 30;
    
    // For regular meters, check consistency
    const units = this.getMeterUnits(meterType);
    if (units.length === 0) return 50;
    
    let matches = 0;
    for (const unit of units) {
      const regex = new RegExp(unit, 'g');
      const unitMatches = pattern.match(regex) || [];
      matches += unitMatches.length;
    }
    
    return Math.min(100, (matches / pattern.length) * 150);
  }
  
  private getMeterUnits(meterType: MeterType): string[] {
    const units: { [key in MeterType]: string[] } = {
      iambic: ['wS'],
      trochaic: ['Sw'],
      dactylic: ['Sww'],
      anapestic: ['wwS'],
      spondaic: ['SS'],
      pyrrhic: ['ww'],
      mixed: [],
      free: []
    };
    
    return units[meterType];
  }
  
  private calculateMusicalFit(
    meterType: MeterType, 
    syllablePattern: SyllablePattern,
    context?: RhythmContext
  ): number {
    let fit = 60; // Base score
    
    // Genre-specific meter preferences
    if (context?.genre && context.genre in this.genreRhythmPrefs) {
      const prefs = this.genreRhythmPrefs[context.genre as keyof typeof this.genreRhythmPrefs];
      if (prefs && prefs.preferredMeters.includes(meterType)) {
        fit += 25;
      }
    }
    
    // Syllable count appropriateness
    const totalSyllables = syllablePattern.totalSyllables;
    if (totalSyllables >= 3 && totalSyllables <= 8) {
      fit += 15;
    }
    
    // Balance bonus
    if (syllablePattern.balance > 70) {
      fit += 10;
    }
    
    return Math.min(100, fit);
  }
  
  private determineTimeSignature(syllablePattern: SyllablePattern, meterType: MeterType): string {
    const totalSyllables = syllablePattern.totalSyllables;
    
    // Match to common time signatures
    for (const [signature, counts] of Object.entries(this.timeSignatureMap)) {
      if (counts.includes(totalSyllables)) {
        return signature;
      }
    }
    
    // Default based on meter type
    switch (meterType) {
      case 'iambic':
      case 'trochaic':
        return totalSyllables % 4 === 0 ? '4/4' : '2/4';
      case 'dactylic':
        return '3/4';
      case 'anapestic':
        return '6/8';
      default:
        return '4/4';
    }
  }
  
  /**
   * Analyze rhythmic flow between words
   */
  private analyzeRhythmicFlow(
    words: string[], 
    syllablePattern: SyllablePattern,
    stressPattern: StressPattern
  ): RhythmicFlow {
    const transitions: WordTransition[] = [];
    
    // Analyze word-to-word transitions
    for (let i = 0; i < words.length - 1; i++) {
      const currentWord = words[i];
      const nextWord = words[i + 1];
      const currentSyllables = syllablePattern.syllableDistribution[i];
      const nextSyllables = syllablePattern.syllableDistribution[i + 1];
      
      const transition = this.analyzeWordTransition(
        currentWord,
        nextWord,
        currentSyllables,
        nextSyllables,
        stressPattern
      );
      
      transitions.push(transition);
    }
    
    // Calculate overall metrics
    const avgFlowScore = transitions.length > 0 ? 
      transitions.reduce((sum, t) => sum + t.flowScore, 0) / transitions.length : 70;
    
    const continuity = this.calculateRhythmicContinuity(transitions, syllablePattern);
    const momentum = this.calculateRhythmicMomentum(transitions, syllablePattern);
    const smoothness = this.calculateTransitionSmoothness(transitions);
    
    return {
      overallFlow: Math.round(avgFlowScore),
      wordTransitions: transitions,
      continuity: Math.round(continuity),
      momentum: Math.round(momentum),
      smoothness: Math.round(smoothness)
    };
  }
  
  private analyzeWordTransition(
    currentWord: string,
    nextWord: string,
    currentSyllables: number,
    nextSyllables: number,
    stressPattern: StressPattern
  ): WordTransition {
    // Calculate basic flow score based on syllable balance
    const syllableBalance = 1 - Math.abs(currentSyllables - nextSyllables) / Math.max(currentSyllables, nextSyllables);
    
    // Check stress alignment (simplified)
    const stressMatch = this.checkStressAlignment(currentWord, nextWord);
    
    // Calculate overall flow score
    let flowScore = syllableBalance * 50 + 30; // Base score
    if (stressMatch) flowScore += 20;
    
    // Bonus for good phonetic transitions
    const phoneticFlow = this.calculatePhoneticTransitionFlow(currentWord, nextWord);
    flowScore += phoneticFlow * 30;
    
    return {
      from: currentWord,
      to: nextWord,
      flowScore: Math.round(Math.min(100, flowScore)),
      stressMatch,
      syllableBalance: Math.round(syllableBalance * 100)
    };
  }
  
  private checkStressAlignment(word1: string, word2: string): boolean {
    // Simplified stress alignment check
    const lastChar1 = word1[word1.length - 1];
    const firstChar2 = word2[0];
    
    // Check for complementary patterns (stressed followed by unstressed, etc.)
    const vowels = 'aeiou';
    const lastIsVowel = vowels.includes(lastChar1.toLowerCase());
    const firstIsVowel = vowels.includes(firstChar2.toLowerCase());
    
    // Good alignment: vowel-consonant or consonant-vowel
    return lastIsVowel !== firstIsVowel;
  }
  
  private calculatePhoneticTransitionFlow(word1: string, word2: string): number {
    const lastSound = word1[word1.length - 1].toLowerCase();
    const firstSound = word2[0].toLowerCase();
    
    // Smooth transitions
    const vowels = 'aeiou';
    const softConsonants = 'lmnr';
    const hardConsonants = 'bcdgkpqt';
    
    if (vowels.includes(lastSound) && softConsonants.includes(firstSound)) return 0.8;
    if (softConsonants.includes(lastSound) && vowels.includes(firstSound)) return 0.8;
    if (vowels.includes(lastSound) && vowels.includes(firstSound)) return 0.6;
    if (hardConsonants.includes(lastSound) && hardConsonants.includes(firstSound)) return 0.3;
    
    return 0.5; // Default
  }
  
  private calculateRhythmicContinuity(
    transitions: WordTransition[],
    syllablePattern: SyllablePattern
  ): number {
    if (transitions.length === 0) return 70;
    
    // Check for consistent rhythmic patterns
    const flowScores = transitions.map(t => t.flowScore);
    const avgFlow = flowScores.reduce((sum, score) => sum + score, 0) / flowScores.length;
    const variance = flowScores.reduce((sum, score) => sum + Math.pow(score - avgFlow, 2), 0) / flowScores.length;
    
    // Lower variance = better continuity
    return Math.max(0, 100 - variance / 10);
  }
  
  private calculateRhythmicMomentum(
    transitions: WordTransition[],
    syllablePattern: SyllablePattern
  ): number {
    if (transitions.length === 0) return 60;
    
    // Check if rhythm builds or maintains energy
    const flowScores = transitions.map(t => t.flowScore);
    let momentum = 60;
    
    // Bonus for increasing or stable flow
    for (let i = 1; i < flowScores.length; i++) {
      if (flowScores[i] >= flowScores[i-1]) {
        momentum += 10;
      } else {
        momentum -= 5;
      }
    }
    
    return Math.max(0, Math.min(100, momentum));
  }
  
  private calculateTransitionSmoothness(transitions: WordTransition[]): number {
    if (transitions.length === 0) return 70;
    
    const avgSyllableBalance = transitions.reduce((sum, t) => sum + t.syllableBalance, 0) / transitions.length;
    const stressMatchRatio = transitions.filter(t => t.stressMatch).length / transitions.length;
    
    return Math.round((avgSyllableBalance + stressMatchRatio * 100) / 2);
  }
  
  /**
   * Calculate rhythm musicality metrics
   */
  private calculateRhythmMusicality(
    syllablePattern: SyllablePattern,
    stressPattern: StressPattern,
    meter: MeterAnalysis,
    flow: RhythmicFlow,
    context?: RhythmContext
  ): RhythmMusicality {
    // Calculate danceability based on regularity and energy
    const danceability = Math.round(
      (meter.regularity * 0.4) +
      (stressPattern.emphasis * 0.3) +
      (flow.momentum * 0.3)
    );
    
    // Calculate energy from stress and meter
    const energy = Math.round(
      (stressPattern.emphasis * 0.5) +
      (meter.musicalFit * 0.3) +
      (flow.momentum * 0.2)
    );
    
    // Calculate catchiness
    const catchiness = Math.round(
      (syllablePattern.balance * 0.3) +
      (meter.confidence * 0.4) +
      (flow.smoothness * 0.3)
    );
    
    // Calculate memorability
    const memorability = Math.round(
      (meter.regularity * 0.4) +
      (stressPattern.naturalness * 0.3) +
      (syllablePattern.balance * 0.3)
    );
    
    // Calculate genre alignment
    let genreAlignment = 70; // Default
    if (context?.genre && context.genre in this.genreRhythmPrefs) {
      const prefs = this.genreRhythmPrefs[context.genre as keyof typeof this.genreRhythmPrefs];
      if (prefs) {
        genreAlignment = this.calculateGenreAlignment(
          syllablePattern,
          stressPattern,
          meter,
          prefs
        );
      }
    }
    
    return {
      danceability,
      energy,
      catchiness,
      memorability,
      genreAlignment: Math.round(genreAlignment)
    };
  }
  
  private calculateGenreAlignment(
    syllablePattern: SyllablePattern,
    stressPattern: StressPattern,
    meter: MeterAnalysis,
    prefs: any
  ): number {
    let alignment = 50;
    
    // Check meter preference
    if (prefs.preferredMeters.includes(meter.type)) {
      alignment += 25;
    }
    
    // Check syllable count preference
    const totalSyllables = syllablePattern.totalSyllables;
    if (totalSyllables >= prefs.syllableRange[0] && totalSyllables <= prefs.syllableRange[1]) {
      alignment += 15;
    }
    
    // Check energy match
    const energyDiff = Math.abs(stressPattern.emphasis - prefs.energyTarget);
    alignment += Math.max(0, 15 - energyDiff / 5);
    
    return Math.min(100, alignment);
  }
  
  /**
   * Analyze musical timing characteristics
   */
  private analyzeMusicalTiming(
    syllablePattern: SyllablePattern,
    stressPattern: StressPattern,
    meter: MeterAnalysis,
    context?: RhythmContext
  ): TimingAnalysis {
    // Estimate BPM based on syllable density and meter
    const baseBPM = this.estimateBPM(syllablePattern, meter, context);
    
    // Determine subdivision
    const subdivision = this.determineSubdivision(syllablePattern, meter);
    
    // Calculate syncopation level
    const syncopation = this.calculateSyncopation(stressPattern, meter);
    
    // Determine groove type
    const groove = this.determineGroove(meter, context);
    
    // Create musical phrase notation
    const musicalPhrase = this.createMusicalPhrase(syllablePattern, stressPattern);
    
    return {
      bpm: baseBPM,
      subdivision,
      syncopation: Math.round(syncopation),
      groove,
      musicalPhrase
    };
  }
  
  private estimateBPM(
    syllablePattern: SyllablePattern,
    meter: MeterAnalysis,
    context?: RhythmContext
  ): number {
    // Base BPM on genre and syllable density
    let baseBPM = 120; // Default
    
    if (context?.genre && context.genre in this.genreRhythmPrefs) {
      const prefs = this.genreRhythmPrefs[context.genre as keyof typeof this.genreRhythmPrefs];
      if (prefs && prefs.timing.bpm) {
        const [min, max] = prefs.timing.bpm;
        baseBPM = (min + max) / 2;
      }
    }
    
    // Adjust for syllable density
    const syllableDensity = syllablePattern.totalSyllables / syllablePattern.syllableDistribution.length;
    if (syllableDensity > 3) baseBPM += 10;
    if (syllableDensity < 2) baseBPM -= 10;
    
    return Math.round(baseBPM);
  }
  
  private determineSubdivision(syllablePattern: SyllablePattern, meter: MeterAnalysis): string {
    const avgSyllables = syllablePattern.totalSyllables / syllablePattern.syllableDistribution.length;
    
    if (avgSyllables >= 3) return 'eighth';
    if (avgSyllables >= 2) return 'quarter';
    return 'half';
  }
  
  private calculateSyncopation(stressPattern: StressPattern, meter: MeterAnalysis): number {
    // Simple syncopation calculation based on off-beat stresses
    const pattern = stressPattern.pattern.replace(/-/g, '');
    let syncopation = 0;
    
    // Look for stresses in unexpected positions
    for (let i = 0; i < pattern.length; i++) {
      if (pattern[i] === 'S' || pattern[i] === 's') {
        // Check if this stress is on an "off-beat"
        if (meter.type === 'iambic' && i % 2 === 0) syncopation += 10;
        if (meter.type === 'trochaic' && i % 2 === 1) syncopation += 10;
        if (meter.type === 'dactylic' && i % 3 !== 0) syncopation += 15;
      }
    }
    
    return Math.min(100, syncopation);
  }
  
  private determineGroove(meter: MeterAnalysis, context?: RhythmContext): string {
    if (context?.genre && context.genre in this.genreRhythmPrefs) {
      const prefs = this.genreRhythmPrefs[context.genre as keyof typeof this.genreRhythmPrefs];
      if (prefs && prefs.timing.groove) {
        return prefs.timing.groove;
      }
    }
    
    // Default groove based on meter
    switch (meter.type) {
      case 'iambic':
      case 'trochaic':
        return 'straight';
      case 'dactylic':
        return 'waltz';
      case 'anapestic':
        return 'shuffle';
      default:
        return 'straight';
    }
  }
  
  private createMusicalPhrase(syllablePattern: SyllablePattern, stressPattern: StressPattern): string {
    // Create a simple musical phrase notation
    const syllables = syllablePattern.syllableDistribution;
    const stresses = stressPattern.pattern.replace(/-/g, '');
    
    let phrase = '';
    let position = 0;
    
    for (let i = 0; i < syllables.length; i++) {
      const wordSyllables = syllables[i];
      for (let j = 0; j < wordSyllables; j++) {
        if (position < stresses.length) {
          phrase += stresses[position] === 'S' ? '♪' : '♫';
        } else {
          phrase += '♫';
        }
        position++;
      }
      if (i < syllables.length - 1) phrase += '|';
    }
    
    return phrase;
  }
  
  /**
   * Calculate overall rhythm score
   */
  private calculateOverallRhythmScore(
    syllablePattern: SyllablePattern,
    stressPattern: StressPattern,
    meter: MeterAnalysis,
    flow: RhythmicFlow,
    musicality: RhythmMusicality,
    timing: TimingAnalysis,
    context?: RhythmContext
  ): number {
    // Weight different components
    const weights = {
      syllableBalance: 0.15,
      stressNaturalness: 0.20,
      meterFit: 0.20,
      flow: 0.15,
      musicality: 0.20,
      timing: 0.10
    };
    
    const score = 
      (syllablePattern.balance * weights.syllableBalance) +
      (stressPattern.naturalness * weights.stressNaturalness) +
      (meter.musicalFit * weights.meterFit) +
      (flow.overallFlow * weights.flow) +
      ((musicality.catchiness + musicality.memorability + musicality.danceability + musicality.energy) / 4 * weights.musicality) +
      ((100 - timing.syncopation + meter.regularity) / 2 * weights.timing);
    
    return Math.round(Math.min(100, Math.max(0, score)));
  }
  
  /**
   * Generate rhythm improvement recommendations
   */
  private generateRhythmRecommendations(
    syllablePattern: SyllablePattern,
    stressPattern: StressPattern,
    meter: MeterAnalysis,
    flow: RhythmicFlow,
    musicality: RhythmMusicality,
    context: RhythmContext | undefined,
    recommendations: string[],
    issues: string[]
  ): void {
    // Check syllable balance
    if (syllablePattern.balance < 50) {
      issues.push('Unbalanced syllable distribution across words');
      recommendations.push('Try to balance syllable counts between words for better rhythm');
    }
    
    // Check stress patterns
    if (stressPattern.naturalness < 60) {
      issues.push('Unnatural stress pattern');
      recommendations.push('Adjust word choices to create more natural stress patterns');
    }
    
    // Check meter
    if (meter.confidence < 60) {
      issues.push('Unclear or mixed meter');
      recommendations.push('Consider words that create a more consistent rhythmic pattern');
    }
    
    // Check flow
    if (flow.overallFlow < 60) {
      issues.push('Poor rhythmic flow between words');
      recommendations.push('Choose words that transition more smoothly in terms of syllables and stress');
    }
    
    // Genre-specific recommendations
    if (context?.genre && context.genre in this.genreRhythmPrefs) {
      const prefs = this.genreRhythmPrefs[context.genre as keyof typeof this.genreRhythmPrefs];
      if (prefs && musicality.genreAlignment < 60) {
        switch (context.genre) {
          case 'rock':
            recommendations.push('Add stronger, more emphasized words for rock appeal');
            break;
          case 'metal':
            recommendations.push('Use shorter, punchier words with hard consonants');
            break;
          case 'jazz':
            recommendations.push('Experiment with more complex, syncopated rhythmic patterns');
            break;
          case 'folk':
            recommendations.push('Use natural speech rhythms and conversational flow');
            break;
          case 'electronic':
            recommendations.push('Consider rhythmic patterns that work well with electronic beats');
            break;
        }
      }
    }
    
    // Musicality improvements
    if (musicality.catchiness < 60) {
      recommendations.push('Enhance catchiness with more balanced and regular rhythmic patterns');
    }
    
    if (musicality.memorability < 60) {
      recommendations.push('Create more memorable rhythm through consistent meter and stress patterns');
    }
  }
  
  private getDefaultAnalysis(name: string): RhythmAnalysis {
    const words = name.split(' ');
    const defaultSyllables = words.map(word => Math.max(1, Math.ceil(word.length / 3)));
    
    return {
      overall: 50,
      syllablePattern: {
        totalSyllables: defaultSyllables.reduce((sum, count) => sum + count, 0),
        syllableDistribution: defaultSyllables,
        balance: 60,
        complexity: 40,
        pattern: defaultSyllables.join('-')
      },
      stressPattern: {
        pattern: 'Sw'.repeat(words.length),
        primaryStresses: [0],
        secondaryStresses: [],
        naturalness: 50,
        emphasis: 50
      },
      meter: {
        type: 'mixed',
        confidence: 40,
        regularity: 50,
        musicalFit: 50,
        timeSignature: '4/4'
      },
      flow: {
        overallFlow: 50,
        wordTransitions: [],
        continuity: 50,
        momentum: 50,
        smoothness: 50
      },
      musicality: {
        danceability: 50,
        energy: 50,
        catchiness: 50,
        memorability: 50,
        genreAlignment: 50
      },
      timing: {
        bpm: 120,
        subdivision: 'quarter',
        syncopation: 30,
        groove: 'straight',
        musicalPhrase: '♪♫'
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
      maxSize: 2500
    };
  }
}

// Export singleton instance
export const rhythmAnalysisSystem = new RhythmAnalysisSystem();