import { Suspense } from "react";
import { getTransactions } from "@/actions/transactions";
import { getBrands } from "@/actions/brands";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { TransactionsTable } from "./transactions-table";
import { TransactionsTableSkeleton } from "./transactions-skeleton";

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

  const [transactionsData, brands] = await Promise.all([
    getTransactions({ page: 1, pageSize: 20 }),
    getBrands(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions"
        description="Manage all financial transactions"
      />

      <Suspense fallback={<TransactionsTableSkeleton />}>
        <TransactionsTable
          initialData={transactionsData}
          brands={brands.map((b) => ({ id: b.id, name: b.name }))}
          canCreate={canCreate}
        />
      </Suspense>
    </div>
  );
}
