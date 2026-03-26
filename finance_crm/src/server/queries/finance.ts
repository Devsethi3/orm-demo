import { db } from "@/db";
import { unstable_cache } from "next/cache";
import {
  transactions,
  bankAccounts,
  brands,
  projects,
  milestones,
  currencies,
  exchangeRates,
  employees,
  salaryPayments,
  subscriptions,
} from "@/db/schema";
import {
  eq,
  and,
  gte,
  lte,
  desc,
  asc,
  sql,
  isNull,
  count,
  sum,
  or,
  ilike,
} from "drizzle-orm";
import type {
  FilterParams,
  PaginationParams,
  PaginatedResponse,
} from "@/types";

export const getBrands = unstable_cache(
  async () => {
    return db
      .select()
      .from(brands)
      .where(eq(brands.isActive, true))
      .orderBy(asc(brands.name));
  },
  ["brands"],
  { revalidate: 300, tags: ["brands"] },
);

export async function getProjects(brandId?: string) {
  const conditions = [eq(projects.isActive, true)];
  if (brandId) conditions.push(eq(projects.brandId, brandId));

  return db
    .select({
      id: projects.id,
      brandId: projects.brandId,
      name: projects.name,
      slug: projects.slug,
      description: projects.description,
      clientName: projects.clientName,
      totalBudget: projects.totalBudget,
      budgetCurrency: projects.budgetCurrency,
      brandName: brands.name,
      brandColor: brands.color,
    })
    .from(projects)
    .leftJoin(brands, eq(projects.brandId, brands.id))
    .where(and(...conditions))
    .orderBy(asc(projects.name));
}

export async function getMilestones(projectId: string) {
  return db
    .select()
    .from(milestones)
    .where(eq(milestones.projectId, projectId))
    .orderBy(asc(milestones.name));
}

// === Bank Accounts ===
export const getBankAccounts = unstable_cache(
  async (brandId?: string) => {
    const conditions = [];
    if (brandId) conditions.push(eq(bankAccounts.brandId, brandId));

    return db
      .select({
        id: bankAccounts.id,
        brandId: bankAccounts.brandId,
        name: bankAccounts.name,
        bankName: bankAccounts.bankName,
        accountNumber: bankAccounts.accountNumber,
        currency: bankAccounts.currency,
        initialBalance: bankAccounts.initialBalance,
        currentBalance: bankAccounts.currentBalance,
        isActive: bankAccounts.isActive,
        brandName: brands.name,
        brandColor: brands.color,
      })
      .from(bankAccounts)
      .leftJoin(brands, eq(bankAccounts.brandId, brands.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(bankAccounts.name));
  },
  ["bank-accounts"],
  { revalidate: 120, tags: ["bank-accounts"] },
);

export const getCurrencies = unstable_cache(
  async () => {
    return db
      .select()
      .from(currencies)
      .where(eq(currencies.isActive, true))
      .orderBy(asc(currencies.code));
  },
  ["currencies"],
  { revalidate: 600, tags: ["currencies"] },
);

export async function getCurrentExchangeRates() {
  return db
    .select()
    .from(exchangeRates)
    .where(isNull(exchangeRates.effectiveTo))
    .orderBy(desc(exchangeRates.effectiveFrom));
}

export async function getExchangeRateHistory(
  fromCurrency: string,
  toCurrency: string,
) {
  return db
    .select()
    .from(exchangeRates)
    .where(
      and(
        eq(exchangeRates.fromCurrency, fromCurrency),
        eq(exchangeRates.toCurrency, toCurrency),
      ),
    )
    .orderBy(desc(exchangeRates.effectiveFrom))
    .limit(50);
}

// === Transactions ===
export async function getTransactions(
  filters: FilterParams = {},
  pagination: PaginationParams = { page: 1, pageSize: 20 },
): Promise<PaginatedResponse<any>> {
  const conditions = [eq(transactions.isVoided, false)];

  if (filters.brandId) {
    conditions.push(eq(transactions.brandId, filters.brandId));
  }
  if (filters.projectId) {
    conditions.push(eq(transactions.projectId, filters.projectId));
  }
  if (filters.source) {
    conditions.push(eq(transactions.source, filters.source));
  }
  if (filters.type) {
    conditions.push(eq(transactions.type, filters.type));
  }
  if (filters.dateRange?.from) {
    conditions.push(gte(transactions.transactionDate, filters.dateRange.from));
  }
  if (filters.dateRange?.to) {
    conditions.push(lte(transactions.transactionDate, filters.dateRange.to));
  }
  if (filters.search) {
    conditions.push(
      or(
        ilike(transactions.description, `%${filters.search}%`),
        ilike(transactions.notes, `%${filters.search}%`),
      )!,
    );
  }

  const whereClause = and(...conditions);

  const [totalResult] = await db
    .select({ total: count() })
    .from(transactions)
    .where(whereClause);

  const offset = (pagination.page - 1) * pagination.pageSize;

  const data = await db
    .select({
      id: transactions.id,
      type: transactions.type,
      brandId: transactions.brandId,
      projectId: transactions.projectId,
      milestoneId: transactions.milestoneId,
      bankAccountId: transactions.bankAccountId,
      source: transactions.source,
      category: transactions.category,
      description: transactions.description,
      originalAmount: transactions.originalAmount,
      originalCurrency: transactions.originalCurrency,
      conversionRate: transactions.conversionRate,
      usdBaseValue: transactions.usdBaseValue,
      transactionDate: transactions.transactionDate,
      notes: transactions.notes,
      isVoided: transactions.isVoided,
      createdAt: transactions.createdAt,
      brandName: brands.name,
      brandColor: brands.color,
      projectName: projects.name,
      accountName: bankAccounts.name,
    })
    .from(transactions)
    .leftJoin(brands, eq(transactions.brandId, brands.id))
    .leftJoin(projects, eq(transactions.projectId, projects.id))
    .leftJoin(bankAccounts, eq(transactions.bankAccountId, bankAccounts.id))
    .where(whereClause)
    .orderBy(desc(transactions.transactionDate), desc(transactions.createdAt))
    .limit(pagination.pageSize)
    .offset(offset);

  return {
    data,
    total: totalResult.total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages: Math.ceil(totalResult.total / pagination.pageSize),
  };
}

// === Employees & Salaries ===
export async function getEmployees(brandId?: string) {
  const conditions = [eq(employees.isActive, true)];
  if (brandId) conditions.push(eq(employees.brandId, brandId));

  return db
    .select({
      id: employees.id,
      brandId: employees.brandId,
      name: employees.name,
      email: employees.email,
      position: employees.position,
      department: employees.department,
      monthlySalary: employees.monthlySalary,
      salaryCurrency: employees.salaryCurrency,
      startDate: employees.startDate,
      brandName: brands.name,
    })
    .from(employees)
    .leftJoin(brands, eq(employees.brandId, brands.id))
    .where(and(...conditions))
    .orderBy(asc(employees.name));
}

export async function getSalaryPayments(
  employeeId?: string,
  year?: number,
  month?: number,
) {
  const conditions = [];
  if (employeeId) conditions.push(eq(salaryPayments.employeeId, employeeId));
  if (year) conditions.push(eq(salaryPayments.year, year));
  if (month) conditions.push(eq(salaryPayments.month, month));

  return db
    .select({
      id: salaryPayments.id,
      employeeId: salaryPayments.employeeId,
      month: salaryPayments.month,
      year: salaryPayments.year,
      amount: salaryPayments.amount,
      currency: salaryPayments.currency,
      usdBaseValue: salaryPayments.usdBaseValue,
      status: salaryPayments.status,
      paidAt: salaryPayments.paidAt,
      employeeName: employees.name,
      employeePosition: employees.position,
    })
    .from(salaryPayments)
    .leftJoin(employees, eq(salaryPayments.employeeId, employees.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(
      desc(salaryPayments.year),
      desc(salaryPayments.month),
      asc(employees.name),
    );
}

// === Subscriptions ===
export async function getSubscriptions(brandId?: string) {
  const conditions = [];
  if (brandId) conditions.push(eq(subscriptions.brandId, brandId));

  return db
    .select({
      id: subscriptions.id,
      brandId: subscriptions.brandId,
      name: subscriptions.name,
      provider: subscriptions.provider,
      category: subscriptions.category,
      billingCycle: subscriptions.billingCycle,
      amount: subscriptions.amount,
      currency: subscriptions.currency,
      nextBillingDate: subscriptions.nextBillingDate,
      startDate: subscriptions.startDate,
      autoRenew: subscriptions.autoRenew,
      status: subscriptions.status,
      brandName: brands.name,
    })
    .from(subscriptions)
    .leftJoin(brands, eq(subscriptions.brandId, brands.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(subscriptions.name));
}
