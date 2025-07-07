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

  // Generate set list
  app.post("/api/generate-setlist", async (req, res) => {
    try {
      const validation = setListRequest.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid request body", details: validation.error.errors });
      }

      const { songCount, wordCount, mood, genre } = validation.data;
      const totalSongs = parseInt(songCount);
      
      // Calculate set distribution
      const setOneSize = totalSongs === 8 ? 3 : 7;
      const setTwoSize = totalSongs === 8 ? 4 : 8;
      
      // Generate all songs (sets + finale)
      const allSongsNeeded = totalSongs + 1; // +1 for finale
      const songRequest = {
        type: 'song' as const,
        count: allSongsNeeded,
        wordCount,
        mood: mood as any, // Cast to avoid enum typing issues
        genre: genre as any, // Cast to avoid enum typing issues
        includeAiReimaginings: true
      };
      
      const generatedNames = await nameGenerator.generateNames(songRequest);
      const namesArray = Array.isArray(generatedNames) ? generatedNames : generatedNames.names;
      
      // Create song objects with verification
      const songs = await Promise.all(
        namesArray.map(async (name: string, index: number) => {
          const verification = await nameVerifier.verifyName(name, 'song');
          return {
            id: index + 1,
            name,
            verification
          };
        })
      );
      
      // Split into sets
      const setOne = songs.slice(0, setOneSize);
      const setTwo = songs.slice(setOneSize, setOneSize + setTwoSize);
      const finale = songs[songs.length - 1];
      
      const response = {
        setOne,
        setTwo,
        finale,
        totalSongs: songs.length - 1 // Don't count finale in total
      };
      
      res.json(response);
    } catch (error) {
      console.error("Error generating set list:", error);
      res.status(500).json({ error: "Failed to generate set list" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
