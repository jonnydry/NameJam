import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb, index, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const generatedNames = pgTable("generated_names", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'band' or 'song'
  wordCount: integer("word_count").notNull(),
  verificationStatus: text("verification_status").notNull(), // 'available', 'similar', 'taken'
  verificationDetails: text("verification_details"),
  isAiGenerated: boolean("is_ai_generated").default(false).notNull(),
  userId: varchar("user_id"), // Link to users table, nullable for backward compatibility
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  // Index for user-specific queries
  index("idx_generated_names_user_id").on(table.userId),
  // Index for type-based filtering
  index("idx_generated_names_type").on(table.type),
  // Index for recent names ordering
  index("idx_generated_names_created_at").on(table.createdAt),
  // Composite index for user's recent names
  index("idx_generated_names_user_created").on(table.userId, table.createdAt),
  // Composite index for type + user + created queries
  index("idx_generated_names_type_user_created").on(table.type, table.userId, table.createdAt),
  // Foreign key constraint for data integrity
  foreignKey({
    columns: [table.userId],
    foreignColumns: [users.id],
    name: "fk_generated_names_user_id"
  }).onDelete("set null"), // Set userId to null if user is deleted
]);

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const insertGeneratedNameSchema = createInsertSchema(generatedNames).omit({
  id: true,
  createdAt: true,
});

export type InsertGeneratedName = z.infer<typeof insertGeneratedNameSchema>;
export type GeneratedName = typeof generatedNames.$inferSelect;

export const generateNameRequestSchema = z.object({
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
  ]).optional(),
  // Cross-genre fusion parameters
  enableFusion: z.boolean().optional().default(false),
  secondaryGenre: z.enum([
    'rock', 'metal', 'jazz', 'electronic', 'folk', 'classical', 'hip-hop', 
    'country', 'blues', 'reggae', 'punk', 'indie', 'pop', 'alternative', 'jam band'
  ]).optional(),
  fusionIntensity: z.enum(['subtle', 'moderate', 'bold', 'experimental']).optional().default('moderate'),
  creativityLevel: z.enum(['conservative', 'balanced', 'innovative', 'revolutionary']).optional().default('balanced'),
  preserveAuthenticity: z.boolean().optional().default(true),
  culturalSensitivity: z.boolean().optional().default(true),
});

export type GenerateNameRequest = z.infer<typeof generateNameRequestSchema>;

export const verificationResult = z.object({
  status: z.enum(['available', 'similar', 'taken']),
  confidence: z.number().min(0).max(1).optional(), // 0-1 confidence score
  confidenceLevel: z.enum(['very-high', 'high', 'medium', 'low', 'very-low']).optional(),
  explanation: z.string().optional(), // Human-readable confidence explanation
  details: z.string().optional(),
  similarNames: z.array(z.string()).optional(),
  verificationLinks: z.array(z.object({
    name: z.string(),
    url: z.string(),
    source: z.string()
  })).optional(),
});

export type VerificationResult = z.infer<typeof verificationResult>;

// Stash item schema for saved names, band lore, and lyric jams
export const stashItem = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['band', 'song', 'bandLore', 'lyricJam']),
  wordCount: z.number(),
  savedAt: z.string(), // ISO date string
  rating: z.number().min(1).max(5).optional(), // 1-5 star rating
  verification: verificationResult.optional(),
  isAiGenerated: z.boolean().optional(),
  genre: z.string().optional(), // For band/song/lyricJam items
  mood: z.string().optional(), // For band/song items

  // Additional fields for band lore items
  bandLoreData: z.object({
    bio: z.string(),
    bandName: z.string(),
    model: z.string().optional(),
    source: z.string().optional(),
    genre: z.string().optional(),
    mood: z.string().optional(),
  }).optional(),
  // Additional fields for lyric jam items
  metadata: z.object({
    songSection: z.string().optional(),
    model: z.string().optional(),
  }).optional()
});

export type StashItem = z.infer<typeof stashItem>;

// Stash items table for authenticated users to save names, band lore, and lyric jams
export const stashItems = pgTable("stash_items", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'band', 'song', 'bandLore', 'lyricJam'
  wordCount: integer("word_count").notNull(),
  savedAt: timestamp("saved_at").defaultNow().notNull(),
  rating: integer("rating"), // 1-5 star rating
  
  // Verification data stored as JSON
  verification: jsonb("verification"), // Complete verification result object
  
  // Generation metadata
  isAiGenerated: boolean("is_ai_generated"),
  genre: text("genre"),
  mood: text("mood"),
  
  // Additional fields for band lore items (stored as JSON for flexibility)
  bandLoreData: jsonb("band_lore_data"),
  
  // Additional fields for lyric jam items (stored as JSON for flexibility)
  metadata: jsonb("metadata"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  // Primary indexes
  index("idx_stash_items_user_id").on(table.userId),
  index("idx_stash_items_type").on(table.type),
  index("idx_stash_items_created_at").on(table.createdAt),
  
  // Composite indexes for user queries
  index("idx_stash_items_user_type").on(table.userId, table.type),
  index("idx_stash_items_user_saved").on(table.userId, table.savedAt),
  
  // Foreign key constraint
  foreignKey({
    columns: [table.userId],
    foreignColumns: [users.id],
    name: "fk_stash_items_user_id"
  }).onDelete("cascade"), // Delete stash items when user is deleted
]);

// Stash items types
export type StashItemDB = typeof stashItems.$inferSelect;
export type InsertStashItem = typeof stashItems.$inferInsert;

// User feedback table for content rating and improvement
export const userFeedback = pgTable("user_feedback", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  contentType: text("content_type").notNull(), // 'name', 'lyric', 'bandBio'
  contentId: text("content_id"), // Reference to generated content ID or name
  contentName: text("content_name").notNull(), // The actual content being rated
  
  // Feedback types
  thumbsRating: boolean("thumbs_rating"), // true = thumbs up, false = thumbs down
  starRating: integer("star_rating"), // 1-5 star rating
  textComment: text("text_comment"), // Optional text feedback
  
  // Context metadata
  genre: text("genre"), // Genre context when feedback was given
  mood: text("mood"), // Mood context when feedback was given
  wordCount: integer("word_count"), // Word count of content
  
  // Quality dimensions (optional detailed feedback)
  creativityRating: integer("creativity_rating"), // 1-5 rating for creativity
  memorabilityRating: integer("memorability_rating"), // 1-5 rating for memorability
  relevanceRating: integer("relevance_rating"), // 1-5 rating for genre relevance
  
  // Metadata
  feedbackSource: text("feedback_source").default("manual"), // 'manual', 'implicit', 'batch'
  sessionId: text("session_id"), // Optional session tracking
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  // Primary indexes
  index("idx_user_feedback_user_id").on(table.userId),
  index("idx_user_feedback_content_type").on(table.contentType),
  index("idx_user_feedback_created_at").on(table.createdAt),
  
  // Composite indexes for analytics
  index("idx_user_feedback_content_rating").on(table.contentType, table.starRating),
  index("idx_user_feedback_genre_rating").on(table.genre, table.starRating),
  index("idx_user_feedback_user_content").on(table.userId, table.contentType),
  index("idx_user_feedback_thumbs").on(table.thumbsRating, table.contentType),
  
  // Foreign key constraints
  foreignKey({
    columns: [table.userId],
    foreignColumns: [users.id],
    name: "fk_user_feedback_user_id"
  }).onDelete("cascade"), // Delete feedback when user is deleted
]);

// User preferences table for personalized quality scoring
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  
  // Preference categories
  preferredGenres: text("preferred_genres").array(), // Array of preferred genres
  preferredMoods: text("preferred_moods").array(), // Array of preferred moods
  preferredWordCounts: integer("preferred_word_counts").array(), // Array of preferred word counts
  
  // Quality preferences (weights for different aspects)
  creativityWeight: integer("creativity_weight").default(5), // 1-10 importance of creativity
  memorabilityWeight: integer("memorability_weight").default(5), // 1-10 importance of memorability
  relevanceWeight: integer("relevance_weight").default(5), // 1-10 importance of genre relevance
  availabilityWeight: integer("availability_weight").default(7), // 1-10 importance of name availability
  
  // Behavioral preferences
  feedbackFrequency: text("feedback_frequency").default("normal"), // 'low', 'normal', 'high'
  qualityThreshold: text("quality_threshold").default("moderate"), // 'strict', 'moderate', 'lenient'
  
  // Metadata
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  // Unique constraint: one preference record per user
  index("idx_user_preferences_unique").on(table.userId),
  
  // Indexes for preference queries
  index("idx_user_preferences_genres").on(table.preferredGenres),
  index("idx_user_preferences_threshold").on(table.qualityThreshold),
  
  // Foreign key constraints
  foreignKey({
    columns: [table.userId],
    foreignColumns: [users.id],
    name: "fk_user_preferences_user_id"
  }).onDelete("cascade"), // Delete preferences when user is deleted
]);

// Feedback analytics table for aggregated patterns
export const feedbackAnalytics = pgTable("feedback_analytics", {
  id: serial("id").primaryKey(),
  
  // Aggregation dimensions
  contentType: text("content_type").notNull(), // 'name', 'lyric', 'bandBio'
  genre: text("genre"), // Genre category (null for cross-genre analytics)
  mood: text("mood"), // Mood category (null for cross-mood analytics)
  wordCount: integer("word_count"), // Word count category
  
  // Time period
  periodType: text("period_type").notNull(), // 'daily', 'weekly', 'monthly'
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  
  // Aggregated metrics
  totalFeedbacks: integer("total_feedbacks").default(0),
  positiveThumbsCount: integer("positive_thumbs_count").default(0),
  negativeThumbsCount: integer("negative_thumbs_count").default(0),
  averageStarRating: integer("average_star_rating"), // Multiplied by 100 for precision (e.g., 350 = 3.5 stars)
  
  // Quality dimension averages (multiplied by 100 for precision)
  averageCreativity: integer("average_creativity"),
  averageMemorability: integer("average_memorability"),
  averageRelevance: integer("average_relevance"),
  
  // Statistical metrics
  feedbackVariance: integer("feedback_variance"), // Variance in ratings (x100)
  uniqueUsers: integer("unique_users"), // Number of unique users who provided feedback
  
  // Quality improvement metrics
  qualityTrend: text("quality_trend"), // 'improving', 'stable', 'declining'
  recommendedAdjustments: jsonb("recommended_adjustments"), // JSON of suggested quality scoring adjustments
  
  // Metadata
  lastCalculated: timestamp("last_calculated").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  // Primary indexes
  index("idx_feedback_analytics_content_type").on(table.contentType),
  index("idx_feedback_analytics_period").on(table.periodType, table.periodStart),
  index("idx_feedback_analytics_genre").on(table.genre),
  
  // Composite indexes for complex queries
  index("idx_feedback_analytics_content_period").on(table.contentType, table.periodType, table.periodStart),
  index("idx_feedback_analytics_genre_period").on(table.genre, table.periodType, table.periodStart),
  index("idx_feedback_analytics_trend").on(table.qualityTrend, table.contentType),
]);

// Error logs table for simple error tracking
export const errorLogs = pgTable("error_logs", {
  id: serial("id").primaryKey(),
  message: text("message").notNull(),
  stack: text("stack"),
  componentStack: text("component_stack"),
  userAgent: text("user_agent"),
  url: text("url"),
  userId: varchar("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  // Index for user-specific error queries
  index("idx_error_logs_user_id").on(table.userId),
  // Index for recent errors
  index("idx_error_logs_created_at").on(table.createdAt),
  // Composite index for user's recent errors
  index("idx_error_logs_user_created").on(table.userId, table.createdAt),
]);

// Types for feedback tables
export type UserFeedback = typeof userFeedback.$inferSelect;
export type InsertUserFeedback = typeof userFeedback.$inferInsert;

export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = typeof userPreferences.$inferInsert;

export type FeedbackAnalytics = typeof feedbackAnalytics.$inferSelect;
export type InsertFeedbackAnalytics = typeof feedbackAnalytics.$inferInsert;

export type ErrorLog = typeof errorLogs.$inferSelect;
export type InsertErrorLog = typeof errorLogs.$inferInsert;

// Zod schemas for feedback operations
export const insertUserFeedbackSchema = createInsertSchema(userFeedback).omit({
  id: true,
  createdAt: true,
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  createdAt: true,
  lastUpdated: true,
});

export const userFeedbackRequestSchema = z.object({
  contentType: z.enum(['name', 'lyric', 'bandBio']),
  contentName: z.string().min(1).max(500),
  contentId: z.string().optional(),
  thumbsRating: z.boolean().optional(),
  starRating: z.number().min(1).max(5).optional(),
  textComment: z.string().max(1000).optional(),
  genre: z.string().optional(),
  mood: z.string().optional(),
  wordCount: z.number().optional(),
  creativityRating: z.number().min(1).max(5).optional(),
  memorabilityRating: z.number().min(1).max(5).optional(),
  relevanceRating: z.number().min(1).max(5).optional(),
  sessionId: z.string().optional(),
});

export const userPreferencesUpdateSchema = z.object({
  preferredGenres: z.array(z.string()).optional(),
  preferredMoods: z.array(z.string()).optional(),
  preferredWordCounts: z.array(z.number()).optional(),
  creativityWeight: z.number().min(1).max(10).optional(),
  memorabilityWeight: z.number().min(1).max(10).optional(),
  relevanceWeight: z.number().min(1).max(10).optional(),
  availabilityWeight: z.number().min(1).max(10).optional(),
  feedbackFrequency: z.enum(['low', 'normal', 'high']).optional(),
  qualityThreshold: z.enum(['strict', 'moderate', 'lenient']).optional(),
});

export type UserFeedbackRequest = z.infer<typeof userFeedbackRequestSchema>;
export type UserPreferencesUpdate = z.infer<typeof userPreferencesUpdateSchema>;


