import { FamousNamesRepository } from './famousNamesRepository';

export class NameSuggestionService {
  private static instance: NameSuggestionService;
  private famousNamesRepo: FamousNamesRepository;

  private constructor() {
    this.famousNamesRepo = FamousNamesRepository.getInstance();
  }

  static getInstance(): NameSuggestionService {
    if (!NameSuggestionService.instance) {
      NameSuggestionService.instance = new NameSuggestionService();
    }
    return NameSuggestionService.instance;
  }

  /**
   * Generate similar names based on the original name
   */
  generateSimilarNames(name: string, count: number = 4): string[] {
    const words = name.split(' ');
    const variations: string[] = [];

    // Analyze the original name for themes using repository
    const nameTheme = this.famousNamesRepo.analyzeNameTheme(name);
    const themeWords = this.famousNamesRepo.getThematicWords(nameTheme);

    if (words.length > 1) {
      // Multi-word names: replace one word with thematic alternative
      const firstWord = words[0];
      const lastWord = words[words.length - 1];
      
      if (themeWords.length > 0) {
        variations.push(`${themeWords[Math.floor(Math.random() * themeWords.length)]} ${lastWord}`);
        variations.push(`${firstWord} ${themeWords[Math.floor(Math.random() * themeWords.length)]}`);
      }
      
      // Add connecting words for flow
      const connectors = this.famousNamesRepo.getConnectors();
      if (words.length === 2 && connectors.length > 0 && themeWords.length > 0) {
        variations.push(`${firstWord} ${connectors[Math.floor(Math.random() * connectors.length)]} ${themeWords[Math.floor(Math.random() * themeWords.length)]}`);
      }
    } else {
      // Single word: add thematic prefixes/suffixes
      if (themeWords.length > 0) {
        variations.push(`${themeWords[Math.floor(Math.random() * themeWords.length)]} ${name}`);
        variations.push(`${name} ${themeWords[Math.floor(Math.random() * themeWords.length)]}`);
      }
      
      // Musical suffixes for bands
      const musicalSuffixes = this.famousNamesRepo.getMusicalSuffixes();
      if (musicalSuffixes.length > 0) {
        variations.push(`${name} ${musicalSuffixes[Math.floor(Math.random() * musicalSuffixes.length)]}`);
      }
    }

    // Add some creative variations
    if (name.includes('the ')) {
      variations.push(name.replace('the ', ''));
    } else if (!name.toLowerCase().startsWith('the ')) {
      variations.push(`The ${name}`);
    }

    // Return unique suggestions
    const uniqueVariations = variations.filter((item, index) => variations.indexOf(item) === index);
    return uniqueVariations.slice(0, count);
  }

  /**
   * Generate prefixes for band names
   */
  getRandomPrefix(): string {
    const prefixes = ['The', 'New', 'Young', 'Modern', 'Electric', 'Digital'];
    return prefixes[Math.floor(Math.random() * prefixes.length)];
  }

  /**
   * Generate suffixes for band names
   */
  getRandomSuffix(): string {
    const suffixes = ['Band', 'Collective', 'Project', 'Music', 'Sound', 'Group'];
    return suffixes[Math.floor(Math.random() * suffixes.length)];
  }

  /**
   * Generate verification links for manual checking
   */
  generateVerificationLinks(name: string, type: 'band' | 'song'): Array<{name: string, url: string, source: string}> {
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

  /**
   * Generate fake existing info for demonstration purposes
   * (Legacy method - consider removing)
   */
  generateExistingInfo(name: string, type: string): string {
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
}