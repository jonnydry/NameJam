// Musical word filtering for better name generation
import { secureLog } from '../../utils/secureLogger';

// Words that should never appear in band/song names
const INAPPROPRIATE_WORDS = new Set([
  // Anatomical terms
  'bosom', 'breast', 'buttock', 'groin', 'loin', 'nipple', 'genital', 'bowel',
  'intestine', 'colon', 'rectum', 'bladder', 'uterus', 'ovary', 'testicle',
  
  // Food items (unless genre-appropriate)
  'meat', 'beef', 'pork', 'chicken', 'turkey', 'bacon', 'sausage', 'ham',
  'cheese', 'butter', 'yogurt', 'custard', 'pudding', 'gravy', 'broth',
  
  // Medical/clinical terms
  'disease', 'syndrome', 'disorder', 'infection', 'inflammation', 'hemorrhoid',
  'diarrhea', 'constipation', 'nausea', 'vomit', 'mucus', 'phlegm', 'pus',
  
  // Awkward/archaic terms
  'hither', 'thither', 'whither', 'yonder', 'betwixt', 'erstwhile', 'heretofore',
  'henceforth', 'wherefore', 'aforesaid', 'notwithstanding', 'inasmuch',
  
  // Overly technical/scientific
  'algorithm', 'parameter', 'variable', 'coefficient', 'derivative', 'integral',
  'polynomial', 'logarithm', 'exponential', 'asymptote', 'orthogonal',
  
  // Random inappropriate
  'moist', 'ooze', 'seep', 'fester', 'suppurate', 'excrete', 'secrete',
  'discharge', 'emit', 'exude', 'perspire', 'sweat', 'belch', 'flatulence'
]);

// Words that are overused in AI-generated names
const CLICHE_WORDS = new Set([
  // Space/cosmic clichés (unless specifically space-themed)
  'lunar', 'solar', 'celestial', 'cosmic', 'galactic', 'astral', 'ethereal',
  'nebula', 'supernova', 'interstellar', 'stellar', 'planetary', 'orbital',
  
  // Fantasy/mystical clichés
  'mystical', 'mythical', 'legendary', 'ancient', 'timeless', 'eternal',
  'enchanted', 'magical', 'arcane', 'supernatural', 'otherworldly',
  
  // Overused descriptors
  'infinite', 'boundless', 'limitless', 'endless', 'immortal', 'divine',
  'ultimate', 'supreme', 'paramount', 'transcendent', 'omnipotent',
  
  // Religious/spiritual clichés
  'sacred', 'holy', 'blessed', 'cursed', 'damned', 'forsaken', 'forbidden',
  'prophetic', 'apocalyptic', 'revelation', 'salvation', 'redemption',
  
  // Fantasy creatures (unless genre-appropriate)
  'dragon', 'phoenix', 'griffin', 'unicorn', 'pegasus', 'chimera', 'hydra',
  'kraken', 'leviathan', 'basilisk', 'minotaur', 'centaur',
  
  // Overused visual descriptors
  'glimmering', 'shimmering', 'glistening', 'gleaming', 'glowing', 'radiant',
  'luminous', 'incandescent', 'iridescent', 'phosphorescent', 'fluorescent',
  
  // Overused motion words
  'dancing', 'floating', 'drifting', 'soaring', 'flying', 'gliding',
  'ascending', 'descending', 'hovering', 'levitating', 'swirling',
  
  // Generic emotional descriptors
  'melancholy', 'euphoric', 'serenity', 'tranquility', 'ecstasy', 'blissful'
]);

// Genre-specific appropriate words
const GENRE_VOCABULARY: Record<string, Set<string>> = {
  rock: new Set(['thunder', 'stone', 'electric', 'rebel', 'storm', 'steel', 'iron', 'rage']),
  indie: new Set(['velvet', 'copper', 'vinyl', 'analog', 'static', 'paper', 'canvas', 'echo']),
  electronic: new Set(['neon', 'digital', 'pulse', 'wave', 'circuit', 'chrome', 'laser', 'synth']),
  hiphop: new Set(['street', 'urban', 'flow', 'rhythm', 'verse', 'cypher', 'block', 'hood']),
  pop: new Set(['sugar', 'honey', 'candy', 'bubble', 'sparkle', 'rainbow', 'crystal', 'diamond']),
  metal: new Set(['death', 'doom', 'chaos', 'void', 'abyss', 'inferno', 'massacre', 'vengeance']),
  folk: new Set(['willow', 'meadow', 'river', 'mountain', 'valley', 'harvest', 'prairie', 'oak']),
  jazz: new Set(['blue', 'smooth', 'cool', 'swing', 'groove', 'bebop', 'scat', 'riff']),
  country: new Set(['whiskey', 'bourbon', 'creek', 'pine', 'dusty', 'rusty', 'barn', 'field']),
  punk: new Set(['anarchy', 'riot', 'clash', 'rage', 'rebel', 'chaos', 'noise', 'raw']),
  'jam band': new Set(['groove', 'cosmic', 'flow', 'journey', 'festival', 'spiral', 'sunshine', 'tribe'])
};

// Common musical name patterns from real bands/songs
const GOOD_PATTERNS = [
  // Definite article patterns
  { pattern: /^The\s+\w+\s+\w+s?$/, examples: ['The Rolling Stones', 'The Black Keys'] },
  { pattern: /^The\s+\w+$/, examples: ['The Doors', 'The Who'] },
  
  // Compound words
  { pattern: /^\w+\w+$/, examples: ['Radiohead', 'Soundgarden'] },
  
  // Adjective + Noun
  { pattern: /^(Red|Blue|Black|White|Green|Pink|Purple)\s+\w+$/, examples: ['Red Hot Chili Peppers', 'Black Sabbath'] },
  
  // Numbers in names
  { pattern: /^\w+\s+\d+$/, examples: ['Blink 182', 'Sum 41'] },
  
  // Single impactful words
  { pattern: /^[A-Z][a-z]+$/, examples: ['Queen', 'Rush', 'Kiss'] }
];

export function isMusicallyAppropriate(word: string): boolean {
  const lowerWord = word.toLowerCase();
  
  // Check against inappropriate words
  if (INAPPROPRIATE_WORDS.has(lowerWord)) {
    return false;
  }
  
  // Check if it's too cliché (but allow some clichés with lower probability)
  if (CLICHE_WORDS.has(lowerWord) && Math.random() > 0.2) {
    return false;
  }
  
  return true;
}

export function filterWordsForMusic(words: string[], genre?: string): string[] {
  return words.filter(word => {
    if (!isMusicallyAppropriate(word)) {
      secureLog.debug(`Filtered out inappropriate word: "${word}"`);
      return false;
    }
    
    // If genre is specified, boost genre-appropriate words
    if (genre && GENRE_VOCABULARY[genre.toLowerCase()]) {
      const genreWords = GENRE_VOCABULARY[genre.toLowerCase()];
      if (genreWords.has(word.toLowerCase())) {
        // Keep genre-appropriate words with higher probability
        return true;
      }
    }
    
    return true;
  });
}

export function getGenreWords(genre: string): string[] {
  const genreLower = genre.toLowerCase();
  if (GENRE_VOCABULARY[genreLower]) {
    return Array.from(GENRE_VOCABULARY[genreLower]);
  }
  return [];
}

export function isGoodNamePattern(name: string): boolean {
  // Check if the name matches any known good patterns
  return GOOD_PATTERNS.some(({ pattern }) => pattern.test(name));
}

// Score a name based on musical appropriateness
export function scoreMusicalName(name: string, type: 'band' | 'song', genre?: string): number {
  let score = 0.5; // Base score
  
  const words = name.toLowerCase().split(/\s+/);
  
  // Penalize inappropriate words heavily
  if (words.some(word => INAPPROPRIATE_WORDS.has(word))) {
    return 0;
  }
  
  // Penalize too many clichés
  const clicheCount = words.filter(word => CLICHE_WORDS.has(word)).length;
  score -= clicheCount * 0.2;
  
  // Boost for matching good patterns
  if (isGoodNamePattern(name)) {
    score += 0.3;
  }
  
  // Boost for genre-appropriate words
  if (genre && GENRE_VOCABULARY[genre.toLowerCase()]) {
    const genreWords = GENRE_VOCABULARY[genre.toLowerCase()];
    const genreWordCount = words.filter(word => genreWords.has(word)).length;
    score += genreWordCount * 0.15;
  }
  
  // Band names can be more abstract than song names
  if (type === 'band') {
    score += 0.1;
  }
  
  // Skip phonetic analysis for now (would need proper ES module imports)
  // This can be properly integrated in a future update
  
  // Ensure score is between 0 and 1
  return Math.max(0, Math.min(1, score));
}

// Get words from real band/song names for inspiration
export function getRealMusicExamples(type: 'band' | 'song'): string[] {
  const bandExamples = [
    'Arctic', 'Monkeys', 'Arcade', 'Fire', 'Vampire', 'Weekend',
    'Fleet', 'Foxes', 'Tame', 'Impala', 'Glass', 'Animals',
    'Beach', 'House', 'Crystal', 'Castles', 'Neutral', 'Milk',
    'Sonic', 'Youth', 'Velvet', 'Underground', 'Joy', 'Division'
  ];
  
  const songExamples = [
    'Midnight', 'City', 'Electric', 'Feel', 'Somebody', 'Love',
    'Dancing', 'Myself', 'Blinding', 'Lights', 'Good', 'Vibrations',
    'Sweet', 'Emotion', 'Bohemian', 'Rhapsody', 'Hotel', 'California',
    'Stairway', 'Heaven', 'Purple', 'Rain', 'Billie', 'Jean'
  ];
  
  return type === 'band' ? bandExamples : songExamples;
}