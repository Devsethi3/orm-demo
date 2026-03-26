// src/lib/validations/index.ts
import { z } from "zod";

// Import from our client-safe enums, NOT from Prisma
import {
  UserRole,
  TransactionType,
  TransactionSource,
  BillingCycle,
} from "@/lib/types/enums";

// ============================================
// HELPER FUNCTIONS
// ============================================

const numberField = (options?: {
  positive?: boolean;
  min?: number;
  max?: number;
}) => {
  return z
    .union([z.string(), z.number()])
    .transform((val) => {
      if (typeof val === "string") {
        if (val === "") return 0;
        return parseFloat(val);
      }
      return val;
    })
    .refine((val) => !isNaN(val), { message: "Must be a valid number" })
    .refine((val) => !options?.positive || val > 0, {
      message: "Must be positive",
    })
    .refine((val) => options?.min === undefined || val >= options.min, {
      message: `Must be at least ${options?.min}`,
    })
    .refine((val) => options?.max === undefined || val <= options.max, {
      message: `Must be at most ${options?.max}`,
    });
};

const optionalNumberField = () =>
  z
    .union([z.string(), z.number(), z.undefined(), z.null()])
    .transform((val) => {
      if (val === undefined || val === null || val === "") return undefined;
      if (typeof val === "string") return parseFloat(val);
      return val;
    });

const dateField = () =>
  z.union([z.string(), z.date()]).transform((val) => {
    if (typeof val === "string") {
      return new Date(val);
    }
    return val;
  });

const optionalDateField = () =>
  z.union([z.string(), z.date(), z.undefined(), z.null()]).transform((val) => {
    if (val === undefined || val === null || val === "") return undefined;
    if (typeof val === "string") return new Date(val);
    return val;
  });

// ============================================
// AUTH SCHEMAS
// ============================================

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["ADMIN", "ACCOUNT_EXECUTIVE", "PARTNER", "CLIENT"]),
  brandId: z.string().optional(),
});

export const acceptInviteSchema = z.object({
  token: z.string(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export const updateProfileNameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),
});

// ============================================
// BRAND SCHEMAS
// ============================================

export const brandSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  logoUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
});

// ============================================
// TRANSACTION SCHEMAS
// ============================================

export const transactionSchema = z.object({
  brandId: z.string().min(1, "Brand is required"),
  projectId: z.string().optional(),
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
  source: z.enum(["PAYPAL", "BANK", "UPWORK", "CONTRA", "OTHER"]),
  description: z.string().optional(),
  originalAmount: numberField({ positive: true }),
  originalCurrency: z.string().length(3, "Currency must be 3 characters"),
  conversionRate: optionalNumberField(),
  transactionDate: dateField(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

// ============================================
// EMPLOYEE SCHEMAS
// ============================================

export const employeeSchema = z.object({
  brandId: z.string().min(1, "Brand is required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  position: z.string().min(2, "Position is required"),
  department: z.string().optional(),
  salaryAmount: numberField({ positive: true }),
  salaryCurrency: z.string().length(3, "Currency must be 3 characters"),
  paymentDay: numberField({ min: 1, max: 31 }),
  joinDate: dateField(),
});

export const salaryPaymentSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  amount: numberField({ positive: true }),
  currency: z.string().length(3, "Currency must be 3 characters"),
  paymentDate: dateField(),
  periodStart: dateField(),
  periodEnd: dateField(),
  notes: z.string().optional(),
});

// ============================================
// SUBSCRIPTION SCHEMAS
// ============================================

export const subscriptionSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  provider: z.string().optional(),
  description: z.string().optional(),
  cost: numberField({ positive: true }),
  currency: z.string().length(3, "Currency must be 3 characters"),
  billingCycle: z.enum(["MONTHLY", "QUARTERLY", "YEARLY", "ONE_TIME"]),
  nextDueDate: dateField(),
  category: z.string().optional(),
  url: z.string().url("Invalid URL").optional().or(z.literal("")),
  autoRenew: z.boolean().default(true),
  reminderDays: numberField({ min: 0, max: 30 }),
});

// ============================================
// PARTNER SCHEMAS
// ============================================

export const partnerSchema = z.object({
  userId: z.string().min(1, "User is required"),
  brandId: z.string().min(1, "Brand is required"),
  revenueShare: numberField({ min: 0, max: 100 }),
  profitShare: numberField({ min: 0, max: 100 }),
});

// ============================================
// PROJECT SCHEMAS
// ============================================

export const projectSchema = z.object({
  brandId: z.string().min(1, "Brand is required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  clientName: z.string().optional(),
  budget: optionalNumberField(),
  currency: z
    .string()
    .length(3, "Currency must be 3 characters")
    .default("USD"),
  startDate: optionalDateField(),
  endDate: optionalDateField(),
});

// ============================================
// CURRENCY SCHEMAS
// ============================================

export const currencySchema = z.object({
  code: z.string().length(3, "Currency code must be 3 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  symbol: z.string().min(1, "Symbol is required"),
});

export const exchangeRateSchema = z.object({
  fromCurrencyId: z.string().min(1, "From currency is required"),
  toCurrencyId: z.string().min(1, "To currency is required"),
  rate: numberField({ positive: true }),
  isManual: z.boolean().default(true),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type InviteInput = z.infer<typeof inviteSchema>;
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;
export type UpdateProfileNameInput = z.infer<typeof updateProfileNameSchema>;
export type BrandInput = z.infer<typeof brandSchema>;
export type TransactionInput = z.infer<typeof transactionSchema>;
export type EmployeeInput = z.infer<typeof employeeSchema>;
export type SalaryPaymentInput = z.infer<typeof salaryPaymentSchema>;
export type SubscriptionInput = z.infer<typeof subscriptionSchema>;
export type PartnerInput = z.infer<typeof partnerSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
export type CurrencyInput = z.infer<typeof currencySchema>;
export type ExchangeRateInput = z.infer<typeof exchangeRateSchema>;
