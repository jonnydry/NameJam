import OpenAI from "openai";
import { secureLog } from "../utils/secureLogger";

interface GenerateNamesRequest {
  type: 'band' | 'song';
  genre?: string;
  mood?: string;
  count?: number;
  wordCount?: number | string;
}

interface NameResult {
  name: string;
  isAiGenerated: boolean;
  source: string;
}

export class NameGenerator {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      baseURL: "https://api.x.ai/v1",
      apiKey: process.env.XAI_API_KEY
    });
  }

  async generateNames(request: GenerateNamesRequest): Promise<NameResult[]> {
    const count = request.count || 4;
    const isBand = request.type === 'band';

    const prompt = this.buildPrompt(request, count);

    try {
      const response = await this.openai.chat.completions.create({
        model: "grok-beta",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        max_tokens: 800,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content?.trim();
      if (!content) throw new Error('No content from AI');

      const parsed = JSON.parse(content);
      const names = parsed.band_names || parsed.song_titles || [];

      if (!Array.isArray(names) || names.length === 0) {
        throw new Error('Invalid response format');
      }

      return names.slice(0, count).map(name => ({
        name: name.toString().trim(),
        isAiGenerated: true,
        source: 'grok'
      }));

    } catch (error) {
      secureLog.error('Name generation failed:', error);
      return this.getFallbackNames(count, request);
    }
  }

  private buildPrompt(request: GenerateNamesRequest, count: number): string {
    const isBand = request.type === 'band';
    const genre = request.genre || 'general';

    let moodGuidance = '';
    if (request.mood) {
      const moodGuides: Record<string, string> = {
        happy: 'bright and joyful',
        sad: 'melancholic and reflective',
        dark: 'mysterious and intense',
        calm: 'peaceful and serene',
        energetic: 'high-energy and dynamic'
      };
      moodGuidance = ` with a ${moodGuides[request.mood] || request.mood} feel`;
    }

    return `Generate ${count} creative ${isBand ? 'band' : 'song'} names for the ${genre} genre${moodGuidance}.

Requirements:
- Original and unique names
- Appropriate for ${genre} music
- Avoid common clichés
- No duplicates

Respond only with JSON:
{
  "${isBand ? 'band_names' : 'song_titles'}": ["Name 1", "Name 2", "Name 3", "Name 4"]
}`;
  }

  private getFallbackNames(count: number, request: GenerateNamesRequest): NameResult[] {
    const fallbacks = [
      'Electric Dreams', 'Midnight Echo', 'Golden Hour', 'Neon Lights',
      'Cosmic Voyage', 'Silver Thread', 'Azure Sky', 'Crimson Wave'
    ];

    return fallbacks.slice(0, count).map(name => ({
      name,
      isAiGenerated: false,
      source: 'fallback'
    }));
  }
}

export const nameGenerator = new NameGenerator();
