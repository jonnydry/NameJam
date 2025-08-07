import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { enhancedNameGenerator } from "./services/enhancedNameGenerator";
import { NameGeneratorService } from "./services/nameGenerator";
import { NameVerifierService } from "./services/nameVerifier";
import { BandBioGeneratorService } from "./services/bandBioGenerator";
import { LyricStarterService } from "./services/lyricStarterService";
import { db } from "./db";
import { users, errorLogs } from "@shared/schema";

import { generateNameRequestSchema } from "@shared/schema";
import { z } from "zod";

import { validationRules, handleValidationErrors } from "./security";
import { performanceCache } from "./services/performanceCache";
import { secureLog, sanitizeApiResponse } from "./utils/secureLogger";
import type { Request, Response, NextFunction } from "express";
import { InputSanitizer } from "./utils/inputSanitizer";

import { cacheHeaders } from "./middleware/cacheHeaders";
import { 
  compressionMiddleware, 
  timeoutMiddleware, 
  responseTimeMiddleware 
} from "./middleware/performanceOptimization";

export async function registerRoutes(app: Express, rateLimiters?: any): Promise<Server> {
  // Add performance optimization middleware
  app.use(compressionMiddleware);
  app.use(responseTimeMiddleware);
  app.use(timeoutMiddleware(50000)); // 50 second timeout for complex generations
  app.use(cacheHeaders);
  
  // Auth middleware
  await setupAuth(app);

  secureLog.info("Initializing services...");
  
  let nameGenerator: NameGeneratorService;
  let nameVerifier: NameVerifierService;
  let bandBioGenerator: BandBioGeneratorService;
  let lyricStarterService: LyricStarterService;

  try {
    nameGenerator = new NameGeneratorService();
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
    bandBioGenerator = new BandBioGeneratorService();
    secureLog.info("✓ BandBioGeneratorService initialized");
  } catch (error) {
    secureLog.error("✗ Failed to initialize BandBioGeneratorService:", error);
    throw error;
  }

  try {
    lyricStarterService = new LyricStarterService();
    secureLog.info("✓ LyricStarterService initialized");
  } catch (error) {
    secureLog.error("✗ Failed to initialize LyricStarterService:", error);
    throw error;
  }

  // Auth routes (with rate limiting)
  app.get('/api/auth/user', 
    rateLimiters?.auth || ((req: Request, res: Response, next: NextFunction) => next()), 
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
    rateLimiters?.generation || ((req: Request, res: Response, next: NextFunction) => next()), 
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
      
      // Generate names using new routing system (AI + Datamuse)
      const names = await nameGenerator.generateNames(request);
      
      // Check if response was already sent (due to timeout)
      if (hasResponded || res.headersSent) {
        secureLog.debug('Response already sent, skipping verification');
        return;
      }
      
      // Optimized parallel verification and storage
      const isUserAuthenticated = req.isAuthenticated && req.isAuthenticated();
      
      // Batch verification for better performance - use faster approach
      const { parallelVerificationService } = await import('./services/parallelVerification');
      const namesToVerify = names.map(nameResult => ({
        name: nameResult.name,
        type: request.type as 'band' | 'song'
      }));
      
      // Verify all names in parallel with caching (reduced timeout for faster response)
      const verificationResults = await parallelVerificationService.verifyNamesInParallel(namesToVerify);
      
      // Check again before processing results
      if (hasResponded || res.headersSent) {
        return;
      }
      
      // Process results and handle database storage
      const results = await Promise.all(
        names.map(async (nameResult, index) => {
          const verification = verificationResults[index];
          let storedName = null;
          
          // Only store in database if user is authenticated (non-blocking)
          if (isUserAuthenticated && !hasResponded && !res.headersSent) {
            const userId = req.user.claims.sub;
            
            try {
              // Make database storage non-blocking to speed up response
              const dbWordCount = typeof request.wordCount === 'string' && request.wordCount === '4+' 
                ? 4 
                : (typeof request.wordCount === 'number' ? request.wordCount : nameResult.name.split(/\s+/).length);
              
              storage.createGeneratedName({
                name: nameResult.name,
                type: request.type,
                wordCount: dbWordCount, // Ensure integer for database storage
                verificationStatus: verification.status,
                verificationDetails: verification.details || null,
                isAiGenerated: nameResult.isAiGenerated,
                userId: userId,
              }).catch(error => {
                secureLog.error("Database storage error (non-blocking):", error);
              });
            } catch (error) {
              secureLog.error("Database storage error:", error);
            }
          }

          return {
            id: null, // Skip ID for faster response since storage is async
            name: nameResult.name,
            type: request.type,
            wordCount: nameResult.name.split(/\s+/).length, // Use actual word count instead of requested
            isAiGenerated: nameResult.isAiGenerated,
            verification
          };
        })
      );

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
      const cached = performanceCache.getCachedVerification(sanitizedName, type);
      if (cached) {
        secureLog.debug(`Cache hit for ${type}: ${sanitizedName}`);
        return res.json({ verification: cached });
      }

      // If not cached, verify normally
      const verification = await nameVerifier.verifyName(sanitizedName, type);
      
      // Store in cache
      performanceCache.setCachedVerification(sanitizedName, type, verification);
      
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
    rateLimiters?.generation || ((req: Request, res: Response, next: NextFunction) => next()), 
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
    rateLimiters?.generation || ((req: Request, res: Response, next: NextFunction) => next()), 
    validationRules.generateLyricStarter, 
    handleValidationErrors, 
    async (req: Request, res: Response) => {
    try {
      const { genre } = req.body;
      
      const lyricResult = await lyricStarterService.generateLyricStarter(genre);
      
      res.json({ 
        id: Date.now(), // Simple ID generation
        lyric: lyricResult.lyric,
        genre: genre || null,
        songSection: lyricResult.songSection,
        model: lyricResult.model,
        generatedAt: new Date().toISOString()
      });
    } catch (error) {
      secureLog.error("Error generating lyric spark:", error);
      res.status(500).json({ 
        error: "Failed to generate lyric spark",
        suggestion: "The AI service may be temporarily unavailable. Please try again later."
      });
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

  // Enhanced Datamuse-powered name generation test endpoint
  app.post("/api/test-enhanced-generation", async (req: Request, res: Response) => {
    try {
      const { type = 'band', wordCount = 2, mood, genre, count = 3 } = req.body;
      
      secureLog.debug(`🧪 Testing enhanced generation: ${count} ${type} names with ${wordCount} words`);
      
      const request = {
        type,
        wordCount: parseInt(wordCount),
        count: parseInt(count),
        mood,
        genre
      };

      // Generate using enhanced Datamuse-powered method
      const enhancedResults = await enhancedNameGenerator.generateEnhancedNames(request);

      res.json({
        request: request,
        results: enhancedResults,
        method: "Datamuse API with contextual word relationships",
        info: "All non-AI results now use real linguistic data from Datamuse API"
      });
    } catch (error) {
      secureLog.error("Error in enhanced generation test:", error);
      res.status(500).json({ 
        error: "Enhanced generation test failed",
        details: error instanceof Error ? error.message : "Unknown error",
        fallback: "Traditional generation is still available"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
