// Smart name pattern generation based on real musical naming conventions
import { secureLog } from '../../utils/secureLogger';
import { getRandomWord, getRandomWordByLength, capitalize, singularize } from './stringUtils';
import { scoreMusicalName } from './musicalWordFilter';
import { EnhancedWordSource } from './types';

// Real band/song name patterns from famous examples
const BAND_PATTERNS = [
  // The + Noun + Noun(s) pattern (The Rolling Stones, The Black Keys)
  { 
    pattern: 'the_adj_nouns',
    weight: 0.2,
    generate: (words: EnhancedWordSource) => {
      const adj = getRandomWord(words.validAdjectives) || 'wild';
      const noun = getRandomWord(words.validNouns) || 'hearts';
      return `The ${capitalize(adj)} ${capitalize(noun)}s`;
    }
  },
  // Single compound word (Radiohead, Soundgarden)
  {
    pattern: 'compound_word',
    weight: 0.15,
    generate: (words: EnhancedWordSource) => {
      const word1 = getRandomWord([...words.validNouns, ...words.validAdjectives]) || 'radio';
      const word2 = getRandomWord(words.validNouns) || 'head';
      return capitalize(word1) + capitalize(word2).toLowerCase();
    }
  },
  // Adjective + Animal/Object (Arctic Monkeys, Tame Impala)
  {
    pattern: 'adj_creature',
    weight: 0.15,
    generate: (words: EnhancedWordSource) => {
      const adj = getRandomWord(words.validAdjectives) || 'arctic';
      const noun = getRandomWordByLength(words.validNouns, 5) || 'tigers';
      return `${capitalize(adj)} ${capitalize(noun)}`;
    }
  },
  // Single impactful word (Queen, Rush, Tool)
  {
    pattern: 'single_impact',
    weight: 0.1,
    generate: (words: EnhancedWordSource) => {
      const impactWords = [...words.validNouns, ...words.validMusicalTerms];
      return capitalize(getRandomWordByLength(impactWords, 4, 7) || 'pulse');
    }
  },
  // Name/Place + Thing (Fleet Foxes, Beach House)
  {
    pattern: 'place_thing',
    weight: 0.1,
    generate: (words: EnhancedWordSource) => {
      const places = ['beach', 'fleet', 'crystal', 'glass', 'velvet', 'copper'];
      const things = ['house', 'foxes', 'castle', 'garden', 'factory', 'palace'];
      const place = getRandomWord([...places, ...words.validContextualWords]) || 'crystal';
      const thing = getRandomWord([...things, ...words.validNouns]) || 'palace';
      return `${capitalize(place)} ${capitalize(thing)}`;
    }
  }
];

const SONG_PATTERNS = [
  // Unique compound word + common word (Hyperstellar Dreams, Neonwave Hearts)
  {
    pattern: 'unique_compound',
    weight: 0.25,
    generate: (words: EnhancedWordSource) => {
      const prefixes = ['hyper', 'ultra', 'neo', 'meta', 'proto', 'anti', 'omni', 'poly', 'multi'];
      const midWords = getRandomWord([...words.validAdjectives, ...words.validNouns, ...words.validGenreTerms]) || 'stellar';
      const suffix = getRandomWord(words.validNouns) || 'dreams';
      const prefix = getRandomWord(prefixes);
      return `${capitalize(prefix + midWords)} ${capitalize(suffix)}`;
    }
  },
  // Invented word + real word (Synthopia Rising, Dreamscape Echo)
  {
    pattern: 'invented_word',
    weight: 0.2,
    generate: (words: EnhancedWordSource) => {
      const endings = ['opia', 'scape', 'tron', 'verse', 'sphere', 'flux', 'wave', 'core'];
      const base = getRandomWord([...words.validNouns, ...words.validGenreTerms]) || 'dream';
      const ending = getRandomWord(endings);
      const action = getRandomWord([...words.validVerbs.map((v: string) => v + 'ing'), ...words.validMusicalTerms]) || 'rising';
      return `${capitalize(base + ending)} ${capitalize(action)}`;
    }
  },
  // Number/Code + Emotion (404 Heartbreak, Seven Sorrows)
  {
    pattern: 'number_emotion',
    weight: 0.15,
    generate: (words: EnhancedWordSource) => {
      const numbers = ['zero', 'seven', 'eleven', '404', '808', 'XIII', 'infinite', 'binary'];
      const emotions = ['heartbreak', 'sorrows', 'desires', 'whispers', 'echoes', 'memories'];
      const number = getRandomWord(numbers) || 'seven';
      const emotion = getRandomWord([...emotions, ...words.longWords]) || 'echoes';
      return `${capitalize(number)} ${capitalize(emotion)}`;
    }
  },
  // Genre-specific unique pattern (Pixelated Sunrise, Glitchwave Memory)
  {
    pattern: 'genre_unique',
    weight: 0.15,
    generate: (words: EnhancedWordSource) => {
      const techWords = ['pixel', 'glitch', 'byte', 'cyber', 'quantum', 'digital', 'analog', 'fractal'];
      const natureWords = ['sunrise', 'twilight', 'horizon', 'aurora', 'nebula', 'cosmos'];
      const tech = getRandomWord([...techWords, ...words.validGenreTerms]) || 'pixel';
      const nature = getRandomWord([...natureWords, ...words.validContextualWords]) || 'sunrise';
      return Math.random() > 0.5 
        ? `${capitalize(tech)}ated ${capitalize(nature)}`
        : `${capitalize(tech)}wave ${capitalize(nature)}`;
    }
  },
  // Adjective + Noun (but with rare/unique combinations)
  {
    pattern: 'rare_adj_noun',
    weight: 0.1,
    generate: (words: EnhancedWordSource) => {
      const rareAdjs = ['lucid', 'visceral', 'ethereal', 'prismatic', 'chromatic', 'holographic', 'iridescent'];
      const uniqueNouns = ['prism', 'void', 'nexus', 'flux', 'vortex', 'paradox', 'enigma'];
      const adj = getRandomWord([...rareAdjs, ...words.longWords.filter(w => words.validAdjectives.includes(w))]) || 'lucid';
      const noun = getRandomWord([...uniqueNouns, ...words.validMusicalTerms, ...words.validGenreTerms]) || 'prism';
      return `${capitalize(adj)} ${capitalize(singularize(noun))}`;
    }
  },
  // Single rare/invented word (for 1-word songs)
  {
    pattern: 'single_unique',
    weight: 0.1,
    generate: (words: EnhancedWordSource) => {
      const bases = getRandomWord([...words.nouns, ...words.genreTerms, ...words.musicalTerms]) || 'echo';
      const modifiers = ['ism', 'ology', 'esque', 'onic', 'atic', 'morphic'];
      const modifier = getRandomWord(modifiers);
      return capitalize(bases + modifier);
    }
  },
  // Original patterns with updated word selections (kept but reduced weight)
  {
    pattern: 'verb_prep_noun',
    weight: 0.05,
    generate: (words: EnhancedWordSource) => {
      const uniqueVerbs = words.verbs.filter((v: string) => v.length > 5) || ['transcend', 'illuminate', 'resonate'];
      const verb = getRandomWord(uniqueVerbs) || 'transcend';
      const preps = ['beyond', 'beneath', 'within', 'between', 'alongside'];
      const prep = getRandomWord(preps);
      const uniqueNouns = words.nouns.filter((n: string) => n.length > 6) || ['horizon', 'spectrum', 'dimension'];
      const noun = getRandomWord(uniqueNouns) || 'horizon';
      return `${capitalize(verb)}ing ${prep} ${capitalize(noun)}`;
    }
  }
];

export function generateSmartBandName(words: EnhancedWordSource, genre?: string): string {
  // Select pattern based on weights
  const totalWeight = BAND_PATTERNS.reduce((sum, p) => sum + p.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const pattern of BAND_PATTERNS) {
    random -= pattern.weight;
    if (random <= 0) {
      const name = pattern.generate(words);
      const score = scoreMusicalName(name, 'band', genre);
      
      // If score is too low, try another pattern
      if (score < 0.5) {
        return generateSmartBandName(words, genre); // Recursive retry
      }
      
      return name;
    }
  }
  
  // Fallback
  return BAND_PATTERNS[0].generate(words);
}

export function generateSmartSongName(words: EnhancedWordSource, genre?: string): string {
  // Select pattern based on weights
  const totalWeight = SONG_PATTERNS.reduce((sum, p) => sum + p.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const pattern of SONG_PATTERNS) {
    random -= pattern.weight;
    if (random <= 0) {
      const name = pattern.generate(words);
      const score = scoreMusicalName(name, 'song', genre);
      
      // If score is too low, try another pattern
      if (score < 0.5) {
        return generateSmartSongName(words, genre); // Recursive retry
      }
      
      return name;
    }
  }
  
  // Fallback
  return SONG_PATTERNS[0].generate(words);
}