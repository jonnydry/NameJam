/**
 * Environment Variable Validation
 * Validates critical environment variables at startup
 */

export interface EnvConfig {
  DATABASE_URL: string;
  SESSION_SECRET: string;
  XAI_API_KEY: string;
  REPL_ID: string;
  REPLIT_DOMAINS: string;
  NODE_ENV: 'development' | 'production';
  ISSUER_URL?: string;
}

/**
 * Validates and returns environment configuration
 * Throws error if critical variables are missing
 */
export function validateEnvironment(): EnvConfig {
  const requiredVars = [
    'DATABASE_URL',
    'SESSION_SECRET', 
    'XAI_API_KEY',
    'REPL_ID',
    'REPLIT_DOMAINS'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      'Please ensure all required secrets are configured in your Replit environment.'
    );
  }

  // Validate NODE_ENV
  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv !== 'development' && nodeEnv !== 'production') {
    throw new Error('NODE_ENV must be either "development" or "production"');
  }

  // Validate DATABASE_URL format
  if (!process.env.DATABASE_URL?.startsWith('postgres')) {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection string');
  }

  // Validate SESSION_SECRET strength (minimum 32 characters)
  if (process.env.SESSION_SECRET!.length < 32) {
    throw new Error('SESSION_SECRET must be at least 32 characters long');
  }

  // Validate XAI_API_KEY format
  if (!process.env.XAI_API_KEY?.startsWith('xai-')) {
    console.warn('⚠️  XAI_API_KEY may not be in the expected format (should start with "xai-")');
  }

  console.log('✅ Environment validation passed - all critical variables are set');

  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    SESSION_SECRET: process.env.SESSION_SECRET!,
    XAI_API_KEY: process.env.XAI_API_KEY!,
    REPL_ID: process.env.REPL_ID!,
    REPLIT_DOMAINS: process.env.REPLIT_DOMAINS!,
    NODE_ENV: nodeEnv as 'development' | 'production',
    ISSUER_URL: process.env.ISSUER_URL
  };
}

/**
 * Sanitizes environment variables for logging
 * Never logs sensitive values
 */
export function getEnvSummary(): Record<string, string> {
  return {
    NODE_ENV: process.env.NODE_ENV || 'unknown',
    DATABASE_CONFIGURED: process.env.DATABASE_URL ? '✅' : '❌',
    SESSION_SECRET_CONFIGURED: process.env.SESSION_SECRET ? '✅' : '❌',
    XAI_API_KEY_CONFIGURED: process.env.XAI_API_KEY ? '✅' : '❌',
    REPL_ID_CONFIGURED: process.env.REPL_ID ? '✅' : '❌',
    REPLIT_DOMAINS_CONFIGURED: process.env.REPLIT_DOMAINS ? '✅' : '❌'
  };
}