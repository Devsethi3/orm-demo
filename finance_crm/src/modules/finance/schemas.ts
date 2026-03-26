import { z } from "zod";

export const currencySchema = z.object({
  code: z
    .string()
    .min(3)
    .max(3)
    .transform((v) => v.toUpperCase()),
  name: z.string().min(1).max(100),
  symbol: z.string().min(1).max(10),
});

export const exchangeRateSchema = z.object({
  fromCurrency: z.string().min(3).max(3),
  toCurrency: z.string().min(3).max(3),
  rate: z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, {
    message: "Rate must be a positive number",
  }),
});

export const brandSchema = z.object({
  name: z.string().min(1, "Brand name is required").max(100),
  description: z.string().max(500).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
});

export const projectSchema = z.object({
  brandId: z.string().min(1, "Brand is required"),
  name: z.string().min(1, "Project name is required").max(200),
  description: z.string().max(1000).optional(),
  clientName: z.string().max(200).optional(),
  totalBudget: z.string().optional(),
  budgetCurrency: z.string().default("USD"),
});

export const milestoneSchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  name: z.string().min(1, "Milestone name is required").max(200),
  amount: z.string().optional(),
  currency: z.string().default("USD"),
  dueDate: z.string().optional(),
});

export const bankAccountSchema = z.object({
  brandId: z.string().min(1, "Brand is required"),
  name: z.string().min(1, "Account name is required").max(200),
  bankName: z.string().min(1, "Bank name is required").max(200),
  accountNumber: z.string().max(50).optional(),
  currency: z.string().min(3).max(3),
  initialBalance: z.string().default("0"),
});

export const transactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  brandId: z.string().min(1, "Brand is required"),
  projectId: z.string().optional(),
  milestoneId: z.string().optional(),
  bankAccountId: z.string().min(1, "Receiving account is required"),
  source: z.enum(["paypal", "bank", "upwork", "contra", "other"]),
  category: z.string().optional(),
  description: z.string().max(500).optional(),
  originalAmount: z
    .string()
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, {
      message: "Amount must be a positive number",
    }),
  originalCurrency: z.string().min(3).max(3),
  conversionRate: z
    .string()
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, {
      message: "Conversion rate must be positive",
    }),
  transactionDate: z.string().min(1, "Date is required"),
  notes: z.string().max(2000).optional(),
  honeypot: z.string().max(0, "Bot detected").optional(),
});

export const voidTransactionSchema = z.object({
  transactionId: z.string().min(1),
  reason: z.string().min(1, "Void reason is required").max(500),
});

export const employeeSchema = z.object({
  brandId: z.string().min(1, "Brand is required"),
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email().optional().or(z.literal("")),
  position: z.string().max(200).optional(),
  department: z.string().max(200).optional(),
  monthlySalary: z
    .string()
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, {
      message: "Salary must be a positive number",
    }),
  salaryCurrency: z.string().min(3).max(3),
  defaultPaymentAccountId: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
});

export const salaryPaymentSchema = z.object({
  employeeId: z.string().min(1),
  bankAccountId: z.string().min(1, "Payment account is required"),
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2100),
  amount: z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0),
  currency: z.string().min(3).max(3),
  conversionRate: z
    .string()
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0),
  notes: z.string().max(500).optional(),
});

export const subscriptionSchema = z.object({
  brandId: z.string().min(1, "Brand is required"),
  name: z.string().min(1, "Name is required").max(200),
  provider: z.string().max(200).optional(),
  category: z.string().min(1, "Category is required"),
  billingCycle: z.enum(["monthly", "yearly"]),
  amount: z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0),
  currency: z.string().min(3).max(3),
  defaultPaymentAccountId: z.string().optional(),
  nextBillingDate: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  autoRenew: z.boolean().default(true),
  notes: z.string().max(1000).optional(),
});

export type TransactionInput = z.infer<typeof transactionSchema>;
export type BrandInput = z.infer<typeof brandSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
export type BankAccountInput = z.infer<typeof bankAccountSchema>;
export type EmployeeInput = z.infer<typeof employeeSchema>;
export type SalaryPaymentInput = z.infer<typeof salaryPaymentSchema>;
export type SubscriptionInput = z.infer<typeof subscriptionSchema>;
