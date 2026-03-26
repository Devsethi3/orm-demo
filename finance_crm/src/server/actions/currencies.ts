"use server";

import { db } from "@/db";
import { currencies, exchangeRates } from "@/db/schema";
import { requirePermission } from "@/server/auth";
import { createAuditLog } from "@/lib/audit";
import { handleActionError } from "@/lib/errors";
import { generateId } from "@/lib/utils";
import { sanitizeObject } from "@/lib/sanitize";
import { currencySchema, exchangeRateSchema } from "@/modules/finance/schemas";
import { eq, and, isNull } from "drizzle-orm";
import {
  invalidateCurrencyCaches,
  invalidateTag,
  invalidatePath,
} from "@/lib/cache";
import type { ActionResponse } from "@/types";

export async function createCurrency(
  input: unknown,
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await requirePermission("manage:currencies");
    const validated = currencySchema.parse(
      sanitizeObject(input as Record<string, unknown>),
    );
    const id = generateId("cur");

    const existing = await db
      .select()
      .from(currencies)
      .where(eq(currencies.code, validated.code))
      .limit(1);

    if (existing.length > 0) {
      return { success: false, error: "Currency code already exists" };
    }

    await db.insert(currencies).values({
      id,
      code: validated.code,
      name: validated.name,
      symbol: validated.symbol,
    });

    await createAuditLog({
      userId: session.user.id,
      action: "create",
      entity: "currency",
      entityId: id,
      metadata: { code: validated.code, name: validated.name },
    });

    invalidateCurrencyCaches();

    return { success: true, data: { id } };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateCurrency(
  id: string,
  input: unknown,
): Promise<ActionResponse> {
  try {
    const session = await requirePermission("manage:currencies");
    const validated = currencySchema.parse(
      sanitizeObject(input as Record<string, unknown>),
    );

    await db
      .update(currencies)
      .set({
        name: validated.name,
        symbol: validated.symbol,
        updatedAt: new Date(),
      })
      .where(eq(currencies.id, id));

    await createAuditLog({
      userId: session.user.id,
      action: "update",
      entity: "currency",
      entityId: id,
    });

    invalidateCurrencyCaches();

    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function toggleCurrencyStatus(
  id: string,
): Promise<ActionResponse> {
  try {
    const session = await requirePermission("manage:currencies");

    const currency = await db
      .select()
      .from(currencies)
      .where(eq(currencies.id, id))
      .limit(1);

    if (currency.length === 0) {
      return { success: false, error: "Currency not found" };
    }

    if (currency[0].code === "USD" && currency[0].isActive) {
      return { success: false, error: "Cannot deactivate base currency (USD)" };
    }

    await db
      .update(currencies)
      .set({ isActive: !currency[0].isActive, updatedAt: new Date() })
      .where(eq(currencies.id, id));

    await createAuditLog({
      userId: session.user.id,
      action: "update",
      entity: "currency",
      entityId: id,
      metadata: { isActive: !currency[0].isActive },
    });

    invalidateCurrencyCaches();

    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function setExchangeRate(
  input: unknown,
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await requirePermission("manage:currencies");
    const validated = exchangeRateSchema.parse(input);

    if (validated.fromCurrency === validated.toCurrency) {
      return { success: false, error: "Currencies must be different" };
    }

    // Close existing open rate
    await db
      .update(exchangeRates)
      .set({ effectiveTo: new Date() })
      .where(
        and(
          eq(exchangeRates.fromCurrency, validated.fromCurrency),
          eq(exchangeRates.toCurrency, validated.toCurrency),
          isNull(exchangeRates.effectiveTo),
        ),
      );

    const id = generateId("rate");

    await db.insert(exchangeRates).values({
      id,
      fromCurrency: validated.fromCurrency,
      toCurrency: validated.toCurrency,
      rate: validated.rate,
      setBy: session.user.id,
    });

    await createAuditLog({
      userId: session.user.id,
      action: "settings_change",
      entity: "exchange_rate",
      entityId: id,
      metadata: {
        pair: `${validated.fromCurrency}/${validated.toCurrency}`,
        rate: validated.rate,
      },
    });

    invalidateCurrencyCaches();

    return { success: true, data: { id } };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function seedDefaultCurrencies(): Promise<ActionResponse> {
  try {
    const session = await requirePermission("manage:currencies");

    const defaults = [
      { code: "USD", name: "US Dollar", symbol: "$" },
      { code: "INR", name: "Indian Rupee", symbol: "₹" },
      { code: "EUR", name: "Euro", symbol: "€" },
      { code: "AED", name: "UAE Dirham", symbol: "د.إ" },
    ];

    let created = 0;
    for (const cur of defaults) {
      const existing = await db
        .select()
        .from(currencies)
        .where(eq(currencies.code, cur.code))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(currencies).values({
          id: generateId("cur"),
          ...cur,
        });
        created++;
      }
    }

    await createAuditLog({
      userId: session.user.id,
      action: "create",
      entity: "currency",
      metadata: { action: "seed_defaults", created },
    });

    invalidateCurrencyCaches();

    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}
