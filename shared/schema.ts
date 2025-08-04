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
    'country', 'blues', 'reggae', 'punk', 'indie', 'pop', 'alternative'
  ]).optional(),
});

export type GenerateNameRequest = z.infer<typeof generateNameRequestSchema>;

export const verificationResult = z.object({
  status: z.enum(['available', 'similar', 'taken']),
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

export type ErrorLog = typeof errorLogs.$inferSelect;
export type InsertErrorLog = typeof errorLogs.$inferInsert;


