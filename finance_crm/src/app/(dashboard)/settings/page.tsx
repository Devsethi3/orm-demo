import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { CardSkeleton } from "@/components/shared/loading-skeleton";
import { SettingsContent } from "@/modules/finance/settings-content";
import { requireRole } from "@/server/auth";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requireRole(["admin"]);

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage currencies, exchange rates, and system configuration"
      />
      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-2">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        }
      >
        <SettingsContent />
      </Suspense>
    </div>
  );
}
