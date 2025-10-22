/**
 * Advanced Pattern Library - Comprehensive pattern collections for sophisticated name generation
 * Provides extensive variety across word lengths, genres, and creative categories
 */

import { EnhancedWordSource } from './types';
import { getRandomWord, capitalize, singularize } from './stringUtils';

// Core pattern interface for consistency
export interface PatternDefinition {
  id: string;
  category: string;
  subcategory: string;
  weight: number;
  minWordCount: number;
  maxWordCount: number;
  genres?: string[];
  moods?: string[];
  template: string;
  description: string;
  examples: string[];
  generate: (sources: EnhancedWordSource, context?: PatternContext) => string;
}

export interface PatternContext {
  genre?: string;
  mood?: string;
  type?: 'band' | 'song';
  wordCount?: number;
  theme?: string;
  intensity?: 'low' | 'medium' | 'high';
  era?: string;
}

export class AdvancedPatternLibrary {
  // Single word patterns - abstract, memorable, impactful
  private singleWordPatterns: PatternDefinition[] = [
    {
      id: 'abstract_concept',
      category: 'conceptual',
      subcategory: 'abstract',
      weight: 0.25,
      minWordCount: 1,
      maxWordCount: 1,
      template: '{concept}',
      description: 'Single abstract concept words',
      examples: ['Paradox', 'Nexus', 'Zenith', 'Void'],
      generate: (sources) => {
        const concepts = ['Paradox', 'Nexus', 'Zenith', 'Void', 'Prism', 'Echo', 'Flux', 'Cipher', 
                         'Apex', 'Vortex', 'Enigma', 'Spectrum', 'Resonance', 'Catalyst', 'Synthesis'];
        return getRandomWord([...concepts, ...sources.validMusicalTerms]) || 'Echo';
      }
    },
    {
      id: 'compound_creation',
      category: 'linguistic',
      subcategory: 'compound',
      weight: 0.3,
      minWordCount: 1,
      maxWordCount: 1,
      template: '{prefix}{base}',
      description: 'Created compound words with prefixes',
      examples: ['Neowave', 'Hypercore', 'Metasound'],
      generate: (sources) => {
        const prefixes = ['neo', 'hyper', 'ultra', 'meta', 'proto', 'omni', 'anti', 'poly', 'multi', 'pseudo'];
        const bases = [...sources.validNouns, ...sources.validGenreTerms, ...sources.validMusicalTerms];
        const prefix = getRandomWord(prefixes) || 'neo';
        const base = getRandomWord(bases) || 'wave';
        return capitalize(prefix + base);
      }
    },
    {
      id: 'suffix_evolution',
      category: 'linguistic',
      subcategory: 'morphology',
      weight: 0.2,
      minWordCount: 1,
      maxWordCount: 1,
      template: '{base}{suffix}',
      description: 'Words with evolved suffixes',
      examples: ['Beatology', 'Soundism', 'Rhythmcore'],
      generate: (sources) => {
        const suffixes = ['ism', 'ology', 'esque', 'onic', 'atic', 'morphic', 'core', 'wave', 'sphere', 'verse'];
        const bases = [...sources.validNouns.filter(n => n.length < 8), ...sources.validGenreTerms];
        const base = getRandomWord(bases) || 'rhythm';
        const suffix = getRandomWord(suffixes) || 'core';
        return capitalize(base + suffix);
      }
    },
    {
      id: 'numeric_mystique',
      category: 'symbolic',
      subcategory: 'numeric',
      weight: 0.15,
      minWordCount: 1,
      maxWordCount: 1,
      template: '{number}',
      description: 'Meaningful numbers and codes',
      examples: ['XIII', '808', 'Binary', 'Infinite'],
      generate: () => {
        const numbers = ['Zero', 'Seven', 'Eleven', 'XIII', 'XXIV', '404', '808', 'Binary', 'Infinite', 'Omega', 'Alpha'];
        return getRandomWord(numbers) || '808';
      }
    },
    {
      id: 'rare_singular',
      category: 'vocabulary',
      subcategory: 'rare',
      weight: 0.1,
      minWordCount: 1,
      maxWordCount: 1,
      template: '{rare_word}',
      description: 'Rare but accessible words',
      examples: ['Lumina', 'Tempest', 'Aurora', 'Cosmos'],
      generate: (sources) => {
        const rareWords = ['Lumina', 'Tempest', 'Aurora', 'Cosmos', 'Ethereal', 'Nebula', 'Solaris', 
                          'Vesper', 'Celeste', 'Astral', 'Phantom', 'Mirage', 'Radiant', 'Sublime'];
        return getRandomWord([...rareWords, ...sources.longWords.filter(w => w.length < 9)]) || 'Aurora';
      }
    }
  ];

  // Two word patterns - dynamic relationships and combinations
  private twoWordPatterns: PatternDefinition[] = [
    {
      id: 'dynamic_adjective_noun',
      category: 'descriptive',
      subcategory: 'quality',
      weight: 0.2,
      minWordCount: 2,
      maxWordCount: 2,
      template: '{dynamic_adjective} {powerful_noun}',
      description: 'Dynamic adjectives with powerful nouns',
      examples: ['Electric Storm', 'Sonic Bloom', 'Primal Echo'],
      generate: (sources) => {
        const dynamicAdjs = ['Electric', 'Sonic', 'Primal', 'Vital', 'Raw', 'Pure', 'Fierce', 'Wild', 
                            'Blazing', 'Liquid', 'Crystalline', 'Volatile', 'Kinetic', 'Magnetic'];
        const powerfulNouns = ['Storm', 'Bloom', 'Echo', 'Fire', 'Wave', 'Force', 'Energy', 'Pulse', 
                              'Surge', 'Rhythm', 'Current', 'Flow', 'Impact', 'Resonance'];
        const adj = getRandomWord([...dynamicAdjs, ...sources.validAdjectives.filter(a => a.length > 5)]) || 'Electric';
        const noun = getRandomWord([...powerfulNouns, ...sources.validNouns]) || 'Storm';
        return `${capitalize(adj)} ${capitalize(singularize(noun))}`;
      }
    },
    {
      id: 'contrasting_elements',
      category: 'conceptual',
      subcategory: 'contrast',
      weight: 0.15,
      minWordCount: 2,
      maxWordCount: 2,
      template: '{element1} {element2}',
      description: 'Contrasting or complementary elements',
      examples: ['Fire Ice', 'Silent Thunder', 'Dark Light'],
      generate: (sources) => {
        const contrasts = [
          ['Fire', 'Ice'], ['Silent', 'Thunder'], ['Dark', 'Light'], ['Smooth', 'Edge'],
          ['Gentle', 'Storm'], ['Bright', 'Shadow'], ['Fast', 'Slow'], ['High', 'Low'],
          ['Ancient', 'Future'], ['Natural', 'Digital'], ['Warm', 'Cold'], ['Soft', 'Steel']
        ];
        const pair = getRandomWord(contrasts) || ['Fire', 'Ice'];
        return `${pair[0]} ${pair[1]}`;
      }
    },
    {
      id: 'action_object',
      category: 'narrative',
      subcategory: 'action',
      weight: 0.18,
      minWordCount: 2,
      maxWordCount: 2,
      template: '{action_verb} {target_noun}',
      description: 'Action verbs with target objects',
      examples: ['Chasing Shadows', 'Breaking Chains', 'Riding Thunder'],
      generate: (sources) => {
        const actions = ['Chasing', 'Breaking', 'Riding', 'Crossing', 'Climbing', 'Diving', 'Flying', 
                        'Dancing', 'Singing', 'Burning', 'Flowing', 'Rising', 'Falling', 'Spinning'];
        const targets = ['Shadows', 'Chains', 'Thunder', 'Dreams', 'Stars', 'Waves', 'Mountains', 
                        'Rivers', 'Clouds', 'Fire', 'Light', 'Time', 'Space', 'Hearts'];
        const action = getRandomWord([...actions, ...sources.validVerbs.map(v => capitalize(v + 'ing'))]) || 'Chasing';
        const target = getRandomWord([...targets, ...sources.validNouns]) || 'Shadows';
        return `${action} ${capitalize(target)}`;
      }
    },
    {
      id: 'techno_organic',
      category: 'fusion',
      subcategory: 'tech_nature',
      weight: 0.12,
      minWordCount: 2,
      maxWordCount: 2,
      template: '{tech_element} {organic_element}',
      description: 'Technology fused with nature',
      examples: ['Digital Forest', 'Cyber Rain', 'Neon Garden'],
      generate: (sources) => {
        const techElements = ['Digital', 'Cyber', 'Neon', 'Pixel', 'Binary', 'Quantum', 'Neural', 
                             'Virtual', 'Hologram', 'Laser', 'Circuit', 'Data', 'Code', 'Signal'];
        const organicElements = ['Forest', 'Rain', 'Garden', 'Ocean', 'Mountain', 'River', 'Desert', 
                                'Valley', 'Meadow', 'Grove', 'Lake', 'Storm', 'Wind', 'Earth'];
        const tech = getRandomWord(techElements) || 'Digital';
        const organic = getRandomWord([...organicElements, ...sources.validContextualWords]) || 'Forest';
        return `${tech} ${capitalize(organic)}`;
      }
    },
    {
      id: 'emotional_landscape',
      category: 'emotional',
      subcategory: 'landscape',
      weight: 0.15,
      minWordCount: 2,
      maxWordCount: 2,
      template: '{emotion} {landscape}',
      description: 'Emotions paired with landscapes',
      examples: ['Melancholy Hills', 'Euphoric Valleys', 'Restless Seas'],
      generate: (sources) => {
        const emotions = ['Melancholy', 'Euphoric', 'Restless', 'Serene', 'Passionate', 'Nostalgic', 
                         'Turbulent', 'Peaceful', 'Intense', 'Gentle', 'Fierce', 'Tender'];
        const landscapes = ['Hills', 'Valleys', 'Seas', 'Plains', 'Peaks', 'Shores', 'Fields', 
                           'Cliffs', 'Canyons', 'Meadows', 'Horizons', 'Depths', 'Heights', 'Paths'];
        const emotion = getRandomWord(emotions) || 'Melancholy';
        const landscape = getRandomWord([...landscapes, ...sources.validContextualWords]) || 'Hills';
        return `${emotion} ${capitalize(landscape)}`;
      }
    },
    {
      id: 'temporal_concept',
      category: 'temporal',
      subcategory: 'time',
      weight: 0.1,
      minWordCount: 2,
      maxWordCount: 2,
      template: '{time_element} {concept}',
      description: 'Time-based concepts',
      examples: ['Forever Young', 'Yesterday Dreams', 'Tomorrow Calling'],
      generate: (sources) => {
        const timeElements = ['Forever', 'Yesterday', 'Tomorrow', 'Midnight', 'Dawn', 'Twilight', 
                             'Eternal', 'Timeless', 'Ancient', 'Future', 'Present', 'Infinite'];
        const concepts = ['Young', 'Dreams', 'Calling', 'Memories', 'Hopes', 'Echoes', 'Shadows', 
                         'Light', 'Love', 'Peace', 'Fire', 'Storm', 'Rain', 'Sun'];
        const time = getRandomWord(timeElements) || 'Forever';
        const concept = getRandomWord([...concepts, ...sources.validNouns]) || 'Young';
        return `${time} ${capitalize(concept)}`;
      }
    },
    {
      id: 'numbered_concept',
      category: 'symbolic',
      subcategory: 'enumerated',
      weight: 0.1,
      minWordCount: 2,
      maxWordCount: 2,
      template: '{number} {concept}',
      description: 'Numbers with meaningful concepts',
      examples: ['Seven Sins', 'Thirteen Moons', 'Zero Hour'],
      generate: (sources) => {
        const numbers = ['Zero', 'One', 'Seven', 'Thirteen', 'Hundred', 'Thousand', 'Million', 'First', 'Last'];
        const concepts = ['Sins', 'Moons', 'Hour', 'Stars', 'Dreams', 'Hearts', 'Souls', 'Lives', 
                         'Chances', 'Wishes', 'Tears', 'Smiles', 'Songs', 'Stories'];
        const number = getRandomWord(numbers) || 'Seven';
        const concept = getRandomWord([...concepts, ...sources.validNouns]) || 'Stars';
        return `${number} ${capitalize(concept)}`;
      }
    }
  ];

  // Three word patterns - narrative and descriptive complexity
  private threeWordPatterns: PatternDefinition[] = [
    {
      id: 'classic_the_adjective_noun',
      category: 'traditional',
      subcategory: 'band_classic',
      weight: 0.25,
      minWordCount: 3,
      maxWordCount: 3,
      template: 'The {adjective} {noun}',
      description: 'Classic "The [Adjective] [Noun]" band pattern',
      examples: ['The Electric Storm', 'The Broken Hearts', 'The Rising Sun'],
      generate: (sources) => {
        const adj = getRandomWord(sources.validAdjectives) || 'Electric';
        const noun = getRandomWord(sources.validNouns) || 'Storm';
        return `The ${capitalize(adj)} ${capitalize(singularize(noun))}`;
      }
    },
    {
      id: 'narrative_sequence',
      category: 'narrative',
      subcategory: 'story',
      weight: 0.2,
      minWordCount: 3,
      maxWordCount: 3,
      template: '{subject} {verb} {object}',
      description: 'Simple narrative sequences',
      examples: ['Hearts Beat Fast', 'Dreams Come True', 'Fire Burns Bright'],
      generate: (sources) => {
        const subjects = ['Hearts', 'Dreams', 'Fire', 'Stars', 'Waves', 'Winds', 'Souls', 'Eyes', 'Hands', 'Voices'];
        const verbs = ['Beat', 'Come', 'Burns', 'Shine', 'Flow', 'Dance', 'Sing', 'Rise', 'Fall', 'Call'];
        const objects = ['Fast', 'True', 'Bright', 'High', 'Deep', 'Strong', 'Free', 'Wild', 'Pure', 'Bold'];
        const subject = getRandomWord([...subjects, ...sources.validNouns]) || 'Hearts';
        const verb = getRandomWord([...verbs, ...sources.validVerbs]) || 'Beat';
        const object = getRandomWord([...objects, ...sources.validAdjectives]) || 'Fast';
        return `${capitalize(subject)} ${capitalize(verb)} ${capitalize(object)}`;
      }
    },
    {
      id: 'question_format',
      category: 'interrogative',
      subcategory: 'question',
      weight: 0.15,
      minWordCount: 3,
      maxWordCount: 3,
      template: '{question_word} {verb} {noun}',
      description: 'Question-based patterns',
      examples: ['Who Are You', 'Where Is Love', 'Why So Serious'],
      generate: (sources) => {
        const questionWords = ['Who', 'What', 'Where', 'When', 'Why', 'How'];
        const verbs = ['Are', 'Is', 'Were', 'Was', 'Do', 'Did', 'Can', 'Will', 'Should'];
        const nouns = ['You', 'Love', 'Serious', 'This', 'That', 'We', 'They', 'Time', 'Life', 'Hope'];
        const question = getRandomWord(questionWords) || 'Who';
        const verb = getRandomWord(verbs) || 'Are';
        const noun = getRandomWord([...nouns, ...sources.validNouns]) || 'You';
        return `${question} ${verb} ${capitalize(noun)}`;
      }
    },
    {
      id: 'location_action',
      category: 'spatial',
      subcategory: 'place_action',
      weight: 0.15,
      minWordCount: 3,
      maxWordCount: 3,
      template: '{preposition} {location} {action}',
      description: 'Location-based actions',
      examples: ['Beyond The Horizon', 'Under Starlight Dancing', 'Through Fire Walking'],
      generate: (sources) => {
        const prepositions = ['Beyond', 'Under', 'Through', 'Above', 'Below', 'Within', 'Behind', 'Across'];
        const locations = ['The Horizon', 'Starlight', 'Fire', 'Water', 'Mountains', 'Valleys', 'Skies', 'Seas'];
        const actions = ['Dancing', 'Walking', 'Running', 'Flying', 'Singing', 'Dreaming', 'Waiting', 'Calling'];
        const prep = getRandomWord(prepositions) || 'Beyond';
        const location = getRandomWord([...locations, ...sources.validContextualWords]) || 'The Horizon';
        const action = getRandomWord([...actions, ...sources.validVerbs.map(v => v + 'ing')]) || 'Dancing';
        return `${prep} ${location} ${capitalize(action)}`;
      }
    },
    {
      id: 'emotional_journey',
      category: 'emotional',
      subcategory: 'progression',
      weight: 0.12,
      minWordCount: 3,
      maxWordCount: 3,
      template: '{emotion} {transition} {outcome}',
      description: 'Emotional progression patterns',
      examples: ['Love Becomes Pain', 'Joy Turns Sorrow', 'Hope Finds Light'],
      generate: (sources) => {
        const emotions = ['Love', 'Joy', 'Hope', 'Fear', 'Pain', 'Peace', 'Rage', 'Calm', 'Doubt', 'Faith'];
        const transitions = ['Becomes', 'Turns', 'Finds', 'Meets', 'Brings', 'Takes', 'Makes', 'Gives'];
        const outcomes = ['Pain', 'Sorrow', 'Light', 'Dark', 'Peace', 'War', 'Life', 'Death', 'Truth', 'Lies'];
        const emotion = getRandomWord(emotions) || 'Love';
        const transition = getRandomWord(transitions) || 'Becomes';
        const outcome = getRandomWord([...outcomes, ...sources.validNouns]) || 'Pain';
        return `${emotion} ${transition} ${capitalize(outcome)}`;
      }
    },
    {
      id: 'compound_modifier',
      category: 'linguistic',
      subcategory: 'compound',
      weight: 0.08,
      minWordCount: 3,
      maxWordCount: 3,
      template: '{compound_word} {modifier} {noun}',
      description: 'Compound words with modifiers',
      examples: ['Firelight Dancing Shadows', 'Moonbeam Silver Dreams', 'Stardust Golden Rain'],
      generate: (sources) => {
        const compounds = ['Firelight', 'Moonbeam', 'Stardust', 'Sunlight', 'Rainfall', 'Snowfall', 'Windstorm'];
        const modifiers = ['Dancing', 'Silver', 'Golden', 'Crystal', 'Diamond', 'Velvet', 'Silk', 'Steel'];
        const nouns = ['Shadows', 'Dreams', 'Rain', 'Snow', 'Wind', 'Fire', 'Water', 'Earth', 'Sky', 'Stars'];
        const compound = getRandomWord(compounds) || 'Firelight';
        const modifier = getRandomWord([...modifiers, ...sources.validAdjectives]) || 'Dancing';
        const noun = getRandomWord([...nouns, ...sources.validNouns]) || 'Shadows';
        return `${compound} ${modifier} ${capitalize(noun)}`;
      }
    },
    {
      id: 'sensory_experience',
      category: 'sensory',
      subcategory: 'perception',
      weight: 0.05,
      minWordCount: 3,
      maxWordCount: 3,
      template: '{sense} {intensity} {experience}',
      description: 'Sensory perception patterns',
      examples: ['Taste Sweet Victory', 'Feel Deep Rhythm', 'Hear Silent Screams'],
      generate: (sources) => {
        const senses = ['Taste', 'Feel', 'Hear', 'See', 'Touch', 'Smell', 'Sense', 'Know'];
        const intensities = ['Sweet', 'Deep', 'Silent', 'Loud', 'Soft', 'Hard', 'Sharp', 'Smooth'];
        const experiences = ['Victory', 'Rhythm', 'Screams', 'Colors', 'Music', 'Love', 'Pain', 'Joy'];
        const sense = getRandomWord(senses) || 'Feel';
        const intensity = getRandomWord([...intensities, ...sources.validAdjectives]) || 'Deep';
        const experience = getRandomWord([...experiences, ...sources.validNouns]) || 'Rhythm';
        return `${sense} ${capitalize(intensity)} ${capitalize(experience)}`;
      }
    }
  ];

  // Four+ word patterns - complex narratives and phrases
  private fourPlusWordPatterns: PatternDefinition[] = [
    {
      id: 'complete_narrative',
      category: 'narrative',
      subcategory: 'story',
      weight: 0.3,
      minWordCount: 4,
      maxWordCount: 8,
      template: '{article} {adjective} {noun} {verb} {adverb}',
      description: 'Complete narrative sentences',
      examples: ['The Wild Heart Beats Forever', 'A Broken Dream Shines Bright'],
      generate: (sources) => {
        const articles = ['The', 'A', 'An', 'This', 'That', 'Every', 'Each'];
        const adjectives = sources.validAdjectives;
        const nouns = sources.validNouns;
        const verbs = sources.validVerbs;
        const adverbs = ['Forever', 'Always', 'Never', 'Sometimes', 'Often', 'Rarely', 'Softly', 'Loudly'];
        
        const article = getRandomWord(articles) || 'The';
        const adj = getRandomWord(adjectives) || 'Wild';
        const noun = getRandomWord(nouns) || 'Heart';
        const verb = getRandomWord(verbs) || 'Beats';
        const adverb = getRandomWord(adverbs) || 'Forever';
        
        return `${article} ${capitalize(adj)} ${capitalize(singularize(noun))} ${capitalize(verb)} ${adverb}`;
      }
    },
    {
      id: 'poetic_sequence',
      category: 'poetic',
      subcategory: 'verse',
      weight: 0.25,
      minWordCount: 4,
      maxWordCount: 6,
      template: '{noun} {verb} {preposition} {article} {noun}',
      description: 'Poetic sequences with natural flow',
      examples: ['Dreams Flow Through the Night', 'Love Burns in the Dark'],
      generate: (sources) => {
        const nouns = sources.validNouns;
        const verbs = sources.validVerbs;
        const prepositions = ['through', 'in', 'on', 'under', 'over', 'beside', 'beyond', 'within'];
        const articles = ['the', 'a', 'an'];
        
        const noun1 = getRandomWord(nouns) || 'Dreams';
        const verb = getRandomWord(verbs) || 'Flow';
        const prep = getRandomWord(prepositions) || 'through';
        const article = getRandomWord(articles) || 'the';
        const noun2 = getRandomWord(nouns) || 'Night';
        
        return `${capitalize(noun1)} ${capitalize(verb)} ${prep} ${article} ${capitalize(singularize(noun2))}`;
      }
    },
    {
      id: 'philosophical_statement',
      category: 'philosophical',
      subcategory: 'wisdom',
      weight: 0.2,
      minWordCount: 5,
      maxWordCount: 8,
      template: '{concept} {verb} {modifier} {than} {comparison}',
      description: 'Philosophical or wisdom-based statements',
      examples: ['Truth Speaks Louder Than Words', 'Love Grows Stronger Than Fear'],
      generate: (sources) => {
        const concepts = ['Truth', 'Love', 'Hope', 'Faith', 'Peace', 'Joy', 'Light', 'Time', 'Life', 'Death'];
        const verbs = ['Speaks', 'Grows', 'Shines', 'Burns', 'Flows', 'Rises', 'Falls', 'Lives', 'Dies', 'Wins'];
        const modifiers = ['Louder', 'Stronger', 'Brighter', 'Deeper', 'Higher', 'Faster', 'Slower', 'Better'];
        const comparisons = ['Words', 'Fear', 'Darkness', 'Hate', 'War', 'Pain', 'Sorrow', 'Death', 'Time'];
        
        const concept = getRandomWord([...concepts, ...sources.validNouns]) || 'Truth';
        const verb = getRandomWord([...verbs, ...sources.validVerbs]) || 'Speaks';
        const modifier = getRandomWord(modifiers) || 'Louder';
        const comparison = getRandomWord([...comparisons, ...sources.validNouns]) || 'Words';
        
        return `${concept} ${verb} ${modifier} Than ${capitalize(comparison)}`;
      }
    },
    {
      id: 'temporal_journey',
      category: 'temporal',
      subcategory: 'journey',
      weight: 0.15,
      minWordCount: 5,
      maxWordCount: 7,
      template: '{time_start} {connector} {time_end} {outcome}',
      description: 'Temporal journey patterns',
      examples: ['Yesterday Becomes Tomorrow\'s Dream', 'Dawn Breaks Into Endless Day'],
      generate: (sources) => {
        const timeStarts = ['Yesterday', 'Dawn', 'Midnight', 'Twilight', 'Morning', 'Evening', 'Today'];
        const connectors = ['Becomes', 'Breaks Into', 'Flows Into', 'Turns Into', 'Leads To'];
        const timeEnds = ['Tomorrow\'s', 'Endless', 'Eternal', 'Infinite', 'Golden', 'Silver', 'Crystal'];
        const outcomes = ['Dream', 'Day', 'Night', 'Light', 'Hope', 'Peace', 'Love', 'Song', 'Dance'];
        
        const start = getRandomWord(timeStarts) || 'Yesterday';
        const connector = getRandomWord(connectors) || 'Becomes';
        const end = getRandomWord(timeEnds) || 'Tomorrow\'s';
        const outcome = getRandomWord([...outcomes, ...sources.validNouns]) || 'Dream';
        
        return `${start} ${connector} ${end} ${capitalize(outcome)}`;
      }
    },
    {
      id: 'conditional_narrative',
      category: 'conditional',
      subcategory: 'if_then',
      weight: 0.1,
      minWordCount: 6,
      maxWordCount: 10,
      template: '{condition} {verb} {outcome}',
      description: 'Conditional narrative structures',
      examples: ['When Hearts Stop Beating Love Remains', 'If Dreams Could Fly We\'d Touch Stars'],
      generate: (sources) => {
        const conditions = ['When Hearts Stop Beating', 'If Dreams Could Fly', 'Should Time Stand Still', 
                           'Where Love Goes Deep', 'While Stars Keep Shining'];
        const outcomes = ['Love Remains', 'We\'d Touch Stars', 'We\'d Dance Forever', 'Hope Lives On', 'Peace Will Come'];
        
        const condition = getRandomWord(conditions) || 'When Hearts Stop Beating';
        const outcome = getRandomWord(outcomes) || 'Love Remains';
        
        return `${condition} ${outcome}`;
      }
    }
  ];

  // Genre-specific pattern modifiers
  private genreModifiers: Record<string, {
    adjectives: string[];
    nouns: string[];
    verbs: string[];
    themes: string[];
  }> = {
    rock: {
      adjectives: ['Raw', 'Wild', 'Electric', 'Fierce', 'Bold', 'Heavy', 'Hard', 'Rough', 'Loud', 'Strong'],
      nouns: ['Thunder', 'Storm', 'Fire', 'Steel', 'Stone', 'Mountain', 'Lightning', 'Power', 'Force', 'Energy'],
      verbs: ['Rock', 'Roll', 'Smash', 'Crash', 'Bang', 'Roar', 'Scream', 'Shake', 'Break', 'Burn'],
      themes: ['rebellion', 'freedom', 'power', 'energy', 'raw_emotion']
    },
    jazz: {
      adjectives: ['Smooth', 'Cool', 'Blue', 'Mellow', 'Sweet', 'Sophisticated', 'Elegant', 'Rich', 'Deep', 'Velvet'],
      nouns: ['Note', 'Rhythm', 'Harmony', 'Melody', 'Tempo', 'Groove', 'Soul', 'Spirit', 'Heart', 'Blues'],
      verbs: ['Swing', 'Flow', 'Improvise', 'Glide', 'Weave', 'Dance', 'Sing', 'Play', 'Feel', 'Express'],
      themes: ['improvisation', 'sophistication', 'emotion', 'soul', 'expression']
    },
    electronic: {
      adjectives: ['Digital', 'Synthetic', 'Electric', 'Neon', 'Cyber', 'Virtual', 'Binary', 'Quantum', 'Neural', 'Holographic'],
      nouns: ['Code', 'Signal', 'Frequency', 'Wave', 'Pulse', 'Circuit', 'Data', 'System', 'Matrix', 'Network'],
      verbs: ['Process', 'Compile', 'Generate', 'Transmit', 'Upload', 'Download', 'Stream', 'Sync', 'Connect', 'Interface'],
      themes: ['technology', 'future', 'digital', 'synthetic', 'artificial']
    },
    folk: {
      adjectives: ['Ancient', 'Wise', 'Simple', 'Pure', 'Natural', 'Gentle', 'Peaceful', 'Earthy', 'Rustic', 'Traditional'],
      nouns: ['Story', 'Tale', 'Song', 'Ballad', 'Legend', 'Myth', 'Memory', 'Heritage', 'Root', 'Branch'],
      verbs: ['Tell', 'Sing', 'Remember', 'Share', 'Pass', 'Keep', 'Honor', 'Preserve', 'Celebrate', 'Cherish'],
      themes: ['tradition', 'storytelling', 'heritage', 'nature', 'simplicity']
    },
    pop: {
      adjectives: ['Bright', 'Catchy', 'Fun', 'Happy', 'Upbeat', 'Colorful', 'Sparkling', 'Shining', 'Glowing', 'Radiant'],
      nouns: ['Star', 'Dream', 'Love', 'Heart', 'Life', 'World', 'Sky', 'Sun', 'Moon', 'Rainbow'],
      verbs: ['Shine', 'Glow', 'Sparkle', 'Dance', 'Sing', 'Love', 'Dream', 'Hope', 'Wish', 'Celebrate'],
      themes: ['accessibility', 'mainstream', 'catchy', 'memorable', 'uplifting']
    }
  };

  // Get all patterns for a specific word count
  getAllPatterns(wordCount: number): PatternDefinition[] {
    const patterns: PatternDefinition[] = [];
    
    if (wordCount === 1) patterns.push(...this.singleWordPatterns);
    if (wordCount === 2) patterns.push(...this.twoWordPatterns);
    if (wordCount === 3) patterns.push(...this.threeWordPatterns);
    if (wordCount >= 4) patterns.push(...this.fourPlusWordPatterns.filter(p => 
      wordCount >= p.minWordCount && wordCount <= p.maxWordCount
    ));
    
    return patterns;
  }

  // Get patterns filtered by category
  getPatternsByCategory(category: string, wordCount?: number): PatternDefinition[] {
    let allPatterns = [
      ...this.singleWordPatterns,
      ...this.twoWordPatterns,
      ...this.threeWordPatterns,
      ...this.fourPlusWordPatterns
    ];
    
    if (wordCount) {
      allPatterns = allPatterns.filter(p => 
        wordCount >= p.minWordCount && wordCount <= p.maxWordCount
      );
    }
    
    return allPatterns.filter(p => p.category === category);
  }

  // Get genre-specific modifiers
  getGenreModifiers(genre?: string): typeof this.genreModifiers[keyof typeof this.genreModifiers] | null {
    if (!genre) return null;
    return this.genreModifiers[genre.toLowerCase()] || null;
  }

  // Get random pattern with optional filtering
  getRandomPattern(
    wordCount: number,
    context?: PatternContext
  ): PatternDefinition | null {
    let patterns = this.getAllPatterns(wordCount);
    
    // Filter by genre if specified
    if (context?.genre) {
      const genrePatterns = patterns.filter(p => 
        !p.genres || p.genres.includes(context.genre!)
      );
      if (genrePatterns.length > 0) {
        patterns = genrePatterns;
      }
    }
    
    // Filter by mood if specified
    if (context?.mood) {
      const moodPatterns = patterns.filter(p => 
        !p.moods || p.moods.includes(context.mood!)
      );
      if (moodPatterns.length > 0) {
        patterns = moodPatterns;
      }
    }
    
    if (patterns.length === 0) return null;
    
    // Weight-based selection
    const totalWeight = patterns.reduce((sum, p) => sum + p.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const pattern of patterns) {
      random -= pattern.weight;
      if (random <= 0) {
        return pattern;
      }
    }
    
    return patterns[patterns.length - 1];
  }

  // Generate name using specific pattern
  generateFromPattern(
    pattern: PatternDefinition,
    sources: EnhancedWordSource,
    context?: PatternContext
  ): string {
    return pattern.generate(sources, context);
  }

  // Get all available categories
  getAllCategories(): string[] {
    const categories = new Set<string>();
    [
      ...this.singleWordPatterns,
      ...this.twoWordPatterns,
      ...this.threeWordPatterns,
      ...this.fourPlusWordPatterns
    ].forEach(p => categories.add(p.category));
    
    return Array.from(categories);
  }

  // Get pattern statistics
  getPatternStats(): {
    totalPatterns: number;
    byWordCount: Record<string, number>;
    byCategory: Record<string, number>;
  } {
    const allPatterns = [
      ...this.singleWordPatterns,
      ...this.twoWordPatterns,
      ...this.threeWordPatterns,
      ...this.fourPlusWordPatterns
    ];
    
    const byWordCount: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    
    allPatterns.forEach(p => {
      // Count by word count range
      const key = p.minWordCount === p.maxWordCount ? 
        `${p.minWordCount}` : 
        `${p.minWordCount}-${p.maxWordCount}`;
      byWordCount[key] = (byWordCount[key] || 0) + 1;
      
      // Count by category
      byCategory[p.category] = (byCategory[p.category] || 0) + 1;
    });
    
    return {
      totalPatterns: allPatterns.length,
      byWordCount,
      byCategory
    };
  }
}

// Export singleton instance
export const advancedPatternLibrary = new AdvancedPatternLibrary();