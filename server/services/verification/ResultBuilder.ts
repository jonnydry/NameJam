/**
 * ResultBuilder - Formats final VerificationResult with links and suggestions
 * Converts internal Decision and Evidence into user-facing verification results
 */

import { NameSuggestionService } from '../nameSuggestionService';
import { secureLog } from '../../utils/secureLogger';
import type { 
  IResultBuilder,
  VerificationContext,
  Decision,
  AggregatedEvidence,
  PlatformMatch
} from '../../types/verification';
import type { VerificationResult } from "@shared/schema";

export interface ResultBuilderConfig {
  suggestions: {
    maxSimilarNames: number;
    maxVerificationLinks: number;
    includeGenreContext: boolean;
  };
  details: {
    includePopularityInfo: boolean;
    includeGenreInfo: boolean;
    includeReleaseDate: boolean;
    maxArtistGenres: number;
  };
}

export class ResultBuilder implements IResultBuilder {
  private static instance: ResultBuilder;
  private nameSuggestionService: NameSuggestionService;
  private config: ResultBuilderConfig;

  private constructor() {
    this.nameSuggestionService = NameSuggestionService.getInstance();
    this.config = {
      suggestions: {
        maxSimilarNames: 4,
        maxVerificationLinks: 5,
        includeGenreContext: true
      },
      details: {
        includePopularityInfo: true,
        includeGenreInfo: true,
        includeReleaseDate: false,
        maxArtistGenres: 2
      }
    };
  }

  static getInstance(): ResultBuilder {
    if (!ResultBuilder.instance) {
      ResultBuilder.instance = new ResultBuilder();
    }
    return ResultBuilder.instance;
  }

  /**
   * Build final VerificationResult from decision and evidence
   */
  buildResult(
    context: VerificationContext,
    decision: Decision,
    evidence: AggregatedEvidence,
    similarNames?: string[],
    verificationLinks?: Array<{name: string, url: string, source: string}>
  ): VerificationResult {
    try {
      // Generate similar names if not provided
      const suggestedNames = similarNames || this.generateSimilarNames(context.name);
      
      // Generate verification links if not provided
      const links = verificationLinks || this.generateVerificationLinks(context.name, context.type);

      // Build the base result
      const baseResult: Omit<VerificationResult, 'details'> = {
        status: this.mapDecisionStatus(decision.status),
        confidence: decision.confidence,
        confidenceLevel: decision.confidenceLevel,
        explanation: this.buildExplanation(decision, evidence),
        verificationLinks: links.slice(0, this.config.suggestions.maxVerificationLinks)
      };

      // Build type-specific details and add similar names if needed
      const details = this.buildDetails(context, decision, evidence);
      const result = { ...baseResult, details };

      // Add similar names for taken/similar statuses
      if (decision.status === 'taken' || decision.status === 'similar') {
        (result as any).similarNames = suggestedNames.slice(0, this.config.suggestions.maxSimilarNames);
      }

      return result;

    } catch (error) {
      secureLog.error('Result building error:', error);
      
      // Return fallback result on error
      return this.createFallbackResult(context, decision);
    }
  }

  /**
   * Generate similar names for the given name
   */
  private generateSimilarNames(name: string): string[] {
    return this.nameSuggestionService.generateSimilarNames(
      name, 
      this.config.suggestions.maxSimilarNames
    );
  }

  /**
   * Generate verification links for manual checking
   */
  private generateVerificationLinks(
    name: string, 
    type: 'band' | 'song'
  ): Array<{name: string, url: string, source: string}> {
    return this.nameSuggestionService.generateVerificationLinks(name, type);
  }

  /**
   * Build explanation text based on decision and evidence
   */
  private buildExplanation(decision: Decision, evidence: AggregatedEvidence): string {
    const primaryFactor = decision.contributingFactors[0];
    
    switch (decision.primaryReason) {
      case 'exact-match-found':
        return this.buildExactMatchExplanation(evidence, primaryFactor);
      
      case 'similar-match-found':
        return this.buildSimilarMatchExplanation(evidence, primaryFactor);
      
      case 'famous-artist-match':
        return this.buildFamousMatchExplanation(evidence);
      
      case 'easter-egg-detected':
        return 'Special easter egg detected - perfect name choice!';
      
      case 'no-matches-found':
        return this.buildNoMatchesExplanation(evidence);
      
      case 'insufficient-evidence':
        return this.buildInsufficientEvidenceExplanation(evidence);
      
      case 'platform-unavailable':
        return this.buildPlatformErrorExplanation(evidence);
      
      case 'verification-error':
        return 'Verification temporarily unavailable due to technical issues';
      
      default:
        return `Verification completed with ${decision.confidenceLevel} confidence`;
    }
  }

  /**
   * Build detailed explanation for exact matches
   */
  private buildExactMatchExplanation(
    evidence: AggregatedEvidence, 
    primaryFactor?: any
  ): string {
    if (evidence.exactMatches.length === 0) {
      return 'Exact match found in music databases';
    }

    const topMatch = evidence.exactMatches[0];
    const platform = this.getPlatformDisplayName(topMatch.source);
    
    let explanation = `Found exact match on ${platform}`;
    
    // Add artist info if available
    if (topMatch.artist && topMatch.artist !== topMatch.name) {
      explanation += ` by ${topMatch.artist}`;
    }
    
    // Add popularity info if available and enabled
    if (this.config.details.includePopularityInfo && topMatch.popularity) {
      explanation += ` with ${topMatch.popularity}% popularity`;
    }
    
    return explanation;
  }

  /**
   * Build detailed explanation for similar matches
   */
  private buildSimilarMatchExplanation(
    evidence: AggregatedEvidence, 
    primaryFactor?: any
  ): string {
    if (evidence.similarMatches.length === 0) {
      return 'Similar names found in music databases';
    }

    const topMatch = evidence.similarMatches[0];
    const platform = this.getPlatformDisplayName(topMatch.source);
    const similarity = Math.round(topMatch.similarity * 100);
    
    return `Similar match found on ${platform}: "${topMatch.name}" (${similarity}% similar)`;
  }

  /**
   * Build detailed explanation for famous artist matches
   */
  private buildFamousMatchExplanation(evidence: AggregatedEvidence): string {
    const famousMatches = evidence.allMatches.filter(m => m.source === 'famous');
    if (famousMatches.length > 0) {
      return `Famous artist found in database: "${famousMatches[0].name}"`;
    }
    return 'Famous artist match found in database';
  }

  /**
   * Build detailed explanation for no matches
   */
  private buildNoMatchesExplanation(evidence: AggregatedEvidence): string {
    const platformCount = evidence.sourcesSuccessful.length;
    return `No existing matches found across ${platformCount} music platform${platformCount !== 1 ? 's' : ''}`;
  }

  /**
   * Build detailed explanation for insufficient evidence
   */
  private buildInsufficientEvidenceExplanation(evidence: AggregatedEvidence): string {
    const failedCount = evidence.sourcesFailed.length;
    const totalCount = evidence.sourcesChecked.length;
    return `Limited verification data available (${totalCount - failedCount}/${totalCount} platforms accessible)`;
  }

  /**
   * Build detailed explanation for platform errors
   */
  private buildPlatformErrorExplanation(evidence: AggregatedEvidence): string {
    const successfulCount = evidence.sourcesSuccessful.length;
    const totalCount = evidence.sourcesChecked.length;
    return `Verification partially completed (${successfulCount}/${totalCount} platforms responded)`;
  }

  /**
   * Build context-specific details string
   */
  private buildDetails(
    context: VerificationContext, 
    decision: Decision, 
    evidence: AggregatedEvidence
  ): string {
    switch (decision.status) {
      case 'taken':
        return this.buildTakenDetails(context, evidence);
      
      case 'similar':
        return this.buildSimilarDetails(context, evidence);
      
      case 'available':
        return this.buildAvailableDetails(context, evidence);
      
      case 'uncertain':
        return this.buildUncertainDetails(context, evidence);
      
      default:
        return `Verification completed for ${context.type}: "${context.name}"`;
    }
  }

  /**
   * Build details for taken names
   */
  private buildTakenDetails(context: VerificationContext, evidence: AggregatedEvidence): string {
    const exactMatch = evidence.exactMatches[0];
    if (!exactMatch) {
      return `This ${context.type} name is taken. Try these alternatives:`;
    }

    let details = '';
    
    if (context.type === 'band') {
      details = `This band name exists on ${this.getPlatformDisplayName(exactMatch.source)}`;
      
      // Add genre information if available
      if (this.config.details.includeGenreInfo && exactMatch.genres && exactMatch.genres.length > 0) {
        const genreList = exactMatch.genres.slice(0, this.config.details.maxArtistGenres).join(', ');
        details += ` (${genreList})`;
      }
      
      // Add popularity information if available
      if (this.config.details.includePopularityInfo && exactMatch.popularity) {
        details += `. Popularity: ${exactMatch.popularity}/100`;
      }
      
      details += '. Try these alternatives:';
    } else {
      details = `This song exists on ${this.getPlatformDisplayName(exactMatch.source)}`;
      
      if (exactMatch.artist) {
        details += ` by ${exactMatch.artist}`;
      }
      
      if (exactMatch.album) {
        details += ` (${exactMatch.album})`;
      }
      
      details += '. Try these alternatives:';
    }

    return details;
  }

  /**
   * Build details for similar names
   */
  private buildSimilarDetails(context: VerificationContext, evidence: AggregatedEvidence): string {
    const similarMatch = evidence.similarMatches[0];
    const platform = similarMatch ? this.getPlatformDisplayName(similarMatch.source) : 'music databases';
    
    if (context.type === 'band') {
      let details = `Similar band names found on ${platform}`;
      
      if (similarMatch && this.config.details.includeGenreInfo && similarMatch.genres && similarMatch.genres.length > 0) {
        const genreList = similarMatch.genres.slice(0, this.config.details.maxArtistGenres).join(', ');
        details += ` (${genreList})`;
      }
      
      details += '. Consider these alternatives:';
      return details;
    } else {
      return `Similar song titles found on ${platform} by various artists. Consider these alternatives:`;
    }
  }

  /**
   * Build details for available names
   */
  private buildAvailableDetails(context: VerificationContext, evidence: AggregatedEvidence): string {
    const platformCount = evidence.sourcesSuccessful.length;
    
    if (evidence.totalResults <= 5) {
      return `No existing ${context.type} found with this name in our databases.`;
    } else {
      return `No existing ${context.type} found with this exact name in our databases.`;
    }
  }

  /**
   * Build details for uncertain results
   */
  private buildUncertainDetails(context: VerificationContext, evidence: AggregatedEvidence): string {
    if (evidence.sourcesFailed.length > evidence.sourcesSuccessful.length) {
      return 'Verification temporarily limited due to platform availability. Name appears to be available.';
    } else {
      return 'Verification incomplete due to limited data. Please verify manually using the links provided.';
    }
  }

  /**
   * Map internal decision status to API status
   */
  private mapDecisionStatus(status: Decision['status']): VerificationResult['status'] {
    switch (status) {
      case 'taken':
        return 'taken';
      case 'similar':
        return 'similar';
      case 'available':
        return 'available';
      case 'uncertain':
        return 'available'; // Map uncertain to available for user-facing API
      default:
        return 'available';
    }
  }

  /**
   * Get user-friendly platform display name
   */
  private getPlatformDisplayName(platform: string): string {
    const platformNames: Record<string, string> = {
      'spotify': 'Spotify',
      'itunes': 'Apple Music',
      'soundcloud': 'SoundCloud',
      'bandcamp': 'Bandcamp',
      'lastfm': 'Last.fm',
      'musicbrainz': 'MusicBrainz',
      'famous': 'music database'
    };
    
    return platformNames[platform] || platform;
  }

  /**
   * Create fallback result for errors
   */
  private createFallbackResult(context: VerificationContext, decision: Decision): VerificationResult {
    const links = this.nameSuggestionService.generateVerificationLinks(context.name, context.type);
    
    return {
      status: 'available',
      confidence: 0.5,
      confidenceLevel: 'medium',
      explanation: 'Verification temporarily unavailable due to technical issues',
      details: 'Verification temporarily unavailable - name appears to be available.',
      verificationLinks: links
    };
  }

  /**
   * Configuration methods
   */
  getConfig(): ResultBuilderConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<ResultBuilderConfig>): void {
    this.config = { ...this.config, ...config };
  }
}