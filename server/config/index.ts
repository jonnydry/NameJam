/**
 * Centralized Configuration System
 * Replaces hard-coded values throughout the application
 */

export const config = {
  generation: {
    defaultCount: 4,
    maxCount: 10,
    defaultTemperature: 0.8,
    maxTimeout: 30000,
    cacheDefaults: {
      contextTTL: 30 * 60 * 1000, // 30 minutes
      phoneticTTL: 2 * 60 * 60 * 1000, // 2 hours
      apiContextTTL: 30 * 60 * 1000, // 30 minutes
      genreSeedTTL: 60 * 60 * 1000, // 1 hour
      lyricGenerationTTL: 30 * 60 * 1000 // 30 minutes
    },
    strategies: {
      SPEED: {
        contextDepth: 'minimal',
        useAI: true,
        cacheTimeout: 30 * 60 * 1000,
        maxResponseTime: 5000,
        enableVarietyOptimizations: false
      },
      BALANCED: {
        contextDepth: 'moderate',
        useAI: true,
        cacheTimeout: 15 * 60 * 1000,
        maxResponseTime: 10000,
        enableVarietyOptimizations: true
      },
      QUALITY: {
        contextDepth: 'comprehensive',
        useAI: true,
        cacheTimeout: 10 * 60 * 1000,
        maxResponseTime: 15000,
        enableVarietyOptimizations: true
      }
    }
  },
  api: {
    openai: {
      poolSize: 5,
      timeout: 15000,
      retries: 3,
      connectionTimeout: 30000,
      requestTimeout: 15000
    },
    spotify: {
      timeout: 8000,
      retries: 2
    },
    datamuse: {
      timeout: 8000,
      retries: 2
    },
    itunes: {
      timeout: 10000,
      retries: 2
    },
    bandcamp: {
      timeout: 12000,
      retries: 2
    },
    soundcloud: {
      timeout: 10000,
      retries: 2
    }
  },
  performance: {
    enableStreaming: false,
    enableRequestDedup: true,
    dedupWindowMs: 500,
    cacheTtlMs: 2000,
    enableConnectionPooling: true,
    enableAsyncDbWrites: true,
    enableQualityRanking: true,
    enableSessionPersistence: true
  },
  cache: {
    defaultTTL: 1800, // 30 minutes
    maxSize: 1000,
    cleanupInterval: 5 * 60 * 1000, // 5 minutes
    sessionTTL: 600, // 10 minutes
    phoneticCacheSize: 10000,
    phoneticCacheTTL: 7200 // 2 hours
  },
  quality: {
    defaultThreshold: 0.65,
    thresholds: {
      'very-high': 0.85,
      'high': 0.75,
      'medium': 0.65,
      'low': 0.55,
      'very-low': 0.45
    },
    rankingModes: {
      'creative-first': 'Prioritizes creativity and uniqueness',
      'market-focused': 'Prioritizes commercial appeal',
      'genre-optimized': 'Optimizes for specific genre conventions',
      'balanced': 'Balances all quality factors'
    }
  },
  security: {
    csrfTokenExpiry: 24 * 60 * 60 * 1000, // 24 hours
    sessionSecretRotationInterval: 24 * 60 * 60 * 1000, // 24 hours
    maxRequestSize: 1024 * 1024, // 1MB
    rateLimitWindow: 15 * 60 * 1000, // 15 minutes
    rateLimitMax: 100
  },
  monitoring: {
    enableMetrics: true,
    metricsInterval: 60 * 1000, // 1 minute
    enableHealthChecks: true,
    healthCheckInterval: 30 * 1000, // 30 seconds
    enablePerformanceTracking: true
  }
} as const;

export type Config = typeof config;
export type GenerationConfig = typeof config.generation;
export type APIConfig = typeof config.api;
export type PerformanceConfig = typeof config.performance;
export type CacheConfig = typeof config.cache;
export type QualityConfig = typeof config.quality;
export type SecurityConfig = typeof config.security;
export type MonitoringConfig = typeof config.monitoring;
