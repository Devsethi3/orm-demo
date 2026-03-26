"use client";

import { useState } from "react";
import { useAction } from "@/hooks/use-actions";
import { setExchangeRate } from "@/server/actions/currencies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "motion/react";
import { formatDate } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  Loading03Icon,
  Refresh01Icon,
} from "@hugeicons/core-free-icons";

interface ExchangeRateSettingsProps {
  currencies: { id: string; code: string; name: string; symbol: string }[];
  rates: {
    id: string;
    fromCurrency: string;
    toCurrency: string;
    rate: string;
    effectiveFrom: Date;
  }[];
}

export function ExchangeRateSettings({
  currencies,
  rates,
}: ExchangeRateSettingsProps) {
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("");
  const [rate, setRate] = useState("");
  const { execute, isPending, error } = useAction(setExchangeRate);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await execute({ fromCurrency, toCurrency, rate });
    if (result.success) {
      setRate("");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-xl border border-border bg-card p-6"
    >
      <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
        <HugeiconsIcon icon={Refresh01Icon} className="h-4 w-4" />
        Exchange Rates
      </h3>

      {/* Current Rates */}
      <div className="space-y-2 mb-4">
        {rates.map((r) => (
          <div
            key={r.id}
            className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
          >
            <div className="flex items-center gap-2 text-sm">
              <span className="font-mono">{r.fromCurrency}</span>
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                className="h-3 w-3 text-muted-foreground"
              />
              <span className="font-mono">{r.toCurrency}</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-mono font-semibold">{r.rate}</p>
              <p className="text-xs text-muted-foreground">
                Since {formatDate(r.effectiveFrom)}
              </p>
            </div>
          </div>
        ))}
        {rates.length === 0 && (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No exchange rates set
          </p>
        )}
      </div>

      {/* Set Rate Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-3 border-t border-border pt-4"
      >
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-xs">From</Label>
            <Select value={fromCurrency} onValueChange={setFromCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">To</Label>
            <Select value={toCurrency} onValueChange={setToCurrency}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {currencies
                  .filter((c) => c.code !== fromCurrency)
                  .map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.code}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Rate</Label>
            <Input
              type="number"
              step="0.00000001"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder="83.50"
              required
            />
          </div>
        </div>
        <Button type="submit" size="sm" disabled={isPending || !toCurrency}>
          {isPending && (
            <HugeiconsIcon
              icon={Loading03Icon}
              className="mr-1 h-3 w-3 animate-spin"
            />
          )}
          Set Rate
        </Button>
      </form>
    </motion.div>
  );
}
