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
import { Prisma } from "@/generated/prisma/client";
import { convertToUSD } from "@/lib/currency.server";

function toSerializableTransaction<T extends {
  originalAmount: Prisma.Decimal;
  conversionRate: Prisma.Decimal;
  usdValue: Prisma.Decimal;
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

    const transaction = await db.$transaction(async (tx) => {
      // Create transaction
      const newTransaction = await tx.transaction.create({
        data: {
          brandId: data.brandId,
          projectId: data.projectId || null,
          type: data.type,
          source: data.source,
          description: data.description,
          originalAmount: data.originalAmount,
          originalCurrency: data.originalCurrency,
          conversionRate,
          usdValue,
          transactionDate: data.transactionDate,
          reference: data.reference,
          notes: data.notes,
          createdById: session.user.id,
        },
        include: {
          brand: { select: { id: true, name: true } },
          project: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
        },
      });

      return newTransaction;
    });

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "TRANSACTION_CREATED",
        entityType: "TRANSACTION",
        entityId: transaction.id,
        newData: data as unknown as Prisma.JsonObject,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/transactions");

    return { success: true, data: toSerializableTransaction(transaction) };
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

  const where: Prisma.TransactionWhereInput = {};

  if (brandId) where.brandId = brandId;
  if (type) where.type = type;
  if (source) where.source = source;
  if (startDate || endDate) {
    where.transactionDate = {};
    if (startDate) where.transactionDate.gte = startDate;
    if (endDate) where.transactionDate.lte = endDate;
  }
  if (search) {
    where.OR = [
      { description: { contains: search, mode: "insensitive" } },
      { reference: { contains: search, mode: "insensitive" } },
      { notes: { contains: search, mode: "insensitive" } },
    ];
  }

  // Restrict by role
  if (session.user.role === "PARTNER") {
    const partner = await db.partner.findUnique({
      where: { userId: session.user.id },
    });
    if (partner) {
      where.brandId = partner.brandId;
    }
  }

  const [transactions, total] = await Promise.all([
    db.transaction.findMany({
      where,
      include: {
        brand: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { transactionDate: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.transaction.count({ where }),
  ]);

  return {
    data: transactions.map((transaction) =>
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

  const transaction = await db.transaction.findUnique({
    where: { id },
    include: {
      brand: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

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

    const existing = await db.transaction.findUnique({
      where: { id },
    });

    if (!existing) {
      return { success: false, error: "Transaction not found" };
    }

    // Recalculate USD value if amount or currency changed
    let updateData: Prisma.TransactionUpdateInput = { ...input };

    if (input.originalAmount || input.originalCurrency) {
      const amount = input.originalAmount || Number(existing.originalAmount);
      const currency = input.originalCurrency || existing.originalCurrency;

      if (currency !== "USD") {
        const conversion = await convertToUSD(amount, currency);
        updateData.conversionRate =
          input.conversionRate || conversion.conversionRate;
        updateData.usdValue = amount * Number(updateData.conversionRate);
      } else {
        updateData.conversionRate = 1;
        updateData.usdValue = amount;
      }
    }

    const transaction = await db.transaction.update({
      where: { id },
      data: updateData,
    });

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "TRANSACTION_UPDATED",
        entityType: "TRANSACTION",
        entityId: id,
        oldData: existing as unknown as Prisma.JsonObject,
        newData: input as unknown as Prisma.JsonObject,
      },
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

    const transaction = await db.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      return { success: false, error: "Transaction not found" };
    }

    await db.transaction.delete({
      where: { id },
    });

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "TRANSACTION_DELETED",
        entityType: "TRANSACTION",
        entityId: id,
        oldData: transaction as unknown as Prisma.JsonObject,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/transactions");

    return { success: true };
  } catch (error) {
    console.error("Delete transaction error:", error);
    return { success: false, error: "Failed to delete transaction" };
  }
}
