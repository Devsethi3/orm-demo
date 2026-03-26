import { getSubscriptions } from "@/server/queries/finance";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { CreditCardIcon } from "@hugeicons/core-free-icons";

export async function SubscriptionsContent() {
  const subs = await getSubscriptions();

  if (subs.length === 0) {
    return (
      <EmptyState
        icon={CreditCardIcon}
        title="No subscriptions"
        description="Add your first subscription to start tracking recurring expenses."
      />
    );
  }

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Provider</TableHead>
            <TableHead>Brand</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Cycle</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Next Billing</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subs.map((sub) => (
            <TableRow key={sub.id}>
              <TableCell className="font-medium">{sub.name}</TableCell>
              <TableCell className="text-muted-foreground">
                {sub.provider || "—"}
              </TableCell>
              <TableCell>{sub.brandName}</TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {sub.category}
                </Badge>
              </TableCell>
              <TableCell className="capitalize text-muted-foreground">
                {sub.billingCycle}
              </TableCell>
              <TableCell className="text-right font-mono">
                {formatCurrency(sub.amount, sub.currency)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {sub.nextBillingDate ? formatDate(sub.nextBillingDate) : "—"}
              </TableCell>
              <TableCell>
                <Badge
                  variant={sub.status === "active" ? "default" : "secondary"}
                  className={
                    sub.status === "active"
                      ? "bg-green-500/10 text-green-500 border-green-500/20"
                      : sub.status === "cancelled"
                        ? "bg-red-500/10 text-red-500 border-red-500/20"
                        : ""
                  }
                >
                  {sub.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
