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

interface RevenueByBrandChartProps {
  data: {
    brandName: string | null;
    brandColor: string | null;
    total: string | null;
  }[];
}

const FALLBACK_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
];

export function RevenueByBrandChart({ data }: RevenueByBrandChartProps) {
  const chartData = data.map((d, i) => ({
    name: d.brandName || "Unknown",
    value: parseFloat(d.total || "0"),
    color: d.brandColor || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
  }));

  if (!chartData.length)
    return (
      <EmptyState
        icon={Analytics03Icon}
        description="Revenue by brand"
        title="Revenue by brand"
      />
    );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="rounded-xl border border-border bg-card p-6 min-w-0"
    >
      <h3 className="text-sm font-semibold mb-4">Revenue by Brand</h3>
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
                <span className="text-xs text-muted-foreground">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
