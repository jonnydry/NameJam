/**
 * Constants for name generation services
 */

// Generation counts
export const DEFAULT_GENERATION_COUNT = 4;
export const AI_GENERATION_SPLIT = 0.5; // 50% of names from AI

// Retry logic constants
export const AI_RETRY_MULTIPLIER = 3; // Generate up to 3x more candidates if needed
export const DATAMUSE_RETRY_MULTIPLIER = 4; // Generate up to 4x more candidates if needed
export const BATCH_GENERATION_MULTIPLIER = 2; // Generate 2x in parallel for each batch

// Context and filtering
export const MAX_CONTEXT_EXAMPLES = 15; // Maximum context examples from APIs
export const MIN_WORD_LENGTH_FOR_CONTEXT = 2; // Minimum word length for context examples

// Cache timeouts (in milliseconds)
export const WORD_SOURCE_CACHE_TIMEOUT = 15 * 60 * 1000; // 15 minutes
export const CONCEPT_CACHE_TIMEOUT = 30 * 60 * 1000; // 30 minutes

// Word filtering timeouts (in milliseconds)
export const VERY_RECENT_WORD_TIMEOUT = 2 * 60 * 1000; // 2 minutes
export const RECENT_WORD_TIMEOUT = 10 * 60 * 1000; // 10 minutes
export const WORD_MEMORY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

// Quality thresholds
export const DEFAULT_QUALITY_SCORE = 0.75;

// Word tracking limits
export const MAX_RECENT_WORDS_AI = 30;
export const MAX_RECENT_WORDS_FILTER = 150;