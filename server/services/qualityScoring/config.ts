/**
 * Configuration for Quality Scoring Service
 * Centralized scoring weights, thresholds, and genre-specific adjustments
 */

import type { 
  ScoringWeights, 
  QualityThresholds, 
  GenreAdjustments,
  ScoringAlgorithm
} from './interfaces';

// Default scoring weights (can be overridden by genre)
export const DEFAULT_NAME_WEIGHTS: ScoringWeights = {
  creativity: 0.25,      // How original/creative the name is
  appropriateness: 0.20, // How well it fits the genre/mood
  quality: 0.20,         // Technical quality (readability, pronunciation)
  memorability: 0.15,    // How memorable and impactful
  uniqueness: 0.15,      // Avoids common clichés  
  structure: 0.05        // Appropriate length/word count
};

export const DEFAULT_LYRIC_WEIGHTS: ScoringWeights = {
  creativity: 0.20,      // Original imagery and word choices
  appropriateness: 0.25, // Genre authenticity and thematic fit
  quality: 0.25,         // Grammar, flow, rhythm
  memorability: 0.15,    // Emotional impact and catchiness
  uniqueness: 0.10,      // Avoids lyrical clichés
  structure: 0.05        // Appropriate line structure
};

// Quality thresholds for filtering
export const QUALITY_THRESHOLDS: QualityThresholds = {
  strict: 0.75,          // Premium quality - only excellent results
  moderate: 0.60,        // Good quality - recommended default
  lenient: 0.45,         // Acceptable quality - broader results
  emergency: 0.30        // Emergency fallback - when few results available
};

// Genre-specific adjustments and bonuses
export const GENRE_ADJUSTMENTS: GenreAdjustments = {
  rock: {
    weights: {
      creativity: 0.30,   // Higher creativity weight for rock
      appropriateness: 0.25,
      memorability: 0.20  // Rock needs memorable names
    },
    bonuses: {
      keywords: ['fire', 'storm', 'steel', 'thunder', 'wild', 'rebel', 'edge', 'dark'],
      keywordBonus: 0.05,
      styleElements: ['alliteration', 'hard_consonants', 'dynamic_words'],
      styleBonus: 0.03
    }
  },
  metal: {
    weights: {
      creativity: 0.35,
      appropriateness: 0.30,
      memorability: 0.20
    },
    bonuses: {
      keywords: ['death', 'black', 'doom', 'steel', 'forge', 'void', 'chaos', 'shadow'],
      keywordBonus: 0.06,
      styleElements: ['dark_imagery', 'powerful_words', 'mystical_elements'],
      styleBonus: 0.04
    }
  },
  jazz: {
    weights: {
      creativity: 0.30,
      quality: 0.25,       // Jazz values sophistication
      appropriateness: 0.20
    },
    bonuses: {
      keywords: ['blue', 'moon', 'midnight', 'smooth', 'cool', 'velvet', 'swing'],
      keywordBonus: 0.04,
      styleElements: ['sophistication', 'smooth_words', 'nighttime_imagery'],
      styleBonus: 0.03
    }
  },
  electronic: {
    weights: {
      creativity: 0.35,    // Electronic music is very creative
      uniqueness: 0.20,    // Values unique/futuristic elements
      appropriateness: 0.20
    },
    bonuses: {
      keywords: ['digital', 'neon', 'pulse', 'wave', 'synth', 'circuit', 'future', 'cyber'],
      keywordBonus: 0.05,
      styleElements: ['futuristic_terms', 'tech_imagery', 'energy_words'],
      styleBonus: 0.04
    }
  },
  folk: {
    weights: {
      quality: 0.30,       // Folk values storytelling quality
      appropriateness: 0.25,
      creativity: 0.20
    },
    bonuses: {
      keywords: ['river', 'mountain', 'home', 'wind', 'story', 'heart', 'road'],
      keywordBonus: 0.04,
      styleElements: ['natural_imagery', 'storytelling_words', 'emotional_terms'],
      styleBonus: 0.03
    }
  },
  classical: {
    weights: {
      quality: 0.35,       // Classical prioritizes technical quality
      appropriateness: 0.25,
      structure: 0.15      // Structure is important in classical
    },
    bonuses: {
      keywords: ['symphony', 'sonata', 'concerto', 'opus', 'movement', 'chamber'],
      keywordBonus: 0.05,
      styleElements: ['formal_structure', 'musical_terms', 'elegant_language'],
      styleBonus: 0.04
    }
  },
  'hip-hop': {
    weights: {
      creativity: 0.30,
      memorability: 0.25,  // Hip-hop needs memorable, catchy elements
      uniqueness: 0.20
    },
    bonuses: {
      keywords: ['flow', 'beat', 'street', 'real', 'fresh', 'raw', 'mic', 'stage'],
      keywordBonus: 0.05,
      styleElements: ['rhythmic_elements', 'street_credibility', 'wordplay'],
      styleBonus: 0.04
    }
  },
  country: {
    weights: {
      appropriateness: 0.30, // Country has strong thematic expectations
      quality: 0.25,
      memorability: 0.20
    },
    bonuses: {
      keywords: ['highway', 'boots', 'whiskey', 'heart', 'home', 'freedom', 'truck'],
      keywordBonus: 0.04,
      styleElements: ['americana_imagery', 'simple_language', 'emotional_authenticity'],
      styleBonus: 0.03
    }
  },
  indie: {
    weights: {
      creativity: 0.35,    // Indie values creativity highly
      uniqueness: 0.25,    // Must be unique/alternative
      appropriateness: 0.20
    },
    bonuses: {
      keywords: ['dream', 'ghost', 'echo', 'fade', 'bloom', 'wild', 'strange'],
      keywordBonus: 0.04,
      styleElements: ['atmospheric_words', 'introspective_terms', 'artistic_language'],
      styleBonus: 0.04
    }
  },
  pop: {
    weights: {
      memorability: 0.30,  // Pop prioritizes memorability
      quality: 0.25,
      creativity: 0.20
    },
    bonuses: {
      keywords: ['star', 'shine', 'bright', 'love', 'dream', 'party', 'dance'],
      keywordBonus: 0.04,
      styleElements: ['catchy_elements', 'positive_energy', 'universal_appeal'],
      styleBonus: 0.03
    }
  }
};

// Scoring algorithm configurations
export const SCORING_ALGORITHMS = {
  heuristic_v1: {
    version: '1.0.0',
    description: 'Fast heuristic-based scoring',
    performance: 'high',
    accuracy: 'good'
  },
  weighted_v1: {
    version: '1.0.0', 
    description: 'Weighted multi-criteria scoring',
    performance: 'medium',
    accuracy: 'high'
  },
  genre_adjusted_v1: {
    version: '1.0.0',
    description: 'Genre-specific adjusted scoring',
    performance: 'medium',
    accuracy: 'very_high'
  }
} as const;

// Performance configuration
export const PERFORMANCE_CONFIG = {
  maxScoringTime: 100,     // Maximum time per item (ms)
  batchTimeout: 1000,      // Maximum time for batch operations (ms)
  cacheTimeout: 300000,    // Cache results for 5 minutes (ms)
  enableCaching: true,     // Enable result caching
  parallelScoring: true,   // Enable parallel scoring for batches
  maxBatchSize: 20        // Maximum items to score in one batch
};

// Common word lists for scoring algorithms
export const COMMON_WORDS = {
  overused: [
    // Generic words that reduce uniqueness scores
    'the', 'and', 'or', 'but', 'with', 'from', 'they', 'this', 'that',
    'music', 'band', 'song', 'sound', 'play', 'sing', 'voice', 'tune'
  ],
  cliches: [
    // Common clichés that reduce creativity scores
    'rock and roll', 'sex drugs', 'born to', 'ready to rock', 'party time',
    'love song', 'broken heart', 'tears fall', 'dancing queen', 'wild night'
  ],
  quality_indicators: [
    // Words that indicate higher quality
    'symphony', 'harmony', 'melody', 'rhythm', 'crescendo', 'resonance',
    'ethereal', 'transcendent', 'sublime', 'evocative', 'haunting'
  ]
};

// Export default configuration
export const DEFAULT_CONFIG = {
  nameWeights: DEFAULT_NAME_WEIGHTS,
  lyricWeights: DEFAULT_LYRIC_WEIGHTS,
  thresholds: QUALITY_THRESHOLDS,
  genreAdjustments: GENRE_ADJUSTMENTS,
  performance: PERFORMANCE_CONFIG,
  defaultAlgorithm: 'genre_adjusted_v1' as ScoringAlgorithm,
  version: '1.0.0'
};

// Configuration validation
export function validateConfig(config: any): boolean {
  try {
    // Validate weights sum to reasonable range
    const nameWeights = config.nameWeights || DEFAULT_NAME_WEIGHTS;
    const nameWeightSum = Object.values(nameWeights)
      .reduce((sum: number, weight: unknown) => sum + (weight as number), 0);
    
    if (nameWeightSum < 0.95 || nameWeightSum > 1.05) {
      throw new Error(`Invalid name weights sum: ${nameWeightSum}`);
    }

    const lyricWeights = config.lyricWeights || DEFAULT_LYRIC_WEIGHTS;
    const lyricWeightSum = Object.values(lyricWeights)
      .reduce((sum: number, weight: unknown) => sum + (weight as number), 0);
    
    if (lyricWeightSum < 0.95 || lyricWeightSum > 1.05) {
      throw new Error(`Invalid lyric weights sum: ${lyricWeightSum}`);
    }

    // Validate thresholds are in order
    const thresholds = config.thresholds || QUALITY_THRESHOLDS;
    if (thresholds.emergency >= thresholds.lenient ||
        thresholds.lenient >= thresholds.moderate ||
        thresholds.moderate >= thresholds.strict) {
      throw new Error('Invalid threshold ordering');
    }

    return true;
  } catch (error) {
    console.error('Config validation failed:', error);
    return false;
  }
}