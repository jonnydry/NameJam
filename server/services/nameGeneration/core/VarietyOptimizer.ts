/**
 * Variety Optimizer
 * Handles variety optimization, deduplication, and filtering for name generation
 */

import type { GenerateNameRequest } from "@shared/schema";
import { secureLog } from "../../../utils/secureLogger";
import { unifiedWordFilter } from "../unifiedWordFilter";
import { sampleWithoutReplacement } from "../stringUtils";
import { config } from "../../../config";

export interface GenerationResult {
  name: string;
  isAiGenerated: boolean;
  source: string;
}

export interface ContextData {
  genre?: string;
  mood?: string;
  type: string;
  wordCount?: number | string;
  enableFusion?: boolean;
  secondaryGenre?: string;
  fusionIntensity?: number;
  creativityLevel?: number;
  preserveAuthenticity?: boolean;
  culturalSensitivity?: boolean;
}

export class VarietyOptimizer {
  private varietyMetrics = new Map<string, { count: number; lastUsed: number }>();
  private readonly METRICS_TTL = 60 * 60 * 1000; // 1 hour

  async optimizeVariety(
    names: GenerationResult[],
    request: GenerateNameRequest,
    generationId: string
  ): Promise<GenerationResult[]> {
    try {
      // Step 1: Remove exact duplicates
      const uniqueNames = this.removeDuplicates(names);
      
      // Step 2: Apply variety scoring
      const scoredNames = this.scoreVariety(uniqueNames, request);
      
      // Step 3: Apply repetition filtering
      const filteredNames = this.applyRepetitionFiltering(scoredNames, generationId);
      
      // Step 4: Ensure diversity across sources
      const diverseNames = this.ensureSourceDiversity(filteredNames);
      
      // Step 5: Sort by variety score and quality
      const optimizedNames = this.sortByVarietyAndQuality(diverseNames);
      
      return optimizedNames;
      
    } catch (error) {
      secureLog.error('Variety optimization failed:', error);
      return names; // Return original names if optimization fails
    }
  }

  private removeDuplicates(names: GenerationResult[]): GenerationResult[] {
    const seen = new Set<string>();
    const unique: GenerationResult[] = [];
    
    for (const name of names) {
      const normalized = name.name.toLowerCase().trim();
      if (!seen.has(normalized)) {
        seen.add(normalized);
        unique.push(name);
      }
    }
    
    return unique;
  }

  private scoreVariety(names: GenerationResult[], request: GenerateNameRequest): Array<GenerationResult & { varietyScore: number }> {
    return names.map(name => {
      let varietyScore = 0;
      
      // Base score
      varietyScore += 1.0;
      
      // Length variety bonus
      const length = name.name.length;
      if (length >= 3 && length <= 8) {
        varietyScore += 0.5; // Optimal length range
      } else if (length > 8) {
        varietyScore += 0.3; // Longer names can be good
      }
      
      // Source diversity bonus
      if (name.source === 'ai') {
        varietyScore += 0.3; // AI names often more creative
      } else if (name.source === 'pattern') {
        varietyScore += 0.2; // Pattern names are reliable
      }
      
      // Genre/mood alignment bonus
      if (request.genre && this.isGenreAligned(name.name, request.genre)) {
        varietyScore += 0.4;
      }
      
      if (request.mood && this.isMoodAligned(name.name, request.mood)) {
        varietyScore += 0.3;
      }
      
      // Creativity bonus for unique patterns
      if (this.hasUniquePattern(name.name)) {
        varietyScore += 0.2;
      }
      
      return {
        ...name,
        varietyScore
      };
    });
  }

  private isGenreAligned(name: string, genre: string): boolean {
    const genreKeywords = {
      'rock': ['stone', 'fire', 'thunder', 'storm', 'wild', 'rebel'],
      'pop': ['bright', 'shine', 'star', 'gold', 'crystal', 'diamond'],
      'electronic': ['digital', 'cyber', 'neon', 'pulse', 'wave', 'frequency'],
      'folk': ['earth', 'wood', 'river', 'mountain', 'valley', 'meadow'],
      'jazz': ['blue', 'smooth', 'cool', 'night', 'moon', 'swing'],
      'metal': ['steel', 'iron', 'dark', 'shadow', 'blade', 'forge']
    };
    
    const keywords = genreKeywords[genre.toLowerCase()] || [];
    const lowerName = name.toLowerCase();
    
    return keywords.some(keyword => lowerName.includes(keyword));
  }

  private isMoodAligned(name: string, mood: string): boolean {
    const moodKeywords = {
      'dark': ['shadow', 'night', 'black', 'dark', 'mystery', 'void'],
      'bright': ['light', 'sun', 'bright', 'gold', 'shine', 'glow'],
      'mysterious': ['shadow', 'mystery', 'secret', 'hidden', 'unknown', 'enigma'],
      'energetic': ['fire', 'storm', 'thunder', 'wild', 'fury', 'blast'],
      'melancholy': ['blue', 'sad', 'tear', 'rain', 'gray', 'mist'],
      'ethereal': ['dream', 'cloud', 'mist', 'spirit', 'angel', 'ghost']
    };
    
    const keywords = moodKeywords[mood.toLowerCase()] || [];
    const lowerName = name.toLowerCase();
    
    return keywords.some(keyword => lowerName.includes(keyword));
  }

  private hasUniquePattern(name: string): boolean {
    // Check for unique letter patterns, alliteration, etc.
    const words = name.split(/\s+/);
    
    // Alliteration check
    if (words.length > 1) {
      const firstLetters = words.map(w => w[0].toLowerCase());
      const uniqueFirstLetters = new Set(firstLetters);
      if (uniqueFirstLetters.size === 1) {
        return true; // Alliteration
      }
    }
    
    // Check for interesting letter combinations
    const interestingPatterns = ['th', 'ch', 'sh', 'ph', 'qu', 'ck', 'ng'];
    const lowerName = name.toLowerCase();
    
    return interestingPatterns.some(pattern => lowerName.includes(pattern));
  }

  private applyRepetitionFiltering(
    names: Array<GenerationResult & { varietyScore: number }>,
    generationId: string
  ): Array<GenerationResult & { varietyScore: number }> {
    return names.filter(name => {
      const isAccepted = unifiedWordFilter.acceptName(name.name, generationId);
      if (!isAccepted) {
        secureLog.debug(`Filtered out repetitive name: ${name.name}`);
      }
      return isAccepted;
    });
  }

  private ensureSourceDiversity(names: Array<GenerationResult & { varietyScore: number }>): Array<GenerationResult & { varietyScore: number }> {
    const sourceGroups = new Map<string, Array<GenerationResult & { varietyScore: number }>>();
    
    // Group by source
    for (const name of names) {
      if (!sourceGroups.has(name.source)) {
        sourceGroups.set(name.source, []);
      }
      sourceGroups.get(name.source)!.push(name);
    }
    
    // Ensure we have names from different sources
    const diverseNames: Array<GenerationResult & { varietyScore: number }> = [];
    const maxPerSource = Math.ceil(names.length / sourceGroups.size);
    
    for (const [source, sourceNames] of sourceGroups) {
      const selected = sourceNames
        .sort((a, b) => b.varietyScore - a.varietyScore)
        .slice(0, maxPerSource);
      diverseNames.push(...selected);
    }
    
    return diverseNames;
  }

  private sortByVarietyAndQuality(names: Array<GenerationResult & { varietyScore: number }>): GenerationResult[] {
    return names
      .sort((a, b) => b.varietyScore - a.varietyScore)
      .map(({ varietyScore, ...name }) => name);
  }

  calculateSmartMultiplier(requestedCount: number, currentCount: number): number {
    if (currentCount >= requestedCount) {
      return 1;
    }
    
    // Calculate multiplier based on how many we need
    const needed = requestedCount - currentCount;
    const multiplier = Math.max(2, Math.ceil(needed * 1.5));
    
    // Cap at reasonable maximum
    return Math.min(multiplier, 5);
  }

  getStats() {
    const now = Date.now();
    const validMetrics = Array.from(this.varietyMetrics.entries()).filter(
      ([, data]) => (now - data.lastUsed) < this.METRICS_TTL
    );
    
    return {
      varietyMetricsSize: validMetrics.length,
      totalMetricsSize: this.varietyMetrics.size,
      metricsTTL: this.METRICS_TTL
    };
  }

  clearMetrics(): void {
    this.varietyMetrics.clear();
    secureLog.info('Variety metrics cleared');
  }
}
