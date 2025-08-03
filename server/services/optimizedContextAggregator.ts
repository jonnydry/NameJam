/**
 * Optimized Context Aggregator with caching and performance improvements
 */

import { ContextAggregatorService, EnrichedContext } from './contextAggregator';
import { secureLog } from '../utils/secureLogger';
import NodeCache from 'node-cache';

export class OptimizedContextAggregatorService extends ContextAggregatorService {
  private cache: NodeCache;
  
  constructor() {
    super();
    // Cache for 5 minutes
    this.cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });
  }
  
  async aggregateContext(params: any): Promise<EnrichedContext> {
    const { genre, mood } = params;
    const cacheKey = `${genre || 'general'}:${mood || 'neutral'}`;
    
    // Check cache first
    const cached = this.cache.get<EnrichedContext>(cacheKey);
    if (cached) {
      secureLog.info(`📦 Using cached context for ${cacheKey}`);
      return cached;
    }
    
    // Skip heavy API calls for general genre
    if (!genre || genre === 'general') {
      secureLog.info('⚡ Using minimal context for general genre');
      const minimalContext = this.getMinimalContext(mood || 'neutral');
      this.cache.set(cacheKey, minimalContext);
      return minimalContext;
    }
    
    // Get context with timeout for each API
    const startTime = Date.now();
    const context = await super.aggregateContext(params);
    const duration = Date.now() - startTime;
    
    secureLog.info(`⏱️ Context aggregation took ${duration}ms`);
    
    // Cache the result
    this.cache.set(cacheKey, context);
    
    return context;
  }
  
  private getMinimalContext(mood: string): EnrichedContext {
    return {
      spotifyArtists: [],
      spotifyTracks: [],
      lastfmTags: ['music', 'band', 'song', 'artist'],
      lastfmSimilarArtists: [],
      conceptNetAssociations: ['creative', 'artistic', 'melodic', 'rhythmic'],
      datamuseWords: {
        related: ['sound', 'melody', 'harmony', 'rhythm'],
        rhymes: [],
        similar: ['tune', 'composition', 'piece'],
        adjectives: ['musical', 'lyrical', 'harmonic']
      },
      poetryVocabulary: ['dream', 'soul', 'heart', 'light'],
      genreCharacteristics: ['universal', 'diverse'],
      moodDescriptors: [mood, 'expressive'],
      musicalTerms: ['song', 'band', 'music', 'sound', 'rhythm', 'melody'],
      culturalReferences: [],
      primaryGenre: 'general',
      primaryMood: mood,
      contextQuality: 'basic'
    };
  }
}