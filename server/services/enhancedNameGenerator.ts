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

    for (let i = 0; i < count; i++) {
      try {
        const name = await this.generateContextualName(type, wordCount, wordSources, mood, genre);
        if (name && !names.find(n => n.name === name)) {
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
        if (fallbackName && !names.find(n => n.name === fallbackName)) {
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

      // Categorize words by part of speech (basic classification)
      const allWords = [...sources.contextualWords, ...sources.associatedWords];
      for (const word of allWords) {
        if (this.isLikelyAdjective(word)) {
          sources.adjectives.push(word);
        } else if (this.isLikelyVerb(word)) {
          sources.verbs.push(word);
        } else {
          sources.nouns.push(word);
        }
      }

      // If we need more variety, get some general creative words
      if (sources.adjectives.length < 10) {
        console.log(`✨ Adding creative adjectives`);
        const creativeAdjs = await this.datamuseService.findSimilarWords('creative', 15);
        sources.adjectives.push(...creativeAdjs.map(w => w.word));
      }

      if (sources.nouns.length < 10) {
        console.log(`🎯 Adding powerful nouns`);
        const powerfulNouns = await this.datamuseService.findSimilarWords('power', 15);
        sources.nouns.push(...powerfulNouns.map(w => w.word));
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
      // Classic "The [adj] [noun]" pattern
      async () => {
        const adj = this.getRandomWord(sources.adjectives) || 'wild';
        const noun = this.getRandomWord(sources.nouns) || 'storm';
        return `The ${this.capitalize(adj)} ${this.capitalize(noun)}`;
      },
      
      // Contextual noun combinations
      async () => {
        const noun1 = this.getRandomWord(sources.nouns) || 'fire';
        try {
          const relatedWords = await this.datamuseService.findAssociatedWords(noun1, 8);
          if (relatedWords.length > 0) {
            const related = relatedWords[Math.floor(Math.random() * relatedWords.length)].word;
            return `${this.capitalize(noun1)} ${this.capitalize(related)}`;
          }
        } catch (error) {
          console.error('Error finding associated words:', error);
        }
        
        const noun2 = this.getRandomWord(sources.nouns) || 'shadow';
        return `${this.capitalize(noun1)} ${this.capitalize(noun2)}`;
      }
    ];

    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    return await pattern();
  }

  // Generate longer contextual names
  private async generateLongFormContextual(sources: EnhancedWordSource, wordCount: number, type: string): Promise<string> {
    const words: string[] = [];
    
    // Start with a strong foundation
    const baseWord = this.getRandomWord([...sources.nouns, ...sources.contextualWords]) || 'fire';
    words.push(this.capitalize(baseWord));

    // Add contextually related words
    try {
      const followingWords = await this.datamuseService.findWordsThatFollow(baseWord, 5);
      if (followingWords.length > 0) {
        const follower = followingWords[Math.floor(Math.random() * followingWords.length)].word;
        words.push(this.capitalize(follower));
      }
    } catch (error) {
      // Fallback to adjective
      const adj = this.getRandomWord(sources.adjectives) || 'bright';
      words.push(this.capitalize(adj));
    }

    // Fill remaining positions with contextual words
    while (words.length < wordCount) {
      const remaining = wordCount - words.length;
      
      if (remaining === 1) {
        // Last word - make it impactful
        const finalWord = this.getRandomWord(sources.musicalTerms) || 'song';
        words.push(this.capitalize(finalWord));
      } else {
        // Middle words - use connectors or descriptive words
        if (Math.random() < 0.3 && remaining > 1) {
          words.push('of');
        } else {
          const word = this.getRandomWord([...sources.adjectives, ...sources.nouns]) || 'wild';
          words.push(this.capitalize(word));
        }
      }
    }

    return words.join(' ');
  }

  // Helper methods
  private getRandomWord(wordArray: string[]): string | null {
    if (wordArray.length === 0) return null;
    return wordArray[Math.floor(Math.random() * wordArray.length)];
  }

  private capitalize(word: string): string {
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
}

export const enhancedNameGenerator = new EnhancedNameGeneratorService();