import { LyricServiceConfig } from '../types/lyricTypes';

/**
 * Centralized configuration for the lyric generation service
 * All hardcoded values are externalized here for easy management
 */
export class LyricConfig {
  private static instance: LyricConfig;
  private config: LyricServiceConfig;

  private constructor() {
    this.config = this.loadConfiguration();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): LyricConfig {
    if (!LyricConfig.instance) {
      LyricConfig.instance = new LyricConfig();
    }
    return LyricConfig.instance;
  }

  /**
   * Load configuration from environment variables with fallbacks
   */
  private loadConfiguration(): LyricServiceConfig {
    return {
      openAI: {
        model: process.env.LYRIC_AI_MODEL || 'grok-3',
        temperature: parseFloat(process.env.LYRIC_AI_TEMPERATURE || '0.85'),
        maxTokens: parseInt(process.env.LYRIC_AI_MAX_TOKENS || '200'),
        frequencyPenalty: parseFloat(process.env.LYRIC_AI_FREQUENCY_PENALTY || '0.6'),
        presencePenalty: parseFloat(process.env.LYRIC_AI_PRESENCE_PENALTY || '0.5'),
        retryAttempts: parseInt(process.env.LYRIC_AI_RETRY_ATTEMPTS || '3'),
        retryDelay: parseInt(process.env.LYRIC_AI_RETRY_DELAY || '2000')
      },
      api: {
        timeoutMs: parseInt(process.env.LYRIC_API_TIMEOUT || '10000'),
        cacheTTLSeconds: parseInt(process.env.LYRIC_CACHE_TTL || '3600'),
        maxConcurrentCalls: parseInt(process.env.LYRIC_MAX_CONCURRENT_CALLS || '5')
      },
      generation: {
        maxWordCount: parseInt(process.env.LYRIC_MAX_WORD_COUNT || '50'),
        minWordCount: parseInt(process.env.LYRIC_MIN_WORD_COUNT || '4'),
        maxRetries: parseInt(process.env.LYRIC_MAX_RETRIES || '3')
      }
    };
  }

  /**
   * Get the full configuration
   */
  getConfig(): LyricServiceConfig {
    return this.config;
  }

  /**
   * Get OpenAI configuration
   */
  getOpenAIConfig() {
    return this.config.openAI;
  }

  /**
   * Get API configuration
   */
  getAPIConfig() {
    return this.config.api;
  }

  /**
   * Get generation configuration
   */
  getGenerationConfig() {
    return this.config.generation;
  }

  /**
   * Update configuration (useful for testing)
   */
  updateConfig(updates: Partial<LyricServiceConfig>) {
    this.config = {
      ...this.config,
      ...updates,
      openAI: {
        ...this.config.openAI,
        ...(updates.openAI || {})
      },
      api: {
        ...this.config.api,
        ...(updates.api || {})
      },
      generation: {
        ...this.config.generation,
        ...(updates.generation || {})
      }
    };
  }

  /**
   * Reset to default configuration
   */
  reset() {
    this.config = this.loadConfiguration();
  }
}

// Export singleton instance getter
export const getLyricConfig = () => LyricConfig.getInstance();

// Genre-specific configurations
export const GENRE_CONFIG: {
  seeds: Record<string, string[]>;
  emotions: Record<string, string[]>;
  moods: Record<string, string[]>;
  themes: Record<string, string[]>;
} = {
  seeds: {
    rock: ['electric', 'loud', 'rebel', 'guitar', 'anthem', 'power'],
    pop: ['catchy', 'bright', 'dance', 'radio', 'summer', 'love'],
    country: ['home', 'road', 'heart', 'whiskey', 'truck', 'sunset'],
    'hip-hop': ['street', 'real', 'flow', 'truth', 'hustle', 'rise'],
    indie: ['dream', 'youth', 'city', 'night', 'strange', 'wonder'],
    folk: ['story', 'wood', 'river', 'home', 'journey', 'simple'],
    metal: ['power', 'dark', 'rage', 'storm', 'iron', 'chaos'],
    electronic: ['pulse', 'light', 'wave', 'future', 'neon', 'digital'],
    'jam band': ['groove', 'cosmic', 'journey', 'festival', 'flow', 'vibe'],
    default: ['music', 'song', 'melody', 'rhythm', 'sound', 'beat']
  },
  emotions: {
    rock: ['anger', 'freedom', 'passion', 'rebellion', 'energy'],
    pop: ['love', 'joy', 'desire', 'excitement', 'happiness'],
    country: ['heartbreak', 'nostalgia', 'pride', 'longing', 'comfort'],
    'hip-hop': ['struggle', 'success', 'respect', 'ambition', 'pride'],
    indie: ['longing', 'wonder', 'melancholy', 'curiosity', 'introspection'],
    folk: ['wisdom', 'peace', 'memory', 'reflection', 'warmth'],
    metal: ['fury', 'power', 'darkness', 'chaos', 'strength'],
    electronic: ['euphoria', 'energy', 'transcendence', 'journey', 'pulse'],
    'jam band': ['bliss', 'unity', 'exploration', 'freedom', 'consciousness'],
    default: ['love', 'hope', 'dream', 'feel', 'life']
  },
  moods: {
    rock: ['energetic', 'rebellious', 'powerful', 'intense', 'raw'],
    pop: ['upbeat', 'romantic', 'fun', 'bright', 'catchy'],
    country: ['heartfelt', 'nostalgic', 'honest', 'warm', 'authentic'],
    'hip-hop': ['confident', 'raw', 'authentic', 'intense', 'rhythmic'],
    indie: ['dreamy', 'introspective', 'alternative', 'mellow', 'quirky'],
    folk: ['acoustic', 'storytelling', 'traditional', 'gentle', 'earthy'],
    metal: ['aggressive', 'intense', 'heavy', 'dark', 'powerful'],
    electronic: ['atmospheric', 'rhythmic', 'futuristic', 'hypnotic', 'pulsing'],
    'jam band': ['psychedelic', 'improvisational', 'groovy', 'expansive', 'fluid'],
    default: ['emotional', 'expressive', 'moving', 'dynamic', 'engaging']
  },
  themes: {
    rock: ['rebellion', 'youth', 'freedom', 'power', 'change'],
    pop: ['love', 'dreams', 'celebration', 'relationships', 'fun'],
    country: ['home', 'loss', 'tradition', 'family', 'america'],
    'hip-hop': ['struggle', 'identity', 'triumph', 'street', 'reality'],
    indie: ['solitude', 'discovery', 'change', 'youth', 'alienation'],
    folk: ['nature', 'wisdom', 'journey', 'community', 'heritage'],
    metal: ['chaos', 'power', 'darkness', 'war', 'mythology'],
    electronic: ['future', 'technology', 'transformation', 'night', 'space'],
    'jam band': ['consciousness', 'universe', 'community', 'journey', 'nature'],
    default: ['life', 'love', 'time', 'change', 'dreams']
  }
};

// Word validation configuration
export const WORD_VALIDATION_CONFIG: {
  minLength: number;
  maxLength: number;
  excludePatterns: RegExp[];
  excludeCommonWords: string[];
  imageryKeywords: string[];
} = {
  minLength: 2,
  maxLength: 15,
  excludePatterns: [
    /^\d+$/,           // Numbers only
    /[^a-z'-]/i,       // Non-alphabetic except apostrophe and hyphen
  ],
  excludeCommonWords: [
    'the', 'and', 'but', 'for', 'are', 'was', 'were', 
    'been', 'have', 'has', 'had', 'does', 'did', 'will',
    'would', 'could', 'should', 'may', 'might', 'must',
    'shall', 'can', 'could', 'a', 'an', 'as', 'at', 'be',
    'by', 'do', 'if', 'in', 'is', 'it', 'of', 'on', 'or',
    'so', 'to', 'up', 'we', 'he', 'she', 'they', 'you'
  ],
  imageryKeywords: [
    'sun', 'moon', 'star', 'sky', 'cloud', 'rain', 'storm',
    'fire', 'water', 'earth', 'wind', 'stone', 'mountain',
    'tree', 'flower', 'rose', 'ocean', 'river', 'wave',
    'light', 'dark', 'shadow', 'bright', 'color', 'gold',
    'silver', 'crystal', 'diamond', 'night', 'day', 'dawn',
    'sunset', 'sunrise', 'horizon', 'desert', 'forest'
  ]
};

// Cache configuration
export const CACHE_CONFIG = {
  apiContext: {
    ttlSeconds: 3600,      // 1 hour
    maxEntries: 100
  },
  genreSeeds: {
    ttlSeconds: 86400,     // 24 hours
    maxEntries: 50
  },
  lyricGeneration: {
    ttlSeconds: 1800,      // 30 minutes
    maxEntries: 200
  },
  cleanupIntervalMs: 60000 // 1 minute
};

// Performance thresholds
export const PERFORMANCE_THRESHOLDS = {
  healthy: {
    successRate: 80,       // >= 80% success rate
    averageResponseMs: 5000 // <= 5 seconds
  },
  degraded: {
    successRate: 50,       // >= 50% success rate
    averageResponseMs: 10000 // <= 10 seconds
  }
};