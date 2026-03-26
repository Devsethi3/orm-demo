import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";
import { users as usersTable } from "@/db/schema";
import type { UserWithRelations } from "@/types";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json([], { status: 403 });
    }

    const usersList = await db.query.users.findMany({
      columns: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: (users, { desc }) => [desc(users.createdAt)],
    });

    return NextResponse.json(usersList as UserWithRelations[]);
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch users",
    }, { status: 500 });
  }
}
