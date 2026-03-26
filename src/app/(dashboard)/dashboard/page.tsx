// src/app/(dashboard)/dashboard/page.tsx
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDashboardStats } from "@/actions/dashboard";
import { PageHeader } from "@/components/layout/page-header";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { BrandRevenueChart } from "@/components/dashboard/brand-revenue";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  if (user.role === "ADMIN" || user.role === "ACCOUNT_EXECUTIVE") {
    const stats = await getDashboardStats();

    if (!stats) {
      return (
        <div className="flex items-center justify-center h-full min-h-[50vh]">
          <p className="text-muted-foreground">Unable to load dashboard data</p>
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
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title={`Welcome, ${user.name}`}
        description={`You are logged in as ${user.role.replace("_", " ")}`}
      />

      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">Your Role</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl sm:text-2xl font-bold text-foreground">
              {user.role.replace("_", " ")}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              {getRoleDescription(user.role)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">
              Account Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl sm:text-2xl font-bold text-primary">Active</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              Your account is active and in good standing
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border sm:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Use the sidebar to navigate to your available features.
            </p>
          </CardContent>
        </Card>
      </div>

      {user.role === "PARTNER" && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">
              Partner Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs sm:text-sm text-muted-foreground">
              View your earnings and manage withdrawals from the Partners page.
            </p>
          </CardContent>
        </Card>
      )}

      {user.role === "CLIENT" && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">
              Client Portal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs sm:text-sm text-muted-foreground">
              View your transactions and invoices from the available menu items.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function getRoleDescription(role: string): string {
  const descriptions: Record<string, string> = {
    ADMIN: "Full access to all system features",
    ACCOUNT_EXECUTIVE:
      "Access to transactions, brands, and client management",
    PARTNER: "View earnings and manage withdrawals",
    CLIENT: "View transactions and invoices",
  };
  return descriptions[role] || "Limited access";
}
