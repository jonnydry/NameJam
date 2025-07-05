import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface FamousBand {
  name: string;
  genre?: string;
  era?: string;
}

export class AiReimaginingsService {
  private famousBands: FamousBand[] = [
    { name: "The Beatles", genre: "rock", era: "1960s" },
    { name: "Led Zeppelin", genre: "rock", era: "1970s" },
    { name: "Pink Floyd", genre: "progressive rock", era: "1970s" },
    { name: "Queen", genre: "rock", era: "1970s" },
    { name: "The Rolling Stones", genre: "rock", era: "1960s" },
    { name: "Nirvana", genre: "grunge", era: "1990s" },
    { name: "Radiohead", genre: "alternative rock", era: "1990s" },
    { name: "The Doors", genre: "rock", era: "1960s" },
    { name: "Black Sabbath", genre: "metal", era: "1970s" },
    { name: "AC/DC", genre: "rock", era: "1970s" },
    { name: "Metallica", genre: "metal", era: "1980s" },
    { name: "Red Hot Chili Peppers", genre: "funk rock", era: "1990s" },
    { name: "Guns N' Roses", genre: "rock", era: "1980s" },
    { name: "U2", genre: "rock", era: "1980s" },
    { name: "The Who", genre: "rock", era: "1960s" },
    { name: "Deep Purple", genre: "rock", era: "1970s" },
    { name: "Iron Maiden", genre: "metal", era: "1980s" },
    { name: "Pearl Jam", genre: "grunge", era: "1990s" },
    { name: "Soundgarden", genre: "grunge", era: "1990s" },
    { name: "Alice in Chains", genre: "grunge", era: "1990s" },
    { name: "Green Day", genre: "punk", era: "1990s" },
    { name: "Foo Fighters", genre: "rock", era: "1990s" },
    { name: "Coldplay", genre: "alternative rock", era: "2000s" },
    { name: "Arctic Monkeys", genre: "indie rock", era: "2000s" },
    { name: "The Strokes", genre: "indie rock", era: "2000s" },
    { name: "White Stripes", genre: "indie rock", era: "2000s" },
    { name: "Rage Against the Machine", genre: "rap metal", era: "1990s" },
    { name: "System of a Down", genre: "metal", era: "2000s" },
    { name: "Tool", genre: "progressive metal", era: "1990s" },
    { name: "Nine Inch Nails", genre: "industrial", era: "1990s" }
  ];

  private famousSongs: string[] = [
    "Bohemian Rhapsody", "Stairway to Heaven", "Hotel California", "Sweet Child O' Mine",
    "Smells Like Teen Spirit", "Yesterday", "Imagine", "Like a Rolling Stone",
    "Purple Haze", "Good Vibrations", "Hey Jude", "Billie Jean",
    "Thriller", "Beat It", "Don't Stop Believin'", "We Will Rock You",
    "Another Brick in the Wall", "Comfortably Numb", "Wish You Were Here",
    "Money", "Time", "Welcome to the Jungle", "November Rain",
    "Sweet Dreams", "Take on Me", "Every Breath You Take", "Girls Just Want to Have Fun"
  ];

  async generateAiReimaginings(type: 'band' | 'song', count: number = 3, mood?: string): Promise<string[]> {
    try {
      const sourceNames = type === 'band' 
        ? this.getRandomBands(Math.min(count * 2, 10))
        : this.getRandomSongs(Math.min(count * 2, 10));

      const moodInstruction = mood ? ` with a ${mood} mood/feeling` : '';
      
      const prompt = type === 'band' 
        ? `Create ${count} creative reimaginings of these famous band names${moodInstruction}. Transform the concepts, themes, or wordplay while keeping the essence recognizable but completely original. Use any word count (1-6 words). Be creative with synonyms, metaphors, and related concepts:

${sourceNames.join(', ')}

Return only the new band names, one per line, without explanations or original names.`
        : `Create ${count} creative reimaginings of these famous song titles${moodInstruction}. Transform the concepts, themes, or wordplay while keeping the essence recognizable but completely original. Use any word count (1-6 words). Be creative with synonyms, metaphors, and related concepts:

${sourceNames.join(', ')}

Return only the new song titles, one per line, without explanations or original titles.`;

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
      return this.generateFallbackReimaginings(type, count, mood);
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

  private generateFallbackReimaginings(type: 'band' | 'song', count: number, mood?: string): string[] {
    // Simple fallback reimaginings if AI fails
    const fallbacks = type === 'band' ? [
      "Scarab Symphony", "Crimson Waters", "Steel Airship", "Neon Prophets",
      "Velvet Thunder", "Crystal Rebellion", "Midnight Architects", "Electric Poets",
      "Shadow Mechanics", "Golden Sirens", "Fractal Dreams", "Obsidian Echoes"
    ] : [
      "Ethereal Reverie", "Cosmic Wanderer", "Silent Thunder", "Broken Mirrors",
      "Digital Sunset", "Fading Starlight", "Whispered Secrets", "Neon Nights",
      "Lost in Translation", "Beautiful Chaos", "Infinite Loop", "Paper Hearts"
    ];

    return fallbacks.slice(0, count);
  }
}