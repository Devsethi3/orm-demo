// src/actions/currency.ts
"use server";

import { eq, and, or, gte, desc, isNull } from "drizzle-orm";
import db from "@/lib/db";
import { currencies, exchangeRates } from "@/db/schema";
import { FALLBACK_RATES } from "@/lib/currency";

export async function fetchExchangeRate(
  from: string,
  to: string,
): Promise<number> {
  if (from === to) return 1;

  try {
    // Try database first
    const fromCurrencyResult = await db
      .select()
      .from(currencies)
      .where(eq(currencies.code, from))
      .limit(1);

    const toCurrencyResult = await db
      .select()
      .from(currencies)
      .where(eq(currencies.code, to))
      .limit(1);

    const fromCurrency = fromCurrencyResult[0];
    const toCurrency = toCurrencyResult[0];

    if (fromCurrency && toCurrency) {
      const dbRateResult = await db
        .select()
        .from(exchangeRates)
        .where(
          and(
            eq(exchangeRates.fromCurrencyId, fromCurrency.id),
            eq(exchangeRates.toCurrencyId, toCurrency.id),
            or(
              isNull(exchangeRates.validTo),
              gte(exchangeRates.validTo, new Date())
            )
          )
        )
        .orderBy(desc(exchangeRates.validFrom))
        .limit(1);

      const dbRate = dbRateResult[0];

      if (dbRate) {
        return Number(dbRate.rate);
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
