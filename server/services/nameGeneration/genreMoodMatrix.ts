/**
 * Genre-Mood Matrix for Enhanced Contextual Name Generation
 * Provides weighted vocabulary and patterns based on genre-mood combinations
 */

import { secureLog } from '../../utils/secureLogger';

// Define mood categories with their characteristics
export type MoodCategory = 'energetic' | 'dark' | 'melancholic' | 'uplifting' | 'chill' | 'aggressive' | 'romantic' | 'mysterious' | 'playful' | 'none';
export type GenreCategory = 'rock' | 'indie' | 'electronic' | 'hiphop' | 'pop' | 'metal' | 'folk' | 'jazz' | 'country' | 'punk' | 'jam band' | 'classical' | 'rnb' | 'general';

interface VocabularyWeight {
  words: string[];
  weight: number; // 0-1, higher means more likely to be used
  priority: 'critical' | 'important' | 'optional';
}

interface MoodModifier {
  adjectives: VocabularyWeight;
  verbs: VocabularyWeight;
  nouns: VocabularyWeight;
  prefixes: VocabularyWeight;
  suffixes: VocabularyWeight;
  avoidWords: string[]; // Words to specifically avoid for this mood
  preferredPatterns: string[]; // Pattern IDs to prefer
  temperature: number; // AI temperature adjustment (-0.2 to 0.2)
}

interface GenreProfile {
  baseVocabulary: {
    core: VocabularyWeight;
    secondary: VocabularyWeight;
    cultural: VocabularyWeight;
  };
  subGenres: Map<string, VocabularyWeight>;
  eraVariations: Map<string, VocabularyWeight>; // '70s', '80s', '90s', '00s', '10s', '20s'
  regionalVariations: Map<string, VocabularyWeight>; // 'us', 'uk', 'latin', 'asian', 'african'
  moodModifiers: Map<MoodCategory, MoodModifier>;
}

export class GenreMoodMatrix {
  private genreProfiles: Map<GenreCategory, GenreProfile>;
  
  constructor() {
    this.genreProfiles = this.initializeGenreProfiles();
  }
  
  private initializeGenreProfiles(): Map<GenreCategory, GenreProfile> {
    const profiles = new Map<GenreCategory, GenreProfile>();
    
    // Rock Genre Profile
    profiles.set('rock', {
      baseVocabulary: {
        core: {
          words: ['thunder', 'stone', 'electric', 'rebel', 'storm', 'steel', 'iron', 'fire', 'highway', 'machine'],
          weight: 0.9,
          priority: 'critical'
        },
        secondary: {
          words: ['dust', 'chrome', 'leather', 'gasoline', 'asphalt', 'concrete', 'rust', 'smoke'],
          weight: 0.6,
          priority: 'important'
        },
        cultural: {
          words: ['revolution', 'freedom', 'youth', 'riot', 'anthem', 'legend', 'hero', 'outlaw'],
          weight: 0.4,
          priority: 'optional'
        }
      },
      subGenres: new Map([
        ['classic rock', { words: ['zeppelin', 'sabbath', 'purple', 'cream', 'floyd'], weight: 0.7, priority: 'important' }],
        ['indie rock', { words: ['velvet', 'copper', 'vinyl', 'analog', 'static'], weight: 0.7, priority: 'important' }],
        ['progressive rock', { words: ['odyssey', 'genesis', 'crimson', 'yes', 'rush'], weight: 0.7, priority: 'important' }],
        ['alternative rock', { words: ['radio', 'sonic', 'smashing', 'pearl', 'garden'], weight: 0.7, priority: 'important' }]
      ]),
      eraVariations: new Map([
        ['70s', { words: ['boogie', 'magic', 'cosmic', 'rainbow', 'journey'], weight: 0.5, priority: 'optional' }],
        ['80s', { words: ['neon', 'laser', 'power', 'danger', 'night'], weight: 0.5, priority: 'optional' }],
        ['90s', { words: ['grunge', 'rage', 'machine', 'tool', 'korn'], weight: 0.5, priority: 'optional' }],
        ['00s', { words: ['killers', 'strokes', 'chemical', 'linkin', 'nickel'], weight: 0.5, priority: 'optional' }]
      ]),
      regionalVariations: new Map([
        ['us', { words: ['american', 'highway', 'desert', 'canyon', 'frontier'], weight: 0.3, priority: 'optional' }],
        ['uk', { words: ['british', 'london', 'manchester', 'liverpool', 'sheffield'], weight: 0.3, priority: 'optional' }]
      ]),
      moodModifiers: new Map([
        ['energetic', {
          adjectives: { words: ['blazing', 'explosive', 'roaring', 'wild'], weight: 0.8, priority: 'important' },
          verbs: { words: ['ignite', 'explode', 'thunder', 'blast'], weight: 0.7, priority: 'important' },
          nouns: { words: ['fury', 'rampage', 'blitz', 'surge'], weight: 0.6, priority: 'important' },
          prefixes: { words: ['mega', 'ultra', 'hyper', 'super'], weight: 0.4, priority: 'optional' },
          suffixes: { words: ['storm', 'blast', 'rage', 'fire'], weight: 0.4, priority: 'optional' },
          avoidWords: ['gentle', 'soft', 'quiet', 'calm', 'peaceful'],
          preferredPatterns: ['power_compound', 'action_noun', 'explosive_phrase'],
          temperature: 0.1
        }],
        ['dark', {
          adjectives: { words: ['black', 'shadow', 'midnight', 'grim'], weight: 0.8, priority: 'important' },
          verbs: { words: ['haunt', 'lurk', 'creep', 'doom'], weight: 0.7, priority: 'important' },
          nouns: { words: ['abyss', 'void', 'tomb', 'curse'], weight: 0.6, priority: 'important' },
          prefixes: { words: ['dark', 'shadow', 'night', 'dead'], weight: 0.4, priority: 'optional' },
          suffixes: { words: ['death', 'doom', 'grave', 'skull'], weight: 0.4, priority: 'optional' },
          avoidWords: ['bright', 'happy', 'joy', 'sun', 'light'],
          preferredPatterns: ['dark_imagery', 'gothic_compound', 'ominous_phrase'],
          temperature: -0.1
        }]
      ])
    });
    
    // Electronic Genre Profile
    profiles.set('electronic', {
      baseVocabulary: {
        core: {
          words: ['synth', 'wave', 'pulse', 'circuit', 'digital', 'cyber', 'neon', 'laser', 'matrix', 'code'],
          weight: 0.9,
          priority: 'critical'
        },
        secondary: {
          words: ['pixel', 'glitch', 'binary', 'quantum', 'hologram', 'voltage', 'frequency', 'modular'],
          weight: 0.6,
          priority: 'important'
        },
        cultural: {
          words: ['future', 'tomorrow', 'virtual', 'artificial', 'synthetic', 'android', 'cyborg', 'algorithm'],
          weight: 0.4,
          priority: 'optional'
        }
      },
      subGenres: new Map([
        ['synthwave', { words: ['retro', 'outrun', 'miami', 'sunset', 'chrome'], weight: 0.7, priority: 'important' }],
        ['techno', { words: ['detroit', 'berlin', 'acid', 'warehouse', 'underground'], weight: 0.7, priority: 'important' }],
        ['dubstep', { words: ['bass', 'wobble', 'drop', 'skrill', 'burial'], weight: 0.7, priority: 'important' }],
        ['ambient', { words: ['space', 'drift', 'float', 'ethereal', 'cosmos'], weight: 0.7, priority: 'important' }]
      ]),
      eraVariations: new Map([
        ['80s', { words: ['depeche', 'kraftwerk', 'new wave', 'synth pop'], weight: 0.5, priority: 'optional' }],
        ['90s', { words: ['rave', 'trance', 'jungle', 'breakbeat', 'hardcore'], weight: 0.5, priority: 'optional' }],
        ['00s', { words: ['electro', 'blog house', 'minimal', 'fidget'], weight: 0.5, priority: 'optional' }],
        ['10s', { words: ['trap', 'future bass', 'riddim', 'vaporwave'], weight: 0.5, priority: 'optional' }]
      ]),
      regionalVariations: new Map([
        ['detroit', { words: ['motor', 'techno', 'underground', 'warehouse'], weight: 0.3, priority: 'optional' }],
        ['berlin', { words: ['minimal', 'dark', 'industrial', 'bunker'], weight: 0.3, priority: 'optional' }]
      ]),
      moodModifiers: new Map([
        ['energetic', {
          adjectives: { words: ['electric', 'kinetic', 'dynamic', 'turbo'], weight: 0.8, priority: 'important' },
          verbs: { words: ['surge', 'pulse', 'oscillate', 'transmit'], weight: 0.7, priority: 'important' },
          nouns: { words: ['voltage', 'current', 'energy', 'power'], weight: 0.6, priority: 'important' },
          prefixes: { words: ['hyper', 'mega', 'ultra', 'neo'], weight: 0.4, priority: 'optional' },
          suffixes: { words: ['wave', 'tron', 'tech', 'core'], weight: 0.4, priority: 'optional' },
          avoidWords: ['acoustic', 'organic', 'natural', 'analog'],
          preferredPatterns: ['tech_compound', 'cyber_phrase', 'digital_fusion'],
          temperature: 0.15
        }],
        ['chill', {
          adjectives: { words: ['ambient', 'liquid', 'smooth', 'soft'], weight: 0.8, priority: 'important' },
          verbs: { words: ['drift', 'float', 'glide', 'flow'], weight: 0.7, priority: 'important' },
          nouns: { words: ['dream', 'cloud', 'mist', 'echo'], weight: 0.6, priority: 'important' },
          prefixes: { words: ['deep', 'slow', 'soft', 'mellow'], weight: 0.4, priority: 'optional' },
          suffixes: { words: ['scape', 'field', 'space', 'world'], weight: 0.4, priority: 'optional' },
          avoidWords: ['harsh', 'aggressive', 'loud', 'intense'],
          preferredPatterns: ['ambient_flow', 'dreamy_compound', 'ethereal_phrase'],
          temperature: -0.15
        }]
      ])
    });
    
    // Indie Genre Profile
    profiles.set('indie', {
      baseVocabulary: {
        core: {
          words: ['velvet', 'copper', 'canvas', 'vinyl', 'echo', 'hollow', 'paper', 'glass', 'mirror', 'dust'],
          weight: 0.9,
          priority: 'critical'
        },
        secondary: {
          words: ['attic', 'basement', 'garage', 'bedroom', 'bicycle', 'telescope', 'typewriter', 'cassette'],
          weight: 0.6,
          priority: 'important'
        },
        cultural: {
          words: ['youth', 'nostalgia', 'summer', 'autumn', 'melancholy', 'wanderlust', 'daydream', 'suburbs'],
          weight: 0.4,
          priority: 'optional'
        }
      },
      subGenres: new Map([
        ['indie pop', { words: ['bubblegum', 'sunshine', 'rainbow', 'candy', 'sparkle'], weight: 0.7, priority: 'important' }],
        ['indie folk', { words: ['fleet', 'foxes', 'mountain', 'river', 'iron'], weight: 0.7, priority: 'important' }],
        ['indie rock', { words: ['arcade', 'modest', 'neutral', 'milk', 'hotel'], weight: 0.7, priority: 'important' }],
        ['dream pop', { words: ['beach', 'cocteau', 'twins', 'mazzy', 'star'], weight: 0.7, priority: 'important' }]
      ]),
      eraVariations: new Map([
        ['00s', { words: ['strokes', 'yeah', 'bloc', 'party', 'interpol'], weight: 0.5, priority: 'optional' }],
        ['10s', { words: ['vampire', 'weekend', 'foster', 'people', 'mumford'], weight: 0.5, priority: 'optional' }],
        ['20s', { words: ['bedroom', 'lo-fi', 'diy', 'spotify', 'tiktok'], weight: 0.5, priority: 'optional' }]
      ]),
      regionalVariations: new Map([
        ['brooklyn', { words: ['williamsburg', 'bushwick', 'greenpoint', 'bedstuy'], weight: 0.3, priority: 'optional' }],
        ['portland', { words: ['pacific', 'northwest', 'coffee', 'rain', 'forest'], weight: 0.3, priority: 'optional' }]
      ]),
      moodModifiers: new Map([
        ['melancholic', {
          adjectives: { words: ['lonely', 'distant', 'fading', 'quiet'], weight: 0.8, priority: 'important' },
          verbs: { words: ['drift', 'wander', 'fade', 'linger'], weight: 0.7, priority: 'important' },
          nouns: { words: ['autumn', 'shadow', 'memory', 'ghost'], weight: 0.6, priority: 'important' },
          prefixes: { words: ['sad', 'lost', 'forgotten', 'old'], weight: 0.4, priority: 'optional' },
          suffixes: { words: ['less', 'ward', 'wise', 'bound'], weight: 0.4, priority: 'optional' },
          avoidWords: ['party', 'fun', 'excited', 'energy'],
          preferredPatterns: ['melancholic_imagery', 'nostalgic_compound', 'wistful_phrase'],
          temperature: -0.1
        }],
        ['playful', {
          adjectives: { words: ['quirky', 'whimsical', 'bouncy', 'silly'], weight: 0.8, priority: 'important' },
          verbs: { words: ['skip', 'hop', 'bounce', 'giggle'], weight: 0.7, priority: 'important' },
          nouns: { words: ['bubble', 'rainbow', 'pickle', 'banana'], weight: 0.6, priority: 'important' },
          prefixes: { words: ['super', 'mega', 'mini', 'micro'], weight: 0.4, priority: 'optional' },
          suffixes: { words: ['pop', 'hop', 'bop', 'matic'], weight: 0.4, priority: 'optional' },
          avoidWords: ['serious', 'dark', 'heavy', 'grim'],
          preferredPatterns: ['playful_alliteration', 'quirky_compound', 'whimsical_phrase'],
          temperature: 0.2
        }]
      ])
    });
    
    // Hip-Hop Genre Profile
    profiles.set('hiphop', {
      baseVocabulary: {
        core: {
          words: ['flow', 'beat', 'rhythm', 'verse', 'rhyme', 'cipher', 'mic', 'turntable', 'scratch', 'boom'],
          weight: 0.9,
          priority: 'critical'
        },
        secondary: {
          words: ['block', 'street', 'hood', 'corner', 'bodega', 'stoop', 'subway', 'graffiti'],
          weight: 0.6,
          priority: 'important'
        },
        cultural: {
          words: ['culture', 'movement', 'revolution', 'message', 'truth', 'real', 'authentic', 'underground'],
          weight: 0.4,
          priority: 'optional'
        }
      },
      subGenres: new Map([
        ['boom bap', { words: ['golden', 'era', 'classic', 'old school', 'breaks'], weight: 0.7, priority: 'important' }],
        ['trap', { words: ['atlanta', 'bass', '808', 'hi-hat', 'drip'], weight: 0.7, priority: 'important' }],
        ['conscious', { words: ['knowledge', 'wisdom', 'truth', 'message', 'uplift'], weight: 0.7, priority: 'important' }],
        ['experimental', { words: ['abstract', 'jazz', 'fusion', 'psychedelic', 'avant'], weight: 0.7, priority: 'important' }]
      ]),
      eraVariations: new Map([
        ['80s', { words: ['fresh', 'def', 'fly', 'dope', 'word'], weight: 0.5, priority: 'optional' }],
        ['90s', { words: ['phat', 'ill', 'tight', 'represent', 'peace'], weight: 0.5, priority: 'optional' }],
        ['00s', { words: ['crunk', 'hyphy', 'snap', 'ringtone', 'blog'], weight: 0.5, priority: 'optional' }],
        ['10s', { words: ['soundcloud', 'mumble', 'trap', 'drill', 'wave'], weight: 0.5, priority: 'optional' }]
      ]),
      regionalVariations: new Map([
        ['nyc', { words: ['bronx', 'brooklyn', 'queens', 'harlem', 'manhattan'], weight: 0.3, priority: 'optional' }],
        ['atlanta', { words: ['south', 'dirty', 'trap', 'magic', 'zone'], weight: 0.3, priority: 'optional' }],
        ['la', { words: ['west', 'coast', 'cali', 'lowrider', 'chronic'], weight: 0.3, priority: 'optional' }]
      ]),
      moodModifiers: new Map([
        ['aggressive', {
          adjectives: { words: ['hard', 'raw', 'gritty', 'savage'], weight: 0.8, priority: 'important' },
          verbs: { words: ['bust', 'break', 'smash', 'wreck'], weight: 0.7, priority: 'important' },
          nouns: { words: ['fury', 'force', 'power', 'impact'], weight: 0.6, priority: 'important' },
          prefixes: { words: ['hard', 'real', 'true', 'raw'], weight: 0.4, priority: 'optional' },
          suffixes: { words: ['gang', 'mob', 'crew', 'squad'], weight: 0.4, priority: 'optional' },
          avoidWords: ['soft', 'gentle', 'sweet', 'mellow'],
          preferredPatterns: ['street_compound', 'power_phrase', 'impact_word'],
          temperature: 0.1
        }],
        ['uplifting', {
          adjectives: { words: ['positive', 'bright', 'golden', 'blessed'], weight: 0.8, priority: 'important' },
          verbs: { words: ['rise', 'elevate', 'uplift', 'inspire'], weight: 0.7, priority: 'important' },
          nouns: { words: ['hope', 'dream', 'vision', 'future'], weight: 0.6, priority: 'important' },
          prefixes: { words: ['up', 'high', 'bright', 'good'], weight: 0.4, priority: 'optional' },
          suffixes: { words: ['nation', 'tribe', 'family', 'collective'], weight: 0.4, priority: 'optional' },
          avoidWords: ['negative', 'dark', 'down', 'low'],
          preferredPatterns: ['positive_compound', 'uplifting_phrase', 'inspirational_word'],
          temperature: 0.0
        }]
      ])
    });
    
    // Add more genre profiles as needed...
    
    // General/fallback profile
    profiles.set('general', {
      baseVocabulary: {
        core: {
          words: ['music', 'sound', 'rhythm', 'melody', 'harmony', 'beat', 'song', 'tune', 'note', 'chord'],
          weight: 0.5,
          priority: 'critical'
        },
        secondary: {
          words: ['dream', 'star', 'moon', 'sun', 'sky', 'ocean', 'mountain', 'forest'],
          weight: 0.4,
          priority: 'important'
        },
        cultural: {
          words: ['love', 'life', 'time', 'space', 'soul', 'heart', 'mind', 'spirit'],
          weight: 0.3,
          priority: 'optional'
        }
      },
      subGenres: new Map(),
      eraVariations: new Map(),
      regionalVariations: new Map(),
      moodModifiers: new Map([
        ['none', {
          adjectives: { words: [], weight: 0, priority: 'optional' },
          verbs: { words: [], weight: 0, priority: 'optional' },
          nouns: { words: [], weight: 0, priority: 'optional' },
          prefixes: { words: [], weight: 0, priority: 'optional' },
          suffixes: { words: [], weight: 0, priority: 'optional' },
          avoidWords: [],
          preferredPatterns: [],
          temperature: 0
        }]
      ])
    });
    
    return profiles;
  }
  
  /**
   * Get weighted vocabulary for a specific genre-mood combination
   */
  public getWeightedVocabulary(
    genre: GenreCategory,
    mood: MoodCategory,
    subGenre?: string,
    era?: string,
    region?: string
  ): {
    primary: string[],
    secondary: string[],
    avoid: string[],
    patterns: string[],
    temperature: number
  } {
    const genreProfile = this.genreProfiles.get(genre) || this.genreProfiles.get('general')!;
    
    // Start with base vocabulary
    let primary: string[] = [...genreProfile.baseVocabulary.core.words];
    let secondary: string[] = [...genreProfile.baseVocabulary.secondary.words];
    const avoid: string[] = [];
    let patterns: string[] = [];
    let temperature = 0;
    
    // Add sub-genre vocabulary if specified
    if (subGenre && genreProfile.subGenres.has(subGenre)) {
      const subGenreVocab = genreProfile.subGenres.get(subGenre)!;
      if (subGenreVocab.weight > 0.5) {
        primary.push(...subGenreVocab.words);
      } else {
        secondary.push(...subGenreVocab.words);
      }
    }
    
    // Add era-specific vocabulary
    if (era && genreProfile.eraVariations.has(era)) {
      const eraVocab = genreProfile.eraVariations.get(era)!;
      secondary.push(...eraVocab.words);
    }
    
    // Add regional vocabulary
    if (region && genreProfile.regionalVariations.has(region)) {
      const regionalVocab = genreProfile.regionalVariations.get(region)!;
      secondary.push(...regionalVocab.words);
    }
    
    // Apply mood modifiers
    if (mood !== 'none' && genreProfile.moodModifiers.has(mood)) {
      const moodMod = genreProfile.moodModifiers.get(mood)!;
      
      // Add mood-specific vocabulary with priority weighting
      if (moodMod.adjectives.weight > 0.7) {
        primary.push(...moodMod.adjectives.words);
      } else {
        secondary.push(...moodMod.adjectives.words);
      }
      
      if (moodMod.verbs.weight > 0.7) {
        primary.push(...moodMod.verbs.words);
      } else {
        secondary.push(...moodMod.verbs.words);
      }
      
      secondary.push(...moodMod.nouns.words);
      secondary.push(...moodMod.prefixes.words);
      secondary.push(...moodMod.suffixes.words);
      
      avoid.push(...moodMod.avoidWords);
      patterns = moodMod.preferredPatterns;
      temperature = moodMod.temperature;
    }
    
    // Remove duplicates
    primary = [...new Set(primary)];
    secondary = [...new Set(secondary)];
    
    secureLog.debug(`Genre-Mood Matrix: ${genre}/${mood} - Primary: ${primary.length}, Secondary: ${secondary.length}, Avoid: ${avoid.length}`);
    
    return { primary, secondary, avoid, patterns, temperature };
  }
  
  /**
   * Calculate relevance score for a given word based on genre-mood context
   */
  public calculateRelevanceScore(
    word: string,
    genre: GenreCategory,
    mood: MoodCategory,
    source: 'api' | 'generated' | 'static'
  ): number {
    const vocabulary = this.getWeightedVocabulary(genre, mood);
    const lowerWord = word.toLowerCase();
    
    // Check if word should be avoided
    if (vocabulary.avoid.includes(lowerWord)) {
      return 0;
    }
    
    // Primary vocabulary gets highest score
    if (vocabulary.primary.includes(lowerWord)) {
      return source === 'api' ? 0.95 : 0.85;
    }
    
    // Secondary vocabulary gets medium score
    if (vocabulary.secondary.includes(lowerWord)) {
      return source === 'api' ? 0.75 : 0.65;
    }
    
    // Unknown words get base score weighted by source
    switch (source) {
      case 'api': return 0.5;
      case 'generated': return 0.3;
      case 'static': return 0.2;
      default: return 0.1;
    }
  }
  
  /**
   * Get suggested patterns for a genre-mood combination
   */
  public getSuggestedPatterns(genre: GenreCategory, mood: MoodCategory): string[] {
    const genreProfile = this.genreProfiles.get(genre);
    if (!genreProfile) return [];
    
    const moodModifier = genreProfile.moodModifiers.get(mood);
    return moodModifier?.preferredPatterns || [];
  }
  
  /**
   * Get temperature adjustment for AI generation
   */
  public getTemperatureAdjustment(genre: GenreCategory, mood: MoodCategory): number {
    const genreProfile = this.genreProfiles.get(genre);
    if (!genreProfile) return 0;
    
    const moodModifier = genreProfile.moodModifiers.get(mood);
    return moodModifier?.temperature || 0;
  }
}

// Export singleton instance
export const genreMoodMatrix = new GenreMoodMatrix();