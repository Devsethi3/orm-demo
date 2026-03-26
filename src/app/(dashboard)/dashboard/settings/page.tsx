import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { SettingsTabs } from "./settings-tabs";
import { eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { currencies, exchangeRates } from "@/db/schema";

export default async function SettingsPage() {
  const session = await getSession();

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const currenciesList = await db
    .select()
    .from(currencies)
    .orderBy(currencies.code);

  const fromCurrency = alias(currencies, "fromCurrency");
  const toCurrency = alias(currencies, "toCurrency");

  const exchangeRatesList = await db
    .select({
      id: exchangeRates.id,
      rate: exchangeRates.rate,
      isManual: exchangeRates.isManual,
      validFrom: exchangeRates.validFrom,
      validTo: exchangeRates.validTo,
      fromCurrency: {
        code: fromCurrency.code,
      },
      toCurrency: {
        code: toCurrency.code,
      },
    })
    .from(exchangeRates)
    .innerJoin(fromCurrency, eq(exchangeRates.fromCurrencyId, fromCurrency.id))
    .innerJoin(toCurrency, eq(exchangeRates.toCurrencyId, toCurrency.id))
    .orderBy(exchangeRates.validFrom);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage system settings and configurations"
      />
      <SettingsTabs
        currencies={currenciesList}
        exchangeRates={exchangeRatesList}
        currentUser={{
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
        }}
      />
    </div>
  );
}
