export function isPoeticWord(word: string): boolean {
  if (!word || word.length < 3) return false;
  
  // Basic quality filters
  if (word.includes('_') || word.includes('-')) return false;
  if (/^\d+$/.test(word)) return false;
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
  
  // Word patterns that are typically poetic
  const poeticPatterns = [
    /^.*ness$/, // darkness, brightness
    /^.*less$/, // endless, fearless
    /^.*ful$/, // beautiful, powerful
    /^.*ing$/, // floating, burning
    /^.*ly$/, // softly, quickly
    /^.*ous$/, // mysterious, glorious
    /^.*ent$/, // ancient, silent
    /^.*ant$/, // distant, brilliant
    /^.*ive$/, // massive, creative
    /^.*ic$/, // magic, cosmic
  ];
  
  for (const pattern of poeticPatterns) {
    if (pattern.test(word.toLowerCase())) return true;
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
  return word.trim().toLowerCase().replace(/[^a-z]/g, '');
}

export function isValidWordLength(word: string, minLength: number = 3, maxLength: number = 15): boolean {
  return word.length >= minLength && word.length <= maxLength;
}

export function hasValidCharacters(word: string): boolean {
  return /^[a-zA-Z]+$/.test(word);
}

export function isNotCommonWord(word: string): boolean {
  const commonWords = ['the', 'and', 'or', 'but', 'for', 'to', 'in', 'on', 'at', 'by'];
  return !commonWords.includes(word.toLowerCase());
}