import { EnhancedWordSource } from './types';
import { DatamuseService } from '../datamuseService';
import { secureLog } from '../../utils/secureLogger';
import { 
  singularize, 
  capitalize, 
  getRandomWord,
  getRandomWordByLength
} from './stringUtils';
import { 
  isLikelyAdjective, 
  isLikelyVerb,
  isGenreAppropriate 
} from './generationHelpers';
import { generateSmartBandName, generateSmartSongName } from './smartNamePatterns';
import { poeticFlowPatterns } from './poeticFlowPatterns';

export class NameGenerationPatterns {
  constructor(private datamuseService: DatamuseService) {}

  // Humor injection patterns for puns and wordplay
  private humorPatterns = {
    puns: [
      { base: 'beat', variations: ['beet', 'beats', 'beetz'] },
      { base: 'soul', variations: ['sole', 'seoul', 'sol'] },
      { base: 'bass', variations: ['base', 'bays'] },
      { base: 'metal', variations: ['mettle', 'medal'] },
      { base: 'rock', variations: ['roc', 'rok'] },
      { base: 'wave', variations: ['waive', 'weigh'] },
      { base: 'chord', variations: ['cord', 'cored'] },
      { base: 'phase', variations: ['faze', 'phaze'] },
      { base: 'cymbal', variations: ['symbol'] },
      { base: 'suite', variations: ['sweet', 'swete'] }
    ],
    wordplay: [
      (word: string) => word.split('').reverse().join(''), // Reverse
      (word: string) => word.replace(/[aeiou]/g, match => match === match.toUpperCase() ? match.toLowerCase() : match.toUpperCase()), // Vowel case swap
      (word: string) => word.charAt(0) + word.slice(1).replace(/[aeiou]/g, ''), // Remove inner vowels
      (word: string) => word.replace(/s$/, 'z').replace(/c/g, 'k'), // Edgy spelling
    ]
  };

  // Dynamic question templates
  private questionTemplates = [
    "Who {verb} the {noun}?",
    "Where {verb} {noun} {verb}?",
    "Why {verb} {noun}?",
    "When {noun} {verb}?",
    "What {verb} {preposition} {noun}?",
    "How {adverb} {verb} {noun}?"
  ];

  // Narrative arc templates for longer names
  private narrativeArcs = {
    journey: [
      "{noun} {verb} from {noun} to {noun}",
      "The {adjective} {noun} {verb} through {adjective} {noun}",
      "{verb} the {noun}, {verb} the {noun}, {verb} the {noun}"
    ],
    transformation: [
      "When {noun} becomes {noun}",
      "From {adjective} to {adjective}: A {noun}'s {noun}",
      "The {noun} that {verb} into {noun}"
    ],
    conflict: [
      "{noun} versus the {adjective} {noun}",
      "The {noun} {verb} while {noun} {verb}",
      "{adjective} {noun} against {adjective} {noun}"
    ],
    discovery: [
      "Finding {noun} in {adjective} {noun}",
      "The {noun} who {verb} {noun}",
      "{verb} the {adjective} {noun} within"
    ]
  };

  async generateContextualName(
    sources: EnhancedWordSource, 
    type: string, 
    wordCount: number,
    mood?: string,
    genre?: string,
    poetryContext?: string[]
  ): Promise<{ name: string; actualWordCount: number }> {
    let name = '';
    
    // Use smart patterns 50% of the time for better quality
    if (Math.random() < 0.5) {
      if (type === 'band') {
        name = generateSmartBandName(sources, genre);
      } else {
        name = generateSmartSongName(sources, genre);
      }
      const actualWordCount = name.split(' ').filter(w => w.length > 0).length;
      
      // If word count matches request (or is in range for 4+), return it
      if (wordCount >= 4 ? (actualWordCount >= 4 && actualWordCount <= 10) : actualWordCount === wordCount) {
        return { name, actualWordCount };
      }
    }
    
    // Otherwise use original pattern-based generation
    switch (wordCount) {
      case 1:
        name = this.generateSingleContextualWord(sources);
        break;
      case 2:
        name = await this.generateTwoWordContextual(sources, type, genre);
        break;
      case 3:
        name = await this.generateThreeWordContextual(sources, type, genre);
        break;
      default:
        if (wordCount >= 4 && wordCount <= 10) {
          // Use poetic flow patterns for 4+ words
          name = poeticFlowPatterns.generatePoeticName(wordCount, sources, poetryContext);
        } else {
          name = this.generateStructuredPhrase(sources, wordCount);
        }
        break;
    }
    
    const actualWordCount = name.split(' ').filter(w => w.length > 0).length;
    return { name, actualWordCount };
  }

  async generateContextualNameWithCount(
    type: string,
    requestedWordCount: number,
    sources: EnhancedWordSource,
    mood?: string,
    genre?: string,
    poetryContext?: string[]
  ): Promise<{ name: string; actualWordCount: number }> {
    let wordCount = requestedWordCount;
    
    // For "4+" option, randomize between 4-10 words
    if (requestedWordCount >= 4) {
      wordCount = Math.floor(Math.random() * 7) + 4; // 4-10 words
    }
    
    try {
      const result = await this.generateContextualName(sources, type, wordCount, mood, genre, poetryContext);
      
      // Quality check - ensure no repeated words
      const words = result.name.split(' ');
      const uniqueWords = new Set(words);
      if (uniqueWords.size !== words.length) {
        // Has duplicate words, regenerate
        return await this.generateContextualNameWithCount(type, requestedWordCount, sources, mood, genre, poetryContext);
      }
      
      return result;
    } catch (error) {
      secureLog.error('Error generating contextual name:', error);
      // Fallback to a simple generation
      const fallbackWords = this.getSimpleFallback(sources, wordCount);
      return { name: fallbackWords, actualWordCount: wordCount };
    }
  }

  private generateSingleContextualWord(sources: EnhancedWordSource): string {
    // 60% chance to generate an invented/unique word
    if (Math.random() < 0.6) {
      const patterns = [
        // Add suffix to create unique word
        () => {
          const base = getRandomWord([...sources.validNouns, ...sources.validGenreTerms]) || 'echo';
          const suffixes = ['ism', 'ology', 'esque', 'onic', 'atic', 'morphic', 'core', 'wave', 'flux'];
          const suffix = getRandomWord(suffixes);
          return capitalize(base + suffix);
        },
        // Compound single word
        () => {
          const prefixes = ['neo', 'hyper', 'ultra', 'meta', 'proto', 'omni'];
          const base = getRandomWord([...sources.validMusicalTerms, ...sources.validGenreTerms]) || 'wave';
          const prefix = getRandomWord(prefixes);
          return capitalize(prefix + base);
        },
        // Number/code words
        () => {
          const codes = ['404', '808', 'XIII', 'Binary', 'Zero', 'Infinite', 'Omega'];
          return getRandomWord(codes) || '404';
        },
        // Rare/unique single words
        () => {
          const uniqueWords = ['Paradox', 'Nexus', 'Prism', 'Void', 'Flux', 'Cipher', 'Enigma', 'Zenith', 'Nadir', 'Apex'];
          return getRandomWord(uniqueWords) || 'Paradox';
        }
      ];
      
      const pattern = patterns[Math.floor(Math.random() * patterns.length)];
      return pattern();
    }
    
    // 40% chance to use traditional single word selection
    const singleWordSources = [
      ...sources.mediumWords.filter(w => sources.validNouns.includes(w)),
      ...sources.longWords.filter(w => sources.validNouns.includes(w)),
      ...sources.validMusicalTerms,
      ...sources.validGenreTerms
    ];
    
    if (singleWordSources.length > 0) {
      const word = getRandomWord(singleWordSources);
      return word ? capitalize(singularize(word)) : 'Echo';
    }
    
    return 'Echo';
  }

  private async generateTwoWordContextual(sources: EnhancedWordSource, type: string, genre?: string): Promise<string> {
    // Add humor injection 30% of the time
    if (Math.random() < 0.3) {
      const humorousName = this.injectHumor(sources, 2);
      if (humorousName) return humorousName;
    }

    const patterns = [
      // Invented/Compound word patterns
      () => {
        const prefixes = ['neo', 'hyper', 'ultra', 'meta', 'proto', 'omni', 'anti'];
        const base = getRandomWord([...sources.validNouns, ...sources.validGenreTerms, ...sources.validMusicalTerms]) || 'wave';
        const prefix = getRandomWord(prefixes);
        const suffix = getRandomWord(['core', 'wave', 'flux', 'sphere', 'verse', 'scape']) || 'core';
        return Math.random() > 0.5 
          ? `${capitalize(prefix + base)} ${capitalize(suffix)}`
          : `${capitalize(base + suffix)} ${capitalize(getRandomWord(sources.validNouns) || 'echo')}`;
      },
      
      // Number/Code + Concept
      () => {
        const numbers = ['Zero', 'Seven', 'Eleven', '404', '808', 'XIII', 'Binary', 'Infinite'];
        const concepts = [...sources.validMusicalTerms, ...sources.validGenreTerms, 'Void', 'Nexus', 'Prism', 'Paradox'];
        const number = getRandomWord(numbers);
        const concept = getRandomWord(concepts) || 'Echo';
        return `${number} ${capitalize(concept)}`;
      },
      
      // Rare adjective + Unique noun
      async () => {
        const rareAdjs = ['Lucid', 'Visceral', 'Ethereal', 'Prismatic', 'Chromatic', 'Holographic', 'Iridescent', 'Crystalline'];
        const uniqueNouns = ['Prism', 'Void', 'Nexus', 'Flux', 'Vortex', 'Paradox', 'Enigma', 'Cipher'];
        
        // Try to get rare adjectives from Datamuse
        const noun = getRandomWord([...uniqueNouns, ...sources.validMusicalTerms]) || 'prism';
        try {
          const adjectives = await this.datamuseService.findAdjectivesForNoun(noun.toLowerCase(), 20);
          if (adjectives && adjectives.length > 0) {
            const rareDatamuseAdjs = adjectives
              .filter((adj: any) => adj.word.length > 6 && !['good', 'bad', 'big', 'small', 'new', 'old'].includes(adj.word))
              .map((a: any) => a.word);
            if (rareDatamuseAdjs.length > 0) {
              const adj = getRandomWord(rareDatamuseAdjs);
              if (adj) {
                return `${capitalize(adj)} ${capitalize(noun)}`;
              }
            }
          }
        } catch (error) {
          secureLog.debug('Error getting rare adjectives:', error);
        }
        
        const adj = getRandomWord(rareAdjs);
        return `${adj} ${capitalize(noun)}`;
      },
      
      // Genre-specific tech/nature fusion
      () => {
        const techWords = ['Pixel', 'Glitch', 'Byte', 'Cyber', 'Quantum', 'Digital', 'Analog', 'Fractal', 'Neon'];
        const natureWords = ['Aurora', 'Nebula', 'Cosmos', 'Horizon', 'Eclipse', 'Twilight', 'Zenith'];
        const tech = getRandomWord([...techWords, ...sources.genreTerms.filter((t: string) => t.length > 5)]) || 'Pixel';
        const nature = getRandomWord([...natureWords, ...sources.contextualWords]) || 'Aurora';
        return `${tech} ${nature}`;
      },
      
      // Portmanteau creation
      () => {
        const word1 = getRandomWord([...sources.nouns, ...sources.adjectives]) || 'dream';
        const word2 = getRandomWord([...sources.nouns, ...sources.musicalTerms]) || 'scape';
        // Create a portmanteau by combining parts of words
        const portmanteau = word1.substring(0, Math.ceil(word1.length * 0.6)) + 
                           word2.substring(Math.floor(word2.length * 0.4));
        const companion = getRandomWord([...sources.nouns, ...sources.musicalTerms]) || 'echo';
        return `${capitalize(portmanteau)} ${capitalize(companion)}`;
      }
    ];
    
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    return await pattern();
  }

  private async generateThreeWordContextual(sources: EnhancedWordSource, type: string, genre?: string): Promise<string> {
    // Add question format 15% of the time for songs
    if (type === 'song' && Math.random() < 0.15) {
      const question = this.generateQuestion(sources, 3);
      if (question) return question;
    }

    // Add humor injection 25% of the time
    if (Math.random() < 0.25) {
      const humorousName = this.injectHumor(sources, 3);
      if (humorousName) return humorousName;
    }
    // For bands, heavily favor "The [Adjective] [Noun]" pattern
    if (type === 'band') {
      const bandPatterns = [
        // Classic "The [Adjective] [Noun]" pattern - weighted heavily
        () => this.generateTheAdjectiveNoun(sources),
        () => this.generateTheAdjectiveNoun(sources),
        () => this.generateTheAdjectiveNoun(sources),
        () => this.generateTheAdjectiveNoun(sources),
        
        // Other patterns with lower weight
        () => {
          const adj = getRandomWord(sources.adjectives) || 'wild';
          const noun1 = getRandomWord(sources.nouns) || 'fire';
          const noun2 = getRandomWord(sources.nouns) || 'soul';
          return `${capitalize(adj)} ${capitalize(singularize(noun1))} ${capitalize(singularize(noun2))}`;
        },
        () => {
          const noun1 = getRandomWord(sources.nouns) || 'shadow';
          const connective = getRandomWord(['of', 'and', 'in']);
          const noun2 = getRandomWord([...sources.nouns, ...sources.musicalTerms]) || 'light';
          return `${capitalize(singularize(noun1))} ${connective} ${capitalize(singularize(noun2))}`;
        }
      ];
      
      const pattern = bandPatterns[Math.floor(Math.random() * bandPatterns.length)];
      return pattern();
    }
    
    // For songs, use more unique and creative patterns
    const songPatterns = [
      // Compound word + verb/noun
      () => {
        const prefixes = ['neo', 'hyper', 'ultra', 'meta', 'proto', 'anti'];
        const base = getRandomWord([...sources.nouns, ...sources.genreTerms]) || 'wave';
        const prefix = getRandomWord(prefixes);
        const compound = capitalize(prefix + base);
        const action = getRandomWord([...sources.verbs.map((v: string) => v + 's'), 'rises', 'echoes', 'falls']) || 'rises';
        const modifier = getRandomWord(['tonight', 'within', 'beyond', 'alone']) || 'tonight';
        return `${compound} ${capitalize(action)} ${capitalize(modifier)}`;
      },
      // Number/Symbol + unique phrase
      () => {
        const numbers = ['Zero', 'Seven', '404', 'XIII', 'Binary'];
        const number = getRandomWord(numbers);
        const concepts = ['point', 'degrees', 'minutes', 'seconds', 'miles'];
        const concept = getRandomWord(concepts) || 'degrees';
        const direction = getRandomWord(['north', 'south', 'beyond', 'below', 'within']) || 'north';
        return `${number} ${capitalize(concept)} ${capitalize(direction)}`;
      },
      // Invented word + preposition + noun
      () => {
        const base = getRandomWord([...sources.nouns.filter((n: string) => n.length < 7), ...sources.genreTerms]) || 'dream';
        const endings = ['scape', 'verse', 'core', 'flux', 'wave'];
        const ending = getRandomWord(endings);
        const inventedWord = capitalize(base + ending);
        const prep = getRandomWord(['beyond', 'beneath', 'within', 'without']) || 'beyond';
        const noun = getRandomWord([...sources.musicalTerms, 'horizon', 'nexus', 'void']) || 'horizon';
        return `${inventedWord} ${prep} ${capitalize(noun)}`;
      },
      // Rare adjective + verb + adverb
      () => {
        const rareAdjs = ['lucid', 'ethereal', 'visceral', 'prismatic', 'holographic'];
        const adj = getRandomWord(rareAdjs) || 'lucid';
        const uniqueVerbs = sources.verbs.filter((v: string) => v.length > 5 && !['walk', 'run', 'go', 'come', 'take'].includes(v));
        const verb = getRandomWord(uniqueVerbs) || 'transcend';
        const adverbs = ['endlessly', 'silently', 'eternally', 'backwards', 'sideways'];
        const adverb = getRandomWord(adverbs) || 'endlessly';
        return `${capitalize(adj)} ${capitalize(verb)}s ${capitalize(adverb)}`;
      },
      // Genre mashup pattern
      () => {
        const genres = ['pixel', 'neon', 'cyber', 'vapor', 'glitch', 'retro'];
        const genre = getRandomWord(genres) || 'pixel';
        const emotions = ['euphoria', 'melancholy', 'nostalgia', 'catharsis', 'serenity'];
        const emotion = getRandomWord(emotions) || 'euphoria';
        const suffix = getRandomWord(['syndrome', 'complex', 'theory', 'paradox']) || 'syndrome';
        return `${capitalize(genre)} ${capitalize(emotion)} ${capitalize(suffix)}`;
      },
      // Original pattern but with rare words only
      () => {
        const adj = getRandomWord(sources.adjectives.filter((a: string) => a.length > 7)) || 'chromatic';
        const noun = getRandomWord([...sources.musicalTerms, ...sources.genreTerms].filter((n: string) => n.length > 6)) || 'resonance';
        return `The ${capitalize(adj)} ${capitalize(noun)}`;
      }
    ];
    
    const pattern = songPatterns[Math.floor(Math.random() * songPatterns.length)];
    return pattern();
  }

  private generateTheAdjectiveNoun(sources: EnhancedWordSource): string {
    const adj = getRandomWord(sources.adjectives) || 'electric';
    const noun = getRandomWord(sources.nouns) || 'storm';
    return `The ${capitalize(adj)} ${capitalize(singularize(noun))}`;
  }

  private async generateLongFormContextual(sources: EnhancedWordSource, wordCount: number, type: string): Promise<string> {
    // Use narrative arcs for longer names (6+ words) 40% of the time
    if (wordCount >= 6 && Math.random() < 0.4) {
      const narrative = this.generateNarrativeArc(sources, wordCount);
      if (narrative) return narrative;
    }
    switch (wordCount) {
      case 4:
        return this.generateFourWordPoetic(sources, type);
      case 5:
        return this.generateFiveWordNarrative(sources, type);
      case 6:
        return this.generateSixWordStatement(sources, type);
      case 7:
        return this.generateSevenWordStory(sources, type);
      case 8:
        return this.generateEightWordEpic(sources, type);
      case 9:
        return this.generateNineWordJourney(sources, type);
      case 10:
        return this.generateTenWordSaga(sources, type);
      default:
        return this.generateStructuredPhrase(sources, wordCount);
    }
  }

  private generateFourWordPoetic(sources: EnhancedWordSource, type: string): string {
    const patterns = [
      // Pattern: "The [Noun] of [Noun]"
      () => {
        const noun1 = getRandomWord(sources.nouns) || 'shadow';
        const noun2 = getRandomWord([...sources.nouns, ...sources.contextualWords]) || 'light';
        return `The ${capitalize(singularize(noun1))} of ${capitalize(singularize(noun2))}`;
      },
      
      // Pattern: "[Verb] the [Adj] [Noun]"
      () => {
        const verb = getRandomWord(sources.verbs) || 'chase';
        const adj = getRandomWord(sources.adjectives) || 'wild';
        const noun = getRandomWord(sources.nouns) || 'dream';
        return `${capitalize(verb)} the ${capitalize(adj)} ${capitalize(singularize(noun))}`;
      },
      
      // Pattern: "[Adj] [Noun] [Verb] [Adverb]"
      () => {
        const adj = getRandomWord(sources.adjectives) || 'silent';
        const noun = getRandomWord(sources.nouns) || 'heart';
        const verb = getRandomWord(sources.verbs) || 'beats';
        const adverb = getRandomWord(['Alone', 'Forever', 'Within', 'Tonight']);
        return `${capitalize(adj)} ${capitalize(singularize(noun))} ${capitalize(verb)} ${adverb}`;
      },
      
      // Pattern: "When [Noun] [Verb] [Noun]"
      () => {
        const noun1 = getRandomWord(sources.nouns) || 'shadows';
        const verb = getRandomWord(sources.verbs) || 'meet';
        const noun2 = getRandomWord(sources.nouns) || 'light';
        return `When ${capitalize(noun1)} ${capitalize(verb)} ${capitalize(singularize(noun2))}`;
      }
    ];
    
    return patterns[Math.floor(Math.random() * patterns.length)]();
  }

  private generateFiveWordNarrative(sources: EnhancedWordSource, type: string): string {
    const patterns = [
      // Pattern: "[Noun] [Verb] in the [Noun]"
      () => {
        const noun1 = getRandomWord(sources.nouns) || 'souls';
        const verb = getRandomWord(sources.verbs) || 'dance';
        const noun2 = getRandomWord([...sources.nouns, ...sources.contextualWords]) || 'darkness';
        return `${capitalize(noun1)} ${capitalize(verb)} in the ${capitalize(singularize(noun2))}`;
      },
      
      // Pattern: "The [Adj] [Noun] [Verb] [Adverb]"
      () => {
        const adj = getRandomWord(sources.adjectives) || 'broken';
        const noun = getRandomWord(sources.nouns) || 'promise';
        const verb = getRandomWord(sources.verbs) || 'fades';
        const adverb = getRandomWord(['Away', 'Slowly', 'Forever', 'Tonight']);
        return `The ${capitalize(adj)} ${capitalize(singularize(noun))} ${capitalize(verb)} ${adverb}`;
      },
      
      // Pattern: "[Verb] [Prep] the [Adj] [Noun]"
      () => {
        const verb = getRandomWord(sources.verbs) || 'lost';
        const prep = getRandomWord(['Beyond', 'Within', 'Beneath', 'Above']);
        const adj = getRandomWord(sources.adjectives) || 'endless';
        const noun = getRandomWord(sources.nouns) || 'horizon';
        return `${capitalize(verb)} ${prep} the ${capitalize(adj)} ${capitalize(singularize(noun))}`;
      }
    ];
    
    return patterns[Math.floor(Math.random() * patterns.length)]();
  }

  private generateSixWordStatement(sources: EnhancedWordSource, type: string): string {
    const patterns = [
      // Pattern: "The [Noun] [Verb] [Prep] [Adj] [Ending]"
      () => {
        const noun = getRandomWord(sources.nouns) || 'heart';
        const verb = getRandomWord(sources.verbs) || 'beats';
        const prep = getRandomWord(['with', 'for', 'in', 'through']);
        const adj = getRandomWord(sources.adjectives) || 'endless';
        const endings = ['Dreams', 'Light', 'Hope', 'Fire', 'Love', 'Time'];
        const ending = getRandomWord(endings);
        return `The ${capitalize(singularize(noun))} ${capitalize(verb)} ${prep} ${capitalize(adj)} ${ending}`;
      },
      
      // Pattern: "[Adj] [Noun] [Verb] the [Adj] [Noun]"
      () => {
        const adj1 = getRandomWord(sources.adjectives) || 'silent';
        const noun1 = getRandomWord(sources.nouns) || 'voices';
        const verb = getRandomWord(sources.verbs) || 'haunt';
        const adj2 = getRandomWord(sources.adjectives) || 'empty';
        const noun2 = getRandomWord(sources.nouns) || 'halls';
        return `${capitalize(adj1)} ${capitalize(noun1)} ${capitalize(verb)} the ${capitalize(adj2)} ${capitalize(noun2)}`;
      }
    ];
    
    return patterns[Math.floor(Math.random() * patterns.length)]();
  }

  private generateSevenWordStory(sources: EnhancedWordSource, type: string): string {
    const patterns = [
      // Pattern: "When the [Adj] [Noun] [Verb] [Ending]"
      () => {
        const adj = getRandomWord(sources.adjectives) || 'last';
        const noun = getRandomWord(sources.nouns) || 'star';
        const verb = getRandomWord(sources.verbs) || 'falls';
        const endings = ['We Dance Tonight', 'Hope Fades Away', 'Dreams Come True', 'Love Remains Forever'];
        const ending = getRandomWord(endings);
        return `When the ${capitalize(adj)} ${capitalize(singularize(noun))} ${capitalize(verb)} ${ending}`;
      },
      
      // Pattern: "[Noun] and [Noun] [Verb] [Prep] the [Noun]"
      () => {
        const noun1 = getRandomWord(sources.nouns) || 'fire';
        const noun2 = getRandomWord(sources.nouns) || 'ice';
        const verb = getRandomWord(sources.verbs) || 'dance';
        const prep = getRandomWord(['beneath', 'beyond', 'within', 'above']);
        const noun3 = getRandomWord(sources.nouns) || 'stars';
        return `${capitalize(singularize(noun1))} and ${capitalize(singularize(noun2))} ${capitalize(verb)} ${prep} the ${capitalize(noun3)}`;
      }
    ];
    
    return patterns[Math.floor(Math.random() * patterns.length)]();
  }

  private generateEightWordEpic(sources: EnhancedWordSource, type: string): string {
    const patterns = [
      // Epic narrative pattern
      () => {
        const adj1 = getRandomWord(sources.adjectives) || 'ancient';
        const noun1 = getRandomWord(sources.nouns) || 'warriors';
        const verb = getRandomWord(sources.verbs) || 'rise';
        const prep = getRandomWord(['from', 'beyond', 'through', 'beneath']);
        const adj2 = getRandomWord(sources.adjectives) || 'forgotten';
        const noun2 = getRandomWord(sources.nouns) || 'realms';
        const ending = getRandomWord(['of Time', 'Once More', 'at Dawn']);
        return `${capitalize(adj1)} ${capitalize(noun1)} ${capitalize(verb)} ${prep} the ${capitalize(adj2)} ${capitalize(noun2)} ${ending}`;
      }
    ];
    
    return patterns[Math.floor(Math.random() * patterns.length)]();
  }

  private generateNineWordJourney(sources: EnhancedWordSource, type: string): string {
    const patterns = [
      // Journey pattern
      () => {
        const traveler = getRandomWord(['We', 'They', 'Souls', 'Hearts']);
        const verb1 = getRandomWord(sources.verbs) || 'journey';
        const prep1 = getRandomWord(['through', 'across', 'beyond']);
        const adj = getRandomWord(sources.adjectives) || 'endless';
        const noun = getRandomWord(sources.nouns) || 'night';
        const verb2 = getRandomWord(['seeking', 'finding', 'chasing']);
        const adj2 = getRandomWord(sources.adjectives) || 'lost';
        const noun2 = getRandomWord(sources.nouns) || 'light';
        return `${traveler} ${capitalize(verb1)} ${prep1} the ${capitalize(adj)} ${capitalize(singularize(noun))} ${verb2} ${capitalize(adj2)} ${capitalize(singularize(noun2))}`;
      }
    ];
    
    return patterns[Math.floor(Math.random() * patterns.length)]();
  }

  private generateTenWordSaga(sources: EnhancedWordSource, type: string): string {
    const patterns = [
      // Saga pattern
      () => {
        const opener = getRandomWord(['Once', 'When', 'Where']);
        const adj1 = getRandomWord(sources.adjectives) || 'broken';
        const noun1 = getRandomWord(sources.nouns) || 'dreams';
        const verb1 = getRandomWord(sources.verbs) || 'collide';
        const conj = 'with';
        const adj2 = getRandomWord(sources.adjectives) || 'shattered';
        const noun2 = getRandomWord(sources.nouns) || 'hopes';
        const closer = getRandomWord(['Love Finds a Way', 'New Worlds Are Born', 'The Story Begins']);
        return `${opener} ${capitalize(adj1)} ${capitalize(noun1)} ${capitalize(verb1)} ${conj} ${capitalize(adj2)} ${capitalize(noun2)}, ${closer}`;
      }
    ];
    
    return patterns[Math.floor(Math.random() * patterns.length)]();
  }

  private generateNarrativeArc(sources: EnhancedWordSource, wordCount: number): string | null {
    try {
      const arcTypes = Object.keys(this.narrativeArcs);
      const selectedArc = arcTypes[Math.floor(Math.random() * arcTypes.length)] as keyof typeof this.narrativeArcs;
      const templates = this.narrativeArcs[selectedArc];
      const template = templates[Math.floor(Math.random() * templates.length)];
      
      let result = template;
      
      // Replace placeholders with contextual words
      result = result.replace(/{noun}/g, () => capitalize(singularize(getRandomWord(sources.nouns) || 'dream')));
      result = result.replace(/{verb}/g, () => capitalize(getRandomWord(sources.verbs) || 'dance'));
      result = result.replace(/{adjective}/g, () => capitalize(getRandomWord(sources.adjectives) || 'eternal'));
      result = result.replace(/{adverb}/g, () => capitalize(getRandomWord(['slowly', 'quickly', 'endlessly']) || 'slowly'));
      result = result.replace(/{preposition}/g, () => getRandomWord(['through', 'beyond', 'within', 'across']) || 'through');
      
      // Pad or trim to match word count
      const words = result.split(' ');
      
      if (words.length < wordCount) {
        // Add descriptive elements
        while (words.length < wordCount) {
          const insertPosition = Math.floor(Math.random() * words.length);
          const insertWord = capitalize(getRandomWord([...sources.adjectives, ...sources.musicalTerms]) || 'sonic');
          words.splice(insertPosition, 0, insertWord);
        }
      } else if (words.length > wordCount) {
        // Remove less important words (articles, prepositions first)
        const removable = ['the', 'a', 'an', 'of', 'in', 'to', 'from'];
        for (const word of removable) {
          const index = words.findIndex(w => w.toLowerCase() === word);
          if (index !== -1 && words.length > wordCount) {
            words.splice(index, 1);
          }
        }
        // If still too long, truncate
        if (words.length > wordCount) {
          words.length = wordCount;
        }
      }
      
      return words.join(' ');
    } catch (error) {
      secureLog.debug('Narrative arc generation failed:', error);
      return null;
    }
  }

  private generateStructuredPhrase(sources: EnhancedWordSource, wordCount: number): string {
    // Fallback for any word count
    const words: string[] = [];
    
    // Start with an article or determiner sometimes
    if (Math.random() > 0.5 && wordCount > 2) {
      const article = getRandomWord(['The', 'A', 'My', 'Your', 'Our']);
      if (article) {
        words.push(article);
      }
    }
    
    // Add adjectives
    const adjCount = Math.min(Math.floor(wordCount / 3), sources.adjectives.length);
    for (let i = 0; i < adjCount && words.length < wordCount - 1; i++) {
      const adj = getRandomWord(sources.adjectives);
      if (adj && !words.includes(capitalize(adj))) {
        words.push(capitalize(adj));
      }
    }
    
    // Add nouns
    while (words.length < wordCount) {
      const noun = getRandomWord([...sources.nouns, ...sources.musicalTerms]);
      if (noun && !words.includes(capitalize(singularize(noun)))) {
        words.push(capitalize(singularize(noun)));
      }
    }
    
    return words.join(' ');
  }

  private injectHumor(sources: EnhancedWordSource, wordCount: number): string | null {
    try {
      const strategies = [
        // Pun strategy
        () => {
          const punPattern = this.humorPatterns.puns[Math.floor(Math.random() * this.humorPatterns.puns.length)];
          const variation = punPattern.variations[Math.floor(Math.random() * punPattern.variations.length)];
          if (wordCount === 2) {
            const companion = getRandomWord([...sources.nouns, ...sources.adjectives]) || 'club';
            return `${capitalize(variation)} ${capitalize(companion)}`;
          } else if (wordCount === 3) {
            const adj = getRandomWord(sources.adjectives) || 'electric';
            return `The ${capitalize(adj)} ${capitalize(variation)}`;
          }
          return null;
        },
        // Wordplay strategy
        () => {
          const word = getRandomWord([...sources.nouns, ...sources.musicalTerms]) || 'music';
          const playFunc = this.humorPatterns.wordplay[Math.floor(Math.random() * this.humorPatterns.wordplay.length)];
          const playedWord = playFunc(word);
          if (wordCount === 2) {
            const companion = getRandomWord(sources.nouns) || 'club';
            return `${capitalize(playedWord)} ${capitalize(companion)}`;
          } else if (wordCount === 3) {
            const prep = getRandomWord(['of', 'and', 'for']) || 'of';
            const noun = getRandomWord(sources.nouns) || 'sound';
            return `${capitalize(playedWord)} ${prep} ${capitalize(noun)}`;
          }
          return null;
        },
        // Unexpected juxtaposition
        () => {
          const formal = ['Distinguished', 'Eloquent', 'Sophisticated', 'Refined', 'Dignified'];
          const informal = ['Burrito', 'Pickle', 'Waffle', 'Noodle', 'Taco', 'Donut'];
          const formalWord = getRandomWord(formal) || 'Distinguished';
          const informalWord = getRandomWord(informal) || 'Burrito';
          if (wordCount === 2) {
            return `${formalWord} ${informalWord}`;
          } else if (wordCount === 3) {
            const connector = getRandomWord(['and the', 'meets', 'versus']) || 'and the';
            return `${formalWord} ${connector} ${informalWord}`;
          }
          return null;
        }
      ];

      const strategy = strategies[Math.floor(Math.random() * strategies.length)];
      return strategy();
    } catch (error) {
      secureLog.debug('Humor injection failed:', error);
      return null;
    }
  }

  private generateQuestion(sources: EnhancedWordSource, wordCount: number): string | null {
    try {
      if (wordCount < 3) return null;
      
      const template = this.questionTemplates[Math.floor(Math.random() * this.questionTemplates.length)];
      let result = template;
      
      result = result.replace(/{noun}/g, () => capitalize(singularize(getRandomWord(sources.nouns) || 'star')));
      result = result.replace(/{verb}/g, () => capitalize(getRandomWord(sources.verbs) || 'dance'));
      result = result.replace(/{adjective}/g, () => capitalize(getRandomWord(sources.adjectives) || 'wild'));
      result = result.replace(/{adverb}/g, () => capitalize(getRandomWord(['softly', 'quickly', 'deeply']) || 'softly'));
      result = result.replace(/{preposition}/g, () => getRandomWord(['through', 'beyond', 'within']) || 'through');
      
      const words = result.split(' ');
      if (words.length !== wordCount) return null;
      
      return result;
    } catch (error) {
      secureLog.debug('Question generation failed:', error);
      return null;
    }
  }

  private getSimpleFallback(sources: EnhancedWordSource, wordCount: number): string {
    const allWords = [
      ...sources.adjectives,
      ...sources.nouns,
      ...sources.verbs,
      ...sources.musicalTerms
    ];
    
    const words: string[] = [];
    for (let i = 0; i < wordCount; i++) {
      const word = getRandomWord(allWords);
      if (word) {
        words.push(capitalize(word));
      }
    }
    
    return words.join(' ') || 'Echo Dreams';
  }
}