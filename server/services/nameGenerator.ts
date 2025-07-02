import type { GenerateNameRequest } from "@shared/schema";

interface WordSource {
  adjectives: string[];
  nouns: string[];
  verbs: string[];
  musicalTerms: string[];
}

export class NameGeneratorService {
  private wordSources: WordSource = {
    adjectives: [],
    nouns: [],
    verbs: [],
    musicalTerms: []
  };

  constructor() {
    this.initializeWordSources();
  }

  private async initializeWordSources() {
    // In a real implementation, this would fetch from external APIs
    // For now, using curated lists that would typically come from web scraping
    this.wordSources = {
      adjectives: [
        'Mystic', 'Crimson', 'Electric', 'Midnight', 'Golden', 'Silver', 'Dark', 'Bright',
        'Wild', 'Silent', 'Burning', 'Frozen', 'Ancient', 'Modern', 'Cosmic', 'Urban',
        'Neon', 'Velvet', 'Steel', 'Crystal', 'Shadow', 'Thunder', 'Lightning', 'Storm',
        'Infinite', 'Lost', 'Hidden', 'Sacred', 'Broken', 'Perfect', 'Rebel', 'Gentle'
      ],
      nouns: [
        'Echo', 'Wave', 'Fire', 'Storm', 'Star', 'Moon', 'Sun', 'River', 'Mountain',
        'Ocean', 'Desert', 'Forest', 'City', 'Road', 'Bridge', 'Tower', 'Castle',
        'Garden', 'Mirror', 'Dream', 'Vision', 'Memory', 'Journey', 'Destiny', 'Glory',
        'Victory', 'Freedom', 'Spirit', 'Soul', 'Heart', 'Mind', 'Voice', 'Song'
      ],
      verbs: [
        'Rising', 'Falling', 'Dancing', 'Singing', 'Flying', 'Running', 'Walking',
        'Climbing', 'Diving', 'Soaring', 'Burning', 'Shining', 'Glowing', 'Flowing',
        'Breaking', 'Building', 'Creating', 'Destroying', 'Healing', 'Dreaming'
      ],
      musicalTerms: [
        'Harmony', 'Melody', 'Rhythm', 'Beat', 'Tempo', 'Chord', 'Note', 'Scale',
        'Symphony', 'Sonata', 'Ballad', 'Anthem', 'Crescendo', 'Diminuendo', 'Forte',
        'Piano', 'Allegro', 'Andante', 'Maestro', 'Virtuoso', 'Ensemble', 'Overture'
      ]
    };
  }

  async generateNames(request: GenerateNameRequest): Promise<string[]> {
    const { type, wordCount, count } = request;
    const names: string[] = [];

    for (let i = 0; i < count; i++) {
      const name = await this.generateSingleName(type, wordCount);
      if (!names.includes(name)) {
        names.push(name);
      }
    }

    // If we don't have enough unique names, generate more
    while (names.length < count) {
      const name = await this.generateSingleName(type, wordCount);
      if (!names.includes(name)) {
        names.push(name);
      }
    }

    return names;
  }

  private async generateSingleName(type: string, wordCount: number): Promise<string> {
    const words: string[] = [];
    const allWordTypes = [
      this.wordSources.adjectives,
      this.wordSources.nouns,
      this.wordSources.verbs,
      this.wordSources.musicalTerms
    ];

    for (let i = 0; i < wordCount; i++) {
      let wordSource: string[];
      
      if (type === 'song') {
        // Songs tend to be more descriptive/poetic
        if (i === 0 && Math.random() > 0.5) {
          wordSource = this.wordSources.adjectives;
        } else if (i === wordCount - 1) {
          wordSource = this.wordSources.nouns;
        } else {
          wordSource = allWordTypes[Math.floor(Math.random() * allWordTypes.length)];
        }
      } else {
        // Bands can be more varied
        if (i === 0 && Math.random() > 0.3) {
          wordSource = [...this.wordSources.adjectives, ...this.wordSources.musicalTerms];
        } else {
          wordSource = this.wordSources.nouns;
        }
      }

      const randomWord = wordSource[Math.floor(Math.random() * wordSource.length)];
      words.push(randomWord);
    }

    return words.join(' ');
  }

  // Method to fetch words from external APIs (placeholder)
  private async fetchWordsFromWeb(): Promise<void> {
    // This would implement web scraping or API calls to:
    // - Dictionary APIs
    // - Wikipedia random article titles
    // - Poetry/literature APIs
    // - Music databases
    
    // For now, we'll use the static lists above
    console.log('Fetching words from web sources...');
  }
}
