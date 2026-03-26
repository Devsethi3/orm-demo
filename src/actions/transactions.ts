"use server";

import { revalidatePath } from "next/cache";
import { eq, and, gte, lte, or, ilike, desc, count } from "drizzle-orm";
import db from "@/lib/db";
import { getSession, hasPermission } from "@/lib/auth";
import { transactionSchema, type TransactionInput } from "@/lib/validations";
import type {
  ActionResponse,
  TransactionWithRelations,
  FilterOptions,
  PaginatedResponse,
} from "@/types";
import {
  transactions,
  brands,
  projects,
  users,
  partners,
  auditLogs,
} from "@/db/schema";
import { convertToUSD } from "@/lib/currency.server";

function toSerializableTransaction<
  T extends {
    originalAmount: string | number;
    conversionRate: string | number;
    usdValue: string | number;
  },
>(transaction: T) {
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
    let conversionRate = data.conversionRate;
    let usdValue = data.originalAmount;

    if (data.originalCurrency !== "USD") {
      const conversion = await convertToUSD(
        data.originalAmount,
        data.originalCurrency,
      );
      conversionRate = conversionRate || conversion.conversionRate;
      usdValue = data.originalAmount * conversionRate;
    } else {
      conversionRate = 1;
    }

    // Drizzle transaction syntax
    const result = await db.transaction(async (tx) => {
      const transactionId = crypto.randomUUID();

      // Insert the transaction
      await tx.insert(transactions).values({
        id: transactionId,
        brandId: data.brandId,
        projectId: data.projectId || null,
        type: data.type,
        source: data.source,
        description: data.description,
        originalAmount: String(data.originalAmount),
        originalCurrency: data.originalCurrency,
        conversionRate: String(conversionRate),
        usdValue: String(usdValue),
        transactionDate: data.transactionDate,
        reference: data.reference,
        notes: data.notes,
        createdById: session.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Fetch the created transaction with relations
      const newTransactionResult = await tx
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
          brand: {
            id: brands.id,
            name: brands.name,
          },
          project: {
            id: projects.id,
            name: projects.name,
          },
          createdBy: {
            id: users.id,
            name: users.name,
          },
        })
        .from(transactions)
        .leftJoin(brands, eq(transactions.brandId, brands.id))
        .leftJoin(projects, eq(transactions.projectId, projects.id))
        .leftJoin(users, eq(transactions.createdById, users.id))
        .where(eq(transactions.id, transactionId))
        .limit(1);

      return newTransactionResult[0];
    });

    // Create audit log
    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "TRANSACTION_CREATED",
      entityType: "TRANSACTION",
      entityId: result.id,
      newData: JSON.stringify(data),
      createdAt: new Date(),
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/transactions");

    return { success: true, data: toSerializableTransaction(result) };
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

  // Build where conditions
  const conditions: ReturnType<typeof eq>[] = [];

  if (brandId) {
    conditions.push(eq(transactions.brandId, brandId));
  }
  if (type) {
    conditions.push(eq(transactions.type, type));
  }
  if (source) {
    conditions.push(eq(transactions.source, source));
  }
  if (startDate) {
    conditions.push(gte(transactions.transactionDate, startDate));
  }
  if (endDate) {
    conditions.push(lte(transactions.transactionDate, endDate));
  }

  // Restrict by role - check if user is a partner
  if (session.user.role === "PARTNER") {
    const partnerResult = await db
      .select()
      .from(partners)
      .where(eq(partners.userId, session.user.id))
      .limit(1);

    const partner = partnerResult[0];
    if (partner) {
      conditions.push(eq(transactions.brandId, partner.brandId));
    }
  }

  // Build the where clause
  let whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Handle search separately (OR conditions)
  if (search) {
    const searchCondition = or(
      ilike(transactions.description, `%${search}%`),
      ilike(transactions.reference, `%${search}%`),
      ilike(transactions.notes, `%${search}%`),
    );

    whereClause = whereClause
      ? and(whereClause, searchCondition)
      : searchCondition;
  }

  // Get transactions with relations
  const transactionsQuery = db
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
      brand: {
        id: brands.id,
        name: brands.name,
      },
      project: {
        id: projects.id,
        name: projects.name,
      },
      createdBy: {
        id: users.id,
        name: users.name,
      },
    })
    .from(transactions)
    .leftJoin(brands, eq(transactions.brandId, brands.id))
    .leftJoin(projects, eq(transactions.projectId, projects.id))
    .leftJoin(users, eq(transactions.createdById, users.id))
    .orderBy(desc(transactions.transactionDate))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  // Get count
  const countQuery = db.select({ count: count() }).from(transactions);

  // Apply where clause if exists
  const [transactionsList, countResult] = await Promise.all([
    whereClause ? transactionsQuery.where(whereClause) : transactionsQuery,
    whereClause ? countQuery.where(whereClause) : countQuery,
  ]);

  const total = countResult[0]?.count ?? 0;

  return {
    data: transactionsList.map((transaction) =>
      toSerializableTransaction(transaction),
    ) as unknown as TransactionWithRelations[],
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
      createdAt: transactions.createdAt,
      updatedAt: transactions.updatedAt,
      brand: {
        id: brands.id,
        name: brands.name,
      },
      project: {
        id: projects.id,
        name: projects.name,
      },
      createdBy: {
        id: users.id,
        name: users.name,
      },
    })
    .from(transactions)
    .leftJoin(brands, eq(transactions.brandId, brands.id))
    .leftJoin(projects, eq(transactions.projectId, projects.id))
    .leftJoin(users, eq(transactions.createdById, users.id))
    .where(eq(transactions.id, id))
    .limit(1);

  const transaction = result[0];

  if (!transaction) {
    return null;
  }

  return toSerializableTransaction(
    transaction,
  ) as unknown as TransactionWithRelations;
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

    // Get existing transaction
    const existingResult = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id))
      .limit(1);

    const existing = existingResult[0];

    if (!existing) {
      return { success: false, error: "Transaction not found" };
    }

    // Build update data
    const updateData: Record<string, unknown> = {
      ...input,
      updatedAt: new Date(),
    };

    // Recalculate USD value if amount or currency changed
    if (input.originalAmount || input.originalCurrency) {
      const amount = input.originalAmount || Number(existing.originalAmount);
      const currency = input.originalCurrency || existing.originalCurrency;

      if (currency !== "USD") {
        const conversion = await convertToUSD(amount, currency);
        updateData.conversionRate = String(
          input.conversionRate || conversion.conversionRate,
        );
        updateData.usdValue = String(
          amount * Number(updateData.conversionRate),
        );
      } else {
        updateData.conversionRate = "1";
        updateData.usdValue = String(amount);
      }
    }

    // Convert numeric fields to strings for decimal storage
    if (updateData.originalAmount) {
      updateData.originalAmount = String(updateData.originalAmount);
    }

    await db
      .update(transactions)
      .set(updateData)
      .where(eq(transactions.id, id));

    // Get updated transaction
    const updatedResult = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id))
      .limit(1);

    const transaction = updatedResult[0];

    // Create audit log
    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "TRANSACTION_UPDATED",
      entityType: "TRANSACTION",
      entityId: id,
      oldData: JSON.stringify(existing),
      newData: JSON.stringify(input),
      createdAt: new Date(),
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/transactions");

    return { success: true, data: toSerializableTransaction(transaction) };
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

    // Get existing transaction
    const existingResult = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id))
      .limit(1);

    const transaction = existingResult[0];

    if (!transaction) {
      return { success: false, error: "Transaction not found" };
    }

    // Delete the transaction
    await db.delete(transactions).where(eq(transactions.id, id));

    // Create audit log
    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "TRANSACTION_DELETED",
      entityType: "TRANSACTION",
      entityId: id,
      oldData: JSON.stringify(transaction),
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
