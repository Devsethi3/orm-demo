// src/lib/currency.server.ts
// This file contains server-only code - DO NOT import in client components
import { eq, and, or, gte, desc, isNull } from "drizzle-orm";
import db from "./db";
import { currencies, exchangeRates } from "@/db/schema";

export interface ExchangeRateData {
  from: string;
  to: string;
  rate: number;
  timestamp: Date;
}

// Cache for exchange rates (5 minutes)
const rateCache = new Map<string, { rate: number; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getExchangeRateFromDB(
  from: string,
  to: string,
): Promise<number | null> {
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

  return null;
}

export async function fetchExternalRate(
  from: string,
  to: string,
): Promise<number> {
  const apiUrl =
    process.env.EXCHANGE_RATE_API_URL ||
    "https://api.exchangerate-api.com/v4/latest";

  try {
    const response = await fetch(`${apiUrl}/${from}`, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error("Failed to fetch exchange rate");
    }

    const data = await response.json();
    return data.rates[to] || 1;
  } catch (error) {
    console.error("Failed to fetch external rate:", error);
    throw error;
  }
}

export async function getExchangeRate(
  from: string,
  to: string,
): Promise<number> {
  if (from === to) return 1;

  const cacheKey = `${from}_${to}`;
  const cached = rateCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.rate;
  }

  // Try database first
  const dbRate = await getExchangeRateFromDB(from, to);
  if (dbRate !== null) {
    rateCache.set(cacheKey, { rate: dbRate, timestamp: Date.now() });
    return dbRate;
  }

  // Try external API
  try {
    const rate = await fetchExternalRate(from, to);
    rateCache.set(cacheKey, { rate, timestamp: Date.now() });
    return rate;
  } catch (error) {
    // Fallback rates
    const fallbackRates: Record<string, Record<string, number>> = {
      USD: { INR: 83.5, EUR: 0.92, AED: 3.67, GBP: 0.79 },
      INR: { USD: 0.012, EUR: 0.011, AED: 0.044, GBP: 0.0095 },
      EUR: { USD: 1.09, INR: 90.5, AED: 4.0, GBP: 0.86 },
      AED: { USD: 0.27, INR: 22.75, EUR: 0.25, GBP: 0.22 },
      GBP: { USD: 1.27, INR: 105.5, EUR: 1.16, AED: 4.64 },
    };
    return fallbackRates[from]?.[to] || 1;
  }
}

export async function convertToUSD(
  amount: number,
  fromCurrency: string,
): Promise<{
  usdValue: number;
  conversionRate: number;
}> {
  if (fromCurrency === "USD") {
    return { usdValue: amount, conversionRate: 1 };
  }

  const rate = await getExchangeRate(fromCurrency, "USD");
  return {
    usdValue: amount * rate,
    conversionRate: rate,
  };
}

export async function convertCurrency(
  amount: number,
  from: string,
  to: string,
): Promise<{ convertedAmount: number; rate: number }> {
  const rate = await getExchangeRate(from, to);
  return {
    convertedAmount: amount * rate,
    rate,
  };
}
