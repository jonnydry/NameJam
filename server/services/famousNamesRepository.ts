import { readFileSync } from 'fs';
import { join } from 'path';
import { secureLog } from '../utils/secureLogger';

interface FamousArtistsData {
  description: string;
  artists: {
    contemporary: string[];
    modernRockAlternative: string[];
    electronicDance: string[];
    countryFolk: string[];
    classicRockLegacy: string[];
  };
}

interface EasterEggArtistsData {
  description: string;
  artists: string[];
}

interface ThematicWordsData {
  description: string;
  themes: Record<string, string[]>;
  connectors: string[];
  musicalSuffixes: string[];
  themeAnalysis: Record<string, string[]>;
}

export class FamousNamesRepository {
  private static instance: FamousNamesRepository;
  private easterEggArtists: Set<string>;
  private famousArtists: Set<string>;
  private thematicWords: ThematicWordsData | null = null;
  private dataPath: string;

  private constructor() {
    this.dataPath = join(process.cwd(), 'server', 'data');
    this.easterEggArtists = new Set();
    this.famousArtists = new Set();
    this.loadData();
  }

  static getInstance(): FamousNamesRepository {
    if (!FamousNamesRepository.instance) {
      FamousNamesRepository.instance = new FamousNamesRepository();
    }
    return FamousNamesRepository.instance;
  }

  private loadData(): void {
    try {
      // Load easter egg artists
      const easterEggPath = join(this.dataPath, 'easterEggArtists.json');
      const easterEggData: EasterEggArtistsData = JSON.parse(
        readFileSync(easterEggPath, 'utf-8')
      );
      this.easterEggArtists = new Set(easterEggData.artists);

      // Load famous artists
      const famousPath = join(this.dataPath, 'famousArtists.json');
      const famousData: FamousArtistsData = JSON.parse(
        readFileSync(famousPath, 'utf-8')
      );
      
      // Flatten all categories into a single set
      const allFamousArtists: string[] = [];
      Object.values(famousData.artists).forEach(category => {
        allFamousArtists.push(...category);
      });
      this.famousArtists = new Set(allFamousArtists);

      // Load thematic words
      const thematicPath = join(this.dataPath, 'thematicWords.json');
      this.thematicWords = JSON.parse(
        readFileSync(thematicPath, 'utf-8')
      );

      secureLog.debug(`Loaded ${this.easterEggArtists.size} easter egg artists`);
      secureLog.debug(`Loaded ${this.famousArtists.size} famous artists`);
      secureLog.debug(`Loaded thematic words with ${Object.keys(this.thematicWords?.themes || {}).length} themes`);
    } catch (error) {
      secureLog.error('Failed to load famous names data:', error);
      // Fallback to empty sets if loading fails
      this.easterEggArtists = new Set();
      this.famousArtists = new Set();
      this.thematicWords = null;
    }
  }

  isEasterEggArtist(name: string): boolean {
    const normalized = name.toLowerCase().trim();
    return this.easterEggArtists.has(normalized);
  }

  isFamousArtist(name: string): boolean {
    const normalized = name.toLowerCase().trim();
    return this.famousArtists.has(normalized);
  }

  getThematicWords(theme: string): string[] {
    if (!this.thematicWords) return [];
    return this.thematicWords.themes[theme] || this.thematicWords.themes.music || [];
  }

  getConnectors(): string[] {
    return this.thematicWords?.connectors || [];
  }

  getMusicalSuffixes(): string[] {
    return this.thematicWords?.musicalSuffixes || [];
  }

  analyzeNameTheme(name: string): string {
    if (!this.thematicWords) return 'emotional';
    
    const lowerName = name.toLowerCase();
    
    for (const [theme, keywords] of Object.entries(this.thematicWords.themeAnalysis)) {
      if (keywords.some(word => lowerName.includes(word))) {
        return theme;
      }
    }
    
    return 'emotional'; // Default theme
  }

  // Method to check if a name is in our famous names database
  checkFamousName(name: string, type: 'band' | 'song'): { found: boolean; artist?: string } | null {
    // This is a simplified version - in a real implementation,
    // we'd have a separate database of famous songs with their artists
    // For now, we'll just check band names
    if (type === 'band') {
      const normalized = name.toLowerCase().trim();
      if (this.isFamousArtist(normalized) || this.isEasterEggArtist(normalized)) {
        return { found: true };
      }
    }
    
    return null;
  }

  // Reload data if configuration files are updated
  reload(): void {
    this.loadData();
  }
}