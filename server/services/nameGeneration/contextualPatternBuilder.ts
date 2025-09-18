/**
 * Contextual Pattern Builder - Dynamic pattern construction and intelligent pattern fusion
 * Creates patterns on-the-fly based on context and combines existing patterns for enhanced variety
 */

import { PatternDefinition, PatternContext, advancedPatternLibrary } from './advancedPatternLibrary';
import { EnhancedWordSource } from './types';
import { patternSelectionEngine, PatternSelectionCriteria } from './patternSelectionEngine';
import { getRandomWord, capitalize, singularize } from './stringUtils';
import { secureLog } from '../../utils/secureLogger';

// Dynamic pattern construction specifications
export interface DynamicPatternSpec {
  id: string;
  structure: string[];
  contextRequirements: string[];
  adaptiveElements: string[];
  fusionCapability: boolean;
  complexityLevel: 'simple' | 'medium' | 'complex';
}

export interface PatternFusionRule {
  name: string;
  sourcePatterns: string[];
  fusionMethod: 'combine' | 'interweave' | 'transform';
  targetWordCount: number;
  compatibility: string[];
}

export interface ContextualTheme {
  name: string;
  keywords: string[];
  associations: string[];
  wordBias: {
    nouns: string[];
    adjectives: string[];
    verbs: string[];
  };
  patternPreferences: string[];
}

export class ContextualPatternBuilder {
  // Dynamic pattern specifications for runtime construction
  private dynamicPatterns: DynamicPatternSpec[] = [
    {
      id: 'adaptive_metaphor',
      structure: ['{metaphor_source}', '{metaphor_bridge}', '{metaphor_target}'],
      contextRequirements: ['theme', 'intensity'],
      adaptiveElements: ['metaphor_source', 'metaphor_target'],
      fusionCapability: true,
      complexityLevel: 'complex'
    },
    {
      id: 'contextual_journey',
      structure: ['{journey_start}', '{journey_action}', '{journey_destination}'],
      contextRequirements: ['mood', 'type'],
      adaptiveElements: ['journey_start', 'journey_destination'],
      fusionCapability: true,
      complexityLevel: 'medium'
    },
    {
      id: 'emotional_landscape',
      structure: ['{emotion_modifier}', '{landscape_type}', '{experience_quality}'],
      contextRequirements: ['mood', 'intensity'],
      adaptiveElements: ['emotion_modifier', 'experience_quality'],
      fusionCapability: false,
      complexityLevel: 'medium'
    },
    {
      id: 'temporal_shift',
      structure: ['{time_reference}', '{transformation_verb}', '{outcome_state}'],
      contextRequirements: ['era', 'theme'],
      adaptiveElements: ['time_reference', 'outcome_state'],
      fusionCapability: true,
      complexityLevel: 'simple'
    },
    {
      id: 'sensory_fusion',
      structure: ['{sense_type}', '{sensory_quality}', '{sensory_object}'],
      contextRequirements: ['intensity', 'mood'],
      adaptiveElements: ['sensory_quality', 'sensory_object'],
      fusionCapability: false,
      complexityLevel: 'simple'
    }
  ];

  // Pattern fusion rules for combining existing patterns
  private fusionRules: PatternFusionRule[] = [
    {
      name: 'abstract_narrative_fusion',
      sourcePatterns: ['abstract_concept', 'narrative_sequence'],
      fusionMethod: 'combine',
      targetWordCount: 3,
      compatibility: ['conceptual', 'narrative']
    },
    {
      name: 'temporal_emotional_weave',
      sourcePatterns: ['temporal_concept', 'emotional_landscape'],
      fusionMethod: 'interweave',
      targetWordCount: 4,
      compatibility: ['temporal', 'emotional']
    },
    {
      name: 'tech_nature_transform',
      sourcePatterns: ['techno_organic', 'sensory_experience'],
      fusionMethod: 'transform',
      targetWordCount: 3,
      compatibility: ['fusion', 'sensory']
    },
    {
      name: 'question_action_combine',
      sourcePatterns: ['question_format', 'action_object'],
      fusionMethod: 'combine',
      targetWordCount: 5,
      compatibility: ['interrogative', 'narrative']
    }
  ];

  // Contextual themes for adaptive pattern generation
  private contextualThemes: ContextualTheme[] = [
    {
      name: 'urban_nightlife',
      keywords: ['city', 'night', 'neon', 'street', 'crowd'],
      associations: ['energy', 'movement', 'lights', 'sounds'],
      wordBias: {
        nouns: ['lights', 'shadows', 'streets', 'crowds', 'beats', 'pulse'],
        adjectives: ['electric', 'vibrant', 'neon', 'urban', 'nocturnal'],
        verbs: ['glow', 'pulse', 'move', 'flow', 'shine', 'dance']
      },
      patternPreferences: ['techno_organic', 'sensory_experience', 'action_object']
    },
    {
      name: 'natural_serenity',
      keywords: ['nature', 'peace', 'calm', 'organic', 'earth'],
      associations: ['tranquility', 'growth', 'harmony', 'balance'],
      wordBias: {
        nouns: ['forest', 'stream', 'mountain', 'meadow', 'breeze', 'dawn'],
        adjectives: ['gentle', 'peaceful', 'natural', 'serene', 'organic'],
        verbs: ['flow', 'grow', 'breathe', 'whisper', 'nurture', 'bloom']
      },
      patternPreferences: ['emotional_landscape', 'temporal_concept', 'sensory_experience']
    },
    {
      name: 'cosmic_exploration',
      keywords: ['space', 'stars', 'infinite', 'cosmic', 'universe'],
      associations: ['vastness', 'mystery', 'exploration', 'wonder'],
      wordBias: {
        nouns: ['stars', 'void', 'cosmos', 'galaxy', 'nebula', 'infinity'],
        adjectives: ['cosmic', 'infinite', 'stellar', 'ethereal', 'mysterious'],
        verbs: ['expand', 'explore', 'transcend', 'drift', 'orbit', 'illuminate']
      },
      patternPreferences: ['abstract_concept', 'philosophical_statement', 'temporal_journey']
    },
    {
      name: 'industrial_power',
      keywords: ['machine', 'steel', 'power', 'engine', 'metal'],
      associations: ['strength', 'precision', 'force', 'construction'],
      wordBias: {
        nouns: ['steel', 'iron', 'machine', 'engine', 'power', 'force'],
        adjectives: ['industrial', 'metallic', 'powerful', 'mechanical', 'raw'],
        verbs: ['forge', 'build', 'drive', 'hammer', 'construct', 'power']
      },
      patternPreferences: ['dynamic_adjective_noun', 'contrasting_elements', 'action_object']
    },
    {
      name: 'romantic_intimacy',
      keywords: ['love', 'heart', 'romantic', 'intimate', 'tender'],
      associations: ['connection', 'emotion', 'warmth', 'closeness'],
      wordBias: {
        nouns: ['heart', 'soul', 'love', 'kiss', 'embrace', 'dream'],
        adjectives: ['tender', 'warm', 'intimate', 'gentle', 'passionate'],
        verbs: ['love', 'embrace', 'caress', 'whisper', 'cherish', 'adore']
      },
      patternPreferences: ['emotional_journey', 'sensory_experience', 'temporal_concept']
    }
  ];

  // Word pools for adaptive element replacement
  private adaptiveWordPools: Record<string, string[]> = {
    metaphor_sources: ['fire', 'water', 'wind', 'earth', 'light', 'shadow', 'storm', 'calm'],
    metaphor_bridges: ['becomes', 'transforms into', 'evolves to', 'flows into', 'merges with'],
    metaphor_targets: ['dreams', 'reality', 'truth', 'freedom', 'power', 'peace', 'chaos', 'order'],
    
    journey_starts: ['from silence', 'from darkness', 'from the edge', 'from below', 'from within'],
    journey_actions: ['rising', 'flowing', 'dancing', 'soaring', 'descending', 'spinning'],
    journey_destinations: ['to light', 'to freedom', 'to glory', 'to peace', 'to truth', 'beyond'],
    
    emotion_modifiers: ['wild', 'gentle', 'fierce', 'tender', 'passionate', 'serene', 'intense'],
    landscape_types: ['mountains', 'valleys', 'oceans', 'deserts', 'forests', 'plains', 'skies'],
    experience_qualities: ['calling', 'singing', 'breathing', 'dreaming', 'awakening', 'dancing'],
    
    time_references: ['yesterday', 'tomorrow', 'forever', 'never', 'always', 'sometimes', 'now'],
    transformation_verbs: ['becomes', 'turns into', 'evolves', 'transforms', 'changes', 'shifts'],
    outcome_states: ['memory', 'legend', 'dream', 'reality', 'truth', 'myth', 'story'],
    
    sense_types: ['taste', 'touch', 'hear', 'see', 'feel', 'sense', 'know', 'breathe'],
    sensory_qualities: ['sweet', 'bitter', 'warm', 'cool', 'soft', 'sharp', 'smooth', 'rough'],
    sensory_objects: ['music', 'silence', 'colors', 'textures', 'rhythms', 'harmonies', 'melodies']
  };

  /**
   * Build a contextual pattern dynamically based on criteria and sources
   */
  buildContextualPattern(
    criteria: PatternSelectionCriteria,
    sources: EnhancedWordSource,
    context?: PatternContext
  ): PatternDefinition | null {
    // Find the most appropriate theme
    const theme = this.selectThemeForContext(criteria, context);
    
    // Select dynamic pattern specification
    const dynamicSpec = this.selectDynamicPattern(criteria, theme);
    if (!dynamicSpec) return null;

    // Build the pattern using the specification
    const builtPattern = this.constructPattern(dynamicSpec, criteria, sources, theme);
    
    if (builtPattern) {
      secureLog.debug(`Built contextual pattern: ${builtPattern.id} for theme: ${theme?.name || 'none'}`);
    }
    
    return builtPattern;
  }

  /**
   * Fuse multiple existing patterns to create new combinations
   */
  fusePatterns(
    pattern1: PatternDefinition,
    pattern2: PatternDefinition,
    criteria: PatternSelectionCriteria,
    sources: EnhancedWordSource
  ): PatternDefinition | null {
    // Find applicable fusion rule
    const fusionRule = this.findCompatibleFusionRule(pattern1, pattern2, criteria.wordCount);
    if (!fusionRule) return null;

    const fusedPattern = this.applyFusionRule(fusionRule, pattern1, pattern2, sources);
    
    if (fusedPattern) {
      secureLog.debug(`Fused patterns: ${pattern1.id} + ${pattern2.id} -> ${fusedPattern.id}`);
    }
    
    return fusedPattern;
  }

  /**
   * Create adaptive variations of existing patterns
   */
  createPatternVariation(
    basePattern: PatternDefinition,
    criteria: PatternSelectionCriteria,
    sources: EnhancedWordSource,
    variationType: 'synonym' | 'structure' | 'theme' | 'intensity'
  ): PatternDefinition | null {
    switch (variationType) {
      case 'synonym':
        return this.createSynonymVariation(basePattern, sources);
      case 'structure':
        return this.createStructuralVariation(basePattern, criteria);
      case 'theme':
        return this.createThematicVariation(basePattern, criteria, sources);
      case 'intensity':
        return this.createIntensityVariation(basePattern, criteria, sources);
      default:
        return null;
    }
  }

  /**
   * Generate patterns that adapt to musical context
   */
  buildMusicContextPattern(
    musicContext: {
      tempo?: 'slow' | 'medium' | 'fast';
      scale?: 'major' | 'minor' | 'modal';
      rhythm?: 'simple' | 'complex' | 'syncopated';
      harmony?: 'consonant' | 'dissonant' | 'chromatic';
    },
    criteria: PatternSelectionCriteria,
    sources: EnhancedWordSource
  ): PatternDefinition | null {
    const musicPattern: PatternDefinition = {
      id: `music_context_${Date.now()}`,
      category: 'musical',
      subcategory: 'adaptive',
      weight: 0.2,
      minWordCount: criteria.wordCount,
      maxWordCount: criteria.wordCount,
      template: this.buildMusicTemplate(musicContext, criteria.wordCount),
      description: 'Music-context adaptive pattern',
      examples: [],
      generate: (sources) => this.generateMusicContextualName(musicContext, sources, criteria.wordCount)
    };

    return musicPattern;
  }

  /**
   * Select the most appropriate theme for the given context
   */
  private selectThemeForContext(
    criteria: PatternSelectionCriteria,
    context?: PatternContext
  ): ContextualTheme | null {
    let bestTheme: ContextualTheme | null = null;
    let bestScore = 0;

    for (const theme of this.contextualThemes) {
      let score = 0;

      // Genre matching
      if (criteria.genre) {
        const genreKeywords = this.getGenreKeywords(criteria.genre);
        const keywordMatches = theme.keywords.filter(k => genreKeywords.includes(k)).length;
        score += keywordMatches * 0.3;
      }

      // Mood matching
      if (criteria.mood) {
        const moodKeywords = this.getMoodKeywords(criteria.mood);
        const moodMatches = theme.associations.filter(a => moodKeywords.includes(a)).length;
        score += moodMatches * 0.25;
      }

      // Intensity matching
      if (criteria.intensity) {
        const intensityScore = this.calculateIntensityMatch(theme, criteria.intensity);
        score += intensityScore * 0.2;
      }

      // Type matching
      if (criteria.type) {
        const typeScore = this.calculateTypeMatch(theme, criteria.type);
        score += typeScore * 0.15;
      }

      // Theme keyword matching
      if (context?.theme) {
        const themeMatches = theme.keywords.filter(k => 
          context.theme!.toLowerCase().includes(k.toLowerCase())
        ).length;
        score += themeMatches * 0.1;
      }

      if (score > bestScore) {
        bestScore = score;
        bestTheme = theme;
      }
    }

    return bestTheme;
  }

  /**
   * Select the most appropriate dynamic pattern specification
   */
  private selectDynamicPattern(
    criteria: PatternSelectionCriteria,
    theme?: ContextualTheme | null
  ): DynamicPatternSpec | null {
    const eligiblePatterns = this.dynamicPatterns.filter(pattern => {
      // Check word count compatibility
      const targetWordCount = pattern.structure.length;
      if (targetWordCount !== criteria.wordCount) return false;

      // Check complexity level
      if (criteria.creativityLevel === 'conservative' && pattern.complexityLevel === 'complex') return false;
      if (criteria.creativityLevel === 'experimental' && pattern.complexityLevel === 'simple') return false;

      return true;
    });

    if (eligiblePatterns.length === 0) return null;

    // Prefer patterns that match the theme
    if (theme) {
      const themeCompatible = eligiblePatterns.filter(pattern =>
        theme.patternPreferences.some(pref => pattern.id.includes(pref.split('_')[0]))
      );
      if (themeCompatible.length > 0) {
        return getRandomWord(themeCompatible) || eligiblePatterns[0];
      }
    }

    return getRandomWord(eligiblePatterns) || null;
  }

  /**
   * Construct a pattern from a dynamic specification
   */
  private constructPattern(
    spec: DynamicPatternSpec,
    criteria: PatternSelectionCriteria,
    sources: EnhancedWordSource,
    theme?: ContextualTheme | null
  ): PatternDefinition {
    const patternId = `dynamic_${spec.id}_${Date.now()}`;
    
    return {
      id: patternId,
      category: 'dynamic',
      subcategory: spec.id,
      weight: 0.15,
      minWordCount: spec.structure.length,
      maxWordCount: spec.structure.length,
      template: spec.structure.join(' '),
      description: `Dynamically constructed ${spec.id} pattern`,
      examples: [],
      generate: (sources) => this.generateFromDynamicSpec(spec, sources, theme)
    };
  }

  /**
   * Generate a name from a dynamic specification
   */
  private generateFromDynamicSpec(
    spec: DynamicPatternSpec,
    sources: EnhancedWordSource,
    theme?: ContextualTheme | null
  ): string {
    const words: string[] = [];

    for (const element of spec.structure) {
      let word = '';

      if (element.startsWith('{') && element.endsWith('}')) {
        const elementType = element.slice(1, -1);
        
        // Check if it's an adaptive element
        if (spec.adaptiveElements.includes(elementType)) {
          word = this.getAdaptiveWord(elementType, theme);
        } else {
          word = this.getContextualWord(elementType, sources, theme);
        }
      } else {
        word = element;
      }

      words.push(capitalize(word));
    }

    return words.join(' ');
  }

  /**
   * Get adaptive word based on type and theme
   */
  private getAdaptiveWord(elementType: string, theme?: ContextualTheme | null): string {
    // Check adaptive word pools first
    if (this.adaptiveWordPools[elementType]) {
      const poolWord = getRandomWord(this.adaptiveWordPools[elementType]);
      if (poolWord) return poolWord;
    }

    // Use theme-specific words if available
    if (theme) {
      const themeWords = this.getThemeSpecificWords(elementType, theme);
      if (themeWords.length > 0) {
        return getRandomWord(themeWords) || 'echo';
      }
    }

    // Fallback to generic words
    return this.getFallbackWord(elementType);
  }

  /**
   * Get contextual word based on element type, sources, and theme
   */
  private getContextualWord(
    elementType: string,
    sources: EnhancedWordSource,
    theme?: ContextualTheme | null
  ): string {
    let wordPool: string[] = [];

    // Build word pool based on element type
    switch (elementType) {
      case 'noun':
        wordPool = [...sources.validNouns];
        if (theme) wordPool = [...wordPool, ...theme.wordBias.nouns];
        break;
      case 'adjective':
        wordPool = [...sources.validAdjectives];
        if (theme) wordPool = [...wordPool, ...theme.wordBias.adjectives];
        break;
      case 'verb':
        wordPool = [...sources.validVerbs];
        if (theme) wordPool = [...wordPool, ...theme.wordBias.verbs];
        break;
      default:
        // Try to extract word type from element name
        if (elementType.includes('noun')) {
          wordPool = sources.validNouns;
        } else if (elementType.includes('adjective') || elementType.includes('modifier')) {
          wordPool = sources.validAdjectives;
        } else if (elementType.includes('verb') || elementType.includes('action')) {
          wordPool = sources.validVerbs;
        } else {
          wordPool = [...sources.validNouns, ...sources.validAdjectives];
        }
    }

    return getRandomWord(wordPool) || 'echo';
  }

  /**
   * Find compatible fusion rule for two patterns
   */
  private findCompatibleFusionRule(
    pattern1: PatternDefinition,
    pattern2: PatternDefinition,
    targetWordCount: number
  ): PatternFusionRule | null {
    return this.fusionRules.find(rule => 
      rule.targetWordCount === targetWordCount &&
      rule.compatibility.some(comp => 
        pattern1.category.includes(comp) || pattern2.category.includes(comp)
      )
    ) || null;
  }

  /**
   * Apply fusion rule to combine two patterns
   */
  private applyFusionRule(
    rule: PatternFusionRule,
    pattern1: PatternDefinition,
    pattern2: PatternDefinition,
    sources: EnhancedWordSource
  ): PatternDefinition {
    const fusedId = `fused_${pattern1.id}_${pattern2.id}`;
    
    return {
      id: fusedId,
      category: 'fused',
      subcategory: rule.fusionMethod,
      weight: (pattern1.weight + pattern2.weight) / 2,
      minWordCount: rule.targetWordCount,
      maxWordCount: rule.targetWordCount,
      template: `Fusion of ${pattern1.template} and ${pattern2.template}`,
      description: `Fused pattern: ${pattern1.description} + ${pattern2.description}`,
      examples: [...pattern1.examples.slice(0, 2), ...pattern2.examples.slice(0, 2)],
      generate: (sources) => this.generateFusedPattern(rule, pattern1, pattern2, sources)
    };
  }

  /**
   * Generate name from fused pattern
   */
  private generateFusedPattern(
    rule: PatternFusionRule,
    pattern1: PatternDefinition,
    pattern2: PatternDefinition,
    sources: EnhancedWordSource
  ): string {
    const name1 = pattern1.generate(sources);
    const name2 = pattern2.generate(sources);

    switch (rule.fusionMethod) {
      case 'combine':
        return this.combineNames(name1, name2, rule.targetWordCount);
      case 'interweave':
        return this.interweaveNames(name1, name2, rule.targetWordCount);
      case 'transform':
        return this.transformNames(name1, name2, rule.targetWordCount);
      default:
        return name1;
    }
  }

  /**
   * Combine two names into target word count
   */
  private combineNames(name1: string, name2: string, targetWordCount: number): string {
    const words1 = name1.split(' ');
    const words2 = name2.split(' ');
    const combinedWords: string[] = [];

    // Take words alternately up to target count
    const maxSource = Math.max(words1.length, words2.length);
    for (let i = 0; i < maxSource && combinedWords.length < targetWordCount; i++) {
      if (i < words1.length && combinedWords.length < targetWordCount) {
        combinedWords.push(words1[i]);
      }
      if (i < words2.length && combinedWords.length < targetWordCount) {
        combinedWords.push(words2[i]);
      }
    }

    return combinedWords.slice(0, targetWordCount).join(' ');
  }

  /**
   * Interweave two names by taking strategic parts
   */
  private interweaveNames(name1: string, name2: string, targetWordCount: number): string {
    const words1 = name1.split(' ');
    const words2 = name2.split(' ');
    
    // Take first half from name1, second half from name2
    const splitPoint = Math.ceil(targetWordCount / 2);
    const firstHalf = words1.slice(0, splitPoint);
    const secondHalf = words2.slice(-Math.floor(targetWordCount / 2));
    
    return [...firstHalf, ...secondHalf].slice(0, targetWordCount).join(' ');
  }

  /**
   * Transform names by creating new variations
   */
  private transformNames(name1: string, name2: string, targetWordCount: number): string {
    const words1 = name1.split(' ');
    const words2 = name2.split(' ');
    
    // Create transformation by modifying words
    const transformedWords: string[] = [];
    
    for (let i = 0; i < targetWordCount; i++) {
      if (i % 2 === 0 && i < words1.length) {
        transformedWords.push(words1[i]);
      } else if (i < words2.length) {
        transformedWords.push(words2[i]);
      } else {
        transformedWords.push(words1[0] || words2[0] || 'Echo');
      }
    }
    
    return transformedWords.join(' ');
  }

  // Utility methods for theme and context matching
  private getGenreKeywords(genre: string): string[] {
    const genreKeywords: Record<string, string[]> = {
      rock: ['power', 'energy', 'electric', 'raw', 'loud'],
      jazz: ['smooth', 'cool', 'improvise', 'soul', 'blue'],
      electronic: ['digital', 'synthetic', 'cyber', 'neon', 'tech'],
      folk: ['natural', 'story', 'traditional', 'acoustic', 'earth'],
      pop: ['catchy', 'bright', 'mainstream', 'fun', 'accessible']
    };
    return genreKeywords[genre.toLowerCase()] || [];
  }

  private getMoodKeywords(mood: string): string[] {
    const moodKeywords: Record<string, string[]> = {
      energetic: ['energy', 'movement', 'power', 'dynamic'],
      melancholic: ['sadness', 'reflection', 'introspection', 'longing'],
      peaceful: ['tranquility', 'harmony', 'calm', 'serenity'],
      aggressive: ['force', 'intensity', 'confrontation', 'power'],
      mysterious: ['enigma', 'unknown', 'hidden', 'secret'],
      uplifting: ['hope', 'inspiration', 'positive', 'bright'],
      romantic: ['love', 'intimacy', 'tender', 'passion'],
      nostalgic: ['memory', 'past', 'reminiscence', 'vintage']
    };
    return moodKeywords[mood.toLowerCase()] || [];
  }

  private calculateIntensityMatch(theme: ContextualTheme, intensity: string): number {
    // Simple intensity scoring based on theme characteristics
    switch (intensity) {
      case 'low':
        return theme.name.includes('serenity') || theme.name.includes('romantic') ? 1 : 0.5;
      case 'medium':
        return 0.7; // Most themes work well with medium intensity
      case 'high':
        return theme.name.includes('industrial') || theme.name.includes('urban') ? 1 : 0.3;
      default:
        return 0.5;
    }
  }

  private calculateTypeMatch(theme: ContextualTheme, type: string): number {
    // Band names tend to work better with certain themes
    if (type === 'band') {
      return theme.name.includes('industrial') || theme.name.includes('cosmic') ? 0.8 : 0.6;
    }
    // Songs can work with all themes
    return 0.7;
  }

  private getThemeSpecificWords(elementType: string, theme: ContextualTheme): string[] {
    if (elementType.includes('noun')) return theme.wordBias.nouns;
    if (elementType.includes('adjective') || elementType.includes('modifier')) return theme.wordBias.adjectives;
    if (elementType.includes('verb') || elementType.includes('action')) return theme.wordBias.verbs;
    return [];
  }

  private getFallbackWord(elementType: string): string {
    const fallbacks: Record<string, string> = {
      metaphor_source: 'fire',
      metaphor_target: 'dreams',
      journey_start: 'from silence',
      journey_destination: 'to light',
      emotion_modifier: 'wild',
      landscape_type: 'mountains',
      time_reference: 'forever',
      transformation_verb: 'becomes',
      sense_type: 'feel',
      sensory_quality: 'deep'
    };
    return fallbacks[elementType] || 'echo';
  }

  // Music context methods
  private buildMusicTemplate(musicContext: any, wordCount: number): string {
    const templates = [`{musical_element}`.repeat(wordCount)];
    return templates[0];
  }

  private generateMusicContextualName(musicContext: any, sources: EnhancedWordSource, wordCount: number): string {
    // This would generate names based on musical characteristics
    // For now, return a placeholder implementation
    const musicWords = [...sources.validMusicalTerms, 'rhythm', 'melody', 'harmony', 'tempo'];
    const selectedWords = [];
    
    for (let i = 0; i < wordCount; i++) {
      selectedWords.push(capitalize(getRandomWord(musicWords) || 'music'));
    }
    
    return selectedWords.join(' ');
  }

  // Variation creation methods
  private createSynonymVariation(pattern: PatternDefinition, sources: EnhancedWordSource): PatternDefinition {
    // Create a pattern that uses synonyms of the original
    return {
      ...pattern,
      id: `${pattern.id}_synonym_var`,
      subcategory: `${pattern.subcategory}_synonym`,
      description: `Synonym variation of ${pattern.description}`,
      generate: (sources) => {
        // Generate original and then replace with synonyms
        const original = pattern.generate(sources);
        return this.replacWithSynonyms(original, sources);
      }
    };
  }

  private createStructuralVariation(pattern: PatternDefinition, criteria: PatternSelectionCriteria): PatternDefinition {
    // Create a pattern with modified structure
    return {
      ...pattern,
      id: `${pattern.id}_struct_var`,
      subcategory: `${pattern.subcategory}_structural`,
      description: `Structural variation of ${pattern.description}`,
      generate: (sources) => {
        const original = pattern.generate(sources);
        return this.modifyStructure(original, criteria.wordCount);
      }
    };
  }

  private createThematicVariation(pattern: PatternDefinition, criteria: PatternSelectionCriteria, sources: EnhancedWordSource): PatternDefinition {
    return {
      ...pattern,
      id: `${pattern.id}_theme_var`,
      subcategory: `${pattern.subcategory}_thematic`,
      description: `Thematic variation of ${pattern.description}`,
      generate: (sources) => pattern.generate(sources) // Placeholder
    };
  }

  private createIntensityVariation(pattern: PatternDefinition, criteria: PatternSelectionCriteria, sources: EnhancedWordSource): PatternDefinition {
    return {
      ...pattern,
      id: `${pattern.id}_intensity_var`,
      subcategory: `${pattern.subcategory}_intensity`,
      description: `Intensity variation of ${pattern.description}`,
      generate: (sources) => pattern.generate(sources) // Placeholder
    };
  }

  private replacWithSynonyms(text: string, sources: EnhancedWordSource): string {
    // Placeholder for synonym replacement logic
    return text;
  }

  private modifyStructure(text: string, targetWordCount: number): string {
    const words = text.split(' ');
    if (words.length === targetWordCount) return text;
    
    if (words.length > targetWordCount) {
      return words.slice(0, targetWordCount).join(' ');
    } else {
      // Add words to reach target count
      const additionalWords = ['of', 'and', 'in', 'the', 'beyond'];
      while (words.length < targetWordCount) {
        words.push(getRandomWord(additionalWords) || 'and');
      }
      return words.join(' ');
    }
  }
}

// Export singleton instance
export const contextualPatternBuilder = new ContextualPatternBuilder();