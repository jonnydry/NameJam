import { datamuseService, DatamuseService } from './datamuseService';
import { lastfmService } from './lastfmService';
import type { GenerateNameRequest } from '@shared/schema';
import { secureLog } from '../utils/secureLogger';

interface EnhancedWordSource {
  adjectives: string[];
  nouns: string[];
  verbs: string[];
  musicalTerms: string[];
  contextualWords: string[];
  associatedWords: string[];
  genreTerms: string[];
  lastfmWords: string[];
}

export class EnhancedNameGeneratorService {
  private datamuseService: DatamuseService;
  private recentWords: Set<string> = new Set();
  private maxRecentWords: number = 100; // Track last 100 words

  constructor() {
    this.datamuseService = datamuseService;
  }

  // Enhanced generation using Datamuse API for contextual relationships
  async generateEnhancedNames(request: GenerateNameRequest): Promise<Array<{name: string, isAiGenerated: boolean, source: string}>> {
    const { type, wordCount, count, mood, genre } = request;
    const names: Array<{name: string, isAiGenerated: boolean, source: string}> = [];

    secureLog.debug(`🚀 Enhanced generation: ${count} ${type} names with ${wordCount} words`);

    // Build contextual word sources using Datamuse API
    const wordSources = await this.buildContextualWordSources(mood, genre, type);

    let attempts = 0;
    const maxAttempts = count * 3; // Allow extra attempts for quality control

    while (names.length < count && attempts < maxAttempts) {
      attempts++;
      try {
        const name = await this.generateContextualName(type, wordCount, wordSources, mood, genre);
        
        // Quality validation and check for repeated words
        if (name && this.isValidName(name, wordCount) && !names.find(n => n.name === name) && !this.hasRecentWords(name)) {
          this.trackWords(name);
          names.push({ 
            name, 
            isAiGenerated: false, 
            source: 'datamuse-enhanced' 
          });
        }
      } catch (error) {
        secureLog.error('Enhanced generation error:', error);
      }
      
      // Always attempt fallback if we still need more names
      if (names.length < count) {
        const fallbackName = this.generateFallbackName(wordSources, wordCount);
        if (fallbackName && this.isValidName(fallbackName, wordCount) && !names.find(n => n.name === fallbackName) && !this.hasRecentWords(fallbackName)) {
          this.trackWords(fallbackName);
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

  // Build word sources using Datamuse's contextual relationships + Last.fm genre intelligence
  private async buildContextualWordSources(mood?: string, genre?: string, type?: string): Promise<EnhancedWordSource> {
    const sources: EnhancedWordSource = {
      adjectives: [],
      nouns: [],
      verbs: [],
      musicalTerms: [],
      contextualWords: [],
      associatedWords: [],
      genreTerms: [],
      lastfmWords: []
    };

    try {
      // Map moods/genres to more poetic seed words
      const poeticSeeds = this.getPoeticSeedWords(mood, genre);
      
      // Ensure we get enough diverse words for generation
      const minWordTarget = 20;
      
      // STEP 1: Enhanced Last.fm Integration for Genre Intelligence
      if (genre) {
        secureLog.debug(`🎵 Fetching Last.fm vocabulary for genre: ${genre}`);
        try {
          const genreVocab = await lastfmService.getGenreVocabulary(genre);
          sources.genreTerms.push(...genreVocab.genreTerms);
          sources.lastfmWords.push(...genreVocab.descriptiveWords);
          sources.contextualWords.push(...genreVocab.relatedGenres);
          
          secureLog.debug(`✅ Last.fm integration successful:`, {
            genreTerms: genreVocab.genreTerms.length,
            descriptiveWords: genreVocab.descriptiveWords.length,
            confidence: genreVocab.confidence
          });
        } catch (error) {
          secureLog.error('Last.fm integration failed, continuing with Datamuse only:', error);
        }
      }

      // STEP 2: Get words using multiple linguistic relationships for richness  
      secureLog.debug(`🎨 Building poetic word palette...`);
      
      // 3. Get emotionally evocative words (process only first 2 seeds to reduce API calls)
      const emotionalSeeds = poeticSeeds.emotional.slice(0, 2);
      for (const seed of emotionalSeeds) {
        const emotionalWords = await this.datamuseService.findWords({
          triggers: seed, // Words statistically associated
          topics: `${mood || 'emotion'} music poetry`,
          maxResults: 15 // Reduced from 20
        });
        // Filter for quality
        const poeticWords = emotionalWords
          .filter(w => this.isPoeticWord(w.word) && !this.isProblematicWord(w.word))
          .map(w => w.word);
        sources.contextualWords.push(...poeticWords);
      }
      
      // 4. Get sensory/imagery words (process only first 2 seeds)
      const sensorySeeds = poeticSeeds.sensory.slice(0, 2);
      for (const seed of sensorySeeds) {
        const sensoryWords = await this.datamuseService.findWords({
          meansLike: seed,
          topics: 'nature poetry music',
          maxResults: 10 // Reduced from 15
        });
        // Filter for quality
        const poeticWords = sensoryWords
          .filter(w => this.isPoeticWord(w.word) && !this.isProblematicWord(w.word))
          .map(w => w.word);
        sources.associatedWords.push(...poeticWords);
      }
      
      // 5. Get musical/rhythmic words (reduce to 2 seeds)
      const musicalSeeds = ['melody', 'rhythm'];
      for (const seed of musicalSeeds) {
        const musicWords = await this.datamuseService.findWords({
          triggers: seed,
          topics: 'music sound',
          maxResults: 8 // Reduced from 10
        });
        sources.musicalTerms.push(...musicWords.map(w => w.word));
      }
      
      // 6. Get adjectives using linguistic patterns (limit to 3 seeds)
      secureLog.debug(`✨ Finding evocative adjectives...`);
      const adjectiveSeeds = this.getAdjectiveSeeds(mood, genre).slice(0, 3);
      for (const seed of adjectiveSeeds) {
        const adjs = await this.datamuseService.findAdjectivesForNoun(seed, 10); // Reduced from 15
        sources.adjectives.push(...adjs.map((w: any) => w.word));
      }
      
      // 7. Get poetic nouns using associations (limit to 3 seeds)
      secureLog.debug(`🌟 Finding poetic nouns...`);
      const nounSeeds = this.getNounSeeds(mood, genre).slice(0, 3);
      for (const seed of nounSeeds) {
        const nouns = await this.datamuseService.findWords({
          triggers: seed,
          maxResults: 10 // Reduced from 15
        });
        // Filter for concrete, evocative nouns
        const poeticNouns = nouns.filter(w => {
          const word = w.word;
          return word.length >= 3 && 
            word.length <= 10 &&
            !this.isProblematicWord(word) &&
            this.isPoeticWord(word) &&
            !/^[A-Z]/.test(word); // Avoid proper nouns
        });
        sources.nouns.push(...poeticNouns.map(w => w.word));
      }
      
      // Clean and deduplicate all sources
      this.cleanWordSources(sources);

      secureLog.debug(`📊 Word sources built:`, {
        adjectives: sources.adjectives.length,
        nouns: sources.nouns.length,
        verbs: sources.verbs.length,
        musicalTerms: sources.musicalTerms.length,
        genreTerms: sources.genreTerms.length,
        lastfmWords: sources.lastfmWords.length,
        total: sources.adjectives.length + sources.nouns.length + sources.verbs.length + sources.musicalTerms.length + sources.genreTerms.length + sources.lastfmWords.length
      });

    } catch (error) {
      secureLog.error('Error building word sources:', error);
      // Provide poetic fallback words
      sources.adjectives = ['midnight', 'velvet', 'silver', 'wild', 'burning'];
      sources.nouns = ['moon', 'thunder', 'shadow', 'ocean', 'dream'];
      sources.verbs = ['dance', 'whisper', 'ignite', 'soar', 'shatter'];
      sources.musicalTerms = ['echo', 'melody', 'rhythm', 'harmony', 'silence'];
      sources.genreTerms = [];
      sources.lastfmWords = [];
    }

    return sources;
  }
  
  // Get poetic seed words based on mood/genre
  private getPoeticSeedWords(mood?: string, genre?: string): { emotional: string[], sensory: string[] } {
    const seeds = {
      emotional: ['soul', 'heart', 'spirit'],
      sensory: ['light', 'sound', 'touch']
    };
    
    // Add mood-specific seeds
    if (mood) {
      const moodSeeds: Record<string, { emotional: string[], sensory: string[] }> = {
        dark: { emotional: ['shadow', 'void', 'abyss'], sensory: ['darkness', 'silence', 'cold'] },
        bright: { emotional: ['joy', 'light', 'hope'], sensory: ['sunshine', 'warmth', 'glow'] },
        energetic: { emotional: ['fire', 'electric', 'surge'], sensory: ['thunder', 'spark', 'blast'] },
        melancholy: { emotional: ['sorrow', 'longing', 'rain'], sensory: ['mist', 'twilight', 'echo'] },
        mysterious: { emotional: ['enigma', 'secret', 'mystic'], sensory: ['fog', 'whisper', 'veil'] },
        ethereal: { emotional: ['dream', 'celestial', 'spirit'], sensory: ['starlight', 'breath', 'shimmer'] }
      };
      
      if (moodSeeds[mood]) {
        seeds.emotional.push(...moodSeeds[mood].emotional);
        seeds.sensory.push(...moodSeeds[mood].sensory);
      }
    }
    
    // Add genre-specific seeds
    if (genre) {
      const genreSeeds: Record<string, string[]> = {
        rock: ['thunder', 'steel', 'storm', 'rebel'],
        metal: ['iron', 'chaos', 'inferno', 'rage'],
        electronic: ['neon', 'pulse', 'digital', 'circuit'],
        jazz: ['blue', 'smoke', 'velvet', 'midnight'],
        folk: ['river', 'mountain', 'home', 'story'],
        indie: ['dream', 'city', 'youth', 'wonder'],
        pop: ['bubble', 'sparkle', 'sugar', 'rainbow', 'shine', 'glitter'],
        country: ['dust', 'road', 'whiskey', 'boots'],
        blues: ['muddy', 'crossroads', 'train', 'bottle'],
        reggae: ['island', 'roots', 'sun', 'peace'],
        punk: ['riot', 'anarchy', 'crash', 'rebel'],
        hip_hop: ['street', 'flow', 'beat', 'rhyme'],
        classical: ['symphony', 'sonata', 'aria', 'opus'],
        alternative: ['strange', 'echo', 'mirror', 'twisted']
      };
      
      if (genreSeeds[genre]) {
        seeds.emotional.push(...genreSeeds[genre]);
      }
    }
    
    return seeds;
  }
  
  // Get seed words for finding adjectives
  private getAdjectiveSeeds(mood?: string, genre?: string): string[] {
    const baseSeeds = ['moon', 'fire', 'ocean', 'night', 'dream'];
    
    if (mood === 'dark') return ['shadow', 'void', 'storm', 'midnight'];
    if (mood === 'bright') return ['sun', 'crystal', 'gold', 'diamond'];
    if (mood === 'energetic') return ['electric', 'wild', 'explosive', 'fierce'];
    
    if (genre === 'rock') return ['thunder', 'steel', 'raw', 'rebel'];
    if (genre === 'electronic') return ['neon', 'digital', 'pulse', 'laser'];
    
    return baseSeeds;
  }
  
  // Get seed words for finding nouns
  private getNounSeeds(mood?: string, genre?: string): string[] {
    const baseSeeds = ['heart', 'soul', 'sky', 'star', 'wave'];
    
    if (mood === 'dark') return ['shadow', 'abyss', 'ghost', 'raven'];
    if (mood === 'bright') return ['light', 'rainbow', 'sunrise', 'crystal'];
    if (mood === 'mysterious') return ['enigma', 'phantom', 'oracle', 'maze'];
    
    if (genre === 'metal') return ['blade', 'iron', 'demon', 'throne'];
    if (genre === 'folk') return ['river', 'tree', 'home', 'road'];
    
    return baseSeeds;
  }
  
  // Check if a word has poetic quality
  private isPoeticWord(word: string): boolean {
    const lowerWord = word.toLowerCase();
    
    // Avoid overly technical, mundane, or awkward words
    const unpoetic = [
      'data', 'system', 'process', 'function', 'status', 'item', 'unit', 'factor',
      'volume', 'runt', 'reshuffle', 'richards', 'colossus', 'sabu', 'petrels',
      'casting', 'images', 'books', 'formation', 'personality', 'index',
      'neutral', 'mev', 'fig', 'dull', 'arkansas', 'charts', 'pink'
    ];
    if (unpoetic.includes(lowerWord)) return false;
    
    // Avoid words that look like names or places
    if (/^[A-Z][a-z]+$/.test(word) && word.length > 5) return false;
    
    // Prefer words with emotional or sensory associations
    const poetic = [
      'moon', 'star', 'fire', 'dream', 'shadow', 'light', 'ocean', 'storm',
      'night', 'soul', 'heart', 'thunder', 'velvet', 'silver', 'echo',
      'whisper', 'phantom', 'crystal', 'flame', 'spirit', 'mystic'
    ];
    if (poetic.some(p => lowerWord.includes(p))) return true;
    
    // Accept words between 3-10 characters, but avoid overly simple ones
    if (word.length < 3 || word.length > 10) return false;
    
    // Avoid words ending in common technical suffixes
    if (lowerWord.endsWith('ing') && word.length > 8) return false;
    if (lowerWord.endsWith('ness') || lowerWord.endsWith('ment')) return false;
    
    return true;
  }
  
  // Clean and deduplicate word sources
  private cleanWordSources(sources: EnhancedWordSource): void {
    const seen = new Set<string>();
    
    // Clean each category
    for (const key of Object.keys(sources) as (keyof EnhancedWordSource)[]) {
      sources[key] = sources[key].filter(word => {
        const lower = word.toLowerCase();
        if (seen.has(lower) || this.isProblematicWord(word) || !this.isPoeticWord(word)) {
          return false;
        }
        seen.add(lower);
        return true;
      });
    }
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

  // Generate two words using semantic relationships + Last.fm genre intelligence
  private async generateTwoWordContextual(sources: EnhancedWordSource, type: string): Promise<string> {
    // Prioritize Last.fm genre-specific vocabulary if available
    const genreAdjectives = [...sources.lastfmWords, ...sources.genreTerms].filter(w => this.isAdjectiveLike(w));
    const genreNouns = [...sources.lastfmWords, ...sources.genreTerms].filter(w => this.isNounLike(w));
    
    const adjectives = genreAdjectives.length > 0 ? 
      [...genreAdjectives, ...sources.adjectives.slice(0, 5)] :
      sources.adjectives.length > 0 ? sources.adjectives : ['wild'];
    
    const nouns = genreNouns.length > 0 ? 
      [...genreNouns, ...sources.nouns.slice(0, 5)] :
      sources.nouns.length > 0 ? sources.nouns : ['fire'];

    // Try to find adjectives that commonly go with our nouns
    const baseNoun = nouns[Math.floor(Math.random() * nouns.length)];
    
    try {
      secureLog.debug(`🔍 Finding adjectives for: ${baseNoun}`);
      const relatedAdjectives = await this.datamuseService.findAdjectivesForNoun(baseNoun, 10);
      
      if (relatedAdjectives.length > 0) {
        const contextualAdj = relatedAdjectives[Math.floor(Math.random() * relatedAdjectives.length)].word;
        return `${this.capitalize(contextualAdj)} ${this.capitalize(baseNoun)}`;
      }
    } catch (error) {
      secureLog.error('Error finding related adjectives:', error);
    }

    // Fallback to random combination
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    return `${this.capitalize(adj)} ${this.capitalize(baseNoun)}`;
  }

  // Generate three words with enhanced patterns + Last.fm genre context
  private async generateThreeWordContextual(sources: EnhancedWordSource, type: string): Promise<string> {
    // Create enhanced word pools with Last.fm data priority
    const enhancedAdjectives = this.createEnhancedWordPool(
      [...sources.lastfmWords, ...sources.genreTerms], 
      sources.adjectives, 
      w => this.isAdjectiveLike(w)
    );
    const enhancedNouns = this.createEnhancedWordPool(
      [...sources.lastfmWords, ...sources.genreTerms], 
      sources.nouns, 
      w => this.isNounLike(w)
    );

    const patterns = [
      // Classic "The [adj] [noun]" pattern - most common for bands
      async () => {
        const adj = this.getRandomWord(enhancedAdjectives) || 'wild';
        const noun = this.getRandomWord(enhancedNouns) || 'storm';
        return `The ${this.capitalize(adj)} ${this.capitalize(noun)}`;
      },
      
      // Adjective + Noun + Noun pattern with genre context
      async () => {
        const adj = this.getRandomWord(enhancedAdjectives) || 'electric';
        const noun1 = this.getRandomWord(enhancedNouns) || 'fire';
        const noun2 = this.getRandomWord(enhancedNouns) || 'dream';
        return `${this.capitalize(adj)} ${this.capitalize(noun1)} ${this.capitalize(noun2)}`;
      },
      
      // Noun + Verb-ing pattern with grammar correction and genre context
      async () => {
        const noun1 = this.getRandomWord(enhancedNouns) || 'fire';
        const verbs = ['burning', 'rising', 'falling', 'breaking', 'shining'];
        const verb = verbs[Math.floor(Math.random() * verbs.length)];
        const noun2 = this.getRandomWord(enhancedNouns) || 'sky';
        
        // Ensure grammatical agreement - if noun1 is plural, singularize it
        const isPlural = noun1.toLowerCase().endsWith('s') && !noun1.toLowerCase().endsWith('ss');
        const correctedNoun1 = isPlural ? this.singularize(noun1) : noun1;
        
        // Ensure noun2 is plural if needed for balance
        const correctedNoun2 = isPlural && !noun2.toLowerCase().endsWith('s') ? noun2 + 's' : noun2;
        
        return `${this.capitalize(correctedNoun1)} ${this.capitalize(verb)} ${this.capitalize(correctedNoun2)}`;
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
    // Create enhanced word pools with Last.fm genre priority
    const enhancedAdjectives = this.createEnhancedWordPool(
      [...sources.lastfmWords, ...sources.genreTerms], 
      sources.adjectives, 
      w => this.isAdjectiveLike(w)
    );
    const enhancedNouns = this.createEnhancedWordPool(
      [...sources.lastfmWords, ...sources.genreTerms], 
      sources.nouns, 
      w => this.isNounLike(w)
    );

    const patterns = [
      // The [adj] [noun] [noun]
      () => {
        const adj = this.getRandomWord(enhancedAdjectives) || 'electric';
        const noun1 = this.getRandomWord(enhancedNouns) || 'fire';
        const noun2 = this.getRandomWord(enhancedNouns) || 'dream';
        return `The ${this.capitalize(adj)} ${this.capitalize(noun1)} ${this.capitalize(noun2)}`;
      },
      // [Noun] of the [Noun]
      () => {
        const noun1 = this.getRandomWord(enhancedNouns) || 'storm';
        const noun2 = this.getRandomWord(enhancedNouns) || 'night';
        return `${this.capitalize(noun1)} of the ${this.capitalize(noun2)}`;
      },
      // [Adj] [Noun] [Prep] [Noun]
      () => {
        const adj = this.getRandomWord(enhancedAdjectives) || 'wild';
        const noun1 = this.getRandomWord(enhancedNouns) || 'heart';
        const noun2 = this.getRandomWord(enhancedNouns) || 'fire';
        const preps = ['in', 'of', 'at'];
        const prep = preps[Math.floor(Math.random() * preps.length)];
        return `${this.capitalize(adj)} ${this.capitalize(noun1)} ${prep} ${this.capitalize(noun2)}`;
      }
    ];
    
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    return pattern();
  }
  
  private generateFiveWordPattern(sources: EnhancedWordSource, type: string): string {
    // Create enhanced word pools with Last.fm genre priority
    const enhancedAdjectives = this.createEnhancedWordPool(
      [...sources.lastfmWords, ...sources.genreTerms], 
      sources.adjectives, 
      w => this.isAdjectiveLike(w)
    );
    const enhancedNouns = this.createEnhancedWordPool(
      [...sources.lastfmWords, ...sources.genreTerms], 
      sources.nouns, 
      w => this.isNounLike(w)
    );
    const enhancedVerbs = [...sources.verbs, ...sources.musicalTerms.filter(w => w.endsWith('ing'))];

    const patterns = [
      // The [Adj] [Noun] of [Noun]
      () => {
        const adj = this.getRandomWord(enhancedAdjectives) || 'burning';
        const noun1 = this.getRandomWord(enhancedNouns) || 'sky';
        const noun2 = this.getRandomWord(enhancedNouns) || 'storm';
        return `The ${this.capitalize(adj)} ${this.capitalize(noun1)} of ${this.capitalize(noun2)}`;
      },
      // [Noun] in the [Adj] [Noun]
      () => {
        const noun1 = this.getRandomWord(enhancedNouns) || 'light';
        const adj = this.getRandomWord(enhancedAdjectives) || 'dark';
        const noun2 = this.getRandomWord(enhancedNouns) || 'night';
        return `${this.capitalize(noun1)} in the ${this.capitalize(adj)} ${this.capitalize(noun2)}`;
      }
    ];
    
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    return pattern();
  }
  
  private generateSixWordPattern(sources: EnhancedWordSource, type: string): string {
    // Create enhanced word pools with Last.fm genre priority
    const enhancedAdjectives = this.createEnhancedWordPool(
      [...sources.lastfmWords, ...sources.genreTerms], 
      sources.adjectives, 
      w => this.isAdjectiveLike(w)
    );
    const enhancedNouns = this.createEnhancedWordPool(
      [...sources.lastfmWords, ...sources.genreTerms], 
      sources.nouns, 
      w => this.isNounLike(w)
    );

    const adj1 = this.getRandomWord(enhancedAdjectives) || 'wild';
    const noun1 = this.getRandomWord(enhancedNouns) || 'heart';
    const adj2 = this.getRandomWord(enhancedAdjectives) || 'burning';
    const noun2 = this.getRandomWord(enhancedNouns) || 'sky';
    
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

  // Function to singularize common plural nouns
  private singularize(word: string): string {
    const lowerWord = word.toLowerCase();
    
    // Common irregular plurals
    const irregulars: Record<string, string> = {
      'children': 'child',
      'men': 'man',
      'women': 'woman',
      'feet': 'foot',
      'teeth': 'tooth',
      'mice': 'mouse',
      'geese': 'goose',
      'people': 'person',
      'leaves': 'leaf',
      'lives': 'life',
      'wolves': 'wolf',
      'knives': 'knife',
      'wives': 'wife',
      'thieves': 'thief'
    };
    
    if (irregulars[lowerWord]) {
      return irregulars[lowerWord];
    }
    
    // Regular plural rules
    if (lowerWord.endsWith('ies') && lowerWord.length > 4) {
      return lowerWord.slice(0, -3) + 'y';
    }
    if (lowerWord.endsWith('ves') && lowerWord.length > 4) {
      return lowerWord.slice(0, -3) + 'f';
    }
    if (lowerWord.endsWith('es') && (lowerWord.endsWith('ses') || lowerWord.endsWith('xes') || 
        lowerWord.endsWith('zes') || lowerWord.endsWith('ches') || lowerWord.endsWith('shes'))) {
      return lowerWord.slice(0, -2);
    }
    if (lowerWord.endsWith('s') && !lowerWord.endsWith('ss') && lowerWord.length > 2) {
      return lowerWord.slice(0, -1);
    }
    
    return word;
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
    
    // Specific medical/technical/scientific/business terms to avoid
    const problematicWords = [
      'thorax', 'stigmata', 'reddish', 'yellowish', 'greenish',
      'underside', 'potency', 'generative', 'productive',
      'imaginative', 'originative', 'fanciful', 'ability',
      'electrons', 'radiation', 'mev', 'neutral', 'innovatory',
      'inventive', 'fig', 'increases', 'decreases', 'particle',
      'wavelength', 'frequency', 'amplitude', 'spectrum',
      'molecule', 'atom', 'proton', 'neutron', 'quantum',
      'magnate', 'powerfulness', 'notional', 'baron', 'tycoon',
      'exponent', 'index', 'empyrean', 'fictive', 'innovatory',
      // Medical terms
      'pulmonary', 'surgery', 'radius', 'medical', 'clinical',
      'surgical', 'cardiac', 'neural', 'skeletal', 'muscular',
      // Geographic/political
      'belgrade', 'feminism', 'minister', 'political', 'democracy',
      // Sports/mundane
      'sports', 'surfing', 'surface', 'troopers', 'clay',
      // Other awkward words
      'slamming', 'fugue', 'changes'
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
  
  // Track words to prevent repetition across generations
  private trackWords(name: string): void {
    const words = name.toLowerCase().split(' ').filter(w => 
      w.length > 2 && !['the', 'of', 'in', 'at', 'and', 'or', 'but'].includes(w)
    );
    
    for (const word of words) {
      this.recentWords.add(word);
    }
    
    // Keep the set from growing too large
    if (this.recentWords.size > this.maxRecentWords) {
      const wordsArray = Array.from(this.recentWords);
      // Remove oldest words (first ones added)
      for (let i = 0; i < 20; i++) {
        this.recentWords.delete(wordsArray[i]);
      }
    }
  }
  
  // Check if name contains recently used words
  private hasRecentWords(name: string): boolean {
    const words = name.toLowerCase().split(' ').filter(w => 
      w.length > 2 && !['the', 'of', 'in', 'at', 'and', 'or', 'but'].includes(w)
    );
    
    // If any significant word was recently used, reject the name
    return words.some(word => this.recentWords.has(word));
  }

  // Helper methods for Last.fm integration

  /**
   * Create enhanced word pool prioritizing Last.fm genre data
   */
  private createEnhancedWordPool(genreWords: string[], fallbackWords: string[], filter?: (w: string) => boolean): string[] {
    const filtered = filter ? genreWords.filter(filter) : genreWords;
    // Combine with 30% of fallback words for variety
    const fallbackSelection = fallbackWords.slice(0, Math.floor(fallbackWords.length * 0.3));
    return [...filtered, ...fallbackSelection];
  }

  /**
   * Simple heuristic to check if word is adjective-like
   */
  private isAdjectiveLike(word: string): boolean {
    const adjectiveEndings = ['ful', 'less', 'ous', 'ive', 'ing', 'ed', 'al', 'ic', 'y', 'en'];
    const adjectiveWords = ['dark', 'bright', 'heavy', 'light', 'hard', 'soft', 'loud', 'quiet', 'deep', 'high', 'low', 'fast', 'slow'];
    
    return adjectiveEndings.some(ending => word.toLowerCase().endsWith(ending)) ||
           adjectiveWords.includes(word.toLowerCase()) ||
           word.length <= 8; // Short words are often adjectives
  }

  /**
   * Simple heuristic to check if word is noun-like
   */
  private isNounLike(word: string): boolean {
    const nounEndings = ['tion', 'sion', 'ment', 'ness', 'ity', 'ty', 'er', 'or', 'ist', 'ism'];
    const musicNouns = ['band', 'sound', 'music', 'song', 'beat', 'rhythm', 'melody', 'harmony', 'chord', 'note'];
    
    return nounEndings.some(ending => word.toLowerCase().endsWith(ending)) ||
           musicNouns.includes(word.toLowerCase()) ||
           (word.length > 3 && !this.isAdjectiveLike(word)); // Longer non-adjective words are often nouns
  }

  private capitalize(word: string): string {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }

  private getRandomWord(words: string[]): string | null {
    if (words.length === 0) return null;
    return words[Math.floor(Math.random() * words.length)];
  }
}

export const enhancedNameGenerator = new EnhancedNameGeneratorService();