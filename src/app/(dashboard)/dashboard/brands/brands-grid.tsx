"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BrandForm } from "./brand-form";
import {
  Plus,
  Search,
  MoreVertical,
  Pencil,
  Trash2,
  Building2,
  ArrowLeftRight,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
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
import { Skeleton } from "@/components/ui/skeleton";
import { UserRole } from "@/lib/types/enums";
import {
  useBrands,
  useDeleteBrand,
  useCreateBrand,
  useUpdateBrand,
} from "@/lib/hooks/use-queries";

interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  isActive: boolean;
  owner: { id: string; name: string; email: string };
  _count: {
    transactions: number;
    projects: number;
    employees: number;
  };
}

interface BrandsGridProps {
  userRole: UserRole;
}

/**
 * BrandsGrid Component with React Query Integration
 *
 * Benefits:
 * - Automatic caching: Data cached for 5 minutes, reducing API calls
 * - Request deduplication: Multiple simultaneous requests return same cached data
 * - Smart invalidation: Mutations automatically refetch data
 * - Loading states: Built-in via React Query, not manual useState
 * - Background refresh: Auto-refetch when window regains focus
 *
 * Before (manual approach):
 * - Page level fetch: const brands = await getBrands()
 * - Manual loading: useState(loading)
 * - Manual refetch: Need to refetch after delete/create
 *
 * After (React Query):
 * - Component level fetch: useBrands() hook
 * - Automatic loading: Query provides isLoading state
 * - Automatic refetch: Mutation hooks auto-invalidate and refetch
 * - Smart cache: 5min stale, auto-refresh on focus
 */
export function BrandsGrid({ userRole }: BrandsGridProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [deletingBrand, setDeletingBrand] = useState<Brand | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // React Query hooks - auto-manage loading, caching, and refetching
  const { data: brands = [], isLoading, error, refetch } = useBrands();
  const deleteMutation = useDeleteBrand();
  const createMutation = useCreateBrand();
  const updateMutation = useUpdateBrand();

  const isAdmin = userRole === "ADMIN";

  const filteredBrands = (brands || []).filter((brand) => {
    return (
      !searchQuery ||
      brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      brand.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleDelete = async () => {
    if (!deletingBrand) return;

    deleteMutation.mutate(deletingBrand.id, {
      onSuccess: () => {
        toast.success("Brand deleted successfully");
        setDeletingBrand(null);
      },
      onError: (error: any) => {
        toast.error(error.message || "Failed to delete brand");
      },
    });
  };

  // Loading state - show skeletons
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-10 max-w-sm" />
          {isAdmin && <Skeleton className="h-10 w-32" />}
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h3 className="mt-4 text-lg font-semibold">Failed to Load Brands</h3>
        <p className="text-sm text-muted-foreground">
          {error.message || "An error occurred while fetching brands"}
        </p>
        <Button className="mt-4" onClick={() => refetch()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search brands..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {isAdmin && (
          <Button
            onClick={() => setShowForm(true)}
            disabled={createMutation.isPending}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Brand
          </Button>
        )}
      </div>

      {/* Brands Grid */}
      {filteredBrands.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8">
          <Building2 className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No brands found</h3>
          <p className="text-sm text-muted-foreground">
            {searchQuery
              ? "Try a different search term"
              : "Get started by creating a new brand"}
          </p>
          {isAdmin && !searchQuery && (
            <Button className="mt-4" onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Brand
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredBrands.map((brand) => (
            <Card
              key={brand.id}
              className="relative opacity-50"
              style={{
                opacity: deleteMutation.isPending &&
                  deleteMutation.variables === brand.id ? 0.5 : 1,
                pointerEvents:
                  deleteMutation.isPending &&
                  deleteMutation.variables === brand.id
                    ? "none"
                    : "auto",
              }}
            >
              {deleteMutation.isPending && deleteMutation.variables === brand.id && (
                <div className="absolute inset-0 rounded-lg bg-background/50 flex items-center justify-center z-10">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}

              {isAdmin && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-2"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditingBrand(brand)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setDeletingBrand(brand)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{brand.name}</CardTitle>
                    <Badge
                      variant={brand.isActive ? "success" : "secondary"}
                      className="mt-1"
                    >
                      {brand.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {brand.description && (
                  <p className="mb-4 text-sm text-muted-foreground line-clamp-2">
                    {brand.description}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                    <span>{brand._count.transactions} Txns</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>{brand._count.employees} Staff</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    Owner: {brand.owner.name}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Brand Form Dialog */}
      <BrandForm
        open={showForm || !!editingBrand}
        onOpenChange={(open) => {
          if (!open) {
            setShowForm(false);
            setEditingBrand(null);
          }
        }}
        brand={editingBrand}
        isLoading={
          createMutation.isPending || updateMutation.isPending
        }
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingBrand}
        onOpenChange={() => setDeletingBrand(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Brand</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingBrand?.name}"?
              {deletingBrand?._count.transactions
                ? " This brand has transactions and will be deactivated instead."
                : " This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
