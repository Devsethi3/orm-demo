"use server";

import { db } from "@/db";
import { brands, projects, milestones } from "@/db/schema";
import { requirePermission } from "@/server/auth";
import { createAuditLog } from "@/lib/audit";
import { handleActionError } from "@/lib/errors";
import { generateId, slugify } from "@/lib/utils";
import { sanitizeObject } from "@/lib/sanitize";
import {
  brandSchema,
  projectSchema,
  milestoneSchema,
} from "@/modules/finance/schemas";
import { eq } from "drizzle-orm";
import {
  invalidateBrandCaches,
  invalidateTag,
  invalidatePath,
} from "@/lib/cache";
import type { ActionResponse } from "@/types";

export async function createBrand(
  input: unknown,
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await requirePermission("manage:brands");
    const validated = brandSchema.parse(
      sanitizeObject(input as Record<string, unknown>),
    );
    const id = generateId("brand");

    await db.insert(brands).values({
      id,
      name: validated.name,
      slug: slugify(validated.name),
      description: validated.description,
      color: validated.color || "#6366f1",
    });

    await createAuditLog({
      userId: session.user.id,
      action: "create",
      entity: "brand",
      entityId: id,
      metadata: { name: validated.name },
    });

    invalidateBrandCaches();

    return { success: true, data: { id } };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateBrand(
  id: string,
  input: unknown,
): Promise<ActionResponse> {
  try {
    const session = await requirePermission("manage:brands");
    const validated = brandSchema.parse(
      sanitizeObject(input as Record<string, unknown>),
    );

    await db
      .update(brands)
      .set({
        name: validated.name,
        slug: slugify(validated.name),
        description: validated.description,
        color: validated.color,
        updatedAt: new Date(),
      })
      .where(eq(brands.id, id));

    await createAuditLog({
      userId: session.user.id,
      action: "update",
      entity: "brand",
      entityId: id,
      metadata: validated,
    });

    invalidateBrandCaches();

    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteBrand(id: string): Promise<ActionResponse> {
  try {
    const session = await requirePermission("manage:brands");

    await db
      .update(brands)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(brands.id, id));

    await createAuditLog({
      userId: session.user.id,
      action: "delete",
      entity: "brand",
      entityId: id,
    });

    invalidateBrandCaches();

    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function createProject(
  input: unknown,
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await requirePermission("manage:brands");
    const validated = projectSchema.parse(
      sanitizeObject(input as Record<string, unknown>),
    );
    const id = generateId("proj");

    await db.insert(projects).values({
      id,
      brandId: validated.brandId,
      name: validated.name,
      slug: slugify(validated.name),
      description: validated.description,
      clientName: validated.clientName,
      totalBudget: validated.totalBudget,
      budgetCurrency: validated.budgetCurrency,
    });

    await createAuditLog({
      userId: session.user.id,
      action: "create",
      entity: "project",
      entityId: id,
      metadata: { name: validated.name, brandId: validated.brandId },
    });

    invalidateTag("projects");
    invalidatePath("/accounts");
    invalidatePath("/transactions");

    return { success: true, data: { id } };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateProject(
  id: string,
  input: unknown,
): Promise<ActionResponse> {
  try {
    const session = await requirePermission("manage:brands");
    const validated = projectSchema.parse(
      sanitizeObject(input as Record<string, unknown>),
    );

    await db
      .update(projects)
      .set({
        brandId: validated.brandId,
        name: validated.name,
        slug: slugify(validated.name),
        description: validated.description,
        clientName: validated.clientName,
        totalBudget: validated.totalBudget,
        budgetCurrency: validated.budgetCurrency,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, id));

    await createAuditLog({
      userId: session.user.id,
      action: "update",
      entity: "project",
      entityId: id,
      metadata: validated,
    });

    invalidateTag("projects");
    invalidatePath("/accounts");

    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteProject(id: string): Promise<ActionResponse> {
  try {
    const session = await requirePermission("manage:brands");

    await db
      .update(projects)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(projects.id, id));

    await createAuditLog({
      userId: session.user.id,
      action: "delete",
      entity: "project",
      entityId: id,
    });

    invalidateTag("projects");
    invalidatePath("/accounts");

    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function createMilestone(
  input: unknown,
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await requirePermission("manage:brands");
    const validated = milestoneSchema.parse(
      sanitizeObject(input as Record<string, unknown>),
    );
    const id = generateId("ms");

    await db.insert(milestones).values({
      id,
      projectId: validated.projectId,
      name: validated.name,
      amount: validated.amount,
      currency: validated.currency,
      dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
    });

    await createAuditLog({
      userId: session.user.id,
      action: "create",
      entity: "project",
      entityId: id,
      metadata: { name: validated.name, projectId: validated.projectId },
    });

    invalidateTag("milestones");
    invalidateTag("projects");
    invalidatePath("/accounts");

    return { success: true, data: { id } };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateMilestone(
  id: string,
  input: unknown,
): Promise<ActionResponse> {
  try {
    const session = await requirePermission("manage:brands");
    const validated = milestoneSchema.parse(
      sanitizeObject(input as Record<string, unknown>),
    );

    await db
      .update(milestones)
      .set({
        name: validated.name,
        amount: validated.amount,
        currency: validated.currency,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
        updatedAt: new Date(),
      })
      .where(eq(milestones.id, id));

    await createAuditLog({
      userId: session.user.id,
      action: "update",
      entity: "project",
      entityId: id,
    });

    invalidateTag("milestones");
    invalidatePath("/accounts");

    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}
