/**
 * Vocabulary Fusion System - Intelligent terminology blending for cross-genre name generation
 * Merges genre-specific vocabulary and concepts to create hybrid naming possibilities
 */

import { GenreType, genreCompatibilityMatrix, FusionRule } from './genreCompatibilityMatrix';
import { genreMoodMatrix, GenreCategory, MoodCategory } from './genreMoodMatrix';
import { EnhancedWordSource } from './types';
import { getRandomWord, capitalize } from './stringUtils';
import { secureLog } from '../../utils/secureLogger';

// Fusion vocabulary strategies
export type VocabularyStrategy = 'merge' | 'alternate' | 'dominant' | 'synthesize' | 'layer';

export interface FusedVocabulary {
  primaryWords: string[];
  secondaryWords: string[];
  hybridTerms: string[];
  conceptualBlends: string[];
  culturalFusions: string[];
  avoidWords: string[];
  fusionMetadata: {
    strategy: VocabularyStrategy;
    dominantGenre: GenreType;
    blendRatio: [number, number];
    compatibilityScore: number;
    creativityLevel: number;
  };
}

export interface VocabularyBlendRule {
  name: string;
  sourceGenres: [GenreType, GenreType];
  blendStrategy: VocabularyStrategy;
  weightDistribution: [number, number];
  conceptualBridges: string[];
  hybridPrefixes: string[];
  hybridSuffixes: string[];
  fusionPatterns: string[];
  examples: string[];
}

export interface GenreVocabularyProfile {
  coreTerms: string[];
  instrumentalTerms: string[];
  culturalTerms: string[];
  emotionalTerms: string[];
  technicalTerms: string[];
  metaphoricalTerms: string[];
  eraSpecificTerms: string[];
  regionalTerms: string[];
  intensityModifiers: string[];
  characteristicAdjectives: string[];
}

export class VocabularyFusionSystem {
  // Genre-specific vocabulary profiles
  private genreVocabularies: Map<GenreType, GenreVocabularyProfile> = new Map();
  
  // Predefined blend rules for specific combinations
  private blendRules: Map<string, VocabularyBlendRule> = new Map();
  
  // Hybrid term generation patterns
  private hybridPatterns: Map<string, string[]> = new Map();
  
  // Conceptual bridges between genres
  private conceptualBridges: Map<string, string[]> = new Map();

  constructor() {
    this.initializeGenreVocabularies();
    this.initializeBlendRules();
    this.initializeHybridPatterns();
    this.initializeConceptualBridges();
    secureLog.info('Vocabulary Fusion System initialized with comprehensive genre vocabularies');
  }

  /**
   * Initialize comprehensive vocabulary profiles for each genre
   */
  private initializeGenreVocabularies() {
    // Electronic genre vocabulary
    this.genreVocabularies.set('electronic', {
      coreTerms: ['synth', 'digital', 'electronic', 'cyber', 'techno', 'pulse', 'wave', 'circuit', 'voltage', 'frequency'],
      instrumentalTerms: ['synthesizer', 'sequencer', 'sampler', 'drum machine', 'vocoder', 'filters', 'oscillators'],
      culturalTerms: ['futuristic', 'technological', 'artificial', 'virtual', 'synthetic', 'automated', 'programmed'],
      emotionalTerms: ['hypnotic', 'transcendent', 'euphoric', 'robotic', 'cold', 'ethereal', 'psychedelic'],
      technicalTerms: ['bpm', 'waveform', 'modulation', 'distortion', 'compression', 'reverb', 'delay'],
      metaphoricalTerms: ['machine', 'robot', 'android', 'digital soul', 'electronic dreams', 'cyber heart'],
      eraSpecificTerms: ['retro', 'vintage', 'modern', 'neo', 'post', 'future', '80s', '90s'],
      regionalTerms: ['detroit', 'berlin', 'chicago', 'uk', 'european', 'american'],
      intensityModifiers: ['hard', 'soft', 'deep', 'minimal', 'maximal', 'progressive', 'ambient'],
      characteristicAdjectives: ['pulsing', 'rhythmic', 'synthetic', 'processed', 'filtered', 'compressed', 'layered']
    });

    // Rock genre vocabulary
    this.genreVocabularies.set('rock', {
      coreTerms: ['rock', 'stone', 'thunder', 'electric', 'power', 'energy', 'storm', 'fire', 'steel', 'iron'],
      instrumentalTerms: ['guitar', 'drums', 'bass', 'amplifier', 'distortion', 'feedback', 'power chord'],
      culturalTerms: ['rebellion', 'freedom', 'youth', 'revolution', 'anthem', 'legend', 'hero', 'outlaw'],
      emotionalTerms: ['passionate', 'aggressive', 'energetic', 'raw', 'intense', 'powerful', 'explosive'],
      technicalTerms: ['riff', 'solo', 'chord', 'progression', 'tempo', 'rhythm', 'beat'],
      metaphoricalTerms: ['highway', 'machine', 'engine', 'locomotive', 'thunder storm', 'wildfire'],
      eraSpecificTerms: ['classic', 'vintage', 'modern', 'new', 'old school', 'progressive', 'alternative'],
      regionalTerms: ['american', 'british', 'southern', 'midwest', 'west coast', 'arena', 'stadium'],
      intensityModifiers: ['hard', 'soft', 'heavy', 'light', 'classic', 'modern', 'progressive'],
      characteristicAdjectives: ['driving', 'pounding', 'soaring', 'crushing', 'blazing', 'thunderous', 'electrifying']
    });

    // Jazz genre vocabulary
    this.genreVocabularies.set('jazz', {
      coreTerms: ['jazz', 'swing', 'bebop', 'fusion', 'improvisation', 'sophistication', 'harmony', 'rhythm'],
      instrumentalTerms: ['saxophone', 'trumpet', 'piano', 'bass', 'drums', 'vibes', 'muted', 'brass'],
      culturalTerms: ['sophisticated', 'artistic', 'intellectual', 'cultured', 'refined', 'elegant', 'classy'],
      emotionalTerms: ['smooth', 'cool', 'hot', 'mellow', 'complex', 'nuanced', 'expressive', 'soulful'],
      technicalTerms: ['improvisation', 'chord changes', 'modulation', 'syncopation', 'polyrhythm', 'blue notes'],
      metaphoricalTerms: ['conversation', 'dialogue', 'story', 'journey', 'exploration', 'adventure'],
      eraSpecificTerms: ['traditional', 'modern', 'contemporary', 'classic', 'vintage', 'post-bop', 'neo'],
      regionalTerms: ['new york', 'new orleans', 'chicago', 'west coast', 'european', 'latin'],
      intensityModifiers: ['smooth', 'hard', 'soft', 'free', 'straight ahead', 'fusion', 'contemporary'],
      characteristicAdjectives: ['swinging', 'flowing', 'sophisticated', 'complex', 'improvised', 'harmonic', 'melodic']
    });

    // Hip-hop genre vocabulary
    this.genreVocabularies.set('hip-hop', {
      coreTerms: ['hip-hop', 'rap', 'flow', 'beats', 'rhythm', 'groove', 'cipher', 'culture', 'movement'],
      instrumentalTerms: ['turntables', 'sampler', 'mic', 'beats', 'bass', 'drums', 'scratch', 'loop'],
      culturalTerms: ['street', 'urban', 'real', 'authentic', 'underground', 'conscious', 'message', 'truth'],
      emotionalTerms: ['raw', 'honest', 'passionate', 'aggressive', 'smooth', 'chill', 'hard', 'soft'],
      technicalTerms: ['sampling', 'loops', 'breaks', 'scratching', 'mixing', 'beatboxing', 'freestyle'],
      metaphoricalTerms: ['battle', 'cypher', 'kingdom', 'empire', 'nation', 'tribe', 'collective', 'crew'],
      eraSpecificTerms: ['old school', 'new school', 'golden era', 'modern', 'contemporary', 'classic'],
      regionalTerms: ['east coast', 'west coast', 'south', 'midwest', 'atlanta', 'new york', 'la', 'chicago'],
      intensityModifiers: ['hard', 'soft', 'smooth', 'rough', 'clean', 'dirty', 'conscious', 'gangsta'],
      characteristicAdjectives: ['flowing', 'rhythmic', 'percussive', 'lyrical', 'melodic', 'harmonic', 'dynamic']
    });

    // Folk genre vocabulary
    this.genreVocabularies.set('folk', {
      coreTerms: ['folk', 'traditional', 'acoustic', 'storytelling', 'heritage', 'roots', 'culture', 'community'],
      instrumentalTerms: ['acoustic guitar', 'banjo', 'fiddle', 'harmonica', 'mandolin', 'dulcimer'],
      culturalTerms: ['traditional', 'heritage', 'ancestral', 'cultural', 'community', 'family', 'generational'],
      emotionalTerms: ['nostalgic', 'melancholy', 'peaceful', 'reflective', 'intimate', 'personal', 'heartfelt'],
      technicalTerms: ['fingerpicking', 'strumming', 'modal', 'pentatonic', 'ballad', 'narrative'],
      metaphoricalTerms: ['river', 'mountain', 'valley', 'forest', 'meadow', 'cottage', 'campfire', 'journey'],
      eraSpecificTerms: ['traditional', 'contemporary', 'modern', 'revival', 'neo', 'americana'],
      regionalTerms: ['american', 'irish', 'scottish', 'appalachian', 'celtic', 'country', 'rural'],
      intensityModifiers: ['gentle', 'soft', 'quiet', 'intimate', 'personal', 'traditional', 'contemporary'],
      characteristicAdjectives: ['acoustic', 'organic', 'natural', 'intimate', 'storytelling', 'melodic', 'harmonic']
    });

    // Classical genre vocabulary
    this.genreVocabularies.set('classical', {
      coreTerms: ['classical', 'orchestral', 'symphonic', 'chamber', 'opera', 'concerto', 'sonata', 'composition'],
      instrumentalTerms: ['orchestra', 'symphony', 'piano', 'violin', 'cello', 'flute', 'oboe', 'french horn'],
      culturalTerms: ['refined', 'sophisticated', 'elegant', 'formal', 'traditional', 'academic', 'artistic'],
      emotionalTerms: ['dramatic', 'romantic', 'passionate', 'melancholy', 'joyful', 'triumphant', 'peaceful'],
      technicalTerms: ['composition', 'orchestration', 'harmony', 'counterpoint', 'fugue', 'sonata form'],
      metaphoricalTerms: ['cathedral', 'palace', 'garden', 'landscape', 'journey', 'story', 'conversation'],
      eraSpecificTerms: ['baroque', 'classical', 'romantic', 'modern', 'contemporary', 'neo-classical'],
      regionalTerms: ['european', 'german', 'italian', 'french', 'russian', 'american', 'contemporary'],
      intensityModifiers: ['grand', 'intimate', 'dramatic', 'lyrical', 'virtuosic', 'contemplative', 'majestic'],
      characteristicAdjectives: ['orchestrated', 'harmonic', 'melodic', 'structured', 'formal', 'elegant', 'sophisticated']
    });

    // Add more genres as needed...
    secureLog.debug(`Initialized vocabularies for ${this.genreVocabularies.size} genres`);
  }

  /**
   * Initialize blend rules for specific genre combinations
   */
  private initializeBlendRules() {
    // Electronic + Jazz blend rule
    this.blendRules.set('electronic-jazz', {
      name: 'ElectroJazz Vocabulary Fusion',
      sourceGenres: ['electronic', 'jazz'],
      blendStrategy: 'synthesize',
      weightDistribution: [0.6, 0.4],
      conceptualBridges: ['improvisation', 'complexity', 'sophistication', 'modulation', 'harmony'],
      hybridPrefixes: ['electro', 'cyber', 'digital', 'neo', 'synthetic'],
      hybridSuffixes: ['jazz', 'swing', 'bebop', 'fusion', 'flow'],
      fusionPatterns: ['{electronic_term} {jazz_concept}', '{hybrid_prefix}{jazz_term}', 'Digital {jazz_technique}'],
      examples: ['Digital Bebop', 'Cyber Swing', 'Electronic Improvisation', 'Synthetic Jazz']
    });

    // Folk + Electronic blend rule  
    this.blendRules.set('folk-electronic', {
      name: 'TechnoFolk Vocabulary Fusion',
      sourceGenres: ['folk', 'electronic'],
      blendStrategy: 'alternate',
      weightDistribution: [0.5, 0.5],
      conceptualBridges: ['storytelling', 'tradition', 'culture', 'community', 'heritage', 'roots'],
      hybridPrefixes: ['digital', 'cyber', 'electronic', 'synthetic', 'virtual'],
      hybridSuffixes: ['folk', 'tales', 'stories', 'roots', 'heritage', 'tradition'],
      fusionPatterns: ['{electronic_term} {folk_concept}', '{folk_tradition} {electronic_modifier}', 'Digital {folk_instrument}'],
      examples: ['Digital Folk', 'Electronic Heritage', 'Cyber Ballad', 'Virtual Storytelling']
    });

    // Rock + Classical blend rule
    this.blendRules.set('rock-classical', {
      name: 'Symphonic Rock Vocabulary Fusion',
      sourceGenres: ['rock', 'classical'],
      blendStrategy: 'merge',
      weightDistribution: [0.55, 0.45],
      conceptualBridges: ['power', 'drama', 'intensity', 'composition', 'orchestration', 'dynamics'],
      hybridPrefixes: ['symphonic', 'orchestral', 'classical', 'neo', 'progressive'],
      hybridSuffixes: ['rock', 'symphony', 'concerto', 'opera', 'suite', 'movement'],
      fusionPatterns: ['{classical_form} {rock_energy}', 'Symphonic {rock_concept}', '{orchestral_term} {rock_power}'],
      examples: ['Symphonic Thunder', 'Orchestral Storm', 'Classical Power', 'Rock Symphony']
    });

    // Hip-hop + Jazz blend rule
    this.blendRules.set('hip-hop-jazz', {
      name: 'Jazz Hop Vocabulary Fusion', 
      sourceGenres: ['hip-hop', 'jazz'],
      blendStrategy: 'merge',
      weightDistribution: [0.5, 0.5],
      conceptualBridges: ['improvisation', 'rhythm', 'flow', 'expression', 'culture', 'artistry'],
      hybridPrefixes: ['jazz', 'smooth', 'neo', 'contemporary', 'fusion'],
      hybridSuffixes: ['hop', 'flow', 'beats', 'rhythm', 'groove', 'cipher'],
      fusionPatterns: ['{jazz_technique} {hip_hop_culture}', 'Jazz {hip_hop_element}', '{improvisation_concept} {hip_hop_flow}'],
      examples: ['Jazz Flow', 'Smooth Cipher', 'Bebop Beats', 'Fusion Hop']
    });

    secureLog.debug(`Initialized ${this.blendRules.size} blend rules for genre combinations`);
  }

  /**
   * Initialize hybrid pattern templates
   */
  private initializeHybridPatterns() {
    this.hybridPatterns.set('prefix_fusion', [
      '{genre1_prefix}{genre2_core}',
      '{hybrid_prefix}{genre2_term}', 
      'Neo{genre2_concept}',
      'Digital{genre1_tradition}'
    ]);

    this.hybridPatterns.set('conceptual_bridge', [
      '{genre1_concept} meets {genre2_concept}',
      '{bridge_concept} {genre1_term}',
      '{genre2_technique} {genre1_style}',
      'Cross{genre1_element}{genre2_element}'
    ]);

    this.hybridPatterns.set('cultural_synthesis', [
      '{genre1_culture} {genre2_artform}',
      '{hybrid_cultural_term}',
      '{genre1_tradition} {genre2_innovation}',
      'Fusion {combined_heritage}'
    ]);

    this.hybridPatterns.set('technical_blend', [
      '{genre1_technique} {genre2_approach}',
      '{combined_technical_term}',
      '{genre1_method} meets {genre2_method}',
      'Hybrid {technical_fusion}'
    ]);
  }

  /**
   * Initialize conceptual bridges between genres
   */
  private initializeConceptualBridges() {
    this.conceptualBridges.set('electronic-jazz', [
      'improvisation', 'modulation', 'complexity', 'sophistication', 'texture', 'layers',
      'harmonic progression', 'rhythmic variation', 'tonal exploration', 'artistic expression'
    ]);

    this.conceptualBridges.set('folk-electronic', [
      'storytelling', 'cultural narrative', 'traditional meets modern', 'heritage innovation',
      'organic meets synthetic', 'community connection', 'generational bridge', 'authentic expression'
    ]);

    this.conceptualBridges.set('rock-classical', [
      'dynamic power', 'compositional structure', 'orchestral arrangement', 'dramatic intensity',
      'harmonic complexity', 'rhythmic drive', 'melodic development', 'artistic sophistication'
    ]);

    this.conceptualBridges.set('hip-hop-jazz', [
      'improvisational flow', 'rhythmic sophistication', 'cultural artistry', 'musical conversation',
      'spontaneous creation', 'harmonic awareness', 'rhythmic complexity', 'expressive freedom'
    ]);
  }

  /**
   * Create fused vocabulary for two genres
   */
  fuseVocabularies(
    genre1: GenreType, 
    genre2: GenreType, 
    mood?: MoodCategory,
    strategy?: VocabularyStrategy
  ): FusedVocabulary {
    const compatibility = genreCompatibilityMatrix.getCompatibility(genre1, genre2);
    if (!compatibility) {
      throw new Error(`No compatibility data found for ${genre1} and ${genre2}`);
    }

    const vocab1 = this.genreVocabularies.get(genre1);
    const vocab2 = this.genreVocabularies.get(genre2);
    if (!vocab1 || !vocab2) {
      throw new Error(`Vocabulary not found for ${genre1} or ${genre2}`);
    }

    // Determine fusion strategy
    const fusionStrategy = strategy || this.determineBestStrategy(genre1, genre2, compatibility);
    const blendRule = this.blendRules.get(`${genre1}-${genre2}`) || this.blendRules.get(`${genre2}-${genre1}`);
    
    // Get mood-specific adjustments
    const moodVocab1 = mood ? genreMoodMatrix.getWeightedVocabulary(genre1 as GenreCategory, mood) : null;
    const moodVocab2 = mood ? genreMoodMatrix.getWeightedVocabulary(genre2 as GenreCategory, mood) : null;

    // Execute fusion based on strategy
    let fusedVocab: FusedVocabulary;
    
    switch (fusionStrategy) {
      case 'merge':
        fusedVocab = this.mergeVocabularies(vocab1, vocab2, compatibility, moodVocab1, moodVocab2);
        break;
      case 'alternate':
        fusedVocab = this.alternateVocabularies(vocab1, vocab2, compatibility, moodVocab1, moodVocab2);
        break;
      case 'dominant':
        fusedVocab = this.dominantVocabulary(vocab1, vocab2, compatibility, genre1, genre2);
        break;
      case 'synthesize':
        fusedVocab = this.synthesizeVocabularies(vocab1, vocab2, compatibility, blendRule);
        break;
      case 'layer':
        fusedVocab = this.layerVocabularies(vocab1, vocab2, compatibility, moodVocab1, moodVocab2);
        break;
      default:
        fusedVocab = this.mergeVocabularies(vocab1, vocab2, compatibility, moodVocab1, moodVocab2);
    }

    // Add fusion metadata
    fusedVocab.fusionMetadata = {
      strategy: fusionStrategy,
      dominantGenre: compatibility.recommendedRatio[0] > compatibility.recommendedRatio[1] ? genre1 : genre2,
      blendRatio: compatibility.recommendedRatio,
      compatibilityScore: compatibility.score,
      creativityLevel: this.calculateCreativityLevel(compatibility, fusionStrategy)
    };

    secureLog.debug(`Fused vocabularies for ${genre1}+${genre2} using ${fusionStrategy} strategy`);
    return fusedVocab;
  }

  /**
   * Merge vocabularies by combining all terms from both genres
   */
  private mergeVocabularies(
    vocab1: GenreVocabularyProfile,
    vocab2: GenreVocabularyProfile,
    compatibility: any,
    moodVocab1?: any,
    moodVocab2?: any
  ): FusedVocabulary {
    const primaryWords = [
      ...vocab1.coreTerms,
      ...vocab2.coreTerms,
      ...vocab1.characteristicAdjectives.slice(0, 5),
      ...vocab2.characteristicAdjectives.slice(0, 5)
    ];

    const secondaryWords = [
      ...vocab1.instrumentalTerms,
      ...vocab2.instrumentalTerms,
      ...vocab1.culturalTerms,
      ...vocab2.culturalTerms,
      ...vocab1.emotionalTerms,
      ...vocab2.emotionalTerms
    ];

    // Add mood-specific words if available
    if (moodVocab1) {
      primaryWords.push(...moodVocab1.primary.slice(0, 3));
      secondaryWords.push(...moodVocab1.secondary.slice(0, 5));
    }
    if (moodVocab2) {
      primaryWords.push(...moodVocab2.primary.slice(0, 3));
      secondaryWords.push(...moodVocab2.secondary.slice(0, 5));
    }

    const hybridTerms = this.generateHybridTerms(vocab1, vocab2, 'merge');
    const conceptualBlends = this.generateConceptualBlends(vocab1, vocab2, compatibility);
    const culturalFusions = this.generateCulturalFusions(vocab1, vocab2);

    return {
      primaryWords: [...new Set(primaryWords)],
      secondaryWords: [...new Set(secondaryWords)],
      hybridTerms,
      conceptualBlends,
      culturalFusions,
      avoidWords: [...(moodVocab1?.avoid || []), ...(moodVocab2?.avoid || [])],
      fusionMetadata: {} as any // Will be set by caller
    };
  }

  /**
   * Alternate between vocabularies for balanced representation
   */
  private alternateVocabularies(
    vocab1: GenreVocabularyProfile,
    vocab2: GenreVocabularyProfile,
    compatibility: any,
    moodVocab1?: any,
    moodVocab2?: any
  ): FusedVocabulary {
    const primaryWords: string[] = [];
    const secondaryWords: string[] = [];

    // Alternate between genre vocabularies
    const maxLength = Math.max(vocab1.coreTerms.length, vocab2.coreTerms.length);
    for (let i = 0; i < maxLength; i++) {
      if (i < vocab1.coreTerms.length) primaryWords.push(vocab1.coreTerms[i]);
      if (i < vocab2.coreTerms.length) primaryWords.push(vocab2.coreTerms[i]);
    }

    // Alternate secondary terms
    const maxSecondaryLength = Math.max(
      vocab1.instrumentalTerms.length + vocab1.culturalTerms.length,
      vocab2.instrumentalTerms.length + vocab2.culturalTerms.length
    );
    
    for (let i = 0; i < Math.min(maxSecondaryLength, 10); i++) {
      if (i < vocab1.instrumentalTerms.length) secondaryWords.push(vocab1.instrumentalTerms[i]);
      if (i < vocab2.instrumentalTerms.length) secondaryWords.push(vocab2.instrumentalTerms[i]);
    }

    const hybridTerms = this.generateHybridTerms(vocab1, vocab2, 'alternate');
    const conceptualBlends = this.generateConceptualBlends(vocab1, vocab2, compatibility);
    const culturalFusions = this.generateCulturalFusions(vocab1, vocab2);

    return {
      primaryWords: [...new Set(primaryWords)],
      secondaryWords: [...new Set(secondaryWords)],
      hybridTerms,
      conceptualBlends,
      culturalFusions,
      avoidWords: [...(moodVocab1?.avoid || []), ...(moodVocab2?.avoid || [])],
      fusionMetadata: {} as any
    };
  }

  /**
   * Create dominant vocabulary with secondary genre as accent
   */
  private dominantVocabulary(
    vocab1: GenreVocabularyProfile,
    vocab2: GenreVocabularyProfile,
    compatibility: any,
    genre1: GenreType,
    genre2: GenreType
  ): FusedVocabulary {
    const dominantGenre = compatibility.recommendedRatio[0] > compatibility.recommendedRatio[1] ? genre1 : genre2;
    const dominantVocab = dominantGenre === genre1 ? vocab1 : vocab2;
    const accentVocab = dominantGenre === genre1 ? vocab2 : vocab1;

    const primaryWords = [
      ...dominantVocab.coreTerms,
      ...dominantVocab.characteristicAdjectives.slice(0, 6),
      ...accentVocab.coreTerms.slice(0, 3) // Accent from secondary genre
    ];

    const secondaryWords = [
      ...dominantVocab.instrumentalTerms,
      ...dominantVocab.culturalTerms,
      ...accentVocab.characteristicAdjectives.slice(0, 3),
      ...accentVocab.emotionalTerms.slice(0, 3)
    ];

    const hybridTerms = this.generateHybridTerms(dominantVocab, accentVocab, 'dominant');
    const conceptualBlends = this.generateConceptualBlends(dominantVocab, accentVocab, compatibility);
    const culturalFusions = this.generateCulturalFusions(dominantVocab, accentVocab);

    return {
      primaryWords: [...new Set(primaryWords)],
      secondaryWords: [...new Set(secondaryWords)],
      hybridTerms,
      conceptualBlends,
      culturalFusions,
      avoidWords: [],
      fusionMetadata: {} as any
    };
  }

  /**
   * Synthesize vocabularies to create entirely new hybrid terms
   */
  private synthesizeVocabularies(
    vocab1: GenreVocabularyProfile,
    vocab2: GenreVocabularyProfile,
    compatibility: any,
    blendRule?: VocabularyBlendRule
  ): FusedVocabulary {
    const synthesizedTerms: string[] = [];
    
    // Use blend rule if available
    if (blendRule) {
      // Generate terms using fusion patterns
      blendRule.fusionPatterns.forEach(pattern => {
        for (let i = 0; i < 3; i++) { // Generate 3 variations per pattern
          const synthesized = this.applyFusionPattern(pattern, vocab1, vocab2, blendRule);
          if (synthesized) synthesizedTerms.push(synthesized);
        }
      });
    }

    // Create compound terms
    const compounds = this.createCompoundTerms(vocab1, vocab2, 5);
    const prefixFusions = this.createPrefixFusions(vocab1, vocab2, blendRule);
    const conceptualSynthesis = this.createConceptualSynthesis(vocab1, vocab2, compatibility);

    return {
      primaryWords: synthesizedTerms.slice(0, 8),
      secondaryWords: [...compounds, ...prefixFusions].slice(0, 10),
      hybridTerms: synthesizedTerms,
      conceptualBlends: conceptualSynthesis,
      culturalFusions: this.generateCulturalFusions(vocab1, vocab2),
      avoidWords: [],
      fusionMetadata: {} as any
    };
  }

  /**
   * Layer vocabularies for rich, textured combinations
   */
  private layerVocabularies(
    vocab1: GenreVocabularyProfile,
    vocab2: GenreVocabularyProfile,
    compatibility: any,
    moodVocab1?: any,
    moodVocab2?: any
  ): FusedVocabulary {
    // Create layers of vocabulary depth
    const foundationLayer = [...vocab1.coreTerms.slice(0, 4), ...vocab2.coreTerms.slice(0, 4)];
    const textureLayer = [...vocab1.characteristicAdjectives.slice(0, 4), ...vocab2.characteristicAdjectives.slice(0, 4)];
    const culturalLayer = [...vocab1.culturalTerms.slice(0, 3), ...vocab2.culturalTerms.slice(0, 3)];
    const emotionalLayer = [...vocab1.emotionalTerms.slice(0, 3), ...vocab2.emotionalTerms.slice(0, 3)];

    // Add mood layers if available
    if (moodVocab1 && moodVocab2) {
      foundationLayer.push(...moodVocab1.primary.slice(0, 2), ...moodVocab2.primary.slice(0, 2));
    }

    const primaryWords = [...foundationLayer, ...textureLayer];
    const secondaryWords = [...culturalLayer, ...emotionalLayer, 
                           ...vocab1.technicalTerms.slice(0, 3), ...vocab2.technicalTerms.slice(0, 3)];

    const hybridTerms = this.generateLayeredHybrids(vocab1, vocab2);
    const conceptualBlends = this.generateConceptualBlends(vocab1, vocab2, compatibility);
    const culturalFusions = this.generateCulturalFusions(vocab1, vocab2);

    return {
      primaryWords: [...new Set(primaryWords)],
      secondaryWords: [...new Set(secondaryWords)],
      hybridTerms,
      conceptualBlends,
      culturalFusions,
      avoidWords: [],
      fusionMetadata: {} as any
    };
  }

  /**
   * Generate hybrid terms using various combination techniques
   */
  private generateHybridTerms(
    vocab1: GenreVocabularyProfile,
    vocab2: GenreVocabularyProfile,
    strategy: VocabularyStrategy
  ): string[] {
    const hybrids: string[] = [];

    // Portmanteau combinations (blend words)
    for (let i = 0; i < 3; i++) {
      const term1 = getRandomWord(vocab1.coreTerms) || '';
      const term2 = getRandomWord(vocab2.coreTerms) || '';
      if (term1 && term2 && term1.length > 3 && term2.length > 3) {
        const portmanteau = term1.slice(0, Math.ceil(term1.length / 2)) + 
                           term2.slice(Math.floor(term2.length / 2));
        hybrids.push(capitalize(portmanteau));
      }
    }

    // Compound combinations
    for (let i = 0; i < 4; i++) {
      const adj1 = getRandomWord(vocab1.characteristicAdjectives) || '';
      const noun2 = getRandomWord(vocab2.coreTerms) || '';
      if (adj1 && noun2) {
        hybrids.push(capitalize(`${adj1} ${noun2}`));
      }
    }

    // Prefix/suffix combinations
    const prefixes = ['neo', 'meta', 'proto', 'ultra', 'hyper'];
    for (let i = 0; i < 3; i++) {
      const prefix = getRandomWord(prefixes) || 'neo';
      const core = getRandomWord([...vocab1.coreTerms, ...vocab2.coreTerms]) || '';
      if (core) {
        hybrids.push(capitalize(prefix + core.toLowerCase()));
      }
    }

    return hybrids.filter(h => h.length > 0);
  }

  /**
   * Generate conceptual blends that bridge genre concepts
   */
  private generateConceptualBlends(
    vocab1: GenreVocabularyProfile,
    vocab2: GenreVocabularyProfile,
    compatibility: any
  ): string[] {
    const blends: string[] = [];
    const bridgeWords = ['meets', 'fusion', 'synthesis', 'blend', 'hybrid', 'crossing', 'bridge'];

    // Create conceptual bridges
    for (let i = 0; i < 3; i++) {
      const concept1 = getRandomWord(vocab1.metaphoricalTerms) || getRandomWord(vocab1.coreTerms) || '';
      const concept2 = getRandomWord(vocab2.metaphoricalTerms) || getRandomWord(vocab2.coreTerms) || '';
      const bridge = getRandomWord(bridgeWords) || 'fusion';
      
      if (concept1 && concept2) {
        blends.push(`${capitalize(concept1)} ${bridge} ${capitalize(concept2)}`);
      }
    }

    return blends;
  }

  /**
   * Generate cultural fusion terms
   */
  private generateCulturalFusions(
    vocab1: GenreVocabularyProfile,
    vocab2: GenreVocabularyProfile
  ): string[] {
    const fusions: string[] = [];
    
    // Combine cultural terms from both genres
    for (let i = 0; i < 3; i++) {
      const cultural1 = getRandomWord(vocab1.culturalTerms) || '';
      const cultural2 = getRandomWord(vocab2.culturalTerms) || '';
      
      if (cultural1 && cultural2) {
        fusions.push(`${capitalize(cultural1)} ${capitalize(cultural2)} Collective`);
        fusions.push(`Cross-${capitalize(cultural1)} ${capitalize(cultural2)}`);
      }
    }

    return fusions;
  }

  /**
   * Apply fusion pattern template to generate terms
   */
  private applyFusionPattern(
    pattern: string,
    vocab1: GenreVocabularyProfile,
    vocab2: GenreVocabularyProfile,
    blendRule: VocabularyBlendRule
  ): string | null {
    let result = pattern;

    // Replace pattern placeholders
    result = result.replace('{genre1_term}', getRandomWord(vocab1.coreTerms) || '');
    result = result.replace('{genre2_term}', getRandomWord(vocab2.coreTerms) || '');
    result = result.replace('{genre1_concept}', getRandomWord(vocab1.metaphoricalTerms) || '');
    result = result.replace('{genre2_concept}', getRandomWord(vocab2.metaphoricalTerms) || '');
    result = result.replace('{hybrid_prefix}', getRandomWord(blendRule.hybridPrefixes) || 'neo');
    result = result.replace('{genre1_technique}', getRandomWord(vocab1.technicalTerms) || '');
    result = result.replace('{genre2_technique}', getRandomWord(vocab2.technicalTerms) || '');

    // Clean up and capitalize
    result = result.replace(/\{\w+\}/g, ''); // Remove unfilled placeholders
    result = result.replace(/\s+/g, ' ').trim(); // Clean up whitespace
    
    return result.length > 3 ? capitalize(result) : null;
  }

  /**
   * Create compound terms from vocabularies
   */
  private createCompoundTerms(
    vocab1: GenreVocabularyProfile,
    vocab2: GenreVocabularyProfile,
    count: number
  ): string[] {
    const compounds: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const word1 = getRandomWord([...vocab1.coreTerms, ...vocab1.characteristicAdjectives]) || '';
      const word2 = getRandomWord([...vocab2.coreTerms, ...vocab2.instrumentalTerms]) || '';
      
      if (word1 && word2) {
        compounds.push(capitalize(`${word1}${word2.toLowerCase()}`));
      }
    }
    
    return compounds;
  }

  /**
   * Create prefix-based fusions
   */
  private createPrefixFusions(
    vocab1: GenreVocabularyProfile,
    vocab2: GenreVocabularyProfile,
    blendRule?: VocabularyBlendRule
  ): string[] {
    const prefixFusions: string[] = [];
    const prefixes = blendRule?.hybridPrefixes || ['neo', 'proto', 'meta', 'ultra'];
    
    for (let i = 0; i < 4; i++) {
      const prefix = getRandomWord(prefixes) || 'neo';
      const core = getRandomWord([...vocab1.coreTerms, ...vocab2.coreTerms]) || '';
      
      if (core) {
        prefixFusions.push(capitalize(prefix + core.toLowerCase()));
      }
    }
    
    return prefixFusions;
  }

  /**
   * Create conceptual synthesis terms
   */
  private createConceptualSynthesis(
    vocab1: GenreVocabularyProfile,
    vocab2: GenreVocabularyProfile,
    compatibility: any
  ): string[] {
    const synthesis: string[] = [];
    
    // Create abstract conceptual combinations
    const concepts1 = [...vocab1.metaphoricalTerms, ...vocab1.culturalTerms];
    const concepts2 = [...vocab2.metaphoricalTerms, ...vocab2.culturalTerms];
    
    for (let i = 0; i < 3; i++) {
      const concept1 = getRandomWord(concepts1) || '';
      const concept2 = getRandomWord(concepts2) || '';
      
      if (concept1 && concept2) {
        synthesis.push(`The ${capitalize(concept1)} of ${capitalize(concept2)}`);
        synthesis.push(`${capitalize(concept1)}-${capitalize(concept2)} Synthesis`);
      }
    }
    
    return synthesis;
  }

  /**
   * Generate layered hybrid terms for complex fusions
   */
  private generateLayeredHybrids(
    vocab1: GenreVocabularyProfile,
    vocab2: GenreVocabularyProfile
  ): string[] {
    const layered: string[] = [];
    
    // Create multi-layer combinations
    for (let i = 0; i < 3; i++) {
      const layer1 = getRandomWord(vocab1.intensityModifiers) || '';
      const layer2 = getRandomWord(vocab2.coreTerms) || '';
      const layer3 = getRandomWord(vocab1.characteristicAdjectives) || '';
      
      if (layer1 && layer2 && layer3) {
        layered.push(`${capitalize(layer1)} ${capitalize(layer2)} ${capitalize(layer3)}`);
      }
    }
    
    return layered;
  }

  /**
   * Determine the best fusion strategy for two genres
   */
  private determineBestStrategy(
    genre1: GenreType, 
    genre2: GenreType, 
    compatibility: any
  ): VocabularyStrategy {
    // Use fusion rule strategy if available
    const blendRule = this.blendRules.get(`${genre1}-${genre2}`) || this.blendRules.get(`${genre2}-${genre1}`);
    if (blendRule) {
      return blendRule.blendStrategy;
    }

    // Determine strategy based on compatibility characteristics
    if (compatibility.fusionStyle === 'complement') {
      return compatibility.score > 0.7 ? 'synthesize' : 'alternate';
    } else if (compatibility.fusionStyle === 'contrast') {
      return compatibility.score > 0.6 ? 'layer' : 'dominant';
    } else if (compatibility.fusionStyle === 'hybrid') {
      return 'merge';
    } else { // evolution
      return 'synthesize';
    }
  }

  /**
   * Calculate creativity level based on fusion parameters
   */
  private calculateCreativityLevel(compatibility: any, strategy: VocabularyStrategy): number {
    let creativity = 0.5; // Base level

    // Strategy bonuses
    if (strategy === 'synthesize') creativity += 0.3;
    else if (strategy === 'layer') creativity += 0.2;
    else if (strategy === 'alternate') creativity += 0.1;

    // Compatibility bonuses
    creativity += compatibility.score * 0.2;

    // Fusion style bonuses
    if (compatibility.fusionStyle === 'contrast') creativity += 0.1;
    else if (compatibility.fusionStyle === 'hybrid') creativity += 0.2;

    return Math.min(Math.max(creativity, 0), 1);
  }

  /**
   * Get fused vocabulary for enhanced word source
   */
  createFusedWordSource(
    fusedVocab: FusedVocabulary,
    originalSource: EnhancedWordSource
  ): EnhancedWordSource {
    return {
      ...originalSource,
      // Enhance existing arrays with fused vocabulary
      validAdjectives: [
        ...originalSource.validAdjectives,
        ...fusedVocab.primaryWords.filter(w => w.match(/\b(ing|ed|ive|al|ic)\b/i)),
        ...fusedVocab.hybridTerms.filter(w => w.match(/\b(ing|ed|ive|al|ic)\b/i))
      ],
      validNouns: [
        ...originalSource.validNouns,
        ...fusedVocab.primaryWords.filter(w => !w.match(/\b(ing|ed|ive|al|ic)\b/i)),
        ...fusedVocab.secondaryWords,
        ...fusedVocab.hybridTerms.filter(w => !w.match(/\b(ing|ed|ive|al|ic)\b/i))
      ],
      validMusicalTerms: [
        ...originalSource.validMusicalTerms,
        ...fusedVocab.primaryWords,
        ...fusedVocab.conceptualBlends
      ],
      validContextualWords: [
        ...originalSource.validContextualWords,
        ...fusedVocab.culturalFusions,
        ...fusedVocab.conceptualBlends
      ],
      // Add fused terms to combined collections
      allValidWords: [
        ...originalSource.allValidWords,
        ...fusedVocab.primaryWords,
        ...fusedVocab.secondaryWords,
        ...fusedVocab.hybridTerms
      ]
    };
  }
}

// Export singleton instance
export const vocabularyFusionSystem = new VocabularyFusionSystem();