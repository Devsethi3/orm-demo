"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";
import { subscriptionSchema, type SubscriptionInput } from "@/lib/validations";
import type { ActionResponse, SubscriptionWithDue } from "@/types";
import { addDays, isBefore, isAfter } from "date-fns";
import { subscriptions, auditLogs } from "@/db/schema";

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
      newData: JSON.stringify(data),
      createdAt: new Date(),
    });

    revalidatePath("/dashboard/subscriptions");

    return { success: true, data: { id: subscriptionId, ...data } };
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

  const subscriptionsList = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.isActive, true))
    .limit(50);

  const now = new Date();

  // @ts-ignore
  return subscriptionsList.map((sub) => {
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

  return result[0] || null;
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

    const existingResult = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, id))
      .limit(1);

    const existing = existingResult[0];

    if (!existing) {
      return { success: false, error: "Subscription not found" };
    }

    await db.update(subscriptions).set({
      name: input.name,
      provider: input.provider,
      description: input.description,
      cost: input.cost ? String(input.cost) : existing.cost,
      currency: input.currency?.toUpperCase(),
      billingCycle: input.billingCycle,
      nextDueDate: input.nextDueDate,
      category: input.category,
      url: input.url || null,
      autoRenew: input.autoRenew,
      reminderDays: input.reminderDays,
      updatedAt: new Date(),
    }).where(eq(subscriptions.id, id));

    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "SUBSCRIPTION_UPDATED",
      entityType: "SUBSCRIPTION",
      entityId: id,
      oldData: JSON.stringify(existing),
      newData: JSON.stringify(input),
      createdAt: new Date(),
    });

    revalidatePath("/dashboard/subscriptions");

    return { success: true, data: { id, ...input } };
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

    const subscriptionResult = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, id))
      .limit(1);

    const subscription = subscriptionResult[0];

    if (!subscription) {
      return { success: false, error: "Subscription not found" };
    }

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
        await db.update(subscriptions).set({
          isActive: false,
          lastPaidDate: new Date(),
          updatedAt: new Date(),
        }).where(eq(subscriptions.id, id));

        revalidatePath("/dashboard/subscriptions");
        return { success: true };
    }

    await db.update(subscriptions).set({
      lastPaidDate: new Date(),
      nextDueDate,
      updatedAt: new Date(),
    }).where(eq(subscriptions.id, id));

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

    await db.update(subscriptions).set({
      isActive: false,
      updatedAt: new Date(),
    }).where(eq(subscriptions.id, id));

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
