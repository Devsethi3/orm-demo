"use client";

import { useState } from "react";
import { useAction } from "@/hooks/use-actions";
import {
  createCurrency,
  seedDefaultCurrencies,
} from "@/server/actions/currencies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PlusSignIcon,
  Loading03Icon,
  CoinsIcon,
} from "@hugeicons/core-free-icons";
import { motion } from "motion/react";

interface CurrencySettingsProps {
  currencies: {
    id: string;
    code: string;
    name: string;
    symbol: string;
    isActive: boolean;
  }[];
}

export function CurrencySettings({ currencies }: CurrencySettingsProps) {
  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const { execute, isPending, error } = useAction(createCurrency);
  const { execute: executeSeed, isPending: seeding } = useAction(
    seedDefaultCurrencies,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await execute({ code, name, symbol });
    if (result.success) {
      setCode("");
      setName("");
      setSymbol("");
      setShowForm(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <HugeiconsIcon icon={CoinsIcon} className="h-4 w-4" />
          Currencies
        </h3>
        <div className="flex gap-2">
          {currencies.length === 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => executeSeed(undefined as any)}
              disabled={seeding}
            >
              {seeding && (
                <HugeiconsIcon
                  icon={Loading03Icon}
                  className="mr-1 h-3 w-3 animate-spin"
                />
              )}
              Seed Defaults
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowForm(!showForm)}
          >
            <HugeiconsIcon icon={PlusSignIcon} className="h-3 w-3 mr-1" />
            Add
          </Button>
        </div>
      </div>

      {/* Currency List */}
      <div className="flex flex-wrap gap-2 mb-4">
        {currencies.map((c) => (
          <Badge key={c.id} variant="secondary" className="text-xs">
            {c.symbol} {c.code} — {c.name}
          </Badge>
        ))}
      </div>

      {/* Add Form */}
      {showForm && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          onSubmit={handleSubmit}
          className="space-y-3 border-t border-border pt-4"
        >
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs">Code</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="USD"
                maxLength={3}
                required
              />
            </div>
            <div>
              <Label className="text-xs">Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.name)}
                placeholder="US Dollar"
                required
              />
            </div>
            <div>
              <Label className="text-xs">Symbol</Label>
              <Input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="$"
                required
              />
            </div>
          </div>
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending && (
              <HugeiconsIcon
                icon={Loading03Icon}
                className="mr-1 h-3 w-3 animate-spin"
              />
            )}
            Add Currency
          </Button>
        </motion.form>
      )}
    </motion.div>
  );
}
