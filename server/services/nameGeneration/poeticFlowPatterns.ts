import { EnhancedWordSource } from './types';
import { getRandomWord, capitalize, singularize } from './generationHelpers';
import { secureLog } from '../../utils/secureLogger';

export class PoeticFlowPatterns {
  // Track recently used templates to avoid repetition
  private recentTemplates: string[] = [];
  private maxRecentTemplates: number = 10;
  
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
      '{adjective} {noun} {adjective} {noun}',  // Changed from double adjective at start
      '{noun} {verb} {transition} {noun}',
      '{article} {verb} {preposition} {noun}',
      // New diverse templates
      '{temporal} {noun} {verb} {noun}',  // "Yesterday Dreams Become Tomorrow"
      '{color} {noun} {preposition} {noun}',  // "Crimson Fire Through Glass"
      '{number} {noun} {conjunction} {noun}',  // "Seven Stars and Moon"
      '{emotion} {verb} {article} {noun}',  // "Sorrow Breaks the Chain"
      '{element} {noun} {verb} {direction}'  // "Fire Heart Goes North"
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
      '{noun} {verb} {noun} {preposition} {article} {noun}',  // Better flow than triple noun
      '{adjective} {noun} {conjunction} {adjective} {noun} {verb}'  // Better balance
    ],
    sevenWord: [
      '{article} {adjective} {noun} {verb} {preposition} {adjective} {noun}',
      '{conjunction} {article} {noun} {verb} {conjunction} {noun} {verb}',
      '{noun} {verb} {preposition} {article} {noun} {transition} {adverb}',
      '{adjective} {noun} {conjunction} {adjective} {noun} {verb} {adverb}',
      '{verb} {article} {noun} {conjunction} {verb} {article} {noun}',
      '{noun} {verb} {article} {adjective} {noun} {preposition} {noun}',  // Better than double verb/adj
      '{adjective} {noun} {verb} {preposition} {article} {adjective} {noun}'  // More balanced
    ],
    eightWord: [
      '{article} {adjective} {adjective} {noun} {verb} {preposition} {adjective} {noun}',
      '{noun} {verb} {article} {noun} {conjunction} {verb} {article} {noun}',
      '{conjunction} {article} {adjective} {noun} {verb} {preposition} {adjective} {noun}',
      '{verb} {article} {noun} {transition} {verb} {article} {adjective} {noun}'
    ]
  };

  // Cultural and era-specific word pools
  private culturalWords = {
    '70s': ['groovy', 'psychedelic', 'cosmic', 'astral', 'karma', 'vibration', 'revolution'],
    '80s': ['neon', 'chrome', 'laser', 'cyber', 'electric', 'synthetic', 'digital'],
    '90s': ['grunge', 'alternative', 'raw', 'angst', 'flannel', 'distorted', 'underground'],
    '00s': ['emo', 'screamo', 'indie', 'blog', 'myspace', 'ipod', 'ringtone'],
    modern: ['viral', 'glitch', 'quantum', 'neo', 'meta', 'vapor', 'lo-fi'],
    timeless: ['eternal', 'infinite', 'ancient', 'sacred', 'mystic', 'legendary', 'immortal']
  };

  private elementWords = {
    fire: ['flame', 'ember', 'blaze', 'inferno', 'spark', 'ash', 'smoke'],
    water: ['ocean', 'wave', 'tide', 'rain', 'river', 'stream', 'cascade'],
    earth: ['stone', 'mountain', 'canyon', 'desert', 'forest', 'roots', 'clay'],
    air: ['wind', 'storm', 'breeze', 'hurricane', 'whisper', 'breath', 'sky']
  };

  private emotionWords = {
    joy: ['bliss', 'euphoria', 'delight', 'ecstasy', 'radiance', 'jubilation'],
    sorrow: ['grief', 'melancholy', 'lament', 'mourning', 'ache', 'longing'],
    anger: ['rage', 'fury', 'wrath', 'vengeance', 'riot', 'rebellion'],
    fear: ['dread', 'terror', 'panic', 'anxiety', 'horror', 'nightmare'],
    love: ['passion', 'devotion', 'romance', 'desire', 'affection', 'intimacy']
  };

  // Enhanced word selection using all API contexts
  private selectPoeticWord(type: string, sources: EnhancedWordSource, poetryContext?: string[]): string {
    let wordPool: string[] = [];
    
    // Add special word types for new templates
    if (type === 'temporal') {
      return getRandomWord(['yesterday', 'tomorrow', 'forever', 'never', 'always', 'sometimes', 'tonight']) || 'forever';
    } else if (type === 'color') {
      return getRandomWord(['crimson', 'azure', 'golden', 'silver', 'violet', 'emerald', 'obsidian']) || 'crimson';
    } else if (type === 'number') {
      return getRandomWord(['seven', 'thirteen', 'hundred', 'thousand', 'zero', 'infinite', 'binary']) || 'seven';
    } else if (type === 'emotion') {
      const emotionType = Object.keys(this.emotionWords)[Math.floor(Math.random() * Object.keys(this.emotionWords).length)] as keyof typeof this.emotionWords;
      return getRandomWord(this.emotionWords[emotionType]) || 'passion';
    } else if (type === 'element') {
      const elementType = Object.keys(this.elementWords)[Math.floor(Math.random() * Object.keys(this.elementWords).length)] as keyof typeof this.elementWords;
      return getRandomWord(this.elementWords[elementType]) || 'fire';
    } else if (type === 'direction') {
      return getRandomWord(['north', 'south', 'east', 'west', 'upward', 'downward', 'inward', 'outward']) || 'north';
    }

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
    
    // Add cultural/era words based on context (20% chance)
    if (Math.random() < 0.2) {
      const eras = Object.keys(this.culturalWords);
      const selectedEra = eras[Math.floor(Math.random() * eras.length)] as keyof typeof this.culturalWords;
      wordPool = [...wordPool, ...this.culturalWords[selectedEra]];
    }

    // Filter and select best word
    const filtered = wordPool
      .filter(w => w && w.length > 2 && w.length < 12)
      .filter(w => !this.isOverlyArchaic(w))
      .filter(w => !this.hasDoubleSuffix(w))
      .filter(w => !this.isProblematicForMusic(w))
      .filter(w => this.hasGoodPhonetics(w));
    
    // Prefer words from music context when available
    const musicWords = filtered.filter(w => 
      sources.spotifyWords?.includes(w) || 
      sources.lastfmWords?.includes(w) ||
      sources.musicalTerms?.includes(w)
    );
    
    const finalPool = musicWords.length > 0 && Math.random() > 0.3 ? musicWords : filtered;
    return getRandomWord(finalPool) || this.getFallbackWord(type);
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
      /lyly$/, /erness$/, /ismism$/
    ];
    // Also check for verbs that already end with -ing getting another -ing
    if (word.match(/\w+ing$/i) && this.isVerbLike(word)) {
      // If it's already a verb ending in -ing, flag it for filtering
      return true;
    }
    return suffixPatterns.some(pattern => pattern.test(word.toLowerCase()));
  }

  private isProblematicForMusic(word: string): boolean {
    // Filter words that don't work well in band/song names
    const problematic = [
      'algorithm', 'database', 'interface', 'syntax', 'compile', 'debug',
      'parameter', 'variable', 'boolean', 'integer', 'namespace', 'struct',
      'malloc', 'pointer', 'buffer', 'kernel', 'daemon', 'thread',
      'gloaming', 'crepuscular', 'perspicacity', 'obstreperous', 'lugubrious'
    ];
    return problematic.includes(word.toLowerCase());
  }

  private hasGoodPhonetics(word: string): boolean {
    // Avoid words with difficult consonant clusters
    const difficultPatterns = [
      /[^aeiou]{4,}/i,  // 4+ consonants in a row
      /^[^aeiou]{3,}/i, // 3+ consonants at start
      /[^aeiou]{3,}$/i  // 3+ consonants at end
    ];
    return !difficultPatterns.some(pattern => pattern.test(word));
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
    
    // Filter out recently used templates for variety
    const availableTemplates = templates.filter(t => !this.recentTemplates.includes(t));
    const templatePool = availableTemplates.length > 0 ? availableTemplates : templates;
    
    const template = getRandomWord(templatePool) || templatePool[0];
    if (!template) return this.generateCustomPoeticPhrase(wordCount, sources, poetryContext);
    
    // Track this template
    this.recentTemplates.push(template);
    if (this.recentTemplates.length > this.maxRecentTemplates) {
      this.recentTemplates.shift();
    }
    
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
    // New placeholder types
    result = result.replace(/{temporal}/g, () => capitalize(this.selectPoeticWord('temporal', sources, poetryContext)));
    result = result.replace(/{color}/g, () => capitalize(this.selectPoeticWord('color', sources, poetryContext)));
    result = result.replace(/{number}/g, () => capitalize(this.selectPoeticWord('number', sources, poetryContext)));
    result = result.replace(/{emotion}/g, () => capitalize(this.selectPoeticWord('emotion', sources, poetryContext)));
    result = result.replace(/{element}/g, () => capitalize(this.selectPoeticWord('element', sources, poetryContext)));
    result = result.replace(/{direction}/g, () => capitalize(this.selectPoeticWord('direction', sources, poetryContext)));
    
    // Clean up the result
    result = this.cleanupPhrase(result);
    
    secureLog.debug(`🎭 Generated poetic ${wordCount}-word name: "${result}"`);
    return result;
  }

  private generateCustomPoeticPhrase(wordCount: number, sources: EnhancedWordSource, poetryContext?: string[]): string {
    const words: string[] = [];
    
    // Start with article or conjunction for natural flow
    if (Math.random() > 0.3 && wordCount > 3) {
      const starter = getRandomWord(['The', 'A', 'Where', 'When', 'As', 'If', 'Those', 'These']) || 'The';
      words.push(starter);
    }
    
    // Build phrase with natural grammar and better variety
    while (words.length < wordCount) {
      const remaining = wordCount - words.length;
      const lastWord = words[words.length - 1]?.toLowerCase() || '';
      
      // Avoid consecutive similar word types
      const isLastWordConnective = [...this.poeticConnectives.prepositions, 
                                   ...this.poeticConnectives.conjunctions,
                                   ...this.poeticConnectives.articles].includes(lastWord);
      
      if (remaining >= 3 && Math.random() > 0.4) {
        // Add a noun phrase (adj + noun) or verb phrase
        if (Math.random() > 0.5) {
          const adj = this.selectPoeticWord('adjective', sources, poetryContext);
          const noun = this.selectPoeticWord('noun', sources, poetryContext);
          words.push(capitalize(adj), capitalize(singularize(noun)));
        } else {
          const verb = this.selectPoeticWord('verb', sources, poetryContext);
          const prep = getRandomWord(this.poeticConnectives.prepositions) || 'through';
          const noun = this.selectPoeticWord('noun', sources, poetryContext);
          words.push(capitalize(verb), prep, capitalize(singularize(noun)));
        }
      } else if (remaining >= 2 && Math.random() > 0.4) {
        // Add varied two-word combinations
        const patterns = [
          () => {
            const noun = this.selectPoeticWord('noun', sources, poetryContext);
            const verb = this.selectPoeticWord('verb', sources, poetryContext);
            return [capitalize(singularize(noun)), capitalize(verb)];
          },
          () => {
            const adj = this.selectPoeticWord('adjective', sources, poetryContext);
            const noun = this.selectPoeticWord('noun', sources, poetryContext);
            return [capitalize(adj), capitalize(singularize(noun))];
          },
          () => {
            const verb = this.selectPoeticWord('verb', sources, poetryContext);
            const adverb = this.selectPoeticWord('adverb', sources, poetryContext);
            return [capitalize(verb), capitalize(adverb)];
          }
        ];
        const randomIndex = Math.floor(Math.random() * patterns.length);
        const selectedPattern = patterns[randomIndex];
        if (selectedPattern) {
          words.push(...selectedPattern());
        }
      } else {
        // Add single word with better variety
        const types = isLastWordConnective ? ['noun', 'verb', 'adjective'] : 
                      ['noun', 'verb', 'adjective', 'connective'];
        const type = getRandomWord(types) || 'noun';
        
        if (type === 'connective' && words.length < wordCount - 1) {
          const connective = getRandomWord([...this.poeticConnectives.prepositions, 
                                          ...this.poeticConnectives.conjunctions]) || 'through';
          words.push(connective);
        } else {
          const word = this.selectPoeticWord(type === 'connective' ? 'noun' : type, sources, poetryContext);
          words.push(capitalize(type === 'noun' ? singularize(word) : word));
        }
      }
    }
    
    // Ensure we have exactly the right number of words and clean up
    const result = words.slice(0, wordCount).join(' ');
    return this.cleanupPhrase(result);
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