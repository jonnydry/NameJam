import OpenAI from "openai";
import { xaiRateLimiter, withRetry } from '../utils/rateLimiter';

export class LyricStarterService {
  private openai: OpenAI | null = null;

  constructor() {
    // Initialize OpenAI only if API key is available
    if (process.env.XAI_API_KEY) {
      try {
        this.openai = new OpenAI({
          baseURL: "https://api.x.ai/v1",
          apiKey: process.env.XAI_API_KEY
        });
      } catch (error) {
        console.log("Failed to initialize OpenAI client for lyric generation:", error);
        this.openai = null;
      }
    }
  }

  async generateLyricStarter(genre?: string): Promise<{ lyric: string; model: string; songSection?: string }> {
    // If OpenAI client is not available, use fallback
    if (!this.openai) {
      return this.generateFallbackLyric(genre);
    }

    const models = ["grok-3", "grok-4", "grok-3-mini"];
    
    for (const model of models) {
      try {
        console.log(`Attempting lyric generation with model: ${model}`);
        const timestamp = Date.now();
        
        // Song structure elements
        const songSections = ['verse', 'chorus', 'bridge', 'pre-chorus', 'outro'];
        const currentSection = songSections[Math.floor(Math.random() * songSections.length)];
        
        // Poetic devices and structures
        const poeticTechniques = [
          'metaphor and vivid imagery',
          'alliteration and internal rhyme',
          'narrative storytelling',
          'emotional confession',
          'sensory description',
          'paradox and contrast',
          'repetition and rhythm',
          'symbolic imagery'
        ];
        
        const lyricFormulas = [
          'conversational opening',
          'question that draws listener in',
          'vivid scene setting',
          'emotional declaration',
          'universal truth observation',
          'personal memory recall',
          'call to action',
          'philosophical musing'
        ];
        
        const selectedTechnique = poeticTechniques[Math.floor(Math.random() * poeticTechniques.length)];
        const selectedFormula = lyricFormulas[Math.floor(Math.random() * lyricFormulas.length)];
        
        // Build genre-aware prompt
        let genreContext = '';
        if (genre) {
          const genreStyles = {
            rock: 'raw emotion and rebellion',
            pop: 'catchy hooks and relatable themes',
            country: 'storytelling and authentic imagery',
            'hip-hop': 'wordplay and rhythmic flow',
            indie: 'introspective and artistic expression',
            folk: 'narrative wisdom and natural imagery',
            metal: 'intense emotions and powerful imagery',
            jazz: 'sophisticated wordplay and mood',
            electronic: 'abstract concepts and modern themes',
            blues: 'heartfelt emotion and life experience',
            punk: 'direct message and social commentary',
            alternative: 'unconventional perspectives',
            reggae: 'spiritual wisdom and social consciousness',
            classical: 'timeless themes and elegant expression'
          };
          genreContext = genreStyles[genre] || 'creative expression';
        }
        
        const prompt = `Write a single compelling lyric line for a ${currentSection} that could start a ${genre || 'contemporary'} song. 
Use ${selectedTechnique} with a ${selectedFormula} approach.
${genre ? `Capture the essence of ${genreContext}.` : ''}

Requirements:
- ONE powerful line only (can be 5-15 words)
- Must feel like an authentic song lyric
- Should inspire further writing
- Natural, singable rhythm
- ${currentSection === 'chorus' ? 'Memorable and repeatable' : 'Engaging and evocative'}

Reply with ONLY the lyric line, nothing else.`;

        const requestParams: any = {
          model: model,
          messages: [
            {
              role: "system",
              content: `You are a master lyricist who has written for legendary artists across all genres. Your lyrics balance:

POETIC CRAFT:
- Vivid imagery that paints pictures
- Emotional truth that resonates universally
- Surprising word combinations
- Natural conversational flow
- Subtle rhyme and rhythm

SONG STRUCTURE AWARENESS:
- Verses tell stories and set scenes
- Choruses deliver emotional peaks and hooks
- Bridges offer new perspectives
- Pre-choruses build tension
- Outros leave lasting impressions

PROVEN FORMULAS:
- "I" statements for intimacy
- "You" statements for connection
- Questions that make listeners think
- Sensory details that immerse
- Concrete images over abstract concepts

Write lyrics that could open a Grammy-winning song.`
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.9,
          max_tokens: 50
        };

        // Add frequency penalties for Grok 3
        if (model === 'grok-3' || model === 'grok-3-mini') {
          requestParams.frequency_penalty = 0.3;
          requestParams.presence_penalty = 0.3;
        }

        const completion = await xaiRateLimiter.execute(async () => {
          return withRetry(async () => {
            const resp = await this.openai!.chat.completions.create(requestParams);
            return resp;
          }, 3, 2000);
        });
        const generatedLyric = completion.choices[0]?.message?.content?.trim();
        
        if (generatedLyric && generatedLyric.length > 5 && generatedLyric.length < 200) {
          // Clean the lyric
          const cleanLyric = generatedLyric
            .replace(/^["'""']|["'""']$/g, '')
            .replace(/^(Here's |Here is |How about |Try |I suggest )/i, '')
            .trim();
          
          console.log(`Successfully generated lyric: "${cleanLyric}" using model: ${model}`);
          return {
            lyric: cleanLyric,
            model: model,
            songSection: currentSection
          };
        }
      } catch (error: any) {
        console.log(`Model ${model} failed:`, error.message);
      }
    }

    // If all models fail, return fallback
    return this.generateFallbackLyric(genre);
  }

  private generateFallbackLyric(genre?: string): { lyric: string; model: string; songSection: string } {
    const fallbackLyrics = {
      verse: [
        "I've been walking down this empty road alone",
        "There's a story written in the stars tonight",
        "Every morning brings a different kind of light",
        "The city sleeps but my mind is wide awake",
        "Letters that I never sent still haunt my dreams"
      ],
      chorus: [
        "We're all just searching for a place to call our own",
        "Hold on tight, the best is yet to come",
        "This is our moment, written in the sky",
        "Love like wildfire, burning through the night",
        "We are the dreamers, never backing down"
      ],
      bridge: [
        "Maybe all we need is time to understand",
        "Looking back, I see how far we've come",
        "In the silence, truth begins to speak",
        "Everything changes when you change your mind",
        "The answer was inside us all along"
      ]
    };

    const sections = Object.keys(fallbackLyrics) as Array<keyof typeof fallbackLyrics>;
    const section = sections[Math.floor(Math.random() * sections.length)];
    const lyrics = fallbackLyrics[section];
    const selectedLyric = lyrics[Math.floor(Math.random() * lyrics.length)];

    return {
      lyric: selectedLyric,
      model: 'fallback',
      songSection: section
    };
  }
}