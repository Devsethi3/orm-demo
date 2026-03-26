import db from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { InvitesTable } from "./invites-table";

export default async function InvitesPage() {
  const session = await getSession();

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const invites = await db.invite.findMany({
    include: {
      invitedBy: { select: { id: true, name: true, email: true } },
      brand: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const brands = await db.brand.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Invites" description="Manage user invitations" />
      <InvitesTable invites={invites as any} brands={brands} />
    </div>
  );
}
