"use server";

import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { getSession, hasPermission } from "@/lib/auth";
import { transactionSchema, type TransactionInput } from "@/lib/validations";
import type {
  ActionResponse,
  TransactionWithRelations,
  FilterOptions,
  PaginatedResponse,
} from "@/types";
import { eq, and, gte, lte, desc, count } from "drizzle-orm";
import { transactions, auditLogs, brands, projects, users as usersTable } from "@/db/schema";
import { convertToUSD } from "@/lib/currency.server";

function toSerializableTransaction<T extends {
  originalAmount: string | number;
  conversionRate: string | number;
  usdValue: string | number;
}>(transaction: T) {
  return {
    ...transaction,
    originalAmount: Number(transaction.originalAmount),
    conversionRate: Number(transaction.conversionRate),
    usdValue: Number(transaction.usdValue),
  };
}

export async function createTransaction(
  input: TransactionInput,
): Promise<ActionResponse> {
  try {
    const session = await getSession();

    if (!session || !hasPermission(session.user.role, "transactions:write")) {
      return { success: false, error: "Unauthorized" };
    }

    const validated = transactionSchema.safeParse(input);

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

    // Get conversion rate if not provided
    let conversionRate = data.conversionRate || 1;
    let usdValue = data.originalAmount;

    if (data.originalCurrency !== "USD") {
      const conversion = await convertToUSD(
        data.originalAmount,
        data.originalCurrency,
      );
      conversionRate = conversion.conversionRate;
      usdValue = data.originalAmount * conversionRate;
    }

    const result = await db.insert(transactions).values({
      id: crypto.randomUUID(),
      brandId: data.brandId,
      projectId: data.projectId || null,
      type: data.type,
      source: data.source,
      description: data.description || null,
      originalAmount: String(data.originalAmount),
      originalCurrency: data.originalCurrency,
      conversionRate: String(conversionRate),
      usdValue: String(usdValue),
      transactionDate: data.transactionDate,
      reference: data.reference || null,
      notes: data.notes || null,
      createdById: session.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    const newTransaction = result[0];

    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "TRANSACTION_CREATED",
      entityType: "TRANSACTION",
      entityId: newTransaction.id,
      newData: { ...data },
      createdAt: new Date(),
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/transactions");

    return { success: true, data: toSerializableTransaction(newTransaction) };
  } catch (error) {
    console.error("Create transaction error:", error);
    return { success: false, error: "Failed to create transaction" };
  }
}

export async function getTransactions(
  options: FilterOptions & { page?: number; pageSize?: number } = {},
): Promise<PaginatedResponse<TransactionWithRelations>> {
  const session = await getSession();

  if (!session) {
    return { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };
  }

  const {
    page = 1,
    pageSize = 10,
    brandId,
    type,
    source,
    startDate,
    endDate,
    search,
  } = options;

  const filters: any[] = [];

  if (brandId) {
    filters.push(eq(transactions.brandId, brandId));
  }
  if (type) {
    filters.push(eq(transactions.type, type));
  }
  if (source) {
    filters.push(eq(transactions.source, source));
  }
  if (startDate) {
    filters.push(gte(transactions.transactionDate, startDate));
  }
  if (endDate) {
    filters.push(lte(transactions.transactionDate, endDate));
  }

  // Restrict by role - for partners, only show their brand's transactions
  let finalFilters = filters.length > 0 ? and(...filters) : undefined;
  if (session.user.role === "PARTNER") {
    // For now, return empty for partners since we don't have partner info
    // In a real app, you'd look up the partner's brand
    finalFilters = undefined;
  }

  const [totalResult] = await db
    .select({ count: count() })
    .from(transactions)
    .where(finalFilters);

  const total = totalResult?.count || 0;

  const txList = await db
    .select({
      id: transactions.id,
      brandId: transactions.brandId,
      projectId: transactions.projectId,
      type: transactions.type,
      source: transactions.source,
      description: transactions.description,
      originalAmount: transactions.originalAmount,
      originalCurrency: transactions.originalCurrency,
      conversionRate: transactions.conversionRate,
      usdValue: transactions.usdValue,
      transactionDate: transactions.transactionDate,
      reference: transactions.reference,
      notes: transactions.notes,
      createdById: transactions.createdById,
      createdAt: transactions.createdAt,
      updatedAt: transactions.updatedAt,
      brandName: brands.name,
      brandId_: brands.id,
      projectName: projects.name,
      projectId_: projects.id,
      createdByName: usersTable.name,
      createdById_: usersTable.id,
    })
    .from(transactions)
    .leftJoin(brands, eq(transactions.brandId, brands.id))
    .leftJoin(projects, eq(transactions.projectId, projects.id))
    .leftJoin(usersTable, eq(transactions.createdById, usersTable.id))
    .where(finalFilters)
    .orderBy(desc(transactions.transactionDate))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const formattedData = txList.map((tx) => ({
    ...tx,
    originalAmount: Number(tx.originalAmount),
    conversionRate: Number(tx.conversionRate),
    usdValue: Number(tx.usdValue),
    brand: {
      id: tx.brandId_,
      name: tx.brandName || "Unknown",
    },
    project: tx.projectId_
      ? {
          id: tx.projectId_,
          name: tx.projectName || "Unknown",
        }
      : null,
    createdBy: {
      id: tx.createdById_,
      name: tx.createdByName || "Unknown",
    },
  }));

  return {
    data: formattedData as unknown as TransactionWithRelations[],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getTransaction(
  id: string,
): Promise<TransactionWithRelations | null> {
  const session = await getSession();

  if (!session) return null;

  const result = await db
    .select({
      id: transactions.id,
      brandId: transactions.brandId,
      projectId: transactions.projectId,
      type: transactions.type,
      source: transactions.source,
      description: transactions.description,
      originalAmount: transactions.originalAmount,
      originalCurrency: transactions.originalCurrency,
      conversionRate: transactions.conversionRate,
      usdValue: transactions.usdValue,
      transactionDate: transactions.transactionDate,
      reference: transactions.reference,
      notes: transactions.notes,
      createdById: transactions.createdById,
      isReconciled: transactions.isReconciled,
      createdAt: transactions.createdAt,
      updatedAt: transactions.updatedAt,
      brandId_: brands.id,
      brandName: brands.name,
      projectId_: projects.id,
      projectName: projects.name,
      createdById_: usersTable.id,
      createdByName: usersTable.name,
    })
    .from(transactions)
    .innerJoin(brands, eq(transactions.brandId, brands.id))
    .leftJoin(projects, eq(transactions.projectId, projects.id))
    .innerJoin(usersTable, eq(transactions.createdById, usersTable.id))
    .where(eq(transactions.id, id))
    .limit(1);

  if (!result.length) {
    return null;
  }

  const tx = result[0];

  return {
    id: tx.id,
    brandId: tx.brandId,
    projectId: tx.projectId,
    type: tx.type,
    source: tx.source,
    description: tx.description,
    originalAmount: Number(tx.originalAmount),
    originalCurrency: tx.originalCurrency,
    conversionRate: Number(tx.conversionRate),
    usdValue: Number(tx.usdValue),
    transactionDate: tx.transactionDate,
    reference: tx.reference,
    notes: tx.notes,
    createdById: tx.createdById,
    isReconciled: tx.isReconciled,
    createdAt: tx.createdAt,
    updatedAt: tx.updatedAt,
    brand: {
      id: tx.brandId_!,
      name: tx.brandName!,
    },
    project: tx.projectId_
      ? {
          id: tx.projectId_,
          name: tx.projectName!,
        }
      : null,
    createdBy: {
      id: tx.createdById_!,
      name: tx.createdByName!,
    },
  } as TransactionWithRelations;
}

export async function updateTransaction(
  id: string,
  input: Partial<TransactionInput>,
): Promise<ActionResponse> {
  try {
    const session = await getSession();

    if (!session || !hasPermission(session.user.role, "transactions:write")) {
      return { success: false, error: "Unauthorized" };
    }

    const existingResult = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id))
      .limit(1);

    if (!existingResult.length) {
      return { success: false, error: "Transaction not found" };
    }

    const existing = existingResult[0];

    // Recalculate USD value if amount or currency changed
    const updateData: Record<string, any> = {};

    if (input.originalAmount !== undefined) {
      updateData.originalAmount = String(input.originalAmount);
    }
    if (input.originalCurrency !== undefined) {
      updateData.originalCurrency = input.originalCurrency;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.reference !== undefined) {
      updateData.reference = input.reference;
    }
    if (input.notes !== undefined) {
      updateData.notes = input.notes;
    }
    if (input.type !== undefined) {
      updateData.type = input.type;
    }
    if (input.source !== undefined) {
      updateData.source = input.source;
    }
    if (input.projectId !== undefined) {
      updateData.projectId = input.projectId;
    }
    if (input.transactionDate !== undefined) {
      updateData.transactionDate = input.transactionDate;
    }

    // Recalculate conversion if amounts or currency changed
    if (input.originalAmount || input.originalCurrency) {
      const amount = input.originalAmount || Number(existing.originalAmount);
      const currency = input.originalCurrency || existing.originalCurrency;

      if (currency !== "USD") {
        const conversion = await convertToUSD(amount, currency);
        updateData.conversionRate = String(
          input.conversionRate || conversion.conversionRate,
        );
        updateData.usdValue = String(amount * Number(updateData.conversionRate));
      } else {
        updateData.conversionRate = "1";
        updateData.usdValue = String(amount);
      }
    }

    updateData.updatedAt = new Date();

    const result = await db
      .update(transactions)
      .set(updateData)
      .where(eq(transactions.id, id))
      .returning();

    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "TRANSACTION_UPDATED",
      entityType: "TRANSACTION",
      entityId: id,
      oldData: existing,
      newData: input,
      createdAt: new Date(),
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/transactions");

    return { success: true, data: toSerializableTransaction(result[0]) };
  } catch (error) {
    console.error("Update transaction error:", error);
    return { success: false, error: "Failed to update transaction" };
  }
}

export async function deleteTransaction(id: string): Promise<ActionResponse> {
  try {
    const session = await getSession();

    if (!session || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    const existingResult = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id))
      .limit(1);

    if (!existingResult.length) {
      return { success: false, error: "Transaction not found" };
    }

    const transaction = existingResult[0];

    await db.delete(transactions).where(eq(transactions.id, id));

    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "TRANSACTION_DELETED",
      entityType: "TRANSACTION",
      entityId: id,
      oldData: transaction,
      createdAt: new Date(),
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/transactions");

    return { success: true };
  } catch (error) {
    console.error("Delete transaction error:", error);
    return { success: false, error: "Failed to delete transaction" };
  }
}
