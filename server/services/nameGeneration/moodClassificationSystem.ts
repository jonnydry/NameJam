/**
 * Mood Classification System - Comprehensive emotional taxonomy for music contexts
 * Provides sophisticated mood analysis, intensity scaling, and complex emotional state modeling
 */

import { secureLog } from '../../utils/secureLogger';

// Core emotional dimensions
export interface EmotionalDimensions {
  energy: number;      // 0-100: calm to energetic
  valence: number;     // 0-100: negative to positive
  complexity: number;  // 0-100: simple to complex
  intensity: number;   // 0-100: subtle to overwhelming
  darkness: number;    // 0-100: light to dark
  mystery: number;     // 0-100: obvious to mysterious
}

// Primary mood categories with detailed emotional profiles
export interface MoodProfile {
  id: string;
  name: string;
  category: string;
  dimensions: EmotionalDimensions;
  keywords: string[];
  synonyms: string[];
  opposites: string[];
  relatedMoods: string[];
  musicalAssociations: string[];
  colorPalette: string[];
  timeAssociations: string[];
  seasonAssociations: string[];
  genreAffinity: Record<string, number>; // genre -> affinity score (0-1)
  patternPreferences: string[];
  wordCharacteristics: {
    preferredSyllables: number[];
    preferredConsonants: string[];
    preferredVowels: string[];
    rhythmicPatterns: string[];
  };
}

// Complex emotional states combining multiple moods
export interface ComplexMood {
  id: string;
  name: string;
  primaryMood: string;
  secondaryMoods: string[];
  blendRatio: number[]; // How much of each mood (sum = 1.0)
  description: string;
  contexts: string[];
  examples: string[];
}

// Temporal and contextual mood modifiers
export interface MoodModifier {
  id: string;
  name: string;
  type: 'temporal' | 'seasonal' | 'cultural' | 'situational' | 'intensity';
  effect: Partial<EmotionalDimensions>;
  applicableMoods: string[];
  strength: number; // 0-1
}

export class MoodClassificationSystem {
  // Primary mood profiles - comprehensive emotional taxonomy
  private readonly moodProfiles: Map<string, MoodProfile> = new Map([
    // High Energy Moods
    ['euphoric', {
      id: 'euphoric',
      name: 'Euphoric',
      category: 'high_energy',
      dimensions: { energy: 95, valence: 90, complexity: 60, intensity: 85, darkness: 10, mystery: 30 },
      keywords: ['ecstatic', 'blissful', 'elated', 'rapturous', 'transcendent'],
      synonyms: ['blissful', 'ecstatic', 'rapturous', 'exhilarated'],
      opposites: ['melancholic', 'depressed', 'somber'],
      relatedMoods: ['energetic', 'uplifting', 'triumphant'],
      musicalAssociations: ['major scales', 'fast tempo', 'bright timbres', 'upward melodies'],
      colorPalette: ['bright yellow', 'electric blue', 'vibrant orange', 'pure white'],
      timeAssociations: ['dawn', 'peak summer', 'celebration moments'],
      seasonAssociations: ['spring', 'summer'],
      genreAffinity: { 'electronic': 0.9, 'pop': 0.8, 'rock': 0.7, 'classical': 0.6 },
      patternPreferences: ['dynamic_adjective_noun', 'action_object', 'celestial_journey'],
      wordCharacteristics: {
        preferredSyllables: [2, 3],
        preferredConsonants: ['l', 'r', 'n', 's'],
        preferredVowels: ['i', 'e', 'a'],
        rhythmicPatterns: ['ascending', 'bright', 'flowing']
      }
    }],

    ['aggressive', {
      id: 'aggressive',
      name: 'Aggressive',
      category: 'high_energy',
      dimensions: { energy: 90, valence: 30, complexity: 70, intensity: 95, darkness: 70, mystery: 40 },
      keywords: ['fierce', 'violent', 'forceful', 'confrontational', 'intense'],
      synonyms: ['fierce', 'violent', 'brutal', 'intense', 'forceful'],
      opposites: ['peaceful', 'gentle', 'serene'],
      relatedMoods: ['angry', 'powerful', 'rebellious'],
      musicalAssociations: ['heavy percussion', 'distorted guitars', 'minor scales', 'staccato'],
      colorPalette: ['deep red', 'black', 'steel gray', 'orange'],
      timeAssociations: ['storm', 'midnight', 'conflict'],
      seasonAssociations: ['winter storms', 'late autumn'],
      genreAffinity: { 'metal': 1.0, 'punk': 0.95, 'rock': 0.8, 'industrial': 0.9 },
      patternPreferences: ['contrasting_elements', 'power_statement', 'raw_energy'],
      wordCharacteristics: {
        preferredSyllables: [1, 2],
        preferredConsonants: ['k', 'g', 'r', 't', 'd'],
        preferredVowels: ['a', 'o'],
        rhythmicPatterns: ['sharp', 'staccato', 'powerful']
      }
    }],

    ['energetic', {
      id: 'energetic',
      name: 'Energetic',
      category: 'high_energy',
      dimensions: { energy: 85, valence: 75, complexity: 50, intensity: 70, darkness: 20, mystery: 25 },
      keywords: ['vibrant', 'dynamic', 'lively', 'spirited', 'kinetic'],
      synonyms: ['vibrant', 'dynamic', 'spirited', 'lively', 'animated'],
      opposites: ['lethargic', 'static', 'calm'],
      relatedMoods: ['uplifting', 'exciting', 'motivational'],
      musicalAssociations: ['fast tempo', 'rhythmic patterns', 'bright instrumentation'],
      colorPalette: ['electric blue', 'lime green', 'hot pink', 'bright yellow'],
      timeAssociations: ['morning rush', 'workout time', 'festival peak'],
      seasonAssociations: ['spring', 'summer'],
      genreAffinity: { 'electronic': 0.9, 'pop': 0.85, 'rock': 0.8, 'dance': 0.95 },
      patternPreferences: ['action_object', 'dynamic_adjective_noun', 'movement_metaphor'],
      wordCharacteristics: {
        preferredSyllables: [2, 3],
        preferredConsonants: ['r', 'l', 'n', 'd'],
        preferredVowels: ['i', 'e'],
        rhythmicPatterns: ['bouncing', 'flowing', 'rhythmic']
      }
    }],

    // Low Energy Moods
    ['melancholic', {
      id: 'melancholic',
      name: 'Melancholic',
      category: 'low_energy',
      dimensions: { energy: 25, valence: 20, complexity: 80, intensity: 60, darkness: 75, mystery: 70 },
      keywords: ['sad', 'wistful', 'sorrowful', 'pensive', 'mournful'],
      synonyms: ['sorrowful', 'mournful', 'wistful', 'pensive', 'plaintive'],
      opposites: ['euphoric', 'joyful', 'uplifting'],
      relatedMoods: ['nostalgic', 'contemplative', 'lonely'],
      musicalAssociations: ['minor keys', 'slow tempo', 'descending melodies', 'sparse instrumentation'],
      colorPalette: ['deep blue', 'gray', 'muted purple', 'pale silver'],
      timeAssociations: ['twilight', 'rainy days', 'late autumn'],
      seasonAssociations: ['autumn', 'winter'],
      genreAffinity: { 'classical': 0.9, 'folk': 0.85, 'indie': 0.8, 'blues': 0.9 },
      patternPreferences: ['emotional_journey', 'temporal_concept', 'introspective_statement'],
      wordCharacteristics: {
        preferredSyllables: [2, 3, 4],
        preferredConsonants: ['m', 'n', 'l', 'w'],
        preferredVowels: ['o', 'u', 'a'],
        rhythmicPatterns: ['descending', 'flowing', 'gentle']
      }
    }],

    ['peaceful', {
      id: 'peaceful',
      name: 'Peaceful',
      category: 'low_energy',
      dimensions: { energy: 30, valence: 80, complexity: 40, intensity: 25, darkness: 15, mystery: 30 },
      keywords: ['serene', 'tranquil', 'calm', 'harmonious', 'gentle'],
      synonyms: ['serene', 'tranquil', 'placid', 'harmonious', 'gentle'],
      opposites: ['aggressive', 'chaotic', 'turbulent'],
      relatedMoods: ['meditative', 'soothing', 'contemplative'],
      musicalAssociations: ['soft dynamics', 'flowing rhythms', 'consonant harmonies', 'sustained tones'],
      colorPalette: ['soft blue', 'pale green', 'cream', 'lavender'],
      timeAssociations: ['early morning', 'sunset', 'quiet moments'],
      seasonAssociations: ['spring morning', 'summer evening'],
      genreAffinity: { 'ambient': 1.0, 'classical': 0.8, 'folk': 0.7, 'new_age': 0.95 },
      patternPreferences: ['nature_metaphor', 'gentle_imagery', 'flowing_concept'],
      wordCharacteristics: {
        preferredSyllables: [2, 3],
        preferredConsonants: ['l', 'm', 'n', 'w', 's'],
        preferredVowels: ['e', 'o', 'a'],
        rhythmicPatterns: ['flowing', 'gentle', 'sustained']
      }
    }],

    // Mystery & Intrigue
    ['mysterious', {
      id: 'mysterious',
      name: 'Mysterious',
      category: 'atmospheric',
      dimensions: { energy: 45, valence: 50, complexity: 90, intensity: 65, darkness: 80, mystery: 95 },
      keywords: ['enigmatic', 'cryptic', 'secretive', 'occult', 'hidden'],
      synonyms: ['enigmatic', 'cryptic', 'arcane', 'esoteric', 'shadowy'],
      opposites: ['obvious', 'clear', 'transparent'],
      relatedMoods: ['dark', 'intriguing', 'suspenseful'],
      musicalAssociations: ['unusual scales', 'unexpected harmonies', 'ambient textures', 'whispered vocals'],
      colorPalette: ['deep purple', 'midnight blue', 'charcoal', 'silver'],
      timeAssociations: ['midnight', 'foggy evening', 'eclipse'],
      seasonAssociations: ['autumn fog', 'winter nights'],
      genreAffinity: { 'ambient': 0.9, 'experimental': 0.95, 'darkwave': 1.0, 'progressive': 0.8 },
      patternPreferences: ['abstract_concept', 'symbolic_imagery', 'hidden_meaning'],
      wordCharacteristics: {
        preferredSyllables: [2, 3, 4],
        preferredConsonants: ['s', 'sh', 'z', 'th', 'v'],
        preferredVowels: ['o', 'u', 'i'],
        rhythmicPatterns: ['undulating', 'mysterious', 'complex']
      }
    }],

    ['romantic', {
      id: 'romantic',
      name: 'Romantic',
      category: 'emotional',
      dimensions: { energy: 55, valence: 85, complexity: 70, intensity: 60, darkness: 25, mystery: 50 },
      keywords: ['passionate', 'tender', 'intimate', 'loving', 'affectionate'],
      synonyms: ['passionate', 'tender', 'amorous', 'intimate', 'affectionate'],
      opposites: ['cold', 'detached', 'hostile'],
      relatedMoods: ['warm', 'gentle', 'dreamy'],
      musicalAssociations: ['legato phrasing', 'warm timbres', 'expressive dynamics', 'lyrical melodies'],
      colorPalette: ['soft pink', 'warm red', 'gold', 'deep rose'],
      timeAssociations: ['candlelight', 'sunset', 'intimate moments'],
      seasonAssociations: ['spring blooms', 'summer evenings'],
      genreAffinity: { 'classical': 0.9, 'jazz': 0.8, 'folk': 0.75, 'pop': 0.7 },
      patternPreferences: ['emotional_journey', 'intimate_imagery', 'warm_metaphor'],
      wordCharacteristics: {
        preferredSyllables: [2, 3],
        preferredConsonants: ['l', 'r', 'm', 'n'],
        preferredVowels: ['a', 'o', 'e'],
        rhythmicPatterns: ['flowing', 'warm', 'expressive']
      }
    }],

    // Temporal & Nostalgic
    ['nostalgic', {
      id: 'nostalgic',
      name: 'Nostalgic',
      category: 'temporal',
      dimensions: { energy: 40, valence: 60, complexity: 75, intensity: 55, darkness: 45, mystery: 60 },
      keywords: ['reminiscent', 'wistful', 'sentimental', 'retrospective', 'yearning'],
      synonyms: ['reminiscent', 'wistful', 'sentimental', 'retrospective'],
      opposites: ['futuristic', 'progressive', 'modern'],
      relatedMoods: ['melancholic', 'contemplative', 'bittersweet'],
      musicalAssociations: ['vintage timbres', 'familiar progressions', 'analog warmth', 'echo effects'],
      colorPalette: ['sepia', 'faded gold', 'dusty blue', 'vintage cream'],
      timeAssociations: ['old photographs', 'sunset memories', 'childhood'],
      seasonAssociations: ['late summer', 'early autumn'],
      genreAffinity: { 'folk': 0.9, 'country': 0.85, 'indie': 0.8, 'classic_rock': 0.9 },
      patternPreferences: ['temporal_concept', 'memory_metaphor', 'vintage_imagery'],
      wordCharacteristics: {
        preferredSyllables: [2, 3, 4],
        preferredConsonants: ['m', 'n', 'l', 'w'],
        preferredVowels: ['o', 'a', 'e'],
        rhythmicPatterns: ['gentle', 'flowing', 'nostalgic']
      }
    }],

    // Uplifting & Positive
    ['uplifting', {
      id: 'uplifting',
      name: 'Uplifting',
      category: 'positive',
      dimensions: { energy: 75, valence: 90, complexity: 55, intensity: 70, darkness: 10, mystery: 25 },
      keywords: ['inspiring', 'hopeful', 'encouraging', 'elevating', 'empowering'],
      synonyms: ['inspiring', 'hopeful', 'encouraging', 'elevating', 'motivational'],
      opposites: ['depressing', 'discouraging', 'defeating'],
      relatedMoods: ['triumphant', 'hopeful', 'energetic'],
      musicalAssociations: ['major keys', 'ascending melodies', 'bright harmonies', 'crescendo builds'],
      colorPalette: ['bright gold', 'sky blue', 'warm yellow', 'fresh green'],
      timeAssociations: ['sunrise', 'breakthrough moments', 'achievement'],
      seasonAssociations: ['spring awakening', 'summer peak'],
      genreAffinity: { 'pop': 0.9, 'gospel': 1.0, 'rock': 0.8, 'electronic': 0.75 },
      patternPreferences: ['ascending_journey', 'light_metaphor', 'growth_concept'],
      wordCharacteristics: {
        preferredSyllables: [2, 3],
        preferredConsonants: ['l', 'r', 'n', 's'],
        preferredVowels: ['i', 'e', 'a'],
        rhythmicPatterns: ['ascending', 'bright', 'upward']
      }
    }],

    // Dark & Intense
    ['dark', {
      id: 'dark',
      name: 'Dark',
      category: 'atmospheric',
      dimensions: { energy: 60, valence: 25, complexity: 80, intensity: 75, darkness: 95, mystery: 80 },
      keywords: ['brooding', 'ominous', 'sinister', 'foreboding', 'grim'],
      synonyms: ['brooding', 'ominous', 'sinister', 'menacing', 'grim'],
      opposites: ['bright', 'cheerful', 'optimistic'],
      relatedMoods: ['mysterious', 'intense', 'heavy'],
      musicalAssociations: ['minor keys', 'low registers', 'dissonance', 'heavy textures'],
      colorPalette: ['black', 'deep red', 'charcoal', 'midnight blue'],
      timeAssociations: ['midnight', 'storm clouds', 'shadows'],
      seasonAssociations: ['winter nights', 'stormy weather'],
      genreAffinity: { 'metal': 0.95, 'gothic': 1.0, 'darkwave': 0.95, 'industrial': 0.9 },
      patternPreferences: ['shadow_imagery', 'power_statement', 'dark_metaphor'],
      wordCharacteristics: {
        preferredSyllables: [1, 2],
        preferredConsonants: ['k', 'g', 'd', 'th'],
        preferredVowels: ['o', 'u', 'a'],
        rhythmicPatterns: ['heavy', 'powerful', 'dark']
      }
    }]
  ]);

  // Complex mood combinations
  private readonly complexMoods: Map<string, ComplexMood> = new Map([
    ['bittersweet', {
      id: 'bittersweet',
      name: 'Bittersweet',
      primaryMood: 'nostalgic',
      secondaryMoods: ['melancholic', 'uplifting'],
      blendRatio: [0.5, 0.3, 0.2],
      description: 'A complex emotion mixing sadness with appreciation, loss with gratitude',
      contexts: ['endings', 'graduations', 'growing up', 'memories'],
      examples: ['Sweet Sorrow', 'Fading Light', 'Last Dance']
    }],
    ['triumphant_melancholy', {
      id: 'triumphant_melancholy',
      name: 'Triumphant Melancholy',
      primaryMood: 'uplifting',
      secondaryMoods: ['melancholic', 'nostalgic'],
      blendRatio: [0.4, 0.35, 0.25],
      description: 'Victory achieved through struggle, success touched by loss',
      contexts: ['overcoming hardship', 'pyrrhic victory', 'hard-won success'],
      examples: ['Hollow Victory', 'Broken Crown', 'Wounded Glory']
    }],
    ['gentle_power', {
      id: 'gentle_power',
      name: 'Gentle Power',
      primaryMood: 'peaceful',
      secondaryMoods: ['uplifting', 'mysterious'],
      blendRatio: [0.5, 0.3, 0.2],
      description: 'Quiet strength, understated confidence, power through serenity',
      contexts: ['inner strength', 'quiet leadership', 'subtle influence'],
      examples: ['Quiet Thunder', 'Gentle Storm', 'Silent Force']
    }],
    ['dark_euphoria', {
      id: 'dark_euphoria',
      name: 'Dark Euphoria',
      primaryMood: 'euphoric',
      secondaryMoods: ['dark', 'mysterious'],
      blendRatio: [0.5, 0.3, 0.2],
      description: 'Intense joy with darker undertones, ecstasy with edge',
      contexts: ['intense experiences', 'forbidden pleasures', 'dangerous thrills'],
      examples: ['Midnight High', 'Shadow Dance', 'Dark Ecstasy']
    }]
  ]);

  // Mood modifiers for contextual adaptation
  private readonly moodModifiers: Map<string, MoodModifier> = new Map([
    ['vintage_filter', {
      id: 'vintage_filter',
      name: 'Vintage Filter',
      type: 'temporal',
      effect: { complexity: 10, darkness: 5, mystery: 15 },
      applicableMoods: ['nostalgic', 'romantic', 'melancholic'],
      strength: 0.3
    }],
    ['urban_intensity', {
      id: 'urban_intensity',
      name: 'Urban Intensity',
      type: 'cultural',
      effect: { energy: 15, intensity: 20, darkness: 10 },
      applicableMoods: ['aggressive', 'energetic', 'dark'],
      strength: 0.4
    }],
    ['seasonal_autumn', {
      id: 'seasonal_autumn',
      name: 'Autumn Modifier',
      type: 'seasonal',
      effect: { energy: -10, valence: -5, complexity: 10, darkness: 15 },
      applicableMoods: ['nostalgic', 'melancholic', 'peaceful'],
      strength: 0.25
    }],
    ['midnight_amplifier', {
      id: 'midnight_amplifier',
      name: 'Midnight Amplifier',
      type: 'temporal',
      effect: { darkness: 20, mystery: 25, intensity: 10 },
      applicableMoods: ['mysterious', 'dark', 'romantic'],
      strength: 0.5
    }]
  ]);

  /**
   * Get comprehensive mood profile by ID
   */
  getMoodProfile(moodId: string): MoodProfile | null {
    return this.moodProfiles.get(moodId) || null;
  }

  /**
   * Get complex mood definition by ID
   */
  getComplexMood(complexMoodId: string): ComplexMood | null {
    return this.complexMoods.get(complexMoodId) || null;
  }

  /**
   * Analyze mood similarity between two moods
   */
  calculateMoodSimilarity(mood1: string, mood2: string): number {
    const profile1 = this.getMoodProfile(mood1);
    const profile2 = this.getMoodProfile(mood2);
    
    if (!profile1 || !profile2) return 0;

    // Calculate similarity based on emotional dimensions
    const dimensionKeys = Object.keys(profile1.dimensions) as (keyof EmotionalDimensions)[];
    let totalDistance = 0;

    for (const key of dimensionKeys) {
      const diff = Math.abs(profile1.dimensions[key] - profile2.dimensions[key]);
      totalDistance += diff;
    }

    // Normalize to 0-1 scale (lower distance = higher similarity)
    const maxDistance = dimensionKeys.length * 100;
    return 1 - (totalDistance / maxDistance);
  }

  /**
   * Find moods that match specific emotional criteria
   */
  findMoodsByDimensions(criteria: Partial<EmotionalDimensions>, tolerance: number = 15): MoodProfile[] {
    const matches: Array<{ profile: MoodProfile; score: number }> = [];

    for (const [id, profile] of this.moodProfiles) {
      let totalScore = 0;
      let criteriaCount = 0;

      for (const [dimension, targetValue] of Object.entries(criteria)) {
        if (typeof targetValue === 'number') {
          const actualValue = profile.dimensions[dimension as keyof EmotionalDimensions];
          const distance = Math.abs(actualValue - targetValue);
          const score = Math.max(0, 100 - distance);
          totalScore += score;
          criteriaCount++;
        }
      }

      if (criteriaCount > 0) {
        const averageScore = totalScore / criteriaCount;
        if (averageScore >= (100 - tolerance)) {
          matches.push({ profile, score: averageScore });
        }
      }
    }

    return matches
      .sort((a, b) => b.score - a.score)
      .map(match => match.profile);
  }

  /**
   * Apply contextual modifiers to a mood
   */
  applyMoodModifiers(baseMoodId: string, modifierIds: string[]): EmotionalDimensions {
    const baseMood = this.getMoodProfile(baseMoodId);
    if (!baseMood) return { energy: 50, valence: 50, complexity: 50, intensity: 50, darkness: 50, mystery: 50 };

    let modifiedDimensions = { ...baseMood.dimensions };

    for (const modifierId of modifierIds) {
      const modifier = this.moodModifiers.get(modifierId);
      if (modifier && modifier.applicableMoods.includes(baseMoodId)) {
        for (const [dimension, change] of Object.entries(modifier.effect)) {
          if (typeof change === 'number') {
            const currentValue = modifiedDimensions[dimension as keyof EmotionalDimensions];
            const adjustedChange = change * modifier.strength;
            modifiedDimensions[dimension as keyof EmotionalDimensions] = 
              Math.max(0, Math.min(100, currentValue + adjustedChange));
          }
        }
      }
    }

    return modifiedDimensions;
  }

  /**
   * Get all available mood IDs
   */
  getAllMoodIds(): string[] {
    return Array.from(this.moodProfiles.keys());
  }

  /**
   * Get moods by category
   */
  getMoodsByCategory(category: string): MoodProfile[] {
    return Array.from(this.moodProfiles.values())
      .filter(profile => profile.category === category);
  }

  /**
   * Analyze mood compatibility with genre
   */
  analyzeMoodGenreCompatibility(moodId: string, genre: string): number {
    const profile = this.getMoodProfile(moodId);
    if (!profile) return 0;

    return profile.genreAffinity[genre] || 0;
  }

  /**
   * Get recommended patterns for a mood
   */
  getRecommendedPatterns(moodId: string): string[] {
    const profile = this.getMoodProfile(moodId);
    return profile ? profile.patternPreferences : [];
  }

  /**
   * Blend multiple moods into composite emotional profile
   */
  blendMoods(moodIds: string[], weights?: number[]): EmotionalDimensions {
    if (moodIds.length === 0) {
      return { energy: 50, valence: 50, complexity: 50, intensity: 50, darkness: 50, mystery: 50 };
    }

    const normalizedWeights = weights || Array(moodIds.length).fill(1 / moodIds.length);
    const blendedDimensions: EmotionalDimensions = 
      { energy: 0, valence: 0, complexity: 0, intensity: 0, darkness: 0, mystery: 0 };

    for (let i = 0; i < moodIds.length; i++) {
      const profile = this.getMoodProfile(moodIds[i]);
      if (profile) {
        const weight = normalizedWeights[i];
        for (const [dimension, value] of Object.entries(profile.dimensions)) {
          blendedDimensions[dimension as keyof EmotionalDimensions] += value * weight;
        }
      }
    }

    return blendedDimensions;
  }

  /**
   * Get contextual word characteristics for a mood
   */
  getMoodWordCharacteristics(moodId: string): MoodProfile['wordCharacteristics'] | null {
    const profile = this.getMoodProfile(moodId);
    return profile ? profile.wordCharacteristics : null;
  }
}

// Export singleton instance
export const moodClassificationSystem = new MoodClassificationSystem();