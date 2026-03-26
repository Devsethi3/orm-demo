// src/lib/currency.ts
// Client-safe currency utilities - NO database imports

export const DEFAULT_CURRENCIES = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ" },
  { code: "GBP", name: "British Pound", symbol: "£" },
] as const;

export const FALLBACK_RATES: Record<string, Record<string, number>> = {
  USD: { INR: 83.5, EUR: 0.92, AED: 3.67, GBP: 0.79, USD: 1 },
  INR: { USD: 0.012, EUR: 0.011, AED: 0.044, GBP: 0.0095, INR: 1 },
  EUR: { USD: 1.09, INR: 90.5, AED: 4.0, GBP: 0.86, EUR: 1 },
  AED: { USD: 0.27, INR: 22.75, EUR: 0.25, GBP: 0.22, AED: 1 },
  GBP: { USD: 1.27, INR: 105.5, EUR: 1.16, AED: 4.64, GBP: 1 },
};

export function getClientFallbackRate(from: string, to: string): number {
  if (from === to) return 1;
  return FALLBACK_RATES[from]?.[to] || 1;
}

export function formatCurrency(
  amount: number | string,
  currency: string = "USD",
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;

  if (isNaN(num)) return `${currency} 0.00`;

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return `${currency} ${num.toFixed(2)}`;
  }
}

export function getCurrencySymbol(currency: string): string {
  const found = DEFAULT_CURRENCIES.find((c) => c.code === currency);
  return found?.symbol || currency;
}
