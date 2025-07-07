import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const generatedNames = pgTable("generated_names", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'band' or 'song'
  wordCount: integer("word_count").notNull(),
  verificationStatus: text("verification_status").notNull(), // 'available', 'similar', 'taken'
  verificationDetails: text("verification_details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertGeneratedNameSchema = createInsertSchema(generatedNames).omit({
  id: true,
  createdAt: true,
});

export type InsertGeneratedName = z.infer<typeof insertGeneratedNameSchema>;
export type GeneratedName = typeof generatedNames.$inferSelect;

export const generateNameRequestSchema = z.object({
  type: z.enum(['band', 'song']),
  wordCount: z.number().min(1).max(6),
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

// Stash item schema for saved names
export const stashItem = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['band', 'song']),
  wordCount: z.number(),
  savedAt: z.string(), // ISO date string
  verification: verificationResult
});

export type StashItem = z.infer<typeof stashItem>;

// Set List schemas
export const setListSong = z.object({
  id: z.number(),
  name: z.string(),
  verification: verificationResult,
});

export type SetListSong = z.infer<typeof setListSong>;

export const setListRequest = z.object({
  songCount: z.enum(['8', '16']),
  mood: z.string().optional(),
  genre: z.string().optional(),
});

export type SetListRequest = z.infer<typeof setListRequest>;

export const setListResponse = z.object({
  setOne: z.array(setListSong),
  setTwo: z.array(setListSong),
  finale: setListSong,
  totalSongs: z.number(),
});

export type SetListResponse = z.infer<typeof setListResponse>;
