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
import { currencies, bankAccounts, brands } from "./finance";

export const employees = pgTable(
  "employees",
  {
    id: text("id").primaryKey(),
    brandId: text("brand_id")
      .notNull()
      .references(() => brands.id),
    name: text("name").notNull(),
    email: text("email"),
    position: text("position"),
    department: text("department"),
    monthlySalary: numeric("monthly_salary", {
      precision: 18,
      scale: 2,
    }).notNull(),
    salaryCurrency: text("salary_currency")
      .notNull()
      .references(() => currencies.code),
    defaultPaymentAccountId: text("default_payment_account_id").references(
      () => bankAccounts.id,
    ),
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    brandIdIdx: index("employees_brand_id_idx").on(table.brandId),
    isActiveIdx: index("employees_is_active_idx").on(table.isActive),
  }),
);

export const salaryPayments = pgTable(
  "salary_payments",
  {
    id: text("id").primaryKey(),
    employeeId: text("employee_id")
      .notNull()
      .references(() => employees.id),
    bankAccountId: text("bank_account_id")
      .notNull()
      .references(() => bankAccounts.id),
    month: integer("month").notNull(), // 1-12
    year: integer("year").notNull(),
    amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
    currency: text("currency")
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
    status: text("status").notNull().default("pending"),
    paidAt: timestamp("paid_at"),
    transactionId: text("transaction_id"),
    notes: text("notes"),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    employeeIdIdx: index("salary_payments_employee_id_idx").on(
      table.employeeId,
    ),
    periodIdx: index("salary_payments_period_idx").on(table.year, table.month),
    statusIdx: index("salary_payments_status_idx").on(table.status),
  }),
);
