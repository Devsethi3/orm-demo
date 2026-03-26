"use client";

import { motion } from "motion/react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { EmptyState } from "../shared/empty-state";
import { Analytics03Icon } from "@hugeicons/core-free-icons";

interface ExpenseBreakdownChartProps {
  data: {
    category: string | null;
    total: string | null;
  }[];
}

const CATEGORY_COLORS: Record<string, string> = {
  salaries: "#6366f1",
  subscriptions: "#8b5cf6",
  tools: "#06b6d4",
  marketing: "#10b981",
  operations: "#f59e0b",
  misc: "#94a3b8",
};

export function ExpenseBreakdownChart({ data }: ExpenseBreakdownChartProps) {
  const chartData = data.map((d) => ({
    name: d.category || "Uncategorized",
    value: parseFloat(d.total || "0"),
    color: CATEGORY_COLORS[d.category || "misc"] || "#94a3b8",
  }));

  if (!chartData.length)
    return (
      <EmptyState
        icon={Analytics03Icon}
        description="Empty"
        title="Expense Breakdown"
      />
    );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="rounded-xl border border-border bg-card p-6 min-w-0"
    >
      <h3 className="text-sm font-semibold mb-4">Expense Breakdown</h3>
      <div className="w-full h-[288px] min-h-[288px]">
        {" "}
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={4}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                borderColor: "hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(value: unknown) => formatCurrency(Number(value ?? 0))}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => (
                <span className="text-xs text-muted-foreground capitalize">
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
