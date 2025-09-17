import { EnhancedWordSource } from './types';
import { isPoeticWord, isProblematicWord } from './wordValidation';
import { singularize, capitalize, getRandomWord, isBandName, selectUniqueWords } from './stringUtils';

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
  
  // Prepare enhanced word sources
  let enhancedAdjectives = [...sources.adjectives.slice(0, 20), ...fallbackAdjectives];
  let enhancedNouns = [...sources.nouns.slice(0, 20), ...fallbackNouns];  
  let enhancedVerbs = [...sources.verbs.slice(0, 10), ...fallbackVerbs];
  
  // Include poetry context if available
  if (poetryContext && poetryContext.length > 0) {
    const poeticWords = poetryContext.filter(w => w && w.length > 2 && w.length < 12);
    enhancedAdjectives.unshift(...poeticWords.filter(w => isAdjectiveLike(w)));
    enhancedNouns.unshift(...poeticWords.filter(w => isNounLike(w)));
    enhancedVerbs.unshift(...poeticWords.filter(w => isVerbLike(w)));
  }
  
  // OPTIMIZED: Use pre-filtered selection instead of retry loops
  const wordArrays = [
    enhancedAdjectives,
    enhancedNouns,
    enhancedVerbs
  ];
  
  // First try to select unique words efficiently
  let selectedWords = selectUniqueWords(wordArrays, wordCount);
  
  // Handle special patterns for better quality
  if (selectedWords.length >= wordCount) {
    // Sometimes start with "The" for longer names
    if (wordCount > 2 && Math.random() > 0.7) {
      selectedWords[0] = 'The';
    }
    
    // Apply smart ordering: adjectives before nouns when possible
    const reorderedWords: string[] = [];
    const adjectives: string[] = [];
    const nouns: string[] = [];
    const others: string[] = [];
    
    selectedWords.forEach(word => {
      if (word === 'The') {
        reorderedWords.push(word); // Keep 'The' at the beginning
      } else if (isAdjectiveLike(word)) {
        adjectives.push(word);
      } else if (isNounLike(word)) {
        nouns.push(word);
      } else {
        others.push(word);
      }
    });
    
    // Smart reordering: The -> adjectives -> nouns -> others
    const orderedWords = [
      ...reorderedWords, // 'The' if present
      ...adjectives.slice(0, Math.ceil(wordCount / 3)),
      ...nouns.slice(0, Math.ceil(wordCount / 2)), 
      ...others
    ].slice(0, wordCount);
    
    // If we have enough well-ordered words, use them
    if (orderedWords.length >= wordCount) {
      return orderedWords.map(word => capitalize(word)).join(' ');
    }
  }
  
  // Graceful degradation: if we couldn't get enough unique words
  const finalFallbacks = ['Echo', 'Dream', 'Fire', 'Soul', 'Heart', 'Storm', 'Light', 'Shadow'];
  while (selectedWords.length < wordCount) {
    const fallback = finalFallbacks[selectedWords.length % finalFallbacks.length];
    selectedWords.push(fallback);
  }
  
  return selectedWords.slice(0, wordCount).map(word => capitalize(word)).join(' ');
}