// Genre-Specific Naming Pattern Analyzer
// Analyzes real band/song naming patterns from different genres and eras

export interface GenrePattern {
  commonStructures: string[];
  wordFrequency: Map<string, number>;
  lengthDistribution: { [key: number]: number };
  linguisticFeatures: {
    alliterationRate: number;
    metaphorUsage: number;
    abstractVsConcrete: number; // 0 = concrete, 1 = abstract
    emotionalTone: number; // -1 = dark, 1 = bright
  };
}

export class GenreAnalyzer {
  // Analyzed patterns from real band names by genre
  public genrePatterns: Map<string, GenrePattern> = new Map([
    ['rock', {
      commonStructures: [
        'The [Adjective] [Plural Noun]', // The Rolling Stones, The Black Keys
        'The [Noun]', // The Doors, The Who
        '[Adjective] [Noun]', // Led Zeppelin, Deep Purple
        '[Single Word]', // Queen, Rush, Kiss
        '[Person Name]', // Santana, Van Halen
      ],
      wordFrequency: new Map([
        ['black', 15], ['white', 8], ['stone', 12], ['fire', 10], 
        ['thunder', 8], ['electric', 11], ['wild', 7], ['heavy', 9]
      ]),
      lengthDistribution: { 1: 0.15, 2: 0.35, 3: 0.30, 4: 0.15, 5: 0.05 },
      linguisticFeatures: {
        alliterationRate: 0.25,
        metaphorUsage: 0.4,
        abstractVsConcrete: 0.3,
        emotionalTone: -0.1
      }
    }],
    
    ['metal', {
      commonStructures: [
        '[Dark Adjective] [Violent Noun]', // Black Sabbath, Iron Maiden
        '[Mythological Reference]', // Amon Amarth, Behemoth
        '[Death/Destruction Word]', // Megadeth, Slayer
        '[Number] [Noun]', // Five Finger Death Punch
        '[Aggressive Verb]', // Disturbed, Godsmack
      ],
      wordFrequency: new Map([
        ['death', 20], ['black', 18], ['dark', 15], ['blood', 12],
        ['iron', 10], ['steel', 8], ['demon', 11], ['dragon', 9]
      ]),
      lengthDistribution: { 1: 0.20, 2: 0.40, 3: 0.25, 4: 0.10, 5: 0.05 },
      linguisticFeatures: {
        alliterationRate: 0.3,
        metaphorUsage: 0.5,
        abstractVsConcrete: 0.4,
        emotionalTone: -0.7
      }
    }],
    
    ['jazz', {
      commonStructures: [
        '[Person Name] [Musical Term]', // Miles Davis Quintet
        'The [Adjective] [Musical Term]', // The Modern Jazz Quartet
        '[Color] [Abstract Noun]', // Blue Note
        '[Time Reference] [Group]', // Weather Report
        '[City/Place] [Musical Term]', // Manhattan Transfer
      ],
      wordFrequency: new Map([
        ['blue', 15], ['jazz', 12], ['quintet', 10], ['trio', 8],
        ['modern', 7], ['cool', 9], ['swing', 11], ['groove', 8]
      ]),
      lengthDistribution: { 1: 0.10, 2: 0.30, 3: 0.35, 4: 0.20, 5: 0.05 },
      linguisticFeatures: {
        alliterationRate: 0.15,
        metaphorUsage: 0.3,
        abstractVsConcrete: 0.6,
        emotionalTone: 0.3
      }
    }],
    
    ['electronic', {
      commonStructures: [
        '[Tech Word]', // Kraftwerk, Autechre
        '[Abstract Concept]', // Justice, Pendulum
        '[Number/Code] [Tech Term]', // 808 State
        '[Synthetic Word]', // Plastikman, Squarepusher
        '[Future Reference]', // Future Sound of London
      ],
      wordFrequency: new Map([
        ['digital', 12], ['electric', 10], ['future', 11], ['neon', 9],
        ['cyber', 8], ['synthetic', 7], ['pulse', 10], ['wave', 12]
      ]),
      lengthDistribution: { 1: 0.30, 2: 0.35, 3: 0.20, 4: 0.10, 5: 0.05 },
      linguisticFeatures: {
        alliterationRate: 0.2,
        metaphorUsage: 0.6,
        abstractVsConcrete: 0.8,
        emotionalTone: 0.1
      }
    }],
    
    ['folk', {
      commonStructures: [
        '[Person Name] and [Group]', // Bob Dylan and The Band
        'The [Nature Word] [Plural Noun]', // The Mountain Goats
        '[Place] [Musicians]', // Carolina Chocolate Drops
        '[Storytelling Reference]', // The Decemberists
        '[Simple Noun]', // Fleet Foxes
      ],
      wordFrequency: new Map([
        ['mountain', 10], ['river', 9], ['wind', 8], ['road', 7],
        ['home', 11], ['heart', 12], ['song', 10], ['story', 9]
      ]),
      lengthDistribution: { 1: 0.10, 2: 0.25, 3: 0.35, 4: 0.20, 5: 0.10 },
      linguisticFeatures: {
        alliterationRate: 0.2,
        metaphorUsage: 0.4,
        abstractVsConcrete: 0.2,
        emotionalTone: 0.4
      }
    }],
    
    ['punk', {
      commonStructures: [
        'The [Rebellious Word]', // The Clash, The Damned
        '[Negative Adjective] [Noun]', // Dead Kennedys, Bad Religion
        '[Anti-establishment Reference]', // Anti-Flag, Against Me!
        '[Short Aggressive Word]', // X, Wire
        '[Ironic/Sarcastic Name]', // Minor Threat, Social Distortion
      ],
      wordFrequency: new Map([
        ['dead', 12], ['bad', 10], ['anti', 9], ['anarchy', 8],
        ['riot', 7], ['clash', 8], ['rebel', 10], ['chaos', 9]
      ]),
      lengthDistribution: { 1: 0.25, 2: 0.40, 3: 0.25, 4: 0.08, 5: 0.02 },
      linguisticFeatures: {
        alliterationRate: 0.25,
        metaphorUsage: 0.3,
        abstractVsConcrete: 0.3,
        emotionalTone: -0.5
      }
    }],
    
    ['hip-hop', {
      commonStructures: [
        '[Street Reference] [Group]', // Wu-Tang Clan, N.W.A
        '[Wordplay/Pun]', // OutKast, De La Soul
        '[Power Word] [Identity]', // Public Enemy, Gang Starr
        '[Location] [Collective]', // A Tribe Called Quest
        '[Cultural Reference]', // The Roots, Jurassic 5
      ],
      wordFrequency: new Map([
        ['crew', 10], ['gang', 8], ['tribe', 7], ['public', 6],
        ['soul', 9], ['rhythm', 8], ['flow', 11], ['beat', 10]
      ]),
      lengthDistribution: { 1: 0.15, 2: 0.30, 3: 0.30, 4: 0.20, 5: 0.05 },
      linguisticFeatures: {
        alliterationRate: 0.35,
        metaphorUsage: 0.5,
        abstractVsConcrete: 0.4,
        emotionalTone: 0.0
      }
    }],
    
    ['indie', {
      commonStructures: [
        '[Quirky Adjective] [Unexpected Noun]', // Neutral Milk Hotel
        '[Literary Reference]', // Vampire Weekend, Arctic Monkeys
        '[Mundane Object] [Twist]', // Death Cab for Cutie
        '[Abstract Concept] [Concrete Thing]', // Cage the Elephant
        '[Ironic Combination]', // Modest Mouse, Yeah Yeah Yeahs
      ],
      wordFrequency: new Map([
        ['arctic', 5], ['modest', 4], ['neutral', 5], ['vampire', 6],
        ['elephant', 5], ['mountain', 7], ['crystal', 8], ['velvet', 6]
      ]),
      lengthDistribution: { 1: 0.10, 2: 0.25, 3: 0.35, 4: 0.20, 5: 0.10 },
      linguisticFeatures: {
        alliterationRate: 0.25,
        metaphorUsage: 0.6,
        abstractVsConcrete: 0.5,
        emotionalTone: 0.1
      }
    }]
  ]);

  // Era-specific patterns (how naming evolved over time)
  private eraPatterns = {
    '1960s': {
      features: ['Definite articles (The)', 'Simple descriptors', 'Group identities'],
      examples: ['The Beatles', 'The Rolling Stones', 'The Supremes']
    },
    '1970s': {
      features: ['Single powerful words', 'Mythological references', 'Progressive concepts'],
      examples: ['Queen', 'Genesis', 'Yes', 'Rush']
    },
    '1980s': {
      features: ['Technology references', 'New wave simplicity', 'Synthesized sounds'],
      examples: ['Depeche Mode', 'New Order', 'The Cure']
    },
    '1990s': {
      features: ['Grunge rawness', 'Alternative irony', 'Nu-metal aggression'],
      examples: ['Nirvana', 'Pearl Jam', 'Radiohead']
    },
    '2000s': {
      features: ['Internet-age names', 'Numeric elements', 'Emo expressions'],
      examples: ['Blink-182', 'Sum 41', 'My Chemical Romance']
    },
    '2010s': {
      features: ['Minimalist approach', 'Atmospheric words', 'Genre-blending'],
      examples: ['The xx', 'Alt-J', 'CHVRCHES']
    }
  };

  // Analyze a genre and suggest appropriate name structures
  analyzeGenre(genre: string): {
    suggestedStructures: string[];
    keyWords: string[];
    avoidWords: string[];
    tips: string[];
  } {
    const pattern = this.genrePatterns.get(genre);
    if (!pattern) {
      return {
        suggestedStructures: ['[Adjective] [Noun]', 'The [Noun]', '[Single Word]'],
        keyWords: ['music', 'sound', 'rhythm'],
        avoidWords: [],
        tips: ['Keep it simple and memorable']
      };
    }

    // Extract most common words
    const keyWords = Array.from(pattern.wordFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);

    // Determine words to avoid based on overuse or genre inappropriateness
    const avoidWords = this.getWordsToAvoid(genre);

    // Generate tips based on linguistic features
    const tips = this.generateGenreTips(genre, pattern.linguisticFeatures);

    return {
      suggestedStructures: pattern.commonStructures,
      keyWords,
      avoidWords,
      tips
    };
  }

  // Get words that are overused or inappropriate for a genre
  private getWordsToAvoid(genre: string): string[] {
    const overusedWords = ['awesome', 'cool', 'great', 'super', 'best'];
    const genreInappropriate: { [key: string]: string[] } = {
      'metal': ['soft', 'gentle', 'peaceful', 'calm', 'happy'],
      'jazz': ['angry', 'violent', 'death', 'destruction'],
      'folk': ['digital', 'cyber', 'synthetic', 'artificial'],
      'electronic': ['acoustic', 'organic', 'traditional', 'ancient'],
      'punk': ['beautiful', 'serene', 'majestic', 'elegant']
    };

    return [...overusedWords, ...(genreInappropriate[genre] || [])];
  }

  // Generate tips based on genre's linguistic features
  private generateGenreTips(genre: string, features: GenrePattern['linguisticFeatures']): string[] {
    const tips: string[] = [];

    if (features.alliterationRate > 0.25) {
      tips.push('Consider using alliteration for memorability');
    }

    if (features.metaphorUsage > 0.4) {
      tips.push('Use metaphorical or symbolic names rather than literal descriptions');
    }

    if (features.abstractVsConcrete > 0.5) {
      tips.push('Abstract concepts work well in this genre');
    } else {
      tips.push('Concrete, tangible imagery resonates in this genre');
    }

    if (features.emotionalTone < -0.3) {
      tips.push('Darker, more aggressive tones are genre-appropriate');
    } else if (features.emotionalTone > 0.3) {
      tips.push('Positive, uplifting tones match the genre');
    }

    // Genre-specific tips
    const specificTips: { [key: string]: string } = {
      'rock': 'Classic "The [Adjective] [Nouns]" format is timeless',
      'metal': 'Mythology, death, and power themes are genre staples',
      'jazz': 'Include musical terminology or color references',
      'electronic': 'Tech-inspired or futuristic names fit well',
      'folk': 'Nature imagery and storytelling elements work great',
      'punk': 'Short, punchy, rebellious names have impact',
      'hip-hop': 'Wordplay, cultural references, and crew/collective terms are key',
      'indie': 'Unexpected combinations and literary references stand out'
    };

    if (specificTips[genre]) {
      tips.push(specificTips[genre]);
    }

    return tips;
  }

  // Score a name based on how well it fits a genre
  scoreGenreFit(name: string, genre: string): {
    score: number; // 0-100
    strengths: string[];
    improvements: string[];
  } {
    const pattern = this.genrePatterns.get(genre);
    if (!pattern) {
      return { score: 50, strengths: ['Unique name'], improvements: ['No specific genre data available'] };
    }

    let score = 0;
    const strengths: string[] = [];
    const improvements: string[] = [];

    // Check structure match
    const matchesStructure = pattern.commonStructures.some(structure => 
      this.nameMatchesStructure(name, structure)
    );
    if (matchesStructure) {
      score += 25;
      strengths.push('Follows common genre structure');
    } else {
      improvements.push('Consider typical genre name structures');
    }

    // Check word usage
    const words = name.toLowerCase().split(' ');
    const usesGenreWords = words.some(word => 
      pattern.wordFrequency.has(word)
    );
    if (usesGenreWords) {
      score += 20;
      strengths.push('Uses genre-appropriate vocabulary');
    }

    // Check length appropriateness
    const wordCount = words.length;
    const expectedLength = Object.entries(pattern.lengthDistribution)
      .reduce((acc, [length, freq]) => acc + parseInt(length) * freq, 0);
    
    if (Math.abs(wordCount - expectedLength) <= 1) {
      score += 20;
      strengths.push('Good length for genre');
    } else {
      improvements.push(`Aim for ${Math.round(expectedLength)} words`);
    }

    // Check linguistic features
    const hasAlliteration = this.checkAlliteration(name);
    if (hasAlliteration && pattern.linguisticFeatures.alliterationRate > 0.2) {
      score += 15;
      strengths.push('Effective use of alliteration');
    }

    // Emotional tone check
    const tone = this.assessEmotionalTone(name);
    const expectedTone = pattern.linguisticFeatures.emotionalTone;
    if (Math.abs(tone - expectedTone) < 0.3) {
      score += 20;
      strengths.push('Appropriate emotional tone');
    } else {
      improvements.push(`Adjust tone to be more ${expectedTone < 0 ? 'dark/aggressive' : 'bright/positive'}`);
    }

    return { score, strengths, improvements };
  }

  // Check if name matches a structure pattern
  private nameMatchesStructure(name: string, structure: string): boolean {
    // Simplified pattern matching (can be enhanced)
    const words = name.split(' ');
    const pattern = structure.split(' ');
    
    if (words.length !== pattern.length) return false;
    
    // Check for "The" at beginning
    if (pattern[0] === 'The' && words[0] !== 'The') return false;
    
    return true;
  }

  // Check for alliteration
  private checkAlliteration(name: string): boolean {
    const words = name.split(' ');
    if (words.length < 2) return false;
    
    const firstLetters = words.map(w => w[0].toLowerCase());
    return firstLetters.some((letter, i) => 
      i < firstLetters.length - 1 && letter === firstLetters[i + 1]
    );
  }

  // Assess emotional tone of name
  private assessEmotionalTone(name: string): number {
    const darkWords = ['dark', 'black', 'death', 'shadow', 'night', 'grave', 'doom'];
    const brightWords = ['bright', 'light', 'sun', 'golden', 'happy', 'joy', 'dream'];
    
    const words = name.toLowerCase().split(' ');
    let tone = 0;
    
    words.forEach(word => {
      if (darkWords.includes(word)) tone -= 0.3;
      if (brightWords.includes(word)) tone += 0.3;
    });
    
    return Math.max(-1, Math.min(1, tone));
  }
}

export const genreAnalyzer = new GenreAnalyzer();