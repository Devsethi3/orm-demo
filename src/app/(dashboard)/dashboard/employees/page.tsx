import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { EmployeesTable } from "./employees-table";

export default async function EmployeesPage() {
  const session = await getSession();

  if (
    !session ||
    (session.user.role !== "ADMIN" &&
      session.user.role !== "ACCOUNT_EXECUTIVE")
  ) {
    redirect("/dashboard");
  }

  const canManage = session.user.role === "ADMIN";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        description="Manage employees and salary payments"
      />
      <EmployeesTable canManage={canManage} />
    </div>
  );
}
