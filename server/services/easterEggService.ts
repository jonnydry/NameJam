import type { VerificationResult } from "@shared/schema";
import { FamousNamesRepository } from './famousNamesRepository';

export class EasterEggService {
  private static instance: EasterEggService;
  private famousNamesRepo: FamousNamesRepository;

  private constructor() {
    this.famousNamesRepo = FamousNamesRepository.getInstance();
  }

  static getInstance(): EasterEggService {
    if (!EasterEggService.instance) {
      EasterEggService.instance = new EasterEggService();
    }
    return EasterEggService.instance;
  }

  /**
   * Check if the name triggers an easter egg response
   * Returns null if no easter egg applies
   */
  checkEasterEgg(name: string, type: 'band' | 'song'): VerificationResult | null {
    // Check for NameJam variations
    const normalizedName = name.toLowerCase().replace(/[^a-z]/g, '');
    if (normalizedName === 'namejam') {
      return {
        status: 'available',
        confidence: 1.0,
        confidenceLevel: 'very-high',
        explanation: 'Special easter egg - 100% confidence this name is perfect!',
        details: 'We love you. Go to bed. <3',
        verificationLinks: []
      };
    }

    // Check for obviously famous artists (trolling people testing the app)
    if (this.famousNamesRepo.isEasterEggArtist(name)) {
      return {
        status: 'available',
        confidence: 1.0,
        confidenceLevel: 'very-high',
        explanation: 'Special easter egg for famous artists - 100% confidence this name is perfect!',
        details: 'We love you. Go to bed. <3',
        verificationLinks: []
      };
    }

    return null;
  }

  /**
   * Check if the name is a famous artist that should get high confidence
   * but realistic verification (not an easter egg)
   */
  checkFamousArtist(
    name: string, 
    type: 'band' | 'song',
    generateLinks: (name: string, type: 'band' | 'song') => Array<{name: string, url: string, source: string}>,
    generateSimilarNames: (name: string) => string[]
  ): VerificationResult | null {
    if (this.famousNamesRepo.isFamousArtist(name)) {
      const verificationLinks = generateLinks(name, type);
      const similarNames = generateSimilarNames(name);
      
      return {
        status: 'taken',
        confidence: 0.96, // 96% confidence - very high but not easter egg level
        confidenceLevel: 'very-high',
        explanation: 'Found exact match for highly popular artist on Spotify with millions of listeners',
        details: `This is a famous ${type} name with massive popularity. Try these alternatives:`,
        similarNames,
        verificationLinks
      };
    }

    return null;
  }
}