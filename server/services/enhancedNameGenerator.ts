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
      // Map moods/genres to more poetic seed words
      const poeticSeeds = this.getPoeticSeedWords(mood, genre);
      
      // Get words using multiple linguistic relationships for richness
      console.log(`🎨 Building poetic word palette...`);
      
      // 1. Get emotionally evocative words
      for (const seed of poeticSeeds.emotional) {
        const emotionalWords = await this.datamuseService.findWords({
          triggers: seed, // Words statistically associated
          topics: `${mood || 'emotion'} music poetry`,
          maxResults: 20
        });
        // Filter for quality
        const poeticWords = emotionalWords
          .filter(w => this.isPoeticWord(w.word) && !this.isProblematicWord(w.word))
          .map(w => w.word);
        sources.contextualWords.push(...poeticWords);
      }
      
      // 2. Get sensory/imagery words
      for (const seed of poeticSeeds.sensory) {
        const sensoryWords = await this.datamuseService.findWords({
          meansLike: seed,
          topics: 'nature poetry music',
          maxResults: 15
        });
        // Filter for quality
        const poeticWords = sensoryWords
          .filter(w => this.isPoeticWord(w.word) && !this.isProblematicWord(w.word))
          .map(w => w.word);
        sources.associatedWords.push(...poeticWords);
      }
      
      // 3. Get musical/rhythmic words
      const musicalSeeds = ['melody', 'rhythm', 'harmony', 'echo', 'resonance'];
      for (const seed of musicalSeeds) {
        const musicWords = await this.datamuseService.findWords({
          triggers: seed,
          topics: 'music sound',
          maxResults: 10
        });
        sources.musicalTerms.push(...musicWords.map(w => w.word));
      }
      
      // 4. Get adjectives using linguistic patterns
      console.log(`✨ Finding evocative adjectives...`);
      const adjectiveSeeds = this.getAdjectiveSeeds(mood, genre);
      for (const seed of adjectiveSeeds) {
        const adjs = await this.datamuseService.findAdjectivesForNoun(seed, 15);
        sources.adjectives.push(...adjs.map((w: any) => w.word));
      }
      
      // 5. Get poetic nouns using associations
      console.log(`🌟 Finding poetic nouns...`);
      const nounSeeds = this.getNounSeeds(mood, genre);
      for (const seed of nounSeeds) {
        const nouns = await this.datamuseService.findWords({
          triggers: seed,
          maxResults: 15
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

      console.log(`📊 Word sources built:`, {
        adjectives: sources.adjectives.length,
        nouns: sources.nouns.length,
        verbs: sources.verbs.length,
        musicalTerms: sources.musicalTerms.length,
        total: sources.adjectives.length + sources.nouns.length + sources.verbs.length + sources.musicalTerms.length
      });

    } catch (error) {
      console.error('Error building word sources:', error);
      // Provide poetic fallback words
      sources.adjectives = ['midnight', 'velvet', 'silver', 'wild', 'burning'];
      sources.nouns = ['moon', 'thunder', 'shadow', 'ocean', 'dream'];
      sources.verbs = ['dance', 'whisper', 'ignite', 'soar', 'shatter'];
      sources.musicalTerms = ['echo', 'melody', 'rhythm', 'harmony', 'silence'];
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
        indie: ['dream', 'city', 'youth', 'wonder']
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
}

export const enhancedNameGenerator = new EnhancedNameGeneratorService();