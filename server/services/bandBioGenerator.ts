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
        model: "grok-3-latest",
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
    } catch (error: any) {
      console.error('Band bio generation error:', error);
      
      // Check if it's an API key issue (OpenAI library specific error)
      if (error?.status === 400 || 
          (error?.error && typeof error.error === 'string' && error.error.includes('Incorrect API key'))) {
        throw new Error("The xAI API key appears to be invalid. Please check your API key at https://console.x.ai and make sure it's correctly configured.");
      }
      
      // Check if it's a rate limit or quota issue  
      if (error?.status === 429 || 
          (error instanceof Error && (error.message.includes('rate limit') || error.message.includes('quota')))) {
        throw new Error("API rate limit exceeded. Please try again in a moment.");
      }
      
      throw new Error("Failed to generate band biography. Please try again later.");
    }
  }
}

export const bandBioGenerator = new BandBioGeneratorService();