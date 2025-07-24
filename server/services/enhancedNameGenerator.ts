import { datamuseService, DatamuseService } from './datamuseService';
import type { GenerateNameRequest } from '@shared/schema';

interface EnhancedWordSource {
  adjectives: string[];
  nouns: string[];
  verbs: string[];
  musicalTerms: string[];
  contextualWords: string[];
  associatedWords: string[];
}

export class EnhancedNameGeneratorService {
  private datamuseService: DatamuseService;

  constructor() {
    this.datamuseService = datamuseService;
  }

  // Enhanced generation using Datamuse API for contextual relationships
  async generateEnhancedNames(request: GenerateNameRequest): Promise<Array<{name: string, isAiGenerated: boolean, source: string}>> {
    const { type, wordCount, count, mood, genre } = request;
    const names: Array<{name: string, isAiGenerated: boolean, source: string}> = [];

    console.log(`🚀 Enhanced generation: ${count} ${type} names with ${wordCount} words`);

    // Build contextual word sources using Datamuse API
    const wordSources = await this.buildContextualWordSources(mood, genre, type);

    let attempts = 0;
    const maxAttempts = count * 3; // Allow extra attempts for quality control

    while (names.length < count && attempts < maxAttempts) {
      attempts++;
      try {
        const name = await this.generateContextualName(type, wordCount, wordSources, mood, genre);
        
        // Quality validation
        if (name && this.isValidName(name, wordCount) && !names.find(n => n.name === name)) {
          names.push({ 
            name, 
            isAiGenerated: false, 
            source: 'datamuse-enhanced' 
          });
        }
      } catch (error) {
        console.error('Enhanced generation error:', error);
        // Fallback to simple combination if API fails
        const fallbackName = this.generateFallbackName(wordSources, wordCount);
        if (fallbackName && this.isValidName(fallbackName, wordCount) && !names.find(n => n.name === fallbackName)) {
          names.push({ 
            name: fallbackName, 
            isAiGenerated: false, 
            source: 'fallback' 
          });
        }
      }
    }

    return names.slice(0, count);
  }

  // Build word sources using Datamuse's contextual relationships
  private async buildContextualWordSources(mood?: string, genre?: string, type?: string): Promise<EnhancedWordSource> {
    const sources: EnhancedWordSource = {
      adjectives: [],
      nouns: [],
      verbs: [],
      musicalTerms: [],
      contextualWords: [],
      associatedWords: []
    };

    try {
      // Build thematic context from mood and genre
      const themes = [];
      if (mood && mood !== 'none') themes.push(mood);
      if (genre && genre !== 'none') themes.push(genre);
      if (type) themes.push(type === 'band' ? 'music band' : 'song title');

      // Get contextually relevant words for each theme
      for (const theme of themes) {
        console.log(`📖 Fetching thematic words for: ${theme}`);
        
        const thematicWords = await this.datamuseService.findThematicWords(theme, 25);
        sources.contextualWords.push(...thematicWords.map(w => w.word));

        // Get words associated with the theme
        const associatedWords = await this.datamuseService.findAssociatedWords(theme, 20);
        sources.associatedWords.push(...associatedWords.map(w => w.word));
      }

      // Get musical context words
      console.log(`🎵 Fetching musical context words`);
      const musicWords = await this.datamuseService.findThematicWords('music', 30);
      sources.musicalTerms.push(...musicWords.map(w => w.word));

      // Categorize and filter words by part of speech
      const allWords = [...sources.contextualWords, ...sources.associatedWords];
      const seenWords = new Set<string>();
      
      for (const word of allWords) {
        // Skip problematic or duplicate words
        const lowerWord = word.toLowerCase();
        if (seenWords.has(lowerWord) || this.isProblematicWord(word)) continue;
        seenWords.add(lowerWord);
        
        if (this.isLikelyAdjective(word)) {
          sources.adjectives.push(word);
        } else if (this.isLikelyVerb(word)) {
          sources.verbs.push(word);
        } else if (word.length >= 3 && word.length <= 12) { // Filter noun length
          sources.nouns.push(word);
        }
      }

      // If we need more variety, get better quality words
      if (sources.adjectives.length < 10) {
        console.log(`✨ Adding creative adjectives`);
        // Get adjectives related to music/emotion instead of "creative"
        const emotionalAdjs = await this.datamuseService.findSimilarWords('wild', 10);
        const intenseAdjs = await this.datamuseService.findSimilarWords('fierce', 10);
        sources.adjectives.push(
          ...emotionalAdjs.map(w => w.word).filter(w => !this.isProblematicWord(w)),
          ...intenseAdjs.map(w => w.word).filter(w => !this.isProblematicWord(w))
        );
      }

      if (sources.nouns.length < 10) {
        console.log(`🎯 Adding powerful nouns`);
        // Get nouns related to nature/elements instead of "power"
        const natureNouns = await this.datamuseService.findSimilarWords('storm', 10);
        const elementNouns = await this.datamuseService.findSimilarWords('fire', 10);
        sources.nouns.push(
          ...natureNouns.map(w => w.word).filter(w => !this.isProblematicWord(w)),
          ...elementNouns.map(w => w.word).filter(w => !this.isProblematicWord(w))
        );
      }

      console.log(`📊 Word sources built:`, {
        adjectives: sources.adjectives.length,
        nouns: sources.nouns.length,
        verbs: sources.verbs.length,
        musicalTerms: sources.musicalTerms.length,
        total: sources.adjectives.length + sources.nouns.length + sources.verbs.length + sources.musicalTerms.length
      });

    } catch (error) {
      console.error('Error building word sources:', error);
      // Provide minimal fallback words
      sources.adjectives = ['dark', 'bright', 'wild', 'silent', 'fierce'];
      sources.nouns = ['storm', 'fire', 'shadow', 'light', 'dream'];
      sources.verbs = ['run', 'fly', 'burn', 'shine', 'break'];
      sources.musicalTerms = ['song', 'beat', 'melody', 'rhythm', 'sound'];
    }

    return sources;
  }

  // Generate contextually-aware names using word relationships
  private async generateContextualName(
    type: string, 
    wordCount: number, 
    sources: EnhancedWordSource,
    mood?: string,
    genre?: string
  ): Promise<string> {
    
    if (wordCount === 1) {
      return this.generateSingleContextualWord(sources);
    }

    if (wordCount === 2) {
      return await this.generateTwoWordContextual(sources, type);
    }

    if (wordCount === 3) {
      return await this.generateThreeWordContextual(sources, type);
    }

    // 4+ words - use narrative patterns
    return await this.generateLongFormContextual(sources, wordCount, type);
  }

  // Generate single impactful word
  private generateSingleContextualWord(sources: EnhancedWordSource): string {
    const allWords = [
      ...sources.nouns,
      ...sources.musicalTerms,
      ...sources.contextualWords.filter(w => w.length > 4)
    ];
    
    if (allWords.length === 0) return 'Phoenix';
    
    return allWords[Math.floor(Math.random() * allWords.length)];
  }

  // Generate two words using semantic relationships
  private async generateTwoWordContextual(sources: EnhancedWordSource, type: string): Promise<string> {
    const adjectives = sources.adjectives.length > 0 ? sources.adjectives : ['wild'];
    const nouns = sources.nouns.length > 0 ? sources.nouns : ['fire'];

    // Try to find adjectives that commonly go with our nouns
    const baseNoun = nouns[Math.floor(Math.random() * nouns.length)];
    
    try {
      console.log(`🔍 Finding adjectives for: ${baseNoun}`);
      const relatedAdjectives = await this.datamuseService.findAdjectivesForNoun(baseNoun, 10);
      
      if (relatedAdjectives.length > 0) {
        const contextualAdj = relatedAdjectives[Math.floor(Math.random() * relatedAdjectives.length)].word;
        return `${this.capitalize(contextualAdj)} ${this.capitalize(baseNoun)}`;
      }
    } catch (error) {
      console.error('Error finding related adjectives:', error);
    }

    // Fallback to random combination
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    return `${this.capitalize(adj)} ${this.capitalize(baseNoun)}`;
  }

  // Generate three words with enhanced patterns
  private async generateThreeWordContextual(sources: EnhancedWordSource, type: string): Promise<string> {
    const patterns = [
      // Classic "The [adj] [noun]" pattern - most common for bands
      async () => {
        const adj = this.getRandomWord(sources.adjectives) || 'wild';
        const noun = this.getRandomWord(sources.nouns) || 'storm';
        return `The ${this.capitalize(adj)} ${this.capitalize(noun)}`;
      },
      
      // Adjective + Noun + Noun pattern
      async () => {
        const adj = this.getRandomWord(sources.adjectives) || 'electric';
        const noun1 = this.getRandomWord(sources.nouns) || 'fire';
        const noun2 = this.getRandomWord(sources.nouns) || 'dream';
        return `${this.capitalize(adj)} ${this.capitalize(noun1)} ${this.capitalize(noun2)}`;
      },
      
      // Noun + Verb-ing pattern
      async () => {
        const noun1 = this.getRandomWord(sources.nouns) || 'fire';
        const verbs = ['burning', 'rising', 'falling', 'breaking', 'shining'];
        const verb = verbs[Math.floor(Math.random() * verbs.length)];
        const noun2 = this.getRandomWord(sources.nouns) || 'sky';
        return `${this.capitalize(noun1)} ${this.capitalize(verb)} ${this.capitalize(noun2)}`;
      }
    ];

    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    return await pattern();
  }

  // Generate longer contextual names with better structure
  private async generateLongFormContextual(sources: EnhancedWordSource, wordCount: number, type: string): Promise<string> {
    if (wordCount === 4) {
      return this.generateFourWordPattern(sources, type);
    }
    
    if (wordCount === 5) {
      return this.generateFiveWordPattern(sources, type);
    }
    
    if (wordCount === 6) {
      return this.generateSixWordPattern(sources, type);
    }
    
    // Fallback for other word counts
    return this.generateStructuredPhrase(sources, wordCount);
  }
  
  private generateFourWordPattern(sources: EnhancedWordSource, type: string): string {
    const patterns = [
      // The [adj] [noun] [noun]
      () => {
        const adj = this.getRandomWord(sources.adjectives) || 'electric';
        const noun1 = this.getRandomWord(sources.nouns) || 'fire';
        const noun2 = this.getRandomWord(sources.nouns) || 'dream';
        return `The ${this.capitalize(adj)} ${this.capitalize(noun1)} ${this.capitalize(noun2)}`;
      },
      // [Noun] of the [Noun]
      () => {
        const noun1 = this.getRandomWord(sources.nouns) || 'storm';
        const noun2 = this.getRandomWord(sources.nouns) || 'night';
        return `${this.capitalize(noun1)} of the ${this.capitalize(noun2)}`;
      },
      // [Adj] [Noun] [Prep] [Noun]
      () => {
        const adj = this.getRandomWord(sources.adjectives) || 'wild';
        const noun1 = this.getRandomWord(sources.nouns) || 'heart';
        const noun2 = this.getRandomWord(sources.nouns) || 'fire';
        const preps = ['in', 'of', 'at'];
        const prep = preps[Math.floor(Math.random() * preps.length)];
        return `${this.capitalize(adj)} ${this.capitalize(noun1)} ${prep} ${this.capitalize(noun2)}`;
      }
    ];
    
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    return pattern();
  }
  
  private generateFiveWordPattern(sources: EnhancedWordSource, type: string): string {
    const patterns = [
      // The [Adj] [Noun] of [Noun]
      () => {
        const adj = this.getRandomWord(sources.adjectives) || 'burning';
        const noun1 = this.getRandomWord(sources.nouns) || 'sky';
        const noun2 = this.getRandomWord(sources.nouns) || 'storm';
        return `The ${this.capitalize(adj)} ${this.capitalize(noun1)} of ${this.capitalize(noun2)}`;
      },
      // [Noun] in the [Adj] [Noun]
      () => {
        const noun1 = this.getRandomWord(sources.nouns) || 'light';
        const adj = this.getRandomWord(sources.adjectives) || 'dark';
        const noun2 = this.getRandomWord(sources.nouns) || 'night';
        return `${this.capitalize(noun1)} in the ${this.capitalize(adj)} ${this.capitalize(noun2)}`;
      }
    ];
    
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    return pattern();
  }
  
  private generateSixWordPattern(sources: EnhancedWordSource, type: string): string {
    const adj1 = this.getRandomWord(sources.adjectives) || 'wild';
    const noun1 = this.getRandomWord(sources.nouns) || 'heart';
    const adj2 = this.getRandomWord(sources.adjectives) || 'burning';
    const noun2 = this.getRandomWord(sources.nouns) || 'sky';
    
    return `The ${this.capitalize(adj1)} ${this.capitalize(noun1)} of ${this.capitalize(adj2)} ${this.capitalize(noun2)}`;
  }
  
  private generateStructuredPhrase(sources: EnhancedWordSource, wordCount: number): string {
    const words: string[] = [];
    const allGoodWords = [...sources.adjectives, ...sources.nouns].filter(w => 
      !this.isProblematicWord(w) && w.length >= 3 && w.length <= 10
    );
    
    for (let i = 0; i < wordCount; i++) {
      const word = this.getRandomWord(allGoodWords) || 'fire';
      words.push(this.capitalize(word));
    }
    
    return words.join(' ');
  }

  // Helper methods
  private getRandomWord(wordArray: string[]): string | null {
    if (wordArray.length === 0) return null;
    return wordArray[Math.floor(Math.random() * wordArray.length)];
  }

  private capitalize(word: string): string {
    // Preserve original casing for words like "DJ" or "NYC"
    if (word.length <= 3 && word === word.toUpperCase()) {
      return word;
    }
    
    // Handle hyphenated words
    if (word.includes('-')) {
      return word.split('-').map(part => 
        part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
      ).join('-');
    }
    
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }

  private isLikelyAdjective(word: string): boolean {
    const adjSuffixes = ['ful', 'less', 'ing', 'ed', 'ly', 'ous', 'ive', 'able', 'ible'];
    return adjSuffixes.some(suffix => word.toLowerCase().endsWith(suffix));
  }

  private isLikelyVerb(word: string): boolean {
    const verbSuffixes = ['ing', 'ed', 'ize', 'ify', 'ate'];
    return verbSuffixes.some(suffix => word.toLowerCase().endsWith(suffix));
  }

  private isProblematicWord(word: string): boolean {
    // Filter out problematic words
    if (word.length < 2 || word.length > 15) return true;
    if (/[0-9]/.test(word)) return true; // No numbers
    if (/[^a-zA-Z-']/.test(word)) return true; // Only letters, hyphens, apostrophes
    if (word.includes('_')) return true; // No underscores
    
    // Filter out technical/medical terms that sound weird
    const problematicPatterns = [
      'itis', 'osis', 'ectomy', 'ology', 'graphy',
      'metric', 'philic', 'phobic', 'scopy', 'etic',
      'ious', 'eous', 'atic', 'istic'
    ];
    
    // Specific medical/technical/scientific terms to avoid
    const problematicWords = [
      'thorax', 'stigmata', 'reddish', 'yellowish', 'greenish',
      'underside', 'potency', 'generative', 'productive',
      'imaginative', 'originative', 'fanciful', 'ability',
      'electrons', 'radiation', 'mev', 'neutral', 'innovatory',
      'inventive', 'fig', 'increases', 'decreases', 'particle',
      'wavelength', 'frequency', 'amplitude', 'spectrum',
      'molecule', 'atom', 'proton', 'neutron', 'quantum'
    ];
    
    const lowerWord = word.toLowerCase();
    if (problematicWords.includes(lowerWord)) return true;
    return problematicPatterns.some(pattern => lowerWord.endsWith(pattern));
  }

  private generateFallbackName(sources: EnhancedWordSource, wordCount: number): string {
    const words: string[] = [];
    const allWords = [...sources.adjectives, ...sources.nouns, ...sources.verbs, ...sources.musicalTerms];
    
    if (allWords.length === 0) {
      return 'Phoenix Storm';
    }

    for (let i = 0; i < wordCount; i++) {
      const word = allWords[Math.floor(Math.random() * allWords.length)];
      words.push(this.capitalize(word));
    }

    return words.join(' ');
  }

  // Validate name quality
  private isValidName(name: string, expectedWordCount: number): boolean {
    // Check word count
    const words = name.split(/\s+/);
    if (words.length !== expectedWordCount) {
      return false;
    }

    // Check for weird characters or patterns
    if (name.includes('.') && !name.includes('...')) {
      return false; // No single dots in middle of names
    }

    // Check for duplicate words
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    if (uniqueWords.size !== words.length) {
      return false; // No duplicate words
    }

    // Check for overly long words
    if (words.some(w => w.length > 15)) {
      return false; // No excessively long words
    }

    // Basic grammar check - no single letter words except "I" or "A"
    if (words.some(w => w.length === 1 && !['I', 'A', 'a'].includes(w))) {
      return false;
    }

    return true;
  }
}

export const enhancedNameGenerator = new EnhancedNameGeneratorService();