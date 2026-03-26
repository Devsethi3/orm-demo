export const APP_NAME = "Ocean Labs";
export const BASE_CURRENCY = "USD";

export const ROLES = {
  ADMIN: "admin",
  FINANCE: "finance",
  HR: "hr",
  VIEWER: "viewer",
} as const;

export const ROLE_PERMISSIONS = {
  admin: [
    "manage:users",
    "manage:settings",
    "manage:currencies",
    "manage:brands",
    "manage:accounts",
    "manage:transactions",
    "manage:salaries",
    "manage:subscriptions",
    "view:analytics",
    "view:audit",
    "manage:invitations",
  ],
  finance: [
    "manage:transactions",
    "manage:accounts",
    "manage:subscriptions",
    "view:analytics",
    "view:salaries",
    "manage:brands",
  ],
  hr: ["manage:salaries", "view:transactions", "view:analytics"],
  viewer: [
    "view:transactions",
    "view:analytics",
    "view:salaries",
    "view:subscriptions",
  ],
} as const;

export const TRANSACTION_SOURCES = [
  { value: "paypal", label: "PayPal" },
  { value: "bank", label: "Bank Transfer" },
  { value: "upwork", label: "Upwork" },
  { value: "contra", label: "Contra" },
  { value: "other", label: "Other" },
] as const;

export const EXPENSE_CATEGORIES = [
  { value: "salaries", label: "Salaries" },
  { value: "subscriptions", label: "Subscriptions" },
  { value: "tools", label: "Tools" },
  { value: "marketing", label: "Marketing" },
  { value: "operations", label: "Operations" },
  { value: "misc", label: "Miscellaneous" },
] as const;

export const BILLING_CYCLES = [
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
] as const;

export const DEFAULT_CURRENCIES = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ" },
] as const;

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

export const RATE_LIMITS = {
  LOGIN: { maxRequests: 5, windowMs: 15 * 60 * 1000 },
  API: { maxRequests: 100, windowMs: 60 * 1000 },
  MUTATION: { maxRequests: 30, windowMs: 60 * 1000 },
} as const;
