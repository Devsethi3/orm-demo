"use server";

import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";
import { brandSchema, type BrandInput } from "@/lib/validations";
import { slugify } from "@/lib/utils";
import type { ActionResponse } from "@/types";
import { eq, sql } from "drizzle-orm";
import {
  brands,
  brandMembers,
  transactions,
  auditLogs,
  projects,
  employees,
  users,
} from "@/db/schema";

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

    const existingSlugs = await db
      .select()
      .from(brands)
      .where(eq(brands.slug, slug))
      .limit(1);

    if (existingSlugs.length > 0) {
      slug = `${slug}-${Date.now()}`;
    }

    const brandId = crypto.randomUUID();
    const result = await db
      .insert(brands)
      .values({
        id: brandId,
        name: data.name,
        slug,
        description: data.description || null,
        logoUrl: data.logoUrl || null,
        ownerId: session.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const brand = result[0];

    await db.insert(brandMembers).values({
      id: crypto.randomUUID(),
      brandId: brand.id,
      userId: session.user.id,
      role: "ADMIN",
      createdAt: new Date(),
    });

    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "BRAND_CREATED",
      entityType: "BRAND",
      entityId: brand.id,
      newData: JSON.stringify(data),
    });

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

  const brandList = await db
    .select({
      id: brands.id,
      name: brands.name,
      slug: brands.slug,
      description: brands.description,
      logoUrl: brands.logoUrl,
      isActive: brands.isActive,
      createdAt: brands.createdAt,
      updatedAt: brands.updatedAt,
      ownerId: brands.ownerId,
      owner: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(brands)
    .innerJoin(users, eq(brands.ownerId, users.id))
    .where(eq(brands.isActive, true));

  // Fetch counts for each brand
  const brandsWithCounts = await Promise.all(
    brandList.map(async (brand) => {
      const txCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(transactions)
        .where(eq(transactions.brandId, brand.id));

      const projectCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(projects)
        .where(eq(projects.brandId, brand.id));

      const employeeCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(employees)
        .where(eq(employees.brandId, brand.id));

      return {
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        description: brand.description,
        logoUrl: brand.logoUrl,
        isActive: brand.isActive,
        createdAt: brand.createdAt,
        updatedAt: brand.updatedAt,
        owner: brand.owner,
        _count: {
          transactions: Number(txCountResult[0]?.count || 0),
          projects: Number(projectCountResult[0]?.count || 0),
          employees: Number(employeeCountResult[0]?.count || 0),
        },
      };
    }),
  );

  return brandsWithCounts;
}

export async function getBrand(id: string) {
  const session = await getSession();

  if (!session) return null;

  const brandData = await db
    .select({
      id: brands.id,
      name: brands.name,
      slug: brands.slug,
      description: brands.description,
      logoUrl: brands.logoUrl,
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
    .where(eq(brands.id, id))
    .limit(1);

  if (!brandData || brandData.length === 0) return null;

  const brand = brandData[0];

  const txCountResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(transactions)
    .where(eq(transactions.brandId, id));

  const projectCountResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(projects)
    .where(eq(projects.brandId, id));

  const employeeCountResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(employees)
    .where(eq(employees.brandId, id));

  return {
    id: brand.id,
    name: brand.name,
    slug: brand.slug,
    description: brand.description,
    logoUrl: brand.logoUrl,
    isActive: brand.isActive,
    createdAt: brand.createdAt,
    updatedAt: brand.updatedAt,
    owner: brand.owner,
    _count: {
      transactions: Number(txCountResult[0]?.count || 0),
      projects: Number(projectCountResult[0]?.count || 0),
      employees: Number(employeeCountResult[0]?.count || 0),
    },
  };
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

    const existing = await db
      .select()
      .from(brands)
      .where(eq(brands.id, id))
      .limit(1)
      .then((result) => result[0]);

    if (!existing) {
      return { success: false, error: "Brand not found" };
    }

    const updateData: any = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.logoUrl !== undefined) updateData.logoUrl = input.logoUrl;

    const result = await db
      .update(brands)
      .set(updateData)
      .where(eq(brands.id, id))
      .returning();

    const brand = result[0];

    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "BRAND_UPDATED",
      entityType: "BRAND",
      entityId: id,
      oldData: JSON.stringify({
        name: existing.name,
        description: existing.description,
      }),
      newData: JSON.stringify(updateData),
    });

    revalidatePath("/dashboard/brands");

    return { success: true, data: brand };
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

    const brand = await db
      .select()
      .from(brands)
      .where(eq(brands.id, id))
      .limit(1)
      .then((result) => result[0]);

    if (!brand) {
      return { success: false, error: "Brand not found" };
    }

    const txCount = await db
      .select({ id: transactions.id })
      .from(transactions)
      .where(eq(transactions.brandId, id))
      .limit(1);

    if (txCount.length > 0) {
      // Soft delete
      await db
        .update(brands)
        .set({ isActive: false })
        .where(eq(brands.id, id));
    } else {
      await db.delete(brands).where(eq(brands.id, id));
    }

    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "BRAND_DELETED",
      entityType: "BRAND",
      entityId: id,
    });

    revalidatePath("/dashboard/brands");

    return { success: true };
  } catch (error) {
    console.error("Delete brand error:", error);
    return { success: false, error: "Failed to delete brand" };
  }
}
