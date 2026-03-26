"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InviteForm } from "@/components/forms/invite-form";
import { formatDate } from "@/lib/utils";
import {
  Plus,
  Search,
  MoreHorizontal,
  Send,
  XCircle,
  Copy,
  RefreshCw,
} from "lucide-react";
import { revokeInvite, resendInvite } from "@/actions/auth";
import { toast } from "sonner";
import type { InviteWithRelations } from "@/types";
import { InviteStatus } from "@/lib/types/enums";

interface InvitesTableProps {
  invites: InviteWithRelations[];
  brands: { id: string; name: string }[];
}

function SummaryCardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-2 h-8 w-20" />
        </div>
      ))}
    </div>
  );
}

function TableBodySkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <Skeleton className="h-4 w-40" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-20 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-16 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-28" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-8 w-8 rounded" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function InvitesTable({ invites, brands }: InvitesTableProps) {
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, startTransition] = useTransition();
  const router = useRouter();

  const filteredInvites = invites.filter((invite) => {
    return (
      !searchQuery ||
      invite.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  const handleResend = async (inviteId: string) => {
    const result = await resendInvite(inviteId);
    if (result.success) {
      toast.success("Invite resent successfully");
    } else {
      toast.error(result.error || "Failed to resend invite");
    }
  };

  const handleRevoke = async (inviteId: string) => {
    const result = await revokeInvite(inviteId);
    if (result.success) {
      toast.success("Invite revoked");
    } else {
      toast.error(result.error || "Failed to revoke invite");
    }
  };

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(link);
    toast.success("Invite link copied to clipboard");
  };

  const getStatusBadge = (status: InviteStatus) => {
    const variants: Record<
      InviteStatus,
      "success" | "destructive" | "warning" | "secondary"
    > = {
      PENDING: "warning",
      ACCEPTED: "success",
      EXPIRED: "secondary",
      REVOKED: "destructive",
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const pendingCount = invites.filter((i) => i.status === "PENDING").length;
  const acceptedCount = invites.filter((i) => i.status === "ACCEPTED").length;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      {isRefreshing ? (
        <SummaryCardsSkeleton />
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm font-medium text-muted-foreground">
              Total Invites
            </p>
            <p className="mt-1 text-2xl font-medium">{invites.length}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm font-medium text-muted-foreground">Pending</p>
            <p className="mt-1 text-2xl font-medium text-yellow-600">
              {pendingCount}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm font-medium text-muted-foreground">
              Accepted
            </p>
            <p className="mt-1 text-2xl font-medium text-green-600">
              {acceptedCount}
            </p>
          </div>
        </div>
      )}

      {/* Toolbar - Always visible, always in same position */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search invites..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={isRefreshing}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </Button>
          <Button onClick={() => setShowForm(true)} disabled={isRefreshing}>
            <Plus className="mr-2 h-4 w-4" />
            Send Invite
          </Button>
        </div>
      </div>

      {/* Table - Always rendered, only body content swaps */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Invited By</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isRefreshing ? (
              <TableBodySkeleton />
            ) : filteredInvites.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No invites found
                </TableCell>
              </TableRow>
            ) : (
              filteredInvites.map((invite) => (
                <TableRow key={invite.id}>
                  <TableCell className="font-medium">{invite.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {invite.role.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>{invite.brand?.name || "-"}</TableCell>
                  <TableCell>{getStatusBadge(invite.status)}</TableCell>
                  <TableCell>{invite.invitedBy.name}</TableCell>
                  <TableCell>
                    {invite.status === "PENDING"
                      ? formatDate(invite.expiresAt)
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {invite.status === "PENDING" && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              copyInviteLink((invite as any).token)
                            }
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Link
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleResend(invite.id)}
                          >
                            <Send className="mr-2 h-4 w-4" />
                            Resend
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleRevoke(invite.id)}
                            className="text-destructive"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Revoke
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Invite Form Dialog */}
      <InviteForm open={showForm} onOpenChange={setShowForm} brands={brands} />
    </div>
  );
}
