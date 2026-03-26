"use server";

import { getSession } from "@/lib/auth";
import type { DashboardStats, MonthlyData } from "@/types";
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
    // Current month transactions
    const currentMonthTransactions = await db
      .select()
      .from(transactions)
      .where(
        and(
          gte(transactions.transactionDate, currentMonthStart),
          lte(transactions.transactionDate, currentMonthEnd),
        ),
      );

    // Previous month transactions
    const previousMonthTransactions = await db
      .select()
      .from(transactions)
      .where(
        and(
          gte(transactions.transactionDate, previousMonthStart),
          lte(transactions.transactionDate, previousMonthEnd),
        ),
      );

    // Active brands
    const activeBrands = await db
      .select()
      .from(brands)
      .where(eq(brands.isActive, true));

    // For each brand, fetch their current month transactions
    const brandsWithTransactions = await Promise.all(
      activeBrands.map(async (brand) => {
        const brandTransactions = await db
          .select()
          .from(transactions)
          .where(
            and(
              eq(transactions.brandId, brand.id),
              gte(transactions.transactionDate, currentMonthStart),
            ),
          );
        return { ...brand, transactions: brandTransactions };
      }),
    );

    // Recent transactions with joins
    const recentTransactionsRaw = await db
      .select({
        id: transactions.id,
        brandId: transactions.brandId,
        projectId: transactions.projectId,
        type: transactions.type,
        usdValue: transactions.usdValue,
        transactionDate: transactions.transactionDate,
        description: transactions.description,
        source: transactions.source,
        originalCurrency: transactions.originalCurrency,
        originalAmount: transactions.originalAmount,
        conversionRate: transactions.conversionRate,
        reference: transactions.reference,
        notes: transactions.notes,
        createdAt: transactions.createdAt,
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
      .limit(10);

    // Convert decimal strings to numbers
    const recentTransactions = recentTransactionsRaw.map((t) => ({
      ...t,
      originalAmount: Number(t.originalAmount),
      conversionRate: Number(t.conversionRate),
      usdValue: Number(t.usdValue),
    }));

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

    // Calculate percentage changes
    const revenueChange =
      previousRevenue > 0
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
        : currentRevenue > 0
          ? 100
          : 0;

    const expenseChange =
      previousExpenses > 0
        ? ((currentExpenses - previousExpenses) / previousExpenses) * 100
        : currentExpenses > 0
          ? 100
          : 0;

    // Revenue by brand
    const revenueByBrand = brandsWithTransactions.map((brand) => {
      const brandTransactions = brand.transactions;
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

    // Monthly data for charts (last 6 months)
    const monthlyTransactionsResults = [];
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
      recentTransactions,
      monthlyData,
    };
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return null;
  }
}
