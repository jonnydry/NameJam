/**
 * Utility functions for creating and managing EnhancedWordSource objects
 */

import { EnhancedWordSource } from './types';
import { isPoeticWord, isProblematicWord } from './wordValidation';
import { isMusicallyAppropriate } from './musicalWordFilter';

/**
 * Converts basic word arrays to a properly structured EnhancedWordSource
 */
export function createEnhancedWordSource(basicWordSource: {
  adjectives?: string[];
  nouns?: string[];
  verbs?: string[];
  musicalTerms?: string[];
  contextualWords?: string[];
  associatedWords?: string[];
  genreTerms?: string[];
  lastfmWords?: string[];
  spotifyWords?: string[];
  conceptNetWords?: string[];
}): EnhancedWordSource {
  // Helper function to filter words with quality checks
  function applyQualityFilter(words: string[]): string[] {
    return words
      .filter(w => w && typeof w === 'string')
      .map(w => w.trim().toLowerCase())
      .filter(w => w.length >= 3 && w.length <= 15)
      .filter(w => !isProblematicWord(w))
      .filter(w => isPoeticWord(w))
      .filter(w => isMusicallyAppropriate(w))
      .filter((word, index, array) => array.indexOf(word) === index) // Remove duplicates
      .slice(0, 100); // Limit to 100 words per category
  }

  // Initialize with defaults for missing arrays
  const sources: EnhancedWordSource = {
    // Original raw word arrays (kept for compatibility)
    adjectives: basicWordSource.adjectives || [],
    nouns: basicWordSource.nouns || [],
    verbs: basicWordSource.verbs || [],
    musicalTerms: basicWordSource.musicalTerms || [],
    contextualWords: basicWordSource.contextualWords || [],
    associatedWords: basicWordSource.associatedWords || [],
    genreTerms: basicWordSource.genreTerms || [],
    lastfmWords: basicWordSource.lastfmWords || [],
    spotifyWords: basicWordSource.spotifyWords || [],
    conceptNetWords: basicWordSource.conceptNetWords || [],
    
    // Pre-filtered collections populated by cleanWordSources
    validAdjectives: [],
    validNouns: [],
    validVerbs: [],
    validMusicalTerms: [],
    validContextualWords: [],
    validAssociatedWords: [],
    validGenreTerms: [],
    validLastfmWords: [],
    validSpotifyWords: [],
    validConceptNetWords: [],
    
    // Length-specific pre-filtered arrays
    shortWords: [],
    mediumWords: [],
    longWords: [],
    
    // Combined pre-filtered collections
    allValidWords: [],
    qualityNouns: [],
    qualityAdjectives: []
  };

  // Apply quality filtering to create valid arrays
  sources.validAdjectives = applyQualityFilter(sources.adjectives);
  sources.validNouns = applyQualityFilter(sources.nouns);
  sources.validVerbs = applyQualityFilter(sources.verbs);
  sources.validMusicalTerms = applyQualityFilter(sources.musicalTerms);
  sources.validContextualWords = applyQualityFilter(sources.contextualWords);
  sources.validAssociatedWords = applyQualityFilter(sources.associatedWords);
  sources.validGenreTerms = applyQualityFilter(sources.genreTerms);
  sources.validLastfmWords = applyQualityFilter(sources.lastfmWords);
  sources.validSpotifyWords = applyQualityFilter(sources.spotifyWords);
  sources.validConceptNetWords = applyQualityFilter(sources.conceptNetWords);

  // Create combined collection
  sources.allValidWords = [
    ...sources.validAdjectives,
    ...sources.validNouns,
    ...sources.validVerbs,
    ...sources.validMusicalTerms,
    ...sources.validContextualWords,
    ...sources.validAssociatedWords,
    ...sources.validGenreTerms,
    ...sources.validLastfmWords,
    ...sources.validSpotifyWords,
    ...sources.validConceptNetWords
  ].filter((word, index, array) => array.indexOf(word) === index); // Remove duplicates

  // Create length-specific arrays
  sources.shortWords = sources.allValidWords.filter(w => w.length >= 3 && w.length <= 5);
  sources.mediumWords = sources.allValidWords.filter(w => w.length >= 6 && w.length <= 8);
  sources.longWords = sources.allValidWords.filter(w => w.length >= 9);

  // Create high-quality collections with additional scoring
  const scoreWord = (word: string): number => {
    let score = 0;
    if (word.length >= 5 && word.length <= 8) score += 2; // Optimal length
    if (/^.*ness$|^.*less$|^.*ful$|^.*ous$|^.*ent$|^.*ant$|^.*ive$|^.*ic$/.test(word)) score += 3; // Poetic endings
    if (['shadow', 'light', 'soul', 'heart', 'dream', 'fire', 'storm'].some(w => word.includes(w))) score += 2; // Core poetic words
    return score;
  };

  // Quality nouns for band/song names
  sources.qualityNouns = [...sources.validNouns, ...sources.validMusicalTerms, ...sources.validAssociatedWords]
    .filter(w => w.length >= 4 && w.length <= 10)
    .sort((a, b) => scoreWord(b) - scoreWord(a))
    .slice(0, 50);

  // Quality adjectives for descriptive names
  sources.qualityAdjectives = sources.validAdjectives
    .filter(w => w.length >= 4 && w.length <= 9)
    .sort((a, b) => scoreWord(b) - scoreWord(a))
    .slice(0, 40);

  return sources;
}

/**
 * Creates a minimal EnhancedWordSource with fallback words when external sources fail
 */
export function createFallbackEnhancedWordSource(): EnhancedWordSource {
  const fallbackWords = {
    adjectives: ['electric', 'golden', 'silver', 'midnight', 'crystal', 'velvet', 'wild', 'bright', 'dark', 'fierce'],
    nouns: ['dreams', 'echoes', 'shadows', 'lights', 'hearts', 'souls', 'storms', 'waves', 'fire', 'thunder'],
    verbs: ['rising', 'falling', 'burning', 'flowing', 'dancing', 'singing', 'playing', 'running', 'flying', 'shining'],
    musicalTerms: ['melody', 'rhythm', 'harmony', 'beat', 'pulse', 'tune', 'sound', 'music', 'song', 'voice'],
    contextualWords: ['night', 'day', 'sky', 'earth', 'water', 'wind', 'sun', 'moon', 'star', 'rain'],
    associatedWords: ['power', 'energy', 'force', 'spirit', 'magic', 'wonder', 'beauty', 'grace', 'strength', 'freedom'],
    genreTerms: ['rock', 'blues', 'jazz', 'folk', 'soul', 'funk', 'indie', 'alternative', 'ambient', 'acoustic'],
    lastfmWords: ['artist', 'album', 'track', 'band', 'music', 'sound', 'genre', 'style', 'vibe', 'mood'],
    spotifyWords: ['playlist', 'stream', 'discover', 'explore', 'listen', 'play', 'shuffle', 'repeat', 'favorite', 'top'],
    conceptNetWords: ['concept', 'idea', 'thought', 'feeling', 'emotion', 'sense', 'vision', 'dream', 'hope', 'love']
  };

  return createEnhancedWordSource(fallbackWords);
}