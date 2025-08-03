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

  // Poetic phrase templates for natural flow - expanded for more variety
  private poeticTemplates = {
    fourWord: [
      '{article} {noun} {preposition} {noun}',
      '{verb} {article} {adjective} {noun}',
      '{conjunction} {noun} {verb} {noun}',
      '{adjective} {noun} {verb} {adverb}',
      '{noun} {conjunction} {adjective} {noun}',
      '{noun} {verb} {noun} {adverb}',
      '{adjective} {adjective} {noun} {noun}'
    ],
    fiveWord: [
      '{noun} {verb} {preposition} {article} {noun}',
      '{article} {adjective} {noun} {verb} {adverb}',
      '{conjunction} {article} {noun} {verb} {noun}',
      '{verb} {preposition} {article} {adjective} {noun}',
      '{adjective} {noun} {conjunction} {adjective} {noun}',
      '{noun} {noun} {verb} {adjective} {noun}',
      '{verb} {conjunction} {verb} {article} {noun}'
    ],
    sixWord: [
      '{article} {noun} {verb} {preposition} {adjective} {noun}',
      '{conjunction} {adjective} {noun} {verb} {article} {noun}',
      '{noun} {verb} {conjunction} {noun} {verb} {adverb}',
      '{preposition} {article} {adjective} {noun} {verb} {noun}',
      '{adjective} {noun} {verb} {transition} {adjective} {noun}',
      '{noun} {verb} {noun} {verb} {noun} {noun}',
      '{adjective} {noun} {adjective} {noun} {verb} {adverb}'
    ],
    sevenWord: [
      '{article} {adjective} {noun} {verb} {preposition} {adjective} {noun}',
      '{conjunction} {article} {noun} {verb} {conjunction} {noun} {verb}',
      '{noun} {verb} {preposition} {article} {noun} {transition} {adverb}',
      '{adjective} {noun} {conjunction} {adjective} {noun} {verb} {adverb}',
      '{verb} {article} {noun} {conjunction} {verb} {article} {noun}',
      '{noun} {verb} {verb} {article} {adjective} {adjective} {noun}',
      '{adjective} {adjective} {noun} {verb} {preposition} {article} {noun}'
    ],
    eightWord: [
      '{article} {adjective} {adjective} {noun} {verb} {preposition} {adjective} {noun}',
      '{noun} {verb} {article} {noun} {conjunction} {verb} {article} {noun}',
      '{conjunction} {article} {adjective} {noun} {verb} {preposition} {adjective} {noun}',
      '{verb} {article} {noun} {transition} {verb} {article} {adjective} {noun}'
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
    const filtered = wordPool
      .filter(w => w && w.length > 2 && w.length < 12)
      .filter(w => !this.isOverlyArchaic(w))
      .filter(w => !this.hasDoubleSuffix(w));
    
    return getRandomWord(filtered) || this.getFallbackWord(type);
  }

  private isNounLike(word: string): boolean {
    // Simple heuristic for noun detection
    const nounEndings = ['ness', 'ment', 'tion', 'sion', 'ity', 'age', 'ence', 'ance'];
    return (!this.isVerbLike(word) && !this.isAdjectiveLike(word)) || 
           nounEndings.some(ending => word.endsWith(ending));
  }

  private isVerbLike(word: string): boolean {
    // Simple heuristic for verb detection
    const verbEndings = ['ing', 'ed', 'es', 'ize', 'ify', 'ate'];
    // Don't classify common nouns ending in -ing as verbs
    const nounExceptions = ['ring', 'sing', 'thing', 'king', 'wing', 'spring', 'string'];
    if (nounExceptions.includes(word.toLowerCase())) return false;
    return verbEndings.some(ending => word.endsWith(ending));
  }

  private isAdjectiveLike(word: string): boolean {
    // Simple heuristic for adjective detection
    const adjEndings = ['ful', 'less', 'ous', 'ive', 'able', 'ible', 'al', 'ic'];
    return adjEndings.some(ending => word.endsWith(ending));
  }

  private isOverlyArchaic(word: string): boolean {
    // Filter out overly archaic or academic words that don't fit modern band names
    const archaic = [
      'cimmerian', 'effulgent', 'perspicacious', 'pulchritudinous', 'sesquipedalian',
      'antediluvian', 'sanguinary', 'tenebrous', 'lugubrious', 'obstreperous',
      'grandiloquent', 'pusillanimous', 'oleaginous', 'salubrious', 'perspicuous',
      'recondite', 'quotidian', 'mendacious', 'propinquity', 'penultimate'
    ];
    return archaic.includes(word.toLowerCase());
  }

  private hasDoubleSuffix(word: string): boolean {
    // Prevent malformed words like "gloaminging"
    const suffixPatterns = [
      /inging$/, /eded$/, /eses$/, /fulful$/, /lessless$/, /nessness$/,
      /mentment$/, /tiontion$/, /iveive$/, /ousous$/, /alal$/, /icic$/,
      /inging$/, /lyly$/, /erness$/, /ousous$/, /ismism$/
    ];
    // Also check for verbs that already end with -ing getting another -ing
    if (word.match(/\w+ing$/i) && this.isVerbLike(word)) {
      // If it's already a verb ending in -ing, flag it for filtering
      return true;
    }
    return suffixPatterns.some(pattern => pattern.test(word.toLowerCase()));
  }

  private getFallbackWord(type: string): string {
    const fallbacks = {
      noun: ['dream', 'shadow', 'light', 'soul', 'heart', 'fire', 'storm', 'echo'],
      verb: ['dance', 'sing', 'flow', 'burn', 'rise', 'fall', 'drift', 'shine'],
      adjective: ['wild', 'silent', 'broken', 'eternal', 'lost', 'golden', 'endless', 'sacred'],
      adverb: ['slowly', 'gently', 'forever', 'deeply', 'softly', 'wildly', 'truly', 'freely']
    };
    return getRandomWord(fallbacks[type as keyof typeof fallbacks] || fallbacks.noun) || 'soul';
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
    } else if (wordCount === 7) {
      templates = this.poeticTemplates.sevenWord;
    } else if (wordCount === 8 && this.poeticTemplates.eightWord) {
      templates = this.poeticTemplates.eightWord;
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
      // Don't modify the verb - let word validation handle suffix issues
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
    
    // More natural capitalization for better flow
    const words = phrase.split(' ');
    return words.map((word, index) => {
      // Lowercase articles, prepositions, conjunctions except at start/end
      const lowercase = ['the', 'a', 'an', 'of', 'in', 'on', 'at', 'to', 'for', 'and', 'or', 'but', 'with', 'as', 
                        'through', 'across', 'beneath', 'beyond', 'within', 'above', 'between', 'among', 'upon', 'under',
                        'where', 'when', 'while', 'until', 'before', 'after', 'though', 'if'];
      
      // Always capitalize first and last words
      if (index === 0 || index === words.length - 1) {
        return capitalize(word);
      }
      
      // Keep other words lowercase if they're connectives, capitalize otherwise
      if (lowercase.includes(word.toLowerCase())) {
        return word.toLowerCase();
      }
      
      return capitalize(word);
    }).join(' ');
  }
}

export const poeticFlowPatterns = new PoeticFlowPatterns();