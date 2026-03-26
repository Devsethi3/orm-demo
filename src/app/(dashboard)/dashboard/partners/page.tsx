import { getPartners } from "@/actions/partners";
import { getBrands } from "@/actions/brands";
import { getUsers } from "@/actions/users";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { PartnersTable } from "./partners-table";

export default async function PartnersPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const canAccess = ["ADMIN", "ACCOUNT_EXECUTIVE", "PARTNER"].includes(
    session.user.role,
  );

  if (!canAccess) {
    redirect("/dashboard");
  }

  const isAdmin = session.user.role === "ADMIN";

  const [partners, brands, users] = await Promise.all([
    getPartners(),
    isAdmin ? getBrands() : Promise.resolve([]),
    isAdmin ? getUsers() : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Partners"
        description={
          isAdmin
            ? "Manage partner earnings and withdrawals"
            : "View your earnings"
        }
      />
      <PartnersTable
        partners={partners}
        brands={brands.map((b) => ({ id: b.id, name: b.name }))}
        users={users
          .filter((u) => u.role !== "PARTNER")
          .map((u) => ({ id: u.id, name: u.name, email: u.email }))}
        isAdmin={isAdmin}
      />
    </div>
  );
}
