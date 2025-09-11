import {
  generatedNames,
  users,
  userFeedback,
  userPreferences,
  feedbackAnalytics,
  type GeneratedName,
  type InsertGeneratedName,
  type User,
  type UpsertUser,
  type UserFeedback,
  type InsertUserFeedback,
  type UserPreferences,
  type InsertUserPreferences,
  type FeedbackAnalytics,
  type InsertFeedbackAnalytics,
  type UserFeedbackRequest,
  type UserPreferencesUpdate,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, sql, count, avg, sum } from "drizzle-orm";
import { withDatabaseRetry } from "./utils/errorHandling";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Generated Names CRUD
  createGeneratedName(name: InsertGeneratedName): Promise<GeneratedName>;
  getGeneratedNames(userId?: string, limit?: number): Promise<GeneratedName[]>;
  getGeneratedNamesByType(type: string, userId?: string, limit?: number): Promise<GeneratedName[]>;
  
  // User Feedback operations
  createUserFeedback(feedback: InsertUserFeedback): Promise<UserFeedback>;
  getUserFeedback(userId: string, limit?: number): Promise<UserFeedback[]>;
  getUserFeedbackByContent(contentName: string, contentType: string, userId?: string): Promise<UserFeedback[]>;
  getFeedbackStats(contentType: string, genre?: string, timeframe?: number): Promise<{
    totalFeedbacks: number;
    averageStarRating: number;
    positiveThumbsPercentage: number;
    averageCreativity: number;
    averageMemorability: number;
    averageRelevance: number;
  }>;
  
  // User Preferences operations
  getUserPreferences(userId: string): Promise<UserPreferences | undefined>;
  upsertUserPreferences(userId: string, preferences: UserPreferencesUpdate): Promise<UserPreferences>;
  
  // Feedback Analytics operations
  createFeedbackAnalytics(analytics: InsertFeedbackAnalytics): Promise<FeedbackAnalytics>;
  getFeedbackAnalytics(contentType?: string, genre?: string, periodType?: string, limit?: number): Promise<FeedbackAnalytics[]>;
  getLatestFeedbackTrends(hours?: number): Promise<{
    contentType: string;
    qualityTrend: string;
    averageRating: number;
    feedbackCount: number;
  }[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private generatedNames: Map<number, GeneratedName>;
  private userFeedbacks: Map<number, UserFeedback>;
  private userPreferences: Map<string, UserPreferences>;
  private feedbackAnalytics: Map<number, FeedbackAnalytics>;
  currentNameId: number;
  currentFeedbackId: number;
  currentAnalyticsId: number;

  constructor() {
    this.users = new Map();
    this.generatedNames = new Map();
    this.userFeedbacks = new Map();
    this.userPreferences = new Map();
    this.feedbackAnalytics = new Map();
    this.currentNameId = 1;
    this.currentFeedbackId = 1;
    this.currentAnalyticsId = 1;
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const user: User = {
      id: userData.id,
      email: userData.email || null,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      profileImageUrl: userData.profileImageUrl || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(userData.id, user);
    return user;
  }

  async createGeneratedName(insertName: InsertGeneratedName): Promise<GeneratedName> {
    const id = this.currentNameId++;
    const name: GeneratedName = { 
      ...insertName, 
      id, 
      createdAt: new Date(),
      verificationDetails: insertName.verificationDetails || null,
      isAiGenerated: insertName.isAiGenerated || false,
      userId: insertName.userId || null
    };
    this.generatedNames.set(id, name);
    return name;
  }

  async getGeneratedNames(userId?: string, limit: number = 50): Promise<GeneratedName[]> {
    const names = Array.from(this.generatedNames.values())
      .filter(name => !userId || name.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return names.slice(0, limit);
  }

  async getGeneratedNamesByType(type: string, userId?: string, limit: number = 50): Promise<GeneratedName[]> {
    const names = Array.from(this.generatedNames.values())
      .filter(name => name.type === type && (!userId || name.userId === userId))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return names.slice(0, limit);
  }

  // User Feedback operations
  async createUserFeedback(insertFeedback: InsertUserFeedback): Promise<UserFeedback> {
    const id = this.currentFeedbackId++;
    const feedback: UserFeedback = {
      ...insertFeedback,
      id,
      createdAt: new Date(),
      thumbsRating: insertFeedback.thumbsRating || null,
      starRating: insertFeedback.starRating || null,
      textComment: insertFeedback.textComment || null,
      contentId: insertFeedback.contentId || null,
      genre: insertFeedback.genre || null,
      mood: insertFeedback.mood || null,
      wordCount: insertFeedback.wordCount || null,
      creativityRating: insertFeedback.creativityRating || null,
      memorabilityRating: insertFeedback.memorabilityRating || null,
      relevanceRating: insertFeedback.relevanceRating || null,
      feedbackSource: insertFeedback.feedbackSource || "manual",
      sessionId: insertFeedback.sessionId || null,
    };
    this.userFeedbacks.set(id, feedback);
    return feedback;
  }

  async getUserFeedback(userId: string, limit: number = 50): Promise<UserFeedback[]> {
    const feedbacks = Array.from(this.userFeedbacks.values())
      .filter(feedback => feedback.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return feedbacks.slice(0, limit);
  }

  async getUserFeedbackByContent(contentName: string, contentType: string, userId?: string): Promise<UserFeedback[]> {
    const feedbacks = Array.from(this.userFeedbacks.values())
      .filter(feedback => 
        feedback.contentName === contentName && 
        feedback.contentType === contentType &&
        (!userId || feedback.userId === userId)
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return feedbacks;
  }

  async getFeedbackStats(contentType: string, genre?: string, timeframe?: number): Promise<{
    totalFeedbacks: number;
    averageStarRating: number;
    positiveThumbsPercentage: number;
    averageCreativity: number;
    averageMemorability: number;
    averageRelevance: number;
  }> {
    const cutoffDate = timeframe ? new Date(Date.now() - timeframe * 24 * 60 * 60 * 1000) : null;
    
    const relevantFeedbacks = Array.from(this.userFeedbacks.values()).filter(feedback => {
      if (feedback.contentType !== contentType) return false;
      if (genre && feedback.genre !== genre) return false;
      if (cutoffDate && feedback.createdAt < cutoffDate) return false;
      return true;
    });

    if (relevantFeedbacks.length === 0) {
      return {
        totalFeedbacks: 0,
        averageStarRating: 0,
        positiveThumbsPercentage: 0,
        averageCreativity: 0,
        averageMemorability: 0,
        averageRelevance: 0,
      };
    }

    const starRatings = relevantFeedbacks.filter(f => f.starRating !== null).map(f => f.starRating!);
    const thumbsRatings = relevantFeedbacks.filter(f => f.thumbsRating !== null);
    const creativityRatings = relevantFeedbacks.filter(f => f.creativityRating !== null).map(f => f.creativityRating!);
    const memorabilityRatings = relevantFeedbacks.filter(f => f.memorabilityRating !== null).map(f => f.memorabilityRating!);
    const relevanceRatings = relevantFeedbacks.filter(f => f.relevanceRating !== null).map(f => f.relevanceRating!);

    return {
      totalFeedbacks: relevantFeedbacks.length,
      averageStarRating: starRatings.length > 0 ? starRatings.reduce((a, b) => a + b, 0) / starRatings.length : 0,
      positiveThumbsPercentage: thumbsRatings.length > 0 ? 
        (thumbsRatings.filter(f => f.thumbsRating === true).length / thumbsRatings.length) * 100 : 0,
      averageCreativity: creativityRatings.length > 0 ? creativityRatings.reduce((a, b) => a + b, 0) / creativityRatings.length : 0,
      averageMemorability: memorabilityRatings.length > 0 ? memorabilityRatings.reduce((a, b) => a + b, 0) / memorabilityRatings.length : 0,
      averageRelevance: relevanceRatings.length > 0 ? relevanceRatings.reduce((a, b) => a + b, 0) / relevanceRatings.length : 0,
    };
  }

  // User Preferences operations
  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    return this.userPreferences.get(userId);
  }

  async upsertUserPreferences(userId: string, preferences: UserPreferencesUpdate): Promise<UserPreferences> {
    const existing = this.userPreferences.get(userId);
    const now = new Date();
    
    const updated: UserPreferences = {
      id: existing?.id || this.currentAnalyticsId++, // Reuse analytics ID counter for simplicity
      userId,
      preferredGenres: preferences.preferredGenres || existing?.preferredGenres || null,
      preferredMoods: preferences.preferredMoods || existing?.preferredMoods || null,
      preferredWordCounts: preferences.preferredWordCounts || existing?.preferredWordCounts || null,
      creativityWeight: preferences.creativityWeight || existing?.creativityWeight || 5,
      memorabilityWeight: preferences.memorabilityWeight || existing?.memorabilityWeight || 5,
      relevanceWeight: preferences.relevanceWeight || existing?.relevanceWeight || 5,
      availabilityWeight: preferences.availabilityWeight || existing?.availabilityWeight || 7,
      feedbackFrequency: preferences.feedbackFrequency || existing?.feedbackFrequency || "normal",
      qualityThreshold: preferences.qualityThreshold || existing?.qualityThreshold || "moderate",
      lastUpdated: now,
      createdAt: existing?.createdAt || now,
    };
    
    this.userPreferences.set(userId, updated);
    return updated;
  }

  // Feedback Analytics operations
  async createFeedbackAnalytics(insertAnalytics: InsertFeedbackAnalytics): Promise<FeedbackAnalytics> {
    const id = this.currentAnalyticsId++;
    const analytics: FeedbackAnalytics = {
      ...insertAnalytics,
      id,
      genre: insertAnalytics.genre || null,
      mood: insertAnalytics.mood || null,
      wordCount: insertAnalytics.wordCount || null,
      totalFeedbacks: insertAnalytics.totalFeedbacks || 0,
      positiveThumbsCount: insertAnalytics.positiveThumbsCount || 0,
      negativeThumbsCount: insertAnalytics.negativeThumbsCount || 0,
      averageStarRating: insertAnalytics.averageStarRating || null,
      averageCreativity: insertAnalytics.averageCreativity || null,
      averageMemorability: insertAnalytics.averageMemorability || null,
      averageRelevance: insertAnalytics.averageRelevance || null,
      feedbackVariance: insertAnalytics.feedbackVariance || null,
      uniqueUsers: insertAnalytics.uniqueUsers || null,
      qualityTrend: insertAnalytics.qualityTrend || null,
      recommendedAdjustments: insertAnalytics.recommendedAdjustments || null,
      lastCalculated: new Date(),
      createdAt: new Date(),
    };
    this.feedbackAnalytics.set(id, analytics);
    return analytics;
  }

  async getFeedbackAnalytics(
    contentType?: string, 
    genre?: string, 
    periodType?: string, 
    limit: number = 50
  ): Promise<FeedbackAnalytics[]> {
    const analytics = Array.from(this.feedbackAnalytics.values())
      .filter(record => {
        if (contentType && record.contentType !== contentType) return false;
        if (genre && record.genre !== genre) return false;
        if (periodType && record.periodType !== periodType) return false;
        return true;
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return analytics.slice(0, limit);
  }

  async getLatestFeedbackTrends(hours: number = 24): Promise<{
    contentType: string;
    qualityTrend: string;
    averageRating: number;
    feedbackCount: number;
  }[]> {
    const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    const recentAnalytics = Array.from(this.feedbackAnalytics.values())
      .filter(record => record.createdAt >= cutoffDate && record.qualityTrend)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Group by content type and get the latest trend for each
    const trendMap = new Map<string, FeedbackAnalytics>();
    for (const record of recentAnalytics) {
      if (!trendMap.has(record.contentType)) {
        trendMap.set(record.contentType, record);
      }
    }

    return Array.from(trendMap.values()).map(record => ({
      contentType: record.contentType,
      qualityTrend: record.qualityTrend || 'stable',
      averageRating: record.averageStarRating ? record.averageStarRating / 100 : 0,
      feedbackCount: record.totalFeedbacks || 0,
    }));
  }
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    return withDatabaseRetry(async () => {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    });
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    return withDatabaseRetry(async () => {
      const [user] = await db
        .insert(users)
        .values(userData)
        .onConflictDoUpdate({
          target: users.id,
          set: {
            ...userData,
            updatedAt: new Date(),
          },
        })
        .returning();
      return user;
    });
  }

  async createGeneratedName(insertName: InsertGeneratedName): Promise<GeneratedName> {
    return withDatabaseRetry(async () => {
      const [name] = await db
        .insert(generatedNames)
        .values(insertName)
        .returning();
      return name;
    });
  }

  async getGeneratedNames(userId?: string, limit: number = 50): Promise<GeneratedName[]> {
    return withDatabaseRetry(async () => {
      if (userId) {
        return await db
          .select()
          .from(generatedNames)
          .where(eq(generatedNames.userId, userId))
          .orderBy(desc(generatedNames.createdAt))
          .limit(limit);
      } else {
        return await db
          .select()
          .from(generatedNames)
          .orderBy(desc(generatedNames.createdAt))
          .limit(limit);
      }
    });
  }

  async getGeneratedNamesByType(type: string, userId?: string, limit: number = 50): Promise<GeneratedName[]> {
    return withDatabaseRetry(async () => {
      if (userId) {
        return await db
          .select()
          .from(generatedNames)
          .where(and(eq(generatedNames.type, type), eq(generatedNames.userId, userId)))
          .orderBy(desc(generatedNames.createdAt))
          .limit(limit);
      } else {
        return await db
          .select()
          .from(generatedNames)
          .where(eq(generatedNames.type, type))
          .orderBy(desc(generatedNames.createdAt))
          .limit(limit);
      }
    });
  }

  // User Feedback operations
  async createUserFeedback(insertFeedback: InsertUserFeedback): Promise<UserFeedback> {
    return withDatabaseRetry(async () => {
      const [feedback] = await db
        .insert(userFeedback)
        .values(insertFeedback)
        .returning();
      return feedback;
    });
  }

  async getUserFeedback(userId: string, limit: number = 50): Promise<UserFeedback[]> {
    return withDatabaseRetry(async () => {
      return await db
        .select()
        .from(userFeedback)
        .where(eq(userFeedback.userId, userId))
        .orderBy(desc(userFeedback.createdAt))
        .limit(limit);
    });
  }

  async getUserFeedbackByContent(contentName: string, contentType: string, userId?: string): Promise<UserFeedback[]> {
    return withDatabaseRetry(async () => {
      const conditions = [
        eq(userFeedback.contentName, contentName),
        eq(userFeedback.contentType, contentType)
      ];
      
      if (userId) {
        conditions.push(eq(userFeedback.userId, userId));
      }

      return await db
        .select()
        .from(userFeedback)
        .where(and(...conditions))
        .orderBy(desc(userFeedback.createdAt));
    });
  }

  async getFeedbackStats(contentType: string, genre?: string, timeframe?: number): Promise<{
    totalFeedbacks: number;
    averageStarRating: number;
    positiveThumbsPercentage: number;
    averageCreativity: number;
    averageMemorability: number;
    averageRelevance: number;
  }> {
    return withDatabaseRetry(async () => {
      const conditions = [eq(userFeedback.contentType, contentType)];
      
      if (genre) {
        conditions.push(eq(userFeedback.genre, genre));
      }
      
      if (timeframe) {
        const cutoffDate = new Date(Date.now() - timeframe * 24 * 60 * 60 * 1000);
        conditions.push(gte(userFeedback.createdAt, cutoffDate));
      }

      const stats = await db
        .select({
          totalFeedbacks: count(),
          averageStarRating: avg(userFeedback.starRating),
          positiveThumbsCount: sum(sql`CASE WHEN ${userFeedback.thumbsRating} = true THEN 1 ELSE 0 END`),
          totalThumbsCount: sum(sql`CASE WHEN ${userFeedback.thumbsRating} IS NOT NULL THEN 1 ELSE 0 END`),
          averageCreativity: avg(userFeedback.creativityRating),
          averageMemorability: avg(userFeedback.memorabilityRating),
          averageRelevance: avg(userFeedback.relevanceRating),
        })
        .from(userFeedback)
        .where(and(...conditions));

      const result = stats[0];
      
      return {
        totalFeedbacks: Number(result.totalFeedbacks) || 0,
        averageStarRating: Number(result.averageStarRating) || 0,
        positiveThumbsPercentage: result.totalThumbsCount && Number(result.totalThumbsCount) > 0 
          ? (Number(result.positiveThumbsCount) / Number(result.totalThumbsCount)) * 100 
          : 0,
        averageCreativity: Number(result.averageCreativity) || 0,
        averageMemorability: Number(result.averageMemorability) || 0,
        averageRelevance: Number(result.averageRelevance) || 0,
      };
    });
  }

  // User Preferences operations
  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    return withDatabaseRetry(async () => {
      const [preferences] = await db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, userId));
      return preferences;
    });
  }

  async upsertUserPreferences(userId: string, preferences: UserPreferencesUpdate): Promise<UserPreferences> {
    return withDatabaseRetry(async () => {
      const [updated] = await db
        .insert(userPreferences)
        .values({
          userId,
          ...preferences,
        })
        .onConflictDoUpdate({
          target: userPreferences.userId,
          set: {
            ...preferences,
            lastUpdated: new Date(),
          },
        })
        .returning();
      return updated;
    });
  }

  // Feedback Analytics operations
  async createFeedbackAnalytics(insertAnalytics: InsertFeedbackAnalytics): Promise<FeedbackAnalytics> {
    return withDatabaseRetry(async () => {
      const [analytics] = await db
        .insert(feedbackAnalytics)
        .values(insertAnalytics)
        .returning();
      return analytics;
    });
  }

  async getFeedbackAnalytics(
    contentType?: string,
    genre?: string,
    periodType?: string,
    limit: number = 50
  ): Promise<FeedbackAnalytics[]> {
    return withDatabaseRetry(async () => {
      const conditions = [];
      
      if (contentType) {
        conditions.push(eq(feedbackAnalytics.contentType, contentType));
      }
      if (genre) {
        conditions.push(eq(feedbackAnalytics.genre, genre));
      }
      if (periodType) {
        conditions.push(eq(feedbackAnalytics.periodType, periodType));
      }

      return await db
        .select()
        .from(feedbackAnalytics)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(feedbackAnalytics.createdAt))
        .limit(limit);
    });
  }

  async getLatestFeedbackTrends(hours: number = 24): Promise<{
    contentType: string;
    qualityTrend: string;
    averageRating: number;
    feedbackCount: number;
  }[]> {
    return withDatabaseRetry(async () => {
      const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);
      
      const trends = await db
        .select({
          contentType: feedbackAnalytics.contentType,
          qualityTrend: feedbackAnalytics.qualityTrend,
          averageStarRating: feedbackAnalytics.averageStarRating,
          totalFeedbacks: feedbackAnalytics.totalFeedbacks,
          createdAt: feedbackAnalytics.createdAt,
        })
        .from(feedbackAnalytics)
        .where(
          and(
            gte(feedbackAnalytics.createdAt, cutoffDate),
            sql`${feedbackAnalytics.qualityTrend} IS NOT NULL`
          )
        )
        .orderBy(desc(feedbackAnalytics.createdAt));

      // Group by content type and get the latest trend for each
      const trendMap = new Map<string, any>();
      for (const record of trends) {
        if (!trendMap.has(record.contentType)) {
          trendMap.set(record.contentType, record);
        }
      }

      return Array.from(trendMap.values()).map(record => ({
        contentType: record.contentType,
        qualityTrend: record.qualityTrend || 'stable',
        averageRating: record.averageStarRating ? record.averageStarRating / 100 : 0,
        feedbackCount: record.totalFeedbacks || 0,
      }));
    });
  }
}

export const storage = new DatabaseStorage();
