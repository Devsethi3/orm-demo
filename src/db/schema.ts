import {
  boolean,
  date,
  decimal,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("UserRole", [
  "ADMIN",
  "ACCOUNT_EXECUTIVE",
  "PARTNER",
  "CLIENT",
]);

export const userStatusEnum = pgEnum("UserStatus", [
  "ACTIVE",
  "SUSPENDED",
  "PENDING",
]);

export const inviteStatusEnum = pgEnum("InviteStatus", [
  "PENDING",
  "ACCEPTED",
  "EXPIRED",
  "REVOKED",
]);

export const transactionTypeEnum = pgEnum("TransactionType", [
  "INCOME",
  "EXPENSE",
  "TRANSFER",
]);

export const transactionSourceEnum = pgEnum("TransactionSource", [
  "PAYPAL",
  "BANK",
  "UPWORK",
  "CONTRA",
  "OTHER",
]);

export const paymentStatusEnum = pgEnum("PaymentStatus", [
  "PENDING",
  "PAID",
  "PARTIAL",
  "OVERDUE",
]);

export const billingCycleEnum = pgEnum("BillingCycle", [
  "MONTHLY",
  "YEARLY",
  "QUARTERLY",
  "ONE_TIME",
]);

export const users = pgTable(
  "User",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("passwordHash").notNull(),
    role: userRoleEnum("role").default("CLIENT").notNull(),
    status: userStatusEnum("status").default("PENDING").notNull(),
    avatarUrl: text("avatarUrl"),
    lastLoginAt: timestamp("lastLoginAt", { withTimezone: true }),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("User_email_key").on(table.email),
    index("User_email_idx").on(table.email),
    index("User_role_idx").on(table.role),
    index("User_status_idx").on(table.status),
  ],
);

export const sessions = pgTable(
  "Session",
  {
    id: text("id").primaryKey(),
    userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
    userAgent: text("userAgent"),
    ipAddress: text("ipAddress"),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("Session_token_key").on(table.token),
    index("Session_userId_idx").on(table.userId),
    index("Session_token_idx").on(table.token),
  ],
);

export const invites = pgTable(
  "Invite",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    role: userRoleEnum("role").notNull(),
    token: text("token").notNull(),
    status: inviteStatusEnum("status").default("PENDING").notNull(),
    expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
    invitedById: text("invitedById").notNull().references(() => users.id),
    brandId: text("brandId"),
    acceptedAt: timestamp("acceptedAt", { withTimezone: true }),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("Invite_token_key").on(table.token),
    index("Invite_email_idx").on(table.email),
    index("Invite_token_idx").on(table.token),
    index("Invite_status_idx").on(table.status),
  ],
);

export const brands = pgTable(
  "Brand",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    logoUrl: text("logoUrl"),
    ownerId: text("ownerId").notNull().references(() => users.id),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("Brand_slug_key").on(table.slug),
    index("Brand_ownerId_idx").on(table.ownerId),
    index("Brand_slug_idx").on(table.slug),
  ],
);

export const brandMembers = pgTable(
  "BrandMember",
  {
    id: text("id").primaryKey(),
    brandId: text("brandId").notNull().references(() => brands.id, { onDelete: "cascade" }),
    userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: userRoleEnum("role").notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique("BrandMember_brandId_userId_key").on(table.brandId, table.userId),
    index("BrandMember_brandId_idx").on(table.brandId),
    index("BrandMember_userId_idx").on(table.userId),
  ],
);

export const projects = pgTable(
  "Project",
  {
    id: text("id").primaryKey(),
    brandId: text("brandId").notNull().references(() => brands.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    clientName: text("clientName"),
    budget: decimal("budget", { precision: 15, scale: 2 }),
    currency: text("currency").default("USD").notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    startDate: timestamp("startDate", { withTimezone: true }),
    endDate: timestamp("endDate", { withTimezone: true }),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("Project_brandId_idx").on(table.brandId)],
);

export const currencies = pgTable(
  "Currency",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    symbol: text("symbol").notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("Currency_code_key").on(table.code), index("Currency_code_idx").on(table.code)],
);

export const exchangeRates = pgTable(
  "ExchangeRate",
  {
    id: text("id").primaryKey(),
    fromCurrencyId: text("fromCurrencyId").notNull().references(() => currencies.id),
    toCurrencyId: text("toCurrencyId").notNull().references(() => currencies.id),
    rate: decimal("rate", { precision: 18, scale: 8 }).notNull(),
    isManual: boolean("isManual").default(false).notNull(),
    validFrom: timestamp("validFrom", { withTimezone: true }).defaultNow().notNull(),
    validTo: timestamp("validTo", { withTimezone: true }),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique("ExchangeRate_fromCurrencyId_toCurrencyId_validFrom_key").on(
      table.fromCurrencyId,
      table.toCurrencyId,
      table.validFrom,
    ),
    index("ExchangeRate_fromCurrencyId_toCurrencyId_idx").on(table.fromCurrencyId, table.toCurrencyId),
  ],
);

export const transactions = pgTable(
  "Transaction",
  {
    id: text("id").primaryKey(),
    brandId: text("brandId").notNull().references(() => brands.id, { onDelete: "cascade" }),
    projectId: text("projectId").references(() => projects.id),
    type: transactionTypeEnum("type").notNull(),
    source: transactionSourceEnum("source").notNull(),
    description: text("description"),
    originalAmount: decimal("originalAmount", { precision: 15, scale: 2 }).notNull(),
    originalCurrency: text("originalCurrency").notNull(),
    conversionRate: decimal("conversionRate", { precision: 18, scale: 8 }).notNull(),
    usdValue: decimal("usdValue", { precision: 15, scale: 2 }).notNull(),
    transactionDate: timestamp("transactionDate", { withTimezone: true }).notNull(),
    reference: text("reference"),
    notes: text("notes"),
    createdById: text("createdById").notNull().references(() => users.id),
    isReconciled: boolean("isReconciled").default(false).notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("Transaction_brandId_idx").on(table.brandId),
    index("Transaction_transactionDate_idx").on(table.transactionDate),
    index("Transaction_type_idx").on(table.type),
    index("Transaction_source_idx").on(table.source),
  ],
);

export const employees = pgTable(
  "Employee",
  {
    id: text("id").primaryKey(),
    userId: text("userId").references(() => users.id),
    brandId: text("brandId").notNull().references(() => brands.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    position: text("position").notNull(),
    department: text("department"),
    salaryAmount: decimal("salaryAmount", { precision: 15, scale: 2 }).notNull(),
    salaryCurrency: text("salaryCurrency").default("USD").notNull(),
    paymentDay: integer("paymentDay").default(1).notNull(),
    joinDate: timestamp("joinDate", { withTimezone: true }).notNull(),
    terminationDate: timestamp("terminationDate", { withTimezone: true }),
    isActive: boolean("isActive").default(true).notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("Employee_userId_key").on(table.userId),
    index("Employee_brandId_idx").on(table.brandId),
    index("Employee_email_idx").on(table.email),
  ],
);

export const salaryPayments = pgTable(
  "SalaryPayment",
  {
    id: text("id").primaryKey(),
    employeeId: text("employeeId").notNull().references(() => employees.id, { onDelete: "cascade" }),
    amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
    currency: text("currency").notNull(),
    conversionRate: decimal("conversionRate", { precision: 18, scale: 8 }).notNull(),
    usdValue: decimal("usdValue", { precision: 15, scale: 2 }).notNull(),
    paymentDate: timestamp("paymentDate", { withTimezone: true }).notNull(),
    periodStart: timestamp("periodStart", { withTimezone: true }).notNull(),
    periodEnd: timestamp("periodEnd", { withTimezone: true }).notNull(),
    status: paymentStatusEnum("status").default("PENDING").notNull(),
    notes: text("notes"),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("SalaryPayment_employeeId_idx").on(table.employeeId),
    index("SalaryPayment_paymentDate_idx").on(table.paymentDate),
    index("SalaryPayment_status_idx").on(table.status),
  ],
);

export const bonuses = pgTable(
  "Bonus",
  {
    id: text("id").primaryKey(),
    employeeId: text("employeeId").notNull().references(() => employees.id, { onDelete: "cascade" }),
    amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
    currency: text("currency").notNull(),
    reason: text("reason").notNull(),
    paymentDate: timestamp("paymentDate", { withTimezone: true }).notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("Bonus_employeeId_idx").on(table.employeeId)],
);

export const subscriptions = pgTable(
  "Subscription",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    provider: text("provider"),
    description: text("description"),
    cost: decimal("cost", { precision: 15, scale: 2 }).notNull(),
    currency: text("currency").default("USD").notNull(),
    billingCycle: billingCycleEnum("billingCycle").notNull(),
    nextDueDate: timestamp("nextDueDate", { withTimezone: true }).notNull(),
    lastPaidDate: timestamp("lastPaidDate", { withTimezone: true }),
    category: text("category"),
    url: text("url"),
    isActive: boolean("isActive").default(true).notNull(),
    autoRenew: boolean("autoRenew").default(true).notNull(),
    reminderDays: integer("reminderDays").default(7).notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("Subscription_nextDueDate_idx").on(table.nextDueDate), index("Subscription_isActive_idx").on(table.isActive)],
);

export const partners = pgTable(
  "Partner",
  {
    id: text("id").primaryKey(),
    userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    brandId: text("brandId").notNull().references(() => brands.id, { onDelete: "cascade" }),
    revenueShare: decimal("revenueShare", { precision: 5, scale: 2 }).notNull(),
    profitShare: decimal("profitShare", { precision: 5, scale: 2 }).notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    joinDate: timestamp("joinDate", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("Partner_userId_key").on(table.userId),
    index("Partner_brandId_idx").on(table.brandId),
    index("Partner_userId_idx").on(table.userId),
  ],
);

export const withdrawals = pgTable(
  "Withdrawal",
  {
    id: text("id").primaryKey(),
    partnerId: text("partnerId").notNull().references(() => partners.id, { onDelete: "cascade" }),
    amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
    currency: text("currency").default("USD").notNull(),
    status: paymentStatusEnum("status").default("PENDING").notNull(),
    requestedAt: timestamp("requestedAt", { withTimezone: true }).defaultNow().notNull(),
    processedAt: timestamp("processedAt", { withTimezone: true }),
    notes: text("notes"),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("Withdrawal_partnerId_idx").on(table.partnerId), index("Withdrawal_status_idx").on(table.status)],
);

export const auditLogs = pgTable(
  "AuditLog",
  {
    id: text("id").primaryKey(),
    userId: text("userId").notNull().references(() => users.id),
    action: text("action").notNull(),
    entityType: text("entityType").notNull(),
    entityId: text("entityId").notNull(),
    oldData: jsonb("oldData"),
    newData: jsonb("newData"),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("AuditLog_userId_idx").on(table.userId), index("AuditLog_entityType_entityId_idx").on(table.entityType, table.entityId)],
);

export const systemSettings = pgTable("SystemSettings", {
  id: text("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull(),
  value: jsonb("value").notNull(),
  description: text("description"),
  updatedById: text("updatedById").references(() => users.id),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;