import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { users as usersTable } from "@/db/schema";
import type { ActionResponse } from "@/types";

interface RouteParams {
  id: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const session = await getSession();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(null, { status: 403 });
    }

    const userResult = await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        role: usersTable.role,
        status: usersTable.status,
        lastLoginAt: usersTable.lastLoginAt,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1);

    const user = userResult[0];

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json({
      error: "Failed to fetch user",
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
): Promise<NextResponse<ActionResponse>> {
  try {
    const { id } = await params;
    const session = await getSession();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({
        success: false,
        error: "Unauthorized",
      }, { status: 403 });
    }

    if (id === session.user.id) {
      return NextResponse.json({
        success: false,
        error: "Cannot delete your own account",
      }, { status: 400 });
    }

    const userResult = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1);

    const user = userResult[0];

    if (!user) {
      return NextResponse.json({
        success: false,
        error: "User not found",
      }, { status: 404 });
    }

    // For now, soft delete by suspending
    await db.update(usersTable).set({
      status: "SUSPENDED",
    }).where(eq(usersTable.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to delete user",
    }, { status: 500 });
  }
}
