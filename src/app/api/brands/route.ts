import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";
import { eq, or } from "drizzle-orm";
import { brands, brandMembers, auditLogs, users as usersTable } from "@/db/schema";
import { brandSchema, type BrandInput } from "@/lib/validations";
import { slugify } from "@/lib/utils";
import type { ActionResponse } from "@/types";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json([], { status: 403 });
    }

    let brandsList: Array<{
      id: string;
      name: string;
      slug: string;
      description: string | null;
      logoUrl: string | null;
      isActive: boolean;
      ownerId: string;
      createdAt: Date;
      updatedAt: Date | null;
      owner: { id: string; name: string; email: string };
    }> = [];

    if (session.user.role === "ADMIN") {
      brandsList = await db
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
        .where(eq(brands.isActive, true))
        .orderBy(brands.name);
    } else {
      const userBrandMembers = await db
        .select({ brandId: brandMembers.brandId })
        .from(brandMembers)
        .where(eq(brandMembers.userId, session.user.id));

      // Get the actual brands
      if (userBrandMembers.length > 0) {
        const brandIds = userBrandMembers.map((bm) => bm.brandId);
        brandsList = await db
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
          .where(or(...brandIds.map((id) => eq(brands.id, id))))
          .orderBy(brands.name);
      }
    }

    return NextResponse.json(brandsList);
  } catch (error) {
    console.error("Get brands error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch brands",
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ActionResponse>> {
  try {
    const session = await getSession();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({
        success: false,
        error: "Unauthorized",
      }, { status: 403 });
    }

    const body = await request.json() as BrandInput;
    const validated = brandSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({
        success: false,
        errors: validated.error.flatten().fieldErrors as Record<
          string,
          string[]
        >,
      }, { status: 400 });
    }

    const data = validated.data;
    let slug = slugify(data.name);

    const existingSlug = await db
      .select({ id: brands.id })
      .from(brands)
      .where(eq(brands.slug, slug))
      .limit(1);

    if (existingSlug && existingSlug.length > 0) {
      slug = `${slug}-${Date.now()}`;
    }

    const result = await db.insert(brands).values({
      id: crypto.randomUUID(),
      name: data.name,
      slug,
      description: data.description || null,
      logoUrl: data.logoUrl || null,
      ownerId: session.user.id,
    }).returning();

    const brand = result[0];

    await db.insert(brandMembers).values({
      id: crypto.randomUUID(),
      brandId: brand.id,
      userId: session.user.id,
      role: "ADMIN",
    });

    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "BRAND_CREATED",
      entityType: "BRAND",
      entityId: brand.id,
      newData: data,
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "",
      userAgent: request.headers.get("user-agent") || "",
    });

    return NextResponse.json({
      success: true,
      data: brand,
    });
  } catch (error) {
    console.error("Create brand error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to create brand",
    }, { status: 500 });
  }
}
