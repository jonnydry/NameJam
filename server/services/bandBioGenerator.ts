import OpenAI from "openai";

export class BandBioGeneratorService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      baseURL: "https://api.x.ai/v1",
      apiKey: process.env.XAI_API_KEY
    });
  }

  async generateBandBio(bandName: string, genre?: string, mood?: string): Promise<string> {
    try {
      const genreInfo = genre ? ` in the ${genre} genre` : '';
      const moodInfo = mood ? ` with a ${mood} vibe` : '';
      
      const prompt = `Create a short, imaginative biography for a fictional band called "${bandName}"${genreInfo}${moodInfo}. 
      
      Include:
      - How they formed (make it interesting or amusing)
      - Band members (creative nicknames welcome)
      - Their musical style
      - A breakthrough moment or funny story
      - A quirky fun fact
      
      Keep it under 200 words, entertaining, and slightly humorous. Don't mention that they're fictional.`;

      const response = await this.openai.chat.completions.create({
        model: "grok-3-mini",
        messages: [
          {
            role: "system",
            content: "You are a creative music journalist writing entertaining band biographies. Be witty, imaginative, and slightly irreverent."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.8
      });

      const bio = response.choices[0].message.content || "Biography unavailable at this time.";
      return bio.trim();
    } catch (error) {
      console.error("Error generating band bio:", error);
      throw new Error("Failed to generate band biography");
    }
  }

  async generateBandBioWithDetails(
    bandName: string, 
    options: {
      genre?: string;
      mood?: string;
      wordCount?: number;
    }
  ): Promise<{
    bio: string;
    members?: string[];
    formationYear?: string;
    genre?: string;
  }> {
    try {
      const { genre, mood } = options;
      const genreInfo = genre ? ` in the ${genre} genre` : '';
      const moodInfo = mood ? ` with a ${mood} vibe` : '';
      
      const prompt = `Create a detailed biography for a fictional band called "${bandName}"${genreInfo}${moodInfo}. 
      
      Respond in JSON format with the following structure:
      {
        "bio": "A 150-200 word entertaining biography",
        "members": ["Member 1 name and instrument", "Member 2 name and instrument", ...],
        "formationYear": "Year they formed",
        "genre": "Their primary musical genre",
        "funFact": "One quirky or humorous fact about the band"
      }
      
      Make it creative, entertaining, and slightly humorous. Include interesting formation story and breakthrough moment.`;

      const response = await this.openai.chat.completions.create({
        model: "grok-3-mini",
        messages: [
          {
            role: "system",
            content: "You are a creative music journalist. Respond only in valid JSON format."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 400,
        temperature: 0.8
      });

      const content = response.choices[0].message.content || "{}";
      const parsedResponse = JSON.parse(content);
      
      return {
        bio: parsedResponse.bio || "Biography unavailable at this time.",
        members: parsedResponse.members || [],
        formationYear: parsedResponse.formationYear || "Unknown",
        genre: parsedResponse.genre || genre || "Alternative"
      };
    } catch (error) {
      console.error("Error generating detailed band bio:", error);
      // Return a fallback response instead of throwing
      return {
        bio: `${bandName} emerged from the underground music scene with their unique sound. Known for their energetic performances and devoted fanbase, they continue to push musical boundaries.`,
        genre: options.genre || "Alternative"
      };
    }
  }
}