import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { SubscriptionsContent } from "@/modules/subscription/subscriptions-content";

export const metadata = { title: "Subscriptions" };

export default function SubscriptionsPage() {
  return (
    <div>
      <PageHeader
        title="Subscriptions"
        description="Manage recurring subscriptions and billing"
      />
      <Suspense fallback={<TableSkeleton />}>
        <SubscriptionsContent />
      </Suspense>
    </div>
  );
}
