import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import {
  hashPassword,
  createSession,
} from "@/lib/auth";
import {
  acceptInviteSchema,
  type AcceptInviteInput,
} from "@/lib/validations";
import { eq } from "drizzle-orm";
import { users, invites, brandMembers, auditLogs } from "@/db/schema";
import type { ActionResponse } from "@/types";

export async function POST(request: NextRequest): Promise<NextResponse<ActionResponse>> {
  try {
    const body = await request.json() as AcceptInviteInput;
    const validated = acceptInviteSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({
        success: false,
        errors: validated.error.flatten().fieldErrors as Record<
          string,
          string[]
        >,
      }, { status: 400 });
    }

    const { token, name, password } = validated.data;

    const inviteResult = await db
      .select()
      .from(invites)
      .where(eq(invites.token, token))
      .limit(1);

    const invite = inviteResult[0];

    if (!invite) {
      return NextResponse.json({
        success: false,
        error: "Invalid invite link",
      }, { status: 404 });
    }

    if (invite.status !== "PENDING") {
      return NextResponse.json({
        success: false,
        error: "This invite has already been used or revoked",
      }, { status: 400 });
    }

    if (invite.expiresAt < new Date()) {
      await db.update(invites).set({ status: "EXPIRED" }).where(eq(invites.id, invite.id));
      return NextResponse.json({
        success: false,
        error: "This invite has expired",
      }, { status: 410 });
    }

    const passwordHash = await hashPassword(password);

    // Create user with the role from invite
    const createdUserResult = await db.insert(users).values({
      id: crypto.randomUUID(),
      name,
      email: invite.email,
      passwordHash,
      role: invite.role,
      status: "ACTIVE",
    }).returning();

    const user = createdUserResult[0];

    if (invite.brandId) {
      await db.insert(brandMembers).values({
        id: crypto.randomUUID(),
        brandId: invite.brandId,
        userId: user.id,
        role: invite.role,
      });
    }

    await db.update(invites).set({
      status: "ACCEPTED",
      acceptedAt: new Date(),
    }).where(eq(invites.id, invite.id));

    // Create session
    const sessionToken = await createSession(user.id);

    const response = NextResponse.json({ success: true });
    
    response.cookies.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      userId: user.id,
      action: "INVITE_ACCEPTED",
      entityType: "INVITE",
      entityId: invite.id,
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "",
      userAgent: request.headers.get("user-agent") || "",
    });

    return response;
  } catch (error) {
    console.error("Accept invite error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to accept invite. Please try again.",
    }, { status: 500 });
  }
}
