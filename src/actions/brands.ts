"use server";

import { revalidatePath } from "next/cache";
import { eq, count } from "drizzle-orm";
import db from "@/lib/db";
import { getSession, hasPermission } from "@/lib/auth";
import { brandSchema, type BrandInput } from "@/lib/validations";
import { slugify } from "@/lib/utils";
import type { ActionResponse } from "@/types";
import { brands, brandMembers, auditLogs, users, transactions, projects, employees } from "@/db/schema";

export async function createBrand(input: BrandInput): Promise<ActionResponse> {
  try {
    const session = await getSession();

    if (!session || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    const validated = brandSchema.safeParse(input);

    if (!validated.success) {
      return {
        success: false,
        errors: validated.error.flatten().fieldErrors as Record<
          string,
          string[]
        >,
      };
    }

    const data = validated.data;
    let slug = slugify(data.name);

    const existingSlugResult = await db
      .select()
      .from(brands)
      .where(eq(brands.slug, slug))
      .limit(1);

    if (existingSlugResult.length > 0) {
      slug = `${slug}-${Date.now()}`;
    }

    const brandId = crypto.randomUUID();
    await db.insert(brands).values({
      id: brandId,
      name: data.name,
      slug,
      description: data.description || null,
      logoUrl: data.logoUrl || null,
      ownerId: session.user.id,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.insert(brandMembers).values({
      id: crypto.randomUUID(),
      brandId,
      userId: session.user.id,
      role: "ADMIN",
      createdAt: new Date(),
    });

    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "BRAND_CREATED",
      entityType: "BRAND",
      entityId: brandId,
      newData: JSON.stringify(data),
      createdAt: new Date(),
    });

    const brand = { id: brandId, name: data.name, slug };

    revalidatePath("/dashboard/brands");

    return { success: true, data: brand };
  } catch (error) {
    console.error("Create brand error:", error);
    return { success: false, error: "Failed to create brand" };
  }
}

export async function getBrands() {
  const session = await getSession();

  if (!session) return [];

  // Single query - just get brands without counts
  const brandsList = await db
    .select({
      id: brands.id,
      name: brands.name,
      slug: brands.slug,
      description: brands.description,
      logoUrl: brands.logoUrl,
      ownerId: brands.ownerId,
      isActive: brands.isActive,
      createdAt: brands.createdAt,
      updatedAt: brands.updatedAt,
      owner: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(brands)
    .innerJoin(users, eq(brands.ownerId, users.id))
    .where(eq(brands.isActive, true));

  // Return without counts - counts can be fetched on demand if needed
  return brandsList.map((brand) => ({
    ...brand,
    _count: {
      transactions: 0,
      projects: 0,
      employees: 0,
    },
  }));
}

export async function getBrand(id: string) {
  const session = await getSession();

  if (!session) return null;

  const result = await db
    .select()
    .from(brands)
    .where(eq(brands.id, id))
    .limit(1);

  return result[0] || null;
}

export async function updateBrand(
  id: string,
  input: Partial<BrandInput>,
): Promise<ActionResponse> {
  try {
    const session = await getSession();

    if (!session || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    const existingResult = await db
      .select()
      .from(brands)
      .where(eq(brands.id, id))
      .limit(1);

    const existing = existingResult[0];

    if (!existing) {
      return { success: false, error: "Brand not found" };
    }

    await db.update(brands).set({
      name: input.name,
      description: input.description,
      logoUrl: input.logoUrl || null,
      updatedAt: new Date(),
    }).where(eq(brands.id, id));

    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "BRAND_UPDATED",
      entityType: "BRAND",
      entityId: id,
      oldData: JSON.stringify(existing),
      newData: JSON.stringify(input),
      createdAt: new Date(),
    });

    revalidatePath("/dashboard/brands");

    return { success: true, data: { id, ...input } };
  } catch (error) {
    console.error("Update brand error:", error);
    return { success: false, error: "Failed to update brand" };
  }
}

export async function deleteBrand(id: string): Promise<ActionResponse> {
  try {
    const session = await getSession();

    if (!session || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    const brandResult = await db
      .select()
      .from(brands)
      .where(eq(brands.id, id))
      .limit(1);

    const brand = brandResult[0];

    if (!brand) {
      return { success: false, error: "Brand not found" };
    }

    // For now, just soft delete by setting isActive to false
    await db.update(brands).set({
      isActive: false,
      updatedAt: new Date(),
    }).where(eq(brands.id, id));

    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "BRAND_DELETED",
      entityType: "BRAND",
      entityId: id,
      createdAt: new Date(),
    });

    revalidatePath("/dashboard/brands");

    return { success: true };
  } catch (error) {
    console.error("Delete brand error:", error);
    return { success: false, error: "Failed to delete brand" };
  }
}
