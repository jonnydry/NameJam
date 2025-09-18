/**
 * Pattern Selection Engine - Intelligent context-aware pattern matching
 * Selects optimal patterns based on generation context, user preferences, and quality metrics
 */

import { PatternDefinition, PatternContext, advancedPatternLibrary } from './advancedPatternLibrary';
import { EnhancedWordSource } from './types';
import { secureLog } from '../../utils/secureLogger';
import { getRandomWord } from './stringUtils';

// Selection criteria for pattern matching
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
   * Select the best pattern based on criteria and context
   */
  selectPattern(
    criteria: PatternSelectionCriteria,
    sources: EnhancedWordSource
  ): PatternDefinition | null {
    // Get all eligible patterns
    const eligiblePatterns = this.getEligiblePatterns(criteria);
    
    if (eligiblePatterns.length === 0) {
      secureLog.warn('No eligible patterns found for criteria', criteria);
      return null;
    }

    // Score all patterns
    const scoredPatterns = this.scorePatterns(eligiblePatterns, criteria, sources);
    
    // Select best pattern with some randomization to avoid predictability
    const selectedPattern = this.selectFromScoredPatterns(scoredPatterns);
    
    if (selectedPattern) {
      this.updateSelectionHistory(selectedPattern);
      secureLog.debug(`Selected pattern: ${selectedPattern.id} (${selectedPattern.category}/${selectedPattern.subcategory})`);
    }
    
    return selectedPattern;
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
}

// Export singleton instance
export const patternSelectionEngine = new PatternSelectionEngine();