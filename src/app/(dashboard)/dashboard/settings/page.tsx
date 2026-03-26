import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import db from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { SettingsTabs } from "./settings-tabs";

export default async function SettingsPage() {
  const session = await getSession();

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const currencies = await db.currency.findMany({
    orderBy: { code: "asc" },
  });

  const exchangeRates = await db.exchangeRate.findMany({
    include: {
      fromCurrency: true,
      toCurrency: true,
    },
    orderBy: { validFrom: "desc" },
    take: 20,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage system settings and configurations"
      />
      <SettingsTabs
        currencies={currencies}
        exchangeRates={exchangeRates}
        currentUser={{
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
        }}
      />
    </div>
  );
}
