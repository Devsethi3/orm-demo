import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  inviteSchema,
  type InviteInput,
} from "@/lib/validations";
import { eq, and } from "drizzle-orm";
import { users, invites, auditLogs } from "@/db/schema";
import { generateToken } from "@/lib/utils";
import type { ActionResponse } from "@/types";

export async function POST(request: NextRequest): Promise<NextResponse<ActionResponse>> {
  try {
    const session = await getSession();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({
        success: false,
        error: "Unauthorized",
      }, { status: 403 });
    }

    const body = await request.json() as InviteInput;
    const validated = inviteSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({
        success: false,
        errors: validated.error.flatten().fieldErrors as Record<
          string,
          string[]
        >,
      }, { status: 400 });
    }

    const { email, role, brandId } = validated.data;

    const existingUserResult = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (existingUserResult && existingUserResult.length > 0) {
      return NextResponse.json({
        success: false,
        error: "A user with this email already exists",
      }, { status: 400 });
    }

    const now = new Date();
    const existingInviteResult = await db
      .select()
      .from(invites)
      .where(
        and(
          eq(invites.email, email.toLowerCase()),
          eq(invites.status, "PENDING"),
        ),
      )
      .limit(1);

    const existingInvite = existingInviteResult[0];
    if (existingInvite && existingInvite.expiresAt > now) {
      return NextResponse.json({
        success: false,
        error: "An active invite already exists for this email",
      }, { status: 400 });
    }

    const token = generateToken(48);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invite = await db.insert(invites).values({
      id: crypto.randomUUID(),
      email: email.toLowerCase(),
      role,
      token,
      status: "PENDING",
      expiresAt,
      invitedById: session.user.id,
      brandId: brandId || null,
    }).returning();

    console.log(
      `\n📧 Invite link: ${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}\n`,
    );

    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "INVITE_SENT",
      entityType: "INVITE",
      entityId: invite[0].id,
      newData: { email, role },
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "",
      userAgent: request.headers.get("user-agent") || "",
    });

    return NextResponse.json({
      success: true,
      data: { inviteId: invite[0].id, token },
    });
  } catch (error) {
    console.error("Send invite error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to send invite. Please try again.",
    }, { status: 500 });
  }
}
