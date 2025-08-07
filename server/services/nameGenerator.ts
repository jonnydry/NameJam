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
}

export const nameGenerator = new NameGeneratorService();