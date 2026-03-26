import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const globalForDb = globalThis as typeof globalThis & {
  db?: ReturnType<typeof drizzle>;
};

let cachedDb: ReturnType<typeof drizzle> | null = null;

function createDb() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error("DATABASE_URL is not set");
    throw new Error("DATABASE_URL is not set. Please configure your database URL in environment variables.");
  }

  try {
    const client = postgres(connectionString, {
      max: 1, // Limit connections for Cloudflare Workers
      idle_timeout: 10,
      connect_timeout: 10,
    });
    return drizzle(client);
  } catch (error) {
    console.error("Failed to create database connection:", error);
    throw error;
  }
}

// Initialize database lazily, not at module load
function getDb(): ReturnType<typeof drizzle> {
  if (cachedDb) return cachedDb;
  
  try {
    cachedDb = globalForDb.db ?? createDb();
    if (process.env.NODE_ENV !== "production") {
      globalForDb.db = cachedDb;
    }
    return cachedDb;
  } catch (error) {
    console.error("Database initialization error:", error);
    throw error;
  }
}

export default new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop) {
    const db = getDb();
    return (db as any)[prop];
  },
});
