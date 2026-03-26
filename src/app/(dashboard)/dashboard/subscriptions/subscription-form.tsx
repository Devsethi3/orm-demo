// src/app/(dashboard)/dashboard/subscriptions/subscription-form.tsx
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { subscriptionSchema, type SubscriptionInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import {
  createSubscription,
  updateSubscription,
} from "@/actions/subscriptions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { SubscriptionWithDue } from "@/types";
import { format } from "date-fns";
import { BillingCycle } from "@/generated/prisma/enums";

interface SubscriptionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription?: SubscriptionWithDue | null;
}

const currencies = ["USD", "INR", "EUR", "AED", "GBP"];
const billingCycles: { value: BillingCycle; label: string }[] = [
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "YEARLY", label: "Yearly" },
  { value: "ONE_TIME", label: "One Time" },
];

const categories = [
  "Software",
  "Infrastructure",
  "Marketing",
  "Communication",
  "Design",
  "Analytics",
  "Security",
  "Other",
];

export function SubscriptionForm({
  open,
  onOpenChange,
  subscription,
}: SubscriptionFormProps) {
  const [loading, setLoading] = useState(false);
  const [autoRenew, setAutoRenew] = useState(true);
  const isEditing = !!subscription;

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<z.input<typeof subscriptionSchema>, any, SubscriptionInput>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      currency: "USD",
      billingCycle: "MONTHLY",
      autoRenew: true,
      reminderDays: 7,
    },
  });

  useEffect(() => {
    if (subscription) {
      setValue("name", subscription.name);
      setValue("provider", subscription.provider || "");
      setValue("cost", Number(subscription.cost));
      setValue("currency", subscription.currency);
      setValue("billingCycle", subscription.billingCycle);
      setValue("nextDueDate", new Date(subscription.nextDueDate));
      setValue("category", subscription.category || "");
      setAutoRenew(subscription.isActive);
    } else {
      reset({
        currency: "USD",
        billingCycle: "MONTHLY",
        autoRenew: true,
        reminderDays: 7,
      });
      setAutoRenew(true);
    }
  }, [subscription, setValue, reset]);

  const onSubmit = async (data: SubscriptionInput) => {
    setLoading(true);
    try {
      const result = isEditing
        ? await updateSubscription(subscription!.id, { ...data, autoRenew })
        : await createSubscription({ ...data, autoRenew });

      if (result.success) {
        toast.success(
          isEditing ? "Subscription updated" : "Subscription added",
        );
        reset();
        onOpenChange(false);
      } else {
        toast.error(result.error || "Operation failed");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg!">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Subscription" : "Add Subscription"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Service Name *</Label>
            <Input placeholder="GitHub, AWS, Figma..." {...register("name")} />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Provider</Label>
              <Input
                placeholder="Microsoft, Google..."
                {...register("provider")}
              />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                defaultValue={subscription?.category || ""}
                onValueChange={(value) => setValue("category", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Cost *</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="9.99"
                {...register("cost", { valueAsNumber: true })}
              />
              {errors.cost && (
                <p className="text-sm text-destructive">
                  {errors.cost.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Currency</Label>
              <Select
                defaultValue={subscription?.currency || "USD"}
                onValueChange={(value) => setValue("currency", value)}
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

            <div className="space-y-2">
              <Label>Billing Cycle</Label>
              <Select
                defaultValue={subscription?.billingCycle || "MONTHLY"}
                onValueChange={(value) =>
                  setValue("billingCycle", value as BillingCycle)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {billingCycles.map((cycle) => (
                    <SelectItem key={cycle.value} value={cycle.value}>
                      {cycle.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Next Due Date *</Label>
              <Input
                type="date"
                defaultValue={
                  subscription
                    ? format(new Date(subscription.nextDueDate), "yyyy-MM-dd")
                    : ""
                }
                {...register("nextDueDate", { valueAsDate: true })}
              />
              {errors.nextDueDate && (
                <p className="text-sm text-destructive">
                  {errors.nextDueDate.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Reminder Days</Label>
              <Input
                type="number"
                min="0"
                max="30"
                defaultValue={7}
                {...register("reminderDays", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>URL</Label>
            <Input type="url" placeholder="https://..." {...register("url")} />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Notes about this subscription..."
              {...register("description")}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label>Auto Renew</Label>
              <p className="text-sm text-muted-foreground">
                Automatically renew this subscription
              </p>
            </div>
            <Switch checked={autoRenew} onCheckedChange={setAutoRenew} />
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
              {isEditing ? "Update" : "Add"} Subscription
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
