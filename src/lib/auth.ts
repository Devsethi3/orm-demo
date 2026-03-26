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

    const payload = await verifyToken(token);
    if (!payload) return null;

    // Use a race condition with timeout to prevent hanging on slow databases
    // If database is slow, fall back to JWT claims (better than timeout)
    const dbQueryPromise = (async () => {
      try {
        const result = await db
          .select({
            id: sessions.id,
            token: sessions.token,
            expiresAt: sessions.expiresAt,
            userId: sessions.userId,
            userId2: users.id,
            email: users.email,
            name: users.name,
            role: users.role,
            status: users.status,
          })
          .from(sessions)
          .innerJoin(users, eq(sessions.userId, users.id))
          .where(eq(sessions.token, token))
          .limit(1);

        if (!result || result.length === 0) {
          // Session not in database - it may have been invalidated
          return null;
        }

        const session = result[0];

        if (session.expiresAt < new Date()) {
          try {
            await db.delete(sessions).where(eq(sessions.token, token));
          } catch (e) {
            // Ignore cleanup errors
          }
          return null;
        }

        if (session.status !== "ACTIVE") {
          return null;
        }

        return {
          user: {
            id: session.userId2,
            email: session.email,
            name: session.name,
            role: session.role as UserRole,
            status: session.status as UserStatus,
          },
          token: session.token,
          expiresAt: session.expiresAt,
        };
      } catch (dbError) {
        console.error("getSession database error:", dbError);
        // Fall back to JWT claims if database fails
        
        // Validate JWT fields exist
        if (!payload.userId || !payload.email || !payload.name || !payload.role || !payload.status) {
          console.error("JWT claims incomplete on database error:", { 
            hasUserId: !!payload.userId,
            hasEmail: !!payload.email, 
            hasName: !!payload.name,
            hasRole: !!payload.role,
            hasStatus: !!payload.status
          });
          return null;
        }

        return {
          user: {
            id: payload.userId as string,
            email: payload.email as string,
            name: payload.name as string,
            role: payload.role as UserRole,
            status: payload.status as UserStatus,
          },
          token,
          expiresAt: payload.exp ? new Date((payload.exp as number) * 1000) : new Date(),
        };
      }
    })();

    // Set a timeout - if database doesn't respond in 2 seconds, use JWT claims
    // (Cloudflare Workers: TCP connections aren't supported, so DB will always timeout)
    const timeoutPromise = new Promise<Session | null>((resolve) => {
      setTimeout(() => {
        console.warn("Database query timeout - falling back to JWT claims");
        
        // Validate JWT fields exist before using them
        if (!payload.userId || !payload.email || !payload.name || !payload.role || !payload.status) {
          console.error("JWT claims incomplete:", { 
            hasUserId: !!payload.userId,
            hasEmail: !!payload.email, 
            hasName: !!payload.name,
            hasRole: !!payload.role,
            hasStatus: !!payload.status
          });
          resolve(null);
          return;
        }

        resolve({
          user: {
            id: payload.userId as string,
            email: payload.email as string,
            name: payload.name as string,
            role: payload.role as UserRole,
            status: payload.status as UserStatus,
          },
          token,
          expiresAt: payload.exp ? new Date((payload.exp as number) * 1000) : new Date(),
        });
      }, 2000);
    });

    return Promise.race([dbQueryPromise, timeoutPromise]);
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
