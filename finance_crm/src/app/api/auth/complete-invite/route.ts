import { db } from "@/db";
import { users, invitations } from "@/db/schema";
import { eq, and, isNull, gt } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { token, email, role } = await request.json();

    if (!token || !email || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Validate the invitation token
    const invite = await db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.token, token),
          eq(invitations.email, email),
          isNull(invitations.usedAt),
          gt(invitations.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (invite.length === 0) {
      return NextResponse.json(
        { error: "Invalid invitation" },
        { status: 400 },
      );
    }

    // Update user role
    await db
      .update(users)
      .set({
        role: role,
        emailVerified: true,
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(users.email, email));

    // Mark invitation as used
    await db
      .update(invitations)
      .set({ usedAt: new Date() })
      .where(eq(invitations.token, token));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Complete invite error:", error);
    return NextResponse.json(
      { error: "Failed to complete invitation" },
      { status: 500 },
    );
  }
}
