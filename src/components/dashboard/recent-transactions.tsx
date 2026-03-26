// src/components/dashboard/recent-transactions.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { TransactionWithRelations } from "@/types";
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RecentTransactionsProps {
  transactions: TransactionWithRelations[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case "INCOME":
        return <ArrowDownLeft className="h-4 w-4 text-primary" />;
      case "EXPENSE":
        return <ArrowUpRight className="h-4 w-4 text-destructive" />;
      case "TRANSFER":
        return <ArrowLeftRight className="h-4 w-4 text-accent-foreground" />;
      default:
        return null;
    }
  };

  const getAmountColorClass = (type: string) => {
    switch (type) {
      case "INCOME":
        return "text-primary";
      case "EXPENSE":
        return "text-destructive";
      default:
        return "text-foreground";
    }
  };

  return (
    <Card className="bg-card border-border xl:col-span-8">
      <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2 sm:pb-4">
        <CardTitle className="text-base sm:text-lg">
          Recent Transactions
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
        <ScrollArea className="h-75 sm:h-87.5 pr-2 sm:pr-4">
          <div className="space-y-3 sm:space-y-4">
            {transactions.length === 0 ? (
              <div className="flex items-center justify-center h-62.5">
                <p className="text-sm text-muted-foreground">
                  No transactions found
                </p>
              </div>
            ) : (
              transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors gap-3"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-background border border-border shrink-0">
                      {getIcon(transaction.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-foreground truncate">
                        {transaction.description || transaction.source}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        <span className="hidden sm:inline">
                          {transaction.brand?.name || "-"} •{" "}
                        </span>
                        {formatDate(transaction.transactionDate)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={cn(
                        "text-xs sm:text-sm font-semibold",
                        getAmountColorClass(transaction.type),
                      )}
                    >
                      {transaction.type === "INCOME" ? "+" : "-"}
                      {formatCurrency(
                        Number(transaction.originalAmount),
                        transaction.originalCurrency,
                      )}
                    </p>
                    <Badge
                      variant="secondary"
                      className="text-xs mt-1 bg-secondary text-secondary-foreground"
                    >
                      {transaction.source}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
