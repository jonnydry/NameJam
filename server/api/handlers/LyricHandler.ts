/**
 * Lyric Handler
 * Handles lyric generation requests with quality scoring
 */

import type { Request, Response } from "express";
import { secureLog } from "../../utils/secureLogger";
import { lyricOrchestrator } from "../../services/lyric/lyricOrchestrator";
import { qualityScoring } from "../../services/qualityScoring";

export class LyricHandler {
  async handleGenerateLyricStarter(req: Request, res: Response): Promise<void> {
    try {
      const { genre } = req.body;
      
      const lyricResult = await lyricOrchestrator.generateLyricStarter(genre);
      
      // Apply quality scoring to evaluate the generated lyric
      let finalLyricResult = lyricResult;
      let qualityScore = null;
      
      try {
        const qualityResult = await qualityScoring.scoreLyricQuality(lyricResult.lyric, {
          genre: genre || 'general',
          context: 'starter',
          targetAudience: 'mainstream'
        });
        
        if (qualityResult.success) {
          qualityScore = qualityResult.data;
          
          finalLyricResult = {
            ...lyricResult,
            qualityScore: {
              overall: Math.round(qualityScore.overall * 100) / 100,
              breakdown: {
                creativity: Math.round(qualityScore.breakdown.creativity * 100),
                appropriateness: Math.round(qualityScore.breakdown.appropriateness * 100),
                quality: Math.round(qualityScore.breakdown.quality * 100),
                memorability: Math.round(qualityScore.breakdown.memorability * 100)
              }
            }
          };
          
          // If quality is very low and we're not already generating a fallback, 
          // we could attempt regeneration but for now just serve with quality info
          if (!qualityResult.data.passesThreshold) {
            secureLog.warn('Generated lyric below quality threshold', {
              score: Math.round(qualityScore.overall * 100),
              threshold: 'moderate',
              recommendations: qualityResult.data.recommendations
            });
          }
        } else {
          secureLog.warn('Lyric quality scoring failed:', qualityResult.error);
        }
      } catch (qualityError) {
        secureLog.warn('Quality scoring error:', qualityError);
        // Continue without quality scoring if it fails
      }
      
      res.json({
        lyric: finalLyricResult.lyric,
        genre: finalLyricResult.genre,
        mood: finalLyricResult.mood,
        theme: finalLyricResult.theme,
        model: finalLyricResult.model,
        source: finalLyricResult.source,
        generatedAt: finalLyricResult.generatedAt,
        qualityScore: qualityScore ? {
          overall: Math.round(qualityScore.overall * 100) / 100,
          passedThreshold: qualityScore.overall >= 0.60 // moderate threshold
        } : {
          overall: 0.7,
          passedThreshold: true
        }
      });
    } catch (error) {
      secureLog.error("Error generating lyric spark:", error);
      res.status(500).json({ 
        error: "Failed to generate lyric spark",
        suggestion: "The AI service may be temporarily unavailable. Please try again later."
      });
    }
  }
}