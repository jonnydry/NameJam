// Unified word filtering system for maximum variety across all generation methods
import { secureLog } from '../../utils/secureLogger';

interface WordTrackingEntry {
  word: string;
  stem: string;
  timestamp: number;
  generationId: string; // Track which generation session
}

export class UnifiedWordFilter {
  private static instance: UnifiedWordFilter;
  private recentWords: Map<string, WordTrackingEntry> = new Map();
  private currentGenerationWords: Set<string> = new Set(); // Track words in current generation
  private maxRecentWords = 150; // Increased for better variety
  private generationId = 0; // Track generation sessions
  private maxGenerationAge = 1000 * 60 * 30; // 30 minutes retention

  static getInstance(): UnifiedWordFilter {
    if (!UnifiedWordFilter.instance) {
      UnifiedWordFilter.instance = new UnifiedWordFilter();
    }
    return UnifiedWordFilter.instance;
  }

  // Start a new generation session
  startNewGeneration(): string {
    this.generationId++;
    this.currentGenerationWords.clear();
    this.cleanupOldWords();
    const genId = `gen_${this.generationId}_${Date.now()}`;
    secureLog.debug(`🎯 Starting new generation: ${genId}`);
    return genId;
  }

  // Check if a name should be rejected due to word repetition
  shouldRejectName(name: string, generationId: string): boolean {
    const words = this.extractWords(name);
    const stems = words.map(w => this.getWordStem(w));
    
    // 1. Check for words already used in current generation (within the 4 results)
    for (const word of words) {
      if (this.currentGenerationWords.has(word.toLowerCase())) {
        secureLog.debug(`❌ Rejected "${name}" - word "${word}" already used in current generation`);
        return true;
      }
    }
    
    // 2. Check for stems already used in current generation
    for (const stem of stems) {
      if (this.currentGenerationWords.has(stem)) {
        secureLog.debug(`❌ Rejected "${name}" - stem "${stem}" already used in current generation`);
        return true;
      }
    }
    
    // 3. Check against recent words from previous generations (weighted by recency)
    const recentThreshold = Date.now() - (1000 * 60 * 10); // Last 10 minutes
    const veryRecentThreshold = Date.now() - (1000 * 60 * 2); // Last 2 minutes
    
    for (const word of words) {
      const entry = this.recentWords.get(word.toLowerCase());
      if (entry) {
        // Very recent words (last 2 minutes) = automatic rejection
        if (entry.timestamp > veryRecentThreshold) {
          secureLog.debug(`❌ Rejected "${name}" - word "${word}" used very recently`);
          return true;
        }
        // Recent words (last 10 minutes) = partial rejection (50% chance)
        if (entry.timestamp > recentThreshold && Math.random() < 0.5) {
          secureLog.debug(`❌ Rejected "${name}" - word "${word}" used recently (random rejection)`);
          return true;
        }
      }
    }
    
    // 4. Check for stem conflicts with recent words
    for (const stem of stems) {
      const entry = this.recentWords.get(stem);
      if (entry && entry.timestamp > veryRecentThreshold) {
        secureLog.debug(`❌ Rejected "${name}" - stem "${stem}" used very recently`);
        return true;
      }
    }
    
    return false;
  }

  // Accept a name and track its words
  acceptName(name: string, generationId: string): void {
    const words = this.extractWords(name);
    const stems = words.map(w => this.getWordStem(w));
    const timestamp = Date.now();
    
    // Track in current generation
    words.forEach(word => this.currentGenerationWords.add(word.toLowerCase()));
    stems.forEach(stem => this.currentGenerationWords.add(stem));
    
    // Track in recent words history
    [...words, ...stems].forEach(word => {
      this.recentWords.set(word.toLowerCase(), {
        word: word.toLowerCase(),
        stem: this.getWordStem(word),
        timestamp,
        generationId
      });
    });
    
    // Cleanup if needed
    if (this.recentWords.size > this.maxRecentWords) {
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
    // Common function words that should not be filtered
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
    
    return name
      .toLowerCase()
      .split(/[\s\-_]+/)
      .map(word => word.replace(/[^a-z]/g, ''))
      .filter(word => 
        word.length >= 3 && // Only track meaningful words
        !functionWords.has(word) // Exclude common function words
      );
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
    const cutoff = Date.now() - this.maxGenerationAge;
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

  // Force reset (for testing or manual cleanup)
  reset(): void {
    this.recentWords.clear();
    this.currentGenerationWords.clear();
    this.generationId = 0;
    secureLog.info(`🔄 Word filter reset`);
  }
}

export const unifiedWordFilter = UnifiedWordFilter.getInstance();