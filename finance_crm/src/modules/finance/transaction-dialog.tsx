"use client";

import { useState, useEffect } from "react";
import { useAction } from "@/hooks/use-actions";
import { createTransaction } from "@/server/actions/transactions";
import { motion, AnimatePresence } from "motion/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { TRANSACTION_SOURCES, EXPENSE_CATEGORIES } from "@/lib/constants";
import { calculateUsdBaseValue } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle03Icon,
  Loading03Icon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons";

export function TransactionDialog() {
  const [open, setOpen] = useState(false);
  const [success, setSuccess] = useState(false);
  const { execute, isPending, error } = useAction(createTransaction);

  // Form state
  const [formData, setFormData] = useState({
    type: "income" as "income" | "expense",
    brandId: "",
    projectId: "",
    milestoneId: "",
    bankAccountId: "",
    source: "" as string,
    category: "",
    description: "",
    originalAmount: "",
    originalCurrency: "USD",
    conversionRate: "1",
    transactionDate: new Date().toISOString().split("T")[0],
    notes: "",
    honeypot: "",
  });

  const [brands, setBrands] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);

  // Fetch reference data
  useEffect(() => {
    if (open) {
      Promise.all([
        fetch("/api/reference/brands").then((r) => r.json()),
        fetch("/api/reference/accounts").then((r) => r.json()),
        fetch("/api/reference/currencies").then((r) => r.json()),
      ]).then(([b, a, c]) => {
        setBrands(b.data || []);
        setAccounts(a.data || []);
        setCurrencies(c.data || []);
      });
    }
  }, [open]);

  // Fetch projects when brand changes
  useEffect(() => {
    if (formData.brandId) {
      fetch(`/api/reference/projects?brandId=${formData.brandId}`)
        .then((r) => r.json())
        .then((data) => setProjects(data.data || []));
    }
  }, [formData.brandId]);

  // Auto-calculate USD base value
  const usdBaseValue =
    formData.originalAmount && formData.conversionRate
      ? calculateUsdBaseValue(formData.originalAmount, formData.conversionRate)
      : "0.00";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await execute(formData);
    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
        // Reset form
        setFormData({
          type: "income",
          brandId: "",
          projectId: "",
          milestoneId: "",
          bankAccountId: "",
          source: "",
          category: "",
          description: "",
          originalAmount: "",
          originalCurrency: "USD",
          conversionRate: "1",
          transactionDate: new Date().toISOString().split("T")[0],
          notes: "",
          honeypot: "",
        });
      }, 1500);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <HugeiconsIcon icon={PlusSignIcon} className="mr-1 h-4 w-4" />
          New Transaction
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Transaction</DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12"
            >
              <HugeiconsIcon
                icon={CheckmarkCircle03Icon}
                className="h-12 w-12 text-green-500 mb-3"
              />
              <p className="text-lg font-semibold">Transaction Created</p>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {error && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {/* Honeypot */}
              <input
                type="text"
                name="honeypot"
                value={formData.honeypot}
                onChange={(e) => updateField("honeypot", e.target.value)}
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
              />

              {/* Type */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v) => updateField("type", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Source</Label>
                  <Select
                    value={formData.source}
                    onValueChange={(v) => updateField("source", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      {TRANSACTION_SOURCES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Brand & Project */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Brand *</Label>
                  <Select
                    value={formData.brandId}
                    onValueChange={(v) => updateField("brandId", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map((b: any) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Project</Label>
                  <Select
                    value={formData.projectId}
                    onValueChange={(v) => updateField("projectId", v)}
                    disabled={!formData.brandId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Account & Category */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Receiving Account *</Label>
                  <Select
                    value={formData.bankAccountId}
                    onValueChange={(v) => updateField("bankAccountId", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts
                        .filter((a: any) => a.isActive)
                        .map((a: any) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.name} ({a.currency})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                {formData.type === "expense" && (
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(v) => updateField("category", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Amount & Currency */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Amount *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.originalAmount}
                    onChange={(e) =>
                      updateField("originalAmount", e.target.value)
                    }
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select
                    value={formData.originalCurrency}
                    onValueChange={(v) => {
                      updateField("originalCurrency", v);
                      if (v === "USD") updateField("conversionRate", "1");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((c: any) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.symbol} {c.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Rate to USD</Label>
                  <Input
                    type="number"
                    step="0.00000001"
                    min="0.00000001"
                    value={formData.conversionRate}
                    onChange={(e) =>
                      updateField("conversionRate", e.target.value)
                    }
                    disabled={formData.originalCurrency === "USD"}
                    required
                  />
                </div>
              </div>

              {/* USD Base Value Display */}
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">USD Base Value</p>
                <p className="text-lg font-bold font-mono">${usdBaseValue}</p>
              </div>

              {/* Date & Description */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={formData.transactionDate}
                    onChange={(e) =>
                      updateField("transactionDate", e.target.value)
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder="Brief description"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && (
                    <HugeiconsIcon
                      icon={Loading03Icon}
                      className="mr-2 h-4 w-4 animate-spin"
                    />
                  )}
                  Create Transaction
                </Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
