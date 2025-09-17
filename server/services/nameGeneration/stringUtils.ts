import { isPoeticWord, isProblematicWord } from './wordValidation';

/**
 * String utility functions for name generation
 * Extracted to avoid circular dependencies between components
 */

export function singularize(word: string): string {
  if (!word) return word;
  
  // Common irregular plurals
  const irregulars: Record<string, string> = {
    'men': 'man',
    'women': 'woman',
    'children': 'child',
    'teeth': 'tooth',
    'feet': 'foot',
    'mice': 'mouse',
    'geese': 'goose',
    'oxen': 'ox',
    'people': 'person',
    'alumni': 'alumnus',
    'criteria': 'criterion',
    'phenomena': 'phenomenon',
    'data': 'datum',
    'media': 'medium',
    'analyses': 'analysis',
    'theses': 'thesis',
    'crises': 'crisis',
    'vertices': 'vertex',
    'matrices': 'matrix',
    'indices': 'index',
    'appendices': 'appendix',
    'formulae': 'formula',
    'bureaux': 'bureau',
    'larvae': 'larva',
    'nebulae': 'nebula',
    'vertebrae': 'vertebra',
    'radii': 'radius',
    'fungi': 'fungus',
    'cacti': 'cactus',
    'nuclei': 'nucleus',
    'syllabi': 'syllabus',
    'foci': 'focus',
    'termini': 'terminus',
    'vita': 'vitae',
  };
  
  if (irregulars[word.toLowerCase()]) {
    return word.charAt(0) === word.charAt(0).toUpperCase() 
      ? capitalize(irregulars[word.toLowerCase()])
      : irregulars[word.toLowerCase()];
  }
  
  // Regular plural rules
  if (word.endsWith('ies') && word.length > 3) {
    return word.slice(0, -3) + 'y';
  }
  if (word.endsWith('ves')) {
    return word.slice(0, -3) + 'f';
  }
  if (word.endsWith('es') && word.length > 3) {
    return word.slice(0, -2);
  }
  if (word.endsWith('s') && !word.endsWith('ss') && !word.endsWith('us') && 
      !word.endsWith('is') && word.length > 2) {
    return word.slice(0, -1);
  }
  
  return word;
}

export function capitalize(word: string): string {
  if (!word) return '';
  
  // Handle special cases (like contractions)
  if (word.includes("'")) {
    const parts = word.split("'");
    return parts.map((part, index) => {
      if (index === 0) {
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
      }
      return part.toLowerCase();
    }).join("'");
  }
  
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export function isBandName(word: string): boolean {
  const famousBands = [
    'Beatles', 'Stones', 'Zeppelin', 'Floyd', 'Queen', 'Kiss', 'Metallica',
    'Nirvana', 'Pearl', 'Soundgarden', 'Alice', 'Chains', 'Radiohead',
    'Coldplay', 'U2', 'Oasis', 'Blur', 'Gorillaz', 'Strokes', 'Killers',
    'Arctic', 'Monkeys', 'Muse', 'Tool', 'Deftones', 'Korn', 'Slipknot',
    'Ramones', 'Clash', 'Pistols', 'Maiden', 'Priest', 'Sabbath', 'Purple',
    'Doors', 'Beach', 'Boys', 'Kinks', 'Cream', 'Traffic', 'Yes', 'Genesis',
    'Floyd', 'Crimson', 'Rush', 'Boston', 'Kansas', 'Chicago', 'Eagles',
    'Fleetwood', 'Mac', 'Heart', 'Journey', 'Foreigner', 'Styx', 'Reo',
    'Speedwagon', 'Survivor', 'Toto', 'Asia', 'Police', 'Sting', 'Dire',
    'Straits', 'Duran', 'Spandau', 'Ballet', 'Tears', 'Fears', 'Depeche',
    'Mode', 'Order', 'Smiths', 'Cure', 'Joy', 'Division', 'Bauhaus',
    'Siouxsie', 'Banshees', 'Echo', 'Bunnymen', 'Heads', 'Blondie',
    'Pretenders', 'Chili', 'Peppers', 'Jane', 'Addiction', 'Pumpkins',
    'Hole', 'Bush', 'Garbage', 'Verve', 'Suede', 'Pulp', 'Kasabian'
  ];
  
  return famousBands.some(band => word.toLowerCase().includes(band.toLowerCase()));
}

export function getRandomWord(wordArray: string[]): string | null {
  if (!wordArray || wordArray.length === 0) return null;
  
  // Arrays are now pre-filtered, just select randomly
  return wordArray[Math.floor(Math.random() * wordArray.length)];
}

// Legacy function that applies filtering (kept for backward compatibility)
export function getRandomWordWithFiltering(wordArray: string[]): string | null {
  if (!wordArray || wordArray.length === 0) return null;
  
  const validWords = wordArray.filter(word => 
    word && 
    word.length > 2 && 
    !isBandName(word) && 
    isPoeticWord(word) &&
    !isProblematicWord(word)
  );
  
  if (validWords.length === 0) return null;
  
  return validWords[Math.floor(Math.random() * validWords.length)];
}

// Performance-optimized word selection with length constraints
export function getRandomWordByLength(
  wordArray: string[], 
  minLength?: number, 
  maxLength?: number
): string | null {
  if (!wordArray || wordArray.length === 0) return null;
  
  // If no length constraints, use pre-filtered array directly
  if (!minLength && !maxLength) {
    return getRandomWord(wordArray);
  }
  
  // Apply length filtering on pre-filtered array (much smaller set)
  const lengthFiltered = wordArray.filter(word => {
    if (minLength && word.length < minLength) return false;
    if (maxLength && word.length > maxLength) return false;
    return true;
  });
  
  if (lengthFiltered.length === 0) return null;
  
  return lengthFiltered[Math.floor(Math.random() * lengthFiltered.length)];
}

/**
 * Efficiently samples multiple unique words from an array without replacement
 * This replaces inefficient while-loop retry patterns
 */
export function sampleWithoutReplacement<T>(
  array: T[], 
  count: number, 
  filter?: (item: T) => boolean
): T[] {
  if (!array || array.length === 0) return [];
  
  // Apply filter first if provided
  let filteredArray = filter ? array.filter(filter) : [...array];
  
  // If we need more items than available, return what we can
  const actualCount = Math.min(count, filteredArray.length);
  if (actualCount === 0) return [];
  
  // For small arrays or when we need most/all items, use Fisher-Yates shuffle approach
  if (actualCount > filteredArray.length * 0.5) {
    // Shuffle the entire array and take first N items
    const shuffled = [...filteredArray];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, actualCount);
  }
  
  // For larger arrays where we need only a few items, use reservoir sampling
  const result: T[] = [];
  const used = new Set<number>();
  
  while (result.length < actualCount && used.size < filteredArray.length) {
    const index = Math.floor(Math.random() * filteredArray.length);
    if (!used.has(index)) {
      used.add(index);
      result.push(filteredArray[index]);
    }
  }
  
  return result;
}

/**
 * Circuit breaker for retry operations to prevent infinite loops
 */
export interface RetryOptions {
  maxAttempts?: number;
  backoffMs?: number;
  onFailure?: (attempt: number, error?: any) => void;
}

export class RetryCircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private readonly maxFailures: number;
  private readonly cooldownMs: number;

  constructor(maxFailures = 3, cooldownMs = 1000) {
    this.maxFailures = maxFailures;
    this.cooldownMs = cooldownMs;
  }

  isOpen(): boolean {
    if (this.failures >= this.maxFailures) {
      const timeSinceFailure = Date.now() - this.lastFailureTime;
      if (timeSinceFailure < this.cooldownMs) {
        return true; // Circuit is open
      }
      // Reset after cooldown
      this.failures = 0;
    }
    return false; // Circuit is closed
  }

  recordSuccess(): void {
    this.failures = 0;
  }

  recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
  }

  async attempt<T>(
    operation: () => T | Promise<T>,
    fallback: () => T | Promise<T>
  ): Promise<T> {
    if (this.isOpen()) {
      return await fallback();
    }

    try {
      const result = await operation();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      return await fallback();
    }
  }
}

/**
 * Optimized word selection with automatic fallback and no retry loops
 */
export function selectUniqueWords(
  wordArrays: string[][], 
  count: number, 
  usedWords?: Set<string>,
  filter?: (word: string) => boolean
): string[] {
  // Combine all word arrays and remove used words
  const allWords = wordArrays
    .flat()
    .filter(word => {
      if (!word || word.length < 2) return false;
      if (usedWords && usedWords.has(word.toLowerCase())) return false;
      if (filter && !filter(word)) return false;
      return true;
    });

  // Remove duplicates while preserving order preference
  const uniqueWords: string[] = [];
  const seen = new Set<string>();
  
  for (const word of allWords) {
    const key = word.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      uniqueWords.push(word);
    }
  }

  // Use efficient sampling
  return sampleWithoutReplacement(uniqueWords, count);
}

/**
 * Performance metrics for tracking deduplication efficiency
 */
interface DeduplicationMetrics {
  originalCount: number;
  deduplicatedCount: number;
  duplicatesRemoved: number;
  processingTimeMs: number;
  method: string;
}

/**
 * High-performance centralized word array deduplication utility
 * Replaces inefficient O(n²) indexOf operations with O(n) Set-based deduplication
 */
export function deduplicateWordArrays(options: {
  // Main processing options
  arrays: string[][]; // Individual arrays to deduplicate separately
  combinedArray?: string[]; // Single array to deduplicate
  preserveOrder?: boolean; // Whether to maintain original order (default: true)
  caseInsensitive?: boolean; // Whether to treat words case-insensitively (default: true)
  
  // Filtering options
  minLength?: number;
  maxLength?: number;
  customFilter?: (word: string) => boolean;
  
  // Performance options
  enableMetrics?: boolean; // Whether to collect performance metrics
  batchSize?: number; // For very large arrays, process in batches
}): {
  deduplicatedArrays?: string[][]; // Results for arrays parameter
  deduplicatedArray?: string[]; // Result for combinedArray parameter
  metrics?: DeduplicationMetrics;
} {
  const startTime = performance.now();
  const { 
    arrays, 
    combinedArray, 
    preserveOrder = true, 
    caseInsensitive = true,
    minLength,
    maxLength,
    customFilter,
    enableMetrics = false,
    batchSize = 10000
  } = options;

  let totalOriginalCount = 0;
  let totalDeduplicatedCount = 0;

  // Helper function for efficient deduplication of a single array
  const deduplicateSingleArray = (array: string[]): string[] => {
    if (!array || array.length === 0) return [];
    
    totalOriginalCount += array.length;
    
    // Pre-filter invalid entries
    const validWords = array.filter(word => {
      if (!word || typeof word !== 'string') return false;
      const trimmed = word.trim();
      if (trimmed.length === 0) return false;
      if (minLength && trimmed.length < minLength) return false;
      if (maxLength && trimmed.length > maxLength) return false;
      if (customFilter && !customFilter(trimmed)) return false;
      return true;
    });

    // For very large arrays, use batch processing
    if (validWords.length > batchSize && !preserveOrder) {
      // Use Set approach for maximum performance when order doesn't matter
      const uniqueSet = new Set(
        caseInsensitive 
          ? validWords.map(w => w.toLowerCase()) 
          : validWords
      );
      const result = Array.from(uniqueSet);
      totalDeduplicatedCount += result.length;
      return result;
    }

    // Standard order-preserving deduplication
    const seen = new Set<string>();
    const deduplicated: string[] = [];

    for (const word of validWords) {
      const key = caseInsensitive ? word.toLowerCase() : word;
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(word);
      }
    }

    totalDeduplicatedCount += deduplicated.length;
    return deduplicated;
  };

  let deduplicatedArrays: string[][] | undefined;
  let deduplicatedArray: string[] | undefined;

  // Process individual arrays
  if (arrays && arrays.length > 0) {
    deduplicatedArrays = arrays.map(array => deduplicateSingleArray(array));
  }

  // Process combined array
  if (combinedArray) {
    deduplicatedArray = deduplicateSingleArray(combinedArray);
  }

  const endTime = performance.now();
  const processingTimeMs = endTime - startTime;
  
  // Generate metrics if requested
  let metrics: DeduplicationMetrics | undefined;
  if (enableMetrics) {
    metrics = {
      originalCount: totalOriginalCount,
      deduplicatedCount: totalDeduplicatedCount,
      duplicatesRemoved: totalOriginalCount - totalDeduplicatedCount,
      processingTimeMs,
      method: 'set_based_optimized'
    };
  }

  return {
    deduplicatedArrays,
    deduplicatedArray,
    metrics
  };
}

/**
 * Convenient wrapper for deduplicating a single array
 * Optimized replacement for the inefficient indexOf approach
 */
export function deduplicateArray(
  array: string[], 
  caseInsensitive = true, 
  preserveOrder = true
): string[] {
  const result = deduplicateWordArrays({
    combinedArray: array,
    caseInsensitive,
    preserveOrder,
    enableMetrics: false
  });
  
  return result.deduplicatedArray || [];
}

/**
 * Efficient bulk deduplication for multiple arrays at once
 * Replaces multiple separate deduplication calls
 */
export function deduplicateMultipleArrays(
  arrays: string[][], 
  options?: {
    caseInsensitive?: boolean;
    preserveOrder?: boolean;
    enableMetrics?: boolean;
  }
): { arrays: string[][]; metrics?: DeduplicationMetrics } {
  const result = deduplicateWordArrays({
    arrays,
    caseInsensitive: options?.caseInsensitive ?? true,
    preserveOrder: options?.preserveOrder ?? true,
    enableMetrics: options?.enableMetrics ?? false
  });
  
  return {
    arrays: result.deduplicatedArrays || [],
    metrics: result.metrics
  };
}