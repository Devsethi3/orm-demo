"use server";

import { getSession } from "@/lib/auth";
import type { DashboardStats, MonthlyData, TransactionWithRelations } from "@/types";
import { subMonths, startOfMonth, endOfMonth, format } from "date-fns";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import db from "@/lib/db";
import { transactions, brands, projects, users } from "@/db/schema";

export async function getDashboardStats(): Promise<DashboardStats | null> {
  const session = await getSession();

  if (!session) return null;

  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const currentMonthEnd = endOfMonth(now);
  const previousMonthStart = startOfMonth(subMonths(now, 1));
  const previousMonthEnd = endOfMonth(subMonths(now, 1));

  try {
    const currentMonthTransactions = await db
      .select()
      .from(transactions)
      .where(
        and(
          gte(transactions.transactionDate, currentMonthStart),
          lte(transactions.transactionDate, currentMonthEnd),
        ),
      );

    const previousMonthTransactions = await db
      .select()
      .from(transactions)
      .where(
        and(
          gte(transactions.transactionDate, previousMonthStart),
          lte(transactions.transactionDate, previousMonthEnd),
        ),
      );

    const activeBrands = await db
      .select()
      .from(brands)
      .where(eq(brands.isActive, true));

    // Get brand transactions for current month
    const brandTransactionsMap = new Map<string, typeof currentMonthTransactions>();
    for (const brand of activeBrands) {
      const brandTxns = await db
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.brandId, brand.id),
            gte(transactions.transactionDate, currentMonthStart),
          ),
        );
      brandTransactionsMap.set(brand.id, brandTxns);
    }

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
        createdByName: users.name,
        createdById_: users.id,
      })
      .from(transactions)
      .innerJoin(brands, eq(transactions.brandId, brands.id))
      .leftJoin(projects, eq(transactions.projectId, projects.id))
      .innerJoin(users, eq(transactions.createdById, users.id))
      .orderBy(desc(transactions.transactionDate))
      .limit(10);

    const recentTransactions = txList.map((tx) => ({
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

    // Calculate current month totals
    const currentRevenue = currentMonthTransactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + Number(t.usdValue), 0);

    const currentExpenses = currentMonthTransactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + Number(t.usdValue), 0);

    // Calculate previous month totals
    const previousRevenue = previousMonthTransactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + Number(t.usdValue), 0);

    const previousExpenses = previousMonthTransactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + Number(t.usdValue), 0);

    // Calculate percentage changes (avoid NaN/Infinity)
    const revenueChange = previousRevenue > 0
      ? Math.min(((currentRevenue - previousRevenue) / previousRevenue) * 100, 999)
      : currentRevenue > 0
        ? 100
        : 0;

    const expenseChange = previousExpenses > 0
      ? Math.min(((currentExpenses - previousExpenses) / previousExpenses) * 100, 999)
      : currentExpenses > 0
        ? 100
        : 0;

    // Revenue by brand
    const revenueByBrand = activeBrands.map((brand) => {
      const brandTransactions = brandTransactionsMap.get(brand.id) || [];
      const revenue = brandTransactions
        .filter((t) => t.type === "INCOME")
        .reduce((sum, t) => sum + Number(t.usdValue), 0);
      const expenses = brandTransactions
        .filter((t) => t.type === "EXPENSE")
        .reduce((sum, t) => sum + Number(t.usdValue), 0);

      return {
        brandId: brand.id,
        brandName: brand.name,
        revenue,
        expenses,
        profit: revenue - expenses,
      };
    });

    const monthlyTransactionsResults: Array<typeof currentMonthTransactions> = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      const monthTransactions = await db
        .select()
        .from(transactions)
        .where(
          and(
            gte(transactions.transactionDate, monthStart),
            lte(transactions.transactionDate, monthEnd),
          ),
        );

      monthlyTransactionsResults.push(monthTransactions);
    }

    const monthlyData: MonthlyData[] = monthlyTransactionsResults.map(
      (monthTransactions, index) => {
        const monthDate = subMonths(now, 5 - index);

        const revenue = monthTransactions
          .filter((t) => t.type === "INCOME")
          .reduce((sum, t) => sum + Number(t.usdValue), 0);

        const expenses = monthTransactions
          .filter((t) => t.type === "EXPENSE")
          .reduce((sum, t) => sum + Number(t.usdValue), 0);

        return {
          month: format(monthDate, "MMM yyyy"),
          revenue,
          expenses,
        };
      },
    );

    return {
      totalRevenue: currentRevenue,
      totalExpenses: currentExpenses,
      netIncome: currentRevenue - currentExpenses,
      revenueChange,
      expenseChange,
      revenueByBrand,
      recentTransactions: recentTransactions as unknown as TransactionWithRelations[],
      monthlyData,
    };
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return null;
  }
}
