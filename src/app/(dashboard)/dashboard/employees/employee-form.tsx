"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { employeeSchema, type EmployeeInput } from "@/lib/validations";
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
} from "@/components/ui/dialog";
import { createEmployee, updateEmployee } from "@/actions/employees";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { EmployeeWithRelations } from "@/types";

interface EmployeeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brands: { id: string; name: string }[];
  employee?: EmployeeWithRelations | null;
}

const currencies = ["USD", "INR", "EUR", "AED", "GBP"];

export function EmployeeForm({
  open,
  onOpenChange,
  brands,
  employee,
}: EmployeeFormProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!employee;

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<z.input<typeof employeeSchema>, any, EmployeeInput>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      salaryCurrency: "USD",
      paymentDay: 1,
      joinDate: new Date(),
    },
  });

  useEffect(() => {
    if (employee) {
      setValue("brandId", employee.brand.id);
      setValue("name", employee.name);
      setValue("email", employee.email);
      setValue("position", employee.position);
      setValue("department", employee.department || "");
      setValue("salaryAmount", Number(employee.salaryAmount));
      setValue("salaryCurrency", employee.salaryCurrency);
      setValue("paymentDay", employee.paymentDay);
      setValue("joinDate", new Date(employee.joinDate));
    } else {
      reset({
        salaryCurrency: "USD",
        paymentDay: 1,
        joinDate: new Date(),
      });
    }
  }, [employee, setValue, reset]);

  const onSubmit = async (data: EmployeeInput) => {
    setLoading(true);
    try {
      const result = isEditing
        ? await updateEmployee(employee!.id, data)
        : await createEmployee(data);

      if (result.success) {
        toast.success(isEditing ? "Employee updated" : "Employee added");
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
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Employee" : "Add Employee"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Brand *</Label>
            <Select
              defaultValue={employee?.brand.id}
              onValueChange={(value) => setValue("brandId", value)}
            >
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input placeholder="John Doe" {...register("name")} />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                placeholder="john@example.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Position *</Label>
              <Input
                placeholder="Software Engineer"
                {...register("position")}
              />
              {errors.position && (
                <p className="text-sm text-destructive">
                  {errors.position.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Department</Label>
              <Input placeholder="Engineering" {...register("department")} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Salary *</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="5000"
                {...register("salaryAmount", { valueAsNumber: true })}
              />
              {errors.salaryAmount && (
                <p className="text-sm text-destructive">
                  {errors.salaryAmount.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Currency</Label>
              <Select
                defaultValue={employee?.salaryCurrency || "USD"}
                onValueChange={(value) => setValue("salaryCurrency", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Payment Day</Label>
              <Select
                defaultValue={String(employee?.paymentDay || 1)}
                onValueChange={(value) =>
                  setValue("paymentDay", parseInt(value))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                    <SelectItem key={day} value={String(day)}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Join Date *</Label>
            <Input
              type="date"
              {...register("joinDate", { valueAsDate: true })}
              defaultValue={
                employee
                  ? new Date(employee.joinDate).toISOString().split("T")[0]
                  : new Date().toISOString().split("T")[0]
              }
            />
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
              {isEditing ? "Update" : "Add"} Employee
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
