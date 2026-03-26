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
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { EmptyState } from "../shared/empty-state";
import { Analytics03Icon } from "@hugeicons/core-free-icons";

interface RevenueOverTimeChartProps {
  data: { period: string; total: string }[];
}

export function RevenueOverTimeChart({ data }: RevenueOverTimeChartProps) {
  const chartData = data.map((d) => ({
    period: new Date(d.period).toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    }),
    revenue: parseFloat(d.total),
  }));

  if (!chartData.length)
    return (
      <EmptyState
        icon={Analytics03Icon}
        description="Revenue Over Time"
        title="Revenue Over Time"
      />
    );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-xl border border-border bg-card p-6 min-w-0"
    >
      <h3 className="text-sm font-semibold mb-4">Revenue Over Time</h3>
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
              formatter={(value) => [
                formatCurrency(Number(value ?? 0)),
                "Revenue",
              ]}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ r: 3, fill: "hsl(var(--primary))" }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
