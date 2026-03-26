import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { users as usersTable, auditLogs } from "@/db/schema";
import { updateProfileNameSchema, type UpdateProfileNameInput } from "@/lib/validations";
import type { ActionResponse } from "@/types";

export async function PUT(request: NextRequest): Promise<NextResponse<ActionResponse>> {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({
        success: false,
        error: "Unauthorized",
      }, { status: 403 });
    }

    const body = await request.json() as UpdateProfileNameInput;
    const validated = updateProfileNameSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({
        success: false,
        errors: validated.error.flatten().fieldErrors as Record<
          string,
          string[]
        >,
      }, { status: 400 });
    }

    const { name } = validated.data;

    const currentUserResult = await db
      .select({ id: usersTable.id, name: usersTable.name })
      .from(usersTable)
      .where(eq(usersTable.id, session.user.id))
      .limit(1);

    const currentUser = currentUserResult[0];

    if (!currentUser) {
      return NextResponse.json({
        success: false,
        error: "User not found",
      }, { status: 404 });
    }

    if (currentUser.name === name) {
      return NextResponse.json({
        success: true,
        data: { name },
      });
    }

    await db.update(usersTable).set({
      name,
    }).where(eq(usersTable.id, session.user.id));

    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "USER_NAME_UPDATED",
      entityType: "USER",
      entityId: session.user.id,
      oldData: { name: currentUser.name },
      newData: { name },
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "",
      userAgent: request.headers.get("user-agent") || "",
    });

    return NextResponse.json({
      success: true,
      data: { name },
    });
  } catch (error) {
    console.error("Update user profile error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to update profile",
    }, { status: 500 });
  }
}
