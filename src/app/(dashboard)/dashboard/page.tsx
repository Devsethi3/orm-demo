// src/app/(dashboard)/dashboard/page.tsx
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { DashboardStatsSection } from "@/components/dashboard/dashboard-stats-section";
import { DashboardWelcomeSection } from "@/components/dashboard/dashboard-welcome-section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  if (user.role === "ADMIN" || user.role === "ACCOUNT_EXECUTIVE") {
    // Moved data fetching to client component for React Query caching
    return <DashboardStatsSection />;
  }

  return <DashboardWelcomeSection userName={user.name} userRole={user.role} />;
}

