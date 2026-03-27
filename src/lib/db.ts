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

  const client = postgres(connectionString, {
    max: 10,                    // Connection pool size
    idle_timeout: 30,           // Seconds before closing idle connections
    connect_timeout: 30,        // Seconds to establish new connection
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
