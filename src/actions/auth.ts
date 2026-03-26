"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import db from "@/lib/db";
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
import { eq } from "drizzle-orm";
import { users, invites, brandMembers } from "@/db/schema";

export async function login(input: LoginInput): Promise<ActionResponse> {
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

    const foundUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    const user = foundUsers[0];
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

    return { success: true };
  } catch (error) {
    console.error("Login error:", error);
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

    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (existingUsers.length > 0) {
      return {
        success: false,
        error: "A user with this email already exists",
      };
    }

    const existingInvites = await db
      .select()
      .from(invites)
      .where(eq(invites.email, email.toLowerCase()))
      .limit(1);

    const existingInvite = existingInvites[0];
    if (
      existingInvite &&
      existingInvite.status === "PENDING" &&
      existingInvite.expiresAt &&
      existingInvite.expiresAt > new Date()
    ) {
      return {
        success: false,
        error: "An active invite already exists for this email",
      };
    }

    const token = generateToken(48);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const newInvite = await db
      .insert(invites)
      .values({
        id: crypto.randomUUID(),
        email: email.toLowerCase(),
        role,
        token,
        expiresAt,
        invitedById: session.user.id,
        brandId: brandId || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    console.log(
      `\n📧 Invite link: ${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}\n`,
    );

    revalidatePath("/dashboard/invites");

    return { success: true, data: { inviteId: newInvite[0].id, token } };
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

    const foundInvites = await db
      .select()
      .from(invites)
      .where(eq(invites.token, token))
      .limit(1);

    if (!foundInvites || foundInvites.length === 0) {
      return { success: false, error: "Invalid invite link" };
    }

    const invite = foundInvites[0];

    if (invite.status !== "PENDING") {
      return {
        success: false,
        error: "This invite has already been used or revoked",
      };
    }

    if (invite.expiresAt && invite.expiresAt < new Date()) {
      await db
        .update(invites)
        .set({ status: "EXPIRED" })
        .where(eq(invites.id, invite.id));
      return { success: false, error: "This invite has expired" };
    }

    const passwordHash = await hashPassword(password);

    const newUser = await db
      .insert(users)
      .values({
        id: crypto.randomUUID(),
        email: invite.email,
        name,
        passwordHash,
        role: invite.role,
        status: "ACTIVE",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const user = newUser[0];

    if (invite.brandId) {
      await db.insert(brandMembers).values({
        id: crypto.randomUUID(),
        brandId: invite.brandId,
        userId: user.id,
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

    const sessionToken = await createSession(user.id);

    const cookieStore = await cookies();
    cookieStore.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
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

    await db
      .update(invites)
      .set({ status: "REVOKED" })
      .where(eq(invites.id, inviteId));

    revalidatePath("/dashboard/invites");

    return { success: true };
  } catch (error) {
    console.error("Revoke invite error:", error);
    return {
      success: false,
      error: "Failed to revoke invite. Please try again.",
    };
  }
}

export async function resendInvite(inviteId: string): Promise<ActionResponse> {
  try {
    const session = await getSession();

    if (!session || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    const foundInvites = await db
      .select()
      .from(invites)
      .where(eq(invites.id, inviteId))
      .limit(1);

    const invite = foundInvites[0];
    if (!invite || invite.status !== "PENDING") {
      return { success: false, error: "Invalid invite" };
    }

    const newToken = generateToken(48);
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db
      .update(invites)
      .set({
        token: newToken,
        expiresAt: newExpiresAt,
      })
      .where(eq(invites.id, inviteId));

    console.log(
      `\n📧 New invite link: ${process.env.NEXT_PUBLIC_APP_URL}/invite/${newToken}\n`,
    );

    revalidatePath("/dashboard/invites");

    return { success: true };
  } catch (error) {
    console.error("Resend invite error:", error);
    return { success: false, error: "Failed to resend invite" };
  }
}
