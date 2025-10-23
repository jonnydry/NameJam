import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { secureLog } from "./utils/secureLogger";

// Configure WebSocket for local development (not needed in Replit)
if (process.env.REPL_ID === undefined && process.env.NODE_ENV === "development") {
  neonConfig.webSocketConstructor = ws;
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Replit's Neon database always needs SSL override
  ssl: { rejectUnauthorized: false },
  // Add connection resilience
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Add connection error handling
pool.on('error', (err) => {
  secureLog.error('Unexpected database pool error', err);
});

export const db = drizzle({ client: pool, schema });
