import { getSubscriptions } from "@/actions/subscriptions";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { SubscriptionsTable } from "./subscriptions-table";

export default async function SubscriptionsPage() {
  const session = await getSession();

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const subscriptions = await getSubscriptions();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscriptions"
        description="Manage tool and service subscriptions"
      />
      <SubscriptionsTable subscriptions={subscriptions} />
    </div>
  );
}
