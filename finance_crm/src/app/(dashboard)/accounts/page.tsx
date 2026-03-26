import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { AccountsContent } from "@/modules/finance/accounts-content";

export const metadata = { title: "Accounts" };

export default function AccountsPage() {
  return (
    <div>
      <PageHeader
        title="Accounts"
        description="Manage brands, projects, and bank accounts"
      />
      <Suspense fallback={<TableSkeleton />}>
        <AccountsContent />
      </Suspense>
    </div>
  );
}
