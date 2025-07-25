import OpenAI from "openai";
import { xaiRateLimiter, withRetry } from '../utils/rateLimiter';
import { DatamuseService } from './datamuseService';

export class LyricStarterService {
  private openai: OpenAI | null = null;
  private datamuseService: DatamuseService;

  constructor() {
    // Initialize Datamuse service
    this.datamuseService = new DatamuseService();
    
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

    // Get Datamuse context for enhanced lyric generation
    const datamuseContext = await this.getDatamuseContext(genre);
    
    const models = ["grok-3", "grok-4", "grok-3-mini"];
    
    for (const model of models) {
      try {
        console.log(`Attempting lyric generation with model: ${model}`);
        const timestamp = Date.now();
        
        // Song structure elements
        const songSections = ['verse', 'chorus', 'bridge', 'pre-chorus', 'outro'];
        const currentSection = songSections[Math.floor(Math.random() * songSections.length)];
        
        // Create JSON prompt structure
        const jsonPrompt = {
          task: "generate_lyric_starter",
          parameters: {
            genre: genre || "contemporary",
            songSection: currentSection,
            datamuseContext: {
              genreWords: datamuseContext.genreWords,
              emotionalWords: datamuseContext.emotionalWords,
              rhymeWords: datamuseContext.rhymeWords,
              sensoryWords: datamuseContext.sensoryWords,
              tempoWords: datamuseContext.tempoWords,
              culturalWords: datamuseContext.culturalWords,
              contrastWords: datamuseContext.contrastWords,
              associatedWords: datamuseContext.associatedWords
            },
            requirements: {
              wordCount: { min: 5, max: 15 },
              style: currentSection === 'chorus' ? 'memorable_hook' : 'engaging_opener',
              format: "single_line"
            }
          }
        };
        
        const prompt = `You are given a JSON request to generate a lyric starter. Use the Datamuse context words for authentic vocabulary.

Request: ${JSON.stringify(jsonPrompt, null, 2)}

Instructions:
1. Study the genreWords and emotionalWords to capture the authentic ${genre || 'contemporary'} feel
2. Use tempoWords and culturalWords for authentic genre-specific rhythm and cultural references
3. Consider using some of the rhymeWords for potential rhyme schemes
4. Incorporate sensoryWords for vivid imagery
5. Add depth with contrastWords (antonyms) for emotional complexity
6. Blend in associatedWords (synonyms) for richer vocabulary
7. Create ONE powerful ${currentSection} line that feels authentically ${genre || 'contemporary'}
8. The line should naturally incorporate vocabulary from multiple context categories

Response format: {"lyric": "your lyric line here"}

Important: Reply with ONLY the JSON object, nothing else.`;

        const requestParams: any = {
          model: model,
          messages: [
            {
              role: "system",
              content: `You are a master lyricist who uses JSON-structured requests to create authentic, genre-specific lyrics. 

Your expertise:
1. Analyzing linguistic context from Datamuse API data
2. Incorporating authentic genre vocabulary naturally
3. Creating lyrics that feel genuine to the specified style
4. Using sensory and emotional words for vivid imagery
5. Building on rhyme potential from provided word lists

Always respond with a JSON object containing the lyric.`
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.9,
          max_tokens: 100
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
        const generatedResponse = completion.choices[0]?.message?.content?.trim();
        
        if (generatedResponse) {
          try {
            // Parse JSON response
            const parsedResponse = JSON.parse(generatedResponse);
            const lyric = parsedResponse.lyric;
            
            if (lyric && lyric.length > 5 && lyric.length < 200) {
              // Clean the lyric
              const cleanLyric = lyric
                .replace(/^["'""']|["'""']$/g, '')
                .trim();
              
              console.log(`Successfully generated lyric: "${cleanLyric}" using model: ${model} with Datamuse context`);
              return {
                lyric: cleanLyric,
                model: model,
                songSection: currentSection
              };
            }
          } catch (parseError) {
            console.log(`Failed to parse JSON response from ${model}:`, parseError);
            // Try to extract lyric from plain text response as fallback
            if (generatedResponse.length > 5 && generatedResponse.length < 200) {
              const cleanLyric = generatedResponse
                .replace(/^["'""']|["'""']$/g, '')
                .replace(/^(Here's |Here is |How about |Try |I suggest )/i, '')
                .trim();
              
              return {
                lyric: cleanLyric,
                model: model,
                songSection: currentSection
              };
            }
          }
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

  private async getDatamuseContext(genre?: string): Promise<{
    genreWords: string[];
    emotionalWords: string[];
    rhymeWords: string[];
    sensoryWords: string[];
    tempoWords: string[];
    culturalWords: string[];
    contrastWords: string[];
    associatedWords: string[];
  }> {
    const context = {
      genreWords: [] as string[],
      emotionalWords: [] as string[],
      rhymeWords: [] as string[],
      sensoryWords: [] as string[],
      tempoWords: [] as string[],
      culturalWords: [] as string[],
      contrastWords: [] as string[],
      associatedWords: [] as string[]
    };

    try {
      // Get seed words for all categories
      const genreSeeds = this.getGenreSeedWords(genre);
      const emotionalSeeds = this.getEmotionalSeeds(genre);
      const tempoSeeds = this.getTempoSeeds(genre);
      const culturalSeeds = this.getCulturalSeeds(genre);
      
      // 1. Single call combining genre and emotional context
      const primaryResults = await this.datamuseService.findWords({
        triggers: genreSeeds.slice(0, 2).join(','),
        topics: `${genre || 'music'} emotion lyrics`,
        maxResults: 40
      });
      
      const filteredPrimary = primaryResults
        .filter(w => this.isGoodLyricWord(w.word))
        .map(w => w.word);
      
      // Distribute results across genre, emotional, and sensory words
      context.genreWords = filteredPrimary.slice(0, 12);
      context.emotionalWords = filteredPrimary.slice(12, 20);
      context.sensoryWords = filteredPrimary.slice(20, 28);
      
      // 2. Get rhyming words (essential for lyrics)
      const rhymeSeeds = ['night', 'day', 'heart', 'love', 'time', 'life', 'dream'];
      const selectedRhyme = rhymeSeeds[Math.floor(Math.random() * rhymeSeeds.length)];
      const rhymeResults = await this.datamuseService.findWords({
        rhymesWith: selectedRhyme,
        maxResults: 15
      });
      
      context.rhymeWords = rhymeResults
        .filter(w => this.isGoodLyricWord(w.word))
        .map(w => w.word)
        .slice(0, 10);
      
      // 3. Use pre-defined tempo and cultural words (no API call)
      context.tempoWords = tempoSeeds.slice(0, 5);
      context.culturalWords = culturalSeeds.slice(0, 5);
      
      // 4. Use pre-defined contrast words based on emotion
      context.contrastWords = this.getContrastFromEmotion(emotionalSeeds[0], genre);
      
      // 5. Build associations from existing results
      context.associatedWords = [
        ...context.genreWords.slice(8, 10),
        ...context.emotionalWords.slice(6, 8),
        ...genreSeeds.slice(2, 4),
        ...emotionalSeeds.slice(1, 3)
      ];
      
      // Remove duplicates across categories
      const allWords = new Set([
        ...context.genreWords,
        ...context.emotionalWords,
        ...context.rhymeWords,
        ...context.sensoryWords,
        ...context.tempoWords,
        ...context.culturalWords,
        ...context.contrastWords,
        ...context.associatedWords
      ]);
      
      console.log(`🎵 Enhanced Datamuse context for ${genre || 'contemporary'}: ${allWords.size} unique words`);
      
    } catch (error) {
      console.log('Error fetching Datamuse context:', error);
      // Return minimal context on error
    }
    
    return context;
  }

  private getGenreSeedWords(genre?: string): string[] {
    const genreSeeds: Record<string, string[]> = {
      rock: ['thunder', 'rebel', 'electric', 'wild', 'freedom'],
      pop: ['shine', 'sparkle', 'dance', 'bright', 'rainbow'],
      country: ['road', 'home', 'whiskey', 'truck', 'heart'],
      'hip-hop': ['flow', 'real', 'street', 'hustle', 'grind'],
      indie: ['dream', 'wander', 'lost', 'quiet', 'strange'],
      folk: ['river', 'mountain', 'story', 'simple', 'truth'],
      metal: ['rage', 'dark', 'power', 'scream', 'chaos'],
      jazz: ['smooth', 'blue', 'night', 'smoke', 'cool'],
      electronic: ['pulse', 'neon', 'digital', 'wave', 'sync'],
      blues: ['pain', 'soul', 'lonely', 'whiskey', 'midnight'],
      punk: ['riot', 'break', 'angry', 'system', 'fight'],
      alternative: ['edge', 'different', 'shadow', 'drift', 'echo'],
      reggae: ['peace', 'love', 'island', 'rhythm', 'sun'],
      classical: ['grace', 'eternal', 'beauty', 'divine', 'pure']
    };
    
    return genreSeeds[genre || ''] || ['music', 'song', 'melody', 'rhythm', 'sound'];
  }

  private getEmotionalSeeds(genre?: string): string[] {
    const emotionalMappings: Record<string, string[]> = {
      rock: ['passion', 'anger', 'defiance'],
      pop: ['joy', 'love', 'excitement'],
      country: ['heartbreak', 'nostalgia', 'pride'],
      'hip-hop': ['confidence', 'struggle', 'triumph'],
      indie: ['melancholy', 'wonder', 'introspection'],
      folk: ['wisdom', 'longing', 'peace'],
      metal: ['fury', 'darkness', 'intensity'],
      jazz: ['sophistication', 'loneliness', 'romance'],
      electronic: ['euphoria', 'transcendence', 'energy'],
      blues: ['sorrow', 'pain', 'resilience'],
      punk: ['rebellion', 'frustration', 'urgency'],
      alternative: ['alienation', 'confusion', 'hope'],
      reggae: ['harmony', 'spirituality', 'unity'],
      classical: ['majesty', 'serenity', 'contemplation']
    };
    
    return emotionalMappings[genre || ''] || ['feeling', 'emotion', 'heart'];
  }

  private isGoodLyricWord(word: string): boolean {
    // Filter out words that don't work well in lyrics
    if (word.length < 2 || word.length > 12) return false;
    if (/[0-9]/.test(word)) return false;
    if (/^[A-Z]/.test(word) && word !== word.toUpperCase()) return false; // Proper nouns
    
    // Avoid technical/scientific terms
    const technicalTerms = [
      'data', 'system', 'process', 'function', 'method',
      'molecule', 'electron', 'protocol', 'algorithm'
    ];
    
    if (technicalTerms.includes(word.toLowerCase())) return false;
    
    return true;
  }
  
  private getTempoSeeds(genre?: string): string[] {
    const tempoMap: { [key: string]: string[] } = {
      rock: ['fast', 'heavy', 'driving', 'pounding', 'explosive'],
      metal: ['brutal', 'crushing', 'relentless', 'thunderous', 'aggressive'],
      jazz: ['smooth', 'swinging', 'syncopated', 'mellow', 'groovy'],
      electronic: ['pulsing', 'hypnotic', 'steady', 'building', 'dropping'],
      folk: ['gentle', 'flowing', 'walking', 'lilting', 'meandering'],
      classical: ['adagio', 'allegro', 'andante', 'crescendo', 'delicate'],
      'hip-hop': ['bouncing', 'head-nodding', 'trap', 'boom-bap', 'flowing'],
      country: ['two-step', 'honky-tonk', 'shuffling', 'rolling', 'steady'],
      blues: ['shuffle', 'bent', 'twelve-bar', 'walking', 'dragging'],
      reggae: ['skanking', 'one-drop', 'upstroke', 'riddim', 'dubby'],
      punk: ['frantic', 'breakneck', 'thrashing', 'manic', 'slamming'],
      indie: ['jangly', 'dreamy', 'lo-fi', 'atmospheric', 'understated'],
      pop: ['catchy', 'bouncy', 'upbeat', 'danceable', 'snappy'],
      alternative: ['angular', 'dynamic', 'shifting', 'brooding', 'restless']
    };
    
    return tempoMap[genre || 'pop'] || ['steady', 'flowing', 'moving', 'rhythmic'];
  }
  
  private getCulturalSeeds(genre?: string): string[] {
    const culturalMap: { [key: string]: string[] } = {
      rock: ['rebellion', 'freedom', 'youth', 'garage', 'stadium'],
      metal: ['darkness', 'mythology', 'battle', 'nordic', 'underground'],
      jazz: ['speakeasy', 'bebop', 'harlem', 'nightclub', 'sophisticated'],
      electronic: ['rave', 'warehouse', 'futuristic', 'neon', 'digital'],
      folk: ['tradition', 'storytelling', 'campfire', 'woodstock', 'roots'],
      classical: ['symphony', 'concert-hall', 'virtuoso', 'baroque', 'romantic'],
      'hip-hop': ['street', 'cipher', 'urban', 'graffiti', 'block-party'],
      country: ['nashville', 'honky-tonk', 'backroads', 'southern', 'heartland'],
      blues: ['mississippi', 'crossroads', 'juke-joint', 'chicago', 'delta'],
      reggae: ['jamaica', 'rastafari', 'kingston', 'dub', 'soundsystem'],
      punk: ['DIY', 'anarchy', 'underground', 'CBGB', 'mohawk'],
      indie: ['bedroom', 'DIY', 'college-radio', 'artsy', 'authentic'],
      pop: ['mainstream', 'radio', 'teen', 'chart', 'commercial'],
      alternative: ['underground', 'college', 'experimental', 'sub-pop', 'grunge']
    };
    
    return culturalMap[genre || 'pop'] || ['modern', 'contemporary', 'universal', 'global'];
  }
  
  private getContrastFromEmotion(emotion: string, genre?: string): string[] {
    // Pre-defined contrasts to avoid API calls
    const contrastMap: { [key: string]: string[] } = {
      // Rock emotions
      'passion': ['apathy', 'indifference', 'cold'],
      'anger': ['peace', 'calm', 'serenity'],
      'defiance': ['conformity', 'submission', 'acceptance'],
      // Pop emotions
      'joy': ['sadness', 'sorrow', 'melancholy'],
      'love': ['hate', 'loneliness', 'isolation'],
      'excitement': ['boredom', 'stillness', 'quiet'],
      // Country emotions
      'heartbreak': ['healing', 'wholeness', 'joy'],
      'nostalgia': ['future', 'present', 'now'],
      'pride': ['humility', 'shame', 'doubt'],
      // Hip-hop emotions
      'confidence': ['doubt', 'fear', 'uncertainty'],
      'struggle': ['ease', 'comfort', 'privilege'],
      'triumph': ['defeat', 'failure', 'loss'],
      // Default contrasts
      'default': ['light', 'dark', 'high', 'low', 'fast', 'slow']
    };
    
    return contrastMap[emotion] || contrastMap['default'];
  }
}