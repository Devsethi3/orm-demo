import {
  pgTable,
  text,
  timestamp,
  numeric,
  boolean,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./auth";

export const currencies = pgTable("currencies", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  symbol: text("symbol").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const exchangeRates = pgTable(
  "exchange_rates",
  {
    id: text("id").primaryKey(),
    fromCurrency: text("from_currency")
      .notNull()
      .references(() => currencies.code),
    toCurrency: text("to_currency")
      .notNull()
      .references(() => currencies.code),
    rate: numeric("rate", { precision: 18, scale: 8 }).notNull(),
    effectiveFrom: timestamp("effective_from").notNull().defaultNow(),
    effectiveTo: timestamp("effective_to"),
    setBy: text("set_by").references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    currencyPairIdx: index("exchange_rates_pair_idx").on(
      table.fromCurrency,
      table.toCurrency,
    ),
    effectiveIdx: index("exchange_rates_effective_idx").on(
      table.effectiveFrom,
      table.effectiveTo,
    ),
  }),
);

export const brands = pgTable("brands", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  color: text("color").default("#6366f1"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const projects = pgTable(
  "projects",
  {
    id: text("id").primaryKey(),
    brandId: text("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    clientName: text("client_name"),
    totalBudget: numeric("total_budget", { precision: 18, scale: 2 }),
    budgetCurrency: text("budget_currency").default("USD"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    brandIdIdx: index("projects_brand_id_idx").on(table.brandId),
    slugIdx: index("projects_slug_idx").on(table.slug),
  }),
);

export const milestones = pgTable(
  "milestones",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    amount: numeric("amount", { precision: 18, scale: 2 }),
    currency: text("currency").default("USD"),
    status: text("status").notNull().default("pending"),
    dueDate: timestamp("due_date"),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    projectIdIdx: index("milestones_project_id_idx").on(table.projectId),
  }),
);

export const bankAccounts = pgTable(
  "bank_accounts",
  {
    id: text("id").primaryKey(),
    brandId: text("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    bankName: text("bank_name").notNull(),
    accountNumber: text("account_number"),
    currency: text("currency")
      .notNull()
      .references(() => currencies.code),
    initialBalance: numeric("initial_balance", {
      precision: 18,
      scale: 2,
    })
      .notNull()
      .default("0"),
    currentBalance: numeric("current_balance", {
      precision: 18,
      scale: 2,
    })
      .notNull()
      .default("0"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    brandIdIdx: index("bank_accounts_brand_id_idx").on(table.brandId),
    currencyIdx: index("bank_accounts_currency_idx").on(table.currency),
  }),
);

export const transactions = pgTable(
  "transactions",
  {
    id: text("id").primaryKey(),
    type: text("type").notNull(), // 'income' | 'expense'
    brandId: text("brand_id")
      .notNull()
      .references(() => brands.id),
    projectId: text("project_id").references(() => projects.id),
    milestoneId: text("milestone_id").references(() => milestones.id),
    bankAccountId: text("bank_account_id")
      .notNull()
      .references(() => bankAccounts.id),
    source: text("source").notNull(), // paypal, bank, upwork, contra, other
    category: text("category"),
    description: text("description"),
    originalAmount: numeric("original_amount", {
      precision: 18,
      scale: 2,
    }).notNull(),
    originalCurrency: text("original_currency")
      .notNull()
      .references(() => currencies.code),
    conversionRate: numeric("conversion_rate", {
      precision: 18,
      scale: 8,
    }).notNull(),
    usdBaseValue: numeric("usd_base_value", {
      precision: 18,
      scale: 2,
    }).notNull(),
    transactionDate: timestamp("transaction_date").notNull(),
    notes: text("notes"),
    // Audit fields
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    // Transactions are immutable - no updatedAt
    isVoided: boolean("is_voided").notNull().default(false),
    voidedBy: text("voided_by").references(() => users.id),
    voidedAt: timestamp("voided_at"),
    voidReason: text("void_reason"),
  },
  (table) => ({
    brandIdIdx: index("transactions_brand_id_idx").on(table.brandId),
    projectIdIdx: index("transactions_project_id_idx").on(table.projectId),
    typeIdx: index("transactions_type_idx").on(table.type),
    dateIdx: index("transactions_date_idx").on(table.transactionDate),
    sourceIdx: index("transactions_source_idx").on(table.source),
    bankAccountIdx: index("transactions_bank_account_idx").on(
      table.bankAccountId,
    ),
    createdByIdx: index("transactions_created_by_idx").on(table.createdBy),
    compositeIdx: index("transactions_composite_idx").on(
      table.brandId,
      table.type,
      table.transactionDate,
    ),
  }),
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => users.id),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    entityId: text("entity_id"),
    metadata: text("metadata"), // JSON string
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("audit_logs_user_id_idx").on(table.userId),
    entityIdx: index("audit_logs_entity_idx").on(table.entity, table.entityId),
    createdAtIdx: index("audit_logs_created_at_idx").on(table.createdAt),
  }),
);
