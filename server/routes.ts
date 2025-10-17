import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { UnifiedNameGeneratorService, GENERATION_STRATEGIES } from "./services/unifiedNameGenerator";
import { NameVerifierService } from "./services/nameVerifier";
import { BandBioGenerator } from "./services/bandBio/bandBioGenerator";
import { lyricOrchestrator } from "./services/lyric/lyricOrchestrator";
import { qualityScoring } from "./services/qualityScoring";
import { QualityRankingSystem } from "./services/qualityScoring/qualityRankingSystem";
import { db } from "./db";
import { users, errorLogs, userFeedback, userPreferences, feedbackAnalytics } from "@shared/schema";

import { 
  generateNameRequestSchema, 
  userFeedbackRequestSchema, 
  userPreferencesUpdateSchema 
} from "@shared/schema";
import { z } from "zod";
import { ErrorHandler, ERROR_CODES, apiErrorSchema } from "@shared/errorSchemas";

import { validationRules, handleValidationErrors } from "./security";
import { performanceCache } from "./services/performanceCache";
import { performanceMonitor } from "./services/performanceMonitor";
import { optimizedContextService } from "./services/optimizedContextService";
import { secureLog, sanitizeApiResponse } from "./utils/secureLogger";
import { NameGenerationHandler } from "./api/handlers/NameGenerationHandler";
import { VerificationHandler } from "./api/handlers/VerificationHandler";
import { UserHandler } from "./api/handlers/UserHandler";
import { FeedbackHandler } from "./api/handlers/FeedbackHandler";
import { BandBioHandler } from "./api/handlers/BandBioHandler";
import { LyricHandler } from "./api/handlers/LyricHandler";
import { StashHandler } from "./api/handlers/StashHandler";
import { ErrorLoggingHandler } from "./api/handlers/ErrorLoggingHandler";
import { requestDeduplicationMiddleware } from "./api/middleware/requestDeduplication";
import { initializeContainer, getService } from "./di/container";
import type { Request, Response, NextFunction } from "express";
import { InputSanitizer } from "./utils/inputSanitizer";

import { cacheHeaders } from "./middleware/cacheHeaders";
import { 
  compressionMiddleware, 
  timeoutMiddleware, 
  responseTimeMiddleware 
} from "./middleware/performanceOptimization";

// Helper functions for intelligent ranking and adaptive strategy selection
function determineAdaptiveStrategy(request: any, userPreferences: any, contextCacheHit: boolean): string {
  // Adaptive strategy selection based on performance factors
  const sessionId = request.sessionId || 'anonymous';
  const recentRequests = getRecentRequestCount(sessionId);
  
  // Speed mode after 5+ generations in same session
  if (recentRequests >= 5) {
    return 'SPEED';
  }
  
  // Quality mode if context is cached (fast context gathering)
  if (contextCacheHit) {
    return 'QUALITY';
  }
  
  // Balanced mode for first-time requests or cache misses
  return 'BALANCED';
}

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

// Track recent requests per session for adaptive strategy
const sessionRequestCounts = new Map<string, { count: number; lastRequest: number }>();

function getRecentRequestCount(sessionId: string): number {
  const now = Date.now();
  const sessionData = sessionRequestCounts.get(sessionId);
  
  // Reset count if more than 10 minutes since last request
  if (!sessionData || (now - sessionData.lastRequest) > 10 * 60 * 1000) {
    sessionRequestCounts.set(sessionId, { count: 0, lastRequest: now });
    return 0;
  }
  
  return sessionData.count;
}

function incrementRequestCount(sessionId: string): void {
  const now = Date.now();
  const sessionData = sessionRequestCounts.get(sessionId) || { count: 0, lastRequest: now };
  sessionData.count++;
  sessionData.lastRequest = now;
  sessionRequestCounts.set(sessionId, sessionData);
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
  app.use(cacheHeaders);
  
  // Auth middleware
  await setupAuth(app);

  secureLog.info("Initializing services...");
  
  let nameGenerator: UnifiedNameGeneratorService;
  let nameVerifier: NameVerifierService;
  let bandBioGenerator: BandBioGenerator;
  let qualityRankingSystem: QualityRankingSystem;

  try {
    nameGenerator = new UnifiedNameGeneratorService();
    secureLog.info("✓ NameGeneratorService initialized");
  } catch (error) {
    secureLog.error("✗ Failed to initialize NameGeneratorService:", error);
    throw error;
  }

  try {
    nameVerifier = new NameVerifierService();
    secureLog.info("✓ NameVerifierService initialized");
  } catch (error) {
    secureLog.error("✗ Failed to initialize NameVerifierService:", error);
    throw error;
  }

  try {
    bandBioGenerator = new BandBioGenerator();
    secureLog.info("✓ BandBioGenerator initialized");
  } catch (error) {
    secureLog.error("✗ Failed to initialize BandBioGenerator:", error);
    throw error;
  }

  try {
    qualityRankingSystem = new QualityRankingSystem();
    secureLog.info("✓ QualityRankingSystem initialized");
  } catch (error) {
    secureLog.error("✗ Failed to initialize QualityRankingSystem:", error);
    throw error;
  }

  // lyricOrchestrator is already initialized as a singleton

  // Auth routes (with rate limiting)
  app.get('/api/auth/user', 
    middleware?.auth || ((req: Request, res: Response, next: NextFunction) => next()), 
    isAuthenticated, 
    async (req: Request & { user?: any }, res: Response) => {
    await userHandler.handleGetUser(req, res);
  });

  // Initialize dependency injection container
  initializeContainer();
  
  // Get handlers from DI container
  const nameGenerationHandler = getService<NameGenerationHandler>('nameGenerationHandler');
  const verificationHandler = new VerificationHandler();
  const userHandler = new UserHandler();
  const feedbackHandler = new FeedbackHandler();
  const bandBioHandler = new BandBioHandler();
  const lyricHandler = new LyricHandler();
  const stashHandler = new StashHandler();
  const errorLoggingHandler = new ErrorLoggingHandler();

  // Generate names endpoint (public with optional auth for saving)
  app.post("/api/generate-names", 
    requestDeduplicationMiddleware,
    middleware?.generation || ((req: Request, res: Response, next: NextFunction) => next()), 
    middleware?.csrf?.validateToken || ((req: Request, res: Response, next: NextFunction) => next()),
    validationRules.generateNames, 
    handleValidationErrors, 
    async (req: Request & { user?: any; isAuthenticated?: () => boolean }, res: Response) => {
      await nameGenerationHandler.handleGenerateNames(req, res);
    });


  // Get recent generated names (protected)
  app.get("/api/recent-names", isAuthenticated, async (req: Request & { user?: any }, res: Response) => {
    await userHandler.handleGetRecentNames(req, res);
  });

  // Verify specific name (with validation)
  app.post("/api/verify-name", 
    validationRules.verifyName, 
    handleValidationErrors, 
    async (req: Request, res: Response) => {
    await verificationHandler.handleVerifyName(req, res);
  });

  // Generate band bio endpoint (public with rate limiting and validation)
  app.post("/api/generate-band-bio", 
    middleware?.generation || ((req: Request, res: Response, next: NextFunction) => next()), 
    middleware?.csrf?.validateToken || ((req: Request, res: Response, next: NextFunction) => next()),
    validationRules.generateBandBio, 
    handleValidationErrors, 
    async (req: Request & { user?: any; isAuthenticated?: () => boolean }, res: Response) => {
    await bandBioHandler.handleGenerateBandBio(req, res);
  });

  // Generate lyric starter endpoint (public with optional auth for saving)  
  app.post("/api/generate-lyric-starter", 
    middleware?.generation || ((req: Request, res: Response, next: NextFunction) => next()), 
    middleware?.csrf?.validateToken || ((req: Request, res: Response, next: NextFunction) => next()),
    validationRules.generateLyricStarter, 
    handleValidationErrors, 
    async (req: Request, res: Response) => {
    await lyricHandler.handleGenerateLyricStarter(req, res);
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
    await errorLoggingHandler.handleLogError(req, res);
  });

  // Enhanced client error tracking endpoint
  app.post("/api/client-errors", async (req: Request & { user?: any }, res: Response) => {
    await errorLoggingHandler.handleClientErrors(req, res);
  });

  // Stash API routes for authenticated users
  
  // Get user's stash items
  app.get('/api/stash', isAuthenticated, async (req: Request & { user?: any }, res: Response) => {
    await stashHandler.handleGetStash(req, res);
  });

  // Add item to stash
  app.post('/api/stash', isAuthenticated, async (req: Request & { user?: any }, res: Response) => {
    await stashHandler.handleAddToStash(req, res);
  });

  // Remove item from stash
  app.delete('/api/stash/:itemId', isAuthenticated, async (req: Request & { user?: any }, res: Response) => {
    await stashHandler.handleRemoveFromStash(req, res);
  });

  // Update stash item rating
  app.patch('/api/stash/:itemId/rating', isAuthenticated, async (req: Request & { user?: any }, res: Response) => {
    await stashHandler.handleUpdateStashRating(req, res);
  });

  // Clear user's stash
  app.delete('/api/stash', isAuthenticated, async (req: Request & { user?: any }, res: Response) => {
    await stashHandler.handleClearStash(req, res);
  });

  // Check if item is in stash
  app.get('/api/stash/check', isAuthenticated, async (req: Request & { user?: any }, res: Response) => {
    await stashHandler.handleCheckStash(req, res);
  });

  // Test endpoint for phonetic analysis caching (for testing/monitoring)
  app.get('/api/test/phonetic-cache', async (req: Request, res: Response) => {
    try {
      const { phoneticFlowAnalyzer } = await import('./services/nameGeneration/phoneticFlowAnalyzer');
      
      // Test cache functionality
      const testName = req.query.name as string || 'electric storm';
      
      // First analysis (may be cache miss)
      const start1 = Date.now();
      const result1 = phoneticFlowAnalyzer.analyzePhoneticFlow(testName);
      const time1 = Date.now() - start1;
      
      // Second analysis (should be cache hit)
      const start2 = Date.now();
      const result2 = phoneticFlowAnalyzer.analyzePhoneticFlow(testName);
      const time2 = Date.now() - start2;
      
      // Get cache statistics
      const stats = phoneticFlowAnalyzer.getCacheStats();
      
      res.json({
        success: true,
        testName,
        analysisResult: result1,
        performance: {
          firstAnalysis: `${time1}ms`,
          secondAnalysis: `${time2}ms`,
          improvement: time1 > time2 ? `${((time1 - time2) / time1 * 100).toFixed(1)}%` : 'N/A'
        },
        cacheStats: stats
      });
    } catch (error) {
      secureLog.error("Error in phonetic cache test:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to test phonetic cache",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
