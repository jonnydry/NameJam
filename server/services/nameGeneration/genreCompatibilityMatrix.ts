/**
 * Genre Compatibility Matrix - Intelligent scoring for cross-genre fusion potential
 * Defines compatibility relationships between musical genres and provides fusion guidance
 */

import { secureLog } from '../../utils/secureLogger';

// Genre compatibility scoring types
export type GenreType = 'rock' | 'metal' | 'jazz' | 'electronic' | 'folk' | 'classical' | 
  'hip-hop' | 'country' | 'blues' | 'reggae' | 'punk' | 'indie' | 'pop' | 'alternative' | 'jam band';

export interface GenreCharacteristics {
  energy: number; // 0-1 (mellow to intense)
  complexity: number; // 0-1 (simple to complex)  
  traditionalism: number; // 0-1 (modern to traditional)
  instrumentation: 'acoustic' | 'electric' | 'electronic' | 'mixed';
  rhythm: 'steady' | 'syncopated' | 'complex' | 'variable';
  improvisation: number; // 0-1 (structured to improvisational)
  commerciality: number; // 0-1 (underground to mainstream)
  emotionalRange: ('dark' | 'bright' | 'neutral' | 'varied')[];
  culturalRoots: string[];
  eraOrigin: string;
  keyElements: string[];
}

export interface CompatibilityScore {
  score: number; // 0-1 compatibility rating
  synergies: string[]; // What works well together
  challenges: string[]; // Potential issues to address
  fusionStyle: 'complement' | 'contrast' | 'hybrid' | 'evolution';
  recommendedRatio: [number, number]; // [genre1Weight, genre2Weight] 
  bestAspects: string[]; // Which aspects to emphasize from each genre
}

export interface FusionRule {
  name: string;
  description: string;
  genreCombination: [GenreType, GenreType];
  compatibility: CompatibilityScore;
  vocabularyStrategy: 'merge' | 'alternate' | 'dominant' | 'synthesize';
  patternStrategy: 'blend' | 'layer' | 'interweave' | 'transform';
  examples: string[];
}

export class GenreCompatibilityMatrix {
  // Genre characteristic profiles
  private genreProfiles: Map<GenreType, GenreCharacteristics> = new Map();
  
  // Pre-calculated compatibility matrix
  private compatibilityMatrix: Map<string, CompatibilityScore> = new Map();
  
  // Fusion rules for specific genre combinations
  private fusionRules: FusionRule[] = [];

  constructor() {
    this.initializeGenreProfiles();
    this.calculateCompatibilityMatrix();
    this.defineFusionRules();
    secureLog.info('Genre Compatibility Matrix initialized with comprehensive fusion intelligence');
  }

  private initializeGenreProfiles() {
    // Rock characteristics
    this.genreProfiles.set('rock', {
      energy: 0.8,
      complexity: 0.6,
      traditionalism: 0.7,
      instrumentation: 'electric',
      rhythm: 'steady',
      improvisation: 0.4,
      commerciality: 0.7,
      emotionalRange: ['dark', 'bright', 'varied'],
      culturalRoots: ['blues', 'folk', 'country'],
      eraOrigin: '1950s-1960s',
      keyElements: ['guitar', 'drums', 'bass', 'vocals', 'power', 'rebellion']
    });

    // Electronic characteristics  
    this.genreProfiles.set('electronic', {
      energy: 0.7,
      complexity: 0.8,
      traditionalism: 0.2,
      instrumentation: 'electronic',
      rhythm: 'complex',
      improvisation: 0.6,
      commerciality: 0.6,
      emotionalRange: ['bright', 'dark', 'neutral'],
      culturalRoots: ['experimental', 'dance', 'ambient'],
      eraOrigin: '1970s-1980s',
      keyElements: ['synthesizer', 'sampling', 'beats', 'digital', 'futuristic', 'technology']
    });

    // Jazz characteristics
    this.genreProfiles.set('jazz', {
      energy: 0.6,
      complexity: 0.9,
      traditionalism: 0.8,
      instrumentation: 'acoustic',
      rhythm: 'syncopated',
      improvisation: 0.9,
      commerciality: 0.4,
      emotionalRange: ['neutral', 'dark', 'bright'],
      culturalRoots: ['blues', 'ragtime', 'swing'],
      eraOrigin: '1910s-1920s',
      keyElements: ['improvisation', 'harmony', 'swing', 'sophistication', 'artistic', 'complex']
    });

    // Hip-hop characteristics
    this.genreProfiles.set('hip-hop', {
      energy: 0.7,
      complexity: 0.7,
      traditionalism: 0.3,
      instrumentation: 'electronic',
      rhythm: 'steady',
      improvisation: 0.8,
      commerciality: 0.8,
      emotionalRange: ['dark', 'bright', 'varied'],
      culturalRoots: ['funk', 'soul', 'disco'],
      eraOrigin: '1970s',
      keyElements: ['rhythm', 'lyrics', 'culture', 'beats', 'sampling', 'expression']
    });

    // Folk characteristics
    this.genreProfiles.set('folk', {
      energy: 0.4,
      complexity: 0.3,
      traditionalism: 0.9,
      instrumentation: 'acoustic',
      rhythm: 'steady',
      improvisation: 0.5,
      commerciality: 0.3,
      emotionalRange: ['neutral', 'dark'],
      culturalRoots: ['traditional', 'storytelling', 'cultural'],
      eraOrigin: 'ancient',
      keyElements: ['storytelling', 'acoustic', 'tradition', 'simplicity', 'heritage', 'community']
    });

    // Classical characteristics
    this.genreProfiles.set('classical', {
      energy: 0.5,
      complexity: 1.0,
      traditionalism: 1.0,
      instrumentation: 'acoustic',
      rhythm: 'complex',
      improvisation: 0.2,
      commerciality: 0.2,
      emotionalRange: ['varied', 'neutral'],
      culturalRoots: ['european', 'formal', 'academic'],
      eraOrigin: 'medieval',
      keyElements: ['orchestration', 'composition', 'technique', 'sophistication', 'formal', 'artistic']
    });

    // Indie characteristics
    this.genreProfiles.set('indie', {
      energy: 0.6,
      complexity: 0.6,
      traditionalism: 0.4,
      instrumentation: 'mixed',
      rhythm: 'variable',
      improvisation: 0.6,
      commerciality: 0.4,
      emotionalRange: ['dark', 'bright', 'neutral'],
      culturalRoots: ['alternative', 'underground', 'diy'],
      eraOrigin: '1980s',
      keyElements: ['creativity', 'independence', 'artistic', 'alternative', 'experimental', 'authentic']
    });

    // Blues characteristics
    this.genreProfiles.set('blues', {
      energy: 0.5,
      complexity: 0.4,
      traditionalism: 0.9,
      instrumentation: 'acoustic',
      rhythm: 'steady',
      improvisation: 0.7,
      commerciality: 0.5,
      emotionalRange: ['dark', 'neutral'],
      culturalRoots: ['african-american', 'work songs', 'spirituals'],
      eraOrigin: '1860s',
      keyElements: ['emotion', 'storytelling', 'guitar', 'vocals', 'expression', 'soul']
    });

    // Country characteristics
    this.genreProfiles.set('country', {
      energy: 0.6,
      complexity: 0.4,
      traditionalism: 0.8,
      instrumentation: 'acoustic',
      rhythm: 'steady',
      improvisation: 0.5,
      commerciality: 0.7,
      emotionalRange: ['bright', 'neutral', 'dark'],
      culturalRoots: ['folk', 'western', 'rural'],
      eraOrigin: '1920s',
      keyElements: ['storytelling', 'rural', 'guitar', 'vocals', 'tradition', 'americana']
    });

    // Metal characteristics
    this.genreProfiles.set('metal', {
      energy: 0.9,
      complexity: 0.7,
      traditionalism: 0.6,
      instrumentation: 'electric',
      rhythm: 'complex',
      improvisation: 0.4,
      commerciality: 0.5,
      emotionalRange: ['dark', 'bright'],
      culturalRoots: ['rock', 'blues', 'classical'],
      eraOrigin: '1960s',
      keyElements: ['intensity', 'power', 'technical', 'heavy', 'guitar', 'aggression']
    });

    // Pop characteristics
    this.genreProfiles.set('pop', {
      energy: 0.7,
      complexity: 0.4,
      traditionalism: 0.3,
      instrumentation: 'mixed',
      rhythm: 'steady',
      improvisation: 0.2,
      commerciality: 1.0,
      emotionalRange: ['bright', 'neutral'],
      culturalRoots: ['various', 'mainstream', 'commercial'],
      eraOrigin: '1950s',
      keyElements: ['catchy', 'accessible', 'commercial', 'melody', 'mainstream', 'popular']
    });

    // Add other genres with similar detail...
  }

  /**
   * Calculate comprehensive compatibility matrix for all genre pairs
   */
  private calculateCompatibilityMatrix() {
    const genres = Array.from(this.genreProfiles.keys());
    
    for (let i = 0; i < genres.length; i++) {
      for (let j = i + 1; j < genres.length; j++) {
        const genre1 = genres[i];
        const genre2 = genres[j];
        const compatibility = this.calculatePairCompatibility(genre1, genre2);
        
        // Store in both directions for easy lookup
        this.compatibilityMatrix.set(`${genre1}-${genre2}`, compatibility);
        this.compatibilityMatrix.set(`${genre2}-${genre1}`, compatibility);
      }
    }

    secureLog.debug(`Calculated compatibility for ${this.compatibilityMatrix.size} genre pairs`);
  }

  /**
   * Calculate compatibility between two specific genres
   */
  private calculatePairCompatibility(genre1: GenreType, genre2: GenreType): CompatibilityScore {
    const profile1 = this.genreProfiles.get(genre1)!;
    const profile2 = this.genreProfiles.get(genre2)!;

    let score = 0.5; // Base score
    const synergies: string[] = [];
    const challenges: string[] = [];
    let fusionStyle: CompatibilityScore['fusionStyle'] = 'hybrid';
    let recommendedRatio: [number, number] = [0.5, 0.5];
    const bestAspects: string[] = [];

    // Energy compatibility - complementary energies work well
    const energyDiff = Math.abs(profile1.energy - profile2.energy);
    if (energyDiff < 0.3) {
      score += 0.2;
      synergies.push('Similar energy levels create natural flow');
    } else if (energyDiff > 0.6) {
      score += 0.1;
      synergies.push('Contrasting energy levels create dynamic tension');
      fusionStyle = 'contrast';
    } else {
      challenges.push('Moderate energy differences may create balance issues');
    }

    // Complexity compatibility
    const complexityDiff = Math.abs(profile1.complexity - profile2.complexity);
    if (complexityDiff < 0.4) {
      score += 0.15;
      synergies.push('Compatible complexity levels facilitate fusion');
    } else {
      score += 0.05;
      challenges.push('Different complexity levels require careful balancing');
      recommendedRatio = profile1.complexity > profile2.complexity ? [0.6, 0.4] : [0.4, 0.6];
    }

    // Instrumentation compatibility
    if (profile1.instrumentation === profile2.instrumentation) {
      score += 0.15;
      synergies.push('Shared instrumentation creates natural cohesion');
    } else if (
      (profile1.instrumentation === 'mixed' || profile2.instrumentation === 'mixed') ||
      (profile1.instrumentation === 'acoustic' && profile2.instrumentation === 'electric')
    ) {
      score += 0.1;
      synergies.push('Complementary instrumentation adds textural richness');
      fusionStyle = 'complement';
    } else {
      score += 0.05;
      challenges.push('Contrasting instrumentation requires creative integration');
    }

    // Rhythm compatibility
    const rhythmCompatibility = this.calculateRhythmCompatibility(profile1.rhythm, profile2.rhythm);
    score += rhythmCompatibility * 0.1;
    if (rhythmCompatibility > 0.7) {
      synergies.push('Rhythmic elements blend naturally');
    }

    // Improvisation compatibility
    const improvDiff = Math.abs(profile1.improvisation - profile2.improvisation);
    if (improvDiff < 0.3) {
      score += 0.1;
      bestAspects.push('Balanced improvisational elements');
    }

    // Cultural/historical compatibility
    const culturalSynergy = this.findCulturalSynergies(profile1.culturalRoots, profile2.culturalRoots);
    if (culturalSynergy.length > 0) {
      score += 0.1;
      synergies.push(`Shared cultural roots: ${culturalSynergy.join(', ')}`);
      fusionStyle = 'evolution';
    }

    // Emotional range compatibility
    const emotionalOverlap = profile1.emotionalRange.filter(emotion => 
      profile2.emotionalRange.includes(emotion)
    );
    if (emotionalOverlap.length > 0) {
      score += 0.05;
      synergies.push('Overlapping emotional territories');
    }

    // Special bonus combinations
    score = this.applySpecialBonuses(genre1, genre2, score, synergies, bestAspects);

    return {
      score: Math.min(Math.max(score, 0), 1), // Clamp between 0-1
      synergies,
      challenges,
      fusionStyle,
      recommendedRatio,
      bestAspects
    };
  }

  /**
   * Calculate rhythm compatibility between two rhythm types
   */
  private calculateRhythmCompatibility(rhythm1: string, rhythm2: string): number {
    const compatibilityMap: Record<string, Record<string, number>> = {
      'steady': { 'steady': 1.0, 'syncopated': 0.7, 'complex': 0.6, 'variable': 0.8 },
      'syncopated': { 'steady': 0.7, 'syncopated': 1.0, 'complex': 0.8, 'variable': 0.9 },
      'complex': { 'steady': 0.6, 'syncopated': 0.8, 'complex': 1.0, 'variable': 0.7 },
      'variable': { 'steady': 0.8, 'syncopated': 0.9, 'complex': 0.7, 'variable': 1.0 }
    };
    
    return compatibilityMap[rhythm1]?.[rhythm2] || 0.5;
  }

  /**
   * Find shared cultural roots between genres
   */
  private findCulturalSynergies(roots1: string[], roots2: string[]): string[] {
    return roots1.filter(root => roots2.includes(root));
  }

  /**
   * Apply special bonuses for particularly interesting combinations
   */
  private applySpecialBonuses(
    genre1: GenreType, 
    genre2: GenreType, 
    score: number, 
    synergies: string[], 
    bestAspects: string[]
  ): number {
    // Electronic + Jazz = innovative bonus
    if ((genre1 === 'electronic' && genre2 === 'jazz') || (genre1 === 'jazz' && genre2 === 'electronic')) {
      score += 0.15;
      synergies.push('Electronic-jazz fusion creates sophisticated innovation');
      bestAspects.push('Improvisation meets technology', 'Complex harmonies with electronic textures');
    }

    // Folk + Electronic = interesting contrast
    if ((genre1 === 'folk' && genre2 === 'electronic') || (genre1 === 'electronic' && genre2 === 'folk')) {
      score += 0.12;
      synergies.push('Traditional meets futuristic - compelling dichotomy');
      bestAspects.push('Organic storytelling with digital soundscapes');
    }

    // Hip-hop + Jazz = proven combination
    if ((genre1 === 'hip-hop' && genre2 === 'jazz') || (genre1 === 'jazz' && genre2 === 'hip-hop')) {
      score += 0.1;
      synergies.push('Hip-hop jazz fusion has strong historical precedent');
      bestAspects.push('Improvisational flow', 'Complex rhythmic interplay');
    }

    // Rock + Classical = powerful dynamics
    if ((genre1 === 'rock' && genre2 === 'classical') || (genre1 === 'classical' && genre2 === 'rock')) {
      score += 0.1;
      synergies.push('Rock power meets classical sophistication');
      bestAspects.push('Dynamic range', 'Compositional complexity with raw energy');
    }

    return score;
  }

  /**
   * Define specific fusion rules for genre combinations
   */
  private defineFusionRules() {
    // Electronic + Jazz fusion rule
    this.fusionRules.push({
      name: 'ElectroJazz Fusion',
      description: 'Sophisticated electronic textures with jazz improvisation and harmony',
      genreCombination: ['electronic', 'jazz'],
      compatibility: this.getCompatibility('electronic', 'jazz')!,
      vocabularyStrategy: 'synthesize',
      patternStrategy: 'interweave',
      examples: ['Digital Saxophone', 'Quantum Bebop', 'Synthesized Improvisation']
    });

    // Folk + Electronic fusion rule
    this.fusionRules.push({
      name: 'TechnoFolk Fusion',
      description: 'Traditional storytelling enhanced with modern electronic elements',
      genreCombination: ['folk', 'electronic'],
      compatibility: this.getCompatibility('folk', 'electronic')!,
      vocabularyStrategy: 'alternate',
      patternStrategy: 'layer',
      examples: ['Digital Folklore', 'Electronic Ballad', 'Cyber Folk Tales']
    });

    // Rock + Classical fusion rule
    this.fusionRules.push({
      name: 'Symphonic Rock Fusion',
      description: 'Rock energy with classical composition and orchestration',
      genreCombination: ['rock', 'classical'],
      compatibility: this.getCompatibility('rock', 'classical')!,
      vocabularyStrategy: 'merge',
      patternStrategy: 'blend',
      examples: ['Electric Symphony', 'Orchestral Thunder', 'Classical Storm']
    });

    // Hip-hop + Jazz fusion rule
    this.fusionRules.push({
      name: 'Jazz Hop Fusion',
      description: 'Hip-hop rhythm and culture with jazz improvisation and complexity',
      genreCombination: ['hip-hop', 'jazz'],
      compatibility: this.getCompatibility('hip-hop', 'jazz')!,
      vocabularyStrategy: 'merge',
      patternStrategy: 'interweave',
      examples: ['Jazz Flow Collective', 'Bebop Beats', 'Improvisational Cipher']
    });

    secureLog.debug(`Defined ${this.fusionRules.length} fusion rules for specific genre combinations`);
  }

  /**
   * Get compatibility score between two genres
   */
  getCompatibility(genre1: GenreType, genre2: GenreType): CompatibilityScore | null {
    const key1 = `${genre1}-${genre2}`;
    const key2 = `${genre2}-${genre1}`;
    
    return this.compatibilityMatrix.get(key1) || this.compatibilityMatrix.get(key2) || null;
  }

  /**
   * Get genre characteristics
   */
  getGenreCharacteristics(genre: GenreType): GenreCharacteristics | null {
    return this.genreProfiles.get(genre) || null;
  }

  /**
   * Find the most compatible genres for a given genre
   */
  getMostCompatibleGenres(genre: GenreType, limit = 5): Array<{genre: GenreType, score: number}> {
    const compatibleGenres: Array<{genre: GenreType, score: number}> = [];
    
    for (const [genreType] of this.genreProfiles) {
      if (genreType !== genre) {
        const compatibility = this.getCompatibility(genre, genreType);
        if (compatibility) {
          compatibleGenres.push({
            genre: genreType,
            score: compatibility.score
          });
        }
      }
    }
    
    return compatibleGenres
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Get fusion rule for specific genre combination
   */
  getFusionRule(genre1: GenreType, genre2: GenreType): FusionRule | null {
    return this.fusionRules.find(rule => 
      (rule.genreCombination[0] === genre1 && rule.genreCombination[1] === genre2) ||
      (rule.genreCombination[0] === genre2 && rule.genreCombination[1] === genre1)
    ) || null;
  }

  /**
   * Get all available fusion rules
   */
  getAllFusionRules(): FusionRule[] {
    return [...this.fusionRules];
  }

  /**
   * Get fusion recommendations for multiple genres
   */
  getMultiGenreFusionRecommendations(
    genres: GenreType[], 
    preferredStyle?: 'complement' | 'contrast' | 'hybrid' | 'evolution'
  ): Array<{
    combination: GenreType[],
    averageCompatibility: number,
    fusionStyle: string,
    description: string
  }> {
    const recommendations: Array<{
      combination: GenreType[],
      averageCompatibility: number,
      fusionStyle: string,
      description: string
    }> = [];

    // Generate all possible pairs from the input genres
    for (let i = 0; i < genres.length; i++) {
      for (let j = i + 1; j < genres.length; j++) {
        const genre1 = genres[i];
        const genre2 = genres[j];
        const compatibility = this.getCompatibility(genre1, genre2);
        
        if (compatibility && (!preferredStyle || compatibility.fusionStyle === preferredStyle)) {
          recommendations.push({
            combination: [genre1, genre2],
            averageCompatibility: compatibility.score,
            fusionStyle: compatibility.fusionStyle,
            description: compatibility.synergies.join('; ')
          });
        }
      }
    }

    return recommendations.sort((a, b) => b.averageCompatibility - a.averageCompatibility);
  }

  /**
   * Validate if a genre combination is fusion-worthy
   */
  isFusionWorthy(genre1: GenreType, genre2: GenreType, threshold = 0.6): boolean {
    const compatibility = this.getCompatibility(genre1, genre2);
    return compatibility ? compatibility.score >= threshold : false;
  }
}

// Export singleton instance
export const genreCompatibilityMatrix = new GenreCompatibilityMatrix();