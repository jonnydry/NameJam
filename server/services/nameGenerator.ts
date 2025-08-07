import type { GenerateNameRequest } from "@shared/schema";
import { unifiedWordFilter } from "./nameGeneration/unifiedWordFilter";
import { secureLog } from "../utils/secureLogger";

export class NameGeneratorService {
  constructor() {
    // Simple constructor - all logic handled by IntelligentNameGeneratorService
  }



  // Main generation method - uses intelligent API-driven generator
  async generateNames(request: GenerateNameRequest): Promise<Array<{name: string, isAiGenerated: boolean, source: string}>> {
    // Start new generation session for word filtering
    const generationId = unifiedWordFilter.startNewGeneration();

    // Use intelligent API-driven generator with XAI
    secureLog.info(`🎯 Using intelligent API-driven generation for ${request.genre || 'general'} genre`);
    const { IntelligentNameGeneratorService } = await import('./intelligentNameGenerator');
    const intelligentGenerator = new IntelligentNameGeneratorService();
    const names = await intelligentGenerator.generateNames(request);
    return names;
  }

  // Simple fallback when both AI and Datamuse fail
  private generateSimpleFallback(type: string, count: number): Array<{name: string, isAiGenerated: boolean, source: string}> {
    // Generate unique fallback names with timestamp to avoid "taken" status
    const timestamp = Date.now();
    const uniqueSuffix = timestamp.toString().slice(-4);
    
    const baseFallbackBand = ['Mystic Echoes', 'Quantum Drift', 'Nebula Rising', 'Astral Void', 'Cosmic Flux'];
    const baseFallbackSong = ['Stellar Dreams', 'Quantum Leap', 'Nebula Dance', 'Astral Light', 'Cosmic Wave'];
    
    const fallbackNames = type === 'band' 
      ? baseFallbackBand.map(name => `${name} ${uniqueSuffix}`)
      : baseFallbackSong.map(name => `${name} ${uniqueSuffix}`);
    
    return Array.from({ length: count }, (_, i) => ({
      name: fallbackNames[i % fallbackNames.length],
      isAiGenerated: false,
      source: 'fallback'
    }));
  }

  // Enhanced setlist generation using intelligent API-driven generator
  async generateSetlistNames(request: GenerateNameRequest): Promise<Array<{name: string, isAiGenerated: boolean, source: string}>> {
    secureLog.info(`🎵 Generating setlist songs using intelligent API-driven generation`);
    
    try {
      // Use the same intelligent generation as main names but with song focus
      const enhancedRequest = {
        ...request,
        type: 'song' as const,
        count: request.count || 1
      };
      
      // Use intelligent API-driven generator for all setlist songs
      const { IntelligentNameGeneratorService } = await import('./intelligentNameGenerator');
      const intelligentGenerator = new IntelligentNameGeneratorService();
      const names = await intelligentGenerator.generateNames(enhancedRequest);
      
      secureLog.info(`✅ Generated ${names.length} setlist songs`);
      return names;
      
    } catch (error) {
      console.error("Setlist generation failed:", error);
      return this.generateSimpleFallback(request.type || 'song', request.count || 1);
    }
  }
}

export const nameGenerator = new NameGeneratorService();