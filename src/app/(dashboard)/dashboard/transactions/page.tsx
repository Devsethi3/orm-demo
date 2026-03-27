import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { TransactionsTable } from "./transactions-table";

export default async function TransactionsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const canAccess = ["ADMIN", "ACCOUNT_EXECUTIVE", "CLIENT"].includes(
    session.user.role,
  );

  if (!canAccess) {
    redirect("/dashboard");
  }

  const canCreate = ["ADMIN", "ACCOUNT_EXECUTIVE"].includes(
    session.user.role,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions"
        description="Manage all financial transactions"
      />
      <TransactionsTable canCreate={canCreate} />
    </div>
  );
}
