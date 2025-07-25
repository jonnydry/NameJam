import type { GenerateNameRequest } from "@shared/schema";
import type { AINameGeneratorService } from "./aiNameGenerator";
import { enhancedNameGenerator } from "./enhancedNameGenerator";

export class NameGeneratorService {
  private aiNameGenerator: AINameGeneratorService | null = null;

  constructor() {
    // Initialize without AI dependency to avoid circular imports
  }

  setAINameGenerator(aiService: AINameGeneratorService) {
    this.aiNameGenerator = aiService;
  }

  // Main generation method - routes between AI and Datamuse API
  async generateNames(request: GenerateNameRequest): Promise<Array<{name: string, isAiGenerated: boolean, source: string}>> {
    const { count = 4 } = request;
    
    // Calculate AI vs Datamuse split (50% AI, 50% Datamuse)
    const aiCount = Math.floor(count / 2); // Half the names from AI
    const datamuseCount = count - aiCount;

    console.log(`🎯 Generating ${count} names: ${aiCount} AI + ${datamuseCount} Datamuse`);

    const results: Array<{name: string, isAiGenerated: boolean, source: string}> = [];

    // Generate AI names if available and requested
    if (aiCount > 0 && this.aiNameGenerator) {
      try {
        // Generate multiple AI names sequentially to ensure anti-repetition works
        const aiResults = [];
        for (let i = 0; i < aiCount; i++) {
          const name = await this.aiNameGenerator.generateAIName(request.type, request.genre, request.mood, request.wordCount);
          aiResults.push(name);
        }
        
        const aiResultsArray = aiResults.map(name => ({
          name,
          isAiGenerated: true,
          source: 'ai'
        }));
        
        results.push(...aiResultsArray);
        console.log(`✅ Generated ${aiResultsArray.length} AI names`);
      } catch (error) {
        console.error("AI generation failed, using Datamuse fallback:", error);
        // Fallback to Datamuse if AI fails
        const fallbackResults = await enhancedNameGenerator.generateEnhancedNames({
          ...request,
          count: aiCount
        });
        results.push(...fallbackResults);
      }
    }

    // Generate Datamuse names for the remainder
    if (datamuseCount > 0) {
      try {
        const datamuseResults = await enhancedNameGenerator.generateEnhancedNames({
          ...request,
          count: datamuseCount
        });
        results.push(...datamuseResults);
        console.log(`✅ Generated ${datamuseResults.length} Datamuse names`);
      } catch (error) {
        console.error("Datamuse generation failed:", error);
        // Provide simple fallback names if both systems fail
        const fallbackNames = this.generateSimpleFallback(request.type, datamuseCount);
        results.push(...fallbackNames);
      }
    }

    return results.slice(0, count);
  }

  // Simple fallback when both AI and Datamuse fail
  private generateSimpleFallback(type: string, count: number): Array<{name: string, isAiGenerated: boolean, source: string}> {
    const fallbackNames = type === 'band' 
      ? ['The Phoenix', 'Storm Rising', 'Electric Dreams', 'Shadow Fire', 'Crystal Echo']
      : ['Rising Storm', 'Electric Night', 'Shadow Dance', 'Crystal Light', 'Phoenix Song'];
    
    return Array.from({ length: count }, (_, i) => ({
      name: fallbackNames[i % fallbackNames.length],
      isAiGenerated: false,
      source: 'fallback'
    }));
  }

  // Method for setlist generation - uses only Datamuse API
  async generateSetlistNames(request: GenerateNameRequest): Promise<Array<{name: string, isAiGenerated: boolean, source: string}>> {
    console.log(`🎵 Generating setlist songs using Datamuse API`);
    
    try {
      return await enhancedNameGenerator.generateEnhancedNames(request);
    } catch (error) {
      console.error("Setlist generation failed:", error);
      return this.generateSimpleFallback(request.type, request.count || 8);
    }
  }
}

export const nameGenerator = new NameGeneratorService();