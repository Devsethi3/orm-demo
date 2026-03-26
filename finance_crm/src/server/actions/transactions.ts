"use server";

import { db } from "@/db";
import { transactions, bankAccounts } from "@/db/schema";
import { requirePermission } from "@/server/auth";
import { createAuditLog } from "@/lib/audit";
import { handleActionError } from "@/lib/errors";
import { generateId, calculateUsdBaseValue } from "@/lib/utils";
import { sanitizeObject } from "@/lib/sanitize";
import {
  transactionSchema,
  voidTransactionSchema,
} from "@/modules/finance/schemas";
import { eq } from "drizzle-orm";
import { invalidateTransactionCaches } from "@/lib/cache";
import Decimal from "decimal.js";
import type { ActionResponse } from "@/types";

export async function createTransaction(
  input: unknown,
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await requirePermission("manage:transactions");
    const validated = transactionSchema.parse(
      sanitizeObject(input as Record<string, unknown>),
    );

    // Honeypot check
    if (validated.honeypot) {
      return { success: false, error: "Invalid submission" };
    }

    const id = generateId("txn");
    const usdBaseValue = calculateUsdBaseValue(
      validated.originalAmount,
      validated.conversionRate,
    );

    // Get receiving account
    const account = await db
      .select()
      .from(bankAccounts)
      .where(eq(bankAccounts.id, validated.bankAccountId))
      .limit(1);

    if (account.length === 0) {
      return { success: false, error: "Bank account not found" };
    }

    // Insert transaction
    await db.insert(transactions).values({
      id,
      type: validated.type,
      brandId: validated.brandId,
      projectId: validated.projectId || null,
      milestoneId: validated.milestoneId || null,
      bankAccountId: validated.bankAccountId,
      source: validated.source,
      category: validated.category || null,
      description: validated.description || null,
      originalAmount: validated.originalAmount,
      originalCurrency: validated.originalCurrency,
      conversionRate: validated.conversionRate,
      usdBaseValue,
      transactionDate: new Date(validated.transactionDate),
      notes: validated.notes || null,
      createdBy: session.user.id,
    });

    // Update bank account balance
    const balanceChange =
      validated.type === "income"
        ? new Decimal(validated.originalAmount)
        : new Decimal(validated.originalAmount).neg();

    const newBalance = new Decimal(account[0].currentBalance)
      .plus(balanceChange)
      .toFixed(2);

    await db
      .update(bankAccounts)
      .set({ currentBalance: newBalance, updatedAt: new Date() })
      .where(eq(bankAccounts.id, validated.bankAccountId));

    await createAuditLog({
      userId: session.user.id,
      action: "create",
      entity: "transaction",
      entityId: id,
      metadata: {
        type: validated.type,
        amount: validated.originalAmount,
        currency: validated.originalCurrency,
        usdBaseValue,
        source: validated.source,
      },
    });

    invalidateTransactionCaches();

    return { success: true, data: { id } };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function voidTransaction(input: unknown): Promise<ActionResponse> {
  try {
    const session = await requirePermission("manage:transactions");
    const validated = voidTransactionSchema.parse(input);

    const txn = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, validated.transactionId))
      .limit(1);

    if (txn.length === 0) {
      return { success: false, error: "Transaction not found" };
    }

    if (txn[0].isVoided) {
      return { success: false, error: "Transaction already voided" };
    }

    // Void the transaction
    await db
      .update(transactions)
      .set({
        isVoided: true,
        voidedBy: session.user.id,
        voidedAt: new Date(),
        voidReason: validated.reason,
      })
      .where(eq(transactions.id, validated.transactionId));

    // Reverse the balance change
    const reversal =
      txn[0].type === "income"
        ? new Decimal(txn[0].originalAmount).neg()
        : new Decimal(txn[0].originalAmount);

    const account = await db
      .select()
      .from(bankAccounts)
      .where(eq(bankAccounts.id, txn[0].bankAccountId))
      .limit(1);

    if (account.length > 0) {
      const newBalance = new Decimal(account[0].currentBalance)
        .plus(reversal)
        .toFixed(2);

      await db
        .update(bankAccounts)
        .set({ currentBalance: newBalance, updatedAt: new Date() })
        .where(eq(bankAccounts.id, txn[0].bankAccountId));
    }

    await createAuditLog({
      userId: session.user.id,
      action: "void",
      entity: "transaction",
      entityId: validated.transactionId,
      metadata: {
        reason: validated.reason,
        originalAmount: txn[0].originalAmount,
        type: txn[0].type,
      },
    });

    invalidateTransactionCaches();

    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}
