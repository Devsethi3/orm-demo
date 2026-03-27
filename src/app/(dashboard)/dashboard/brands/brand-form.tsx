"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { brandSchema, type BrandInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  useCreateBrand,
  useUpdateBrand,
} from "@/lib/hooks/use-queries";

interface BrandFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brand?: {
    id: string;
    name: string;
    description: string | null;
    logoUrl: string | null;
  } | null;
  isLoading?: boolean;
}

/**
 * BrandForm Component using React Query Mutations
 *
 * Benefits:
 * - No manual loading state: Mutations provide isPending
 * - Automatic refetch on success: Invalidation happens automatically
 * - Better UX: Smooth transitions without page refresh
 * - Consistent error handling: Mutations catch errors
 */
export function BrandForm({
  open,
  onOpenChange,
  brand,
  isLoading: externalLoading,
}: BrandFormProps) {
  const isEditing = !!brand;

  // React Query mutations - manage loading state automatically
  const createMutation = useCreateBrand();
  const updateMutation = useUpdateBrand();

  const isLoading =
    externalLoading ||
    createMutation.isPending ||
    updateMutation.isPending;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BrandInput>({
    resolver: zodResolver(brandSchema),
  });

  useEffect(() => {
    if (open) {
      if (brand) {
        reset({
          name: brand.name,
          description: brand.description || "",
          logoUrl: brand.logoUrl || "",
        });
      } else {
        reset({
          name: "",
          description: "",
          logoUrl: "",
        });
      }
    }
  }, [brand, reset, open]);

  const onSubmit = handleSubmit((data) => {
    if (isEditing) {
      updateMutation.mutate(
        { id: brand!.id, data },
        {
          onSuccess: () => {
            toast.success("Brand updated successfully");
            reset();
            onOpenChange(false);
          },
          onError: (error: any) => {
            toast.error(error.message || "Failed to update brand");
          },
        }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          toast.success("Brand created successfully");
          reset();
          onOpenChange(false);
        },
        onError: (error: any) => {
          toast.error(error.message || "Failed to create brand");
        },
      });
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Brand" : "Create Brand"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Brand Name *</Label>
            <Input
              id="name"
              placeholder="Acme Corporation"
              disabled={isLoading}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brand description..."
              disabled={isLoading}
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="logoUrl">Logo URL</Label>
            <Input
              id="logoUrl"
              placeholder="https://example.com/logo.png"
              disabled={isLoading}
              {...register("logoUrl")}
            />
            {errors.logoUrl && (
              <p className="text-sm text-destructive">
                {errors.logoUrl.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isEditing ? "Update Brand" : "Create Brand"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
