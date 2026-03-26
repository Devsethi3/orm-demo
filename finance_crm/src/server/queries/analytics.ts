import { db } from "@/db";
import { transactions, salaryPayments, employees, brands } from "@/db/schema";
import { eq, and, gte, lte, desc, sql, sum, count } from "drizzle-orm";
import type { FilterParams } from "@/types";

export async function getDashboardSummary(filters: FilterParams = {}) {
  const conditions = [eq(transactions.isVoided, false)];
  if (filters.brandId)
    conditions.push(eq(transactions.brandId, filters.brandId));
  if (filters.dateRange?.from)
    conditions.push(gte(transactions.transactionDate, filters.dateRange.from));
  if (filters.dateRange?.to)
    conditions.push(lte(transactions.transactionDate, filters.dateRange.to));

  const whereClause = and(...conditions);

  const [revenue] = await db
    .select({
      total: sum(transactions.usdBaseValue),
      count: count(),
    })
    .from(transactions)
    .where(and(whereClause, eq(transactions.type, "income")));

  const [expenses] = await db
    .select({
      total: sum(transactions.usdBaseValue),
      count: count(),
    })
    .from(transactions)
    .where(and(whereClause, eq(transactions.type, "expense")));

  return {
    totalRevenue: revenue.total || "0",
    revenueCount: revenue.count,
    totalExpenses: expenses.total || "0",
    expenseCount: expenses.count,
    netProfit: (
      parseFloat(revenue.total || "0") - parseFloat(expenses.total || "0")
    ).toFixed(2),
  };
}

export async function getRevenueOverTime(
  filters: FilterParams = {},
  groupBy: "day" | "week" | "month" = "month",
) {
  const conditions = [
    eq(transactions.isVoided, false),
    eq(transactions.type, "income"),
  ];

  if (filters.brandId)
    conditions.push(eq(transactions.brandId, filters.brandId));
  if (filters.dateRange?.from)
    conditions.push(gte(transactions.transactionDate, filters.dateRange.from));
  if (filters.dateRange?.to)
    conditions.push(lte(transactions.transactionDate, filters.dateRange.to));
  if (filters.source) conditions.push(eq(transactions.source, filters.source));

  let dateExpression: ReturnType<typeof sql>;
  switch (groupBy) {
    case "day":
      dateExpression = sql`DATE(${transactions.transactionDate})`;
      break;
    case "week":
      dateExpression = sql`DATE_TRUNC('week', ${transactions.transactionDate})`;
      break;
    case "month":
    default:
      dateExpression = sql`DATE_TRUNC('month', ${transactions.transactionDate})`;
      break;
  }

  return db
    .select({
      period: dateExpression.as("period"),
      total: sum(transactions.usdBaseValue).as("total"),
      count: count().as("count"),
    })
    .from(transactions)
    .where(and(...conditions))
    .groupBy(dateExpression)
    .orderBy(dateExpression);
}

export async function getRevenueByBrand(filters: FilterParams = {}) {
  const conditions = [
    eq(transactions.isVoided, false),
    eq(transactions.type, "income"),
  ];

  if (filters.dateRange?.from)
    conditions.push(gte(transactions.transactionDate, filters.dateRange.from));
  if (filters.dateRange?.to)
    conditions.push(lte(transactions.transactionDate, filters.dateRange.to));

  return db
    .select({
      brandId: transactions.brandId,
      brandName: brands.name,
      brandColor: brands.color,
      total: sum(transactions.usdBaseValue).as("total"),
      count: count().as("count"),
    })
    .from(transactions)
    .leftJoin(brands, eq(transactions.brandId, brands.id))
    .where(and(...conditions))
    .groupBy(transactions.brandId, brands.name, brands.color)
    .orderBy(desc(sql`total`));
}

export async function getExpenseBreakdown(filters: FilterParams = {}) {
  const conditions = [
    eq(transactions.isVoided, false),
    eq(transactions.type, "expense"),
  ];

  if (filters.brandId)
    conditions.push(eq(transactions.brandId, filters.brandId));
  if (filters.dateRange?.from)
    conditions.push(gte(transactions.transactionDate, filters.dateRange.from));
  if (filters.dateRange?.to)
    conditions.push(lte(transactions.transactionDate, filters.dateRange.to));

  return db
    .select({
      category: transactions.category,
      total: sum(transactions.usdBaseValue).as("total"),
      count: count().as("count"),
    })
    .from(transactions)
    .where(and(...conditions))
    .groupBy(transactions.category)
    .orderBy(desc(sql`total`));
}

export async function getProfitVsExpenses(filters: FilterParams = {}) {
  const conditions = [eq(transactions.isVoided, false)];

  if (filters.brandId)
    conditions.push(eq(transactions.brandId, filters.brandId));
  if (filters.dateRange?.from)
    conditions.push(gte(transactions.transactionDate, filters.dateRange.from));
  if (filters.dateRange?.to)
    conditions.push(lte(transactions.transactionDate, filters.dateRange.to));

  const monthExpr = sql`DATE_TRUNC('month', ${transactions.transactionDate})`;

  return db
    .select({
      period: monthExpr.as("period"),
      type: transactions.type,
      total: sum(transactions.usdBaseValue).as("total"),
    })
    .from(transactions)
    .where(and(...conditions))
    .groupBy(monthExpr, transactions.type)
    .orderBy(monthExpr);
}

export async function getSalaryExpenseOverTime(filters: FilterParams = {}) {
  const conditions = [eq(salaryPayments.status, "paid")];

  return db
    .select({
      year: salaryPayments.year,
      month: salaryPayments.month,
      total: sum(salaryPayments.usdBaseValue).as("total"),
      count: count().as("count"),
    })
    .from(salaryPayments)
    .where(and(...conditions))
    .groupBy(salaryPayments.year, salaryPayments.month)
    .orderBy(salaryPayments.year, salaryPayments.month);
}

export async function getRecentTransactions(limit: number = 10) {
  return db
    .select({
      id: transactions.id,
      type: transactions.type,
      description: transactions.description,
      originalAmount: transactions.originalAmount,
      originalCurrency: transactions.originalCurrency,
      usdBaseValue: transactions.usdBaseValue,
      transactionDate: transactions.transactionDate,
      source: transactions.source,
      brandName: brands.name,
      brandColor: brands.color,
    })
    .from(transactions)
    .leftJoin(brands, eq(transactions.brandId, brands.id))
    .where(eq(transactions.isVoided, false))
    .orderBy(desc(transactions.transactionDate))
    .limit(limit);
}
