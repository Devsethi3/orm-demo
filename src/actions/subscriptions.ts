"use server";

import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";
import { subscriptionSchema, type SubscriptionInput } from "@/lib/validations";
import type { ActionResponse, SubscriptionWithDue } from "@/types";
import { Prisma } from "@/generated/prisma/client";
import { addDays, isBefore, isAfter } from "date-fns";

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

    const subscription = await db.subscription.create({
      data: {
        name: data.name,
        provider: data.provider,
        description: data.description,
        cost: data.cost,
        currency: data.currency.toUpperCase(),
        billingCycle: data.billingCycle,
        nextDueDate: data.nextDueDate,
        category: data.category,
        url: data.url || null,
        autoRenew: data.autoRenew,
        reminderDays: data.reminderDays,
      },
    });

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "SUBSCRIPTION_CREATED",
        entityType: "SUBSCRIPTION",
        entityId: subscription.id,
        newData: data as unknown as Prisma.JsonObject,
      },
    });

    revalidatePath("/dashboard/subscriptions");

    return { success: true, data: subscription };
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

  const subscriptions = await db.subscription.findMany({
    where: { isActive: true },
    orderBy: { nextDueDate: "asc" },
  });

  const now = new Date();

  // @ts-ignore
  return subscriptions.map((sub) => {
    const reminderDate = addDays(now, sub.reminderDays);

    return {
      id: sub.id,
      name: sub.name,
      provider: sub.provider,
      cost: sub.cost,
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

  return db.subscription.findUnique({
    where: { id },
  });
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

    const existing = await db.subscription.findUnique({ where: { id } });

    if (!existing) {
      return { success: false, error: "Subscription not found" };
    }

    const subscription = await db.subscription.update({
      where: { id },
      data: {
        name: input.name,
        provider: input.provider,
        description: input.description,
        cost: input.cost,
        currency: input.currency?.toUpperCase(),
        billingCycle: input.billingCycle,
        nextDueDate: input.nextDueDate,
        category: input.category,
        url: input.url || null,
        autoRenew: input.autoRenew,
        reminderDays: input.reminderDays,
      },
    });

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "SUBSCRIPTION_UPDATED",
        entityType: "SUBSCRIPTION",
        entityId: id,
        oldData: existing as unknown as Prisma.JsonObject,
        newData: input as unknown as Prisma.JsonObject,
      },
    });

    revalidatePath("/dashboard/subscriptions");

    return { success: true, data: subscription };
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

    const subscription = await db.subscription.findUnique({ where: { id } });

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
        await db.subscription.update({
          where: { id },
          data: { isActive: false, lastPaidDate: new Date() },
        });
        revalidatePath("/dashboard/subscriptions");
        return { success: true };
    }

    await db.subscription.update({
      where: { id },
      data: {
        lastPaidDate: new Date(),
        nextDueDate,
      },
    });

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "SUBSCRIPTION_PAID",
        entityType: "SUBSCRIPTION",
        entityId: id,
      },
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

    await db.subscription.update({
      where: { id },
      data: { isActive: false },
    });

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "SUBSCRIPTION_CANCELLED",
        entityType: "SUBSCRIPTION",
        entityId: id,
      },
    });

    revalidatePath("/dashboard/subscriptions");

    return { success: true };
  } catch (error) {
    console.error("Cancel subscription error:", error);
    return { success: false, error: "Failed to cancel subscription" };
  }
}
