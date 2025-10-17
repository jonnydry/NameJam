// Unified word filtering system for maximum variety across all generation methods
import { secureLog } from '../../utils/secureLogger';
import { CacheService } from '../cacheService';
import { MAX_RECENT_WORDS_FILTER, WORD_MEMORY_TIMEOUT, VERY_RECENT_WORD_TIMEOUT, RECENT_WORD_TIMEOUT } from './constants';

interface WordTrackingEntry {
  word: string;
  stem: string;
  timestamp: number;
  generationId: string; // Track which generation session
  nameType?: string; // Track name type (band/song) for cross-type filtering
}

export class UnifiedWordFilter {
  private static instance: UnifiedWordFilter;
  private recentWords: Map<string, WordTrackingEntry> = new Map();
  private currentGenerationWords: Set<string> = new Set(); // Track words in current generation
  private generationId = 0; // Track generation sessions
  private cleanupInterval: NodeJS.Timeout | null = null;
  private sessionCache: CacheService<{ recentWords: Map<string, WordTrackingEntry>, generationId: number }>;

  static getInstance(): UnifiedWordFilter {
    if (!UnifiedWordFilter.instance) {
      UnifiedWordFilter.instance = new UnifiedWordFilter();
      // Start periodic cleanup every 2 minutes
      UnifiedWordFilter.instance.startPeriodicCleanup();
    }
    return UnifiedWordFilter.instance;
  }

  constructor() {
    // Initialize session cache with 10 minute TTL for filter state persistence
    this.sessionCache = new CacheService<{ recentWords: Map<string, WordTrackingEntry>, generationId: number }>(600, 100);
  }

  private startPeriodicCleanup(): void {
    // Run cleanup every 2 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldWords();
    }, 2 * 60 * 1000);
    
    secureLog.debug('🔄 Started periodic word filter cleanup (every 2 minutes)');
  }

  // Start a new generation session
  startNewGeneration(sessionId?: string): string {
    this.generationId++;
    this.currentGenerationWords.clear();
    this.cleanupOldWords();
    const genId = `gen_${this.generationId}_${Date.now()}`;
    
    // Load session state if sessionId provided
    if (sessionId) {
      this.loadSessionState(sessionId);
    }
    
    secureLog.debug(`🎯 Starting new generation: ${genId}${sessionId ? ` (session: ${sessionId})` : ''}`);
    return genId;
  }

  // Check if a name should be rejected due to word repetition
  shouldRejectName(name: string, generationId: string, nameType?: string): boolean {
    const words = this.extractWords(name);
    const stems = words.map(w => this.getWordStem(w));
    
    // 1. Check for exact name match in current generation
    const lowerName = name.toLowerCase();
    if (this.currentGenerationWords.has(lowerName)) {
      secureLog.debug(`❌ Rejected "${name}" - exact name already used in current generation`);
      return true;
    }
    
    // 2. Check for significant word overlap in current generation
    const significantWords = this.getSignificantWords(name);
    let currentGenerationOverlap = 0;
    
    for (const word of significantWords) {
      if (this.currentGenerationWords.has(word.toLowerCase())) {
        currentGenerationOverlap++;
        secureLog.debug(`⚠️  Word overlap detected: "${word}" already used in current generation`);
      }
    }
    
    // Allow some overlap but prevent excessive repetition in current generation
    const maxSignificantOverlap = Math.min(2, Math.ceil(significantWords.length * 0.6)); // Allow up to 60% overlap or max 2 words
    if (currentGenerationOverlap >= maxSignificantOverlap) {
      secureLog.debug(`❌ Rejected "${name}" - ${currentGenerationOverlap} significant words already used (max: ${maxSignificantOverlap-1})`);
      return true;
    }
    
    // 3. Check against recent words from previous generations (weighted by recency)
    const recentThreshold = Date.now() - RECENT_WORD_TIMEOUT;
    const veryRecentThreshold = Date.now() - VERY_RECENT_WORD_TIMEOUT;
    
    for (const word of words) {
      const entry = this.recentWords.get(word.toLowerCase());
      if (entry) {
        // Check if this is a cross-type situation (band vs song)
        const isCrossType = nameType && entry.nameType && nameType !== entry.nameType;
        
        // Very recent words (last 2 minutes) = automatic rejection, UNLESS it's cross-type
        if (entry.timestamp > veryRecentThreshold) {
          if (isCrossType) {
            // Be more lenient for cross-type: only 25% chance of rejection
            if (Math.random() < 0.25) {
              secureLog.debug(`❌ Rejected "${name}" - word "${word}" used very recently in different name type (cross-type rejection)`);
              return true;
            } else {
              secureLog.debug(`✅ Allowed "${name}" - word "${word}" used very recently but different name type (cross-type allowance)`);
            }
          } else {
            secureLog.debug(`❌ Rejected "${name}" - word "${word}" used very recently`);
            return true;
          }
        }
        // Recent words (last 10 minutes) = partial rejection (50% chance)
        else if (entry.timestamp > recentThreshold && Math.random() < 0.5) {
          secureLog.debug(`❌ Rejected "${name}" - word "${word}" used recently (random rejection)`);
          return true;
        }
      }
    }
    
    // 4. Check for stem conflicts with recent words
    for (const stem of stems) {
      const entry = this.recentWords.get(stem);
      if (entry && entry.timestamp > veryRecentThreshold) {
        // Check if this is a cross-type situation (band vs song)
        const isCrossType = nameType && entry.nameType && nameType !== entry.nameType;
        
        if (isCrossType) {
          // Be more lenient for cross-type: only 25% chance of rejection  
          if (Math.random() < 0.25) {
            secureLog.debug(`❌ Rejected "${name}" - stem "${stem}" used very recently in different name type (cross-type rejection)`);
            return true;
          } else {
            secureLog.debug(`✅ Allowed "${name}" - stem "${stem}" used very recently but different name type (cross-type allowance)`);
          }
        } else {
          secureLog.debug(`❌ Rejected "${name}" - stem "${stem}" used very recently`);
          return true;
        }
      }
    }
    
    return false;
  }

  // Accept a name and track its words
  acceptName(name: string, generationId: string, nameType?: string, sessionId?: string): void {
    const words = this.extractWords(name);
    const stems = words.map(w => this.getWordStem(w));
    const timestamp = Date.now();
    const lowerName = name.toLowerCase();
    
    // Track full name and significant words in current generation
    this.currentGenerationWords.add(lowerName);
    
    // Track significant words separately for overlap detection
    const significantWords = this.getSignificantWords(name);
    significantWords.forEach(word => this.currentGenerationWords.add(word.toLowerCase()));
    
    // Also track all words and stems for historical tracking
    words.forEach(word => this.currentGenerationWords.add(word.toLowerCase()));
    stems.forEach(stem => this.currentGenerationWords.add(stem));
    
    // Track in recent words history
    [...words, ...stems].forEach(word => {
      this.recentWords.set(word.toLowerCase(), {
        word: word.toLowerCase(),
        stem: this.getWordStem(word),
        timestamp,
        generationId,
        nameType
      });
    });
    
    // Save session state if sessionId provided
    if (sessionId) {
      this.saveSessionState(sessionId);
    }
    
    // Cleanup if needed
    if (this.recentWords.size > MAX_RECENT_WORDS_FILTER) {
      this.cleanupOldWords();
    }
    
    secureLog.debug(`✅ Accepted "${name}" - tracking ${words.length} words + ${stems.length} stems: [${words.join(', ')}]`);
  }

  // Get variety score for a name (higher = more variety)
  getVarietyScore(name: string): number {
    const words = this.extractWords(name);
    let score = 100; // Start with perfect score
    
    // Penalize for current generation conflicts
    for (const word of words) {
      if (this.currentGenerationWords.has(word.toLowerCase())) {
        score -= 50; // Heavy penalty for same-generation conflicts
      }
    }
    
    // Penalize for recent word usage (weighted by time)
    const now = Date.now();
    for (const word of words) {
      const entry = this.recentWords.get(word.toLowerCase());
      if (entry) {
        const ageMinutes = (now - entry.timestamp) / (1000 * 60);
        const penalty = Math.max(0, 30 - ageMinutes); // Penalty decreases over time
        score -= penalty;
      }
    }
    
    return Math.max(0, score);
  }

  // Extract meaningful words from a name (excluding common function words)
  private extractWords(name: string): string[] {
    const allWords = this.getAllWords(name);
    return allWords.filter(word => this.isSignificantWord(word));
  }

  // Get all words from a name
  private getAllWords(name: string): string[] {
    return name
      .toLowerCase()
      .split(/[\s\-_]+/)
      .map(word => word.replace(/[^a-z]/g, ''))
      .filter(word => word.length >= 2); // Include shorter words for analysis
  }

  // Determine if a word is significant for repetition filtering
  private isSignificantWord(word: string): boolean {
    // Function words that are not significant for repetition
    const functionWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
      'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
      'before', 'after', 'above', 'below', 'between', 'among', 'under', 'over',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
      'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
      'can', 'must', 'shall', 'this', 'that', 'these', 'those', 'i', 'you', 
      'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
      'my', 'your', 'his', 'her', 'its', 'our', 'their'
    ]);
    
    // Minor words that don't matter for uniqueness
    const minorWords = new Set([
      'on', 'in', 'at', 'by', 'for', 'with', 'from', 'up', 'down', 'out', 'off',
      'all', 'any', 'some', 'each', 'every', 'many', 'much', 'few', 'little',
      'one', 'two', 'three', 'first', 'last', 'next', 'old', 'new', 'big', 'small'
    ]);
    
    return word.length >= 3 && 
           !functionWords.has(word) && 
           !minorWords.has(word);
  }

  // Get only the most significant words for overlap detection
  private getSignificantWords(name: string): string[] {
    const allWords = this.getAllWords(name);
    return allWords.filter(word => {
      // More restrictive - only content words that really matter for uniqueness
      const veryMinorWords = new Set([
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
        'of', 'with', 'by', 'from', 'up', 'down', 'out', 'off', 'all', 'any', 'some',
        'old', 'new', 'big', 'one', 'two', 'way', 'day', 'man', 'get', 'own', 'say',
        'come', 'good', 'time', 'year', 'work', 'back', 'see', 'go', 'want', 'know'
      ]);
      
      return word.length >= 4 && !veryMinorWords.has(word);
    });
  }

  // Simple word stemming to catch variations
  private getWordStem(word: string): string {
    const w = word.toLowerCase();
    
    // Remove common suffixes
    if (w.endsWith('ing')) return w.slice(0, -3);
    if (w.endsWith('ed')) return w.slice(0, -2);
    if (w.endsWith('er')) return w.slice(0, -2);
    if (w.endsWith('est')) return w.slice(0, -3);
    if (w.endsWith('ly')) return w.slice(0, -2);
    if (w.endsWith('ness')) return w.slice(0, -4);
    if (w.endsWith('ment')) return w.slice(0, -4);
    if (w.endsWith('tion')) return w.slice(0, -4);
    if (w.endsWith('sion')) return w.slice(0, -4);
    if (w.endsWith('ous')) return w.slice(0, -3);
    if (w.endsWith('ful')) return w.slice(0, -3);
    if (w.endsWith('less')) return w.slice(0, -4);
    if (w.endsWith('able')) return w.slice(0, -4);
    if (w.endsWith('ible')) return w.slice(0, -4);
    if (w.endsWith('al')) return w.slice(0, -2);
    if (w.endsWith('ic')) return w.slice(0, -2);
    if (w.endsWith('ive')) return w.slice(0, -3);
    if (w.endsWith('ary')) return w.slice(0, -3);
    if (w.endsWith('ory')) return w.slice(0, -3);
    
    // Remove plural 's' but not if word is too short
    if (w.length > 4 && w.endsWith('s') && !w.endsWith('ss')) {
      return w.slice(0, -1);
    }
    
    return w;
  }

  // Clean up old entries
  private cleanupOldWords(): void {
    const cutoff = Date.now() - WORD_MEMORY_TIMEOUT;
    const initialSize = this.recentWords.size;
    
    for (const [word, entry] of this.recentWords.entries()) {
      if (entry.timestamp < cutoff) {
        this.recentWords.delete(word);
      }
    }
    
    const removedCount = initialSize - this.recentWords.size;
    if (removedCount > 0) {
      secureLog.debug(`🧹 Cleaned up ${removedCount} old words from filter`);
    }
  }

  // Get current statistics
  getStats(): {
    recentWordsCount: number;
    currentGenerationWordsCount: number;
    generationId: number;
    oldestWordAge: number;
  } {
    const now = Date.now();
    let oldestTimestamp = now;
    
    for (const entry of this.recentWords.values()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
      }
    }
    
    return {
      recentWordsCount: this.recentWords.size,
      currentGenerationWordsCount: this.currentGenerationWords.size,
      generationId: this.generationId,
      oldestWordAge: Math.round((now - oldestTimestamp) / (1000 * 60)) // minutes
    };
  }

  // Save session state to cache
  private saveSessionState(sessionId: string): void {
    try {
      const sessionData = {
        recentWords: new Map(this.recentWords),
        generationId: this.generationId
      };
      this.sessionCache.set(`session_${sessionId}`, sessionData);
      secureLog.debug(`💾 Saved session state for ${sessionId}`);
    } catch (error) {
      secureLog.debug(`Failed to save session state for ${sessionId}:`, error);
    }
  }

  // Load session state from cache
  private loadSessionState(sessionId: string): void {
    try {
      const cached = this.sessionCache.get(`session_${sessionId}`);
      if (cached) {
        this.recentWords = new Map(cached.recentWords);
        this.generationId = cached.generationId;
        secureLog.debug(`📂 Loaded session state for ${sessionId} (${this.recentWords.size} words)`);
      }
    } catch (error) {
      secureLog.debug(`Failed to load session state for ${sessionId}:`, error);
    }
  }

  // Force reset (for testing or manual cleanup)
  reset(): void {
    this.recentWords.clear();
    this.currentGenerationWords.clear();
    this.generationId = 0;
    this.sessionCache.clear();
    secureLog.info(`🔄 Word filter reset`);
  }
}

export const unifiedWordFilter = UnifiedWordFilter.getInstance();