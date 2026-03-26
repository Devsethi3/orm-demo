"use client";

import { motion } from "motion/react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { formatCurrency, getMonthName } from "@/lib/utils";
import { EmptyState } from "../shared/empty-state";
import { Analytics03Icon } from "@hugeicons/core-free-icons";

interface SalaryExpenseChartProps {
  data: {
    year: number;
    month: number;
    total: string | null;
  }[];
}

export function SalaryExpenseChart({ data }: SalaryExpenseChartProps) {
  const chartData = data.map((d) => ({
    period: `${getMonthName(d.month).slice(0, 3)} ${d.year.toString().slice(2)}`,
    total: parseFloat(d.total || "0"),
  }));

  if (!chartData.length)
    return (
      <EmptyState
        icon={Analytics03Icon}
        description="Salary Expense Over Time"
        title="Salary Expense Over Time"
      />
    );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="rounded-xl border border-border bg-card p-6 min-w-0"
    >
      <h3 className="text-sm font-semibold mb-4">Salary Expense Over Time</h3>
      <div className="w-full h-[288px] min-h-[288px]">
        {" "}
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
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
              formatter={(value: unknown) => [
                formatCurrency(Number(value ?? 0)),
                "Salary Expense",
              ]}
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={{ r: 3, fill: "#8b5cf6" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
