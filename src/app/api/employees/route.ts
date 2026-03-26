import { NextRequest, NextResponse } from "next/server";
import "server-only";
import db from "@/lib/db";
import * as schema from "@/db/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import { employeeSchema } from "@/lib/validations";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brandId");
    const isActive = searchParams.get("isActive");

    const conditions = [];
    if (brandId) conditions.push(eq(schema.employees.brandId, brandId));
    if (isActive !== null)
      conditions.push(
        eq(schema.employees.isActive, isActive === "true"),
      );

    const employees = await db
      .select()
      .from(schema.employees)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return NextResponse.json({ success: true, data: employees });
  } catch (error) {
    console.error("Error fetching employees:", error);
    return NextResponse.json(
      { error: "Failed to fetch employees" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const validated = employeeSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid input", errors: validated.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { data } = validated;
    const employee = await db
      .insert(schema.employees)
      .values({
        id: crypto.randomUUID(),
        ...data,
        salaryAmount: data.salaryAmount.toString(),
      })
      .returning();

    return NextResponse.json(
      { success: true, data: employee[0] },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating employee:", error);
    return NextResponse.json(
      { error: "Failed to create employee" },
      { status: 500 },
    );
  }
}
