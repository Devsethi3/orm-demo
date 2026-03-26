"use server";

import { getSession } from "@/lib/auth";
import type { DashboardStats, MonthlyData } from "@/types";
import { subMonths, startOfMonth, endOfMonth, format } from "date-fns";

import db from "@/lib/db";

export async function getDashboardStats(): Promise<DashboardStats | null> {
  const session = await getSession();

  if (!session) return null;

  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const currentMonthEnd = endOfMonth(now);
  const previousMonthStart = startOfMonth(subMonths(now, 1));
  const previousMonthEnd = endOfMonth(subMonths(now, 1));

  try {
    // Sequential queries - Neon HTTP doesn't support transactions
    const currentMonthTransactions = await db.transaction.findMany({
      where: {
        transactionDate: {
          gte: currentMonthStart,
          lte: currentMonthEnd,
        },
      },
    });

    const previousMonthTransactions = await db.transaction.findMany({
      where: {
        transactionDate: {
          gte: previousMonthStart,
          lte: previousMonthEnd,
        },
      },
    });

    const brands = await db.brand.findMany({
      where: { isActive: true },
      include: {
        transactions: {
          where: {
            transactionDate: {
              gte: currentMonthStart,
            },
          },
        },
      },
    });

    const recentTransactions = await db.transaction.findMany({
      take: 10,
      orderBy: { transactionDate: "desc" },
      include: {
        brand: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

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
    const revenueByBrand = brands.map((brand) => {
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

    // Monthly data for charts (last 6 months) - sequential queries due to Neon HTTP limitations
    const monthlyTransactionsResults = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      const monthTransactions = await db.transaction.findMany({
        where: {
          transactionDate: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      });
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
      recentTransactions: recentTransactions as any,
      monthlyData,
    };
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return null;
  }
}
