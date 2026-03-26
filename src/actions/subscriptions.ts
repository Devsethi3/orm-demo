"use server";

import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";
import { subscriptionSchema, type SubscriptionInput } from "@/lib/validations";
import type { ActionResponse, SubscriptionWithDue } from "@/types";
import { eq, desc } from "drizzle-orm";
import { subscriptions, auditLogs } from "@/db/schema";
import { addDays, isBefore, isAfter } from "date-fns";
// Using crypto.randomUUID() instead of uuid package

export async function createSubscription(
  input: SubscriptionInput,
): Promise<ActionResponse> {
  try {
    const session = await getSession();

    if (!session || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    const validated = subscriptionSchema.safeParse(input);

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
    const subscriptionId = crypto.randomUUID();

    await db.insert(subscriptions).values({
      id: subscriptionId,
      name: data.name,
      provider: data.provider,
      description: data.description,
      cost: String(data.cost),
      currency: data.currency.toUpperCase(),
      billingCycle: data.billingCycle,
      nextDueDate: data.nextDueDate,
      category: data.category,
      url: data.url || null,
      autoRenew: data.autoRenew,
      reminderDays: data.reminderDays,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "SUBSCRIPTION_CREATED",
      entityType: "SUBSCRIPTION",
      entityId: subscriptionId,
      newData: data,
      createdAt: new Date(),
    });

    revalidatePath("/dashboard/subscriptions");

    return { success: true, data: { id: subscriptionId } };
  } catch (error) {
    console.error("Create subscription error:", error);
    return { success: false, error: "Failed to create subscription" };
  }
}

export async function getSubscriptions(): Promise<SubscriptionWithDue[]> {
  const session = await getSession();

  if (!session || session.user.role !== "ADMIN") {
    return [];
  }

  const subs = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.isActive, true))
    .orderBy(subscriptions.nextDueDate);

  const now = new Date();

  return subs.map((sub) => {
    const reminderDate = addDays(now, sub.reminderDays);

    return {
      id: sub.id,
      name: sub.name,
      provider: sub.provider,
      cost: Number(sub.cost),
      currency: sub.currency,
      billingCycle: sub.billingCycle,
      nextDueDate: sub.nextDueDate,
      category: sub.category,
      isActive: sub.isActive,
      isDueSoon:
        isBefore(sub.nextDueDate, reminderDate) &&
        isAfter(sub.nextDueDate, now),
      isOverdue: isBefore(sub.nextDueDate, now),
    };
  });
}

export async function getSubscription(id: string) {
  const session = await getSession();

  if (!session || session.user.role !== "ADMIN") {
    return null;
  }

  const result = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.id, id))
    .limit(1);

  if (!result.length) return null;

  const sub = result[0];
  return {
    ...sub,
    cost: Number(sub.cost),
  };
}

export async function updateSubscription(
  id: string,
  input: Partial<SubscriptionInput>,
): Promise<ActionResponse> {
  try {
    const session = await getSession();

    if (!session || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    const existing = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, id))
      .limit(1);

    if (!existing.length) {
      return { success: false, error: "Subscription not found" };
    }

    const updateData: Record<string, any> = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.provider !== undefined) updateData.provider = input.provider;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.cost !== undefined) updateData.cost = input.cost;
    if (input.currency !== undefined) updateData.currency = input.currency?.toUpperCase();
    if (input.billingCycle !== undefined) updateData.billingCycle = input.billingCycle;
    if (input.nextDueDate !== undefined) updateData.nextDueDate = input.nextDueDate;
    if (input.category !== undefined) updateData.category = input.category;
    if (input.url !== undefined) updateData.url = input.url || null;
    if (input.autoRenew !== undefined) updateData.autoRenew = input.autoRenew;
    if (input.reminderDays !== undefined) updateData.reminderDays = input.reminderDays;
    updateData.updatedAt = new Date();

    const subscription = await db
      .update(subscriptions)
      .set(updateData)
      .where(eq(subscriptions.id, id))
      .returning();

    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "SUBSCRIPTION_UPDATED",
      entityType: "SUBSCRIPTION",
      entityId: id,
      oldData: existing[0],
      newData: input,
      createdAt: new Date(),
    });

    revalidatePath("/dashboard/subscriptions");

    return { success: true, data: subscription[0] };
  } catch (error) {
    console.error("Update subscription error:", error);
    return { success: false, error: "Failed to update subscription" };
  }
}

export async function markSubscriptionPaid(
  id: string,
): Promise<ActionResponse> {
  try {
    const session = await getSession();

    if (!session || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    const result = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, id))
      .limit(1);

    if (!result.length) {
      return { success: false, error: "Subscription not found" };
    }

    const subscription = result[0];

    // Calculate next due date based on billing cycle
    let nextDueDate = new Date(subscription.nextDueDate);
    switch (subscription.billingCycle) {
      case "MONTHLY":
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        break;
      case "QUARTERLY":
        nextDueDate.setMonth(nextDueDate.getMonth() + 3);
        break;
      case "YEARLY":
        nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
        break;
      case "ONE_TIME":
        // Deactivate one-time subscriptions
        await db
          .update(subscriptions)
          .set({ isActive: false, lastPaidDate: new Date(), updatedAt: new Date() })
          .where(eq(subscriptions.id, id));
        revalidatePath("/dashboard/subscriptions");
        return { success: true };
    }

    await db
      .update(subscriptions)
      .set({
        lastPaidDate: new Date(),
        nextDueDate,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, id));

    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "SUBSCRIPTION_PAID",
      entityType: "SUBSCRIPTION",
      entityId: id,
      createdAt: new Date(),
    });

    revalidatePath("/dashboard/subscriptions");

    return { success: true };
  } catch (error) {
    console.error("Mark subscription paid error:", error);
    return { success: false, error: "Failed to mark subscription as paid" };
  }
}

export async function cancelSubscription(id: string): Promise<ActionResponse> {
  try {
    const session = await getSession();

    if (!session || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    await db
      .update(subscriptions)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(subscriptions.id, id));

    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "SUBSCRIPTION_CANCELLED",
      entityType: "SUBSCRIPTION",
      entityId: id,
      createdAt: new Date(),
    });

    revalidatePath("/dashboard/subscriptions");

    return { success: true };
  } catch (error) {
    console.error("Cancel subscription error:", error);
    return { success: false, error: "Failed to cancel subscription" };
  }
}
