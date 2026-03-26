import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/db/schema";

const globalForDb = globalThis as unknown as {
  drizzle: ReturnType<typeof drizzle<typeof schema>> | undefined;
};

function createDrizzleClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const sql = neon(connectionString);
  return drizzle(sql, { schema });
}
  
const db = globalForDb.drizzle ?? createDrizzleClient();

if (process.env.NODE_ENV !== "production") {
  globalForDb.drizzle = db;
}

export default db;
