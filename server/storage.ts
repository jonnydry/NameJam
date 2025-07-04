import { generatedNames, type GeneratedName, type InsertGeneratedName } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<any | undefined>;
  getUserByUsername(username: string): Promise<any | undefined>;
  createUser(user: any): Promise<any>;
  
  // Generated Names CRUD
  createGeneratedName(name: InsertGeneratedName): Promise<GeneratedName>;
  getGeneratedNames(limit?: number): Promise<GeneratedName[]>;
  getGeneratedNamesByType(type: string, limit?: number): Promise<GeneratedName[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, any>;
  private generatedNames: Map<number, GeneratedName>;
  currentUserId: number;
  currentNameId: number;

  constructor() {
    this.users = new Map();
    this.generatedNames = new Map();
    this.currentUserId = 1;
    this.currentNameId = 1;
  }

  async getUser(id: number): Promise<any | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<any | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: any): Promise<any> {
    const id = this.currentUserId++;
    const user: any = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createGeneratedName(insertName: InsertGeneratedName): Promise<GeneratedName> {
    const id = this.currentNameId++;
    const name: GeneratedName = { 
      ...insertName, 
      id, 
      createdAt: new Date(),
      verificationDetails: insertName.verificationDetails || null
    };
    this.generatedNames.set(id, name);
    return name;
  }

  async getGeneratedNames(limit: number = 50): Promise<GeneratedName[]> {
    const names = Array.from(this.generatedNames.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return names.slice(0, limit);
  }

  async getGeneratedNamesByType(type: string, limit: number = 50): Promise<GeneratedName[]> {
    const names = Array.from(this.generatedNames.values())
      .filter(name => name.type === type)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return names.slice(0, limit);
  }
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<any | undefined> {
    // User functionality not currently used but kept for interface compatibility
    return undefined;
  }

  async getUserByUsername(username: string): Promise<any | undefined> {
    // User functionality not currently used but kept for interface compatibility
    return undefined;
  }

  async createUser(insertUser: any): Promise<any> {
    // User functionality not currently used but kept for interface compatibility
    return insertUser;
  }

  async createGeneratedName(insertName: InsertGeneratedName): Promise<GeneratedName> {
    const [name] = await db
      .insert(generatedNames)
      .values(insertName)
      .returning();
    return name;
  }

  async getGeneratedNames(limit: number = 50): Promise<GeneratedName[]> {
    const names = await db
      .select()
      .from(generatedNames)
      .orderBy(desc(generatedNames.createdAt))
      .limit(limit);
    return names;
  }

  async getGeneratedNamesByType(type: string, limit: number = 50): Promise<GeneratedName[]> {
    const names = await db
      .select()
      .from(generatedNames)
      .where(eq(generatedNames.type, type))
      .orderBy(desc(generatedNames.createdAt))
      .limit(limit);
    return names;
  }
}

export const storage = new DatabaseStorage();
