import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { brands, transactions, auditLogs, users as usersTable } from "@/db/schema";
import { brandSchema, type BrandInput } from "@/lib/validations";
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

    if (!session) {
      return NextResponse.json(null, { status: 403 });
    }

    const brandResult = await db
      .select({
        id: brands.id,
        name: brands.name,
        slug: brands.slug,
        description: brands.description,
        logoUrl: brands.logoUrl,
        isActive: brands.isActive,
        ownerId: brands.ownerId,
        createdAt: brands.createdAt,
        updatedAt: brands.updatedAt,
        owner: {
          id: usersTable.id,
          name: usersTable.name,
          email: usersTable.email,
        },
      })
      .from(brands)
      .innerJoin(usersTable, eq(brands.ownerId, usersTable.id))
      .where(eq(brands.id, id))
      .limit(1);

    const brand = brandResult[0];

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    return NextResponse.json(brand);
  } catch (error) {
    console.error("Get brand error:", error);
    return NextResponse.json({
      error: "Failed to fetch brand",
    }, { status: 500 });
  }
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

    const body = await request.json() as Partial<BrandInput>;
    const validated = brandSchema.partial().safeParse(body);

    if (!validated.success) {
      return NextResponse.json({
        success: false,
        errors: validated.error.flatten().fieldErrors as Record<
          string,
          string[]
        >,
      }, { status: 400 });
    }

    const existingResult = await db
      .select()
      .from(brands)
      .where(eq(brands.id, id))
      .limit(1);

    const existing = existingResult[0];

    if (!existing) {
      return NextResponse.json({
        success: false,
        error: "Brand not found",
      }, { status: 404 });
    }

    const updateData: any = {};
    if (validated.data.name !== undefined) updateData.name = validated.data.name;
    if (validated.data.description !== undefined) updateData.description = validated.data.description;
    if (validated.data.logoUrl !== undefined) updateData.logoUrl = validated.data.logoUrl;

    const result = await db.update(brands).set(updateData).where(eq(brands.id, id)).returning();
    const brand = result[0];

    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "BRAND_UPDATED",
      entityType: "BRAND",
      entityId: id,
      oldData: { name: existing.name, description: existing.description, logoUrl: existing.logoUrl },
      newData: updateData,
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "",
      userAgent: request.headers.get("user-agent") || "",
    });

    return NextResponse.json({
      success: true,
      data: brand,
    });
  } catch (error) {
    console.error("Update brand error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to update brand",
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

    const brandResult = await db
      .select()
      .from(brands)
      .where(eq(brands.id, id))
      .limit(1);

    const brand = brandResult[0];

    if (!brand) {
      return NextResponse.json({
        success: false,
        error: "Brand not found",
      }, { status: 404 });
    }

    // Check if there are transactions
    const transactionResult = await db
      .select({ id: transactions.id })
      .from(transactions)
      .where(eq(transactions.brandId, id))
      .limit(1);

    if (transactionResult && transactionResult.length > 0) {
      // Soft delete
      await db.update(brands).set({ isActive: false }).where(eq(brands.id, id));
    } else {
      // Hard delete
      await db.delete(brands).where(eq(brands.id, id));
    }

    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "BRAND_DELETED",
      entityType: "BRAND",
      entityId: id,
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "",
      userAgent: request.headers.get("user-agent") || "",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete brand error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to delete brand",
    }, { status: 500 });
  }
}
