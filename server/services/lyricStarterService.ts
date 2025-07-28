import OpenAI from "openai";
import { xaiRateLimiter, withRetry } from '../utils/rateLimiter';
import { DatamuseService } from './datamuseService';
import { secureLog } from '../utils/secureLogger';

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
        secureLog.error("Failed to initialize OpenAI client for lyric generation:", error);
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
        secureLog.debug(`Attempting lyric generation with model: ${model}`);
        const timestamp = Date.now();
        
        // Song structure elements
        const songSections = ['verse', 'chorus', 'bridge', 'pre-chorus', 'outro'];
        const currentSection = songSections[Math.floor(Math.random() * songSections.length)];
        
        // Length variation types
        const lengthTypes = ['short', 'medium', 'long', 'couplet'];
        const selectedLength = lengthTypes[Math.floor(Math.random() * lengthTypes.length)];
        
        // Poetic meter patterns
        const meterPatterns = [
          'iambic' as const,      // da-DUM (unstressed-stressed)
          'trochaic' as const,    // DUM-da (stressed-unstressed)
          'anapestic' as const,   // da-da-DUM (two unstressed, one stressed)
          'dactylic' as const,    // DUM-da-da (stressed, two unstressed)
          'free_verse' as const   // No specific meter
        ];
        const selectedMeter = meterPatterns[Math.floor(Math.random() * meterPatterns.length)];
        
        // Rhyme scheme options
        const rhymeSchemes = currentSection === 'chorus' 
          ? ['AABB', 'ABAB', 'AAAA', 'internal'] 
          : ['ABAB', 'ABCB', 'free', 'internal'];
        const selectedRhyme = rhymeSchemes[Math.floor(Math.random() * rhymeSchemes.length)];
        
        // Define length specifications
        const lengthSpecs = {
          short: { lines: 1, wordsPerLine: [6, 10], totalSyllables: [8, 14] },
          medium: { lines: 2, wordsPerLine: [5, 8], totalSyllables: [16, 24] },
          long: { lines: 4, wordsPerLine: [4, 7], totalSyllables: [32, 48] },
          couplet: { lines: 2, wordsPerLine: [7, 10], totalSyllables: [20, 28] }
        };
        
        const spec = lengthSpecs[selectedLength as keyof typeof lengthSpecs];
        
        // Create detailed JSON prompt structure
        const jsonPrompt = {
          task: "generate_lyric_starter",
          parameters: {
            genre: genre || "contemporary",
            songSection: currentSection,
            structure: {
              lengthType: selectedLength,
              lines: spec.lines,
              wordsPerLine: spec.wordsPerLine,
              syllableRange: spec.totalSyllables,
              poeticMeter: selectedMeter,
              rhymeScheme: selectedRhyme
            },
            datamuseContext: {
              genreWords: datamuseContext.genreWords.slice(0, 15),
              emotionalWords: datamuseContext.emotionalWords.slice(0, 10),
              rhymeWords: datamuseContext.rhymeWords.slice(0, 8),
              sensoryWords: datamuseContext.sensoryWords.slice(0, 8),
              tempoWords: datamuseContext.tempoWords.slice(0, 5),
              culturalWords: datamuseContext.culturalWords.slice(0, 5),
              contrastWords: datamuseContext.contrastWords.slice(0, 5),
              associatedWords: datamuseContext.associatedWords.slice(0, 5)
            },
            styleGuidelines: {
              tone: currentSection === 'chorus' ? 'anthemic_memorable' : 
                    currentSection === 'verse' ? 'storytelling_intimate' :
                    currentSection === 'bridge' ? 'reflective_turning_point' :
                    'emotionally_engaging',
              imagery: 'vivid_sensory',
              language: 'contemporary_authentic',
              emotionalIntensity: genre === 'metal' || genre === 'punk' ? 'high' :
                                 genre === 'jazz' || genre === 'folk' ? 'subtle' : 'moderate'
            },
            requirements: {
              mustIncludeGenreVocabulary: true,
              avoidClichePhrases: true,
              naturalLanguageFlow: true,
              appropriateToSection: true
            }
          }
        };
        
        const prompt = `You are given a detailed JSON request to generate a lyric starter with specific structural requirements.

Request: ${JSON.stringify(jsonPrompt, null, 2)}

CRITICAL INSTRUCTIONS:
1. Generate EXACTLY ${spec.lines} line(s) as specified in structure.lines
2. Follow the poetic meter "${selectedMeter}" if not free_verse:
   - iambic: da-DUM pattern (e.g., "I WALK a-LONE through STREETS of GOLD")
   - trochaic: DUM-da pattern (e.g., "FIRE-light DANC-ing IN the DARK-ness")
   - anapestic: da-da-DUM (e.g., "in the HEAT of the NIGHT we are FREE")
   - dactylic: DUM-da-da (e.g., "BEAU-ti-ful MEM-o-ries FADE a-way")
3. Implement rhyme scheme "${selectedRhyme}" (${spec.lines > 1 ? 'end rhymes for multi-line' : 'internal rhyme for single line'})
4. Keep each line between ${spec.wordsPerLine[0]}-${spec.wordsPerLine[1]} words
5. Total syllable count should be ${spec.totalSyllables[0]}-${spec.totalSyllables[1]}
6. Blend Datamuse context words naturally - don't force them
7. Match the tone "${jsonPrompt.parameters.styleGuidelines.tone}" for ${currentSection}

FORMATTING:
- For single line: {"lyric": "your single line here"}
- For multiple lines: {"lyric": "First line here\\nSecond line here"} (use \\n for line breaks)

QUALITY REQUIREMENTS:
- Sound natural when spoken aloud
- Have clear rhythm and flow
- Feel authentic to ${genre || 'contemporary'} genre
- Avoid generic phrases like "in the night" or "heart and soul"
- Create something memorable and fresh

Reply with ONLY the JSON object.`;

        const requestParams: any = {
          model: model,
          messages: [
            {
              role: "system",
              content: `You are a master lyricist who creates structurally diverse lyrics based on detailed JSON specifications.

CORE COMPETENCIES:
1. POETIC METER MASTERY: Expert in iambic, trochaic, anapestic, dactylic patterns
2. LENGTH VARIATION: Create short hooks, medium verses, long narratives, and rhyming couplets
3. SYLLABLE PRECISION: Count syllables accurately for rhythmic flow
4. RHYME SCHEMES: Master of AABB, ABAB, ABCB, internal rhymes, and free verse
5. GENRE AUTHENTICITY: Use Datamuse context words to capture genuine genre feel
6. STRUCTURAL VARIETY: Adapt tone and style for verse, chorus, bridge, pre-chorus, outro

OUTPUT RULES:
- ALWAYS return JSON format: {"lyric": "text"} for single line
- Use {"lyric": "line1\\nline2"} for multiple lines (\\n for breaks)
- STRICTLY follow the line count specified in structure.lines
- MAINTAIN word count per line as specified in wordsPerLine range
- MATCH total syllable count to syllableRange specification

QUALITY STANDARDS:
- Natural spoken rhythm that matches the specified meter
- Fresh imagery avoiding clichéd phrases
- Seamless integration of context vocabulary
- Emotional resonance matching the song section
- Professional songwriting quality`
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 1.2, // Higher temperature for more creative variety
          max_tokens: 200 // Increased for longer lyrics
        };

        // Add frequency penalties for Grok 3
        if (model === 'grok-3' || model === 'grok-3-mini') {
          requestParams.frequency_penalty = 0.6; // Higher to avoid repetition
          requestParams.presence_penalty = 0.5; // Encourage diverse vocabulary
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
              
              secureLog.info(`Successfully generated lyric: "${cleanLyric}" using model: ${model} with Datamuse context`);
              return {
                lyric: cleanLyric,
                model: model,
                songSection: currentSection
              };
            }
          } catch (parseError) {
            secureLog.error(`Failed to parse JSON response from ${model}:`, parseError);
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
        secureLog.error(`Model ${model} failed:`, error.message);
      }
    }

    // If all models fail, return fallback
    return this.generateFallbackLyric(genre);
  }

  private generateFallbackLyric(genre?: string): { lyric: string; model: string; songSection: string } {
    const fallbackLyrics = {
      verse: {
        short: [
          "I've been walking down this empty road alone",
          "There's a story written in the stars tonight",
          "Every morning brings a different kind of light"
        ],
        medium: [
          "The city sleeps but my mind is wide awake\nSearching for the words I couldn't say",
          "Letters that I never sent still haunt my dreams\nEchoing like whispers in between the seams",
          "Thunder rolls across the purple sky\nWondering if you still remember why"
        ],
        long: [
          "Walking through the streets where we used to laugh\nEvery corner holds a photograph\nMemories dance like shadows on the wall\nWaiting for the moment when you call"
        ]
      },
      chorus: {
        short: [
          "We're all just searching for a place to call our own",
          "Hold on tight, the best is yet to come",
          "This is our moment, written in the sky"
        ],
        medium: [
          "Love like wildfire, burning through the night\nWe are the dreamers, never backing down",
          "Rise above the chaos, find your way\nTomorrow's just a heartbeat away",
          "Sing it loud, let the whole world know\nThis is where our story starts to grow"
        ],
        long: [
          "When the world gets heavy, I'll be your strength\nThrough the storms and shadows, we'll go the length\nHand in hand, we'll face whatever comes our way\nTogether we're unstoppable, come what may"
        ]
      },
      bridge: {
        short: [
          "Maybe all we need is time to understand",
          "Looking back, I see how far we've come",
          "In the silence, truth begins to speak"
        ],
        medium: [
          "Everything changes when you change your mind\nLeave the past and all your fears behind",
          "The answer was inside us all along\nNow we're right where we belong",
          "Breaking through the walls we built so high\nFinally learning how to fly"
        ],
        long: [
          "And if we lose our way tonight\nI'll be the compass to your light\nThrough every twist and turn we'll find\nThe peace we're searching for in time"
        ]
      }
    };

    const sections = Object.keys(fallbackLyrics) as Array<keyof typeof fallbackLyrics>;
    const section = sections[Math.floor(Math.random() * sections.length)];
    const lengthTypes = ['short', 'medium', 'long'] as const;
    const length = lengthTypes[Math.floor(Math.random() * lengthTypes.length)];
    
    const sectionLyrics = fallbackLyrics[section][length];
    const selectedLyric = sectionLyrics[Math.floor(Math.random() * sectionLyrics.length)];

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
      
      secureLog.debug(`🎵 Enhanced Datamuse context for ${genre || 'contemporary'}: ${allWords.size} unique words`);
      
    } catch (error) {
      secureLog.error('Error fetching Datamuse context:', error);
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