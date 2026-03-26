"use server";

import { db } from "@/db";
import {
  employees,
  salaryPayments,
  transactions,
  bankAccounts,
} from "@/db/schema";
import { requirePermission } from "@/server/auth";
import { createAuditLog } from "@/lib/audit";
import { handleActionError } from "@/lib/errors";
import { generateId, calculateUsdBaseValue } from "@/lib/utils";
import { sanitizeObject } from "@/lib/sanitize";
import { employeeSchema, salaryPaymentSchema } from "@/modules/finance/schemas";
import { eq, and } from "drizzle-orm";
import {
  invalidateSalaryCaches,
  invalidateTag,
  invalidatePath,
} from "@/lib/cache";
import Decimal from "decimal.js";
import type { ActionResponse } from "@/types";

export async function createEmployee(
  input: unknown,
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await requirePermission("manage:salaries");
    const validated = employeeSchema.parse(
      sanitizeObject(input as Record<string, unknown>),
    );
    const id = generateId("emp");

    await db.insert(employees).values({
      id,
      brandId: validated.brandId,
      name: validated.name,
      email: validated.email || null,
      position: validated.position || null,
      department: validated.department || null,
      monthlySalary: validated.monthlySalary,
      salaryCurrency: validated.salaryCurrency,
      defaultPaymentAccountId: validated.defaultPaymentAccountId || null,
      startDate: new Date(validated.startDate),
    });

    await createAuditLog({
      userId: session.user.id,
      action: "create",
      entity: "employee",
      entityId: id,
      metadata: { name: validated.name },
    });

    invalidateTag("employees");
    invalidateTag("salary-payments");
    invalidatePath("/salaries");

    return { success: true, data: { id } };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateEmployee(
  id: string,
  input: unknown,
): Promise<ActionResponse> {
  try {
    const session = await requirePermission("manage:salaries");
    const validated = employeeSchema.parse(
      sanitizeObject(input as Record<string, unknown>),
    );

    await db
      .update(employees)
      .set({
        brandId: validated.brandId,
        name: validated.name,
        email: validated.email || null,
        position: validated.position || null,
        department: validated.department || null,
        monthlySalary: validated.monthlySalary,
        salaryCurrency: validated.salaryCurrency,
        defaultPaymentAccountId: validated.defaultPaymentAccountId || null,
        updatedAt: new Date(),
      })
      .where(eq(employees.id, id));

    await createAuditLog({
      userId: session.user.id,
      action: "update",
      entity: "employee",
      entityId: id,
      metadata: { name: validated.name },
    });

    invalidateTag("employees");
    invalidateTag("salary-payments");
    invalidatePath("/salaries");

    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deactivateEmployee(id: string): Promise<ActionResponse> {
  try {
    const session = await requirePermission("manage:salaries");

    const employee = await db
      .select()
      .from(employees)
      .where(eq(employees.id, id))
      .limit(1);

    if (employee.length === 0) {
      return { success: false, error: "Employee not found" };
    }

    await db
      .update(employees)
      .set({ isActive: false, endDate: new Date(), updatedAt: new Date() })
      .where(eq(employees.id, id));

    await createAuditLog({
      userId: session.user.id,
      action: "update",
      entity: "employee",
      entityId: id,
      metadata: { action: "deactivated", name: employee[0].name },
    });

    invalidateTag("employees");
    invalidateTag("salary-expense");
    invalidatePath("/salaries");

    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function markSalaryPaid(
  input: unknown,
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await requirePermission("manage:salaries");
    const validated = salaryPaymentSchema.parse(input);

    // Duplicate check
    const existing = await db
      .select()
      .from(salaryPayments)
      .where(
        and(
          eq(salaryPayments.employeeId, validated.employeeId),
          eq(salaryPayments.month, validated.month),
          eq(salaryPayments.year, validated.year),
          eq(salaryPayments.status, "paid"),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      return { success: false, error: "Salary already paid for this period" };
    }

    // Get employee
    const employee = await db
      .select()
      .from(employees)
      .where(eq(employees.id, validated.employeeId))
      .limit(1);

    if (employee.length === 0) {
      return { success: false, error: "Employee not found" };
    }

    // Get bank account
    const account = await db
      .select()
      .from(bankAccounts)
      .where(eq(bankAccounts.id, validated.bankAccountId))
      .limit(1);

    if (account.length === 0) {
      return { success: false, error: "Bank account not found" };
    }

    // Check balance
    const currentBalance = new Decimal(account[0].currentBalance);
    const paymentAmount = new Decimal(validated.amount);

    if (currentBalance.lessThan(paymentAmount)) {
      return {
        success: false,
        error: `Insufficient balance. Available: ${currentBalance.toFixed(2)} ${account[0].currency}`,
      };
    }

    const paymentId = generateId("sal");
    const usdBaseValue = calculateUsdBaseValue(
      validated.amount,
      validated.conversionRate,
    );

    // 1. Create salary payment
    await db.insert(salaryPayments).values({
      id: paymentId,
      employeeId: validated.employeeId,
      bankAccountId: validated.bankAccountId,
      month: validated.month,
      year: validated.year,
      amount: validated.amount,
      currency: validated.currency,
      conversionRate: validated.conversionRate,
      usdBaseValue,
      status: "paid",
      paidAt: new Date(),
      notes: validated.notes || null,
      createdBy: session.user.id,
    });

    // 2. Create expense transaction
    const txnId = generateId("txn");
    await db.insert(transactions).values({
      id: txnId,
      type: "expense",
      brandId: employee[0].brandId,
      bankAccountId: validated.bankAccountId,
      source: "bank",
      category: "salaries",
      description: `Salary - ${employee[0].name} (${validated.month}/${validated.year})`,
      originalAmount: validated.amount,
      originalCurrency: validated.currency,
      conversionRate: validated.conversionRate,
      usdBaseValue,
      transactionDate: new Date(),
      createdBy: session.user.id,
    });

    // 3. Link transaction
    await db
      .update(salaryPayments)
      .set({ transactionId: txnId })
      .where(eq(salaryPayments.id, paymentId));

    // 4. Update bank balance
    const newBalance = currentBalance.minus(paymentAmount).toFixed(2);
    await db
      .update(bankAccounts)
      .set({ currentBalance: newBalance, updatedAt: new Date() })
      .where(eq(bankAccounts.id, validated.bankAccountId));

    await createAuditLog({
      userId: session.user.id,
      action: "create",
      entity: "salary_payment",
      entityId: paymentId,
      metadata: {
        employeeName: employee[0].name,
        amount: validated.amount,
        period: `${validated.month}/${validated.year}`,
      },
    });

    invalidateSalaryCaches();

    return { success: true, data: { id: paymentId } };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function cancelSalaryPayment(
  id: string,
  reason: string,
): Promise<ActionResponse> {
  try {
    const session = await requirePermission("manage:salaries");

    if (!reason || reason.trim().length === 0) {
      return { success: false, error: "Cancellation reason is required" };
    }

    const payment = await db
      .select()
      .from(salaryPayments)
      .where(eq(salaryPayments.id, id))
      .limit(1);

    if (payment.length === 0) {
      return { success: false, error: "Payment not found" };
    }

    if (payment[0].status === "cancelled") {
      return { success: false, error: "Payment already cancelled" };
    }

    // Cancel payment
    await db
      .update(salaryPayments)
      .set({
        status: "cancelled",
        notes: `Cancelled: ${reason}`,
        updatedAt: new Date(),
      })
      .where(eq(salaryPayments.id, id));

    // Void linked transaction
    if (payment[0].transactionId) {
      await db
        .update(transactions)
        .set({
          isVoided: true,
          voidedBy: session.user.id,
          voidedAt: new Date(),
          voidReason: `Salary cancelled: ${reason}`,
        })
        .where(eq(transactions.id, payment[0].transactionId));
    }

    // Restore bank balance
    const account = await db
      .select()
      .from(bankAccounts)
      .where(eq(bankAccounts.id, payment[0].bankAccountId))
      .limit(1);

    if (account.length > 0) {
      const restoredBalance = new Decimal(account[0].currentBalance)
        .plus(new Decimal(payment[0].amount))
        .toFixed(2);

      await db
        .update(bankAccounts)
        .set({ currentBalance: restoredBalance, updatedAt: new Date() })
        .where(eq(bankAccounts.id, payment[0].bankAccountId));
    }

    await createAuditLog({
      userId: session.user.id,
      action: "void",
      entity: "salary_payment",
      entityId: id,
      metadata: { reason },
    });

    invalidateSalaryCaches();

    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}
