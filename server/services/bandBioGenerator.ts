import OpenAI from "openai";

export interface BandBio {
  origin: string;
  genre: string;
  story: string;
  members: string[];
  keyAlbum?: string;
  funFact: string;
}

export class BandBioGeneratorService {
  private openai: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable is required");
    }
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async generateBandBio(bandName: string, mood?: string, genre?: string): Promise<BandBio> {
    try {
      const moodContext = mood ? ` with a ${mood} mood` : '';
      const genreContext = genre ? ` in the ${genre} genre` : '';
      
      const prompt = `Create an imaginative and engaging biography for a band called "${bandName}"${genreContext}${moodContext}. 

Generate a creative backstory that includes:
- Origin story (where they formed, how they met)
- Musical style and influences
- Brief band story or career highlights
- 3-4 band member names with their instruments
- A signature album or song title
- An interesting fun fact about the band

Make it feel authentic and engaging, like something you'd read on a music website. Be creative but keep it grounded in realistic music industry scenarios.

Respond with JSON in this exact format:
{
  "origin": "Brief origin story (2-3 sentences)",
  "genre": "Primary musical genre/style",
  "story": "Main band story/career highlights (3-4 sentences)",
  "members": ["Member Name - Instrument", "Member Name - Instrument", "Member Name - Instrument"],
  "keyAlbum": "Album or Song Title",
  "funFact": "Interesting fact about the band (1-2 sentences)"
}`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a creative music journalist who writes engaging band biographies. Create authentic-sounding but fictional band stories."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 800,
        temperature: 0.8
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("No content received from OpenAI");
      }

      const bio = JSON.parse(content) as BandBio;
      
      // Validate the response structure
      if (!bio.origin || !bio.story || !bio.members || !Array.isArray(bio.members)) {
        throw new Error("Invalid bio structure received from OpenAI");
      }

      return bio;
    } catch (error: any) {
      console.error('Error generating band bio:', error);
      
      // For any error (including quota), return creative fallback bio
      // This ensures the feature always works even when AI is unavailable
      return this.generateFallbackBio(bandName, mood, genre);
    }
  }

  private generateFallbackBio(bandName: string, mood?: string, genre?: string): BandBio {
    const origins = [
      "Formed in a garage in Portland during a particularly rainy winter",
      "Met at a local coffee shop's open mic night",
      "Started as college roommates who bonded over late-night music sessions",
      "Came together after responding to a Craigslist ad for 'serious musicians only'",
      "Formed after a chance encounter at a music festival"
    ];

    const genres = genre ? [genre] : [
      "indie rock", "electronic", "folk rock", "post-punk", "shoegaze", 
      "experimental pop", "alternative rock", "dream pop"
    ];

    const stories = [
      "Their breakthrough came when a demo tape was discovered in a used record store and went viral on social media.",
      "After years of playing dive bars, they were discovered by a talent scout at a house party.",
      "Their unique sound caught attention when they performed an impromptu concert in a subway station.",
      "They gained a following through their creative use of found objects as instruments.",
      "Their music videos, filmed with a budget of under $100, became internet sensations."
    ];

    const memberNames = [
      ["Alex Rivera", "Sam Chen", "Jordan Blake", "Casey Quinn"],
      ["River Stone", "Sage Martinez", "Phoenix Lee", "Storm Williams"],
      ["Echo Ramirez", "Blue Thompson", "Wren Foster", "Indigo Walsh"]
    ];

    const instruments = ["vocals/guitar", "bass", "drums", "keyboards", "lead guitar", "synthesizer"];
    
    const selectedOrigin = origins[Math.floor(Math.random() * origins.length)];
    const selectedGenre = genres[Math.floor(Math.random() * genres.length)];
    const selectedStory = stories[Math.floor(Math.random() * stories.length)];
    const selectedMembers = memberNames[Math.floor(Math.random() * memberNames.length)];
    
    const shuffledInstruments = [...instruments].sort(() => 0.5 - Math.random());
    const members = selectedMembers.slice(0, 3).map((name, index) => 
      `${name} - ${shuffledInstruments[index]}`
    );

    return {
      origin: selectedOrigin,
      genre: selectedGenre,
      story: `${selectedStory} Known for their ${mood || 'distinctive'} sound and energetic live performances, ${bandName} has built a dedicated fanbase through word-of-mouth and social media.`,
      members,
      keyAlbum: `"${this.generateAlbumTitle(bandName)}"`,
      funFact: `The band's name "${bandName}" was inspired by ${this.generateNameOrigin()}.`
    };
  }

  private generateAlbumTitle(bandName: string): string {
    const albumTitles = [
      "Midnight Revelations",
      "Electric Dreams", 
      "Borrowed Time",
      "Neon Shadows",
      "Paper Cities",
      "Wild Frequencies",
      "Silent Thunder",
      "Glass Houses",
      "Digital Hearts",
      "Velvet Storms"
    ];
    
    return albumTitles[Math.floor(Math.random() * albumTitles.length)];
  }

  private generateNameOrigin(): string {
    const origins = [
      "a misheard lyric from their favorite song",
      "graffiti they saw on a wall during their first tour",
      "a phrase from a book one member was reading",
      "an inside joke from their early rehearsal days",
      "a random conversation overheard in a diner",
      "a street sign they passed on their way to their first gig"
    ];
    
    return origins[Math.floor(Math.random() * origins.length)];
  }
}