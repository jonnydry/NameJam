// Smart name pattern generation based on real musical naming conventions
import { secureLog } from '../../utils/secureLogger';
import { getRandomWord } from './generationHelpers';
import { capitalize, singularize } from './generationHelpers';
import { scoreMusicalName } from './musicalWordFilter';

// Real band/song name patterns from famous examples
const BAND_PATTERNS = [
  // The + Noun + Noun(s) pattern (The Rolling Stones, The Black Keys)
  { 
    pattern: 'the_adj_nouns',
    weight: 0.2,
    generate: (words: any) => {
      const adj = getRandomWord(words.adjectives) || 'wild';
      const noun = getRandomWord(words.nouns) || 'hearts';
      return `The ${capitalize(adj)} ${capitalize(noun)}s`;
    }
  },
  // Single compound word (Radiohead, Soundgarden)
  {
    pattern: 'compound_word',
    weight: 0.15,
    generate: (words: any) => {
      const word1 = getRandomWord([...words.nouns, ...words.adjectives]) || 'radio';
      const word2 = getRandomWord([...words.nouns]) || 'head';
      return capitalize(word1) + capitalize(word2).toLowerCase();
    }
  },
  // Adjective + Animal/Object (Arctic Monkeys, Tame Impala)
  {
    pattern: 'adj_creature',
    weight: 0.15,
    generate: (words: any) => {
      const adj = getRandomWord(words.adjectives) || 'arctic';
      const noun = getRandomWord(words.nouns.filter((n: string) => n.length > 4)) || 'tigers';
      return `${capitalize(adj)} ${capitalize(noun)}`;
    }
  },
  // Single impactful word (Queen, Rush, Tool)
  {
    pattern: 'single_impact',
    weight: 0.1,
    generate: (words: any) => {
      const impactWords = [...words.nouns, ...words.musicalTerms].filter((w: string) => 
        w.length >= 4 && w.length <= 7
      );
      return capitalize(getRandomWord(impactWords) || 'pulse');
    }
  },
  // Name/Place + Thing (Fleet Foxes, Beach House)
  {
    pattern: 'place_thing',
    weight: 0.1,
    generate: (words: any) => {
      const places = ['beach', 'fleet', 'crystal', 'glass', 'velvet', 'copper'];
      const things = ['house', 'foxes', 'castle', 'garden', 'factory', 'palace'];
      const place = getRandomWord([...places, ...words.contextualWords]) || 'crystal';
      const thing = getRandomWord([...things, ...words.nouns]) || 'palace';
      return `${capitalize(place)} ${capitalize(thing)}`;
    }
  }
];

const SONG_PATTERNS = [
  // Unique compound word + common word (Hyperstellar Dreams, Neonwave Hearts)
  {
    pattern: 'unique_compound',
    weight: 0.25,
    generate: (words: any) => {
      const prefixes = ['hyper', 'ultra', 'neo', 'meta', 'proto', 'anti', 'omni', 'poly', 'multi'];
      const midWords = getRandomWord([...words.adjectives, ...words.nouns, ...words.genreTerms]) || 'stellar';
      const suffix = getRandomWord(words.nouns) || 'dreams';
      const prefix = getRandomWord(prefixes);
      return `${capitalize(prefix + midWords)} ${capitalize(suffix)}`;
    }
  },
  // Invented word + real word (Synthopia Rising, Dreamscape Echo)
  {
    pattern: 'invented_word',
    weight: 0.2,
    generate: (words: any) => {
      const endings = ['opia', 'scape', 'tron', 'verse', 'sphere', 'flux', 'wave', 'core'];
      const base = getRandomWord([...words.nouns, ...words.genreTerms]) || 'dream';
      const ending = getRandomWord(endings);
      const action = getRandomWord([...words.verbs.map((v: string) => v + 'ing'), ...words.musicalTerms]) || 'rising';
      return `${capitalize(base + ending)} ${capitalize(action)}`;
    }
  },
  // Number/Code + Emotion (404 Heartbreak, Seven Sorrows)
  {
    pattern: 'number_emotion',
    weight: 0.15,
    generate: (words: any) => {
      const numbers = ['zero', 'seven', 'eleven', '404', '808', 'XIII', 'infinite', 'binary'];
      const emotions = ['heartbreak', 'sorrows', 'desires', 'whispers', 'echoes', 'memories'];
      const number = getRandomWord(numbers);
      const emotion = getRandomWord([...emotions, ...words.nouns.filter((n: string) => n.length > 5)]) || 'echoes';
      return `${capitalize(number)} ${capitalize(emotion)}`;
    }
  },
  // Genre-specific unique pattern (Pixelated Sunrise, Glitchwave Memory)
  {
    pattern: 'genre_unique',
    weight: 0.15,
    generate: (words: any) => {
      const techWords = ['pixel', 'glitch', 'byte', 'cyber', 'quantum', 'digital', 'analog', 'fractal'];
      const natureWords = ['sunrise', 'twilight', 'horizon', 'aurora', 'nebula', 'cosmos'];
      const tech = getRandomWord([...techWords, ...words.genreTerms]) || 'pixel';
      const nature = getRandomWord([...natureWords, ...words.contextualWords]) || 'sunrise';
      return Math.random() > 0.5 
        ? `${capitalize(tech)}ated ${capitalize(nature)}`
        : `${capitalize(tech)}wave ${capitalize(nature)}`;
    }
  },
  // Adjective + Noun (but with rare/unique combinations)
  {
    pattern: 'rare_adj_noun',
    weight: 0.1,
    generate: (words: any) => {
      const rareAdjs = ['lucid', 'visceral', 'ethereal', 'prismatic', 'chromatic', 'holographic', 'iridescent'];
      const uniqueNouns = ['prism', 'void', 'nexus', 'flux', 'vortex', 'paradox', 'enigma'];
      const adj = getRandomWord([...rareAdjs, ...words.adjectives.filter((a: string) => a.length > 6)]) || 'lucid';
      const noun = getRandomWord([...uniqueNouns, ...words.musicalTerms, ...words.genreTerms]) || 'prism';
      return `${capitalize(adj)} ${capitalize(singularize(noun))}`;
    }
  },
  // Single rare/invented word (for 1-word songs)
  {
    pattern: 'single_unique',
    weight: 0.1,
    generate: (words: any) => {
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
    generate: (words: any) => {
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

export function generateSmartBandName(words: any, genre?: string): string {
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

export function generateSmartSongName(words: any, genre?: string): string {
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