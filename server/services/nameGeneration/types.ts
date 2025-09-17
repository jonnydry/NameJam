export interface EnhancedWordSource {
  // Original raw word arrays (kept for compatibility)
  adjectives: string[];
  nouns: string[];
  verbs: string[];
  musicalTerms: string[];
  contextualWords: string[];
  associatedWords: string[];
  genreTerms: string[];
  lastfmWords: string[];
  spotifyWords: string[];
  conceptNetWords: string[];
  
  // Pre-filtered collections optimized for performance
  validAdjectives: string[];
  validNouns: string[];
  validVerbs: string[];
  validMusicalTerms: string[];
  validContextualWords: string[];
  validAssociatedWords: string[];
  validGenreTerms: string[];
  validLastfmWords: string[];
  validSpotifyWords: string[];
  validConceptNetWords: string[];
  
  // Length-specific pre-filtered arrays for pattern optimization
  shortWords: string[]; // 3-5 characters
  mediumWords: string[]; // 6-8 characters  
  longWords: string[]; // 9+ characters
  
  // Combined pre-filtered collections for quick access
  allValidWords: string[];
  qualityNouns: string[]; // High-scoring nouns for names
  qualityAdjectives: string[]; // High-scoring adjectives for names
}