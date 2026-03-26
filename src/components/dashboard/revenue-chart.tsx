"use client";

import { CSSProperties } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Line,
  ComposedChart,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { MonthlyData } from "@/types";
import { TrendingUp, TrendingDown } from "lucide-react";

interface RevenueChartProps {
  data: MonthlyData[];
}

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "var(--chart-1)",
  },
  expenses: {
    label: "Expenses",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export function RevenueChart({ data }: RevenueChartProps) {
  const hasData = data.some((item) => item.revenue > 0 || item.expenses > 0);

  // Calculate trend
  const latest = data[data.length - 1];
  const previous = data[data.length - 2];
  const latestNet = latest ? latest.revenue - latest.expenses : 0;
  const previousNet = previous ? previous.revenue - previous.expenses : 0;
  const netDelta =
    previousNet !== 0
      ? ((latestNet - previousNet) / Math.abs(previousNet)) * 100
      : latestNet !== 0
        ? 100
        : 0;
  const trendUp = netDelta >= 0;

  // Calculate total revenue and expenses for the period
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const totalExpenses = data.reduce((sum, item) => sum + item.expenses, 0);

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue vs Expenses</CardTitle>
          <CardDescription>Monthly financial overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center">
            <p className="text-sm text-muted-foreground">No data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              Revenue vs Expenses
              <Badge
                variant="outline"
                className={`gap-1 font-medium ${
                  trendUp
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                }`}
              >
                {trendUp ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {Math.abs(netDelta).toFixed(1)}%
              </Badge>
            </CardTitle>
            <CardDescription>
              Last {data.length} months financial trend
            </CardDescription>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-4 flex gap-6">
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: "var(--chart-1)" }}
            />
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Total Revenue</p>
              <p className="text-sm font-medium">
                ${totalRevenue.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: "var(--chart-2)" }}
            />
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Total Expenses</p>
              <p className="text-sm font-medium">
                ${totalExpenses.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <div style={{ height: "300px", minHeight: "300px", width: "100%" }}>
          <ChartContainer config={chartConfig} className="h-full w-full">
            <ComposedChart
            data={data}
            margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
            barCategoryGap="20%"
          >
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              className="stroke-border/50"
            />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={12}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
              className="text-xs fill-muted-foreground"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              className="text-xs fill-muted-foreground"
              width={48}
            />
            <ChartTooltip
              cursor={{ fill: "var(--muted)", opacity: 0.3 }}
              content={
                <ChartTooltipContent
                  indicator="dot"
                  className="min-w-[180px] gap-2"
                  labelFormatter={(value) => (
                    <div className="mb-1 border-b border-border/50 pb-2">
                      <span className="text-sm font-medium">{value}</span>
                    </div>
                  )}
                  formatter={(value, name) => {
                    const numValue =
                      typeof value === "number" ? value : Number(value ?? 0);
                    const config =
                      chartConfig[name as keyof typeof chartConfig];

                    return (
                      <div className="flex w-full items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2.5 w-2.5 shrink-0 rounded-sm"
                            style={
                              {
                                backgroundColor: config?.color,
                              } as CSSProperties
                            }
                          />
                          <span className="text-muted-foreground">
                            {config?.label || name}
                          </span>
                        </div>
                        <span className="font-medium tabular-nums">
                          ${numValue.toLocaleString()}
                        </span>
                      </div>
                    );
                  }}
                />
              }
            />
            <Bar
              dataKey="revenue"
              fill="var(--color-revenue)"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
            <Bar
              dataKey="expenses"
              fill="var(--color-expenses)"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="var(--chart-1)"
              strokeWidth={2}
              dot={false}
              strokeOpacity={0.5}
              strokeDasharray="4 4"
            />
          </ComposedChart>
        </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
