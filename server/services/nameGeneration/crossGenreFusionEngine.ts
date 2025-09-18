/**
 * Cross-Genre Fusion Engine - Core orchestration for intelligent genre blending
 * Coordinates pattern fusion, vocabulary synthesis, and quality assurance for cross-genre name generation
 */

import { GenreType, genreCompatibilityMatrix, CompatibilityScore, FusionRule } from './genreCompatibilityMatrix';
import { vocabularyFusionSystem, FusedVocabulary, VocabularyStrategy } from './vocabularyFusionSystem';
import { PatternDefinition, PatternContext, advancedPatternLibrary } from './advancedPatternLibrary';
import { patternSelectionEngine, PatternSelectionCriteria } from './patternSelectionEngine';
import { contextualPatternBuilder } from './contextualPatternBuilder';
import { EnhancedWordSource } from './types';
import { secureLog } from '../../utils/secureLogger';
import { getRandomWord, capitalize } from './stringUtils';

// Fusion generation request parameters
export interface CrossGenreFusionRequest {
  primaryGenre: GenreType;
  secondaryGenre: GenreType;
  mood?: string;
  wordCount?: number;
  count?: number;
  fusionIntensity?: 'subtle' | 'moderate' | 'bold' | 'experimental';
  creativityLevel?: 'conservative' | 'balanced' | 'innovative' | 'revolutionary';
  preferredFusionStyle?: 'complement' | 'contrast' | 'hybrid' | 'evolution';
  vocabularyStrategy?: VocabularyStrategy;
  preserveAuthenticity?: boolean;
  targetAudience?: 'mainstream' | 'niche' | 'experimental';
}

// Fusion generation result
export interface CrossGenreFusionResult {
  name: string;
  fusionMetadata: {
    primaryGenre: GenreType;
    secondaryGenre: GenreType;
    compatibilityScore: number;
    fusionStyle: string;
    vocabularyStrategy: VocabularyStrategy;
    patternSources: string[];
    hybridElements: string[];
    creativityLevel: number;
    authenticity: number;
    innovationFactor: number;
  };
  qualityScore: number;
  explanations: {
    fusionRationale: string;
    genreInfluences: string[];
    creativeElements: string[];
    marketAppeal: string;
  };
}

// Fusion pattern definition for hybrid patterns
export interface FusionPattern {
  id: string;
  name: string;
  sourceGenres: [GenreType, GenreType];
  fusionType: 'structural' | 'vocabulary' | 'conceptual' | 'cultural';
  blendMethod: 'interweave' | 'layer' | 'synthesize' | 'alternate';
  template: string;
  examples: string[];
  generate: (fusedVocab: FusedVocabulary, context: PatternContext) => string;
}

// Advanced fusion analysis
export interface FusionAnalysis {
  compatibility: CompatibilityScore;
  vocabularyPotential: number;
  culturalSynergy: number;
  innovationOpportunity: number;
  marketViability: number;
  artisticMerit: number;
  recommendedApproach: {
    strategy: VocabularyStrategy;
    intensity: string;
    focusAreas: string[];
    cautionAreas: string[];
  };
}

export class CrossGenreFusionEngine {
  private fusionPatterns: Map<string, FusionPattern[]> = new Map();
  private fusionHistory: Map<string, number> = new Map();
  private successMetrics: Map<string, { attempts: number, successes: number, avgQuality: number }> = new Map();

  constructor() {
    this.initializeFusionPatterns();
    secureLog.info('Cross-Genre Fusion Engine initialized with advanced pattern fusion capabilities');
  }

  /**
   * Generate cross-genre fused names based on request parameters
   */
  async generateFusedNames(
    request: CrossGenreFusionRequest,
    sources: EnhancedWordSource
  ): Promise<CrossGenreFusionResult[]> {
    const {
      primaryGenre,
      secondaryGenre,
      mood,
      wordCount = 2,
      count = 3,
      fusionIntensity = 'moderate',
      creativityLevel = 'balanced',
      preserveAuthenticity = true
    } = request;

    // Validate genre compatibility
    const compatibility = genreCompatibilityMatrix.getCompatibility(primaryGenre, secondaryGenre);
    if (!compatibility) {
      throw new Error(`No compatibility data available for ${primaryGenre} and ${secondaryGenre}`);
    }

    // Analyze fusion potential
    const fusionAnalysis = await this.analyzeFusionPotential(primaryGenre, secondaryGenre, request);

    // Generate fused vocabulary
    const fusedVocabulary = vocabularyFusionSystem.fuseVocabularies(
      primaryGenre,
      secondaryGenre,
      mood as any,
      request.vocabularyStrategy || fusionAnalysis.recommendedApproach.strategy
    );

    // Create enhanced word source with fused vocabulary
    const fusedWordSource = vocabularyFusionSystem.createFusedWordSource(fusedVocabulary, sources);

    // Generate fusion results
    const results: CrossGenreFusionResult[] = [];
    const generationAttempts = Math.max(count * 3, 10); // Generate more candidates for better selection

    for (let i = 0; i < generationAttempts; i++) {
      try {
        const fusionResult = await this.generateSingleFusedName(
          request,
          fusedVocabulary,
          fusedWordSource,
          compatibility,
          fusionAnalysis
        );

        if (fusionResult && this.validateFusionResult(fusionResult, request)) {
          results.push(fusionResult);

          if (results.length >= count) {
            break;
          }
        }
      } catch (error) {
        secureLog.debug(`Fusion generation attempt ${i + 1} failed: ${error}`);
        continue;
      }
    }

    // Sort by quality score and return top results
    const sortedResults = results
      .sort((a, b) => b.qualityScore - a.qualityScore)
      .slice(0, count);

    // Update fusion metrics
    this.updateFusionMetrics(primaryGenre, secondaryGenre, sortedResults);

    secureLog.info(`Generated ${sortedResults.length} cross-genre fusion names for ${primaryGenre} + ${secondaryGenre}`);
    return sortedResults;
  }

  /**
   * Generate a single fused name using advanced fusion techniques
   */
  private async generateSingleFusedName(
    request: CrossGenreFusionRequest,
    fusedVocabulary: FusedVocabulary,
    fusedWordSource: EnhancedWordSource,
    compatibility: CompatibilityScore,
    analysis: FusionAnalysis
  ): Promise<CrossGenreFusionResult | null> {
    const { primaryGenre, secondaryGenre, wordCount = 2, fusionIntensity = 'moderate' } = request;

    // Select fusion approach based on intensity and analysis
    const fusionApproach = this.selectFusionApproach(request, analysis);
    let generatedName: string | null = null;
    let patternSources: string[] = [];
    let hybridElements: string[] = [];

    // Try different fusion methods in order of preference
    const methods = this.getFusionMethods(fusionIntensity, compatibility.fusionStyle);
    
    for (const method of methods) {
      try {
        const fusionResult = await this.applyFusionMethod(
          method,
          request,
          fusedVocabulary,
          fusedWordSource,
          compatibility
        );

        if (fusionResult) {
          generatedName = fusionResult.name;
          patternSources = fusionResult.patternSources;
          hybridElements = fusionResult.hybridElements;
          break;
        }
      } catch (error) {
        secureLog.debug(`Fusion method ${method} failed: ${error}`);
        continue;
      }
    }

    if (!generatedName) {
      return null;
    }

    // Calculate quality and innovation scores
    const qualityScore = this.calculateFusionQuality(generatedName, request, analysis, compatibility);
    const innovationFactor = this.calculateInnovationFactor(generatedName, request, fusedVocabulary);
    const authenticity = this.calculateAuthenticityScore(generatedName, primaryGenre, secondaryGenre);

    // Generate explanations
    const explanations = this.generateFusionExplanations(
      generatedName,
      request,
      compatibility,
      analysis,
      fusedVocabulary
    );

    return {
      name: generatedName,
      fusionMetadata: {
        primaryGenre,
        secondaryGenre,
        compatibilityScore: compatibility.score,
        fusionStyle: compatibility.fusionStyle,
        vocabularyStrategy: fusedVocabulary.fusionMetadata.strategy,
        patternSources,
        hybridElements,
        creativityLevel: analysis.innovationOpportunity,
        authenticity,
        innovationFactor
      },
      qualityScore,
      explanations
    };
  }

  /**
   * Analyze fusion potential between two genres
   */
  private async analyzeFusionPotential(
    genre1: GenreType,
    genre2: GenreType,
    request: CrossGenreFusionRequest
  ): Promise<FusionAnalysis> {
    const compatibility = genreCompatibilityMatrix.getCompatibility(genre1, genre2)!;
    const genre1Characteristics = genreCompatibilityMatrix.getGenreCharacteristics(genre1)!;
    const genre2Characteristics = genreCompatibilityMatrix.getGenreCharacteristics(genre2)!;

    // Calculate various fusion metrics
    const vocabularyPotential = this.calculateVocabularyPotential(genre1Characteristics, genre2Characteristics);
    const culturalSynergy = this.calculateCulturalSynergy(genre1Characteristics, genre2Characteristics);
    const innovationOpportunity = this.calculateInnovationOpportunity(compatibility, request);
    const marketViability = this.calculateMarketViability(genre1, genre2, request);
    const artisticMerit = this.calculateArtisticMerit(compatibility, vocabularyPotential, culturalSynergy);

    // Determine recommended approach
    const recommendedApproach = this.determineOptimalApproach(
      compatibility,
      vocabularyPotential,
      culturalSynergy,
      request
    );

    return {
      compatibility,
      vocabularyPotential,
      culturalSynergy,
      innovationOpportunity,
      marketViability,
      artisticMerit,
      recommendedApproach
    };
  }

  /**
   * Initialize fusion patterns for different genre combinations
   */
  private initializeFusionPatterns() {
    // Electronic + Jazz fusion patterns
    this.fusionPatterns.set('electronic-jazz', [
      {
        id: 'electronic_jazz_improvisation',
        name: 'Electronic Jazz Improvisation',
        sourceGenres: ['electronic', 'jazz'],
        fusionType: 'conceptual',
        blendMethod: 'interweave',
        template: '{electronic_prefix} {jazz_technique} {electronic_suffix}',
        examples: ['Digital Bebop Machine', 'Cyber Swing Protocol', 'Synthetic Jazz Flow'],
        generate: (fusedVocab, context) => {
          const electronicTerm = getRandomWord(fusedVocab.primaryWords.filter(w => 
            ['digital', 'cyber', 'synthetic', 'electronic', 'virtual'].some(prefix => 
              w.toLowerCase().includes(prefix)
            )
          )) || 'Digital';
          const jazzTerm = getRandomWord(fusedVocab.primaryWords.filter(w => 
            ['jazz', 'swing', 'bebop', 'improvisation', 'harmony'].some(term => 
              w.toLowerCase().includes(term)
            )
          )) || 'Jazz';
          const hybrid = getRandomWord(fusedVocab.hybridTerms) || 'Fusion';
          
          return `${electronicTerm} ${jazzTerm} ${hybrid}`;
        }
      },
      {
        id: 'electro_harmonic_fusion',
        name: 'Electro-Harmonic Fusion',
        sourceGenres: ['electronic', 'jazz'],
        fusionType: 'structural',
        blendMethod: 'synthesize',
        template: '{harmonic_concept} {electronic_processing}',
        examples: ['Harmonic Synthesis', 'Chord Modulation Matrix', 'Jazz Algorithm'],
        generate: (fusedVocab, context) => {
          const harmonicTerm = getRandomWord(['Harmonic', 'Chord', 'Modal', 'Tonal', 'Melodic']) || 'Harmonic';
          const electronicProcess = getRandomWord(['Synthesis', 'Processing', 'Modulation', 'Algorithm']) || 'Synthesis';
          const connector = getRandomWord(fusedVocab.conceptualBlends) || '';
          
          return connector ? `${harmonicTerm} ${connector}` : `${harmonicTerm} ${electronicProcess}`;
        }
      }
    ]);

    // Folk + Electronic fusion patterns
    this.fusionPatterns.set('folk-electronic', [
      {
        id: 'digital_folklore',
        name: 'Digital Folklore Pattern',
        sourceGenres: ['folk', 'electronic'],
        fusionType: 'cultural',
        blendMethod: 'layer',
        template: '{digital_modifier} {folk_tradition}',
        examples: ['Digital Folk Tales', 'Electronic Heritage', 'Cyber Ballads'],
        generate: (fusedVocab, context) => {
          const digitalTerm = getRandomWord(['Digital', 'Electronic', 'Cyber', 'Virtual', 'Synthetic']) || 'Digital';
          const folkTradition = getRandomWord(['Folk', 'Heritage', 'Tradition', 'Ballad', 'Tale']) || 'Folk';
          const culturalElement = getRandomWord(fusedVocab.culturalFusions) || '';
          
          if (culturalElement && Math.random() > 0.5) {
            return culturalElement;
          }
          return `${digitalTerm} ${folkTradition}`;
        }
      },
      {
        id: 'organic_synthetic_bridge',
        name: 'Organic-Synthetic Bridge',
        sourceGenres: ['folk', 'electronic'],
        fusionType: 'conceptual',
        blendMethod: 'alternate',
        template: '{organic_element} meets {synthetic_element}',
        examples: ['Organic Circuits', 'Natural Synthesis', 'Acoustic Algorithms'],
        generate: (fusedVocab, context) => {
          const organicTerm = getRandomWord(['Organic', 'Natural', 'Acoustic', 'Wooden', 'Earthen']) || 'Organic';
          const syntheticTerm = getRandomWord(['Synthetic', 'Digital', 'Circuit', 'Algorithm', 'Code']) || 'Synthetic';
          const bridgeTerm = getRandomWord(['Bridge', 'Fusion', 'Synthesis', 'Meeting', 'Crossing']) || '';
          
          if (bridgeTerm) {
            return `${organicTerm} ${bridgeTerm} ${syntheticTerm}`;
          }
          return `${organicTerm} ${syntheticTerm}`;
        }
      }
    ]);

    // Add more fusion patterns for other genre combinations...
    secureLog.debug(`Initialized ${this.fusionPatterns.size} fusion pattern sets`);
  }

  /**
   * Select optimal fusion approach based on request and analysis
   */
  private selectFusionApproach(request: CrossGenreFusionRequest, analysis: FusionAnalysis): string {
    const { creativityLevel, fusionIntensity } = request;

    if (creativityLevel === 'revolutionary' && fusionIntensity === 'experimental') {
      return 'radical_synthesis';
    } else if (creativityLevel === 'innovative' || fusionIntensity === 'bold') {
      return 'creative_fusion';
    } else if (fusionIntensity === 'moderate' && analysis.compatibility.score > 0.7) {
      return 'harmonic_blend';
    } else if (request.preserveAuthenticity) {
      return 'respectful_fusion';
    } else {
      return 'balanced_hybrid';
    }
  }

  /**
   * Get fusion methods ordered by preference for given parameters
   */
  private getFusionMethods(fusionIntensity: string, fusionStyle: string): string[] {
    const methods = [];

    if (fusionIntensity === 'experimental') {
      methods.push('pattern_synthesis', 'vocabulary_mutation', 'conceptual_bridging');
    } else if (fusionIntensity === 'bold') {
      methods.push('pattern_interweaving', 'vocabulary_fusion', 'hybrid_construction');
    } else if (fusionIntensity === 'moderate') {
      methods.push('pattern_blending', 'vocabulary_alternation', 'structural_layering');
    } else { // subtle
      methods.push('gentle_infusion', 'accent_integration', 'thematic_suggestion');
    }

    // Add style-specific methods
    if (fusionStyle === 'complement') {
      methods.unshift('complementary_fusion');
    } else if (fusionStyle === 'contrast') {
      methods.unshift('contrasting_fusion');
    }

    return methods;
  }

  /**
   * Apply specific fusion method
   */
  private async applyFusionMethod(
    method: string,
    request: CrossGenreFusionRequest,
    fusedVocabulary: FusedVocabulary,
    fusedWordSource: EnhancedWordSource,
    compatibility: CompatibilityScore
  ): Promise<{ name: string, patternSources: string[], hybridElements: string[] } | null> {
    const context: PatternContext = {
      genre: request.primaryGenre,
      mood: request.mood as any,
      type: 'band',
      wordCount: request.wordCount || 2
    };

    switch (method) {
      case 'pattern_synthesis':
        return this.synthesizePatterns(request, fusedVocabulary, fusedWordSource, context);
      
      case 'pattern_interweaving':
        return this.interweavePatterns(request, fusedVocabulary, fusedWordSource, context);
      
      case 'vocabulary_fusion':
        return this.fuseVocabularyPattern(request, fusedVocabulary, context);
      
      case 'complementary_fusion':
        return this.createComplementaryFusion(request, fusedVocabulary, compatibility, context);
      
      case 'contrasting_fusion':
        return this.createContrastingFusion(request, fusedVocabulary, compatibility, context);
      
      case 'hybrid_construction':
        return this.constructHybrid(request, fusedVocabulary, context);
      
      default:
        return this.defaultFusionMethod(request, fusedVocabulary, fusedWordSource, context);
    }
  }

  /**
   * Synthesize entirely new patterns from genre characteristics
   */
  private async synthesizePatterns(
    request: CrossGenreFusionRequest,
    fusedVocabulary: FusedVocabulary,
    fusedWordSource: EnhancedWordSource,
    context: PatternContext
  ): Promise<{ name: string, patternSources: string[], hybridElements: string[] } | null> {
    const { primaryGenre, secondaryGenre } = request;

    // Get fusion patterns for this genre combination
    const fusionPatterns = this.fusionPatterns.get(`${primaryGenre}-${secondaryGenre}`) || 
                           this.fusionPatterns.get(`${secondaryGenre}-${primaryGenre}`) || [];

    if (fusionPatterns.length === 0) {
      return null;
    }

    // Select and apply fusion pattern
    const selectedPattern = getRandomWord(fusionPatterns);
    if (!selectedPattern) return null;

    const generatedName = selectedPattern.generate(fusedVocabulary, context);
    
    if (!generatedName || generatedName.length < 3) {
      return null;
    }

    return {
      name: generatedName,
      patternSources: [selectedPattern.id],
      hybridElements: fusedVocabulary.hybridTerms.filter(term => 
        generatedName.toLowerCase().includes(term.toLowerCase())
      )
    };
  }

  /**
   * Interweave patterns from both genres
   */
  private async interweavePatterns(
    request: CrossGenreFusionRequest,
    fusedVocabulary: FusedVocabulary,
    fusedWordSource: EnhancedWordSource,
    context: PatternContext
  ): Promise<{ name: string, patternSources: string[], hybridElements: string[] } | null> {
    // Select patterns from both genres
    const criteria1: PatternSelectionCriteria = {
      wordCount: Math.max(1, (request.wordCount || 2) - 1),
      genre: request.primaryGenre,
      creativityLevel: 'balanced'
    };

    const criteria2: PatternSelectionCriteria = {
      wordCount: Math.max(1, (request.wordCount || 2) - 1),
      genre: request.secondaryGenre,
      creativityLevel: 'balanced'
    };

    const pattern1 = patternSelectionEngine.selectPattern(criteria1, fusedWordSource);
    const pattern2 = patternSelectionEngine.selectPattern(criteria2, fusedWordSource);

    if (!pattern1 || !pattern2) {
      return null;
    }

    // Interweave the patterns
    const name1Part = pattern1.generate(fusedWordSource, context);
    const name2Part = pattern2.generate(fusedWordSource, context);

    if (!name1Part || !name2Part) {
      return null;
    }

    // Combine pattern parts intelligently
    const words1 = name1Part.split(' ').filter(w => w.length > 0);
    const words2 = name2Part.split(' ').filter(w => w.length > 0);

    let interweavedWords: string[] = [];
    const maxLength = Math.max(words1.length, words2.length);
    
    for (let i = 0; i < maxLength && interweavedWords.length < (request.wordCount || 2); i++) {
      if (i < words1.length) interweavedWords.push(words1[i]);
      if (i < words2.length && interweavedWords.length < (request.wordCount || 2)) {
        interweavedWords.push(words2[i]);
      }
    }

    const finalName = interweavedWords.slice(0, request.wordCount || 2).join(' ');

    return {
      name: finalName,
      patternSources: [pattern1.id, pattern2.id],
      hybridElements: fusedVocabulary.hybridTerms.filter(term => 
        finalName.toLowerCase().includes(term.toLowerCase())
      )
    };
  }

  /**
   * Create fusion based on vocabulary blending
   */
  private async fuseVocabularyPattern(
    request: CrossGenreFusionRequest,
    fusedVocabulary: FusedVocabulary,
    context: PatternContext
  ): Promise<{ name: string, patternSources: string[], hybridElements: string[] } | null> {
    const { wordCount = 2 } = request;

    // Build name from fused vocabulary components
    const nameComponents: string[] = [];
    const usedHybrids: string[] = [];

    // Try to use hybrid terms first
    if (fusedVocabulary.hybridTerms.length > 0 && Math.random() > 0.4) {
      const hybridTerm = getRandomWord(fusedVocabulary.hybridTerms);
      if (hybridTerm) {
        nameComponents.push(hybridTerm);
        usedHybrids.push(hybridTerm);
      }
    }

    // Fill remaining slots with primary and secondary vocabulary
    while (nameComponents.length < wordCount) {
      const sourcePool = nameComponents.length === 0 ? 
        fusedVocabulary.primaryWords : 
        [...fusedVocabulary.primaryWords, ...fusedVocabulary.secondaryWords];
      
      const word = getRandomWord(sourcePool.filter(w => !nameComponents.includes(w)));
      if (word) {
        nameComponents.push(word);
      } else {
        break;
      }
    }

    if (nameComponents.length === 0) {
      return null;
    }

    const finalName = nameComponents.join(' ');

    return {
      name: finalName,
      patternSources: ['vocabulary_fusion'],
      hybridElements: usedHybrids
    };
  }

  /**
   * Create complementary fusion emphasizing synergies
   */
  private async createComplementaryFusion(
    request: CrossGenreFusionRequest,
    fusedVocabulary: FusedVocabulary,
    compatibility: CompatibilityScore,
    context: PatternContext
  ): Promise<{ name: string, patternSources: string[], hybridElements: string[] } | null> {
    // Focus on complementary aspects mentioned in compatibility synergies
    const synergisticTerms = this.extractSynergisticTerms(compatibility.synergies, fusedVocabulary);
    
    if (synergisticTerms.length === 0) {
      return this.defaultFusionMethod(request, fusedVocabulary, {} as any, context);
    }

    const nameComponents = synergisticTerms.slice(0, request.wordCount || 2);
    const finalName = nameComponents.join(' ');

    return {
      name: finalName,
      patternSources: ['complementary_fusion'],
      hybridElements: fusedVocabulary.hybridTerms.filter(term => 
        finalName.toLowerCase().includes(term.toLowerCase())
      )
    };
  }

  /**
   * Create contrasting fusion emphasizing creative tension
   */
  private async createContrastingFusion(
    request: CrossGenreFusionRequest,
    fusedVocabulary: FusedVocabulary,
    compatibility: CompatibilityScore,
    context: PatternContext
  ): Promise<{ name: string, patternSources: string[], hybridElements: string[] } | null> {
    // Create tension by pairing contrasting elements
    const contrastPairs = [
      ['organic', 'synthetic'],
      ['traditional', 'futuristic'],
      ['acoustic', 'electronic'],
      ['simple', 'complex'],
      ['raw', 'refined']
    ];

    const selectedPair = getRandomWord(contrastPairs) || ['organic', 'synthetic'];
    const nameComponents: string[] = [];

    // Find terms that match contrasting concepts
    fusedVocabulary.primaryWords.forEach(word => {
      selectedPair.forEach(concept => {
        if (word.toLowerCase().includes(concept) && nameComponents.length < (request.wordCount || 2)) {
          nameComponents.push(word);
        }
      });
    });

    // Fill remaining slots if needed
    while (nameComponents.length < (request.wordCount || 2)) {
      const word = getRandomWord(fusedVocabulary.conceptualBlends) || 
                   getRandomWord(fusedVocabulary.primaryWords);
      if (word && !nameComponents.includes(word)) {
        nameComponents.push(word);
      } else {
        break;
      }
    }

    if (nameComponents.length === 0) {
      return null;
    }

    const finalName = nameComponents.join(' ');

    return {
      name: finalName,
      patternSources: ['contrasting_fusion'],
      hybridElements: fusedVocabulary.hybridTerms.filter(term => 
        finalName.toLowerCase().includes(term.toLowerCase())
      )
    };
  }

  /**
   * Construct hybrid using advanced combination techniques
   */
  private async constructHybrid(
    request: CrossGenreFusionRequest,
    fusedVocabulary: FusedVocabulary,
    context: PatternContext
  ): Promise<{ name: string, patternSources: string[], hybridElements: string[] } | null> {
    // Use conceptual blends as the foundation
    if (fusedVocabulary.conceptualBlends.length > 0) {
      const conceptualBlend = getRandomWord(fusedVocabulary.conceptualBlends);
      if (conceptualBlend) {
        return {
          name: conceptualBlend,
          patternSources: ['conceptual_construction'],
          hybridElements: [conceptualBlend]
        };
      }
    }

    // Fall back to cultural fusion
    if (fusedVocabulary.culturalFusions.length > 0) {
      const culturalFusion = getRandomWord(fusedVocabulary.culturalFusions);
      if (culturalFusion) {
        return {
          name: culturalFusion,
          patternSources: ['cultural_construction'],
          hybridElements: [culturalFusion]
        };
      }
    }

    return null;
  }

  /**
   * Default fusion method when others fail
   */
  private async defaultFusionMethod(
    request: CrossGenreFusionRequest,
    fusedVocabulary: FusedVocabulary,
    fusedWordSource: EnhancedWordSource,
    context: PatternContext
  ): Promise<{ name: string, patternSources: string[], hybridElements: string[] } | null> {
    // Simple but reliable fusion approach
    const word1 = getRandomWord(fusedVocabulary.primaryWords) || 
                  getRandomWord(fusedVocabulary.secondaryWords) ||
                  'Fusion';
    
    const word2 = request.wordCount && request.wordCount > 1 ? 
                  getRandomWord(fusedVocabulary.primaryWords.filter(w => w !== word1)) ||
                  getRandomWord(fusedVocabulary.secondaryWords.filter(w => w !== word1)) ||
                  'Blend' : '';

    const nameComponents = [word1, word2].filter(w => w.length > 0);
    const finalName = nameComponents.slice(0, request.wordCount || 2).join(' ');

    return {
      name: finalName,
      patternSources: ['default_fusion'],
      hybridElements: []
    };
  }

  // Helper methods for calculations and analysis...
  
  private calculateVocabularyPotential(chars1: any, chars2: any): number {
    // Calculate based on cultural overlap and complementary characteristics
    let potential = 0.5;
    
    // Cultural overlap bonus
    const culturalOverlap = chars1.culturalRoots.filter((root: string) => 
      chars2.culturalRoots.includes(root)
    ).length;
    potential += culturalOverlap * 0.1;

    // Complementary instrumentation bonus
    if (chars1.instrumentation !== chars2.instrumentation) {
      potential += 0.15;
    }

    // Complexity balance bonus
    const complexityDiff = Math.abs(chars1.complexity - chars2.complexity);
    if (complexityDiff > 0.3 && complexityDiff < 0.7) {
      potential += 0.1;
    }

    return Math.min(potential, 1.0);
  }

  private calculateCulturalSynergy(chars1: any, chars2: any): number {
    let synergy = 0.5;

    // Era compatibility
    if (chars1.eraOrigin === chars2.eraOrigin) {
      synergy += 0.2;
    } else {
      // Different eras can be interesting too
      synergy += 0.1;
    }

    // Emotional range overlap
    const emotionalOverlap = chars1.emotionalRange.filter((emotion: string) => 
      chars2.emotionalRange.includes(emotion)
    ).length;
    synergy += emotionalOverlap * 0.05;

    return Math.min(synergy, 1.0);
  }

  private calculateInnovationOpportunity(compatibility: CompatibilityScore, request: CrossGenreFusionRequest): number {
    let innovation = compatibility.score * 0.5;

    // Creativity level bonus
    if (request.creativityLevel === 'revolutionary') innovation += 0.3;
    else if (request.creativityLevel === 'innovative') innovation += 0.2;
    else if (request.creativityLevel === 'balanced') innovation += 0.1;

    // Fusion style bonus
    if (compatibility.fusionStyle === 'contrast') innovation += 0.15;
    else if (compatibility.fusionStyle === 'hybrid') innovation += 0.1;

    return Math.min(innovation, 1.0);
  }

  private calculateMarketViability(genre1: GenreType, genre2: GenreType, request: CrossGenreFusionRequest): number {
    let viability = 0.5;

    // Popular genres get market bonus
    const popularGenres = ['pop', 'rock', 'electronic', 'hip-hop', 'indie'];
    if (popularGenres.includes(genre1)) viability += 0.1;
    if (popularGenres.includes(genre2)) viability += 0.1;

    // Target audience adjustment
    if (request.targetAudience === 'mainstream') viability += 0.2;
    else if (request.targetAudience === 'experimental') viability -= 0.1;

    return Math.min(Math.max(viability, 0), 1.0);
  }

  private calculateArtisticMerit(compatibility: CompatibilityScore, vocabularyPotential: number, culturalSynergy: number): number {
    return (compatibility.score * 0.4 + vocabularyPotential * 0.3 + culturalSynergy * 0.3);
  }

  private determineOptimalApproach(
    compatibility: CompatibilityScore,
    vocabularyPotential: number,
    culturalSynergy: number,
    request: CrossGenreFusionRequest
  ): { strategy: VocabularyStrategy, intensity: string, focusAreas: string[], cautionAreas: string[] } {
    let strategy: VocabularyStrategy = 'merge';
    let intensity = 'moderate';
    const focusAreas: string[] = [];
    const cautionAreas: string[] = [];

    // Determine strategy based on compatibility
    if (compatibility.score > 0.8) {
      strategy = 'synthesize';
      intensity = 'bold';
      focusAreas.push('Creative synthesis', 'Innovative combinations');
    } else if (compatibility.score > 0.6) {
      strategy = compatibility.fusionStyle === 'contrast' ? 'alternate' : 'merge';
      intensity = 'moderate';
      focusAreas.push('Balanced blending', 'Complementary elements');
    } else {
      strategy = 'dominant';
      intensity = 'subtle';
      focusAreas.push('Careful integration', 'Respectful fusion');
      cautionAreas.push('Maintain authenticity', 'Avoid forced combinations');
    }

    // Adjust based on cultural synergy
    if (culturalSynergy > 0.7) {
      focusAreas.push('Cultural bridges', 'Shared heritage');
    } else if (culturalSynergy < 0.3) {
      cautionAreas.push('Cultural sensitivity', 'Respectful representation');
    }

    // Vocabulary potential adjustments
    if (vocabularyPotential > 0.7) {
      focusAreas.push('Rich vocabulary fusion', 'Linguistic creativity');
    } else if (vocabularyPotential < 0.4) {
      cautionAreas.push('Limited vocabulary overlap', 'Simple combinations preferred');
    }

    return { strategy, intensity, focusAreas, cautionAreas };
  }

  private calculateFusionQuality(
    name: string,
    request: CrossGenreFusionRequest,
    analysis: FusionAnalysis,
    compatibility: CompatibilityScore
  ): number {
    let quality = 0.5;

    // Length and structure bonus
    const words = name.split(' ').filter(w => w.length > 0);
    if (words.length === (request.wordCount || 2)) quality += 0.1;

    // Compatibility bonus
    quality += compatibility.score * 0.2;

    // Artistic merit bonus
    quality += analysis.artisticMerit * 0.15;

    // Innovation bonus
    quality += analysis.innovationOpportunity * 0.1;

    // Avoid repetition penalty
    if (this.fusionHistory.has(name)) {
      quality -= 0.1;
    }

    return Math.min(Math.max(quality, 0), 1.0);
  }

  private calculateInnovationFactor(name: string, request: CrossGenreFusionRequest, fusedVocabulary: FusedVocabulary): number {
    let innovation = 0.5;

    // Hybrid terms bonus
    const hybridTermsUsed = fusedVocabulary.hybridTerms.filter(term => 
      name.toLowerCase().includes(term.toLowerCase())
    ).length;
    innovation += hybridTermsUsed * 0.1;

    // Conceptual blends bonus
    const conceptualBlendsUsed = fusedVocabulary.conceptualBlends.filter(blend => 
      name.toLowerCase().includes(blend.toLowerCase())
    ).length;
    innovation += conceptualBlendsUsed * 0.15;

    // Creativity level bonus
    if (request.creativityLevel === 'revolutionary') innovation += 0.2;
    else if (request.creativityLevel === 'innovative') innovation += 0.1;

    return Math.min(innovation, 1.0);
  }

  private calculateAuthenticityScore(name: string, genre1: GenreType, genre2: GenreType): number {
    // This would ideally check against known authentic terms for each genre
    // For now, return a base score adjusted by genre characteristics
    let authenticity = 0.7;

    // Penalty for overly synthetic-sounding names
    if (name.toLowerCase().includes('cyber') || name.toLowerCase().includes('neo')) {
      authenticity -= 0.1;
    }

    // Bonus for using traditional musical terms
    const musicalTerms = ['harmony', 'rhythm', 'melody', 'beat', 'chord', 'scale'];
    const containsMusicalTerms = musicalTerms.some(term => 
      name.toLowerCase().includes(term)
    );
    if (containsMusicalTerms) authenticity += 0.1;

    return Math.min(Math.max(authenticity, 0), 1.0);
  }

  private generateFusionExplanations(
    name: string,
    request: CrossGenreFusionRequest,
    compatibility: CompatibilityScore,
    analysis: FusionAnalysis,
    fusedVocabulary: FusedVocabulary
  ): CrossGenreFusionResult['explanations'] {
    const fusionRationale = `This name blends ${request.primaryGenre} and ${request.secondaryGenre} ` +
      `using a ${compatibility.fusionStyle} approach, leveraging their ${compatibility.score > 0.7 ? 'strong' : 'moderate'} compatibility. ` +
      `${compatibility.synergies.slice(0, 2).join('. ')}.`;

    const genreInfluences = [
      `${request.primaryGenre}: ${this.extractGenreInfluence(name, request.primaryGenre, fusedVocabulary)}`,
      `${request.secondaryGenre}: ${this.extractGenreInfluence(name, request.secondaryGenre, fusedVocabulary)}`
    ];

    const creativeElements = [];
    if (fusedVocabulary.hybridTerms.some(term => name.toLowerCase().includes(term.toLowerCase()))) {
      creativeElements.push('Hybrid terminology fusion');
    }
    if (fusedVocabulary.conceptualBlends.some(blend => name.toLowerCase().includes(blend.toLowerCase()))) {
      creativeElements.push('Conceptual bridge construction');
    }
    creativeElements.push('Cross-genre vocabulary synthesis');

    const marketAppeal = analysis.marketViability > 0.7 ? 
      'High market appeal with broad audience potential' :
      analysis.marketViability > 0.4 ?
      'Moderate market appeal with niche audience strength' :
      'Artistic focus with experimental audience appeal';

    return {
      fusionRationale,
      genreInfluences,
      creativeElements,
      marketAppeal
    };
  }

  private extractGenreInfluence(name: string, genre: GenreType, fusedVocabulary: FusedVocabulary): string {
    // Analyze which elements in the name come from which genre
    // This is a simplified implementation
    const genreKeywords = {
      'electronic': ['digital', 'cyber', 'synthetic', 'electronic', 'tech'],
      'jazz': ['jazz', 'swing', 'bebop', 'harmony', 'improvisation'],
      'rock': ['rock', 'thunder', 'electric', 'power', 'steel'],
      'folk': ['folk', 'acoustic', 'traditional', 'heritage', 'organic'],
      'hip-hop': ['hop', 'flow', 'beats', 'rhythm', 'culture'],
      'classical': ['classical', 'symphony', 'orchestral', 'harmony', 'composition']
    };

    const keywords = genreKeywords[genre as keyof typeof genreKeywords] || [];
    const foundElements = keywords.filter(keyword => 
      name.toLowerCase().includes(keyword)
    );

    return foundElements.length > 0 ? 
      `Contributes ${foundElements.join(', ')} elements` :
      'Provides structural and tonal foundation';
  }

  private extractSynergisticTerms(synergies: string[], fusedVocabulary: FusedVocabulary): string[] {
    const terms: string[] = [];
    const keywordMap = {
      'energy': ['power', 'electric', 'dynamic', 'vibrant'],
      'rhythm': ['beat', 'pulse', 'flow', 'groove'],
      'harmony': ['chord', 'melody', 'harmonic', 'tonal'],
      'innovation': ['new', 'modern', 'creative', 'fresh'],
      'tradition': ['classic', 'heritage', 'authentic', 'original']
    };

    synergies.forEach(synergy => {
      Object.entries(keywordMap).forEach(([concept, keywords]) => {
        if (synergy.toLowerCase().includes(concept)) {
          const matchingTerms = fusedVocabulary.primaryWords.filter(term => 
            keywords.some(keyword => term.toLowerCase().includes(keyword))
          );
          terms.push(...matchingTerms.slice(0, 1)); // Take first match per concept
        }
      });
    });

    return [...new Set(terms)]; // Remove duplicates
  }

  private validateFusionResult(result: CrossGenreFusionResult, request: CrossGenreFusionRequest): boolean {
    // Basic validation checks
    if (!result.name || result.name.length < 3) return false;
    if (result.qualityScore < 0.3) return false;
    if (request.preserveAuthenticity && result.fusionMetadata.authenticity < 0.5) return false;
    
    // Check word count
    const wordCount = result.name.split(' ').filter(w => w.length > 0).length;
    const targetWordCount = request.wordCount || 2;
    if (wordCount < targetWordCount - 1 || wordCount > targetWordCount + 1) return false;

    return true;
  }

  private updateFusionMetrics(genre1: GenreType, genre2: GenreType, results: CrossGenreFusionResult[]) {
    const key = `${genre1}-${genre2}`;
    const existingMetrics = this.successMetrics.get(key) || { attempts: 0, successes: 0, avgQuality: 0 };
    
    existingMetrics.attempts++;
    existingMetrics.successes += results.length;
    
    if (results.length > 0) {
      const totalQuality = results.reduce((sum, result) => sum + result.qualityScore, 0);
      const newAvgQuality = totalQuality / results.length;
      existingMetrics.avgQuality = (existingMetrics.avgQuality + newAvgQuality) / 2;
    }

    this.successMetrics.set(key, existingMetrics);

    // Update fusion history
    results.forEach(result => {
      this.fusionHistory.set(result.name, (this.fusionHistory.get(result.name) || 0) + 1);
    });
  }

  /**
   * Get fusion analytics for performance monitoring
   */
  getFusionAnalytics(): {
    totalFusions: number,
    successRate: number,
    topGenrePairs: Array<{genres: string, successRate: number, avgQuality: number}>,
    innovationTrends: any
  } {
    const totalAttempts = Array.from(this.successMetrics.values()).reduce((sum, m) => sum + m.attempts, 0);
    const totalSuccesses = Array.from(this.successMetrics.values()).reduce((sum, m) => sum + m.successes, 0);
    
    const topGenrePairs = Array.from(this.successMetrics.entries())
      .map(([genres, metrics]) => ({
        genres,
        successRate: metrics.attempts > 0 ? metrics.successes / metrics.attempts : 0,
        avgQuality: metrics.avgQuality
      }))
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 10);

    return {
      totalFusions: totalSuccesses,
      successRate: totalAttempts > 0 ? totalSuccesses / totalAttempts : 0,
      topGenrePairs,
      innovationTrends: {} // Could be expanded with more detailed analytics
    };
  }
}

// Export singleton instance
export const crossGenreFusionEngine = new CrossGenreFusionEngine();