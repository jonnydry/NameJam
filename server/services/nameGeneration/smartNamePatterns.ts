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
  // Verb + Preposition + Noun (Dancing in the Dark, Running up that Hill)
  {
    pattern: 'verb_prep_noun',
    weight: 0.2,
    generate: (words: any) => {
      const verb = getRandomWord(words.verbs) || 'running';
      const preps = ['in', 'on', 'through', 'over', 'under', 'with', 'without'];
      const prep = getRandomWord(preps);
      const noun = getRandomWord(words.nouns) || 'night';
      return `${capitalize(verb)}ing ${prep} the ${capitalize(noun)}`;
    }
  },
  // Adjective + Noun (Sweet Emotion, Purple Rain)
  {
    pattern: 'adj_noun',
    weight: 0.2,
    generate: (words: any) => {
      const adj = getRandomWord(words.adjectives) || 'sweet';
      const noun = getRandomWord([...words.nouns, ...words.musicalTerms]) || 'emotion';
      return `${capitalize(adj)} ${capitalize(singularize(noun))}`;
    }
  },
  // Personal statement (I Want It That Way, Don't Stop Me Now)
  {
    pattern: 'personal_statement',
    weight: 0.15,
    generate: (words: any) => {
      const starters = ["I", "You", "We", "Don't", "Can't", "Won't"];
      const verbs = ['want', 'need', 'feel', 'see', 'know', 'believe'];
      const starter = getRandomWord(starters);
      const verb = getRandomWord([...verbs, ...words.verbs]) || 'feel';
      const thing = getRandomWord(words.nouns) || 'way';
      return `${starter} ${capitalize(verb)} the ${capitalize(thing)}`;
    }
  },
  // Time/Place + Action (Midnight City, California Dreamin')
  {
    pattern: 'time_place_action',
    weight: 0.15,
    generate: (words: any) => {
      const times = ['midnight', 'morning', 'evening', 'summer', 'winter'];
      const actions = ['calling', 'running', 'dreaming', 'falling', 'rising'];
      const time = getRandomWord([...times, ...words.contextualWords]) || 'midnight';
      const action = getRandomWord([...actions, ...words.verbs.map((v: string) => v + 'ing')]) || 'calling';
      return `${capitalize(time)} ${capitalize(action)}`;
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