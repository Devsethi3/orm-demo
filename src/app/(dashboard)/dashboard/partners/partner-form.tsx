"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { partnerSchema, type PartnerInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { createPartner, updatePartner } from "@/actions/partners";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { PartnerWithRelations } from "@/types";

interface PartnerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brands: { id: string; name: string }[];
  users: { id: string; name: string; email: string }[];
  partner?: PartnerWithRelations | null;
}

export function PartnerForm({
  open,
  onOpenChange,
  brands,
  users,
  partner,
}: PartnerFormProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!partner;

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<z.input<typeof partnerSchema>, any, PartnerInput>({
    resolver: zodResolver(partnerSchema),
    defaultValues: {
      revenueShare: 0,
      profitShare: 0,
    },
  });

  useEffect(() => {
    if (partner) {
      setValue("userId", partner.user.id);
      setValue("brandId", partner.brand.id);
      setValue("revenueShare", Number(partner.revenueShare));
      setValue("profitShare", Number(partner.profitShare));
    } else {
      reset({
        revenueShare: 0,
        profitShare: 0,
      });
    }
  }, [partner, setValue, reset]);

  const onSubmit = handleSubmit(async (data) => {
    setLoading(true);
    try {
      const result = isEditing
        ? await updatePartner(partner!.id, data)
        : await createPartner(data);

      if (result.success) {
        toast.success(isEditing ? "Partner updated" : "Partner added");
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
          <DialogTitle>
            {isEditing ? "Edit Partner" : "Add Partner"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update partner revenue and profit share percentages"
              : "Add a new partner with revenue sharing"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          {!isEditing && (
            <div className="space-y-2">
              <Label>User *</Label>
              <Select onValueChange={(value) => setValue("userId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.userId && (
                <p className="text-sm text-destructive">
                  {errors.userId.message}
                </p>
              )}
            </div>
          )}

          {!isEditing && (
            <div className="space-y-2">
              <Label>Brand *</Label>
              <Select onValueChange={(value) => setValue("brandId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.brandId && (
                <p className="text-sm text-destructive">
                  {errors.brandId.message}
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Revenue Share (%)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="10"
                {...register("revenueShare")}
              />
              {errors.revenueShare && (
                <p className="text-sm text-destructive">
                  {errors.revenueShare.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Profit Share (%)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="20"
                {...register("profitShare")}
              />
              {errors.profitShare && (
                <p className="text-sm text-destructive">
                  {errors.profitShare.message}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-lg border bg-muted/50 p-4 text-sm">
            <p className="font-medium">How it works:</p>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              <li>
                • <strong>Revenue Share:</strong> Partner receives X% of total
                revenue
              </li>
              <li>
                • <strong>Profit Share:</strong> Partner receives X% of net
                profit
              </li>
            </ul>
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
              {isEditing ? "Update" : "Add"} Partner
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
