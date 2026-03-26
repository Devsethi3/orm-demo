import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession, invalidateAllUserSessions } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { users as usersTable, auditLogs } from "@/db/schema";
import type { ActionResponse } from "@/types";
import type { UserStatus } from "@/lib/types/enums";

interface RouteParams {
  id: string;
}

interface UpdateStatusBody {
  status: UserStatus;
}

export async function PUT(
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
        error: "Cannot change your own status",
      }, { status: 400 });
    }

    const body = await request.json() as UpdateStatusBody;

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

    await db.update(usersTable).set({
      status: body.status,
    }).where(eq(usersTable.id, id));

    // Invalidate sessions if suspending
    if (body.status === "SUSPENDED") {
      await invalidateAllUserSessions(id);
    }

    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "USER_STATUS_UPDATED",
      entityType: "USER",
      entityId: id,
      oldData: { status: user.status },
      newData: { status: body.status },
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "",
      userAgent: request.headers.get("user-agent") || "",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update user status error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to update user status",
    }, { status: 500 });
  }
}
