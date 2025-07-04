import type { GenerateNameRequest } from "@shared/schema";

interface WordSource {
  adjectives: string[];
  nouns: string[];
  verbs: string[];
  musicalTerms: string[];
}

export class NameGeneratorService {
  private wordSources: WordSource = {
    adjectives: [],
    nouns: [],
    verbs: [],
    musicalTerms: []
  };

  constructor() {
    this.initializeWordSources();
  }

  private async initializeWordSources() {
    // In a real implementation, this would fetch from external APIs
    // For now, using curated lists that would typically come from web scraping
    this.wordSources = {
      adjectives: [
        'Mystic', 'Crimson', 'Electric', 'Midnight', 'Golden', 'Silver', 'Dark', 'Bright',
        'Wild', 'Silent', 'Burning', 'Frozen', 'Ancient', 'Modern', 'Cosmic', 'Urban',
        'Neon', 'Velvet', 'Steel', 'Crystal', 'Shadow', 'Thunder', 'Lightning', 'Storm',
        'Infinite', 'Lost', 'Hidden', 'Sacred', 'Broken', 'Perfect', 'Rebel', 'Gentle',
        'Ethereal', 'Haunted', 'Distant', 'Fading', 'Shimmering', 'Cascading', 'Lonely',
        'Forgotten', 'Hollow', 'Twisted', 'Pure', 'Wounded', 'Eternal', 'Temporal',
        'Azure', 'Emerald', 'Obsidian', 'Pearl', 'Amber', 'Scarlet', 'Violet', 'Indigo',
        'Melancholy', 'Euphoric', 'Serene', 'Chaotic', 'Peaceful', 'Turbulent', 'Tender',
        'Savage', 'Delicate', 'Brutal', 'Graceful', 'Elegant', 'Raw', 'Refined', 'Primal'
      ],
      nouns: [
        'Echo', 'Wave', 'Fire', 'Storm', 'Star', 'Moon', 'Sun', 'River', 'Mountain',
        'Ocean', 'Desert', 'Forest', 'City', 'Road', 'Bridge', 'Tower', 'Castle',
        'Garden', 'Mirror', 'Dream', 'Vision', 'Memory', 'Journey', 'Destiny', 'Glory',
        'Victory', 'Freedom', 'Spirit', 'Soul', 'Heart', 'Mind', 'Voice', 'Song',
        'Whisper', 'Scream', 'Silence', 'Reflection', 'Window', 'Door', 'Key', 'Lock',
        'Chain', 'Crown', 'Throne', 'Valley', 'Cliff', 'Cave', 'Tunnel', 'Meadow',
        'Path', 'Destination', 'Beginning', 'Ending', 'Chapter', 'Story', 'Hope', 'Fear',
        'Joy', 'Sorrow', 'Pain', 'Healing', 'Wound', 'Butterfly', 'Wolf', 'Eagle',
        'Deer', 'Raven', 'Dove', 'Serpent', 'Dragon', 'Phoenix', 'Angel', 'Warrior',
        'Poet', 'Prophet', 'Wanderer', 'Guardian', 'Keeper', 'Seeker', 'Dreamer'
      ],
      verbs: [
        'Rising', 'Falling', 'Dancing', 'Singing', 'Flying', 'Running', 'Walking',
        'Climbing', 'Diving', 'Soaring', 'Burning', 'Shining', 'Glowing', 'Flowing',
        'Breaking', 'Building', 'Creating', 'Destroying', 'Healing', 'Dreaming',
        'Whispering', 'Screaming', 'Calling', 'Answering', 'Seeking', 'Finding', 'Losing',
        'Remembering', 'Forgetting', 'Waking', 'Sleeping', 'Breathing', 'Bleeding',
        'Growing', 'Withering', 'Blooming', 'Fading', 'Dimming', 'Emerging', 'Disappearing',
        'Transforming', 'Evolving', 'Revolving', 'Spinning', 'Plummeting', 'Rushing',
        'Trickling', 'Pouring', 'Drifting', 'Floating', 'Melting', 'Freezing'
      ],
      musicalTerms: [
        'Harmony', 'Melody', 'Rhythm', 'Beat', 'Tempo', 'Chord', 'Note', 'Scale',
        'Symphony', 'Sonata', 'Ballad', 'Anthem', 'Crescendo', 'Diminuendo', 'Forte',
        'Piano', 'Allegro', 'Andante', 'Maestro', 'Virtuoso', 'Ensemble', 'Overture',
        'Resonance', 'Vibration', 'Frequency', 'Amplitude', 'Pause', 'Rest', 'Solo',
        'Orchestra', 'Conductor', 'Composer', 'Acoustics', 'Studio', 'Recording',
        'Microphone', 'Amplifier', 'Speaker', 'Instrument', 'Guitar', 'Violin',
        'Drums', 'Trumpet', 'Saxophone', 'Flute', 'Harp', 'Cello', 'Viola', 'Bass'
      ]
    };
  }

  async generateNames(request: GenerateNameRequest): Promise<string[]> {
    const { type, wordCount, count } = request;
    const names: string[] = [];

    for (let i = 0; i < count; i++) {
      const name = await this.generateSingleName(type, wordCount);
      if (!names.includes(name)) {
        names.push(name);
      }
    }

    // If we don't have enough unique names, generate more
    while (names.length < count) {
      const name = await this.generateSingleName(type, wordCount);
      if (!names.includes(name)) {
        names.push(name);
      }
    }

    return names;
  }

  private async generateSingleName(type: string, wordCount: number): Promise<string> {
    if (wordCount >= 4) {
      return this.generateLongForm(type, wordCount);
    } else {
      return this.generateShortForm(type, wordCount);
    }
  }

  private generateShortForm(type: string, wordCount: number): string {
    const words: string[] = [];
    const allWordTypes = [
      this.wordSources.adjectives,
      this.wordSources.nouns,
      this.wordSources.verbs,
      this.wordSources.musicalTerms
    ];

    for (let i = 0; i < wordCount; i++) {
      let wordSource: string[];
      
      if (type === 'song') {
        // Songs tend to be more descriptive/poetic
        if (i === 0 && Math.random() > 0.5) {
          wordSource = this.wordSources.adjectives;
        } else if (i === wordCount - 1) {
          wordSource = this.wordSources.nouns;
        } else {
          wordSource = allWordTypes[Math.floor(Math.random() * allWordTypes.length)];
        }
      } else {
        // Bands can be more varied
        if (i === 0 && Math.random() > 0.3) {
          wordSource = [...this.wordSources.adjectives, ...this.wordSources.musicalTerms];
        } else {
          wordSource = this.wordSources.nouns;
        }
      }

      const randomWord = wordSource[Math.floor(Math.random() * wordSource.length)];
      words.push(randomWord);
    }

    return words.join(' ');
  }

  private generateLongForm(type: string, wordCount: number): string {
    // Define grammatical patterns for longer names (4+ words)
    const patterns = [
      // Pattern 1: Article + Adjective + Noun + Preposition/Verb combination
      () => this.buildPattern(['article', 'adjective', 'noun', 'preposition', ...Array(wordCount - 4).fill('flexible')]),
      
      // Pattern 2: Noun + Verb + Adjective + Noun (descriptive action)
      () => this.buildPattern(['noun', 'verb', 'adjective', 'noun', ...Array(wordCount - 4).fill('flexible')]),
      
      // Pattern 3: Adjective + Noun + Conjunction + Adjective + Noun (parallel structure)
      () => this.buildPattern(['adjective', 'noun', 'conjunction', 'adjective', ...Array(wordCount - 4).fill('noun')]),
      
      // Pattern 4: Musical + Adjective + Noun + Verb (musical context)
      () => this.buildPattern(['musical', 'adjective', 'noun', 'verb', ...Array(wordCount - 4).fill('flexible')]),
      
      // Pattern 5: Poetic repetition (good for songs)
      () => this.buildRepetitivePattern(wordCount),
      
      // Pattern 6: Abstract/atmospheric (good for both)
      () => this.buildAtmosphericPattern(wordCount),
      
      // Pattern 7: Action-based narrative
      () => this.buildNarrativePattern(wordCount)
    ];

    // Choose pattern based on type preference
    let selectedPatterns = patterns;
    if (type === 'song') {
      // Songs favor more descriptive and narrative patterns
      selectedPatterns = [patterns[0], patterns[2], patterns[4], patterns[5], patterns[6]];
    } else if (type === 'band') {
      // Bands favor more memorable and action-based patterns
      selectedPatterns = [patterns[1], patterns[3], patterns[4], patterns[6]];
    }

    const pattern = selectedPatterns[Math.floor(Math.random() * selectedPatterns.length)];
    return pattern();
  }

  private buildPattern(structure: string[]): string {
    const words: string[] = [];
    const articles = ['The', 'A', 'An', 'These', 'Those', 'Every', 'All'];
    const prepositions = ['of', 'in', 'on', 'under', 'through', 'beyond', 'within', 'across'];
    const conjunctions = ['and', 'or', 'but', 'yet', 'so', 'for'];

    for (const part of structure) {
      let word = '';
      switch (part) {
        case 'article':
          word = articles[Math.floor(Math.random() * articles.length)];
          break;
        case 'adjective':
          word = this.wordSources.adjectives[Math.floor(Math.random() * this.wordSources.adjectives.length)];
          break;
        case 'noun':
          word = this.wordSources.nouns[Math.floor(Math.random() * this.wordSources.nouns.length)];
          break;
        case 'verb':
          word = this.wordSources.verbs[Math.floor(Math.random() * this.wordSources.verbs.length)];
          break;
        case 'musical':
          word = this.wordSources.musicalTerms[Math.floor(Math.random() * this.wordSources.musicalTerms.length)];
          break;
        case 'preposition':
          word = prepositions[Math.floor(Math.random() * prepositions.length)];
          break;
        case 'conjunction':
          word = conjunctions[Math.floor(Math.random() * conjunctions.length)];
          break;
        case 'flexible':
          // Mix any word type for variety
          const allWords = [
            ...this.wordSources.adjectives,
            ...this.wordSources.nouns,
            ...this.wordSources.verbs,
            ...this.wordSources.musicalTerms
          ];
          word = allWords[Math.floor(Math.random() * allWords.length)];
          break;
      }
      words.push(word);
    }

    return words.join(' ');
  }

  private buildRepetitivePattern(wordCount: number): string {
    // Create patterns with intentional repetition (common in song titles)
    const baseWord = this.wordSources.nouns[Math.floor(Math.random() * this.wordSources.nouns.length)];
    const adjective = this.wordSources.adjectives[Math.floor(Math.random() * this.wordSources.adjectives.length)];
    
    const repetitivePatterns = [
      `${adjective} ${baseWord}, ${adjective} ${this.wordSources.nouns[Math.floor(Math.random() * this.wordSources.nouns.length)]}`,
      `${baseWord} ${this.wordSources.verbs[Math.floor(Math.random() * this.wordSources.verbs.length)]} ${baseWord}`,
      `The ${baseWord} and the ${this.wordSources.nouns[Math.floor(Math.random() * this.wordSources.nouns.length)]}`
    ];

    let result = repetitivePatterns[Math.floor(Math.random() * repetitivePatterns.length)];
    
    // Add more words if needed
    while (result.split(' ').length < wordCount) {
      const filler = this.wordSources.adjectives[Math.floor(Math.random() * this.wordSources.adjectives.length)];
      result += ` ${filler}`;
    }

    return result;
  }

  private buildAtmosphericPattern(wordCount: number): string {
    // Create atmospheric, abstract combinations
    const atmospheric = [
      ...this.wordSources.adjectives.filter(word => 
        ['ethereal', 'cosmic', 'ancient', 'mystic', 'haunted', 'frozen', 'burning', 'distant', 'fading', 'rising'].some(atmo => 
          word.toLowerCase().includes(atmo) || atmo.includes(word.toLowerCase())
        )
      ),
      'echoing', 'drifting', 'floating', 'shimmering', 'cascading', 'emerging', 'dissolving'
    ];

    const words: string[] = [];
    for (let i = 0; i < wordCount; i++) {
      if (i % 2 === 0 && atmospheric.length > 0) {
        words.push(atmospheric[Math.floor(Math.random() * atmospheric.length)]);
      } else {
        const wordSources = [this.wordSources.nouns, this.wordSources.musicalTerms];
        const source = wordSources[Math.floor(Math.random() * wordSources.length)];
        words.push(source[Math.floor(Math.random() * source.length)]);
      }
    }

    return words.join(' ');
  }

  private buildNarrativePattern(wordCount: number): string {
    // Create story-like combinations
    const narrativeStarters = ['When', 'Where', 'How', 'Why', 'Until', 'Before', 'After', 'During'];
    const words: string[] = [];
    
    if (Math.random() > 0.5) {
      words.push(narrativeStarters[Math.floor(Math.random() * narrativeStarters.length)]);
    }

    // Fill remaining slots with narrative flow
    while (words.length < wordCount) {
      const remaining = wordCount - words.length;
      if (remaining >= 2 && Math.random() > 0.6) {
        // Add verb + noun combination
        words.push(this.wordSources.verbs[Math.floor(Math.random() * this.wordSources.verbs.length)]);
        words.push(this.wordSources.nouns[Math.floor(Math.random() * this.wordSources.nouns.length)]);
      } else {
        // Add single word
        const allWords = [
          ...this.wordSources.adjectives,
          ...this.wordSources.nouns,
          ...this.wordSources.musicalTerms
        ];
        words.push(allWords[Math.floor(Math.random() * allWords.length)]);
      }
    }

    return words.join(' ');
  }

  // Method to fetch words from external APIs (placeholder)
  private async fetchWordsFromWeb(): Promise<void> {
    // This would implement web scraping or API calls to:
    // - Dictionary APIs
    // - Wikipedia random article titles
    // - Poetry/literature APIs
    // - Music databases
    
    // For now, we'll use the static lists above
    console.log('Fetching words from web sources...');
  }
}
