"use server";

import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { getSession, hasPermission } from "@/lib/auth";
import { brandSchema, type BrandInput } from "@/lib/validations";
import { slugify } from "@/lib/utils";
import type { ActionResponse } from "@/types";
import { Prisma } from "@/generated/prisma/client";

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

    const existingSlug = await db.brand.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    const brand = await db.brand.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        logoUrl: data.logoUrl || null,
        ownerId: session.user.id,
      },
    });

    await db.brandMember.create({
      data: {
        brandId: brand.id,
        userId: session.user.id,
        role: "ADMIN",
      },
    });

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "BRAND_CREATED",
        entityType: "BRAND",
        entityId: brand.id,
        newData: data as unknown as Prisma.JsonObject,
      },
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

  const where: Prisma.BrandWhereInput = { isActive: true };

  if (session.user.role !== "ADMIN") {
    where.members = {
      some: { userId: session.user.id },
    };
  }

  return db.brand.findMany({
    where,
    include: {
      owner: { select: { id: true, name: true, email: true } },
      _count: {
        select: {
          transactions: true,
          projects: true,
          employees: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function getBrand(id: string) {
  const session = await getSession();

  if (!session) return null;

  return db.brand.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      _count: {
        select: {
          transactions: true,
          projects: true,
        },
      },
    },
  });
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

    const existing = await db.brand.findUnique({ where: { id } });

    if (!existing) {
      return { success: false, error: "Brand not found" };
    }

    const brand = await db.brand.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description,
        logoUrl: input.logoUrl || null,
      },
    });

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "BRAND_UPDATED",
        entityType: "BRAND",
        entityId: id,
        oldData: existing as unknown as Prisma.JsonObject,
        newData: input as unknown as Prisma.JsonObject,
      },
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

    const brand = await db.brand.findUnique({
      where: { id },
      include: {
        _count: { select: { transactions: true } },
      },
    });

    if (!brand) {
      return { success: false, error: "Brand not found" };
    }

    if (brand._count.transactions > 0) {
      // Soft delete
      await db.brand.update({
        where: { id },
        data: { isActive: false },
      });
    } else {
      await db.brand.delete({ where: { id } });
    }

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "BRAND_DELETED",
        entityType: "BRAND",
        entityId: id,
      },
    });

    revalidatePath("/dashboard/brands");

    return { success: true };
  } catch (error) {
    console.error("Delete brand error:", error);
    return { success: false, error: "Failed to delete brand" };
  }
}
