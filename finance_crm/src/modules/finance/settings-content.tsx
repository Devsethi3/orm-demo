import {
  getCurrencies,
  getCurrentExchangeRates,
} from "@/server/queries/finance";
import { CurrencySettings } from "./currency-settings";
import { ExchangeRateSettings } from "./exchange-rate-settings";
import { InvitationSettings } from "./invitation-settings";

export async function SettingsContent() {
  const [currencies, rates] = await Promise.all([
    getCurrencies(),
    getCurrentExchangeRates(),
  ]);

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        <CurrencySettings currencies={currencies} />
        <ExchangeRateSettings currencies={currencies} rates={rates} />
      </div>
      <InvitationSettings />
    </div>
  );
}
