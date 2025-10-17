/**
 * Name Generation Handler
 * Extracted from routes.ts to improve maintainability and testability
 */

import type { Request, Response } from "express";
import type { GenerateNameRequest } from "@shared/schema";
import { z } from "zod";
import { secureLog } from "../../utils/secureLogger";
import { InputSanitizer } from "../../utils/inputSanitizer";
import { UnifiedNameGeneratorService, GENERATION_STRATEGIES } from "../../services/unifiedNameGenerator";
import { qualityRankingSystem } from "../../services/qualityScoring/qualityRankingSystem";
import { parallelVerificationService } from "../../services/parallelVerification";
import { unifiedWordFilter } from "../../services/nameGeneration/unifiedWordFilter";
import { optimizedContextService } from "../../services/optimizedContextService";
import { storage } from "../../storage";
import { backgroundQueue } from "../services/BackgroundQueue";
import { config } from "../../config";

// Helper functions extracted from routes.ts
function determineAdaptiveStrategy(request: any, userPreferences: any, contextCacheHit: boolean): string {
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
  
  return 'balanced';
}

function getQualityThreshold(request: any, userPreferences: any): number {
  if (userPreferences?.qualityThreshold) {
    const thresholdMapping = {
      'very-high': 0.85,
      'high': 0.75,
      'medium': 0.65,
      'low': 0.55,
      'very-low': 0.45
    };
    return thresholdMapping[userPreferences.qualityThreshold] || 0.65;
  }
  
  // Default based on genre complexity
  const complexGenres = ['experimental', 'avant-garde', 'progressive', 'fusion'];
  if (request.genre && complexGenres.includes(request.genre)) {
    return 0.6; // Lower threshold for complex genres
  }
  
  return 0.65; // Default threshold
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

export class NameGenerationHandler {
  private nameGenerator: UnifiedNameGeneratorService;

  constructor(nameGenerator?: UnifiedNameGeneratorService) {
    this.nameGenerator = nameGenerator || new UnifiedNameGeneratorService();
  }

  async handleGenerateNames(req: Request, res: Response): Promise<void> {
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
      
      const request = z.object({
        type: z.enum(['band', 'song']),
        wordCount: z.union([
          z.number().min(1).max(3),
          z.literal('4+')
        ]).optional(),
        count: z.number().min(1).max(10).default(3),
        mood: z.enum([
          'dark', 'bright', 'mysterious', 'energetic', 'melancholy', 'ethereal',
          'aggressive', 'peaceful', 'nostalgic', 'futuristic', 'romantic', 'epic'
        ]).optional(),
        genre: z.enum([
          'rock', 'metal', 'jazz', 'electronic', 'folk', 'classical', 'hip-hop', 
          'country', 'blues', 'reggae', 'punk', 'indie', 'pop', 'alternative', 'jam band'
        ]).optional()
      }).parse(sanitizedBody);
      
      // Determine adaptive strategy based on context cache and session behavior
      const sessionId = req.headers['x-session-id'] as string || 'anonymous';
      const userPreferences = req.user ? await storage.getUserPreferences(req.user.claims.sub).catch(() => null) : null;
      
      // Check if context will be cached (simplified check)
      const contextCacheKey = `${request.genre || 'none'}-${request.mood || 'none'}-quality`;
      const contextCacheHit = optimizedContextService.hasCachedContext(contextCacheKey);
      
      const adaptiveStrategy = determineAdaptiveStrategy(request, userPreferences, contextCacheHit);
      const strategy = GENERATION_STRATEGIES[adaptiveStrategy as keyof typeof GENERATION_STRATEGIES] || GENERATION_STRATEGIES.BALANCED;
      
      // Track request for adaptive behavior
      incrementRequestCount(sessionId);
      
      secureLog.info(`🎯 Using adaptive strategy: ${adaptiveStrategy} (cache hit: ${contextCacheHit})`);
      
      // Generate names using adaptive strategy with session tracking
      const generationId = unifiedWordFilter.startNewGeneration(sessionId);
      const names = await this.nameGenerator.generateNames(request, strategy);
      
      // Check if response was already sent (due to timeout)
      if (hasResponded || res.headersSent) {
        secureLog.debug('Response already sent, skipping verification');
        return;
      }
      
      // Apply intelligent quality ranking system (optional based on strategy)
      let intelligentlyRankedNames = names;
      let rankingMetadata = null;
      
      // Skip quality ranking for SPEED strategy to improve response time
      if (adaptiveStrategy !== 'SPEED') {
        try {
          secureLog.info('Applying full comparative quality ranking system');
          
          // Determine ranking mode based on request context and user preferences
          const rankingMode = determineRankingMode(request, userPreferences);
          const qualityThreshold = getQualityThreshold(request, userPreferences);
        
          // Prepare quality ranking request
          const qualityRankingRequest = {
            names: names.map(n => n.name),
            context: {
              genre: request.genre,
              mood: request.mood,
              type: request.type,
              targetAudience: 'mainstream' as const
            },
            rankingMode: rankingMode as any,
            qualityThreshold,
            maxResults: request.count,
            diversityTarget: 0.7,
            adaptiveLearning: true
          };
          
          // Apply quality ranking system
          const rankingResult = await qualityRankingSystem.rankNames(qualityRankingRequest);
          
          // Extract top ranked names up to requested count
          const topRankedNames = rankingResult.rankedNames.slice(0, request.count);
          
          // Map ranked names back to original format with quality information
          intelligentlyRankedNames = topRankedNames.map(rankedName => {
            const originalName = names.find(n => n.name === rankedName.name);
            if (!originalName) {
              throw new Error(`Original name not found for ranked name: ${rankedName.name}`);
            }
            
            return {
              ...originalName,
              qualityScore: rankedName.qualityScore,
              qualityRank: rankedName.rank,
              strengthProfile: rankedName.strengthProfile,
              differentiationFactors: rankedName.differentiationFactors,
              marketPosition: rankedName.marketPosition,
              confidenceScore: rankedName.confidenceScore
            };
          });
          
          // Create ranking metadata for response
          rankingMetadata = {
            totalAnalyzed: rankingResult.analytics.totalAnalyzed,
            qualifiedNames: rankingResult.analytics.passingThreshold,
            averageQuality: rankingResult.analytics.averageQuality,
            qualityRange: rankingResult.analytics.qualityRange,
            diversityIndex: rankingResult.analytics.diversityIndex,
            rankingMode,
            qualityThreshold,
            adaptiveLearning: true,
            recommendations: rankingResult.recommendations,
            qualityDistribution: {
              excellent: rankingResult.qualityDistribution.excellent.length,
              good: rankingResult.qualityDistribution.good.length,
              fair: rankingResult.qualityDistribution.fair.length,
              poor: rankingResult.qualityDistribution.poor.length
            },
            dimensionalAverages: rankingResult.analytics.dimensionalAverages
          };
          
          secureLog.info(`Quality ranking applied: ${names.length} names → ${intelligentlyRankedNames.length} served (mode: ${rankingMode}, avg quality: ${rankingResult.analytics.averageQuality.toFixed(3)})`);
          
        } catch (filterError) {
          secureLog.error('Quality ranking failed, falling back to basic filtering:', filterError);
          // Fallback to basic approach if quality ranking fails
          intelligentlyRankedNames = names.slice(0, request.count);
          rankingMetadata = {
            totalAnalyzed: names.length,
            qualifiedNames: intelligentlyRankedNames.length,
            averageQuality: 0.6,
            rankingMode: 'fallback-basic',
            diversityIndex: 0.5,
            adaptiveLearning: false,
            recommendations: [],
            error: 'Quality ranking system unavailable, using basic fallback'
          };
        }
      } else {
        secureLog.info('Skipping quality ranking for SPEED strategy');
        intelligentlyRankedNames = names.slice(0, request.count);
        rankingMetadata = {
          totalAnalyzed: names.length,
          qualifiedNames: intelligentlyRankedNames.length,
          averageQuality: 0.7,
          rankingMode: 'speed-skip',
          diversityIndex: 0.6,
          adaptiveLearning: false,
          recommendations: [],
          strategy: 'SPEED'
        };
      }
      
      // Optimized parallel verification and storage
      
      // Batch verification for better performance - use faster approach
      const { parallelVerificationService } = await import('../../services/parallelVerification');
      const namesToVerify = intelligentlyRankedNames.map(n => n.name);
      
      // Verify all names in parallel with caching (reduced timeout for faster response)
      const verificationResults = await parallelVerificationService.verifyNamesInParallel(namesToVerify);
      
      // Check again before processing results
      if (hasResponded || res.headersSent) {
        return;
      }
      
      // Process results and handle database storage
      const results = await Promise.all(
        intelligentlyRankedNames.map(async (nameResult, index) => {
          const verification = verificationResults[index];
          let storedName = null;
          
          // Only store in database if user is authenticated (non-blocking via background queue)
          if (req.user && req.user.claims && req.user.claims.sub && config.performance.enableAsyncDbWrites) {
            const userId = req.user.claims.sub;
            
            try {
              const dbWordCount = typeof request.wordCount === 'string' && request.wordCount === '4+' 
                ? 4 
                : (typeof request.wordCount === 'number' ? request.wordCount : nameResult.name.split(/\s+/).length);
              
              // Use background queue for non-blocking database writes
              backgroundQueue.enqueueCreateGeneratedName({
                name: nameResult.name,
                type: request.type,
                wordCount: dbWordCount,
                verificationStatus: verification.status,
                verificationDetails: verification.details || null,
                isAiGenerated: nameResult.isAiGenerated,
                userId: userId,
              });
            } catch (error) {
              secureLog.error("Background queue enqueue error:", error);
            }
          }

          return {
            id: null,
            name: nameResult.name,
            type: request.type,
            wordCount: nameResult.name.split(/\s+/).length,
            isAiGenerated: nameResult.isAiGenerated,
            verification
          };
        })
      );

      // Track generated names in the filter with session persistence
      results.forEach(result => {
        unifiedWordFilter.acceptName(result.name, generationId, request.type, sessionId);
      });
      
      // Include ranking metadata in response for enhanced user experience
      const responseData = {
        results,
        ...(rankingMetadata && {
          ranking: {
            metadata: rankingMetadata,
            intelligentRankingApplied: true,
            enhancedQualityData: true
          }
        })
      };
      
      sendResponse(200, responseData);
    } catch (error) {
      secureLog.error("Error generating names:", error);
      if (error instanceof z.ZodError) {
        sendResponse(400, { error: "Invalid request parameters", details: error.errors });
      } else {
        const errorMessage = error instanceof Error ? error.message : "Failed to generate names";
        sendResponse(500, { error: errorMessage });
      }
    }
  }
}
