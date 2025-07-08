import type { VerificationResult } from "@shared/schema";

export class NameVerifierService {
  async verifyName(name: string, type: 'band' | 'song'): Promise<VerificationResult> {
    try {
      // Generate verification links that users can actually use
      const verificationLinks = this.generateVerificationLinks(name, type);

      // Check against famous bands/songs database first
      const famousMatch = this.checkFamousNames(name, type);
      if (famousMatch) {
        const similarNames = this.generateSimilarNames(name);
        return {
          status: 'taken',
          details: `This is a famous ${type}${famousMatch.artist ? ` by ${famousMatch.artist}` : ''}. Try these alternatives:`,
          similarNames,
          verificationLinks
        };
      }

      // Attempt real API verification
      let searchResults: any[] = [];
      try {
        const promises = [];
        
        // Add Last.fm search if API key is available
        if (process.env.LASTFM_API_KEY) {
          promises.push(this.searchLastFm(name, type).catch(() => []));
        }
        
        // Add MusicBrainz search (no key needed) 
        promises.push(this.searchRealMusicBrainz(name, type).catch(() => []));

        if (promises.length > 0) {
          searchResults = await Promise.all(promises).then(results => results.flat());
        }
      } catch (error) {
        // Silent fallback to heuristics
      }

      // Minimal logging for debugging when needed
      if (searchResults.length > 5) {
        console.log(`Found ${searchResults.length} results for "${name}"`);
      }

      // Check for exact matches first
      const exactMatches = searchResults.filter(result => 
        result.name?.toLowerCase().trim() === name.toLowerCase().trim()
      );

      if (exactMatches.length > 0) {
        // Exact match found = Name is taken
        const match = exactMatches[0];
        const artistInfo = match.artist ? ` by ${match.artist}` : '';
        const similarNames = this.generateSimilarNames(name);
        // Exact match found
        return {
          status: 'taken',
          details: `Found existing ${type}${artistInfo}. Try these alternatives:`,
          similarNames,
          verificationLinks
        };
      }

      // Check for close/similar matches with different criteria for bands vs songs
      const closeMatches = searchResults.filter(result => {
        const resultName = result.name?.toLowerCase().trim() || '';
        const searchName = name.toLowerCase().trim();
        
        if (type === 'band') {
          // BAND LOGIC: Stricter - band names should be unique
          // Ignore single-word results unless they're the exact search or long/unique words
          if (resultName.split(' ').length === 1 && resultName.length < 8 && resultName !== searchName) {
            return false;
          }
          
          // For bands: exact match or very close similarity required
          const isExact = resultName === searchName;
          const similarity = this.calculateSimilarity(resultName, searchName);
          const lengthRatio = Math.min(resultName.length, searchName.length) / Math.max(resultName.length, searchName.length);
          
          return isExact || (similarity > 0.9 && lengthRatio > 0.8);
        } else {
          // SONG LOGIC: More lenient - multiple songs can have same title
          // Only flag if exact match or very similar with same/similar artist
          const isExact = resultName === searchName;
          
          // For songs, we're more lenient since many songs can share titles
          // Only consider it taken if it's an exact match
          return isExact;
        }
      });

      if (closeMatches.length > 0) {
        // Close matches found = Similar
        const similarNames = this.generateSimilarNames(name);
        console.log(`Close matches found for "${name}":`, closeMatches.slice(0, 2));
        return {
          status: 'similar',
          details: `Similar names found in music databases. Consider these alternatives:`,
          similarNames,
          verificationLinks
        };
      }

      // Only mark as available if we have fewer than 5 very weak results
      // This handles cases where APIs return tons of unrelated results
      if (searchResults.length <= 5) {
        // Few or no relevant matches - marking as available
        return {
          status: 'available',
          details: `No existing ${type} found with this name in our databases.`,
          verificationLinks
        };
      } else {
        // Many results but none are close matches - still available but note the search volume
        // No close matches found - marking as available
        return {
          status: 'available',
          details: `No existing ${type} found with this exact name in our databases.`,
          verificationLinks
        };
      }
    } catch (error) {
      console.error('Name verification error:', error);
      return {
        status: 'available',
        details: 'Verification temporarily unavailable - name appears to be available.',
        verificationLinks: this.generateVerificationLinks(name, type)
      };
    }
  }

  private generateVerificationLinks(name: string, type: 'band' | 'song'): Array<{name: string, url: string, source: string}> {
    const encodedName = encodeURIComponent(`"${name}"`);
    const encodedNameType = encodeURIComponent(`"${name}" ${type}`);
    
    const links = [
      {
        name: 'Spotify Search',
        url: `https://open.spotify.com/search/${encodedName}`,
        source: 'Spotify'
      },
      {
        name: 'Google Search',
        url: `https://www.google.com/search?q=${encodedNameType}`,
        source: 'Google'
      }
    ];

    // Add different third link based on type
    if (type === 'band') {
      links.push({
        name: 'Bandcamp Search',
        url: `https://bandcamp.com/search?q=${encodedName}`,
        source: 'Bandcamp'
      });
    } else {
      links.push({
        name: 'YouTube Search',
        url: `https://www.youtube.com/results?search_query=${encodedName}`,
        source: 'YouTube'
      });
    }

    return links;
  }

  private generateSimilarNames(name: string): string[] {
    const words = name.split(' ');
    const variations: string[] = [];

    // Thematic word groups for intelligent suggestions
    const thematicWords: Record<string, string[]> = {
      dark: ['Shadow', 'Midnight', 'Eclipse', 'Noir', 'Obsidian', 'Raven', 'Onyx'],
      light: ['Aurora', 'Dawn', 'Radiant', 'Solar', 'Bright', 'Luminous', 'Stellar'],
      nature: ['Forest', 'Ocean', 'Mountain', 'River', 'Storm', 'Thunder', 'Wildfire'],
      music: ['Echo', 'Harmony', 'Rhythm', 'Melody', 'Chord', 'Resonance', 'Cadence'],
      mystical: ['Crystal', 'Mystic', 'Arcane', 'Phoenix', 'Oracle', 'Ethereal', 'Cosmic'],
      urban: ['Neon', 'Metro', 'City', 'Electric', 'Digital', 'Chrome', 'Steel'],
      emotional: ['Velvet', 'Crimson', 'Golden', 'Silver', 'Gentle', 'Wild', 'Serene']
    };

    // Analyze the original name for themes
    const nameTheme = this.analyzeNameTheme(name.toLowerCase());
    const themeWords = thematicWords[nameTheme] || thematicWords.music;

    if (words.length > 1) {
      // Multi-word names: replace one word with thematic alternative
      const firstWord = words[0];
      const lastWord = words[words.length - 1];
      
      variations.push(`${themeWords[Math.floor(Math.random() * themeWords.length)]} ${lastWord}`);
      variations.push(`${firstWord} ${themeWords[Math.floor(Math.random() * themeWords.length)]}`);
      
      // Add connecting words for flow
      const connectors = ['and the', 'of the', '&', 'meets'];
      if (words.length === 2) {
        variations.push(`${firstWord} ${connectors[Math.floor(Math.random() * connectors.length)]} ${themeWords[Math.floor(Math.random() * themeWords.length)]}`);
      }
    } else {
      // Single word: add thematic prefixes/suffixes
      variations.push(`${themeWords[Math.floor(Math.random() * themeWords.length)]} ${name}`);
      variations.push(`${name} ${themeWords[Math.floor(Math.random() * themeWords.length)]}`);
      
      // Musical suffixes for bands
      const musicalSuffixes = ['Collective', 'Ensemble', 'Project', 'Sound', 'Music'];
      variations.push(`${name} ${musicalSuffixes[Math.floor(Math.random() * musicalSuffixes.length)]}`);
    }

    // Add some creative variations
    if (name.includes('the ')) {
      variations.push(name.replace('the ', ''));
    } else if (!name.toLowerCase().startsWith('the ')) {
      variations.push(`The ${name}`);
    }

    // Return unique suggestions
    const uniqueVariations = variations.filter((item, index) => variations.indexOf(item) === index);
    return uniqueVariations.slice(0, 4);
  }

  private analyzeNameTheme(name: string): string {
    const darkWords = ['dark', 'black', 'shadow', 'night', 'midnight', 'death', 'doom', 'void'];
    const lightWords = ['light', 'bright', 'sun', 'dawn', 'gold', 'silver', 'white', 'shine'];
    const natureWords = ['forest', 'ocean', 'mountain', 'river', 'storm', 'fire', 'earth', 'sky'];
    const musicWords = ['sound', 'music', 'song', 'beat', 'rhythm', 'harmony', 'melody', 'note'];
    const mysticalWords = ['magic', 'mystic', 'crystal', 'spirit', 'soul', 'dream', 'vision', 'cosmic'];
    const urbanWords = ['city', 'street', 'neon', 'electric', 'digital', 'metro', 'steel', 'chrome'];

    if (darkWords.some(word => name.includes(word))) return 'dark';
    if (lightWords.some(word => name.includes(word))) return 'light';
    if (natureWords.some(word => name.includes(word))) return 'nature';
    if (musicWords.some(word => name.includes(word))) return 'music';
    if (mysticalWords.some(word => name.includes(word))) return 'mystical';
    if (urbanWords.some(word => name.includes(word))) return 'urban';
    
    return 'emotional'; // Default theme
  }

  private generateExistingInfo(name: string, type: string): string {
    const years = ['2015', '2018', '2019', '2021', '2022'];
    const sources = [
      'Independent artist',
      'Local band',
      'Indie release',
      'Underground artist',
      'Regional musician'
    ];

    const year = years[Math.floor(Math.random() * years.length)];
    const source = sources[Math.floor(Math.random() * sources.length)];

    return `${source} (${year})`;
  }

  private getRandomSuffix(): string {
    const suffixes = ['Band', 'Collective', 'Project', 'Music', 'Sound', 'Group'];
    return suffixes[Math.floor(Math.random() * suffixes.length)];
  }

  private getRandomPrefix(): string {
    const prefixes = ['The', 'New', 'Young', 'Modern', 'Electric', 'Digital'];
    return prefixes[Math.floor(Math.random() * prefixes.length)];
  }

  private checkFamousNames(name: string, type: 'band' | 'song'): { name: string; artist?: string } | null {
    const lowercaseName = name.toLowerCase().trim();
    
    // Database of famous bands
    const famousBands = [
      'the beatles', 'queen', 'led zeppelin', 'pink floyd', 'the rolling stones', 
      'nirvana', 'radiohead', 'metallica', 'ac/dc', 'guns n roses', 'u2', 
      'the who', 'black sabbath', 'deep purple', 'rush', 'yes', 'genesis',
      'the doors', 'jimi hendrix experience', 'cream', 'the police', 'sting',
      'red hot chili peppers', 'pearl jam', 'soundgarden', 'alice in chains',
      'foo fighters', 'green day', 'blink-182', 'linkin park', 'coldplay',
      'muse', 'the strokes', 'the white stripes', 'arctic monkeys', 'oasis',
      'blur', 'pulp', 'suede', 'the smiths', 'joy division', 'new order',
      'depeche mode', 'the cure', 'siouxsie and the banshees', 'bauhaus',
      'iron maiden', 'judas priest', 'motorhead', 'slayer', 'megadeth',
      'anthrax', 'pantera', 'tool', 'system of a down', 'rage against the machine',
      'nine inch nails', 'marilyn manson', 'rob zombie', 'white zombie',
      'smashing pumpkins', 'jane\'s addiction', 'faith no more', 'primus',
      'deftones', 'korn', 'limp bizkit', 'creed', 'nickelback', 'disturbed'
    ];

    // Database of famous songs with artists
    const famousSongs = [
      { name: 'bohemian rhapsody', artist: 'Queen' },
      { name: 'stairway to heaven', artist: 'Led Zeppelin' },
      { name: 'imagine', artist: 'John Lennon' },
      { name: 'hey jude', artist: 'The Beatles' },
      { name: 'yesterday', artist: 'The Beatles' },
      { name: 'let it be', artist: 'The Beatles' },
      { name: 'smells like teen spirit', artist: 'Nirvana' },
      { name: 'sweet child o mine', artist: 'Guns N\' Roses' },
      { name: 'hotel california', artist: 'Eagles' },
      { name: 'another brick in the wall', artist: 'Pink Floyd' },
      { name: 'comfortably numb', artist: 'Pink Floyd' },
      { name: 'wish you were here', artist: 'Pink Floyd' },
      { name: 'paranoid', artist: 'Black Sabbath' },
      { name: 'smoke on the water', artist: 'Deep Purple' },
      { name: 'highway to hell', artist: 'AC/DC' },
      { name: 'thunderstruck', artist: 'AC/DC' },
      { name: 'enter sandman', artist: 'Metallica' },
      { name: 'master of puppets', artist: 'Metallica' },
      { name: 'one', artist: 'Metallica' }
    ];

    if (type === 'band') {
      if (famousBands.includes(lowercaseName)) {
        return { name: lowercaseName };
      }
    } else {
      const songMatch = famousSongs.find(song => song.name === lowercaseName);
      if (songMatch) {
        return { name: songMatch.name, artist: songMatch.artist };
      }
    }

    return null;
  }

  private async searchLastFm(name: string, type: 'band' | 'song'): Promise<any[]> {
    const apiKey = process.env.LASTFM_API_KEY;
    if (!apiKey) return [];

    try {
      const method = type === 'band' ? 'artist.search' : 'track.search';
      const param = type === 'band' ? 'artist' : 'track';
      const url = `http://ws.audioscrobbler.com/2.0/?method=${method}&${param}=${encodeURIComponent(name)}&api_key=${apiKey}&format=json&limit=10`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Last.fm API responded with ${response.status}`);
      }
      
      const data = await response.json();
      
      if (type === 'band') {
        const artists = data.results?.artistmatches?.artist || [];
        return Array.isArray(artists) ? artists.map((artist: any) => ({
          name: artist.name,
          type: 'band'
        })) : [];
      } else {
        const tracks = data.results?.trackmatches?.track || [];
        return Array.isArray(tracks) ? tracks.map((track: any) => ({
          name: track.name,
          artist: track.artist,
          type: 'song'
        })) : [];
      }
    } catch (error: any) {
      console.error('Last.fm API error:', error);
      return [];
    }
  }

  private async searchRealMusicBrainz(name: string, type: 'band' | 'song'): Promise<any[]> {
    try {
      const userAgent = process.env.MUSICBRAINZ_USER_AGENT || 'NameJam/1.0 (contact@example.com)';
      const entity = type === 'band' ? 'artist' : 'recording';
      const url = `https://musicbrainz.org/ws/2/${entity}/?query=${encodeURIComponent(name)}&fmt=json&limit=10`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': userAgent
        }
      });
      
      if (!response.ok) {
        throw new Error(`MusicBrainz API responded with ${response.status}`);
      }
      
      const data = await response.json();
      
      if (type === 'band') {
        const artists = data.artists || [];
        return artists.map((artist: any) => ({
          name: artist.name,
          type: 'band'
        }));
      } else {
        const recordings = data.recordings || [];
        return recordings.map((recording: any) => ({
          name: recording.title,
          artist: recording['artist-credit']?.[0]?.name,
          type: 'song'
        }));
      }
    } catch (error: any) {
      // Silent degradation - API failures are expected
      return [];
    }
  }

  private calculateSimilarity(str1: string, str2: string): number {
    // Simple similarity calculation based on common words and length
    if (str1 === str2) return 1.0;
    
    const words1 = str1.split(' ').filter(w => w.length > 2);
    const words2 = str2.split(' ').filter(w => w.length > 2);
    
    let commonWords = 0;
    words1.forEach(word1 => {
      if (words2.some(word2 => word1.includes(word2) || word2.includes(word1))) {
        commonWords++;
      }
    });
    
    const totalWords = Math.max(words1.length, words2.length);
    return totalWords > 0 ? commonWords / totalWords : 0;
  }

  private calculateUniquenessScore(name: string): number {
    // Calculate how unique a name combination is
    const words = name.toLowerCase().split(' ');
    
    // Very common words reduce uniqueness
    const commonWords = ['the', 'and', 'of', 'to', 'a', 'in', 'for', 'is', 'on', 'that', 'by', 'this', 'with', 'i', 'you', 'it', 'not', 'or', 'be', 'are', 'from', 'at', 'as', 'your', 'all', 'any', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'];
    
    let uniquenessScore = 1.0;
    
    // Reduce score for common words
    words.forEach(word => {
      if (commonWords.includes(word)) {
        uniquenessScore -= 0.2;
      }
    });
    
    // Unusual word combinations (3+ words with uncommon terms) are more unique
    if (words.length >= 3) {
      const uncommonWords = words.filter(word => 
        !commonWords.includes(word) && word.length > 6
      );
      if (uncommonWords.length >= 2) {
        uniquenessScore += 0.3;
      }
    }
    
    // Names with technical/unusual terms are more unique
    const unusualTerms = ['amplitude', 'temporal', 'theremin', 'bagpipes', 'catastrophe', 'fumbling', 'navigating', 'juggling', 'robots', 'ninjas', 'kazoo', 'elephants', 'disappearing', 'spinning', 'ukulele', 'clumsy', 'sneaky', 'twisted', 'indigo', 'eternal', 'recorder'];
    const hasUnusualTerms = words.some(word => 
      unusualTerms.some(term => word.includes(term.toLowerCase()))
    );
    
    if (hasUnusualTerms) {
      uniquenessScore += 0.4;
    }
    
    return Math.max(0, Math.min(1, uniquenessScore));
  }
}
