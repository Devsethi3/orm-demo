// src/components/dashboard/stats-cards.tsx
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  PiggyBank,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardsProps {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  revenueChange: number;
  expenseChange: number;
}

export function StatsCards({
  totalRevenue,
  totalExpenses,
  netIncome,
  revenueChange,
  expenseChange,
}: StatsCardsProps) {
  const netIncomeChange = revenueChange - expenseChange;

  const stats = [
    {
      title: "Total Revenue",
      value: formatCurrency(totalRevenue),
      change: revenueChange,
      icon: DollarSign,
      isPositiveGood: true,
    },
    {
      title: "Total Expenses",
      value: formatCurrency(totalExpenses),
      change: expenseChange,
      icon: CreditCard,
      isPositiveGood: false, // For expenses, decrease is good
    },
    {
      title: "Net Income",
      value: formatCurrency(Math.abs(netIncome)),
      change: netIncomeChange,
      icon: PiggyBank,
      isPositiveGood: true,
      isNegative: netIncome < 0,
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat) => {
        // Determine if the change is "good" based on context
        const isGoodChange = stat.isPositiveGood
          ? stat.change >= 0
          : stat.change <= 0;

        return (
          <Card key={stat.title} className="relative overflow-hidden">
            <CardContent className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </span>
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg",
                    isGoodChange
                      ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                      : "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400",
                  )}
                >
                  <stat.icon className="h-4 w-4" />
                </div>
              </div>

              {/* Value */}
              <div className="mt-3">
                <span
                  className={cn(
                    "text-2xl font-medium",
                    stat.isNegative && "text-rose-600 dark:text-rose-400",
                  )}
                >
                  {stat.isNegative && "-"}
                  {stat.value}
                </span>
              </div>

              {/* Change Indicator */}
              <div className="mt-3 flex items-center gap-2">
                <div
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium",
                    isGoodChange
                      ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                      : "bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400",
                  )}
                >
                  {stat.change >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {Math.abs(stat.change).toFixed(1)}%
                </div>
                <span className="text-xs text-muted-foreground">
                  vs last month
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
