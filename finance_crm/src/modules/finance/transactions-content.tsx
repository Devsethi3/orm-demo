import { getTransactions, getBrands } from "@/server/queries/finance";
import { FilterBar } from "@/components/shared/filter-bar";
import { TransactionsTable } from "@/modules/finance/transactions-table";
import { getDateRange } from "@/lib/utils";

interface TransactionsContentProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export async function TransactionsContent({
  searchParams,
}: TransactionsContentProps) {
  const params = await searchParams;

  const page = parseInt(params.page || "1");
  const brandId = params.brandId;
  const type = params.type as "income" | "expense" | undefined;
  const source = params.source as any;
  const search = params.search;
  const period = (params.period || "all") as any;
  const dateRange = period !== "all" ? getDateRange(period) : undefined;

  // Parallel fetch
  const [txnResult, brands] = await Promise.all([
    getTransactions(
      { brandId, type, source, search, dateRange },
      { page, pageSize: 20 },
    ),
    getBrands(),
  ]);

  return (
    <div>
      <FilterBar brands={brands} showSource showType showSearch showPeriod />
      <TransactionsTable data={txnResult} />
    </div>
  );
}
