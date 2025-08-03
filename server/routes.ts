import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { enhancedNameGenerator } from "./services/enhancedNameGenerator";
import { NameGeneratorService } from "./services/nameGenerator";
import { NameVerifierService } from "./services/nameVerifier";
import { BandBioGeneratorService } from "./services/bandBioGenerator";
import { AINameGeneratorService } from "./services/aiNameGenerator";
import { OptimizedAINameGeneratorService } from "./services/optimizedAINameGenerator";
import { LyricStarterService } from "./services/lyricStarterService";
import { db } from "./db";
import { users, errorLogs } from "@shared/schema";

import { generateNameRequestSchema } from "@shared/schema";
import { z } from "zod";

// Define setListRequest schema
const setListRequest = z.object({
  songCount: z.string(),
  mood: z.string().optional(),
  genre: z.string().optional()
});

import { validationRules, handleValidationErrors } from "./security";
import { performanceCache } from "./services/performanceCache";
import { secureLog, sanitizeApiResponse } from "./utils/secureLogger";
import type { Request, Response, NextFunction } from "express";

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
  let aiNameGenerator: AINameGeneratorService;
  let lyricStarterService: LyricStarterService;

  try {
    // Use optimized AI generator for better performance
    aiNameGenerator = new OptimizedAINameGeneratorService();
    secureLog.info("✓ OptimizedAINameGeneratorService initialized");
  } catch (error) {
    secureLog.error("✗ Failed to initialize OptimizedAINameGeneratorService:", error);
    throw error;
  }

  try {
    nameGenerator = new NameGeneratorService();
    nameGenerator.setAINameGenerator(aiNameGenerator);
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
      const request = generateNameRequestSchema.parse(req.body);
      
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
              storage.createGeneratedName({
                name: nameResult.name,
                type: request.type,
                wordCount: request.wordCount,
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
      const { name, type } = req.body;
      
      if (!name || !type || !['band', 'song'].includes(type)) {
        return res.status(400).json({ error: "Name and valid type (band/song) are required" });
      }

      // Check cache first
      const cached = performanceCache.getCachedVerification(name, type);
      if (cached) {
        secureLog.debug(`Cache hit for ${type}: ${name}`);
        return res.json({ verification: cached });
      }

      // If not cached, verify normally
      const verification = await nameVerifier.verifyName(name, type);
      
      // Store in cache
      performanceCache.setCachedVerification(name, type, verification);
      
      res.json({ verification });
    } catch (error) {
      secureLog.error("Error verifying name:", error);
      res.status(500).json({ 
        error: "Failed to verify name",
        suggestion: "The verification service may be temporarily unavailable. Please try again later." 
      });
    }
  });

  // Generate set list with timeout (public with optional auth for saving)
  app.post("/api/generate-setlist", 
    rateLimiters?.generation || ((req: Request, res: Response, next: NextFunction) => next()), 
    validationRules.generateSetlist, 
    handleValidationErrors, 
    async (req: Request & { user?: any; isAuthenticated?: () => boolean }, res: Response) => {
    const timeoutMs = 20000; // 20 second timeout
    
    const generateSetListWithTimeout = async () => {
      const validation = setListRequest.safeParse(req.body);
      if (!validation.success) {
        throw new Error("Invalid request body");
      }

      const { songCount, mood, genre } = validation.data;
      const totalSongs = parseInt(songCount);
      
      // Calculate set distribution
      const setOneSize = totalSongs === 8 ? 3 : 7;
      const setTwoSize = totalSongs === 8 ? 4 : 8;
      const allSongsNeeded = totalSongs + 1; // +1 for finale
      
      // Generate all songs at once to properly distribute AI vs traditional
      const songRequest = {
        type: 'song' as const,
        wordCount: 2, // Default word count for setlist songs
        count: allSongsNeeded,
        mood: mood && mood !== 'none' ? mood : undefined,
        genre: genre && genre !== 'none' ? genre : undefined
      };
      
      const generatedNames = await nameGenerator.generateSetlistNames(songRequest as any);
      
      // Process generated names and verify them
      const songs = await Promise.all(
        generatedNames.map(async (songNameObj, i) => {
          try {
            // Use full verification including Spotify
            const verification = await nameVerifier.verifyName(songNameObj.name, 'song');
            
            return {
              id: i + 1,
              name: songNameObj.name,
              verification,
              isAiGenerated: songNameObj.isAiGenerated || false
            };
          } catch (err) {
            // Generate a simple fallback name using basic word combination
            const fallbackWords = ['Electric', 'Midnight', 'Echo', 'Dream', 'Fire', 'Storm', 'Crystal', 'Shadow'];
            const fallbackNouns = ['Heart', 'Soul', 'Light', 'Sky', 'Rain', 'Moon', 'Star', 'Wave'];
            const randomWord = fallbackWords[Math.floor(Math.random() * fallbackWords.length)];
            const randomNoun = fallbackNouns[Math.floor(Math.random() * fallbackNouns.length)];
            
            const fallbackName = `${randomWord} ${randomNoun}`;
            // Use full verification for fallback names too
            const verification = await nameVerifier.verifyName(fallbackName, 'song');
            
            return {
              id: i + 1,
              name: fallbackName,
              verification,
              isAiGenerated: false
            };
          }
        })
      );
      
      // Split into sets
      const setOne = songs.slice(0, setOneSize);
      const setTwo = songs.slice(setOneSize, setOneSize + setTwoSize);
      const finale = songs[songs.length - 1];
      
      return {
        setOne,
        setTwo,
        finale,
        totalSongs: songs.length - 1
      };
    };
    
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), timeoutMs)
      );
      
      const response = await Promise.race([
        generateSetListWithTimeout(),
        timeoutPromise
      ]);
      
      res.json(response);
    } catch (error) {
      secureLog.error("Error generating set list:", error);
      
      if (error instanceof Error && error.message === 'Timeout') {
        return res.status(408).json({ 
          error: "Set list generation timed out. Please try again with a smaller set." 
        });
      }
      
      res.status(500).json({ error: "Failed to generate set list" });
    }
  });

  // Generate band name from setlist endpoint (public)
  app.post("/api/generate-band-from-setlist", 
    rateLimiters?.generation || ((req: Request, res: Response, next: NextFunction) => next()), 
    async (req: Request, res: Response) => {
    try {
      const { songNames, mood, genre } = req.body;
      
      if (!songNames || !Array.isArray(songNames) || songNames.length === 0) {
        return res.status(400).json({ error: "Song names are required" });
      }

      // Create a description of the setlist for the AI
      const setlistDescription = songNames.join(", ");
      const context = `Based on this setlist: ${setlistDescription}${mood ? `, with a ${mood} mood` : ''}${genre ? ` in the ${genre} genre` : ''}`;
      
      const bandNameResponse = await bandBioGenerator.generateBandBioWithDetails(
        '', // Empty band name since we're generating it
        genre,
        mood,
        {
          promptType: 'bandNameFromSetlist',
          setlistContext: context,
          songNames
        }
      );
      
      // Parse the response
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(bandNameResponse);
      } catch (error) {
        // If parsing fails, create a fallback band name
        const moods = {
          'dark': ['Shadow', 'Midnight', 'Raven', 'Void'],
          'bright': ['Sunshine', 'Crystal', 'Aurora', 'Prism'],
          'mysterious': ['Enigma', 'Mystic', 'Oracle', 'Phantom'],
          'energetic': ['Thunder', 'Volt', 'Surge', 'Blaze'],
          'melancholy': ['Echo', 'Rain', 'Mist', 'Sorrow'],
          'ethereal': ['Dream', 'Celestial', 'Aether', 'Cosmos'],
          'aggressive': ['Fury', 'Rage', 'Storm', 'Chaos'],
          'peaceful': ['Harmony', 'Zen', 'Serenity', 'Calm'],
          'nostalgic': ['Memory', 'Vintage', 'Echo', 'Yesterday'],
          'futuristic': ['Neon', 'Cyber', 'Quantum', 'Digital'],
          'romantic': ['Heart', 'Rose', 'Velvet', 'Whisper'],
          'epic': ['Titan', 'Legend', 'Saga', 'Myth']
        };
        
        const genres = {
          'rock': ['Rebels', 'Riders', 'Brigade', 'Collective'],
          'metal': ['Legion', 'Dominion', 'Forge', 'Battalion'],
          'jazz': ['Ensemble', 'Quintet', 'Syndicate', 'Society'],
          'electronic': ['Circuit', 'Matrix', 'Network', 'System'],
          'folk': ['Wanderers', 'Troubadours', 'Circle', 'Company'],
          'classical': ['Orchestra', 'Symphony', 'Chamber', 'Philharmonic'],
          'hip-hop': ['Crew', 'Squad', 'Collective', 'Movement'],
          'country': ['Band', 'Rangers', 'Riders', 'Outlaws'],
          'blues': ['Brothers', 'Revival', 'Junction', 'Crossroads'],
          'reggae': ['Sound', 'Roots', 'Movement', 'Collective'],
          'punk': ['Riot', 'Rebellion', 'Anarchy', 'Disorder'],
          'indie': ['Project', 'Experiment', 'Society', 'Collective'],
          'pop': ['Stars', 'Dreams', 'Magic', 'Sensation'],
          'alternative': ['Theory', 'Paradox', 'Syndrome', 'Effect']
        };
        
        const moodWords = mood && moods[mood as keyof typeof moods] ? moods[mood as keyof typeof moods] : ['Echo', 'Dream', 'Shadow', 'Fire'];
        const genreWords = genre && genres[genre as keyof typeof genres] ? genres[genre as keyof typeof genres] : ['Collective', 'Project', 'Band', 'Society'];
        
        const prefix = moodWords[Math.floor(Math.random() * moodWords.length)];
        const suffix = genreWords[Math.floor(Math.random() * genreWords.length)];
        
        parsedResponse = {
          bandName: `The ${prefix} ${suffix}`,
          model: 'fallback',
          source: 'fallback'
        };
      }
      
      res.json({ 
        bandName: parsedResponse.bandName || parsedResponse.bio || 'The Setlist Creators',
        model: parsedResponse.model,
        source: parsedResponse.source
      });
    } catch (error) {
      secureLog.error("Error generating band name from setlist:", error);
      res.status(500).json({ 
        error: "Failed to generate band name",
        suggestion: "The AI service may be temporarily unavailable. Please try again later."
      });
    }
  });

  // Generate AI name endpoint (protected with rate limiting and validation)
  app.post("/api/generate-ai-name", 
    rateLimiters?.generation || ((req: Request, res: Response, next: NextFunction) => next()), 
    isAuthenticated, 
    validationRules.generateNames, 
    handleValidationErrors, 
    async (req: Request & { user?: any }, res: Response) => {
    try {
      const { type, genre, mood } = req.body;
      
      if (!type || !['band', 'song'].includes(type)) {
        return res.status(400).json({ error: "Valid type (band/song) is required" });
      }

      const aiNameResponse = await aiNameGenerator.generateAIName(type, genre, mood);
      
      // Parse the response
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(aiNameResponse);
      } catch (error) {
        // If parsing fails, create a simple fallback
        const fallbackNames = type === 'band' 
          ? ['The Electric Dreams', 'Midnight Echo', 'Digital Fire', 'Crystal Storm', 'Neon Shadows']
          : ['Electric Heart', 'Midnight Rain', 'Digital Dreams', 'Crystal Light', 'Neon Nights'];
        
        parsedResponse = {
          name: fallbackNames[Math.floor(Math.random() * fallbackNames.length)],
          model: 'fallback',
          source: 'fallback',
          type: type
        };
      }
      
      // Verify the generated name
      const verification = await nameVerifier.verifyName(parsedResponse.name, type);
      
      // Store in database with user ID
      const userId = req.user.claims.sub;
      const storedName = await storage.createGeneratedName({
        name: parsedResponse.name,
        type: type,
        wordCount: parsedResponse.name.split(' ').length,
        verificationStatus: verification.status,
        verificationDetails: verification.details || null,
        isAiGenerated: true,
        userId: userId,
      });

      res.json({ 
        id: storedName.id,
        name: parsedResponse.name,
        type: type,
        wordCount: parsedResponse.name.split(' ').length,
        verification,
        model: parsedResponse.model,
        source: parsedResponse.source
      });
    } catch (error) {
      secureLog.error("Error generating AI name:", error);
      res.status(500).json({ 
        error: "Failed to generate AI name",
        suggestion: "The AI service may be temporarily unavailable. Please try again later."
      });
    }
  });

  // Generate band bio endpoint (protected with rate limiting and validation)
  app.post("/api/generate-band-bio", 
    rateLimiters?.generation || ((req: Request, res: Response, next: NextFunction) => next()), 
    isAuthenticated, 
    validationRules.generateBandBio, 
    handleValidationErrors, 
    async (req: Request & { user?: any }, res: Response) => {
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
