// src/lib/auth.ts
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { eq, and, lt } from "drizzle-orm";
import db from "./db";
import { users, sessions } from "@/db/schema";
import type { UserRole, UserStatus } from "@/lib/types/enums";

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Get secret lazily (not at module load time)
function getSecret(): Uint8Array {
  return new TextEncoder().encode(getRequiredEnv("BETTER_AUTH_SECRET"));
}

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
  const secret = getSecret();
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
    const secret = getSecret();
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

  // Fetch user to include all data in JWT
  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const user = userResult[0];

  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  // Create token with all user data (no DB call needed on getSession)
  const token = await createToken(
    {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      sessionId: crypto.randomUUID(),
    },
    "7d",
  );

  const sessionId = crypto.randomUUID();

  await db.insert(sessions).values({
    id: sessionId,
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

    // Verify JWT signature first
    const payload = await verifyToken(token);
    if (!payload) return null;

    // JWT is the source of truth (it's cryptographically signed)
    // All fields should be in the JWT from createSession
    if (!payload.userId) return null;

    // Use JWT fields directly, but validate they exist
    const userId = payload.userId as string;
    const email = (payload.email as string) || "unknown@example.com";
    const name = (payload.name as string) || "User";
    const role = (payload.role as string || "CLIENT") as UserRole;
    const status = (payload.status as string || "ACTIVE") as UserStatus;
    const expiresAt = payload.exp ? new Date((payload.exp as number) * 1000) : new Date();

    // Optional: Verify session still exists in DB (with timeout for performance)
    // Skip if JWT is still valid and recently created
    const dbQueryPromise = (async () => {
      try {
        const result = await db
          .select({ id: sessions.id, expiresAt: sessions.expiresAt })
          .from(sessions)
          .where(eq(sessions.token, token))
          .limit(1);

        if (!result || result.length === 0) {
          // Session was invalidated
          return false;
        }

        // Session exists and is valid
        return true;
      } catch (error) {
        // DB error - assume session is valid based on JWT
        console.warn("Session verification DB error (using JWT):", error);
        return true;
      }
    })();

    // Set timeout - default to valid if DB is slow
    const timeoutPromise = new Promise<boolean>((resolve) => {
      setTimeout(() => {
        console.warn("Session DB verification timeout - trusting JWT");
        resolve(true);
      }, 5000);
    });

    const isValid = await Promise.race([dbQueryPromise, timeoutPromise]);

    if (!isValid) {
      return null;
    }

    return {
      user: {
        id: userId,
        email,
        name,
        role,
        status,
      },
      token,
      expiresAt,
    };
  } catch (error) {
    console.error("Session retrieval error:", error);
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
