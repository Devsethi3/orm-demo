// src/actions/currency.ts
"use server";

import db  from "@/lib/db";
import { FALLBACK_RATES } from "@/lib/currency";

export async function fetchExchangeRate(
  from: string,
  to: string,
): Promise<number> {
  if (from === to) return 1;

  try {
    // Try database first
    const fromCurrency = await db.currency.findUnique({
      where: { code: from },
    });
    const toCurrency = await db.currency.findUnique({
      where: { code: to },
    });

    if (fromCurrency && toCurrency) {
      const dbRate = await db.exchangeRate.findFirst({
        where: {
          fromCurrencyId: fromCurrency.id,
          toCurrencyId: toCurrency.id,
          OR: [{ validTo: null }, { validTo: { gte: new Date() } }],
        },
        orderBy: { validFrom: "desc" },
      });

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
