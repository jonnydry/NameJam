/**
 * Contextual Mood Selector - Intelligent mood-based pattern selection
 * Analyzes generation context for emotional cues and selects patterns that align with desired mood
 */

import { PatternDefinition } from './advancedPatternLibrary';
import { 
  moodClassificationSystem, 
  MoodProfile, 
  EmotionalDimensions,
  ComplexMood 
} from './moodClassificationSystem';
import { 
  patternMoodMapper, 
  PatternEmotionalScore,
  MoodPatternCollection 
} from './patternMoodMapper';
import { PatternSelectionCriteria } from './patternSelectionEngine';
import { EnhancedWordSource } from './types';
import { secureLog } from '../../utils/secureLogger';

// Context analysis input
export interface GenerationContext {
  // Explicit mood specifications
  primaryMood?: string;
  secondaryMoods?: string[];
  moodIntensity?: number; // 0-100
  
  // Musical context
  genre?: string;
  tempo?: 'slow' | 'medium' | 'fast';
  key?: 'major' | 'minor' | 'modal';
  instrumentType?: 'acoustic' | 'electronic' | 'mixed';
  
  // Temporal context
  timeOfDay?: 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night' | 'midnight';
  season?: 'spring' | 'summer' | 'autumn' | 'winter';
  era?: 'vintage' | 'modern' | 'futuristic';
  
  // Situational context
  venue?: 'intimate' | 'large' | 'outdoor' | 'studio' | 'digital';
  audience?: 'mainstream' | 'niche' | 'underground' | 'commercial';
  purpose?: 'performance' | 'recording' | 'ambient' | 'dance' | 'contemplative';
  
  // Thematic context
  themes?: string[];
  keywords?: string[];
  avoidKeywords?: string[];
  culturalContext?: string;
  
  // Technical constraints
  wordCount?: number;
  maxSyllables?: number;
  preferredLanguageStyle?: 'simple' | 'complex' | 'poetic' | 'modern';
  
  // User preferences
  creativityLevel?: 'conservative' | 'balanced' | 'experimental';
  emotionalDirection?: 'uplifting' | 'neutral' | 'introspective';
  energyLevel?: 'calm' | 'moderate' | 'high';
}

// Contextual analysis result
export interface ContextualAnalysis {
  detectedMoods: string[];
  moodConfidences: Map<string, number>;
  emotionalDimensions: EmotionalDimensions;
  contextualFactors: {
    temporal: string[];
    situational: string[];
    cultural: string[];
    musical: string[];
  };
  emotionalIntensity: number;
  complexity: number;
  recommendations: {
    primaryPatterns: string[];
    fallbackPatterns: string[];
    avoidPatterns: string[];
  };
  reasoning: string[];
}

// Pattern selection result with emotional context
export interface MoodDrivenSelection {
  selectedPattern: PatternDefinition;
  moodAlignment: PatternEmotionalScore;
  contextualFit: number;
  emotionalJustification: string;
  alternativePatterns: PatternDefinition[];
  moodModifiers: string[];
  atmosphericCoherence: number;
}

export class ContextualMoodSelector {
  // Context analysis weights
  private readonly contextWeights = {
    explicitMood: 0.4,      // Direct mood specification
    implicitCues: 0.25,     // Inferred from other context
    musicalContext: 0.15,   // Genre, tempo, key, etc.
    temporalContext: 0.1,   // Time, season, era
    situationalContext: 0.1 // Venue, audience, purpose
  };

  // Mood inference rules for implicit context
  private readonly moodInferenceRules = new Map([
    // Musical context rules
    ['genre_classical', { moods: ['peaceful', 'romantic', 'nostalgic'], confidence: 0.7 }],
    ['genre_electronic', { moods: ['energetic', 'mysterious', 'dark'], confidence: 0.6 }],
    ['genre_folk', { moods: ['nostalgic', 'peaceful', 'romantic'], confidence: 0.8 }],
    ['genre_metal', { moods: ['aggressive', 'dark', 'energetic'], confidence: 0.9 }],
    ['genre_jazz', { moods: ['sophisticated', 'romantic', 'melancholic'], confidence: 0.7 }],
    ['genre_ambient', { moods: ['peaceful', 'mysterious', 'contemplative'], confidence: 0.8 }],
    
    // Tempo rules
    ['tempo_slow', { moods: ['peaceful', 'melancholic', 'romantic'], confidence: 0.6 }],
    ['tempo_fast', { moods: ['energetic', 'aggressive', 'euphoric'], confidence: 0.7 }],
    
    // Key rules
    ['key_major', { moods: ['uplifting', 'euphoric', 'peaceful'], confidence: 0.5 }],
    ['key_minor', { moods: ['melancholic', 'dark', 'mysterious'], confidence: 0.6 }],
    
    // Temporal rules
    ['time_dawn', { moods: ['peaceful', 'uplifting', 'contemplative'], confidence: 0.7 }],
    ['time_night', { moods: ['mysterious', 'dark', 'romantic'], confidence: 0.6 }],
    ['time_midnight', { moods: ['dark', 'mysterious', 'melancholic'], confidence: 0.8 }],
    
    // Seasonal rules
    ['season_spring', { moods: ['uplifting', 'romantic', 'energetic'], confidence: 0.6 }],
    ['season_autumn', { moods: ['nostalgic', 'melancholic', 'contemplative'], confidence: 0.7 }],
    ['season_winter', { moods: ['melancholic', 'peaceful', 'dark'], confidence: 0.6 }],
    ['season_summer', { moods: ['energetic', 'euphoric', 'uplifting'], confidence: 0.7 }],
    
    // Venue rules
    ['venue_intimate', { moods: ['romantic', 'peaceful', 'contemplative'], confidence: 0.6 }],
    ['venue_large', { moods: ['energetic', 'euphoric', 'aggressive'], confidence: 0.5 }],
    ['venue_outdoor', { moods: ['uplifting', 'energetic', 'peaceful'], confidence: 0.5 }],
    
    // Purpose rules
    ['purpose_dance', { moods: ['energetic', 'euphoric', 'uplifting'], confidence: 0.8 }],
    ['purpose_contemplative', { moods: ['peaceful', 'melancholic', 'mysterious'], confidence: 0.8 }],
    ['purpose_ambient', { moods: ['peaceful', 'mysterious', 'contemplative'], confidence: 0.9 }]
  ]);

  // Keyword to mood associations
  private readonly keywordMoodAssociations = new Map([
    ['love', ['romantic', 'uplifting', 'peaceful']],
    ['night', ['dark', 'mysterious', 'romantic']],
    ['storm', ['aggressive', 'dark', 'energetic']],
    ['dream', ['peaceful', 'mysterious', 'romantic']],
    ['fire', ['aggressive', 'energetic', 'passionate']],
    ['water', ['peaceful', 'melancholic', 'contemplative']],
    ['light', ['uplifting', 'euphoric', 'peaceful']],
    ['shadow', ['dark', 'mysterious', 'melancholic']],
    ['dance', ['energetic', 'euphoric', 'uplifting']],
    ['memory', ['nostalgic', 'melancholic', 'contemplative']],
    ['future', ['mysterious', 'uplifting', 'energetic']],
    ['silence', ['peaceful', 'contemplative', 'mysterious']],
    ['thunder', ['aggressive', 'energetic', 'dark']],
    ['garden', ['peaceful', 'romantic', 'uplifting']],
    ['city', ['energetic', 'dark', 'aggressive']],
    ['mountain', ['peaceful', 'uplifting', 'contemplative']],
    ['ocean', ['peaceful', 'mysterious', 'melancholic']],
    ['forest', ['peaceful', 'mysterious', 'contemplative']],
    ['star', ['mysterious', 'romantic', 'uplifting']],
    ['moon', ['romantic', 'mysterious', 'peaceful']]
  ]);

  /**
   * Analyze generation context to determine emotional characteristics
   */
  analyzeContext(context: GenerationContext): ContextualAnalysis {
    secureLog.debug('Analyzing generation context for mood selection', { context });

    // Detect moods from explicit and implicit cues
    const { detectedMoods, moodConfidences } = this.detectMoods(context);
    
    // Calculate composite emotional dimensions
    const emotionalDimensions = this.calculateContextualDimensions(detectedMoods, moodConfidences, context);
    
    // Extract contextual factors
    const contextualFactors = this.extractContextualFactors(context);
    
    // Determine emotional intensity and complexity
    const emotionalIntensity = this.calculateEmotionalIntensity(context, emotionalDimensions);
    const complexity = this.calculateComplexity(context, emotionalDimensions);
    
    // Generate pattern recommendations
    const recommendations = this.generatePatternRecommendations(detectedMoods, emotionalDimensions, context);
    
    // Create reasoning explanation
    const reasoning = this.generateReasoning(detectedMoods, moodConfidences, contextualFactors, context);

    return {
      detectedMoods,
      moodConfidences,
      emotionalDimensions,
      contextualFactors,
      emotionalIntensity,
      complexity,
      recommendations,
      reasoning
    };
  }

  /**
   * Select patterns based on mood-driven analysis
   */
  selectMoodDrivenPattern(
    context: GenerationContext,
    availablePatterns: PatternDefinition[],
    sources: EnhancedWordSource
  ): MoodDrivenSelection | null {
    const analysis = this.analyzeContext(context);
    
    if (analysis.detectedMoods.length === 0) {
      secureLog.warn('No moods detected from context, falling back to default selection');
      return null;
    }

    // Get pattern collections for detected moods
    const patternCollections = this.getRelevantPatternCollections(analysis.detectedMoods, availablePatterns);
    
    // Score and rank patterns
    const scoredPatterns = this.scorePatterns(
      availablePatterns,
      analysis.detectedMoods,
      analysis.emotionalDimensions,
      context
    );

    if (scoredPatterns.length === 0) {
      return null;
    }

    // Select best pattern with contextual considerations
    const selectedPattern = this.selectBestPattern(scoredPatterns, analysis, context);
    
    if (!selectedPattern) {
      return null;
    }

    // Calculate additional metrics
    const contextualFit = this.calculateContextualFit(selectedPattern.pattern, analysis, context);
    const atmosphericCoherence = this.calculateAtmosphericCoherence(selectedPattern.pattern, analysis);
    
    // Generate alternatives
    const alternativePatterns = scoredPatterns
      .slice(1, 4) // Top 3 alternatives
      .map(sp => sp.pattern);

    // Determine mood modifiers
    const moodModifiers = this.determineMoodModifiers(analysis, context);

    return {
      selectedPattern: selectedPattern.pattern,
      moodAlignment: selectedPattern.moodScore,
      contextualFit,
      emotionalJustification: this.generateEmotionalJustification(selectedPattern, analysis),
      alternativePatterns,
      moodModifiers,
      atmosphericCoherence
    };
  }

  /**
   * Select multiple patterns with mood diversity
   */
  selectMoodDrivenPatterns(
    context: GenerationContext,
    availablePatterns: PatternDefinition[],
    sources: EnhancedWordSource,
    count: number
  ): MoodDrivenSelection[] {
    const analysis = this.analyzeContext(context);
    const selections: MoodDrivenSelection[] = [];
    const usedPatterns = new Set<string>();

    for (let i = 0; i < count; i++) {
      // Filter out already used patterns
      const remainingPatterns = availablePatterns.filter(p => !usedPatterns.has(p.id));
      
      if (remainingPatterns.length === 0) break;

      // Adjust context for diversity if this isn't the first selection
      const adjustedContext = i > 0 ? this.adjustContextForDiversity(context, selections) : context;
      
      const selection = this.selectMoodDrivenPattern(adjustedContext, remainingPatterns, sources);
      
      if (selection) {
        selections.push(selection);
        usedPatterns.add(selection.selectedPattern.id);
      }
    }

    return selections;
  }

  /**
   * Detect moods from explicit and implicit context cues
   */
  private detectMoods(context: GenerationContext): { detectedMoods: string[], moodConfidences: Map<string, number> } {
    const moodConfidences = new Map<string, number>();

    // Handle explicit mood specifications
    if (context.primaryMood) {
      const primaryConfidence = (context.moodIntensity || 80) / 100;
      moodConfidences.set(context.primaryMood, primaryConfidence * this.contextWeights.explicitMood);
    }

    if (context.secondaryMoods) {
      for (const mood of context.secondaryMoods) {
        const secondaryConfidence = ((context.moodIntensity || 60) - 20) / 100;
        moodConfidences.set(mood, secondaryConfidence * this.contextWeights.explicitMood * 0.7);
      }
    }

    // Infer moods from musical context
    this.inferMoodsFromMusicalContext(context, moodConfidences);
    
    // Infer moods from temporal context
    this.inferMoodsFromTemporalContext(context, moodConfidences);
    
    // Infer moods from situational context
    this.inferMoodsFromSituationalContext(context, moodConfidences);
    
    // Infer moods from keywords
    this.inferMoodsFromKeywords(context, moodConfidences);

    // Filter and sort detected moods
    const detectedMoods = Array.from(moodConfidences.entries())
      .filter(([mood, confidence]) => confidence >= 0.1) // Minimum confidence threshold
      .sort((a, b) => b[1] - a[1]) // Sort by confidence
      .map(([mood]) => mood);

    return { detectedMoods, moodConfidences };
  }

  /**
   * Infer moods from musical context
   */
  private inferMoodsFromMusicalContext(context: GenerationContext, moodConfidences: Map<string, number>): void {
    const weight = this.contextWeights.musicalContext;

    if (context.genre) {
      const rule = this.moodInferenceRules.get(`genre_${context.genre}`);
      if (rule) {
        for (const mood of rule.moods) {
          const confidence = (moodConfidences.get(mood) || 0) + (rule.confidence * weight);
          moodConfidences.set(mood, confidence);
        }
      }
    }

    if (context.tempo) {
      const rule = this.moodInferenceRules.get(`tempo_${context.tempo}`);
      if (rule) {
        for (const mood of rule.moods) {
          const confidence = (moodConfidences.get(mood) || 0) + (rule.confidence * weight);
          moodConfidences.set(mood, confidence);
        }
      }
    }

    if (context.key) {
      const rule = this.moodInferenceRules.get(`key_${context.key}`);
      if (rule) {
        for (const mood of rule.moods) {
          const confidence = (moodConfidences.get(mood) || 0) + (rule.confidence * weight * 0.7);
          moodConfidences.set(mood, confidence);
        }
      }
    }
  }

  /**
   * Infer moods from temporal context
   */
  private inferMoodsFromTemporalContext(context: GenerationContext, moodConfidences: Map<string, number>): void {
    const weight = this.contextWeights.temporalContext;

    if (context.timeOfDay) {
      const rule = this.moodInferenceRules.get(`time_${context.timeOfDay}`);
      if (rule) {
        for (const mood of rule.moods) {
          const confidence = (moodConfidences.get(mood) || 0) + (rule.confidence * weight);
          moodConfidences.set(mood, confidence);
        }
      }
    }

    if (context.season) {
      const rule = this.moodInferenceRules.get(`season_${context.season}`);
      if (rule) {
        for (const mood of rule.moods) {
          const confidence = (moodConfidences.get(mood) || 0) + (rule.confidence * weight);
          moodConfidences.set(mood, confidence);
        }
      }
    }
  }

  /**
   * Infer moods from situational context
   */
  private inferMoodsFromSituationalContext(context: GenerationContext, moodConfidences: Map<string, number>): void {
    const weight = this.contextWeights.situationalContext;

    if (context.venue) {
      const rule = this.moodInferenceRules.get(`venue_${context.venue}`);
      if (rule) {
        for (const mood of rule.moods) {
          const confidence = (moodConfidences.get(mood) || 0) + (rule.confidence * weight);
          moodConfidences.set(mood, confidence);
        }
      }
    }

    if (context.purpose) {
      const rule = this.moodInferenceRules.get(`purpose_${context.purpose}`);
      if (rule) {
        for (const mood of rule.moods) {
          const confidence = (moodConfidences.get(mood) || 0) + (rule.confidence * weight);
          moodConfidences.set(mood, confidence);
        }
      }
    }
  }

  /**
   * Infer moods from keywords and themes
   */
  private inferMoodsFromKeywords(context: GenerationContext, moodConfidences: Map<string, number>): void {
    const weight = this.contextWeights.implicitCues;
    const keywords = [...(context.keywords || []), ...(context.themes || [])];

    for (const keyword of keywords) {
      const associatedMoods = this.keywordMoodAssociations.get(keyword.toLowerCase());
      if (associatedMoods) {
        for (const mood of associatedMoods) {
          const confidence = (moodConfidences.get(mood) || 0) + (0.6 * weight);
          moodConfidences.set(mood, confidence);
        }
      }
    }

    // Negative keywords (avoid certain moods)
    if (context.avoidKeywords) {
      for (const avoidKeyword of context.avoidKeywords) {
        const associatedMoods = this.keywordMoodAssociations.get(avoidKeyword.toLowerCase());
        if (associatedMoods) {
          for (const mood of associatedMoods) {
            const currentConfidence = moodConfidences.get(mood) || 0;
            moodConfidences.set(mood, Math.max(0, currentConfidence - 0.3));
          }
        }
      }
    }
  }

  /**
   * Calculate contextual emotional dimensions
   */
  private calculateContextualDimensions(
    detectedMoods: string[], 
    moodConfidences: Map<string, number>, 
    context: GenerationContext
  ): EmotionalDimensions {
    if (detectedMoods.length === 0) {
      return { energy: 50, valence: 50, complexity: 50, intensity: 50, darkness: 50, mystery: 50 };
    }

    // Blend mood dimensions based on confidence weights
    const moodWeights = detectedMoods.map(mood => moodConfidences.get(mood) || 0);
    const normalizedWeights = this.normalizeWeights(moodWeights);
    
    const blendedDimensions = moodClassificationSystem.blendMoods(detectedMoods, normalizedWeights);

    // Apply contextual adjustments
    this.applyContextualAdjustments(blendedDimensions, context);

    return blendedDimensions;
  }

  /**
   * Apply contextual adjustments to emotional dimensions
   */
  private applyContextualAdjustments(dimensions: EmotionalDimensions, context: GenerationContext): void {
    // Energy level adjustments
    if (context.energyLevel === 'high') {
      dimensions.energy = Math.min(100, dimensions.energy + 20);
      dimensions.intensity = Math.min(100, dimensions.intensity + 15);
    } else if (context.energyLevel === 'calm') {
      dimensions.energy = Math.max(0, dimensions.energy - 20);
      dimensions.intensity = Math.max(0, dimensions.intensity - 10);
    }

    // Emotional direction adjustments
    if (context.emotionalDirection === 'uplifting') {
      dimensions.valence = Math.min(100, dimensions.valence + 20);
      dimensions.darkness = Math.max(0, dimensions.darkness - 15);
    } else if (context.emotionalDirection === 'introspective') {
      dimensions.complexity = Math.min(100, dimensions.complexity + 15);
      dimensions.mystery = Math.min(100, dimensions.mystery + 10);
    }

    // Creativity level adjustments
    if (context.creativityLevel === 'experimental') {
      dimensions.complexity = Math.min(100, dimensions.complexity + 25);
      dimensions.mystery = Math.min(100, dimensions.mystery + 20);
    } else if (context.creativityLevel === 'conservative') {
      dimensions.complexity = Math.max(0, dimensions.complexity - 15);
      dimensions.mystery = Math.max(0, dimensions.mystery - 10);
    }

    // Era adjustments
    if (context.era === 'vintage') {
      dimensions.complexity = Math.min(100, dimensions.complexity + 10);
      dimensions.mystery = Math.min(100, dimensions.mystery + 15);
    } else if (context.era === 'futuristic') {
      dimensions.mystery = Math.min(100, dimensions.mystery + 20);
      dimensions.complexity = Math.min(100, dimensions.complexity + 15);
    }
  }

  /**
   * Extract contextual factors for analysis
   */
  private extractContextualFactors(context: GenerationContext): ContextualAnalysis['contextualFactors'] {
    return {
      temporal: [
        ...(context.timeOfDay ? [context.timeOfDay] : []),
        ...(context.season ? [context.season] : []),
        ...(context.era ? [context.era] : [])
      ],
      situational: [
        ...(context.venue ? [context.venue] : []),
        ...(context.audience ? [context.audience] : []),
        ...(context.purpose ? [context.purpose] : [])
      ],
      cultural: [
        ...(context.culturalContext ? [context.culturalContext] : []),
        ...(context.themes || [])
      ],
      musical: [
        ...(context.genre ? [context.genre] : []),
        ...(context.tempo ? [context.tempo] : []),
        ...(context.key ? [context.key] : []),
        ...(context.instrumentType ? [context.instrumentType] : [])
      ]
    };
  }

  /**
   * Calculate emotional intensity from context
   */
  private calculateEmotionalIntensity(context: GenerationContext, dimensions: EmotionalDimensions): number {
    let intensity = dimensions.intensity;

    // Apply context-specific intensity modifiers
    if (context.moodIntensity !== undefined) {
      intensity = (intensity + context.moodIntensity) / 2; // Blend with explicit intensity
    }

    if (context.venue === 'large') {
      intensity = Math.min(100, intensity + 15);
    } else if (context.venue === 'intimate') {
      intensity = Math.max(0, intensity - 10);
    }

    if (context.purpose === 'dance') {
      intensity = Math.min(100, intensity + 20);
    } else if (context.purpose === 'ambient') {
      intensity = Math.max(0, intensity - 20);
    }

    return Math.max(0, Math.min(100, intensity));
  }

  /**
   * Calculate complexity from context and dimensions
   */
  private calculateComplexity(context: GenerationContext, dimensions: EmotionalDimensions): number {
    let complexity = dimensions.complexity;

    // Language style adjustments
    if (context.preferredLanguageStyle === 'complex' || context.preferredLanguageStyle === 'poetic') {
      complexity = Math.min(100, complexity + 20);
    } else if (context.preferredLanguageStyle === 'simple') {
      complexity = Math.max(0, complexity - 20);
    }

    // Genre-specific adjustments
    const genreComplexityModifiers: Record<string, number> = {
      'classical': 15,
      'jazz': 10,
      'experimental': 25,
      'progressive': 20,
      'pop': -10,
      'folk': -5
    };

    if (context.genre && genreComplexityModifiers[context.genre]) {
      complexity = Math.min(100, complexity + genreComplexityModifiers[context.genre]);
    }

    return Math.max(0, Math.min(100, complexity));
  }

  /**
   * Generate pattern recommendations based on mood analysis
   */
  private generatePatternRecommendations(
    detectedMoods: string[], 
    dimensions: EmotionalDimensions, 
    context: GenerationContext
  ): ContextualAnalysis['recommendations'] {
    const primaryPatterns: string[] = [];
    const fallbackPatterns: string[] = [];
    const avoidPatterns: string[] = [];

    // Get pattern preferences from detected moods
    for (const mood of detectedMoods.slice(0, 3)) { // Use top 3 moods
      const moodProfile = moodClassificationSystem.getMoodProfile(mood);
      if (moodProfile) {
        primaryPatterns.push(...moodProfile.patternPreferences);
      }
    }

    // Add pattern recommendations based on emotional dimensions
    if (dimensions.energy > 70) {
      primaryPatterns.push('action_object', 'dynamic_adjective_noun');
    }
    if (dimensions.mystery > 70) {
      primaryPatterns.push('abstract_concept', 'symbolic_imagery');
    }
    if (dimensions.complexity > 70) {
      primaryPatterns.push('philosophical_statement', 'compound_creation');
    }

    // Generate fallback patterns for edge cases
    fallbackPatterns.push('emotional_journey', 'sensory_experience', 'temporal_concept');

    // Identify patterns to avoid based on conflicting moods
    for (const mood of detectedMoods) {
      const moodProfile = moodClassificationSystem.getMoodProfile(mood);
      if (moodProfile) {
        for (const oppositeMood of moodProfile.opposites) {
          const oppositeProfile = moodClassificationSystem.getMoodProfile(oppositeMood);
          if (oppositeProfile) {
            avoidPatterns.push(...oppositeProfile.patternPreferences);
          }
        }
      }
    }

    return {
      primaryPatterns: [...new Set(primaryPatterns)], // Remove duplicates
      fallbackPatterns: [...new Set(fallbackPatterns)],
      avoidPatterns: [...new Set(avoidPatterns)]
    };
  }

  /**
   * Generate reasoning explanation for the analysis
   */
  private generateReasoning(
    detectedMoods: string[], 
    moodConfidences: Map<string, number>, 
    contextualFactors: ContextualAnalysis['contextualFactors'],
    context: GenerationContext
  ): string[] {
    const reasoning: string[] = [];

    // Mood detection reasoning
    if (context.primaryMood) {
      reasoning.push(`Primary mood explicitly specified: ${context.primaryMood}`);
    }

    const topInferredMoods = detectedMoods
      .filter(mood => mood !== context.primaryMood)
      .slice(0, 2);
    
    if (topInferredMoods.length > 0) {
      reasoning.push(`Inferred moods from context: ${topInferredMoods.join(', ')}`);
    }

    // Contextual reasoning
    if (contextualFactors.musical.length > 0) {
      reasoning.push(`Musical context influences: ${contextualFactors.musical.join(', ')}`);
    }

    if (contextualFactors.temporal.length > 0) {
      reasoning.push(`Temporal context influences: ${contextualFactors.temporal.join(', ')}`);
    }

    if (context.keywords && context.keywords.length > 0) {
      reasoning.push(`Keyword influences: ${context.keywords.join(', ')}`);
    }

    return reasoning;
  }

  /**
   * Get relevant pattern collections for detected moods
   */
  private getRelevantPatternCollections(
    detectedMoods: string[], 
    availablePatterns: PatternDefinition[]
  ): Map<string, MoodPatternCollection> {
    const collections = new Map<string, MoodPatternCollection>();

    for (const mood of detectedMoods) {
      try {
        const collection = patternMoodMapper.getMoodPatternCollection(mood, availablePatterns);
        collections.set(mood, collection);
      } catch (error) {
        secureLog.warn(`Failed to get pattern collection for mood: ${mood}`, error);
      }
    }

    return collections;
  }

  /**
   * Score patterns for mood alignment
   */
  private scorePatterns(
    availablePatterns: PatternDefinition[], 
    detectedMoods: string[], 
    dimensions: EmotionalDimensions,
    context: GenerationContext
  ): Array<{ pattern: PatternDefinition, moodScore: PatternEmotionalScore, contextScore: number, totalScore: number }> {
    const scoredPatterns: Array<{ pattern: PatternDefinition, moodScore: PatternEmotionalScore, contextScore: number, totalScore: number }> = [];

    for (const pattern of availablePatterns) {
      let bestMoodScore: PatternEmotionalScore | null = null;
      let maxMoodScore = 0;

      // Find best mood alignment for this pattern
      for (const mood of detectedMoods) {
        try {
          const moodScore = patternMoodMapper.scorePatternForMood(pattern, mood);
          if (moodScore.overallScore > maxMoodScore) {
            maxMoodScore = moodScore.overallScore;
            bestMoodScore = moodScore;
          }
        } catch (error) {
          continue; // Skip invalid mood
        }
      }

      if (bestMoodScore) {
        // Calculate additional contextual score
        const contextScore = this.calculatePatternContextScore(pattern, context);
        const totalScore = (bestMoodScore.overallScore * 0.7) + (contextScore * 0.3);

        scoredPatterns.push({
          pattern,
          moodScore: bestMoodScore,
          contextScore,
          totalScore
        });
      }
    }

    return scoredPatterns.sort((a, b) => b.totalScore - a.totalScore);
  }

  /**
   * Calculate pattern context score
   */
  private calculatePatternContextScore(pattern: PatternDefinition, context: GenerationContext): number {
    let score = 0.5; // Base score

    // Word count alignment
    if (context.wordCount && pattern.minWordCount <= context.wordCount && pattern.maxWordCount >= context.wordCount) {
      score += 0.2;
    }

    // Genre alignment
    if (context.genre && pattern.genres && pattern.genres.includes(context.genre)) {
      score += 0.2;
    }

    // Creativity level alignment
    if (context.creativityLevel) {
      const creativityScores: Record<string, number> = {
        'conservative': pattern.weight < 0.5 ? 0.1 : -0.1,
        'balanced': Math.abs(pattern.weight - 0.5) < 0.2 ? 0.1 : 0,
        'experimental': pattern.weight > 0.7 ? 0.2 : 0
      };
      score += creativityScores[context.creativityLevel] || 0;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Select best pattern from scored patterns
   */
  private selectBestPattern(
    scoredPatterns: Array<{ pattern: PatternDefinition, moodScore: PatternEmotionalScore, contextScore: number, totalScore: number }>,
    analysis: ContextualAnalysis,
    context: GenerationContext
  ): { pattern: PatternDefinition, moodScore: PatternEmotionalScore } | null {
    if (scoredPatterns.length === 0) return null;

    // Apply additional selection criteria
    const topCandidates = scoredPatterns.slice(0, Math.min(5, scoredPatterns.length));
    
    // Add some randomization to avoid predictability while maintaining quality
    const weights = topCandidates.map((candidate, index) => {
      const positionPenalty = index * 0.1;
      return Math.max(0.1, candidate.totalScore - positionPenalty);
    });

    const selectedIndex = this.weightedRandomSelection(weights);
    const selected = topCandidates[selectedIndex];

    return {
      pattern: selected.pattern,
      moodScore: selected.moodScore
    };
  }

  /**
   * Calculate contextual fit score
   */
  private calculateContextualFit(
    pattern: PatternDefinition, 
    analysis: ContextualAnalysis, 
    context: GenerationContext
  ): number {
    let fit = 0.5; // Base fit

    // Check alignment with recommendations
    if (analysis.recommendations.primaryPatterns.includes(pattern.id) ||
        analysis.recommendations.primaryPatterns.includes(pattern.category) ||
        analysis.recommendations.primaryPatterns.includes(pattern.subcategory)) {
      fit += 0.3;
    }

    // Check if pattern should be avoided
    if (analysis.recommendations.avoidPatterns.includes(pattern.id) ||
        analysis.recommendations.avoidPatterns.includes(pattern.category)) {
      fit -= 0.4;
    }

    // Dimensional alignment bonus
    const dimensionAlignment = this.calculateDimensionFit(pattern, analysis.emotionalDimensions);
    fit += dimensionAlignment * 0.2;

    return Math.max(0, Math.min(1, fit));
  }

  /**
   * Calculate atmospheric coherence
   */
  private calculateAtmosphericCoherence(pattern: PatternDefinition, analysis: ContextualAnalysis): number {
    // This measures how well the pattern maintains emotional consistency
    let coherence = 0.5; // Base coherence

    // Check consistency with detected moods
    const patternCharacteristics = patternMoodMapper.analyzePatternEmotionalCharacteristics(pattern);
    
    for (const mood of analysis.detectedMoods.slice(0, 3)) {
      const affinity = patternCharacteristics.moodAffinities.get(mood) || 0;
      coherence += affinity * 0.15;
    }

    // Bonus for high emotional flexibility (can work in multiple contexts)
    coherence += patternCharacteristics.emotionalFlexibility * 0.1;

    return Math.max(0, Math.min(1, coherence));
  }

  /**
   * Generate emotional justification for pattern selection
   */
  private generateEmotionalJustification(
    selection: { pattern: PatternDefinition, moodScore: PatternEmotionalScore },
    analysis: ContextualAnalysis
  ): string {
    const pattern = selection.pattern;
    const score = selection.moodScore;
    
    const primaryMood = analysis.detectedMoods[0];
    const scorePercent = Math.round(score.overallScore * 100);

    return `Selected "${pattern.id}" for ${scorePercent}% alignment with ${primaryMood} mood. ` +
           `${score.explanation} Pattern category "${pattern.category}" complements the ` +
           `${analysis.contextualFactors.musical.join('/')} context effectively.`;
  }

  /**
   * Determine mood modifiers for atmospheric enhancement
   */
  private determineMoodModifiers(analysis: ContextualAnalysis, context: GenerationContext): string[] {
    const modifiers: string[] = [];

    // Temporal modifiers
    if (context.season === 'autumn') modifiers.push('seasonal_autumn');
    if (context.timeOfDay === 'midnight') modifiers.push('midnight_amplifier');
    if (context.era === 'vintage') modifiers.push('vintage_filter');

    // Cultural modifiers
    if (analysis.contextualFactors.cultural.includes('urban') || 
        context.venue === 'large' || 
        context.audience === 'underground') {
      modifiers.push('urban_intensity');
    }

    return modifiers;
  }

  /**
   * Adjust context for diversity in multiple selections
   */
  private adjustContextForDiversity(context: GenerationContext, previousSelections: MoodDrivenSelection[]): GenerationContext {
    const adjustedContext = { ...context };

    // If previous selections were all from similar moods, try to diversify
    const usedMoods = previousSelections.map(s => s.moodAlignment.moodId);
    const moodCounts = usedMoods.reduce((counts, mood) => {
      counts[mood] = (counts[mood] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    // Find overused moods and slightly reduce their influence
    const overusedMoods = Object.entries(moodCounts)
      .filter(([mood, count]) => count > 1)
      .map(([mood]) => mood);

    if (overusedMoods.length > 0) {
      // Add diversity by slightly adjusting emotional direction
      if (!adjustedContext.emotionalDirection || Math.random() < 0.3) {
        const diversityDirections = ['uplifting', 'introspective', 'neutral'];
        adjustedContext.emotionalDirection = diversityDirections[Math.floor(Math.random() * diversityDirections.length)] as any;
      }
    }

    return adjustedContext;
  }

  /**
   * Calculate dimension fit between pattern and target dimensions
   */
  private calculateDimensionFit(pattern: PatternDefinition, targetDimensions: EmotionalDimensions): number {
    const patternCharacteristics = patternMoodMapper.analyzePatternEmotionalCharacteristics(pattern);
    const patternDimensions = patternCharacteristics.inherentDimensions;

    const dimensionKeys = Object.keys(targetDimensions) as (keyof EmotionalDimensions)[];
    let totalFit = 0;

    for (const key of dimensionKeys) {
      const distance = Math.abs(patternDimensions[key] - targetDimensions[key]);
      const fit = Math.max(0, 1 - (distance / 100));
      totalFit += fit;
    }

    return totalFit / dimensionKeys.length;
  }

  /**
   * Normalize weight array to sum to 1
   */
  private normalizeWeights(weights: number[]): number[] {
    const sum = weights.reduce((total, weight) => total + weight, 0);
    return sum > 0 ? weights.map(weight => weight / sum) : weights;
  }

  /**
   * Weighted random selection
   */
  private weightedRandomSelection(weights: number[]): number {
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < weights.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return i;
      }
    }
    
    return weights.length - 1; // Fallback to last index
  }
}

// Export singleton instance
export const contextualMoodSelector = new ContextualMoodSelector();