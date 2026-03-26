import {
  pgTable,
  text,
  timestamp,
  numeric,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { currencies, bankAccounts, brands } from "./finance";

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: text("id").primaryKey(),
    brandId: text("brand_id")
      .notNull()
      .references(() => brands.id),
    name: text("name").notNull(),
    provider: text("provider"),
    category: text("category").notNull(),
    billingCycle: text("billing_cycle").notNull(), // monthly | yearly
    amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
    currency: text("currency")
      .notNull()
      .references(() => currencies.code),
    defaultPaymentAccountId: text("default_payment_account_id").references(
      () => bankAccounts.id,
    ),
    nextBillingDate: timestamp("next_billing_date"),
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date"),
    autoRenew: boolean("auto_renew").notNull().default(true),
    status: text("status").notNull().default("active"),
    notes: text("notes"),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    brandIdIdx: index("subscriptions_brand_id_idx").on(table.brandId),
    statusIdx: index("subscriptions_status_idx").on(table.status),
    nextBillingIdx: index("subscriptions_next_billing_idx").on(
      table.nextBillingDate,
    ),
    categoryIdx: index("subscriptions_category_idx").on(table.category),
  }),
);
