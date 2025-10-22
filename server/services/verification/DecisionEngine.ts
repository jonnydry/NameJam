/**
 * DecisionEngine - Determines verification decisions based on aggregated evidence
 * Uses ConfidenceCalculator and business rules to make final taken/similar/available decisions
 */

import { confidenceCalculator } from '../confidenceCalculator';
import { secureLog } from '../../utils/secureLogger';
import { SimilarityService } from './SimilarityService';
import { NameUniquenessScorer } from './NameUniquenessScorer';
import type { 
  IDecisionEngine,
  VerificationContext,
  AggregatedEvidence,
  SimilarityScores,
  UniquenessScore,
  Decision,
  DecisionReason,
  DecisionFactor
} from '../../types/verification';

export interface DecisionConfig {
  confidence: {
    veryHighThreshold: number; // 0.90+
    highThreshold: number; // 0.75+
    mediumThreshold: number; // 0.50+
    lowThreshold: number; // 0.25+
  };
  similarity: {
    exactMatchThreshold: number; // 0.95+
    similarMatchThreshold: number; // 0.75+
    partialMatchThreshold: number; // 0.50+
  };
  caching: {
    taken: number; // High confidence taken names cache longer
    similar: number; // Similar matches cache shorter
    available: number; // Available names cache moderate
    easterEgg: number; // Easter eggs don't cache (0)
    famousArtist: number; // Famous artists cache long
    error: number; // Error states cache briefly
    uncertain: number; // Uncertain results cache briefly
  };
  evidence: {
    highQualityPlatformCount: number; // Minimum platforms for high confidence
    reliabilityThreshold: number; // Minimum average reliability
    maxResultsForAvailable: number; // Max results before marked as uncertain
  };
}

export class DecisionEngine implements IDecisionEngine {
  private static instance: DecisionEngine;
  private config: DecisionConfig;
  private similarityService: SimilarityService;
  private uniquenessScorer: NameUniquenessScorer;

  private constructor() {
    this.similarityService = SimilarityService.getInstance();
    this.uniquenessScorer = NameUniquenessScorer.getInstance();
    
    this.config = {
      confidence: {
        veryHighThreshold: 0.90,
        highThreshold: 0.75,
        mediumThreshold: 0.50,
        lowThreshold: 0.25
      },
      similarity: {
        exactMatchThreshold: 0.95,
        similarMatchThreshold: 0.75,
        partialMatchThreshold: 0.50
      },
      caching: {
        taken: 7200, // 2 hours for high confidence taken
        similar: 1800, // 30 minutes for similar matches
        available: 3600, // 1 hour for available names
        easterEgg: 0, // Don't cache easter eggs
        famousArtist: 7200, // 2 hours for famous artists
        error: 300, // 5 minutes for errors
        uncertain: 600 // 10 minutes for uncertain results
      },
      evidence: {
        highQualityPlatformCount: 2,
        reliabilityThreshold: 0.7,
        maxResultsForAvailable: 10
      }
    };
  }

  static getInstance(): DecisionEngine {
    if (!DecisionEngine.instance) {
      DecisionEngine.instance = new DecisionEngine();
    }
    return DecisionEngine.instance;
  }

  /**
   * Make verification decision based on aggregated evidence
   */
  async decide(
    context: VerificationContext,
    evidence: AggregatedEvidence,
    similarityScores?: SimilarityScores,
    uniquenessScore?: UniquenessScore
  ): Promise<Decision> {
    try {
      // Check for exact matches first (highest priority)
      if (evidence.exactMatches.length > 0) {
        return this.createTakenDecision(
          context,
          evidence,
          'exact-match-found',
          this.getExactMatchFactors(evidence),
          uniquenessScore
        );
      }

      // Check for similar matches with type-specific logic
      const similarMatches = evidence.similarMatches.filter(match => 
        this.isSignificantMatch(match, context.type)
      );

      if (similarMatches.length > 0) {
        return this.createSimilarDecision(
          context,
          evidence,
          'similar-match-found',
          this.getSimilarMatchFactors(evidence, similarMatches),
          uniquenessScore
        );
      }

      // Check for famous artist matches (handled at higher level but might be in evidence)
      const famousMatches = evidence.allMatches.filter(match => match.source === 'famous');
      if (famousMatches.length > 0) {
        return this.createTakenDecision(
          context,
          evidence,
          'famous-artist-match',
          this.getFamousMatchFactors(famousMatches),
          uniquenessScore
        );
      }

      // Check evidence quality for availability determination
      const hasInsufficientEvidence = this.hasInsufficientEvidence(evidence);
      if (hasInsufficientEvidence) {
        return this.createUncertainDecision(
          context,
          evidence,
          'insufficient-evidence',
          this.getInsufficientEvidenceFactors(evidence),
          uniquenessScore
        );
      }

      // Check for platform errors
      if (evidence.sourcesFailed.length > evidence.sourcesSuccessful.length) {
        return this.createUncertainDecision(
          context,
          evidence,
          'platform-unavailable',
          this.getPlatformErrorFactors(evidence),
          uniquenessScore
        );
      }

      // Check for too many weak results (spam/noise)
      if (evidence.totalResults > this.config.evidence.maxResultsForAvailable) {
        const weakResults = evidence.allMatches.filter(match => 
          match.similarity < this.config.similarity.partialMatchThreshold
        );
        
        if (weakResults.length === evidence.allMatches.length) {
          // All results are weak matches - likely noise
          return this.createAvailableDecision(
            context,
            evidence,
            'no-matches-found',
            this.getNoMatchesFactors(evidence),
            uniquenessScore
          );
        }
      }

      // Default to available if no significant matches found
      return this.createAvailableDecision(
        context,
        evidence,
        'no-matches-found',
        this.getNoMatchesFactors(evidence),
        uniquenessScore
      );

    } catch (error) {
      secureLog.error('Decision engine error:', error);
      
      return this.createUncertainDecision(
        context,
        evidence,
        'verification-error',
        [this.createErrorFactor(error)],
        uniquenessScore
      );
    }
  }

  /**
   * Calculate confidence using the existing ConfidenceCalculator
   */
  calculateConfidence(evidence: AggregatedEvidence, context: VerificationContext): number {
    // Convert aggregated evidence to format expected by confidenceCalculator
    const spotifyResults = this.extractPlatformResults(evidence, 'spotify');
    const itunesResults = this.extractPlatformResults(evidence, 'itunes');
    const soundcloudResults = this.extractPlatformResults(evidence, 'soundcloud');
    const bandcampResults = this.extractPlatformResults(evidence, 'bandcamp');
    const famousMatches = evidence.allMatches
      .filter(match => match.source === 'famous')
      .map(match => match.name);

    // Use existing confidence calculator
    const confidenceResult = confidenceCalculator.calculateAvailabilityConfidence(
      context.name,
      spotifyResults,
      evidence.allMatches, // lastfm/musicbrainz results
      undefined, // musicbrainz results
      famousMatches,
      itunesResults,
      soundcloudResults,
      bandcampResults
    );

    return confidenceResult.confidence;
  }

  /**
   * Determine recommended action based on decision
   */
  determineRecommendedAction(decision: Decision): Decision['recommendedAction'] {
    if (decision.status === 'taken') {
      return decision.confidence >= 0.8 ? 'avoid' : 'consider-alternatives';
    } else if (decision.status === 'similar') {
      return decision.confidence >= 0.7 ? 'consider-alternatives' : 'proceed-with-caution';
    } else if (decision.status === 'available') {
      return decision.confidence >= 0.7 ? 'safe-to-use' : 'proceed-with-caution';
    } else {
      return 'proceed-with-caution';
    }
  }

  /**
   * Create a "taken" decision
   */
  private createTakenDecision(
    context: VerificationContext,
    evidence: AggregatedEvidence,
    reason: DecisionReason,
    factors: DecisionFactor[],
    uniquenessScore?: UniquenessScore
  ): Decision {
    const confidence = this.calculateConfidence(evidence, context);
    const confidenceLevel = this.getConfidenceLevel(confidence);
    
    return {
      status: 'taken',
      confidence,
      confidenceLevel,
      primaryReason: reason,
      contributingFactors: factors,
      recommendedAction: this.determineRecommendedAction({ confidence } as Decision),
      cacheTTL: this.config.caching.taken,
      metadata: {
        decisionTime: new Date(),
        evidenceQuality: evidence.aggregationQuality,
        algorithmVersion: '2.0',
        platforms: evidence.sourcesChecked
      }
    };
  }

  /**
   * Create a "similar" decision
   */
  private createSimilarDecision(
    context: VerificationContext,
    evidence: AggregatedEvidence,
    reason: DecisionReason,
    factors: DecisionFactor[],
    uniquenessScore?: UniquenessScore
  ): Decision {
    const confidence = this.calculateConfidence(evidence, context);
    const confidenceLevel = this.getConfidenceLevel(confidence);
    
    return {
      status: 'similar',
      confidence,
      confidenceLevel,
      primaryReason: reason,
      contributingFactors: factors,
      recommendedAction: this.determineRecommendedAction({ confidence } as Decision),
      cacheTTL: this.config.caching.similar,
      metadata: {
        decisionTime: new Date(),
        evidenceQuality: evidence.aggregationQuality,
        algorithmVersion: '2.0',
        platforms: evidence.sourcesChecked
      }
    };
  }

  /**
   * Create an "available" decision
   */
  private createAvailableDecision(
    context: VerificationContext,
    evidence: AggregatedEvidence,
    reason: DecisionReason,
    factors: DecisionFactor[],
    uniquenessScore?: UniquenessScore
  ): Decision {
    const confidence = this.calculateConfidence(evidence, context);
    const confidenceLevel = this.getConfidenceLevel(confidence);
    
    return {
      status: 'available',
      confidence,
      confidenceLevel,
      primaryReason: reason,
      contributingFactors: factors,
      recommendedAction: this.determineRecommendedAction({ confidence } as Decision),
      cacheTTL: this.config.caching.available,
      metadata: {
        decisionTime: new Date(),
        evidenceQuality: evidence.aggregationQuality,
        algorithmVersion: '2.0',
        platforms: evidence.sourcesChecked
      }
    };
  }

  /**
   * Create an "uncertain" decision
   */
  private createUncertainDecision(
    context: VerificationContext,
    evidence: AggregatedEvidence,
    reason: DecisionReason,
    factors: DecisionFactor[],
    uniquenessScore?: UniquenessScore
  ): Decision {
    // Uncertain decisions get lower confidence
    const baseConfidence = this.calculateConfidence(evidence, context);
    const confidence = Math.min(baseConfidence * 0.7, 0.6); // Cap uncertain confidence
    const confidenceLevel = this.getConfidenceLevel(confidence);
    
    return {
      status: 'uncertain',
      confidence,
      confidenceLevel,
      primaryReason: reason,
      contributingFactors: factors,
      recommendedAction: 'proceed-with-caution',
      cacheTTL: this.config.caching.uncertain,
      metadata: {
        decisionTime: new Date(),
        evidenceQuality: evidence.aggregationQuality,
        algorithmVersion: '2.0',
        platforms: evidence.sourcesChecked
      }
    };
  }

  /**
   * Helper methods for decision factors
   */
  private getExactMatchFactors(evidence: AggregatedEvidence): DecisionFactor[] {
    const topMatch = evidence.exactMatches[0];
    return [{
      type: 'platform-match',
      weight: 1.0,
      value: topMatch.similarity,
      description: `Exact match found on ${topMatch.source}: "${topMatch.name}"`,
      source: topMatch.source
    }];
  }

  private getSimilarMatchFactors(evidence: AggregatedEvidence, matches: any[]): DecisionFactor[] {
    const topMatch = matches[0];
    return [{
      type: 'similarity-score',
      weight: 0.8,
      value: topMatch.similarity,
      description: `Similar match found: "${topMatch.name}" (${Math.round(topMatch.similarity * 100)}% similar)`,
      source: topMatch.source
    }];
  }

  private getFamousMatchFactors(matches: any[]): DecisionFactor[] {
    return [{
      type: 'famous-match',
      weight: 0.9,
      value: 1.0,
      description: `Famous artist match found in database`,
      source: 'famous'
    }];
  }

  private getNoMatchesFactors(evidence: AggregatedEvidence): DecisionFactor[] {
    return [{
      type: 'platform-match',
      weight: 0.6,
      value: 0.0,
      description: `No significant matches found across ${evidence.sourcesSuccessful.length} platforms`
    }];
  }

  private getInsufficientEvidenceFactors(evidence: AggregatedEvidence): DecisionFactor[] {
    return [{
      type: 'platform-match',
      weight: 0.3,
      value: evidence.averageReliability,
      description: `Insufficient evidence: ${evidence.sourcesSuccessful.length}/${evidence.sourcesChecked.length} platforms successful`
    }];
  }

  private getPlatformErrorFactors(evidence: AggregatedEvidence): DecisionFactor[] {
    return [{
      type: 'platform-match',
      weight: 0.2,
      value: 0.0,
      description: `Platform errors: ${evidence.sourcesFailed.length} failed, ${evidence.sourcesSuccessful.length} successful`
    }];
  }

  private createErrorFactor(error: unknown): DecisionFactor {
    return {
      type: 'platform-match',
      weight: 0.1,
      value: 0.0,
      description: `Verification error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }

  /**
   * Helper methods
   */
  private isSignificantMatch(match: any, type: 'band' | 'song'): boolean {
    return this.similarityService.isCloseMatch(match.name, match.name, type);
  }

  private hasInsufficientEvidence(evidence: AggregatedEvidence): boolean {
    return (
      evidence.sourcesSuccessful.length < this.config.evidence.highQualityPlatformCount ||
      evidence.averageReliability < this.config.evidence.reliabilityThreshold ||
      evidence.aggregationQuality === 'low'
    );
  }

  private getConfidenceLevel(confidence: number): Decision['confidenceLevel'] {
    if (confidence >= this.config.confidence.veryHighThreshold) return 'very-high';
    if (confidence >= this.config.confidence.highThreshold) return 'high';
    if (confidence >= this.config.confidence.mediumThreshold) return 'medium';
    if (confidence >= this.config.confidence.lowThreshold) return 'low';
    return 'very-low';
  }

  private extractPlatformResults(evidence: AggregatedEvidence, platform: string): any {
    const platformEvidence = evidence.platformEvidence[platform];
    if (!platformEvidence || !platformEvidence.available) {
      return null;
    }

    return {
      exists: platformEvidence.exactMatches.length > 0,
      matches: platformEvidence.matches
    };
  }

  /**
   * Configuration methods
   */
  getConfig(): DecisionConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<DecisionConfig>): void {
    this.config = { ...this.config, ...config };
  }
}