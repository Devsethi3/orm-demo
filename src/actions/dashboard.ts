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

    // Get all current month transactions (we'll aggregate by brand below)
    const allCurrentTransactions = await db
      .select()
      .from(transactions)
      .where(gte(transactions.transactionDate, currentMonthStart));

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

    // Revenue by brand - calculated from allCurrentTransactions
    const brandMap = new Map<string, { id: string; name: string; revenue: number; expenses: number }>();
    allCurrentTransactions.forEach((t) => {
      if (t.brandId) {
        const existing = brandMap.get(t.brandId) || {
          id: t.brandId,
          name: "",
          revenue: 0,
          expenses: 0,
        };
        if (t.type === "INCOME") {
          existing.revenue += Number(t.usdValue);
        } else {
          existing.expenses += Number(t.usdValue);
        }
        brandMap.set(t.brandId, existing);
      }
    });

    const revenueByBrand = Array.from(brandMap.values()).map((brand) => ({
      brandId: brand.id,
      brandName: brand.name || "Unknown",
      revenue: brand.revenue,
      expenses: brand.expenses,
      profit: brand.revenue - brand.expenses,
    }));

    // Monthly data - use only current and previous month
    const monthlyData: MonthlyData[] = [
      {
        month: format(subMonths(now, 1), "MMM yyyy"),
        revenue: previousRevenue,
        expenses: previousExpenses,
      },
      {
        month: format(now, "MMM yyyy"),
        revenue: currentRevenue,
        expenses: currentExpenses,
      },
    ];

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
