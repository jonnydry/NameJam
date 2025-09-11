// Type definitions for the Lyric Starter Service

// Song structure types
export type SongSection = 'verse' | 'chorus' | 'bridge' | 'pre-chorus' | 'outro';
export type LengthType = 'short' | 'medium' | 'long' | 'couplet';
export type PoeticMeter = 'iambic' | 'trochaic' | 'anapestic' | 'dactylic' | 'free_verse';
export type RhymeScheme = 'AABB' | 'ABAB' | 'AAAA' | 'ABCB' | 'free' | 'internal';

// Length specification interface
export interface LengthSpec {
  lines: number;
  wordsPerLine: [number, number];
  totalSyllables: [number, number];
}

// Spotify audio features interface
export interface SpotifyAudioFeatures {
  energy?: number;
  valence?: number;
  danceability?: number;
  acousticness?: number;
  instrumentalness?: number;
  speechiness?: number;
  tempo?: number;
  key?: number;
  mode?: number;
  time_signature?: number;
}

// Last.fm genre info interface
export interface LastFmGenreInfo {
  name?: string;
  reach?: number;
  wiki?: string;
  summary?: string;
  content?: string;
  tags?: string[];
}

// API Context interfaces
export interface DatamuseContext {
  genreWords: string[];
  emotionalWords: string[];
  rhymeWords: string[];
  sensoryWords: string[];
}

export interface SpotifyContext {
  genreArtists: string[];
  moodTracks: string[];
  audioFeatures: SpotifyAudioFeatures | null;
}

export interface LastFmContext {
  genreInfo: LastFmGenreInfo | null;
  topArtists: string[];
  relatedGenres: string[];
}

export interface ConceptNetContext {
  genreConcepts: string[];
  emotionalConcepts: string[];
  culturalAssociations: string[];
}

export interface PoetryContext {
  poeticPhrases: string[];
  vocabulary: string[];
  imagery: string[];
  themes: string[];
}

// Complete API context interface (legacy - kept for backward compatibility)
export interface ComprehensiveAPIContext {
  datamuse: DatamuseContext;
  spotify: SpotifyContext;
  lastfm: LastFmContext;
  conceptnet: ConceptNetContext;
  poetry: PoetryContext;
}

// Streamlined context interface for focused lyric generation
export interface StreamlinedCoreContext {
  vocabulary: {
    genreTerms: string[];
    emotionalTerms: string[];
  };
  cultural: {
    artists: string[];
    relatedGenres: string[];
  };
  poetic: {
    vocabulary: string[];
    themes: string[];
  };
  backup: {
    artists: string[];
  };
}

// Lyric generation prompt structure
export interface LyricPromptStructure {
  lengthType: LengthType;
  lines: number;
  wordsPerLine: [number, number];
  syllableRange: [number, number];
  poeticMeter: PoeticMeter;
  rhymeScheme: RhymeScheme;
}

export interface LyricPromptParameters {
  genre: string;
  songSection: SongSection;
  structure: LyricPromptStructure;
  coreContext: StreamlinedCoreContext;
  tone?: {
    emotional?: string;
    energy?: string;
    style?: string;
  };
  requirements?: string[];
}

// Legacy interface for backward compatibility
export interface LegacyLyricPromptParameters {
  genre: string;
  songSection: SongSection;
  structure: LyricPromptStructure;
  apiContext: {
    datamuse: Partial<DatamuseContext>;
    spotify: Partial<SpotifyContext>;
    lastfm: Partial<LastFmContext>;
    conceptnet: Partial<ConceptNetContext>;
    poetry: Partial<PoetryContext>;
  };
  tone?: {
    emotional?: string;
    energy?: string;
    style?: string;
  };
  requirements?: string[];
}

export interface LyricPrompt {
  task: string;
  parameters: LyricPromptParameters;
}

// Result interfaces
export interface LyricGenerationResult {
  lyric: string;
  model: string;
  songSection?: SongSection;
}

export interface LyricGenerationError extends Error {
  code: 'API_ERROR' | 'TIMEOUT' | 'VALIDATION_ERROR' | 'FALLBACK_ERROR';
  originalError?: unknown;
  context?: string;
}

// Configuration interfaces
export interface LyricServiceConfig {
  openAI: {
    model: string;
    temperature: number;
    maxTokens: number;
    frequencyPenalty: number;
    presencePenalty: number;
    retryAttempts: number;
    retryDelay: number;
  };
  api: {
    timeoutMs: number;
    cacheTTLSeconds: number;
    maxConcurrentCalls: number;
  };
  generation: {
    maxWordCount: number;
    minWordCount: number;
    maxRetries: number;
  };
}

// Cache entry interface
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
}

// Request tracking for rate limiting
export interface RequestMetadata {
  genre?: string;
  timestamp: number;
  duration?: number;
  success: boolean;
  model?: string;
  cacheHit?: boolean;
}