// Advanced Linguistic Analysis System for Name Generation
// This module provides sophisticated linguistic analysis for creating more intelligent and creative names

export interface PhonemePattern {
  consonants: string[];
  vowels: string[];
  structure: string; // e.g., "CVC" (consonant-vowel-consonant)
}

export interface SyllableInfo {
  count: number;
  stress: number[]; // positions of stressed syllables
  pattern: string; // e.g., "strong-weak-strong"
}

export interface EmotionalMapping {
  valence: number; // -1 to 1 (negative to positive)
  arousal: number; // 0 to 1 (calm to excited)
  dominance: number; // 0 to 1 (submissive to dominant)
}

export class AdvancedLinguisticsService {
  // Phoneme mappings for English sounds
  private phonemeMap = {
    consonants: {
      plosive: ['p', 'b', 't', 'd', 'k', 'g'],
      fricative: ['f', 'v', 'th', 's', 'z', 'sh', 'zh', 'h'],
      nasal: ['m', 'n', 'ng'],
      liquid: ['l', 'r'],
      glide: ['w', 'y'],
      // Consonant clusters that sound good together
      clusters: {
        initial: ['bl', 'br', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr', 'pl', 'pr', 'sc', 'sk', 'sl', 'sm', 'sn', 'sp', 'st', 'str', 'sw', 'tr', 'tw', 'thr', 'shr', 'scr', 'spl', 'spr'],
        final: ['ct', 'ft', 'ld', 'lf', 'lk', 'lm', 'lp', 'lt', 'mp', 'nd', 'nk', 'nt', 'pt', 'rd', 'rk', 'rm', 'rn', 'rp', 'rt', 'sk', 'sp', 'st']
      }
    },
    vowels: {
      short: ['a', 'e', 'i', 'o', 'u'],
      long: ['ay', 'ee', 'eye', 'oh', 'you'],
      diphthongs: ['aw', 'ow', 'oy', 'air', 'ear', 'ure']
    }
  };

  // Emotional word mappings based on psychological research
  private emotionalMappings = new Map<string, EmotionalMapping>([
    // High valence (positive)
    ['bright', { valence: 0.8, arousal: 0.6, dominance: 0.5 }],
    ['joy', { valence: 0.9, arousal: 0.7, dominance: 0.5 }],
    ['love', { valence: 0.9, arousal: 0.5, dominance: 0.4 }],
    ['dream', { valence: 0.7, arousal: 0.3, dominance: 0.3 }],
    ['golden', { valence: 0.8, arousal: 0.4, dominance: 0.6 }],
    
    // Low valence (negative)
    ['dark', { valence: -0.6, arousal: 0.3, dominance: 0.5 }],
    ['shadow', { valence: -0.5, arousal: 0.4, dominance: 0.4 }],
    ['void', { valence: -0.7, arousal: 0.2, dominance: 0.3 }],
    ['broken', { valence: -0.8, arousal: 0.4, dominance: 0.2 }],
    ['rage', { valence: -0.7, arousal: 0.9, dominance: 0.8 }],
    
    // High arousal
    ['electric', { valence: 0.3, arousal: 0.9, dominance: 0.7 }],
    ['storm', { valence: -0.2, arousal: 0.8, dominance: 0.7 }],
    ['fire', { valence: 0.1, arousal: 0.8, dominance: 0.6 }],
    ['thunder', { valence: -0.1, arousal: 0.9, dominance: 0.8 }],
    
    // Low arousal
    ['calm', { valence: 0.6, arousal: 0.1, dominance: 0.4 }],
    ['gentle', { valence: 0.7, arousal: 0.2, dominance: 0.3 }],
    ['whisper', { valence: 0.3, arousal: 0.2, dominance: 0.2 }],
    ['mist', { valence: 0.2, arousal: 0.2, dominance: 0.3 }]
  ]);

  // Syllable stress patterns for different word lengths
  private stressPatterns = {
    2: ['STRONG-weak', 'weak-STRONG'],
    3: ['STRONG-weak-weak', 'weak-STRONG-weak', 'weak-weak-STRONG'],
    4: ['STRONG-weak-STRONG-weak', 'weak-STRONG-weak-STRONG', 'STRONG-weak-weak-STRONG'],
    5: ['STRONG-weak-weak-STRONG-weak', 'weak-STRONG-weak-weak-STRONG', 'STRONG-weak-STRONG-weak-weak']
  };

  // Cultural and mythological references
  private culturalReferences = {
    mythology: {
      greek: ['apollo', 'athena', 'zeus', 'hera', 'dionysus', 'orpheus', 'pandora', 'prometheus', 'atlas', 'echo'],
      norse: ['odin', 'thor', 'loki', 'freya', 'valkyrie', 'ragnarok', 'valhalla', 'midgard', 'yggdrasil', 'fenrir'],
      egyptian: ['ra', 'isis', 'osiris', 'anubis', 'horus', 'sphinx', 'pharaoh', 'pyramid', 'scarab', 'ankh'],
      eastern: ['dragon', 'phoenix', 'karma', 'zen', 'lotus', 'yin', 'yang', 'chi', 'tao', 'samurai']
    },
    literary: {
      shakespeare: ['tempest', 'midsummer', 'hamlet', 'ophelia', 'prospero', 'oberon', 'titania', 'mercutio'],
      modern: ['gatsby', 'orwell', 'kafka', 'wilde', 'poe', 'lovecraft', 'tolkien', 'asimov'],
      concepts: ['utopia', 'dystopia', 'metamorphosis', 'paradox', 'allegory', 'odyssey', 'genesis', 'apocalypse']
    },
    historical: {
      eras: ['renaissance', 'baroque', 'gothic', 'victorian', 'deco', 'nouveau', 'medieval', 'ancient'],
      figures: ['caesar', 'cleopatra', 'napoleon', 'galileo', 'davinci', 'tesla', 'einstein', 'curie'],
      movements: ['revolution', 'enlightenment', 'industrial', 'digital', 'quantum', 'atomic', 'space', 'cyber']
    }
  };

  // Multi-language word roots and their meanings
  private multilingualRoots = {
    latin: {
      'lux': 'light',
      'nox': 'night',
      'sol': 'sun',
      'luna': 'moon',
      'ignis': 'fire',
      'aqua': 'water',
      'terra': 'earth',
      'ventus': 'wind',
      'stella': 'star',
      'umbra': 'shadow'
    },
    greek: {
      'pyro': 'fire',
      'hydro': 'water',
      'geo': 'earth',
      'aero': 'air',
      'chrono': 'time',
      'cosmo': 'universe',
      'psyche': 'soul',
      'phono': 'sound',
      'photo': 'light',
      'crypto': 'hidden'
    },
    sanskrit: {
      'agni': 'fire',
      'vayu': 'wind',
      'prithvi': 'earth',
      'jal': 'water',
      'akash': 'space',
      'prana': 'life force',
      'karma': 'action',
      'dharma': 'duty',
      'moksha': 'liberation',
      'shakti': 'power'
    },
    japanese: {
      'kaze': 'wind',
      'mizu': 'water',
      'hi': 'fire',
      'tsuki': 'moon',
      'yami': 'darkness',
      'hikari': 'light',
      'kiri': 'mist',
      'arashi': 'storm',
      'sakura': 'cherry blossom',
      'rei': 'spirit'
    }
  };

  // Analyze phonetic compatibility between words
  analyzePhoneticHarmony(word1: string, word2: string): number {
    // Score from 0 to 1, where 1 is perfect harmony
    let score = 0;
    
    // Check for alliteration
    if (word1[0].toLowerCase() === word2[0].toLowerCase()) {
      score += 0.3;
    }
    
    // Check for consonance (repeated consonant sounds)
    const consonants1 = this.extractConsonants(word1);
    const consonants2 = this.extractConsonants(word2);
    const commonConsonants = consonants1.filter(c => consonants2.includes(c));
    score += (commonConsonants.length / Math.max(consonants1.length, consonants2.length)) * 0.2;
    
    // Check for assonance (repeated vowel sounds)
    const vowels1 = this.extractVowels(word1);
    const vowels2 = this.extractVowels(word2);
    const commonVowels = vowels1.filter(v => vowels2.includes(v));
    score += (commonVowels.length / Math.max(vowels1.length, vowels2.length)) * 0.2;
    
    // Check for complementary ending sounds
    const ending1 = word1.slice(-2).toLowerCase();
    const ending2 = word2.slice(-2).toLowerCase();
    if (this.areEndingsComplementary(ending1, ending2)) {
      score += 0.3;
    }
    
    return Math.min(1, score);
  }

  // Extract consonant sounds from a word
  private extractConsonants(word: string): string[] {
    return word.toLowerCase().match(/[bcdfghjklmnpqrstvwxyz]/g) || [];
  }

  
  // Extract vowel sounds from a word
  private extractVowels(word: string): string[] {
    return word.toLowerCase().match(/[aeiou]/g) || [];
  }

  // Check if word endings are phonetically complementary
  private areEndingsComplementary(ending1: string, ending2: string): boolean {
    const complementaryPairs = [
      ['ing', 'er'], ['ed', 'ing'], ['ly', 'ness'], 
      ['tion', 'ment'], ['ous', 'ity'], ['al', 'ism']
    ];
    
    return complementaryPairs.some(pair => 
      (ending1.includes(pair[0]) && ending2.includes(pair[1])) ||
      (ending1.includes(pair[1]) && ending2.includes(pair[0]))
    );
  }

  // Analyze syllable count and stress pattern
  analyzeSyllablePattern(word: string): SyllableInfo {
    // Simple syllable counting (can be enhanced with dictionary lookup)
    const vowelGroups = word.toLowerCase().match(/[aeiou]+/g) || [];
    const syllableCount = vowelGroups.length;
    
    // Determine stress pattern based on word structure
    const stressPositions = this.determineStressPositions(word, syllableCount);
    
    return {
      count: syllableCount,
      stress: stressPositions,
      pattern: this.getStressPattern(syllableCount, stressPositions)
    };
  }

  // Determine which syllables are stressed
  private determineStressPositions(word: string, syllableCount: number): number[] {
    // Simplified stress rules (can be enhanced with phonetic dictionary)
    if (syllableCount === 1) return [0];
    if (syllableCount === 2) {
      // Two-syllable nouns usually stress first syllable
      // Two-syllable verbs usually stress second syllable
      return word.endsWith('ing') || word.endsWith('ed') ? [1] : [0];
    }
    // For longer words, stress typically falls on antepenultimate or penultimate syllable
    return syllableCount >= 3 ? [syllableCount - 3, syllableCount - 1] : [0];
  }

  // Get stress pattern description
  private getStressPattern(syllableCount: number, stressPositions: number[]): string {
    const pattern: string[] = [];
    for (let i = 0; i < syllableCount; i++) {
      pattern.push(stressPositions.includes(i) ? 'STRONG' : 'weak');
    }
    return pattern.join('-');
  }

  // Get emotional mapping for a word or phrase
  getEmotionalMapping(text: string): EmotionalMapping {
    const words = text.toLowerCase().split(' ');
    let totalMapping = { valence: 0, arousal: 0, dominance: 0 };
    let mappedCount = 0;
    
    for (const word of words) {
      if (this.emotionalMappings.has(word)) {
        const mapping = this.emotionalMappings.get(word)!;
        totalMapping.valence += mapping.valence;
        totalMapping.arousal += mapping.arousal;
        totalMapping.dominance += mapping.dominance;
        mappedCount++;
      }
    }
    
    if (mappedCount > 0) {
      totalMapping.valence /= mappedCount;
      totalMapping.arousal /= mappedCount;
      totalMapping.dominance /= mappedCount;
    }
    
    return totalMapping;
  }

  // Generate compound words using morphological rules
  generateCompoundWord(root1: string, root2: string, type: 'fusion' | 'prefix' | 'suffix'): string {
    switch (type) {
      case 'fusion':
        // Blend the words at a natural break point
        const break1 = this.findNaturalBreak(root1);
        const break2 = this.findNaturalBreak(root2);
        return root1.substring(0, break1) + root2.substring(break2);
        
      case 'prefix':
        // Use first word as prefix, modify if needed
        const prefix = root1.endsWith('e') ? root1.slice(0, -1) : root1;
        return prefix + root2.toLowerCase();
        
      case 'suffix':
        // Use second word as suffix, ensure smooth connection
        const suffix = root2.startsWith(root1.slice(-1)) ? root2.substring(1) : root2;
        return root1 + suffix.toLowerCase();
    }
  }

  // Find natural break point in a word for compounding
  private findNaturalBreak(word: string): number {
    // Look for common morpheme boundaries
    const prefixes = ['un', 'in', 'dis', 'pre', 'post', 'anti', 'pro', 'sub', 'super'];
    const suffixes = ['ing', 'ed', 'er', 'est', 'ly', 'ness', 'ment', 'tion', 'ity'];
    
    // Check for prefix
    for (const prefix of prefixes) {
      if (word.startsWith(prefix)) {
        return prefix.length;
      }
    }
    
    // Check for suffix
    for (const suffix of suffixes) {
      if (word.endsWith(suffix)) {
        return word.length - suffix.length;
      }
    }
    
    // Default to syllable-based break (simplified)
    const syllables = this.analyzeSyllablePattern(word);
    return Math.floor(word.length * (syllables.count > 1 ? 0.6 : 0.5));
  }

  // Get cultural reference suggestions based on theme
  getCulturalReferences(theme: string): string[] {
    const references: string[] = [];
    
    // Map themes to cultural categories
    const themeMap: { [key: string]: string[] } = {
      'dark': ['mythology.norse', 'mythology.egyptian', 'literary.poe', 'historical.gothic'],
      'bright': ['mythology.greek', 'literary.shakespeare', 'historical.renaissance'],
      'mysterious': ['mythology.egyptian', 'literary.lovecraft', 'historical.ancient'],
      'energetic': ['mythology.greek', 'historical.industrial', 'historical.digital'],
      'ethereal': ['mythology.eastern', 'literary.tolkien', 'historical.nouveau'],
      'epic': ['mythology.norse', 'mythology.greek', 'literary.tolkien', 'historical.ancient']
    };
    
    if (themeMap[theme]) {
      for (const path of themeMap[theme]) {
        const [category, subcategory] = path.split('.');
        const refs = (this.culturalReferences as any)[category]?.[subcategory] || [];
        references.push(...refs);
      }
    }
    
    return references;
  }

  // Generate words with multilingual roots
  generateMultilingualCompound(concept: string, language?: string): string {
    const availableLanguages = Object.keys(this.multilingualRoots);
    const selectedLanguage = language || availableLanguages[Math.floor(Math.random() * availableLanguages.length)];
    const roots = (this.multilingualRoots as any)[selectedLanguage] || {};
    
    // Find a root that matches the concept
    const matchingRoots = Object.entries(roots).filter(([root, meaning]) => 
      (meaning as string).toLowerCase().includes(concept.toLowerCase()) ||
      concept.toLowerCase().includes((meaning as string).toLowerCase())
    );
    
    if (matchingRoots.length > 0) {
      const [root] = matchingRoots[Math.floor(Math.random() * matchingRoots.length)];
      // Add appropriate suffix based on language
      const suffixes: { [key: string]: string[] } = {
        latin: ['us', 'a', 'um', 'is', 'or'],
        greek: ['os', 'is', 'on', 'ic', 'ous'],
        sanskrit: ['a', 'i', 'am', 'ya', 'ta'],
        japanese: ['shi', 'ka', 'no', 'ki', 'to']
      };
      
      const langSuffixes = suffixes[selectedLanguage] || [''];
      const suffix = langSuffixes[Math.floor(Math.random() * langSuffixes.length)];
      return root + suffix;
    }
    
    return concept; // Fallback to original concept
  }

  // Analyze and score overall name quality
  analyzeNameQuality(name: string, type: 'band' | 'song'): {
    score: number;
    strengths: string[];
    suggestions: string[];
  } {
    const words = name.split(' ');
    let score = 0;
    const strengths: string[] = [];
    const suggestions: string[] = [];
    
    // Phonetic harmony analysis
    if (words.length >= 2) {
      const harmony = this.analyzePhoneticHarmony(words[0], words[words.length - 1]);
      score += harmony * 20;
      if (harmony > 0.7) strengths.push('Excellent phonetic harmony');
      else if (harmony < 0.3) suggestions.push('Consider words with better sound flow');
    }
    
    // Syllable pattern analysis
    const syllableInfo = words.map(w => this.analyzeSyllablePattern(w));
    const totalSyllables = syllableInfo.reduce((sum, info) => sum + info.count, 0);
    
    if (type === 'band' && totalSyllables >= 3 && totalSyllables <= 5) {
      score += 20;
      strengths.push('Good syllable count for memorability');
    } else if (type === 'song' && totalSyllables >= 4 && totalSyllables <= 8) {
      score += 20;
      strengths.push('Appropriate length for song title');
    } else {
      suggestions.push(`Adjust to ${type === 'band' ? '3-5' : '4-8'} syllables for better flow`);
    }
    
    // Emotional consistency
    const emotionalMapping = this.getEmotionalMapping(name);
    const emotionalCoherence = Math.abs(emotionalMapping.valence) + 
                              Math.abs(emotionalMapping.arousal) + 
                              Math.abs(emotionalMapping.dominance);
    if (emotionalCoherence > 1.5) {
      score += 20;
      strengths.push('Strong emotional resonance');
    }
    
    // Uniqueness check (basic - can be enhanced with database)
    const hasUncommonWords = words.some(w => w.length > 7 || this.isUncommonWord(w));
    if (hasUncommonWords) {
      score += 20;
      strengths.push('Contains unique/memorable elements');
    }
    
    // Cultural depth
    const hasCulturalRef = words.some(w => this.hasCulturalReference(w));
    if (hasCulturalRef) {
      score += 20;
      strengths.push('Rich cultural or mythological references');
    }
    
    return { score, strengths, suggestions };
  }

  // Check if word is uncommon (simplified - would use frequency database in production)
  private isUncommonWord(word: string): boolean {
    const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
                        'red', 'blue', 'big', 'small', 'new', 'old', 'good', 'bad'];
    return !commonWords.includes(word.toLowerCase());
  }

  // Check if word has cultural reference
  private hasCulturalReference(word: string): boolean {
    const allRefs = [
      ...Object.values(this.culturalReferences.mythology).flat(),
      ...Object.values(this.culturalReferences.literary).flat(),
      ...Object.values(this.culturalReferences.historical).flat()
    ];
    return allRefs.some(ref => word.toLowerCase().includes(ref) || ref.includes(word.toLowerCase()));
  }
}

export const advancedLinguistics = new AdvancedLinguisticsService();