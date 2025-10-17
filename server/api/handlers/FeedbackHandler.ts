/**
 * Feedback Handler
 * Handles user feedback and preferences
 */

import type { Request, Response } from "express";
import { z } from "zod";
import { secureLog } from "../../utils/secureLogger";
import { InputSanitizer } from "../../utils/inputSanitizer";
import { storage } from "../../storage";

const feedbackSchema = z.object({
  contentType: z.enum(['name', 'verification', 'ui', 'performance', 'other']),
  starRating: z.number().min(1).max(5).optional(),
  thumbsRating: z.enum(['up', 'down']).optional(),
  textComment: z.string().max(1000).optional(),
  sessionId: z.string().optional()
});

const preferencesSchema = z.object({
  preferredRankingMode: z.enum(['creative-first', 'market-focused', 'genre-optimized', 'balanced']).optional(),
  qualityThreshold: z.enum(['very-high', 'high', 'medium', 'low', 'very-low']).optional(),
  preferredGenres: z.array(z.string()).optional(),
  preferredMoods: z.array(z.string()).optional()
});

export class FeedbackHandler {
  async handleSubmitFeedback(req: Request & { user?: any }, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.claims) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userId = req.user.claims.sub;
      
      // Sanitize inputs
      const sanitizedBody = {
        ...req.body,
        textComment: req.body.textComment ? InputSanitizer.sanitizeTextInput(req.body.textComment) : undefined
      };
      
      const feedback = feedbackSchema.parse(sanitizedBody);
      
      const result = await storage.createUserFeedback({
        userId,
        ...feedback,
        feedbackSource: "manual",
        sessionId: req.headers['x-session-id'] as string || undefined,
      });

      secureLog.info("User feedback submitted", {
        userId,
        contentType: feedback.contentType,
        starRating: feedback.starRating,
        thumbsRating: feedback.thumbsRating,
        hasComment: !!feedback.textComment
      });

      res.json({
        success: true,
        feedbackId: result.id,
        message: "Feedback submitted successfully"
      });
      
    } catch (error) {
      secureLog.error("Error submitting feedback:", error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          error: "Invalid feedback data", 
          details: error.errors,
          suggestion: "Please check your feedback data and try again."
        });
      } else {
        res.status(500).json({ 
          error: "Failed to submit feedback",
          suggestion: "Please try again later."
        });
      }
    }
  }

  async handleGetFeedbackHistory(req: Request & { user?: any }, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.claims) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const feedback = await storage.getUserFeedbackHistory(userId, limit, offset);
      
      const formattedFeedback = feedback.map(f => ({
        id: f.id,
        contentType: f.contentType,
        starRating: f.starRating,
        thumbsRating: f.thumbsRating,
        textComment: f.textComment,
        submittedAt: f.createdAt,
        memorabilityRating: f.memorabilityRating,
        relevanceRating: f.relevanceRating,
        creativityRating: f.creativityRating,
        overallRating: f.overallRating
      }));

      res.json({
        feedback: formattedFeedback,
        pagination: {
          limit,
          offset,
          total: feedback.length,
          hasMore: feedback.length === limit
        }
      });
      
    } catch (error) {
      secureLog.error("Error fetching feedback history:", error);
      res.status(500).json({ 
        error: "Failed to fetch feedback history",
        suggestion: "Please try again later."
      });
    }
  }

  async handleUpdatePreferences(req: Request & { user?: any }, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.claims) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userId = req.user.claims.sub;
      const preferences = preferencesSchema.parse(req.body);

      await storage.updateUserPreferences(userId, preferences);

      res.json({
        success: true,
        message: "Preferences updated successfully"
      });
      
    } catch (error) {
      secureLog.error("Error updating preferences:", error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          error: "Invalid preferences data", 
          details: error.errors
        });
      } else {
        res.status(500).json({ 
          error: "Failed to update preferences",
          suggestion: "Please try again later."
        });
      }
    }
  }

  async handleGetPreferences(req: Request & { user?: any }, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.claims) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userId = req.user.claims.sub;
      const preferences = await storage.getUserPreferences(userId);

      res.json({
        preferences: preferences || {}
      });
      
    } catch (error) {
      secureLog.error("Error fetching preferences:", error);
      res.status(500).json({ 
        error: "Failed to fetch preferences",
        suggestion: "Please try again later."
      });
    }
  }
}
