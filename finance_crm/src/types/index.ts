export type UserRole = "admin" | "finance" | "hr" | "viewer";

export type TransactionType = "income" | "expense";

export type TransactionSource =
  | "paypal"
  | "bank"
  | "upwork"
  | "contra"
  | "other";

export type BillingCycle = "monthly" | "yearly";

export type SalaryStatus = "pending" | "paid" | "cancelled";

export type SubscriptionStatus = "active" | "paused" | "cancelled";

export type CurrencyCode = "USD" | "INR" | "EUR" | "AED" | string;

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DateRange {
  from: Date;
  to: Date;
}

export interface FilterParams {
  brandId?: string;
  projectId?: string;
  source?: TransactionSource;
  dateRange?: DateRange;
  type?: TransactionType;
  search?: string;
}
