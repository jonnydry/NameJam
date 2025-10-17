/**
 * Band Bio Handler
 * Handles band biography generation requests
 */

import type { Request, Response } from "express";
import { secureLog } from "../../utils/secureLogger";
import { BandBioGenerator } from "../../services/bandBio/bandBioGenerator";

export class BandBioHandler {
  private bandBioGenerator: BandBioGenerator;

  constructor(bandBioGenerator?: BandBioGenerator) {
    this.bandBioGenerator = bandBioGenerator || new BandBioGenerator();
  }

  async handleGenerateBandBio(req: Request & { user?: any; isAuthenticated?: () => boolean }, res: Response): Promise<void> {
    try {
      const { bandName, genre, mood } = req.body;
      
      if (!bandName || typeof bandName !== 'string') {
        return res.status(400).json({ error: "Band name is required" });
      }

      const bioResponse = await this.bandBioGenerator.generateBandBio(bandName, genre, mood);
      
      // Parse the JSON response from the bio generator
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(bioResponse);
      } catch (error) {
        // Fallback for legacy string responses
        parsedResponse = {
          bio: bioResponse,
          model: 'unknown',
          source: 'legacy'
        };
      }
      
      secureLog.debug("Bio generated for", bandName, ":", parsedResponse.bio);
      
      res.json({ 
        bandName,
        bio: parsedResponse.bio,
        model: parsedResponse.model,
        source: parsedResponse.source,
        generatedAt: new Date().toISOString()
      });
    } catch (error) {
      secureLog.error("Error generating band bio:", error);
      res.status(500).json({ 
        error: "Failed to generate band biography",
        suggestion: "The AI service may be temporarily unavailable. Please try again later."
      });
    }
  }
}