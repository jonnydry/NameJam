/**
 * Optimized Context Service - High-performance context aggregation
 * Features: Lazy loading, parallel API calls, intelligent caching, batch requests
 */

import { datamuseService } from './datamuseService';
import { spotifyService } from './spotifyService';
import { secureLog } from '../utils/secureLogger';

interface ContextPriority {
  critical: string[];    // Must-have for generation
  important: string[];   // Enhances quality significantly 
  optional: string[];    // Nice-to-have, can be lazy loaded
}

interface BatchRequest {
  service: string;
  calls: Array<{
    method: string;
    params: any[];
    resolver: (data: any) => void;
    rejector: (error: any) => void;
  }>;
}

export interface OptimizedContext {
  // Core context (loaded immediately)
  genreKeywords: string[];
  moodWords: string[];
  relatedArtists: string[];
  
  // Enhanced context (lazy loaded if needed)
  wordAssociations?: string[];
  genreTags?: string[];
  audioCharacteristics?: string[];
  culturalReferences?: string[];
  
  // Metadata
  loadTime: number;
  cacheHit: boolean;
  contextDepth: 'minimal' | 'standard' | 'comprehensive';
}

export class OptimizedContextService {
  private contextCache = new Map<string, { context: OptimizedContext; timestamp: number; ttl: number }>();
  private batchQueue = new Map<string, BatchRequest>();
  private batchTimeout: NodeJS.Timeout | null = null;
  
  // Performance monitoring
  private stats = {
    cacheHits: 0,
    cacheMisses: 0,
    avgLoadTime: 0,
    parallelCalls: 0
  };

  constructor() {
    // Clean cache every 5 minutes
    setInterval(() => this.cleanExpiredCache(), 5 * 60 * 1000);
  }

  async getContext(
    genre: string | undefined,
    mood: string | undefined,
    priority: 'speed' | 'quality' = 'quality',
    maxWaitTime: number = 5000
  ): Promise<OptimizedContext> {
    const startTime = Date.now();
    const cacheKey = `${genre || 'none'}-${mood || 'none'}-${priority}`;
    
    // Check cache first
    const cached = this.getCachedContext(cacheKey);
    if (cached) {
      this.stats.cacheHits++;
      cached.loadTime = Date.now() - startTime;
      cached.cacheHit = true;
      return cached;
    }
    
    this.stats.cacheMisses++;
    
    // Determine context strategy based on priority
    const contextStrategy = this.getContextStrategy(priority);
    
    // Execute context gathering with timeout
    const context = await Promise.race([
      this.gatherContextByPriority(genre, mood, contextStrategy),
      this.createTimeoutPromise(maxWaitTime)
    ]);
    
    const loadTime = Date.now() - startTime;
    context.loadTime = loadTime;
    context.cacheHit = false;
    
    // Cache the result
    this.cacheContext(cacheKey, context, this.getCacheTTL(priority));
    
    // Update stats
    this.updateStats(loadTime);
    
    return context;
  }

  private async gatherContextByPriority(
    genre: string | undefined,
    mood: string | undefined,
    strategy: ContextPriority
  ): Promise<OptimizedContext> {
    // Use consistent defaults when none specified to enable caching
    // FIXED: Random selection was breaking cache (different key each time)
    let actualGenre = genre;
    let actualMood = mood;
    
    if (!genre && !mood) {
      // Use a deterministic default based on time to provide variety while maintaining cache effectiveness
      const timeBasedIndex = Math.floor(Date.now() / (5 * 60 * 1000)) % 6; // Rotate every 5 minutes
      const defaultGenres = ['indie', 'rock', 'electronic', 'pop', 'folk', 'jazz'];
      actualGenre = defaultGenres[timeBasedIndex];
      secureLog.debug(`[OptimizedContext] Using time-based default genre: ${actualGenre} for cache efficiency`);
    }

    const context: OptimizedContext = {
      genreKeywords: [],
      moodWords: [],
      relatedArtists: [],
      loadTime: 0,
      cacheHit: false,
      contextDepth: 'standard'
    };

    // Phase 1: Critical context (parallel, must complete)
    const criticalPromises = [];
    
    if (actualGenre && strategy.critical.includes('genreKeywords')) {
      criticalPromises.push(
        this.batchDatamuseCall('findSimilarWords', [actualGenre, 8])
          .then((words: any[]) => {
            context.genreKeywords = words.map((w: any) => w.word || w);
          })
          .catch(() => {
            context.genreKeywords = this.getFallbackGenreKeywords(actualGenre);
          })
      );
    }
    
    if (actualGenre && strategy.critical.includes('relatedArtists')) {
      criticalPromises.push(
        spotifyService.getGenreArtists(actualGenre, 4)
          .then((artists: any[]) => {
            context.relatedArtists = artists.map((a: any) => a.name);
          })
          .catch(() => {
            context.relatedArtists = [];
          })
      );
    }
    
    if (actualMood && strategy.critical.includes('moodWords')) {
      criticalPromises.push(
        this.batchDatamuseCall('findSimilarWords', [actualMood, 6])
          .then((words: any[]) => {
            context.moodWords = words.map((w: any) => w.word || w);
          })
          .catch(() => {
            context.moodWords = this.getFallbackMoodWords(actualMood);
          })
      );
    }

    // Wait for critical context
    await Promise.all(criticalPromises);
    
    // Phase 2: Important context (parallel, best effort)
    const importantPromises = [];
    
    if (actualGenre && strategy.important.includes('wordAssociations')) {
      importantPromises.push(
        this.batchDatamuseCall('findAdjectivesForNoun', [actualGenre, 6])
          .then((adjectives: any[]) => {
            context.wordAssociations = adjectives.map((a: any) => a.word || a);
          })
          .catch(() => {
            context.wordAssociations = [];
          })
      );
    }
    
    if (actualGenre && strategy.important.includes('genreTags')) {
      // Genre tags now provided by static fallback (Last.fm removed)
      context.genreTags = [];
    }

    // Execute important context with shorter timeout
    try {
      await Promise.race([
        Promise.all(importantPromises),
        new Promise(resolve => setTimeout(resolve, 2000)) // 2s timeout for important
      ]);
    } catch (error) {
      secureLog.debug('Some important context failed, continuing with critical context');
    }
    
    // Phase 3: Optional context (lazy loaded separately if needed)
    this.lazyLoadOptionalContext(context, actualGenre, actualMood, strategy.optional);
    
    return context;
  }

  private async lazyLoadOptionalContext(
    context: OptimizedContext,
    genre: string | undefined,
    mood: string | undefined,
    optionalFields: string[]
  ): Promise<void> {
    // Run in background, don't block main response
    setTimeout(async () => {
      const optionalPromises = [];
      
      if (genre && optionalFields.includes('audioCharacteristics')) {
        context.audioCharacteristics = this.getAudioCharacteristics(genre);
      }
      
      if (genre && optionalFields.includes('culturalReferences')) {
        // Cultural references now handled by XAI fallback (Last.fm removed)
        context.culturalReferences = [];
      }
      
      if (optionalPromises.length > 0) {
        await Promise.allSettled(optionalPromises);
        secureLog.debug('Lazy loaded optional context');
      }
    }, 100); // Start lazy loading after 100ms
  }

  private getContextStrategy(priority: 'speed' | 'quality'): ContextPriority {
    if (priority === 'speed') {
      return {
        critical: ['genreKeywords', 'moodWords'],
        important: ['relatedArtists'],
        optional: ['wordAssociations', 'genreTags']
      };
    } else {
      return {
        critical: ['genreKeywords', 'moodWords', 'relatedArtists'],
        important: ['wordAssociations', 'genreTags'],
        optional: ['audioCharacteristics', 'culturalReferences']
      };
    }
  }

  private async batchDatamuseCall(method: string, params: any[]): Promise<any> {
    return new Promise((resolve, reject) => {
      const serviceKey = 'datamuse';
      
      if (!this.batchQueue.has(serviceKey)) {
        this.batchQueue.set(serviceKey, {
          service: serviceKey,
          calls: []
        });
      }
      
      const batch = this.batchQueue.get(serviceKey)!;
      batch.calls.push({
        method,
        params,
        resolver: resolve,
        rejector: reject
      });
      
      // Process batch after 20ms or when it reaches 5 calls
      if (batch.calls.length >= 5 || !this.batchTimeout) {
        this.batchTimeout = setTimeout(() => this.processBatch(serviceKey), 20);
      }
    });
  }

  private async processBatch(serviceKey: string): Promise<void> {
    const batch = this.batchQueue.get(serviceKey);
    if (!batch || batch.calls.length === 0) return;
    
    this.batchQueue.delete(serviceKey);
    this.batchTimeout = null;
    this.stats.parallelCalls += batch.calls.length;
    
    // Execute all calls in parallel
    const promises = batch.calls.map(async (call) => {
      try {
        let result;
        if (call.method === 'findSimilarWords') {
          result = await datamuseService.findSimilarWords(call.params[0], call.params[1]);
        } else if (call.method === 'findAdjectivesForNoun') {
          result = await datamuseService.findAdjectivesForNoun(call.params[0], call.params[1]);
        } else {
          throw new Error(`Unknown method: ${call.method}`);
        }
        call.resolver(result);
      } catch (error) {
        call.rejector(error);
      }
    });
    
    await Promise.allSettled(promises);
  }

  private createTimeoutPromise(maxWaitTime: number): Promise<OptimizedContext> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Context loading timeout after ${maxWaitTime}ms`));
      }, maxWaitTime);
    });
  }

  private getCachedContext(cacheKey: string): OptimizedContext | null {
    const cached = this.contextCache.get(cacheKey);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.contextCache.delete(cacheKey);
      return null;
    }
    
    return { ...cached.context };
  }

  private cacheContext(cacheKey: string, context: OptimizedContext, ttl: number): void {
    this.contextCache.set(cacheKey, {
      context: { ...context },
      timestamp: Date.now(),
      ttl
    });
  }

  private getCacheTTL(priority: 'speed' | 'quality'): number {
    return priority === 'speed' ? 30 * 60 * 1000 : 15 * 60 * 1000; // 30min vs 15min
  }

  private cleanExpiredCache(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, cached] of this.contextCache.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        this.contextCache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      secureLog.debug(`Cleaned ${cleaned} expired cache entries`);
    }
  }

  private updateStats(loadTime: number): void {
    this.stats.avgLoadTime = (this.stats.avgLoadTime + loadTime) / 2;
  }

  // Fallback methods for when APIs fail
  private getFallbackGenreKeywords(genre: string): string[] {
    const fallbacks: Record<string, string[]> = {
      'rock': ['guitar', 'drums', 'electric', 'loud', 'energy'],
      'pop': ['catchy', 'mainstream', 'radio', 'melody', 'dance'],
      'jazz': ['improvisation', 'swing', 'blues', 'smooth', 'sophisticated'],
      'country': ['acoustic', 'rural', 'storytelling', 'folk', 'americana'],
      'electronic': ['synthesizer', 'digital', 'beats', 'techno', 'ambient']
    };
    return fallbacks[genre.toLowerCase()] || ['music', 'sound', 'rhythm', 'harmony'];
  }

  private getFallbackMoodWords(mood: string): string[] {
    const fallbacks: Record<string, string[]> = {
      'happy': ['joyful', 'upbeat', 'cheerful', 'bright'],
      'sad': ['melancholy', 'somber', 'blue', 'mournful'],
      'energetic': ['dynamic', 'powerful', 'intense', 'vibrant'],
      'calm': ['peaceful', 'serene', 'gentle', 'tranquil']
    };
    return fallbacks[mood.toLowerCase()] || ['expressive', 'emotional'];
  }

  private getAudioCharacteristics(genre: string): string[] {
    const characteristics: Record<string, string[]> = {
      'rock': ['distorted', 'amplified', 'rhythmic', 'powerful'],
      'jazz': ['improvisational', 'complex', 'syncopated', 'sophisticated'],
      'electronic': ['synthesized', 'programmed', 'layered', 'digital'],
      'folk': ['acoustic', 'organic', 'traditional', 'intimate']
    };
    return characteristics[genre.toLowerCase()] || ['musical', 'harmonic'];
  }

  private extractCulturalReferences(words: string[]): string[] {
    return words.filter(word => 
      word.length > 3 && 
      !['music', 'song', 'band', 'artist'].includes(word.toLowerCase())
    ).slice(0, 4);
  }

  hasCachedContext(cacheKey: string): boolean {
    const cached = this.contextCache.get(cacheKey);
    if (!cached) return false;
    
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.contextCache.delete(cacheKey);
      return false;
    }
    
    return true;
  }

  getStats() {
    return {
      ...this.stats,
      cacheSize: this.contextCache.size,
      cacheHitRate: this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses) * 100
    };
  }
}

export const optimizedContextService = new OptimizedContextService();