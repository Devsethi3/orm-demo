"use client";

import { useDashboardStats } from "@/lib/hooks/use-queries";
import { PageHeader } from "@/components/layout/page-header";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { BrandRevenueChart } from "@/components/dashboard/brand-revenue";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

export function DashboardStatsSection() {
  const { data: stats, isLoading, error, refetch } = useDashboardStats();

  if (error) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh] gap-3">
        <AlertCircle className="h-5 w-5 text-destructive" />
        <div>
          <p className="text-destructive font-medium">Unable to load dashboard</p>
          <p className="text-sm text-muted-foreground mt-1">
            {error.message || "An error occurred while fetching data"}
          </p>
          <button
            onClick={() => refetch()}
            className="text-sm text-primary hover:underline mt-2"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || !stats) {
    return (
      <div className="mx-auto w-full max-w-360 space-y-5 sm:space-y-6 xl:space-y-8">
        <PageHeader
          title="Dashboard"
          description="Overview of your financial operations"
        />
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-lg" />
        <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-12">
          <Skeleton className="h-96 rounded-lg xl:col-span-8" />
          <Skeleton className="h-96 rounded-lg xl:col-span-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-360 space-y-5 sm:space-y-6 xl:space-y-8">
      <PageHeader
        title="Dashboard"
        description="Overview of your financial operations"
      />

      <StatsCards
        totalRevenue={stats.totalRevenue}
        totalExpenses={stats.totalExpenses}
        netIncome={stats.netIncome}
        revenueChange={stats.revenueChange}
        expenseChange={stats.expenseChange}
      />

      <RevenueChart data={stats.monthlyData} />

      <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-12">
        <RecentTransactions transactions={stats.recentTransactions} />
        <BrandRevenueChart data={stats.revenueByBrand} />
      </div>

      <div className="text-xs text-muted-foreground mx-auto">
        Data auto-refreshes on focus • Last updated {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}
