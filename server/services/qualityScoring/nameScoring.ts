/**
 * Name-specific quality scoring algorithms
 * Evaluates band and song names across multiple quality dimensions
 */

import type { 
  NameScoringRequest, 
  NameQualityResult,
  ScoreBreakdown,
  QualityScore,
  ScoreMetadata
} from './interfaces';
import { TextAnalyzer, CreativityAnalyzer, ScoringUtils, PerformanceTracker } from './utils';
import { DEFAULT_NAME_WEIGHTS, GENRE_ADJUSTMENTS, COMMON_WORDS } from './config';
import { secureLog } from '../../utils/secureLogger';

export class NameScoringEngine {
  private algorithmVersion = '1.0.0';

  /**
   * Score a single name for quality
   */
  async scoreName(request: NameScoringRequest): Promise<NameQualityResult> {
    const endTiming = PerformanceTracker.startTiming('name_scoring');
    
    try {
      const breakdown = this.calculateScoreBreakdown(request);
      const weights = this.getAdjustedWeights(request.genre, request.type);
      const overallScore = ScoringUtils.calculateOverallScore(breakdown, weights);
      
      // Apply genre-specific bonuses
      const finalScore = request.genre 
        ? this.applyGenreBonus(overallScore, request.name, request.genre, request.type)
        : overallScore;

      const score: QualityScore = {
        overall: ScoringUtils.normalizeScore(finalScore),
        breakdown,
        metadata: {
          scoringTime: endTiming(),
          algorithm: 'name_scoring_v1',
          version: this.algorithmVersion,
          warnings: this.generateWarnings(request, breakdown),
          confidence: this.calculateConfidence(request, breakdown)
        }
      };

      const recommendations = ScoringUtils.generateRecommendations(breakdown, 'name');

      return {
        name: request.name,
        score,
        passesThreshold: false, // Will be set by the main service based on threshold
        recommendations: recommendations.length > 0 ? recommendations : undefined
      };

    } catch (error) {
      secureLog.error('Name scoring error:', error);
      endTiming();
      throw error;
    }
  }

  /**
   * Calculate detailed score breakdown for a name
   */
  private calculateScoreBreakdown(request: NameScoringRequest): ScoreBreakdown {
    const { name, type, genre, mood, isAiGenerated, wordCount } = request;
    
    return {
      creativity: this.scoreCreativity(name, genre),
      appropriateness: this.scoreAppropriatenesss(name, type, genre, mood),
      quality: this.scoreQuality(name),
      memorability: this.scoreMemorability(name, type),
      uniqueness: this.scoreUniqueness(name, isAiGenerated),
      structure: this.scoreStructure(name, type, wordCount)
    };
  }

  /**
   * Score creativity and originality
   */
  private scoreCreativity(name: string, genre?: string): number {
    // Use the CreativityAnalyzer from utils
    let score = CreativityAnalyzer.getCreativityScore(name, genre);
    
    // Additional name-specific creativity checks
    const metrics = TextAnalyzer.getTextMetrics(name);
    
    // Bonus for creative word combinations
    if (metrics.wordCount >= 2) {
      if (this.hasCreativeWordCombination(name)) {
        score += 0.1;
      }
    }
    
    // Bonus for inventive constructions (like compound words)
    if (this.hasInventiveConstruction(name)) {
      score += 0.1;
    }
    
    // Penalty for generic patterns
    if (this.hasGenericPattern(name)) {
      score -= 0.2;
    }

    return ScoringUtils.normalizeScore(score);
  }

  /**
   * Score genre and context appropriateness
   */
  private scoreAppropriatenesss(name: string, type: 'band' | 'song', genre?: string, mood?: string): number {
    let score = 0.6; // Base appropriateness
    
    // Genre appropriateness
    if (genre) {
      score += this.calculateGenreAppropriatenesss(name, genre);
    }
    
    // Mood appropriateness
    if (mood) {
      score += this.calculateMoodAppropriatenesss(name, mood);
    }
    
    // Type-specific appropriateness (band vs song names)
    score += this.calculateTypeAppropriatenesss(name, type);
    
    return ScoringUtils.normalizeScore(score);
  }

  /**
   * Score technical quality (pronunciation, readability)
   */
  private scoreQuality(name: string): number {
    let score = 0.5; // Base quality
    
    // Pronunciation ease
    const pronunciationScore = TextAnalyzer.getPronunciationDifficulty(name);
    score += pronunciationScore * 0.4;
    
    // Character composition quality
    const metrics = TextAnalyzer.getTextMetrics(name);
    
    // Penalize overly long names
    if (metrics.characterCount > 25) {
      score -= 0.2;
    } else if (metrics.characterCount > 15) {
      score -= 0.1;
    }
    
    // Bonus for good character balance
    if (metrics.averageWordLength >= 4 && metrics.averageWordLength <= 7) {
      score += 0.1;
    }
    
    // Penalize excessive special characters or numbers
    const specialChars = name.match(/[^a-zA-Z\s]/g);
    if (specialChars && specialChars.length > 2) {
      score -= 0.3;
    }
    
    // Bonus for appropriate capitalization
    if (this.hasGoodCapitalization(name)) {
      score += 0.1;
    }

    return ScoringUtils.normalizeScore(score);
  }

  /**
   * Score memorability and impact
   */
  private scoreMemorability(name: string, type: 'band' | 'song'): number {
    let score = 0.4; // Base memorability
    
    // Alliteration bonus
    if (TextAnalyzer.hasAlliteration(name)) {
      score += 0.2;
    }
    
    // Rhythm and flow
    const syllableCount = TextAnalyzer.countSyllables(name);
    const wordCount = TextAnalyzer.getTextMetrics(name).wordCount;
    
    // Good syllable distribution
    if (wordCount > 1) {
      const avgSyllablesPerWord = syllableCount / wordCount;
      if (avgSyllablesPerWord >= 1.5 && avgSyllablesPerWord <= 3) {
        score += 0.15;
      }
    }
    
    // Optimal length for memorability
    const nameLength = name.length;
    if (type === 'band') {
      if (nameLength >= 5 && nameLength <= 15) score += 0.1;
    } else { // song
      if (nameLength >= 3 && nameLength <= 20) score += 0.1;
    }
    
    // Strong consonants for impact
    if (this.hasImpactfulSounds(name)) {
      score += 0.1;
    }
    
    // Distinctive patterns
    if (this.hasDistinctivePattern(name)) {
      score += 0.15;
    }

    return ScoringUtils.normalizeScore(score);
  }

  /**
   * Score uniqueness and originality
   */
  private scoreUniqueness(name: string, isAiGenerated: boolean): number {
    let score = 0.6; // Base uniqueness
    
    // Check against common overused words
    const nameLower = name.toLowerCase();
    let overusedCount = 0;
    
    for (const word of COMMON_WORDS.overused) {
      if (nameLower.includes(word)) {
        overusedCount++;
      }
    }
    
    score -= overusedCount * 0.1;
    
    // Check against common clichés
    for (const cliche of COMMON_WORDS.cliches) {
      if (nameLower.includes(cliche)) {
        score -= 0.2;
      }
    }
    
    // AI-generated content might be less unique
    if (isAiGenerated) {
      score *= 0.95; // Small penalty for AI generation
    }
    
    // Bonus for unusual word constructions
    if (this.hasUnusualConstruction(name)) {
      score += 0.2;
    }
    
    // Penalty for overly common patterns
    if (this.hasCommonPattern(name)) {
      score -= 0.15;
    }

    return ScoringUtils.normalizeScore(score);
  }

  /**
   * Score structural appropriateness
   */
  private scoreStructure(name: string, type: 'band' | 'song', requestedWordCount?: number): number {
    const metrics = TextAnalyzer.getTextMetrics(name);
    let score = 0.6; // Base structure score
    
    // Word count appropriateness
    const idealWordCount = type === 'band' ? 2 : 3; // Bands often 1-2 words, songs 2-4
    const wordCountDiff = Math.abs(metrics.wordCount - idealWordCount);
    
    if (wordCountDiff === 0) {
      score += 0.2;
    } else if (wordCountDiff === 1) {
      score += 0.1;
    } else if (wordCountDiff >= 3) {
      score -= 0.2;
    }
    
    // Check against requested word count
    if (requestedWordCount && typeof requestedWordCount === 'number') {
      if (metrics.wordCount === requestedWordCount) {
        score += 0.15;
      } else {
        score -= Math.abs(metrics.wordCount - requestedWordCount) * 0.05;
      }
    }
    
    // Length appropriateness
    const totalLength = name.length;
    if (type === 'band') {
      if (totalLength >= 4 && totalLength <= 20) score += 0.1;
      else if (totalLength > 30) score -= 0.2;
    } else { // song
      if (totalLength >= 3 && totalLength <= 25) score += 0.1;
      else if (totalLength > 40) score -= 0.2;
    }

    return ScoringUtils.normalizeScore(score);
  }

  // Helper methods for specific checks

  private hasCreativeWordCombination(name: string): boolean {
    const words = name.toLowerCase().split(/\s+/);
    if (words.length < 2) return false;
    
    // Check for unexpected combinations
    const patterns = [
      ['electric', 'acoustic', 'digital', 'analog'],
      ['fire', 'ice', 'storm', 'calm'],
      ['shadow', 'light', 'dark', 'bright'],
      ['steel', 'silk', 'glass', 'stone']
    ];
    
    for (const pattern of patterns) {
      if (words.some(word => pattern.includes(word))) {
        return true;
      }
    }
    
    return false;
  }

  private hasInventiveConstruction(name: string): boolean {
    // Check for compound words, portmanteaus, etc.
    const singleWord = name.replace(/\s/g, '');
    
    // Simple heuristic: long single words might be compounds
    if (singleWord.length > 8 && !name.includes(' ')) {
      return true;
    }
    
    // Check for creative punctuation or formatting
    if (/[&+\-_]/.test(name)) {
      return true;
    }
    
    return false;
  }

  private hasGenericPattern(name: string): boolean {
    const genericPatterns = [
      /^the\s/i,
      /\sband$/i,
      /\sgroup$/i,
      /\ssong$/i,
      /^rock\s/i,
      /\srock$/i
    ];
    
    return genericPatterns.some(pattern => pattern.test(name));
  }

  private calculateGenreAppropriatenesss(name: string, genre: string): number {
    const genreKeywords = {
      rock: ['rock', 'stone', 'fire', 'thunder', 'steel', 'wild', 'rebel'],
      metal: ['metal', 'steel', 'iron', 'death', 'black', 'doom', 'forge'],
      jazz: ['blue', 'smooth', 'cool', 'swing', 'velvet', 'midnight'],
      electronic: ['digital', 'pulse', 'wave', 'synth', 'circuit', 'neon'],
      folk: ['folk', 'mountain', 'river', 'home', 'story', 'heart'],
      classical: ['symphony', 'sonata', 'opus', 'chamber', 'ensemble']
    };
    
    const keywords = genreKeywords[genre as keyof typeof genreKeywords] || [];
    const nameLower = name.toLowerCase();
    const matches = keywords.filter(keyword => nameLower.includes(keyword)).length;
    
    return Math.min(0.3, matches * 0.1);
  }

  private calculateMoodAppropriatenesss(name: string, mood: string): number {
    const moodKeywords = {
      dark: ['dark', 'shadow', 'black', 'night', 'doom', 'void'],
      bright: ['bright', 'light', 'sun', 'shine', 'golden', 'star'],
      mysterious: ['mystery', 'shadow', 'secret', 'hidden', 'enigma'],
      energetic: ['energy', 'fire', 'lightning', 'electric', 'power'],
      melancholy: ['blue', 'rain', 'tears', 'lonely', 'grey'],
      ethereal: ['dream', 'cloud', 'mist', 'ethereal', 'floating']
    };
    
    const keywords = moodKeywords[mood as keyof typeof moodKeywords] || [];
    const nameLower = name.toLowerCase();
    const matches = keywords.filter(keyword => nameLower.includes(keyword)).length;
    
    return Math.min(0.2, matches * 0.08);
  }

  private calculateTypeAppropriatenesss(name: string, type: 'band' | 'song'): number {
    const metrics = TextAnalyzer.getTextMetrics(name);
    
    if (type === 'band') {
      // Band names often shorter, more abstract
      if (metrics.wordCount <= 3 && !this.hasArticles(name)) {
        return 0.1;
      }
    } else { // song
      // Song names can be longer, more descriptive
      if (metrics.wordCount <= 5) {
        return 0.1;
      }
    }
    
    return 0;
  }

  private hasGoodCapitalization(name: string): boolean {
    // Check for title case or reasonable capitalization
    const words = name.split(/\s+/);
    const properlyCapitalized = words.every(word => {
      if (word.length === 0) return true;
      
      // Common articles that should be lowercase in titles
      const articles = ['a', 'an', 'the', 'and', 'or', 'but', 'of', 'in', 'on', 'at'];
      if (articles.includes(word.toLowerCase()) && words.indexOf(word) !== 0) {
        return word === word.toLowerCase();
      }
      
      // Other words should be capitalized
      return word.charAt(0) === word.charAt(0).toUpperCase();
    });
    
    return properlyCapitalized;
  }

  private hasImpactfulSounds(name: string): boolean {
    // Check for strong consonants that create impact
    const strongConsonants = /[bckgdtpqx]/gi;
    const matches = name.match(strongConsonants);
    return matches ? matches.length >= 3 : false;
  }

  private hasDistinctivePattern(name: string): boolean {
    // Check for patterns that make names distinctive
    return (
      TextAnalyzer.hasAlliteration(name) ||
      this.hasRhythm(name) ||
      this.hasSymmetry(name)
    );
  }

  private hasRhythm(name: string): boolean {
    const words = name.split(/\s+/);
    if (words.length < 2) return false;
    
    const syllableCounts = words.map(word => TextAnalyzer.countSyllables(word));
    
    // Check for consistent syllable patterns
    const firstCount = syllableCounts[0];
    return syllableCounts.every(count => Math.abs(count - firstCount) <= 1);
  }

  private hasSymmetry(name: string): boolean {
    const words = name.split(/\s+/);
    if (words.length !== 2) return false;
    
    // Check for length symmetry
    return Math.abs(words[0].length - words[1].length) <= 2;
  }

  private hasUnusualConstruction(name: string): boolean {
    // Check for creative constructions
    return (
      this.hasInventiveConstruction(name) ||
      this.hasUnexpectedCombination(name) ||
      this.hasCreativeFormatting(name)
    );
  }

  private hasUnexpectedCombination(name: string): boolean {
    const words = name.toLowerCase().split(/\s+/);
    
    // Simple check for unexpected adjective-noun combinations
    const softWords = ['gentle', 'soft', 'quiet', 'calm', 'peaceful'];
    const hardWords = ['thunder', 'steel', 'fire', 'storm', 'rage'];
    
    for (const soft of softWords) {
      for (const hard of hardWords) {
        if (words.includes(soft) && words.includes(hard)) {
          return true;
        }
      }
    }
    
    return false;
  }

  private hasCreativeFormatting(name: string): boolean {
    // Check for creative use of punctuation, symbols
    return /[&+\-_(){}[\]]/.test(name) && !/\s{2,}/.test(name);
  }

  private hasCommonPattern(name: string): boolean {
    const commonPatterns = [
      /^the\s.*s$/i,      // "The [Something]s"
      /.*\sband$/i,       // "[Something] Band"
      /^.*\srock$/i,      // "[Something] Rock"
      /^rock\s.*$/i,      // "Rock [Something]"
      /^.*\smusic$/i      // "[Something] Music"
    ];
    
    return commonPatterns.some(pattern => pattern.test(name));
  }

  private hasArticles(name: string): boolean {
    const articles = ['the', 'a', 'an'];
    const firstWord = name.toLowerCase().split(/\s+/)[0];
    return articles.includes(firstWord);
  }

  private getAdjustedWeights(genre?: string, type?: 'band' | 'song') {
    let weights = { ...DEFAULT_NAME_WEIGHTS };
    
    // Apply genre-specific weight adjustments
    if (genre && GENRE_ADJUSTMENTS[genre]) {
      const genreWeights = GENRE_ADJUSTMENTS[genre].weights;
      weights = { ...weights, ...genreWeights };
    }
    
    // Type-specific adjustments
    if (type === 'song') {
      // Song names might prioritize creativity slightly more
      weights.creativity += 0.05;
      weights.memorability += 0.05;
      weights.appropriateness -= 0.05;
      weights.structure -= 0.05;
    }
    
    return weights;
  }

  private applyGenreBonus(baseScore: number, name: string, genre: string, type: 'band' | 'song'): number {
    if (!GENRE_ADJUSTMENTS[genre]) return baseScore;
    
    const bonusConfig = GENRE_ADJUSTMENTS[genre].bonuses;
    return ScoringUtils.applyGenreBonus(baseScore, name, genre, bonusConfig);
  }

  private generateWarnings(request: NameScoringRequest, breakdown: ScoreBreakdown): string[] {
    const warnings: string[] = [];
    
    if (breakdown.quality < 0.4) {
      warnings.push('Low technical quality - consider pronunciation and readability');
    }
    
    if (breakdown.uniqueness < 0.3) {
      warnings.push('Contains common clichés or overused words');
    }
    
    if (breakdown.structure < 0.4) {
      warnings.push('Structure may not be optimal for the target type');
    }
    
    if (request.name.length > 30) {
      warnings.push('Name may be too long for practical use');
    }
    
    return warnings;
  }

  private calculateConfidence(request: NameScoringRequest, breakdown: ScoreBreakdown): number {
    let confidence = 0.8; // Base confidence
    
    // Lower confidence for very short or very long names
    if (request.name.length < 3 || request.name.length > 25) {
      confidence -= 0.1;
    }
    
    // Lower confidence when genre is unknown
    if (!request.genre) {
      confidence -= 0.1;
    }
    
    // Lower confidence for inconsistent scores
    const scores = Object.values(breakdown);
    const variance = this.calculateVariance(scores);
    if (variance > 0.1) {
      confidence -= 0.1;
    }
    
    return ScoringUtils.normalizeScore(confidence);
  }

  private calculateVariance(scores: number[]): number {
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const squaredDiffs = scores.map(score => Math.pow(score - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / scores.length;
  }
}