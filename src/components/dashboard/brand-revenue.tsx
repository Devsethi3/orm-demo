"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { BrandRevenue } from "@/types";

interface BrandRevenueChartProps {
  data: BrandRevenue[];
}

export function BrandRevenueChart({ data }: BrandRevenueChartProps) {
  const chartData = data.map((item) => ({
    name: item.brandName,
    revenue: item.revenue,
    expenses: item.expenses,
    profit: item.profit,
  }));

  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const totalExpenses = data.reduce((sum, item) => sum + item.expenses, 0);
  const totalProfit = totalRevenue - totalExpenses;

  if (chartData.length === 0) {
    return (
      <Card className="xl:col-span-4">
        <CardHeader>
          <CardTitle className="text-base">Revenue by Brand</CardTitle>
          <CardDescription>Brand performance breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center">
            <p className="text-sm text-muted-foreground">
              No brand data available
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="xl:col-span-4">
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-base">Revenue by Brand</CardTitle>
          <CardDescription>Brand performance breakdown</CardDescription>
        </div>

        <div className="mt-4 flex flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm bg-[var(--chart-1)]" />
            <div>
              <p className="text-xs text-muted-foreground">Total Revenue</p>
              <p className="text-sm font-medium">
                ${totalRevenue.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm bg-[var(--chart-2)]" />
            <div>
              <p className="text-xs text-muted-foreground">Total Expenses</p>
              <p className="text-sm font-medium">
                ${totalExpenses.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`h-3 w-3 rounded-sm ${
                totalProfit >= 0 ? "bg-emerald-500" : "bg-rose-500"
              }`}
            />
            <div>
              <p className="text-xs text-muted-foreground">Net Profit</p>
              <p
                className={`text-sm font-medium ${
                  totalProfit >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                ${Math.abs(totalProfit).toLocaleString()}
                {totalProfit < 0 && " (Loss)"}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <div className="h-[300px] w-full [&_.recharts-cartesian-axis-tick-value]:fill-muted-foreground [&_.recharts-cartesian-grid_line]:stroke-border">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 0, right: 12, left: 0, bottom: 0 }}
              barGap={2}
              barCategoryGap="20%"
            >
              <CartesianGrid
                horizontal={true}
                vertical={false}
                strokeDasharray="3 3"
                className="stroke-border/50"
              />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={12}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={100}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={12}
                tickFormatter={(value: string) =>
                  value.length > 14 ? `${value.slice(0, 14)}…` : value
                }
              />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;

                  const revenue = Number(payload[0]?.value) || 0;
                  const expenses = Number(payload[1]?.value) || 0;
                  const profit = revenue - expenses;

                  return (
                    <div className="rounded-lg border bg-popover px-3 py-2.5 shadow-lg">
                      <p className="mb-2 border-b border-border/50 pb-2 text-sm font-medium">
                        {label}
                      </p>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-8">
                          <div className="flex items-center gap-2">
                            <div className="h-2.5 w-2.5 rounded-sm bg-[var(--chart-1)]" />
                            <span className="text-sm text-muted-foreground">
                              Revenue
                            </span>
                          </div>
                          <span className="text-sm font-medium tabular-nums">
                            ${revenue.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-8">
                          <div className="flex items-center gap-2">
                            <div className="h-2.5 w-2.5 rounded-sm bg-[var(--chart-2)]" />
                            <span className="text-sm text-muted-foreground">
                              Expenses
                            </span>
                          </div>
                          <span className="text-sm font-medium tabular-nums">
                            ${expenses.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 border-t border-border/50 pt-2">
                        <div className="flex items-center justify-between gap-8">
                          <span className="text-sm text-muted-foreground">
                            Profit
                          </span>
                          <span
                            className={`text-sm font-medium tabular-nums ${
                              profit >= 0
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            {profit >= 0 ? "+" : "-"}$
                            {Math.abs(profit).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="revenue"
                name="Revenue"
                fill="var(--chart-1)"
                radius={[0, 4, 4, 0]}
                maxBarSize={20}
              />
              <Bar
                dataKey="expenses"
                name="Expenses"
                fill="var(--chart-2)"
                radius={[0, 4, 4, 0]}
                maxBarSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
