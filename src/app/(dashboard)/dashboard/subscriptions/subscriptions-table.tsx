"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SubscriptionForm } from "./subscription-form";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  CheckCircle,
  XCircle,
  CreditCard,
  AlertTriangle,
} from "lucide-react";
import {
  markSubscriptionPaid,
  cancelSubscription,
} from "@/actions/subscriptions";
import { toast } from "sonner";
import type { SubscriptionWithDue } from "@/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface SubscriptionsTableProps {
  subscriptions: SubscriptionWithDue[];
}

export function SubscriptionsTable({ subscriptions }: SubscriptionsTableProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingSubscription, setEditingSubscription] =
    useState<SubscriptionWithDue | null>(null);
  const [cancellingSubscription, setCancellingSubscription] =
    useState<SubscriptionWithDue | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSubscriptions = subscriptions.filter((sub) => {
    return (
      !searchQuery ||
      sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.provider?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleMarkPaid = async (id: string) => {
    const result = await markSubscriptionPaid(id);
    if (result.success) {
      toast.success("Subscription marked as paid");
    } else {
      toast.error(result.error || "Failed to mark as paid");
    }
  };

  const handleCancel = async () => {
    if (!cancellingSubscription) return;

    const result = await cancelSubscription(cancellingSubscription.id);
    if (result.success) {
      toast.success("Subscription cancelled");
    } else {
      toast.error(result.error || "Failed to cancel subscription");
    }
    setCancellingSubscription(null);
  };

  const totalMonthly = subscriptions
    .filter((s) => s.isActive && s.billingCycle === "MONTHLY")
    .reduce((sum, s) => sum + Number(s.cost), 0);

  const totalYearly = subscriptions
    .filter((s) => s.isActive && s.billingCycle === "YEARLY")
    .reduce((sum, s) => sum + Number(s.cost), 0);

  const dueSoon = subscriptions.filter((s) => s.isDueSoon).length;
  const overdue = subscriptions.filter((s) => s.isOverdue).length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              Monthly Cost
            </span>
          </div>
          <p className="mt-2 text-2xl font-medium">
            {formatCurrency(totalMonthly)}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-medium text-muted-foreground">
              Yearly Cost
            </span>
          </div>
          <p className="mt-2 text-2xl font-medium">
            {formatCurrency(totalYearly)}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <span className="text-sm font-medium text-muted-foreground">
              Due Soon
            </span>
          </div>
          <p className="mt-2 text-2xl font-medium text-yellow-600">{dueSoon}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <span className="text-sm font-medium text-muted-foreground">
              Overdue
            </span>
          </div>
          <p className="mt-2 text-2xl font-medium text-red-600">{overdue}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search subscriptions..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Subscription
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Service</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Billing</TableHead>
              <TableHead className="text-right">Cost</TableHead>
              <TableHead>Next Due</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubscriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No subscriptions found
                </TableCell>
              </TableRow>
            ) : (
              filteredSubscriptions.map((subscription) => (
                <TableRow
                  key={subscription.id}
                  className={cn(
                    subscription.isOverdue && "bg-red-50 dark:bg-red-950/20",
                    subscription.isDueSoon &&
                      !subscription.isOverdue &&
                      "bg-yellow-50 dark:bg-yellow-950/20",
                  )}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium">{subscription.name}</p>
                      {subscription.provider && (
                        <p className="text-sm text-muted-foreground">
                          {subscription.provider}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {subscription.category ? (
                      <Badge variant="outline">{subscription.category}</Badge>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {subscription.billingCycle}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(
                      Number(subscription.cost),
                      subscription.currency,
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {subscription.isOverdue && (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                      {subscription.isDueSoon && !subscription.isOverdue && (
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      )}
                      <span
                        className={cn(
                          subscription.isOverdue && "text-red-600 font-medium",
                          subscription.isDueSoon &&
                            !subscription.isOverdue &&
                            "text-yellow-600 font-medium",
                        )}
                      >
                        {formatDate(subscription.nextDueDate)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={subscription.isActive ? "success" : "secondary"}
                    >
                      {subscription.isActive ? "Active" : "Cancelled"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {subscription.isActive && (
                          <DropdownMenuItem
                            onClick={() => handleMarkPaid(subscription.id)}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Mark as Paid
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => setEditingSubscription(subscription)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        {subscription.isActive && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                setCancellingSubscription(subscription)
                              }
                              className="text-destructive"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Cancel
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Subscription Form Dialog */}
      <SubscriptionForm
        open={showForm || !!editingSubscription}
        onOpenChange={(open) => {
          if (!open) {
            setShowForm(false);
            setEditingSubscription(null);
          }
        }}
        subscription={editingSubscription}
      />

      {/* Cancel Confirmation */}
      <AlertDialog
        open={!!cancellingSubscription}
        onOpenChange={() => setCancellingSubscription(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel "{cancellingSubscription?.name}"?
              This will mark the subscription as inactive.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Active</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-destructive text-destructive-foreground"
            >
              Cancel Subscription
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
