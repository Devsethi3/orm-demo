import Decimal from "decimal.js";
import { BASE_CURRENCY } from "./constants";

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export function convertToBase(
  amount: string | number,
  fromCurrency: string,
  rate: string | number,
): string {
  if (fromCurrency === BASE_CURRENCY) {
    return new Decimal(amount.toString()).toFixed(2);
  }
  const a = new Decimal(amount.toString());
  const r = new Decimal(rate.toString());
  // rate is how many USD per 1 unit of foreign currency
  return a.mul(r).toFixed(2);
}

export function convertFromBase(
  usdAmount: string | number,
  toCurrency: string,
  rate: string | number,
): string {
  if (toCurrency === BASE_CURRENCY) {
    return new Decimal(usdAmount.toString()).toFixed(2);
  }
  const a = new Decimal(usdAmount.toString());
  const r = new Decimal(rate.toString());
  return a.div(r).toFixed(2);
}

export function calculateConversionRate(
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, string>,
): string {
  if (fromCurrency === toCurrency) return "1";

  // Rates are stored as USD -> X
  // e.g., rates["INR"] = "83.5" means 1 USD = 83.5 INR
  if (fromCurrency === BASE_CURRENCY) {
    return new Decimal(1).div(new Decimal(rates[toCurrency] || "1")).toFixed(8);
  }

  if (toCurrency === BASE_CURRENCY) {
    return new Decimal(1)
      .div(new Decimal(rates[fromCurrency] || "1"))
      .toFixed(8);
  }

  // Cross-rate through USD
  const fromUsdRate = new Decimal(rates[fromCurrency] || "1");
  const toUsdRate = new Decimal(rates[toCurrency] || "1");
  return toUsdRate.div(fromUsdRate).toFixed(8);
}

export function getCurrencySymbol(code: string): string {
  const symbols: Record<string, string> = {
    USD: "$",
    INR: "₹",
    EUR: "€",
    AED: "د.إ",
    GBP: "£",
  };
  return symbols[code] || code;
}
