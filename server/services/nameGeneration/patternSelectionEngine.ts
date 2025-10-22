/**
 * Pattern Selection Engine - Intelligent context-aware pattern matching with mood-driven selection
 * Selects optimal patterns based on generation context, user preferences, quality metrics, and emotional coherence
 */

import { PatternDefinition, PatternContext, advancedPatternLibrary } from './advancedPatternLibrary';
import { EnhancedWordSource } from './types';
import { secureLog } from '../../utils/secureLogger';
import { getRandomWord } from './stringUtils';
import { 
  moodClassificationSystem, 
  MoodProfile, 
  EmotionalDimensions 
} from './moodClassificationSystem';
import { 
  patternMoodMapper, 
  PatternEmotionalScore,
  MoodPatternCollection 
} from './patternMoodMapper';
import { 
  contextualMoodSelector, 
  GenerationContext,
  ContextualAnalysis,
  MoodDrivenSelection 
} from './contextualMoodSelector';
import { 
  atmosphericIntelligence, 
  AtmosphericContext 
} from './atmosphericIntelligence';

// Selection criteria for pattern matching with mood-driven enhancements
export interface PatternSelectionCriteria {
  wordCount: number;
  genre?: string;
  mood?: string;
  type?: 'band' | 'song';
  intensity?: 'low' | 'medium' | 'high';
  creativityLevel?: 'conservative' | 'balanced' | 'experimental';
  targetAudience?: 'mainstream' | 'niche' | 'underground';
  era?: 'vintage' | 'modern' | 'futuristic';
  theme?: string;
  avoidCategories?: string[];
  preferCategories?: string[];
  
  // Enhanced mood-driven criteria
  primaryMood?: string;
  secondaryMoods?: string[];
  moodIntensity?: number; // 0-100
  emotionalDirection?: 'uplifting' | 'neutral' | 'introspective';
  atmosphericContext?: AtmosphericContext;
  emotionalCoherence?: 'strict' | 'flexible' | 'diverse';
  moodAdaptation?: boolean; // Allow automatic mood adaptation
}

// Enhanced pattern scoring with mood alignment
export interface EnhancedPatternScore extends PatternScore {
  moodAlignment?: PatternEmotionalScore;
  atmosphericCoherence?: number;
  emotionalJustification?: string;
}

export interface PatternScore {
  pattern: PatternDefinition;
  score: number;
  reasons: string[];
  contextMatch: number;
  qualityScore: number;
  diversityBonus: number;
}

export interface SelectionHistory {
  recentPatterns: string[];
  categoryUsage: Record<string, number>;
  subcategoryUsage: Record<string, number>;
  lastSelectionTime: number;
}

export class PatternSelectionEngine {
  private selectionHistory: SelectionHistory = {
    recentPatterns: [],
    categoryUsage: {},
    subcategoryUsage: {},
    lastSelectionTime: 0
  };
  
  private readonly MAX_RECENT_PATTERNS = 20;
  private readonly HISTORY_DECAY_TIME = 300000; // 5 minutes

  // Enhanced scoring weights with mood considerations
  private readonly enhancedScoringWeights = {
    contextMatch: 0.25,        // Traditional context matching
    moodAlignment: 0.3,        // Mood-driven alignment (new)
    atmosphericCoherence: 0.2, // Atmospheric consistency (new)
    patternWeight: 0.15,       // Pattern's inherent weight/quality
    diversityBonus: 0.1        // Bonus for varied selection
  };

  // Mood-driven selection mode configuration
  private moodDrivenMode: boolean = false;

  // Context-to-category mapping for intelligent selection
  private readonly contextMappings = {
    genre: {
      rock: ['traditional', 'narrative', 'emotional', 'fusion'],
      jazz: ['sophisticated', 'poetic', 'temporal', 'sensory'],
      electronic: ['futuristic', 'symbolic', 'linguistic', 'fusion'],
      folk: ['traditional', 'narrative', 'temporal', 'natural'],
      pop: ['accessible', 'emotional', 'descriptive', 'mainstream'],
      indie: ['experimental', 'poetic', 'conceptual', 'artistic'],
      classical: ['sophisticated', 'temporal', 'philosophical', 'elegant'],
      punk: ['raw', 'rebellious', 'direct', 'aggressive'],
      blues: ['emotional', 'narrative', 'traditional', 'soulful'],
      country: ['storytelling', 'traditional', 'emotional', 'rural']
    },
    mood: {
      energetic: ['dynamic', 'action', 'powerful', 'intense'],
      melancholic: ['emotional', 'temporal', 'introspective', 'poetic'],
      peaceful: ['serene', 'natural', 'gentle', 'harmonious'],
      aggressive: ['strong', 'confrontational', 'raw', 'powerful'],
      mysterious: ['abstract', 'symbolic', 'enigmatic', 'dark'],
      uplifting: ['positive', 'inspirational', 'bright', 'hopeful'],
      romantic: ['emotional', 'tender', 'intimate', 'beautiful'],
      nostalgic: ['temporal', 'reminiscent', 'wistful', 'vintage']
    },
    intensity: {
      low: ['gentle', 'subtle', 'understated', 'minimalist'],
      medium: ['balanced', 'moderate', 'versatile', 'accessible'],
      high: ['intense', 'bold', 'dramatic', 'powerful']
    },
    creativityLevel: {
      conservative: ['traditional', 'familiar', 'proven', 'safe'],
      balanced: ['creative', 'interesting', 'fresh', 'appealing'],
      experimental: ['innovative', 'unique', 'abstract', 'artistic']
    }
  };

  // Quality scoring weights for different aspects
  private readonly scoringWeights = {
    contextMatch: 0.4,      // How well pattern matches context
    patternWeight: 0.25,    // Pattern's inherent weight/quality
    diversityBonus: 0.2,    // Bonus for varied selection
    freshness: 0.15         // Bonus for patterns not recently used
  };

  /**
   * Select the best pattern based on criteria and context (enhanced with mood-driven option)
   */
  selectPattern(
    criteria: PatternSelectionCriteria,
    sources: EnhancedWordSource
  ): PatternDefinition | null {
    // Use mood-driven selection if enhanced criteria are provided
    if (this.shouldUseMoodDrivenSelection(criteria)) {
      return this.selectMoodDrivenPattern(criteria, sources);
    }

    // Fall back to traditional selection
    const eligiblePatterns = this.getEligiblePatterns(criteria);
    
    if (eligiblePatterns.length === 0) {
      secureLog.warn('No eligible patterns found for criteria', criteria);
      return null;
    }

    const scoredPatterns = this.scorePatterns(eligiblePatterns, criteria, sources);
    const selectedPattern = this.selectFromScoredPatterns(scoredPatterns);
    
    if (selectedPattern) {
      this.updateSelectionHistory(selectedPattern);
      secureLog.debug(`Selected pattern: ${selectedPattern.id} (${selectedPattern.category}/${selectedPattern.subcategory})`);
    }
    
    return selectedPattern;
  }

  /**
   * Enhanced mood-driven pattern selection
   */
  selectMoodDrivenPattern(
    criteria: PatternSelectionCriteria,
    sources: EnhancedWordSource
  ): PatternDefinition | null {
    secureLog.debug('Using mood-driven pattern selection', { criteria });

    // Convert criteria to generation context
    const generationContext = this.convertCriteriaToGenerationContext(criteria);
    
    // Get all eligible patterns
    const eligiblePatterns = this.getEligiblePatterns(criteria);
    
    if (eligiblePatterns.length === 0) {
      secureLog.warn('No eligible patterns found for mood-driven selection', criteria);
      return null;
    }

    try {
      // Use contextual mood selector
      const moodDrivenSelection = contextualMoodSelector.selectMoodDrivenPattern(
        generationContext,
        eligiblePatterns,
        sources
      );

      if (moodDrivenSelection) {
        this.updateSelectionHistory(moodDrivenSelection.selectedPattern);
        secureLog.info('Mood-driven pattern selected', {
          pattern: moodDrivenSelection.selectedPattern.id,
          moodAlignment: moodDrivenSelection.moodAlignment.overallScore,
          atmosphericCoherence: moodDrivenSelection.atmosphericCoherence,
          justification: moodDrivenSelection.emotionalJustification
        });
        
        return moodDrivenSelection.selectedPattern;
      }
    } catch (error) {
      secureLog.warn('Mood-driven selection failed, falling back to traditional selection', error);
    }

    // Fallback to enhanced scoring with mood considerations
    return this.selectPatternWithEnhancedScoring(criteria, sources, eligiblePatterns);
  }

  /**
   * Select multiple diverse patterns for batch generation
   */
  selectMultiplePatterns(
    criteria: PatternSelectionCriteria,
    sources: EnhancedWordSource,
    count: number
  ): PatternDefinition[] {
    const eligiblePatterns = this.getEligiblePatterns(criteria);
    
    if (eligiblePatterns.length === 0) return [];

    const scoredPatterns = this.scorePatterns(eligiblePatterns, criteria, sources);
    const selectedPatterns: PatternDefinition[] = [];
    const usedCategories = new Set<string>();
    const usedSubcategories = new Set<string>();

    // Select patterns with diversity enforcement
    for (let i = 0; i < count && scoredPatterns.length > 0; i++) {
      // Boost scores for patterns from unused categories
      const diversityBoostedPatterns = scoredPatterns.map(sp => ({
        ...sp,
        score: sp.score + this.calculateDiversityBonus(sp.pattern, usedCategories, usedSubcategories)
      }));

      const selected = this.selectFromScoredPatterns(diversityBoostedPatterns);
      if (selected) {
        selectedPatterns.push(selected);
        usedCategories.add(selected.category);
        usedSubcategories.add(selected.subcategory);
        
        // Remove selected pattern from future consideration
        const selectedIndex = scoredPatterns.findIndex(sp => sp.pattern.id === selected.id);
        if (selectedIndex >= 0) {
          scoredPatterns.splice(selectedIndex, 1);
        }
      }
    }

    // Update history for all selected patterns
    selectedPatterns.forEach(pattern => this.updateSelectionHistory(pattern));

    return selectedPatterns;
  }

  /**
   * Get patterns that match the selection criteria
   */
  private getEligiblePatterns(criteria: PatternSelectionCriteria): PatternDefinition[] {
    let patterns = advancedPatternLibrary.getAllPatterns(criteria.wordCount);

    // Filter by genre compatibility
    if (criteria.genre) {
      patterns = patterns.filter(p => 
        !p.genres || p.genres.length === 0 || p.genres.includes(criteria.genre!)
      );
    }

    // Filter by mood compatibility
    if (criteria.mood) {
      patterns = patterns.filter(p => 
        !p.moods || p.moods.length === 0 || p.moods.includes(criteria.mood!)
      );
    }

    // Filter by avoided categories
    if (criteria.avoidCategories) {
      patterns = patterns.filter(p => !criteria.avoidCategories!.includes(p.category));
    }

    // Filter by preferred categories (if specified, only include these)
    if (criteria.preferCategories && criteria.preferCategories.length > 0) {
      patterns = patterns.filter(p => criteria.preferCategories!.includes(p.category));
    }

    return patterns;
  }

  /**
   * Score patterns based on multiple criteria
   */
  private scorePatterns(
    patterns: PatternDefinition[],
    criteria: PatternSelectionCriteria,
    sources: EnhancedWordSource
  ): PatternScore[] {
    return patterns.map(pattern => {
      const contextMatch = this.calculateContextMatch(pattern, criteria);
      const qualityScore = this.calculateQualityScore(pattern, sources);
      const diversityBonus = this.calculateFreshnessBonus(pattern);
      
      const totalScore = 
        contextMatch * this.scoringWeights.contextMatch +
        pattern.weight * this.scoringWeights.patternWeight +
        diversityBonus * this.scoringWeights.diversityBonus +
        diversityBonus * this.scoringWeights.freshness;

      const reasons = this.generateScoreReasons(contextMatch, qualityScore, diversityBonus, pattern);

      return {
        pattern,
        score: totalScore,
        reasons,
        contextMatch,
        qualityScore,
        diversityBonus
      };
    }).sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate how well a pattern matches the context
   */
  private calculateContextMatch(pattern: PatternDefinition, criteria: PatternSelectionCriteria): number {
    let score = 0.5; // Base score

    // Genre matching
    if (criteria.genre) {
      const genreCategories = this.contextMappings.genre[criteria.genre as keyof typeof this.contextMappings.genre];
      if (genreCategories && genreCategories.includes(pattern.category)) {
        score += 0.3;
      }
    }

    // Mood matching
    if (criteria.mood) {
      const moodCategories = this.contextMappings.mood[criteria.mood as keyof typeof this.contextMappings.mood];
      if (moodCategories && moodCategories.includes(pattern.category)) {
        score += 0.2;
      }
    }

    // Intensity matching
    if (criteria.intensity) {
      const intensityCategories = this.contextMappings.intensity[criteria.intensity];
      if (intensityCategories && intensityCategories.includes(pattern.category)) {
        score += 0.15;
      }
    }

    // Creativity level matching
    if (criteria.creativityLevel) {
      const creativityCategories = this.contextMappings.creativityLevel[criteria.creativityLevel];
      if (creativityCategories && creativityCategories.includes(pattern.category)) {
        score += 0.15;
      }
    }

    // Type-specific bonuses
    if (criteria.type === 'band' && pattern.category === 'traditional') {
      score += 0.1;
    } else if (criteria.type === 'song' && ['narrative', 'poetic', 'emotional'].includes(pattern.category)) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Calculate quality score based on pattern characteristics and word sources
   */
  private calculateQualityScore(pattern: PatternDefinition, sources: EnhancedWordSource): number {
    let score = 0.5;

    // Bonus for patterns with good example diversity
    if (pattern.examples && pattern.examples.length >= 3) {
      score += 0.2;
    }

    // Bonus for patterns that can use rich word sources
    if (pattern.category === 'descriptive' && sources.validAdjectives.length > 20) {
      score += 0.15;
    }

    if (pattern.category === 'narrative' && sources.validVerbs.length > 15) {
      score += 0.15;
    }

    // Bonus for balanced patterns (not too common, not too obscure)
    if (pattern.weight >= 0.1 && pattern.weight <= 0.3) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Calculate freshness bonus based on recent usage
   */
  private calculateFreshnessBonus(pattern: PatternDefinition): number {
    // Decay old history
    this.decayHistory();

    let bonus = 0.5; // Base bonus

    // Penalty for recently used patterns
    if (this.selectionHistory.recentPatterns.includes(pattern.id)) {
      bonus -= 0.3;
    }

    // Penalty for overused categories
    const categoryUsage = this.selectionHistory.categoryUsage[pattern.category] || 0;
    if (categoryUsage > 3) {
      bonus -= 0.2;
    }

    // Penalty for overused subcategories
    const subcategoryUsage = this.selectionHistory.subcategoryUsage[pattern.subcategory] || 0;
    if (subcategoryUsage > 2) {
      bonus -= 0.15;
    }

    return Math.max(bonus, 0);
  }

  /**
   * Calculate diversity bonus for multi-pattern selection
   */
  private calculateDiversityBonus(
    pattern: PatternDefinition,
    usedCategories: Set<string>,
    usedSubcategories: Set<string>
  ): number {
    let bonus = 0;

    if (!usedCategories.has(pattern.category)) {
      bonus += 0.3;
    }

    if (!usedSubcategories.has(pattern.subcategory)) {
      bonus += 0.2;
    }

    return bonus;
  }

  /**
   * Select pattern from scored list with weighted randomization
   */
  private selectFromScoredPatterns(scoredPatterns: PatternScore[]): PatternDefinition | null {
    if (scoredPatterns.length === 0) return null;

    // Use weighted selection based on scores
    const totalScore = scoredPatterns.reduce((sum, sp) => sum + Math.max(sp.score, 0.1), 0);
    let random = Math.random() * totalScore;

    for (const scoredPattern of scoredPatterns) {
      random -= Math.max(scoredPattern.score, 0.1);
      if (random <= 0) {
        return scoredPattern.pattern;
      }
    }

    return scoredPatterns[0].pattern;
  }

  /**
   * Generate human-readable reasons for scoring
   */
  private generateScoreReasons(
    contextMatch: number,
    qualityScore: number,
    diversityBonus: number,
    pattern: PatternDefinition
  ): string[] {
    const reasons: string[] = [];

    if (contextMatch > 0.7) {
      reasons.push('Excellent context match');
    } else if (contextMatch > 0.5) {
      reasons.push('Good context match');
    }

    if (qualityScore > 0.7) {
      reasons.push('High quality pattern');
    }

    if (diversityBonus > 0.4) {
      reasons.push('Fresh selection');
    }

    if (pattern.weight > 0.2) {
      reasons.push('Reliable pattern');
    }

    if (pattern.examples.length > 3) {
      reasons.push('Well-documented pattern');
    }

    return reasons;
  }

  /**
   * Update selection history to track usage patterns
   */
  private updateSelectionHistory(pattern: PatternDefinition): void {
    // Add to recent patterns
    this.selectionHistory.recentPatterns.unshift(pattern.id);
    if (this.selectionHistory.recentPatterns.length > this.MAX_RECENT_PATTERNS) {
      this.selectionHistory.recentPatterns.pop();
    }

    // Update category usage
    this.selectionHistory.categoryUsage[pattern.category] = 
      (this.selectionHistory.categoryUsage[pattern.category] || 0) + 1;

    // Update subcategory usage
    this.selectionHistory.subcategoryUsage[pattern.subcategory] = 
      (this.selectionHistory.subcategoryUsage[pattern.subcategory] || 0) + 1;

    this.selectionHistory.lastSelectionTime = Date.now();
  }

  /**
   * Decay old history to prevent permanent bias
   */
  private decayHistory(): void {
    const now = Date.now();
    const timeSinceLastDecay = now - this.selectionHistory.lastSelectionTime;

    if (timeSinceLastDecay > this.HISTORY_DECAY_TIME) {
      // Reduce all usage counts by 50%
      Object.keys(this.selectionHistory.categoryUsage).forEach(key => {
        this.selectionHistory.categoryUsage[key] = 
          Math.floor(this.selectionHistory.categoryUsage[key] * 0.5);
        
        if (this.selectionHistory.categoryUsage[key] === 0) {
          delete this.selectionHistory.categoryUsage[key];
        }
      });

      Object.keys(this.selectionHistory.subcategoryUsage).forEach(key => {
        this.selectionHistory.subcategoryUsage[key] = 
          Math.floor(this.selectionHistory.subcategoryUsage[key] * 0.5);
        
        if (this.selectionHistory.subcategoryUsage[key] === 0) {
          delete this.selectionHistory.subcategoryUsage[key];
        }
      });

      // Clear recent patterns older than decay time
      this.selectionHistory.recentPatterns = this.selectionHistory.recentPatterns.slice(0, 10);
    }
  }

  /**
   * Get selection statistics for debugging and optimization
   */
  getSelectionStats(): {
    recentPatternCount: number;
    categoryDistribution: Record<string, number>;
    subcategoryDistribution: Record<string, number>;
    averageContextMatch: number;
  } {
    const totalCategoryUsage = Object.values(this.selectionHistory.categoryUsage)
      .reduce((sum, count) => sum + count, 0);
    
    return {
      recentPatternCount: this.selectionHistory.recentPatterns.length,
      categoryDistribution: this.selectionHistory.categoryUsage,
      subcategoryDistribution: this.selectionHistory.subcategoryUsage,
      averageContextMatch: 0.65 // Placeholder - would calculate from actual selections
    };
  }

  /**
   * Reset selection history (useful for testing or new sessions)
   */
  resetHistory(): void {
    this.selectionHistory = {
      recentPatterns: [],
      categoryUsage: {},
      subcategoryUsage: {},
      lastSelectionTime: 0
    };
  }

  /**
   * Get recommended patterns for learning/adaptation
   */
  getPatternRecommendations(
    criteria: PatternSelectionCriteria,
    sources: EnhancedWordSource
  ): { 
    recommended: PatternDefinition[];
    alternatives: PatternDefinition[];
    reasoning: string[];
  } {
    const eligiblePatterns = this.getEligiblePatterns(criteria);
    const scoredPatterns = this.scorePatterns(eligiblePatterns, criteria, sources);
    
    const recommended = scoredPatterns.slice(0, 3).map(sp => sp.pattern);
    const alternatives = scoredPatterns.slice(3, 8).map(sp => sp.pattern);
    
    const reasoning = scoredPatterns.slice(0, 3)
      .map(sp => `${sp.pattern.id}: ${sp.reasons.join(', ')} (score: ${sp.score.toFixed(2)})`);
    
    return { recommended, alternatives, reasoning };
  }

  // ===== MOOD-DRIVEN ENHANCEMENT METHODS =====

  /**
   * Determine if mood-driven selection should be used
   */
  private shouldUseMoodDrivenSelection(criteria: PatternSelectionCriteria): boolean {
    return !!(
      criteria.primaryMood ||
      criteria.secondaryMoods?.length ||
      criteria.atmosphericContext ||
      criteria.emotionalDirection ||
      criteria.moodIntensity !== undefined ||
      this.moodDrivenMode
    );
  }

  /**
   * Convert selection criteria to generation context for mood analysis
   */
  private convertCriteriaToGenerationContext(criteria: PatternSelectionCriteria): GenerationContext {
    return {
      primaryMood: criteria.primaryMood || criteria.mood,
      secondaryMoods: criteria.secondaryMoods,
      moodIntensity: criteria.moodIntensity,
      genre: criteria.genre,
      type: criteria.type,
      wordCount: criteria.wordCount,
      era: criteria.era,
      themes: criteria.theme ? [criteria.theme] : undefined,
      creativityLevel: criteria.creativityLevel,
      emotionalDirection: criteria.emotionalDirection,
      // Map intensity to energy level
      energyLevel: criteria.intensity === 'high' ? 'high' : 
                  criteria.intensity === 'low' ? 'calm' : 'moderate',
      // Map target audience to venue/audience
      audience: criteria.targetAudience,
      // Apply atmospheric context if provided
      ...(criteria.atmosphericContext || {})
    };
  }

  /**
   * Enhanced pattern scoring with mood considerations (fallback method)
   */
  private selectPatternWithEnhancedScoring(
    criteria: PatternSelectionCriteria,
    sources: EnhancedWordSource,
    eligiblePatterns: PatternDefinition[]
  ): PatternDefinition | null {
    const enhancedScores: EnhancedPatternScore[] = [];

    for (const pattern of eligiblePatterns) {
      // Calculate traditional scores
      const contextMatch = this.calculateContextMatch(pattern, criteria);
      const qualityScore = this.calculateQualityScore(pattern, sources);
      const diversityBonus = this.calculateFreshnessBonus(pattern);

      // Calculate mood alignment if mood is specified
      let moodAlignment: PatternEmotionalScore | undefined;
      let atmosphericCoherence = 0.5; // Default neutral

      if (criteria.primaryMood || criteria.mood) {
        try {
          const targetMood = criteria.primaryMood || criteria.mood!;
          moodAlignment = patternMoodMapper.scorePatternForMood(pattern, targetMood);
          
          // Calculate atmospheric coherence if atmospheric context exists
          if (criteria.atmosphericContext) {
            const coherenceResult = atmosphericIntelligence.calculateAtmosphericCoherence(
              pattern,
              criteria.atmosphericContext,
              [targetMood]
            );
            atmosphericCoherence = coherenceResult.coherenceScore;
          }
        } catch (error) {
          secureLog.warn(`Failed to calculate mood alignment for pattern ${pattern.id}`, error);
        }
      }

      // Calculate enhanced total score
      const enhancedScore = this.calculateEnhancedScore(
        contextMatch,
        qualityScore,
        diversityBonus,
        moodAlignment,
        atmosphericCoherence,
        pattern
      );

      enhancedScores.push({
        pattern,
        score: enhancedScore,
        reasons: this.generateEnhancedScoreReasons(contextMatch, qualityScore, diversityBonus, moodAlignment, pattern),
        contextMatch,
        qualityScore,
        diversityBonus,
        moodAlignment,
        atmosphericCoherence,
        emotionalJustification: moodAlignment?.explanation
      });
    }

    // Sort by enhanced score
    enhancedScores.sort((a, b) => b.score - a.score);

    // Select with weighted randomization
    const selectedScore = this.selectFromEnhancedScores(enhancedScores);
    
    if (selectedScore) {
      this.updateSelectionHistory(selectedScore.pattern);
      secureLog.debug('Enhanced pattern selected', {
        pattern: selectedScore.pattern.id,
        score: selectedScore.score,
        moodAlignment: selectedScore.moodAlignment?.overallScore,
        atmosphericCoherence: selectedScore.atmosphericCoherence
      });
      
      return selectedScore.pattern;
    }

    return null;
  }

  /**
   * Calculate enhanced score incorporating mood alignment
   */
  private calculateEnhancedScore(
    contextMatch: number,
    qualityScore: number,
    diversityBonus: number,
    moodAlignment?: PatternEmotionalScore,
    atmosphericCoherence?: number,
    pattern?: PatternDefinition
  ): number {
    const weights = this.enhancedScoringWeights;
    
    return (
      contextMatch * weights.contextMatch +
      (moodAlignment?.overallScore || 0.5) * weights.moodAlignment +
      (atmosphericCoherence || 0.5) * weights.atmosphericCoherence +
      (pattern?.weight || 0.5) * weights.patternWeight +
      diversityBonus * weights.diversityBonus
    );
  }

  /**
   * Generate enhanced score reasons including mood factors
   */
  private generateEnhancedScoreReasons(
    contextMatch: number,
    qualityScore: number,
    diversityBonus: number,
    moodAlignment?: PatternEmotionalScore,
    pattern?: PatternDefinition
  ): string[] {
    const reasons = this.generateScoreReasons(contextMatch, qualityScore, diversityBonus, pattern!);

    if (moodAlignment) {
      if (moodAlignment.overallScore > 0.8) {
        reasons.push('Excellent mood alignment');
      } else if (moodAlignment.overallScore > 0.6) {
        reasons.push('Good mood alignment');
      } else if (moodAlignment.overallScore < 0.4) {
        reasons.push('Poor mood alignment');
      }

      if (moodAlignment.confidence > 0.8) {
        reasons.push('High emotional confidence');
      }
    }

    return reasons;
  }

  /**
   * Select pattern from enhanced scores with weighted randomization
   */
  private selectFromEnhancedScores(enhancedScores: EnhancedPatternScore[]): EnhancedPatternScore | null {
    if (enhancedScores.length === 0) return null;

    // Use weighted selection based on enhanced scores
    const totalScore = enhancedScores.reduce((sum, sp) => sum + Math.max(sp.score, 0.1), 0);
    let random = Math.random() * totalScore;

    for (const scoredPattern of enhancedScores) {
      random -= Math.max(scoredPattern.score, 0.1);
      if (random <= 0) {
        return scoredPattern;
      }
    }

    return enhancedScores[0];
  }

  /**
   * Enable or disable mood-driven selection mode
   */
  enableMoodDrivenMode(enabled: boolean = true): void {
    this.moodDrivenMode = enabled;
    secureLog.info(`Mood-driven selection mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get mood-driven pattern recommendations with emotional context
   */
  getMoodDrivenRecommendations(
    criteria: PatternSelectionCriteria,
    sources: EnhancedWordSource
  ): {
    recommended: PatternDefinition[];
    moodAnalysis: ContextualAnalysis | null;
    emotionalScores: EnhancedPatternScore[];
    reasoning: string[];
  } {
    const generationContext = this.convertCriteriaToGenerationContext(criteria);
    
    let moodAnalysis: ContextualAnalysis | null = null;
    try {
      moodAnalysis = contextualMoodSelector.analyzeContext(generationContext);
    } catch (error) {
      secureLog.warn('Failed to analyze mood context', error);
    }

    const eligiblePatterns = this.getEligiblePatterns(criteria);
    const enhancedScores = this.getEnhancedScores(eligiblePatterns, criteria, sources);
    
    const recommended = enhancedScores.slice(0, 5).map(sp => sp.pattern);
    const reasoning = enhancedScores.slice(0, 3)
      .map(sp => `${sp.pattern.id}: ${sp.reasons.join(', ')} (score: ${sp.score.toFixed(2)})`);

    return {
      recommended,
      moodAnalysis,
      emotionalScores: enhancedScores.slice(0, 10),
      reasoning
    };
  }

  /**
   * Helper method to get enhanced scores for patterns
   */
  private getEnhancedScores(
    patterns: PatternDefinition[],
    criteria: PatternSelectionCriteria,
    sources: EnhancedWordSource
  ): EnhancedPatternScore[] {
    return patterns.map(pattern => {
      const contextMatch = this.calculateContextMatch(pattern, criteria);
      const qualityScore = this.calculateQualityScore(pattern, sources);
      const diversityBonus = this.calculateFreshnessBonus(pattern);

      let moodAlignment: PatternEmotionalScore | undefined;
      let atmosphericCoherence = 0.5;

      if (criteria.primaryMood || criteria.mood) {
        try {
          const targetMood = criteria.primaryMood || criteria.mood!;
          moodAlignment = patternMoodMapper.scorePatternForMood(pattern, targetMood);
          
          if (criteria.atmosphericContext) {
            const coherenceResult = atmosphericIntelligence.calculateAtmosphericCoherence(
              pattern,
              criteria.atmosphericContext,
              [targetMood]
            );
            atmosphericCoherence = coherenceResult.coherenceScore;
          }
        } catch (error) {
          // Silently handle mood scoring errors
        }
      }

      const enhancedScore = this.calculateEnhancedScore(
        contextMatch,
        qualityScore,
        diversityBonus,
        moodAlignment,
        atmosphericCoherence,
        pattern
      );

      return {
        pattern,
        score: enhancedScore,
        reasons: this.generateEnhancedScoreReasons(contextMatch, qualityScore, diversityBonus, moodAlignment, pattern),
        contextMatch,
        qualityScore,
        diversityBonus,
        moodAlignment,
        atmosphericCoherence,
        emotionalJustification: moodAlignment?.explanation
      };
    }).sort((a, b) => b.score - a.score);
  }
}

// Export singleton instance
export const patternSelectionEngine = new PatternSelectionEngine();