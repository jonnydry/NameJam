/**
 * Pattern-Mood Mapping Engine - Associates patterns with emotional characteristics
 * Provides sophisticated scoring and mapping between patterns and emotional contexts
 */

import { PatternDefinition } from './advancedPatternLibrary';
import { 
  moodClassificationSystem, 
  MoodProfile, 
  EmotionalDimensions 
} from './moodClassificationSystem';
import { secureLog } from '../../utils/secureLogger';

// Emotional scoring criteria for patterns
export interface PatternEmotionalScore {
  patternId: string;
  moodId: string;
  overallScore: number;
  dimensionScores: {
    energy: number;
    valence: number;
    complexity: number;
    intensity: number;
    darkness: number;
    mystery: number;
  };
  reasoningFactors: {
    structuralAlignment: number;
    vocabularyFit: number;
    culturalResonance: number;
    semanticHarmony: number;
  };
  confidence: number;
  explanation: string;
}

// Pattern emotional characteristics analysis
export interface PatternEmotionalCharacteristics {
  patternId: string;
  inherentDimensions: EmotionalDimensions;
  moodAffinities: Map<string, number>; // mood -> affinity score (0-1)
  emotionalFlexibility: number; // How adaptable the pattern is to different moods
  dominantEmotions: string[];
  conflictingEmotions: string[];
  optimalMoodRange: {
    energy: [number, number];
    valence: [number, number];
    intensity: [number, number];
  };
  contextualFactors: {
    timeOfDay: string[];
    seasons: string[];
    situations: string[];
    genres: string[];
  };
}

// Mood-specific pattern collection
export interface MoodPatternCollection {
  moodId: string;
  primaryPatterns: string[]; // Best matches
  secondaryPatterns: string[]; // Good alternatives
  emergencyPatterns: string[]; // Fallback options
  avoidPatterns: string[]; // Poor emotional fit
  patternWeightAdjustments: Map<string, number>; // Adjust pattern weights for this mood
}

export class PatternMoodMapper {
  // Cache for pattern emotional characteristics
  private patternCharacteristics: Map<string, PatternEmotionalCharacteristics> = new Map();
  
  // Cache for mood-specific pattern collections
  private moodCollections: Map<string, MoodPatternCollection> = new Map();
  
  // Scoring weights for different emotional factors
  private readonly scoringWeights = {
    structuralAlignment: 0.3,   // How well pattern structure fits mood
    vocabularyFit: 0.25,        // Vocabulary appropriateness for mood
    culturalResonance: 0.2,     // Cultural/contextual emotional fit
    semanticHarmony: 0.25       // Semantic coherence with mood
  };

  // Pattern category to emotional tendency mapping
  private readonly categoryEmotionalTendencies: Map<string, Partial<EmotionalDimensions>> = new Map([
    ['conceptual', { complexity: 80, mystery: 70, energy: 40 }],
    ['descriptive', { valence: 70, energy: 60, complexity: 50 }],
    ['narrative', { complexity: 70, energy: 55, valence: 60 }],
    ['fusion', { energy: 75, complexity: 85, mystery: 60 }],
    ['temporal', { complexity: 75, mystery: 65, valence: 45 }],
    ['symbolic', { mystery: 90, complexity: 85, darkness: 60 }],
    ['linguistic', { complexity: 80, energy: 65, mystery: 50 }],
    ['atmospheric', { mystery: 85, darkness: 70, complexity: 80 }],
    ['emotional', { intensity: 75, valence: 70, energy: 60 }],
    ['positive', { valence: 90, energy: 75, darkness: 10 }],
    ['vocabulary', { complexity: 60, mystery: 40, valence: 60 }]
  ]);

  // Subcategory emotional modifiers
  private readonly subcategoryModifiers: Map<string, Partial<EmotionalDimensions>> = new Map([
    ['abstract', { mystery: 20, complexity: 15 }],
    ['compound', { energy: 15, complexity: 10 }],
    ['morphology', { complexity: 20, mystery: 10 }],
    ['numeric', { mystery: 15, darkness: 10 }],
    ['rare', { complexity: 10, mystery: 15 }],
    ['quality', { energy: 10, valence: 15 }],
    ['contrast', { intensity: 20, complexity: 15 }],
    ['action', { energy: 25, intensity: 15 }],
    ['tech_nature', { mystery: 15, complexity: 20 }],
    ['sensory', { intensity: 15, valence: 10 }],
    ['philosophical', { complexity: 25, mystery: 20 }],
    ['journey', { energy: 15, valence: 10 }],
    ['question', { mystery: 20, complexity: 15 }],
    ['temporal', { mystery: 15, complexity: 10 }],
    ['natural', { valence: 20, darkness: -15 }],
    ['urban', { energy: 20, intensity: 15 }],
    ['cosmic', { mystery: 25, complexity: 20 }],
    ['mechanical', { energy: 20, darkness: 10 }],
    ['organic', { valence: 15, darkness: -10 }]
  ]);

  // Template structure emotional implications
  private readonly templateEmotionalSignatures: Map<string, Partial<EmotionalDimensions>> = new Map([
    ['{adjective} {noun}', { energy: 10, valence: 10 }],
    ['{action} {object}', { energy: 25, intensity: 15 }],
    ['{element1} {element2}', { complexity: 15, mystery: 10 }],
    ['{concept}', { mystery: 15, complexity: 10 }],
    ['{prefix}{base}', { energy: 15, complexity: 10 }],
    ['{question} {answer}', { mystery: 20, complexity: 15 }],
    ['{time} {concept}', { mystery: 10, complexity: 15 }],
    ['{sensory} {experience}', { intensity: 15, valence: 10 }],
    ['{journey} {destination}', { energy: 15, valence: 10 }],
    ['{metaphor} {reality}', { complexity: 25, mystery: 20 }]
  ]);

  /**
   * Analyze and cache emotional characteristics for a pattern
   */
  analyzePatternEmotionalCharacteristics(pattern: PatternDefinition): PatternEmotionalCharacteristics {
    // Check cache first
    if (this.patternCharacteristics.has(pattern.id)) {
      return this.patternCharacteristics.get(pattern.id)!;
    }

    // Calculate inherent emotional dimensions
    const inherentDimensions = this.calculateInherentDimensions(pattern);
    
    // Calculate mood affinities
    const moodAffinities = this.calculateMoodAffinities(pattern, inherentDimensions);
    
    // Determine emotional flexibility
    const emotionalFlexibility = this.calculateEmotionalFlexibility(pattern);
    
    // Identify dominant and conflicting emotions
    const { dominantEmotions, conflictingEmotions } = this.identifyEmotionalTendencies(moodAffinities);
    
    // Define optimal mood range
    const optimalMoodRange = this.defineOptimalMoodRange(inherentDimensions);
    
    // Determine contextual factors
    const contextualFactors = this.analyzeContextualFactors(pattern);

    const characteristics: PatternEmotionalCharacteristics = {
      patternId: pattern.id,
      inherentDimensions,
      moodAffinities,
      emotionalFlexibility,
      dominantEmotions,
      conflictingEmotions,
      optimalMoodRange,
      contextualFactors
    };

    // Cache the results
    this.patternCharacteristics.set(pattern.id, characteristics);
    
    return characteristics;
  }

  /**
   * Score how well a pattern fits a specific mood
   */
  scorePatternForMood(pattern: PatternDefinition, moodId: string): PatternEmotionalScore {
    const moodProfile = moodClassificationSystem.getMoodProfile(moodId);
    if (!moodProfile) {
      throw new Error(`Unknown mood: ${moodId}`);
    }

    const patternCharacteristics = this.analyzePatternEmotionalCharacteristics(pattern);
    
    // Calculate dimension scores
    const dimensionScores = this.calculateDimensionAlignment(
      patternCharacteristics.inherentDimensions,
      moodProfile.dimensions
    );
    
    // Calculate reasoning factors
    const reasoningFactors = this.calculateReasoningFactors(pattern, moodProfile);
    
    // Calculate overall score
    const overallScore = this.calculateOverallScore(dimensionScores, reasoningFactors);
    
    // Determine confidence level
    const confidence = this.calculateConfidence(overallScore, reasoningFactors);
    
    // Generate explanation
    const explanation = this.generateScoreExplanation(pattern, moodProfile, overallScore, reasoningFactors);

    return {
      patternId: pattern.id,
      moodId,
      overallScore,
      dimensionScores,
      reasoningFactors,
      confidence,
      explanation
    };
  }

  /**
   * Get or create mood-specific pattern collection
   */
  getMoodPatternCollection(moodId: string, availablePatterns: PatternDefinition[]): MoodPatternCollection {
    // Check cache first
    if (this.moodCollections.has(moodId)) {
      return this.moodCollections.get(moodId)!;
    }

    const moodProfile = moodClassificationSystem.getMoodProfile(moodId);
    if (!moodProfile) {
      throw new Error(`Unknown mood: ${moodId}`);
    }

    // Score all patterns for this mood
    const scoredPatterns = availablePatterns.map(pattern => ({
      pattern,
      score: this.scorePatternForMood(pattern, moodId)
    })).sort((a, b) => b.score.overallScore - a.score.overallScore);

    // Categorize patterns by score thresholds
    const primaryPatterns: string[] = [];
    const secondaryPatterns: string[] = [];
    const emergencyPatterns: string[] = [];
    const avoidPatterns: string[] = [];
    const patternWeightAdjustments = new Map<string, number>();

    for (const { pattern, score } of scoredPatterns) {
      const overallScore = score.overallScore;
      
      if (overallScore >= 0.8) {
        primaryPatterns.push(pattern.id);
        patternWeightAdjustments.set(pattern.id, 1.2); // Boost excellent matches
      } else if (overallScore >= 0.6) {
        secondaryPatterns.push(pattern.id);
        patternWeightAdjustments.set(pattern.id, 1.0); // Neutral
      } else if (overallScore >= 0.4) {
        emergencyPatterns.push(pattern.id);
        patternWeightAdjustments.set(pattern.id, 0.8); // Slight penalty
      } else {
        avoidPatterns.push(pattern.id);
        patternWeightAdjustments.set(pattern.id, 0.3); // Heavy penalty
      }
    }

    const collection: MoodPatternCollection = {
      moodId,
      primaryPatterns,
      secondaryPatterns,
      emergencyPatterns,
      avoidPatterns,
      patternWeightAdjustments
    };

    // Cache the collection
    this.moodCollections.set(moodId, collection);
    
    return collection;
  }

  /**
   * Get patterns that work well for multiple moods
   */
  findVersatilePatterns(moodIds: string[], availablePatterns: PatternDefinition[]): PatternDefinition[] {
    const versatilityScores = new Map<string, number>();

    for (const pattern of availablePatterns) {
      let totalScore = 0;
      let validMoods = 0;

      for (const moodId of moodIds) {
        try {
          const score = this.scorePatternForMood(pattern, moodId);
          if (score.overallScore >= 0.5) { // Only count decent fits
            totalScore += score.overallScore;
            validMoods++;
          }
        } catch (error) {
          // Skip invalid moods
          continue;
        }
      }

      if (validMoods > 0) {
        const averageScore = totalScore / validMoods;
        const versatilityBonus = validMoods / moodIds.length; // Bonus for working with more moods
        versatilityScores.set(pattern.id, averageScore * versatilityBonus);
      }
    }

    // Return patterns sorted by versatility score
    return availablePatterns
      .filter(pattern => versatilityScores.has(pattern.id))
      .sort((a, b) => (versatilityScores.get(b.id) || 0) - (versatilityScores.get(a.id) || 0));
  }

  /**
   * Calculate inherent emotional dimensions of a pattern
   */
  private calculateInherentDimensions(pattern: PatternDefinition): EmotionalDimensions {
    // Start with neutral baseline
    let dimensions: EmotionalDimensions = {
      energy: 50,
      valence: 50,
      complexity: 50,
      intensity: 50,
      darkness: 50,
      mystery: 50
    };

    // Apply category tendencies
    const categoryTendency = this.categoryEmotionalTendencies.get(pattern.category);
    if (categoryTendency) {
      dimensions = this.mergeDimensions(dimensions, categoryTendency);
    }

    // Apply subcategory modifiers
    const subcategoryModifier = this.subcategoryModifiers.get(pattern.subcategory);
    if (subcategoryModifier) {
      dimensions = this.mergeDimensions(dimensions, subcategoryModifier);
    }

    // Apply template signature
    const templateSignature = this.templateEmotionalSignatures.get(pattern.template);
    if (templateSignature) {
      dimensions = this.mergeDimensions(dimensions, templateSignature);
    }

    // Apply pattern weight influence (higher weight = more intense/complex)
    const weightInfluence = (pattern.weight - 0.5) * 20; // Scale weight to -10 to +10
    dimensions.intensity += weightInfluence;
    dimensions.complexity += weightInfluence * 0.5;

    // Apply word count influence
    const wordCountInfluence = (pattern.maxWordCount - 1) * 10; // More words = more complex
    dimensions.complexity += wordCountInfluence;

    // Clamp all values to 0-100 range
    for (const key of Object.keys(dimensions) as (keyof EmotionalDimensions)[]) {
      dimensions[key] = Math.max(0, Math.min(100, dimensions[key]));
    }

    return dimensions;
  }

  /**
   * Calculate mood affinities for a pattern
   */
  private calculateMoodAffinities(pattern: PatternDefinition, inherentDimensions: EmotionalDimensions): Map<string, number> {
    const affinities = new Map<string, number>();
    
    for (const moodId of moodClassificationSystem.getAllMoodIds()) {
      const moodProfile = moodClassificationSystem.getMoodProfile(moodId);
      if (moodProfile) {
        // Calculate dimensional similarity
        const similarity = this.calculateDimensionalSimilarity(inherentDimensions, moodProfile.dimensions);
        
        // Apply genre compatibility bonus if pattern has genre info
        let genreBonus = 0;
        if (pattern.genres && pattern.genres.length > 0) {
          for (const genre of pattern.genres) {
            const compatibility = moodProfile.genreAffinity[genre] || 0;
            genreBonus = Math.max(genreBonus, compatibility);
          }
          genreBonus *= 0.2; // Scale bonus
        }

        // Apply mood-specific pattern preference bonus
        let patternBonus = 0;
        if (moodProfile.patternPreferences.includes(pattern.id) || 
            moodProfile.patternPreferences.includes(pattern.category) ||
            moodProfile.patternPreferences.includes(pattern.subcategory)) {
          patternBonus = 0.15;
        }

        const totalAffinity = Math.min(1.0, similarity + genreBonus + patternBonus);
        affinities.set(moodId, totalAffinity);
      }
    }

    return affinities;
  }

  /**
   * Calculate emotional flexibility of a pattern
   */
  private calculateEmotionalFlexibility(pattern: PatternDefinition): number {
    // Patterns with more abstract or general templates tend to be more flexible
    const templateFlexibility = this.assessTemplateFlexibility(pattern.template);
    
    // Category flexibility assessment
    const categoryFlexibility = this.assessCategoryFlexibility(pattern.category);
    
    // Weight influence (balanced weights tend to be more flexible)
    const weightFlexibility = 1 - Math.abs(pattern.weight - 0.5) * 2;
    
    return (templateFlexibility + categoryFlexibility + weightFlexibility) / 3;
  }

  /**
   * Assess template flexibility
   */
  private assessTemplateFlexibility(template: string): number {
    // More generic templates are more flexible
    const genericityFactors = [
      template.includes('{concept}') ? 0.3 : 0,
      template.includes('{adjective}') ? 0.2 : 0,
      template.includes('{noun}') ? 0.2 : 0,
      template.includes('{element}') ? 0.2 : 0,
      template.split('{').length > 2 ? 0.1 : 0 // Multiple placeholders
    ];
    
    return Math.min(1.0, genericityFactors.reduce((sum, factor) => sum + factor, 0));
  }

  /**
   * Assess category flexibility
   */
  private assessCategoryFlexibility(category: string): number {
    const flexibilityScores: Record<string, number> = {
      'conceptual': 0.9,
      'descriptive': 0.8,
      'narrative': 0.7,
      'fusion': 0.6,
      'linguistic': 0.7,
      'temporal': 0.6,
      'symbolic': 0.5,
      'atmospheric': 0.4,
      'emotional': 0.5,
      'positive': 0.3,
      'vocabulary': 0.8
    };
    
    return flexibilityScores[category] || 0.5;
  }

  /**
   * Identify dominant and conflicting emotions
   */
  private identifyEmotionalTendencies(moodAffinities: Map<string, number>): { dominantEmotions: string[], conflictingEmotions: string[] } {
    const affinityArray = Array.from(moodAffinities.entries()).sort((a, b) => b[1] - a[1]);
    
    const dominantEmotions = affinityArray
      .filter(([, affinity]) => affinity >= 0.7)
      .map(([moodId]) => moodId)
      .slice(0, 3); // Top 3
    
    const conflictingEmotions = affinityArray
      .filter(([, affinity]) => affinity <= 0.3)
      .map(([moodId]) => moodId)
      .slice(-3); // Bottom 3
    
    return { dominantEmotions, conflictingEmotions };
  }

  /**
   * Define optimal mood range for a pattern
   */
  private defineOptimalMoodRange(dimensions: EmotionalDimensions): PatternEmotionalCharacteristics['optimalMoodRange'] {
    const tolerance = 25; // How much variation from the pattern's dimensions is acceptable
    
    return {
      energy: [
        Math.max(0, dimensions.energy - tolerance),
        Math.min(100, dimensions.energy + tolerance)
      ],
      valence: [
        Math.max(0, dimensions.valence - tolerance),
        Math.min(100, dimensions.valence + tolerance)
      ],
      intensity: [
        Math.max(0, dimensions.intensity - tolerance),
        Math.min(100, dimensions.intensity + tolerance)
      ]
    };
  }

  /**
   * Analyze contextual factors for a pattern
   */
  private analyzeContextualFactors(pattern: PatternDefinition): PatternEmotionalCharacteristics['contextualFactors'] {
    // This could be enhanced with more sophisticated analysis
    // For now, use basic heuristics based on pattern characteristics
    
    const timeOfDay: string[] = [];
    const seasons: string[] = [];
    const situations: string[] = [];
    const genres = pattern.genres || [];

    // Basic time associations based on category
    if (pattern.category === 'atmospheric' || pattern.subcategory === 'abstract') {
      timeOfDay.push('night', 'twilight');
    }
    if (pattern.category === 'positive' || pattern.subcategory === 'quality') {
      timeOfDay.push('morning', 'day');
    }

    // Basic seasonal associations
    if (pattern.category === 'temporal' || pattern.subcategory === 'nostalgic') {
      seasons.push('autumn');
    }
    if (pattern.category === 'positive') {
      seasons.push('spring', 'summer');
    }

    // Situation analysis based on emotional tendencies
    if (pattern.category === 'narrative' || pattern.subcategory === 'action') {
      situations.push('performance', 'storytelling');
    }
    if (pattern.category === 'atmospheric') {
      situations.push('ambient', 'contemplative');
    }

    return { timeOfDay, seasons, situations, genres };
  }

  /**
   * Calculate dimensional alignment between pattern and mood
   */
  private calculateDimensionAlignment(
    patternDimensions: EmotionalDimensions,
    moodDimensions: EmotionalDimensions
  ): PatternEmotionalScore['dimensionScores'] {
    const calculateScore = (patternVal: number, moodVal: number): number => {
      const distance = Math.abs(patternVal - moodVal);
      return Math.max(0, 1 - (distance / 100)); // Convert to 0-1 scale
    };

    return {
      energy: calculateScore(patternDimensions.energy, moodDimensions.energy),
      valence: calculateScore(patternDimensions.valence, moodDimensions.valence),
      complexity: calculateScore(patternDimensions.complexity, moodDimensions.complexity),
      intensity: calculateScore(patternDimensions.intensity, moodDimensions.intensity),
      darkness: calculateScore(patternDimensions.darkness, moodDimensions.darkness),
      mystery: calculateScore(patternDimensions.mystery, moodDimensions.mystery)
    };
  }

  /**
   * Calculate reasoning factors for pattern-mood fit
   */
  private calculateReasoningFactors(pattern: PatternDefinition, moodProfile: MoodProfile): PatternEmotionalScore['reasoningFactors'] {
    // Structural alignment: How well the pattern structure fits the mood
    const structuralAlignment = this.calculateStructuralAlignment(pattern, moodProfile);
    
    // Vocabulary fit: How appropriate the pattern's vocabulary style is for the mood
    const vocabularyFit = this.calculateVocabularyFit(pattern, moodProfile);
    
    // Cultural resonance: How well the pattern resonates with the mood's cultural associations
    const culturalResonance = this.calculateCulturalResonance(pattern, moodProfile);
    
    // Semantic harmony: How semantically coherent the pattern is with the mood
    const semanticHarmony = this.calculateSemanticHarmony(pattern, moodProfile);

    return {
      structuralAlignment,
      vocabularyFit,
      culturalResonance,
      semanticHarmony
    };
  }

  /**
   * Calculate structural alignment
   */
  private calculateStructuralAlignment(pattern: PatternDefinition, moodProfile: MoodProfile): number {
    let score = 0.5; // Base score

    // Word count alignment with mood complexity
    const complexityAlignment = 1 - Math.abs(moodProfile.dimensions.complexity - (pattern.maxWordCount * 25)) / 100;
    score += complexityAlignment * 0.3;

    // Template structure appropriateness
    if (moodProfile.dimensions.mystery > 70 && pattern.template.includes('{concept}')) {
      score += 0.2; // Abstract concepts work well for mysterious moods
    }
    if (moodProfile.dimensions.energy > 70 && pattern.template.includes('{action}')) {
      score += 0.2; // Action patterns work well for energetic moods
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Calculate vocabulary fit
   */
  private calculateVocabularyFit(pattern: PatternDefinition, moodProfile: MoodProfile): number {
    let score = 0.5; // Base score

    // Check if pattern category aligns with mood preferences
    if (moodProfile.patternPreferences.includes(pattern.category)) {
      score += 0.3;
    }
    if (moodProfile.patternPreferences.includes(pattern.subcategory)) {
      score += 0.2;
    }

    // Word characteristic alignment
    const wordCharacteristics = moodProfile.wordCharacteristics;
    if (wordCharacteristics) {
      // Check syllable preference alignment (this is a simplification)
      const patternComplexity = pattern.maxWordCount;
      const preferredComplexity = wordCharacteristics.preferredSyllables[0] || 2;
      const syllableAlignment = 1 - Math.abs(patternComplexity - preferredComplexity) / 3;
      score += syllableAlignment * 0.2;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Calculate cultural resonance
   */
  private calculateCulturalResonance(pattern: PatternDefinition, moodProfile: MoodProfile): number {
    let score = 0.5; // Base score

    // Genre compatibility
    if (pattern.genres && pattern.genres.length > 0) {
      let maxCompatibility = 0;
      for (const genre of pattern.genres) {
        const compatibility = moodProfile.genreAffinity[genre] || 0;
        maxCompatibility = Math.max(maxCompatibility, compatibility);
      }
      score += maxCompatibility * 0.4;
    }

    // Time/season associations (simplified check)
    if (moodProfile.seasonAssociations.length > 0) {
      // This could be enhanced with more sophisticated cultural analysis
      score += 0.1; // Small bonus for patterns that could work with seasonal moods
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Calculate semantic harmony
   */
  private calculateSemanticHarmony(pattern: PatternDefinition, moodProfile: MoodProfile): number {
    let score = 0.5; // Base score

    // Keyword alignment (simplified)
    const patternDescription = pattern.description.toLowerCase();
    let keywordMatches = 0;
    
    for (const keyword of moodProfile.keywords) {
      if (patternDescription.includes(keyword.toLowerCase())) {
        keywordMatches++;
      }
    }
    
    if (moodProfile.keywords.length > 0) {
      score += (keywordMatches / moodProfile.keywords.length) * 0.3;
    }

    // Opposite mood penalty
    for (const opposite of moodProfile.opposites) {
      const oppositeProfile = moodClassificationSystem.getMoodProfile(opposite);
      if (oppositeProfile) {
        for (const oppositeKeyword of oppositeProfile.keywords) {
          if (patternDescription.includes(oppositeKeyword.toLowerCase())) {
            score -= 0.1; // Penalty for conflicting emotions
          }
        }
      }
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Calculate overall score from dimension scores and reasoning factors
   */
  private calculateOverallScore(
    dimensionScores: PatternEmotionalScore['dimensionScores'],
    reasoningFactors: PatternEmotionalScore['reasoningFactors']
  ): number {
    // Calculate weighted average of dimension scores
    const dimensionAverage = (
      dimensionScores.energy +
      dimensionScores.valence +
      dimensionScores.complexity +
      dimensionScores.intensity +
      dimensionScores.darkness +
      dimensionScores.mystery
    ) / 6;

    // Calculate weighted average of reasoning factors
    const reasoningAverage = (
      reasoningFactors.structuralAlignment * this.scoringWeights.structuralAlignment +
      reasoningFactors.vocabularyFit * this.scoringWeights.vocabularyFit +
      reasoningFactors.culturalResonance * this.scoringWeights.culturalResonance +
      reasoningFactors.semanticHarmony * this.scoringWeights.semanticHarmony
    );

    // Combine dimensional and reasoning scores
    return (dimensionAverage * 0.6) + (reasoningAverage * 0.4);
  }

  /**
   * Calculate confidence in the score
   */
  private calculateConfidence(overallScore: number, reasoningFactors: PatternEmotionalScore['reasoningFactors']): number {
    // Higher confidence for more extreme scores (very good or very bad fits)
    const scoreConfidence = Math.abs(overallScore - 0.5) * 2;
    
    // Higher confidence when all reasoning factors agree
    const factorValues = Object.values(reasoningFactors);
    const factorMean = factorValues.reduce((sum, val) => sum + val, 0) / factorValues.length;
    const factorVariance = factorValues.reduce((sum, val) => sum + Math.pow(val - factorMean, 2), 0) / factorValues.length;
    const factorConfidence = 1 - Math.sqrt(factorVariance); // Lower variance = higher confidence

    return (scoreConfidence + factorConfidence) / 2;
  }

  /**
   * Generate human-readable explanation for the score
   */
  private generateScoreExplanation(
    pattern: PatternDefinition,
    moodProfile: MoodProfile,
    overallScore: number,
    reasoningFactors: PatternEmotionalScore['reasoningFactors']
  ): string {
    const scoreLevel = overallScore >= 0.8 ? 'excellent' : 
                     overallScore >= 0.6 ? 'good' : 
                     overallScore >= 0.4 ? 'moderate' : 'poor';

    const bestFactor = Object.entries(reasoningFactors)
      .sort((a, b) => b[1] - a[1])[0];
    
    const worstFactor = Object.entries(reasoningFactors)
      .sort((a, b) => a[1] - b[1])[0];

    return `${scoreLevel.charAt(0).toUpperCase() + scoreLevel.slice(1)} fit for ${moodProfile.name} mood. ` +
           `Strongest alignment: ${bestFactor[0]} (${(bestFactor[1] * 100).toFixed(0)}%). ` +
           `Potential concern: ${worstFactor[0]} (${(worstFactor[1] * 100).toFixed(0)}%).`;
  }

  /**
   * Merge emotional dimensions
   */
  private mergeDimensions(base: EmotionalDimensions, modifier: Partial<EmotionalDimensions>): EmotionalDimensions {
    const result = { ...base };
    
    for (const [key, value] of Object.entries(modifier)) {
      if (typeof value === 'number') {
        result[key as keyof EmotionalDimensions] += value;
      }
    }
    
    return result;
  }

  /**
   * Calculate dimensional similarity between two emotional profiles
   */
  private calculateDimensionalSimilarity(dims1: EmotionalDimensions, dims2: EmotionalDimensions): number {
    const dimensionKeys = Object.keys(dims1) as (keyof EmotionalDimensions)[];
    let totalDistance = 0;

    for (const key of dimensionKeys) {
      const distance = Math.abs(dims1[key] - dims2[key]);
      totalDistance += distance;
    }

    // Normalize to 0-1 scale (lower distance = higher similarity)
    const maxDistance = dimensionKeys.length * 100;
    return 1 - (totalDistance / maxDistance);
  }

  /**
   * Clear caches (useful for testing or memory management)
   */
  clearCaches(): void {
    this.patternCharacteristics.clear();
    this.moodCollections.clear();
  }
}

// Export singleton instance
export const patternMoodMapper = new PatternMoodMapper();