"use client";

import { useState } from "react";
import { isSameMonth } from "date-fns";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmployeeForm } from "./employee-form";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  DollarSign,
  UserX,
  Users,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import type { EmployeeWithRelations } from "@/types";
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
import {
  useEmployees,
  useBrands,
  useTerminateEmployee,
} from "@/lib/hooks/use-queries";

interface EmployeesTableProps {
  canManage: boolean;
}

function SummaryCardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-4 w-24" />
          </div>
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
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-40" />
            </div>
          </TableCell>
          <TableCell>
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-20 rounded-full" />
          </TableCell>
          <TableCell className="text-right">
            <Skeleton className="ml-auto h-4 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-10" />
          </TableCell>
          <TableCell>
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-16 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-8 w-8 rounded" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function EmployeesTable({
  canManage,
}: EmployeesTableProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] =
    useState<EmployeeWithRelations | null>(null);
  const [terminatingEmployee, setTerminatingEmployee] =
    useState<EmployeeWithRelations | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // React Query hooks with auto-caching and refetch
  const { data: employees = [], isLoading, error, refetch } = useEmployees();
  const { data: brands = [] } = useBrands();
  const terminateMutation = useTerminateEmployee();

  const brandsMap = brands.reduce(
    (acc, b) => ({ ...acc, [b.id]: b.name }),
    {} as Record<string, string>
  );

  const filteredEmployees = employees.filter((emp) => {
    return (
      !searchQuery ||
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.position.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleTerminate = () => {
    if (!terminatingEmployee) return;
    
    terminateMutation.mutate(terminatingEmployee.id, {
      onSuccess: () => {
        toast.success("Employee terminated");
        setTerminatingEmployee(null);
      },
      onError: (error: any) => {
        toast.error(error.message || "Failed to terminate employee");
      },
    });
  };

  const totalSalary = employees.reduce(
    (sum, emp) => sum + Number(emp.salaryAmount),
    0,
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <SummaryCardsSkeleton />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-10 max-w-sm" />
          {canManage && <Skeleton className="h-10 w-32" />}
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead className="text-right">Salary</TableHead>
                <TableHead>Payment Day</TableHead>
                <TableHead>Last Payment</TableHead>
                <TableHead>Status</TableHead>
                {canManage && <TableHead className="w-[50px]"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableBodySkeleton />
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h3 className="mt-4 text-lg font-semibold">Failed to Load Employees</h3>
        <p className="text-sm text-muted-foreground">
          {error.message || "An error occurred while fetching employees"}
        </p>
        <Button className="mt-4" onClick={() => refetch()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              Total Employees
            </span>
          </div>
          <p className="mt-2 text-2xl font-medium">{employees.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium text-muted-foreground">
              Active
            </span>
          </div>
          <p className="mt-2 text-2xl font-medium text-green-600">
            {employees.filter((e) => e.isActive).length}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-medium text-muted-foreground">
              Monthly Payroll
            </span>
          </div>
          <p className="mt-2 text-2xl font-medium">
            {formatCurrency(totalSalary)}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-purple-500" />
            <span className="text-sm font-medium text-muted-foreground">
              Avg Salary
            </span>
          </div>
          <p className="mt-2 text-2xl font-medium">
            {formatCurrency(
              employees.length > 0 ? totalSalary / employees.length : 0,
            )}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search employees..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {canManage && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead className="text-right">Salary</TableHead>
              <TableHead>Payment Day</TableHead>
              <TableHead>Last Payment</TableHead>
              <TableHead>Status</TableHead>
              {canManage && <TableHead className="w-[50px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManage ? 8 : 7} className="h-24 text-center">
                  No employees found
                </TableCell>
              </TableRow>
            ) : (
              filteredEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{employee.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {employee.email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p>{employee.position}</p>
                      {employee.department && (
                        <p className="text-sm text-muted-foreground">
                          {employee.department}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{employee.brand.name}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(
                      Number(employee.salaryAmount),
                      employee.salaryCurrency,
                    )}
                  </TableCell>
                  <TableCell>{employee.paymentDay}th</TableCell>
                  <TableCell>
                    {employee.lastPayment ? (
                      <div>
                        <p className="text-sm">
                          {formatDate(employee.lastPayment.paymentDate)}
                        </p>
                        <Badge
                          variant={
                            employee.lastPayment.status === "PAID"
                              ? "success"
                              : "warning"
                          }
                        >
                          {employee.lastPayment.status}
                        </Badge>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No payments</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={employee.isActive ? "success" : "secondary"}
                    >
                      {employee.isActive ? "Active" : "Terminated"}
                    </Badge>
                  </TableCell>
                  {canManage && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setEditingEmployee(employee)}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          {employee.isActive && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setTerminatingEmployee(employee)}
                                className="text-destructive"
                              >
                                <UserX className="mr-2 h-4 w-4" />
                                Terminate
                              </DropdownMenuItem>
                            </>
                          )}
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

      {/* Employee Form Dialog */}
      {canManage && (
        <EmployeeForm
          open={showForm || !!editingEmployee}
          onOpenChange={(open) => {
            if (!open) {
              setShowForm(false);
              setEditingEmployee(null);
            }
          }}
          brands={brands}
          employee={editingEmployee}
        />
      )}

      {/* Terminate Confirmation */}
      {canManage && (
        <AlertDialog
          open={!!terminatingEmployee}
          onOpenChange={() => setTerminatingEmployee(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Terminate Employee</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to terminate {terminatingEmployee?.name}?
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={terminateMutation.isPending}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleTerminate}
                disabled={terminateMutation.isPending}
                className="bg-destructive text-destructive-foreground"
              >
                {terminateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Terminating...
                  </>
                ) : (
                  "Terminate"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
