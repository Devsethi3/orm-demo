"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";

interface DashboardWelcomeSectionProps {
  userName: string;
  userRole: string;
}

export function DashboardWelcomeSection({
  userName,
  userRole,
}: DashboardWelcomeSectionProps) {
  const roleDisplay = userRole.replace("_", " ");

  const descriptions: Record<string, string> = {
    ADMIN: "Full access to all system features",
    ACCOUNT_EXECUTIVE: "Access to transactions, brands, and client management",
    PARTNER: "View earnings and manage withdrawals",
    CLIENT: "View transactions and invoices",
  };

  const description = descriptions[userRole] || "Limited access";

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title={`Welcome, ${userName}`}
        description={`You are logged in as ${roleDisplay}`}
      />

      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">Your Role</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl sm:text-2xl font-bold text-foreground">
              {roleDisplay}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              {description}
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

      {userRole === "PARTNER" && (
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

      {userRole === "CLIENT" && (
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
