/**
 * NameUniquenessScorer - Comprehensive uniqueness analysis for band/song names
 * Extracted from nameVerifier.ts to provide dedicated uniqueness scoring
 */

import { FamousNamesRepository } from '../famousNamesRepository';
import { secureLog } from '../../utils/secureLogger';
import type { UniquenessScore } from '../../types/verification';

export interface UniquenessConfig {
  weights: {
    commonWordPenalty: number;
    lengthBonus: number;
    complexityBonus: number;
    unusualTermBonus: number;
    genreRelevanceBonus: number;
  };
  thresholds: {
    commonWordLength: number;
    unusualWordLength: number;
    complexCombinationWords: number;
    longNameBonus: number;
  };
}

export class NameUniquenessScorer {
  private static instance: NameUniquenessScorer;
  private famousNamesRepo: FamousNamesRepository;
  private config: UniquenessConfig;

  // Common words that reduce uniqueness (expanded from original)
  private readonly commonWords = new Set([
    'the', 'and', 'of', 'to', 'a', 'in', 'for', 'is', 'on', 'that', 'by', 'this', 'with', 'i', 'you', 'it', 
    'not', 'or', 'be', 'are', 'from', 'at', 'as', 'your', 'all', 'any', 'can', 'had', 'her', 'was', 'one', 
    'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 
    'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use', 'but', 'up', 'time', 'if', 'no', 
    'will', 'so', 'what', 'there', 'we', 'may', 'say', 'each', 'which', 'do', 'their', 'they', 'go', 'come',
    // Music-specific common words
    'music', 'song', 'band', 'rock', 'love', 'life', 'world', 'night', 'heart', 'soul', 'fire', 'light',
    'dream', 'sky', 'star', 'moon', 'sun', 'sound', 'beat', 'rhythm'
  ]);

  // Unusual terms that increase uniqueness (expanded from original)
  private readonly unusualTerms = new Set([
    'amplitude', 'temporal', 'theremin', 'bagpipes', 'catastrophe', 'fumbling', 'navigating', 'juggling', 
    'robots', 'ninjas', 'kazoo', 'elephants', 'disappearing', 'spinning', 'ukulele', 'clumsy', 'sneaky', 
    'twisted', 'indigo', 'eternal', 'recorder', 'accordion', 'kaleidoscope', 'velociraptor', 'quantum', 
    'nebula', 'crystalline', 'algorithmic', 'synthetic', 'polymorphic', 'fractal', 'holographic', 'kinetic',
    'metamorphosis', 'labyrinth', 'constellation', 'titanium', 'chromatic', 'ethereal', 'luminescent',
    'magnetic', 'electric', 'atomic', 'cosmic', 'galactic', 'dimensional', 'parallax', 'serendipity'
  ]);

  // Technical and genre-specific terms that add uniqueness
  private readonly technicalTerms = new Set([
    'synthesizer', 'oscillator', 'frequency', 'harmonic', 'resonance', 'modulation', 'distortion', 'reverb',
    'delay', 'chorus', 'phaser', 'flanger', 'compressor', 'equalizer', 'amplifier', 'vocoder', 'sampler',
    'sequencer', 'arpeggiator', 'envelope', 'filter', 'midi', 'analog', 'digital', 'stereo', 'mono',
    'overdrive', 'sustain', 'attack', 'decay', 'release', 'waveform', 'timbre', 'pitch', 'octave'
  ]);

  private constructor() {
    this.famousNamesRepo = FamousNamesRepository.getInstance();
    this.config = {
      weights: {
        commonWordPenalty: 0.2,
        lengthBonus: 0.1,
        complexityBonus: 0.3,
        unusualTermBonus: 0.4,
        genreRelevanceBonus: 0.15
      },
      thresholds: {
        commonWordLength: 4,
        unusualWordLength: 6,
        complexCombinationWords: 3,
        longNameBonus: 15
      }
    };
  }

  static getInstance(): NameUniquenessScorer {
    if (!NameUniquenessScorer.instance) {
      NameUniquenessScorer.instance = new NameUniquenessScorer();
    }
    return NameUniquenessScorer.instance;
  }

  /**
   * Calculate comprehensive uniqueness score for a name
   */
  calculateUniquenessScore(name: string, genre?: string): UniquenessScore {
    try {
      const words = name.toLowerCase().split(/\s+/).filter(word => word.length > 0);
      
      // Initialize factors
      const factors = {
        commonWordPenalty: 0,
        lengthBonus: 0,
        complexityBonus: 0,
        unusualTermBonus: 0,
        genreRelevanceBonus: 0
      };

      // Word analysis
      const commonWords: string[] = [];
      const unusualWords: string[] = [];
      const technicalTerms: string[] = [];
      const genreTerms: string[] = [];

      let uniquenessScore = 1.0;

      // 1. Common word penalty
      words.forEach(word => {
        if (this.commonWords.has(word)) {
          commonWords.push(word);
          factors.commonWordPenalty += this.config.weights.commonWordPenalty;
        }
      });

      uniquenessScore -= factors.commonWordPenalty;

      // 2. Length bonus for appropriately sized names
      const totalLength = name.length;
      if (totalLength >= this.config.thresholds.longNameBonus) {
        factors.lengthBonus = this.config.weights.lengthBonus;
        uniquenessScore += factors.lengthBonus;
      }

      // 3. Complexity bonus for unusual word combinations
      if (words.length >= this.config.thresholds.complexCombinationWords) {
        const uncommonWords = words.filter(word => 
          !this.commonWords.has(word) && word.length > this.config.thresholds.unusualWordLength
        );
        if (uncommonWords.length >= 2) {
          factors.complexityBonus = this.config.weights.complexityBonus;
          uniquenessScore += factors.complexityBonus;
          unusualWords.push(...uncommonWords);
        }
      }

      // 4. Unusual terms bonus
      words.forEach(word => {
        // Check for unusual terms (exact matches or contains)
        const hasUnusualTerm = Array.from(this.unusualTerms).some(term => 
          word.includes(term) || term.includes(word)
        );
        
        if (hasUnusualTerm) {
          factors.unusualTermBonus += this.config.weights.unusualTermBonus / words.length;
          if (!unusualWords.includes(word)) {
            unusualWords.push(word);
          }
        }

        // Check for technical terms
        if (this.technicalTerms.has(word) || 
            Array.from(this.technicalTerms).some(term => word.includes(term))) {
          technicalTerms.push(word);
          factors.unusualTermBonus += this.config.weights.unusualTermBonus / words.length;
        }
      });

      uniquenessScore += factors.unusualTermBonus;

      // 5. Genre relevance bonus
      if (genre) {
        const themeWords = this.famousNamesRepo.getThematicWords(genre);
        words.forEach(word => {
          if (themeWords.includes(word)) {
            genreTerms.push(word);
            factors.genreRelevanceBonus += this.config.weights.genreRelevanceBonus / words.length;
          }
        });
        uniquenessScore += factors.genreRelevanceBonus;
      }

      // Ensure score is within bounds
      uniquenessScore = Math.max(0, Math.min(1, uniquenessScore));

      // Determine recommendation based on final score
      let recommendation: UniquenessScore['recommendation'];
      if (uniquenessScore >= 0.8) {
        recommendation = 'very-unique';
      } else if (uniquenessScore >= 0.6) {
        recommendation = 'unique';
      } else if (uniquenessScore >= 0.4) {
        recommendation = 'somewhat-unique';
      } else if (uniquenessScore >= 0.2) {
        recommendation = 'common';
      } else {
        recommendation = 'very-common';
      }

      const result: UniquenessScore = {
        score: uniquenessScore,
        factors,
        wordAnalysis: {
          totalWords: words.length,
          commonWords,
          unusualWords,
          technicalTerms,
          genreTerms
        },
        recommendation
      };

      return result;

    } catch (error) {
      secureLog.error('Uniqueness scoring error:', error);
      return {
        score: 0.5, // Default to medium uniqueness on error
        factors: {
          commonWordPenalty: 0,
          lengthBonus: 0,
          complexityBonus: 0,
          unusualTermBonus: 0,
          genreRelevanceBonus: 0
        },
        wordAnalysis: {
          totalWords: 0,
          commonWords: [],
          unusualWords: [],
          technicalTerms: [],
          genreTerms: []
        },
        recommendation: 'somewhat-unique'
      };
    }
  }

  /**
   * Legacy method for backward compatibility
   * Matches the original calculateUniquenessScore from nameVerifier.ts
   */
  calculateLegacyUniquenessScore(name: string): number {
    const result = this.calculateUniquenessScore(name);
    return result.score;
  }

  /**
   * Batch uniqueness analysis
   */
  analyzeBatch(names: string[], genre?: string): Array<{name: string, uniqueness: UniquenessScore}> {
    return names.map(name => ({
      name,
      uniqueness: this.calculateUniquenessScore(name, genre)
    }));
  }

  /**
   * Get configuration for testing/tuning
   */
  getConfig(): UniquenessConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<UniquenessConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Add custom unusual terms for specific use cases
   */
  addUnusualTerms(terms: string[]): void {
    terms.forEach(term => this.unusualTerms.add(term.toLowerCase()));
  }

  /**
   * Add custom technical terms
   */
  addTechnicalTerms(terms: string[]): void {
    terms.forEach(term => this.technicalTerms.add(term.toLowerCase()));
  }

  /**
   * Get statistics about the scoring dictionaries
   */
  getStats(): {
    commonWords: number;
    unusualTerms: number;
    technicalTerms: number;
  } {
    return {
      commonWords: this.commonWords.size,
      unusualTerms: this.unusualTerms.size,
      technicalTerms: this.technicalTerms.size
    };
  }
}