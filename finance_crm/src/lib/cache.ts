import {
  revalidateTag as nextRevalidateTag,
  revalidatePath as nextRevalidatePath,
} from "next/cache";

export function invalidateTag(tag: string): void {
  try {
    (nextRevalidateTag as (tag: string) => void)(tag);
  } catch {
    console.warn(`[Cache] Failed to invalidate tag: ${tag}`);
  }
}

export function invalidateTags(...tags: string[]): void {
  for (const tag of tags) {
    invalidateTag(tag);
  }
}

export function invalidatePath(path: string): void {
  nextRevalidatePath(path);
}

export function invalidatePaths(...paths: string[]): void {
  for (const path of paths) {
    nextRevalidatePath(path);
  }
}

export function invalidateTransactionCaches(): void {
  invalidateTags(
    "bank-accounts",
    "dashboard-summary",
    "revenue-over-time",
    "revenue-by-brand",
    "expense-breakdown",
    "profit-vs-expenses",
    "recent-transactions",
  );
  invalidatePaths("/transactions", "/", "/analytics", "/accounts");
}

export function invalidateSalaryCaches(): void {
  invalidateTags(
    "salary-payments",
    "employees",
    "salary-expense",
    "bank-accounts",
    "dashboard-summary",
    "expense-breakdown",
    "profit-vs-expenses",
    "recent-transactions",
  );
  invalidatePaths("/salaries", "/transactions", "/accounts", "/", "/analytics");
}

export function invalidateSubscriptionCaches(): void {
  invalidateTags("subscriptions", "expense-breakdown", "dashboard-summary");
  invalidatePaths("/subscriptions", "/");
}

export function invalidateBrandCaches(): void {
  invalidateTags(
    "brands",
    "projects",
    "bank-accounts",
    "dashboard-summary",
    "revenue-by-brand",
  );
  invalidatePaths("/accounts", "/transactions", "/");
}

export function invalidateCurrencyCaches(): void {
  invalidateTags("currencies", "exchange-rates", "dashboard-summary");
  invalidatePaths("/settings", "/transactions", "/");
}
