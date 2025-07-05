import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface FamousBand {
  name: string;
  genre?: string;
  era?: string;
}

export class AiReimaginingsService {
  private famousBands: FamousBand[] = [
    // Classic Rock & 60s-70s Legends
    { name: "The Beatles", genre: "rock", era: "1960s" },
    { name: "Led Zeppelin", genre: "rock", era: "1970s" },
    { name: "Pink Floyd", genre: "progressive rock", era: "1970s" },
    { name: "Queen", genre: "rock", era: "1970s" },
    { name: "The Rolling Stones", genre: "rock", era: "1960s" },
    { name: "The Who", genre: "rock", era: "1960s" },
    { name: "The Doors", genre: "rock", era: "1960s" },
    { name: "Jimi Hendrix Experience", genre: "rock", era: "1960s" },
    { name: "Cream", genre: "rock", era: "1960s" },
    { name: "The Kinks", genre: "rock", era: "1960s" },
    { name: "The Animals", genre: "rock", era: "1960s" },
    { name: "The Yardbirds", genre: "rock", era: "1960s" },
    { name: "Fleetwood Mac", genre: "rock", era: "1970s" },
    { name: "Eagles", genre: "rock", era: "1970s" },
    { name: "Lynyrd Skynyrd", genre: "rock", era: "1970s" },
    { name: "Steely Dan", genre: "rock", era: "1970s" },
    { name: "Yes", genre: "progressive rock", era: "1970s" },
    { name: "Genesis", genre: "progressive rock", era: "1970s" },
    { name: "King Crimson", genre: "progressive rock", era: "1970s" },
    { name: "Emerson Lake & Palmer", genre: "progressive rock", era: "1970s" },

    // Hard Rock & Heavy Metal
    { name: "Black Sabbath", genre: "metal", era: "1970s" },
    { name: "Deep Purple", genre: "rock", era: "1970s" },
    { name: "AC/DC", genre: "rock", era: "1970s" },
    { name: "Iron Maiden", genre: "metal", era: "1980s" },
    { name: "Metallica", genre: "metal", era: "1980s" },
    { name: "Judas Priest", genre: "metal", era: "1980s" },
    { name: "Motorhead", genre: "metal", era: "1980s" },
    { name: "Ozzy Osbourne", genre: "metal", era: "1980s" },
    { name: "Dio", genre: "metal", era: "1980s" },
    { name: "Megadeth", genre: "metal", era: "1980s" },
    { name: "Slayer", genre: "metal", era: "1980s" },
    { name: "Anthrax", genre: "metal", era: "1980s" },
    { name: "Pantera", genre: "metal", era: "1990s" },
    { name: "Tool", genre: "progressive metal", era: "1990s" },
    { name: "System of a Down", genre: "metal", era: "2000s" },

    // 80s New Wave & Synth Pop
    { name: "Depeche Mode", genre: "synth pop", era: "1980s" },
    { name: "New Order", genre: "synth pop", era: "1980s" },
    { name: "Duran Duran", genre: "new wave", era: "1980s" },
    { name: "The Cure", genre: "new wave", era: "1980s" },
    { name: "Tears for Fears", genre: "new wave", era: "1980s" },
    { name: "A-ha", genre: "synth pop", era: "1980s" },
    { name: "Talking Heads", genre: "new wave", era: "1980s" },
    { name: "Blondie", genre: "new wave", era: "1980s" },
    { name: "Devo", genre: "new wave", era: "1980s" },
    { name: "The Police", genre: "rock", era: "1980s" },

    // 90s Grunge & Alternative
    { name: "Nirvana", genre: "grunge", era: "1990s" },
    { name: "Pearl Jam", genre: "grunge", era: "1990s" },
    { name: "Soundgarden", genre: "grunge", era: "1990s" },
    { name: "Alice in Chains", genre: "grunge", era: "1990s" },
    { name: "Stone Temple Pilots", genre: "grunge", era: "1990s" },
    { name: "Smashing Pumpkins", genre: "alternative rock", era: "1990s" },
    { name: "Radiohead", genre: "alternative rock", era: "1990s" },
    { name: "R.E.M.", genre: "alternative rock", era: "1990s" },
    { name: "Jane's Addiction", genre: "alternative rock", era: "1990s" },
    { name: "Red Hot Chili Peppers", genre: "funk rock", era: "1990s" },

    // Punk & Hardcore
    { name: "The Ramones", genre: "punk", era: "1970s" },
    { name: "Sex Pistols", genre: "punk", era: "1970s" },
    { name: "The Clash", genre: "punk", era: "1970s" },
    { name: "Dead Kennedys", genre: "punk", era: "1980s" },
    { name: "Black Flag", genre: "punk", era: "1980s" },
    { name: "Minor Threat", genre: "punk", era: "1980s" },
    { name: "Bad Religion", genre: "punk", era: "1990s" },
    { name: "Green Day", genre: "punk", era: "1990s" },
    { name: "The Offspring", genre: "punk", era: "1990s" },
    { name: "Rancid", genre: "punk", era: "1990s" },

    // Hip Hop & Rap Groups
    { name: "Public Enemy", genre: "hip hop", era: "1980s" },
    { name: "Run-DMC", genre: "hip hop", era: "1980s" },
    { name: "N.W.A", genre: "hip hop", era: "1980s" },
    { name: "Wu-Tang Clan", genre: "hip hop", era: "1990s" },
    { name: "A Tribe Called Quest", genre: "hip hop", era: "1990s" },
    { name: "De La Soul", genre: "hip hop", era: "1990s" },
    { name: "Cypress Hill", genre: "hip hop", era: "1990s" },
    { name: "Outkast", genre: "hip hop", era: "1990s" },
    { name: "Beastie Boys", genre: "hip hop", era: "1990s" },
    { name: "Rage Against the Machine", genre: "rap metal", era: "1990s" },

    // 2000s Rock & Indie
    { name: "Foo Fighters", genre: "rock", era: "2000s" },
    { name: "Coldplay", genre: "alternative rock", era: "2000s" },
    { name: "Arctic Monkeys", genre: "indie rock", era: "2000s" },
    { name: "The Strokes", genre: "indie rock", era: "2000s" },
    { name: "White Stripes", genre: "indie rock", era: "2000s" },
    { name: "Kings of Leon", genre: "indie rock", era: "2000s" },
    { name: "Franz Ferdinand", genre: "indie rock", era: "2000s" },
    { name: "The Killers", genre: "indie rock", era: "2000s" },
    { name: "Vampire Weekend", genre: "indie rock", era: "2000s" },
    { name: "Arcade Fire", genre: "indie rock", era: "2000s" },

    // Electronic & Dance
    { name: "Kraftwerk", genre: "electronic", era: "1970s" },
    { name: "Daft Punk", genre: "electronic", era: "2000s" },
    { name: "The Chemical Brothers", genre: "electronic", era: "1990s" },
    { name: "Fatboy Slim", genre: "electronic", era: "1990s" },
    { name: "The Prodigy", genre: "electronic", era: "1990s" },
    { name: "Massive Attack", genre: "electronic", era: "1990s" },
    { name: "Portishead", genre: "electronic", era: "1990s" },
    { name: "Moby", genre: "electronic", era: "1990s" },
    { name: "Underworld", genre: "electronic", era: "1990s" },
    { name: "Aphex Twin", genre: "electronic", era: "1990s" },

    // Ska & Reggae
    { name: "Bob Marley and the Wailers", genre: "reggae", era: "1970s" },
    { name: "The Specials", genre: "ska", era: "1980s" },
    { name: "Madness", genre: "ska", era: "1980s" },
    { name: "The Selecter", genre: "ska", era: "1980s" },
    { name: "Sublime", genre: "ska punk", era: "1990s" },
    { name: "No Doubt", genre: "ska punk", era: "1990s" },
    { name: "The Mighty Mighty Bosstones", genre: "ska punk", era: "1990s" },

    // Alternative & Post-Rock
    { name: "Sonic Youth", genre: "alternative rock", era: "1990s" },
    { name: "Pixies", genre: "alternative rock", era: "1990s" },
    { name: "Dinosaur Jr.", genre: "alternative rock", era: "1990s" },
    { name: "My Bloody Valentine", genre: "shoegaze", era: "1990s" },
    { name: "Slowdive", genre: "shoegaze", era: "1990s" },
    { name: "Ride", genre: "shoegaze", era: "1990s" },
    { name: "Godspeed You! Black Emperor", genre: "post-rock", era: "2000s" },
    { name: "Explosions in the Sky", genre: "post-rock", era: "2000s" },
    { name: "Sigur Ros", genre: "post-rock", era: "2000s" },

    // Industrial & Goth
    { name: "Nine Inch Nails", genre: "industrial", era: "1990s" },
    { name: "Ministry", genre: "industrial", era: "1990s" },
    { name: "Skinny Puppy", genre: "industrial", era: "1990s" },
    { name: "Front 242", genre: "industrial", era: "1990s" },
    { name: "Bauhaus", genre: "goth", era: "1980s" },
    { name: "Siouxsie and the Banshees", genre: "goth", era: "1980s" },
    { name: "The Sisters of Mercy", genre: "goth", era: "1980s" },
    { name: "Christian Death", genre: "goth", era: "1980s" },

    // Modern Rock & Metal
    { name: "Linkin Park", genre: "nu metal", era: "2000s" },
    { name: "Korn", genre: "nu metal", era: "1990s" },
    { name: "Limp Bizkit", genre: "nu metal", era: "1990s" },
    { name: "Disturbed", genre: "metal", era: "2000s" },
    { name: "Slipknot", genre: "metal", era: "2000s" },
    { name: "Avenged Sevenfold", genre: "metal", era: "2000s" },
    { name: "Paramore", genre: "pop punk", era: "2000s" },
    { name: "Fall Out Boy", genre: "pop punk", era: "2000s" },
    { name: "My Chemical Romance", genre: "emo", era: "2000s" },
    { name: "Panic! At The Disco", genre: "emo", era: "2000s" }
  ];

  private famousSongs: string[] = [
    // Classic Rock Anthems
    "Stairway to Heaven", "Bohemian Rhapsody", "Hotel California", "Free Bird",
    "Don't Stop Believin'", "We Will Rock You", "We Are the Champions", "Another One Bites the Dust",
    "Sweet Child O' Mine", "Welcome to the Jungle", "November Rain", "Paradise City",
    "Purple Haze", "All Along the Watchtower", "Hey Joe", "Voodoo Child",
    "Layla", "Crossroads", "Sunshine of Your Love", "White Room",
    "Whole Lotta Love", "Black Dog", "Kashmir", "Rock and Roll",
    "Another Brick in the Wall", "Comfortably Numb", "Wish You Were Here", "Money",
    "Time", "Us and Them", "Shine On You Crazy Diamond", "The Wall",
    
    // 60s & 70s Classics
    "Hey Jude", "Yesterday", "Let It Be", "Come Together", "Here Comes the Sun",
    "Like a Rolling Stone", "Blowin' in the Wind", "The Times They Are a-Changin'",
    "Good Vibrations", "California Dreamin'", "Sound of Silence", "Mrs. Robinson",
    "My Generation", "Won't Get Fooled Again", "Behind Blue Eyes", "Baba O'Riley",
    "Light My Fire", "Riders on the Storm", "Break On Through", "The End",
    
    // 80s New Wave & Pop
    "Sweet Dreams", "Here Comes the Rain Again", "Love Is a Battlefield",
    "Take on Me", "The Sun Always Shines on T.V.", "Hunting High and Low",
    "Every Breath You Take", "Roxanne", "Message in a Bottle", "Don't Stand So Close to Me",
    "Girls Just Want to Have Fun", "Time After Time", "True Colors", "I Drove All Night",
    "Tainted Love", "Blue Monday", "Bizarre Love Triangle", "Temptation",
    "Sweet Child O' Mine", "Welcome to the Jungle", "November Rain", "Paradise City",
    
    // 90s Grunge & Alternative
    "Smells Like Teen Spirit", "Come As You Are", "Lithium", "In Bloom",
    "Black", "Alive", "Jeremy", "Even Flow", "Better Man",
    "Black Hole Sun", "Spoonman", "Fell on Black Days", "Rusty Cage",
    "Man in the Box", "Would?", "Them Bones", "Rooster",
    "Plush", "Interstate Love Song", "Creep", "Fake Plastic Trees",
    
    // Hip Hop Classics
    "Fight the Power", "Bring the Noise", "911 Is a Joke", "Public Enemy No. 1",
    "Walk This Way", "It's Tricky", "My Adidas", "Rock Box",
    "Straight Outta Compton", "Express Yourself", "F*** tha Police",
    "C.R.E.A.M.", "Protect Ya Neck", "Can I Kick It?", "Scenario",
    "Me Myself and I", "Ring Ring Ring", "California Love", "Dear Mama",
    
    // Dance & Electronic
    "Blue Monday", "True Faith", "Bizarre Love Triangle", "Confusion",
    "One More Time", "Around the World", "Harder Better Faster Stronger",
    "Block Rockin' Beats", "Setting Sun", "Hey Boy Hey Girl",
    "Praise You", "The Rockafeller Skank", "Right Here Right Now",
    "Firestarter", "Breathe", "Smack My Bitch Up", "Out of Space",
    
    // Punk Classics
    "Blitzkrieg Bop", "I Wanna Be Sedated", "Pet Sematary", "Sheena Is a Punk Rocker",
    "Anarchy in the U.K.", "God Save the Queen", "Pretty Vacant", "Holidays in the Sun",
    "London Calling", "Should I Stay or Should I Go", "Rock the Casbah", "Train in Vain",
    "Holiday", "American Idiot", "Basket Case", "Longview", "When I Come Around",
    
    // Metal Anthems
    "Paranoid", "Iron Man", "War Pigs", "Sweet Leaf", "Children of the Grave",
    "Master of Puppets", "Enter Sandman", "One", "Nothing Else Matters", "The Unforgiven",
    "Breaking the Law", "Living After Midnight", "You've Got Another Thing Comin'",
    "Ace of Spades", "Overkill", "Bomber", "The Trooper", "Run to the Hills",
    
    // Ballads & Power Songs
    "Every Rose Has Its Thorn", "More Than Words", "Alone", "What's Love Got to Do with It",
    "Total Eclipse of the Heart", "I Want to Know What Love Is", "Waiting for a Girl Like You",
    "Don't Stop Believin'", "Any Way You Want It", "Separate Ways", "Faithfully",
    "More Than a Feeling", "Peace of Mind", "Foreplay/Long Time", "Amanda",
    
    // Alternative & Indie
    "Losing My Religion", "Everybody Hurts", "It's the End of the World", "Shiny Happy People",
    "Under the Bridge", "Give It Away", "Californication", "Scar Tissue",
    "1979", "Tonight Tonight", "Bullet with Butterfly Wings", "Zero",
    "Wonderwall", "Don't Look Back in Anger", "Champagne Supernova", "Live Forever",
    
    // Modern Classics
    "Seven Nation Army", "Fell in Love with a Girl", "Icky Thump", "Blue Orchid",
    "Last Nite", "Hard to Explain", "Reptilia", "12:51",
    "Yellow", "The Scientist", "Clocks", "Fix You", "Viva la Vida",
    "Mr. Brightside", "Somebody Told Me", "When You Were Young", "Human"
  ];

  async generateAiReimaginings(type: 'band' | 'song', count: number = 3, wordCount: number = 2, mood?: string): Promise<string[]> {
    try {
      const sourceNames = type === 'band' 
        ? this.getRandomBands(Math.min(count * 2, 10))
        : this.getRandomSongs(Math.min(count * 2, 10));

      const moodInstruction = mood ? ` with a ${mood} mood/feeling` : '';
      const wordCountGuidance = this.getWordCountGuidance(wordCount);
      
      const prompt = type === 'band' 
        ? `Create ${count} creative reimaginings of these famous band names${moodInstruction}. Transform the concepts, themes, or wordplay while keeping the essence recognizable but completely original.

REQUIREMENTS:
- Use EXACTLY ${wordCount} word${wordCount > 1 ? 's' : ''} per name
- ${wordCountGuidance}
- Be creative with synonyms, metaphors, and related concepts
- Avoid copyright issues - make them completely original

SOURCE NAMES: ${sourceNames.join(', ')}

Return only the new ${wordCount}-word band names, one per line, without explanations or original names.`
        : `Create ${count} creative reimaginings of these famous song titles${moodInstruction}. Transform the concepts, themes, or wordplay while keeping the essence recognizable but completely original.

REQUIREMENTS:
- Use EXACTLY ${wordCount} word${wordCount > 1 ? 's' : ''} per title
- ${wordCountGuidance}
- Be creative with synonyms, metaphors, and related concepts
- Avoid copyright issues - make them completely original

SOURCE TITLES: ${sourceNames.join(', ')}

Return only the new ${wordCount}-word song titles, one per line, without explanations or original titles.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: `You are a creative music industry professional specializing in generating unique, memorable ${type} names. Focus on wordplay, metaphors, and creative reinterpretations while avoiding copyright issues.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.9,
        max_tokens: 300
      });

      const content = response.choices[0].message.content?.trim();
      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      return content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.includes(':'))
        .map(line => line.replace(/^\d+\.\s*/, '')) // Remove numbering
        .map(line => line.replace(/^[-•]\s*/, '')) // Remove bullet points
        .slice(0, count);

    } catch (error) {
      console.error('OpenAI API error:', error);
      // Fallback to manual reimaginings if AI fails
      return this.generateFallbackReimaginings(type, count, wordCount, mood);
    }
  }

  private getRandomBands(count: number): string[] {
    const shuffled = [...this.famousBands].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count).map(band => band.name);
  }

  private getRandomSongs(count: number): string[] {
    const shuffled = [...this.famousSongs].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  private getWordCountGuidance(wordCount: number): string {
    switch (wordCount) {
      case 1:
        return "Use single powerful words that evoke strong imagery or concepts";
      case 2:
        return "Use adjective-noun or noun-noun combinations for maximum impact";
      case 3:
        return "Create humorous or unexpected combinations with wordplay and contradictions";
      case 4:
        return "Build atmospheric or poetic patterns with varied grammatical structures";
      case 5:
        return "Develop narrative flows or repetitive patterns for memorable phrases";
      case 6:
        return "Create epic, descriptive phrases with rich storytelling elements";
      default:
        return "Focus on creative word combinations that flow naturally";
    }
  }

  private generateFallbackReimaginings(type: 'band' | 'song', count: number, wordCount: number = 2, mood?: string): string[] {
    // Generate dynamic fallback reimaginings by combining famous name elements randomly
    const result: string[] = [];
    const maxAttempts = count * 5; // Prevent infinite loops
    let attempts = 0;

    while (result.length < count && attempts < maxAttempts) {
      attempts++;
      
      // Get random source names to reimagine
      const sourceNames = type === 'band' 
        ? this.getRandomBands(3) 
        : this.getRandomSongs(3);
      
      // Create a dynamic reimagining based on the word count
      const reimagined = this.createDynamicReimaging(sourceNames, wordCount, type, mood);
      
      // Add if unique
      if (reimagined && !result.includes(reimagined)) {
        result.push(reimagined);
      }
    }

    // Fallback to static list if dynamic generation fails
    if (result.length < count) {
      const staticFallbacks = type === 'band' ? {
        1: ["Scarab", "Crimson", "Steel", "Neon", "Velvet", "Crystal", "Midnight", "Electric", "Shadow", "Golden", "Fractal", "Obsidian", "Quantum", "Prism", "Ember", "Flux", "Phoenix", "Vortex", "Nexus", "Eclipse"],
        2: ["Scarab Symphony", "Crimson Waters", "Steel Airship", "Neon Prophets", "Velvet Thunder", "Crystal Rebellion", "Midnight Architects", "Electric Poets", "Shadow Mechanics", "Golden Sirens", "Fractal Dreams", "Obsidian Echoes", "Quantum Storm", "Prism Light", "Ember Forge", "Flux Theory"],
        3: ["Scarab Symphony Orchestra", "Crimson Water Dreams", "Steel Airship Voyage", "Neon Prophet Society", "Velvet Thunder Storm", "Crystal Rebellion Army", "Midnight Archive Project", "Electric Poetry Guild", "Shadow Mechanic Union", "Golden Siren Circle"],
        4: ["Ancient Scarab Symphony Orchestra", "Crimson Waters of Time", "Steel Airship Midnight Voyage", "Neon Prophet Society Guild", "Velvet Thunder Storm Brigade", "Crystal Rebellion Army Corps", "Midnight Archive Project Team", "Electric Poetry Guild House"],
        5: ["Ancient Scarab Symphony Orchestra Guild", "Crimson Waters of Time Eternal", "Steel Airship Midnight Voyage Society", "Neon Prophet Society Guild Masters", "Velvet Thunder Storm Brigade Unit"],
        6: ["Ancient Scarab Symphony Orchestra Guild Masters", "Crimson Waters of Time Eternal Dreams", "Steel Airship Midnight Voyage Society Corps", "Neon Prophet Society Guild House Rules"]
      } : {
        1: ["Ethereal", "Cosmic", "Silent", "Broken", "Digital", "Fading", "Whispered", "Neon", "Lost", "Beautiful", "Infinite", "Paper", "Quantum", "Prism", "Ember", "Flux", "Phoenix", "Vortex", "Nexus", "Eclipse"],
        2: ["Ethereal Reverie", "Cosmic Wanderer", "Silent Thunder", "Broken Mirrors", "Digital Sunset", "Fading Starlight", "Whispered Secrets", "Neon Nights", "Lost Translation", "Beautiful Chaos", "Infinite Loop", "Paper Hearts", "Quantum Dreams", "Prism Light"],
        3: ["Ethereal Dream Reverie", "Cosmic Wanderer Soul", "Silent Thunder Storm", "Broken Mirror Dreams", "Digital Sunset Sky", "Fading Starlight Memory", "Whispered Secret Garden", "Neon Night Vision", "Lost Translation Error", "Beautiful Chaos Theory"],
        4: ["Ethereal Dream Reverie Song", "Cosmic Wanderer Soul Journey", "Silent Thunder Storm Calling", "Broken Mirror Dreams Tonight", "Digital Sunset Sky Falling", "Fading Starlight Memory Lane", "Whispered Secret Garden Party", "Neon Night Vision Quest"],
        5: ["Ethereal Dream Reverie Song Tonight", "Cosmic Wanderer Soul Journey Home", "Silent Thunder Storm Calling You", "Broken Mirror Dreams Tonight Forever", "Digital Sunset Sky Falling Down"],
        6: ["Ethereal Dream Reverie Song Tonight Forever", "Cosmic Wanderer Soul Journey Home Again", "Silent Thunder Storm Calling You Back", "Broken Mirror Dreams Tonight Forever Lost"]
      };

      const staticOptions = staticFallbacks[wordCount as keyof typeof staticFallbacks] || staticFallbacks[2];
      const shuffled = [...staticOptions].sort(() => 0.5 - Math.random());
      
      // Fill remaining slots with shuffled static options
      for (const option of shuffled) {
        if (result.length >= count) break;
        if (!result.includes(option)) {
          result.push(option);
        }
      }
    }

    return result.slice(0, count);
  }

  private createDynamicReimaging(sourceNames: string[], wordCount: number, type: 'band' | 'song', mood?: string): string {
    // Extract meaningful words from source names
    const words = sourceNames.join(' ').split(' ')
      .filter(word => word.length > 2 && !['the', 'and', 'of', 'in', 'on', 'at', 'to', 'for', 'with'].includes(word.toLowerCase()));
    
    // Additional creative words to mix in
    const creativeWords = [
      'Ancient', 'Modern', 'Silent', 'Electric', 'Golden', 'Silver', 'Cosmic', 'Digital',
      'Midnight', 'Crystal', 'Shadow', 'Neon', 'Velvet', 'Steel', 'Quantum', 'Prism',
      'Symphony', 'Echo', 'Vision', 'Dream', 'Storm', 'Light', 'Fire', 'Water',
      'Society', 'Guild', 'Circle', 'Union', 'Project', 'Theory', 'Archive', 'Forge'
    ];

    const allWords = [...words, ...creativeWords];
    const selectedWords: string[] = [];

    // Build name according to word count
    for (let i = 0; i < wordCount; i++) {
      const availableWords = allWords.filter(word => !selectedWords.includes(word));
      if (availableWords.length === 0) break;
      
      const randomWord = availableWords[Math.floor(Math.random() * availableWords.length)];
      selectedWords.push(randomWord);
    }

    return selectedWords.join(' ');
  }
}