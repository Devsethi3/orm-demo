"use client";

import { motion } from "motion/react";
import { cn, formatCurrency } from "@/lib/utils";
import { HugeiconsIcon, IconSvgElement } from "@hugeicons/react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: IconSvgElement;
  trend?: {
    value: number;
    label: string;
  };
  format?: "currency" | "number" | "none";
  currency?: string;
  className?: string;
  delay?: number;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  format = "currency",
  currency = "USD",
  className,
  delay = 0,
}: StatCardProps) {
  const displayValue =
    format === "currency"
      ? formatCurrency(value, currency)
      : format === "number"
        ? Number(value).toLocaleString()
        : value;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className={cn("rounded-xl border border-border bg-card p-6", className)}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <HugeiconsIcon icon={Icon} className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="mt-2">
        <p className="text-2xl font-bold">{displayValue}</p>
        {trend && (
          <p
            className={cn(
              "text-xs mt-1",
              trend.value >= 0 ? "text-green-500" : "text-red-500",
            )}
          >
            {trend.value >= 0 ? "+" : ""}
            {trend.value}% {trend.label}
          </p>
        )}
      </div>
    </motion.div>
  );
}
