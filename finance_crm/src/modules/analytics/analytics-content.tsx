import {
  getRevenueOverTime,
  getRevenueByBrand,
  getExpenseBreakdown,
  getProfitVsExpenses,
  getSalaryExpenseOverTime,
  getDashboardSummary,
} from "@/server/queries/analytics";
import { getBrands } from "@/server/queries/finance";
import { getDateRange } from "@/lib/utils";
import { FilterBar } from "@/components/shared/filter-bar";
import { StatCard } from "@/components/shared/stat-card";
import { RevenueOverTimeChart } from "@/components/charts/revenue-over-time-chart";
import { RevenueByBrandChart } from "@/components/charts/revenue-by-brand-chart";
import { ExpenseBreakdownChart } from "@/components/charts/expense-breakdown-chart";
import { ProfitVsExpensesChart } from "@/components/charts/profit-vs-expenses-chart";
import { SalaryExpenseChart } from "@/components/charts/salary-expense-chart";
import {
  ChartUpIcon,
  ChartDownIcon,
  DollarCircleIcon,
  PercentCircleIcon,
} from "@hugeicons/core-free-icons";

interface AnalyticsContentProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export async function AnalyticsContent({
  searchParams,
}: AnalyticsContentProps) {
  const params = await searchParams;

  const period = (params.period || "1y") as any;
  const brandId = params.brandId;
  const dateRange = getDateRange(period);
  const filters = { brandId, dateRange };

  const [
    summary,
    revenueOverTime,
    revenueByBrand,
    expenseBreakdown,
    profitVsExpenses,
    salaryExpense,
    brands,
  ] = await Promise.all([
    getDashboardSummary(filters),
    getRevenueOverTime(filters),
    getRevenueByBrand(filters),
    getExpenseBreakdown(filters),
    getProfitVsExpenses(filters),
    getSalaryExpenseOverTime(filters),
    getBrands(),
  ]);

  const profitMargin =
    parseFloat(summary.totalRevenue) > 0
      ? (
          (parseFloat(summary.netProfit) / parseFloat(summary.totalRevenue)) *
          100
        ).toFixed(1)
      : "0";

  return (
    <div className="space-y-6">
      <FilterBar brands={brands} showPeriod />

      {/* Summary Stats */}
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
          title="Profit Margin"
          value={`${profitMargin}%`}
          icon={PercentCircleIcon}
          format="none"
          delay={0.15}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <RevenueOverTimeChart
          data={revenueOverTime.map((d) => ({
            period: String(d.period),
            total: d.total ?? "0",
          }))}
        />{" "}
        <RevenueByBrandChart data={revenueByBrand} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ProfitVsExpensesChart
          data={profitVsExpenses.map((d) => ({
            period: String(d.period),
            type: d.type,
            total: d.total ?? "0",
          }))}
        />{" "}
        <ExpenseBreakdownChart data={expenseBreakdown} />
      </div>

      <div className="grid gap-4 md:grid-cols-1">
        <SalaryExpenseChart data={salaryExpense} />
      </div>
    </div>
  );
}
