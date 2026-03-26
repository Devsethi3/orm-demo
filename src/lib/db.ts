import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const globalForDb = globalThis as typeof globalThis & {
  db?: ReturnType<typeof drizzle>;
};

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

let db: ReturnType<typeof drizzle> | null = null;

try {
  db = globalForDb.db ?? createDb();
  if (process.env.NODE_ENV !== "production") {
    globalForDb.db = db;
  }
} catch (error) {
  console.error("Database initialization error:", error);
  // Don't throw - let it fail gracefully on actual database access
}

export default db!;
