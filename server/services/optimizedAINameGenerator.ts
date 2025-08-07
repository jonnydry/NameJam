/**
 * Optimized AI Name Generator with reduced retries and better performance
 */

import { AINameGeneratorService } from './aiNameGenerator';
import { EnrichedContext } from './contextAggregator';
import { secureLog } from '../utils/secureLogger';

export class OptimizedAINameGeneratorService extends AINameGeneratorService {
  
  async generateWithContext(
    prompt: string, 
    wordCount: number, 
    temperature: number = 1.2,
    enrichedContext?: EnrichedContext
  ): Promise<string | null> {
    try {
      // Single attempt with primary model only (no retries)
      const model = 'grok-beta';
      
      // Add timeout to prevent long waits
      const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), 8000); // 8 second timeout
      });
      
      const generationPromise = super.generateAIName(
        'band' as 'band' | 'song', // Type will be handled in prompt
        undefined, // genre
        undefined, // mood
        wordCount
      );
      
      // Race between generation and timeout
      const result = await Promise.race([generationPromise, timeoutPromise]);
      
      if (!result) {
        secureLog.warn('AI generation timed out after 8 seconds');
      }
      
      return result;
    } catch (error) {
      secureLog.error('Optimized AI generation error:', error);
      return null;
    }
  }
  
  // Override to use faster generation
  async generateNames(params: any): Promise<any[]> {
    const { count = 4, enrichedContext } = params;
    
    // Generate all names in parallel with timeout
    const promises = Array(count).fill(null).map(async (_, index) => {
      const temperature = 1.1 + (index * 0.1); // Vary temperature slightly
      const prompt = this.createPromptWithContext(params, enrichedContext);
      return this.generateWithContext(prompt, params.wordCount, temperature, enrichedContext);
    });
    
    // Wait for all with overall timeout
    const timeoutPromise = new Promise<(string | null)[]>((resolve) => {
      setTimeout(() => resolve([]), 10000); // 10 second overall timeout
    });
    
    const results = await Promise.race([
      Promise.all(promises),
      timeoutPromise
    ]);
    
    // Filter out nulls and format results
    return results
      .filter(name => name !== null)
      .map(name => ({
        name,
        isAiGenerated: true,
        wordCount: params.wordCount
      }));
  }
  
  private createPromptWithContext(params: any, enrichedContext?: EnrichedContext): string {
    // Simplified prompt for faster generation
    const { type, genre, mood, wordCount } = params;
    
    let prompt = `Generate a ${wordCount}-word ${type} name`;
    
    if (genre && genre !== 'general') {
      prompt += ` for ${genre} genre`;
    }
    
    if (mood) {
      prompt += ` with ${mood} mood`;
    }
    
    // Add minimal context to keep prompt short
    if (enrichedContext && enrichedContext.contextQuality !== 'basic') {
      const contextWords = [
        ...enrichedContext.genreCharacteristics.slice(0, 3),
        ...enrichedContext.musicalTerms.slice(0, 3)
      ].join(', ');
      
      if (contextWords) {
        prompt += `. Context: ${contextWords}`;
      }
    }
    
    prompt += '. Be creative and unique.';
    
    return prompt;
  }
}