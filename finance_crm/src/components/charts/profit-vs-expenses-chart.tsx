"use client";

import { motion } from "motion/react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { Analytics03Icon } from "@hugeicons/core-free-icons";
import { EmptyState } from "../shared/empty-state";

interface ProfitVsExpensesChartProps {
  data: {
    period: string;
    type: string;
    total: string | null;
  }[];
}

export function ProfitVsExpensesChart({ data }: ProfitVsExpensesChartProps) {
  const periodMap = new Map<
    string,
    { period: string; income: number; expense: number; profit: number }
  >();

  for (const d of data) {
    const key = new Date(d.period).toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    });
    const existing = periodMap.get(key) || {
      period: key,
      income: 0,
      expense: 0,
      profit: 0,
    };
    const val = parseFloat(d.total || "0");
    if (d.type === "income") existing.income += val;
    else existing.expense += val;
    existing.profit = existing.income - existing.expense;
    periodMap.set(key, existing);
  }

  const chartData = Array.from(periodMap.values());

  if (!chartData.length)
    return (
      <EmptyState
        icon={Analytics03Icon}
        description="Profit Vs Expenses"
        title="Profit vs Expenses"
      />
    );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="rounded-xl border border-border bg-card p-6 min-w-0"
    >
      <h3 className="text-sm font-semibold mb-4">Profit vs Expenses</h3>
      <div className="w-full h-[288px] min-h-[288px]">
        {" "}
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="period"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                borderColor: "hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(value) => [
                formatCurrency(Number(value ?? 0)),
                "Revenue",
              ]}
            />
            <Legend />
            <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
            <Bar dataKey="profit" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
