/**
 * Semantic Analyzer for Quality Scoring
 * Analyzes word relationships, emotional valence, cultural significance, and contextual appropriateness
 */

import { conceptNetService } from '../conceptNetService';
import { datamuseService } from '../datamuseService';
import { secureLog } from '../../utils/secureLogger';
import { CacheService } from '../cacheService';

export interface SemanticScore {
  overall: number;           // 0-100 overall semantic quality
  coherence: number;         // How well words work together semantically
  emotionalResonance: number; // Emotional impact and appropriateness
  culturalAppeal: number;    // Cultural relevance and appeal
  contextualFit: number;     // Fit for the specified genre/mood/context
  complexity: number;        // Semantic complexity and depth
  imagery: number;           // Vivid imagery and visual associations
  issues: string[];          // Semantic issues detected
}

export interface SemanticAnalysis {
  score: SemanticScore;
  wordRelationships: WordRelationship[];
  emotionalProfile: EmotionalProfile;
  culturalAssociations: CulturalAssociation[];
  imageAssociations: ImageAssociation[];
  semanticCohesion: number;
  recommendations: string[];
}

export interface WordRelationship {
  word1: string;
  word2: string;
  relationshipType: 'synonym' | 'antonym' | 'related' | 'associated' | 'conflicting';
  strength: number; // 0-1
  context: string;
}

export interface EmotionalProfile {
  valence: number;      // -1 (negative) to 1 (positive)
  arousal: number;      // 0 (calm) to 1 (exciting)
  dominance: number;    // 0 (submissive) to 1 (dominant)
  primaryEmotions: string[];
  emotionalCoherence: number; // How well emotions work together
}

export interface CulturalAssociation {
  concept: string;
  strength: number;
  context: string;
  appeal: number; // How appealing this association is
}

export interface ImageAssociation {
  image: string;
  vividness: number;
  coherence: number;
  universality: number; // How universally understood this image is
}

export class SemanticAnalyzer {
  private cache: CacheService<SemanticAnalysis>;
  
  // Emotional valence mappings (expanded from existing research)
  private readonly emotionalValence: Record<string, number> = {
    // Highly positive (0.8-1.0)
    'love': 0.9, 'joy': 0.95, 'happiness': 0.9, 'peace': 0.85, 'hope': 0.8,
    'beautiful': 0.85, 'wonderful': 0.9, 'amazing': 0.9, 'brilliant': 0.85,
    'golden': 0.8, 'silver': 0.75, 'light': 0.8, 'bright': 0.85, 'shine': 0.8,
    
    // Moderately positive (0.3-0.7)
    'dream': 0.6, 'music': 0.7, 'dance': 0.75, 'song': 0.7, 'harmony': 0.8,
    'blue': 0.5, 'green': 0.6, 'purple': 0.5, 'heart': 0.6, 'spirit': 0.5,
    'wild': 0.4, 'free': 0.7, 'open': 0.5, 'clear': 0.6, 'fresh': 0.7,
    
    // Neutral (-0.2-0.2)
    'stone': 0.0, 'metal': 0.0, 'time': 0.0, 'space': 0.0, 'mind': 0.0,
    'shadow': -0.1, 'grey': 0.0, 'steel': 0.1, 'crystal': 0.2, 'moon': 0.1,
    
    // Moderately negative (-0.7--0.3)
    'dark': -0.3, 'black': -0.4, 'storm': -0.3, 'rain': -0.2, 'cold': -0.4,
    'lost': -0.5, 'broken': -0.6, 'empty': -0.5, 'hollow': -0.4, 'silent': -0.3,
    
    // Highly negative (-1.0--0.8)
    'hate': -0.9, 'fear': -0.8, 'rage': -0.8, 'anger': -0.8, 'death': -0.9,
    'destroy': -0.9, 'kill': -0.95, 'war': -0.8, 'violence': -0.9, 'evil': -0.9
  };
  
  // Arousal mappings (how exciting/intense)
  private readonly emotionalArousal: Record<string, number> = {
    // High arousal (0.8-1.0) - intense, exciting
    'fire': 0.9, 'storm': 0.85, 'thunder': 0.9, 'lightning': 0.95, 'rage': 0.9,
    'explosion': 0.95, 'electric': 0.85, 'wild': 0.8, 'chaos': 0.9, 'rush': 0.85,
    'scream': 0.9, 'shout': 0.8, 'fight': 0.85, 'run': 0.7, 'dance': 0.8,
    
    // Moderate arousal (0.4-0.7)
    'music': 0.6, 'beat': 0.7, 'rhythm': 0.6, 'flow': 0.5, 'wave': 0.5,
    'dream': 0.4, 'hope': 0.5, 'love': 0.6, 'heart': 0.6, 'spirit': 0.5,
    
    // Low arousal (0.0-0.3) - calm, peaceful
    'peace': 0.1, 'calm': 0.0, 'quiet': 0.1, 'still': 0.0, 'rest': 0.1,
    'sleep': 0.0, 'meditation': 0.1, 'whisper': 0.2, 'gentle': 0.2, 'soft': 0.1
  };
  
  // Cultural appeal mappings for different contexts
  private readonly culturalAppeal: Record<string, number> = {
    // Universal appeal (0.8-1.0)
    'love': 0.95, 'music': 0.9, 'heart': 0.9, 'dream': 0.85, 'light': 0.85,
    'fire': 0.8, 'water': 0.85, 'sky': 0.9, 'star': 0.9, 'moon': 0.85,
    
    // High appeal (0.6-0.8)
    'dance': 0.75, 'song': 0.8, 'rhythm': 0.7, 'harmony': 0.8, 'melody': 0.75,
    'shadow': 0.7, 'storm': 0.7, 'ocean': 0.8, 'mountain': 0.75, 'forest': 0.7,
    
    // Moderate appeal (0.4-0.6)
    'metal': 0.5, 'steel': 0.5, 'stone': 0.5, 'crystal': 0.6, 'glass': 0.5,
    'purple': 0.6, 'silver': 0.7, 'golden': 0.8, 'black': 0.6, 'white': 0.7,
    
    // Lower appeal (0.2-0.4) - more niche or technical
    'quantum': 0.3, 'matrix': 0.3, 'algorithm': 0.2, 'protocol': 0.2, 'data': 0.2
  };
  
  constructor() {
    // Initialize cache with 2 hour TTL and max 3000 entries
    this.cache = new CacheService<SemanticAnalysis>(7200, 3000);
  }
  
  /**
   * Perform comprehensive semantic analysis of a name/phrase
   */
  async analyzeSemantics(
    text: string, 
    context?: { genre?: string; mood?: string; type?: 'band' | 'song' }
  ): Promise<SemanticAnalysis> {
    const cacheKey = `${text.toLowerCase()}_${JSON.stringify(context || {})}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached !== null) {
      secureLog.debug(`SemanticAnalyzer cache hit for: ${text}`);
      return cached;
    }
    
    secureLog.debug(`SemanticAnalyzer analyzing: ${text}`);
    
    try {
      const words = this.extractWords(text);
      
      // Perform parallel analysis
      const [
        wordRelationships,
        emotionalProfile,
        culturalAssociations,
        imageAssociations
      ] = await Promise.all([
        this.analyzeWordRelationships(words),
        this.analyzeEmotionalProfile(words, context),
        this.analyzeCulturalAssociations(words, context),
        this.analyzeImageAssociations(words)
      ]);
      
      // Calculate semantic cohesion
      const semanticCohesion = this.calculateSemanticCohesion(wordRelationships);
      
      // Generate overall semantic score
      const score = this.calculateSemanticScore(
        words, 
        wordRelationships, 
        emotionalProfile, 
        culturalAssociations, 
        imageAssociations,
        semanticCohesion,
        context
      );
      
      // Generate recommendations
      const recommendations = this.generateSemanticRecommendations(
        score, 
        wordRelationships, 
        emotionalProfile, 
        context
      );
      
      const analysis: SemanticAnalysis = {
        score,
        wordRelationships,
        emotionalProfile,
        culturalAssociations,
        imageAssociations,
        semanticCohesion,
        recommendations
      };
      
      // Cache the result
      this.cache.set(cacheKey, analysis);
      
      return analysis;
      
    } catch (error) {
      secureLog.error('Semantic analysis failed:', error);
      // Return minimal analysis on error
      return this.getDefaultAnalysis(text);
    }
  }
  
  /**
   * Extract meaningful words from text
   */
  private extractWords(text: string): string[] {
    return text
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2 && /^[a-z]+$/.test(word))
      .slice(0, 10); // Limit to prevent excessive API calls
  }
  
  /**
   * Analyze relationships between words in the phrase
   */
  private async analyzeWordRelationships(words: string[]): Promise<WordRelationship[]> {
    if (words.length < 2) return [];
    
    const relationships: WordRelationship[] = [];
    
    // Analyze each pair of words
    for (let i = 0; i < words.length - 1; i++) {
      for (let j = i + 1; j < words.length; j++) {
        const word1 = words[i];
        const word2 = words[j];
        
        try {
          // Get semantic relationships from ConceptNet
          const [concepts1, concepts2] = await Promise.all([
            conceptNetService.getRelatedConcepts(word1, 15),
            conceptNetService.getRelatedConcepts(word2, 15)
          ]);
          
          // Find common concepts
          const commonConcepts = concepts1.filter(c1 => 
            concepts2.some(c2 => c2.word.toLowerCase() === c1.word.toLowerCase())
          );
          
          if (commonConcepts.length > 0) {
            const strength = Math.min(1, commonConcepts.length / 5);
            relationships.push({
              word1,
              word2,
              relationshipType: 'related',
              strength,
              context: commonConcepts.slice(0, 3).map(c => c.word).join(', ')
            });
          }
          
          // Check for synonyms using Datamuse
          const synonyms = await datamuseService.findWords({ 
            meansLike: word1, 
            maxResults: 10 
          });
          
          if (synonyms.some(s => s.word === word2)) {
            relationships.push({
              word1,
              word2,
              relationshipType: 'synonym',
              strength: 0.8,
              context: 'synonymous meaning'
            });
          }
          
        } catch (error) {
          // Continue analysis even if some API calls fail
          secureLog.warn(`Word relationship analysis failed for ${word1}-${word2}:`, error);
        }
      }
    }
    
    return relationships;
  }
  
  /**
   * Analyze emotional profile of the phrase
   */
  private async analyzeEmotionalProfile(
    words: string[], 
    context?: { genre?: string; mood?: string; type?: 'band' | 'song' }
  ): Promise<EmotionalProfile> {
    let totalValence = 0;
    let totalArousal = 0;
    let totalDominance = 0;
    let emotionCount = 0;
    const primaryEmotions: string[] = [];
    
    // Analyze each word
    for (const word of words) {
      const valence = this.emotionalValence[word] || 0;
      const arousal = this.emotionalArousal[word] || 0.5;
      const dominance = this.calculateDominance(word);
      
      totalValence += valence;
      totalArousal += arousal;
      totalDominance += dominance;
      emotionCount++;
      
      // Get emotional associations from ConceptNet
      try {
        const emotions = await conceptNetService.getEmotionalAssociations(word);
        primaryEmotions.push(...emotions.slice(0, 2));
      } catch (error) {
        // Continue analysis even if ConceptNet fails
      }
    }
    
    // Calculate averages
    const avgValence = emotionCount > 0 ? totalValence / emotionCount : 0;
    const avgArousal = emotionCount > 0 ? totalArousal / emotionCount : 0.5;
    const avgDominance = emotionCount > 0 ? totalDominance / emotionCount : 0.5;
    
    // Calculate emotional coherence (how well emotions work together)
    const emotionalCoherence = this.calculateEmotionalCoherence(words, avgValence, avgArousal);
    
    // Apply genre-specific adjustments
    const adjustedProfile = this.adjustForGenre({
      valence: avgValence,
      arousal: avgArousal,
      dominance: avgDominance,
      primaryEmotions: [...new Set(primaryEmotions)].slice(0, 5),
      emotionalCoherence
    }, context?.genre);
    
    return adjustedProfile;
  }
  
  /**
   * Analyze cultural associations and appeal
   */
  private async analyzeCulturalAssociations(
    words: string[], 
    context?: { genre?: string; mood?: string; type?: 'band' | 'song' }
  ): Promise<CulturalAssociation[]> {
    const associations: CulturalAssociation[] = [];
    
    for (const word of words) {
      const baseAppeal = this.culturalAppeal[word] || 0.5;
      
      try {
        // Get cultural connections from ConceptNet
        const connections = await conceptNetService.getCulturalConnections(word);
        
        for (const connection of connections.slice(0, 3)) {
          associations.push({
            concept: connection,
            strength: baseAppeal,
            context: `Cultural association with ${word}`,
            appeal: this.calculateCulturalAppeal(connection, context)
          });
        }
      } catch (error) {
        // Use base cultural appeal even if ConceptNet fails
        associations.push({
          concept: word,
          strength: baseAppeal,
          context: 'Direct cultural appeal',
          appeal: baseAppeal
        });
      }
    }
    
    return associations;
  }
  
  /**
   * Analyze visual and imagery associations
   */
  private async analyzeImageAssociations(words: string[]): Promise<ImageAssociation[]> {
    const imageAssociations: ImageAssociation[] = [];
    
    // Common imagery mappings
    const imageMap: Record<string, { vividness: number; universality: number }> = {
      'fire': { vividness: 0.9, universality: 0.95 },
      'light': { vividness: 0.8, universality: 0.9 },
      'shadow': { vividness: 0.85, universality: 0.8 },
      'storm': { vividness: 0.9, universality: 0.85 },
      'ocean': { vividness: 0.85, universality: 0.9 },
      'mountain': { vividness: 0.8, universality: 0.85 },
      'star': { vividness: 0.9, universality: 0.95 },
      'moon': { vividness: 0.85, universality: 0.9 },
      'crystal': { vividness: 0.8, universality: 0.7 },
      'mirror': { vividness: 0.75, universality: 0.8 },
      'gold': { vividness: 0.8, universality: 0.85 },
      'silver': { vividness: 0.75, universality: 0.8 },
      'black': { vividness: 0.7, universality: 0.9 },
      'white': { vividness: 0.7, universality: 0.9 },
      'red': { vividness: 0.85, universality: 0.9 },
      'blue': { vividness: 0.8, universality: 0.9 }
    };
    
    for (const word of words) {
      const imageData = imageMap[word];
      if (imageData) {
        imageAssociations.push({
          image: word,
          vividness: imageData.vividness,
          coherence: this.calculateImageCoherence(word, words),
          universality: imageData.universality
        });
      }
    }
    
    return imageAssociations;
  }
  
  /**
   * Calculate semantic cohesion between words
   */
  private calculateSemanticCohesion(relationships: WordRelationship[]): number {
    if (relationships.length === 0) return 0.5; // Neutral for single words
    
    const totalStrength = relationships.reduce((sum, rel) => sum + rel.strength, 0);
    const avgStrength = totalStrength / relationships.length;
    
    // Bonus for having multiple types of relationships
    const relationshipTypes = new Set(relationships.map(r => r.relationshipType));
    const diversityBonus = Math.min(0.2, relationshipTypes.size * 0.05);
    
    return Math.min(1, avgStrength + diversityBonus);
  }
  
  /**
   * Calculate overall semantic score
   */
  private calculateSemanticScore(
    words: string[],
    relationships: WordRelationship[],
    emotionalProfile: EmotionalProfile,
    culturalAssociations: CulturalAssociation[],
    imageAssociations: ImageAssociation[],
    semanticCohesion: number,
    context?: { genre?: string; mood?: string; type?: 'band' | 'song' }
  ): SemanticScore {
    const issues: string[] = [];
    
    // Base scores
    let coherence = semanticCohesion * 100;
    let emotionalResonance = this.calculateEmotionalResonanceScore(emotionalProfile, context);
    let culturalAppeal = this.calculateCulturalAppealScore(culturalAssociations);
    let contextualFit = this.calculateContextualFitScore(words, emotionalProfile, context);
    let complexity = this.calculateComplexityScore(relationships, emotionalProfile);
    let imagery = this.calculateImageryScore(imageAssociations);
    
    // Apply penalties for issues
    if (relationships.some(r => r.relationshipType === 'conflicting')) {
      coherence -= 20;
      issues.push('Conflicting word meanings detected');
    }
    
    if (emotionalProfile.emotionalCoherence < 0.4) {
      emotionalResonance -= 15;
      issues.push('Inconsistent emotional tone');
    }
    
    if (culturalAssociations.length === 0) {
      culturalAppeal -= 10;
      issues.push('Limited cultural associations');
    }
    
    // Calculate weighted overall score
    const overall = Math.round(
      coherence * 0.25 +
      emotionalResonance * 0.25 +
      culturalAppeal * 0.2 +
      contextualFit * 0.15 +
      complexity * 0.1 +
      imagery * 0.05
    );
    
    return {
      overall: Math.max(0, Math.min(100, overall)),
      coherence: Math.max(0, Math.min(100, coherence)),
      emotionalResonance: Math.max(0, Math.min(100, emotionalResonance)),
      culturalAppeal: Math.max(0, Math.min(100, culturalAppeal)),
      contextualFit: Math.max(0, Math.min(100, contextualFit)),
      complexity: Math.max(0, Math.min(100, complexity)),
      imagery: Math.max(0, Math.min(100, imagery)),
      issues
    };
  }
  
  /**
   * Helper methods for score calculations
   */
  private calculateDominance(word: string): number {
    // Power/dominance mappings
    const dominanceMap: Record<string, number> = {
      'fire': 0.8, 'storm': 0.9, 'thunder': 0.9, 'king': 0.95, 'queen': 0.9,
      'power': 0.9, 'strong': 0.8, 'force': 0.85, 'command': 0.9, 'rule': 0.85,
      'gentle': 0.2, 'soft': 0.1, 'weak': 0.1, 'quiet': 0.3, 'calm': 0.4
    };
    return dominanceMap[word] || 0.5;
  }
  
  private calculateEmotionalCoherence(words: string[], avgValence: number, avgArousal: number): number {
    let coherenceScore = 1.0;
    
    for (const word of words) {
      const wordValence = this.emotionalValence[word] || 0;
      const wordArousal = this.emotionalArousal[word] || 0.5;
      
      // Penalize large deviations from average emotional tone
      const valenceDiff = Math.abs(wordValence - avgValence);
      const arousalDiff = Math.abs(wordArousal - avgArousal);
      
      coherenceScore -= (valenceDiff + arousalDiff) * 0.1;
    }
    
    return Math.max(0, coherenceScore);
  }
  
  private adjustForGenre(profile: EmotionalProfile, genre?: string): EmotionalProfile {
    if (!genre) return profile;
    
    const adjustments: Record<string, Partial<EmotionalProfile>> = {
      'metal': { arousal: Math.min(1, profile.arousal + 0.2), dominance: Math.min(1, profile.dominance + 0.15) },
      'jazz': { valence: Math.min(1, profile.valence + 0.1), arousal: Math.max(0, profile.arousal - 0.1) },
      'folk': { valence: Math.min(1, profile.valence + 0.15), arousal: Math.max(0, profile.arousal - 0.2) },
      'electronic': { arousal: Math.min(1, profile.arousal + 0.15) },
      'classical': { arousal: Math.max(0, profile.arousal - 0.15) }
    };
    
    const adjustment = adjustments[genre];
    return adjustment ? { ...profile, ...adjustment } : profile;
  }
  
  private calculateCulturalAppeal(concept: string, context?: { genre?: string; mood?: string; type?: 'band' | 'song' }): number {
    const baseAppeal = this.culturalAppeal[concept] || 0.5;
    
    // Genre-specific adjustments
    if (context?.genre) {
      const genreAdjustments: Record<string, Record<string, number>> = {
        'metal': { 'dark': 0.2, 'power': 0.15, 'storm': 0.1 },
        'folk': { 'home': 0.15, 'nature': 0.1, 'story': 0.1 },
        'electronic': { 'future': 0.15, 'digital': 0.1, 'energy': 0.1 }
      };
      
      const adjustment = genreAdjustments[context.genre]?.[concept] || 0;
      return Math.min(1, baseAppeal + adjustment);
    }
    
    return baseAppeal;
  }
  
  private calculateImageCoherence(image: string, allWords: string[]): number {
    // Images that work well together
    const coherentGroups = [
      ['fire', 'light', 'bright', 'gold', 'red'],
      ['shadow', 'dark', 'black', 'night'],
      ['ocean', 'blue', 'wave', 'storm'],
      ['star', 'moon', 'silver', 'light'],
      ['mountain', 'stone', 'grey', 'high']
    ];
    
    for (const group of coherentGroups) {
      if (group.includes(image)) {
        const matchingWords = allWords.filter(word => group.includes(word));
        return Math.min(1, matchingWords.length / 3);
      }
    }
    
    return 0.5; // Neutral if no specific coherence found
  }
  
  private calculateEmotionalResonanceScore(profile: EmotionalProfile, context?: { genre?: string; mood?: string; type?: 'band' | 'song' }): number {
    let score = 50; // Base score
    
    // Strong emotional content is generally good
    score += Math.abs(profile.valence) * 30;
    score += profile.arousal * 20;
    
    // Emotional coherence is important
    score += profile.emotionalCoherence * 30;
    
    // Context adjustments
    if (context?.mood) {
      const moodAdjustments: Record<string, number> = {
        'uplifting': profile.valence > 0.3 ? 15 : -10,
        'dark': profile.valence < -0.2 ? 15 : -10,
        'energetic': profile.arousal > 0.6 ? 15 : -10,
        'calm': profile.arousal < 0.4 ? 15 : -10
      };
      score += moodAdjustments[context.mood] || 0;
    }
    
    return score;
  }
  
  private calculateCulturalAppealScore(associations: CulturalAssociation[]): number {
    if (associations.length === 0) return 40;
    
    const avgAppeal = associations.reduce((sum, assoc) => sum + assoc.appeal, 0) / associations.length;
    return avgAppeal * 100;
  }
  
  private calculateContextualFitScore(words: string[], profile: EmotionalProfile, context?: { genre?: string; mood?: string; type?: 'band' | 'song' }): number {
    let score = 60; // Base score
    
    if (!context?.genre) return score;
    
    // Genre-specific word bonuses
    const genreWords: Record<string, string[]> = {
      'rock': ['fire', 'storm', 'power', 'wild', 'electric', 'thunder'],
      'metal': ['steel', 'iron', 'dark', 'black', 'death', 'doom', 'forge'],
      'jazz': ['blue', 'smooth', 'cool', 'velvet', 'midnight', 'silver'],
      'electronic': ['pulse', 'wave', 'digital', 'neon', 'cyber', 'synth'],
      'folk': ['home', 'heart', 'wind', 'mountain', 'river', 'story'],
      'classical': ['symphony', 'harmony', 'elegant', 'refined', 'timeless']
    };
    
    const relevantWords = genreWords[context.genre] || [];
    const matchingWords = words.filter(word => relevantWords.includes(word));
    score += matchingWords.length * 10;
    
    return score;
  }
  
  private calculateComplexityScore(relationships: WordRelationship[], profile: EmotionalProfile): number {
    let score = 50;
    
    // More relationships indicate higher complexity
    score += Math.min(30, relationships.length * 5);
    
    // Emotional complexity (mixed emotions can be sophisticated)
    if (profile.primaryEmotions.length > 2) {
      score += 15;
    }
    
    // Avoid over-complexity
    if (relationships.length > 10) {
      score -= 10;
    }
    
    return score;
  }
  
  private calculateImageryScore(associations: ImageAssociation[]): number {
    if (associations.length === 0) return 30;
    
    const avgVividness = associations.reduce((sum, assoc) => sum + assoc.vividness, 0) / associations.length;
    const avgUniversality = associations.reduce((sum, assoc) => sum + assoc.universality, 0) / associations.length;
    const avgCoherence = associations.reduce((sum, assoc) => sum + assoc.coherence, 0) / associations.length;
    
    return (avgVividness * 0.4 + avgUniversality * 0.4 + avgCoherence * 0.2) * 100;
  }
  
  /**
   * Generate semantic improvement recommendations
   */
  private generateSemanticRecommendations(
    score: SemanticScore,
    relationships: WordRelationship[],
    profile: EmotionalProfile,
    context?: { genre?: string; mood?: string; type?: 'band' | 'song' }
  ): string[] {
    const recommendations: string[] = [];
    
    if (score.coherence < 60) {
      recommendations.push('Consider using words with stronger semantic relationships');
    }
    
    if (score.emotionalResonance < 50) {
      recommendations.push('Add words with stronger emotional impact');
    }
    
    if (score.culturalAppeal < 60) {
      recommendations.push('Choose words with broader cultural appeal');
    }
    
    if (score.contextualFit < 50 && context?.genre) {
      recommendations.push(`Consider words more appropriate for ${context.genre} genre`);
    }
    
    if (score.imagery < 40) {
      recommendations.push('Add more vivid, visual imagery');
    }
    
    if (profile.emotionalCoherence < 0.5) {
      recommendations.push('Ensure emotional consistency across all words');
    }
    
    return recommendations;
  }
  
  /**
   * Return default analysis for error cases
   */
  private getDefaultAnalysis(text: string): SemanticAnalysis {
    return {
      score: {
        overall: 50,
        coherence: 50,
        emotionalResonance: 50,
        culturalAppeal: 50,
        contextualFit: 50,
        complexity: 50,
        imagery: 50,
        issues: ['Analysis incomplete due to error']
      },
      wordRelationships: [],
      emotionalProfile: {
        valence: 0,
        arousal: 0.5,
        dominance: 0.5,
        primaryEmotions: [],
        emotionalCoherence: 0.5
      },
      culturalAssociations: [],
      imageAssociations: [],
      semanticCohesion: 0.5,
      recommendations: ['Unable to generate recommendations due to analysis error']
    };
  }
  
  /**
   * Get cache statistics
   */
  public getCacheStats() {
    return this.cache.getStats();
  }
  
  /**
   * Clear cache
   */
  public clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const semanticAnalyzer = new SemanticAnalyzer();