import { 
  WORD_VALIDATION_PATTERNS, 
  UTILITY_PATTERNS, 
  PatternTester 
} from './regexConstants';

export function isPoeticWord(word: string): boolean {
  if (!word || word.length < 3) return false;
  
  // Basic quality filters (using precompiled patterns)
  if (word.includes('_') || word.includes('-')) return false;
  if (WORD_VALIDATION_PATTERNS.ONLY_DIGITS.test(word)) return false;
  if (word.length > 15) return false;
  
  // Skip common unpoetic words
  const unpoetic = [
    'data', 'system', 'user', 'file', 'test', 'admin', 'config',
    'error', 'null', 'undefined', 'function', 'object', 'array',
    'string', 'number', 'boolean', 'default', 'example', 'sample',
    'temp', 'tmp', 'var', 'const', 'let', 'this', 'that', 'which',
    'mgmt', 'misc', 'util', 'src', 'dst', 'ref', 'ptr', 'idx'
  ];
  
  if (unpoetic.includes(word.toLowerCase())) return false;
  
  // Word patterns that are typically poetic (using precompiled pattern)
  if (WORD_VALIDATION_PATTERNS.POETIC_SUFFIXES.test(word.toLowerCase())) {
    return true;
  }
  
  // Common poetic words
  const poeticWords = [
    'shadow', 'light', 'dark', 'bright', 'soul', 'heart', 'mind',
    'dream', 'night', 'day', 'sun', 'moon', 'star', 'sky', 'earth',
    'fire', 'water', 'wind', 'stone', 'metal', 'gold', 'silver',
    'red', 'blue', 'black', 'white', 'green', 'purple', 'grey',
    'love', 'hate', 'fear', 'hope', 'joy', 'pain', 'peace', 'rage',
    'time', 'space', 'void', 'chaos', 'order', 'life', 'death'
  ];
  
  if (poeticWords.includes(word.toLowerCase())) return true;
  
  // Default to accepting words that pass basic filters
  return true;
}

export function isProblematicWord(word: string): boolean {
  if (!word) return true;
  
  // Scientific/technical terms that don't fit music
  const problematicWords = [
    'electron', 'proton', 'neutron', 'molecule', 'atom', 'particle',
    'quantum', 'radiation', 'isotope', 'enzyme', 'protein', 'bacteria',
    'coefficient', 'algorithm', 'database', 'interface', 'protocol',
    'bandwidth', 'megabyte', 'kilobyte', 'binary', 'decimal', 'hexadecimal',
    'configure', 'initialize', 'parameter', 'variable', 'constant',
    'compile', 'execute', 'debug', 'optimize', 'validate', 'authenticate',
    // Added based on poor results
    'telescope', 'magnitude', 'dwarf', 'gown', 'channel', 'ships', 
    'state', 'brick', 'ridges', 'fairies', 'reaver', 'cortex',
    'matrix', 'vector', 'scalar', 'tensor', 'gradient', 'derivative',
    'integral', 'polynomial', 'exponential', 'logarithm', 'factorial',
    'permutation', 'combination', 'probability', 'statistics'
  ];
  
  return problematicWords.includes(word.toLowerCase());
}

export function cleanWord(word: string): string {
  return word.trim().toLowerCase().replace(WORD_VALIDATION_PATTERNS.NON_ALPHABETIC, '');
}

export function isValidWordLength(word: string, minLength: number = 3, maxLength: number = 15): boolean {
  return word.length >= minLength && word.length <= maxLength;
}

export function hasValidCharacters(word: string): boolean {
  return WORD_VALIDATION_PATTERNS.VALID_CHARACTERS.test(word);
}

export function isNotCommonWord(word: string): boolean {
  const commonWords = ['the', 'and', 'or', 'but', 'for', 'to', 'in', 'on', 'at', 'by'];
  return !commonWords.includes(word.toLowerCase());
}