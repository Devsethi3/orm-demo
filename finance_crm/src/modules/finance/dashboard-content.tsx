// src/modules/finance/dashboard-content.tsx
import {
  getDashboardSummary,
  getRevenueOverTime,
  getRevenueByBrand,
  getExpenseBreakdown,
  getRecentTransactions,
} from "@/server/queries/analytics";
import { getBrands } from "@/server/queries/finance";
import { getDateRange, formatCurrency, formatDate } from "@/lib/utils";
import { StatCard } from "@/components/shared/stat-card";
import { RevenueOverTimeChart } from "@/components/charts/revenue-over-time-chart";
import { RevenueByBrandChart } from "@/components/charts/revenue-by-brand-chart";
import { ExpenseBreakdownChart } from "@/components/charts/expense-breakdown-chart";
import { FilterBar } from "@/components/shared/filter-bar";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ChartUpIcon,
  ChartDownIcon,
  DollarCircleIcon,
  Wallet01Icon,
  ArrowUpRightIcon,
  ArrowDownRightIcon,
  ArrowRight01Icon,
  ArrowDown01Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

interface DashboardContentProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export async function DashboardContent({
  searchParams,
}: DashboardContentProps) {
  // Await searchParams (Next.js 15 requirement)
  const params = await searchParams;

  const period = (params.period || "30d") as
    | "7d"
    | "30d"
    | "90d"
    | "1y"
    | "all";
  const brandId = params.brandId;
  const dateRange = getDateRange(period);

  // Run ALL queries in parallel — this is the key performance fix
  const [
    summary,
    revenueOverTime,
    revenueByBrand,
    expenseBreakdown,
    brands,
    recentTxns,
  ] = await Promise.all([
    getDashboardSummary({ brandId, dateRange }),
    getRevenueOverTime({ brandId, dateRange }),
    getRevenueByBrand({ dateRange }),
    getExpenseBreakdown({ brandId, dateRange }),
    getBrands(),
    getRecentTransactions(10),
  ]);

  return (
    <div className="space-y-6">
      <FilterBar brands={brands} showPeriod />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={summary.totalRevenue}
          icon={ChartUpIcon}
          delay={0}
        />
        <StatCard
          title="Total Expenses"
          value={summary.totalExpenses}
          icon={ChartDownIcon}
          delay={0.05}
        />
        <StatCard
          title="Net Profit"
          value={summary.netProfit}
          icon={DollarCircleIcon}
          delay={0.1}
        />
        <StatCard
          title="Transactions"
          value={summary.revenueCount + summary.expenseCount}
          icon={Wallet01Icon}
          format="number"
          delay={0.15}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <RevenueOverTimeChart
          data={revenueOverTime.map((item) => ({
            period: String(item.period),
            total: item.total ?? "0",
          }))}
        />{" "}
        <RevenueByBrandChart data={revenueByBrand} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ExpenseBreakdownChart data={expenseBreakdown} />

        {/* Recent Transactions */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-sm font-semibold mb-4">Recent Transactions</h3>
          {recentTxns.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No transactions yet
            </p>
          ) : (
            <div className="space-y-3">
              {recentTxns.map((txn) => (
                <div
                  key={txn.id}
                  className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full",
                        txn.type === "income"
                          ? "bg-green-500/10 text-green-500"
                          : "bg-red-500/10 text-red-500",
                      )}
                    >
                      {txn.type === "income" ? (
                        <HugeiconsIcon
                          icon={ArrowRight01Icon}
                          className="h-4 w-4"
                        />
                      ) : (
                        <HugeiconsIcon
                          icon={ArrowDown01Icon}
                          className="h-4 w-4"
                        />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {txn.description || txn.source}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {txn.brandName} · {formatDate(txn.transactionDate)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={cn(
                        "text-sm font-semibold",
                        txn.type === "income"
                          ? "text-green-500"
                          : "text-red-500",
                      )}
                    >
                      {txn.type === "income" ? "+" : "-"}
                      {formatCurrency(txn.originalAmount, txn.originalCurrency)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
