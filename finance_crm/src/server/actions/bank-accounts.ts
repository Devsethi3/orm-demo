"use server";

import { db } from "@/db";
import { bankAccounts } from "@/db/schema";
import { requirePermission } from "@/server/auth";
import { createAuditLog } from "@/lib/audit";
import { handleActionError } from "@/lib/errors";
import { generateId } from "@/lib/utils";
import { sanitizeObject } from "@/lib/sanitize";
import { bankAccountSchema } from "@/modules/finance/schemas";
import { eq } from "drizzle-orm";
import { invalidateTag, invalidatePath } from "@/lib/cache";
import type { ActionResponse } from "@/types";

export async function createBankAccount(
  input: unknown,
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await requirePermission("manage:accounts");
    const validated = bankAccountSchema.parse(
      sanitizeObject(input as Record<string, unknown>),
    );
    const id = generateId("acc");

    await db.insert(bankAccounts).values({
      id,
      brandId: validated.brandId,
      name: validated.name,
      bankName: validated.bankName,
      accountNumber: validated.accountNumber,
      currency: validated.currency,
      initialBalance: validated.initialBalance,
      currentBalance: validated.initialBalance,
    });

    await createAuditLog({
      userId: session.user.id,
      action: "create",
      entity: "bank_account",
      entityId: id,
      metadata: { name: validated.name, bankName: validated.bankName },
    });

    invalidateTag("bank-accounts");
    invalidateTag("dashboard-summary");
    invalidatePath("/accounts");
    invalidatePath("/transactions");
    invalidatePath("/");

    return { success: true, data: { id } };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateBankAccount(
  id: string,
  input: unknown,
): Promise<ActionResponse> {
  try {
    const session = await requirePermission("manage:accounts");
    const validated = bankAccountSchema.parse(
      sanitizeObject(input as Record<string, unknown>),
    );

    await db
      .update(bankAccounts)
      .set({
        name: validated.name,
        bankName: validated.bankName,
        accountNumber: validated.accountNumber,
        updatedAt: new Date(),
      })
      .where(eq(bankAccounts.id, id));

    await createAuditLog({
      userId: session.user.id,
      action: "update",
      entity: "bank_account",
      entityId: id,
      metadata: { name: validated.name },
    });

    invalidateTag("bank-accounts");
    invalidatePath("/accounts");

    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function toggleBankAccountStatus(
  id: string,
): Promise<ActionResponse> {
  try {
    const session = await requirePermission("manage:accounts");

    const account = await db
      .select()
      .from(bankAccounts)
      .where(eq(bankAccounts.id, id))
      .limit(1);

    if (account.length === 0) {
      return { success: false, error: "Account not found" };
    }

    const newStatus = !account[0].isActive;

    await db
      .update(bankAccounts)
      .set({ isActive: newStatus, updatedAt: new Date() })
      .where(eq(bankAccounts.id, id));

    await createAuditLog({
      userId: session.user.id,
      action: "update",
      entity: "bank_account",
      entityId: id,
      metadata: { isActive: newStatus },
    });

    invalidateTag("bank-accounts");
    invalidatePath("/accounts");

    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}
