/**
 * Data Normalization Pipeline for NameJam
 * 
 * Provides consistent data processing and format standardization across all APIs:
 * - Genre classification normalization
 * - Vocabulary standardization and term mapping
 * - Data structure consistency
 * - Quality filtering and validation
 * - Cross-API data enrichment and fusion
 */

import { secureLog } from '../utils/secureLogger';
import { metaphone } from 'metaphone';
import natural from 'natural';

export interface NormalizedArtist {
  id: string;
  name: string;
  normalizedName: string;
  genres: string[];
  normalizedGenres: string[];
  popularity: number;
  source: string;
  confidence: number;
  metadata: Record<string, any>;
}

export interface NormalizedTrack {
  id: string;
  name: string;
  normalizedName: string;
  artists: NormalizedArtist[];
  genres: string[];
  normalizedGenres: string[];
  popularity: number;
  source: string;
  confidence: number;
  metadata: Record<string, any>;
}

export interface NormalizedVocabulary {
  words: Array<{
    word: string;
    normalizedWord: string;
    type: 'adjective' | 'noun' | 'verb' | 'concept';
    score: number;
    themes: string[];
    phonetic: string;
    syllables: number;
    source: string;
    confidence: number;
  }>;
  concepts: Array<{
    concept: string;
    relatedWords: string[];
    strength: number;
    source: string;
  }>;
}

export interface NormalizedGenreData {
  primaryGenre: string;
  subgenres: string[];
  relatedGenres: string[];
  descriptors: string[];
  moodTags: string[];
  era: string | null;
  confidence: number;
}

export class DataNormalizationPipeline {
  private genreMapping: Map<string, string> = new Map();
  private vocabularyCache: Map<string, NormalizedVocabulary> = new Map();
  private phonemicCache: Map<string, string> = new Map();
  private stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'among', 'around']);

  constructor() {
    this.initializeGenreMappings();
    this.initializeVocabularyMappings();
  }

  /**
   * Initialize genre mapping for normalization
   */
  private initializeGenreMappings(): void {
    const mappings: Array<[string[], string]> = [
      // Rock variations
      [['rock', 'rock music', 'rock and roll', 'rock n roll', 'classic rock'], 'rock'],
      [['alternative rock', 'alt rock', 'alternative'], 'alternative-rock'],
      [['indie rock', 'indie'], 'indie-rock'],
      [['punk rock', 'punk'], 'punk'],
      [['hard rock'], 'hard-rock'],
      [['progressive rock', 'prog rock'], 'progressive-rock'],
      
      // Electronic variations
      [['electronic', 'electronic music', 'edm'], 'electronic'],
      [['house', 'house music'], 'house'],
      [['techno', 'techno music'], 'techno'],
      [['ambient', 'ambient music'], 'ambient'],
      [['drum and bass', 'dnb', 'd&b'], 'drum-and-bass'],
      [['dubstep'], 'dubstep'],
      
      // Hip-hop variations
      [['hip-hop', 'hip hop', 'rap', 'rap music'], 'hip-hop'],
      [['trap', 'trap music'], 'trap'],
      
      // Pop variations
      [['pop', 'pop music', 'popular music'], 'pop'],
      [['pop rock'], 'pop-rock'],
      [['indie pop'], 'indie-pop'],
      
      // Jazz variations
      [['jazz', 'jazz music'], 'jazz'],
      [['smooth jazz'], 'smooth-jazz'],
      [['jazz fusion', 'fusion'], 'jazz-fusion'],
      
      // Folk variations
      [['folk', 'folk music'], 'folk'],
      [['indie folk'], 'indie-folk'],
      [['country', 'country music'], 'country'],
      
      // Metal variations
      [['metal', 'heavy metal'], 'metal'],
      [['death metal'], 'death-metal'],
      [['black metal'], 'black-metal'],
      [['thrash metal'], 'thrash-metal'],
      
      // Blues variations
      [['blues', 'blues music'], 'blues'],
      [['rhythm and blues', 'r&b', 'rnb'], 'r-and-b'],
      
      // Classical variations
      [['classical', 'classical music'], 'classical'],
      [['orchestral'], 'orchestral'],
      
      // World music variations
      [['reggae'], 'reggae'],
      [['latin', 'latin music'], 'latin'],
      [['world music', 'world'], 'world']
    ];

    for (const [variants, normalized] of mappings) {
      for (const variant of variants) {
        this.genreMapping.set(variant.toLowerCase().trim(), normalized);
      }
    }
  }

  /**
   * Initialize vocabulary mappings and common synonyms
   */
  private initializeVocabularyMappings(): void {
    // This could be expanded with more sophisticated vocabulary mappings
    // For now, we'll handle this dynamically in the normalization process
  }

  /**
   * Normalize artist data from any API source
   */
  normalizeArtist(rawData: any, source: string): NormalizedArtist {
    const name = this.extractArtistName(rawData, source);
    const genres = this.extractGenres(rawData, source);
    const popularity = this.extractPopularity(rawData, source);
    
    return {
      id: this.generateNormalizedId(name, 'artist'),
      name,
      normalizedName: this.normalizeString(name),
      genres,
      normalizedGenres: this.normalizeGenres(genres),
      popularity,
      source,
      confidence: this.calculateArtistConfidence(rawData, source),
      metadata: this.extractArtistMetadata(rawData, source)
    };
  }

  /**
   * Normalize track data from any API source
   */
  normalizeTrack(rawData: any, source: string): NormalizedTrack {
    const name = this.extractTrackName(rawData, source);
    const artists = this.extractTrackArtists(rawData, source);
    const genres = this.extractGenres(rawData, source);
    const popularity = this.extractPopularity(rawData, source);
    
    return {
      id: this.generateNormalizedId(name, 'track'),
      name,
      normalizedName: this.normalizeString(name),
      artists: artists.map(artist => this.normalizeArtist(artist, source)),
      genres,
      normalizedGenres: this.normalizeGenres(genres),
      popularity,
      source,
      confidence: this.calculateTrackConfidence(rawData, source),
      metadata: this.extractTrackMetadata(rawData, source)
    };
  }

  /**
   * Normalize vocabulary data from various sources
   */
  normalizeVocabulary(rawData: any, source: string, context?: string): NormalizedVocabulary {
    const cacheKey = `${source}-${context || 'default'}-${JSON.stringify(rawData).substring(0, 100)}`;
    
    if (this.vocabularyCache.has(cacheKey)) {
      return this.vocabularyCache.get(cacheKey)!;
    }

    const words = this.extractWords(rawData, source);
    const concepts = this.extractConcepts(rawData, source);

    const normalizedWords = words.map(wordData => {
      const word = typeof wordData === 'string' ? wordData : wordData.word;
      const score = typeof wordData === 'object' ? wordData.score || 50 : 50;
      
      return {
        word: word.toLowerCase().trim(),
        normalizedWord: this.normalizeString(word),
        type: this.determineWordType(word) as 'adjective' | 'noun' | 'verb' | 'concept',
        score: this.normalizeScore(score),
        themes: this.extractWordThemes(word, context),
        phonetic: this.getPhoneticRepresentation(word),
        syllables: this.countSyllables(word),
        source,
        confidence: this.calculateWordConfidence(wordData, source)
      };
    }).filter(word => 
      word.word.length >= 3 && 
      word.word.length <= 15 && 
      !this.stopWords.has(word.word) &&
      /^[a-z]+$/i.test(word.word) // Only alphabetic characters
    );

    const normalizedConcepts = concepts.map(conceptData => ({
      concept: this.normalizeString(conceptData.concept || conceptData),
      relatedWords: (conceptData.relatedWords || []).map((w: string) => this.normalizeString(w)),
      strength: conceptData.strength || 0.5,
      source
    }));

    const result: NormalizedVocabulary = {
      words: normalizedWords,
      concepts: normalizedConcepts
    };

    this.vocabularyCache.set(cacheKey, result);
    return result;
  }

  /**
   * Normalize genre data and create comprehensive genre profile
   */
  normalizeGenreData(rawData: any, source: string): NormalizedGenreData {
    const extractedGenres = this.extractGenres(rawData, source);
    const normalizedGenres = this.normalizeGenres(extractedGenres);
    
    const primaryGenre = normalizedGenres[0] || 'unknown';
    const subgenres = normalizedGenres.slice(1, 4); // Take up to 3 additional genres
    const relatedGenres = this.findRelatedGenres(primaryGenre);
    const descriptors = this.extractGenreDescriptors(rawData, source);
    const moodTags = this.extractMoodTags(rawData, source);
    const era = this.extractEra(rawData, source);

    return {
      primaryGenre,
      subgenres,
      relatedGenres,
      descriptors: descriptors.map(d => this.normalizeString(d)),
      moodTags: moodTags.map(m => this.normalizeString(m)),
      era,
      confidence: this.calculateGenreConfidence(extractedGenres, source)
    };
  }

  /**
   * Cross-API data fusion - combine data from multiple sources
   */
  fuseData<T extends { source: string; confidence: number }>(
    dataArray: T[],
    fusionStrategy: 'highest_confidence' | 'weighted_average' | 'consensus' = 'highest_confidence'
  ): T {
    if (dataArray.length === 0) {
      throw new Error('No data provided for fusion');
    }

    if (dataArray.length === 1) {
      return dataArray[0];
    }

    switch (fusionStrategy) {
      case 'highest_confidence':
        return dataArray.reduce((best, current) => 
          current.confidence > best.confidence ? current : best
        );

      case 'weighted_average':
        // For complex fusion of multiple fields - simplified version
        const totalWeight = dataArray.reduce((sum, item) => sum + item.confidence, 0);
        const weights = dataArray.map(item => item.confidence / totalWeight);
        
        // Return the item with highest weight (simplified)
        const maxWeightIndex = weights.indexOf(Math.max(...weights));
        return dataArray[maxWeightIndex];

      case 'consensus':
        // Find most common values across sources
        // Return the item that represents the consensus (simplified)
        return dataArray.reduce((consensus, current) => {
          // In a real implementation, this would compare field values
          // and build a consensus result
          return current.confidence > consensus.confidence ? current : consensus;
        });

      default:
        return dataArray[0];
    }
  }

  /**
   * Quality scoring for normalized data
   */
  calculateDataQuality(data: any): number {
    let score = 100;

    // Check data completeness
    if (!data) return 0;
    
    const fields = Object.keys(data);
    if (fields.length === 0) return 0;

    // Penalize missing or empty fields
    const emptyFields = fields.filter(field => 
      data[field] == null || 
      data[field] === '' || 
      (Array.isArray(data[field]) && data[field].length === 0)
    );
    
    score -= (emptyFields.length / fields.length) * 30;

    // Bonus for rich data
    if (data.metadata && Object.keys(data.metadata).length > 3) {
      score += 10;
    }

    // Source reliability bonus
    const sourceBonus: Record<string, number> = {
      'spotify': 15,
      'lastfm': 10,
      'musicbrainz': 12,
      'datamuse': 8,
      'conceptnet': 6,
      'poetry': 5,
      'fallback': -10
    };
    
    score += sourceBonus[data.source] || 0;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Helper methods for data extraction
   */
  private extractArtistName(data: any, source: string): string {
    const nameFields = {
      spotify: 'name',
      lastfm: 'name',
      musicbrainz: 'name',
      fallback: 'name'
    };
    
    return data[nameFields[source as keyof typeof nameFields] || 'name'] || 'Unknown Artist';
  }

  private extractTrackName(data: any, source: string): string {
    const nameFields = {
      spotify: 'name',
      lastfm: 'name',
      musicbrainz: 'title',
      fallback: 'name'
    };
    
    return data[nameFields[source as keyof typeof nameFields] || 'name'] || 'Unknown Track';
  }

  private extractGenres(data: any, source: string): string[] {
    let genres: string[] = [];
    
    switch (source) {
      case 'spotify':
        genres = data.genres || data.artists?.[0]?.genres || [];
        break;
      case 'lastfm':
        if (data.toptags?.tag) {
          const tags = Array.isArray(data.toptags.tag) ? data.toptags.tag : [data.toptags.tag];
          genres = tags.map((tag: any) => tag.name || tag).slice(0, 5);
        }
        break;
      case 'musicbrainz':
        genres = data.tags?.map((tag: any) => tag.name) || [];
        break;
      default:
        genres = data.genres || [];
    }
    
    return genres.filter(genre => genre && genre.trim().length > 0);
  }

  private extractPopularity(data: any, source: string): number {
    const popularityFields = {
      spotify: 'popularity',
      lastfm: 'listeners',
      musicbrainz: 'rating'
    };
    
    const value = data[popularityFields[source as keyof typeof popularityFields]] || 0;
    
    // Normalize to 0-100 scale
    switch (source) {
      case 'spotify':
        return Math.min(100, Math.max(0, value));
      case 'lastfm':
        return Math.min(100, Math.max(0, Math.log10(value + 1) * 10));
      default:
        return Math.min(100, Math.max(0, value));
    }
  }

  private normalizeString(str: string): string {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters except hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Remove duplicate hyphens
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }

  private normalizeGenres(genres: string[]): string[] {
    return genres
      .map(genre => {
        const normalized = genre.toLowerCase().trim();
        return this.genreMapping.get(normalized) || this.normalizeString(genre);
      })
      .filter((genre, index, array) => array.indexOf(genre) === index) // Remove duplicates
      .slice(0, 5); // Limit to 5 genres
  }

  private generateNormalizedId(name: string, type: string): string {
    const normalized = this.normalizeString(name);
    const hash = Buffer.from(normalized).toString('base64').substring(0, 8);
    return `${type}-${hash}-${Date.now()}`;
  }

  private extractWords(data: any, source: string): any[] {
    switch (source) {
      case 'datamuse':
        return Array.isArray(data) ? data : [];
      case 'conceptnet':
        return data.edges?.map((edge: any) => ({
          word: edge.end.label || edge.start.label,
          score: edge.weight * 100
        })) || [];
      case 'poetry':
        if (data.poeticPhrases) {
          return data.poeticPhrases.map((phrase: string) => ({
            word: phrase,
            score: 70
          }));
        }
        return data.vocabulary || [];
      default:
        return Array.isArray(data.words) ? data.words : [];
    }
  }

  private extractConcepts(data: any, source: string): any[] {
    if (source === 'conceptnet') {
      return data.edges?.map((edge: any) => ({
        concept: edge.rel.label,
        relatedWords: [edge.start.label, edge.end.label],
        strength: edge.weight
      })) || [];
    }
    
    return data.concepts || [];
  }

  private determineWordType(word: string): string {
    // Simple heuristic for word type detection
    // In a real implementation, this could use NLP libraries
    
    if (word.endsWith('ing') || word.endsWith('ed') || word.endsWith('s')) {
      return 'verb';
    }
    
    if (word.endsWith('ly') || word.endsWith('ful') || word.endsWith('ous')) {
      return 'adjective';
    }
    
    if (word.endsWith('tion') || word.endsWith('ness') || word.endsWith('ment')) {
      return 'noun';
    }
    
    // Default to concept for ambiguous cases
    return 'concept';
  }

  private normalizeScore(score: number): number {
    // Normalize various score ranges to 0-100
    if (score <= 1) {
      return score * 100;
    }
    return Math.min(100, Math.max(0, score));
  }

  private extractWordThemes(word: string, context?: string): string[] {
    const themes = [];
    
    if (context) {
      themes.push(context);
    }
    
    // Add theme based on word characteristics
    if (/dark|night|shadow|death|black/i.test(word)) {
      themes.push('dark');
    }
    if (/light|sun|bright|white|shine/i.test(word)) {
      themes.push('light');
    }
    if (/love|heart|romance|kiss/i.test(word)) {
      themes.push('romantic');
    }
    if (/fire|storm|thunder|wild/i.test(word)) {
      themes.push('energetic');
    }
    
    return themes;
  }

  private getPhoneticRepresentation(word: string): string {
    if (this.phonemicCache.has(word)) {
      return this.phonemicCache.get(word)!;
    }
    
    const phonetic = metaphone(word);
    this.phonemicCache.set(word, phonetic);
    return phonetic;
  }

  private countSyllables(word: string): number {
    // Simple syllable counting algorithm
    const vowels = 'aeiouy';
    let count = 0;
    let previousWasVowel = false;
    
    for (let i = 0; i < word.length; i++) {
      const isVowel = vowels.includes(word[i].toLowerCase());
      if (isVowel && !previousWasVowel) {
        count++;
      }
      previousWasVowel = isVowel;
    }
    
    // Handle silent e
    if (word.endsWith('e')) {
      count--;
    }
    
    return Math.max(1, count);
  }

  private calculateArtistConfidence(data: any, source: string): number {
    let confidence = 50; // Base confidence
    
    if (data.name) confidence += 20;
    if (data.genres && data.genres.length > 0) confidence += 15;
    if (data.popularity > 0) confidence += 10;
    
    // Source-specific bonuses
    const sourceBonus = { spotify: 15, lastfm: 10, musicbrainz: 12 };
    confidence += sourceBonus[source as keyof typeof sourceBonus] || 0;
    
    return Math.min(100, confidence);
  }

  private calculateTrackConfidence(data: any, source: string): number {
    let confidence = 50;
    
    if (data.name) confidence += 20;
    if (data.artists && data.artists.length > 0) confidence += 15;
    if (data.popularity > 0) confidence += 10;
    
    const sourceBonus = { spotify: 15, lastfm: 10, musicbrainz: 12 };
    confidence += sourceBonus[source as keyof typeof sourceBonus] || 0;
    
    return Math.min(100, confidence);
  }

  private calculateWordConfidence(data: any, source: string): number {
    let confidence = 60;
    
    if (typeof data === 'object' && data.score) {
      confidence += Math.min(30, data.score / 3);
    }
    
    const sourceBonus = { datamuse: 10, conceptnet: 8, poetry: 5 };
    confidence += sourceBonus[source as keyof typeof sourceBonus] || 0;
    
    return Math.min(100, confidence);
  }

  private calculateGenreConfidence(genres: string[], source: string): number {
    let confidence = 40 + (genres.length * 10);
    
    const sourceBonus = { spotify: 20, lastfm: 15, musicbrainz: 10 };
    confidence += sourceBonus[source as keyof typeof sourceBonus] || 0;
    
    return Math.min(100, confidence);
  }

  private findRelatedGenres(primaryGenre: string): string[] {
    const relations: Record<string, string[]> = {
      'rock': ['alternative-rock', 'indie-rock', 'classic-rock'],
      'alternative-rock': ['indie-rock', 'grunge', 'post-rock'],
      'electronic': ['house', 'techno', 'ambient', 'edm'],
      'hip-hop': ['rap', 'trap', 'r-and-b'],
      'pop': ['pop-rock', 'indie-pop', 'dance-pop'],
      'jazz': ['smooth-jazz', 'jazz-fusion', 'blues'],
      'metal': ['heavy-metal', 'death-metal', 'black-metal'],
      'folk': ['indie-folk', 'country', 'americana']
    };
    
    return relations[primaryGenre] || [];
  }

  private extractTrackArtists(data: any, source: string): any[] {
    switch (source) {
      case 'spotify':
        return data.artists || [];
      case 'lastfm':
        return data.artist ? [{ name: data.artist }] : [];
      case 'musicbrainz':
        return data['artist-credit'] || [];
      default:
        return data.artists || [];
    }
  }

  private extractArtistMetadata(data: any, source: string): Record<string, any> {
    const metadata: Record<string, any> = { source };
    
    // Extract source-specific metadata
    if (data.external_urls) metadata.external_urls = data.external_urls;
    if (data.followers) metadata.followers = data.followers;
    if (data.images) metadata.images = data.images;
    if (data.id) metadata.source_id = data.id;
    
    return metadata;
  }

  private extractTrackMetadata(data: any, source: string): Record<string, any> {
    const metadata: Record<string, any> = { source };
    
    if (data.album) metadata.album = data.album;
    if (data.duration_ms) metadata.duration = data.duration_ms;
    if (data.explicit) metadata.explicit = data.explicit;
    if (data.external_urls) metadata.external_urls = data.external_urls;
    if (data.id) metadata.source_id = data.id;
    
    return metadata;
  }

  private extractGenreDescriptors(data: any, source: string): string[] {
    // Extract descriptive words associated with genres
    const descriptors: string[] = [];
    
    if (data.description) {
      descriptors.push(data.description);
    }
    
    if (data.tags) {
      descriptors.push(...data.tags.map((tag: any) => tag.name || tag));
    }
    
    return descriptors.slice(0, 10);
  }

  private extractMoodTags(data: any, source: string): string[] {
    const moodIndicators = ['energetic', 'calm', 'melancholic', 'uplifting', 'dark', 'romantic', 'aggressive', 'peaceful'];
    const moodTags: string[] = [];
    
    // Simple keyword matching for mood extraction
    const text = JSON.stringify(data).toLowerCase();
    
    for (const mood of moodIndicators) {
      if (text.includes(mood)) {
        moodTags.push(mood);
      }
    }
    
    return moodTags;
  }

  private extractEra(data: any, source: string): string | null {
    if (data.year || data.release_date) {
      const year = data.year || new Date(data.release_date).getFullYear();
      
      if (year < 1960) return 'classic';
      if (year < 1970) return '60s';
      if (year < 1980) return '70s';
      if (year < 1990) return '80s';
      if (year < 2000) return '90s';
      if (year < 2010) return '2000s';
      if (year < 2020) return '2010s';
      return '2020s';
    }
    
    return null;
  }
}

// Export singleton instance
export const dataNormalizer = new DataNormalizationPipeline();