// src/lib/auth.ts
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import db from "./db";
import type { UserRole, UserStatus } from "@/lib/types/enums";
import { eq, and, lt } from "drizzle-orm";
import { users, sessions } from "@/db/schema";

const secret = new TextEncoder().encode(
  process.env.BETTER_AUTH_SECRET || (() => {
    throw new Error("BETTER_AUTH_SECRET environment variable is required");
  })(),
);

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
}

export interface Session {
  user: SessionUser;
  token: string;
  expiresAt: Date;
}

// Password utilities
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// JWT utilities
export async function createToken(
  payload: Record<string, unknown>,
  expiresIn: string = "7d",
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);
}

export async function verifyToken(
  token: string,
): Promise<Record<string, unknown> | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}

// Session management
export async function createSession(
  userId: string,
  userAgent?: string,
  ipAddress?: string,
): Promise<string> {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const token = await createToken(
    { userId, sessionId: crypto.randomUUID() },
    "7d",
  );

  await db.insert(sessions).values({
    id: crypto.randomUUID(),
    userId,
    token,
    expiresAt,
    userAgent,
    ipAddress,
    createdAt: new Date(),
  });

  // Update last login
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, userId));

  return token;
}

export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if (!token) return null;

    const payload = await verifyToken(token);
    if (!payload) return null;

    const result = await db
      .select({
        sessionId: sessions.id,
        sessionToken: sessions.token,
        expiresAt: sessions.expiresAt,
        userId: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        status: users.status,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(eq(sessions.token, token))
      .limit(1);

    if (!result || result.length === 0) return null;

    const sessionRecord = result[0];

    if (sessionRecord.expiresAt < new Date()) {
      await db.delete(sessions).where(eq(sessions.token, token));
      return null;
    }

    if (sessionRecord.status !== "ACTIVE") {
      return null;
    }

    return {
      user: {
        id: sessionRecord.userId,
        email: sessionRecord.email,
        name: sessionRecord.name,
        role: sessionRecord.role,
        status: sessionRecord.status,
      } as SessionUser,
      token: sessionRecord.sessionToken,
      expiresAt: sessionRecord.expiresAt,
    };
  } catch (error) {
    console.error("Get session error:", error);
    return null;
  }
}

export async function invalidateSession(token: string): Promise<void> {
  try {
    await db.delete(sessions).where(eq(sessions.token, token));
  } catch (error) {
    console.error("Invalidate session error:", error);
  }
}

export async function invalidateAllUserSessions(userId: string): Promise<void> {
  try {
    await db.delete(sessions).where(eq(sessions.userId, userId));
  } catch (error) {
    console.error("Invalidate all sessions error:", error);
  }
}

// Role-based access control
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  ADMIN: ["*"],
  ACCOUNT_EXECUTIVE: [
    "dashboard:read",
    "transactions:read",
    "transactions:write",
    "brands:read",
    "projects:read",
    "projects:write",
  ],
  PARTNER: [
    "dashboard:read",
    "partner:read",
    "withdrawals:read",
    "withdrawals:write",
  ],
  CLIENT: ["dashboard:read", "transactions:read", "invoices:read"],
};

export function hasPermission(role: UserRole, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions.includes("*") || permissions.includes(permission);
}

export function canAccessRoute(role: UserRole, route: string): boolean {
  const routePermissions: Record<string, UserRole[]> = {
    "/dashboard": [
      "ADMIN",
      "ACCOUNT_EXECUTIVE",
      "PARTNER",
      "CLIENT",
    ],
    "/dashboard/transactions": ["ADMIN", "ACCOUNT_EXECUTIVE", "CLIENT"],
    "/dashboard/subscriptions": ["ADMIN"],
    "/dashboard/users": ["ADMIN"],
    "/dashboard/invites": ["ADMIN"],
    "/dashboard/employees": ["ADMIN", "ACCOUNT_EXECUTIVE"],
    "/dashboard/partners": ["ADMIN", "ACCOUNT_EXECUTIVE", "PARTNER"],
    "/dashboard/brands": ["ADMIN", "ACCOUNT_EXECUTIVE"],
    "/dashboard/settings": ["ADMIN"],
  };

  const allowedRoles = routePermissions[route];
  if (!allowedRoles) return role === "ADMIN";
  return allowedRoles.includes(role);
}
