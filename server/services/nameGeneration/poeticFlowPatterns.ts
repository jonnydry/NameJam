import { EnhancedWordSource } from './types';
import { getRandomWord, capitalize, singularize } from './generationHelpers';
import { secureLog } from '../../utils/secureLogger';

export class PoeticFlowPatterns {
  // Natural language connectives for better flow
  private poeticConnectives = {
    prepositions: ['through', 'across', 'beneath', 'beyond', 'within', 'above', 'between', 'among', 'upon', 'under'],
    conjunctions: ['where', 'when', 'while', 'until', 'before', 'after', 'as', 'though', 'if'],
    articles: ['the', 'a', 'an', 'this', 'that', 'these', 'those'],
    transitions: ['yet', 'still', 'only', 'even', 'just', 'almost', 'nearly']
  };

  // Poetic phrase templates for natural flow
  private poeticTemplates = {
    fourWord: [
      '{article} {noun} {preposition} {noun}',
      '{verb} {article} {adjective} {noun}',
      '{conjunction} {noun} {verb} {noun}',
      '{adjective} {noun} {verb} {adverb}',
      '{noun} {conjunction} {adjective} {noun}'
    ],
    fiveWord: [
      '{noun} {verb} {preposition} {article} {noun}',
      '{article} {adjective} {noun} {verb} {adverb}',
      '{conjunction} {article} {noun} {verb} {noun}',
      '{verb} {preposition} {article} {adjective} {noun}',
      '{adjective} {noun} {conjunction} {adjective} {noun}'
    ],
    sixWord: [
      '{article} {noun} {verb} {preposition} {adjective} {noun}',
      '{conjunction} {adjective} {noun} {verb} {article} {noun}',
      '{noun} {verb} {conjunction} {noun} {verb} {adverb}',
      '{preposition} {article} {adjective} {noun} {verb} {noun}',
      '{adjective} {noun} {verb} {transition} {adjective} {noun}'
    ],
    sevenWord: [
      '{article} {adjective} {noun} {verb} {preposition} {adjective} {noun}',
      '{conjunction} {article} {noun} {verb} {conjunction} {noun} {verb}',
      '{noun} {verb} {preposition} {article} {noun} {transition} {adverb}',
      '{adjective} {noun} {conjunction} {adjective} {noun} {verb} {adverb}',
      '{verb} {article} {noun} {conjunction} {verb} {article} {noun}'
    ]
  };

  // Enhanced word selection using all API contexts
  private selectPoeticWord(type: string, sources: EnhancedWordSource, poetryContext?: string[]): string {
    let wordPool: string[] = [];
    
    switch (type) {
      case 'noun':
        wordPool = [
          ...sources.nouns,
          ...sources.musicalTerms,
          ...(sources.spotifyWords || []),
          ...(sources.conceptNetWords || []),
          ...(poetryContext?.filter(w => this.isNounLike(w)) || [])
        ];
        break;
      case 'verb':
        wordPool = [
          ...sources.verbs,
          ...(poetryContext?.filter(w => this.isVerbLike(w)) || [])
        ];
        break;
      case 'adjective':
        wordPool = [
          ...sources.adjectives,
          ...(sources.lastfmWords || []),
          ...(poetryContext?.filter(w => this.isAdjectiveLike(w)) || [])
        ];
        break;
      case 'adverb':
        wordPool = ['softly', 'slowly', 'gently', 'wildly', 'deeply', 'truly', 'freely', 'blindly', 'madly', 'clearly'];
        break;
    }
    
    // Filter and select best word
    const filtered = wordPool.filter(w => w && w.length > 2 && w.length < 12);
    return getRandomWord(filtered) || this.getFallbackWord(type);
  }

  private isNounLike(word: string): boolean {
    // Simple heuristic for noun detection
    const nounEndings = ['ness', 'ment', 'tion', 'sion', 'ity', 'age', 'ence', 'ance'];
    return !this.isVerbLike(word) && !this.isAdjectiveLike(word) || 
           nounEndings.some(ending => word.endsWith(ending));
  }

  private isVerbLike(word: string): boolean {
    // Simple heuristic for verb detection
    const verbEndings = ['ing', 'ed', 'es', 'ize', 'ify', 'ate'];
    return verbEndings.some(ending => word.endsWith(ending));
  }

  private isAdjectiveLike(word: string): boolean {
    // Simple heuristic for adjective detection
    const adjEndings = ['ful', 'less', 'ous', 'ive', 'able', 'ible', 'al', 'ic'];
    return adjEndings.some(ending => word.endsWith(ending));
  }

  private getFallbackWord(type: string): string {
    const fallbacks = {
      noun: ['dream', 'shadow', 'light', 'soul', 'heart', 'fire', 'storm', 'echo'],
      verb: ['dance', 'sing', 'flow', 'burn', 'rise', 'fall', 'drift', 'shine'],
      adjective: ['wild', 'silent', 'broken', 'eternal', 'lost', 'golden', 'endless', 'sacred'],
      adverb: ['slowly', 'gently', 'forever', 'deeply', 'softly', 'wildly', 'truly', 'freely']
    };
    return getRandomWord(fallbacks[type as keyof typeof fallbacks] || fallbacks.noun);
  }

  generatePoeticName(wordCount: number, sources: EnhancedWordSource, poetryContext?: string[]): string {
    // Select appropriate template based on word count
    let templates: string[] = [];
    
    if (wordCount === 4) {
      templates = this.poeticTemplates.fourWord;
    } else if (wordCount === 5) {
      templates = this.poeticTemplates.fiveWord;
    } else if (wordCount === 6) {
      templates = this.poeticTemplates.sixWord;
    } else if (wordCount >= 7) {
      templates = this.poeticTemplates.sevenWord;
    } else {
      // For other word counts, generate custom pattern
      return this.generateCustomPoeticPhrase(wordCount, sources, poetryContext);
    }
    
    const template = getRandomWord(templates) || templates[0];
    if (!template) return this.generateCustomPoeticPhrase(wordCount, sources, poetryContext);
    
    // Replace template placeholders with actual words
    let result = template;
    
    // Replace each placeholder
    result = result.replace(/{article}/g, () => getRandomWord(this.poeticConnectives.articles) || 'the');
    result = result.replace(/{preposition}/g, () => getRandomWord(this.poeticConnectives.prepositions) || 'through');
    result = result.replace(/{conjunction}/g, () => getRandomWord(this.poeticConnectives.conjunctions) || 'where');
    result = result.replace(/{transition}/g, () => getRandomWord(this.poeticConnectives.transitions) || 'yet');
    result = result.replace(/{noun}/g, () => {
      const word = this.selectPoeticWord('noun', sources, poetryContext);
      return capitalize(singularize(word));
    });
    result = result.replace(/{verb}/g, () => {
      const word = this.selectPoeticWord('verb', sources, poetryContext);
      return capitalize(word);
    });
    result = result.replace(/{adjective}/g, () => {
      const word = this.selectPoeticWord('adjective', sources, poetryContext);
      return capitalize(word);
    });
    result = result.replace(/{adverb}/g, () => {
      const word = this.selectPoeticWord('adverb', sources, poetryContext);
      return capitalize(word);
    });
    
    // Clean up the result
    result = this.cleanupPhrase(result);
    
    secureLog.debug(`🎭 Generated poetic ${wordCount}-word name: "${result}"`);
    return result;
  }

  private generateCustomPoeticPhrase(wordCount: number, sources: EnhancedWordSource, poetryContext?: string[]): string {
    const words: string[] = [];
    
    // Start with article or conjunction for natural flow
    if (Math.random() > 0.3 && wordCount > 3) {
      const starter = getRandomWord(['The', 'A', 'Where', 'When', 'As', 'If']) || 'The';
      words.push(starter);
    }
    
    // Build phrase with natural grammar
    while (words.length < wordCount) {
      const remaining = wordCount - words.length;
      
      if (remaining >= 3 && Math.random() > 0.5) {
        // Add a noun phrase (adj + noun)
        const adj = this.selectPoeticWord('adjective', sources, poetryContext);
        const noun = this.selectPoeticWord('noun', sources, poetryContext);
        words.push(capitalize(adj), capitalize(singularize(noun)));
      } else if (remaining >= 2 && Math.random() > 0.5) {
        // Add verb + adverb or noun + verb
        if (Math.random() > 0.5) {
          const verb = this.selectPoeticWord('verb', sources, poetryContext);
          const adverb = this.selectPoeticWord('adverb', sources, poetryContext);
          words.push(capitalize(verb), capitalize(adverb));
        } else {
          const noun = this.selectPoeticWord('noun', sources, poetryContext);
          const verb = this.selectPoeticWord('verb', sources, poetryContext);
          words.push(capitalize(singularize(noun)), capitalize(verb));
        }
      } else {
        // Add single word
        const type = getRandomWord(['noun', 'verb', 'adjective']) || 'noun';
        const word = this.selectPoeticWord(type, sources, poetryContext);
        words.push(capitalize(type === 'noun' ? singularize(word) : word));
      }
      
      // Add connectives for flow
      if (words.length < wordCount - 1 && Math.random() > 0.6) {
        const connective = getRandomWord([...this.poeticConnectives.prepositions, ...this.poeticConnectives.conjunctions]) || 'and';
        words.push(connective);
      }
    }
    
    // Ensure we have exactly the right number of words
    return words.slice(0, wordCount).join(' ');
  }

  private cleanupPhrase(phrase: string): string {
    // Fix common grammar issues
    phrase = phrase.replace(/\s+/g, ' ').trim();
    phrase = phrase.replace(/\b(a) ([aeiou])/gi, 'an $2');
    phrase = phrase.replace(/\b(an) ([^aeiou])/gi, 'a $2');
    
    // Capitalize properly
    const words = phrase.split(' ');
    return words.map((word, index) => {
      // Don't capitalize articles, prepositions, conjunctions unless first word
      const lowercase = ['the', 'a', 'an', 'of', 'in', 'on', 'at', 'to', 'for', 'and', 'or', 'but', 'with', 'as'];
      if (index === 0 || !lowercase.includes(word.toLowerCase())) {
        return capitalize(word);
      }
      return word.toLowerCase();
    }).join(' ');
  }
}

export const poeticFlowPatterns = new PoeticFlowPatterns();