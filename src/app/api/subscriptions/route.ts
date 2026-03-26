import { NextRequest, NextResponse } from "next/server";
import "server-only";
import db from "@/lib/db";
import * as schema from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Subscriptions are global - not brand-specific
    const subscriptions = await db
      .select()
      .from(schema.subscriptions)
      .orderBy(desc(schema.subscriptions.createdAt));



    return NextResponse.json({ success: true, data: subscriptions });
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscriptions" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const subscription = await db
      .insert(schema.subscriptions)
      .values({
        id: crypto.randomUUID(),
        ...body,
      })
      .returning();

    return NextResponse.json(
      { success: true, data: subscription[0] },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating subscription:", error);
    return NextResponse.json(
      { error: "Failed to create subscription" },
      { status: 500 },
    );
  }
}
