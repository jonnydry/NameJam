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