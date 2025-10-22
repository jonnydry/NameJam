/**
 * Musicality Scoring System
 * Combines rhyme and rhythm analysis for comprehensive musical quality assessment
 */

import { rhymeDetectionEngine, type RhymeAnalysis } from './rhymeDetectionEngine';
import { rhythmAnalysisSystem, type RhythmAnalysis } from './rhythmAnalysisSystem';
import { secureLog } from '../../utils/secureLogger';
import { CacheService } from '../cacheService';

export interface MusicalityScore {
  overall: number;                        // Overall musicality score (0-100)
  breakdown: MusicalityBreakdown;         // Detailed score breakdown
  metadata: MusicalityMetadata;           // Analysis metadata
  patterns: DetectedPattern[];            // Musical patterns found
  synergy: MusicalSynergy;               // Interaction between rhyme and rhythm
  appeal: MusicalAppeal;                 // Different types of musical appeal
}

export interface MusicalityBreakdown {
  // Core dimensions
  rhymeQuality: number;                   // Quality of rhyming patterns (0-100)
  rhythmQuality: number;                  // Quality of rhythmic patterns (0-100)
  phoneticFlow: number;                   // Phonetic flow and transitions (0-100)
  memorability: number;                   // How memorable the name sounds (0-100)
  catchiness: number;                     // How catchy and appealing (0-100)
  
  // Advanced dimensions
  musicalCoherence: number;               // How well rhyme and rhythm work together (0-100)
  genreSuitability: number;               // Suitability for musical context (0-100)
  vocalDeliverability: number;            // How well it can be sung/performed (0-100)
  emotionalResonance: number;             // Emotional impact through sound (0-100)
  
  // Pattern-specific scores
  internalMusical: number;                // Internal musical elements (0-100)
  crossWordHarmony: number;               // Harmony across word boundaries (0-100)
  rhythmicConsistency: number;            // Consistency of rhythmic elements (0-100)
}

export interface MusicalityMetadata {
  analysisTime: number;                   // Time taken for analysis (ms)
  algorithm: string;                      // Algorithm version used
  confidence: number;                     // Overall confidence in analysis (0-100)
  rhymeAnalysisConfidence: number;        // Confidence in rhyme analysis
  rhythmAnalysisConfidence: number;       // Confidence in rhythm analysis
  warnings: string[];                     // Analysis warnings
  suggestions: string[];                  // Improvement suggestions
  genreOptimization: string[];            // Genre-specific optimizations
}

export interface DetectedPattern {
  type: PatternType;
  description: string;
  strength: number;                       // Pattern strength (0-100)
  impact: number;                         // Impact on musicality (0-100)
  examples: string[];                     // Examples where pattern occurs
  musicalValue: number;                   // Musical value of this pattern (0-100)
}

export type PatternType = 
  | 'perfect_rhyme_pair'
  | 'internal_rhyme'
  | 'alliteration_chain'
  | 'assonance_pattern'
  | 'rhythmic_meter'
  | 'stress_pattern'
  | 'syllable_balance'
  | 'phonetic_echo'
  | 'call_response'
  | 'musical_phrase';

export interface MusicalSynergy {
  rhymeRhythmAlignment: number;           // How well rhyme aligns with rhythm (0-100)
  reinforcement: number;                  // How much they reinforce each other (0-100)
  competition: number;                    // How much they compete/conflict (0-100)
  balance: number;                        // Balance between rhyme and rhythm focus (0-100)
  emergentQualities: string[];            // New qualities that emerge from combination
}

export interface MusicalAppeal {
  mainstream: number;                     // Appeal to mainstream audiences (0-100)
  artistic: number;                       // Artistic/creative appeal (0-100)
  commercial: number;                     // Commercial viability (0-100)
  performance: number;                    // Performance/stage appeal (0-100)
  memorization: number;                   // How easy to remember and sing along (0-100)
  brandability: number;                   // Brand/marketing appeal (0-100)
}

export interface MusicalityRequest {
  name: string;
  type: 'band' | 'song';
  genre?: string;
  mood?: string;
  targetAudience?: 'mainstream' | 'niche' | 'experimental';
  performanceContext?: 'studio' | 'live' | 'both';
  culturalContext?: string;
  analysisDepth?: 'basic' | 'standard' | 'comprehensive';
}

export interface MusicalityResult {
  name: string;
  score: MusicalityScore;
  rhymeAnalysis: RhymeAnalysis;
  rhythmAnalysis: RhythmAnalysis;
  recommendations: MusicalityRecommendation[];
  benchmarks: MusicalityBenchmarks;
}

export interface MusicalityRecommendation {
  category: 'rhyme' | 'rhythm' | 'synergy' | 'appeal' | 'performance';
  priority: 'high' | 'medium' | 'low';
  recommendation: string;
  expectedImprovement: number;            // Expected score improvement (0-100)
  difficulty: 'easy' | 'medium' | 'hard';
  examples?: string[];                    // Example improvements
}

export interface MusicalityBenchmarks {
  industryAverage: number;                // Industry average score
  genreAverage: number;                   // Genre-specific average
  topPercentile: number;                  // Top 10% threshold
  commercialThreshold: number;            // Commercial viability threshold
  artisticThreshold: number;              // Artistic recognition threshold
  performanceReadiness: number;           // Performance-ready threshold
}

export class MusicalityScoring {
  private cache: CacheService<MusicalityResult>;
  
  // Weighting configurations for different contexts
  private readonly contextWeights = {
    default: {
      rhyme: 0.35,
      rhythm: 0.35,
      synergy: 0.20,
      appeal: 0.10
    },
    band: {
      rhyme: 0.30,
      rhythm: 0.40,      // Bands need strong rhythm for live performance
      synergy: 0.20,
      appeal: 0.10
    },
    song: {
      rhyme: 0.40,       // Songs benefit more from rhyming
      rhythm: 0.30,
      synergy: 0.20,
      appeal: 0.10
    },
    live: {
      rhyme: 0.25,
      rhythm: 0.45,      // Live performance emphasizes rhythm
      synergy: 0.15,
      appeal: 0.15
    },
    commercial: {
      rhyme: 0.35,
      rhythm: 0.25,
      synergy: 0.15,
      appeal: 0.25       // Commercial focus on appeal
    }
  };
  
  // Genre-specific musicality preferences
  private readonly genrePreferences = {
    rock: {
      rhymeImportance: 0.7,
      rhythmImportance: 0.9,
      preferredPatterns: ['alliteration_chain', 'stress_pattern', 'syllable_balance'],
      energyTarget: 80,
      commercialWeight: 0.8
    },
    metal: {
      rhymeImportance: 0.6,
      rhythmImportance: 0.95,
      preferredPatterns: ['alliteration_chain', 'rhythmic_meter', 'stress_pattern'],
      energyTarget: 90,
      commercialWeight: 0.6
    },
    pop: {
      rhymeImportance: 0.9,
      rhythmImportance: 0.8,
      preferredPatterns: ['perfect_rhyme_pair', 'syllable_balance', 'call_response'],
      energyTarget: 70,
      commercialWeight: 0.95
    },
    jazz: {
      rhymeImportance: 0.5,
      rhythmImportance: 0.7,
      preferredPatterns: ['internal_rhyme', 'rhythmic_meter', 'musical_phrase'],
      energyTarget: 60,
      commercialWeight: 0.4
    },
    folk: {
      rhymeImportance: 0.8,
      rhythmImportance: 0.6,
      preferredPatterns: ['assonance_pattern', 'syllable_balance', 'musical_phrase'],
      energyTarget: 50,
      commercialWeight: 0.5
    },
    electronic: {
      rhymeImportance: 0.4,
      rhythmImportance: 0.9,
      preferredPatterns: ['rhythmic_meter', 'phonetic_echo', 'syllable_balance'],
      energyTarget: 85,
      commercialWeight: 0.8
    },
    'hip-hop': {
      rhymeImportance: 0.95,
      rhythmImportance: 0.9,
      preferredPatterns: ['internal_rhyme', 'perfect_rhyme_pair', 'rhythmic_meter'],
      energyTarget: 85,
      commercialWeight: 0.9
    }
  };
  
  // Industry benchmarks (based on analysis of successful names)
  private readonly industryBenchmarks = {
    overall: {
      industryAverage: 65,
      genreAverage: 70,
      topPercentile: 85,
      commercialThreshold: 75,
      artisticThreshold: 70,
      performanceReadiness: 80
    },
    byGenre: {
      rock: { average: 68, top: 88, commercial: 78 },
      metal: { average: 64, top: 85, commercial: 72 },
      pop: { average: 72, top: 92, commercial: 85 },
      jazz: { average: 66, top: 86, commercial: 70 },
      folk: { average: 62, top: 84, commercial: 68 },
      electronic: { average: 67, top: 87, commercial: 76 }
    }
  };
  
  constructor() {
    // Initialize cache with 2 hour TTL and max 2000 entries
    this.cache = new CacheService<MusicalityResult>(7200, 2000);
  }
  
  /**
   * Perform comprehensive musicality analysis
   */
  public async analyzeMusicalName(request: MusicalityRequest): Promise<MusicalityResult> {
    const cacheKey = `${request.name.toLowerCase()}_${JSON.stringify(request)}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached !== null) {
      secureLog.debug(`MusicalityScoring cache hit for: ${request.name}`);
      return cached;
    }
    
    secureLog.debug(`MusicalityScoring analyzing: ${request.name}`);
    const startTime = Date.now();
    
    try {
      // Perform parallel rhyme and rhythm analysis
      const [rhymeAnalysis, rhythmAnalysis] = await Promise.all([
        this.performRhymeAnalysis(request),
        this.performRhythmAnalysis(request)
      ]);
      
      // Detect musical patterns
      const patterns = this.detectMusicalPatterns(rhymeAnalysis, rhythmAnalysis, request);
      
      // Calculate synergy between rhyme and rhythm
      const synergy = this.calculateMusicalSynergy(rhymeAnalysis, rhythmAnalysis, patterns);
      
      // Calculate different types of appeal
      const appeal = this.calculateMusicalAppeal(rhymeAnalysis, rhythmAnalysis, synergy, request);
      
      // Generate comprehensive breakdown
      const breakdown = this.generateMusicalityBreakdown(
        rhymeAnalysis,
        rhythmAnalysis,
        synergy,
        appeal,
        patterns,
        request
      );
      
      // Calculate overall score
      const overall = this.calculateOverallMusicalityScore(breakdown, synergy, appeal, request);
      
      // Generate metadata
      const metadata = this.generateMusicalityMetadata(
        startTime,
        rhymeAnalysis,
        rhythmAnalysis,
        overall,
        breakdown,
        request
      );
      
      // Create musicality score
      const score: MusicalityScore = {
        overall,
        breakdown,
        metadata,
        patterns,
        synergy,
        appeal
      };
      
      // Generate recommendations
      const recommendations = this.generateMusicalityRecommendations(
        score,
        rhymeAnalysis,
        rhythmAnalysis,
        request
      );
      
      // Get benchmarks
      const benchmarks = this.getMusicalityBenchmarks(request.genre);
      
      const result: MusicalityResult = {
        name: request.name,
        score,
        rhymeAnalysis,
        rhythmAnalysis,
        recommendations,
        benchmarks
      };
      
      // Cache the result
      this.cache.set(cacheKey, result);
      
      return result;
      
    } catch (error) {
      secureLog.error('Musicality analysis failed:', error);
      return this.getDefaultResult(request);
    }
  }
  
  /**
   * Perform rhyme analysis with musicality context
   */
  private async performRhymeAnalysis(request: MusicalityRequest): Promise<RhymeAnalysis> {
    return rhymeDetectionEngine.analyzeRhymes(request.name, {
      genre: request.genre,
      type: request.type,
      mood: request.mood,
      targetAudience: request.targetAudience,
      // culturalContext removed as it's not in RhymeContext interface
    });
  }
  
  /**
   * Perform rhythm analysis with musicality context
   */
  private async performRhythmAnalysis(request: MusicalityRequest): Promise<RhythmAnalysis> {
    return rhythmAnalysisSystem.analyzeRhythm(request.name, {
      genre: request.genre,
      type: request.type,
      mood: request.mood,
      targetAudience: request.targetAudience
    });
  }
  
  /**
   * Detect comprehensive musical patterns
   */
  private detectMusicalPatterns(
    rhymeAnalysis: RhymeAnalysis,
    rhythmAnalysis: RhythmAnalysis,
    request: MusicalityRequest
  ): DetectedPattern[] {
    const patterns: DetectedPattern[] = [];
    
    // Convert rhyme patterns to musical patterns
    for (const rhymePattern of rhymeAnalysis.patterns) {
      if (rhymePattern.type === 'perfect') {
        patterns.push({
          type: 'perfect_rhyme_pair',
          description: `Perfect rhyme between "${rhymePattern.words.join('" and "')}"`,
          strength: rhymePattern.strength,
          impact: this.calculatePatternImpact(rhymePattern.strength, 'rhyme', request),
          examples: rhymePattern.words,
          musicalValue: this.calculateMusicalValue('perfect_rhyme_pair', rhymePattern.strength, request)
        });
      } else if (rhymePattern.type === 'alliteration') {
        patterns.push({
          type: 'alliteration_chain',
          description: `Alliterative pattern: ${rhymePattern.phoneticMatch}`,
          strength: rhymePattern.strength,
          impact: this.calculatePatternImpact(rhymePattern.strength, 'alliteration', request),
          examples: rhymePattern.words,
          musicalValue: this.calculateMusicalValue('alliteration_chain', rhymePattern.strength, request)
        });
      } else if (rhymePattern.type === 'assonance') {
        patterns.push({
          type: 'assonance_pattern',
          description: `Assonance pattern with vowel sounds: ${rhymePattern.phoneticMatch}`,
          strength: rhymePattern.strength,
          impact: this.calculatePatternImpact(rhymePattern.strength, 'assonance', request),
          examples: rhymePattern.words,
          musicalValue: this.calculateMusicalValue('assonance_pattern', rhymePattern.strength, request)
        });
      }
    }
    
    // Add internal rhyme patterns
    if (rhymeAnalysis.internalRhymes.length > 0) {
      patterns.push({
        type: 'internal_rhyme',
        description: `Internal rhyming within words`,
        strength: Math.max(...rhymeAnalysis.internalRhymes.map(r => r.strength)),
        impact: 75,
        examples: rhymeAnalysis.internalRhymes.map(r => `${r.word1}/${r.word2}`),
        musicalValue: 80
      });
    }
    
    // Convert rhythm patterns to musical patterns
    if (rhythmAnalysis.meter.type !== 'mixed' && rhythmAnalysis.meter.confidence > 70) {
      patterns.push({
        type: 'rhythmic_meter',
        description: `${rhythmAnalysis.meter.type} meter pattern`,
        strength: rhythmAnalysis.meter.confidence,
        impact: this.calculatePatternImpact(rhythmAnalysis.meter.confidence, 'rhythm', request),
        examples: [rhythmAnalysis.stressPattern.pattern],
        musicalValue: this.calculateMusicalValue('rhythmic_meter', rhythmAnalysis.meter.confidence, request)
      });
    }
    
    // Add stress pattern if strong
    if (rhythmAnalysis.stressPattern.naturalness > 75) {
      patterns.push({
        type: 'stress_pattern',
        description: `Natural stress pattern: ${rhythmAnalysis.stressPattern.pattern}`,
        strength: rhythmAnalysis.stressPattern.naturalness,
        impact: 70,
        examples: [rhythmAnalysis.stressPattern.pattern],
        musicalValue: 75
      });
    }
    
    // Add syllable balance pattern
    if (rhythmAnalysis.syllablePattern.balance > 70) {
      patterns.push({
        type: 'syllable_balance',
        description: `Well-balanced syllable distribution: ${rhythmAnalysis.syllablePattern.pattern}`,
        strength: rhythmAnalysis.syllablePattern.balance,
        impact: 65,
        examples: [rhythmAnalysis.syllablePattern.pattern],
        musicalValue: 70
      });
    }
    
    // Detect phonetic echo patterns (cross-analysis)
    const phoneticEcho = this.detectPhoneticEcho(rhymeAnalysis, rhythmAnalysis);
    if (phoneticEcho.strength > 60) {
      patterns.push({
        type: 'phonetic_echo',
        description: 'Phonetic echoing across rhythmic boundaries',
        strength: phoneticEcho.strength,
        impact: 80,
        examples: phoneticEcho.examples,
        musicalValue: 85
      });
    }
    
    // Detect call-response patterns
    const callResponse = this.detectCallResponsePattern(rhymeAnalysis, rhythmAnalysis);
    if (callResponse.strength > 65) {
      patterns.push({
        type: 'call_response',
        description: 'Musical call-and-response structure',
        strength: callResponse.strength,
        impact: 85,
        examples: callResponse.examples,
        musicalValue: 90
      });
    }
    
    return patterns.sort((a, b) => b.musicalValue - a.musicalValue);
  }
  
  private calculatePatternImpact(strength: number, type: string, request: MusicalityRequest): number {
    let baseImpact = strength * 0.8;
    
    // Adjust based on genre preferences
    if (request.genre && request.genre in this.genrePreferences) {
      const prefs = this.genrePreferences[request.genre as keyof typeof this.genrePreferences];
      if (type === 'rhyme' && prefs.rhymeImportance > 0.7) baseImpact *= 1.2;
      if (type === 'rhythm' && prefs.rhythmImportance > 0.7) baseImpact *= 1.2;
      if (type === 'alliteration' && prefs.preferredPatterns.includes('alliteration_chain')) baseImpact *= 1.3;
    }
    
    return Math.min(100, baseImpact);
  }
  
  private calculateMusicalValue(patternType: PatternType, strength: number, request: MusicalityRequest): number {
    const baseValues = {
      perfect_rhyme_pair: 85,
      internal_rhyme: 90,
      alliteration_chain: 75,
      assonance_pattern: 70,
      rhythmic_meter: 80,
      stress_pattern: 75,
      syllable_balance: 70,
      phonetic_echo: 85,
      call_response: 95,
      musical_phrase: 88
    };
    
    let value = baseValues[patternType] * (strength / 100);
    
    // Genre-specific adjustments
    if (request.genre && request.genre in this.genrePreferences) {
      const prefs = this.genrePreferences[request.genre as keyof typeof this.genrePreferences];
      if (prefs && prefs.preferredPatterns.includes(patternType)) {
        value *= 1.15;
      }
    }
    
    return Math.min(100, value);
  }
  
  /**
   * Detect phonetic echo patterns between rhyme and rhythm
   */
  private detectPhoneticEcho(rhymeAnalysis: RhymeAnalysis, rhythmAnalysis: RhythmAnalysis): { strength: number; examples: string[] } {
    // Look for phonetic patterns that align with rhythmic patterns
    const examples: string[] = [];
    let totalStrength = 0;
    let patternCount = 0;
    
    // Check if rhyme patterns align with stress patterns
    for (const rhymePattern of rhymeAnalysis.patterns) {
      const positions = rhymePattern.positions;
      const stressPositions = rhythmAnalysis.stressPattern.primaryStresses;
      
      // Check alignment
      const alignment = positions.filter(pos => stressPositions.includes(pos)).length;
      if (alignment > 0) {
        totalStrength += rhymePattern.strength * alignment;
        patternCount++;
        examples.push(`"${rhymePattern.words.join('" and "')}" align with stress pattern`);
      }
    }
    
    const avgStrength = patternCount > 0 ? totalStrength / patternCount : 0;
    return { strength: avgStrength, examples };
  }
  
  /**
   * Detect call-response patterns
   */
  private detectCallResponsePattern(rhymeAnalysis: RhymeAnalysis, rhythmAnalysis: RhythmAnalysis): { strength: number; examples: string[] } {
    const examples: string[] = [];
    
    // Simple detection: look for contrasting patterns that complement each other
    const words = rhymeAnalysis.patterns.length > 0 ? rhymeAnalysis.patterns[0].words : [];
    
    if (words.length >= 2 && rhythmAnalysis.syllablePattern.syllableDistribution.length >= 2) {
      const syllables = rhythmAnalysis.syllablePattern.syllableDistribution;
      
      // Check for call-response structure (different syllable counts, complementary sounds)
      let strength = 50;
      
      // Different syllable counts can create call-response feeling
      if (syllables[0] !== syllables[syllables.length - 1]) {
        strength += 20;
        examples.push(`"${words[0]}" (${syllables[0]} syllables) calls, "${words[words.length - 1]}" (${syllables[syllables.length - 1]} syllables) responds`);
      }
      
      // Rhyming creates response connection
      if (rhymeAnalysis.patterns.some(p => p.strength > 75)) {
        strength += 15;
      }
      
      return { strength, examples };
    }
    
    return { strength: 0, examples: [] };
  }
  
  /**
   * Calculate synergy between rhyme and rhythm
   */
  private calculateMusicalSynergy(
    rhymeAnalysis: RhymeAnalysis,
    rhythmAnalysis: RhythmAnalysis,
    patterns: DetectedPattern[]
  ): MusicalSynergy {
    // Calculate how well rhyme and rhythm align
    let alignment = 60; // Base alignment
    
    // Check if rhyme positions align with stressed syllables
    const rhymePositions = rhymeAnalysis.patterns.flatMap(p => p.positions);
    const stressPositions = rhythmAnalysis.stressPattern.primaryStresses;
    
    const alignedPositions = rhymePositions.filter(pos => stressPositions.includes(pos));
    if (alignedPositions.length > 0) {
      alignment += (alignedPositions.length / Math.max(rhymePositions.length, 1)) * 40;
    }
    
    // Calculate reinforcement (how much they help each other)
    let reinforcement = 50;
    
    // Strong patterns in both dimensions reinforce each other
    const strongRhymes = rhymeAnalysis.patterns.filter(p => p.strength > 75).length;
    const rhythmStrength = rhythmAnalysis.meter.confidence;
    
    if (strongRhymes > 0 && rhythmStrength > 75) {
      reinforcement += 30;
    }
    
    // Phonetic similarity enhances rhythmic flow
    if (rhymeAnalysis.phoneticSimilarity > 70 && rhythmAnalysis.flow.smoothness > 70) {
      reinforcement += 20;
    }
    
    // Calculate competition (negative interactions)
    let competition = 20; // Base competition
    
    // Overly complex patterns can compete for attention
    const complexityScore = rhymeAnalysis.patterns.length + rhythmAnalysis.syllablePattern.complexity;
    if (complexityScore > 150) {
      competition += 30;
    }
    
    // Calculate balance
    const rhymeScore = rhymeAnalysis.overall;
    const rhythmScore = rhythmAnalysis.overall;
    const scoreDifference = Math.abs(rhymeScore - rhythmScore);
    const balance = Math.max(0, 100 - scoreDifference);
    
    // Identify emergent qualities
    const emergentQualities = this.identifyEmergentQualities(rhymeAnalysis, rhythmAnalysis, patterns);
    
    return {
      rhymeRhythmAlignment: Math.round(Math.min(100, alignment)),
      reinforcement: Math.round(Math.min(100, reinforcement)),
      competition: Math.round(Math.min(100, competition)),
      balance: Math.round(balance),
      emergentQualities
    };
  }
  
  /**
   * Identify emergent musical qualities
   */
  private identifyEmergentQualities(
    rhymeAnalysis: RhymeAnalysis,
    rhythmAnalysis: RhythmAnalysis,
    patterns: DetectedPattern[]
  ): string[] {
    const qualities: string[] = [];
    
    // Check for specific emergent patterns
    if (rhymeAnalysis.overall > 80 && rhythmAnalysis.musicality.danceability > 80) {
      qualities.push('High danceability from rhythmic rhyming');
    }
    
    if (patterns.some(p => p.type === 'phonetic_echo') && rhythmAnalysis.meter.type !== 'mixed') {
      qualities.push('Sophisticated phonetic-rhythmic interplay');
    }
    
    if (rhymeAnalysis.musicality.catchiness > 85 && rhythmAnalysis.musicality.memorability > 85) {
      qualities.push('Exceptional memorability through musical cohesion');
    }
    
    if (patterns.some(p => p.type === 'call_response')) {
      qualities.push('Dynamic conversational musicality');
    }
    
    if (rhymeAnalysis.patterns.length > 2 && rhythmAnalysis.syllablePattern.balance > 80) {
      qualities.push('Rich textural complexity with stability');
    }
    
    return qualities;
  }
  
  /**
   * Calculate different types of musical appeal
   */
  private calculateMusicalAppeal(
    rhymeAnalysis: RhymeAnalysis,
    rhythmAnalysis: RhythmAnalysis,
    synergy: MusicalSynergy,
    request: MusicalityRequest
  ): MusicalAppeal {
    // Mainstream appeal (broad audience)
    let mainstream = (
      rhymeAnalysis.musicality.catchiness * 0.4 +
      rhythmAnalysis.musicality.catchiness * 0.4 +
      synergy.balance * 0.2
    ) * 0.8 + 20; // Base level
    
    // Artistic appeal (creative/sophisticated)
    let artistic = (
      (rhymeAnalysis.patterns.filter(p => p.type === 'assonance' || p.type === 'consonance').length * 10) +
      (rhythmAnalysis.meter.type === 'mixed' ? 15 : 0) +
      synergy.emergentQualities.length * 15 +
      40 // Base
    );
    
    // Commercial appeal (marketability)
    let commercial = mainstream * 0.7;
    if (request.genre && request.genre in this.genrePreferences) {
      const prefs = this.genrePreferences[request.genre as keyof typeof this.genrePreferences];
      if (prefs) {
        commercial += prefs.commercialWeight * 30;
      }
    }
    
    // Performance appeal (stage presence)
    const performance = (
      rhythmAnalysis.musicality.danceability * 0.4 +
      rhythmAnalysis.musicality.energy * 0.3 +
      rhymeAnalysis.musicality.impact * 0.2 +
      synergy.reinforcement * 0.1
    );
    
    // Memorization appeal (sing-along factor)
    const memorization = (
      rhymeAnalysis.musicality.memorability * 0.4 +
      rhythmAnalysis.musicality.memorability * 0.4 +
      synergy.balance * 0.2
    );
    
    // Brandability (marketing/recognition)
    const brandability = (
      mainstream * 0.4 +
      (rhymeAnalysis.patterns.filter(p => p.strength > 80).length * 15) +
      (rhythmAnalysis.syllablePattern.balance > 75 ? 15 : 0) +
      30 // Base
    );
    
    return {
      mainstream: Math.round(Math.min(100, mainstream)),
      artistic: Math.round(Math.min(100, artistic)),
      commercial: Math.round(Math.min(100, commercial)),
      performance: Math.round(Math.min(100, performance)),
      memorization: Math.round(Math.min(100, memorization)),
      brandability: Math.round(Math.min(100, brandability))
    };
  }
  
  /**
   * Generate comprehensive musicality breakdown
   */
  private generateMusicalityBreakdown(
    rhymeAnalysis: RhymeAnalysis,
    rhythmAnalysis: RhythmAnalysis,
    synergy: MusicalSynergy,
    appeal: MusicalAppeal,
    patterns: DetectedPattern[],
    request: MusicalityRequest
  ): MusicalityBreakdown {
    return {
      // Core dimensions
      rhymeQuality: rhymeAnalysis.overall,
      rhythmQuality: rhythmAnalysis.overall,
      phoneticFlow: (rhymeAnalysis.phoneticSimilarity + rhythmAnalysis.flow.smoothness) / 2,
      memorability: (rhymeAnalysis.musicality.memorability + rhythmAnalysis.musicality.memorability) / 2,
      catchiness: (rhymeAnalysis.musicality.catchiness + rhythmAnalysis.musicality.catchiness) / 2,
      
      // Advanced dimensions
      musicalCoherence: (synergy.rhymeRhythmAlignment + synergy.reinforcement - synergy.competition / 2) / 1.5,
      genreSuitability: (rhymeAnalysis.musicality.genreFit + rhythmAnalysis.musicality.genreAlignment) / 2,
      vocalDeliverability: this.calculateVocalDeliverability(rhymeAnalysis, rhythmAnalysis),
      emotionalResonance: this.calculateEmotionalResonance(rhymeAnalysis, rhythmAnalysis, patterns),
      
      // Pattern-specific scores
      internalMusical: this.calculateInternalMusical(patterns),
      crossWordHarmony: synergy.rhymeRhythmAlignment,
      rhythmicConsistency: rhythmAnalysis.flow.continuity
    };
  }
  
  private calculateVocalDeliverability(rhymeAnalysis: RhymeAnalysis, rhythmAnalysis: RhythmAnalysis): number {
    return Math.round((
      rhythmAnalysis.stressPattern.naturalness * 0.4 +
      rhymeAnalysis.phoneticSimilarity * 0.3 +
      rhythmAnalysis.flow.smoothness * 0.3
    ));
  }
  
  private calculateEmotionalResonance(rhymeAnalysis: RhymeAnalysis, rhythmAnalysis: RhythmAnalysis, patterns: DetectedPattern[]): number {
    let resonance = 50; // Base
    
    resonance += rhymeAnalysis.musicality.impact * 0.3;
    resonance += rhythmAnalysis.musicality.energy * 0.2;
    
    // Strong patterns increase emotional impact
    const strongPatterns = patterns.filter(p => p.strength > 80).length;
    resonance += strongPatterns * 10;
    
    return Math.round(Math.min(100, resonance));
  }
  
  private calculateInternalMusical(patterns: DetectedPattern[]): number {
    const internalPatterns = patterns.filter(p => 
      p.type === 'internal_rhyme' || 
      p.type === 'phonetic_echo' || 
      p.type === 'assonance_pattern'
    );
    
    if (internalPatterns.length === 0) return 40;
    
    const avgStrength = internalPatterns.reduce((sum, p) => sum + p.strength, 0) / internalPatterns.length;
    return Math.round(avgStrength);
  }
  
  /**
   * Calculate overall musicality score
   */
  private calculateOverallMusicalityScore(
    breakdown: MusicalityBreakdown,
    synergy: MusicalSynergy,
    appeal: MusicalAppeal,
    request: MusicalityRequest
  ): number {
    // Get context weights
    const weights = this.getContextWeights(request);
    
    // Calculate weighted score
    const coreScore = (
      breakdown.rhymeQuality * weights.rhyme * 0.3 +
      breakdown.rhythmQuality * weights.rhythm * 0.3 +
      breakdown.musicalCoherence * weights.synergy +
      appeal.mainstream * weights.appeal
    ) / (weights.rhyme * 0.3 + weights.rhythm * 0.3 + weights.synergy + weights.appeal);
    
    // Apply bonus for exceptional synergy
    let finalScore = coreScore;
    if (synergy.emergentQualities.length > 2) {
      finalScore += 5;
    }
    if (synergy.reinforcement > 90) {
      finalScore += 3;
    }
    
    return Math.round(Math.min(100, Math.max(0, finalScore)));
  }
  
  private getContextWeights(request: MusicalityRequest) {
    if (request.performanceContext === 'live') return this.contextWeights.live;
    if (request.targetAudience === 'mainstream') return this.contextWeights.commercial;
    if (request.type === 'band') return this.contextWeights.band;
    if (request.type === 'song') return this.contextWeights.song;
    return this.contextWeights.default;
  }
  
  /**
   * Generate musicality metadata
   */
  private generateMusicalityMetadata(
    startTime: number,
    rhymeAnalysis: RhymeAnalysis,
    rhythmAnalysis: RhythmAnalysis,
    overall: number,
    breakdown: MusicalityBreakdown,
    request: MusicalityRequest
  ): MusicalityMetadata {
    const analysisTime = Date.now() - startTime;
    
    // Calculate confidence based on analysis quality
    const rhymeConfidence = Math.min(100, (rhymeAnalysis.patterns.length * 15) + (rhymeAnalysis.phoneticSimilarity * 0.3) + 40);
    const rhythmConfidence = Math.min(100, rhythmAnalysis.meter.confidence + (rhythmAnalysis.stressPattern.naturalness * 0.3));
    const overallConfidence = (rhymeConfidence + rhythmConfidence) / 2;
    
    // Generate warnings
    const warnings: string[] = [];
    if (breakdown.rhymeQuality < 50) warnings.push('Low rhyme quality detected');
    if (breakdown.rhythmQuality < 50) warnings.push('Weak rhythmic pattern');
    if (breakdown.musicalCoherence < 60) warnings.push('Limited rhyme-rhythm synergy');
    if (overall < 55) warnings.push('Overall musicality below recommended threshold');
    
    // Generate suggestions
    const suggestions: string[] = [];
    if (breakdown.catchiness < 65) suggestions.push('Consider enhancing catchiness through stronger rhyming or rhythm');
    if (breakdown.vocalDeliverability < 60) suggestions.push('Improve vocal deliverability with smoother phonetic transitions');
    if (breakdown.genreSuitability < 70) suggestions.push('Adjust word choices to better match genre expectations');
    
    // Generate genre optimization
    const genreOptimization: string[] = [];
    if (request.genre && request.genre in this.genrePreferences) {
      const prefs = this.genrePreferences[request.genre as keyof typeof this.genrePreferences];
      genreOptimization.push(`Optimize for ${request.genre} by emphasizing ${prefs.rhymeImportance > 0.8 ? 'rhyming patterns' : 'rhythmic elements'}`);
    }
    
    return {
      analysisTime,
      algorithm: 'musicality_scoring_v1.0',
      confidence: Math.round(overallConfidence),
      rhymeAnalysisConfidence: Math.round(rhymeConfidence),
      rhythmAnalysisConfidence: Math.round(rhythmConfidence),
      warnings,
      suggestions,
      genreOptimization
    };
  }
  
  /**
   * Generate comprehensive recommendations
   */
  private generateMusicalityRecommendations(
    score: MusicalityScore,
    rhymeAnalysis: RhymeAnalysis,
    rhythmAnalysis: RhythmAnalysis,
    request: MusicalityRequest
  ): MusicalityRecommendation[] {
    const recommendations: MusicalityRecommendation[] = [];
    
    // Rhyme recommendations
    if (score.breakdown.rhymeQuality < 70) {
      recommendations.push({
        category: 'rhyme',
        priority: 'high',
        recommendation: 'Add stronger rhyming elements between words or within words',
        expectedImprovement: 15,
        difficulty: 'medium',
        examples: ['Use words with similar endings', 'Add alliterative elements']
      });
    }
    
    // Rhythm recommendations
    if (score.breakdown.rhythmQuality < 70) {
      recommendations.push({
        category: 'rhythm',
        priority: 'high',
        recommendation: 'Improve syllable balance and stress patterns',
        expectedImprovement: 12,
        difficulty: 'medium',
        examples: ['Balance syllable counts across words', 'Create natural stress patterns']
      });
    }
    
    // Synergy recommendations
    if (score.synergy.rhymeRhythmAlignment < 60) {
      recommendations.push({
        category: 'synergy',
        priority: 'medium',
        recommendation: 'Align rhyming words with stressed syllables',
        expectedImprovement: 10,
        difficulty: 'hard',
        examples: ['Place rhymes on natural stress points', 'Coordinate sound patterns with rhythm']
      });
    }
    
    // Appeal recommendations
    if (score.appeal.mainstream < 65) {
      recommendations.push({
        category: 'appeal',
        priority: 'medium',
        recommendation: 'Enhance mainstream appeal through clearer patterns',
        expectedImprovement: 8,
        difficulty: 'easy',
        examples: ['Use more familiar rhyme schemes', 'Simplify complex rhythmic patterns']
      });
    }
    
    // Performance recommendations
    if (score.breakdown.vocalDeliverability < 60) {
      recommendations.push({
        category: 'performance',
        priority: 'high',
        recommendation: 'Improve vocal deliverability and sing-ability',
        expectedImprovement: 12,
        difficulty: 'medium',
        examples: ['Smoother phonetic transitions', 'Natural breathing patterns']
      });
    }
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }
  
  /**
   * Get musicality benchmarks for comparison
   */
  private getMusicalityBenchmarks(genre?: string): MusicalityBenchmarks {
    const overall = this.industryBenchmarks.overall;
    
    return {
      industryAverage: overall.industryAverage,
      genreAverage: genre && genre in this.industryBenchmarks.byGenre 
        ? this.industryBenchmarks.byGenre[genre as keyof typeof this.industryBenchmarks.byGenre].average 
        : overall.genreAverage,
      topPercentile: genre && genre in this.industryBenchmarks.byGenre 
        ? this.industryBenchmarks.byGenre[genre as keyof typeof this.industryBenchmarks.byGenre].top 
        : overall.topPercentile,
      commercialThreshold: genre && genre in this.industryBenchmarks.byGenre 
        ? this.industryBenchmarks.byGenre[genre as keyof typeof this.industryBenchmarks.byGenre].commercial 
        : overall.commercialThreshold,
      artisticThreshold: overall.artisticThreshold,
      performanceReadiness: overall.performanceReadiness
    };
  }
  
  private getDefaultResult(request: MusicalityRequest): MusicalityResult {
    const defaultRhyme: RhymeAnalysis = {
      overall: 50,
      patterns: [],
      internalRhymes: [],
      phoneticSimilarity: 50,
      rhymeScheme: 'X',
      musicality: { catchiness: 50, memorability: 50, flow: 50, impact: 50, genreFit: 50 },
      issues: ['Analysis failed'],
      recommendations: ['Try simpler combinations']
    };
    
    const defaultRhythm: RhythmAnalysis = {
      overall: 50,
      syllablePattern: { totalSyllables: 4, syllableDistribution: [2, 2], balance: 50, complexity: 50, pattern: '2-2' },
      stressPattern: { pattern: 'Sw', primaryStresses: [0], secondaryStresses: [], naturalness: 50, emphasis: 50 },
      meter: { type: 'mixed', confidence: 50, regularity: 50, musicalFit: 50, timeSignature: '4/4' },
      flow: { overallFlow: 50, wordTransitions: [], continuity: 50, momentum: 50, smoothness: 50 },
      musicality: { danceability: 50, energy: 50, catchiness: 50, memorability: 50, genreAlignment: 50 },
      timing: { bpm: 120, subdivision: 'quarter', syncopation: 30, groove: 'straight', musicalPhrase: '♪♫' },
      issues: ['Analysis failed'],
      recommendations: ['Try simpler combinations']
    };
    
    return {
      name: request.name,
      score: {
        overall: 45,
        breakdown: {
          rhymeQuality: 50, rhythmQuality: 50, phoneticFlow: 50, memorability: 50, catchiness: 50,
          musicalCoherence: 45, genreSuitability: 50, vocalDeliverability: 50, emotionalResonance: 45,
          internalMusical: 40, crossWordHarmony: 45, rhythmicConsistency: 50
        },
        metadata: {
          analysisTime: 100, algorithm: 'musicality_scoring_v1.0', confidence: 40,
          rhymeAnalysisConfidence: 40, rhythmAnalysisConfidence: 40,
          warnings: ['Analysis failed - using defaults'], suggestions: [], genreOptimization: []
        },
        patterns: [],
        synergy: {
          rhymeRhythmAlignment: 45, reinforcement: 40, competition: 60, balance: 50, emergentQualities: []
        },
        appeal: {
          mainstream: 45, artistic: 40, commercial: 40, performance: 45, memorization: 45, brandability: 40
        }
      },
      rhymeAnalysis: defaultRhyme,
      rhythmAnalysis: defaultRhythm,
      recommendations: [],
      benchmarks: this.getMusicalityBenchmarks(request.genre)
    };
  }
  
  /**
   * Public method to get cache statistics
   */
  public getCacheStats() {
    return {
      size: (this.cache as any).cache ? (this.cache as any).cache.size : 0,
      hitRate: (this.cache as any).hitRate || 0,
      maxSize: 2000
    };
  }
}

// Export singleton instance
export const musicalityScoring = new MusicalityScoring();