"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq, and, gt } from "drizzle-orm";
import db from "@/lib/db";
import { users, invites, brandMembers, auditLogs } from "@/db/schema";
import {
  hashPassword,
  verifyPassword,
  createSession,
  invalidateSession,
  getSession,
} from "@/lib/auth";
import {
  loginSchema,
  acceptInviteSchema,
  inviteSchema,
  type LoginInput,
  type AcceptInviteInput,
  type InviteInput,
} from "@/lib/validations";
import { generateToken } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import type { ActionResponse } from "@/types";

function getAppBaseUrl(): string {
  const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;

  if (!appUrl) {
    throw new Error(
      "Missing APP_URL or NEXT_PUBLIC_APP_URL. Configure this for invite links.",
    );
  }

  return appUrl;
}

export async function login(input: LoginInput): Promise<ActionResponse> {
  try {
    // Add timeout protection for Cloudflare Workers
    const timeoutPromise = new Promise<ActionResponse>((resolve) => {
      setTimeout(() => {
        resolve({
          success: false,
          error: "Request timeout - please try again",
        });
      }, 15000); // 15 second timeout (increased from 8s for serverless database latency)
    });

    const loginPromise = loginInternal(input);
    return await Promise.race([loginPromise, timeoutPromise]);
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      error: "An unexpected error occurred during login",
    };
  }
}

async function loginInternal(input: LoginInput): Promise<ActionResponse> {
  try {
    const validated = loginSchema.safeParse(input);

    if (!validated.success) {
      return {
        success: false,
        errors: validated.error.flatten().fieldErrors as Record<
          string,
          string[]
        >,
      };
    }

    const { email, password } = validated.data;

    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    const user = result[0];

    if (!user) {
      return {
        success: false,
        error: "Invalid email or password",
      };
    }

    if (user.status !== "ACTIVE") {
      return {
        success: false,
        error: "Your account is not active. Please contact an administrator.",
      };
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash);

    if (!isValidPassword) {
      return {
        success: false,
        error: "Invalid email or password",
      };
    }

    const token = await createSession(user.id);

    const cookieStore = await cookies();
    cookieStore.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      userId: user.id,
      action: "LOGIN",
      entityType: "USER",
      entityId: user.id,
      createdAt: new Date(),
    });

    return { success: true };
  } catch (error) {
    console.error("Login internal error:", error);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;

  if (sessionToken) {
    await invalidateSession(sessionToken);
  }

  cookieStore.delete("session");
  redirect("/login");
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user || null;
}

export async function sendInvite(input: InviteInput): Promise<ActionResponse> {
  try {
    const session = await getSession();

    if (!session || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    const validated = inviteSchema.safeParse(input);

    if (!validated.success) {
      return {
        success: false,
        errors: validated.error.flatten().fieldErrors as Record<
          string,
          string[]
        >,
      };
    }

    const { email, role, brandId } = validated.data;

    const existingUserResult = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);
    const existingUser = existingUserResult[0];

    if (existingUser) {
      return {
        success: false,
        error: "A user with this email already exists",
      };
    }

    const existingInviteResult = await db
      .select()
      .from(invites)
      .where(
        and(
          eq(invites.email, email.toLowerCase()),
          eq(invites.status, "PENDING"),
          gt(invites.expiresAt, new Date()),
        ),
      )
      .limit(1);
    const existingInvite = existingInviteResult[0];

    if (existingInvite) {
      return {
        success: false,
        error: "An active invite already exists for this email",
      };
    }

    const token = generateToken(48);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const inviteId = crypto.randomUUID();

    await db.insert(invites).values({
      id: inviteId,
      email: email.toLowerCase(),
      role,
      token,
      expiresAt,
      invitedById: session.user.id,
      brandId: brandId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Todo: send email with invite link here
    console.log(`\nInvite link: ${getAppBaseUrl()}/invite/${token}\n`);

    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "INVITE_SENT",
      entityType: "INVITE",
      entityId: inviteId,
      createdAt: new Date(),
    });

    revalidatePath("/dashboard/invites");

    return { success: true, data: { inviteId, token } };
  } catch (error) {
    console.error("Send invite error:", error);
    return {
      success: false,
      error: "Failed to send invite. Please try again.",
    };
  }
}

export async function acceptInvite(
  input: AcceptInviteInput,
): Promise<ActionResponse> {
  try {
    const validated = acceptInviteSchema.safeParse(input);

    if (!validated.success) {
      return {
        success: false,
        errors: validated.error.flatten().fieldErrors as Record<
          string,
          string[]
        >,
      };
    }

    const { token, name, password } = validated.data;

    const inviteResult = await db
      .select()
      .from(invites)
      .where(eq(invites.token, token))
      .limit(1);
    const invite = inviteResult[0];

    if (!invite) {
      return { success: false, error: "Invalid invite link" };
    }

    if (invite.status !== "PENDING") {
      return {
        success: false,
        error: "This invite has already been used or revoked",
      };
    }

    if (invite.expiresAt < new Date()) {
      await db
        .update(invites)
        .set({ status: "EXPIRED" })
        .where(eq(invites.id, invite.id));
      return { success: false, error: "This invite has expired" };
    }

    const passwordHash = await hashPassword(password);
    const userId = crypto.randomUUID();

    // Create user with the role from invite
    await db.insert(users).values({
      id: userId,
      name,
      email: invite.email,
      passwordHash,
      role: invite.role,
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    if (invite.brandId) {
      await db.insert(brandMembers).values({
        id: crypto.randomUUID(),
        brandId: invite.brandId,
        userId: userId,
        role: invite.role,
        createdAt: new Date(),
      });
    }

    await db
      .update(invites)
      .set({
        status: "ACCEPTED",
        acceptedAt: new Date(),
      })
      .where(eq(invites.id, invite.id));

    // Create session
    const sessionToken = await createSession(userId);

    const cookieStore = await cookies();
    cookieStore.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      userId: userId,
      action: "ACCEPT_INVITE",
      entityType: "USER",
      entityId: userId,
      createdAt: new Date(),
    });

    return { success: true };
  } catch (error) {
    console.error("Accept invite error:", error);
    return {
      success: false,
      error: "Failed to accept invite. Please try again.",
    };
  }
}

export async function revokeInvite(inviteId: string): Promise<ActionResponse> {
  try {
    const session = await getSession();

    if (!session || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    // ✅ Drizzle syntax
    const inviteResult = await db
      .select()
      .from(invites)
      .where(eq(invites.id, inviteId))
      .limit(1);
    const invite = inviteResult[0];

    if (!invite) {
      return { success: false, error: "Invite not found" };
    }

    if (invite.status !== "PENDING") {
      return { success: false, error: "Only pending invites can be revoked" };
    }

    // ✅ Drizzle syntax
    await db
      .update(invites)
      .set({ status: "REVOKED", updatedAt: new Date() })
      .where(eq(invites.id, inviteId));

    // ✅ Drizzle syntax
    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "INVITE_REVOKED",
      entityType: "INVITE",
      entityId: inviteId,
      createdAt: new Date(),
    });

    revalidatePath("/dashboard/invites");

    return { success: true };
  } catch (error) {
    console.error("Revoke invite error:", error);
    return { success: false, error: "Failed to revoke invite" };
  }
}

export async function resendInvite(inviteId: string): Promise<ActionResponse> {
  try {
    const session = await getSession();

    if (!session || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    // ✅ Drizzle syntax
    const inviteResult = await db
      .select()
      .from(invites)
      .where(eq(invites.id, inviteId))
      .limit(1);
    const invite = inviteResult[0];

    if (!invite || invite.status !== "PENDING") {
      return { success: false, error: "Invalid invite" };
    }

    const newToken = generateToken(48);
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // ✅ Drizzle syntax
    await db
      .update(invites)
      .set({
        token: newToken,
        expiresAt: newExpiresAt,
        updatedAt: new Date(),
      })
      .where(eq(invites.id, inviteId));

    // Todo: send email with invite link here
    console.log(`\nNew invite link: ${getAppBaseUrl()}/invite/${newToken}\n`);

    revalidatePath("/dashboard/invites");

    return { success: true };
  } catch (error) {
    console.error("Resend invite error:", error);
    return { success: false, error: "Failed to resend invite" };
  }
}
