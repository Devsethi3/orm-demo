"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { useFilters } from "@/hooks/use-filters";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowUpRightIcon,
  ArrowDownRightIcon,
  Invoice01Icon,
} from "@hugeicons/core-free-icons";
import type { PaginatedResponse } from "@/types";

interface TransactionsTableProps {
  data: PaginatedResponse<any>;
}

export function TransactionsTable({ data }: TransactionsTableProps) {
  const { setFilter } = useFilters();

  if (data.data.length === 0) {
    return (
      <EmptyState
        icon={Invoice01Icon}
        title="No transactions found"
        description="Try adjusting your filters or add a new transaction."
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Source</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">USD Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.map((txn: any, index: number) => (
              <motion.tr
                key={txn.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: index * 0.02 }}
                className="border-b border-border/50"
              >
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(txn.transactionDate)}
                </TableCell>
                <TableCell>
                  <div
                    className={cn(
                      "inline-flex items-center gap-1 text-xs font-medium",
                      txn.type === "income" ? "text-green-500" : "text-red-500",
                    )}
                  >
                    {txn.type === "income" ? (
                      <HugeiconsIcon
                        icon={ArrowUpRightIcon}
                        className="h-3 w-3"
                      />
                    ) : (
                      <HugeiconsIcon
                        icon={ArrowDownRightIcon}
                        className="h-3 w-3"
                      />
                    )}
                    {txn.type}
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-sm font-medium">
                    {txn.description || "—"}
                  </p>
                  {txn.projectName && (
                    <p className="text-xs text-muted-foreground">
                      {txn.projectName}
                    </p>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    style={{
                      borderColor: txn.brandColor || undefined,
                      color: txn.brandColor || undefined,
                    }}
                  >
                    {txn.brandName}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-xs capitalize text-muted-foreground">
                    {txn.source}
                  </span>
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {formatCurrency(txn.originalAmount, txn.originalCurrency)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm text-muted-foreground">
                  {formatCurrency(txn.usdBaseValue)}
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination
        page={data.page}
        totalPages={data.totalPages}
        total={data.total}
        pageSize={data.pageSize}
        onPageChange={(p) => setFilter("page", p.toString())}
      />
    </motion.div>
  );
}
