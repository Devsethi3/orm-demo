import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { SalariesContent } from "@/modules/salary/salaries-content";

export const metadata = { title: "Salaries" };

export default function SalariesPage() {
  return (
    <div>
      <PageHeader
        title="Salary Management"
        description="Employee salaries and payment tracking"
      />
      <Suspense fallback={<TableSkeleton />}>
        <SalariesContent />
      </Suspense>
    </div>
  );
}
