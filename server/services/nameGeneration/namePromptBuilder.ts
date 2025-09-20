/**
 * NamePromptBuilder - Optimized prompt generation for grok-4-fast
 * Implements lean, focused prompts with strategy-aware parameter tuning
 */

import { GenerationStrategy } from "../unifiedNameGenerator";

export interface NamePromptConfig {
  model: string;
  temperature: number;
  max_tokens: number;
  response_format: { type: "json_object" };
}

export interface NameGenerationRequest {
  type: 'band' | 'song';
  genre: string;
  mood?: string;
  count: number;
  wordCount?: number | string;
  context: {
    topArtists: string[];        // Top 3-5 artists
    topKeywords: string[];       // Top 3-5 genre keywords
    topAssociations: string[];   // Top 3-5 word associations
  };
}

export class NamePromptBuilder {
  
  /**
   * Build optimized prompt configuration for grok-4-fast
   */
  static buildPrompt(request: NameGenerationRequest, strategy: GenerationStrategy): {
    messages: Array<{ role: "system" | "user"; content: string }>;
    config: NamePromptConfig;
  } {
    const config = this.getStrategyConfig(strategy);
    const messages = this.buildMessages(request);
    
    return { messages, config };
  }

  /**
   * Get strategy-specific configuration for grok-4-fast
   */
  private static getStrategyConfig(strategy: GenerationStrategy): NamePromptConfig {
    const configs = {
      SPEED: {
        model: "grok-4-fast",
        temperature: 0.7,
        max_tokens: 200,
        response_format: { type: "json_object" as const }
      },
      BALANCED: {
        model: "grok-4-fast", 
        temperature: 0.9,
        max_tokens: 250,
        response_format: { type: "json_object" as const }
      },
      QUALITY: {
        model: "grok-4-fast",
        temperature: 1.15,
        max_tokens: 300,
        response_format: { type: "json_object" as const }
      }
    };

    // Map strategy to config key
    if (strategy.contextDepth === 'minimal') return configs.SPEED;
    if (strategy.contextDepth === 'standard') return configs.BALANCED;
    return configs.QUALITY;
  }

  /**
   * Build lean system and user messages for grok-4-fast
   */
  private static buildMessages(request: NameGenerationRequest): Array<{ role: "system" | "user"; content: string }> {
    const systemPrompt = this.buildSystemPrompt(request.type);
    const userPrompt = this.buildUserPrompt(request);

    return [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ];
  }

  /**
   * Lean system prompt optimized for grok-4-fast
   */
  private static buildSystemPrompt(type: 'band' | 'song'): string {
    const entity = type === 'band' ? 'band names' : 'song titles';
    
    return `Expert ${entity} generator. Create original, memorable names using genre context and mood.
    
RULES:
- Generate unique, creative ${entity}
- Use provided context naturally and sparingly
- Avoid existing famous names
- Match specified word count and mood
- Return valid JSON only`;
  }

  /**
   * Compact user prompt with focused context
   */
  private static buildUserPrompt(request: NameGenerationRequest): string {
    const { type, genre, mood, count, wordCount, context } = request;
    const entity = type === 'band' ? 'band_names' : 'song_titles';
    const wordCountStr = this.formatWordCount(wordCount);

    // Build focused context - only top items
    const contextStr = this.buildFocusedContext(context);
    const moodGuidance = mood ? this.getMoodGuidance(mood) : '';

    return `Generate ${count} ${type === 'band' ? 'band names' : 'song titles'}

REQUIREMENTS:
- Genre: ${genre}
${mood ? `- Mood: ${mood}` : ''}
- Word count: ${wordCountStr}
${moodGuidance}

CONTEXT:
${contextStr}

OUTPUT FORMAT:
{"${entity}": ["Name 1", "Name 2", "Name 3", "Name 4"]}`;
  }

  /**
   * Build focused context with only top 3-5 items per category
   */
  private static buildFocusedContext(context: NameGenerationRequest['context']): string {
    const parts: string[] = [];
    
    if (context.topArtists.length > 0) {
      parts.push(`Artists: ${context.topArtists.slice(0, 3).join(', ')}`);
    }
    
    if (context.topKeywords.length > 0) {
      parts.push(`Keywords: ${context.topKeywords.slice(0, 5).join(', ')}`);
    }
    
    if (context.topAssociations.length > 0) {
      parts.push(`Themes: ${context.topAssociations.slice(0, 3).join(', ')}`);
    }

    return parts.join('\n');
  }

  /**
   * Concise mood guidance
   */
  private static getMoodGuidance(mood: string): string {
    const guidance: { [key: string]: string } = {
      happy: '- Style: Bright, energetic, joyful',
      sad: '- Style: Melancholic, reflective, emotional', 
      dark: '- Style: Mysterious, atmospheric, shadowy',
      angry: '- Style: Intense, powerful, raw energy',
      calm: '- Style: Peaceful, gentle, tranquil',
      energetic: '- Style: Dynamic, high-energy, pulsing'
    };
    
    return guidance[mood.toLowerCase()] || '';
  }

  /**
   * Format word count for prompts
   */
  private static formatWordCount(wordCount?: number | string): string {
    if (wordCount === '4+') return '4-6 words';
    if (typeof wordCount === 'number') return `${wordCount} word${wordCount !== 1 ? 's' : ''}`;
    return '2-3 words';
  }
}