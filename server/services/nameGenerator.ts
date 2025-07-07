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

  // Expanded categories for endless variety
  private expandedCategories = {
    emotions: [],
    colors: [],
    animals: [],
    mythology: [],
    technology: [],
    nature: [],
    cosmic: [],
    abstract: [],
    textures: [],
    weather: [],
    timeRelated: [],
    movement: [],
    sounds: [],
    tastes: [],
    cultural: []
  };

  constructor() {
    this.initializeWordSources().then(() => {
      // Fetch fresh words from web sources after base initialization
      this.fetchWordsFromWeb();
      // Fetch expanded categories for endless variety
      this.fetchExpandedCategories();
    });
  }

  private async initializeWordSources() {
    // Initialize with base vocabulary, then enhance with web-sourced words
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
        'Savage', 'Delicate', 'Brutal', 'Graceful', 'Elegant', 'Raw', 'Refined', 'Primal',
        // Humorous and unexpected additions
        'Confused', 'Caffeinated', 'Backwards', 'Upside-Down', 'Sideways', 'Dizzy', 'Clumsy',
        'Sneaky', 'Dramatic', 'Overdramatic', 'Undercooked', 'Overcooked', 'Misunderstood', 'Questionable',
        'Suspicious', 'Innocent', 'Guilty', 'Awkward', 'Smooth', 'Rough', 'Polite', 'Rude',
        'Caffeinated', 'Sleepy', 'Hungry', 'Thirsty', 'Restless', 'Impatient', 'Overwhelmed',
        'Peculiar', 'Bizarre', 'Ridiculous', 'Absurd', 'Nonsensical', 'Whimsical', 'Zany'
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
        'Poet', 'Prophet', 'Wanderer', 'Guardian', 'Keeper', 'Seeker', 'Dreamer',
        // Humorous and unexpected additions
        'Bananas', 'Socks', 'Toasters', 'Umbrellas', 'Pickles', 'Waffles', 'Pandas', 'Llamas',
        'Ninjas', 'Pirates', 'Robots', 'Zombies', 'Unicorns', 'Tacos', 'Pizza', 'Donuts',
        'Monkeys', 'Elephants', 'Penguins', 'Flamingos', 'Hippos', 'Turtles', 'Koalas', 'Sloths',
        'Thoughts', 'Mistakes', 'Accidents', 'Shenanigans', 'Chaos', 'Mayhem', 'Disaster', 'Catastrophe',
        'Pajamas', 'Mustaches', 'Eyebrows', 'Elbows', 'Knees', 'Toes', 'Buttons', 'Zippers',
        'Sandwiches', 'Burritos', 'Cupcakes', 'Muffins', 'Bagels', 'Pretzels', 'Crackers', 'Cookies'
      ],
      verbs: [
        'Rising', 'Falling', 'Dancing', 'Singing', 'Flying', 'Running', 'Walking',
        'Climbing', 'Diving', 'Soaring', 'Burning', 'Shining', 'Glowing', 'Flowing',
        'Breaking', 'Building', 'Creating', 'Destroying', 'Healing', 'Dreaming',
        'Whispering', 'Screaming', 'Calling', 'Answering', 'Seeking', 'Finding', 'Losing',
        'Remembering', 'Forgetting', 'Waking', 'Sleeping', 'Breathing', 'Bleeding',
        'Growing', 'Withering', 'Blooming', 'Fading', 'Dimming', 'Emerging', 'Disappearing',
        'Transforming', 'Evolving', 'Revolving', 'Spinning', 'Plummeting', 'Rushing',
        'Trickling', 'Pouring', 'Drifting', 'Floating', 'Melting', 'Freezing',
        // Humorous and unexpected actions
        'Stumbling', 'Bumbling', 'Fumbling', 'Grumbling', 'Mumbling', 'Rambling', 'Scrambling',
        'Giggling', 'Wiggling', 'Jiggling', 'Tickling', 'Sneezing', 'Hiccupping', 'Yawning',
        'Procrastinating', 'Overthinking', 'Underestimating', 'Overreacting', 'Panicking', 'Celebrating',
        'Complaining', 'Bragging', 'Gossiping', 'Eavesdropping', 'Lurking', 'Sneaking',
        'Dodging', 'Avoiding', 'Pretending', 'Faking', 'Bluffing', 'Juggling', 'Balancing'
      ],
      musicalTerms: [
        'Harmony', 'Melody', 'Rhythm', 'Beat', 'Tempo', 'Chord', 'Note', 'Scale',
        'Symphony', 'Sonata', 'Ballad', 'Anthem', 'Crescendo', 'Diminuendo', 'Forte',
        'Piano', 'Allegro', 'Andante', 'Maestro', 'Virtuoso', 'Ensemble', 'Overture',
        'Resonance', 'Vibration', 'Frequency', 'Amplitude', 'Pause', 'Rest', 'Solo',
        'Orchestra', 'Conductor', 'Composer', 'Acoustics', 'Studio', 'Recording',
        'Microphone', 'Amplifier', 'Speaker', 'Instrument', 'Guitar', 'Violin',
        'Drums', 'Trumpet', 'Saxophone', 'Flute', 'Harp', 'Cello', 'Viola', 'Bass',
        // Humorous and unexpected musical terms
        'Kazoo', 'Bongo', 'Cowbell', 'Triangle', 'Xylophone', 'Accordion', 'Bagpipes', 'Ukulele',
        'Recorder', 'Tambourine', 'Maracas', 'Harmonica', 'Ocarina', 'Didgeridoo', 'Spoons', 'Washboard',
        'Castanet', 'Kalimba', 'Melodica', 'Theremin', 'Autoharp', 'Banjo', 'Mandolin', 'Concertina'
      ]
    };
  }

  async generateNames(request: GenerateNameRequest): Promise<string[]> {
    const { type, wordCount, count, mood, genre } = request;
    const names: string[] = [];

    // Generate all names using traditional approach
    while (names.length < count) {
      const name = await this.generateSingleName(type, wordCount, mood, genre);
      if (!names.includes(name)) {
        names.push(name);
      }
    }

    return names.slice(0, count);
  }

  private async generateSingleName(type: string, wordCount: number, mood?: string, genre?: string): Promise<string> {
    // Use simple synchronous generation to demonstrate web-enhanced vocabulary
    if (wordCount <= 3) {
      return this.generateSimpleName(type, wordCount, mood, genre);
    } else {
      return this.generateLongForm(type, wordCount, mood, genre);
    }
  }

  private generateSimpleName(type: string, wordCount: number, mood?: string, genre?: string): string {
    // Use the web-enhanced vocabulary with genre and mood filtering
    let sources = this.wordSources;
    if (mood) {
      sources = this.getStaticMoodFilteredWords(mood);
    }
    if (genre) {
      sources = this.getGenreFilteredWords(genre, sources);
    }
    
    // Generate names using the enhanced vocabulary
    const words: string[] = [];
    for (let i = 0; i < wordCount; i++) {
      if (i === 0) {
        words.push(sources.adjectives[Math.floor(Math.random() * sources.adjectives.length)]);
      } else if (i === wordCount - 1) {
        words.push(sources.nouns[Math.floor(Math.random() * sources.nouns.length)]);
      } else {
        const allWords = [...sources.verbs, ...sources.musicalTerms];
        words.push(allWords[Math.floor(Math.random() * allWords.length)]);
      }
    }
    
    return words.join(' ');
  }

  private async generateShortForm(type: string, wordCount: number, mood?: string): Promise<string> {
    // Use enhanced vocabulary that includes web-sourced words
    let filteredSources: WordSource = this.wordSources;
    
    // When mood is specified, try to get mood-filtered words (including web words if available)
    if (mood) {
      try {
        filteredSources = this.getStaticMoodFilteredWords(mood);
      } catch (error) {
        console.error('Failed to get mood-filtered words, using base vocabulary:', error);
        filteredSources = this.wordSources;
      }
    }
    
    if (wordCount === 1) {
      // Single word - prefer nouns or musical terms
      const sourceArray = Math.random() > 0.5 ? filteredSources.nouns : filteredSources.musicalTerms;
      return sourceArray[Math.floor(Math.random() * sourceArray.length)];
    } else if (wordCount === 2) {
      // Two words - classic combinations
      const patterns = [
        () => `${filteredSources.adjectives[Math.floor(Math.random() * filteredSources.adjectives.length)]} ${filteredSources.nouns[Math.floor(Math.random() * filteredSources.nouns.length)]}`,
        () => `${filteredSources.nouns[Math.floor(Math.random() * filteredSources.nouns.length)]} ${filteredSources.musicalTerms[Math.floor(Math.random() * filteredSources.musicalTerms.length)]}`,
        () => `${filteredSources.verbs[Math.floor(Math.random() * filteredSources.verbs.length)]} ${filteredSources.nouns[Math.floor(Math.random() * filteredSources.nouns.length)]}`
      ];
      
      const pattern = patterns[Math.floor(Math.random() * patterns.length)];
      return pattern();
    } else if (wordCount === 3) {
      // Three words - enhanced with humor and creativity
      return this.buildHumorousThreeWordPattern(filteredSources, type);
    } else if (wordCount === 4) {
      // Four words - perfect for wordplay and humor
      return this.buildHumorousFourWordPattern(filteredSources, type);
    } else {
      // Five words - narrative and complex humor
      return this.buildHumorousFiveWordPattern(filteredSources, type);
    }
  }

  private buildHumorousThreeWordPattern(sources: WordSource, type: string): string {
    // Ensure all word arrays have content, fallback to static if empty
    const safeSource = {
      adjectives: sources.adjectives && sources.adjectives.length > 0 ? sources.adjectives : this.wordSources.adjectives,
      nouns: sources.nouns && sources.nouns.length > 0 ? sources.nouns : this.wordSources.nouns,
      verbs: sources.verbs && sources.verbs.length > 0 ? sources.verbs : this.wordSources.verbs,
      musicalTerms: sources.musicalTerms && sources.musicalTerms.length > 0 ? sources.musicalTerms : this.wordSources.musicalTerms
    };
    
    const humorousPatterns = [
      // Unexpected combinations that create humor
      () => `${safeSource.adjectives[Math.floor(Math.random() * safeSource.adjectives.length)]} ${safeSource.nouns[Math.floor(Math.random() * safeSource.nouns.length)]} ${safeSource.musicalTerms[Math.floor(Math.random() * safeSource.musicalTerms.length)]}`,
      
      // Grammatically playful structures
      () => `${sources.verbs[Math.floor(Math.random() * sources.verbs.length)]} ${sources.adjectives[Math.floor(Math.random() * sources.adjectives.length)]} ${sources.nouns[Math.floor(Math.random() * sources.nouns.length)]}`,
      
      // Article-based for memorability
      () => `The ${sources.adjectives[Math.floor(Math.random() * sources.adjectives.length)]} ${sources.nouns[Math.floor(Math.random() * sources.nouns.length)]}`,
      
      // Possessive structures for narrative feel
      () => `${sources.nouns[Math.floor(Math.random() * sources.nouns.length)]}'s ${sources.adjectives[Math.floor(Math.random() * sources.adjectives.length)]} ${sources.nouns[Math.floor(Math.random() * sources.nouns.length)]}`,
      
      // Contradictory combinations for surprise
      () => {
        const opposites = [
          ['Big', 'Small'], ['Hot', 'Cold'], ['Fast', 'Slow'], ['Happy', 'Sad'],
          ['Loud', 'Silent'], ['Bright', 'Dark'], ['Hard', 'Soft'], ['Wild', 'Gentle']
        ];
        const oppositePair = opposites[Math.floor(Math.random() * opposites.length)];
        return `${oppositePair[0]} ${oppositePair[1]} ${sources.nouns[Math.floor(Math.random() * sources.nouns.length)]}`;
      }
    ];
    
    const pattern = humorousPatterns[Math.floor(Math.random() * humorousPatterns.length)];
    return pattern();
  }

  private buildHumorousFourWordPattern(sources: WordSource, type: string): string {
    const humorousPatterns = [
      // Question-like structures
      () => `Who ${sources.verbs[Math.floor(Math.random() * sources.verbs.length)]} the ${sources.adjectives[Math.floor(Math.random() * sources.adjectives.length)]} ${sources.nouns[Math.floor(Math.random() * sources.nouns.length)]}?`,
      
      // Comparative structures for humor
      () => `${sources.adjectives[Math.floor(Math.random() * sources.adjectives.length)]} Than ${sources.adjectives[Math.floor(Math.random() * sources.adjectives.length)]} ${sources.nouns[Math.floor(Math.random() * sources.nouns.length)]}`,
      
      // Unexpected professional titles
      () => `${sources.adjectives[Math.floor(Math.random() * sources.adjectives.length)]} ${sources.nouns[Math.floor(Math.random() * sources.nouns.length)]} ${sources.verbs[Math.floor(Math.random() * sources.verbs.length)]} ${sources.musicalTerms[Math.floor(Math.random() * sources.musicalTerms.length)]}`,
      
      // Temporal paradoxes for intrigue
      () => `Yesterday's ${sources.adjectives[Math.floor(Math.random() * sources.adjectives.length)]} ${sources.nouns[Math.floor(Math.random() * sources.nouns.length)]} ${sources.verbs[Math.floor(Math.random() * sources.verbs.length)]}`,
      
      // Location-based humor
      () => `${sources.nouns[Math.floor(Math.random() * sources.nouns.length)]} From ${sources.adjectives[Math.floor(Math.random() * sources.adjectives.length)]} ${sources.nouns[Math.floor(Math.random() * sources.nouns.length)]}`,
      
      // Abstract concepts made concrete
      () => `The ${sources.adjectives[Math.floor(Math.random() * sources.adjectives.length)]} ${sources.nouns[Math.floor(Math.random() * sources.nouns.length)]} ${sources.verbs[Math.floor(Math.random() * sources.verbs.length)]} ${sources.musicalTerms[Math.floor(Math.random() * sources.musicalTerms.length)]}`
    ];
    
    const pattern = humorousPatterns[Math.floor(Math.random() * humorousPatterns.length)];
    return pattern();
  }

  private buildHumorousFiveWordPattern(sources: WordSource, type: string): string {
    const humorousPatterns = [
      // Narrative structures with unexpected endings
      () => `${sources.nouns[Math.floor(Math.random() * sources.nouns.length)]} ${sources.verbs[Math.floor(Math.random() * sources.verbs.length)]} ${sources.adjectives[Math.floor(Math.random() * sources.adjectives.length)]} ${sources.nouns[Math.floor(Math.random() * sources.nouns.length)]} ${sources.musicalTerms[Math.floor(Math.random() * sources.musicalTerms.length)]}`,
      
      // Absurd how-to titles
      () => `How to ${sources.verbs[Math.floor(Math.random() * sources.verbs.length)]} ${sources.adjectives[Math.floor(Math.random() * sources.adjectives.length)]} ${sources.nouns[Math.floor(Math.random() * sources.nouns.length)]} ${sources.musicalTerms[Math.floor(Math.random() * sources.musicalTerms.length)]}`,
      
      // Impossible scenarios
      () => `When ${sources.nouns[Math.floor(Math.random() * sources.nouns.length)]} ${sources.verbs[Math.floor(Math.random() * sources.verbs.length)]} ${sources.adjectives[Math.floor(Math.random() * sources.adjectives.length)]} ${sources.nouns[Math.floor(Math.random() * sources.nouns.length)]} ${sources.verbs[Math.floor(Math.random() * sources.verbs.length)]}`,
      
      // Philosophical absurdities
      () => `Why ${sources.adjectives[Math.floor(Math.random() * sources.adjectives.length)]} ${sources.nouns[Math.floor(Math.random() * sources.nouns.length)]} ${sources.verbs[Math.floor(Math.random() * sources.verbs.length)]} ${sources.adjectives[Math.floor(Math.random() * sources.adjectives.length)]} ${sources.musicalTerms[Math.floor(Math.random() * sources.musicalTerms.length)]}`,
      
      // Compound contradictions
      () => `${sources.adjectives[Math.floor(Math.random() * sources.adjectives.length)]} ${sources.nouns[Math.floor(Math.random() * sources.nouns.length)]} and ${sources.adjectives[Math.floor(Math.random() * sources.adjectives.length)]} ${sources.nouns[Math.floor(Math.random() * sources.nouns.length)]}`,
      
      // Time-based paradoxes
      () => `${sources.adjectives[Math.floor(Math.random() * sources.adjectives.length)]} ${sources.nouns[Math.floor(Math.random() * sources.nouns.length)]} from ${sources.adjectives[Math.floor(Math.random() * sources.adjectives.length)]} ${sources.nouns[Math.floor(Math.random() * sources.nouns.length)]}`,
      
      // Emotional journeys
      () => `${sources.verbs[Math.floor(Math.random() * sources.verbs.length)]} ${sources.adjectives[Math.floor(Math.random() * sources.adjectives.length)]} ${sources.nouns[Math.floor(Math.random() * sources.nouns.length)]} ${sources.verbs[Math.floor(Math.random() * sources.verbs.length)]} ${sources.musicalTerms[Math.floor(Math.random() * sources.musicalTerms.length)]}`
    ];
    
    const pattern = humorousPatterns[Math.floor(Math.random() * humorousPatterns.length)];
    return pattern();
  }

  private async getFilteredWordSources(mood?: string): Promise<WordSource> {
    if (!mood) {
      return this.wordSources;
    }

    // Fetch fresh web words for the specific mood
    try {
      const webWords = await this.fetchMoodSpecificWords(mood);
      
      // Merge web words with mood-filtered static words
      const staticFiltered = this.getStaticMoodFilteredWords(mood);
      
      return {
        adjectives: this.removeDuplicates([...webWords.adjectives, ...staticFiltered.adjectives]),
        nouns: this.removeDuplicates([...webWords.nouns, ...staticFiltered.nouns]),
        verbs: this.removeDuplicates([...webWords.verbs, ...staticFiltered.verbs]),
        musicalTerms: this.removeDuplicates([...webWords.musicalTerms, ...staticFiltered.musicalTerms])
      };
    } catch (error) {
      console.error('Error fetching web words for mood, using static fallback:', error);
      return this.getStaticMoodFilteredWords(mood);
    }
  }

  private getStaticMoodFilteredWords(mood?: string): WordSource {
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

  private generateLongForm(type: string, wordCount: number, mood?: string, genre?: string): string {
    // Use synchronous mood and genre filtering for long form generation
    let filteredSources = this.wordSources;
    if (mood) {
      filteredSources = this.getStaticMoodFilteredWords(mood);
    }
    if (genre) {
      filteredSources = this.getGenreFilteredWords(genre, filteredSources);
    }
    
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

  private getGenreFilteredWords(genre: string, sources: WordSource): WordSource {
    const genreFilters = {
      'rock': {
        adjectives: ['Electric', 'Wild', 'Raw', 'Loud', 'Rebel', 'Hard', 'Heavy', 'Steel', 'Thunder', 'Lightning', 'Storm', 'Fire', 'Burning', 'Blazing', 'Fierce', 'Savage', 'Brutal', 'Powerful', 'Crushing', 'Roaring'],
        nouns: ['Thunder', 'Lightning', 'Storm', 'Fire', 'Steel', 'Stone', 'Mountain', 'Volcano', 'Eagle', 'Wolf', 'Tiger', 'Hammer', 'Blade', 'Warrior', 'Rebel', 'Machine', 'Engine', 'Power', 'Force', 'Energy'],
        verbs: ['Rock', 'Roll', 'Smash', 'Crash', 'Burn', 'Blast', 'Strike', 'Thunder', 'Roar', 'Scream', 'Shout', 'Drive', 'Rush', 'Charge', 'Fight', 'Battle', 'Rage', 'Storm', 'Explode', 'Ignite'],
        musicalTerms: ['Amp', 'Riff', 'Guitar', 'Bass', 'Drums', 'Distortion', 'Power Chord', 'Solo', 'Headbang', 'Mosh', 'Stage', 'Microphone', 'Volume', 'Feedback', 'Marshall', 'Fender', 'Gibson', 'Stratocaster', 'Les Paul', 'Pickup']
      },
      'metal': {
        adjectives: ['Black', 'Death', 'Doom', 'Brutal', 'Savage', 'Dark', 'Evil', 'Infernal', 'Demonic', 'Hellish', 'Necro', 'Grim', 'Frost', 'Iron', 'Steel', 'Blood', 'Crimson', 'Void', 'Unholy', 'Wicked'],
        nouns: ['Death', 'Doom', 'Hell', 'Demon', 'Beast', 'Dragon', 'Skull', 'Bone', 'Blood', 'Iron', 'Steel', 'Blade', 'Sword', 'Axe', 'Throne', 'Crown', 'Darkness', 'Shadow', 'Abyss', 'Void'],
        verbs: ['Destroy', 'Annihilate', 'Devastate', 'Crush', 'Slaughter', 'Massacre', 'Burn', 'Melt', 'Forge', 'Strike', 'Pound', 'Hammer', 'Grind', 'Shred', 'Tear', 'Rip', 'Slay', 'Conquer', 'Dominate', 'Rule'],
        musicalTerms: ['Blast Beat', 'Tremolo', 'Growl', 'Scream', 'Double Bass', 'Drop Tuning', 'Distortion', 'Overdrive', 'Feedback', 'Harmonics', 'Palm Mute', 'Sweep Pick', 'Shred', 'Breakdown', 'Mosh Pit', 'Wall of Death', 'Circle Pit', 'Headbang', 'Corpse Paint', 'Battle Vest']
      },
      'jazz': {
        adjectives: ['Smooth', 'Cool', 'Blue', 'Velvet', 'Silky', 'Elegant', 'Sophisticated', 'Mellow', 'Warm', 'Rich', 'Deep', 'Sultry', 'Midnight', 'Golden', 'Amber', 'Honey', 'Sweet', 'Gentle', 'Soft', 'Dreamy'],
        nouns: ['Blue', 'Note', 'Melody', 'Harmony', 'Rhythm', 'Soul', 'Spirit', 'Heart', 'Moon', 'Night', 'Dream', 'Whisper', 'Breeze', 'Rain', 'Cafe', 'Club', 'Lounge', 'Bar', 'Street', 'Avenue'],
        verbs: ['Swing', 'Sway', 'Flow', 'Glide', 'Dance', 'Improvise', 'Syncopate', 'Harmonize', 'Groove', 'Vibe', 'Feel', 'Express', 'Interpret', 'Create', 'Innovate', 'Explore', 'Discover', 'Journey', 'Wander', 'Float'],
        musicalTerms: ['Swing', 'Bebop', 'Cool Jazz', 'Fusion', 'Improvisation', 'Syncopation', 'Blue Note', 'Chord Changes', 'Walking Bass', 'Comping', 'Scat', 'Standard', 'Real Book', 'Jam Session', 'Cutting Contest', 'Sideman', 'Rhythm Section', 'Horn Section', 'Big Band', 'Small Combo']
      },
      'electronic': {
        adjectives: ['Digital', 'Synthetic', 'Cyber', 'Electric', 'Neon', 'Techno', 'Virtual', 'Binary', 'Quantum', 'Laser', 'Plasma', 'Neural', 'Matrix', 'Circuit', 'Pulse', 'Wave', 'Frequency', 'Modular', 'Analog', 'Future'],
        nouns: ['Synth', 'Circuit', 'Wire', 'Code', 'Data', 'Signal', 'Frequency', 'Wave', 'Pulse', 'Beat', 'Drop', 'Loop', 'Sample', 'Grid', 'Matrix', 'Network', 'System', 'Machine', 'Robot', 'Algorithm'],
        verbs: ['Synthesize', 'Process', 'Compute', 'Generate', 'Modulate', 'Filter', 'Compress', 'Sequence', 'Program', 'Code', 'Upload', 'Download', 'Stream', 'Transmit', 'Broadcast', 'Connect', 'Interface', 'Boot', 'Initialize', 'Execute'],
        musicalTerms: ['BPM', 'Bass Drop', 'Wobble', 'Filter Sweep', 'LFO', 'Oscillator', 'Envelope', 'Reverb', 'Delay', 'Chorus', 'Flanger', 'Phaser', 'Compressor', 'Sidechain', 'Vocoder', 'Auto-Tune', 'Sampler', 'Sequencer', 'DAW', 'MIDI']
      },
      'folk': {
        adjectives: ['Old', 'Ancient', 'Traditional', 'Rural', 'Country', 'Rustic', 'Simple', 'Pure', 'Natural', 'Organic', 'Earthy', 'Wooden', 'Stone', 'Wild', 'Free', 'Wandering', 'Traveling', 'Nomadic', 'Pastoral', 'Humble'],
        nouns: ['Road', 'Path', 'Trail', 'Mountain', 'Valley', 'River', 'Stream', 'Forest', 'Tree', 'Root', 'Branch', 'Leaf', 'Flower', 'Field', 'Farm', 'Village', 'Town', 'Home', 'Hearth', 'Story'],
        verbs: ['Wander', 'Roam', 'Travel', 'Journey', 'Walk', 'Sing', 'Tell', 'Share', 'Remember', 'Recall', 'Preserve', 'Pass Down', 'Teach', 'Learn', 'Gather', 'Harvest', 'Plant', 'Grow', 'Nurture', 'Tend'],
        musicalTerms: ['Ballad', 'Fiddle', 'Banjo', 'Mandolin', 'Harmonica', 'Acoustic', 'Fingerpicking', 'Strumming', 'Dulcimer', 'Penny Whistle', 'Concertina', 'Accordion', 'Dobro', 'Washboard', 'Jug', 'Spoons', 'Clogging', 'Square Dance', 'Hoedown', 'Campfire']
      },
      'classical': {
        adjectives: ['Grand', 'Majestic', 'Noble', 'Elegant', 'Refined', 'Graceful', 'Sublime', 'Divine', 'Heavenly', 'Ethereal', 'Timeless', 'Eternal', 'Perfect', 'Harmonious', 'Melodious', 'Orchestral', 'Symphonic', 'Chamber', 'Baroque', 'Romantic'],
        nouns: ['Symphony', 'Concerto', 'Sonata', 'Fugue', 'Prelude', 'Nocturne', 'Waltz', 'Minuet', 'Rondo', 'Variation', 'Movement', 'Theme', 'Motif', 'Phrase', 'Cadence', 'Harmony', 'Counterpoint', 'Canon', 'Aria', 'Overture'],
        verbs: ['Compose', 'Conduct', 'Perform', 'Interpret', 'Express', 'Harmonize', 'Orchestrate', 'Arrange', 'Transcribe', 'Modulate', 'Resolve', 'Develop', 'Elaborate', 'Embellish', 'Ornament', 'Phrase', 'Articulate', 'Breathe', 'Flow', 'Soar'],
        musicalTerms: ['Allegro', 'Andante', 'Adagio', 'Fortissimo', 'Pianissimo', 'Crescendo', 'Diminuendo', 'Staccato', 'Legato', 'Vibrato', 'Tremolo', 'Glissando', 'Arpeggio', 'Scale', 'Chromatic', 'Diatonic', 'Pentatonic', 'Major', 'Minor', 'Augmented']
      },
      'hip-hop': {
        adjectives: ['Fresh', 'Dope', 'Sick', 'Raw', 'Real', 'Street', 'Urban', 'Underground', 'Independent', 'Original', 'Authentic', 'Hard', 'Smooth', 'Slick', 'Sharp', 'Quick', 'Fast', 'Rapid', 'Bold', 'Confident'],
        nouns: ['Beat', 'Rhyme', 'Flow', 'Verse', 'Hook', 'Bridge', 'Break', 'Sample', 'Loop', 'Track', 'Mix', 'Scratch', 'Turntable', 'Microphone', 'Studio', 'Booth', 'Cipher', 'Freestyle', 'Battle', 'Crew'],
        verbs: ['Rap', 'Spit', 'Flow', 'Drop', 'Kick', 'Serve', 'Deliver', 'Freestyle', 'Battle', 'Cipher', 'Scratch', 'Mix', 'Blend', 'Cut', 'Loop', 'Sample', 'Chop', 'Flip', 'Remix', 'Produce'],
        musicalTerms: ['808', 'Kick', 'Snare', 'Hi-Hat', 'Sample', 'Loop', 'Break', 'Scratch', 'Turntable', 'DJ', 'MC', 'B-Boy', 'Graffiti', 'Beatbox', 'Freestyle', 'Cypher', 'Battle', 'Crew', 'Posse', 'Squad']
      },
      'country': {
        adjectives: ['Country', 'Southern', 'Western', 'Rural', 'Small-Town', 'Backwood', 'Hillbilly', 'Cowboy', 'Outlaw', 'Rebel', 'Honest', 'Simple', 'True', 'Real', 'Authentic', 'Traditional', 'Old-School', 'Classic', 'Vintage', 'Rustic'],
        nouns: ['Road', 'Highway', 'Truck', 'Farm', 'Ranch', 'Barn', 'Field', 'Creek', 'Mountain', 'Valley', 'Town', 'Church', 'Honky-Tonk', 'Saloon', 'Bar', 'Porch', 'Moonshine', 'Whiskey', 'Beer', 'Pickup'],
        verbs: ['Drive', 'Ride', 'Roll', 'Cruise', 'Roam', 'Wander', 'Drift', 'Settle', 'Work', 'Farm', 'Ranch', 'Fish', 'Hunt', 'Drink', 'Party', 'Dance', 'Sing', 'Play', 'Strum', 'Pick'],
        musicalTerms: ['Twang', 'Slide Guitar', 'Steel Guitar', 'Dobro', 'Banjo', 'Fiddle', 'Harmonica', 'Mandolin', 'Acoustic', 'Fingerpicking', 'Flatpicking', 'Nashville', 'Grand Ole Opry', 'Honky-Tonk', 'Bluegrass', 'Rockabilly', 'Outlaw', 'Alt-Country', 'Americana', 'Roots']
      },
      'blues': {
        adjectives: ['Blue', 'Deep', 'Soulful', 'Raw', 'Gritty', 'Rough', 'Smooth', 'Slow', 'Heavy', 'Thick', 'Rich', 'Dark', 'Moody', 'Melancholy', 'Sad', 'Lonesome', 'Lonely', 'Empty', 'Hollow', 'Aching'],
        nouns: ['Blues', 'Soul', 'Heart', 'Pain', 'Sorrow', 'Trouble', 'Worry', 'Cross', 'Road', 'Highway', 'Train', 'River', 'Delta', 'Chicago', 'Memphis', 'Mississippi', 'Cotton', 'Field', 'Plantation', 'Juke Joint'],
        verbs: ['Cry', 'Weep', 'Moan', 'Wail', 'Suffer', 'Hurt', 'Ache', 'Grieve', 'Mourn', 'Lament', 'Struggle', 'Fight', 'Survive', 'Endure', 'Overcome', 'Rise', 'Escape', 'Travel', 'Journey', 'Migrate'],
        musicalTerms: ['12-Bar', 'Pentatonic', 'Blue Note', 'Bend', 'Slide', 'Vibrato', 'Shuffle', 'Swing', 'Call and Response', 'Delta', 'Chicago', 'Electric', 'Acoustic', 'Harmonica', 'Slide Guitar', 'Bottleneck', 'Resonator', 'Dobro', 'Lap Steel', 'Washboard']
      },
      'reggae': {
        adjectives: ['Rasta', 'Irie', 'Positive', 'Uplifting', 'Spiritual', 'Conscious', 'Righteous', 'Peaceful', 'Unity', 'One Love', 'Jah', 'Blessed', 'Sacred', 'Holy', 'Divine', 'Natural', 'Organic', 'Green', 'Gold', 'Red'],
        nouns: ['Babylon', 'Zion', 'Jah', 'Rasta', 'Lion', 'Dread', 'Locks', 'Ganja', 'Herb', 'Nature', 'Earth', 'Creation', 'Universe', 'Love', 'Peace', 'Unity', 'Freedom', 'Liberation', 'Revolution', 'Uprising'],
        verbs: ['Rise', 'Rise Up', 'Stand Up', 'Get Up', 'Wake Up', 'Arise', 'Rebel', 'Resist', 'Fight', 'Struggle', 'Overcome', 'Conquer', 'Unite', 'Love', 'Praise', 'Worship', 'Celebrate', 'Dance', 'Skank', 'Bubble'],
        musicalTerms: ['Skank', 'One Drop', 'Steppers', 'Rockers', 'Bubble', 'Dub', 'Riddim', 'Bassline', 'Off-Beat', 'Nyabinghi', 'Rastafari', 'Sound System', 'Toasting', 'DJ', 'Selector', 'Dubplate', 'Version', 'Instrumental', 'Melodica', 'Clave']
      },
      'punk': {
        adjectives: ['Punk', 'Rebel', 'Anti', 'Raw', 'Fast', 'Loud', 'Angry', 'Pissed', 'Mad', 'Furious', 'Radical', 'Revolutionary', 'Anarchist', 'Underground', 'DIY', 'Independent', 'Hardcore', 'Straight Edge', 'Political', 'Social'],
        nouns: ['Anarchy', 'Chaos', 'Riot', 'Revolt', 'Revolution', 'Uprising', 'Protest', 'Resistance', 'Opposition', 'System', 'Authority', 'Government', 'Police', 'State', 'Society', 'Conformity', 'Mainstream', 'Establishment', 'Machine', 'Power'],
        verbs: ['Rebel', 'Revolt', 'Riot', 'Protest', 'Resist', 'Oppose', 'Fight', 'Battle', 'Destroy', 'Smash', 'Break', 'Tear Down', 'Overthrow', 'Reject', 'Refuse', 'Defy', 'Challenge', 'Question', 'Criticize', 'Attack'],
        musicalTerms: ['Power Chord', 'Distortion', 'Feedback', 'Fuzz', 'Overdrive', 'Fast', 'Aggressive', 'Raw', 'Lo-Fi', 'DIY', 'Three Chord', 'Simple', 'Direct', 'Honest', 'Authentic', 'Garage', 'Basement', 'Club', 'Venue', 'Scene']
      },
      'indie': {
        adjectives: ['Independent', 'Alternative', 'Underground', 'Artsy', 'Creative', 'Original', 'Unique', 'Quirky', 'Eccentric', 'Experimental', 'Avant-Garde', 'Lo-Fi', 'DIY', 'Handmade', 'Crafted', 'Boutique', 'Small', 'Local', 'Community', 'Grass-Roots'],
        nouns: ['Art', 'Craft', 'Creation', 'Expression', 'Voice', 'Vision', 'Dream', 'Imagination', 'Inspiration', 'Muse', 'Spirit', 'Soul', 'Heart', 'Mind', 'Thought', 'Idea', 'Concept', 'Project', 'Collective', 'Community'],
        verbs: ['Create', 'Express', 'Explore', 'Experiment', 'Discover', 'Invent', 'Innovate', 'Craft', 'Build', 'Make', 'Design', 'Compose', 'Write', 'Record', 'Produce', 'Release', 'Share', 'Connect', 'Inspire', 'Influence'],
        musicalTerms: ['Lo-Fi', 'Bedroom Pop', 'Dream Pop', 'Shoegaze', 'Post-Rock', 'Math Rock', 'Emo', 'Screamo', 'Indie Rock', 'Indie Pop', 'Alternative', 'Underground', 'DIY', 'Self-Released', 'Bandcamp', 'Soundcloud', 'Cassette', 'Vinyl', '7-Inch', 'EP']
      },
      'pop': {
        adjectives: ['Popular', 'Catchy', 'Bright', 'Shiny', 'Glossy', 'Polished', 'Perfect', 'Sweet', 'Sugary', 'Bubbly', 'Upbeat', 'Happy', 'Joyful', 'Cheerful', 'Positive', 'Energetic', 'Dynamic', 'Vibrant', 'Colorful', 'Fun'],
        nouns: ['Pop', 'Hit', 'Chart', 'Radio', 'Airplay', 'Single', 'Album', 'Track', 'Song', 'Melody', 'Hook', 'Chorus', 'Verse', 'Bridge', 'Beat', 'Rhythm', 'Dance', 'Party', 'Club', 'Stage'],
        verbs: ['Pop', 'Bounce', 'Dance', 'Move', 'Groove', 'Shake', 'Shimmer', 'Sparkle', 'Shine', 'Glow', 'Radiate', 'Burst', 'Explode', 'Celebrate', 'Party', 'Have Fun', 'Enjoy', 'Love', 'Adore', 'Worship'],
        musicalTerms: ['Hook', 'Chorus', 'Bridge', 'Pre-Chorus', 'Verse', 'Refrain', 'Melody', 'Harmony', 'Auto-Tune', 'Pitch Perfect', 'Catchy', 'Earworm', 'Radio Friendly', 'Commercial', 'Mainstream', 'Top 40', 'Billboard', 'Chart Topper', 'Hit Single', 'Pop Star']
      },
      'alternative': {
        adjectives: ['Alternative', 'Different', 'Unique', 'Non-Conformist', 'Anti-Mainstream', 'Underground', 'Subversive', 'Edgy', 'Dark', 'Moody', 'Atmospheric', 'Ambient', 'Ethereal', 'Dreamy', 'Surreal', 'Abstract', 'Conceptual', 'Intellectual', 'Artistic', 'Creative'],
        nouns: ['Alternative', 'Option', 'Choice', 'Path', 'Route', 'Way', 'Direction', 'Perspective', 'View', 'Angle', 'Approach', 'Method', 'Style', 'Form', 'Shape', 'Structure', 'Framework', 'Concept', 'Idea', 'Theory'],
        verbs: ['Alternate', 'Change', 'Shift', 'Transform', 'Morph', 'Evolve', 'Develop', 'Progress', 'Advance', 'Move', 'Flow', 'Drift', 'Float', 'Hover', 'Suspend', 'Balance', 'Equilibrate', 'Stabilize', 'Center', 'Focus'],
        musicalTerms: ['Grunge', 'Shoegaze', 'Post-Punk', 'New Wave', 'Gothic', 'Industrial', 'Noise', 'Experimental', 'Ambient', 'Drone', 'Post-Rock', 'Math Rock', 'Emo', 'Screamo', 'Hardcore', 'Metalcore', 'Prog', 'Psychedelic', 'Krautrock', 'No Wave']
      }
    };

    const genreWords = genreFilters[genre as keyof typeof genreFilters];
    if (!genreWords) {
      return sources; // Return original if genre not found
    }

    // Combine genre-specific words with existing words, prioritizing genre words
    return {
      adjectives: [...genreWords.adjectives, ...sources.adjectives.slice(0, 20)].slice(0, 50),
      nouns: [...genreWords.nouns, ...sources.nouns.slice(0, 20)].slice(0, 50),
      verbs: [...genreWords.verbs, ...sources.verbs.slice(0, 20)].slice(0, 50),
      musicalTerms: [...genreWords.musicalTerms, ...sources.musicalTerms.slice(0, 20)].slice(0, 50)
    };
  }

  private buildPattern(structure: string[], wordSources?: WordSource): string {
    // Add defensive programming for structure parameter
    if (!structure || !Array.isArray(structure) || structure.length === 0) {
      console.error('Invalid structure passed to buildPattern:', structure);
      return 'Mysterious Sound'; // fallback
    }
    
    const sources = wordSources || this.wordSources;
    
    // Ensure sources are valid - fallback to base if empty
    const validSources = {
      adjectives: (sources.adjectives && sources.adjectives.length > 0) ? sources.adjectives : this.wordSources.adjectives,
      nouns: (sources.nouns && sources.nouns.length > 0) ? sources.nouns : this.wordSources.nouns,
      verbs: (sources.verbs && sources.verbs.length > 0) ? sources.verbs : this.wordSources.verbs,
      musicalTerms: (sources.musicalTerms && sources.musicalTerms.length > 0) ? sources.musicalTerms : this.wordSources.musicalTerms
    };
    
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
          // 30% chance to use expanded categories for more variety
          if (Math.random() < 0.3 && this.expandedCategories) {
            const categoryChoice = Math.random();
            if (categoryChoice < 0.25 && this.expandedCategories.emotions.length > 0) {
              word = this.expandedCategories.emotions[Math.floor(Math.random() * this.expandedCategories.emotions.length)];
            } else if (categoryChoice < 0.5 && this.expandedCategories.colors.length > 0) {
              word = this.expandedCategories.colors[Math.floor(Math.random() * this.expandedCategories.colors.length)];
            } else if (categoryChoice < 0.75 && this.expandedCategories.textures.length > 0) {
              word = this.expandedCategories.textures[Math.floor(Math.random() * this.expandedCategories.textures.length)];
            } else if (this.expandedCategories.tastes.length > 0) {
              word = this.expandedCategories.tastes[Math.floor(Math.random() * this.expandedCategories.tastes.length)];
            }
          }
          if (!word) {
            word = validSources.adjectives[Math.floor(Math.random() * validSources.adjectives.length)];
          }
          break;
        case 'noun':
          // 40% chance to use expanded categories for maximum variety
          if (Math.random() < 0.4 && this.expandedCategories) {
            const categoryChoice = Math.random();
            if (categoryChoice < 0.2 && this.expandedCategories.animals.length > 0) {
              word = this.expandedCategories.animals[Math.floor(Math.random() * this.expandedCategories.animals.length)];
            } else if (categoryChoice < 0.4 && this.expandedCategories.mythology.length > 0) {
              word = this.expandedCategories.mythology[Math.floor(Math.random() * this.expandedCategories.mythology.length)];
            } else if (categoryChoice < 0.6 && this.expandedCategories.cosmic.length > 0) {
              word = this.expandedCategories.cosmic[Math.floor(Math.random() * this.expandedCategories.cosmic.length)];
            } else if (categoryChoice < 0.8 && this.expandedCategories.nature.length > 0) {
              word = this.expandedCategories.nature[Math.floor(Math.random() * this.expandedCategories.nature.length)];
            } else if (this.expandedCategories.technology.length > 0) {
              word = this.expandedCategories.technology[Math.floor(Math.random() * this.expandedCategories.technology.length)];
            }
          }
          if (!word) {
            word = validSources.nouns[Math.floor(Math.random() * validSources.nouns.length)];
          }
          break;
        case 'verb':
          // 25% chance to use movement words for dynamic feel
          if (Math.random() < 0.25 && this.expandedCategories && this.expandedCategories.movement.length > 0) {
            word = this.expandedCategories.movement[Math.floor(Math.random() * this.expandedCategories.movement.length)];
          }
          if (!word) {
            word = validSources.verbs[Math.floor(Math.random() * validSources.verbs.length)];
          }
          break;
        case 'musical':
          // 20% chance to use sound words for musical relevance
          if (Math.random() < 0.2 && this.expandedCategories && this.expandedCategories.sounds.length > 0) {
            word = this.expandedCategories.sounds[Math.floor(Math.random() * this.expandedCategories.sounds.length)];
          }
          if (!word) {
            word = validSources.musicalTerms[Math.floor(Math.random() * validSources.musicalTerms.length)];
          }
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
            ...validSources.adjectives,
            ...validSources.nouns,
            ...validSources.verbs,
            ...validSources.musicalTerms
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
    
    // Ensure sources are valid - fallback to base if empty
    const validSources = {
      adjectives: (sources.adjectives && sources.adjectives.length > 0) ? sources.adjectives : this.wordSources.adjectives,
      nouns: (sources.nouns && sources.nouns.length > 0) ? sources.nouns : this.wordSources.nouns,
      verbs: (sources.verbs && sources.verbs.length > 0) ? sources.verbs : this.wordSources.verbs,
      musicalTerms: (sources.musicalTerms && sources.musicalTerms.length > 0) ? sources.musicalTerms : this.wordSources.musicalTerms
    };
    
    // Create patterns with intentional repetition (common in song titles)
    const baseWord = validSources.nouns[Math.floor(Math.random() * validSources.nouns.length)];
    const adjective = validSources.adjectives[Math.floor(Math.random() * validSources.adjectives.length)];
    
    const repetitivePatterns = [
      `${adjective} ${baseWord}, ${adjective} ${validSources.nouns[Math.floor(Math.random() * validSources.nouns.length)]}`,
      `${baseWord} ${validSources.verbs[Math.floor(Math.random() * validSources.verbs.length)]} ${baseWord}`,
      `The ${baseWord} and the ${validSources.nouns[Math.floor(Math.random() * validSources.nouns.length)]}`
    ];

    let result = repetitivePatterns[Math.floor(Math.random() * repetitivePatterns.length)];
    
    // Add more words if needed
    while (result.split(' ').length < wordCount) {
      const filler = validSources.adjectives[Math.floor(Math.random() * validSources.adjectives.length)];
      result += ` ${filler}`;
    }

    return result;
  }

  private buildAtmosphericPattern(wordCount: number, wordSources?: WordSource): string {
    const sources = wordSources || this.wordSources;
    
    // Ensure sources are valid - fallback to base if empty
    const validSources = {
      adjectives: (sources.adjectives && sources.adjectives.length > 0) ? sources.adjectives : this.wordSources.adjectives,
      nouns: (sources.nouns && sources.nouns.length > 0) ? sources.nouns : this.wordSources.nouns,
      verbs: (sources.verbs && sources.verbs.length > 0) ? sources.verbs : this.wordSources.verbs,
      musicalTerms: (sources.musicalTerms && sources.musicalTerms.length > 0) ? sources.musicalTerms : this.wordSources.musicalTerms
    };
    
    // Create atmospheric, abstract combinations
    const atmospheric = [
      ...validSources.adjectives.filter(word => 
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
        const wordSourcesArray = [validSources.nouns, validSources.musicalTerms];
        const source = wordSourcesArray[Math.floor(Math.random() * wordSourcesArray.length)];
        words.push(source[Math.floor(Math.random() * source.length)]);
      }
    }

    return words.join(' ');
  }

  private buildNarrativePattern(wordCount: number, wordSources?: WordSource): string {
    const sources = wordSources || this.wordSources;
    
    // Ensure sources are valid - fallback to base if empty
    const validSources = {
      adjectives: (sources.adjectives && sources.adjectives.length > 0) ? sources.adjectives : this.wordSources.adjectives,
      nouns: (sources.nouns && sources.nouns.length > 0) ? sources.nouns : this.wordSources.nouns,
      verbs: (sources.verbs && sources.verbs.length > 0) ? sources.verbs : this.wordSources.verbs,
      musicalTerms: (sources.musicalTerms && sources.musicalTerms.length > 0) ? sources.musicalTerms : this.wordSources.musicalTerms
    };
    
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
        words.push(validSources.verbs[Math.floor(Math.random() * validSources.verbs.length)]);
        words.push(validSources.nouns[Math.floor(Math.random() * validSources.nouns.length)]);
      } else {
        // Add single word
        const allWords = [
          ...validSources.adjectives,
          ...validSources.nouns,
          ...validSources.musicalTerms
        ];
        words.push(allWords[Math.floor(Math.random() * allWords.length)]);
      }
    }

    return words.join(' ');
  }

  private removeDuplicates(array: string[]): string[] {
    const seen = new Set<string>();
    return array.filter(item => {
      const lowercaseItem = item.toLowerCase();
      if (seen.has(lowercaseItem)) {
        return false;
      }
      seen.add(lowercaseItem);
      return true;
    });
  }

  private ensureValidWordSource(sources: WordSource): WordSource {
    // Fallback to static words if any category is empty
    return {
      adjectives: sources.adjectives && sources.adjectives.length > 0 ? sources.adjectives : this.wordSources.adjectives,
      nouns: sources.nouns && sources.nouns.length > 0 ? sources.nouns : this.wordSources.nouns,
      verbs: sources.verbs && sources.verbs.length > 0 ? sources.verbs : this.wordSources.verbs,
      musicalTerms: sources.musicalTerms && sources.musicalTerms.length > 0 ? sources.musicalTerms : this.wordSources.musicalTerms
    };
  }

  // Method to fetch words from external APIs and web sources
  private async fetchWordsFromWeb(): Promise<void> {
    try {
      // Fetch from multiple web sources in parallel
      const [adjectives, nouns, verbs, musicalTerms] = await Promise.all([
        this.fetchAdjectivesFromWeb(),
        this.fetchNounsFromWeb(),
        this.fetchVerbsFromWeb(),
        this.fetchMusicalTermsFromWeb()
      ]);

      // Merge web-sourced words with existing vocabulary, removing duplicates
      this.wordSources.adjectives = this.removeDuplicates([...this.wordSources.adjectives, ...adjectives]);
      this.wordSources.nouns = this.removeDuplicates([...this.wordSources.nouns, ...nouns]);
      this.wordSources.verbs = this.removeDuplicates([...this.wordSources.verbs, ...verbs]);
      this.wordSources.musicalTerms = this.removeDuplicates([...this.wordSources.musicalTerms, ...musicalTerms]);

      console.log(`Enhanced vocabulary: ${this.wordSources.adjectives.length} adjectives, ${this.wordSources.nouns.length} nouns, ${this.wordSources.verbs.length} verbs, ${this.wordSources.musicalTerms.length} musical terms`);
    } catch (error) {
      console.error('Failed to fetch words from web:', error);
      console.log('Using static vocabulary as fallback');
    }
  }

  private async fetchAdjectivesFromWeb(): Promise<string[]> {
    const adjectives: string[] = [];
    
    try {
      // Fetch from multiple sources
      const sources = [
        this.fetchFromWordnikAPI('adjective'),
        this.fetchFromDictionaryAPI('adjectives'),
        this.fetchRandomWikipediaWords('adjective')
      ];
      
      const results = await Promise.allSettled(sources);
      results.forEach(result => {
        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
          adjectives.push(...result.value);
        }
      });
      
      return adjectives.slice(0, 50); // Limit to prevent overwhelming
    } catch (error) {
      console.error('Error fetching adjectives:', error);
      return [];
    }
  }

  private async fetchNounsFromWeb(): Promise<string[]> {
    const nouns: string[] = [];
    
    try {
      const sources = [
        this.fetchFromWordnikAPI('noun'),
        this.fetchFromDictionaryAPI('nouns'),
        this.fetchRandomWikipediaWords('noun'),
        this.fetchFromPoetryAPI()
      ];
      
      const results = await Promise.allSettled(sources);
      results.forEach(result => {
        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
          nouns.push(...result.value);
        }
      });
      
      return nouns.slice(0, 50);
    } catch (error) {
      console.error('Error fetching nouns:', error);
      return [];
    }
  }

  private async fetchVerbsFromWeb(): Promise<string[]> {
    const verbs: string[] = [];
    
    try {
      const sources = [
        this.fetchFromWordnikAPI('verb'),
        this.fetchFromDictionaryAPI('verbs'),
        this.fetchActionWordsFromWeb()
      ];
      
      const results = await Promise.allSettled(sources);
      results.forEach(result => {
        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
          verbs.push(...result.value);
        }
      });
      
      return verbs.slice(0, 40);
    } catch (error) {
      console.error('Error fetching verbs:', error);
      return [];
    }
  }

  private async fetchMusicalTermsFromWeb(): Promise<string[]> {
    const musicalTerms: string[] = [];
    
    try {
      const sources = [
        this.fetchFromMusicBrainzAPI(),
        this.fetchFromLastFmAPI(),
        this.fetchMusicalInstrumentsFromWeb(),
        this.fetchMusicGenresFromWeb()
      ];
      
      const results = await Promise.allSettled(sources);
      results.forEach(result => {
        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
          musicalTerms.push(...result.value);
        }
      });
      
      return musicalTerms.slice(0, 40);
    } catch (error) {
      console.error('Error fetching musical terms:', error);
      return [];
    }
  }

  // Individual API fetching methods
  private async fetchFromWordnikAPI(partOfSpeech: string): Promise<string[]> {
    try {
      // Wordnik API for random words by part of speech
      const response = await fetch(`https://api.wordnik.com/v4/words.json/randomWords?hasDictionaryDef=true&includePartOfSpeech=${partOfSpeech}&minCorpusCount=1000&maxCorpusCount=-1&minDictionaryCount=1&maxDictionaryCount=-1&minLength=3&maxLength=12&limit=20&api_key=placeholder`);
      
      if (!response.ok) throw new Error('Wordnik API failed');
      
      const data = await response.json();
      return data.map((item: any) => this.capitalizeFirst(item.word)).filter(this.isValidWord);
    } catch (error) {
      console.error('Wordnik API error:', error);
      return [];
    }
  }

  private async fetchFromDictionaryAPI(category: string): Promise<string[]> {
    try {
      // Free dictionary API or other word sources
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/random`);
      
      if (!response.ok) throw new Error('Dictionary API failed');
      
      // Parse and extract relevant words based on category
      const data = await response.json();
      // Implementation would extract words based on category
      return [];
    } catch (error) {
      console.error('Dictionary API error:', error);
      return [];
    }
  }

  private async fetchRandomWikipediaWords(type: string): Promise<string[]> {
    try {
      // Wikipedia random article titles for diverse vocabulary
      const response = await fetch('https://en.wikipedia.org/api/rest_v1/page/random/summary');
      
      if (!response.ok) throw new Error('Wikipedia API failed');
      
      const data = await response.json();
      const title = data.title;
      
      // Extract meaningful words from Wikipedia titles
      const words = title.split(/[\s\-_()]+/)
        .filter((word: string) => word.length > 2 && word.length < 15)
        .map((word: string) => this.capitalizeFirst(word.toLowerCase()))
        .filter(this.isValidWord);
      
      return words;
    } catch (error) {
      console.error('Wikipedia API error:', error);
      return [];
    }
  }

  private async fetchFromPoetryAPI(): Promise<string[]> {
    try {
      // Poetry API for poetic and creative words
      const response = await fetch('https://poetrydb.org/random');
      
      if (!response.ok) throw new Error('Poetry API failed');
      
      const data = await response.json();
      const lines = data[0]?.lines || [];
      
      // Extract evocative words from poetry
      const words: string[] = [];
      lines.forEach((line: string) => {
        const lineWords = line.split(/\s+/)
          .filter((word: string) => word.length > 3 && word.length < 12)
          .map((word: string) => word.replace(/[^a-zA-Z]/g, ''))
          .filter((word: string) => word.length > 2)
          .map((word: string) => this.capitalizeFirst(word.toLowerCase()));
        words.push(...lineWords);
      });
      
      return words.filter(this.isValidWord).slice(0, 10);
    } catch (error) {
      console.error('Poetry API error:', error);
      return [];
    }
  }

  private async fetchFromMusicBrainzAPI(): Promise<string[]> {
    try {
      // MusicBrainz for musical terms and instrument names
      const response = await fetch('https://musicbrainz.org/ws/2/instrument?limit=25&fmt=json');
      
      if (!response.ok) throw new Error('MusicBrainz API failed');
      
      const data = await response.json();
      return data.instruments
        ?.map((instrument: any) => this.capitalizeFirst(instrument.name))
        .filter(this.isValidWord) || [];
    } catch (error) {
      console.error('MusicBrainz API error:', error);
      return [];
    }
  }

  private async fetchFromLastFmAPI(): Promise<string[]> {
    try {
      // Last.fm for music genre and tag words
      const response = await fetch('https://ws.audioscrobbler.com/2.0/?method=tag.gettoptags&api_key=placeholder&format=json');
      
      if (!response.ok) throw new Error('Last.fm API failed');
      
      const data = await response.json();
      return data.toptags?.tag
        ?.map((tag: any) => this.capitalizeFirst(tag.name))
        .filter(this.isValidWord) || [];
    } catch (error) {
      console.error('Last.fm API error:', error);
      return [];
    }
  }

  private async fetchActionWordsFromWeb(): Promise<string[]> {
    try {
      // Fetch action words from various sources
      const actionWords = [
        'Accelerating', 'Bouncing', 'Cascading', 'Diving', 'Echoing', 'Flowing',
        'Gliding', 'Hovering', 'Igniting', 'Jumping', 'Kicking', 'Launching',
        'Melting', 'Navigating', 'Orbiting', 'Pulsing', 'Quivering', 'Racing',
        'Spiraling', 'Tumbling', 'Undulating', 'Vibrating', 'Weaving', 'Zooming'
      ];
      
      return actionWords;
    } catch (error) {
      console.error('Error fetching action words:', error);
      return [];
    }
  }

  private async fetchMusicalInstrumentsFromWeb(): Promise<string[]> {
    try {
      // Comprehensive list of musical instruments
      const instruments = [
        'Synthesizer', 'Theremin', 'Hurdy-Gurdy', 'Didgeridoo', 'Kalimba', 'Ocarina',
        'Bandoneon', 'Concertina', 'Melodica', 'Handpan', 'Cajon', 'Djembe',
        'Tabla', 'Sitar', 'Koto', 'Shamisen', 'Erhu', 'Duduk'
      ];
      
      return instruments;
    } catch (error) {
      console.error('Error fetching instruments:', error);
      return [];
    }
  }

  private async fetchMusicGenresFromWeb(): Promise<string[]> {
    try {
      // Dynamic music genres and styles
      const genres = [
        'Ambient', 'Shoegaze', 'Breakcore', 'Vaporwave', 'Darkwave', 'Synthwave',
        'Post-Rock', 'Math-Rock', 'Drone', 'Downtempo', 'Trip-Hop', 'Chillwave',
        'Psybient', 'Glitch', 'IDM', 'Breakbeat', 'Dubstep', 'Future-Bass'
      ];
      
      return genres;
    } catch (error) {
      console.error('Error fetching genres:', error);
      return [];
    }
  }

  // Utility methods
  private capitalizeFirst(word: string): string {
    if (!word) return word;
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }

  // Fetch expanded categories for endless variety
  private async fetchExpandedCategories() {
    try {
      const [emotions, colors, animals, mythology, technology, nature, cosmic, abstract, textures, weather, timeRelated, movement, sounds, tastes, cultural] = await Promise.all([
        this.fetchEmotionalWords(),
        this.fetchColorWords(),
        this.fetchAnimalWords(),
        this.fetchMythologyWords(),
        this.fetchTechnologyWords(),
        this.fetchNatureWords(),
        this.fetchCosmicWords(),
        this.fetchAbstractWords(),
        this.fetchTextureWords(),
        this.fetchWeatherWords(),
        this.fetchTimeWords(),
        this.fetchMovementWords(),
        this.fetchSoundWords(),
        this.fetchTasteWords(),
        this.fetchCulturalWords()
      ]);

      this.expandedCategories = {
        emotions: this.removeDuplicates(emotions),
        colors: this.removeDuplicates(colors),
        animals: this.removeDuplicates(animals),
        mythology: this.removeDuplicates(mythology),
        technology: this.removeDuplicates(technology),
        nature: this.removeDuplicates(nature),
        cosmic: this.removeDuplicates(cosmic),
        abstract: this.removeDuplicates(abstract),
        textures: this.removeDuplicates(textures),
        weather: this.removeDuplicates(weather),
        timeRelated: this.removeDuplicates(timeRelated),
        movement: this.removeDuplicates(movement),
        sounds: this.removeDuplicates(sounds),
        tastes: this.removeDuplicates(tastes),
        cultural: this.removeDuplicates(cultural)
      };

      // Integrate expanded categories into main word sources
      this.integrateExpandedCategories();
      
      console.log('Expanded categories loaded:', {
        emotions: this.expandedCategories.emotions.length,
        colors: this.expandedCategories.colors.length,
        animals: this.expandedCategories.animals.length,
        mythology: this.expandedCategories.mythology.length,
        technology: this.expandedCategories.technology.length,
        nature: this.expandedCategories.nature.length,
        cosmic: this.expandedCategories.cosmic.length,
        abstract: this.expandedCategories.abstract.length,
        textures: this.expandedCategories.textures.length,
        weather: this.expandedCategories.weather.length,
        timeRelated: this.expandedCategories.timeRelated.length,
        movement: this.expandedCategories.movement.length,
        sounds: this.expandedCategories.sounds.length,
        tastes: this.expandedCategories.tastes.length,
        cultural: this.expandedCategories.cultural.length
      });
    } catch (error) {
      console.error('Error fetching expanded categories:', error);
    }
  }

  private integrateExpandedCategories() {
    // Add variety from expanded categories to main word sources
    this.wordSources.adjectives = [
      ...this.wordSources.adjectives,
      ...this.expandedCategories.emotions.slice(0, 30),
      ...this.expandedCategories.colors.slice(0, 30),
      ...this.expandedCategories.textures.slice(0, 20),
      ...this.expandedCategories.tastes.slice(0, 10)
    ];

    this.wordSources.nouns = [
      ...this.wordSources.nouns,
      ...this.expandedCategories.animals.slice(0, 30),
      ...this.expandedCategories.mythology.slice(0, 25),
      ...this.expandedCategories.technology.slice(0, 25),
      ...this.expandedCategories.nature.slice(0, 30),
      ...this.expandedCategories.cosmic.slice(0, 20),
      ...this.expandedCategories.abstract.slice(0, 20),
      ...this.expandedCategories.weather.slice(0, 15),
      ...this.expandedCategories.cultural.slice(0, 20)
    ];

    this.wordSources.verbs = [
      ...this.wordSources.verbs,
      ...this.expandedCategories.movement.slice(0, 40),
      ...this.expandedCategories.sounds.map(s => this.soundToVerb(s)).slice(0, 20)
    ];

    this.wordSources.musicalTerms = [
      ...this.wordSources.musicalTerms,
      ...this.expandedCategories.sounds.slice(0, 20),
      ...this.expandedCategories.timeRelated.filter(t => this.isMusicalTime(t)).slice(0, 15)
    ];

    // Remove duplicates from final sources
    this.wordSources.adjectives = this.removeDuplicates(this.wordSources.adjectives);
    this.wordSources.nouns = this.removeDuplicates(this.wordSources.nouns);
    this.wordSources.verbs = this.removeDuplicates(this.wordSources.verbs);
    this.wordSources.musicalTerms = this.removeDuplicates(this.wordSources.musicalTerms);
  }

  private soundToVerb(sound: string): string {
    // Convert sound words to verb forms
    const verbMap: { [key: string]: string } = {
      'whisper': 'whispering',
      'thunder': 'thundering',
      'echo': 'echoing',
      'buzz': 'buzzing',
      'hum': 'humming',
      'roar': 'roaring',
      'click': 'clicking',
      'snap': 'snapping',
      'crash': 'crashing',
      'ring': 'ringing'
    };
    return verbMap[sound.toLowerCase()] || sound;
  }

  private isMusicalTime(timeWord: string): boolean {
    // Check if time-related word is musically relevant
    const musicalTimeWords = ['tempo', 'rhythm', 'beat', 'measure', 'bar', 'pause', 'rest', 'timing', 'sync', 'delay'];
    return musicalTimeWords.some(word => timeWord.toLowerCase().includes(word));
  }

  private isValidWord = (word: string): boolean => {
    if (!word || word.length < 2 || word.length > 15) return false;
    if (!/^[a-zA-Z-]+$/.test(word)) return false;
    if (/^(the|and|or|but|in|on|at|to|for|of|with|by)$/i.test(word)) return false;
    return true;
  }

  // Expanded category fetchers for endless variety
  private async fetchEmotionalWords(): Promise<string[]> {
    return [
      'Blissful', 'Furious', 'Yearning', 'Ecstatic', 'Despondent', 'Exuberant', 'Anguished',
      'Jubilant', 'Forlorn', 'Elated', 'Morose', 'Giddy', 'Sullen', 'Euphoric', 'Wistful',
      'Rapturous', 'Crestfallen', 'Gleeful', 'Dejected', 'Radiant', 'Melancholic', 'Zealous',
      'Pensive', 'Vivacious', 'Somber', 'Exhilarated', 'Doleful', 'Buoyant', 'Lugubrious',
      'Enraptured', 'Disconsolate', 'Effervescent', 'Woeful', 'Beatific', 'Lachrymose'
    ];
  }

  private async fetchColorWords(): Promise<string[]> {
    return [
      'Vermillion', 'Cerulean', 'Chartreuse', 'Magenta', 'Ochre', 'Sienna', 'Cobalt',
      'Periwinkle', 'Saffron', 'Burgundy', 'Teal', 'Maroon', 'Aquamarine', 'Fuchsia',
      'Lavender', 'Coral', 'Turquoise', 'Mauve', 'Tangerine', 'Sepia', 'Viridian',
      'Carmine', 'Ultramarine', 'Cinnabar', 'Aureolin', 'Prussian', 'Cadmium', 'Phthalo',
      'Quinacridone', 'Titanium', 'Chromatic', 'Prismatic', 'Iridescent', 'Opalescent'
    ];
  }

  private async fetchAnimalWords(): Promise<string[]> {
    return [
      'Phoenix', 'Griffin', 'Chimera', 'Leviathan', 'Kraken', 'Basilisk', 'Wyvern',
      'Hydra', 'Pegasus', 'Sphinx', 'Minotaur', 'Centaur', 'Manticore', 'Hippogryph',
      'Salamander', 'Behemoth', 'Roc', 'Cerberus', 'Valkyrie', 'Banshee', 'Selkie',
      'Kitsune', 'Tengu', 'Raiju', 'Qilin', 'Baku', 'Kappa', 'Oni', 'Yokai',
      'Wendigo', 'Chupacabra', 'Mothman', 'Thunderbird', 'Skinwalker', 'Jackalope'
    ];
  }

  private async fetchMythologyWords(): Promise<string[]> {
    return [
      'Valhalla', 'Elysium', 'Avalon', 'Asgard', 'Olympus', 'Atlantis', 'Camelot',
      'Shangri-La', 'El-Dorado', 'Hyperborea', 'Lemuria', 'Mu', 'Thule', 'Arcadia',
      'Pandora', 'Prometheus', 'Icarus', 'Achilles', 'Odysseus', 'Perseus', 'Orpheus',
      'Medusa', 'Circe', 'Cassandra', 'Andromeda', 'Persephone', 'Dionysus', 'Apollo',
      'Athena', 'Hermes', 'Poseidon', 'Hades', 'Chronos', 'Gaia', 'Nyx'
    ];
  }

  private async fetchTechnologyWords(): Promise<string[]> {
    return [
      'Quantum', 'Cybernetic', 'Holographic', 'Neuromantic', 'Bionic', 'Synthetic',
      'Digital', 'Virtual', 'Augmented', 'Nano', 'Plasma', 'Photonic', 'Sonic',
      'Magnetic', 'Gravitational', 'Temporal', 'Dimensional', 'Fractal', 'Algorithmic',
      'Binary', 'Hexadecimal', 'Encrypted', 'Decoded', 'Simulated', 'Emulated',
      'Transcoded', 'Overclocked', 'Undervolted', 'Modulated', 'Amplified', 'Attenuated',
      'Calibrated', 'Synchronized', 'Initialized', 'Terminated'
    ];
  }

  private async fetchNatureWords(): Promise<string[]> {
    return [
      'Tundra', 'Savanna', 'Rainforest', 'Desert', 'Glacier', 'Volcano', 'Canyon',
      'Fjord', 'Archipelago', 'Peninsula', 'Isthmus', 'Atoll', 'Mesa', 'Plateau',
      'Estuary', 'Delta', 'Bayou', 'Marsh', 'Swamp', 'Fen', 'Bog', 'Moor',
      'Heath', 'Prairie', 'Steppe', 'Pampas', 'Veldt', 'Taiga', 'Chaparral',
      'Mangrove', 'Coral', 'Kelp', 'Lichen', 'Moss', 'Fungus'
    ];
  }

  private async fetchCosmicWords(): Promise<string[]> {
    return [
      'Nebula', 'Quasar', 'Pulsar', 'Supernova', 'Blackhole', 'Wormhole', 'Galaxy',
      'Constellation', 'Asteroid', 'Comet', 'Meteor', 'Eclipse', 'Solstice', 'Equinox',
      'Aurora', 'Corona', 'Chromosphere', 'Magnetosphere', 'Heliosphere', 'Exosphere',
      'Stratosphere', 'Mesosphere', 'Thermosphere', 'Ionosphere', 'Troposphere',
      'Perihelion', 'Aphelion', 'Perigee', 'Apogee', 'Zenith', 'Nadir', 'Azimuth',
      'Parallax', 'Redshift', 'Blueshift'
    ];
  }

  private async fetchAbstractWords(): Promise<string[]> {
    return [
      'Paradox', 'Enigma', 'Conundrum', 'Anomaly', 'Phenomenon', 'Epiphany', 'Axiom',
      'Theorem', 'Hypothesis', 'Paradigm', 'Zeitgeist', 'Gestalt', 'Archetype', 'Motif',
      'Leitmotif', 'Allegory', 'Metaphor', 'Simile', 'Synecdoche', 'Metonymy', 'Irony',
      'Satire', 'Parody', 'Pastiche', 'Collage', 'Montage', 'Bricolage', 'Palimpsest',
      'Pentimento', 'Chiaroscuro', 'Sfumato', 'Tenebrism', 'Impasto', 'Glazing'
    ];
  }

  private async fetchTextureWords(): Promise<string[]> {
    return [
      'Velveteen', 'Silken', 'Gossamer', 'Diaphanous', 'Gauzy', 'Feathery', 'Downy',
      'Plush', 'Velvety', 'Satiny', 'Lustrous', 'Burnished', 'Polished', 'Matte',
      'Granular', 'Gritty', 'Coarse', 'Rough', 'Jagged', 'Serrated', 'Corrugated',
      'Ribbed', 'Grooved', 'Scored', 'Etched', 'Embossed', 'Debossed', 'Stippled',
      'Dappled', 'Mottled', 'Marbled', 'Veined', 'Striated', 'Laminated'
    ];
  }

  private async fetchWeatherWords(): Promise<string[]> {
    return [
      'Tempest', 'Maelstrom', 'Typhoon', 'Cyclone', 'Hurricane', 'Tornado', 'Whirlwind',
      'Zephyr', 'Gale', 'Squall', 'Blizzard', 'Hailstorm', 'Thunderstorm', 'Downpour',
      'Deluge', 'Drizzle', 'Mist', 'Fog', 'Haze', 'Smog', 'Frost', 'Rime',
      'Hoarfrost', 'Glaze', 'Sleet', 'Graupel', 'Virga', 'Mammatus', 'Cumulonimbus',
      'Stratocumulus', 'Altostratus', 'Cirrus', 'Nimbus', 'Cumulus'
    ];
  }

  private async fetchTimeWords(): Promise<string[]> {
    return [
      'Epoch', 'Era', 'Eon', 'Millennium', 'Century', 'Decade', 'Fortnight', 'Sennight',
      'Solstice', 'Equinox', 'Twilight', 'Dusk', 'Dawn', 'Daybreak', 'Eventide',
      'Gloaming', 'Vespers', 'Matins', 'Compline', 'Lauds', 'Prime', 'Terce',
      'Sext', 'None', 'Chronos', 'Kairos', 'Temporal', 'Perpetual', 'Eternal',
      'Ephemeral', 'Transient', 'Fleeting', 'Momentary', 'Instantaneous'
    ];
  }

  private async fetchMovementWords(): Promise<string[]> {
    return [
      'Gyrating', 'Oscillating', 'Undulating', 'Pulsating', 'Reverberating', 'Resonating',
      'Cascading', 'Tumbling', 'Spiraling', 'Whirling', 'Spinning', 'Revolving',
      'Orbiting', 'Circling', 'Meandering', 'Serpentine', 'Zigzagging', 'Ricocheting',
      'Caroming', 'Glancing', 'Skimming', 'Grazing', 'Brushing', 'Sweeping',
      'Gliding', 'Soaring', 'Swooping', 'Plummeting', 'Diving', 'Ascending',
      'Descending', 'Levitating', 'Hovering', 'Floating', 'Drifting'
    ];
  }

  private async fetchSoundWords(): Promise<string[]> {
    return [
      'Cacophony', 'Symphony', 'Harmony', 'Melody', 'Rhythm', 'Cadence', 'Resonance',
      'Reverberation', 'Echo', 'Whisper', 'Murmur', 'Rustle', 'Sizzle', 'Crackle',
      'Rumble', 'Thunder', 'Roar', 'Bellow', 'Shriek', 'Wail', 'Keen', 'Ululate',
      'Trill', 'Warble', 'Chirp', 'Tweet', 'Hoot', 'Caw', 'Squawk', 'Screech',
      'Buzz', 'Hum', 'Drone', 'Whir', 'Click'
    ];
  }

  private async fetchTasteWords(): Promise<string[]> {
    return [
      'Umami', 'Savory', 'Piquant', 'Tangy', 'Zesty', 'Tart', 'Acidic', 'Bitter',
      'Astringent', 'Acrid', 'Pungent', 'Spicy', 'Fiery', 'Mild', 'Mellow',
      'Rich', 'Decadent', 'Luscious', 'Succulent', 'Delectable', 'Ambrosial',
      'Nectarous', 'Honeyed', 'Saccharine', 'Cloying', 'Treacly', 'Syrupy',
      'Buttery', 'Creamy', 'Velvety', 'Silky', 'Unctuous', 'Oleaginous'
    ];
  }

  private async fetchCulturalWords(): Promise<string[]> {
    return [
      'Renaissance', 'Baroque', 'Rococo', 'Gothic', 'Byzantine', 'Romanesque',
      'Art-Deco', 'Art-Nouveau', 'Bauhaus', 'Brutalist', 'Minimalist', 'Maximalist',
      'Avant-Garde', 'Surrealist', 'Dadaist', 'Cubist', 'Impressionist', 'Expressionist',
      'Futurist', 'Constructivist', 'Deconstructivist', 'Post-Modern', 'Contemporary',
      'Traditional', 'Classical', 'Neoclassical', 'Romantic', 'Realist', 'Naturalist',
      'Symbolist', 'Modernist', 'Abstract', 'Conceptual', 'Performance'
    ];
  }

  // Method to fetch mood-specific words from web when a mood is selected
  private async fetchMoodSpecificWords(mood: string): Promise<WordSource> {
    try {
      console.log(`Fetching web words for mood: ${mood}`);
      
      // Create mood-specific search terms for web APIs
      const moodKeywords = this.getMoodKeywords(mood);
      
      const [adjectives, nouns, verbs, musicalTerms] = await Promise.all([
        this.fetchMoodAdjectivesFromWeb(moodKeywords),
        this.fetchMoodNounsFromWeb(moodKeywords),
        this.fetchMoodVerbsFromWeb(moodKeywords),
        this.fetchMoodMusicalTermsFromWeb(moodKeywords)
      ]);

      return {
        adjectives: this.removeDuplicates(adjectives),
        nouns: this.removeDuplicates(nouns),
        verbs: this.removeDuplicates(verbs),
        musicalTerms: this.removeDuplicates(musicalTerms)
      };
    } catch (error) {
      console.error(`Failed to fetch mood-specific words for ${mood}:`, error);
      return this.getFilteredWordSources(mood);
    }
  }

  private getMoodKeywords(mood: string): string[] {
    const moodKeywordMap: { [key: string]: string[] } = {
      dark: ['shadow', 'night', 'gothic', 'black', 'death', 'doom', 'horror', 'darkness'],
      bright: ['light', 'sunny', 'cheerful', 'happy', 'golden', 'brilliant', 'radiant', 'luminous'],
      mysterious: ['mysterious', 'enigmatic', 'cryptic', 'hidden', 'secret', 'occult', 'mystical'],
      energetic: ['fast', 'active', 'dynamic', 'powerful', 'intense', 'vigorous', 'electric'],
      melancholy: ['sad', 'melancholy', 'sorrowful', 'blue', 'lonely', 'nostalgic', 'wistful'],
      ethereal: ['ethereal', 'celestial', 'heavenly', 'divine', 'spiritual', 'angelic', 'sublime'],
      aggressive: ['aggressive', 'fierce', 'violent', 'brutal', 'savage', 'intense', 'raw'],
      peaceful: ['peaceful', 'calm', 'serene', 'tranquil', 'gentle', 'quiet', 'zen'],
      nostalgic: ['nostalgic', 'vintage', 'retro', 'classic', 'old', 'memory', 'past'],
      futuristic: ['futuristic', 'sci-fi', 'cyber', 'digital', 'tech', 'space', 'quantum'],
      romantic: ['romantic', 'love', 'passion', 'heart', 'tender', 'sweet', 'intimate'],
      epic: ['epic', 'heroic', 'legendary', 'grand', 'majestic', 'monumental', 'triumph']
    };
    
    return moodKeywordMap[mood] || [];
  }

  private async fetchMoodAdjectivesFromWeb(keywords: string[]): Promise<string[]> {
    const adjectives: string[] = [];
    
    for (const keyword of keywords.slice(0, 3)) { // Limit to 3 keywords to avoid overwhelming APIs
      try {
        // Use keyword-based searches to find mood-appropriate adjectives
        const words = await this.searchWordsByKeyword(keyword, 'adjective');
        adjectives.push(...words);
      } catch (error) {
        console.error(`Error fetching adjectives for keyword ${keyword}:`, error);
      }
    }
    
    return adjectives.slice(0, 20);
  }

  private async fetchMoodNounsFromWeb(keywords: string[]): Promise<string[]> {
    const nouns: string[] = [];
    
    for (const keyword of keywords.slice(0, 3)) {
      try {
        const words = await this.searchWordsByKeyword(keyword, 'noun');
        nouns.push(...words);
      } catch (error) {
        console.error(`Error fetching nouns for keyword ${keyword}:`, error);
      }
    }
    
    return nouns.slice(0, 20);
  }

  private async fetchMoodVerbsFromWeb(keywords: string[]): Promise<string[]> {
    const verbs: string[] = [];
    
    for (const keyword of keywords.slice(0, 2)) {
      try {
        const words = await this.searchWordsByKeyword(keyword, 'verb');
        verbs.push(...words);
      } catch (error) {
        console.error(`Error fetching verbs for keyword ${keyword}:`, error);
      }
    }
    
    return verbs.slice(0, 15);
  }

  private async fetchMoodMusicalTermsFromWeb(keywords: string[]): Promise<string[]> {
    const musicalTerms: string[] = [];
    
    for (const keyword of keywords.slice(0, 2)) {
      try {
        // Search for musical terms related to the mood
        const terms = await this.searchMusicalTermsByMood(keyword);
        musicalTerms.push(...terms);
      } catch (error) {
        console.error(`Error fetching musical terms for keyword ${keyword}:`, error);
      }
    }
    
    return musicalTerms.slice(0, 15);
  }

  private async searchWordsByKeyword(keyword: string, partOfSpeech: string): Promise<string[]> {
    try {
      // Search for words related to the keyword using multiple sources
      const sources = [
        this.searchWordnikByKeyword(keyword, partOfSpeech),
        this.searchWikipediaByKeyword(keyword),
        this.searchPoetryByKeyword(keyword)
      ];
      
      const results = await Promise.allSettled(sources);
      const words: string[] = [];
      
      results.forEach(result => {
        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
          words.push(...result.value);
        }
      });
      
      return words.filter(this.isValidWord).slice(0, 10);
    } catch (error) {
      console.error(`Error searching words for keyword ${keyword}:`, error);
      return [];
    }
  }

  private async searchMusicalTermsByMood(keyword: string): Promise<string[]> {
    try {
      // Search for musical terms that match the mood
      const response = await fetch(`https://en.wikipedia.org/w/api.php?action=opensearch&search=${keyword}+music&limit=10&format=json&origin=*`);
      
      if (!response.ok) throw new Error('Wikipedia search failed');
      
      const data = await response.json();
      const titles = data[1] || [];
      
      const musicalTerms: string[] = [];
      titles.forEach((title: string) => {
        const words = title.split(/[\s\-_()]+/)
          .filter((word: string) => word.length > 2 && word.length < 15)
          .map((word: string) => this.capitalizeFirst(word.toLowerCase()))
          .filter(this.isValidWord);
        musicalTerms.push(...words);
      });
      
      return musicalTerms.slice(0, 8);
    } catch (error) {
      console.error(`Error searching musical terms for mood ${keyword}:`, error);
      return [];
    }
  }

  private async searchWordnikByKeyword(keyword: string, partOfSpeech: string): Promise<string[]> {
    try {
      // Use Wordnik's related words API (if available)
      const response = await fetch(`https://api.wordnik.com/v4/word.json/${keyword}/relatedWords?useCanonical=true&relationshipTypes=synonym,antonym&limitPerRelationshipType=10&api_key=placeholder`);
      
      if (!response.ok) throw new Error('Wordnik related words failed');
      
      const data = await response.json();
      const words: string[] = [];
      
      data.forEach((relation: any) => {
        if (relation.words) {
          words.push(...relation.words.map((word: string) => this.capitalizeFirst(word)));
        }
      });
      
      return words.filter(this.isValidWord);
    } catch (error) {
      console.error(`Error searching Wordnik for keyword ${keyword}:`, error);
      return [];
    }
  }

  private async searchWikipediaByKeyword(keyword: string): Promise<string[]> {
    try {
      const response = await fetch(`https://en.wikipedia.org/w/api.php?action=opensearch&search=${keyword}&limit=5&format=json&origin=*`);
      
      if (!response.ok) throw new Error('Wikipedia search failed');
      
      const data = await response.json();
      const titles = data[1] || [];
      
      const words: string[] = [];
      titles.forEach((title: string) => {
        const titleWords = title.split(/[\s\-_()]+/)
          .filter((word: string) => word.length > 2 && word.length < 15)
          .map((word: string) => this.capitalizeFirst(word.toLowerCase()))
          .filter(this.isValidWord);
        words.push(...titleWords);
      });
      
      return words.slice(0, 8);
    } catch (error) {
      console.error(`Error searching Wikipedia for keyword ${keyword}:`, error);
      return [];
    }
  }

  private async searchPoetryByKeyword(keyword: string): Promise<string[]> {
    try {
      // Search poetry for evocative words related to the keyword
      const response = await fetch(`https://poetrydb.org/lines/${keyword}`);
      
      if (!response.ok) throw new Error('Poetry search failed');
      
      const data = await response.json();
      const words: string[] = [];
      
      if (Array.isArray(data)) {
        data.slice(0, 3).forEach((poem: any) => {
          if (poem.lines) {
            poem.lines.slice(0, 5).forEach((line: string) => {
              const lineWords = line.split(/\s+/)
                .filter((word: string) => word.length > 3 && word.length < 12)
                .map((word: string) => word.replace(/[^a-zA-Z]/g, ''))
                .filter((word: string) => word.length > 2)
                .map((word: string) => this.capitalizeFirst(word.toLowerCase()));
              words.push(...lineWords);
            });
          }
        });
      }
      
      return words.filter(this.isValidWord).slice(0, 10);
    } catch (error) {
      console.error(`Error searching poetry for keyword ${keyword}:`, error);
      return [];
    }
  }
}
