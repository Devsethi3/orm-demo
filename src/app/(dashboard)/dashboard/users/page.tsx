import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { UsersTable } from "./users-table";

export default async function UsersPage() {
  const session = await getSession();

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage system users and their roles"
      />
      <UsersTable currentUserId={session.user.id} />
    </div>
  );
}
