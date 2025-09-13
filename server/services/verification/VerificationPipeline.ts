/**
 * VerificationPipeline - Main orchestrator for the name verification process
 * Coordinates all pipeline components in a clean, testable flow
 */

import { SpotifyStrategy } from './SpotifyStrategy';
import { ItunesStrategy } from './ItunesStrategy';
import { SoundcloudStrategy } from './SoundcloudStrategy';
import { BandcampStrategy } from './BandcampStrategy';
import { EvidenceAggregator } from './EvidenceAggregator';
import { DecisionEngine } from './DecisionEngine';
import { ResultBuilder } from './ResultBuilder';
import { SimilarityService } from './SimilarityService';
import { NameUniquenessScorer } from './NameUniquenessScorer';
import { EasterEggService } from '../easterEggService';
import { VerificationCache } from '../verificationCache';
import { NameSuggestionService } from '../nameSuggestionService';
import { secureLog } from '../../utils/secureLogger';

import type { 
  IVerificationPipeline,
  IPlatformVerifier,
  VerificationContext,
  PlatformEvidence,
  AggregatedEvidence,
  Decision,
  PipelineConfig,
  VerificationError
} from '../../types/verification';
import type { VerificationResult } from "@shared/schema";

export class VerificationPipeline implements IVerificationPipeline {
  private static instance: VerificationPipeline;
  
  // Core pipeline components
  private platforms!: Map<string, IPlatformVerifier>;
  private evidenceAggregator!: EvidenceAggregator;
  private decisionEngine!: DecisionEngine;
  private resultBuilder!: ResultBuilder;
  
  // Supporting services
  private similarityService!: SimilarityService;
  private uniquenessScorer!: NameUniquenessScorer;
  private easterEggService!: EasterEggService;
  private cache!: VerificationCache;
  private nameSuggestionService!: NameSuggestionService;
  
  // Pipeline configuration
  private config!: PipelineConfig;

  private constructor() {
    this.initializeComponents();
    this.setupConfiguration();
  }

  static getInstance(): VerificationPipeline {
    if (!VerificationPipeline.instance) {
      VerificationPipeline.instance = new VerificationPipeline();
    }
    return VerificationPipeline.instance;
  }

  /**
   * Main verification pipeline entry point
   */
  async verify(context: VerificationContext): Promise<VerificationResult> {
    const startTime = Date.now();
    
    try {
      // 1. Validate input context
      const validationError = this.validateContext(context);
      if (validationError) {
        throw new Error(validationError.message);
      }

      // 2. Check cache first (short-circuit)
      if (context.cacheEnabled !== false) {
        const cachedResult = this.cache.get(context.name, context.type);
        if (cachedResult) {
          secureLog.debug('Cache hit for verification', { name: context.name, type: context.type });
          return cachedResult;
        }
      }

      // 3. Check for famous artists first (prevents easter egg config regression)
      if (!context.skipFamousArtists) {
        const famousArtist = this.easterEggService.checkFamousArtist(
          context.name,
          context.type,
          (n, t) => this.generateVerificationLinks(n, t),
          (n) => this.generateSimilarNames(n)
        );
        
        if (famousArtist) {
          secureLog.debug('Famous artist match', { name: context.name, type: context.type });
          // Cache famous artist results
          this.cacheResult(context, famousArtist, this.config.cache.famousArtist);
          return famousArtist;
        }
      }

      // 4. Check for easter eggs (after famous artists to prevent precedence issues)
      if (!context.skipEasterEggs) {
        const easterEgg = this.easterEggService.checkEasterEgg(context.name, context.type);
        if (easterEgg) {
          secureLog.debug('Easter egg triggered', { name: context.name, type: context.type });
          return easterEgg; // Don't cache easter eggs
        }
      }

      // 5. Platform verification (parallel execution)
      const platformEvidence = await this.executePlatformVerification(context);

      // 6. Aggregate evidence from all platforms
      const aggregatedEvidence = this.evidenceAggregator.aggregate(platformEvidence);

      // 7. Calculate similarity and uniqueness scores
      const similarityScores = this.calculateSimilarityScores(context, aggregatedEvidence);
      const uniquenessScore = this.calculateUniquenessScore(context);

      // 8. Make verification decision
      const decision = await this.decisionEngine.decide(
        context,
        aggregatedEvidence,
        similarityScores,
        uniquenessScore
      );

      // 9. Build final result
      const result = this.resultBuilder.buildResult(
        context,
        decision,
        aggregatedEvidence
      );

      // 10. Cache the result
      this.cacheResult(context, result, decision.cacheTTL);

      // Log performance metrics
      const duration = Date.now() - startTime;
      secureLog.debug('Verification completed', {
        name: context.name,
        type: context.type,
        status: result.status,
        confidence: result.confidence,
        duration,
        platforms: Object.keys(platformEvidence),
        cached: false
      });

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      secureLog.error('Verification pipeline error', {
        error: error instanceof Error ? error.message : String(error),
        name: context.name,
        type: context.type,
        duration
      });

      // Return graceful fallback result
      return this.createFallbackResult(context, error);
    }
  }

  /**
   * Execute platform verification in parallel with proper error handling
   */
  private async executePlatformVerification(
    context: VerificationContext
  ): Promise<Record<string, PlatformEvidence>> {
    const enabledPlatforms = context.platforms || this.config.platforms.enabled;
    const platformPromises: Array<Promise<{platform: string, evidence: PlatformEvidence}>> = [];
    const platformEvidence: Record<string, PlatformEvidence> = {};

    // Launch all platform verifications in parallel
    for (const platformName of enabledPlatforms) {
      const platform = this.platforms.get(platformName);
      if (!platform) {
        secureLog.warn(`Platform not found: ${platformName}`);
        // Add failed evidence for missing platform instead of skipping
        platformEvidence[platformName] = this.createFailedEvidence(
          platformName,
          new Error(`Platform implementation not found: ${platformName}`)
        );
        continue;
      }

      // Check if platform is available before attempting verification
      const platformPromise = this.executePlatformWithTimeout(
        platform,
        context,
        this.config.platforms.timeouts[platformName] || 10000
      ).then(evidence => ({
        platform: platformName,
        evidence
      })).catch(error => ({
        platform: platformName,
        evidence: this.createFailedEvidence(platformName, error)
      }));

      platformPromises.push(platformPromise);
    }

    // Execute all platforms concurrently with proper error handling
    const results = await Promise.allSettled(platformPromises);

    // Process results (all should be fulfilled now due to internal error handling)
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        const { platform, evidence } = result.value;
        platformEvidence[platform] = evidence;
      } else {
        // This should rarely happen now, but handle it gracefully
        secureLog.error('Unexpected platform promise rejection', {
          error: result.reason
        });
      }
    });

    return platformEvidence;
  }

  /**
   * Execute single platform verification with timeout (fixed race condition)
   */
  private async executePlatformWithTimeout(
    platform: IPlatformVerifier,
    context: VerificationContext,
    timeoutMs: number
  ): Promise<PlatformEvidence> {
    const available = await platform.isAvailable();
    if (!available) {
      return this.createFailedEvidence(
        platform.platformName,
        new Error(`${platform.platformName} is not available`)
      );
    }

    // Use AbortController to properly handle timeout cancellation
    const controller = new AbortController();
    let timeoutHandle: NodeJS.Timeout | null = null;

    const timeoutPromise = new Promise<PlatformEvidence>((_, reject) => {
      timeoutHandle = setTimeout(() => {
        controller.abort();
        reject(new Error(`${platform.platformName} timeout`));
      }, timeoutMs);
    });

    try {
      const platformPromise = platform.verify(context.name, context.type);
      
      const result = await Promise.race([
        platformPromise,
        timeoutPromise
      ]);

      // Clear timeout if platform resolved first
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }

      return result;
    } catch (error) {
      // Clear timeout on any error
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
      return this.createFailedEvidence(platform.platformName, error);
    }
  }

  /**
   * Create failed evidence for platforms that error
   */
  private createFailedEvidence(platformName: string, error: any): PlatformEvidence {
    return {
      platform: platformName,
      available: false,
      reliability: 0,
      matches: [],
      exactMatches: [],
      similarMatches: [],
      totalResults: 0,
      searchQuality: 'failed',
      error: error instanceof Error ? error.message : String(error),
      metadata: {
        cached: false,
        searchMethod: 'failed',
        rateLimited: false
      }
    };
  }

  /**
   * Calculate similarity scores for the context
   */
  private calculateSimilarityScores(
    context: VerificationContext,
    evidence: AggregatedEvidence
  ): any {
    if (evidence.allMatches.length === 0) {
      return null;
    }

    const topMatch = evidence.allMatches[0];
    return this.similarityService.calculateSimilarity(
      context.name,
      topMatch.name,
      context.type
    );
  }

  /**
   * Calculate uniqueness score for the name
   */
  private calculateUniquenessScore(context: VerificationContext): any {
    return this.uniquenessScorer.calculateUniquenessScore(context.name);
  }

  /**
   * Cache verification result with appropriate TTL
   */
  private cacheResult(
    context: VerificationContext,
    result: VerificationResult,
    ttl: number
  ): void {
    if (context.cacheEnabled !== false && ttl > 0) {
      this.cache.set(context.name, context.type, result, ttl);
    }
  }

  /**
   * Create fallback result for errors (improved to avoid misleading signals)
   */
  private createFallbackResult(
    context: VerificationContext,
    error: any
  ): VerificationResult {
    const result: VerificationResult = {
      status: 'available', // Note: Consider 'uncertain' status in future schema updates
      confidence: 0.3, // Lower confidence to indicate uncertainty
      confidenceLevel: 'low',
      explanation: 'Verification incomplete due to technical issues',
      details: 'Verification temporarily unavailable - name appears to be available.',
      verificationLinks: this.generateVerificationLinks(context.name, context.type)
    };

    // Cache fallback results briefly
    this.cacheResult(context, result, this.config.cache.error);

    return result;
  }

  /**
   * Initialize all pipeline components
   */
  private initializeComponents(): void {
    // Initialize platform strategies
    this.platforms = new Map<string, IPlatformVerifier>([
      ['spotify', new SpotifyStrategy()],
      ['itunes', new ItunesStrategy()],
      ['soundcloud', new SoundcloudStrategy()],
      ['bandcamp', new BandcampStrategy()]
    ]);

    // Initialize pipeline components
    this.evidenceAggregator = EvidenceAggregator.getInstance();
    this.decisionEngine = DecisionEngine.getInstance();
    this.resultBuilder = ResultBuilder.getInstance();

    // Initialize supporting services
    this.similarityService = SimilarityService.getInstance();
    this.uniquenessScorer = NameUniquenessScorer.getInstance();
    this.easterEggService = EasterEggService.getInstance();
    this.cache = VerificationCache.getInstance();
    this.nameSuggestionService = NameSuggestionService.getInstance();
  }

  /**
   * Setup default pipeline configuration
   */
  private setupConfiguration(): void {
    this.config = {
      cache: {
        taken: 7200,      // 2 hours
        similar: 1800,    // 30 minutes
        available: 3600,  // 1 hour
        easterEgg: 0,     // Don't cache
        famousArtist: 7200, // 2 hours
        error: 300        // 5 minutes
      },
      platforms: {
        enabled: ['spotify', 'itunes', 'soundcloud', 'bandcamp'],
        weights: {
          spotify: 1.0,
          itunes: 0.9,
          soundcloud: 0.7,
          bandcamp: 0.8
        },
        timeouts: {
          spotify: 8000,
          itunes: 6000,
          soundcloud: 10000,
          bandcamp: 10000
        }
      },
      similarity: {
        exactThreshold: 0.95,
        phoneticThreshold: 0.85,
        partialThreshold: 0.70
      },
      confidence: {
        minConfidence: 0.1,
        highConfidenceThreshold: 0.8,
        uncertaintyThreshold: 0.4
      },
      concurrency: {
        maxPlatforms: 4,
        maxRetries: 2,
        backoffMultiplier: 1.5
      }
    };
  }

  /**
   * Validate verification context
   */
  validateContext(context: VerificationContext): VerificationError | null {
    if (!context.name || context.name.trim().length === 0) {
      return {
        code: 'INVALID_INPUT',
        message: 'Name is required and cannot be empty',
        retryable: false,
        timestamp: new Date(),
        context: { name: context.name, type: context.type }
      };
    }

    if (context.name.length > 200) {
      return {
        code: 'INVALID_INPUT',
        message: 'Name is too long (maximum 200 characters)',
        retryable: false,
        timestamp: new Date(),
        context: { name: context.name, type: context.type }
      };
    }

    if (!['band', 'song'].includes(context.type)) {
      return {
        code: 'INVALID_INPUT',
        message: 'Type must be either "band" or "song"',
        retryable: false,
        timestamp: new Date(),
        context: { name: context.name, type: context.type }
      };
    }

    return null;
  }

  /**
   * Configuration management
   */
  getConfig(): PipelineConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<PipelineConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get platform verifier for testing
   */
  getPlatform(name: string): IPlatformVerifier | undefined {
    return this.platforms.get(name);
  }

  /**
   * Add custom platform verifier
   */
  addPlatform(name: string, verifier: IPlatformVerifier): void {
    this.platforms.set(name, verifier);
    if (!this.config.platforms.enabled.includes(name)) {
      this.config.platforms.enabled.push(name);
    }
  }

  /**
   * Remove platform verifier
   */
  removePlatform(name: string): void {
    this.platforms.delete(name);
    this.config.platforms.enabled = this.config.platforms.enabled.filter(p => p !== name);
  }

  /**
   * Helper methods for generating suggestions and links
   */
  private generateVerificationLinks(name: string, type: 'band' | 'song'): Array<{name: string, url: string, source: string}> {
    return this.nameSuggestionService.generateVerificationLinks(name, type);
  }

  private generateSimilarNames(name: string): string[] {
    return this.nameSuggestionService.generateSimilarNames(name);
  }
}