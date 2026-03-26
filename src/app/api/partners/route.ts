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

    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brandId");

    let query = db
      .select()
      .from(schema.partners)
      .$dynamic();

    if (brandId) {
      query = query.where(eq(schema.partners.brandId, brandId));
    }

    const partners = await query.orderBy(desc(schema.partners.createdAt));

    return NextResponse.json({ success: true, data: partners });
  } catch (error) {
    console.error("Error fetching partners:", error);
    return NextResponse.json(
      { error: "Failed to fetch partners" },
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
    const partner = await db
      .insert(schema.partners)
      .values({
        id: crypto.randomUUID(),
        ...body,
      })
      .returning();

    return NextResponse.json(
      { success: true, data: partner[0] },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating partner:", error);
    return NextResponse.json(
      { error: "Failed to create partner" },
      { status: 500 },
    );
  }
}
