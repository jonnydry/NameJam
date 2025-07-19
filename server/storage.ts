import {
  generatedNames,
  users,
  type GeneratedName,
  type InsertGeneratedName,
  type User,
  type UpsertUser,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Generated Names CRUD
  createGeneratedName(name: InsertGeneratedName): Promise<GeneratedName>;
  getGeneratedNames(userId?: string, limit?: number): Promise<GeneratedName[]>;
  getGeneratedNamesByType(type: string, userId?: string, limit?: number): Promise<GeneratedName[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private generatedNames: Map<number, GeneratedName>;
  currentNameId: number;

  constructor() {
    this.users = new Map();
    this.generatedNames = new Map();
    this.currentNameId = 1;
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
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
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
  }

  async createGeneratedName(insertName: InsertGeneratedName): Promise<GeneratedName> {
    const [name] = await db
      .insert(generatedNames)
      .values(insertName)
      .returning();
    return name;
  }

  async getGeneratedNames(userId?: string, limit: number = 50): Promise<GeneratedName[]> {
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
  }

  async getGeneratedNamesByType(type: string, userId?: string, limit: number = 50): Promise<GeneratedName[]> {
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
  }
}

export const storage = new DatabaseStorage();
