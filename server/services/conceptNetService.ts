import { secureLog } from '../utils/secureLogger';

interface ConceptNetEdge {
  start: { label: string; language: string };
  end: { label: string; language: string };
  rel: { label: string };
  weight: number;
  surfaceText?: string;
}

interface ConceptNetResponse {
  edges: ConceptNetEdge[];
}

interface ConceptNetWord {
  word: string;
  weight: number;
  relation: string;
}

export class ConceptNetService {
  private baseUrl = 'https://api.conceptnet.io';
  private cache = new Map<string, ConceptNetWord[]>();
  private cacheExpiry = 1000 * 60 * 60; // 1 hour cache

  async getRelatedConcepts(word: string, limit: number = 20): Promise<ConceptNetWord[]> {
    const cacheKey = `${word}_${limit}`;
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const url = `${this.baseUrl}/query?start=/c/en/${word.toLowerCase()}&limit=${limit}`;
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'NameJam/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`ConceptNet API error: ${response.status}`);
      }

      const data: ConceptNetResponse = await response.json();
      
      // Process edges to extract related concepts
      const concepts = data.edges
        .filter(edge => 
          edge.end.language === 'en' && 
          edge.weight >= 1.0 && // Only strong associations
          edge.end.label !== word.toLowerCase() // Avoid self-references
        )
        .map(edge => ({
          word: edge.end.label,
          weight: edge.weight,
          relation: edge.rel.label
        }))
        .filter(concept => 
          concept.word.length > 2 && 
          !concept.word.includes('_') && // Avoid multi-word concepts
          /^[a-zA-Z]+$/.test(concept.word) // Only alphabetic words
        );

      // Sort by weight and deduplicate
      const uniqueConcepts = Array.from(
        new Map(concepts.map(c => [c.word, c])).values()
      ).sort((a, b) => b.weight - a.weight);

      // Cache the result
      this.cache.set(cacheKey, uniqueConcepts);
      setTimeout(() => this.cache.delete(cacheKey), this.cacheExpiry);

      return uniqueConcepts;
    } catch (error) {
      secureLog.error('ConceptNet API error, using XAI fallback:', error);
      
      // Use XAI fallback when ConceptNet fails
      try {
        const { xaiFallbackService } = await import('./xaiFallbackService');
        const fallbackConcepts = await xaiFallbackService.generateConceptNetFallback(word, 'general');
        
        if (fallbackConcepts.length > 0) {
          secureLog.info(`XAI fallback provided ${fallbackConcepts.length} concepts for "${word}"`);
          return fallbackConcepts.map((w, index) => ({
            word: w,
            weight: 2.5 - (index * 0.1), // Simulated weight
            relation: 'RelatedTo'
          }));
        }
      } catch (fallbackError) {
        secureLog.error('XAI fallback also failed:', fallbackError);
      }
      
      return [];
    }
  }

  async getEmotionalAssociations(emotion: string): Promise<string[]> {
    try {
      const concepts = await this.getRelatedConcepts(emotion, 30);
      
      // Filter for emotionally relevant relations
      const emotionalRelations = ['HasProperty', 'Causes', 'CausesDesire', 'MotivatedByGoal', 'HasSubevent'];
      
      return concepts
        .filter(c => emotionalRelations.includes(c.relation) || c.weight > 2)
        .map(c => c.word)
        .slice(0, 15);
    } catch (error) {
      secureLog.error('Error getting emotional associations, using XAI fallback:', error);
      
      // Use XAI fallback
      try {
        const { xaiFallbackService } = await import('./xaiFallbackService');
        const fallbackEmotions = await xaiFallbackService.generateConceptNetFallback(emotion, 'emotional');
        
        if (fallbackEmotions.length > 0) {
          secureLog.info(`XAI fallback provided ${fallbackEmotions.length} emotional associations`);
          return fallbackEmotions;
        }
      } catch (fallbackError) {
        secureLog.error('XAI fallback also failed:', fallbackError);
      }
      
      return [];
    }
  }

  async getGenreAssociations(genre: string): Promise<string[]> {
    try {
      // Map genre to conceptual terms
      const genreConceptMap: Record<string, string[]> = {
        'rock': ['rebellion', 'power', 'guitar', 'loud'],
        'jazz': ['improvisation', 'smooth', 'saxophone', 'swing'],
        'electronic': ['digital', 'synthesizer', 'beat', 'future'],
        'reggae': ['island', 'peace', 'rhythm', 'roots'],
        'country': ['rural', 'truck', 'whiskey', 'heartland'],
        'folk': ['tradition', 'story', 'acoustic', 'simple'],
        'classical': ['elegant', 'symphony', 'refined', 'timeless'],
        'hip-hop': ['street', 'rhythm', 'urban', 'flow'],
        'metal': ['heavy', 'dark', 'aggressive', 'powerful'],
        'blues': ['soul', 'melancholy', 'emotion', 'authentic'],
        'punk': ['anarchy', 'rebel', 'raw', 'fast'],
        'indie': ['independent', 'alternative', 'creative', 'unique'],
        'pop': ['catchy', 'bright', 'fun', 'mainstream'],
        'alternative': ['different', 'experimental', 'unique', 'underground']
      };

      const concepts = genreConceptMap[genre.toLowerCase()] || [genre];
      const allAssociations: string[] = [];

      // Get associations for each concept
      for (const concept of concepts.slice(0, 2)) { // Limit to prevent too many API calls
        const related = await this.getRelatedConcepts(concept, 10);
        allAssociations.push(...related.map(r => r.word));
      }

      // Deduplicate and return
      return Array.from(new Set(allAssociations)).slice(0, 20);
    } catch (error) {
      secureLog.error('Error getting genre associations, using XAI fallback:', error);
      
      // Use XAI fallback
      try {
        const { xaiFallbackService } = await import('./xaiFallbackService');
        const fallbackAssociations = await xaiFallbackService.generateConceptNetFallback(genre, 'genre');
        
        if (fallbackAssociations.length > 0) {
          secureLog.info(`XAI fallback provided ${fallbackAssociations.length} genre associations`);
          return fallbackAssociations;
        }
      } catch (fallbackError) {
        secureLog.error('XAI fallback also failed:', fallbackError);
      }
      
      return [];
    }
  }

  async getCulturalConnections(word: string): Promise<string[]> {
    try {
      const concepts = await this.getRelatedConcepts(word, 25);
      
      // Focus on cultural and contextual relations
      const culturalRelations = ['RelatedTo', 'AtLocation', 'PartOf', 'HasContext', 'SymbolOf'];
      
      return concepts
        .filter(c => culturalRelations.includes(c.relation) || c.weight > 1.5)
        .map(c => c.word)
        .slice(0, 10);
    } catch (error) {
      secureLog.error('Error getting cultural connections:', error);
      return [];
    }
  }

  // Extract vocabulary patterns suitable for name generation
  extractVocabularyPatterns(concepts: ConceptNetWord[]): string[] {
    return concepts
      .filter(c => 
        c.word.length >= 3 && 
        c.word.length <= 12 && 
        /^[a-zA-Z]+$/.test(c.word) &&
        c.weight >= 1.0
      )
      .map(c => c.word)
      .slice(0, 15);
  }
}

export const conceptNetService = new ConceptNetService();