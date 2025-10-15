/**
 * Enhanced API Manager for NameJam
 * 
 * Integrates all API services with the new robustness framework:
 * - Uses APIIntegrationFramework for health monitoring and quality scoring
 * - Uses DataNormalizationPipeline for consistent data processing
 * - Uses APIFallbackManager for intelligent fallback strategies
 * - Provides unified interfaces for all external API calls
 */

import { secureLog } from '../utils/secureLogger';
import { apiFramework } from './apiIntegrationFramework';
import { dataNormalizer } from './dataNormalizationPipeline';
import { apiFallbackManager } from './apiFallbackManager';
import { performanceMonitor } from './performanceMonitor';

// Import existing services
import { SpotifyService } from './spotifyService';
import { DatamuseService } from './datamuseService';
import { ConceptNetService } from './conceptNetService';
import { PoetryDbService } from './poetryDbService';
import { itunesService } from './itunesService';
import { soundcloudService } from './soundcloudService';
import { bandcampService } from './bandcampService';

export interface EnhancedAPIRequest {
  primarySource?: string;
  allowFallback: boolean;
  allowFusion: boolean;
  qualityThreshold: number;
  maxSources: number;
  timeout: number;
  cacheOverride?: boolean;
}

export interface EnhancedAPIResponse<T> {
  data: T;
  metadata: {
    sources: string[];
    qualityScore: number;
    totalDuration: number;
    fallbackUsed: boolean;
    fusionUsed: boolean;
    cacheHit: boolean;
    confidence: number;
  };
  diagnostics: {
    attempts: number;
    successfulSources: string[];
    failedSources: string[];
    errors: string[];
  };
}

export class EnhancedAPIManager {
  private serviceInstances: Map<string, any> = new Map();
  private initialized = false;

  constructor() {
    this.initializeServices();
  }

  /**
   * Initialize all API services and register them with the framework
   */
  private initializeServices(): void {
    if (this.initialized) return;

    try {
      // Initialize service instances
      this.serviceInstances.set('spotify', new SpotifyService());
      this.serviceInstances.set('datamuse', new DatamuseService());
      this.serviceInstances.set('conceptnet', new ConceptNetService());
      this.serviceInstances.set('poetrydb', new PoetryDbService());
      this.serviceInstances.set('itunes', itunesService);
      this.serviceInstances.set('soundcloud', soundcloudService);
      this.serviceInstances.set('bandcamp', bandcampService);

      // Register services with the API framework
      this.registerWithFramework();
      
      this.initialized = true;
      secureLog.info('✅ Enhanced API Manager initialized with all services');

    } catch (error) {
      secureLog.error('Failed to initialize Enhanced API Manager:', error);
      throw error;
    }
  }

  /**
   * Register all services with the API integration framework
   */
  private registerWithFramework(): void {
    const serviceConfigs = [
      {
        name: 'spotify',
        baseUrl: 'https://api.spotify.com/v1',
        timeout: 15000,
        rateLimit: { requests: 100, windowMs: 60000 },
        circuitBreaker: { failureThreshold: 5, recoveryTimeout: 60000, successThreshold: 3 },
        priority: 1,
        healthCheck: async () => this.checkSpotifyHealth(),
        qualityThreshold: 70
      },
      {
        name: 'datamuse',
        baseUrl: 'https://api.datamuse.com',
        timeout: 10000,
        rateLimit: { requests: 100, windowMs: 60000 },
        circuitBreaker: { failureThreshold: 3, recoveryTimeout: 30000, successThreshold: 2 },
        priority: 2,
        healthCheck: async () => this.checkDatamuseHealth(),
        qualityThreshold: 60
      },
      {
        name: 'conceptnet',
        baseUrl: 'https://api.conceptnet.io',
        timeout: 10000,
        rateLimit: { requests: 60, windowMs: 60000 },
        circuitBreaker: { failureThreshold: 3, recoveryTimeout: 30000, successThreshold: 2 },
        priority: 3,
        healthCheck: async () => this.checkConceptNetHealth(),
        qualityThreshold: 55
      },
      {
        name: 'poetrydb',
        baseUrl: 'https://poetrydb.org',
        timeout: 8000,
        rateLimit: { requests: 50, windowMs: 60000 },
        circuitBreaker: { failureThreshold: 3, recoveryTimeout: 30000, successThreshold: 2 },
        priority: 4,
        healthCheck: async () => this.checkPoetryDbHealth(),
        qualityThreshold: 50
      },
      {
        name: 'itunes',
        baseUrl: 'https://itunes.apple.com',
        timeout: 10000,
        rateLimit: { requests: 100, windowMs: 60000 },
        circuitBreaker: { failureThreshold: 4, recoveryTimeout: 30000, successThreshold: 2 },
        priority: 2,
        healthCheck: async () => this.checkItunesHealth(),
        qualityThreshold: 65
      },
      {
        name: 'soundcloud',
        baseUrl: 'https://api.soundcloud.com',
        timeout: 12000,
        rateLimit: { requests: 80, windowMs: 60000 },
        circuitBreaker: { failureThreshold: 4, recoveryTimeout: 45000, successThreshold: 2 },
        priority: 3,
        healthCheck: async () => this.checkSoundCloudHealth(),
        qualityThreshold: 60
      },
      {
        name: 'bandcamp',
        baseUrl: 'https://bandcamp.com',
        timeout: 15000,
        rateLimit: { requests: 40, windowMs: 60000 },
        circuitBreaker: { failureThreshold: 3, recoveryTimeout: 60000, successThreshold: 2 },
        priority: 4,
        healthCheck: async () => this.checkBandcampHealth(),
        qualityThreshold: 55
      }
    ];

    for (const config of serviceConfigs) {
      apiFramework.registerService(config);
    }
  }

  /**
   * Enhanced artist search with fallback and normalization
   */
  async searchArtists(
    query: string, 
    options: Partial<EnhancedAPIRequest> = {}
  ): Promise<EnhancedAPIResponse<any[]>> {
    const settings: EnhancedAPIRequest = {
      primarySource: 'spotify',
      allowFallback: true,
      allowFusion: false,
      qualityThreshold: 70,
      maxSources: 3,
      timeout: 15000,
      ...options
    };

    const operationId = `enhanced-search-artists-${Date.now()}`;
    performanceMonitor.startOperation(operationId, 'enhanced-artist-search', {
      query,
      settings
    });

    const diagnostics = {
      attempts: 0,
      successfulSources: [] as string[],
      failedSources: [] as string[],
      errors: [] as string[]
    };

    try {
      // Use fallback manager for intelligent source selection
      const fallbackResult = await apiFallbackManager.getArtistData(
        query,
        settings.primarySource,
        {
          allowFusion: settings.allowFusion,
          emergencyMode: settings.allowFallback
        }
      );

      diagnostics.attempts = fallbackResult.performance.attempts;
      diagnostics.successfulSources = fallbackResult.performance.successfulSources;
      diagnostics.failedSources = fallbackResult.performance.failedSources;

      const duration = performanceMonitor.endOperation(operationId) || 0;

      return {
        data: fallbackResult.data,
        metadata: {
          sources: fallbackResult.fallbackChain,
          qualityScore: fallbackResult.quality,
          totalDuration: duration,
          fallbackUsed: fallbackResult.usedFallback,
          fusionUsed: fallbackResult.fusionUsed,
          cacheHit: false, // Will be updated by fallback manager
          confidence: fallbackResult.quality / 100
        },
        diagnostics
      };

    } catch (error) {
      diagnostics.errors.push(error instanceof Error ? error.message : String(error));
      performanceMonitor.endOperation(operationId);
      
      secureLog.error('Enhanced artist search failed:', error);
      throw new Error(`Enhanced artist search failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Enhanced vocabulary search with multi-source fusion
   */
  async searchVocabulary(
    query: string,
    context: string = 'general',
    options: Partial<EnhancedAPIRequest> = {}
  ): Promise<EnhancedAPIResponse<any>> {
    const settings: EnhancedAPIRequest = {
      primarySource: 'datamuse',
      allowFallback: true,
      allowFusion: true,
      qualityThreshold: 60,
      maxSources: 3,
      timeout: 10000,
      ...options
    };

    const operationId = `enhanced-search-vocabulary-${Date.now()}`;
    performanceMonitor.startOperation(operationId, 'enhanced-vocabulary-search', {
      query,
      context,
      settings
    });

    try {
      // Use fallback manager for vocabulary data
      const fallbackResult = await apiFallbackManager.getVocabularyData(
        query,
        context,
        settings.primarySource
      );

      const duration = performanceMonitor.endOperation(operationId) || 0;

      return {
        data: fallbackResult.data,
        metadata: {
          sources: fallbackResult.fallbackChain,
          qualityScore: fallbackResult.quality,
          totalDuration: duration,
          fallbackUsed: fallbackResult.usedFallback,
          fusionUsed: fallbackResult.fusionUsed,
          cacheHit: false,
          confidence: fallbackResult.quality / 100
        },
        diagnostics: {
          attempts: fallbackResult.performance.attempts,
          successfulSources: fallbackResult.performance.successfulSources,
          failedSources: fallbackResult.performance.failedSources,
          errors: []
        }
      };

    } catch (error) {
      performanceMonitor.endOperation(operationId);
      secureLog.error('Enhanced vocabulary search failed:', error);
      throw error;
    }
  }

  /**
   * Enhanced track search with comprehensive fallback
   */
  async searchTracks(
    query: string,
    options: Partial<EnhancedAPIRequest> = {}
  ): Promise<EnhancedAPIResponse<any[]>> {
    const settings: EnhancedAPIRequest = {
      primarySource: 'spotify',
      allowFallback: true,
      allowFusion: false,
      qualityThreshold: 65,
      maxSources: 2,
      timeout: 12000,
      ...options
    };

    const startTime = Date.now();
    const sources = [settings.primarySource!, 'itunes', 'soundcloud'];
    const results: Array<{ data: any[]; source: string; quality: number }> = [];
    const diagnostics = {
      attempts: 0,
      successfulSources: [] as string[],
      failedSources: [] as string[],
      errors: [] as string[]
    };

    for (const source of sources) {
      if (results.length >= settings.maxSources) break;
      
      diagnostics.attempts++;
      
      try {
        const serviceResult = await this.searchTracksFromSource(source, query, 10);
        
        if (serviceResult && serviceResult.length > 0) {
          const normalizedTracks = serviceResult.map((track: any) => 
            dataNormalizer.normalizeTrack(track, source)
          );
          
          const quality = this.calculateResultQuality(normalizedTracks, source);
          
          if (quality >= settings.qualityThreshold) {
            results.push({
              data: normalizedTracks,
              source,
              quality
            });
            diagnostics.successfulSources.push(source);
          }
        }
        
      } catch (error) {
        diagnostics.failedSources.push(source);
        diagnostics.errors.push(`${source}: ${error instanceof Error ? error.message : String(error)}`);
        secureLog.debug(`Track search failed for ${source}:`, error);
      }
    }

    if (results.length === 0) {
      throw new Error('All track search sources failed');
    }

    // Use best quality result or fuse if requested
    const finalResult = settings.allowFusion && results.length > 1
      ? this.fuseTrackResults(results)
      : results.reduce((best, current) => current.quality > best.quality ? current : best);

    const duration = Date.now() - startTime;

    return {
      data: finalResult.data,
      metadata: {
        sources: results.map(r => r.source),
        qualityScore: finalResult.quality,
        totalDuration: duration,
        fallbackUsed: results.length > 1,
        fusionUsed: settings.allowFusion && results.length > 1,
        cacheHit: false,
        confidence: finalResult.quality / 100
      },
      diagnostics
    };
  }

  /**
   * Enhanced genre analysis with comprehensive data fusion
   */
  async analyzeGenre(
    genre: string,
    options: Partial<EnhancedAPIRequest> = {}
  ): Promise<EnhancedAPIResponse<any>> {
    const settings: EnhancedAPIRequest = {
      primarySource: 'spotify',
      allowFallback: true,
      allowFusion: true,
      qualityThreshold: 60,
      maxSources: 3,
      timeout: 10000,
      ...options
    };

    const startTime = Date.now();
    const sources = ['spotify', 'conceptnet'];
    const results: Array<{ data: any; source: string; quality: number }> = [];

    for (const source of sources) {
      try {
        const genreData = await this.getGenreDataFromSource(source, genre);
        if (genreData) {
          const normalized = dataNormalizer.normalizeGenreData(genreData, source);
          const quality = dataNormalizer.calculateDataQuality(normalized);
          
          results.push({
            data: normalized,
            source,
            quality
          });
        }
      } catch (error) {
        secureLog.debug(`Genre analysis failed for ${source}:`, error);
      }
    }

    if (results.length === 0) {
      throw new Error('Genre analysis failed across all sources');
    }

    // Fuse results for comprehensive genre profile
    const fusedData = this.fuseGenreResults(results);
    const duration = Date.now() - startTime;

    return {
      data: fusedData.data,
      metadata: {
        sources: results.map(r => r.source),
        qualityScore: fusedData.quality,
        totalDuration: duration,
        fallbackUsed: results.length > 1,
        fusionUsed: true,
        cacheHit: false,
        confidence: fusedData.quality / 100
      },
      diagnostics: {
        attempts: sources.length,
        successfulSources: results.map(r => r.source),
        failedSources: sources.filter(s => !results.some(r => r.source === s)),
        errors: []
      }
    };
  }

  /**
   * Health check methods for each service
   */
  private async checkSpotifyHealth(): Promise<boolean> {
    try {
      const service = this.serviceInstances.get('spotify');
      const testResult = await service.searchArtists('test', 1);
      return Array.isArray(testResult);
    } catch {
      return false;
    }
  }

  private async checkDatamuseHealth(): Promise<boolean> {
    try {
      const service = this.serviceInstances.get('datamuse');
      const testResult = await service.findWords({ meansLike: 'music', maxResults: 1 });
      return Array.isArray(testResult);
    } catch {
      return false;
    }
  }

  private async checkConceptNetHealth(): Promise<boolean> {
    try {
      const service = this.serviceInstances.get('conceptnet');
      const testResult = await service.getRelatedConcepts('music', 1);
      return Array.isArray(testResult);
    } catch {
      return false;
    }
  }

  private async checkPoetryDbHealth(): Promise<boolean> {
    try {
      const service = this.serviceInstances.get('poetrydb');
      const testResult = await service.getPoetryContext('rock');
      return testResult && typeof testResult === 'object';
    } catch {
      return false;
    }
  }

  private async checkItunesHealth(): Promise<boolean> {
    try {
      return await itunesService.isAvailable();
    } catch {
      return false;
    }
  }

  private async checkSoundCloudHealth(): Promise<boolean> {
    try {
      return await soundcloudService.isAvailable();
    } catch {
      return false;
    }
  }

  private async checkBandcampHealth(): Promise<boolean> {
    try {
      return await bandcampService.isAvailable();
    } catch {
      return false;
    }
  }

  /**
   * Helper methods for source-specific searches
   */
  private async searchTracksFromSource(source: string, query: string, limit: number): Promise<any[]> {
    const service = this.serviceInstances.get(source);
    if (!service) return [];

    switch (source) {
      case 'spotify':
        return service.searchTracks(query, limit);
      case 'itunes':
        return service.searchTracks(query, limit);
      case 'soundcloud':
        return service.searchTracks(query, limit);
      default:
        return [];
    }
  }

  private async getGenreDataFromSource(source: string, genre: string): Promise<any> {
    const service = this.serviceInstances.get(source);
    if (!service) return null;

    switch (source) {
      case 'spotify':
        return service.searchArtists(genre, 5);
      case 'conceptnet':
        return service.getRelatedConcepts(genre, 10);
      default:
        return null;
    }
  }

  /**
   * Data fusion methods
   */
  private fuseTrackResults(results: Array<{ data: any[]; source: string; quality: number }>): any {
    // Simple fusion - take best quality result
    // In a more sophisticated implementation, this would merge complementary data
    return results.reduce((best, current) => 
      current.quality > best.quality ? current : best
    );
  }

  private fuseGenreResults(results: Array<{ data: any; source: string; quality: number }>): any {
    // Combine genre data from multiple sources
    const fusedData = {
      primaryGenre: results[0].data.primaryGenre,
      subgenres: new Set<string>(),
      relatedGenres: new Set<string>(),
      descriptors: new Set<string>(),
      moodTags: new Set<string>(),
      vocabulary: new Set<string>(),
      sources: results.map(r => r.source)
    };

    for (const result of results) {
      const data = result.data;
      
      if (data.subgenres) {
        data.subgenres.forEach((g: string) => fusedData.subgenres.add(g));
      }
      if (data.relatedGenres) {
        data.relatedGenres.forEach((g: string) => fusedData.relatedGenres.add(g));
      }
      if (data.descriptors) {
        data.descriptors.forEach((d: string) => fusedData.descriptors.add(d));
      }
      if (data.moodTags) {
        data.moodTags.forEach((m: string) => fusedData.moodTags.add(m));
      }
      if (data.vocabulary) {
        data.vocabulary.forEach((v: string) => fusedData.vocabulary.add(v));
      }
    }

    // Calculate quality based on data richness and source diversity
    const avgQuality = results.reduce((sum, r) => sum + r.quality, 0) / results.length;
    const diversityBonus = results.length * 5; // Bonus for multiple sources
    
    return {
      data: {
        ...fusedData,
        subgenres: Array.from(fusedData.subgenres).slice(0, 5),
        relatedGenres: Array.from(fusedData.relatedGenres).slice(0, 8),
        descriptors: Array.from(fusedData.descriptors).slice(0, 10),
        moodTags: Array.from(fusedData.moodTags).slice(0, 8),
        vocabulary: Array.from(fusedData.vocabulary).slice(0, 20)
      },
      quality: Math.min(100, avgQuality + diversityBonus)
    };
  }

  private calculateResultQuality(results: any[], source: string): number {
    if (!results || results.length === 0) return 0;
    
    let quality = 50 + results.length * 5; // Base score + count bonus
    
    // Source reliability bonus
    const sourceBonus: Record<string, number> = {
      'spotify': 20,
      'itunes': 15,
      'soundcloud': 10,
      'datamuse': 10,
      'conceptnet': 8,
      'poetrydb': 5
    };
    
    quality += sourceBonus[source] || 0;
    
    // Data completeness bonus
    const avgCompleteness = results.reduce((sum, item) => {
      const fields = Object.keys(item);
      const filledFields = fields.filter(field => 
        item[field] != null && item[field] !== '' && 
        (!Array.isArray(item[field]) || item[field].length > 0)
      );
      return sum + (filledFields.length / fields.length);
    }, 0) / results.length;
    
    quality += avgCompleteness * 15;
    
    return Math.min(100, Math.max(0, quality));
  }

  /**
   * Get comprehensive service health status
   */
  getHealthStatus() {
    return {
      framework: apiFramework.getHealthStatus(),
      fallbackManager: apiFallbackManager.getHealthStatus(),
      serviceInstances: Array.from(this.serviceInstances.keys()),
      initialized: this.initialized
    };
  }

  /**
   * Get comprehensive performance statistics
   */
  getStatistics() {
    return {
      framework: apiFramework.getStatistics(),
      fallbackManager: apiFallbackManager.getStatistics(),
      services: this.serviceInstances.size,
      initialized: this.initialized
    };
  }
}

// Export singleton instance
export const enhancedApiManager = new EnhancedAPIManager();