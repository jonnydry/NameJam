/**
 * Lyric-specific quality scoring algorithms
 * Evaluates lyric starters across multiple quality dimensions
 */

import type { 
  LyricScoringRequest, 
  LyricQualityResult,
  ScoreBreakdown,
  QualityScore,
  ScoreMetadata
} from './interfaces';
import { TextAnalyzer, CreativityAnalyzer, ScoringUtils, PerformanceTracker } from './utils';
import { DEFAULT_LYRIC_WEIGHTS, GENRE_ADJUSTMENTS, COMMON_WORDS } from './config';
import { secureLog } from '../../utils/secureLogger';

export class LyricScoringEngine {
  private algorithmVersion = '1.0.0';

  /**
   * Score a single lyric for quality
   */
  async scoreLyric(request: LyricScoringRequest): Promise<LyricQualityResult> {
    const endTiming = PerformanceTracker.startTiming('lyric_scoring');
    
    try {
      const breakdown = this.calculateScoreBreakdown(request);
      const weights = this.getAdjustedWeights(request.genre, request.songSection);
      const overallScore = ScoringUtils.calculateOverallScore(breakdown, weights);
      
      // Apply genre-specific bonuses
      const finalScore = request.genre 
        ? this.applyGenreBonus(overallScore, request.lyric, request.genre)
        : overallScore;

      const score: QualityScore = {
        overall: ScoringUtils.normalizeScore(finalScore),
        breakdown,
        metadata: {
          scoringTime: endTiming(),
          algorithm: 'lyric_scoring_v1',
          version: this.algorithmVersion,
          warnings: this.generateWarnings(request, breakdown),
          confidence: this.calculateConfidence(request, breakdown)
        }
      };

      const recommendations = ScoringUtils.generateRecommendations(breakdown, 'lyric');

      return {
        lyric: request.lyric,
        score,
        passesThreshold: false, // Will be set by the main service based on threshold
        recommendations: recommendations.length > 0 ? recommendations : undefined
      };

    } catch (error) {
      secureLog.error('Lyric scoring error:', error);
      endTiming();
      throw error;
    }
  }

  /**
   * Calculate detailed score breakdown for a lyric
   */
  private calculateScoreBreakdown(request: LyricScoringRequest): ScoreBreakdown {
    const { lyric, genre, songSection, model, targetLength } = request;
    
    return {
      creativity: this.scoreCreativity(lyric, genre),
      appropriateness: this.scoreAppropriatenesss(lyric, genre, songSection),
      quality: this.scoreQuality(lyric),
      memorability: this.scoreMemorability(lyric, songSection),
      uniqueness: this.scoreUniqueness(lyric, model),
      structure: this.scoreStructure(lyric, songSection, targetLength)
    };
  }

  /**
   * Score creativity and originality in lyrics
   */
  private scoreCreativity(lyric: string, genre?: string): number {
    // Use the CreativityAnalyzer from utils
    let score = CreativityAnalyzer.getCreativityScore(lyric, genre);
    
    // Additional lyric-specific creativity checks
    
    // Bonus for vivid imagery
    if (this.hasVividImagery(lyric)) {
      score += 0.15;
    }
    
    // Bonus for metaphors and figurative language
    if (this.hasMetaphoricLanguage(lyric)) {
      score += 0.12;
    }
    
    // Bonus for unexpected word choices
    if (this.hasUnexpectedWordChoices(lyric)) {
      score += 0.1;
    }
    
    // Penalty for conversational/generic language
    if (this.hasGenericLanguage(lyric)) {
      score -= 0.15;
    }
    
    // Bonus for emotional depth
    if (this.hasEmotionalDepth(lyric)) {
      score += 0.1;
    }

    return ScoringUtils.normalizeScore(score);
  }

  /**
   * Score genre and thematic appropriateness
   */
  private scoreAppropriatenesss(lyric: string, genre?: string, songSection?: string): number {
    let score = 0.6; // Base appropriateness
    
    // Genre appropriateness
    if (genre) {
      score += this.calculateGenreAppropriatenesss(lyric, genre);
    }
    
    // Song section appropriateness
    if (songSection) {
      score += this.calculateSectionAppropriatenesss(lyric, songSection);
    }
    
    // Thematic consistency
    score += this.calculateThematicConsistency(lyric);
    
    return ScoringUtils.normalizeScore(score);
  }

  /**
   * Score language quality (grammar, flow, rhythm)
   */
  private scoreQuality(lyric: string): number {
    let score = 0.5; // Base quality
    
    // Grammar and language correctness
    score += this.assessGrammarQuality(lyric) * 0.3;
    
    // Rhythm and flow
    score += this.assessRhythmicFlow(lyric) * 0.3;
    
    // Syllable distribution and singability
    score += this.assessSingability(lyric) * 0.2;
    
    // Pronunciation ease
    const pronunciationScore = TextAnalyzer.getPronunciationDifficulty(lyric);
    score += pronunciationScore * 0.2;

    return ScoringUtils.normalizeScore(score);
  }

  /**
   * Score memorability and emotional impact
   */
  private scoreMemorability(lyric: string, songSection?: string): number {
    let score = 0.4; // Base memorability
    
    // Hook potential (especially important for chorus)
    if (this.hasHookPotential(lyric)) {
      const bonus = songSection === 'chorus' ? 0.25 : 0.15;
      score += bonus;
    }
    
    // Emotional resonance
    if (this.hasEmotionalResonance(lyric)) {
      score += 0.2;
    }
    
    // Repetition and catchiness
    if (this.hasCatchyElements(lyric)) {
      score += 0.15;
    }
    
    // Relatable themes
    if (this.hasRelatableThemes(lyric)) {
      score += 0.1;
    }
    
    // Strong opening/closing
    if (this.hasStrongOpeningOrClosing(lyric)) {
      score += 0.1;
    }

    return ScoringUtils.normalizeScore(score);
  }

  /**
   * Score uniqueness and avoidance of clichés
   */
  private scoreUniqueness(lyric: string, model?: string): number {
    let score = 0.6; // Base uniqueness
    
    // Check against common lyrical clichés
    const lyricLower = lyric.toLowerCase();
    let clicheCount = 0;
    
    const lyricCliches = [
      'broken heart', 'tears fall', 'love song', 'dancing queen', 'wild night',
      'party time', 'rock and roll', 'friday night', 'summer love', 'broken dreams',
      'endless road', 'starlit sky', 'moonlit night', 'burning desire'
    ];
    
    for (const cliche of lyricCliches) {
      if (lyricLower.includes(cliche)) {
        clicheCount++;
      }
    }
    
    score -= clicheCount * 0.15;
    
    // Check for overused words in lyrics
    const overusedLyricWords = ['baby', 'girl', 'boy', 'yeah', 'oh', 'love', 'heart', 'soul'];
    let overusedCount = 0;
    
    for (const word of overusedLyricWords) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = lyric.match(regex);
      if (matches) {
        overusedCount += matches.length;
      }
    }
    
    score -= Math.min(0.3, overusedCount * 0.05);
    
    // Bonus for fresh language and original expressions
    if (this.hasFreshLanguage(lyric)) {
      score += 0.2;
    }
    
    // Small penalty for AI-generated content
    if (model && model.includes('ai') || model?.includes('gpt')) {
      score *= 0.98;
    }

    return ScoringUtils.normalizeScore(score);
  }

  /**
   * Score structural appropriateness
   */
  private scoreStructure(lyric: string, songSection?: string, targetLength?: string): number {
    const lines = lyric.split('\n').filter(line => line.trim().length > 0);
    const metrics = TextAnalyzer.getTextMetrics(lyric);
    let score = 0.6; // Base structure score
    
    // Line count appropriateness
    const idealLineCount = this.getIdealLineCount(songSection, targetLength);
    const lineCountDiff = Math.abs(lines.length - idealLineCount);
    
    if (lineCountDiff === 0) {
      score += 0.2;
    } else if (lineCountDiff <= 1) {
      score += 0.1;
    } else if (lineCountDiff >= 3) {
      score -= 0.2;
    }
    
    // Line length consistency
    if (this.hasGoodLineConsistency(lines)) {
      score += 0.15;
    }
    
    // Syllable distribution
    if (this.hasGoodSyllableDistribution(lines)) {
      score += 0.1;
    }
    
    // Rhyme scheme (if applicable)
    if (lines.length > 1 && this.hasGoodRhymeScheme(lines)) {
      score += 0.1;
    }
    
    // Appropriate total length
    if (this.hasAppropriateLength(lyric, targetLength)) {
      score += 0.05;
    }

    return ScoringUtils.normalizeScore(score);
  }

  // Helper methods for lyric-specific analysis

  private hasVividImagery(lyric: string): boolean {
    const imageryWords = [
      // Visual
      'blazing', 'shimmering', 'glowing', 'sparkling', 'fading', 'bright', 'dark',
      // Sensory
      'whisper', 'thunder', 'silence', 'echo', 'roar', 'gentle', 'rough',
      // Emotional imagery
      'burning', 'frozen', 'melting', 'soaring', 'falling', 'floating', 'crashing'
    ];
    
    const lyricLower = lyric.toLowerCase();
    return imageryWords.some(word => lyricLower.includes(word));
  }

  private hasMetaphoricLanguage(lyric: string): boolean {
    // Simple detection of metaphorical patterns
    const metaphorPatterns = [
      /like\s+\w+/gi,      // "like [something]"
      /as\s+\w+\s+as/gi,   // "as [something] as"
      /\w+\s+is\s+\w+/gi,  // "[something] is [something]"
      /heart\s+of\s+\w+/gi // "heart of [something]"
    ];
    
    return metaphorPatterns.some(pattern => pattern.test(lyric));
  }

  private hasUnexpectedWordChoices(lyric: string): boolean {
    const sophisticatedWords = [
      'ethereal', 'luminous', 'cascading', 'ephemeral', 'resonant', 'infinite',
      'transcendent', 'sublime', 'haunting', 'evocative', 'melancholy', 'bittersweet'
    ];
    
    const lyricLower = lyric.toLowerCase();
    return sophisticatedWords.some(word => lyricLower.includes(word));
  }

  private hasGenericLanguage(lyric: string): boolean {
    const genericPhrases = [
      'i love you', 'you love me', 'we can do it', 'everything is fine',
      'life is good', 'party tonight', 'dance all night', 'feel the beat'
    ];
    
    const lyricLower = lyric.toLowerCase();
    return genericPhrases.some(phrase => lyricLower.includes(phrase));
  }

  private hasEmotionalDepth(lyric: string): boolean {
    const emotionalWords = [
      'longing', 'yearning', 'aching', 'tender', 'vulnerable', 'raw',
      'profound', 'intimate', 'bittersweet', 'nostalgic', 'melancholy'
    ];
    
    const lyricLower = lyric.toLowerCase();
    return emotionalWords.some(word => lyricLower.includes(word));
  }

  private calculateGenreAppropriatenesss(lyric: string, genre: string): number {
    const genreThemes = {
      rock: ['freedom', 'rebellion', 'power', 'energy', 'wild', 'alive', 'fire'],
      metal: ['darkness', 'pain', 'strength', 'battle', 'steel', 'thunder', 'rage'],
      jazz: ['blue', 'smooth', 'night', 'love', 'soul', 'mellow', 'cool'],
      electronic: ['pulse', 'rhythm', 'digital', 'future', 'energy', 'electric'],
      folk: ['home', 'journey', 'story', 'heart', 'roots', 'simple', 'truth'],
      pop: ['love', 'dreams', 'dancing', 'bright', 'happy', 'together', 'shine'],
      country: ['home', 'road', 'heart', 'freedom', 'simple', 'real', 'strong'],
      indie: ['dreams', 'strange', 'wild', 'youth', 'echo', 'fade', 'bloom']
    };
    
    const themes = genreThemes[genre as keyof typeof genreThemes] || [];
    const lyricLower = lyric.toLowerCase();
    const matches = themes.filter(theme => lyricLower.includes(theme)).length;
    
    return Math.min(0.25, matches * 0.08);
  }

  private calculateSectionAppropriatenesss(lyric: string, section: string): number {
    const metrics = TextAnalyzer.getTextMetrics(lyric);
    
    switch (section) {
      case 'chorus':
        // Choruses should be catchy and repetitive
        if (this.hasCatchyElements(lyric) || this.hasRepetitiveElements(lyric)) {
          return 0.15;
        }
        break;
        
      case 'verse':
        // Verses should tell a story or set up themes
        if (this.hasNarrativeElements(lyric) || metrics.wordCount >= 8) {
          return 0.1;
        }
        break;
        
      case 'bridge':
        // Bridges should offer contrast or new perspective
        if (this.hasContrastingElements(lyric)) {
          return 0.12;
        }
        break;
        
      case 'pre-chorus':
        // Pre-choruses should build energy
        if (this.hasBuildingEnergy(lyric)) {
          return 0.1;
        }
        break;
    }
    
    return 0;
  }

  private calculateThematicConsistency(lyric: string): number {
    // Simple check for thematic coherence
    const words = lyric.toLowerCase().split(/\s+/);
    const themes = this.identifyThemes(words);
    
    // Bonus for coherent themes
    if (themes.length >= 1 && themes.length <= 3) {
      return 0.1;
    }
    
    return 0;
  }

  private assessGrammarQuality(lyric: string): number {
    let score = 0.8; // Assume good grammar by default
    
    // Simple grammar checks
    
    // Check for basic sentence structure
    if (!/[.!?]$/.test(lyric.trim())) {
      score -= 0.1; // Minor penalty for missing punctuation
    }
    
    // Check for proper capitalization at start
    if (lyric.length > 0 && lyric.charAt(0) !== lyric.charAt(0).toUpperCase()) {
      score -= 0.1;
    }
    
    // Check for excessive repetition of words
    const words = lyric.toLowerCase().split(/\s+/);
    const wordCounts = words.reduce((counts, word) => {
      counts[word] = (counts[word] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
    
    const maxRepetition = Math.max(...Object.values(wordCounts));
    if (maxRepetition > 3) {
      score -= 0.2;
    }
    
    return ScoringUtils.normalizeScore(score);
  }

  private assessRhythmicFlow(lyric: string): number {
    const lines = lyric.split('\n').filter(line => line.trim().length > 0);
    
    if (lines.length < 2) {
      // Single line - check internal rhythm
      return this.assessInternalRhythm(lyric);
    }
    
    // Multi-line - check consistency
    const syllableCounts = lines.map(line => TextAnalyzer.countSyllables(line));
    const avgSyllables = syllableCounts.reduce((sum, count) => sum + count, 0) / syllableCounts.length;
    
    // Check for consistent syllable counts
    const variance = syllableCounts.reduce((sum, count) => {
      return sum + Math.pow(count - avgSyllables, 2);
    }, 0) / syllableCounts.length;
    
    // Lower variance = better rhythm
    return ScoringUtils.normalizeScore(1 - Math.min(1, variance / 10));
  }

  private assessInternalRhythm(lyric: string): number {
    const words = lyric.split(/\s+/);
    const syllableCounts = words.map(word => TextAnalyzer.countSyllables(word));
    
    // Check for rhythmic patterns
    let rhythmScore = 0.5;
    
    // Bonus for varied but consistent rhythm
    const avgSyllables = syllableCounts.reduce((sum, count) => sum + count, 0) / syllableCounts.length;
    if (avgSyllables >= 1.5 && avgSyllables <= 2.5) {
      rhythmScore += 0.3;
    }
    
    return ScoringUtils.normalizeScore(rhythmScore);
  }

  private assessSingability(lyric: string): number {
    let score = 0.6; // Base singability
    
    // Check for difficult consonant clusters
    const difficultClusters = lyric.match(/[bcdfghjklmnpqrstvwxz]{3,}/gi);
    if (difficultClusters) {
      score -= difficultClusters.length * 0.1;
    }
    
    // Bonus for good vowel distribution
    const vowels = lyric.match(/[aeiou]/gi);
    const consonants = lyric.match(/[bcdfghjklmnpqrstvwxz]/gi);
    
    if (vowels && consonants) {
      const vowelRatio = vowels.length / (vowels.length + consonants.length);
      if (vowelRatio >= 0.3 && vowelRatio <= 0.5) {
        score += 0.2;
      }
    }
    
    // Penalty for tongue twisters
    if (this.hasTongueTwisters(lyric)) {
      score -= 0.2;
    }
    
    return ScoringUtils.normalizeScore(score);
  }

  private hasHookPotential(lyric: string): boolean {
    return (
      this.hasCatchyElements(lyric) ||
      this.hasRepetitiveElements(lyric) ||
      this.hasStrongRhyme(lyric) ||
      this.hasMemorablePhrase(lyric)
    );
  }

  private hasEmotionalResonance(lyric: string): boolean {
    const emotionalWords = [
      'love', 'heart', 'soul', 'pain', 'joy', 'tears', 'smile', 'dream',
      'hope', 'fear', 'anger', 'peace', 'lonely', 'together', 'forever'
    ];
    
    const lyricLower = lyric.toLowerCase();
    return emotionalWords.some(word => lyricLower.includes(word));
  }

  private hasCatchyElements(lyric: string): boolean {
    return (
      TextAnalyzer.hasAlliteration(lyric) ||
      this.hasInternalRhyme(lyric) ||
      this.hasRhythmicRepetition(lyric)
    );
  }

  private hasRelatableThemes(lyric: string): boolean {
    const universalThemes = [
      'love', 'life', 'time', 'change', 'hope', 'dreams', 'home', 'freedom',
      'friendship', 'family', 'journey', 'memory', 'future', 'youth'
    ];
    
    const lyricLower = lyric.toLowerCase();
    return universalThemes.some(theme => lyricLower.includes(theme));
  }

  private hasStrongOpeningOrClosing(lyric: string): boolean {
    const strongOpeners = [
      /^when\s/i, /^if\s/i, /^in\s+the\s/i, /^there\s/i, /^i\s+(see|feel|know|remember)/i
    ];
    
    const strongClosers = [
      /forever$/i, /away$/i, /home$/i, /today$/i, /tomorrow$/i
    ];
    
    return (
      strongOpeners.some(pattern => pattern.test(lyric)) ||
      strongClosers.some(pattern => pattern.test(lyric))
    );
  }

  private hasFreshLanguage(lyric: string): boolean {
    const freshWords = [
      'luminous', 'cascade', 'whisper', 'shimmer', 'bloom', 'drift', 'echo',
      'weave', 'breathe', 'dance', 'flow', 'rise', 'fall', 'soar'
    ];
    
    const lyricLower = lyric.toLowerCase();
    return freshWords.some(word => lyricLower.includes(word));
  }

  private getIdealLineCount(songSection?: string, targetLength?: string): number {
    if (targetLength) {
      switch (targetLength) {
        case 'short': return 1;
        case 'medium': return 2;
        case 'long': return 4;
        case 'couplet': return 2;
      }
    }
    
    // Fallback based on section
    switch (songSection) {
      case 'chorus': return 2;
      case 'verse': return 4;
      case 'bridge': return 2;
      case 'pre-chorus': return 2;
      default: return 2;
    }
  }

  private hasGoodLineConsistency(lines: string[]): boolean {
    if (lines.length < 2) return true;
    
    const lengths = lines.map(line => line.length);
    const avgLength = lengths.reduce((sum, len) => sum + len, 0) / lengths.length;
    
    // Check if all lines are within reasonable range of average
    return lines.every(line => {
      const diff = Math.abs(line.length - avgLength);
      return diff <= avgLength * 0.5; // Within 50% of average
    });
  }

  private hasGoodSyllableDistribution(lines: string[]): boolean {
    if (lines.length < 2) return true;
    
    const syllableCounts = lines.map(line => TextAnalyzer.countSyllables(line));
    const avgSyllables = syllableCounts.reduce((sum, count) => sum + count, 0) / syllableCounts.length;
    
    // Check variance in syllable counts
    const variance = syllableCounts.reduce((sum, count) => {
      return sum + Math.pow(count - avgSyllables, 2);
    }, 0) / syllableCounts.length;
    
    return variance <= 4; // Allow some variance but not too much
  }

  private hasGoodRhymeScheme(lines: string[]): boolean {
    if (lines.length < 2) return false;
    
    // Simple rhyme detection - check if any lines end with similar sounds
    const endings = lines.map(line => {
      const words = line.trim().split(/\s+/);
      return words[words.length - 1].toLowerCase().slice(-2);
    });
    
    // Check for any rhyming pairs
    for (let i = 0; i < endings.length; i++) {
      for (let j = i + 1; j < endings.length; j++) {
        if (endings[i] === endings[j]) {
          return true;
        }
      }
    }
    
    return false;
  }

  private hasAppropriateLength(lyric: string, targetLength?: string): boolean {
    const characterCount = lyric.length;
    
    switch (targetLength) {
      case 'short': return characterCount >= 10 && characterCount <= 50;
      case 'medium': return characterCount >= 20 && characterCount <= 100;
      case 'long': return characterCount >= 50 && characterCount <= 200;
      case 'couplet': return characterCount >= 30 && characterCount <= 120;
      default: return characterCount >= 15 && characterCount <= 150;
    }
  }

  private hasRepetitiveElements(lyric: string): boolean {
    const words = lyric.toLowerCase().split(/\s+/);
    const wordCounts = words.reduce((counts, word) => {
      counts[word] = (counts[word] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
    
    return Object.values(wordCounts).some(count => count >= 2);
  }

  private hasNarrativeElements(lyric: string): boolean {
    const narrativeWords = ['when', 'then', 'now', 'once', 'where', 'there', 'here'];
    const lyricLower = lyric.toLowerCase();
    return narrativeWords.some(word => lyricLower.includes(word));
  }

  private hasContrastingElements(lyric: string): boolean {
    const contrastWords = ['but', 'yet', 'still', 'though', 'however', 'while'];
    const lyricLower = lyric.toLowerCase();
    return contrastWords.some(word => lyricLower.includes(word));
  }

  private hasBuildingEnergy(lyric: string): boolean {
    const energyWords = ['rise', 'up', 'high', 'more', 'higher', 'stronger', 'louder'];
    const lyricLower = lyric.toLowerCase();
    return energyWords.some(word => lyricLower.includes(word));
  }

  private identifyThemes(words: string[]): string[] {
    const themeGroups = {
      love: ['love', 'heart', 'kiss', 'romance', 'together', 'forever'],
      freedom: ['free', 'wild', 'open', 'road', 'sky', 'escape'],
      time: ['time', 'moment', 'forever', 'now', 'then', 'tomorrow'],
      nature: ['sun', 'moon', 'star', 'river', 'mountain', 'tree', 'sky']
    };
    
    const foundThemes: string[] = [];
    
    for (const [theme, keywords] of Object.entries(themeGroups)) {
      if (keywords.some(keyword => words.includes(keyword))) {
        foundThemes.push(theme);
      }
    }
    
    return foundThemes;
  }

  private hasInternalRhyme(lyric: string): boolean {
    const words = lyric.toLowerCase().split(/\s+/);
    
    for (let i = 0; i < words.length - 1; i++) {
      for (let j = i + 1; j < words.length; j++) {
        if (this.doWordsRhyme(words[i], words[j])) {
          return true;
        }
      }
    }
    
    return false;
  }

  private doWordsRhyme(word1: string, word2: string): boolean {
    if (word1.length < 2 || word2.length < 2) return false;
    
    const ending1 = word1.slice(-2);
    const ending2 = word2.slice(-2);
    
    return ending1 === ending2 && word1 !== word2;
  }

  private hasRhythmicRepetition(lyric: string): boolean {
    const words = lyric.split(/\s+/);
    const firstLetters = words.map(word => word.charAt(0).toLowerCase());
    
    // Check for repetitive starting sounds
    const letterCounts = firstLetters.reduce((counts, letter) => {
      counts[letter] = (counts[letter] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
    
    return Object.values(letterCounts).some(count => count >= 3);
  }

  private hasStrongRhyme(lyric: string): boolean {
    const lines = lyric.split('\n').filter(line => line.trim().length > 0);
    return this.hasGoodRhymeScheme(lines);
  }

  private hasMemorablePhrase(lyric: string): boolean {
    // Check for short, impactful phrases
    const phrases = lyric.split(/[,.!?]/).map(phrase => phrase.trim());
    
    return phrases.some(phrase => {
      const wordCount = phrase.split(/\s+/).length;
      return wordCount >= 2 && wordCount <= 5 && phrase.length <= 25;
    });
  }

  private hasTongueTwisters(lyric: string): boolean {
    // Simple detection of difficult pronunciation patterns
    const difficultPatterns = [
      /([bcdfghjklmnpqrstvwxz])\1{2,}/gi, // Triple consonants
      /(sch|tch|dge|ght)/gi,             // Difficult combinations
    ];
    
    return difficultPatterns.some(pattern => pattern.test(lyric));
  }

  private getAdjustedWeights(genre?: string, songSection?: string) {
    let weights = { ...DEFAULT_LYRIC_WEIGHTS };
    
    // Apply genre-specific weight adjustments
    if (genre && GENRE_ADJUSTMENTS[genre]) {
      const genreWeights = GENRE_ADJUSTMENTS[genre].weights;
      weights = { ...weights, ...genreWeights };
    }
    
    // Section-specific adjustments
    if (songSection === 'chorus') {
      // Choruses prioritize memorability
      weights.memorability += 0.1;
      weights.quality += 0.05;
      weights.creativity -= 0.05;
      weights.structure -= 0.1;
    } else if (songSection === 'verse') {
      // Verses prioritize storytelling and appropriateness
      weights.appropriateness += 0.1;
      weights.creativity += 0.05;
      weights.memorability -= 0.1;
      weights.structure -= 0.05;
    }
    
    return weights;
  }

  private applyGenreBonus(baseScore: number, lyric: string, genre: string): number {
    if (!GENRE_ADJUSTMENTS[genre]) return baseScore;
    
    const bonusConfig = GENRE_ADJUSTMENTS[genre].bonuses;
    return ScoringUtils.applyGenreBonus(baseScore, lyric, genre, bonusConfig);
  }

  private generateWarnings(request: LyricScoringRequest, breakdown: ScoreBreakdown): string[] {
    const warnings: string[] = [];
    
    if (breakdown.quality < 0.4) {
      warnings.push('Low language quality - check grammar and flow');
    }
    
    if (breakdown.uniqueness < 0.3) {
      warnings.push('Contains common clichés or overused phrases');
    }
    
    if (breakdown.structure < 0.4) {
      warnings.push('Structure may not be optimal for the song section');
    }
    
    if (request.lyric.length > 200) {
      warnings.push('Lyric may be too long for the target section');
    }
    
    if (breakdown.memorability < 0.4 && request.songSection === 'chorus') {
      warnings.push('Chorus should be more memorable and catchy');
    }
    
    return warnings;
  }

  private calculateConfidence(request: LyricScoringRequest, breakdown: ScoreBreakdown): number {
    let confidence = 0.8; // Base confidence
    
    // Lower confidence for very short or very long lyrics
    if (request.lyric.length < 10 || request.lyric.length > 150) {
      confidence -= 0.1;
    }
    
    // Lower confidence when genre is unknown
    if (!request.genre) {
      confidence -= 0.1;
    }
    
    // Lower confidence for inconsistent scores
    const scores = Object.values(breakdown);
    const variance = this.calculateVariance(scores);
    if (variance > 0.1) {
      confidence -= 0.1;
    }
    
    return ScoringUtils.normalizeScore(confidence);
  }

  private calculateVariance(scores: number[]): number {
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const squaredDiffs = scores.map(score => Math.pow(score - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / scores.length;
  }
}