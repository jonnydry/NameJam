/**
 * Phonetic Matching Service - Enhanced similarity matching using phonetic algorithms
 * Replaces basic Levenshtein distance with sophisticated name matching
 */

import { metaphone } from 'metaphone';
import { PorterStemmer, SoundEx } from 'natural';
import { secureLog } from '../utils/secureLogger';

export interface PhoneticMatch {
  similarity: number;
  phoneticSimilarity: number;
  editDistance: number;
  tokenSimilarity: number;
  confidence: number;
}

export interface NormalizedName {
  original: string;
  canonical: string;
  tokens: string[];
  metaphoneKeys: string[];
  soundexKeys: string[];
  stems: string[];
}

export class PhoneticMatchingService {
  private static instance: PhoneticMatchingService;
  private soundEx = new SoundEx();
  
  // Common articles and prepositions to normalize
  private readonly articles = new Set(['the', 'a', 'an']);
  private readonly prepositions = new Set(['of', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'by']);
  
  // Famous band/artist prefixes and suffixes that should be normalized
  private readonly bandPrefixes = new Set(['the', 'a', 'an', 'los', 'las', 'le', 'la', 'les']);
  private readonly bandSuffixes = new Set(['band', 'orchestra', 'ensemble', 'collective', 'project']);

  static getInstance(): PhoneticMatchingService {
    if (!PhoneticMatchingService.instance) {
      PhoneticMatchingService.instance = new PhoneticMatchingService();
    }
    return PhoneticMatchingService.instance;
  }

  /**
   * Normalize a name into canonical form for comparison
   */
  normalizeName(name: string): NormalizedName {
    const original = name.trim();
    let canonical = original.toLowerCase();
    
    // Remove extra whitespace and normalize punctuation
    canonical = canonical.replace(/\s+/g, ' ');
    canonical = canonical.replace(/['"''""]/g, ''); // Remove quotes
    canonical = canonical.replace(/[-_]/g, ' '); // Convert dashes/underscores to spaces
    canonical = canonical.replace(/[^\w\s]/g, ''); // Remove other punctuation
    
    // Tokenize into words
    let tokens = canonical.split(/\s+/).filter(token => token.length > 0);
    
    // Remove common articles if they're at the beginning (but preserve them in analysis)
    const hasLeadingArticle = tokens.length > 1 && this.articles.has(tokens[0]);
    if (hasLeadingArticle) {
      // Create version without leading article for comparison
      tokens = tokens.slice(1);
    }
    
    // Remove common band suffixes if they're at the end
    if (tokens.length > 1 && this.bandSuffixes.has(tokens[tokens.length - 1])) {
      tokens = tokens.slice(0, -1);
    }
    
    // Generate phonetic keys
    const metaphoneKeys = tokens.map(token => metaphone(token)).filter(key => key.length > 0);
    const soundexKeys = tokens.map(token => this.soundEx.process(token)).filter(key => key !== '0000');
    
    // Generate stems for morphological matching
    const stems = tokens.map(token => PorterStemmer.stem(token));
    
    // Create canonical form
    const canonicalForm = tokens.join(' ');
    
    return {
      original,
      canonical: canonicalForm,
      tokens,
      metaphoneKeys,
      soundexKeys,
      stems
    };
  }

  /**
   * Calculate comprehensive similarity between two names
   */
  calculateSimilarity(name1: string, name2: string): PhoneticMatch {
    const norm1 = this.normalizeName(name1);
    const norm2 = this.normalizeName(name2);
    
    // 1. Exact canonical match
    if (norm1.canonical === norm2.canonical) {
      return {
        similarity: 1.0,
        phoneticSimilarity: 1.0,
        editDistance: 0,
        tokenSimilarity: 1.0,
        confidence: 1.0
      };
    }
    
    // 2. Phonetic similarity using metaphone
    const phoneticSimilarity = this.calculatePhoneticSimilarity(norm1, norm2);
    
    // 3. Edit distance similarity
    const editDistance = this.calculateEditDistance(norm1.canonical, norm2.canonical);
    const maxLength = Math.max(norm1.canonical.length, norm2.canonical.length);
    const editSimilarity = maxLength > 0 ? (maxLength - editDistance) / maxLength : 0;
    
    // 4. Token-based similarity
    const tokenSimilarity = this.calculateTokenSimilarity(norm1, norm2);
    
    // 5. Combined weighted similarity
    const weightedSimilarity = (
      phoneticSimilarity * 0.4 +        // Phonetic is most important for "sounds like"
      editSimilarity * 0.3 +            // Edit distance for spelling variations
      tokenSimilarity * 0.3             // Token matching for word order variations
    );
    
    // 6. Confidence calculation based on multiple factors
    const confidence = this.calculateConfidence(phoneticSimilarity, editSimilarity, tokenSimilarity, norm1, norm2);
    
    return {
      similarity: weightedSimilarity,
      phoneticSimilarity,
      editDistance,
      tokenSimilarity,
      confidence
    };
  }

  /**
   * Calculate phonetic similarity using metaphone and soundex
   */
  private calculatePhoneticSimilarity(norm1: NormalizedName, norm2: NormalizedName): number {
    if (norm1.metaphoneKeys.length === 0 || norm2.metaphoneKeys.length === 0) {
      return 0;
    }
    
    // Metaphone matching (primary algorithm)
    let metaphoneMatches = 0;
    let totalComparisons = 0;
    
    for (const key1 of norm1.metaphoneKeys) {
      for (const key2 of norm2.metaphoneKeys) {
        totalComparisons++;
        if (key1 === key2) {
          metaphoneMatches++;
        }
      }
    }
    
    const metaphoneScore = totalComparisons > 0 ? metaphoneMatches / Math.max(norm1.metaphoneKeys.length, norm2.metaphoneKeys.length) : 0;
    
    // SoundEx matching (secondary verification)
    let soundexMatches = 0;
    let soundexComparisons = 0;
    
    for (const key1 of norm1.soundexKeys) {
      for (const key2 of norm2.soundexKeys) {
        soundexComparisons++;
        if (key1 === key2) {
          soundexMatches++;
        }
      }
    }
    
    const soundexScore = soundexComparisons > 0 ? soundexMatches / Math.max(norm1.soundexKeys.length, norm2.soundexKeys.length) : 0;
    
    // Combine metaphone (70%) and soundex (30%) scores
    return metaphoneScore * 0.7 + soundexScore * 0.3;
  }

  /**
   * Calculate token-based similarity including stems and word order
   */
  private calculateTokenSimilarity(norm1: NormalizedName, norm2: NormalizedName): number {
    // Direct token matching
    const tokens1Set = new Set(norm1.tokens);
    const tokens2Set = new Set(norm2.tokens);
    const tokenIntersection = new Set([...tokens1Set].filter(x => tokens2Set.has(x)));
    const tokenUnion = new Set([...tokens1Set, ...tokens2Set]);
    const tokenJaccard = tokenUnion.size > 0 ? tokenIntersection.size / tokenUnion.size : 0;
    
    // Stem-based matching for morphological variants
    const stems1Set = new Set(norm1.stems);
    const stems2Set = new Set(norm2.stems);
    const stemIntersection = new Set([...stems1Set].filter(x => stems2Set.has(x)));
    const stemUnion = new Set([...stems1Set, ...stems2Set]);
    const stemJaccard = stemUnion.size > 0 ? stemIntersection.size / stemUnion.size : 0;
    
    // Word order similarity (bonus for same order)
    let orderSimilarity = 0;
    const minLength = Math.min(norm1.tokens.length, norm2.tokens.length);
    if (minLength > 0) {
      let samePositions = 0;
      for (let i = 0; i < minLength; i++) {
        if (norm1.tokens[i] === norm2.tokens[i]) {
          samePositions++;
        }
      }
      orderSimilarity = samePositions / minLength;
    }
    
    // Combine token (50%), stem (30%), and order (20%) similarities
    return tokenJaccard * 0.5 + stemJaccard * 0.3 + orderSimilarity * 0.2;
  }

  /**
   * Calculate edit distance (Levenshtein) between two strings
   */
  private calculateEditDistance(str1: string, str2: string): number {
    if (str1.length === 0) return str2.length;
    if (str2.length === 0) return str1.length;
    
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    // Initialize first row and column
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    // Fill the matrix
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j - 1][i] + 1,     // deletion
          matrix[j][i - 1] + 1,     // insertion
          matrix[j - 1][i - 1] + cost  // substitution
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Calculate confidence score based on multiple similarity factors
   */
  private calculateConfidence(phoneticSim: number, editSim: number, tokenSim: number, norm1: NormalizedName, norm2: NormalizedName): number {
    let confidence = 0.5; // Base confidence
    
    // High phonetic similarity increases confidence significantly
    if (phoneticSim > 0.8) confidence += 0.3;
    else if (phoneticSim > 0.6) confidence += 0.2;
    else if (phoneticSim > 0.4) confidence += 0.1;
    
    // Good edit similarity adds confidence
    if (editSim > 0.9) confidence += 0.2;
    else if (editSim > 0.7) confidence += 0.1;
    
    // Token similarity provides additional confidence
    if (tokenSim > 0.8) confidence += 0.2;
    else if (tokenSim > 0.5) confidence += 0.1;
    
    // Length similarity affects confidence
    const lengthRatio = Math.min(norm1.canonical.length, norm2.canonical.length) / 
                       Math.max(norm1.canonical.length, norm2.canonical.length);
    if (lengthRatio > 0.8) confidence += 0.1;
    
    // More tokens generally means more confident matching
    const avgTokens = (norm1.tokens.length + norm2.tokens.length) / 2;
    if (avgTokens >= 3) confidence += 0.1;
    
    return Math.min(1.0, confidence);
  }

  /**
   * Test phonetic matching with known similar-sounding names
   */
  testPhoneticMatching(): { testName: string, result: PhoneticMatch }[] {
    const testPairs = [
      // Exact matches
      ['The Beatles', 'Beatles'],
      ['Led Zeppelin', 'Led Zeppelin'],
      
      // Phonetic similarities
      ['Metallica', 'Metalica'],
      ['Nirvana', 'Nervana'],
      ['Red Hot Chili Peppers', 'Red Hot Chilli Peppers'],
      
      // Different but similar sounding
      ['Black Sabbath', 'Black Sabath'],
      ['Def Leppard', 'Deaf Leopard'],
      ['Lynyrd Skynyrd', 'Leonard Skinner'],
      
      // Should not match
      ['The Beatles', 'The Rolling Stones'],
      ['Metallica', 'Madonna'],
      
      // Band vs song confusion
      ['Hotel California', 'Hotel California Band'],
      ['Stairway to Heaven', 'Stairway to Heaven Group']
    ];
    
    return testPairs.map(([name1, name2]) => ({
      testName: `${name1} vs ${name2}`,
      result: this.calculateSimilarity(name1, name2)
    }));
  }
}

// Export singleton instance
export const phoneticMatchingService = PhoneticMatchingService.getInstance();