import { datamuseService, DatamuseService } from './datamuseService';
import { lastfmService } from './lastfmService';
import { SpotifyService } from './spotifyService';
import { conceptNetService } from './conceptNetService';
import type { GenerateNameRequest } from '@shared/schema';
import { secureLog } from '../utils/secureLogger';

interface EnhancedWordSource {
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
}

export class EnhancedNameGeneratorService {
  private datamuseService: DatamuseService;
  private spotifyService: SpotifyService;
  private recentWords: Set<string> = new Set();
  private maxRecentWords: number = 100; // Track last 100 words

  constructor() {
    this.datamuseService = datamuseService;
    this.spotifyService = new SpotifyService();
  }

  // Enhanced generation using Datamuse API for contextual relationships
  async generateEnhancedNames(request: GenerateNameRequest): Promise<Array<{name: string, isAiGenerated: boolean, source: string}>> {
    const { type, wordCount, count, mood, genre } = request;
    const names: Array<{name: string, isAiGenerated: boolean, source: string}> = [];

    secureLog.debug(`🚀 Enhanced generation: ${count} ${type} names with ${wordCount} words`);

    // Build contextual word sources using Datamuse API
    const wordSources = await this.buildContextualWordSources(mood, genre, type);

    let attempts = 0;
    const maxAttempts = count * 3; // Allow extra attempts for quality control

    while (names.length < count && attempts < maxAttempts) {
      attempts++;
      try {
        const name = await this.generateContextualName(type, wordCount, wordSources, mood, genre);
        
        // Quality validation and check for repeated words
        if (name && this.isValidName(name, wordCount) && !names.find(n => n.name === name) && !this.hasRecentWords(name)) {
          this.trackWords(name);
          names.push({ 
            name, 
            isAiGenerated: false, 
            source: 'datamuse-enhanced' 
          });
        }
      } catch (error) {
        secureLog.error('Enhanced generation error:', error);
      }
      
      // Always attempt fallback if we still need more names
      if (names.length < count) {
        const fallbackName = this.generateFallbackName(wordSources, wordCount);
        if (fallbackName && this.isValidName(fallbackName, wordCount) && !names.find(n => n.name === fallbackName) && !this.hasRecentWords(fallbackName)) {
          this.trackWords(fallbackName);
          names.push({ 
            name: fallbackName, 
            isAiGenerated: false, 
            source: 'fallback' 
          });
        }
      }
    }

    return names.slice(0, count);
  }

  // Build word sources using Datamuse's contextual relationships + Last.fm genre intelligence
  async buildContextualWordSources(mood?: string, genre?: string, type?: string): Promise<EnhancedWordSource> {
    const sources: EnhancedWordSource = {
      adjectives: [],
      nouns: [],
      verbs: [],
      musicalTerms: [],
      contextualWords: [],
      associatedWords: [],
      genreTerms: [],
      lastfmWords: [],
      spotifyWords: [],
      conceptNetWords: []
    };

    try {
      // Map moods/genres to more poetic seed words
      const poeticSeeds = this.getPoeticSeedWords(mood, genre);
      
      // Use Promise.allSettled for parallel API calls when possible
      const apiPromises = [];
      
      // STEP 1: Enhanced Last.fm Integration for Genre Intelligence
      if (genre) {
        secureLog.debug(`🎵 Fetching Last.fm vocabulary for genre: ${genre}`);
        try {
          const genreVocab = await lastfmService.getGenreVocabulary(genre);
          sources.genreTerms.push(...genreVocab.genreTerms);
          sources.lastfmWords.push(...genreVocab.descriptiveWords);
          sources.contextualWords.push(...genreVocab.relatedGenres);
          
          secureLog.debug(`✅ Last.fm integration successful:`, {
            genreTerms: genreVocab.genreTerms.length,
            descriptiveWords: genreVocab.descriptiveWords.length,
            confidence: genreVocab.confidence
          });
        } catch (error) {
          secureLog.error('Last.fm integration failed, continuing with Datamuse only:', error);
        }
      }

      // STEP 2: Spotify Integration for Genre/Mood Vocabulary
      sources.spotifyWords = [];
      try {
        if (genre) {
          secureLog.debug(`🎵 Fetching Spotify genre-specific artists for: ${genre}`);
          const genreArtists = await this.spotifyService.getGenreArtists(genre, 30);
          const genreTracks = await this.spotifyService.searchTracks(genre, 20);
          const spotifyVocab = this.spotifyService.extractVocabularyPatterns(genreArtists, genreTracks);
          sources.spotifyWords.push(...spotifyVocab.filter(w => this.isPoeticWord(w)));
          secureLog.debug(`✅ Spotify genre integration: ${spotifyVocab.length} words extracted`);
        }
        
        if (mood) {
          secureLog.debug(`🎵 Fetching Spotify mood-based tracks for: ${mood}`);
          const moodTracks = await this.spotifyService.getMoodTracks(mood, 30);
          const moodArtists = await this.spotifyService.searchArtists(mood, 20);
          const spotifyMoodVocab = this.spotifyService.extractVocabularyPatterns(moodArtists, moodTracks);
          sources.spotifyWords.push(...spotifyMoodVocab.filter(w => this.isPoeticWord(w)));
          secureLog.debug(`✅ Spotify mood integration: ${spotifyMoodVocab.length} words extracted`);
        }
      } catch (error) {
        secureLog.error('Spotify integration failed, continuing with other sources:', error);
      }

      // STEP 3: ConceptNet Integration for Conceptual Associations
      sources.conceptNetWords = [];
      try {
        if (genre) {
          secureLog.debug(`🧠 Fetching ConceptNet associations for genre: ${genre}`);
          const genreAssociations = await conceptNetService.getGenreAssociations(genre);
          sources.conceptNetWords.push(...genreAssociations.filter(w => this.isPoeticWord(w)));
          secureLog.debug(`✅ ConceptNet genre integration: ${genreAssociations.length} concepts found`);
        }
        
        if (mood) {
          secureLog.debug(`🧠 Fetching ConceptNet emotional associations for: ${mood}`);
          const emotionalAssociations = await conceptNetService.getEmotionalAssociations(mood);
          sources.conceptNetWords.push(...emotionalAssociations.filter(w => this.isPoeticWord(w)));
          secureLog.debug(`✅ ConceptNet mood integration: ${emotionalAssociations.length} concepts found`);
        }
        
        // Get cultural connections for some seed words
        if (poeticSeeds.emotional.length > 0) {
          const culturalWord = poeticSeeds.emotional[0];
          const culturalConnections = await conceptNetService.getCulturalConnections(culturalWord);
          sources.conceptNetWords.push(...culturalConnections.filter(w => this.isPoeticWord(w)));
        }
      } catch (error) {
        secureLog.error('ConceptNet integration failed, continuing with other sources:', error);
      }

      // STEP 4: Get words using multiple linguistic relationships for richness  
      secureLog.debug(`🎨 Building poetic word palette...`);
      
      // 3. Get emotionally evocative words (process only first 2 seeds to reduce API calls)
      const emotionalSeeds = poeticSeeds.emotional.slice(0, 2);
      for (const seed of emotionalSeeds) {
        const emotionalWords = await this.datamuseService.findWords({
          triggers: seed, // Words statistically associated
          topics: `${mood || 'emotion'} music poetry`,
          maxResults: 15 // Reduced from 20
        });
        // Filter for quality
        const poeticWords = emotionalWords
          .filter(w => this.isPoeticWord(w.word) && !this.isProblematicWord(w.word))
          .map(w => w.word);
        sources.contextualWords.push(...poeticWords);
      }
      
      // 4. Get sensory/imagery words (process only first 2 seeds)
      const sensorySeeds = poeticSeeds.sensory.slice(0, 2);
      for (const seed of sensorySeeds) {
        const sensoryWords = await this.datamuseService.findWords({
          meansLike: seed,
          topics: 'nature poetry music',
          maxResults: 10 // Reduced from 15
        });
        // Filter for quality
        const poeticWords = sensoryWords
          .filter(w => this.isPoeticWord(w.word) && !this.isProblematicWord(w.word))
          .map(w => w.word);
        sources.associatedWords.push(...poeticWords);
      }
      
      // 5. Get musical/rhythmic words (reduce to 2 seeds)
      const musicalSeeds = ['melody', 'rhythm'];
      for (const seed of musicalSeeds) {
        const musicWords = await this.datamuseService.findWords({
          triggers: seed,
          topics: 'music sound',
          maxResults: 8 // Reduced from 10
        });
        sources.musicalTerms.push(...musicWords.map(w => w.word));
      }
      
      // 6. Get adjectives using linguistic patterns (limit to 3 seeds)
      secureLog.debug(`✨ Finding evocative adjectives...`);
      const adjectiveSeeds = this.getAdjectiveSeeds(mood, genre).slice(0, 3);
      for (const seed of adjectiveSeeds) {
        const adjs = await this.datamuseService.findAdjectivesForNoun(seed, 10); // Reduced from 15
        sources.adjectives.push(...adjs.map((w: any) => w.word));
      }
      
      // 7. Get poetic nouns using associations (limit to 3 seeds)
      secureLog.debug(`🌟 Finding poetic nouns...`);
      const nounSeeds = this.getNounSeeds(mood, genre).slice(0, 3);
      for (const seed of nounSeeds) {
        const nouns = await this.datamuseService.findWords({
          triggers: seed,
          maxResults: 10 // Reduced from 15
        });
        // Filter for concrete, evocative nouns
        const poeticNouns = nouns.filter(w => {
          const word = w.word;
          return word.length >= 3 && 
            word.length <= 10 &&
            !this.isProblematicWord(word) &&
            this.isPoeticWord(word) &&
            !/^[A-Z]/.test(word); // Avoid proper nouns
        });
        sources.nouns.push(...poeticNouns.map(w => w.word));
      }
      
      // Clean and deduplicate all sources
      this.cleanWordSources(sources);

      secureLog.debug(`📊 Word sources built:`, {
        adjectives: sources.adjectives.length,
        nouns: sources.nouns.length,
        verbs: sources.verbs.length,
        musicalTerms: sources.musicalTerms.length,
        genreTerms: sources.genreTerms.length,
        lastfmWords: sources.lastfmWords.length,
        spotifyWords: sources.spotifyWords.length,
        conceptNetWords: sources.conceptNetWords.length,
        total: sources.adjectives.length + sources.nouns.length + sources.verbs.length + sources.musicalTerms.length + sources.genreTerms.length + sources.lastfmWords.length + sources.spotifyWords.length + sources.conceptNetWords.length
      });

    } catch (error) {
      secureLog.error('Error building word sources:', error);
      // Provide poetic fallback words
      sources.adjectives = ['midnight', 'velvet', 'silver', 'wild', 'burning'];
      sources.nouns = ['moon', 'thunder', 'shadow', 'ocean', 'dream'];
      sources.verbs = ['dance', 'whisper', 'ignite', 'soar', 'shatter'];
      sources.musicalTerms = ['echo', 'melody', 'rhythm', 'harmony', 'silence'];
      sources.genreTerms = [];
      sources.lastfmWords = [];
      sources.spotifyWords = [];
      sources.conceptNetWords = [];
    }

    return sources;
  }
  
  // Get poetic seed words based on mood/genre
  private getPoeticSeedWords(mood?: string, genre?: string): { emotional: string[], sensory: string[] } {
    const seeds = {
      emotional: ['soul', 'heart', 'spirit'],
      sensory: ['light', 'sound', 'touch']
    };
    
    // Add mood-specific seeds (comprehensive for all moods)
    if (mood) {
      const moodSeeds: Record<string, { emotional: string[], sensory: string[] }> = {
        dark: { emotional: ['shadow', 'void', 'abyss', 'doom', 'despair', 'nightmare'], sensory: ['darkness', 'silence', 'cold', 'blackness', 'emptiness', 'chill'] },
        bright: { emotional: ['joy', 'light', 'hope', 'bliss', 'radiance', 'happiness'], sensory: ['sunshine', 'warmth', 'glow', 'brilliance', 'sparkle', 'luminance'] },
        energetic: { emotional: ['fire', 'electric', 'surge', 'power', 'force', 'vitality'], sensory: ['thunder', 'spark', 'blast', 'lightning', 'explosion', 'rush'] },
        melancholy: { emotional: ['sorrow', 'longing', 'rain', 'grief', 'yearning', 'regret'], sensory: ['mist', 'twilight', 'echo', 'drizzle', 'fog', 'dusk'] },
        mysterious: { emotional: ['enigma', 'secret', 'mystic', 'riddle', 'unknown', 'puzzle'], sensory: ['fog', 'whisper', 'veil', 'shadow', 'haze', 'obscurity'] },
        ethereal: { emotional: ['dream', 'celestial', 'spirit', 'transcendent', 'divine', 'sublime'], sensory: ['starlight', 'breath', 'shimmer', 'mist', 'glow', 'radiance'] },
        aggressive: { emotional: ['rage', 'fury', 'wrath', 'anger', 'violence', 'hatred'], sensory: ['crash', 'roar', 'scream', 'smash', 'crush', 'pound'] },
        peaceful: { emotional: ['calm', 'tranquil', 'serene', 'gentle', 'quiet', 'harmony'], sensory: ['breeze', 'water', 'soft', 'flow', 'hush', 'stillness'] },
        nostalgic: { emotional: ['memory', 'past', 'remembrance', 'yesterday', 'youth', 'history'], sensory: ['sepia', 'vintage', 'faded', 'worn', 'aged', 'classic'] },
        futuristic: { emotional: ['tomorrow', 'evolution', 'progress', 'innovation', 'advance', 'destiny'], sensory: ['chrome', 'neon', 'laser', 'digital', 'hologram', 'quantum'] },
        romantic: { emotional: ['love', 'passion', 'desire', 'heart', 'romance', 'devotion'], sensory: ['rose', 'silk', 'velvet', 'candlelight', 'moonlight', 'caress'] },
        epic: { emotional: ['legend', 'hero', 'glory', 'triumph', 'saga', 'destiny'], sensory: ['thunder', 'mountain', 'horizon', 'vastness', 'grandeur', 'majesty'] }
      };
      
      if (moodSeeds[mood]) {
        seeds.emotional.push(...moodSeeds[mood].emotional);
        seeds.sensory.push(...moodSeeds[mood].sensory);
      }
    }
    
    // Add genre-specific seeds
    if (genre) {
      const genreSeeds: Record<string, string[]> = {
        rock: ['thunder', 'steel', 'storm', 'rebel', 'power', 'edge', 'fury', 'lightning', 'roar', 'anthem', 'concrete', 'velocity', 'avalanche', 'hurricane', 'volcano', 'earthquake'],
        metal: ['iron', 'chaos', 'inferno', 'rage', 'darkness', 'doom', 'brutal', 'apocalypse', 'carnage', 'venom', 'serpent', 'torment', 'blade', 'skull', 'demon', 'throne'],
        electronic: ['neon', 'pulse', 'digital', 'circuit', 'synth', 'cyber', 'matrix', 'laser', 'binary', 'quantum', 'pixel', 'voltage', 'frequency', 'techno', 'bass', 'glitch'],
        jazz: ['blue', 'smoke', 'velvet', 'midnight', 'swing', 'sax', 'bourbon', 'groove', 'cool', 'bebop', 'smooth', 'brass', 'rhythm', 'note', 'club', 'lounge'],
        folk: ['river', 'mountain', 'home', 'story', 'wood', 'meadow', 'valley', 'harvest', 'journey', 'tradition', 'cabin', 'campfire', 'wanderer', 'trail', 'autumn', 'oak'],
        indie: ['dream', 'city', 'youth', 'wonder', 'coffee', 'vintage', 'bicycle', 'sunset', 'rooftop', 'streetlight', 'notebook', 'polaroid', 'thrift', 'vinyl', 'bedroom', 'nostalgia'],
        pop: ['bubble', 'sparkle', 'sugar', 'rainbow', 'shine', 'glitter', 'candy', 'neon', 'dance', 'summer', 'beach', 'party', 'diamond', 'star', 'magic', 'bright'],
        country: ['dust', 'road', 'whiskey', 'boots', 'truck', 'ranch', 'barn', 'field', 'fence', 'saddle', 'creek', 'honky-tonk', 'backroad', 'dixie', 'heartland', 'holler'],
        blues: ['muddy', 'crossroads', 'train', 'bottle', 'mississippi', 'harmonica', 'chain', 'mojo', 'gravel', 'freight', 'levee', 'juke', 'hobo', 'rambler', 'twelve-bar', 'soul'],
        reggae: ['island', 'roots', 'sun', 'peace', 'dread', 'babylon', 'zion', 'irie', 'riddim', 'dub', 'ganja', 'rastafari', 'kingston', 'yard', 'sound-system', 'vibration'],
        punk: ['riot', 'anarchy', 'crash', 'rebel', 'chaos', 'spit', 'scream', 'destroy', 'noise', 'underground', 'mohawk', 'safety-pin', 'graffiti', 'DIY', 'revolution', 'clash'],
        hip_hop: ['street', 'flow', 'beat', 'rhyme', 'cipher', 'grind', 'hustle', 'hood', 'block', 'boom', 'scratch', 'sample', 'turntable', 'mic', 'freestyle', 'breakbeat'],
        classical: ['symphony', 'sonata', 'aria', 'opus', 'concerto', 'crescendo', 'allegro', 'baroque', 'chamber', 'fugue', 'prelude', 'nocturne', 'waltz', 'minuet', 'adagio', 'forte'],
        alternative: ['strange', 'echo', 'mirror', 'twisted', 'void', 'static', 'distortion', 'feedback', 'experimental', 'underground', 'abstract', 'surreal', 'chaos', 'raw', 'unpolished', 'edge']
      };
      
      if (genreSeeds[genre]) {
        seeds.emotional.push(...genreSeeds[genre]);
      }
    }
    
    return seeds;
  }
  
  // Get seed words for finding adjectives
  private getAdjectiveSeeds(mood?: string, genre?: string): string[] {
    const baseSeeds = ['moon', 'fire', 'ocean', 'night', 'dream'];
    
    // Mood-specific adjective seeds
    if (mood === 'dark') return ['shadow', 'void', 'storm', 'midnight', 'black', 'grim'];
    if (mood === 'bright') return ['sun', 'crystal', 'gold', 'diamond', 'radiant', 'luminous'];
    if (mood === 'energetic') return ['electric', 'wild', 'explosive', 'fierce', 'dynamic', 'kinetic'];
    if (mood === 'melancholy') return ['rain', 'gray', 'autumn', 'fading', 'distant', 'wistful'];
    if (mood === 'mysterious') return ['shadow', 'hidden', 'cryptic', 'veiled', 'enigmatic', 'mystic'];
    if (mood === 'ethereal') return ['celestial', 'floating', 'transparent', 'gossamer', 'delicate', 'sublime'];
    
    // Genre-specific adjective seeds
    if (genre === 'rock') return ['thunder', 'steel', 'raw', 'rebel', 'heavy', 'loud'];
    if (genre === 'metal') return ['dark', 'brutal', 'savage', 'infernal', 'demonic', 'apocalyptic'];
    if (genre === 'electronic') return ['neon', 'digital', 'pulse', 'laser', 'synthetic', 'cybernetic'];
    if (genre === 'jazz') return ['smooth', 'sultry', 'cool', 'blue', 'mellow', 'swinging'];
    if (genre === 'folk') return ['wooden', 'earthy', 'homespun', 'rustic', 'weathered', 'natural'];
    if (genre === 'indie') return ['quirky', 'vintage', 'dreamy', 'nostalgic', 'lo-fi', 'authentic'];
    if (genre === 'pop') return ['bright', 'catchy', 'bubbly', 'sweet', 'glossy', 'sparkling'];
    if (genre === 'country') return ['dusty', 'lonesome', 'rugged', 'homegrown', 'southern', 'weathered'];
    if (genre === 'blues') return ['muddy', 'lonesome', 'weary', 'soulful', 'gritty', 'raw'];
    if (genre === 'reggae') return ['irie', 'rootsy', 'tropical', 'peaceful', 'conscious', 'dread'];
    if (genre === 'punk') return ['raw', 'angry', 'chaotic', 'anarchic', 'rebellious', 'underground'];
    if (genre === 'hip_hop') return ['street', 'fresh', 'urban', 'underground', 'real', 'flow'];
    if (genre === 'classical') return ['elegant', 'refined', 'majestic', 'baroque', 'romantic', 'grand'];
    if (genre === 'alternative') return ['strange', 'experimental', 'abstract', 'unorthodox', 'surreal', 'avant-garde'];
    
    return baseSeeds;
  }
  
  // Get seed words for finding nouns
  private getNounSeeds(mood?: string, genre?: string): string[] {
    const baseSeeds = ['heart', 'soul', 'sky', 'star', 'wave'];
    
    // Mood-specific noun seeds
    if (mood === 'dark') return ['shadow', 'abyss', 'ghost', 'raven', 'void', 'nightmare'];
    if (mood === 'bright') return ['light', 'rainbow', 'sunrise', 'crystal', 'sunshine', 'beacon'];
    if (mood === 'mysterious') return ['enigma', 'phantom', 'oracle', 'maze', 'riddle', 'secret'];
    if (mood === 'melancholy') return ['rain', 'tears', 'sorrow', 'memory', 'echo', 'twilight'];
    if (mood === 'energetic') return ['storm', 'lightning', 'thunder', 'fire', 'explosion', 'surge'];
    if (mood === 'ethereal') return ['mist', 'dream', 'spirit', 'angel', 'aurora', 'starlight'];
    
    // Genre-specific noun seeds
    if (genre === 'rock') return ['thunder', 'guitar', 'stage', 'anthem', 'rebel', 'highway'];
    if (genre === 'metal') return ['blade', 'iron', 'demon', 'throne', 'apocalypse', 'inferno'];
    if (genre === 'electronic') return ['circuit', 'pulse', 'synth', 'matrix', 'laser', 'bass'];
    if (genre === 'jazz') return ['saxophone', 'club', 'blues', 'groove', 'note', 'rhythm'];
    if (genre === 'folk') return ['river', 'tree', 'home', 'road', 'story', 'mountain'];
    if (genre === 'indie') return ['city', 'coffee', 'bicycle', 'rooftop', 'record', 'dream'];
    if (genre === 'pop') return ['star', 'dance', 'party', 'summer', 'love', 'magic'];
    if (genre === 'country') return ['truck', 'road', 'farm', 'cowboy', 'boots', 'saddle'];
    if (genre === 'blues') return ['crossroads', 'train', 'bottle', 'soul', 'harmonica', 'mississippi'];
    if (genre === 'reggae') return ['island', 'roots', 'sun', 'babylon', 'zion', 'vibration'];
    if (genre === 'punk') return ['riot', 'anarchy', 'street', 'revolution', 'noise', 'clash'];
    if (genre === 'hip_hop') return ['street', 'beat', 'flow', 'cipher', 'mic', 'turntable'];
    if (genre === 'classical') return ['symphony', 'orchestra', 'concerto', 'aria', 'sonata', 'opus'];
    if (genre === 'alternative') return ['echo', 'mirror', 'void', 'static', 'feedback', 'distortion'];
    
    return baseSeeds;
  }
  
  // Check if a word has poetic quality
  private isPoeticWord(word: string): boolean {
    const lowerWord = word.toLowerCase();
    
    // Avoid overly technical, mundane, or awkward words
    const unpoetic = [
      'data', 'system', 'process', 'function', 'status', 'item', 'unit', 'factor',
      'volume', 'runt', 'reshuffle', 'richards', 'colossus', 'sabu', 'petrels',
      'casting', 'images', 'books', 'formation', 'personality', 'index',
      'neutral', 'mev', 'fig', 'dull', 'arkansas', 'charts', 'pink'
    ];
    if (unpoetic.includes(lowerWord)) return false;
    
    // Avoid words that look like names or places
    if (/^[A-Z][a-z]+$/.test(word) && word.length > 5) return false;
    
    // Prefer words with emotional or sensory associations
    const poetic = [
      'moon', 'star', 'fire', 'dream', 'shadow', 'light', 'ocean', 'storm',
      'night', 'soul', 'heart', 'thunder', 'velvet', 'silver', 'echo',
      'whisper', 'phantom', 'crystal', 'flame', 'spirit', 'mystic'
    ];
    if (poetic.some(p => lowerWord.includes(p))) return true;
    
    // Accept words between 3-10 characters, but avoid overly simple ones
    if (word.length < 3 || word.length > 10) return false;
    
    // Avoid words ending in common technical suffixes
    if (lowerWord.endsWith('ing') && word.length > 8) return false;
    if (lowerWord.endsWith('ness') || lowerWord.endsWith('ment')) return false;
    
    return true;
  }
  
  // Clean and deduplicate word sources
  private cleanWordSources(sources: EnhancedWordSource): void {
    const seen = new Set<string>();
    
    // Clean each category
    for (const key of Object.keys(sources) as (keyof EnhancedWordSource)[]) {
      sources[key] = sources[key].filter(word => {
        const lower = word.toLowerCase();
        if (seen.has(lower) || this.isProblematicWord(word) || !this.isPoeticWord(word)) {
          return false;
        }
        seen.add(lower);
        return true;
      });
    }
  }

  // Generate contextually-aware names using word relationships
  private async generateContextualName(
    type: string, 
    wordCount: number, 
    sources: EnhancedWordSource,
    mood?: string,
    genre?: string
  ): Promise<string> {
    
    if (wordCount === 1) {
      return this.generateSingleContextualWord(sources);
    }

    if (wordCount === 2) {
      return await this.generateTwoWordContextual(sources, type, genre);
    }

    if (wordCount === 3) {
      return await this.generateThreeWordContextual(sources, type, genre);
    }

    // 4+ words - use narrative patterns with dynamic length
    if (wordCount >= 4) {
      // For "4+" option, randomly select between 4-10 words
      const dynamicWordCount = Math.floor(Math.random() * 7) + 4; // 4-10 words
      return await this.generateLongFormContextual(sources, dynamicWordCount, type);
    }
    
    // Fallback for any other word count
    return await this.generateLongFormContextual(sources, wordCount, type);
  }

  // Generate single impactful word
  private generateSingleContextualWord(sources: EnhancedWordSource): string {
    const allWords = [
      ...sources.nouns,
      ...sources.musicalTerms,
      ...sources.contextualWords.filter(w => w.length > 4)
    ];
    
    if (allWords.length === 0) return 'Phoenix';
    
    return allWords[Math.floor(Math.random() * allWords.length)];
  }

  // Generate two words using semantic relationships + Last.fm/Spotify/ConceptNet intelligence
  private async generateTwoWordContextual(sources: EnhancedWordSource, type: string, genre?: string): Promise<string> {
    // Prioritize Last.fm, Spotify, and ConceptNet genre-specific vocabulary if available
    const genreAdjectives = [...sources.lastfmWords, ...sources.genreTerms, ...sources.spotifyWords, ...sources.conceptNetWords].filter(w => this.isAdjectiveLike(w));
    const genreNouns = [...sources.lastfmWords, ...sources.genreTerms, ...sources.spotifyWords, ...sources.conceptNetWords].filter(w => this.isNounLike(w));
    
    const adjectives = genreAdjectives.length > 0 ? 
      [...genreAdjectives, ...sources.adjectives.slice(0, 5)] :
      sources.adjectives.length > 0 ? sources.adjectives : ['wild'];
    
    const nouns = genreNouns.length > 0 ? 
      [...genreNouns, ...sources.nouns.slice(0, 5)] :
      sources.nouns.length > 0 ? sources.nouns : ['fire'];

    // Try to find adjectives that commonly go with our nouns
    const baseNoun = nouns[Math.floor(Math.random() * nouns.length)];
    
    try {
      secureLog.debug(`🔍 Finding adjectives for: ${baseNoun}`);
      const relatedAdjectives = await this.datamuseService.findAdjectivesForNoun(baseNoun, 10);
      
      if (relatedAdjectives.length > 0) {
        // Filter related adjectives for genre appropriateness
        const filteredAdjectives = relatedAdjectives.filter(adj => {
          const word = adj.word.toLowerCase();
          // For reggae, avoid overly technical or unrelated words
          if (genre === 'reggae' && ['punch', 'trade', 'financial', 'corporate'].includes(word)) {
            return false;
          }
          // For jazz, prefer smooth/cool words
          if (genre === 'jazz' && ['digital', 'cyber', 'neon'].includes(word)) {
            return false;
          }
          return this.isPoeticWord(word) && !this.isProblematicWord(word);
        });
        
        if (filteredAdjectives.length > 0) {
          const contextualAdj = filteredAdjectives[Math.floor(Math.random() * filteredAdjectives.length)].word;
          return `${this.capitalize(contextualAdj)} ${this.capitalize(baseNoun)}`;
        }
      }
    } catch (error) {
      secureLog.error('Error finding related adjectives:', error);
    }

    // Fallback to genre-specific combination
    const genreAppropriateAdjs = adjectives.filter(adj => {
      if (genre && this.isGenreAppropriate(adj, genre)) {
        return true;
      }
      return !this.isProblematicWord(adj);
    });
    
    const adj = genreAppropriateAdjs.length > 0 ? 
      genreAppropriateAdjs[Math.floor(Math.random() * genreAppropriateAdjs.length)] :
      adjectives[Math.floor(Math.random() * adjectives.length)];
    
    return `${this.capitalize(adj)} ${this.capitalize(baseNoun)}`;
  }

  // Generate three words with enhanced patterns + Last.fm/Spotify/ConceptNet context
  private async generateThreeWordContextual(sources: EnhancedWordSource, type: string, genre?: string): Promise<string> {
    // Create enhanced word pools with Last.fm, Spotify, and ConceptNet data priority
    const enhancedAdjectives = this.createEnhancedWordPool(
      [...sources.lastfmWords, ...sources.genreTerms, ...sources.spotifyWords, ...sources.conceptNetWords], 
      sources.adjectives, 
      w => this.isAdjectiveLike(w)
    );
    const enhancedNouns = this.createEnhancedWordPool(
      [...sources.lastfmWords, ...sources.genreTerms, ...sources.spotifyWords, ...sources.conceptNetWords], 
      sources.nouns, 
      w => this.isNounLike(w)
    );

    const patterns = [
      // Classic "The [adj] [noun]" pattern - most common for bands
      async () => {
        const adj = this.getRandomWord(enhancedAdjectives) || 'wild';
        const noun = this.getRandomWord(enhancedNouns) || 'storm';
        return `The ${this.capitalize(adj)} ${this.capitalize(noun)}`;
      },
      
      // Adjective + Noun + Noun pattern with genre context
      async () => {
        const adj = this.getRandomWord(enhancedAdjectives) || 'electric';
        const noun1 = this.getRandomWord(enhancedNouns) || 'fire';
        const noun2 = this.getRandomWord(enhancedNouns) || 'dream';
        return `${this.capitalize(adj)} ${this.capitalize(noun1)} ${this.capitalize(noun2)}`;
      },
      
      // Noun + Verb-ing pattern with grammar correction and genre context
      async () => {
        const noun1 = this.getRandomWord(enhancedNouns) || 'fire';
        const verbs = ['burning', 'rising', 'falling', 'breaking', 'shining'];
        const verb = verbs[Math.floor(Math.random() * verbs.length)];
        const noun2 = this.getRandomWord(enhancedNouns) || 'sky';
        
        // Ensure grammatical agreement - if noun1 is plural, singularize it
        const isPlural = noun1.toLowerCase().endsWith('s') && !noun1.toLowerCase().endsWith('ss');
        const correctedNoun1 = isPlural ? this.singularize(noun1) : noun1;
        
        // Ensure noun2 is plural if needed for balance
        const correctedNoun2 = isPlural && !noun2.toLowerCase().endsWith('s') ? noun2 + 's' : noun2;
        
        return `${this.capitalize(correctedNoun1)} ${this.capitalize(verb)} ${this.capitalize(correctedNoun2)}`;
      }
    ];

    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    return await pattern();
  }

  // Generate longer contextual names with better structure and lyric-like flow
  private async generateLongFormContextual(sources: EnhancedWordSource, wordCount: number, type: string): Promise<string> {
    // Apply lyric-generation inspired patterns for coherent flow
    if (wordCount === 4) {
      return this.generateFourWordPoetic(sources, type);
    }
    
    if (wordCount === 5) {
      return this.generateFiveWordNarrative(sources, type);
    }
    
    if (wordCount === 6) {
      return this.generateSixWordStatement(sources, type);
    }
    
    if (wordCount === 7) {
      return this.generateSevenWordStory(sources, type);
    }
    
    if (wordCount === 8) {
      return this.generateEightWordEpic(sources, type);
    }
    
    if (wordCount === 9) {
      return this.generateNineWordJourney(sources, type);
    }
    
    if (wordCount === 10) {
      return this.generateTenWordSaga(sources, type);
    }
    
    // Fallback for other word counts
    return this.generateStructuredPhrase(sources, wordCount);
  }
  
  // Four words with poetic structure
  private generateFourWordPoetic(sources: EnhancedWordSource, type: string): string {
    // Create enhanced word pools with Last.fm and Spotify genre priority
    const enhancedAdjectives = this.createEnhancedWordPool(
      [...sources.lastfmWords, ...sources.genreTerms, ...sources.spotifyWords], 
      sources.adjectives, 
      w => this.isAdjectiveLike(w)
    );
    const enhancedNouns = this.createEnhancedWordPool(
      [...sources.lastfmWords, ...sources.genreTerms, ...sources.spotifyWords], 
      sources.nouns, 
      w => this.isNounLike(w)
    );

    const patterns = [
      // The [adj] [noun] [noun]
      () => {
        const adj = this.getRandomWord(enhancedAdjectives) || 'electric';
        const noun1 = this.getRandomWord(enhancedNouns) || 'fire';
        const noun2 = this.getRandomWord(enhancedNouns) || 'dream';
        return `The ${this.capitalize(adj)} ${this.capitalize(noun1)} ${this.capitalize(noun2)}`;
      },
      // [Noun] of the [Noun]
      () => {
        const noun1 = this.getRandomWord(enhancedNouns) || 'storm';
        const noun2 = this.getRandomWord(enhancedNouns) || 'night';
        return `${this.capitalize(noun1)} of the ${this.capitalize(noun2)}`;
      },
      // [Adj] [Noun] [Prep] [Noun]
      () => {
        const adj = this.getRandomWord(enhancedAdjectives) || 'wild';
        const noun1 = this.getRandomWord(enhancedNouns) || 'heart';
        const noun2 = this.getRandomWord(enhancedNouns) || 'fire';
        const preps = ['in', 'of', 'at'];
        const prep = preps[Math.floor(Math.random() * preps.length)];
        return `${this.capitalize(adj)} ${this.capitalize(noun1)} ${prep} ${this.capitalize(noun2)}`;
      }
    ];
    
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    return pattern();
  }
  
  // Five words with narrative flow
  private generateFiveWordNarrative(sources: EnhancedWordSource, type: string): string {
    // Create enhanced word pools with Last.fm and Spotify genre priority
    const enhancedAdjectives = this.createEnhancedWordPool(
      [...sources.lastfmWords, ...sources.genreTerms, ...sources.spotifyWords], 
      sources.adjectives, 
      w => this.isAdjectiveLike(w)
    );
    const enhancedNouns = this.createEnhancedWordPool(
      [...sources.lastfmWords, ...sources.genreTerms, ...sources.spotifyWords], 
      sources.nouns, 
      w => this.isNounLike(w)
    );
    const enhancedVerbs = [...sources.verbs, ...sources.musicalTerms.filter(w => w.endsWith('ing'))];

    const patterns = [
      // The [Adj] [Noun] of [Noun]
      () => {
        const adj = this.getRandomWord(enhancedAdjectives) || 'burning';
        const noun1 = this.getRandomWord(enhancedNouns) || 'sky';
        const noun2 = this.getRandomWord(enhancedNouns) || 'storm';
        return `The ${this.capitalize(adj)} ${this.capitalize(noun1)} of ${this.capitalize(noun2)}`;
      },
      // [Noun] in the [Adj] [Noun]
      () => {
        const noun1 = this.getRandomWord(enhancedNouns) || 'light';
        const adj = this.getRandomWord(enhancedAdjectives) || 'dark';
        const noun2 = this.getRandomWord(enhancedNouns) || 'night';
        return `${this.capitalize(noun1)} in the ${this.capitalize(adj)} ${this.capitalize(noun2)}`;
      }
    ];
    
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    return pattern();
  }
  
  // Six words forming a complete statement
  private generateSixWordStatement(sources: EnhancedWordSource, type: string): string {
    // Create enhanced word pools with Last.fm and Spotify genre priority
    const enhancedAdjectives = this.createEnhancedWordPool(
      [...sources.lastfmWords, ...sources.genreTerms, ...sources.spotifyWords], 
      sources.adjectives, 
      w => this.isAdjectiveLike(w)
    );
    const enhancedNouns = this.createEnhancedWordPool(
      [...sources.lastfmWords, ...sources.genreTerms, ...sources.spotifyWords], 
      sources.nouns, 
      w => this.isNounLike(w)
    );

    // Apply lyric-like narrative patterns
    const patterns = [
      // Subject-verb-object patterns
      () => {
        const subject = this.getRandomWord(enhancedNouns) || 'stars';
        const verb = ['dance', 'sing', 'whisper', 'burn', 'shine', 'fall'][Math.floor(Math.random() * 6)];
        const prep = ['beneath', 'above', 'within', 'through', 'beyond'][Math.floor(Math.random() * 5)];
        const adj = this.getRandomWord(enhancedAdjectives) || 'eternal';
        const object = this.getRandomWord(enhancedNouns) || 'sky';
        return `${this.capitalize(subject)} ${verb} ${prep} the ${adj} ${object}`;
      },
      // Temporal narrative patterns
      () => {
        const temporal = ['When', 'While', 'Before', 'After', 'Until'][Math.floor(Math.random() * 5)];
        const adj = this.getRandomWord(enhancedAdjectives) || 'golden';
        const noun1 = this.getRandomWord(enhancedNouns) || 'dawn';
        const verb = ['meets', 'finds', 'becomes', 'touches'][Math.floor(Math.random() * 4)];
        const noun2 = this.getRandomWord(enhancedNouns) || 'night';
        return `${temporal} ${adj} ${noun1} ${verb} the ${noun2}`;
      },
      // Poetic statement patterns
      () => {
        const adj1 = this.getRandomWord(enhancedAdjectives) || 'wild';
        const noun1 = this.getRandomWord(enhancedNouns) || 'heart';
        const verb = ['carries', 'holds', 'knows', 'remembers'][Math.floor(Math.random() * 4)];
        const adj2 = this.getRandomWord(enhancedAdjectives) || 'secret';
        const noun2 = this.getRandomWord(enhancedNouns) || 'dreams';
        return `The ${adj1} ${noun1} ${verb} ${adj2} ${noun2}`;
      }
    ];
    
    return patterns[Math.floor(Math.random() * patterns.length)]();
  }
  
  // Seven words forming a mini-story
  private generateSevenWordStory(sources: EnhancedWordSource, type: string): string {
    // Create enhanced word pools with Last.fm and Spotify genre priority
    const enhancedAdjectives = this.createEnhancedWordPool(
      [...sources.lastfmWords, ...sources.genreTerms, ...sources.spotifyWords], 
      sources.adjectives, 
      w => this.isAdjectiveLike(w)
    );
    const enhancedNouns = this.createEnhancedWordPool(
      [...sources.lastfmWords, ...sources.genreTerms, ...sources.spotifyWords], 
      sources.nouns, 
      w => this.isNounLike(w)
    );
    
    // Story-like patterns inspired by lyric generation
    const patterns = [
      // Complete narrative arc
      () => {
        const character = this.getRandomWord(enhancedNouns) || 'wanderer';
        const verb1 = ['found', 'lost', 'saw', 'heard'][Math.floor(Math.random() * 4)];
        const adj = this.getRandomWord(enhancedAdjectives) || 'ancient';
        const object = this.getRandomWord(enhancedNouns) || 'truth';
        const location = this.getRandomWord(enhancedNouns) || 'ruins';
        return `The ${character} ${verb1} an ${adj} ${object} in ${location}`;
      },
      // Journey pattern
      () => {
        const traveler = this.getRandomWord(enhancedNouns) || 'dreamer';
        const verb = ['journeys', 'travels', 'wanders', 'searches'][Math.floor(Math.random() * 4)];
        const prep = ['through', 'beyond', 'across', 'beneath'][Math.floor(Math.random() * 4)];
        const adj1 = this.getRandomWord(enhancedAdjectives) || 'endless';
        const place = this.getRandomWord(enhancedNouns) || 'desert';
        const seeking = ['seeking', 'finding', 'chasing'][Math.floor(Math.random() * 3)];
        const goal = this.getRandomWord(enhancedNouns) || 'peace';
        return `${this.capitalize(traveler)} ${verb} ${prep} ${adj1} ${place} ${seeking} ${goal}`;
      },
      // Transformation pattern
      () => {
        const subject = this.getRandomWord(enhancedNouns) || 'silence';
        const verb = ['becomes', 'transforms', 'awakens', 'evolves'][Math.floor(Math.random() * 4)];
        const transition = ['into', 'as', 'like'][Math.floor(Math.random() * 3)];
        const adj = this.getRandomWord(enhancedAdjectives) || 'infinite';
        const result = this.getRandomWord(enhancedNouns) || 'song';
        const time = ['at', 'by', 'through'][Math.floor(Math.random() * 3)];
        const moment = this.getRandomWord(enhancedNouns) || 'dawn';
        return `${this.capitalize(subject)} ${verb} ${transition} ${adj} ${result} ${time} ${moment}`;
      }
    ];
    
    return patterns[Math.floor(Math.random() * patterns.length)]();
  }

  // Eight words forming an epic tale
  private generateEightWordEpic(sources: EnhancedWordSource, type: string): string {
    const enhancedAdjectives = this.createEnhancedWordPool(
      [...sources.lastfmWords, ...sources.genreTerms, ...sources.spotifyWords], 
      sources.adjectives, 
      w => this.isAdjectiveLike(w)
    );
    const enhancedNouns = this.createEnhancedWordPool(
      [...sources.lastfmWords, ...sources.genreTerms, ...sources.spotifyWords], 
      sources.nouns, 
      w => this.isNounLike(w)
    );
    
    const patterns = [
      // Epic journey pattern
      () => {
        const hero = this.getRandomWord(enhancedNouns) || 'rider';
        const verb1 = ['crossed', 'conquered', 'found', 'lost'][Math.floor(Math.random() * 4)];
        const adj1 = this.getRandomWord(enhancedAdjectives) || 'endless';
        const place1 = this.getRandomWord(enhancedNouns) || 'plains';
        const verb2 = ['seeking', 'carrying', 'chasing', 'following'][Math.floor(Math.random() * 4)];
        const adj2 = this.getRandomWord(enhancedAdjectives) || 'golden';
        const goal = this.getRandomWord(enhancedNouns) || 'dreams';
        const finale = ['home', 'dawn', 'destiny'][Math.floor(Math.random() * 3)];
        return `${this.capitalize(hero)} ${verb1} the ${adj1} ${place1} ${verb2} ${adj2} ${goal} ${finale}`;
      },
      // Complete story arc
      () => {
        const time = ['When', 'Before', 'After'][Math.floor(Math.random() * 3)];
        const adj1 = this.getRandomWord(enhancedAdjectives) || 'wild';
        const subject = this.getRandomWord(enhancedNouns) || 'wind';
        const verb = ['met', 'found', 'touched'][Math.floor(Math.random() * 3)];
        const adj2 = this.getRandomWord(enhancedAdjectives) || 'broken';
        const object = this.getRandomWord(enhancedNouns) || 'heart';
        const location = this.getRandomWord(enhancedNouns) || 'crossroads';
        const result = this.getRandomWord(enhancedNouns) || 'song';
        return `${time} the ${adj1} ${subject} ${verb} the ${adj2} ${object} at ${location} ${result}`;
      }
    ];
    
    return patterns[Math.floor(Math.random() * patterns.length)]();
  }

  // Nine words forming a journey
  private generateNineWordJourney(sources: EnhancedWordSource, type: string): string {
    const enhancedAdjectives = this.createEnhancedWordPool(
      [...sources.lastfmWords, ...sources.genreTerms, ...sources.spotifyWords], 
      sources.adjectives, 
      w => this.isAdjectiveLike(w)
    );
    const enhancedNouns = this.createEnhancedWordPool(
      [...sources.lastfmWords, ...sources.genreTerms, ...sources.spotifyWords], 
      sources.nouns, 
      w => this.isNounLike(w)
    );
    
    // Complex narrative patterns
    const patterns = [
      () => {
        const subj = this.getRandomWord(enhancedNouns) || 'traveler';
        const verb1 = ['rode', 'walked', 'wandered'][Math.floor(Math.random() * 3)];
        const prep1 = ['through', 'across', 'beyond'][Math.floor(Math.random() * 3)];
        const adj1 = this.getRandomWord(enhancedAdjectives) || 'dusty';
        const place1 = this.getRandomWord(enhancedNouns) || 'roads';
        const verb2 = ['carrying', 'singing', 'remembering'][Math.floor(Math.random() * 3)];
        const adj2 = this.getRandomWord(enhancedAdjectives) || 'old';
        const obj = this.getRandomWord(enhancedNouns) || 'stories';
        const dest = this.getRandomWord(enhancedNouns) || 'home';
        return `${this.capitalize(subj)} ${verb1} ${prep1} ${adj1} ${place1} ${verb2} ${adj2} ${obj} to ${dest}`;
      }
    ];
    
    return patterns[Math.floor(Math.random() * patterns.length)]();
  }

  // Ten words forming a saga
  private generateTenWordSaga(sources: EnhancedWordSource, type: string): string {
    const enhancedAdjectives = this.createEnhancedWordPool(
      [...sources.lastfmWords, ...sources.genreTerms, ...sources.spotifyWords], 
      sources.adjectives, 
      w => this.isAdjectiveLike(w)
    );
    const enhancedNouns = this.createEnhancedWordPool(
      [...sources.lastfmWords, ...sources.genreTerms, ...sources.spotifyWords], 
      sources.nouns, 
      w => this.isNounLike(w)
    );
    
    // Full narrative patterns
    const patterns = [
      () => {
        const char1 = this.getRandomWord(enhancedNouns) || 'cowboy';
        const char2 = this.getRandomWord(enhancedNouns) || 'angel';
        const verb1 = ['met', 'found', 'loved'][Math.floor(Math.random() * 3)];
        const prep = ['beneath', 'under', 'by'][Math.floor(Math.random() * 3)];
        const adj1 = this.getRandomWord(enhancedAdjectives) || 'lonesome';
        const place = this.getRandomWord(enhancedNouns) || 'stars';
        const verb2 = ['singing', 'dancing', 'dreaming'][Math.floor(Math.random() * 3)];
        const prep2 = ['until', 'before', 'after'][Math.floor(Math.random() * 3)];
        const adj2 = this.getRandomWord(enhancedAdjectives) || 'morning';
        const time = this.getRandomWord(enhancedNouns) || 'light';
        return `The ${char1} and the ${char2} ${verb1} ${prep} ${adj1} ${place} ${verb2} ${prep2} ${adj2} ${time}`;
      }
    ];
    
    return patterns[Math.floor(Math.random() * patterns.length)]();
  }

  private generateStructuredPhrase(sources: EnhancedWordSource, wordCount: number): string {
    const words: string[] = [];
    const allGoodWords = [...sources.adjectives, ...sources.nouns].filter(w => 
      !this.isProblematicWord(w) && w.length >= 3 && w.length <= 10
    );
    
    for (let i = 0; i < wordCount; i++) {
      const word = this.getRandomWord(allGoodWords) || 'fire';
      words.push(this.capitalize(word));
    }
    
    return words.join(' ');
  }

  // Helper methods
  private getRandomWord(wordArray: string[]): string | null {
    if (wordArray.length === 0) return null;
    return wordArray[Math.floor(Math.random() * wordArray.length)];
  }

  // Function to singularize common plural nouns
  private singularize(word: string): string {
    const lowerWord = word.toLowerCase();
    
    // Common irregular plurals
    const irregulars: Record<string, string> = {
      'children': 'child',
      'men': 'man',
      'women': 'woman',
      'feet': 'foot',
      'teeth': 'tooth',
      'mice': 'mouse',
      'geese': 'goose',
      'people': 'person',
      'leaves': 'leaf',
      'lives': 'life',
      'wolves': 'wolf',
      'knives': 'knife',
      'wives': 'wife',
      'thieves': 'thief'
    };
    
    if (irregulars[lowerWord]) {
      return irregulars[lowerWord];
    }
    
    // Regular plural rules
    if (lowerWord.endsWith('ies') && lowerWord.length > 4) {
      return lowerWord.slice(0, -3) + 'y';
    }
    if (lowerWord.endsWith('ves') && lowerWord.length > 4) {
      return lowerWord.slice(0, -3) + 'f';
    }
    if (lowerWord.endsWith('es') && (lowerWord.endsWith('ses') || lowerWord.endsWith('xes') || 
        lowerWord.endsWith('zes') || lowerWord.endsWith('ches') || lowerWord.endsWith('shes'))) {
      return lowerWord.slice(0, -2);
    }
    if (lowerWord.endsWith('s') && !lowerWord.endsWith('ss') && lowerWord.length > 2) {
      return lowerWord.slice(0, -1);
    }
    
    return word;
  }

  private capitalize(word: string): string {
    // Preserve original casing for words like "DJ" or "NYC"
    if (word.length <= 3 && word === word.toUpperCase()) {
      return word;
    }
    
    // Handle hyphenated words
    if (word.includes('-')) {
      return word.split('-').map(part => 
        part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
      ).join('-');
    }
    
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }

  private isLikelyAdjective(word: string): boolean {
    const adjSuffixes = ['ful', 'less', 'ing', 'ed', 'ly', 'ous', 'ive', 'able', 'ible'];
    return adjSuffixes.some(suffix => word.toLowerCase().endsWith(suffix));
  }

  private isLikelyVerb(word: string): boolean {
    const verbSuffixes = ['ing', 'ed', 'ize', 'ify', 'ate'];
    return verbSuffixes.some(suffix => word.toLowerCase().endsWith(suffix));
  }

  private isProblematicWord(word: string): boolean {
    // Filter out problematic words
    if (word.length < 2 || word.length > 15) return true;
    if (/[0-9]/.test(word)) return true; // No numbers
    if (/[^a-zA-Z-']/.test(word)) return true; // Only letters, hyphens, apostrophes
    if (word.includes('_')) return true; // No underscores
    
    // Filter out technical/medical terms that sound weird
    const problematicPatterns = [
      'itis', 'osis', 'ectomy', 'ology', 'graphy',
      'metric', 'philic', 'phobic', 'scopy', 'etic',
      'ious', 'eous', 'atic', 'istic'
    ];
    
    // Specific medical/technical/scientific/business terms to avoid
    const problematicWords = [
      'thorax', 'stigmata', 'reddish', 'yellowish', 'greenish',
      'underside', 'potency', 'generative', 'productive',
      'imaginative', 'originative', 'fanciful', 'ability',
      'electrons', 'radiation', 'mev', 'neutral', 'innovatory',
      'inventive', 'fig', 'increases', 'decreases', 'particle',
      'wavelength', 'frequency', 'amplitude', 'spectrum',
      'molecule', 'atom', 'proton', 'neutron', 'quantum',
      'magnate', 'powerfulness', 'notional', 'baron', 'tycoon',
      'exponent', 'index', 'empyrean', 'fictive', 'innovatory',
      // Medical terms
      'pulmonary', 'surgery', 'radius', 'medical', 'clinical',
      'surgical', 'cardiac', 'neural', 'skeletal', 'muscular',
      // Geographic/political
      'belgrade', 'feminism', 'minister', 'political', 'democracy',
      // Sports/mundane
      'sports', 'surfing', 'surface', 'troopers', 'clay',
      // Other awkward words
      'slamming', 'fugue', 'changes'
    ];
    
    const lowerWord = word.toLowerCase();
    if (problematicWords.includes(lowerWord)) return true;
    return problematicPatterns.some(pattern => lowerWord.endsWith(pattern));
  }

  private generateFallbackName(sources: EnhancedWordSource, wordCount: number): string {
    const words: string[] = [];
    const allWords = [...sources.adjectives, ...sources.nouns, ...sources.verbs, ...sources.musicalTerms];
    
    if (allWords.length === 0) {
      return 'Phoenix Storm';
    }

    for (let i = 0; i < wordCount; i++) {
      const word = allWords[Math.floor(Math.random() * allWords.length)];
      words.push(this.capitalize(word));
    }

    return words.join(' ');
  }

  // Validate name quality
  private isValidName(name: string, expectedWordCount: number): boolean {
    // Check word count
    const words = name.split(/\s+/);
    if (words.length !== expectedWordCount) {
      return false;
    }

    // Check for weird characters or patterns
    if (name.includes('.') && !name.includes('...')) {
      return false; // No single dots in middle of names
    }

    // Check for duplicate words
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    if (uniqueWords.size !== words.length) {
      return false; // No duplicate words
    }

    // Check for overly long words
    if (words.some(w => w.length > 15)) {
      return false; // No excessively long words
    }

    // Basic grammar check - no single letter words except "I" or "A"
    if (words.some(w => w.length === 1 && !['I', 'A', 'a'].includes(w))) {
      return false;
    }

    return true;
  }
  
  // Track words to prevent repetition across generations
  private trackWords(name: string): void {
    const words = name.toLowerCase().split(' ').filter(w => 
      w.length > 2 && !['the', 'of', 'in', 'at', 'and', 'or', 'but'].includes(w)
    );
    
    for (const word of words) {
      this.recentWords.add(word);
    }
    
    // Keep the set from growing too large
    if (this.recentWords.size > this.maxRecentWords) {
      const wordsArray = Array.from(this.recentWords);
      // Remove oldest words (first ones added)
      for (let i = 0; i < 20; i++) {
        this.recentWords.delete(wordsArray[i]);
      }
    }
  }
  
  // Check if name contains recently used words
  private hasRecentWords(name: string): boolean {
    const words = name.toLowerCase().split(' ').filter(w => 
      w.length > 2 && !['the', 'of', 'in', 'at', 'and', 'or', 'but'].includes(w)
    );
    
    // If any significant word was recently used, reject the name
    return words.some(word => this.recentWords.has(word));
  }
  
  // Check if a word is appropriate for a given genre
  private isGenreAppropriate(word: string, genre: string): boolean {
    const lowerWord = word.toLowerCase();
    
    const genreInappropriateWords: Record<string, string[]> = {
      reggae: ['corporate', 'digital', 'cyber', 'quantum', 'synthetic', 'artificial', 'virtual', 'binary'],
      jazz: ['cyber', 'quantum', 'neon', 'digital', 'synthetic', 'virtual', 'binary', 'pixel'],
      folk: ['cyber', 'quantum', 'neon', 'digital', 'synthetic', 'artificial', 'virtual', 'binary'],
      classical: ['funk', 'groovy', 'cyber', 'neon', 'street', 'hood', 'swag'],
      country: ['cyber', 'quantum', 'neon', 'digital', 'synthetic', 'urban', 'metro'],
      blues: ['cyber', 'quantum', 'neon', 'digital', 'synthetic', 'virtual', 'binary'],
    };
    
    // Check if word is inappropriate for the genre
    if (genreInappropriateWords[genre]) {
      return !genreInappropriateWords[genre].includes(lowerWord);
    }
    
    return true;
  }

  // Helper methods for Last.fm integration

  /**
   * Create enhanced word pool prioritizing genre/mood specific data
   */
  private createEnhancedWordPool(genreWords: string[], fallbackWords: string[], filter?: (w: string) => boolean): string[] {
    const filtered = filter ? genreWords.filter(filter) : genreWords;
    const fallbackFiltered = filter ? fallbackWords.filter(filter) : fallbackWords;
    
    // Prioritize genre-specific words first
    const genreSet = new Set(filtered);
    
    // Add only non-duplicate fallback words for variety (30% of total)
    const uniqueFallbacks = fallbackFiltered.filter(w => !genreSet.has(w));
    const fallbackSelection = uniqueFallbacks.slice(0, Math.floor(uniqueFallbacks.length * 0.3));
    
    // Return combined pool with genre words having priority
    return [...filtered, ...fallbackSelection];
  }

  /**
   * Simple heuristic to check if word is adjective-like
   */
  private isAdjectiveLike(word: string): boolean {
    const adjectiveEndings = ['ful', 'less', 'ous', 'ive', 'ing', 'ed', 'al', 'ic', 'y', 'en'];
    const adjectiveWords = ['dark', 'bright', 'heavy', 'light', 'hard', 'soft', 'loud', 'quiet', 'deep', 'high', 'low', 'fast', 'slow'];
    
    return adjectiveEndings.some(ending => word.toLowerCase().endsWith(ending)) ||
           adjectiveWords.includes(word.toLowerCase()) ||
           word.length <= 8; // Short words are often adjectives
  }

  /**
   * Simple heuristic to check if word is noun-like
   */
  private isNounLike(word: string): boolean {
    const nounEndings = ['tion', 'sion', 'ment', 'ness', 'ity', 'ty', 'er', 'or', 'ist', 'ism'];
    const musicNouns = ['band', 'sound', 'music', 'song', 'beat', 'rhythm', 'melody', 'harmony', 'chord', 'note'];
    
    return nounEndings.some(ending => word.toLowerCase().endsWith(ending)) ||
           musicNouns.includes(word.toLowerCase()) ||
           (word.length > 3 && !this.isAdjectiveLike(word)); // Longer non-adjective words are often nouns
  }


}

export const enhancedNameGenerator = new EnhancedNameGeneratorService();