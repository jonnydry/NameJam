/**
 * Intelligent API Fallback Manager for NameJam
 * 
 * Provides smart cascade fallback strategies:
 * - Quality-based fallback decisions
 * - Multi-source data fusion
 * - Intelligent cache utilization
 * - Emergency offline modes
 * - Performance-optimized routing
 */

import { secureLog } from '../utils/secureLogger';
import { dataNormalizer, NormalizedArtist, NormalizedTrack, NormalizedVocabulary } from './dataNormalizationPipeline';
import { xaiFallbackService } from './xaiFallbackService';
import { performanceMonitor } from './performanceMonitor';

export interface FallbackStrategy {
  name: string;
  priority: number;
  sources: string[];
  minQualityThreshold: number;
  maxRetries: number;
  timeout: number;
  emergencyCache: boolean;
  fusionStrategy: 'best_quality' | 'weighted_average' | 'consensus' | 'first_success';
}

export interface FallbackResult<T> {
  data: T;
  source: string;
  quality: number;
  usedFallback: boolean;
  fallbackChain: string[];
  fusionUsed: boolean;
  emergencyMode: boolean;
  performance: {
    totalDuration: number;
    attempts: number;
    successfulSources: string[];
    failedSources: string[];
  };
}

export interface FallbackConfig {
  artist: FallbackStrategy;
  track: FallbackStrategy;
  vocabulary: FallbackStrategy;
  genre: FallbackStrategy;
  lyrics: FallbackStrategy;
}

export class APIFallbackManager {
  private strategies: Map<string, FallbackStrategy> = new Map();
  private emergencyCache: Map<string, { data: any; timestamp: number; quality: number }> = new Map();
  private performanceHistory: Map<string, { latency: number; successRate: number; lastUpdate: number }> = new Map();
  private fallbackStats: Map<string, { attempts: number; successes: number; failures: number; avgQuality: number }> = new Map();
  
  private readonly EMERGENCY_CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours
  private readonly QUALITY_THRESHOLD = 60; // Minimum acceptable quality score
  private readonly MAX_FUSION_SOURCES = 3; // Maximum sources to fuse data from

  constructor() {
    this.initializeStrategies();
    this.startPerformanceTracking();
    
    // Clean emergency cache periodically
    setInterval(() => this.cleanEmergencyCache(), 60 * 60 * 1000); // Every hour
  }

  /**
   * Initialize fallback strategies for different data types
   */
  private initializeStrategies(): void {
    const strategies: Record<string, FallbackStrategy> = {
      artist: {
        name: 'Artist Data Fallback',
        priority: 1,
        sources: ['spotify', 'lastfm', 'musicbrainz', 'bandcamp', 'xai-fallback'],
        minQualityThreshold: 70,
        maxRetries: 3,
        timeout: 15000,
        emergencyCache: true,
        fusionStrategy: 'best_quality'
      },

      track: {
        name: 'Track Data Fallback',
        priority: 1,
        sources: ['spotify', 'lastfm', 'musicbrainz', 'xai-fallback'],
        minQualityThreshold: 65,
        maxRetries: 3,
        timeout: 12000,
        emergencyCache: true,
        fusionStrategy: 'weighted_average'
      },

      vocabulary: {
        name: 'Vocabulary Data Fallback',
        priority: 2,
        sources: ['datamuse', 'conceptnet', 'poetrydb', 'xai-fallback'],
        minQualityThreshold: 50,
        maxRetries: 2,
        timeout: 10000,
        emergencyCache: true,
        fusionStrategy: 'consensus'
      },

      genre: {
        name: 'Genre Data Fallback',
        priority: 1,
        sources: ['spotify', 'lastfm', 'musicbrainz', 'xai-fallback'],
        minQualityThreshold: 60,
        maxRetries: 3,
        timeout: 8000,
        emergencyCache: true,
        fusionStrategy: 'best_quality'
      },

      lyrics: {
        name: 'Lyric Context Fallback',
        priority: 3,
        sources: ['poetrydb', 'conceptnet', 'xai-fallback'],
        minQualityThreshold: 40,
        maxRetries: 2,
        timeout: 15000,
        emergencyCache: true,
        fusionStrategy: 'first_success'
      }
    };

    for (const [type, strategy] of Object.entries(strategies)) {
      this.strategies.set(type, strategy);
    }

    secureLog.info('✅ Initialized API fallback strategies:', Object.keys(strategies));
  }

  /**
   * Execute fallback strategy for artist data
   */
  async getArtistData(
    query: string,
    primarySource: string = 'spotify',
    options: { allowFusion?: boolean; emergencyMode?: boolean } = {}
  ): Promise<FallbackResult<NormalizedArtist[]>> {
    const strategy = this.strategies.get('artist')!;
    const operationId = `fallback-artist-${Date.now()}`;
    
    performanceMonitor.startOperation(operationId, 'artist-fallback', {
      query,
      primarySource,
      options
    });

    const startTime = Date.now();
    const fallbackChain: string[] = [];
    const successfulSources: string[] = [];
    const failedSources: string[] = [];
    const results: Array<{ data: NormalizedArtist[]; quality: number; source: string }> = [];

    try {
      // Order sources by performance and preference
      const orderedSources = this.orderSourcesByPerformance(strategy.sources, primarySource);
      
      for (const source of orderedSources) {
        fallbackChain.push(source);
        
        try {
          secureLog.debug(`Attempting artist data from ${source} for query: ${query}`);
          
          const rawData = await this.fetchFromSource(source, 'artist', query, strategy.timeout);
          
          if (rawData) {
            const normalizedData = Array.isArray(rawData) 
              ? rawData.map(item => dataNormalizer.normalizeArtist(item, source))
              : [dataNormalizer.normalizeArtist(rawData, source)];
            
            const quality = this.calculateAggregateQuality(normalizedData);
            
            results.push({ data: normalizedData, quality, source });
            successfulSources.push(source);
            
            secureLog.info(`✅ ${source} provided ${normalizedData.length} artists with quality ${quality}`);
            
            // If quality is sufficient and fusion not requested, return immediately
            if (quality >= strategy.minQualityThreshold && !options.allowFusion) {
              break;
            }
            
            // For fusion, continue collecting from other sources
            if (options.allowFusion && results.length < this.MAX_FUSION_SOURCES) {
              continue;
            }
            
            break;
          }
        } catch (error) {
          secureLog.warn(`Source ${source} failed for artist query "${query}":`, error);
          failedSources.push(source);
          this.updatePerformanceHistory(source, false);
        }
      }

      // If no results and emergency mode allowed, try emergency cache
      if (results.length === 0 && strategy.emergencyCache) {
        const cached = this.getFromEmergencyCache(`artist-${query}`);
        if (cached) {
          const normalizedData = Array.isArray(cached.data) 
            ? cached.data.map(item => dataNormalizer.normalizeArtist(item, 'emergency-cache'))
            : [dataNormalizer.normalizeArtist(cached.data, 'emergency-cache')];
          
          results.push({ 
            data: normalizedData, 
            quality: cached.quality * 0.8, // Reduce quality for cache
            source: 'emergency-cache' 
          });
          
          secureLog.warn('🆘 Using emergency cache for artist data');
        }
      }

      if (results.length === 0) {
        throw new Error(`All fallback sources failed for artist query: ${query}`);
      }

      // Fuse results if multiple sources available
      let finalData: NormalizedArtist[];
      let fusionUsed = false;
      
      if (results.length > 1 && options.allowFusion) {
        finalData = this.fuseArtistData(results, strategy.fusionStrategy);
        fusionUsed = true;
      } else {
        // Use best quality result
        const bestResult = results.reduce((best, current) => 
          current.quality > best.quality ? current : best
        );
        finalData = bestResult.data;
      }

      const totalDuration = Date.now() - startTime;
      const avgQuality = results.reduce((sum, r) => sum + r.quality, 0) / results.length;
      
      // Cache successful results for emergency use
      if (avgQuality >= this.QUALITY_THRESHOLD) {
        this.setEmergencyCache(`artist-${query}`, finalData, avgQuality);
      }

      // Update statistics
      this.updateFallbackStats('artist', true, avgQuality);
      performanceMonitor.endOperation(operationId);

      return {
        data: finalData,
        source: results.length === 1 ? results[0].source : 'fused',
        quality: avgQuality,
        usedFallback: fallbackChain.length > 1,
        fallbackChain,
        fusionUsed,
        emergencyMode: results.some(r => r.source === 'emergency-cache'),
        performance: {
          totalDuration,
          attempts: fallbackChain.length,
          successfulSources,
          failedSources
        }
      };

    } catch (error) {
      performanceMonitor.endOperation(operationId);
      this.updateFallbackStats('artist', false, 0);
      throw error;
    }
  }

  /**
   * Execute fallback strategy for vocabulary data
   */
  async getVocabularyData(
    query: string,
    context: string = 'general',
    primarySource: string = 'datamuse'
  ): Promise<FallbackResult<NormalizedVocabulary>> {
    const strategy = this.strategies.get('vocabulary')!;
    const operationId = `fallback-vocabulary-${Date.now()}`;
    
    performanceMonitor.startOperation(operationId, 'vocabulary-fallback', {
      query,
      context,
      primarySource
    });

    const startTime = Date.now();
    const fallbackChain: string[] = [];
    const successfulSources: string[] = [];
    const failedSources: string[] = [];
    const results: Array<{ data: NormalizedVocabulary; quality: number; source: string }> = [];

    try {
      const orderedSources = this.orderSourcesByPerformance(strategy.sources, primarySource);
      
      for (const source of orderedSources) {
        fallbackChain.push(source);
        
        try {
          const rawData = await this.fetchFromSource(source, 'vocabulary', query, strategy.timeout, { context });
          
          if (rawData) {
            const normalizedData = dataNormalizer.normalizeVocabulary(rawData, source, context);
            const quality = this.calculateVocabularyQuality(normalizedData);
            
            results.push({ data: normalizedData, quality, source });
            successfulSources.push(source);
            
            if (quality >= strategy.minQualityThreshold) {
              break;
            }
          }
        } catch (error) {
          failedSources.push(source);
          this.updatePerformanceHistory(source, false);
        }
      }

      if (results.length === 0) {
        // Try emergency cache
        const cached = this.getFromEmergencyCache(`vocabulary-${query}-${context}`);
        if (cached) {
          results.push({ 
            data: dataNormalizer.normalizeVocabulary(cached.data, 'emergency-cache', context),
            quality: cached.quality * 0.8,
            source: 'emergency-cache' 
          });
        }
      }

      if (results.length === 0) {
        throw new Error(`All vocabulary sources failed for query: ${query}`);
      }

      const bestResult = results.reduce((best, current) => 
        current.quality > best.quality ? current : best
      );

      const totalDuration = Date.now() - startTime;
      
      // Cache for emergency use
      if (bestResult.quality >= this.QUALITY_THRESHOLD) {
        this.setEmergencyCache(`vocabulary-${query}-${context}`, bestResult.data, bestResult.quality);
      }

      performanceMonitor.endOperation(operationId);

      return {
        data: bestResult.data,
        source: bestResult.source,
        quality: bestResult.quality,
        usedFallback: fallbackChain.length > 1,
        fallbackChain,
        fusionUsed: false,
        emergencyMode: bestResult.source === 'emergency-cache',
        performance: {
          totalDuration,
          attempts: fallbackChain.length,
          successfulSources,
          failedSources
        }
      };

    } catch (error) {
      performanceMonitor.endOperation(operationId);
      throw error;
    }
  }

  /**
   * Intelligent source ordering based on performance history
   */
  private orderSourcesByPerformance(sources: string[], primarySource?: string): string[] {
    const ordered = [...sources];
    
    // Move primary source to front if specified
    if (primarySource && ordered.includes(primarySource)) {
      ordered.splice(ordered.indexOf(primarySource), 1);
      ordered.unshift(primarySource);
    }

    // Sort remaining sources by performance (except first)
    const toSort = ordered.slice(primarySource ? 1 : 0);
    toSort.sort((a, b) => {
      const perfA = this.performanceHistory.get(a);
      const perfB = this.performanceHistory.get(b);
      
      if (!perfA || !perfB) return 0;
      
      // Consider both success rate and latency
      const scoreA = (perfA.successRate / 100) * (1000 / Math.max(perfA.latency, 100));
      const scoreB = (perfB.successRate / 100) * (1000 / Math.max(perfB.latency, 100));
      
      return scoreB - scoreA; // Higher score first
    });

    return primarySource ? [ordered[0], ...toSort] : toSort;
  }

  /**
   * Fetch data from a specific source
   */
  private async fetchFromSource(
    source: string, 
    type: string, 
    query: string, 
    timeout: number,
    options: any = {}
  ): Promise<any> {
    const startTime = Date.now();
    
    try {
      let result;
      
      // Route to appropriate service based on source
      switch (source) {
        case 'spotify':
          result = await this.fetchSpotifyData(type, query, options);
          break;
        case 'lastfm':
          result = await this.fetchLastFmData(type, query, options);
          break;
        case 'datamuse':
          result = await this.fetchDatamuseData(query, options);
          break;
        case 'conceptnet':
          result = await this.fetchConceptNetData(query);
          break;
        case 'poetrydb':
          result = await this.fetchPoetryData(options.context);
          break;
        case 'xai-fallback':
          result = await this.fetchXAIFallback(type, query, options);
          break;
        default:
          throw new Error(`Unknown source: ${source}`);
      }
      
      const latency = Date.now() - startTime;
      this.updatePerformanceHistory(source, true, latency);
      
      return result;
      
    } catch (error) {
      const latency = Date.now() - startTime;
      this.updatePerformanceHistory(source, false, latency);
      throw error;
    }
  }

  /**
   * Source-specific data fetching methods
   */
  private async fetchSpotifyData(type: string, query: string, options: any): Promise<any> {
    const { SpotifyService } = await import('./spotifyService');
    const service = new SpotifyService();
    
    switch (type) {
      case 'artist':
        return service.searchArtists(query, 10);
      case 'track':
        return service.searchTracks(query, 10);
      default:
        return null;
    }
  }

  private async fetchLastFmData(type: string, query: string, options: any): Promise<any> {
    const { LastFmService } = await import('./lastfmService');
    const service = new LastFmService();
    
    switch (type) {
      case 'artist':
        return service.getArtistGenres(query);
      case 'vocabulary':
        return service.getGenreVocabulary(query);
      default:
        return null;
    }
  }

  private async fetchDatamuseData(query: string, options: any): Promise<any> {
    const { DatamuseService } = await import('./datamuseService');
    const service = new DatamuseService();
    
    return service.findWords({
      meansLike: query,
      topics: options.context,
      maxResults: 50
    });
  }

  private async fetchConceptNetData(query: string): Promise<any> {
    const { ConceptNetService } = await import('./conceptNetService');
    const service = new ConceptNetService();
    
    return service.getRelatedConcepts(query, 20);
  }

  private async fetchPoetryData(context: string): Promise<any> {
    const { PoetryDbService } = await import('./poetryDbService');
    const service = new PoetryDbService();
    
    return service.getPoetryContext(context);
  }

  private async fetchXAIFallback(type: string, query: string, options: any): Promise<any> {
    switch (type) {
      case 'artist':
        return xaiFallbackService.generateSpotifyFallback({
          genre: options.context || query,
          type: 'artists',
          count: 10
        });
      case 'vocabulary':
        return xaiFallbackService.generateDatamuseFallback({
          word: query,
          theme: options.context,
          type: 'related',
          count: 30
        });
      default:
        return null;
    }
  }

  /**
   * Fuse artist data from multiple sources
   */
  private fuseArtistData(
    results: Array<{ data: NormalizedArtist[]; quality: number; source: string }>,
    strategy: string
  ): NormalizedArtist[] {
    if (results.length === 1) return results[0].data;

    switch (strategy) {
      case 'best_quality':
        return results.reduce((best, current) => 
          current.quality > best.quality ? current : best
        ).data;

      case 'weighted_average':
        // Combine artists from all sources, weighted by quality
        const allArtists = results.flatMap(r => 
          r.data.map(artist => ({ ...artist, _weight: r.quality }))
        );
        
        // Group by normalized name and merge
        const artistMap = new Map<string, NormalizedArtist & { _weight?: number }>();
        
        for (const artist of allArtists) {
          const existing = artistMap.get(artist.normalizedName);
          if (!existing || (artist._weight || 0) > (existing._weight || 0)) {
            artistMap.set(artist.normalizedName, artist);
          }
        }
        
        return Array.from(artistMap.values()).map(({ _weight, ...artist }) => artist);

      case 'consensus':
        // Find artists that appear in multiple sources
        const nameCount = new Map<string, number>();
        const artistData = new Map<string, NormalizedArtist>();
        
        for (const result of results) {
          for (const artist of result.data) {
            const count = nameCount.get(artist.normalizedName) || 0;
            nameCount.set(artist.normalizedName, count + 1);
            
            // Keep highest quality version
            const existing = artistData.get(artist.normalizedName);
            if (!existing || artist.confidence > existing.confidence) {
              artistData.set(artist.normalizedName, artist);
            }
          }
        }
        
        // Prefer artists that appear in multiple sources
        return Array.from(artistData.entries())
          .sort(([, a], [, b]) => {
            const countA = nameCount.get(a.normalizedName) || 0;
            const countB = nameCount.get(b.normalizedName) || 0;
            if (countA !== countB) return countB - countA;
            return b.confidence - a.confidence;
          })
          .map(([, artist]) => artist)
          .slice(0, 10);

      default:
        return results[0].data;
    }
  }

  /**
   * Calculate quality scores
   */
  private calculateAggregateQuality(data: any[]): number {
    if (!data || data.length === 0) return 0;
    
    const scores = data.map(item => dataNormalizer.calculateDataQuality(item));
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  private calculateVocabularyQuality(vocab: NormalizedVocabulary): number {
    let score = 50;
    
    score += Math.min(30, vocab.words.length * 2); // Up to 30 points for word count
    score += Math.min(20, vocab.concepts.length * 4); // Up to 20 points for concepts
    
    // Average word confidence
    if (vocab.words.length > 0) {
      const avgConfidence = vocab.words.reduce((sum, w) => sum + w.confidence, 0) / vocab.words.length;
      score += avgConfidence * 0.3; // Up to 30 points from confidence
    }
    
    return Math.min(100, score);
  }

  /**
   * Emergency cache management
   */
  private setEmergencyCache(key: string, data: any, quality: number): void {
    this.emergencyCache.set(key, {
      data,
      timestamp: Date.now(),
      quality
    });
  }

  private getFromEmergencyCache(key: string): { data: any; quality: number } | null {
    const cached = this.emergencyCache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.EMERGENCY_CACHE_TTL) {
      this.emergencyCache.delete(key);
      return null;
    }
    
    return { data: cached.data, quality: cached.quality };
  }

  private cleanEmergencyCache(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, cached] of this.emergencyCache.entries()) {
      if (now - cached.timestamp > this.EMERGENCY_CACHE_TTL) {
        this.emergencyCache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      secureLog.debug(`Cleaned ${cleaned} expired emergency cache entries`);
    }
  }

  /**
   * Performance tracking
   */
  private updatePerformanceHistory(source: string, success: boolean, latency: number = 0): void {
    const existing = this.performanceHistory.get(source) || {
      latency: 1000,
      successRate: 50,
      lastUpdate: Date.now()
    };

    // Update with exponential moving average
    existing.latency = existing.latency * 0.8 + latency * 0.2;
    existing.successRate = existing.successRate * 0.9 + (success ? 10 : -5);
    existing.successRate = Math.max(0, Math.min(100, existing.successRate));
    existing.lastUpdate = Date.now();

    this.performanceHistory.set(source, existing);
  }

  private updateFallbackStats(type: string, success: boolean, quality: number): void {
    const existing = this.fallbackStats.get(type) || {
      attempts: 0,
      successes: 0,
      failures: 0,
      avgQuality: 0
    };

    existing.attempts++;
    if (success) {
      existing.successes++;
      existing.avgQuality = (existing.avgQuality * (existing.successes - 1) + quality) / existing.successes;
    } else {
      existing.failures++;
    }

    this.fallbackStats.set(type, existing);
  }

  private startPerformanceTracking(): void {
    setInterval(() => {
      const stats = this.getStatistics();
      secureLog.info('🔄 Fallback Manager Statistics:', stats);
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Get comprehensive statistics
   */
  getStatistics() {
    return {
      performanceHistory: Object.fromEntries(this.performanceHistory),
      fallbackStats: Object.fromEntries(this.fallbackStats),
      emergencyCache: {
        size: this.emergencyCache.size,
        entries: Array.from(this.emergencyCache.keys())
      },
      strategies: Object.fromEntries(this.strategies)
    };
  }

  /**
   * Get health status of all sources
   */
  getHealthStatus() {
    const health: Record<string, any> = {};
    
    for (const [source, perf] of this.performanceHistory.entries()) {
      health[source] = {
        status: perf.successRate > 70 ? 'healthy' : perf.successRate > 30 ? 'degraded' : 'poor',
        successRate: Math.round(perf.successRate),
        avgLatency: Math.round(perf.latency),
        lastUpdate: new Date(perf.lastUpdate).toISOString()
      };
    }
    
    return health;
  }
}

// Export singleton instance
export const apiFallbackManager = new APIFallbackManager();