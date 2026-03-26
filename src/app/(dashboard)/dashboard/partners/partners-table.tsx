"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PartnerForm } from "./partner-form";
import { formatCurrency } from "@/lib/utils";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  DollarSign,
  TrendingUp,
  Wallet,
  Handshake,
} from "lucide-react";
import type { PartnerWithRelations } from "@/types";

interface PartnersTableProps {
  partners: PartnerWithRelations[];
  brands: { id: string; name: string }[];
  users: { id: string; name: string; email: string }[];
  isAdmin: boolean;
}

export function PartnersTable({
  partners,
  brands,
  users,
  isAdmin,
}: PartnersTableProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingPartner, setEditingPartner] =
    useState<PartnerWithRelations | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPartners = partners.filter((partner) => {
    return (
      !searchQuery ||
      partner.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.brand.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const totalEarnings = partners.reduce(
    (sum, p) => sum + (p.earnings?.totalEarnings || 0),
    0,
  );
  const totalPending = partners.reduce(
    (sum, p) => sum + (p.earnings?.pendingWithdrawals || 0),
    0,
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Partners
            </CardTitle>
            <Handshake className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-medium">{partners.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Partners
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-medium text-green-600">
              {partners.filter((p) => p.isActive).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Earnings
            </CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-medium">
              {formatCurrency(totalEarnings)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Withdrawals
            </CardTitle>
            <Wallet className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-medium text-yellow-600">
              {formatCurrency(totalPending)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search partners..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {isAdmin && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Partner
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Partner</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead className="text-right">Revenue Share</TableHead>
              <TableHead className="text-right">Profit Share</TableHead>
              <TableHead className="text-right">Total Earnings</TableHead>
              <TableHead className="text-right">Pending</TableHead>
              <TableHead>Status</TableHead>
              {isAdmin && <TableHead className="w-[50px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPartners.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={isAdmin ? 8 : 7}
                  className="h-24 text-center"
                >
                  No partners found
                </TableCell>
              </TableRow>
            ) : (
              filteredPartners.map((partner) => (
                <TableRow key={partner.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{partner.user.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {partner.user.email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{partner.brand.name}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {Number(partner.revenueShare)}%
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {Number(partner.profitShare)}%
                  </TableCell>
                  <TableCell className="text-right font-semibold text-green-600">
                    {formatCurrency(partner.earnings?.totalEarnings || 0)}
                  </TableCell>
                  <TableCell className="text-right text-yellow-600">
                    {formatCurrency(partner.earnings?.pendingWithdrawals || 0)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={partner.isActive ? "success" : "secondary"}>
                      {partner.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setEditingPartner(partner)}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Partner Form Dialog */}
      {isAdmin && (
        <PartnerForm
          open={showForm || !!editingPartner}
          onOpenChange={(open) => {
            if (!open) {
              setShowForm(false);
              setEditingPartner(null);
            }
          }}
          brands={brands}
          users={users}
          partner={editingPartner}
        />
      )}
    </div>
  );
}
