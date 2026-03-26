import db from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { invites, brands as brandsTable, users as usersTable } from "@/db/schema";
import { PageHeader } from "@/components/layout/page-header";
import { InvitesTable } from "./invites-table";

export default async function InvitesPage() {
  const session = await getSession();

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const invitesList = await db
    .select({
      id: invites.id,
      email: invites.email,
      role: invites.role,
      token: invites.token,
      status: invites.status,
      expiresAt: invites.expiresAt,
      invitedById: invites.invitedById,
      brandId: invites.brandId,
      acceptedAt: invites.acceptedAt,
      createdAt: invites.createdAt,
      updatedAt: invites.updatedAt,
      invitedById_: usersTable.id,
      invitedByName: usersTable.name,
      brandId_: brandsTable.id,
      brandName: brandsTable.name,
    })
    .from(invites)
    .innerJoin(usersTable, eq(invites.invitedById, usersTable.id))
    .leftJoin(brandsTable, eq(invites.brandId, brandsTable.id))
    .orderBy(invites.createdAt);

  // Transform to match InviteWithRelations type
  const formattedInvites = invitesList.map((inv) => ({
    id: inv.id,
    email: inv.email,
    role: inv.role,
    token: inv.token,
    status: inv.status,
    expiresAt: inv.expiresAt,
    invitedById: inv.invitedById,
    brandId: inv.brandId,
    acceptedAt: inv.acceptedAt,
    createdAt: inv.createdAt,
    updatedAt: inv.updatedAt,
    invitedBy: {
      id: inv.invitedById_!,
      name: inv.invitedByName!,
    },
    brand: inv.brandId_
      ? {
          id: inv.brandId_,
          name: inv.brandName!,
        }
      : null,
  }));

  const brandsList = await db
    .select({ id: brandsTable.id, name: brandsTable.name })
    .from(brandsTable)
    .where(eq(brandsTable.isActive, true));

  return (
    <div className="space-y-6">
      <PageHeader title="Invites" description="Manage user invitations" />
      <InvitesTable invites={formattedInvites as any} brands={brandsList} />
    </div>
  );
}
