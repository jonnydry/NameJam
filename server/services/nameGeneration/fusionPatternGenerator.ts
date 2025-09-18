/**
 * Fusion Pattern Generator - Specialized hybrid pattern creation system
 * Creates genre-specific fusion templates and adaptive pattern generation for cross-genre name synthesis
 */

import { GenreType, genreCompatibilityMatrix, FusionRule } from './genreCompatibilityMatrix';
import { vocabularyFusionSystem, FusedVocabulary } from './vocabularyFusionSystem';
import { PatternDefinition, PatternContext } from './advancedPatternLibrary';
import { EnhancedWordSource } from './types';
import { getRandomWord, capitalize, singularize } from './stringUtils';
import { secureLog } from '../../utils/secureLogger';

// Fusion pattern template definition
export interface FusionPatternTemplate {
  id: string;
  name: string;
  description: string;
  genrePair: [GenreType, GenreType];
  fusionStyle: 'complement' | 'contrast' | 'hybrid' | 'evolution';
  complexity: 'simple' | 'medium' | 'complex';
  wordCountRange: [number, number];
  templateStructure: string;
  placeholderMap: Record<string, string[]>;
  contextualAdapters: {
    mood?: Record<string, string>;
    intensity?: Record<string, string>;
    era?: Record<string, string>;
  };
  examples: string[];
  weight: number;
  generate: (fusedVocab: FusedVocabulary, context: PatternContext, sources: EnhancedWordSource) => string | null;
}

// Adaptive pattern characteristics
export interface AdaptivePattern {
  baseTemplate: string;
  adaptationRules: {
    genreWeight: [number, number];
    moodModifiers: Record<string, string>;
    intensityScaling: Record<string, number>;
    culturalAdaptations: Record<string, string>;
  };
  fallbackStrategies: string[];
  qualityThresholds: {
    minimum: number;
    preferred: number;
  };
}

// Pattern evolution tracking
export interface PatternEvolution {
  templateId: string;
  successRate: number;
  averageQuality: number;
  userFeedback: number[];
  adaptations: {
    context: any;
    modification: string;
    improvement: number;
  }[];
  lastEvolved: Date;
}

// Pattern synthesis request
export interface PatternSynthesisRequest {
  genrePair: [GenreType, GenreType];
  targetWordCount: number;
  fusionIntensity: 'subtle' | 'moderate' | 'bold' | 'experimental';
  mood?: string;
  preserveAuthenticity: boolean;
  creativityLevel: 'conservative' | 'balanced' | 'innovative' | 'revolutionary';
  culturalSensitivity: boolean;
}

// Synthesis result
export interface PatternSynthesisResult {
  pattern: FusionPatternTemplate;
  confidence: number;
  innovationLevel: number;
  authenticity: number;
  culturalRespect: number;
  generatedExample: string;
}

export class FusionPatternGenerator {
  private fusionTemplates: Map<string, FusionPatternTemplate[]> = new Map();
  private adaptivePatterns: Map<string, AdaptivePattern> = new Map();
  private patternEvolution: Map<string, PatternEvolution> = new Map();
  private culturalSensitivityRules: Map<string, string[]> = new Map();
  private innovationMetrics: Map<string, { total: number, successful: number, avgInnovation: number }> = new Map();

  constructor() {
    this.initializeFusionTemplates();
    this.initializeAdaptivePatterns();
    this.initializeCulturalSensitivityRules();
    secureLog.info('Fusion Pattern Generator initialized with comprehensive template system');
  }

  /**
   * Generate fusion patterns for specific genre combinations
   */
  async generateFusionPattern(
    request: PatternSynthesisRequest,
    fusedVocabulary: FusedVocabulary,
    sources: EnhancedWordSource
  ): Promise<PatternSynthesisResult | null> {
    const { genrePair, targetWordCount, fusionIntensity } = request;
    const genreKey = `${genrePair[0]}-${genrePair[1]}`;
    const reverseGenreKey = `${genrePair[1]}-${genrePair[0]}`;

    // Get available templates for this genre combination
    let availableTemplates = this.fusionTemplates.get(genreKey) || this.fusionTemplates.get(reverseGenreKey) || [];
    
    // Filter templates by word count and intensity
    availableTemplates = availableTemplates.filter(template => 
      template.wordCountRange[0] <= targetWordCount && 
      template.wordCountRange[1] >= targetWordCount &&
      this.templateMatchesIntensity(template, fusionIntensity)
    );

    if (availableTemplates.length === 0) {
      // Generate dynamic template if no predefined templates exist
      return this.generateDynamicPattern(request, fusedVocabulary, sources);
    }

    // Select best template based on success rates and context
    const selectedTemplate = this.selectOptimalTemplate(availableTemplates, request, fusedVocabulary);
    
    if (!selectedTemplate) {
      return this.generateDynamicPattern(request, fusedVocabulary, sources);
    }

    // Generate example using the selected template
    const context: PatternContext = {
      genre: genrePair[0],
      mood: request.mood as any,
      type: 'band',
      wordCount: targetWordCount
    };

    const generatedExample = selectedTemplate.generate(fusedVocabulary, context, sources);
    if (!generatedExample) {
      return this.generateDynamicPattern(request, fusedVocabulary, sources);
    }

    // Calculate metrics
    const confidence = this.calculatePatternConfidence(selectedTemplate, request, fusedVocabulary);
    const innovationLevel = this.calculateInnovationLevel(selectedTemplate, request);
    const authenticity = this.calculateAuthenticity(selectedTemplate, request, generatedExample);
    const culturalRespect = this.calculateCulturalRespect(selectedTemplate, request, generatedExample);

    // Update pattern evolution metrics
    this.updatePatternMetrics(selectedTemplate.id, confidence, innovationLevel);

    return {
      pattern: selectedTemplate,
      confidence,
      innovationLevel,
      authenticity,
      culturalRespect,
      generatedExample
    };
  }

  /**
   * Initialize comprehensive fusion templates for various genre combinations
   */
  private initializeFusionTemplates() {
    // Electronic + Jazz Fusion Templates
    const electroJazzTemplates: FusionPatternTemplate[] = [
      {
        id: 'electro_jazz_synthesis',
        name: 'Electro-Jazz Synthesis Pattern',
        description: 'Combines electronic processing terminology with jazz improvisation concepts',
        genrePair: ['electronic', 'jazz'],
        fusionStyle: 'hybrid',
        complexity: 'medium',
        wordCountRange: [2, 3],
        templateStructure: '{electronic_process} {jazz_concept} {synthesis_modifier}',
        placeholderMap: {
          electronic_process: ['Digital', 'Cyber', 'Synthetic', 'Virtual', 'Quantum'],
          jazz_concept: ['Bebop', 'Swing', 'Improvisation', 'Harmony', 'Rhythm'],
          synthesis_modifier: ['Matrix', 'Protocol', 'Algorithm', 'System', 'Engine']
        },
        contextualAdapters: {
          mood: {
            'energetic': 'add intensity modifiers',
            'mellow': 'use smooth descriptors',
            'dark': 'add moody qualifiers'
          }
        },
        examples: ['Digital Bebop Matrix', 'Cyber Swing Protocol', 'Synthetic Jazz Algorithm'],
        weight: 0.8,
        generate: (fusedVocab, context, sources) => {
          const electronicTerm = getRandomWord(fusedVocab.primaryWords.filter(w => 
            ['digital', 'cyber', 'electronic', 'synthetic', 'virtual'].some(prefix => 
              w.toLowerCase().includes(prefix)
            )
          )) || getRandomWord(['Digital', 'Cyber', 'Electronic']);
          
          const jazzTerm = getRandomWord(fusedVocab.primaryWords.filter(w => 
            ['jazz', 'bebop', 'swing', 'improvisation'].some(term => 
              w.toLowerCase().includes(term)
            )
          )) || getRandomWord(['Bebop', 'Swing', 'Jazz']);

          const modifier = context.wordCount && context.wordCount > 2 ? 
            getRandomWord(['Matrix', 'Protocol', 'System', 'Engine', 'Network']) || '' : '';

          const components = [electronicTerm, jazzTerm, modifier].filter(c => c.length > 0);
          return components.join(' ');
        }
      },
      {
        id: 'harmonic_synthesis_fusion',
        name: 'Harmonic Synthesis Fusion',
        description: 'Merges harmonic complexity with electronic synthesis',
        genrePair: ['jazz', 'electronic'],
        fusionStyle: 'complement',
        complexity: 'complex',
        wordCountRange: [2, 4],
        templateStructure: '{harmonic_element} {synthesis_type} {complex_modifier}',
        placeholderMap: {
          harmonic_element: ['Harmonic', 'Melodic', 'Rhythmic', 'Tonal', 'Modal'],
          synthesis_type: ['Synthesis', 'Modulation', 'Processing', 'Generation', 'Transformation'],
          complex_modifier: ['Collective', 'Laboratory', 'Institute', 'Consortium', 'Alliance']
        },
        contextualAdapters: {},
        examples: ['Harmonic Synthesis Collective', 'Modal Processing Laboratory', 'Tonal Modulation Institute'],
        weight: 0.7,
        generate: (fusedVocab, context, sources) => {
          const harmonic = getRandomWord(['Harmonic', 'Melodic', 'Rhythmic', 'Tonal', 'Modal']) || 'Harmonic';
          const synthesis = getRandomWord(['Synthesis', 'Modulation', 'Processing', 'Algorithm']) || 'Synthesis';
          const modifier = context.wordCount && context.wordCount > 2 ? 
            getRandomWord(['Collective', 'Laboratory', 'Institute', 'Network']) || '' : '';

          const components = [harmonic, synthesis, modifier].filter(c => c.length > 0);
          return components.join(' ');
        }
      }
    ];

    // Folk + Electronic Fusion Templates
    const folkElectronicTemplates: FusionPatternTemplate[] = [
      {
        id: 'digital_folklore_pattern',
        name: 'Digital Folklore Pattern',
        description: 'Blends traditional folk storytelling with modern digital concepts',
        genrePair: ['folk', 'electronic'],
        fusionStyle: 'contrast',
        complexity: 'simple',
        wordCountRange: [2, 3],
        templateStructure: '{digital_prefix} {folk_tradition}',
        placeholderMap: {
          digital_prefix: ['Digital', 'Electronic', 'Cyber', 'Virtual', 'Binary'],
          folk_tradition: ['Folk', 'Tales', 'Ballads', 'Heritage', 'Roots', 'Lore']
        },
        contextualAdapters: {
          mood: {
            'nostalgic': 'emphasize heritage elements',
            'futuristic': 'emphasize digital elements'
          }
        },
        examples: ['Digital Folk', 'Electronic Heritage', 'Cyber Ballads'],
        weight: 0.75,
        generate: (fusedVocab, context, sources) => {
          const digitalPrefix = getRandomWord(['Digital', 'Electronic', 'Cyber', 'Virtual']) || 'Digital';
          const folkTradition = getRandomWord(['Folk', 'Heritage', 'Roots', 'Ballads', 'Lore']) || 'Folk';
          
          return `${digitalPrefix} ${folkTradition}`;
        }
      },
      {
        id: 'organic_synthetic_bridge',
        name: 'Organic-Synthetic Bridge Pattern',
        description: 'Creates bridges between organic folk elements and synthetic electronic elements',
        genrePair: ['folk', 'electronic'],
        fusionStyle: 'evolution',
        complexity: 'medium',
        wordCountRange: [3, 4],
        templateStructure: '{organic_element} {bridge_concept} {synthetic_element}',
        placeholderMap: {
          organic_element: ['Organic', 'Natural', 'Wooden', 'Acoustic', 'Earthen'],
          bridge_concept: ['Meets', 'Bridges', 'Crosses', 'Connects', 'Joins'],
          synthetic_element: ['Digital', 'Synthetic', 'Electronic', 'Virtual', 'Artificial']
        },
        contextualAdapters: {},
        examples: ['Organic Meets Digital', 'Natural Bridges Synthetic', 'Acoustic Crosses Electronic'],
        weight: 0.65,
        generate: (fusedVocab, context, sources) => {
          const organic = getRandomWord(['Organic', 'Natural', 'Acoustic', 'Wooden']) || 'Organic';
          const bridge = getRandomWord(['Meets', 'Bridges', 'Crosses', 'Connects']) || 'Meets';
          const synthetic = getRandomWord(['Digital', 'Electronic', 'Synthetic', 'Virtual']) || 'Digital';
          
          if (context.wordCount && context.wordCount <= 2) {
            return `${organic} ${synthetic}`;
          }
          return `${organic} ${bridge} ${synthetic}`;
        }
      }
    ];

    // Rock + Classical Fusion Templates  
    const rockClassicalTemplates: FusionPatternTemplate[] = [
      {
        id: 'symphonic_power_fusion',
        name: 'Symphonic Power Fusion',
        description: 'Combines orchestral grandeur with rock power',
        genrePair: ['rock', 'classical'],
        fusionStyle: 'complement',
        complexity: 'complex',
        wordCountRange: [2, 3],
        templateStructure: '{orchestral_element} {power_concept}',
        placeholderMap: {
          orchestral_element: ['Symphonic', 'Orchestral', 'Chamber', 'Philharmonic', 'Concerto'],
          power_concept: ['Thunder', 'Storm', 'Power', 'Force', 'Energy', 'Fury']
        },
        contextualAdapters: {
          intensity: {
            'high': 'emphasize power elements',
            'low': 'emphasize orchestral refinement'
          }
        },
        examples: ['Symphonic Thunder', 'Orchestral Storm', 'Chamber Power'],
        weight: 0.85,
        generate: (fusedVocab, context, sources) => {
          const orchestral = getRandomWord(['Symphonic', 'Orchestral', 'Chamber', 'Philharmonic']) || 'Symphonic';
          const power = getRandomWord(['Thunder', 'Storm', 'Power', 'Force', 'Energy']) || 'Thunder';
          
          return `${orchestral} ${power}`;
        }
      },
      {
        id: 'classical_rebellion_pattern',
        name: 'Classical Rebellion Pattern',
        description: 'Juxtaposes classical sophistication with rock rebellion',
        genrePair: ['classical', 'rock'],
        fusionStyle: 'contrast',
        complexity: 'medium',
        wordCountRange: [2, 4],
        templateStructure: '{classical_form} {rebellion_element} {synthesis}',
        placeholderMap: {
          classical_form: ['Sonata', 'Concerto', 'Symphony', 'Prelude', 'Fugue'],
          rebellion_element: ['Rebellion', 'Revolution', 'Uprising', 'Revolt', 'Defiance'],
          synthesis: ['Society', 'Collective', 'Alliance', 'Union', 'League']
        },
        contextualAdapters: {},
        examples: ['Sonata Rebellion Society', 'Symphony Revolution Collective', 'Concerto Uprising Alliance'],
        weight: 0.7,
        generate: (fusedVocab, context, sources) => {
          const classical = getRandomWord(['Sonata', 'Symphony', 'Concerto', 'Prelude']) || 'Symphony';
          const rebellion = getRandomWord(['Rebellion', 'Revolution', 'Uprising', 'Revolt']) || 'Rebellion';
          const synthesis = context.wordCount && context.wordCount > 2 ? 
            getRandomWord(['Society', 'Collective', 'Alliance', 'Union']) || '' : '';

          const components = [classical, rebellion, synthesis].filter(c => c.length > 0);
          return components.join(' ');
        }
      }
    ];

    // Hip-hop + Jazz Fusion Templates
    const hiphopJazzTemplates: FusionPatternTemplate[] = [
      {
        id: 'flow_improvisation_fusion',
        name: 'Flow Improvisation Fusion',
        description: 'Merges hip-hop flow with jazz improvisation concepts',
        genrePair: ['hip-hop', 'jazz'],
        fusionStyle: 'hybrid',
        complexity: 'medium',
        wordCountRange: [2, 3],
        templateStructure: '{flow_concept} {improvisation_element}',
        placeholderMap: {
          flow_concept: ['Flow', 'Cipher', 'Rhythm', 'Beats', 'Groove'],
          improvisation_element: ['Improvisation', 'Freestyle', 'Jazz', 'Swing', 'Bebop']
        },
        contextualAdapters: {
          mood: {
            'aggressive': 'emphasize harder terms',
            'smooth': 'emphasize jazz smoothness'
          }
        },
        examples: ['Flow Improvisation', 'Cipher Jazz', 'Rhythm Freestyle'],
        weight: 0.8,
        generate: (fusedVocab, context, sources) => {
          const flow = getRandomWord(['Flow', 'Cipher', 'Rhythm', 'Beats', 'Groove']) || 'Flow';
          const improvisation = getRandomWord(['Jazz', 'Improvisation', 'Freestyle', 'Swing']) || 'Jazz';
          
          return `${flow} ${improvisation}`;
        }
      },
      {
        id: 'urban_sophistication_pattern',
        name: 'Urban Sophistication Pattern',
        description: 'Blends hip-hop urban culture with jazz sophistication',
        genrePair: ['hip-hop', 'jazz'],
        fusionStyle: 'evolution',
        complexity: 'complex',
        wordCountRange: [2, 4],
        templateStructure: '{urban_element} {sophistication_concept} {collective_modifier}',
        placeholderMap: {
          urban_element: ['Urban', 'Street', 'Underground', 'Metro', 'City'],
          sophistication_concept: ['Sophistication', 'Elegance', 'Refinement', 'Class', 'Style'],
          collective_modifier: ['Collective', 'Society', 'Institute', 'Academy', 'Conservatory']
        },
        contextualAdapters: {},
        examples: ['Urban Sophistication Collective', 'Street Elegance Society', 'Underground Refinement Institute'],
        weight: 0.7,
        generate: (fusedVocab, context, sources) => {
          const urban = getRandomWord(['Urban', 'Street', 'Underground', 'Metro']) || 'Urban';
          const sophistication = getRandomWord(['Sophistication', 'Elegance', 'Refinement', 'Class']) || 'Sophistication';
          const collective = context.wordCount && context.wordCount > 2 ? 
            getRandomWord(['Collective', 'Society', 'Institute', 'Academy']) || '' : '';

          const components = [urban, sophistication, collective].filter(c => c.length > 0);
          return components.join(' ');
        }
      }
    ];

    // Store all templates
    this.fusionTemplates.set('electronic-jazz', electroJazzTemplates);
    this.fusionTemplates.set('jazz-electronic', electroJazzTemplates);
    this.fusionTemplates.set('folk-electronic', folkElectronicTemplates);
    this.fusionTemplates.set('electronic-folk', folkElectronicTemplates);
    this.fusionTemplates.set('rock-classical', rockClassicalTemplates);
    this.fusionTemplates.set('classical-rock', rockClassicalTemplates);
    this.fusionTemplates.set('hip-hop-jazz', hiphopJazzTemplates);
    this.fusionTemplates.set('jazz-hip-hop', hiphopJazzTemplates);

    secureLog.debug(`Initialized ${Array.from(this.fusionTemplates.values()).reduce((sum, templates) => sum + templates.length, 0)} fusion templates`);
  }

  /**
   * Initialize adaptive patterns that can evolve based on success
   */
  private initializeAdaptivePatterns() {
    // Electronic + Jazz adaptive pattern
    this.adaptivePatterns.set('electronic-jazz-adaptive', {
      baseTemplate: '{adaptive_electronic} {adaptive_jazz} {adaptive_modifier}',
      adaptationRules: {
        genreWeight: [0.6, 0.4],
        moodModifiers: {
          'energetic': 'add pulsing/driving terms',
          'mellow': 'add smooth/flowing terms',
          'dark': 'add deep/shadow terms',
          'bright': 'add luminous/crystal terms'
        },
        intensityScaling: {
          'subtle': 0.3,
          'moderate': 0.6,
          'bold': 0.8,
          'experimental': 1.0
        },
        culturalAdaptations: {
          'traditional': 'emphasize heritage elements',
          'modern': 'emphasize contemporary elements',
          'futuristic': 'emphasize experimental elements'
        }
      },
      fallbackStrategies: ['use_hybrid_vocabulary', 'simple_combination', 'default_pattern'],
      qualityThresholds: {
        minimum: 0.4,
        preferred: 0.7
      }
    });

    // Folk + Electronic adaptive pattern
    this.adaptivePatterns.set('folk-electronic-adaptive', {
      baseTemplate: '{adaptive_folk} {bridge_concept} {adaptive_electronic}',
      adaptationRules: {
        genreWeight: [0.5, 0.5],
        moodModifiers: {
          'nostalgic': 'emphasize heritage/memory terms',
          'futuristic': 'emphasize digital/cyber terms',
          'peaceful': 'add gentle/soft terms',
          'mysterious': 'add enigmatic/hidden terms'
        },
        intensityScaling: {
          'subtle': 0.2,
          'moderate': 0.5,
          'bold': 0.7,
          'experimental': 0.9
        },
        culturalAdaptations: {
          'traditional': 'preserve folk authenticity',
          'modern': 'balance both elements equally',
          'progressive': 'emphasize electronic innovation'
        }
      },
      fallbackStrategies: ['remove_bridge_concept', 'simplify_structure', 'use_contrasting_elements'],
      qualityThresholds: {
        minimum: 0.35,
        preferred: 0.65
      }
    });

    secureLog.debug(`Initialized ${this.adaptivePatterns.size} adaptive patterns`);
  }

  /**
   * Initialize cultural sensitivity rules to ensure respectful fusion
   */
  private initializeCulturalSensitivityRules() {
    // Hip-hop cultural sensitivity
    this.culturalSensitivityRules.set('hip-hop', [
      'Respect urban culture authenticity',
      'Avoid stereotypical representations',
      'Honor the cultural origins and significance',
      'Maintain connection to community values'
    ]);

    // Folk cultural sensitivity
    this.culturalSensitivityRules.set('folk', [
      'Respect traditional heritage',
      'Avoid cultural appropriation',
      'Honor storytelling traditions',
      'Maintain connection to cultural roots'
    ]);

    // Classical cultural sensitivity
    this.culturalSensitivityRules.set('classical', [
      'Respect formal musical traditions',
      'Honor compositional heritage',
      'Maintain artistic sophistication',
      'Preserve cultural significance'
    ]);

    // Jazz cultural sensitivity
    this.culturalSensitivityRules.set('jazz', [
      'Respect improvisation traditions',
      'Honor cultural origins and history',
      'Maintain artistic sophistication',
      'Preserve musical innovation spirit'
    ]);

    secureLog.debug(`Initialized cultural sensitivity rules for ${this.culturalSensitivityRules.size} genres`);
  }

  /**
   * Generate dynamic pattern when no predefined templates exist
   */
  private async generateDynamicPattern(
    request: PatternSynthesisRequest,
    fusedVocabulary: FusedVocabulary,
    sources: EnhancedWordSource
  ): Promise<PatternSynthesisResult | null> {
    const { genrePair, targetWordCount, fusionIntensity } = request;

    // Create dynamic template structure
    const dynamicTemplate: FusionPatternTemplate = {
      id: `dynamic_${genrePair[0]}_${genrePair[1]}_${Date.now()}`,
      name: `Dynamic ${genrePair[0]}-${genrePair[1]} Fusion`,
      description: `Dynamically generated fusion pattern for ${genrePair[0]} and ${genrePair[1]}`,
      genrePair,
      fusionStyle: 'hybrid',
      complexity: 'medium',
      wordCountRange: [targetWordCount, targetWordCount],
      templateStructure: this.generateDynamicStructure(genrePair, targetWordCount, fusionIntensity),
      placeholderMap: this.generateDynamicPlaceholders(fusedVocabulary),
      contextualAdapters: {},
      examples: [],
      weight: 0.5,
      generate: (fusedVocab, context, sourcesParam) => {
        return this.generateFromDynamicTemplate(fusedVocab, context, targetWordCount, fusionIntensity);
      }
    };

    // Generate example
    const context: PatternContext = {
      genre: genrePair[0],
      mood: request.mood as any,
      type: 'band',
      wordCount: targetWordCount
    };

    const generatedExample = dynamicTemplate.generate(fusedVocabulary, context, sources);
    if (!generatedExample) {
      return null;
    }

    // Calculate metrics for dynamic pattern
    const confidence = this.calculateDynamicPatternConfidence(request, fusedVocabulary);
    const innovationLevel = 0.8; // Dynamic patterns are inherently more innovative
    const authenticity = this.calculateDynamicAuthenticity(request, generatedExample);
    const culturalRespect = this.calculateDynamicCulturalRespect(request, generatedExample);

    return {
      pattern: dynamicTemplate,
      confidence,
      innovationLevel,
      authenticity,
      culturalRespect,
      generatedExample
    };
  }

  /**
   * Select optimal template based on various factors
   */
  private selectOptimalTemplate(
    templates: FusionPatternTemplate[],
    request: PatternSynthesisRequest,
    fusedVocabulary: FusedVocabulary
  ): FusionPatternTemplate | null {
    if (templates.length === 0) return null;

    // Score each template
    const scoredTemplates = templates.map(template => ({
      template,
      score: this.scoreTemplate(template, request, fusedVocabulary)
    }));

    // Sort by score and add randomization for variety
    scoredTemplates.sort((a, b) => b.score - a.score);
    
    // Select from top candidates with weighted randomness
    const topCandidates = scoredTemplates.slice(0, Math.min(3, scoredTemplates.length));
    const weights = topCandidates.map(candidate => candidate.score);
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    
    if (totalWeight === 0) return topCandidates[0]?.template || null;

    let random = Math.random() * totalWeight;
    for (let i = 0; i < topCandidates.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return topCandidates[i].template;
      }
    }

    return topCandidates[0].template;
  }

  /**
   * Score template based on request parameters
   */
  private scoreTemplate(
    template: FusionPatternTemplate,
    request: PatternSynthesisRequest,
    fusedVocabulary: FusedVocabulary
  ): number {
    let score = template.weight || 0.5;

    // Word count match bonus
    if (template.wordCountRange[0] <= request.targetWordCount && 
        template.wordCountRange[1] >= request.targetWordCount) {
      score += 0.2;
    }

    // Fusion intensity match
    if (this.templateMatchesIntensity(template, request.fusionIntensity)) {
      score += 0.15;
    }

    // Creativity level alignment
    const creativityBonus = this.getCreativityAlignment(template, request.creativityLevel);
    score += creativityBonus * 0.1;

    // Success history bonus
    const evolution = this.patternEvolution.get(template.id);
    if (evolution) {
      score += evolution.successRate * 0.15;
      score += (evolution.averageQuality - 0.5) * 0.1;
    }

    // Cultural sensitivity bonus
    if (request.culturalSensitivity && this.templateRespectsCulture(template, request)) {
      score += 0.1;
    }

    return Math.max(score, 0);
  }

  /**
   * Check if template matches fusion intensity
   */
  private templateMatchesIntensity(template: FusionPatternTemplate, intensity: string): boolean {
    const intensityMap = {
      'subtle': ['simple'],
      'moderate': ['simple', 'medium'],
      'bold': ['medium', 'complex'],
      'experimental': ['complex']
    };

    const allowedComplexities = intensityMap[intensity as keyof typeof intensityMap] || ['medium'];
    return allowedComplexities.includes(template.complexity);
  }

  /**
   * Get creativity alignment score
   */
  private getCreativityAlignment(template: FusionPatternTemplate, creativityLevel: string): number {
    const creativityScores = {
      'conservative': template.complexity === 'simple' ? 1.0 : 0.5,
      'balanced': template.complexity === 'medium' ? 1.0 : 0.7,
      'innovative': template.complexity === 'complex' ? 1.0 : 0.6,
      'revolutionary': template.complexity === 'complex' ? 1.0 : 0.3
    };

    return creativityScores[creativityLevel as keyof typeof creativityScores] || 0.5;
  }

  /**
   * Check if template respects cultural sensitivity
   */
  private templateRespectsCulture(template: FusionPatternTemplate, request: PatternSynthesisRequest): boolean {
    const [genre1, genre2] = request.genrePair;
    const rules1 = this.culturalSensitivityRules.get(genre1) || [];
    const rules2 = this.culturalSensitivityRules.get(genre2) || [];
    
    // This is a simplified check - in a real implementation, 
    // we would analyze the template structure and content more thoroughly
    return template.fusionStyle !== 'contrast' || (rules1.length > 0 && rules2.length > 0);
  }

  /**
   * Generate dynamic template structure
   */
  private generateDynamicStructure(genrePair: [GenreType, GenreType], wordCount: number, intensity: string): string {
    const structures = {
      1: ['{genre1_term}', '{hybrid_term}', '{fusion_concept}'],
      2: ['{genre1_term} {genre2_term}', '{hybrid_term} {modifier}', '{genre1_modifier} {genre2_concept}'],
      3: ['{genre1_term} {genre2_term} {modifier}', '{hybrid_term} {fusion_concept} {collective}', '{genre1_concept} {bridge} {genre2_concept}'],
      4: ['{genre1_modifier} {genre2_modifier} {fusion_concept} {collective}', '{hybrid_term} {genre1_concept} {genre2_concept} {modifier}']
    };

    const wordCountStructures = structures[wordCount as keyof typeof structures] || structures[2];
    return getRandomWord(wordCountStructures) || wordCountStructures[0];
  }

  /**
   * Generate dynamic placeholders from fused vocabulary
   */
  private generateDynamicPlaceholders(fusedVocabulary: FusedVocabulary): Record<string, string[]> {
    return {
      genre1_term: fusedVocabulary.primaryWords.slice(0, 5),
      genre2_term: fusedVocabulary.secondaryWords.slice(0, 5),
      hybrid_term: fusedVocabulary.hybridTerms.slice(0, 3),
      fusion_concept: fusedVocabulary.conceptualBlends.slice(0, 3),
      modifier: ['Collective', 'Society', 'Alliance', 'Union', 'Network'],
      collective: ['Group', 'Band', 'Ensemble', 'Orchestra', 'Crew'],
      bridge: ['Meets', 'Crosses', 'Blends', 'Fuses', 'Merges'],
      genre1_concept: fusedVocabulary.primaryWords.filter(w => w.length > 5).slice(0, 3),
      genre2_concept: fusedVocabulary.secondaryWords.filter(w => w.length > 5).slice(0, 3),
      genre1_modifier: fusedVocabulary.primaryWords.filter(w => w.match(/ing$|ed$|al$|ic$/)).slice(0, 3),
      genre2_modifier: fusedVocabulary.secondaryWords.filter(w => w.match(/ing$|ed$|al$|ic$/)).slice(0, 3)
    };
  }

  /**
   * Generate from dynamic template
   */
  private generateFromDynamicTemplate(
    fusedVocab: FusedVocabulary,
    context: PatternContext,
    wordCount: number,
    intensity: string
  ): string | null {
    const components: string[] = [];

    // Primary component from fused vocabulary
    const primary = getRandomWord(fusedVocab.primaryWords) || getRandomWord(fusedVocab.hybridTerms);
    if (primary) components.push(primary);

    // Secondary component if needed
    if (wordCount > 1) {
      const secondary = getRandomWord(fusedVocab.secondaryWords.filter(w => w !== primary)) ||
                       getRandomWord(fusedVocab.conceptualBlends);
      if (secondary) components.push(secondary);
    }

    // Additional components for longer names
    if (wordCount > 2) {
      const tertiary = getRandomWord(['Collective', 'Society', 'Alliance', 'Union', 'Network']);
      if (tertiary) components.push(tertiary);
    }

    if (wordCount > 3) {
      const quaternary = getRandomWord(['Project', 'Initiative', 'Experiment', 'Laboratory']);
      if (quaternary) components.push(quaternary);
    }

    return components.slice(0, wordCount).join(' ');
  }

  // Calculation methods for various metrics
  private calculatePatternConfidence(template: FusionPatternTemplate, request: PatternSynthesisRequest, fusedVocab: FusedVocabulary): number {
    let confidence = 0.5;

    // Template weight contribution
    confidence += (template.weight || 0.5) * 0.3;

    // Word count match
    if (template.wordCountRange[0] <= request.targetWordCount && 
        template.wordCountRange[1] >= request.targetWordCount) {
      confidence += 0.2;
    }

    // Fusion vocabulary richness
    const vocabRichness = Math.min(1.0, 
      (fusedVocab.primaryWords.length + fusedVocab.hybridTerms.length) / 20
    );
    confidence += vocabRichness * 0.2;

    // Historical success
    const evolution = this.patternEvolution.get(template.id);
    if (evolution && evolution.successRate > 0) {
      confidence += evolution.successRate * 0.3;
    }

    return Math.min(Math.max(confidence, 0), 1);
  }

  private calculateInnovationLevel(template: FusionPatternTemplate, request: PatternSynthesisRequest): number {
    let innovation = 0.5;

    // Complexity bonus
    if (template.complexity === 'complex') innovation += 0.2;
    else if (template.complexity === 'medium') innovation += 0.1;

    // Fusion style bonus
    if (template.fusionStyle === 'contrast') innovation += 0.2;
    else if (template.fusionStyle === 'hybrid') innovation += 0.15;

    // Creativity level bonus
    if (request.creativityLevel === 'revolutionary') innovation += 0.3;
    else if (request.creativityLevel === 'innovative') innovation += 0.2;
    else if (request.creativityLevel === 'balanced') innovation += 0.1;

    return Math.min(innovation, 1);
  }

  private calculateAuthenticity(template: FusionPatternTemplate, request: PatternSynthesisRequest, example: string): number {
    let authenticity = 0.7; // Base authenticity

    // Preserve authenticity bonus
    if (request.preserveAuthenticity) {
      authenticity += 0.1;
    }

    // Template fusion style impact
    if (template.fusionStyle === 'evolution') {
      authenticity += 0.1;
    } else if (template.fusionStyle === 'complement') {
      authenticity += 0.05;
    }

    // Penalty for overly artificial terms
    const artificialTerms = ['cyber', 'neo', 'meta', 'ultra', 'hyper'];
    const containsArtificial = artificialTerms.some(term => 
      example.toLowerCase().includes(term)
    );
    if (containsArtificial && request.preserveAuthenticity) {
      authenticity -= 0.15;
    }

    return Math.min(Math.max(authenticity, 0), 1);
  }

  private calculateCulturalRespect(template: FusionPatternTemplate, request: PatternSynthesisRequest, example: string): number {
    let respect = 0.8; // Base cultural respect

    // Cultural sensitivity bonus
    if (request.culturalSensitivity) {
      respect += 0.1;
    }

    // Template fusion style consideration
    if (template.fusionStyle === 'evolution' || template.fusionStyle === 'complement') {
      respect += 0.05;
    }

    // Genre-specific checks
    const [genre1, genre2] = request.genrePair;
    const sensitiveGenres = ['hip-hop', 'folk', 'blues', 'reggae', 'country'];
    
    if (sensitiveGenres.includes(genre1) || sensitiveGenres.includes(genre2)) {
      // Apply additional scrutiny for culturally sensitive genres
      if (template.fusionStyle === 'contrast') {
        respect -= 0.1; // Be more careful with contrasting approaches
      }
    }

    return Math.min(Math.max(respect, 0), 1);
  }

  // Dynamic pattern calculation methods
  private calculateDynamicPatternConfidence(request: PatternSynthesisRequest, fusedVocab: FusedVocabulary): number {
    let confidence = 0.6; // Base confidence for dynamic patterns

    // Vocabulary richness
    const vocabRichness = Math.min(1.0,
      (fusedVocab.primaryWords.length + fusedVocab.secondaryWords.length + fusedVocab.hybridTerms.length) / 30
    );
    confidence += vocabRichness * 0.2;

    // Fusion metadata quality
    if (fusedVocab.fusionMetadata.compatibilityScore > 0.7) {
      confidence += 0.1;
    }

    // Creativity level adjustment
    if (request.creativityLevel === 'revolutionary') {
      confidence += 0.1; // Dynamic patterns suit high creativity
    }

    return Math.min(Math.max(confidence, 0), 1);
  }

  private calculateDynamicAuthenticity(request: PatternSynthesisRequest, example: string): number {
    let authenticity = 0.6; // Lower base for dynamic patterns

    // Preserve authenticity consideration
    if (request.preserveAuthenticity) {
      authenticity += 0.1;
    }

    // Check for musical terms
    const musicalTerms = ['rhythm', 'harmony', 'melody', 'beat', 'sound', 'music', 'song', 'tune'];
    const containsMusical = musicalTerms.some(term => 
      example.toLowerCase().includes(term)
    );
    if (containsMusical) {
      authenticity += 0.1;
    }

    return Math.min(Math.max(authenticity, 0), 1);
  }

  private calculateDynamicCulturalRespect(request: PatternSynthesisRequest, example: string): number {
    let respect = 0.75; // Base respect for dynamic patterns

    // Cultural sensitivity consideration
    if (request.culturalSensitivity) {
      respect += 0.1;
    }

    // Genre sensitivity check
    const [genre1, genre2] = request.genrePair;
    const culturalGenres = ['hip-hop', 'folk', 'blues', 'reggae', 'country', 'jazz'];
    const involvesCulturalGenres = culturalGenres.includes(genre1) || culturalGenres.includes(genre2);
    
    if (involvesCulturalGenres) {
      // Check for respectful representation
      const respectfulTerms = ['heritage', 'tradition', 'culture', 'authentic', 'community'];
      const containsRespectful = respectfulTerms.some(term => 
        example.toLowerCase().includes(term)
      );
      if (containsRespectful) {
        respect += 0.1;
      }
    }

    return Math.min(Math.max(respect, 0), 1);
  }

  /**
   * Update pattern metrics for evolution tracking
   */
  private updatePatternMetrics(templateId: string, confidence: number, innovation: number) {
    const existing = this.patternEvolution.get(templateId) || {
      templateId,
      successRate: 0,
      averageQuality: 0.5,
      userFeedback: [],
      adaptations: [],
      lastEvolved: new Date()
    };

    // Update success rate (simplified - would be more sophisticated in real implementation)
    const success = confidence > 0.6 ? 1 : 0;
    existing.successRate = (existing.successRate + success) / 2;
    
    // Update quality average
    const quality = (confidence + innovation) / 2;
    existing.averageQuality = (existing.averageQuality + quality) / 2;
    
    this.patternEvolution.set(templateId, existing);

    // Update innovation metrics
    const genrePairKey = templateId.includes('_') ? templateId.split('_')[1] + '_' + templateId.split('_')[2] : 'unknown';
    const innovationMetric = this.innovationMetrics.get(genrePairKey) || { total: 0, successful: 0, avgInnovation: 0 };
    innovationMetric.total++;
    if (success) innovationMetric.successful++;
    innovationMetric.avgInnovation = (innovationMetric.avgInnovation + innovation) / 2;
    this.innovationMetrics.set(genrePairKey, innovationMetric);
  }

  /**
   * Get available fusion templates for a genre pair
   */
  getAvailableTemplates(genre1: GenreType, genre2: GenreType): FusionPatternTemplate[] {
    const key1 = `${genre1}-${genre2}`;
    const key2 = `${genre2}-${genre1}`;
    
    return [
      ...(this.fusionTemplates.get(key1) || []),
      ...(this.fusionTemplates.get(key2) || [])
    ];
  }

  /**
   * Get pattern evolution statistics
   */
  getPatternEvolutionStats(): {
    totalPatterns: number,
    avgSuccessRate: number,
    topPerformingPatterns: Array<{id: string, successRate: number, quality: number}>,
    innovationMetrics: Map<string, { total: number, successful: number, avgInnovation: number }>
  } {
    const evolutions = Array.from(this.patternEvolution.values());
    const totalPatterns = evolutions.length;
    const avgSuccessRate = totalPatterns > 0 ? 
      evolutions.reduce((sum, e) => sum + e.successRate, 0) / totalPatterns : 0;
    
    const topPerformingPatterns = evolutions
      .map(e => ({ id: e.templateId, successRate: e.successRate, quality: e.averageQuality }))
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 10);

    return {
      totalPatterns,
      avgSuccessRate,
      topPerformingPatterns,
      innovationMetrics: this.innovationMetrics
    };
  }
}

// Export singleton instance
export const fusionPatternGenerator = new FusionPatternGenerator();