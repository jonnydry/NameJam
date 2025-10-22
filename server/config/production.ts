/**
 * Production configuration and optimizations
 */

// Disable console statements in production
if (process.env.NODE_ENV === 'production') {
  // Override console methods
  console.log = () => {};
  console.debug = () => {};
  console.info = () => {};
  console.warn = () => {};
  // Keep console.error for critical errors only
}

// Production configuration
export const productionConfig = {
  // API rate limits
  rateLimits: {
    general: { windowMs: 15 * 60 * 1000, max: 100 }, // 100 req/15min
    generation: { windowMs: 10 * 60 * 1000, max: 30 }, // 30 req/10min
    auth: { windowMs: 15 * 60 * 1000, max: 10 }, // 10 req/15min
  },
  
  // Cache configuration
  cache: {
    verificationTTL: 3600, // 1 hour
    generationTTL: 600, // 10 minutes
    maxCacheSize: 1000, // Maximum items in cache
  },
  
  // API timeouts
  apiTimeouts: {
    spotify: 15000, // 15 seconds
    datamuse: 15000,
    conceptnet: 15000,
    xai: 20000, // 20 seconds for AI
  },
  
  // Security headers
  security: {
    hsts: true,
    contentSecurityPolicy: true,
    xssProtection: true,
    noSniff: true,
    frameGuard: 'deny',
  },
  
  // Database pooling
  database: {
    connectionLimit: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
  
  // Error tracking
  errorTracking: {
    enabled: true,
    sampleRate: 0.1, // Sample 10% of transactions
  }
};

// Initialize production optimizations
export function initializeProduction() {
  // Set process title for monitoring
  process.title = 'namejam-server';
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // Gracefully shutdown
    process.exit(1);
  });
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });
  
  // Memory optimization - run garbage collection periodically
  if (global.gc) {
    setInterval(() => {
      if (global.gc) {
        global.gc();
      }
    }, 60000); // Every minute
  }
}