import OpenAI from "openai";
import { xaiRateLimiter, withRetry } from '../utils/rateLimiter';
import { DatamuseService } from './datamuseService';
import { lastfmService } from './lastfmService';
import { SpotifyService } from './spotifyService';
import { conceptNetService } from './conceptNetService';
import { poetryDbService } from './poetryDbService';
import { secureLog } from '../utils/secureLogger';

export class LyricStarterService {
  private openai: OpenAI | null = null;
  private datamuseService: DatamuseService;
  private spotifyService: SpotifyService;

  constructor() {
    // Initialize all API services
    this.datamuseService = new DatamuseService();
    this.spotifyService = new SpotifyService();
    
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

    // Get comprehensive context from all APIs for enhanced lyric generation
    const apiContext = await this.getComprehensiveAPIContext(genre);
    
    // Use Grok 2-1212 for enhanced quality and latest capabilities
    const model = "grok-2-1212";
    
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
            apiContext: {
              datamuse: {
                genreWords: apiContext.datamuse.genreWords,
                emotionalWords: apiContext.datamuse.emotionalWords,
                rhymeWords: apiContext.datamuse.rhymeWords,
                sensoryWords: apiContext.datamuse.sensoryWords
              },
              spotify: {
                genreArtists: apiContext.spotify.genreArtists,
                moodTracks: apiContext.spotify.moodTracks,
                audioFeatures: apiContext.spotify.audioFeatures
              },
              lastfm: {
                genreInfo: apiContext.lastfm.genreInfo,
                topArtists: apiContext.lastfm.topArtists,
                relatedGenres: apiContext.lastfm.relatedGenres
              },
              conceptnet: {
                genreConcepts: apiContext.conceptnet.genreConcepts,
                emotionalConcepts: apiContext.conceptnet.emotionalConcepts,
                culturalAssociations: apiContext.conceptnet.culturalAssociations
              },
              poetry: {
                poeticPhrases: apiContext.poetry.poeticPhrases,
                vocabulary: apiContext.poetry.vocabulary,
                imagery: apiContext.poetry.imagery,
                themes: apiContext.poetry.themes
              }
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
6. Use the rich API context provided:
   - Datamuse: Linguistic patterns and rhyme words for natural flow
   - Spotify: Real artist names and track titles for authentic vocabulary
   - Last.fm: Genre characteristics and cultural context
   - ConceptNet: Semantic associations for deeper meaning
   - Poetry: Classical poetic vocabulary, imagery, and themes for elevated language
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
        requestParams.frequency_penalty = 0.6; // Higher to avoid repetition
        requestParams.presence_penalty = 0.5; // Encourage diverse vocabulary

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
      secureLog.error(`Grok 3 model failed:`, error.message);
      // Fall through to fallback
    }

    // If Grok 3 fails, return fallback
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

  private async getComprehensiveAPIContext(genre?: string): Promise<{
    datamuse: {
      genreWords: string[];
      emotionalWords: string[];
      rhymeWords: string[];
      sensoryWords: string[];
    };
    spotify: {
      genreArtists: string[];
      moodTracks: string[];
      audioFeatures: any;
    };
    lastfm: {
      genreInfo: any;
      topArtists: string[];
      relatedGenres: string[];
    };
    conceptnet: {
      genreConcepts: string[];
      emotionalConcepts: string[];
      culturalAssociations: string[];
    };
    poetry: {
      poeticPhrases: string[];
      vocabulary: string[];
      imagery: string[];
      themes: string[];
    };
  }> {
    const context = {
      datamuse: {
        genreWords: [] as string[],
        emotionalWords: [] as string[],
        rhymeWords: [] as string[],
        sensoryWords: [] as string[]
      },
      spotify: {
        genreArtists: [] as string[],
        moodTracks: [] as string[],
        audioFeatures: null as any
      },
      lastfm: {
        genreInfo: null as any,
        topArtists: [] as string[],
        relatedGenres: [] as string[]
      },
      conceptnet: {
        genreConcepts: [] as string[],
        emotionalConcepts: [] as string[],
        culturalAssociations: [] as string[]
      },
      poetry: {
        poeticPhrases: [] as string[],
        vocabulary: [] as string[],
        imagery: [] as string[],
        themes: [] as string[]
      }
    };

    try {
      // Execute all API calls in parallel for better performance
      const apiPromises = [];

      // 1. Datamuse context (original implementation)
      apiPromises.push(this.fetchDatamuseContext(genre || 'contemporary', context));

      // 2. Spotify context for authentic music industry vocabulary
      if (genre) {
        apiPromises.push(this.fetchSpotifyContext(genre, context));
      }

      // 3. Last.fm context for genre intelligence
      if (genre) {
        apiPromises.push(this.fetchLastFmContext(genre, context));
      }

      // 4. ConceptNet context for semantic associations
      if (genre) {
        apiPromises.push(this.fetchConceptNetContext(genre, context));
      }

      // 5. PoetryDB context for classic poetic vocabulary and imagery
      apiPromises.push(this.fetchPoetryContext(genre, context));

      // Execute all API calls concurrently
      await Promise.allSettled(apiPromises);

      const totalWords = [
        ...context.datamuse.genreWords,
        ...context.datamuse.emotionalWords,
        ...context.datamuse.rhymeWords,
        ...context.datamuse.sensoryWords,
        ...context.spotify.genreArtists,
        ...context.spotify.moodTracks,
        ...context.lastfm.topArtists,
        ...context.lastfm.relatedGenres,
        ...context.conceptnet.genreConcepts,
        ...context.conceptnet.emotionalConcepts,
        ...context.conceptnet.culturalAssociations,
        ...context.poetry.vocabulary,
        ...context.poetry.imagery,
        ...context.poetry.themes
      ].filter(Boolean);

      secureLog.debug(`🎵 Comprehensive API context for ${genre || 'contemporary'}: ${totalWords.length} total vocabulary items from all APIs`);

    } catch (error) {
      secureLog.error('Error fetching comprehensive API context:', error);
    }

    return context;
  }

  // Helper method to fetch Datamuse context
  private async fetchDatamuseContext(genre: string, context: any): Promise<void> {
    try {
      const genreSeeds = this.getGenreSeedWords(genre);
      const emotionalSeeds = this.getEmotionalSeeds(genre);
      
      const primaryResults = await this.datamuseService.findWords({
        triggers: genreSeeds.slice(0, 2).join(','),
        topics: `${genre || 'music'} emotion lyrics`,
        maxResults: 40
      });
      
      const filteredPrimary = primaryResults
        .filter(w => this.isGoodLyricWord(w.word))
        .map(w => w.word);
      
      context.datamuse.genreWords = filteredPrimary.slice(0, 12);
      context.datamuse.emotionalWords = filteredPrimary.slice(12, 20);
      context.datamuse.sensoryWords = filteredPrimary.slice(20, 28);
      
      // Get rhyming words
      const rhymeSeeds = ['night', 'day', 'heart', 'love', 'time', 'life', 'dream'];
      const selectedRhyme = rhymeSeeds[Math.floor(Math.random() * rhymeSeeds.length)];
      const rhymeResults = await this.datamuseService.findWords({
        rhymesWith: selectedRhyme,
        maxResults: 15
      });
      
      context.datamuse.rhymeWords = rhymeResults
        .filter(w => this.isGoodLyricWord(w.word))
        .map(w => w.word)
        .slice(0, 10);
        
      secureLog.debug(`✅ Datamuse context: ${context.datamuse.genreWords.length + context.datamuse.emotionalWords.length + context.datamuse.rhymeWords.length} words fetched`);
    } catch (error) {
      secureLog.error('❌ Datamuse context fetch failed:', error);
    }
  }

  // Helper method to fetch Spotify context
  private async fetchSpotifyContext(genre: string, context: any): Promise<void> {
    try {
      if (await this.spotifyService.isAvailable()) {
        // Get genre-specific artists
        const genreArtists = await this.spotifyService.getGenreArtists(genre);
        context.spotify.genreArtists = genreArtists.slice(0, 10);
        
        // Get mood-based tracks for the genre
        const moodTracks = await this.spotifyService.getMoodTracks(genre);
        context.spotify.moodTracks = moodTracks.slice(0, 8);
        
        // Get audio features for genre characteristics
        context.spotify.audioFeatures = {
          genre: genre,
          characteristics: `${genre} music style traits`
        };
        
        secureLog.debug(`✅ Spotify context: ${context.spotify.genreArtists.length} artists, ${context.spotify.moodTracks.length} tracks`);
      }
    } catch (error) {
      secureLog.error('❌ Spotify context fetch failed:', error);
    }
  }

  // Helper method to fetch Last.fm context
  private async fetchLastFmContext(genre: string, context: any): Promise<void> {
    try {
      // Get genre vocabulary and intelligence
      const genreVocabulary = await lastfmService.getGenreVocabulary(genre);
      if (genreVocabulary) {
        context.lastfm.genreInfo = {
          description: `${genre} music genre characteristics`,
          confidence: genreVocabulary.confidence
        };
        
        context.lastfm.topArtists = genreVocabulary.descriptiveWords.slice(0, 8);
        context.lastfm.relatedGenres = genreVocabulary.relatedGenres.slice(0, 5);
        
        secureLog.debug(`✅ Last.fm context: ${context.lastfm.topArtists.length} descriptive words, ${context.lastfm.relatedGenres.length} related genres`);
      }
    } catch (error) {
      secureLog.error('❌ Last.fm context fetch failed:', error);
    }
  }

  // Helper method to fetch ConceptNet context
  private async fetchConceptNetContext(genre: string, context: any): Promise<void> {
    try {
      // Get genre-specific conceptual associations
      const genreConcepts = await conceptNetService.getGenreAssociations(genre);
      context.conceptnet.genreConcepts = genreConcepts.slice(0, 10);
      
      // Get emotional associations for the genre
      const emotionalConcepts = await conceptNetService.getEmotionalAssociations(genre);
      context.conceptnet.emotionalConcepts = emotionalConcepts.slice(0, 8);
      
      // Get cultural associations
      const culturalAssociations = await conceptNetService.getCulturalConnections(genre);
      context.conceptnet.culturalAssociations = culturalAssociations.slice(0, 6);
      
      secureLog.debug(`✅ ConceptNet context: ${context.conceptnet.genreConcepts.length} concepts, ${context.conceptnet.emotionalConcepts.length} emotions`);
    } catch (error) {
      secureLog.error('❌ ConceptNet context fetch failed:', error);
    }
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

  private async fetchPoetryContext(genre: string | undefined, context: any): Promise<void> {
    try {
      const poetryContext = await poetryDbService.getPoetryContext(genre);
      
      // Add poetry context to the overall context
      context.poetry.poeticPhrases = poetryContext.poeticPhrases;
      context.poetry.vocabulary = poetryContext.vocabulary;
      context.poetry.imagery = poetryContext.imagery;
      context.poetry.themes = poetryContext.themes;
      
      secureLog.debug(`🎭 Poetry context for ${genre || 'general'}: ${poetryContext.poeticPhrases.length} phrases, ${poetryContext.vocabulary.length} words`);
    } catch (error) {
      secureLog.error('Error fetching poetry context:', error);
      // Continue without poetry context on error
    }
  }
}