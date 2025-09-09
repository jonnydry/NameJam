import type { VerificationResult } from "@shared/schema";
import { phoneticMatchingService } from "./phoneticMatchingService";
import { confidenceCalculator } from "./confidenceCalculator";
import { secureLog } from '../utils/secureLogger';
import { FamousNamesRepository } from './famousNamesRepository';
import { EasterEggService } from './easterEggService';
import { NameSuggestionService } from './nameSuggestionService';
import { VerificationOrchestrator } from './verificationOrchestrator';

export class NameVerifierService {
  private famousNamesRepo: FamousNamesRepository;
  private easterEggService: EasterEggService;
  private nameSuggestionService: NameSuggestionService;
  private verificationOrchestrator: VerificationOrchestrator;

  constructor() {
    this.famousNamesRepo = FamousNamesRepository.getInstance();
    this.easterEggService = EasterEggService.getInstance();
    this.nameSuggestionService = NameSuggestionService.getInstance();
    this.verificationOrchestrator = VerificationOrchestrator.getInstance();
  }

  async verifyName(name: string, type: 'band' | 'song'): Promise<VerificationResult> {
    try {
      // Check for easter eggs first
      const easterEgg = this.easterEggService.checkEasterEgg(name, type);
      if (easterEgg) {
        return easterEgg;
      }

      // Check for famous artists (high confidence but realistic verification)
      const famousArtist = this.easterEggService.checkFamousArtist(
        name, 
        type,
        (n, t) => this.nameSuggestionService.generateVerificationLinks(n, t),
        (n) => this.nameSuggestionService.generateSimilarNames(n)
      );
      if (famousArtist) {
        return famousArtist;
      }

      // Generate verification links that users can actually use
      const verificationLinks = this.nameSuggestionService.generateVerificationLinks(name, type);

      // Use VerificationOrchestrator to check all platforms in parallel
      const {
        spotifyResults,
        itunesResults,
        soundcloudResults,
        bandcampResults,
        otherSearchResults
      } = await this.verificationOrchestrator.verifyAcrossPlatforms(name, type);

      // Check Spotify exact matches first (highest priority)
      if (spotifyResults && spotifyResults.exists) {
        const match = spotifyResults.matches[0];
        const similarNames = this.nameSuggestionService.generateSimilarNames(name);
        
        // Calculate confidence for this taken result
        const confidenceResult = confidenceCalculator.calculateAvailabilityConfidence(
          name, spotifyResults, undefined, undefined, undefined, itunesResults, soundcloudResults, bandcampResults
        );
        
        if (type === 'band') {
          const genreInfo = match.genres && match.genres.length > 0 ? ` (${match.genres.slice(0, 2).join(', ')})` : '';
          return {
            status: 'taken',
            confidence: confidenceResult.confidence,
            confidenceLevel: confidenceResult.confidenceLevel,
            explanation: confidenceResult.explanation,
            details: `This band name exists on Spotify${genreInfo}. Popularity: ${match.popularity}/100. Try these alternatives:`,
            similarNames,
            verificationLinks
          };
        } else {
          return {
            status: 'taken',
            confidence: confidenceResult.confidence,
            confidenceLevel: confidenceResult.confidenceLevel,
            explanation: confidenceResult.explanation,
            details: `This song exists on Spotify by ${match.artist} (${match.album}). Try these alternatives:`,
            similarNames,
            verificationLinks
          };
        }
      }

      // Check Spotify similar matches (second priority)
      if (spotifyResults && spotifyResults.matches && spotifyResults.matches.length > 0 && !spotifyResults.exists) {
        const match = spotifyResults.matches[0];
        const similarNames = this.nameSuggestionService.generateSimilarNames(name);
        
        // Calculate confidence for similar matches
        const confidenceResult = confidenceCalculator.calculateAvailabilityConfidence(
          name, spotifyResults, undefined, undefined, undefined, itunesResults, soundcloudResults, bandcampResults
        );
        
        if (type === 'band') {
          const genreInfo = match.genres && match.genres.length > 0 ? ` (${match.genres.slice(0, 2).join(', ')})` : '';
          return {
            status: 'similar',
            confidence: confidenceResult.confidence,
            confidenceLevel: confidenceResult.confidenceLevel,
            explanation: confidenceResult.explanation,
            details: `Similar band names found on Spotify${genreInfo}. Consider these alternatives:`,
            similarNames,
            verificationLinks
          };
        } else {
          return {
            status: 'similar',
            confidence: confidenceResult.confidence,
            confidenceLevel: confidenceResult.confidenceLevel,
            explanation: confidenceResult.explanation,
            details: `Similar song titles found on Spotify by various artists. Consider these alternatives:`,
            similarNames,
            verificationLinks
          };
        }
      }

      // Famous names database check (third priority)
      const famousMatch = this.famousNamesRepo.checkFamousName(name, type);
      if (famousMatch && famousMatch.found) {
        const similarNames = this.nameSuggestionService.generateSimilarNames(name);
        // Calculate confidence for famous matches
        const confidenceResult = confidenceCalculator.calculateAvailabilityConfidence(
          name, undefined, undefined, undefined, [name], itunesResults, soundcloudResults, bandcampResults
        );
        return {
          status: 'taken',
          confidence: confidenceResult.confidence,
          confidenceLevel: confidenceResult.confidenceLevel,
          explanation: confidenceResult.explanation,
          details: `This is a famous ${type}${famousMatch.artist ? ` by ${famousMatch.artist}` : ''}. Try these alternatives:`,
          similarNames,
          verificationLinks
        };
      }

      // Use otherSearchResults from orchestrator (Last.fm, MusicBrainz)
      const searchResults = otherSearchResults;

      // Minimal logging for debugging when needed
      if (searchResults.length > 5) {
        secureLog.debug(`Found ${searchResults.length} results for "${name}"`);
      }

      // Check for exact matches in other sources
      const exactMatches = searchResults.filter(result => 
        result.name?.toLowerCase().trim() === name.toLowerCase().trim()
      );

      if (exactMatches.length > 0) {
        // Exact match found = Name is taken
        const match = exactMatches[0];
        const artistInfo = match.artist ? ` by ${match.artist}` : '';
        const similarNames = this.nameSuggestionService.generateSimilarNames(name);
        secureLog.debug(`Exact match found for "${name}": ${match.name} by ${match.artist || 'Unknown'}`);
        
        // Calculate confidence for exact matches from other sources
        const confidenceResult = confidenceCalculator.calculateAvailabilityConfidence(
          name, spotifyResults, searchResults, undefined, undefined, itunesResults, soundcloudResults, bandcampResults
        );
        
        return {
          status: 'taken',
          confidence: confidenceResult.confidence,
          confidenceLevel: confidenceResult.confidenceLevel,
          explanation: confidenceResult.explanation,
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
        const similarNames = this.nameSuggestionService.generateSimilarNames(name);
        secureLog.debug(`Close matches found for "${name}":`, closeMatches.slice(0, 2));
        
        // Calculate confidence for similar matches
        const confidenceResult = confidenceCalculator.calculateAvailabilityConfidence(
          name, spotifyResults, searchResults, undefined, undefined, itunesResults, soundcloudResults, bandcampResults
        );
        
        return {
          status: 'similar',
          confidence: confidenceResult.confidence,
          confidenceLevel: confidenceResult.confidenceLevel,
          explanation: confidenceResult.explanation,
          details: `Similar names found in music databases. Consider these alternatives:`,
          similarNames,
          verificationLinks
        };
      }

      // Only mark as available if we have fewer than 5 very weak results
      // This handles cases where APIs return tons of unrelated results
      
      // Calculate confidence for available results
      const confidenceResult = confidenceCalculator.calculateAvailabilityConfidence(
        name, spotifyResults, searchResults, undefined, undefined, itunesResults, soundcloudResults, bandcampResults
      );
      
      if (searchResults.length <= 5) {
        // Few or no relevant matches - marking as available
        return {
          status: 'available',
          confidence: confidenceResult.confidence,
          confidenceLevel: confidenceResult.confidenceLevel,
          explanation: confidenceResult.explanation,
          details: `No existing ${type} found with this name in our databases.`,
          verificationLinks
        };
      } else {
        // Many results but none are close matches - still available but note the search volume
        // No close matches found - marking as available
        return {
          status: 'available',
          confidence: confidenceResult.confidence,
          confidenceLevel: confidenceResult.confidenceLevel,
          explanation: confidenceResult.explanation,
          details: `No existing ${type} found with this exact name in our databases.`,
          verificationLinks
        };
      }
    } catch (error) {
      console.error('Name verification error:', error);
      return {
        status: 'available',
        confidence: 0.5,
        confidenceLevel: 'medium',
        explanation: 'Verification incomplete due to technical issues',
        details: 'Verification temporarily unavailable - name appears to be available.',
        verificationLinks: this.nameSuggestionService.generateVerificationLinks(name, type)
      };
    }
  }

  // Method removed - now using NameSuggestionService.generateVerificationLinks()

  // Method removed - now using NameSuggestionService.generateSimilarNames()

  // Method removed - now using FamousNamesRepository.analyzeNameTheme()

  // Method removed - now using NameSuggestionService.generateExistingInfo()

  // Method removed - now using NameSuggestionService.getRandomSuffix()

  // Method removed - now using NameSuggestionService.getRandomPrefix()

  // Method removed - now using FamousNamesRepository.checkFamousName()

  // Method removed - now using VerificationOrchestrator for searchLastFm and searchRealMusicBrainz

  private calculateSimilarity(str1: string, str2: string): number {
    // Enhanced similarity calculation using phonetic matching
    const phoneticMatch = phoneticMatchingService.calculateSimilarity(str1, str2);
    return phoneticMatch.similarity;
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
