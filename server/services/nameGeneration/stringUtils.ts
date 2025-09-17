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