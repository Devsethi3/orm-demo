"use server";

import { db } from "@/db";
import { subscriptions, transactions, bankAccounts } from "@/db/schema";
import { requirePermission } from "@/server/auth";
import { createAuditLog } from "@/lib/audit";
import { handleActionError } from "@/lib/errors";
import { generateId, calculateUsdBaseValue } from "@/lib/utils";
import { sanitizeObject } from "@/lib/sanitize";
import { subscriptionSchema } from "@/modules/finance/schemas";
import { eq } from "drizzle-orm";
import {
  invalidateSubscriptionCaches,
  invalidateTransactionCaches,
  invalidateTag,
  invalidatePath,
} from "@/lib/cache";
import Decimal from "decimal.js";
import type { ActionResponse } from "@/types";

export async function createSubscription(
  input: unknown,
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await requirePermission("manage:subscriptions");
    const validated = subscriptionSchema.parse(
      sanitizeObject(input as Record<string, unknown>),
    );
    const id = generateId("sub");

    await db.insert(subscriptions).values({
      id,
      brandId: validated.brandId,
      name: validated.name,
      provider: validated.provider || null,
      category: validated.category,
      billingCycle: validated.billingCycle,
      amount: validated.amount,
      currency: validated.currency,
      defaultPaymentAccountId: validated.defaultPaymentAccountId || null,
      nextBillingDate: validated.nextBillingDate
        ? new Date(validated.nextBillingDate)
        : null,
      startDate: new Date(validated.startDate),
      autoRenew: validated.autoRenew,
      notes: validated.notes || null,
      createdBy: session.user.id,
    });

    await createAuditLog({
      userId: session.user.id,
      action: "create",
      entity: "subscription",
      entityId: id,
      metadata: { name: validated.name, amount: validated.amount },
    });

    invalidateSubscriptionCaches();

    return { success: true, data: { id } };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateSubscription(
  id: string,
  input: unknown,
): Promise<ActionResponse> {
  try {
    const session = await requirePermission("manage:subscriptions");
    const validated = subscriptionSchema.parse(
      sanitizeObject(input as Record<string, unknown>),
    );

    await db
      .update(subscriptions)
      .set({
        brandId: validated.brandId,
        name: validated.name,
        provider: validated.provider || null,
        category: validated.category,
        billingCycle: validated.billingCycle,
        amount: validated.amount,
        currency: validated.currency,
        defaultPaymentAccountId: validated.defaultPaymentAccountId || null,
        nextBillingDate: validated.nextBillingDate
          ? new Date(validated.nextBillingDate)
          : null,
        autoRenew: validated.autoRenew,
        notes: validated.notes || null,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, id));

    await createAuditLog({
      userId: session.user.id,
      action: "update",
      entity: "subscription",
      entityId: id,
      metadata: { name: validated.name },
    });

    invalidateSubscriptionCaches();

    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function cancelSubscription(id: string): Promise<ActionResponse> {
  try {
    const session = await requirePermission("manage:subscriptions");

    const sub = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, id))
      .limit(1);

    if (sub.length === 0) {
      return { success: false, error: "Subscription not found" };
    }

    if (sub[0].status === "cancelled") {
      return { success: false, error: "Already cancelled" };
    }

    await db
      .update(subscriptions)
      .set({
        status: "cancelled",
        endDate: new Date(),
        autoRenew: false,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, id));

    await createAuditLog({
      userId: session.user.id,
      action: "update",
      entity: "subscription",
      entityId: id,
      metadata: { action: "cancelled", name: sub[0].name },
    });

    invalidateSubscriptionCaches();

    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function pauseSubscription(id: string): Promise<ActionResponse> {
  try {
    const session = await requirePermission("manage:subscriptions");

    const sub = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, id))
      .limit(1);

    if (sub.length === 0) {
      return { success: false, error: "Subscription not found" };
    }

    const newStatus = sub[0].status === "paused" ? "active" : "paused";

    await db
      .update(subscriptions)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(subscriptions.id, id));

    await createAuditLog({
      userId: session.user.id,
      action: "update",
      entity: "subscription",
      entityId: id,
      metadata: { action: newStatus, name: sub[0].name },
    });

    invalidateTag("subscriptions");
    invalidatePath("/subscriptions");

    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function recordSubscriptionPayment(
  subscriptionId: string,
  conversionRate: string,
): Promise<ActionResponse<{ transactionId: string }>> {
  try {
    const session = await requirePermission("manage:subscriptions");

    const sub = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, subscriptionId))
      .limit(1);

    if (sub.length === 0) {
      return { success: false, error: "Subscription not found" };
    }

    if (!sub[0].defaultPaymentAccountId) {
      return { success: false, error: "No payment account set" };
    }

    const account = await db
      .select()
      .from(bankAccounts)
      .where(eq(bankAccounts.id, sub[0].defaultPaymentAccountId))
      .limit(1);

    if (account.length === 0) {
      return { success: false, error: "Payment account not found" };
    }

    const currentBalance = new Decimal(account[0].currentBalance);
    const paymentAmount = new Decimal(sub[0].amount);

    if (currentBalance.lessThan(paymentAmount)) {
      return {
        success: false,
        error: `Insufficient balance. Available: ${currentBalance.toFixed(2)}`,
      };
    }

    const usdBaseValue = calculateUsdBaseValue(sub[0].amount, conversionRate);

    // Create expense transaction
    const txnId = generateId("txn");
    await db.insert(transactions).values({
      id: txnId,
      type: "expense",
      brandId: sub[0].brandId,
      bankAccountId: sub[0].defaultPaymentAccountId,
      source: "bank",
      category: "subscriptions",
      description: `Subscription - ${sub[0].name}${sub[0].provider ? ` (${sub[0].provider})` : ""}`,
      originalAmount: sub[0].amount,
      originalCurrency: sub[0].currency,
      conversionRate,
      usdBaseValue,
      transactionDate: new Date(),
      createdBy: session.user.id,
    });

    // Update bank balance
    const newBalance = currentBalance.minus(paymentAmount).toFixed(2);
    await db
      .update(bankAccounts)
      .set({ currentBalance: newBalance, updatedAt: new Date() })
      .where(eq(bankAccounts.id, sub[0].defaultPaymentAccountId));

    // Update next billing date
    const nextDate = new Date();
    if (sub[0].billingCycle === "monthly") {
      nextDate.setMonth(nextDate.getMonth() + 1);
    } else {
      nextDate.setFullYear(nextDate.getFullYear() + 1);
    }

    await db
      .update(subscriptions)
      .set({ nextBillingDate: nextDate, updatedAt: new Date() })
      .where(eq(subscriptions.id, subscriptionId));

    await createAuditLog({
      userId: session.user.id,
      action: "create",
      entity: "subscription",
      entityId: subscriptionId,
      metadata: { action: "payment_recorded", amount: sub[0].amount },
    });

    // Invalidate both subscription and transaction caches
    invalidateSubscriptionCaches();
    invalidateTransactionCaches();

    return { success: true, data: { transactionId: txnId } };
  } catch (error) {
    return handleActionError(error);
  }
}
