import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { TransactionsContent } from "@/modules/finance/transactions-content";
import { TransactionDialog } from "@/modules/finance/transaction-dialog";

export const metadata = { title: "Transactions" };
export const revalidate = 30;

export default function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  return (
    <div>
      <PageHeader title="Transactions" description="All financial transactions">
        <TransactionDialog />
      </PageHeader>
      <Suspense fallback={<TableSkeleton rows={10} cols={6} />}>
        <TransactionsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
