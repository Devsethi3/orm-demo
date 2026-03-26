// src/lib/auth.ts
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import db from "./db";
import type { UserRole, UserStatus } from "@/lib/types/enums";

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const secret = new TextEncoder().encode(getRequiredEnv("BETTER_AUTH_SECRET"));

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

  await db.session.create({
    data: {
      userId,
      token,
      expiresAt,
      userAgent,
      ipAddress,
    },
  });

  // Update last login
  await db.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  });

  return token;
}

export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if (!token) return null;

    const payload = await verifyToken(token);
    if (!payload) return null;

    const session = await db.session.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            status: true,
          },
        },
      },
    });

    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await db.session.delete({ where: { id: session.id } });
      }
      return null;
    }

    if (session.user.status !== "ACTIVE") {
      return null;
    }

    return {
      user: session.user as SessionUser,
      token: session.token,
      expiresAt: session.expiresAt,
    };
  } catch (error) {
    console.error("Get session error:", error);
    return null;
  }
}

export async function invalidateSession(token: string): Promise<void> {
  try {
    await db.session.deleteMany({
      where: { token },
    });
  } catch (error) {
    console.error("Invalidate session error:", error);
  }
}

export async function invalidateAllUserSessions(userId: string): Promise<void> {
  try {
    await db.session.deleteMany({
      where: { userId },
    });
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
