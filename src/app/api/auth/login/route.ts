import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import {
  hashPassword,
  verifyPassword,
  createSession,
} from "@/lib/auth";
import {
  loginSchema,
  type LoginInput,
} from "@/lib/validations";
import { eq } from "drizzle-orm";
import { users, auditLogs } from "@/db/schema";
import type { ActionResponse } from "@/types";

export async function POST(request: NextRequest): Promise<NextResponse<ActionResponse>> {
  try {
    const body = await request.json() as LoginInput;

    const validated = loginSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({
        success: false,
        errors: validated.error.flatten().fieldErrors as Record<
          string,
          string[]
        >,
      }, { status: 400 });
    }

    const { email, password } = validated.data;

    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    const user = userResult[0];

    if (!user) {
      return NextResponse.json({
        success: false,
        error: "Invalid email or password",
      }, { status: 401 });
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json({
        success: false,
        error: "Your account is not active. Please contact an administrator.",
      }, { status: 403 });
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash);

    if (!isValidPassword) {
      return NextResponse.json({
        success: false,
        error: "Invalid email or password",
      }, { status: 401 });
    }

    const token = await createSession(user.id);

    const response = NextResponse.json({ success: true });
    
    response.cookies.set("session", token, {
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
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "",
      userAgent: request.headers.get("user-agent") || "",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({
      success: false,
      error: "An unexpected error occurred. Please try again.",
    }, { status: 500 });
  }
}
