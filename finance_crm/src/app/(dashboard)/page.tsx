import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { DashboardSkeleton } from "@/components/shared/loading-skeleton";
import { DashboardContent } from "@/modules/finance/dashboard-content";

export const metadata = { title: "Dashboard" };

export const revalidate = 60;

export default function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Financial overview and key metrics"
      />
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
