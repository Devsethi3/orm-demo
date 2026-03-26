import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { desc } from "drizzle-orm";
import { currencies, exchangeRates } from "@/db/schema";
import { PageHeader } from "@/components/layout/page-header";
import { SettingsTabs } from "./settings-tabs";

export default async function SettingsPage() {
  const session = await getSession();

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const currenciesList = await db
    .select()
    .from(currencies)
    .orderBy(currencies.code);

  const exchangeRatesList = await db
    .select()
    .from(exchangeRates)
    .orderBy(desc(exchangeRates.validFrom))
    .limit(20);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage system settings and configurations"
      />
      <SettingsTabs
        currencies={currenciesList as any}
        exchangeRates={exchangeRatesList as any}
        currentUser={{
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
        }}
      />
    </div>
  );
}
