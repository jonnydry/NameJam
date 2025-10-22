/**
 * Atmospheric Intelligence - Nuanced emotional understanding and contextual atmosphere
 * Provides sophisticated atmospheric analysis, seasonal/temporal moods, and cultural associations
 */

import { 
  moodClassificationSystem, 
  MoodProfile, 
  EmotionalDimensions,
  MoodModifier
} from './moodClassificationSystem';
import { PatternDefinition } from './advancedPatternLibrary';
import { EnhancedWordSource } from './types';
import { secureLog } from '../../utils/secureLogger';

// Atmospheric context analysis
export interface AtmosphericContext {
  // Environmental factors
  weather?: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'foggy' | 'snowy';
  temperature?: 'cold' | 'cool' | 'mild' | 'warm' | 'hot';
  lighting?: 'bright' | 'dim' | 'soft' | 'harsh' | 'neon' | 'candlelight';
  space?: 'intimate' | 'vast' | 'enclosed' | 'open' | 'underground' | 'elevated';
  
  // Temporal atmosphere
  timeContext?: 'dawn' | 'morning' | 'midday' | 'afternoon' | 'dusk' | 'evening' | 'night' | 'midnight' | 'late_night';
  seasonalMood?: 'spring_awakening' | 'summer_peak' | 'autumn_reflection' | 'winter_introspection';
  eraAtmosphere?: 'ancient' | 'medieval' | 'renaissance' | 'industrial' | 'modern' | 'futuristic' | 'timeless';
  
  // Cultural & social atmosphere
  culturalVibe?: 'eastern' | 'western' | 'nordic' | 'mediterranean' | 'tropical' | 'urban' | 'rural' | 'cosmopolitan';
  socialContext?: 'solitude' | 'intimacy' | 'community' | 'crowd' | 'celebration' | 'ceremony' | 'rebellion';
  spiritualResonance?: 'sacred' | 'profane' | 'mystical' | 'grounded' | 'transcendent' | 'meditative';
  
  // Artistic atmosphere
  artisticMovement?: 'romantic' | 'impressionist' | 'expressionist' | 'minimalist' | 'surreal' | 'abstract';
  aestheticQuality?: 'beautiful' | 'sublime' | 'grotesque' | 'elegant' | 'raw' | 'refined';
  narrativeArchetype?: 'hero_journey' | 'tragic_fall' | 'redemption' | 'discovery' | 'transformation' | 'return';
}

// Atmospheric profile with detailed characteristics
export interface AtmosphericProfile {
  id: string;
  name: string;
  category: string;
  emotionalResonance: EmotionalDimensions;
  sensoryAttributes: {
    visual: string[];
    auditory: string[];
    tactile: string[];
    olfactory: string[];
    gustatory: string[];
  };
  temporalCharacteristics: {
    rhythm: 'slow' | 'moderate' | 'fast' | 'variable';
    duration: 'momentary' | 'sustained' | 'cyclical' | 'eternal';
    progression: 'linear' | 'circular' | 'spiral' | 'chaotic';
  };
  culturalAssociations: {
    geographical: string[];
    historical: string[];
    mythological: string[];
    philosophical: string[];
  };
  wordCharacteristics: {
    preferredTones: string[];
    rhythmicQualities: string[];
    semanticFields: string[];
    metaphoricalTendencies: string[];
  };
  compatibleMoods: string[];
  conflictingMoods: string[];
  enhancementFactors: string[];
}

// Seasonal mood progression
export interface SeasonalMoodProgression {
  season: string;
  phases: {
    early: { moods: string[], intensity: number, characteristics: string[] };
    peak: { moods: string[], intensity: number, characteristics: string[] };
    late: { moods: string[], intensity: number, characteristics: string[] };
  };
  transitions: {
    from: string;
    to: string;
    transitionMoods: string[];
    characteristics: string[];
  }[];
}

// Cultural emotional resonance
export interface CulturalEmotionalProfile {
  culture: string;
  emotionalTendencies: EmotionalDimensions;
  valueEmphasis: string[];
  expressivenessLevel: number; // 0-100
  collectivismIndividualism: number; // 0-100 (0=collective, 100=individual)
  traditionalModern: number; // 0-100 (0=traditional, 100=modern)
  preferredMoods: string[];
  culturalMetaphors: string[];
  communicationStyle: 'direct' | 'indirect' | 'contextual' | 'symbolic';
}

export class AtmosphericIntelligence {
  // Comprehensive atmospheric profiles
  private readonly atmosphericProfiles: Map<string, AtmosphericProfile> = new Map([
    // Environmental atmospheres
    ['storm_passage', {
      id: 'storm_passage',
      name: 'Storm Passage',
      category: 'environmental',
      emotionalResonance: { energy: 85, valence: 40, complexity: 75, intensity: 90, darkness: 70, mystery: 60 },
      sensoryAttributes: {
        visual: ['lightning', 'dark clouds', 'rain', 'wind-blown', 'dramatic shadows'],
        auditory: ['thunder', 'rain pattering', 'wind howling', 'distant rumble'],
        tactile: ['wind pressure', 'cool moisture', 'electrical charge', 'turbulence'],
        olfactory: ['petrichor', 'ozone', 'wet earth', 'fresh air'],
        gustatory: ['metallic', 'clean', 'sharp', 'refreshing']
      },
      temporalCharacteristics: { rhythm: 'variable', duration: 'sustained', progression: 'chaotic' },
      culturalAssociations: {
        geographical: ['temperate regions', 'coastal areas', 'plains'],
        historical: ['maritime', 'agricultural', 'warfare'],
        mythological: ['Thor', 'Zeus', 'storm gods', 'elemental forces'],
        philosophical: ['chaos theory', 'natural power', 'transformation']
      },
      wordCharacteristics: {
        preferredTones: ['powerful', 'dramatic', 'intense'],
        rhythmicQualities: ['irregular', 'building', 'crescendo'],
        semanticFields: ['weather', 'power', 'change', 'nature'],
        metaphoricalTendencies: ['force', 'cleansing', 'revelation', 'disruption']
      },
      compatibleMoods: ['aggressive', 'energetic', 'mysterious', 'dark'],
      conflictingMoods: ['peaceful', 'gentle', 'serene'],
      enhancementFactors: ['intensity', 'drama', 'natural power']
    }],

    ['midnight_solitude', {
      id: 'midnight_solitude',
      name: 'Midnight Solitude',
      category: 'temporal',
      emotionalResonance: { energy: 30, valence: 35, complexity: 80, intensity: 60, darkness: 85, mystery: 90 },
      sensoryAttributes: {
        visual: ['deep shadows', 'moonlight', 'empty streets', 'distant lights'],
        auditory: ['silence', 'distant sounds', 'night sounds', 'echoes'],
        tactile: ['cool air', 'stillness', 'emptiness', 'weight of darkness'],
        olfactory: ['night air', 'dew', 'coolness', 'absence'],
        gustatory: ['emptiness', 'coolness', 'metallic', 'thin air']
      },
      temporalCharacteristics: { rhythm: 'slow', duration: 'sustained', progression: 'linear' },
      culturalAssociations: {
        geographical: ['urban', 'suburban', 'isolated'],
        historical: ['night watch', 'contemplation', 'study'],
        mythological: ['night spirits', 'dream realm', 'shadow world'],
        philosophical: ['existentialism', 'introspection', 'solitude']
      },
      wordCharacteristics: {
        preferredTones: ['contemplative', 'mysterious', 'isolated'],
        rhythmicQualities: ['slow', 'spaced', 'reflective'],
        semanticFields: ['darkness', 'solitude', 'time', 'thought'],
        metaphoricalTendencies: ['depth', 'reflection', 'journey inward', 'mystery']
      },
      compatibleMoods: ['melancholic', 'mysterious', 'contemplative', 'dark'],
      conflictingMoods: ['euphoric', 'energetic', 'uplifting'],
      enhancementFactors: ['introspection', 'mystery', 'solitude']
    }],

    ['spring_awakening', {
      id: 'spring_awakening',
      name: 'Spring Awakening',
      category: 'seasonal',
      emotionalResonance: { energy: 70, valence: 85, complexity: 60, intensity: 65, darkness: 15, mystery: 40 },
      sensoryAttributes: {
        visual: ['budding trees', 'fresh green', 'sunlight', 'blooming flowers'],
        auditory: ['bird songs', 'gentle breeze', 'water flowing', 'new life'],
        tactile: ['warm sun', 'soft breeze', 'tender growth', 'renewal'],
        olfactory: ['fresh flowers', 'new grass', 'clean air', 'growth'],
        gustatory: ['fresh', 'sweet', 'clean', 'vibrant']
      },
      temporalCharacteristics: { rhythm: 'moderate', duration: 'cyclical', progression: 'spiral' },
      culturalAssociations: {
        geographical: ['temperate zones', 'gardens', 'countryside'],
        historical: ['agriculture', 'festivals', 'renewal ceremonies'],
        mythological: ['Persephone', 'rebirth myths', 'fertility gods'],
        philosophical: ['renewal', 'hope', 'growth', 'potential']
      },
      wordCharacteristics: {
        preferredTones: ['hopeful', 'fresh', 'growing'],
        rhythmicQualities: ['ascending', 'flowing', 'gentle'],
        semanticFields: ['growth', 'renewal', 'hope', 'nature'],
        metaphoricalTendencies: ['awakening', 'birth', 'emergence', 'blooming']
      },
      compatibleMoods: ['uplifting', 'peaceful', 'romantic', 'hopeful'],
      conflictingMoods: ['dark', 'aggressive', 'melancholic'],
      enhancementFactors: ['renewal', 'growth', 'hope']
    }],

    ['urban_nightscape', {
      id: 'urban_nightscape',
      name: 'Urban Nightscape',
      category: 'cultural',
      emotionalResonance: { energy: 75, valence: 50, complexity: 85, intensity: 80, darkness: 60, mystery: 70 },
      sensoryAttributes: {
        visual: ['neon lights', 'city skyline', 'traffic lights', 'glowing windows'],
        auditory: ['city hum', 'traffic', 'distant music', 'urban soundscape'],
        tactile: ['concrete', 'asphalt', 'metal', 'glass'],
        olfactory: ['exhaust', 'food', 'people', 'urban air'],
        gustatory: ['metallic', 'spicy', 'diverse', 'intense']
      },
      temporalCharacteristics: { rhythm: 'fast', duration: 'sustained', progression: 'circular' },
      culturalAssociations: {
        geographical: ['cities', 'metropolitan areas', 'downtown'],
        historical: ['industrial age', 'modernization', 'cosmopolitan'],
        mythological: ['modern myths', 'urban legends', 'technology spirits'],
        philosophical: ['modernity', 'alienation', 'connection', 'diversity']
      },
      wordCharacteristics: {
        preferredTones: ['modern', 'electric', 'vibrant'],
        rhythmicQualities: ['pulsing', 'rhythmic', 'electronic'],
        semanticFields: ['technology', 'people', 'energy', 'movement'],
        metaphoricalTendencies: ['pulse', 'network', 'flow', 'convergence']
      },
      compatibleMoods: ['energetic', 'mysterious', 'aggressive', 'electric'],
      conflictingMoods: ['peaceful', 'rural', 'natural'],
      enhancementFactors: ['modernity', 'energy', 'complexity']
    }],

    ['sacred_grove', {
      id: 'sacred_grove',
      name: 'Sacred Grove',
      category: 'spiritual',
      emotionalResonance: { energy: 40, valence: 75, complexity: 70, intensity: 45, darkness: 25, mystery: 80 },
      sensoryAttributes: {
        visual: ['ancient trees', 'filtered light', 'moss', 'natural cathedral'],
        auditory: ['wind in leaves', 'bird calls', 'silence', 'natural harmonies'],
        tactile: ['bark texture', 'soft earth', 'cool shade', 'gentle breeze'],
        olfactory: ['earth', 'moss', 'wood', 'natural incense'],
        gustatory: ['earthy', 'green', 'pure', 'ancient']
      },
      temporalCharacteristics: { rhythm: 'slow', duration: 'eternal', progression: 'circular' },
      culturalAssociations: {
        geographical: ['forests', 'mountains', 'remote areas'],
        historical: ['druidism', 'shamanism', 'nature worship'],
        mythological: ['tree spirits', 'forest gods', 'sacred spaces'],
        philosophical: ['pantheism', 'deep ecology', 'sacred geometry']
      },
      wordCharacteristics: {
        preferredTones: ['reverent', 'ancient', 'mystical'],
        rhythmicQualities: ['slow', 'deep', 'resonant'],
        semanticFields: ['nature', 'spirit', 'ancient', 'sacred'],
        metaphoricalTendencies: ['root', 'growth', 'wisdom', 'connection']
      },
      compatibleMoods: ['peaceful', 'mysterious', 'contemplative', 'spiritual'],
      conflictingMoods: ['aggressive', 'urban', 'technological'],
      enhancementFactors: ['spirituality', 'nature', 'timelessness']
    }]
  ]);

  // Seasonal mood progressions
  private readonly seasonalProgressions: Map<string, SeasonalMoodProgression> = new Map([
    ['spring', {
      season: 'spring',
      phases: {
        early: { 
          moods: ['hopeful', 'gentle', 'awakening'], 
          intensity: 40, 
          characteristics: ['tender', 'emerging', 'fragile'] 
        },
        peak: { 
          moods: ['uplifting', 'energetic', 'romantic'], 
          intensity: 70, 
          characteristics: ['vibrant', 'blooming', 'passionate'] 
        },
        late: { 
          moods: ['abundant', 'warm', 'fulfilled'], 
          intensity: 65, 
          characteristics: ['rich', 'mature', 'satisfied'] 
        }
      },
      transitions: [
        {
          from: 'winter',
          to: 'spring',
          transitionMoods: ['melancholic-hopeful', 'awakening', 'tentative'],
          characteristics: ['gradual', 'uncertain', 'emerging']
        }
      ]
    }],
    ['summer', {
      season: 'summer',
      phases: {
        early: { 
          moods: ['energetic', 'bright', 'celebratory'], 
          intensity: 75, 
          characteristics: ['vibrant', 'active', 'social'] 
        },
        peak: { 
          moods: ['euphoric', 'intense', 'passionate'], 
          intensity: 90, 
          characteristics: ['blazing', 'overwhelming', 'peak'] 
        },
        late: { 
          moods: ['nostalgic', 'bittersweet', 'reflective'], 
          intensity: 60, 
          characteristics: ['golden', 'fading', 'precious'] 
        }
      },
      transitions: [
        {
          from: 'spring',
          to: 'summer',
          transitionMoods: ['building', 'anticipation', 'warming'],
          characteristics: ['escalating', 'promising', 'expanding']
        }
      ]
    }],
    ['autumn', {
      season: 'autumn',
      phases: {
        early: { 
          moods: ['nostalgic', 'contemplative', 'bittersweet'], 
          intensity: 55, 
          characteristics: ['changing', 'golden', 'reflective'] 
        },
        peak: { 
          moods: ['melancholic', 'deep', 'transformative'], 
          intensity: 70, 
          characteristics: ['rich', 'complex', 'profound'] 
        },
        late: { 
          moods: ['stark', 'accepting', 'preparing'], 
          intensity: 45, 
          characteristics: ['bare', 'honest', 'transitional'] 
        }
      },
      transitions: [
        {
          from: 'summer',
          to: 'autumn',
          transitionMoods: ['bittersweet', 'cooling', 'changing'],
          characteristics: ['gradual', 'inevitable', 'beautiful']
        }
      ]
    }],
    ['winter', {
      season: 'winter',
      phases: {
        early: { 
          moods: ['introspective', 'quiet', 'crystalline'], 
          intensity: 50, 
          characteristics: ['sharp', 'clear', 'inward'] 
        },
        peak: { 
          moods: ['deep', 'meditative', 'stark'], 
          intensity: 40, 
          characteristics: ['profound', 'still', 'essential'] 
        },
        late: { 
          moods: ['anticipatory', 'restless', 'emerging'], 
          intensity: 45, 
          characteristics: ['stirring', 'subtle', 'promising'] 
        }
      },
      transitions: [
        {
          from: 'autumn',
          to: 'winter',
          transitionMoods: ['cooling', 'settling', 'deepening'],
          characteristics: ['inevitable', 'peaceful', 'necessary']
        }
      ]
    }]
  ]);

  // Cultural emotional profiles
  private readonly culturalProfiles: Map<string, CulturalEmotionalProfile> = new Map([
    ['mediterranean', {
      culture: 'mediterranean',
      emotionalTendencies: { energy: 70, valence: 80, complexity: 60, intensity: 65, darkness: 20, mystery: 45 },
      valueEmphasis: ['family', 'pleasure', 'beauty', 'tradition', 'community'],
      expressivenessLevel: 80,
      collectivismIndividualism: 35,
      traditionalModern: 45,
      preferredMoods: ['romantic', 'passionate', 'warm', 'celebratory'],
      culturalMetaphors: ['sun', 'sea', 'vine', 'olive', 'stone', 'harbor'],
      communicationStyle: 'expressive'
    }],
    ['nordic', {
      culture: 'nordic',
      emotionalTendencies: { energy: 45, valence: 55, complexity: 75, intensity: 40, darkness: 50, mystery: 70 },
      valueEmphasis: ['nature', 'simplicity', 'functionality', 'equality', 'introspection'],
      expressivenessLevel: 45,
      collectivismIndividualism: 70,
      traditionalModern: 75,
      preferredMoods: ['contemplative', 'melancholic', 'peaceful', 'minimalist'],
      culturalMetaphors: ['forest', 'snow', 'midnight sun', 'fjord', 'aurora', 'ice'],
      communicationStyle: 'understated'
    }],
    ['eastern', {
      culture: 'eastern',
      emotionalTendencies: { energy: 50, valence: 60, complexity: 85, intensity: 55, darkness: 40, mystery: 80 },
      valueEmphasis: ['harmony', 'balance', 'wisdom', 'respect', 'tradition'],
      expressivenessLevel: 55,
      collectivismIndividualism: 25,
      traditionalModern: 40,
      preferredMoods: ['harmonious', 'balanced', 'wise', 'flowing'],
      culturalMetaphors: ['mountain', 'river', 'bamboo', 'lotus', 'dragon', 'tea'],
      communicationStyle: 'contextual'
    }],
    ['urban_modern', {
      culture: 'urban_modern',
      emotionalTendencies: { energy: 80, valence: 55, complexity: 90, intensity: 75, darkness: 45, mystery: 60 },
      valueEmphasis: ['innovation', 'efficiency', 'diversity', 'connectivity', 'progress'],
      expressivenessLevel: 70,
      collectivismIndividualism: 80,
      traditionalModern: 90,
      preferredMoods: ['energetic', 'complex', 'diverse', 'electric'],
      culturalMetaphors: ['network', 'pulse', 'stream', 'fusion', 'node', 'flow'],
      communicationStyle: 'direct'
    }]
  ]);

  // Time of day atmospheric mapping
  private readonly timeAtmosphericMap = new Map([
    ['dawn', { 
      primaryMoods: ['peaceful', 'hopeful', 'awakening'], 
      atmosphere: 'fresh_beginning',
      energyLevel: 40,
      mysteryLevel: 60,
      characteristics: ['gentle', 'promising', 'transitional']
    }],
    ['morning', { 
      primaryMoods: ['energetic', 'optimistic', 'active'], 
      atmosphere: 'bright_activity',
      energyLevel: 75,
      mysteryLevel: 20,
      characteristics: ['bright', 'active', 'productive']
    }],
    ['afternoon', { 
      primaryMoods: ['balanced', 'steady', 'focused'], 
      atmosphere: 'warm_clarity',
      energyLevel: 65,
      mysteryLevel: 25,
      characteristics: ['clear', 'warm', 'sustained']
    }],
    ['evening', { 
      primaryMoods: ['relaxing', 'reflective', 'social'], 
      atmosphere: 'golden_gathering',
      energyLevel: 55,
      mysteryLevel: 45,
      characteristics: ['golden', 'social', 'winding down']
    }],
    ['night', { 
      primaryMoods: ['mysterious', 'intimate', 'contemplative'], 
      atmosphere: 'deep_mystery',
      energyLevel: 35,
      mysteryLevel: 80,
      characteristics: ['deep', 'intimate', 'mysterious']
    }],
    ['midnight', { 
      primaryMoods: ['dark', 'profound', 'solitary'], 
      atmosphere: 'profound_solitude',
      energyLevel: 25,
      mysteryLevel: 95,
      characteristics: ['profound', 'isolated', 'transformative']
    }]
  ]);

  /**
   * Analyze atmospheric context to enhance mood selection
   */
  analyzeAtmosphericContext(context: AtmosphericContext): {
    atmosphericMoods: string[];
    environmentalInfluences: EmotionalDimensions;
    culturalResonance: number;
    temporalAlignment: number;
    recommendations: {
      enhanceFactors: string[];
      avoidFactors: string[];
      atmosphericModifiers: string[];
    };
  } {
    const atmosphericMoods: string[] = [];
    let environmentalInfluences: EmotionalDimensions = {
      energy: 50, valence: 50, complexity: 50, intensity: 50, darkness: 50, mystery: 50
    };

    // Analyze temporal atmosphere
    if (context.timeContext) {
      const timeAtmosphere = this.timeAtmosphericMap.get(context.timeContext);
      if (timeAtmosphere) {
        atmosphericMoods.push(...timeAtmosphere.primaryMoods);
        environmentalInfluences.energy = (environmentalInfluences.energy + timeAtmosphere.energyLevel) / 2;
        environmentalInfluences.mystery = (environmentalInfluences.mystery + timeAtmosphere.mysteryLevel) / 2;
      }
    }

    // Analyze seasonal atmosphere
    if (context.seasonalMood) {
      const seasonalInfluence = this.analyzeSeasonalInfluence(context.seasonalMood);
      atmosphericMoods.push(...seasonalInfluence.moods);
      environmentalInfluences = this.blendEmotionalDimensions(environmentalInfluences, seasonalInfluence.dimensions);
    }

    // Analyze weather atmosphere
    if (context.weather) {
      const weatherInfluence = this.analyzeWeatherInfluence(context.weather);
      atmosphericMoods.push(...weatherInfluence.moods);
      environmentalInfluences = this.blendEmotionalDimensions(environmentalInfluences, weatherInfluence.dimensions);
    }

    // Analyze cultural atmosphere
    let culturalResonance = 0.5;
    if (context.culturalVibe) {
      const culturalProfile = this.culturalProfiles.get(context.culturalVibe);
      if (culturalProfile) {
        atmosphericMoods.push(...culturalProfile.preferredMoods);
        environmentalInfluences = this.blendEmotionalDimensions(environmentalInfluences, culturalProfile.emotionalTendencies);
        culturalResonance = culturalProfile.expressivenessLevel / 100;
      }
    }

    // Calculate temporal alignment
    const temporalAlignment = this.calculateTemporalAlignment(context);

    // Generate recommendations
    const recommendations = this.generateAtmosphericRecommendations(context, atmosphericMoods);

    return {
      atmosphericMoods: [...new Set(atmosphericMoods)], // Remove duplicates
      environmentalInfluences,
      culturalResonance,
      temporalAlignment,
      recommendations
    };
  }

  /**
   * Get atmospheric profile by ID
   */
  getAtmosphericProfile(profileId: string): AtmosphericProfile | null {
    return this.atmosphericProfiles.get(profileId) || null;
  }

  /**
   * Find atmospheric profiles matching context
   */
  findMatchingAtmosphericProfiles(context: AtmosphericContext): AtmosphericProfile[] {
    const matches: AtmosphericProfile[] = [];

    for (const [id, profile] of this.atmosphericProfiles) {
      let matchScore = 0;

      // Check category alignment
      if (context.timeContext && profile.category === 'temporal') matchScore += 0.3;
      if (context.seasonalMood && profile.category === 'seasonal') matchScore += 0.3;
      if (context.culturalVibe && profile.category === 'cultural') matchScore += 0.3;
      if (context.weather && profile.category === 'environmental') matchScore += 0.3;
      if (context.spiritualResonance && profile.category === 'spiritual') matchScore += 0.3;

      // Check specific attribute alignment
      if (context.space) {
        if (profile.sensoryAttributes.visual.some(attr => attr.includes(context.space!))) {
          matchScore += 0.2;
        }
      }

      if (matchScore >= 0.3) { // Minimum threshold for consideration
        matches.push(profile);
      }
    }

    return matches.sort((a, b) => {
      // Sort by emotional resonance complexity (more nuanced profiles first)
      return b.emotionalResonance.complexity - a.emotionalResonance.complexity;
    });
  }

  /**
   * Calculate atmospheric coherence for a pattern selection
   */
  calculateAtmosphericCoherence(
    pattern: PatternDefinition,
    context: AtmosphericContext,
    selectedMoods: string[]
  ): {
    coherenceScore: number;
    atmosphericAlignment: number;
    culturalFit: number;
    temporalConsistency: number;
    sensoryHarmony: number;
  } {
    const atmosphericAnalysis = this.analyzeAtmosphericContext(context);
    
    // Calculate atmospheric alignment
    const atmosphericAlignment = this.calculatePatternAtmosphericAlignment(
      pattern, 
      atmosphericAnalysis.atmosphericMoods,
      atmosphericAnalysis.environmentalInfluences
    );

    // Calculate cultural fit
    const culturalFit = this.calculateCulturalFit(pattern, context);

    // Calculate temporal consistency
    const temporalConsistency = this.calculateTemporalConsistency(pattern, context);

    // Calculate sensory harmony
    const sensoryHarmony = this.calculateSensoryHarmony(pattern, context);

    // Calculate overall coherence
    const coherenceScore = (
      atmosphericAlignment * 0.3 +
      culturalFit * 0.25 +
      temporalConsistency * 0.25 +
      sensoryHarmony * 0.2
    );

    return {
      coherenceScore,
      atmosphericAlignment,
      culturalFit,
      temporalConsistency,
      sensoryHarmony
    };
  }

  /**
   * Generate atmospheric word characteristics for enhanced generation
   */
  generateAtmosphericWordCharacteristics(context: AtmosphericContext): {
    preferredSounds: string[];
    rhythmicQualities: string[];
    semanticFields: string[];
    metaphoricalTendencies: string[];
    avoidPatterns: string[];
  } {
    const matchingProfiles = this.findMatchingAtmosphericProfiles(context);
    
    const characteristics = {
      preferredSounds: [] as string[],
      rhythmicQualities: [] as string[],
      semanticFields: [] as string[],
      metaphoricalTendencies: [] as string[],
      avoidPatterns: [] as string[]
    };

    // Aggregate characteristics from matching profiles
    for (const profile of matchingProfiles) {
      characteristics.preferredSounds.push(...profile.wordCharacteristics.preferredTones);
      characteristics.rhythmicQualities.push(...profile.wordCharacteristics.rhythmicQualities);
      characteristics.semanticFields.push(...profile.wordCharacteristics.semanticFields);
      characteristics.metaphoricalTendencies.push(...profile.wordCharacteristics.metaphoricalTendencies);
    }

    // Remove duplicates and return
    return {
      preferredSounds: [...new Set(characteristics.preferredSounds)],
      rhythmicQualities: [...new Set(characteristics.rhythmicQualities)],
      semanticFields: [...new Set(characteristics.semanticFields)],
      metaphoricalTendencies: [...new Set(characteristics.metaphoricalTendencies)],
      avoidPatterns: [...new Set(characteristics.avoidPatterns)]
    };
  }

  /**
   * Analyze seasonal influence on mood
   */
  private analyzeSeasonalInfluence(seasonalMood: string): { moods: string[], dimensions: EmotionalDimensions } {
    // Extract season and phase from seasonal mood
    const [season, phase] = seasonalMood.split('_');
    const progression = this.seasonalProgressions.get(season);
    
    if (!progression) {
      return { moods: [], dimensions: { energy: 50, valence: 50, complexity: 50, intensity: 50, darkness: 50, mystery: 50 } };
    }

    let phaseData;
    switch (phase) {
      case 'awakening':
      case 'beginning':
        phaseData = progression.phases.early;
        break;
      case 'peak':
      case 'height':
        phaseData = progression.phases.peak;
        break;
      case 'reflection':
      case 'introspection':
      case 'end':
        phaseData = progression.phases.late;
        break;
      default:
        phaseData = progression.phases.peak; // Default to peak
    }

    // Convert phase data to emotional dimensions
    const dimensions: EmotionalDimensions = {
      energy: this.mapSeasonalCharacteristicToEnergy(phaseData.characteristics),
      valence: this.mapSeasonalCharacteristicToValence(phaseData.characteristics),
      complexity: phaseData.intensity,
      intensity: phaseData.intensity,
      darkness: 100 - phaseData.intensity,
      mystery: this.mapSeasonalCharacteristicToMystery(phaseData.characteristics)
    };

    return { moods: phaseData.moods, dimensions };
  }

  /**
   * Analyze weather influence on mood
   */
  private analyzeWeatherInfluence(weather: string): { moods: string[], dimensions: EmotionalDimensions } {
    const weatherMoodMap: Record<string, { moods: string[], dimensions: EmotionalDimensions }> = {
      'sunny': {
        moods: ['uplifting', 'energetic', 'optimistic'],
        dimensions: { energy: 80, valence: 90, complexity: 40, intensity: 60, darkness: 10, mystery: 20 }
      },
      'cloudy': {
        moods: ['contemplative', 'subdued', 'introspective'],
        dimensions: { energy: 45, valence: 50, complexity: 60, intensity: 40, darkness: 55, mystery: 60 }
      },
      'rainy': {
        moods: ['melancholic', 'peaceful', 'nostalgic'],
        dimensions: { energy: 35, valence: 40, complexity: 70, intensity: 55, darkness: 60, mystery: 65 }
      },
      'stormy': {
        moods: ['dramatic', 'intense', 'powerful'],
        dimensions: { energy: 90, valence: 35, complexity: 80, intensity: 95, darkness: 75, mystery: 70 }
      },
      'foggy': {
        moods: ['mysterious', 'ethereal', 'uncertain'],
        dimensions: { energy: 30, valence: 45, complexity: 85, intensity: 50, darkness: 70, mystery: 95 }
      },
      'snowy': {
        moods: ['peaceful', 'pure', 'crystalline'],
        dimensions: { energy: 25, valence: 65, complexity: 55, intensity: 40, darkness: 30, mystery: 50 }
      }
    };

    return weatherMoodMap[weather] || { 
      moods: [], 
      dimensions: { energy: 50, valence: 50, complexity: 50, intensity: 50, darkness: 50, mystery: 50 } 
    };
  }

  /**
   * Calculate temporal alignment
   */
  private calculateTemporalAlignment(context: AtmosphericContext): number {
    let alignment = 0.5; // Base alignment

    // Check for temporal consistency
    if (context.timeContext && context.seasonalMood) {
      // Some combinations are more natural
      const timeSeasonCompatibility = this.getTimeSeasonCompatibility(context.timeContext, context.seasonalMood);
      alignment += timeSeasonCompatibility * 0.3;
    }

    if (context.eraAtmosphere) {
      // Era atmosphere affects temporal alignment
      const eraAlignmentBonus = this.getEraAlignmentBonus(context.eraAtmosphere);
      alignment += eraAlignmentBonus * 0.2;
    }

    return Math.max(0, Math.min(1, alignment));
  }

  /**
   * Generate atmospheric recommendations
   */
  private generateAtmosphericRecommendations(
    context: AtmosphericContext, 
    atmosphericMoods: string[]
  ): { enhanceFactors: string[], avoidFactors: string[], atmosphericModifiers: string[] } {
    const enhanceFactors: string[] = [];
    const avoidFactors: string[] = [];
    const atmosphericModifiers: string[] = [];

    // Generate enhancement factors based on context
    if (context.weather === 'stormy') {
      enhanceFactors.push('intensity', 'power', 'drama');
      avoidFactors.push('gentleness', 'subtlety');
      atmosphericModifiers.push('storm_intensifier');
    }

    if (context.timeContext === 'midnight') {
      enhanceFactors.push('mystery', 'depth', 'solitude');
      avoidFactors.push('brightness', 'obviousness');
      atmosphericModifiers.push('midnight_amplifier');
    }

    if (context.seasonalMood?.includes('spring')) {
      enhanceFactors.push('renewal', 'growth', 'hope');
      avoidFactors.push('death', 'ending', 'darkness');
      atmosphericModifiers.push('spring_awakening');
    }

    if (context.culturalVibe === 'mediterranean') {
      enhanceFactors.push('warmth', 'passion', 'life');
      avoidFactors.push('coldness', 'isolation');
      atmosphericModifiers.push('mediterranean_warmth');
    }

    if (context.spiritualResonance === 'sacred') {
      enhanceFactors.push('reverence', 'timelessness', 'depth');
      avoidFactors.push('superficiality', 'haste');
      atmosphericModifiers.push('sacred_resonance');
    }

    return {
      enhanceFactors: [...new Set(enhanceFactors)],
      avoidFactors: [...new Set(avoidFactors)],
      atmosphericModifiers: [...new Set(atmosphericModifiers)]
    };
  }

  /**
   * Calculate pattern atmospheric alignment
   */
  private calculatePatternAtmosphericAlignment(
    pattern: PatternDefinition,
    atmosphericMoods: string[],
    environmentalInfluences: EmotionalDimensions
  ): number {
    let alignment = 0;

    // Check if pattern moods align with atmospheric moods
    if (pattern.moods) {
      for (const patternMood of pattern.moods) {
        if (atmosphericMoods.includes(patternMood)) {
          alignment += 0.3;
        }
      }
    }

    // Check pattern category alignment with atmospheric context
    const categoryAtmosphericFit = this.getCategoryAtmosphericFit(pattern.category, atmosphericMoods);
    alignment += categoryAtmosphericFit * 0.4;

    // Check emotional dimension alignment
    // This would require pattern emotional characteristics analysis
    // For now, use a simplified approach based on pattern weight and complexity
    const weightAlignment = this.getWeightEnvironmentalAlignment(pattern.weight, environmentalInfluences);
    alignment += weightAlignment * 0.3;

    return Math.max(0, Math.min(1, alignment));
  }

  /**
   * Calculate cultural fit for pattern
   */
  private calculateCulturalFit(pattern: PatternDefinition, context: AtmosphericContext): number {
    if (!context.culturalVibe) return 0.5; // Neutral if no cultural context

    const culturalProfile = this.culturalProfiles.get(context.culturalVibe);
    if (!culturalProfile) return 0.5;

    let fit = 0.5; // Base fit

    // Check pattern complexity against cultural communication style
    if (culturalProfile.communicationStyle === 'direct' && pattern.subcategory === 'simple') {
      fit += 0.2;
    }
    if (culturalProfile.communicationStyle === 'contextual' && pattern.category === 'conceptual') {
      fit += 0.2;
    }

    // Check pattern moods against cultural preferred moods
    if (pattern.moods) {
      for (const patternMood of pattern.moods) {
        if (culturalProfile.preferredMoods.includes(patternMood)) {
          fit += 0.15;
        }
      }
    }

    return Math.max(0, Math.min(1, fit));
  }

  /**
   * Calculate temporal consistency
   */
  private calculateTemporalConsistency(pattern: PatternDefinition, context: AtmosphericContext): number {
    let consistency = 0.5; // Base consistency

    if (context.timeContext) {
      const timeAtmosphere = this.timeAtmosphericMap.get(context.timeContext);
      if (timeAtmosphere && pattern.moods) {
        for (const patternMood of pattern.moods) {
          if (timeAtmosphere.primaryMoods.includes(patternMood)) {
            consistency += 0.2;
          }
        }
      }
    }

    if (context.eraAtmosphere) {
      // Different eras prefer different complexity levels
      const eraComplexityPreference = this.getEraComplexityPreference(context.eraAtmosphere);
      const patternComplexity = pattern.maxWordCount * 25; // Simple complexity estimation
      const complexityAlignment = 1 - Math.abs(eraComplexityPreference - patternComplexity) / 100;
      consistency += complexityAlignment * 0.3;
    }

    return Math.max(0, Math.min(1, consistency));
  }

  /**
   * Calculate sensory harmony
   */
  private calculateSensoryHarmony(pattern: PatternDefinition, context: AtmosphericContext): number {
    // This is a simplified calculation
    // In a full implementation, this would analyze the sensory attributes
    // of the pattern against the atmospheric context
    
    let harmony = 0.5; // Base harmony

    // Check if pattern template aligns with sensory context
    if (context.lighting === 'soft' && pattern.template.includes('gentle')) {
      harmony += 0.2;
    }
    if (context.space === 'vast' && pattern.template.includes('infinite')) {
      harmony += 0.2;
    }

    return Math.max(0, Math.min(1, harmony));
  }

  /**
   * Helper methods for mapping seasonal characteristics
   */
  private mapSeasonalCharacteristicToEnergy(characteristics: string[]): number {
    const energyMap: Record<string, number> = {
      'tender': 30, 'emerging': 40, 'fragile': 25,
      'vibrant': 80, 'blooming': 70, 'passionate': 85,
      'rich': 60, 'mature': 55, 'satisfied': 50,
      'changing': 55, 'golden': 60, 'reflective': 40,
      'complex': 50, 'profound': 45, 'bare': 35,
      'sharp': 60, 'clear': 65, 'inward': 30,
      'still': 20, 'essential': 25, 'stirring': 45
    };

    let totalEnergy = 50; // Base energy
    let count = 0;

    for (const characteristic of characteristics) {
      if (energyMap[characteristic]) {
        totalEnergy += energyMap[characteristic];
        count++;
      }
    }

    return count > 0 ? totalEnergy / (count + 1) : 50;
  }

  private mapSeasonalCharacteristicToValence(characteristics: string[]): number {
    const valenceMap: Record<string, number> = {
      'tender': 70, 'emerging': 75, 'fragile': 60,
      'vibrant': 85, 'blooming': 90, 'passionate': 80,
      'rich': 75, 'mature': 70, 'satisfied': 80,
      'changing': 50, 'golden': 80, 'reflective': 55,
      'complex': 45, 'profound': 50, 'bare': 40,
      'sharp': 45, 'clear': 60, 'inward': 50,
      'still': 60, 'essential': 55, 'stirring': 65
    };

    let totalValence = 50; // Base valence
    let count = 0;

    for (const characteristic of characteristics) {
      if (valenceMap[characteristic]) {
        totalValence += valenceMap[characteristic];
        count++;
      }
    }

    return count > 0 ? totalValence / (count + 1) : 50;
  }

  private mapSeasonalCharacteristicToMystery(characteristics: string[]): number {
    const mysteryMap: Record<string, number> = {
      'tender': 40, 'emerging': 60, 'fragile': 70,
      'vibrant': 30, 'blooming': 25, 'passionate': 35,
      'rich': 45, 'mature': 40, 'satisfied': 30,
      'changing': 70, 'golden': 50, 'reflective': 75,
      'complex': 85, 'profound': 90, 'bare': 60,
      'sharp': 55, 'clear': 30, 'inward': 80,
      'still': 70, 'essential': 85, 'stirring': 65
    };

    let totalMystery = 50; // Base mystery
    let count = 0;

    for (const characteristic of characteristics) {
      if (mysteryMap[characteristic]) {
        totalMystery += mysteryMap[characteristic];
        count++;
      }
    }

    return count > 0 ? totalMystery / (count + 1) : 50;
  }

  /**
   * Helper method to blend emotional dimensions
   */
  private blendEmotionalDimensions(
    base: EmotionalDimensions, 
    modifier: EmotionalDimensions, 
    weight: number = 0.5
  ): EmotionalDimensions {
    return {
      energy: base.energy * (1 - weight) + modifier.energy * weight,
      valence: base.valence * (1 - weight) + modifier.valence * weight,
      complexity: base.complexity * (1 - weight) + modifier.complexity * weight,
      intensity: base.intensity * (1 - weight) + modifier.intensity * weight,
      darkness: base.darkness * (1 - weight) + modifier.darkness * weight,
      mystery: base.mystery * (1 - weight) + modifier.mystery * weight
    };
  }

  /**
   * Helper methods for compatibility and alignment calculations
   */
  private getTimeSeasonCompatibility(timeContext: string, seasonalMood: string): number {
    // Some time-season combinations are more natural
    const compatibilities: Record<string, Record<string, number>> = {
      'dawn': { 'spring_awakening': 0.9, 'summer_peak': 0.6, 'autumn_reflection': 0.7, 'winter_introspection': 0.5 },
      'night': { 'spring_awakening': 0.4, 'summer_peak': 0.7, 'autumn_reflection': 0.8, 'winter_introspection': 0.9 },
      'midnight': { 'spring_awakening': 0.3, 'summer_peak': 0.5, 'autumn_reflection': 0.9, 'winter_introspection': 1.0 }
    };

    return compatibilities[timeContext]?.[seasonalMood] || 0.5;
  }

  private getEraAlignmentBonus(eraAtmosphere: string): number {
    const alignmentBonuses: Record<string, number> = {
      'ancient': 0.3,
      'medieval': 0.2,
      'renaissance': 0.1,
      'industrial': 0.0,
      'modern': -0.1,
      'futuristic': 0.2,
      'timeless': 0.4
    };

    return alignmentBonuses[eraAtmosphere] || 0;
  }

  private getCategoryAtmosphericFit(category: string, atmosphericMoods: string[]): number {
    const categoryMoodAffinities: Record<string, string[]> = {
      'conceptual': ['mysterious', 'complex', 'abstract'],
      'descriptive': ['clear', 'bright', 'accessible'],
      'narrative': ['engaging', 'flowing', 'temporal'],
      'atmospheric': ['mysterious', 'deep', 'environmental'],
      'emotional': ['passionate', 'intense', 'expressive']
    };

    const affinities = categoryMoodAffinities[category] || [];
    let fit = 0;

    for (const mood of atmosphericMoods) {
      if (affinities.some(affinity => mood.includes(affinity))) {
        fit += 0.2;
      }
    }

    return Math.min(1, fit);
  }

  private getWeightEnvironmentalAlignment(weight: number, environment: EmotionalDimensions): number {
    // Higher weights generally align with higher intensity environments
    const intensityAlignment = 1 - Math.abs(weight - (environment.intensity / 100));
    return intensityAlignment;
  }

  private getEraComplexityPreference(era: string): number {
    const complexityPreferences: Record<string, number> = {
      'ancient': 70,
      'medieval': 65,
      'renaissance': 75,
      'industrial': 50,
      'modern': 45,
      'futuristic': 80,
      'timeless': 85
    };

    return complexityPreferences[era] || 50;
  }
}

// Export singleton instance
export const atmosphericIntelligence = new AtmosphericIntelligence();