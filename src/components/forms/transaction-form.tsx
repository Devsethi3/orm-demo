"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { transactionSchema, type TransactionInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { createTransaction } from "@/actions/transactions";
import { fetchExchangeRate } from "@/actions/currency";
import { getClientFallbackRate } from "@/lib/currency";
import { TransactionType, TransactionSource } from "@/lib/types/enums";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brands: { id: string; name: string }[];
  projects: { id: string; name: string; brandId: string }[];
}

const currencies = ["USD", "INR", "EUR", "AED", "GBP"];

const transactionTypes = Object.values(TransactionType);
const transactionSources = Object.values(TransactionSource);

export function TransactionForm({
  open,
  onOpenChange,
  brands,
  projects,
}: TransactionFormProps) {
  const [loading, setLoading] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [conversionRate, setConversionRate] = useState<number>(1);
  const [fetchingRate, setFetchingRate] = useState(false);

  const form = useForm({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      brandId: "",
      originalCurrency: "USD",
      transactionDate: format(new Date(), "yyyy-MM-dd"),
      type: "INCOME" as const,
      source: "BANK" as const,
      originalAmount: "",
      description: "",
      reference: "",
      notes: "",
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = form;

  const watchCurrency = watch("originalCurrency");
  const watchAmount = watch("originalAmount");

  useEffect(() => {
    async function loadRate() {
      if (watchCurrency && watchCurrency !== "USD") {
        setFetchingRate(true);
        try {
          const rate = await fetchExchangeRate(watchCurrency, "USD");
          setConversionRate(rate);
          setValue("conversionRate", rate);
        } catch (error) {
          const fallbackRate = getClientFallbackRate(watchCurrency, "USD");
          setConversionRate(fallbackRate);
          setValue("conversionRate", fallbackRate);
        } finally {
          setFetchingRate(false);
        }
      } else {
        setConversionRate(1);
        setValue("conversionRate", 1);
      }
    }
    loadRate();
  }, [watchCurrency, setValue]);

  const filteredProjects = selectedBrand
    ? projects.filter((p) => p.brandId === selectedBrand)
    : projects;

  const amountNum = watchAmount ? Number(watchAmount) : 0;
  const usdValue = amountNum * conversionRate;

  const onSubmit = async (data: TransactionInput) => {
    setLoading(true);
    try {
      const result = await createTransaction(data);
      if (result.success) {
        toast.success("Transaction created successfully");
        reset();
        onOpenChange(false);
      } else {
        toast.error(result.error || "Failed to create transaction");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl! max-h-[90vh] overflow-y-auto px-8 py-5">
        <DialogHeader>
          <DialogTitle>Create Transaction</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {/* Brand */}
            <div className="space-y-2">
              <Label>Brand *</Label>
              <Select
                onValueChange={(value) => {
                  setSelectedBrand(value);
                  setValue("brandId", value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.brandId && (
                <p className="text-sm text-destructive">
                  {errors.brandId.message}
                </p>
              )}
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label>Type *</Label>
              <Select
                defaultValue="INCOME"
                onValueChange={(value) => setValue("type", value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {transactionTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Source */}
            <div className="space-y-2">
              <Label>Source *</Label>
              <Select
                defaultValue="BANK"
                onValueChange={(value) => setValue("source", value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {transactionSources.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Project (Optional) */}
            <div className="space-y-2">
              <Label>Project (Optional)</Label>
              <Select onValueChange={(value) => setValue("projectId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {filteredProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input type="date" {...register("transactionDate")} />
            </div>

            {/* Currency */}
            <div className="space-y-2">
              <Label>Currency *</Label>
              <Select
                defaultValue="USD"
                onValueChange={(value) => setValue("originalCurrency", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label>Amount *</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register("originalAmount")}
              />
              {errors.originalAmount && (
                <p className="text-sm text-destructive">
                  {errors.originalAmount.message}
                </p>
              )}
            </div>

            {/* Conversion Rate */}
            {watchCurrency !== "USD" && (
              <>
                <div className="space-y-2">
                  <Label>
                    Conversion Rate (to USD)
                    {fetchingRate && (
                      <Loader2 className="inline ml-2 h-3 w-3 animate-spin" />
                    )}
                  </Label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={conversionRate}
                    onChange={(e) => {
                      const rate = parseFloat(e.target.value) || 1;
                      setConversionRate(rate);
                      setValue("conversionRate", rate);
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label>USD Value</Label>
                  <Input
                    type="text"
                    value={`$${usdValue.toFixed(2)}`}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              placeholder="Transaction description"
              {...register("description")}
            />
          </div>

          {/* Reference */}
          <div className="space-y-2">
            <Label>Reference</Label>
            <Input
              placeholder="Invoice number, order ID, etc."
              {...register("reference")}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              placeholder="Additional notes..."
              {...register("notes")}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Transaction
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
