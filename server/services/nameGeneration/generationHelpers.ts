import { EnhancedWordSource } from './types';
import { isPoeticWord, isProblematicWord } from './wordValidation';
import { singularize, capitalize, getRandomWord, isBandName } from './stringUtils';

// Note: singularize, capitalize, getRandomWord, and isBandName are now imported from stringUtils
// This file focuses on higher-level generation logic



export function isLikelyAdjective(word: string): boolean {
  const adjectiveEndings = ['y', 'ly', 'ful', 'less', 'ous', 'ive', 'able', 'ible', 'al', 'ic', 'ed', 'ing'];
  return adjectiveEndings.some(ending => word.endsWith(ending));
}

export function isLikelyVerb(word: string): boolean {
  const verbEndings = ['s', 'ed', 'ing', 'en', 'es'];
  return verbEndings.some(ending => word.endsWith(ending));
}



export function isGenreAppropriate(word: string, genre: string): boolean {
  const inappropriateWords: Record<string, string[]> = {
    'jazz': ['cyber', 'digital', 'neon', 'electric', 'metallic'],
    'classical': ['street', 'urban', 'neon', 'digital', 'cyber'],
    'folk': ['cyber', 'digital', 'neon', 'synthetic', 'electronic'],
    'country': ['cyber', 'digital', 'neon', 'synthetic', 'urban'],
    'reggae': ['cyber', 'digital', 'synthetic', 'mechanical'],
    'blues': ['cyber', 'digital', 'neon', 'synthetic'],
  };
  
  if (!inappropriateWords[genre]) return true;
  
  return !inappropriateWords[genre].some(inappropriate => 
    word.toLowerCase().includes(inappropriate)
  );
}

export function createEnhancedWordPool(genreWords: string[], fallbackWords: string[], filter?: (w: string) => boolean): string[] {
  // Start with genre-specific words
  let pool = [...genreWords];
  
  // Add fallback words if we need more
  if (pool.length < 20) {
    pool = [...pool, ...fallbackWords];
  }
  
  // Apply filter if provided
  if (filter) {
    pool = pool.filter(filter);
  }
  
  // Remove duplicates and invalid words
  const uniquePool = [...new Set(pool)].filter(word => 
    word && 
    word.length > 2 && 
    isPoeticWord(word) &&
    !isProblematicWord(word)
  );
  
  return uniquePool;
}

export function isAdjectiveLike(word: string): boolean {
  // Check if the word is likely an adjective based on common patterns
  const adjectivePatterns = [
    /^.*(ly|y|ful|less|ous|ive|able|ible|al|ic|ish|like)$/,
    /^(bright|dark|hot|cold|fast|slow|big|small|tall|short|new|old|good|bad|great)$/i,
    /^(beautiful|ugly|happy|sad|angry|calm|loud|quiet|strong|weak|smart|dumb)$/i
  ];
  
  return adjectivePatterns.some(pattern => pattern.test(word.toLowerCase()));
}

export function isNounLike(word: string): boolean {
  // Check if the word is likely a noun based on common patterns
  const nounPatterns = [
    /^.*(tion|sion|ment|ness|ity|ance|ence|ship|hood|dom|ism|ist|er|or|ar)$/,
    /^(person|place|thing|animal|plant|object|idea|concept|feeling|emotion)$/i
  ];
  
  return nounPatterns.some(pattern => pattern.test(word.toLowerCase()));
}

export function isVerbLike(word: string): boolean {
  // Check if the word is likely a verb based on common patterns
  const verbPatterns = [
    /^.*(ing|ed|es|ize|ify|ate)$/,
    /^(run|walk|jump|sing|dance|fly|swim|write|read|think|feel|love|hate)$/i
  ];
  
  return verbPatterns.some(pattern => pattern.test(word.toLowerCase()));
}

export function generateFallbackName(sources: EnhancedWordSource, wordCount: number, poetryContext?: string[]): string {
  // Note: Poetic flow patterns for 4+ words are now handled by the orchestrator to avoid circular dependencies
  
  // Base fallback words for when all else fails
  const fallbackAdjectives = [
    'Silent', 'Golden', 'Silver', 'Crimson', 'Emerald', 'Shadow', 'Crystal',
    'Velvet', 'Thunder', 'Lightning', 'Storm', 'Fire', 'Ice', 'Steel', 'Iron'
  ];
  
  const fallbackNouns = [
    'Dream', 'Heart', 'Soul', 'Mind', 'Spirit', 'Light', 'Dark', 'Star',
    'Moon', 'Sun', 'Sky', 'Ocean', 'Mountain', 'River', 'Forest', 'Desert'
  ];
  
  const fallbackVerbs = [
    'Rise', 'Fall', 'Dance', 'Sing', 'Fly', 'Run', 'Walk', 'Sleep',
    'Dream', 'Think', 'Feel', 'Know', 'See', 'Hear', 'Touch', 'Breathe'
  ];
  
  // Include poetry context if available
  if (poetryContext && poetryContext.length > 0) {
    const poeticWords = poetryContext.filter(w => w && w.length > 2 && w.length < 12);
    sources.adjectives.unshift(...poeticWords.filter(w => isAdjectiveLike(w)));
    sources.nouns.unshift(...poeticWords.filter(w => isNounLike(w)));
    sources.verbs.unshift(...poeticWords.filter(w => isVerbLike(w)));
  }
  
  const allWords = [
    ...sources.adjectives.slice(0, 20),
    ...sources.nouns.slice(0, 20),
    ...sources.verbs.slice(0, 10),
    ...fallbackAdjectives,
    ...fallbackNouns,
    ...fallbackVerbs
  ];
  
  const words: string[] = [];
  const usedWords = new Set<string>();
  
  // Generate the requested number of words
  for (let i = 0; i < wordCount; i++) {
    let word: string | null = null;
    let attempts = 0;
    
    // Try to get a unique word
    while ((!word || usedWords.has(word.toLowerCase())) && attempts < 50) {
      if (i === 0 && wordCount > 2 && Math.random() > 0.7) {
        // Sometimes start with "The"
        word = 'The';
      } else if (i < wordCount - 1 && isAdjectiveLike(word || '')) {
        // Try to get a noun after an adjective
        word = getRandomWord([...sources.nouns, ...fallbackNouns]);
      } else {
        // Get any word
        word = getRandomWord(allWords);
      }
      attempts++;
    }
    
    if (word) {
      usedWords.add(word.toLowerCase());
      words.push(capitalize(word));
    }
  }
  
  // Fallback if we couldn't generate enough words
  if (words.length < wordCount) {
    const finalFallbacks = ['Echo', 'Dream', 'Fire', 'Soul', 'Heart'];
    while (words.length < wordCount) {
      const fallback = finalFallbacks[words.length % finalFallbacks.length];
      words.push(fallback);
    }
  }
  
  return words.join(' ');
}