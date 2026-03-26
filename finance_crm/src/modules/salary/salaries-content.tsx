import { getEmployees, getSalaryPayments } from "@/server/queries/finance";
import { formatCurrency, formatDate, getMonthName } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar04Icon, UserMultiple02Icon } from "@hugeicons/core-free-icons";

export async function SalariesContent() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [employees, payments] = await Promise.all([
    getEmployees(),
    getSalaryPayments(undefined, currentYear),
  ]);

  return (
    <div className="space-y-8">
      {/* Employees */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <HugeiconsIcon icon={UserMultiple02Icon} className="h-5 w-5" />
          Employees ({employees.length})
        </h2>
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Monthly Salary</TableHead>
                <TableHead>Start Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell className="font-medium">{emp.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {emp.position || "—"}
                  </TableCell>
                  <TableCell>{emp.brandName}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {emp.department || "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(emp.monthlySalary, emp.salaryCurrency)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(emp.startDate)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Payment History */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <HugeiconsIcon icon={Calendar04Icon} className="h-5 w-5" />
          Payment History ({currentYear})
        </h2>
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">USD Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Paid At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">
                    {payment.employeeName}
                  </TableCell>
                  <TableCell>
                    {getMonthName(payment.month)} {payment.year}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(payment.amount, payment.currency)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">
                    {formatCurrency(payment.usdBaseValue)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        payment.status === "paid" ? "default" : "secondary"
                      }
                      className={
                        payment.status === "paid"
                          ? "bg-green-500/10 text-green-500 border-green-500/20"
                          : ""
                      }
                    >
                      {payment.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {payment.paidAt ? formatDate(payment.paidAt) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
