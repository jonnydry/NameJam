/**
 * Creative Pattern Categories - Specialized pattern generators for artistic and expressive name creation
 * Provides metaphorical, narrative, sensory, temporal, and spatial pattern categories
 */

import { EnhancedWordSource } from './types';
import { getRandomWord, capitalize, singularize } from './stringUtils';
import { PatternDefinition, PatternContext } from './advancedPatternLibrary';

export interface CreativePattern {
  generate: (sources: EnhancedWordSource, context?: PatternContext) => string;
  description: string;
  examples: string[];
  complexity: 'simple' | 'medium' | 'complex';
  wordCountRange: [number, number];
}

export class CreativePatternCategories {
  
  // METAPHORICAL PATTERNS - Abstract concepts and symbolic references
  getMetaphoricalPatterns(): Record<string, CreativePattern> {
    return {
      elements_fusion: {
        generate: (sources, context) => {
          const elements = ['Fire', 'Water', 'Earth', 'Air', 'Light', 'Shadow', 'Thunder', 'Lightning'];
          const concepts = ['Dreams', 'Souls', 'Hearts', 'Minds', 'Spirits', 'Voices', 'Echoes', 'Memories'];
          const element = getRandomWord(elements) || 'Fire';
          const concept = getRandomWord([...concepts, ...sources.validNouns]) || 'Dreams';
          const connectives = ['of', 'and', 'in', 'through', 'beyond', 'within'];
          const connective = getRandomWord(connectives) || 'of';
          return `${element} ${connective} ${concept}`;
        },
        description: 'Elemental forces combined with abstract concepts',
        examples: ['Fire of Dreams', 'Thunder and Souls', 'Light through Shadows'],
        complexity: 'medium',
        wordCountRange: [3, 4]
      },
      
      color_emotions: {
        generate: (sources, context) => {
          const colors = ['Crimson', 'Azure', 'Golden', 'Silver', 'Obsidian', 'Pearl', 'Emerald', 'Violet'];
          const emotions = ['Rage', 'Serenity', 'Passion', 'Melancholy', 'Euphoria', 'Yearning', 'Bliss', 'Sorrow'];
          const intensifiers = ['Deep', 'Burning', 'Frozen', 'Electric', 'Pure', 'Wild', 'Gentle', 'Fierce'];
          
          const color = getRandomWord(colors) || 'Crimson';
          const emotion = getRandomWord([...emotions, ...sources.validNouns]) || 'Passion';
          
          if (Math.random() > 0.5) {
            const intensifier = getRandomWord(intensifiers) || 'Deep';
            return `${intensifier} ${color} ${emotion}`;
          } else {
            return `${color} ${emotion}`;
          }
        },
        description: 'Colors paired with emotional states',
        examples: ['Crimson Rage', 'Azure Serenity', 'Deep Golden Passion'],
        complexity: 'simple',
        wordCountRange: [2, 3]
      },
      
      mirror_concepts: {
        generate: (sources, context) => {
          const concepts = ['Truth', 'Beauty', 'Love', 'Power', 'Freedom', 'Peace', 'Chaos', 'Order'];
          const mirrors = ['Reflection', 'Shadow', 'Echo', 'Inverse', 'Opposite', 'Twin', 'Double', 'Mirror'];
          const modifiers = ['Hidden', 'Lost', 'Found', 'Broken', 'Perfect', 'Shattered', 'Whole', 'Ancient'];
          
          const concept = getRandomWord([...concepts, ...sources.validNouns]) || 'Truth';
          const mirror = getRandomWord(mirrors) || 'Reflection';
          const modifier = getRandomWord([...modifiers, ...sources.validAdjectives]) || 'Hidden';
          
          const patterns = [
            `${modifier} ${concept} ${mirror}`,
            `${concept}'s ${modifier} ${mirror}`,
            `The ${modifier} ${mirror} of ${concept}`
          ];
          
          return getRandomWord(patterns) || `${modifier} ${concept} ${mirror}`;
        },
        description: 'Concepts reflected through opposing or complementary ideas',
        examples: ['Hidden Truth Reflection', "Love's Broken Mirror", 'The Perfect Shadow of Chaos'],
        complexity: 'complex',
        wordCountRange: [3, 5]
      },
      
      mythical_fusion: {
        generate: (sources, context) => {
          const mythical = ['Phoenix', 'Dragon', 'Sphinx', 'Kraken', 'Gryphon', 'Unicorn', 'Leviathan', 'Chimera'];
          const realms = ['Abyss', 'Heavens', 'Depths', 'Heights', 'Void', 'Nexus', 'Threshold', 'Gateway'];
          const qualities = ['Rising', 'Fallen', 'Sleeping', 'Awakening', 'Dancing', 'Singing', 'Crying', 'Laughing'];
          
          const myth = getRandomWord(mythical) || 'Phoenix';
          const realm = getRandomWord([...realms, ...sources.validContextualWords]) || 'Abyss';
          const quality = getRandomWord([...qualities, ...sources.validVerbs.map(v => v + 'ing')]) || 'Rising';
          
          return `${quality} ${myth} ${realm}`;
        },
        description: 'Mythical creatures in fantastical settings',
        examples: ['Rising Phoenix Abyss', 'Sleeping Dragon Nexus', 'Dancing Gryphon Heights'],
        complexity: 'medium',
        wordCountRange: [3, 3]
      }
    };
  }

  // NARRATIVE PATTERNS - Story-driven and character-based structures
  getNarrativePatterns(): Record<string, CreativePattern> {
    return {
      character_journey: {
        generate: (sources, context) => {
          const characters = ['Wanderer', 'Dreamer', 'Seeker', 'Guardian', 'Warrior', 'Poet', 'Prophet', 'Rebel'];
          const destinations = ['Home', 'Paradise', 'Truth', 'Freedom', 'Glory', 'Peace', 'Dawn', 'Light'];
          const obstacles = ['Through Darkness', 'Beyond Pain', 'Past Sorrow', 'Over Mountains', 'Under Stars'];
          
          const character = getRandomWord([...characters, ...sources.validNouns]) || 'Wanderer';
          const destination = getRandomWord([...destinations, ...sources.validNouns]) || 'Home';
          const obstacle = getRandomWord(obstacles) || 'Through Darkness';
          
          const patterns = [
            `${character} Seeks ${destination}`,
            `${character}'s Path to ${destination}`,
            `The ${character} ${obstacle}`,
            `${character} ${obstacle} to ${destination}`
          ];
          
          return getRandomWord(patterns) || `${character} Seeks ${destination}`;
        },
        description: 'Character-driven journey narratives',
        examples: ['Wanderer Seeks Home', "Dreamer's Path to Truth", 'The Seeker Through Darkness'],
        complexity: 'medium',
        wordCountRange: [3, 5]
      },
      
      conflict_resolution: {
        generate: (sources, context) => {
          const conflicts = ['War', 'Battle', 'Struggle', 'Fight', 'Clash', 'Storm', 'Crisis', 'Trial'];
          const resolutions = ['Peace', 'Victory', 'Unity', 'Harmony', 'Balance', 'Hope', 'Love', 'Light'];
          const transitions = ['Becomes', 'Turns to', 'Leads to', 'Transforms into', 'Evolves to'];
          
          const conflict = getRandomWord([...conflicts, ...sources.validNouns]) || 'War';
          const resolution = getRandomWord([...resolutions, ...sources.validNouns]) || 'Peace';
          const transition = getRandomWord(transitions) || 'Becomes';
          
          return `When ${conflict} ${transition} ${resolution}`;
        },
        description: 'Conflict transformation narratives',
        examples: ['When War Becomes Peace', 'When Storm Turns to Light', 'When Battle Leads to Unity'],
        complexity: 'complex',
        wordCountRange: [4, 5]
      },
      
      dialogue_fragments: {
        generate: (sources, context) => {
          const speakers = ['She', 'He', 'They', 'We', 'You', 'I'];
          const verbs = ['Said', 'Whispered', 'Cried', 'Sang', 'Declared', 'Promised', 'Dreamed'];
          const subjects = ['Love', 'Hope', 'Tomorrow', 'Forever', 'Nothing', 'Everything', 'Truth', 'Lies'];
          const modifiers = ['Would Come', 'Was Gone', 'Stayed True', 'Felt Real', 'Seemed False'];
          
          const speaker = getRandomWord(speakers) || 'She';
          const verb = getRandomWord([...verbs, ...sources.validVerbs]) || 'Said';
          const subject = getRandomWord([...subjects, ...sources.validNouns]) || 'Love';
          const modifier = getRandomWord(modifiers) || 'Would Come';
          
          return `${speaker} ${verb} ${subject} ${modifier}`;
        },
        description: 'Fragments of dialogue or conversation',
        examples: ['She Said Love Would Come', 'He Whispered Truth Felt Real', 'They Sang Hope Stayed True'],
        complexity: 'medium',
        wordCountRange: [4, 5]
      },
      
      memory_fragments: {
        generate: (sources, context) => {
          const timeframes = ['Yesterday', 'Long Ago', 'Once', 'Before', 'When Young', 'In Dreams'];
          const subjects = ['We', 'I', 'They', 'She', 'He', 'Love', 'Hope', 'Time'];
          const actions = ['Danced', 'Sang', 'Loved', 'Dreamed', 'Lived', 'Believed', 'Hoped', 'Yearned'];
          const contexts = ['Under Stars', 'In Rain', 'Through Fire', 'By Water', 'With Music'];
          
          const timeframe = getRandomWord(timeframes) || 'Once';
          const subject = getRandomWord([...subjects, ...sources.validNouns]) || 'We';
          const action = getRandomWord([...actions, ...sources.validVerbs]) || 'Danced';
          const contextWord = getRandomWord(contexts) || 'Under Stars';
          
          return `${timeframe} ${subject} ${action} ${contextWord}`;
        },
        description: 'Nostalgic memory and reminiscence patterns',
        examples: ['Once We Danced Under Stars', 'Long Ago Love Sang In Rain', 'Yesterday Hope Lived Through Fire'],
        complexity: 'medium',
        wordCountRange: [4, 5]
      }
    };
  }

  // SENSORY PATTERNS - Color, texture, sound, and feeling combinations
  getSensoryPatterns(): Record<string, CreativePattern> {
    return {
      texture_sounds: {
        generate: (sources, context) => {
          const textures = ['Smooth', 'Rough', 'Soft', 'Sharp', 'Silky', 'Velvet', 'Crystal', 'Liquid'];
          const sounds = ['Whispers', 'Echoes', 'Rhythms', 'Melodies', 'Harmonies', 'Beats', 'Chords', 'Notes'];
          const qualities = ['Rising', 'Falling', 'Flowing', 'Breaking', 'Dancing', 'Spinning', 'Glowing'];
          
          const texture = getRandomWord([...textures, ...sources.validAdjectives]) || 'Smooth';
          const sound = getRandomWord([...sounds, ...sources.validMusicalTerms]) || 'Whispers';
          const quality = getRandomWord(qualities) || 'Rising';
          
          return `${texture} ${sound} ${quality}`;
        },
        description: 'Textural qualities combined with sound elements',
        examples: ['Smooth Whispers Rising', 'Silky Rhythms Dancing', 'Crystal Echoes Flowing'],
        complexity: 'simple',
        wordCountRange: [3, 3]
      },
      
      synesthetic_blends: {
        generate: (sources, context) => {
          const visualColors = ['Blue', 'Red', 'Gold', 'Silver', 'Green', 'Purple', 'Black', 'White'];
          const audioQualities = ['Sound', 'Music', 'Noise', 'Silence', 'Voice', 'Song', 'Harmony', 'Discord'];
          const tactileFeels = ['Touch', 'Feel', 'Warmth', 'Cold', 'Pressure', 'Softness', 'Hardness'];
          const intensities = ['Deep', 'Bright', 'Faint', 'Strong', 'Gentle', 'Fierce', 'Wild', 'Calm'];
          
          const visual = getRandomWord(visualColors) || 'Blue';
          const audio = getRandomWord([...audioQualities, ...sources.validMusicalTerms]) || 'Sound';
          const tactile = getRandomWord(tactileFeels) || 'Touch';
          const intensity = getRandomWord([...intensities, ...sources.validAdjectives]) || 'Deep';
          
          const patterns = [
            `${visual} ${audio}`,
            `${intensity} ${visual} ${audio}`,
            `${visual} ${audio} ${tactile}`,
            `The ${intensity} ${visual} of ${audio}`
          ];
          
          return getRandomWord(patterns) || `${visual} ${audio}`;
        },
        description: 'Cross-sensory experiences and synesthetic combinations',
        examples: ['Blue Sound', 'Deep Red Music', 'The Bright Gold of Silence'],
        complexity: 'medium',
        wordCountRange: [2, 5]
      },
      
      atmospheric_moods: {
        generate: (sources, context) => {
          const atmospheres = ['Mist', 'Fog', 'Haze', 'Glow', 'Shadow', 'Light', 'Darkness', 'Twilight'];
          const locations = ['Valley', 'Mountain', 'Ocean', 'Desert', 'Forest', 'City', 'Field', 'Sky'];
          const moods = ['Dreaming', 'Sleeping', 'Waking', 'Dancing', 'Singing', 'Crying', 'Laughing', 'Breathing'];
          const qualities = ['Gentle', 'Wild', 'Ancient', 'Eternal', 'Fleeting', 'Sacred', 'Secret', 'Hidden'];
          
          const atmosphere = getRandomWord([...atmospheres, ...sources.validContextualWords]) || 'Mist';
          const location = getRandomWord([...locations, ...sources.validNouns]) || 'Valley';
          const mood = getRandomWord([...moods, ...sources.validVerbs.map(v => v + 'ing')]) || 'Dreaming';
          const quality = getRandomWord([...qualities, ...sources.validAdjectives]) || 'Gentle';
          
          return `${quality} ${atmosphere} ${location} ${mood}`;
        },
        description: 'Atmospheric conditions with emotional undertones',
        examples: ['Gentle Mist Valley Dreaming', 'Wild Shadow Forest Dancing', 'Ancient Light Mountain Singing'],
        complexity: 'complex',
        wordCountRange: [4, 4]
      },
      
      temperature_emotions: {
        generate: (sources, context) => {
          const temperatures = ['Hot', 'Cold', 'Warm', 'Cool', 'Frozen', 'Burning', 'Melting', 'Flowing'];
          const emotions = ['Love', 'Hate', 'Joy', 'Sorrow', 'Anger', 'Peace', 'Fear', 'Hope'];
          const intensifiers = ['Like Fire', 'Like Ice', 'Like Steel', 'Like Silk', 'Like Stone', 'Like Wind'];
          
          const temperature = getRandomWord(temperatures) || 'Warm';
          const emotion = getRandomWord([...emotions, ...sources.validNouns]) || 'Love';
          const intensifier = getRandomWord(intensifiers) || 'Like Fire';
          
          return `${temperature} ${emotion} ${intensifier}`;
        },
        description: 'Temperature sensations combined with emotional states',
        examples: ['Warm Love Like Fire', 'Cold Sorrow Like Ice', 'Burning Hope Like Steel'],
        complexity: 'simple',
        wordCountRange: [3, 3]
      }
    };
  }

  // TEMPORAL PATTERNS - Time-based and seasonal concepts
  getTemporalPatterns(): Record<string, CreativePattern> {
    return {
      era_transitions: {
        generate: (sources, context) => {
          const pastEras = ['Ancient', 'Classical', 'Medieval', 'Renaissance', 'Victorian', 'Golden'];
          const futureEras = ['Future', 'Tomorrow', 'Digital', 'Cyber', 'Quantum', 'Neo'];
          const concepts = ['Dreams', 'Memories', 'Hopes', 'Fears', 'Love', 'Music', 'Art', 'Life'];
          const transitions = ['Meets', 'Becomes', 'Echoes in', 'Flows to', 'Transforms into'];
          
          const pastEra = getRandomWord(pastEras) || 'Ancient';
          const futureEra = getRandomWord(futureEras) || 'Future';
          const concept = getRandomWord([...concepts, ...sources.validNouns]) || 'Dreams';
          const transition = getRandomWord(transitions) || 'Meets';
          
          return `${pastEra} ${concept} ${transition} ${futureEra}`;
        },
        description: 'Transitions between historical and futuristic concepts',
        examples: ['Ancient Dreams Meets Future', 'Medieval Love Echoes in Digital', 'Golden Music Flows to Tomorrow'],
        complexity: 'complex',
        wordCountRange: [4, 5]
      },
      
      seasonal_cycles: {
        generate: (sources, context) => {
          const seasons = ['Spring', 'Summer', 'Autumn', 'Winter', 'Dawn', 'Dusk', 'Midnight', 'Noon'];
          const cyclicActions = ['Returns', 'Awakens', 'Sleeps', 'Dances', 'Sings', 'Whispers', 'Calls', 'Waits'];
          const subjects = ['Love', 'Hope', 'Dreams', 'Hearts', 'Souls', 'Memories', 'Spirits', 'Voices'];
          const qualities = ['Eternal', 'Endless', 'Forever', 'Always', 'Never', 'Sometimes', 'Once', 'Again'];
          
          const season = getRandomWord(seasons) || 'Spring';
          const action = getRandomWord([...cyclicActions, ...sources.validVerbs]) || 'Returns';
          const subject = getRandomWord([...subjects, ...sources.validNouns]) || 'Love';
          const quality = getRandomWord(qualities) || 'Eternal';
          
          return `When ${season} ${action} ${subject} ${quality}`;
        },
        description: 'Seasonal and cyclical time patterns',
        examples: ['When Spring Returns Love Eternal', 'When Winter Sleeps Dreams Forever', 'When Dawn Awakens Hope Again'],
        complexity: 'medium',
        wordCountRange: [4, 5]
      },
      
      time_fragments: {
        generate: (sources, context) => {
          const timeUnits = ['Seconds', 'Minutes', 'Hours', 'Days', 'Years', 'Moments', 'Lifetimes', 'Eternities'];
          const qualifiers = ['Lost', 'Found', 'Stolen', 'Given', 'Borrowed', 'Saved', 'Wasted', 'Treasured'];
          const contexts = ['In Love', 'In Dreams', 'In Music', 'In Silence', 'In Light', 'In Darkness'];
          
          const timeUnit = getRandomWord(timeUnits) || 'Moments';
          const qualifier = getRandomWord([...qualifiers, ...sources.validAdjectives]) || 'Lost';
          const contextWord = getRandomWord([...contexts, ...sources.validContextualWords]) || 'In Love';
          
          return `${qualifier} ${timeUnit} ${contextWord}`;
        },
        description: 'Fragments and qualities of time experiences',
        examples: ['Lost Moments In Love', 'Stolen Hours In Dreams', 'Treasured Seconds In Music'],
        complexity: 'simple',
        wordCountRange: [3, 3]
      },
      
      age_wisdom: {
        generate: (sources, context) => {
          const ages = ['Young', 'Old', 'Ancient', 'Newborn', 'Aging', 'Timeless', 'Ageless', 'Mature'];
          const wisdom = ['Soul', 'Heart', 'Mind', 'Spirit', 'Voice', 'Eyes', 'Hands', 'Memory'];
          const actions = ['Learns', 'Teaches', 'Knows', 'Remembers', 'Forgets', 'Discovers', 'Seeks', 'Finds'];
          const truths = ['Truth', 'Love', 'Peace', 'Joy', 'Pain', 'Beauty', 'Life', 'Death'];
          
          const age = getRandomWord([...ages, ...sources.validAdjectives]) || 'Ancient';
          const wisdomPart = getRandomWord([...wisdom, ...sources.validNouns]) || 'Soul';
          const action = getRandomWord([...actions, ...sources.validVerbs]) || 'Learns';
          const truth = getRandomWord([...truths, ...sources.validNouns]) || 'Truth';
          
          return `${age} ${wisdomPart} ${action} ${truth}`;
        },
        description: 'Age and wisdom relationship patterns',
        examples: ['Ancient Soul Learns Truth', 'Young Heart Discovers Love', 'Timeless Mind Remembers Peace'],
        complexity: 'medium',
        wordCountRange: [4, 4]
      }
    };
  }

  // SPATIAL PATTERNS - Location and movement-based structures
  getSpatialPatterns(): Record<string, CreativePattern> {
    return {
      direction_movement: {
        generate: (sources, context) => {
          const directions = ['North', 'South', 'East', 'West', 'Up', 'Down', 'Beyond', 'Through'];
          const movements = ['Walking', 'Running', 'Flying', 'Dancing', 'Flowing', 'Drifting', 'Soaring', 'Falling'];
          const destinations = ['Home', 'Heaven', 'Ocean', 'Mountain', 'Forest', 'Desert', 'City', 'Stars'];
          const purposes = ['For Love', 'For Truth', 'For Peace', 'For Freedom', 'For Glory', 'For Home'];
          
          const direction = getRandomWord(directions) || 'Beyond';
          const movement = getRandomWord([...movements, ...sources.validVerbs.map(v => v + 'ing')]) || 'Walking';
          const destination = getRandomWord([...destinations, ...sources.validContextualWords]) || 'Home';
          const purpose = getRandomWord(purposes) || 'For Love';
          
          return `${movement} ${direction} ${destination} ${purpose}`;
        },
        description: 'Directional movement with purpose',
        examples: ['Walking Beyond Mountains For Love', 'Flying North to Stars For Freedom', 'Dancing Through Forest For Peace'],
        complexity: 'complex',
        wordCountRange: [4, 5]
      },
      
      elevation_perspective: {
        generate: (sources, context) => {
          const elevations = ['Above', 'Below', 'Between', 'Among', 'Beneath', 'Upon', 'Under', 'Over'];
          const perspectives = ['Clouds', 'Earth', 'Stars', 'Trees', 'Mountains', 'Waves', 'Stones', 'Sky'];
          const subjects = ['Dreams', 'Love', 'Music', 'Hope', 'Life', 'Time', 'Truth', 'Beauty'];
          const actions = ['Lives', 'Grows', 'Sings', 'Dances', 'Flows', 'Shines', 'Breathes', 'Waits'];
          
          const elevation = getRandomWord(elevations) || 'Above';
          const perspective = getRandomWord([...perspectives, ...sources.validNouns]) || 'Clouds';
          const subject = getRandomWord([...subjects, ...sources.validNouns]) || 'Dreams';
          const action = getRandomWord([...actions, ...sources.validVerbs]) || 'Lives';
          
          return `${elevation} the ${perspective} ${subject} ${action}`;
        },
        description: 'Elevational and perspectival relationships',
        examples: ['Above the Clouds Dreams Live', 'Below the Stars Love Sings', 'Between the Mountains Hope Flows'],
        complexity: 'medium',
        wordCountRange: [4, 5]
      },
      
      boundary_crossing: {
        generate: (sources, context) => {
          const boundaries = ['Edge', 'Border', 'Threshold', 'Gateway', 'Bridge', 'Wall', 'Door', 'Window'];
          const crossingActions = ['Crossing', 'Breaking', 'Opening', 'Closing', 'Building', 'Finding', 'Seeking'];
          const realms = ['Worlds', 'Dreams', 'Reality', 'Time', 'Space', 'Hearts', 'Minds', 'Souls'];
          const outcomes = ['Freedom', 'Truth', 'Love', 'Peace', 'Unity', 'Understanding', 'Wisdom', 'Joy'];
          
          const boundary = getRandomWord([...boundaries, ...sources.validNouns]) || 'Edge';
          const action = getRandomWord([...crossingActions, ...sources.validVerbs.map(v => v + 'ing')]) || 'Crossing';
          const realm = getRandomWord([...realms, ...sources.validNouns]) || 'Worlds';
          const outcome = getRandomWord([...outcomes, ...sources.validNouns]) || 'Freedom';
          
          return `${action} the ${boundary} of ${realm} for ${outcome}`;
        },
        description: 'Boundary crossing and transition patterns',
        examples: ['Crossing the Edge of Worlds for Freedom', 'Breaking the Bridge of Time for Truth', 'Opening the Door of Hearts for Love'],
        complexity: 'complex',
        wordCountRange: [5, 6]
      },
      
      distance_relationship: {
        generate: (sources, context) => {
          const distances = ['Near', 'Far', 'Close', 'Distant', 'Together', 'Apart', 'Beside', 'Away'];
          const relationships = ['Hearts', 'Souls', 'Minds', 'Spirits', 'Dreams', 'Hopes', 'Memories', 'Voices'];
          const connectors = ['Yet', 'But', 'And', 'Though', 'While', 'Still', 'Always', 'Never'];
          const emotions = ['Connected', 'United', 'Separated', 'Joined', 'Linked', 'Bound', 'Free', 'Lost'];
          
          const distance = getRandomWord(distances) || 'Far';
          const relationship = getRandomWord([...relationships, ...sources.validNouns]) || 'Hearts';
          const connector = getRandomWord(connectors) || 'Yet';
          const emotion = getRandomWord([...emotions, ...sources.validAdjectives]) || 'Connected';
          
          return `${distance} ${relationship} ${connector} ${emotion}`;
        },
        description: 'Distance and relationship dynamics',
        examples: ['Far Hearts Yet Connected', 'Close Souls But Separated', 'Distant Dreams Still United'],
        complexity: 'simple',
        wordCountRange: [4, 4]
      }
    };
  }

  /**
   * Get all creative patterns organized by category
   */
  getAllCreativePatterns(): Record<string, Record<string, CreativePattern>> {
    return {
      metaphorical: this.getMetaphoricalPatterns(),
      narrative: this.getNarrativePatterns(),
      sensory: this.getSensoryPatterns(),
      temporal: this.getTemporalPatterns(),
      spatial: this.getSpatialPatterns()
    };
  }

  /**
   * Generate creative pattern based on category and context
   */
  generateCreativePattern(
    category: 'metaphorical' | 'narrative' | 'sensory' | 'temporal' | 'spatial',
    sources: EnhancedWordSource,
    context?: PatternContext
  ): string | null {
    const categoryPatterns = this.getAllCreativePatterns()[category];
    
    if (!categoryPatterns) return null;
    
    // Filter patterns by word count if specified in context
    let eligiblePatterns = Object.values(categoryPatterns);
    
    if (context?.wordCount) {
      eligiblePatterns = eligiblePatterns.filter(pattern => 
        context.wordCount! >= pattern.wordCountRange[0] && 
        context.wordCount! <= pattern.wordCountRange[1]
      );
    }
    
    if (eligiblePatterns.length === 0) return null;
    
    const selectedPattern = getRandomWord(eligiblePatterns);
    return selectedPattern ? selectedPattern.generate(sources, context) : null;
  }

  /**
   * Get pattern recommendations based on context
   */
  getPatternRecommendations(
    sources: EnhancedWordSource,
    context?: PatternContext
  ): {
    category: string;
    pattern: string;
    confidence: number;
  }[] {
    const recommendations: { category: string; pattern: string; confidence: number; }[] = [];
    const allCategories = Object.keys(this.getAllCreativePatterns());
    
    for (const category of allCategories) {
      const pattern = this.generateCreativePattern(
        category as keyof ReturnType<typeof this.getAllCreativePatterns>,
        sources,
        context
      );
      
      if (pattern) {
        // Simple confidence scoring based on context matching
        let confidence = 0.5;
        
        if (context?.genre) {
          // Boost confidence for genre-appropriate patterns
          if (category === 'metaphorical' && ['rock', 'metal'].includes(context.genre)) confidence += 0.2;
          if (category === 'narrative' && ['folk', 'country'].includes(context.genre)) confidence += 0.2;
          if (category === 'sensory' && ['electronic', 'ambient'].includes(context.genre)) confidence += 0.2;
          if (category === 'temporal' && ['classical', 'jazz'].includes(context.genre)) confidence += 0.2;
          if (category === 'spatial' && ['indie', 'alternative'].includes(context.genre)) confidence += 0.2;
        }
        
        if (context?.mood) {
          // Boost confidence for mood-appropriate patterns
          if (category === 'metaphorical' && ['mysterious', 'dark'].includes(context.mood)) confidence += 0.15;
          if (category === 'narrative' && ['nostalgic', 'melancholic'].includes(context.mood)) confidence += 0.15;
          if (category === 'sensory' && ['euphoric', 'dreamy'].includes(context.mood)) confidence += 0.15;
          if (category === 'temporal' && ['nostalgic', 'romantic'].includes(context.mood)) confidence += 0.15;
          if (category === 'spatial' && ['adventurous', 'free'].includes(context.mood)) confidence += 0.15;
        }
        
        recommendations.push({
          category,
          pattern,
          confidence: Math.min(confidence, 1.0)
        });
      }
    }
    
    return recommendations.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Create hybrid patterns by combining categories
   */
  generateHybridPattern(
    categories: Array<keyof ReturnType<typeof this.getAllCreativePatterns>>,
    sources: EnhancedWordSource,
    context?: PatternContext
  ): string | null {
    if (categories.length < 2) return null;
    
    const patterns: string[] = [];
    
    for (const category of categories.slice(0, 2)) { // Limit to 2 categories for hybrid
      const pattern = this.generateCreativePattern(category, sources, context);
      if (pattern) patterns.push(pattern);
    }
    
    if (patterns.length < 2) return null;
    
    // Simple hybrid creation by taking words from each pattern
    const words1 = patterns[0].split(' ');
    const words2 = patterns[1].split(' ');
    
    // Interleave words or take strategic parts
    const hybridWords: string[] = [];
    const maxWords = Math.min(words1.length + words2.length, context?.wordCount || 4);
    
    // Take alternating words up to the word count limit
    for (let i = 0; i < maxWords; i++) {
      if (i % 2 === 0 && words1.length > Math.floor(i / 2)) {
        hybridWords.push(words1[Math.floor(i / 2)]);
      } else if (words2.length > Math.floor(i / 2)) {
        hybridWords.push(words2[Math.floor(i / 2)]);
      }
    }
    
    return hybridWords.slice(0, maxWords).join(' ');
  }
}

// Export singleton instance
export const creativePatternCategories = new CreativePatternCategories();