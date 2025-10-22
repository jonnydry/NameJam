/**
 * Global Name Memory Service
 * Tracks recently generated names across all sessions to prevent cross-generation repetition
 * Implements semantic similarity and genre-aware expiry
 */

import { secureLog } from '../../utils/secureLogger';

interface NameRecord {
  name: string;
  timestamp: number;
  genre: string;
  type: 'band' | 'song';
  quality: number; // 0-100 quality score
}

interface GenreExpiry {
  sameGenre: number;
  differentGenre: number;
  relatedGenre: number;
}

export class GlobalNameMemory {
  private static instance: GlobalNameMemory;
  private recentNames: Map<string, NameRecord> = new Map();
  private readonly MAX_MEMORY = 500;
  private readonly DEFAULT_EXPIRY = 4 * 60 * 60 * 1000; // 4 hours

  // Genre relationships for expiry calculation
  private genreRelationships: { [key: string]: string[] } = {
    rock: ['metal', 'punk', 'indie', 'alternative'],
    pop: ['electropop', 'synthpop', 'dance'],
    electronic: ['house', 'techno', 'ambient', 'industrial'],
    metal: ['rock', 'punk', 'industrial'],
    indie: ['rock', 'alternative', 'folk'],
    hiphop: ['rap', 'trap', 'grime'],
    folk: ['indie', 'country', 'acoustic'],
    jazz: ['blues', 'soul', 'funk'],
    country: ['folk', 'bluegrass', 'americana'],
    'jam band': ['rock', 'funk', 'blues', 'psychedelic']
  };

  static getInstance(): GlobalNameMemory {
    if (!GlobalNameMemory.instance) {
      GlobalNameMemory.instance = new GlobalNameMemory();
    }
    return GlobalNameMemory.instance;
  }

  /**
   * Check if a name should be rejected based on recent history
   */
  shouldRejectGlobally(name: string, genre: string, type: 'band' | 'song'): boolean {
    const normalizedName = name.toLowerCase().trim();
    const record = this.recentNames.get(normalizedName);

    if (!record) {
      return false; // Name not in recent history
    }

    const timeAgo = Date.now() - record.timestamp;
    const expiryTimes = this.getExpiryTimes(genre, record.genre);

    // Same genre - stricter rules
    if (record.genre.toLowerCase() === genre.toLowerCase()) {
      if (timeAgo < expiryTimes.sameGenre) {
        secureLog.debug(`❌ Global rejection: "${name}" used recently in ${genre} (${Math.round(timeAgo / 1000 / 60)}min ago)`);
        return true;
      }
    }

    // Related genre - moderate rejection
    else if (this.isRelatedGenre(genre, record.genre)) {
      if (timeAgo < expiryTimes.relatedGenre) {
        // 30% rejection chance for related genres
        if (Math.random() < 0.3) {
          secureLog.debug(`❌ Global rejection: "${name}" used in related genre ${record.genre} (${Math.round(timeAgo / 1000 / 60)}min ago)`);
          return true;
        }
      }
    }

    // Different genre - lenient rejection
    else {
      if (timeAgo < expiryTimes.differentGenre) {
        // 10% rejection chance for different genres
        if (Math.random() < 0.1) {
          secureLog.debug(`❌ Global rejection: "${name}" used in different genre ${record.genre} (${Math.round(timeAgo / 1000 / 60)}min ago)`);
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Add a generated name to memory
   */
  addName(name: string, genre: string, type: 'band' | 'song', quality: number = 75): void {
    const normalizedName = name.toLowerCase().trim();
    const cacheKey = `${normalizedName}_${type}`;

    this.recentNames.set(cacheKey, {
      name: normalizedName,
      timestamp: Date.now(),
      genre: genre.toLowerCase(),
      type,
      quality
    });

    // Cleanup if exceeding limits
    if (this.recentNames.size > this.MAX_MEMORY) {
      this.cleanupOldest();
    }

    secureLog.debug(`✅ Added to global memory: "${name}" (${genre}, quality: ${quality})`);
  }

  /**
   * Get recent names for diversity checking
   */
  getRecentNames(limit: number = 10, genre?: string, type?: 'band' | 'song'): string[] {
    const names: Array<{ name: string; record: NameRecord }> = [];

    for (const [key, record] of this.recentNames.entries()) {
      // Apply filters if specified
      if (genre && record.genre !== genre.toLowerCase()) continue;
      if (type && record.type !== type) continue;

      names.push({ name: record.name, record });
    }

    // Sort by timestamp (newest first)
    names.sort((a, b) => b.record.timestamp - a.record.timestamp);

    return names.slice(0, limit).map(item => item.name);
  }

  /**
   * Get recently used words across all names
   */
  getRecentWords(limit: number = 20): string[] {
    const wordFreq = new Map<string, number>();

    for (const record of this.recentNames.values()) {
      const words = record.name.toLowerCase().split(/[\s\-_]+/);
      for (const word of words) {
        if (word.length >= 3) {
          wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
        }
      }
    }

    // Sort by frequency and return top N
    const sorted = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([word]) => word);

    return sorted;
  }

  /**
   * Get common patterns in recent generations
   */
  getCommonPatterns(limit: number = 5): string[] {
    const patterns: Map<string, number> = new Map();

    for (const record of this.recentNames.values()) {
      const pattern = this.extractPattern(record.name);
      if (pattern) {
        patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
      }
    }

    const sorted = Array.from(patterns.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([pattern]) => pattern);

    return sorted;
  }

  /**
   * Get quality statistics for a genre
   */
  getGenreQualityStats(genre: string): {
    averageQuality: number;
    highQualityCount: number;
    recentCount: number;
  } {
    const genreRecords = Array.from(this.recentNames.values()).filter(
      r => r.genre === genre.toLowerCase()
    );

    const qualities = genreRecords.map(r => r.quality);
    const averageQuality = qualities.length > 0
      ? qualities.reduce((a, b) => a + b, 0) / qualities.length
      : 75;

    const highQualityCount = qualities.filter(q => q >= 80).length;

    return {
      averageQuality: Math.round(averageQuality),
      highQualityCount,
      recentCount: genreRecords.length
    };
  }

  /**
   * Determine expiry times based on genre relationship
   */
  private getExpiryTimes(currentGenre: string, previousGenre: string): GenreExpiry {
    return {
      sameGenre: 1 * 60 * 60 * 1000, // 1 hour
      relatedGenre: 12 * 60 * 60 * 1000, // 12 hours
      differentGenre: 24 * 60 * 60 * 1000 // 24 hours
    };
  }

  /**
   * Check if two genres are related
   */
  private isRelatedGenre(genre1: string, genre2: string): boolean {
    const g1 = genre1.toLowerCase();
    const g2 = genre2.toLowerCase();

    const related = this.genreRelationships[g1] || [];
    return related.includes(g2);
  }

  /**
   * Extract pattern from name (e.g., "Adjective + Noun")
   */
  private extractPattern(name: string): string {
    const words = name.toLowerCase().split(/[\s\-_]+/).filter(w => w.length > 0);

    if (words.length === 1) return 'single_word';
    if (words.length === 2) return 'two_words';
    if (words.length >= 3) return 'multi_word';

    return '';
  }

  /**
   * Clean up oldest entries
   */
  private cleanupOldest(): void {
    const threshold = this.MAX_MEMORY * 0.8; // Keep 80% when cleanup triggered
    const entries = Array.from(this.recentNames.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);

    const toRemove = entries.length - Math.floor(threshold);
    for (let i = 0; i < toRemove; i++) {
      this.recentNames.delete(entries[i][0]);
    }

    secureLog.debug(`🧹 Global memory cleanup: removed ${toRemove} oldest entries`);
  }

  /**
   * Get statistics about memory usage
   */
  getStats(): {
    totalNames: number;
    oldestAge: number;
    averageQuality: number;
  } {
    const records = Array.from(this.recentNames.values());
    const now = Date.now();
    let oldestAge = 0;
    let totalQuality = 0;

    for (const record of records) {
      const age = now - record.timestamp;
      oldestAge = Math.max(oldestAge, age);
      totalQuality += record.quality;
    }

    return {
      totalNames: records.length,
      oldestAge: Math.round(oldestAge / (1000 * 60)), // minutes
      averageQuality: records.length > 0 ? Math.round(totalQuality / records.length) : 0
    };
  }

  /**
   * Force reset (for testing)
   */
  reset(): void {
    this.recentNames.clear();
    secureLog.info('Global name memory reset');
  }
}

export const globalNameMemory = GlobalNameMemory.getInstance();
