"use client";

import { useState, useEffect } from "react";
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
import { createBrand, updateBrand } from "@/actions/brands";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface BrandFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brand?: {
    id: string;
    name: string;
    description: string | null;
    logoUrl: string | null;
  } | null;
}

export function BrandForm({ open, onOpenChange, brand }: BrandFormProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!brand;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BrandInput>({
    resolver: zodResolver(brandSchema),
  });

  useEffect(() => {
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
  }, [brand, reset]);

  const onSubmit = handleSubmit(async (data) => {
    setLoading(true);
    try {
      const result = isEditing
        ? await updateBrand(brand!.id, data)
        : await createBrand(data);

      if (result.success) {
        toast.success(
          isEditing
            ? "Brand updated successfully"
            : "Brand created successfully",
        );
        reset();
        onOpenChange(false);
      } else {
        toast.error(result.error || "Operation failed");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
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
            <Label>Brand Name *</Label>
            <Input placeholder="Acme Corporation" {...register("name")} />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Brand description..."
              {...register("description")}
            />
          </div>

          <div className="space-y-2">
            <Label>Logo URL</Label>
            <Input
              placeholder="https://example.com/logo.png"
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
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Update" : "Create"} Brand
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
