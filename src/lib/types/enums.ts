// src/lib/types/enums.ts
// These are client-safe enums - no Prisma imports

export const UserRole = {
  ADMIN: "ADMIN",
  ACCOUNT_EXECUTIVE: "ACCOUNT_EXECUTIVE",
  PARTNER: "PARTNER",
  CLIENT: "CLIENT",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const UserStatus = {
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
  PENDING: "PENDING",
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const InviteStatus = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  EXPIRED: "EXPIRED",
  REVOKED: "REVOKED",
} as const;
export type InviteStatus = (typeof InviteStatus)[keyof typeof InviteStatus];

export const TransactionType = {
  INCOME: "INCOME",
  EXPENSE: "EXPENSE",
  TRANSFER: "TRANSFER",
} as const;
export type TransactionType =
  (typeof TransactionType)[keyof typeof TransactionType];

export const TransactionSource = {
  PAYPAL: "PAYPAL",
  BANK: "BANK",
  UPWORK: "UPWORK",
  CONTRA: "CONTRA",
  OTHER: "OTHER",
} as const;
export type TransactionSource =
  (typeof TransactionSource)[keyof typeof TransactionSource];

export const PaymentStatus = {
  PENDING: "PENDING",
  PAID: "PAID",
  PARTIAL: "PARTIAL",
  OVERDUE: "OVERDUE",
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const BillingCycle = {
  MONTHLY: "MONTHLY",
  QUARTERLY: "QUARTERLY",
  YEARLY: "YEARLY",
  ONE_TIME: "ONE_TIME",
} as const;
export type BillingCycle = (typeof BillingCycle)[keyof typeof BillingCycle];
