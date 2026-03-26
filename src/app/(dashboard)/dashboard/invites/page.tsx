import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { InvitesTable } from "./invites-table";
import { invites, users, brands } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import db from "@/lib/db";

export default async function InvitesPage() {
  const session = await getSession();

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Fetch invites with relations - with limit
  const invitesList = await db
    .select({
      id: invites.id,
      email: invites.email,
      role: invites.role,
      status: invites.status,
      token: invites.token,
      expiresAt: invites.expiresAt,
      createdAt: invites.createdAt,
      invitedBy: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
      brand: {
        id: brands.id,
        name: brands.name,
      },
    })
    .from(invites)
    .leftJoin(users, eq(invites.invitedById, users.id))
    .leftJoin(brands, eq(invites.brandId, brands.id))
    .orderBy(desc(invites.createdAt))
    .limit(100);

  // Fetch active brands
  const brandsList = await db
    .select({
      id: brands.id,
      name: brands.name,
    })
    .from(brands)
    .where(eq(brands.isActive, true));

  return (
    <div className="space-y-6">
      <PageHeader title="Invites" description="Manage user invitations" />
      <InvitesTable invites={invitesList} brands={brandsList} />
    </div>
  );
}
