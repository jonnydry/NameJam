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
    const { type, wordCount, count, mood } = request;
    const names: string[] = [];

    for (let i = 0; i < count; i++) {
      const name = await this.generateSingleName(type, wordCount);
      if (!names.includes(name)) {
        names.push(name);
      }
    }

    // If we don't have enough unique names, generate more
    while (names.length < count) {
      const name = await this.generateSingleName(type, wordCount, mood);
      if (!names.includes(name)) {
        names.push(name);
      }
    }

    return names;
  }

  private async generateSingleName(type: string, wordCount: number, mood?: string): Promise<string> {
    if (wordCount >= 4) {
      return this.generateLongForm(type, wordCount, mood);
    } else {
      return this.generateShortForm(type, wordCount, mood);
    }
  }

  private generateShortForm(type: string, wordCount: number, mood?: string): string {
    const words: string[] = [];
    const filteredSources = this.getFilteredWordSources(mood);
    const allWordTypes = [
      filteredSources.adjectives,
      filteredSources.nouns,
      filteredSources.verbs,
      filteredSources.musicalTerms
    ];

    for (let i = 0; i < wordCount; i++) {
      let wordSource: string[];
      
      if (type === 'song') {
        // Songs tend to be more descriptive/poetic
        if (i === 0 && Math.random() > 0.5) {
          wordSource = filteredSources.adjectives;
        } else if (i === wordCount - 1) {
          wordSource = filteredSources.nouns;
        } else {
          wordSource = allWordTypes[Math.floor(Math.random() * allWordTypes.length)];
        }
      } else {
        // Bands can be more varied
        if (i === 0 && Math.random() > 0.3) {
          wordSource = [...filteredSources.adjectives, ...filteredSources.musicalTerms];
        } else {
          wordSource = filteredSources.nouns;
        }
      }

      const randomWord = wordSource[Math.floor(Math.random() * wordSource.length)];
      words.push(randomWord);
    }

    return words.join(' ');
  }

  private getFilteredWordSources(mood?: string): WordSource {
    if (!mood) {
      return this.wordSources;
    }

    const moodThemes = {
      dark: {
        adjectives: ['Dark', 'Shadow', 'Midnight', 'Black', 'Haunted', 'Broken', 'Twisted', 'Hollow', 'Wounded', 'Lost', 'Forgotten', 'Brutal', 'Raw'],
        nouns: ['Shadow', 'Darkness', 'Nightmare', 'Abyss', 'Void', 'Grave', 'Raven', 'Wolf', 'Serpent', 'Storm', 'Pain', 'Wound', 'Sorrow'],
        verbs: ['Falling', 'Breaking', 'Destroying', 'Bleeding', 'Withering', 'Fading', 'Disappearing', 'Screaming', 'Dying'],
        musicalTerms: ['Requiem', 'Dirge', 'Lament', 'Minor', 'Diminuendo']
      },
      bright: {
        adjectives: ['Bright', 'Golden', 'Silver', 'Radiant', 'Shining', 'Pure', 'Crystal', 'Brilliant', 'Luminous', 'Sparkling'],
        nouns: ['Light', 'Sun', 'Star', 'Dawn', 'Hope', 'Joy', 'Victory', 'Glory', 'Heaven', 'Angel', 'Phoenix'],
        verbs: ['Rising', 'Shining', 'Glowing', 'Soaring', 'Flying', 'Dancing', 'Singing', 'Blooming', 'Growing'],
        musicalTerms: ['Major', 'Crescendo', 'Forte', 'Allegro', 'Vivace', 'Anthem', 'Fanfare']
      },
      mysterious: {
        adjectives: ['Mystic', 'Enigmatic', 'Hidden', 'Secret', 'Ancient', 'Ethereal', 'Veiled', 'Cryptic', 'Arcane'],
        nouns: ['Mystery', 'Secret', 'Riddle', 'Phantom', 'Spirit', 'Vision', 'Oracle', 'Prophecy', 'Rune'],
        verbs: ['Whispering', 'Emerging', 'Revealing', 'Concealing', 'Drifting', 'Floating'],
        musicalTerms: ['Mystique', 'Prelude', 'Interlude', 'Whisper']
      },
      energetic: {
        adjectives: ['Electric', 'Dynamic', 'Fierce', 'Wild', 'Explosive', 'Blazing', 'Thunderous', 'Powerful'],
        nouns: ['Thunder', 'Lightning', 'Fire', 'Storm', 'Energy', 'Power', 'Force', 'Warrior'],
        verbs: ['Racing', 'Charging', 'Exploding', 'Blazing', 'Rushing', 'Soaring'],
        musicalTerms: ['Rock', 'Beat', 'Rhythm', 'Forte', 'Allegro', 'Presto']
      },
      melancholy: {
        adjectives: ['Melancholy', 'Lonely', 'Distant', 'Fading', 'Nostalgic', 'Wistful', 'Bittersweet'],
        nouns: ['Memory', 'Echo', 'Ghost', 'Dream', 'Tears', 'Rain', 'Autumn', 'Goodbye'],
        verbs: ['Remembering', 'Longing', 'Yearning', 'Drifting', 'Weeping'],
        musicalTerms: ['Ballad', 'Lament', 'Elegy', 'Adagio', 'Andante']
      },
      ethereal: {
        adjectives: ['Ethereal', 'Celestial', 'Divine', 'Transcendent', 'Otherworldly', 'Sublime'],
        nouns: ['Heaven', 'Cloud', 'Mist', 'Angel', 'Spirit', 'Cosmos', 'Infinity'],
        verbs: ['Floating', 'Ascending', 'Transcending', 'Gliding'],
        musicalTerms: ['Harmony', 'Resonance', 'Celestial', 'Divine']
      },
      aggressive: {
        adjectives: ['Aggressive', 'Fierce', 'Brutal', 'Savage', 'Wild', 'Violent', 'Raw', 'Intense'],
        nouns: ['War', 'Battle', 'Rage', 'Fury', 'Beast', 'Warrior', 'Destroyer', 'Chaos'],
        verbs: ['Attacking', 'Destroying', 'Crushing', 'Raging', 'Fighting', 'Screaming'],
        musicalTerms: ['Forte', 'Sforzando', 'Crescendo', 'Percussion', 'Metal']
      },
      peaceful: {
        adjectives: ['Peaceful', 'Serene', 'Calm', 'Gentle', 'Tranquil', 'Soothing', 'Quiet'],
        nouns: ['Peace', 'Serenity', 'Calm', 'Garden', 'Meadow', 'Dove', 'Sanctuary'],
        verbs: ['Resting', 'Flowing', 'Breathing', 'Calming', 'Soothing'],
        musicalTerms: ['Piano', 'Dolce', 'Andante', 'Lullaby', 'Pastoral']
      },
      nostalgic: {
        adjectives: ['Nostalgic', 'Vintage', 'Retro', 'Old', 'Classic', 'Timeless', 'Forgotten'],
        nouns: ['Memory', 'Past', 'History', 'Album', 'Photo', 'Record', 'Yesterday'],
        verbs: ['Remembering', 'Recalling', 'Reminiscing', 'Longing'],
        musicalTerms: ['Vinyl', 'Classic', 'Vintage', 'Oldies', 'Retro']
      },
      futuristic: {
        adjectives: ['Futuristic', 'Cyber', 'Digital', 'Electronic', 'Synthetic', 'Virtual', 'Neon'],
        nouns: ['Future', 'Technology', 'Robot', 'Code', 'Circuit', 'Data', 'Matrix'],
        verbs: ['Computing', 'Processing', 'Transmitting', 'Uploading'],
        musicalTerms: ['Electronic', 'Synth', 'Digital', 'Techno', 'Cyber']
      },
      romantic: {
        adjectives: ['Romantic', 'Loving', 'Passionate', 'Sweet', 'Tender', 'Devotional', 'Intimate'],
        nouns: ['Love', 'Heart', 'Romance', 'Kiss', 'Embrace', 'Devotion', 'Valentine'],
        verbs: ['Loving', 'Embracing', 'Kissing', 'Cherishing', 'Adoring'],
        musicalTerms: ['Serenade', 'Love Song', 'Ballad', 'Romance', 'Duet']
      },
      epic: {
        adjectives: ['Epic', 'Legendary', 'Heroic', 'Majestic', 'Grand', 'Monumental', 'Triumphant'],
        nouns: ['Legend', 'Hero', 'Quest', 'Adventure', 'Glory', 'Victory', 'Champion'],
        verbs: ['Conquering', 'Triumphing', 'Rising', 'Achieving', 'Overcoming'],
        musicalTerms: ['Symphony', 'Orchestral', 'Fanfare', 'March', 'Anthem']
      }
    };

    const theme = moodThemes[mood as keyof typeof moodThemes];
    if (!theme) {
      return this.wordSources;
    }

    // Combine mood-specific words with general vocabulary for variety
    return {
      adjectives: [...theme.adjectives, ...this.wordSources.adjectives.filter(word => 
        !theme.adjectives.some(moodWord => moodWord.toLowerCase() === word.toLowerCase())
      )].slice(0, 40),
      nouns: [...theme.nouns, ...this.wordSources.nouns.filter(word => 
        !theme.nouns.some(moodWord => moodWord.toLowerCase() === word.toLowerCase())
      )].slice(0, 40),
      verbs: [...theme.verbs, ...this.wordSources.verbs.filter(word => 
        !theme.verbs.some(moodWord => moodWord.toLowerCase() === word.toLowerCase())
      )].slice(0, 30),
      musicalTerms: [...theme.musicalTerms, ...this.wordSources.musicalTerms.filter(word => 
        !theme.musicalTerms.some(moodWord => moodWord.toLowerCase() === word.toLowerCase())
      )].slice(0, 30)
    };
  }

  private generateLongForm(type: string, wordCount: number, mood?: string): string {
    const filteredSources = this.getFilteredWordSources(mood);
    
    // Define grammatical patterns for longer names (4+ words)
    const patterns = [
      // Pattern 1: Article + Adjective + Noun + Preposition/Verb combination
      () => this.buildPattern(['article', 'adjective', 'noun', 'preposition', ...Array(wordCount - 4).fill('flexible')], filteredSources),
      
      // Pattern 2: Noun + Verb + Adjective + Noun (descriptive action)
      () => this.buildPattern(['noun', 'verb', 'adjective', 'noun', ...Array(wordCount - 4).fill('flexible')], filteredSources),
      
      // Pattern 3: Adjective + Noun + Conjunction + Adjective + Noun (parallel structure)
      () => this.buildPattern(['adjective', 'noun', 'conjunction', 'adjective', ...Array(wordCount - 4).fill('noun')], filteredSources),
      
      // Pattern 4: Musical + Adjective + Noun + Verb (musical context)
      () => this.buildPattern(['musical', 'adjective', 'noun', 'verb', ...Array(wordCount - 4).fill('flexible')], filteredSources),
      
      // Pattern 5: Poetic repetition (good for songs)
      () => this.buildRepetitivePattern(wordCount, filteredSources),
      
      // Pattern 6: Abstract/atmospheric (good for both)
      () => this.buildAtmosphericPattern(wordCount, filteredSources),
      
      // Pattern 7: Action-based narrative
      () => this.buildNarrativePattern(wordCount, filteredSources)
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

  private buildPattern(structure: string[], wordSources?: WordSource): string {
    const sources = wordSources || this.wordSources;
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
          word = sources.adjectives[Math.floor(Math.random() * sources.adjectives.length)];
          break;
        case 'noun':
          word = sources.nouns[Math.floor(Math.random() * sources.nouns.length)];
          break;
        case 'verb':
          word = sources.verbs[Math.floor(Math.random() * sources.verbs.length)];
          break;
        case 'musical':
          word = sources.musicalTerms[Math.floor(Math.random() * sources.musicalTerms.length)];
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
            ...sources.adjectives,
            ...sources.nouns,
            ...sources.verbs,
            ...sources.musicalTerms
          ];
          word = allWords[Math.floor(Math.random() * allWords.length)];
          break;
      }
      words.push(word);
    }

    return words.join(' ');
  }

  private buildRepetitivePattern(wordCount: number, wordSources?: WordSource): string {
    const sources = wordSources || this.wordSources;
    // Create patterns with intentional repetition (common in song titles)
    const baseWord = sources.nouns[Math.floor(Math.random() * sources.nouns.length)];
    const adjective = sources.adjectives[Math.floor(Math.random() * sources.adjectives.length)];
    
    const repetitivePatterns = [
      `${adjective} ${baseWord}, ${adjective} ${sources.nouns[Math.floor(Math.random() * sources.nouns.length)]}`,
      `${baseWord} ${sources.verbs[Math.floor(Math.random() * sources.verbs.length)]} ${baseWord}`,
      `The ${baseWord} and the ${sources.nouns[Math.floor(Math.random() * sources.nouns.length)]}`
    ];

    let result = repetitivePatterns[Math.floor(Math.random() * repetitivePatterns.length)];
    
    // Add more words if needed
    while (result.split(' ').length < wordCount) {
      const filler = sources.adjectives[Math.floor(Math.random() * sources.adjectives.length)];
      result += ` ${filler}`;
    }

    return result;
  }

  private buildAtmosphericPattern(wordCount: number, wordSources?: WordSource): string {
    const sources = wordSources || this.wordSources;
    // Create atmospheric, abstract combinations
    const atmospheric = [
      ...sources.adjectives.filter(word => 
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
        const wordSourcesArray = [sources.nouns, sources.musicalTerms];
        const source = wordSourcesArray[Math.floor(Math.random() * wordSourcesArray.length)];
        words.push(source[Math.floor(Math.random() * source.length)]);
      }
    }

    return words.join(' ');
  }

  private buildNarrativePattern(wordCount: number, wordSources?: WordSource): string {
    const sources = wordSources || this.wordSources;
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
        words.push(sources.verbs[Math.floor(Math.random() * sources.verbs.length)]);
        words.push(sources.nouns[Math.floor(Math.random() * sources.nouns.length)]);
      } else {
        // Add single word
        const allWords = [
          ...sources.adjectives,
          ...sources.nouns,
          ...sources.musicalTerms
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
