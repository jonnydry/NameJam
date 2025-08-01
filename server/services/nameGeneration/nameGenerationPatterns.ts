import { EnhancedWordSource } from './types';
import { DatamuseService } from '../datamuseService';
import { secureLog } from '../../utils/secureLogger';
import { 
  singularize, 
  capitalize, 
  isLikelyAdjective, 
  isLikelyVerb,
  isBandName,
  getRandomWord,
  isGenreAppropriate 
} from './generationHelpers';
import { generateSmartBandName, generateSmartSongName } from './smartNamePatterns';
import { poeticFlowPatterns } from './poeticFlowPatterns';

export class NameGenerationPatterns {
  constructor(private datamuseService: DatamuseService) {}

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
    const singleWordSources = [
      ...sources.nouns.filter(n => n.length >= 4),
      ...sources.musicalTerms,
      ...sources.genreTerms
    ];
    
    if (singleWordSources.length > 0) {
      const word = getRandomWord(singleWordSources);
      return word ? capitalize(singularize(word)) : 'Echo';
    }
    
    return 'Echo';
  }

  private async generateTwoWordContextual(sources: EnhancedWordSource, type: string, genre?: string): Promise<string> {
    const patterns = [
      // Adjective + Noun pattern (most common)
      async () => {
        const noun = getRandomWord(sources.nouns) || 'soul';
        try {
          const adjectives = await this.datamuseService.findAdjectivesForNoun(noun, 10);
          if (adjectives && adjectives.length > 0) {
            const filteredAdjs = genre ? 
              adjectives.filter((adj: any) => isGenreAppropriate(adj.word, genre)) : 
              adjectives;
            if (filteredAdjs.length > 0) {
              const adj = getRandomWord(filteredAdjs.map((a: any) => a.word));
              return `${capitalize(adj)} ${capitalize(singularize(noun))}`;
            }
          }
        } catch (error) {
          secureLog.debug('Error getting adjectives for noun:', error);
        }
        const fallbackAdj = getRandomWord(sources.adjectives) || 'wild';
        return `${capitalize(fallbackAdj)} ${capitalize(singularize(noun))}`;
      },
      
      // Noun + Noun compound
      () => {
        const noun1 = getRandomWord([...sources.nouns, ...sources.genreTerms]) || 'fire';
        const noun2 = getRandomWord([...sources.nouns, ...sources.musicalTerms]) || 'soul';
        return `${capitalize(singularize(noun1))} ${capitalize(singularize(noun2))}`;
      },
      
      // Color/Material + Object
      () => {
        const materials = ['Silver', 'Gold', 'Crystal', 'Velvet', 'Iron', 'Glass', 'Stone'];
        const material = getRandomWord(materials);
        const noun = getRandomWord(sources.nouns) || 'dream';
        return `${material} ${capitalize(singularize(noun))}`;
      }
    ];
    
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    return await pattern();
  }

  private async generateThreeWordContextual(sources: EnhancedWordSource, type: string, genre?: string): Promise<string> {
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
    
    // For songs, use more varied patterns
    const songPatterns = [
      () => this.generateTheAdjectiveNoun(sources),
      () => {
        const verb = getRandomWord(sources.verbs) || 'burn';
        const adj = getRandomWord(sources.adjectives) || 'bright';
        const noun = getRandomWord(sources.nouns) || 'light';
        return `${capitalize(verb)} ${capitalize(adj)} ${capitalize(singularize(noun))}`;
      },
      () => {
        const noun1 = getRandomWord(sources.nouns) || 'heart';
        const verb = getRandomWord(sources.verbs) || 'beats';
        const adverb = getRandomWord(['Forever', 'Always', 'Never', 'Still']);
        return `${capitalize(singularize(noun1))} ${capitalize(verb)} ${adverb}`;
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

  private generateStructuredPhrase(sources: EnhancedWordSource, wordCount: number): string {
    // Fallback for any word count
    const words: string[] = [];
    
    // Start with an article or determiner sometimes
    if (Math.random() > 0.5 && wordCount > 2) {
      words.push(getRandomWord(['The', 'A', 'My', 'Your', 'Our']));
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