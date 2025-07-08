import OpenAI from "openai";

export class BandBioGeneratorService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({ 
      baseURL: "https://api.x.ai/v1", 
      apiKey: process.env.XAI_API_KEY 
    });
  }

  async generateBandBio(bandName: string): Promise<string> {
    try {
      const prompt = `Create a fun, imaginative band biography for "${bandName}". 

Include:
- Origin story (where/how they formed, make it creative and unexpected)
- Band members (give them quirky names and instruments)
- Musical style/genre (can be inventive or mix genres)
- Their breakthrough moment or famous incident
- Current status or recent activities
- One surprising fun fact

Keep it playful, creative, and around 150-200 words. Make it feel like a real band with personality and history, but with a touch of humor and whimsy.`;

      const response = await this.openai.chat.completions.create({
        model: "grok-2-1212",
        messages: [
          {
            role: "system",
            content: "You are a creative music journalist who writes entertaining band biographies. Your writing is playful, imaginative, and brings bands to life with vivid details and humor."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 400,
        temperature: 0.9
      });

      const bio = response.choices[0].message.content?.trim();
      
      if (!bio) {
        throw new Error("No biography generated");
      }

      return bio;
    } catch (error) {
      console.error('Band bio generation error:', error);
      throw new Error("Failed to generate band biography");
    }
  }
}

export const bandBioGenerator = new BandBioGeneratorService();