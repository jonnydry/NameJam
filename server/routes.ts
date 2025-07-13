import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { NameGeneratorService } from "./services/nameGenerator";
import { NameVerifierService } from "./services/nameVerifier";
import { BandBioGeneratorService } from "./services/bandBioGenerator";
import { AINameGeneratorService } from "./services/aiNameGenerator";

import { generateNameRequestSchema, setListRequest } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  console.log("Initializing services...");
  
  let nameGenerator: NameGeneratorService;
  let nameVerifier: NameVerifierService;
  let bandBioGenerator: BandBioGeneratorService;
  let aiNameGenerator: AINameGeneratorService;

  try {
    aiNameGenerator = new AINameGeneratorService();
    console.log("✓ AINameGeneratorService initialized");
  } catch (error) {
    console.error("✗ Failed to initialize AINameGeneratorService:", error);
    throw error;
  }

  try {
    nameGenerator = new NameGeneratorService(aiNameGenerator);
    console.log("✓ NameGeneratorService initialized");
  } catch (error) {
    console.error("✗ Failed to initialize NameGeneratorService:", error);
    throw error;
  }

  try {
    nameVerifier = new NameVerifierService();
    console.log("✓ NameVerifierService initialized");
  } catch (error) {
    console.error("✗ Failed to initialize NameVerifierService:", error);
    throw error;
  }

  try {
    bandBioGenerator = new BandBioGeneratorService();
    console.log("✓ BandBioGeneratorService initialized");
  } catch (error) {
    console.error("✗ Failed to initialize BandBioGeneratorService:", error);
    throw error;
  }


  // Generate names endpoint
  app.post("/api/generate-names", async (req, res) => {
    try {
      const request = generateNameRequestSchema.parse(req.body);
      
      // Generate names
      const generateResult = await nameGenerator.generateNames(request);
      
      // Names are now always an array
      const names = generateResult;
      
      // Verify each name and store results
      const results = await Promise.all(
        names.map(async (nameResult) => {
          const verification = await nameVerifier.verifyName(nameResult.name, request.type);
          
          // Store in database
          const storedName = await storage.createGeneratedName({
            name: nameResult.name,
            type: request.type,
            wordCount: request.wordCount,
            verificationStatus: verification.status,
            verificationDetails: verification.details || null,
            isAiGenerated: nameResult.isAiGenerated,
          });

          return {
            id: storedName.id,
            name: storedName.name,
            type: storedName.type,
            wordCount: storedName.wordCount,
            isAiGenerated: storedName.isAiGenerated,
            verification
          };
        })
      );

      res.json({ results });
    } catch (error) {
      console.error("Error generating names:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid request parameters", details: error.errors });
      } else {
        const errorMessage = error instanceof Error ? error.message : "Failed to generate names";
        res.status(500).json({ 
          error: errorMessage,
          suggestion: "Please try again with different settings or a smaller word count." 
        });
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
      res.status(500).json({ 
        error: "Failed to fetch recent names",
        suggestion: "The database service may be temporarily unavailable. Please refresh the page." 
      });
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
      res.status(500).json({ 
        error: "Failed to verify name",
        suggestion: "The verification service may be temporarily unavailable. Please try again later." 
      });
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
      
      // Generate songs using full generation system with varied word counts
      const songs = [];
      
      // Use varied word counts for more interesting setlists
      const wordCountOptions = [1, 2, 3, 4, 5, 6];
      const weights = [0.1, 0.2, 0.3, 0.25, 0.1, 0.05]; // Favor 2-4 words
      
      for (let i = 0; i < allSongsNeeded; i++) {
        // Select word count based on weighted distribution
        const rand = Math.random();
        let cumulative = 0;
        let selectedWordCount = 3; // default fallback
        
        for (let j = 0; j < weights.length; j++) {
          cumulative += weights[j];
          if (rand <= cumulative) {
            selectedWordCount = wordCountOptions[j];
            break;
          }
        }
        
        try {
          const songRequest = {
            type: 'song' as const,
            count: 1,
            wordCount: selectedWordCount,
            mood: mood as any,
            genre: genre as any
          };
          
          const generatedNames = await nameGenerator.generateNames(songRequest);
          const songName = generatedNames[0];
          
          // Use full verification including Spotify
          const verification = await nameVerifier.verifyName(songName, 'song');
          
          songs.push({
            id: i + 1,
            name: songName,
            verification
          });
        } catch (err) {
          // Generate a simple fallback name using basic word combination
          const fallbackWords = ['Electric', 'Midnight', 'Echo', 'Dream', 'Fire', 'Storm', 'Crystal', 'Shadow'];
          const fallbackNouns = ['Heart', 'Soul', 'Light', 'Sky', 'Rain', 'Moon', 'Star', 'Wave'];
          const randomWord = fallbackWords[Math.floor(Math.random() * fallbackWords.length)];
          const randomNoun = fallbackNouns[Math.floor(Math.random() * fallbackNouns.length)];
          
          const fallbackName = `${randomWord} ${randomNoun}`;
          // Use full verification for fallback names too
          const verification = await nameVerifier.verifyName(fallbackName, 'song');
          
          songs.push({
            id: i + 1,
            name: fallbackName,
            verification
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

  // Generate band name from setlist endpoint
  app.post("/api/generate-band-from-setlist", async (req, res) => {
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
        
        const moodWords = mood && moods[mood] ? moods[mood] : ['Echo', 'Dream', 'Shadow', 'Fire'];
        const genreWords = genre && genres[genre] ? genres[genre] : ['Collective', 'Project', 'Band', 'Society'];
        
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
      console.error("Error generating band name from setlist:", error);
      res.status(500).json({ 
        error: "Failed to generate band name",
        suggestion: "The AI service may be temporarily unavailable. Please try again later."
      });
    }
  });

  // Generate AI name endpoint
  app.post("/api/generate-ai-name", async (req, res) => {
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
      
      // Store in database
      const storedName = await storage.createGeneratedName({
        name: parsedResponse.name,
        type: type,
        wordCount: parsedResponse.name.split(' ').length,
        verificationStatus: verification.status,
        verificationDetails: verification.details || null,
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
      console.error("Error generating AI name:", error);
      res.status(500).json({ 
        error: "Failed to generate AI name",
        suggestion: "The AI service may be temporarily unavailable. Please try again later."
      });
    }
  });

  // Generate band bio endpoint
  app.post("/api/generate-band-bio", async (req, res) => {
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
      
      console.log("Bio generated for", bandName, ":", parsedResponse.bio);
      
      res.json({ 
        bandName,
        bio: parsedResponse.bio,
        model: parsedResponse.model,
        source: parsedResponse.source,
        generatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error generating band bio:", error);
      res.status(500).json({ 
        error: "Failed to generate band biography",
        suggestion: "The AI service may be temporarily unavailable. Please try again later."
      });
    }
  });



  const httpServer = createServer(app);
  return httpServer;
}
