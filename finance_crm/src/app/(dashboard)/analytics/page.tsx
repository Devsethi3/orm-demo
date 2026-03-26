import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { DashboardSkeleton } from "@/components/shared/loading-skeleton";
import { AnalyticsContent } from "@/modules/analytics/analytics-content";

export const metadata = { title: "Analytics" };

export default function AnalyticsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Financial analytics and insights"
      />
      <Suspense fallback={<DashboardSkeleton />}>
        <AnalyticsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
