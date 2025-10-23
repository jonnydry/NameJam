import OpenAI from "openai";
import { secureLog } from "../utils/secureLogger";

interface LyricGenerationResult {
  id: string;
  lyric: string;
  genre?: string;
  songSection: string;
  model: string;
  generatedAt: string;
}

export class LyricGenerator {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      baseURL: "https://api.x.ai/v1",
      apiKey: process.env.XAI_API_KEY
    });
  }

  async generateLyricStarter(genre?: string): Promise<LyricGenerationResult> {
    try {
      const prompt = this.buildPrompt(genre);

      const response = await this.openai.chat.completions.create({
        model: "grok-beta",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        max_tokens: 300,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content?.trim();
      if (!content) throw new Error('No content from AI');

      const parsed = JSON.parse(content);
      const lyric = parsed.lyric?.trim();
      const songSection = parsed.songSection || 'verse';

      if (!lyric) throw new Error('No lyric in response');

      return {
        id: Date.now().toString(),
        lyric,
        genre: genre || null,
        songSection,
        model: 'grok-beta',
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      secureLog.error('Lyric generation failed:', error);
      return this.getFallbackResult(genre);
    }
  }

  private buildPrompt(genre?: string): string {
    const genreContext = genre ? ` in the ${genre} genre` : '';

    return `Generate a creative lyric starter for a song${genreContext}.

Requirements:
- One compelling opening line or hook
- Catchy and memorable
- Suitable for contemporary music
- Original and unique

Respond only with JSON:
{
  "lyric": "Your opening lyric here",
  "songSection": "verse"
}`;
  }

  private getFallbackResult(genre?: string): LyricGenerationResult {
    const fallbacks = [
      "Under neon lights we chase our dreams...",
      "Echoes of the night call our name...",
      "Breaking through the silence we rise...",
      "Electric hearts beating in time...",
      "Midnight whispers guide our way..."
    ];

    const randomFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];

    return {
      id: Date.now().toString(),
      lyric: randomFallback,
      genre: genre || null,
      songSection: 'verse',
      model: 'fallback',
      generatedAt: new Date().toISOString()
    };
  }
}

export const lyricGenerator = new LyricGenerator();
