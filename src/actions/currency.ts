// src/actions/currency.ts
"use server";

import db from "@/lib/db";
import { FALLBACK_RATES } from "@/lib/currency";
import { eq } from "drizzle-orm";
import { currencies, exchangeRates } from "@/db/schema";

export async function fetchExchangeRate(
  from: string,
  to: string,
): Promise<number> {
  if (from === to) return 1;

  try {
    // Try database first
    const fromCurrencies = await db
      .select()
      .from(currencies)
      .where(eq(currencies.code, from))
      .limit(1);
    const fromCurrency = fromCurrencies[0];

    const toCurrencies = await db
      .select()
      .from(currencies)
      .where(eq(currencies.code, to))
      .limit(1);
    const toCurrency = toCurrencies[0];

    if (fromCurrency && toCurrency) {
      const rates = await db
        .select()
        .from(exchangeRates)
        .where(eq(exchangeRates.fromCurrencyId, fromCurrency.id))
        .limit(1);

      if (rates.length > 0) {
        return Number(rates[0].rate);
      }
    }

    // Try external API
    const apiUrl =
      process.env.EXCHANGE_RATE_API_URL ||
      "https://api.exchangerate-api.com/v4/latest";

    const response = await fetch(`${apiUrl}/${from}`, {
      next: { revalidate: 300 },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.rates?.[to]) {
        return data.rates[to];
      }
    }
  } catch (error) {
    console.error("Error fetching exchange rate:", error);
  }

  // Fallback
  return FALLBACK_RATES[from]?.[to] || 1;
}

export async function convertToUSD(
  amount: number,
  fromCurrency: string,
): Promise<{ usdValue: number; conversionRate: number }> {
  if (fromCurrency === "USD") {
    return { usdValue: amount, conversionRate: 1 };
  }

  const rate = await fetchExchangeRate(fromCurrency, "USD");
  return {
    usdValue: amount * rate,
    conversionRate: rate,
  };
}
