import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const globalForDb = globalThis as typeof globalThis & {
  db?: ReturnType<typeof drizzle>;
};

function createDb() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  // WARNING: Cloudflare Workers do NOT support TCP connections.
  // postgres-js requires TCP which will always timeout on Workers.
  // This app needs to switch to:
  // - Neon HTTP API + @neondatabase/serverless
  // - Cloudflare D1 (SQLite)
  // - Prisma Data Proxy + HTTP adapter
  // For now, keep postgres-js with aggressive timeouts to handle Worker limitations
  
  const client = postgres(connectionString, {
    max: 1,
    idle_timeout: 5,
    connect_timeout: 3,  // Reduced: TCP won't work on Workers anyway
  });
  return drizzle(client);
}

let cachedDb: ReturnType<typeof drizzle> | null = null;

export function getDb(): ReturnType<typeof drizzle> {
  if (cachedDb) return cachedDb;
  cachedDb = globalForDb.db ?? createDb();
  if (process.env.NODE_ENV !== "production") {
    globalForDb.db = cachedDb;
  }
  return cachedDb;
}

export default getDb();
