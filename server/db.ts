import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure WebSocket only in development
if (process.env.NODE_ENV === "development") {
  neonConfig.webSocketConstructor = ws;
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Optimized connection pool configuration
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
  // Connection pool optimization
  max: 20, // Maximum number of connections in the pool
  min: 5,  // Minimum number of connections to maintain
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 10000, // Wait 10 seconds for connection
  maxUses: 7500, // Maximum number of times a connection can be used
  allowExitOnIdle: false, // Don't allow process to exit with idle connections
});

// Database connection with optimized configuration
export const db = drizzle({ client: pool, schema });

// Database initialization function to create indexes
export async function initializeDatabase() {
  try {
    console.log("Initializing database indexes...");
    
    // Create indexes for performance optimization
    await db.execute(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_generated_names_name 
      ON generated_names(name);
    `);
    
    await db.execute(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_generated_names_type 
      ON generated_names(type);
    `);
    
    await db.execute(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_generated_names_verification_status 
      ON generated_names("verificationStatus");
    `);
    
    await db.execute(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_generated_names_created_at 
      ON generated_names("createdAt");
    `);
    
    await db.execute(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_generated_names_type_name 
      ON generated_names(type, name);
    `);
    
    await db.execute(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_generated_names_verification_created 
      ON generated_names("verificationStatus", "createdAt");
    `);
    
    console.log("✓ Database indexes created successfully");
  } catch (error) {
    // Indexes might already exist, which is fine
    console.log("Database indexes already exist or creation failed:", error);
  }
}

// Connection health check
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await db.execute('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

// Graceful shutdown
export async function closeDatabaseConnection(): Promise<void> {
  try {
    await pool.end();
    console.log('Database connection pool closed');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
}
