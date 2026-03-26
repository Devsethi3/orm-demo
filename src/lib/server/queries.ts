// src/lib/server/queries.ts
// Drizzle query helpers for server-side operations
import db from "@/lib/db";
import { eq, and, desc, asc } from "drizzle-orm";
import { users as usersTable, sessions } from "@/db/schema";

export async function findUserByEmail(email: string) {
  const result = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()))
    .limit(1);
  return result[0] || null;
}

export async function findUserById(id: string) {
  const result = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, id))
    .limit(1);
  return result[0] || null;
}

export async function findSessionByToken(token: string) {
  const result = await db
    .select({
      sessionId: sessions.id,
      sessionToken: sessions.token,
      expiresAt: sessions.expiresAt,
      userId: usersTable.id,
      userEmail: usersTable.email,
      userName: usersTable.name,
      userRole: usersTable.role,
      userStatus: usersTable.status,
    })
    .from(sessions)
    .innerJoin(usersTable, eq(sessions.userId, usersTable.id))
    .where(eq(sessions.token, token))
    .limit(1);
  
  if (!result || result.length === 0) return null;
  
  const sessionRecord = result[0];
  return {
    id: sessionRecord.sessionId,
    token: sessionRecord.sessionToken,
    expiresAt: sessionRecord.expiresAt,
    userId: sessionRecord.userId,
    user: {
      id: sessionRecord.userId,
      email: sessionRecord.userEmail,
      name: sessionRecord.userName,
      role: sessionRecord.userRole,
      status: sessionRecord.userStatus,
    },
  };
}

export async function updateUserLastLogin(userId: string) {
  return db.update(usersTable).set({
    lastLoginAt: new Date(),
  }).where(eq(usersTable.id, userId));
}
