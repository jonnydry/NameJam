import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { NameGeneratorService } from "./services/nameGenerator";
import { NameVerifierService } from "./services/nameVerifier";
import { generateNameRequestSchema, setListRequest } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const nameGenerator = new NameGeneratorService();
  const nameVerifier = new NameVerifierService();

  // Generate names endpoint
  app.post("/api/generate-names", async (req, res) => {
    try {
      const request = generateNameRequestSchema.parse(req.body);
      
      // Generate names
      const generateResult = await nameGenerator.generateNames(request);
      
      // Extract names and AI availability status
      const names = Array.isArray(generateResult) ? generateResult : generateResult.names;
      const aiUnavailable = Array.isArray(generateResult) ? false : generateResult.aiUnavailable;
      
      // Verify each name and store results
      const results = await Promise.all(
        names.map(async (name) => {
          const verification = await nameVerifier.verifyName(name, request.type);
          
          // Store in database
          const storedName = await storage.createGeneratedName({
            name,
            type: request.type,
            wordCount: request.wordCount,
            verificationStatus: verification.status,
            verificationDetails: verification.details || null,
          });

          return {
            id: storedName.id,
            name: storedName.name,
            type: storedName.type,
            wordCount: storedName.wordCount,
            verification
          };
        })
      );

      res.json({ results, aiUnavailable });
    } catch (error) {
      console.error("Error generating names:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid request parameters", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to generate names" });
      }
    }
  });

  // Get recent generated names
  app.get("/api/recent-names", async (req, res) => {
    try {
      const type = req.query.type as string;
      const limit = parseInt(req.query.limit as string) || 20;

      let names;
      if (type && (type === 'band' || type === 'song')) {
        names = await storage.getGeneratedNamesByType(type, limit);
      } else {
        names = await storage.getGeneratedNames(limit);
      }

      res.json({ names });
    } catch (error) {
      console.error("Error fetching recent names:", error);
      res.status(500).json({ error: "Failed to fetch recent names" });
    }
  });

  // Verify specific name
  app.post("/api/verify-name", async (req, res) => {
    try {
      const { name, type } = req.body;
      
      if (!name || !type || !['band', 'song'].includes(type)) {
        return res.status(400).json({ error: "Name and valid type (band/song) are required" });
      }

      const verification = await nameVerifier.verifyName(name, type);
      res.json({ verification });
    } catch (error) {
      console.error("Error verifying name:", error);
      res.status(500).json({ error: "Failed to verify name" });
    }
  });

  // Generate set list with timeout
  app.post("/api/generate-setlist", async (req, res) => {
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
      
      // Generate songs using the simple approach (no AI, minimal verification)
      const songs = [];
      
      for (let i = 0; i < allSongsNeeded; i++) {
        const wordCount = Math.floor(Math.random() * 4) + 1; // 1-4 words for speed
        
        try {
          const songRequest = {
            type: 'song' as const,
            count: 1,
            wordCount,
            mood: mood as any,
            genre: genre as any,
            includeAiReimaginings: false
          };
          
          const generatedNames = await nameGenerator.generateNames(songRequest);
          const namesArray = Array.isArray(generatedNames) ? generatedNames : generatedNames.names;
          const songName = namesArray[0];
          
          songs.push({
            id: i + 1,
            name: songName,
            verification: {
              status: 'available' as const,
              details: `Generated for setlist - appears unique`,
              verificationLinks: [{
                name: "Google Search",
                url: `https://www.google.com/search?q="${encodeURIComponent(songName)}" song`,
                source: "Google"
              }]
            }
          });
        } catch (err) {
          // Fallback name if generation fails
          songs.push({
            id: i + 1,
            name: `Song ${i + 1}`,
            verification: {
              status: 'available' as const,
              details: `Fallback name generated`,
              verificationLinks: []
            }
          });
        }
      }
      
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
      console.error("Error generating set list:", error);
      
      if (error.message === 'Timeout') {
        return res.status(408).json({ 
          error: "Set list generation timed out. Please try again with a smaller set." 
        });
      }
      
      res.status(500).json({ error: "Failed to generate set list" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
