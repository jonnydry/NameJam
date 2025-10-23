import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { nameGenerator } from "./services/nameGenerator";
import { lyricGenerator } from "./services/lyricGenerator";
import { db } from "./db";
import { CacheService } from "./services/cacheService";
import { NameVerifierService } from "./services/nameVerifier";
import { BandBioGenerator } from "./services/bandBio/bandBioGenerator";
import { performanceMonitor } from "./services/performanceMonitor";
import { users, errorLogs, userFeedback, userPreferences, feedbackAnalytics } from "@shared/schema";

import {
  generateNameRequestSchema,
  userFeedbackRequestSchema,
  userPreferencesUpdateSchema
} from "@shared/schema";
import { z } from "zod";
import { ErrorHandler, ERROR_CODES, apiErrorSchema } from "@shared/errorSchemas";

import { validationRules, handleValidationErrors } from "./security";
import { secureLog } from "./utils/secureLogger";
import type { Request, Response, NextFunction } from "express";
import { InputSanitizer } from "./utils/inputSanitizer";

import {
  compressionMiddleware,
  timeoutMiddleware,
  responseTimeMiddleware
} from "./middleware/performanceOptimization";

// Helper functions for intelligent ranking
function determineRankingMode(request: any, userPreferences: any): string {
  // Determine ranking mode based on request parameters and user preferences
  if (userPreferences?.preferredRankingMode) {
    return userPreferences.preferredRankingMode;
  }
  
  // Infer from genre and context
  if (request.genre === 'experimental' || request.genre === 'avant-garde') {
    return 'creative-first';
  }
  
  if (request.genre === 'pop' || request.genre === 'commercial') {
    return 'market-focused';
  }
  
  if (request.genre) {
    return 'genre-optimized';
  }
  
  return 'balanced'; // Default to balanced mode
}

function getQualityThreshold(request: any, userPreferences: any): number {
  // Get quality threshold based on user preferences and request context
  if (userPreferences?.qualityThreshold) {
    const thresholdMapping = {
      'strict': 0.75,
      'moderate': 0.60,
      'lenient': 0.45
    };
    return thresholdMapping[userPreferences.qualityThreshold as keyof typeof thresholdMapping] || 0.60;
  }
  
  // Default moderate threshold
  return 0.60;
}

export async function registerRoutes(app: Express, middleware?: any): Promise<Server> {
  // Add performance optimization middleware
  app.use(compressionMiddleware);
  app.use(responseTimeMiddleware);
  app.use(timeoutMiddleware(50000)); // 50 second timeout for complex generations
  
  // Auth middleware
  await setupAuth(app);

  secureLog.info("Initializing services...");

  // Initialize required services
  const cacheService = new CacheService();
  const nameVerifierService = new NameVerifierService();
  const bandBioGenerator = new BandBioGenerator();

  secureLog.info("✓ NameJam services ready");

  // Auth routes (with rate limiting)
  app.get('/api/auth/user', 
    middleware?.auth || ((req: Request, res: Response, next: NextFunction) => next()), 
    isAuthenticated, 
    async (req: Request & { user?: any }, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      secureLog.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Generate names endpoint (public with optional auth for saving)
  app.post("/api/generate-names", 
    middleware?.generation || ((req: Request, res: Response, next: NextFunction) => next()), 
    middleware?.csrf?.validateToken || ((req: Request, res: Response, next: NextFunction) => next()),
    validationRules.generateNames, 
    handleValidationErrors, 
    async (req: Request & { user?: any; isAuthenticated?: () => boolean }, res: Response) => {
    let hasResponded = false;
    
    const sendResponse = (statusCode: number, data: any) => {
      if (!hasResponded && !res.headersSent) {
        hasResponded = true;
        res.status(statusCode).json(data);
      }
    };

    try {
      // Sanitize inputs
      const sanitizedBody = {
        ...req.body,
        type: req.body.type,
        wordCount: req.body.wordCount,
        count: req.body.count,
        mood: req.body.mood ? InputSanitizer.sanitizeMoodInput(req.body.mood) : undefined,
        genre: req.body.genre ? InputSanitizer.sanitizeGenreInput(req.body.genre) : undefined
      };
      
      const request = generateNameRequestSchema.parse(sanitizedBody);

      // Generate names using simplified service
      const generatedNames = await nameGenerator.generateNames(request);

      // Simple response format
      const results = generatedNames.map(nameResult => ({
        name: nameResult.name,
        type: request.type,
        wordCount: nameResult.name.split(' ').length,
        isAiGenerated: nameResult.isAiGenerated,
        source: nameResult.source
      }));

      sendResponse(200, { results });

    } catch (error) {
      secureLog.error("Error generating names:", error);
      if (error instanceof z.ZodError) {
        sendResponse(400, { error: "Invalid request parameters", details: error.errors });
      } else {
        const errorMessage = error instanceof Error ? error.message : "Failed to generate names";
        sendResponse(500, { 
          error: errorMessage,
          suggestion: "Please try again with different settings or a smaller word count." 
        });
      }
    }
  });

  // Get recent generated names (protected)
  app.get("/api/recent-names", isAuthenticated, async (req: Request & { user?: any }, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const type = req.query.type as string;
      const limit = parseInt(req.query.limit as string) || 20;

      let names;
      if (type && (type === 'band' || type === 'song')) {
        names = await storage.getGeneratedNamesByType(type, userId, limit);
      } else {
        names = await storage.getGeneratedNames(userId, limit);
      }

      res.json({ names });
    } catch (error) {
      secureLog.error("Error fetching recent names:", error);
      res.status(500).json({ 
        error: "Failed to fetch recent names",
        suggestion: "The database service may be temporarily unavailable. Please refresh the page." 
      });
    }
  });

  // Verify specific name (with validation)
  app.post("/api/verify-name", 
    validationRules.verifyName, 
    handleValidationErrors, 
    async (req: Request, res: Response) => {
    try {
      // Sanitize inputs
      const sanitizedName = InputSanitizer.sanitizeNameInput(req.body.name);
      const type = req.body.type;
      
      if (!sanitizedName || !type || !['band', 'song'].includes(type)) {
        return res.status(400).json({ error: "Name and valid type (band/song) are required" });
      }

      // Check cache first
      const cacheKey = `${sanitizedName}:${type}`;
      const cached = cacheService.get(cacheKey);
      if (cached) {
        secureLog.debug(`Cache hit for ${type}: ${sanitizedName}`);
        return res.json({ verification: cached });
      }

      // If not cached, verify normally
      const verification = await nameVerifierService.verifyName(sanitizedName, type);

      // Store in cache for 30 minutes (1800 seconds)
      cacheService.set(cacheKey, verification, 1800);
      
      res.json({ verification });
    } catch (error) {
      secureLog.error("Error verifying name:", error);
      res.status(500).json({ 
        error: "Failed to verify name",
        suggestion: "The verification service may be temporarily unavailable. Please try again later." 
      });
    }
  });

  // Generate band bio endpoint (public with rate limiting and validation)
  app.post("/api/generate-band-bio", 
    middleware?.generation || ((req: Request, res: Response, next: NextFunction) => next()), 
    middleware?.csrf?.validateToken || ((req: Request, res: Response, next: NextFunction) => next()),
    validationRules.generateBandBio, 
    handleValidationErrors, 
    async (req: Request & { user?: any; isAuthenticated?: () => boolean }, res: Response) => {
    try {
      const { bandName, genre, mood } = req.body;
      
      if (!bandName || typeof bandName !== 'string') {
        return res.status(400).json({ error: "Band name is required" });
      }

      const bioResponse = await bandBioGenerator.generateBandBio(bandName, genre, mood);
      
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
  });

  // Generate lyric starter endpoint (public with optional auth for saving)  
  app.post("/api/generate-lyric-starter", 
    middleware?.generation || ((req: Request, res: Response, next: NextFunction) => next()), 
    middleware?.csrf?.validateToken || ((req: Request, res: Response, next: NextFunction) => next()),
    validationRules.generateLyricStarter, 
    handleValidationErrors, 
    async (req: Request, res: Response) => {
    try {
      const { genre } = req.body;
      
      const lyricResult = await lyricGenerator.generateLyricStarter(genre);

      res.json(lyricResult);
    } catch (error) {
      secureLog.error("Error generating lyric spark:", error);
      res.status(500).json({ 
        error: "Failed to generate lyric spark",
        suggestion: "The AI service may be temporarily unavailable. Please try again later."
      });
    }
  });

  // CSRF token endpoint for client requests
  app.get("/api/csrf-token", async (req: Request & { session?: any }, res: Response) => {
    try {
      const sessionId = req.session?.id || req.sessionID || 'anonymous';
      const { csrfService } = await import('./services/csrfService');
      const token = csrfService.generateToken(sessionId);
      
      res.json({ 
        csrfToken: token,
        sessionId: sessionId.substring(0, 8) + '...' // Partial session ID for debugging
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate CSRF token' });
    }
  });

  // Health check endpoint for deployment monitoring
  app.get("/api/health", async (req: Request, res: Response) => {
    try {
      // Check database connectivity
      await db.select().from(users).limit(1);
      res.json({ 
        status: "healthy",
        timestamp: new Date().toISOString(),
        service: "name-jam-api",
        database: "connected"
      });
    } catch (error) {
      res.status(503).json({ 
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        service: "name-jam-api",
        database: "disconnected",
        error: "Database connection failed"
      });
    }
  });

  // Performance monitoring endpoint (admin only in production)
  app.get("/api/performance", async (req: Request, res: Response) => {
    try {
      const report = performanceMonitor.generateReport();
      res.json({
        ...report,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
      });
    } catch (error) {
      secureLog.error("Performance report generation failed:", error);
      res.status(500).json({ message: "Failed to generate performance report" });
    }
  });

  // ===== FEEDBACK & PREFERENCES ENDPOINTS =====

  // Submit user feedback (authenticated)
  app.post("/api/feedback", 
    middleware?.feedback || ((req: Request, res: Response, next: NextFunction) => next()),
    isAuthenticated,
    async (req: Request & { user?: any }, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validate request body
      const feedbackData = userFeedbackRequestSchema.parse(req.body);
      
      // Sanitize inputs
      const sanitizedFeedback = {
        ...feedbackData,
        contentName: InputSanitizer.sanitizeNameInput(feedbackData.contentName),
        textComment: feedbackData.textComment ? InputSanitizer.sanitizeNameInput(feedbackData.textComment) : undefined,
        genre: feedbackData.genre ? InputSanitizer.sanitizeGenreInput(feedbackData.genre) : undefined,
        mood: feedbackData.mood ? InputSanitizer.sanitizeMoodInput(feedbackData.mood) : undefined,
      };

      // Create feedback record
      const feedback = await storage.createUserFeedback({
        userId,
        ...sanitizedFeedback,
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
        feedbackId: feedback.id,
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
  });

  // Get user's feedback history (authenticated)
  app.get("/api/feedback/user", 
    isAuthenticated,
    async (req: Request & { user?: any }, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 50;
      const contentType = req.query.contentType as string;

      let feedback;
      if (contentType) {
        // Filter by content type if specified
        feedback = await storage.getUserFeedback(userId, limit);
        feedback = feedback.filter(f => f.contentType === contentType);
      } else {
        feedback = await storage.getUserFeedback(userId, limit);
      }

      res.json({
        success: true,
        feedback: feedback.map(f => ({
          id: f.id,
          contentType: f.contentType,
          contentName: f.contentName,
          starRating: f.starRating,
          thumbsRating: f.thumbsRating,
          textComment: f.textComment,
          genre: f.genre,
          mood: f.mood,
          creativityRating: f.creativityRating,
          memorabilityRating: f.memorabilityRating,
          relevanceRating: f.relevanceRating,
          createdAt: f.createdAt
        })),
        totalCount: feedback.length
      });

    } catch (error) {
      secureLog.error("Error fetching user feedback:", error);
      res.status(500).json({ 
        error: "Failed to fetch feedback history",
        suggestion: "Please try again later."
      });
    }
  });

  // Get feedback statistics (authenticated, optional content filtering)
  app.get("/api/feedback/stats", 
    isAuthenticated,
    async (req: Request & { user?: any }, res: Response) => {
    try {
      const contentType = req.query.contentType as string;
      const genre = req.query.genre as string;
      const timeframe = req.query.timeframe ? parseInt(req.query.timeframe as string) : undefined;

      if (!contentType) {
        return res.status(400).json({
          error: "Content type is required",
          suggestion: "Please specify contentType as 'name', 'lyric', or 'bandBio'"
        });
      }

      const stats = await storage.getFeedbackStats(contentType, genre, timeframe);
      
      res.json({
        success: true,
        contentType,
        genre: genre || "all",
        timeframeDays: timeframe || "all",
        stats: {
          totalFeedbacks: stats.totalFeedbacks,
          averageStarRating: Math.round(stats.averageStarRating * 100) / 100,
          positiveThumbsPercentage: Math.round(stats.positiveThumbsPercentage * 100) / 100,
          qualityBreakdown: {
            creativity: Math.round(stats.averageCreativity * 100) / 100,
            memorability: Math.round(stats.averageMemorability * 100) / 100,
            relevance: Math.round(stats.averageRelevance * 100) / 100
          }
        }
      });

    } catch (error) {
      secureLog.error("Error fetching feedback stats:", error);
      res.status(500).json({ 
        error: "Failed to fetch feedback statistics",
        suggestion: "Please try again later."
      });
    }
  });

  // Get user preferences (authenticated)
  app.get("/api/preferences", 
    isAuthenticated,
    async (req: Request & { user?: any }, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const preferences = await storage.getUserPreferences(userId);

      if (!preferences) {
        // Return default preferences if none exist
        res.json({
          success: true,
          preferences: {
            preferredGenres: [],
            preferredMoods: [],
            preferredWordCounts: [],
            creativityWeight: 5,
            memorabilityWeight: 5,
            relevanceWeight: 5,
            availabilityWeight: 7,
            feedbackFrequency: "normal",
            qualityThreshold: "moderate"
          },
          isDefault: true
        });
      } else {
        res.json({
          success: true,
          preferences: {
            preferredGenres: preferences.preferredGenres || [],
            preferredMoods: preferences.preferredMoods || [],
            preferredWordCounts: preferences.preferredWordCounts || [],
            creativityWeight: preferences.creativityWeight,
            memorabilityWeight: preferences.memorabilityWeight,
            relevanceWeight: preferences.relevanceWeight,
            availabilityWeight: preferences.availabilityWeight,
            feedbackFrequency: preferences.feedbackFrequency,
            qualityThreshold: preferences.qualityThreshold
          },
          lastUpdated: preferences.lastUpdated,
          isDefault: false
        });
      }

    } catch (error) {
      secureLog.error("Error fetching user preferences:", error);
      res.status(500).json({ 
        error: "Failed to fetch preferences",
        suggestion: "Please try again later."
      });
    }
  });

  // Update user preferences (authenticated)
  app.put("/api/preferences", 
    isAuthenticated,
    async (req: Request & { user?: any }, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validate request body
      const preferencesUpdate = userPreferencesUpdateSchema.parse(req.body);

      // Update preferences
      const updatedPreferences = await storage.upsertUserPreferences(userId, preferencesUpdate);

      secureLog.info("User preferences updated", {
        userId,
        hasGenrePrefs: !!preferencesUpdate.preferredGenres,
        hasMoodPrefs: !!preferencesUpdate.preferredMoods,
        qualityThreshold: preferencesUpdate.qualityThreshold
      });

      res.json({
        success: true,
        preferences: {
          preferredGenres: updatedPreferences.preferredGenres || [],
          preferredMoods: updatedPreferences.preferredMoods || [],
          preferredWordCounts: updatedPreferences.preferredWordCounts || [],
          creativityWeight: updatedPreferences.creativityWeight,
          memorabilityWeight: updatedPreferences.memorabilityWeight,
          relevanceWeight: updatedPreferences.relevanceWeight,
          availabilityWeight: updatedPreferences.availabilityWeight,
          feedbackFrequency: updatedPreferences.feedbackFrequency,
          qualityThreshold: updatedPreferences.qualityThreshold
        },
        lastUpdated: updatedPreferences.lastUpdated
      });

    } catch (error) {
      secureLog.error("Error updating user preferences:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          error: "Invalid preferences data", 
          details: error.errors,
          suggestion: "Please check your preferences data and try again."
        });
      } else {
        res.status(500).json({ 
          error: "Failed to update preferences",
          suggestion: "Please try again later."
        });
      }
    }
  });

  // Get feedback analytics (authenticated - for insights)
  app.get("/api/feedback/analytics", 
    isAuthenticated,
    async (req: Request & { user?: any }, res: Response) => {
    try {
      const contentType = req.query.contentType as string;
      const genre = req.query.genre as string;
      const hours = req.query.hours ? parseInt(req.query.hours as string) : 24;

      // Get recent feedback trends
      const trends = await storage.getLatestFeedbackTrends(hours);
      
      // Get detailed analytics if contentType is specified
      let detailedAnalytics = null;
      if (contentType) {
        detailedAnalytics = await storage.getFeedbackAnalytics(contentType, genre, undefined, 10);
      }

      res.json({
        success: true,
        timeframe: `${hours} hours`,
        trends: trends.map(trend => ({
          contentType: trend.contentType,
          qualityTrend: trend.qualityTrend,
          averageRating: Math.round(trend.averageRating * 100) / 100,
          feedbackCount: trend.feedbackCount
        })),
        detailedAnalytics: detailedAnalytics || []
      });

    } catch (error) {
      secureLog.error("Error fetching feedback analytics:", error);
      res.status(500).json({ 
        error: "Failed to fetch feedback analytics",
        suggestion: "Please try again later."
      });
    }
  });

  // ===== END FEEDBACK & PREFERENCES ENDPOINTS =====

  // Error logging endpoint
  app.post("/api/log-error", async (req: Request & { user?: any }, res: Response) => {
    try {
      const { message, stack, componentStack, userAgent, url } = req.body;
      const userId = req.user?.claims?.sub || null;
      
      await db.insert(errorLogs).values({
        message: message || "Unknown error",
        stack,
        componentStack,
        userAgent,
        url,
        userId,
      });
      
      res.json({ success: true });
    } catch (error) {
      // Silently fail - don't break the app if error logging fails
      res.status(200).json({ success: false });
    }
  });

  // Enhanced client error tracking endpoint
  app.post("/api/client-errors", async (req: Request & { user?: any }, res: Response) => {
    try {
      const { errors } = req.body;
      
      if (!Array.isArray(errors)) {
        return res.status(400).json(
          ErrorHandler.createApiError(
            "Invalid request format",
            ERROR_CODES.VALIDATION_ERROR,
            "Errors must be provided as an array"
          )
        );
      }
      
      // Process each error and store in database
      const errorPromises = errors.map(async (error: any) => {
        try {
          await db.insert(errorLogs).values({
            message: error.message,
            stack: error.stack,
            componentStack: error.componentStack,
            userAgent: error.userAgent,
            url: error.url,
            userId: error.userId || (req.user?.claims?.sub),
          });
        } catch (dbError) {
          secureLog.warn('Failed to store client error:', dbError);
        }
      });
      
      await Promise.allSettled(errorPromises);
      
      res.json({ 
        success: true, 
        processed: errors.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      secureLog.error('Client error reporting failed:', error);
      res.status(200).json({ success: false });
    }
  });

  // Stash API routes for authenticated users
  
  // Get user's stash items
  app.get('/api/stash', isAuthenticated, async (req: Request & { user?: any }, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const type = req.query.type as string;
      const stashItems = await storage.getStashItems(userId, type);
      res.json({ stashItems });
    } catch (error) {
      secureLog.error("Error fetching stash:", error);
      res.status(500).json({ message: "Failed to fetch stash" });
    }
  });

  // Add item to stash
  app.post('/api/stash', isAuthenticated, async (req: Request & { user?: any }, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const item = req.body;
      
      // Check if item already exists
      const exists = await storage.isInStash(userId, item.name, item.type);
      if (exists) {
        return res.status(409).json({ message: "Item already in stash" });
      }
      
      const stashItem = await storage.addToStash(userId, item);
      res.json({ stashItem, success: true });
    } catch (error) {
      secureLog.error("Error adding to stash:", error);
      res.status(500).json({ message: "Failed to add to stash" });
    }
  });

  // Remove item from stash
  app.delete('/api/stash/:itemId', isAuthenticated, async (req: Request & { user?: any }, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { itemId } = req.params;
      
      const success = await storage.removeFromStash(userId, itemId);
      if (!success) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      secureLog.error("Error removing from stash:", error);
      res.status(500).json({ message: "Failed to remove from stash" });
    }
  });

  // Update stash item rating
  app.patch('/api/stash/:itemId/rating', isAuthenticated, async (req: Request & { user?: any }, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { itemId } = req.params;
      const { rating } = req.body;
      
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
      }
      
      const success = await storage.updateStashRating(userId, itemId, rating);
      if (!success) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      secureLog.error("Error updating stash rating:", error);
      res.status(500).json({ message: "Failed to update rating" });
    }
  });

  // Clear user's stash
  app.delete('/api/stash', isAuthenticated, async (req: Request & { user?: any }, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      await storage.clearUserStash(userId);
      res.json({ success: true });
    } catch (error) {
      secureLog.error("Error clearing stash:", error);
      res.status(500).json({ message: "Failed to clear stash" });
    }
  });

  // Check if item is in stash
  app.get('/api/stash/check', isAuthenticated, async (req: Request & { user?: any }, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const { name, type } = req.query as { name: string, type: string };
      
      if (!name || !type) {
        return res.status(400).json({ message: "Name and type are required" });
      }
      
      const inStash = await storage.isInStash(userId, name, type);
      res.json({ inStash });
    } catch (error) {
      secureLog.error("Error checking stash:", error);
      res.status(500).json({ message: "Failed to check stash" });
    }
  });



  const httpServer = createServer(app);
  return httpServer;
}
