import OpenAI from 'openai';
import { 
  ComprehensiveAPIContext, 
  LyricGenerationResult, 
  LyricPrompt,
  SongSection,
  LengthType,
  PoeticMeter,
  RhymeScheme,
  LengthSpec,
  LyricGenerationError
} from '../../types/lyricTypes';
import { xaiRateLimiter, withRetry } from '../../utils/rateLimiter';
import { secureLog } from '../../utils/secureLogger';
import { lyricGenerationCache } from '../cacheService';

export class LyricGenerator {
  private openai: OpenAI | null = null;
  
  constructor() {
    // Initialize OpenAI only if API key is available
    if (process.env.XAI_API_KEY) {
      try {
        this.openai = new OpenAI({
          baseURL: "https://api.x.ai/v1",
          apiKey: process.env.XAI_API_KEY,
        });
      } catch (error) {
        secureLog.error('Failed to initialize OpenAI client for lyric generation:', error);
        this.openai = null;
      }
    }
  }

  /**
   * Generate a lyric starter using AI with comprehensive context
   */
  async generateWithAI(
    genre: string | undefined,
    context: ComprehensiveAPIContext
  ): Promise<LyricGenerationResult | null> {
    if (!this.openai) {
      return null;
    }

    // Check cache first
    const cacheKey = `lyric:${genre || 'contemporary'}:${JSON.stringify(context).substring(0, 100)}`;
    const cached = lyricGenerationCache.get(cacheKey) as LyricGenerationResult | null;
    if (cached) {
      secureLog.debug('Using cached lyric generation');
      return cached;
    }

    try {
      const lyricStructure = this.generateRandomStructure();
      const prompt = this.buildPrompt(genre || 'contemporary', lyricStructure, context);
      
      const result = await this.callOpenAI(prompt, lyricStructure.songSection);
      
      if (result) {
        // Cache the successful result
        lyricGenerationCache.set(cacheKey, result, 1800); // Cache for 30 minutes
        return result;
      }
      
      return null;
    } catch (error) {
      secureLog.error('Error in AI lyric generation:', error);
      return null;
    }
  }

  /**
   * Generate a random song structure
   */
  private generateRandomStructure() {
    const songSections: SongSection[] = ['verse', 'chorus', 'bridge', 'pre-chorus', 'outro'];
    const lengthTypes: LengthType[] = ['short', 'medium', 'long', 'couplet'];
    const meterPatterns: PoeticMeter[] = ['iambic', 'trochaic', 'anapestic', 'dactylic', 'free_verse'];
    
    const songSection = songSections[Math.floor(Math.random() * songSections.length)];
    const lengthType = lengthTypes[Math.floor(Math.random() * lengthTypes.length)];
    const poeticMeter = meterPatterns[Math.floor(Math.random() * meterPatterns.length)];
    
    const rhymeSchemes: RhymeScheme[] = songSection === 'chorus' 
      ? ['AABB', 'ABAB', 'AAAA', 'internal'] 
      : ['ABAB', 'ABCB', 'free', 'internal'];
    const rhymeScheme = rhymeSchemes[Math.floor(Math.random() * rhymeSchemes.length)];
    
    const lengthSpecs: Record<LengthType, LengthSpec> = {
      short: { lines: 1, wordsPerLine: [6, 10], totalSyllables: [8, 14] },
      medium: { lines: 2, wordsPerLine: [5, 8], totalSyllables: [16, 24] },
      long: { lines: 4, wordsPerLine: [4, 7], totalSyllables: [32, 48] },
      couplet: { lines: 2, wordsPerLine: [7, 10], totalSyllables: [20, 28] }
    };
    
    const spec = lengthSpecs[lengthType];
    
    return {
      songSection,
      lengthType,
      poeticMeter,
      rhymeScheme,
      spec
    };
  }

  /**
   * Build the AI prompt
   */
  private buildPrompt(
    genre: string,
    structure: ReturnType<typeof this.generateRandomStructure>,
    context: ComprehensiveAPIContext
  ): LyricPrompt {
    return {
      task: "generate_lyric_starter",
      parameters: {
        genre,
        songSection: structure.songSection,
        structure: {
          lengthType: structure.lengthType,
          lines: structure.spec.lines,
          wordsPerLine: structure.spec.wordsPerLine,
          syllableRange: structure.spec.totalSyllables,
          poeticMeter: structure.poeticMeter,
          rhymeScheme: structure.rhymeScheme
        },
        apiContext: {
          datamuse: {
            genreWords: context.datamuse.genreWords.slice(0, 10),
            emotionalWords: context.datamuse.emotionalWords.slice(0, 8),
            rhymeWords: context.datamuse.rhymeWords.slice(0, 6),
            sensoryWords: context.datamuse.sensoryWords.slice(0, 6)
          },
          spotify: {
            genreArtists: context.spotify.genreArtists.slice(0, 8),
            moodTracks: context.spotify.moodTracks.slice(0, 8),
            audioFeatures: context.spotify.audioFeatures
          },
          lastfm: {
            genreInfo: context.lastfm.genreInfo,
            topArtists: context.lastfm.topArtists.slice(0, 5),
            relatedGenres: context.lastfm.relatedGenres.slice(0, 5)
          },
          conceptnet: {
            genreConcepts: context.conceptnet.genreConcepts.slice(0, 8),
            emotionalConcepts: context.conceptnet.emotionalConcepts.slice(0, 6),
            culturalAssociations: context.conceptnet.culturalAssociations.slice(0, 5)
          },
          poetry: {
            poeticPhrases: context.poetry.poeticPhrases.slice(0, 5),
            vocabulary: context.poetry.vocabulary.slice(0, 10),
            imagery: context.poetry.imagery.slice(0, 6),
            themes: context.poetry.themes.slice(0, 3)
          }
        },
        tone: {
          emotional: this.getEmotionalTone(genre),
          energy: this.getEnergyLevel(genre),
          style: this.getStyleDescriptor(genre)
        },
        requirements: [
          `Create a ${structure.songSection} for a ${genre} song`,
          `Use exactly ${structure.spec.lines} line(s)`,
          `Apply ${structure.poeticMeter} meter if not free verse`,
          `Follow ${structure.rhymeScheme} rhyme scheme if applicable`,
          'Use natural, conversational language',
          'Incorporate context vocabulary naturally',
          'Avoid clichés and overused phrases',
          'Create something memorable and singable'
        ]
      }
    };
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(
    prompt: LyricPrompt,
    songSection: SongSection
  ): Promise<LyricGenerationResult | null> {
    if (!this.openai) return null;

    const systemPrompt = `You are a master lyricist who creates structurally diverse lyrics based on detailed JSON specifications.

CORE COMPETENCIES:
1. POETIC METER MASTERY: Expert in iambic, trochaic, anapestic, dactylic patterns
2. LENGTH VARIATION: Create short hooks, medium verses, long narratives, and rhyming couplets
3. SYLLABLE PRECISION: Count syllables accurately for rhythmic flow
4. RHYME SCHEMES: Master of AABB, ABAB, ABCB, internal rhymes, and free verse
5. GENRE AUTHENTICITY: Use context words to capture genuine genre feel
6. STRUCTURAL VARIETY: Adapt tone and style for verse, chorus, bridge, pre-chorus, outro

OUTPUT RULES:
- ALWAYS return JSON format: {"lyric": "text"} for single line
- Use {"lyric": "line1\\nline2"} for multiple lines (\\n for breaks)
- STRICTLY follow the line count specified in structure.lines
- MAINTAIN word count per line as specified in wordsPerLine range
- MATCH total syllable count to syllableRange specification
- USE NORMAL CAPITALIZATION: Only capitalize first word of sentences and proper nouns
- NEVER use ALL CAPS or unusual capitalization to show syllable stress or emphasis

QUALITY STANDARDS:
- Natural spoken rhythm that matches the specified meter
- Fresh imagery avoiding clichéd phrases
- Seamless integration of context vocabulary
- Emotional resonance matching the song section
- Professional songwriting quality`;

    const userPrompt = `Generate a lyric based on this specification:
${JSON.stringify(prompt, null, 2)}

Consider the provided context from multiple APIs (Datamuse, Spotify, Last.fm, ConceptNet, Poetry) to create authentic, genre-appropriate lyrics.

Reply with ONLY the JSON object.`;

    try {
      const requestParams = {
        model: "grok-3",
        messages: [
          { role: "system" as const, content: systemPrompt },
          { role: "user" as const, content: userPrompt }
        ],
        temperature: 1.2,
        max_tokens: 200,
        frequency_penalty: 0.6,
        presence_penalty: 0.5
      };

      const completion = await xaiRateLimiter.execute(async () => {
        return withRetry(async () => {
          const resp = await this.openai!.chat.completions.create(requestParams);
          return resp;
        }, 3, 2000);
      });

      const generatedResponse = completion.choices[0]?.message?.content?.trim();
      
      if (generatedResponse) {
        try {
          const parsed = JSON.parse(generatedResponse);
          if (parsed.lyric) {
            return {
              lyric: parsed.lyric,
              model: "grok-3",
              songSection
            };
          }
        } catch (parseError) {
          secureLog.error('Failed to parse AI response:', parseError);
        }
      }
      
      return null;
    } catch (error) {
      secureLog.error('OpenAI API call failed:', error);
      return null;
    }
  }

  /**
   * Get emotional tone for genre
   */
  private getEmotionalTone(genre: string): string {
    const toneMap: Record<string, string> = {
      rock: 'rebellious and passionate',
      pop: 'upbeat and romantic',
      country: 'heartfelt and nostalgic',
      'hip-hop': 'confident and authentic',
      indie: 'introspective and dreamy',
      folk: 'warm and storytelling',
      metal: 'intense and powerful',
      electronic: 'euphoric and transcendent',
      'jam band': 'exploratory and blissful'
    };
    
    return toneMap[genre] || 'expressive and emotional';
  }

  /**
   * Get energy level for genre
   */
  private getEnergyLevel(genre: string): string {
    const energyMap: Record<string, string> = {
      rock: 'high energy',
      pop: 'vibrant',
      country: 'moderate',
      'hip-hop': 'rhythmic',
      indie: 'mellow',
      folk: 'gentle',
      metal: 'explosive',
      electronic: 'pulsating',
      'jam band': 'flowing'
    };
    
    return energyMap[genre] || 'balanced';
  }

  /**
   * Get style descriptor for genre
   */
  private getStyleDescriptor(genre: string): string {
    const styleMap: Record<string, string> = {
      rock: 'electric and raw',
      pop: 'catchy and polished',
      country: 'honest and direct',
      'hip-hop': 'rhythmic and clever',
      indie: 'alternative and unique',
      folk: 'acoustic and natural',
      metal: 'aggressive and technical',
      electronic: 'synthetic and futuristic',
      'jam band': 'improvisational and psychedelic'
    };
    
    return styleMap[genre] || 'contemporary';
  }

  /**
   * Generate fallback lyric
   */
  generateFallback(genre?: string): LyricGenerationResult {
    const fallbackLyrics: Record<SongSection, Record<LengthType, string[]>> = {
      verse: {
        short: [
          "Every shadow tells a story that the light won't show",
          "These streets remember everything we tried to forget",
          "Time keeps moving but my heart stays still"
        ],
        medium: [
          "Chasing echoes down these empty halls\nWhere we used to dance until the morning calls",
          "The radio plays our song again tonight\nBut the melody feels different in this fading light"
        ],
        long: [
          "I've been walking through this city like a ghost\nSearching for the pieces of what I miss the most\nEvery corner holds a memory we made\nBut now they're just reminders of the price we paid"
        ],
        couplet: [
          "Stars align but we're worlds apart\nYou're the rhythm but I lost the heart"
        ]
      },
      chorus: {
        short: [
          "We're burning brighter than we ever have before",
          "This is our moment, this is what we came here for"
        ],
        medium: [
          "Turn it up, let the music play\nWe're alive and we're here to stay",
          "Hearts on fire, souls in flight\nWe're gonna own this endless night"
        ],
        long: [
          "We are the dreamers, the believers, the ones who never fall\nWe are the fighters, the survivors, standing ten feet tall\nNothing's gonna stop us now, we're breaking every wall\nThis is our anthem, hear us call"
        ],
        couplet: [
          "Love me like tomorrow doesn't exist\nKiss me like the first time that we kissed"
        ]
      },
      bridge: {
        short: [
          "Maybe we were meant to break before we bend",
          "Sometimes the beginning looks just like the end"
        ],
        medium: [
          "All the words we never said\nEcho through my sleepless head",
          "If I could turn back time tonight\nI'd hold you close and make it right"
        ],
        long: [
          "They say that time heals everything\nBut clocks keep ticking, phones don't ring\nI'm learning how to fly with broken wings\nFinding beauty in the pain it brings"
        ],
        couplet: [
          "Bridges burn but memories stay\nYou're forever just yesterday away"
        ]
      },
      'pre-chorus': {
        short: [
          "Can you feel it building in the air tonight?",
          "Something's changing, something's coming alive"
        ],
        medium: [
          "Heart beats faster, breath gets shallow\nOne more step into tomorrow"
        ],
        long: [
          "The tension's rising like a wave about to break\nEvery choice we make is one more chance we take\nThe moment's here, there's no more time to wait\nThis is our fate"
        ],
        couplet: [
          "Lightning strikes before the thunder calls\nWe're gonna rise before we fall"
        ]
      },
      outro: {
        short: [
          "And the story goes on...",
          "Until we meet again in another song"
        ],
        medium: [
          "Fade to black but the feeling remains\nSome things never change",
          "The music stops but the echo stays\nForever and always"
        ],
        long: [
          "So here's to all the moments that we'll never forget\nTo all the chances taken and the ones we haven't yet\nThe curtain falls but this isn't the end\nWe'll play it all again"
        ],
        couplet: [
          "Songs may end but love remains\nMelody in our veins"
        ]
      }
    };

    // Select random section and length if not in cache
    const sections = Object.keys(fallbackLyrics) as SongSection[];
    const section = sections[Math.floor(Math.random() * sections.length)];
    
    const lengths = Object.keys(fallbackLyrics[section]) as LengthType[];
    const length = lengths[Math.floor(Math.random() * lengths.length)];
    
    const sectionLyrics = fallbackLyrics[section][length];
    const selectedLyric = sectionLyrics[Math.floor(Math.random() * sectionLyrics.length)];

    return {
      lyric: selectedLyric,
      model: 'fallback',
      songSection: section
    };
  }
}