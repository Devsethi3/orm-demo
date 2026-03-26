"use server";

import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";
import { partnerSchema, type PartnerInput } from "@/lib/validations";
import type { ActionResponse, PartnerWithRelations } from "@/types";
import { eq, and, count, desc, sum } from "drizzle-orm";
import { partners, users as usersTable, brands, withdrawals, transactions, auditLogs, brandMembers } from "@/db/schema";

export async function createPartner(
  input: PartnerInput,
): Promise<ActionResponse> {
  try {
    const session = await getSession();

    if (!session || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    const validated = partnerSchema.safeParse(input);

    if (!validated.success) {
      return {
        success: false,
        errors: validated.error.flatten().fieldErrors as Record<
          string,
          string[]
        >,
      };
    }

    const data = validated.data;

    // Check if user is already a partner
    const existingPartners = await db
      .select()
      .from(partners)
      .where(eq(partners.userId, data.userId));

    if (existingPartners.length) {
      return { success: false, error: "User is already a partner" };
    }

    // Create partner (neon-http doesn't support transactions, so use sequential operations)
    const newPartners = await db
      .insert(partners)
      .values({
        id: crypto.randomUUID(),
        userId: data.userId,
        brandId: data.brandId,
        revenueShare: String(data.revenueShare),
        profitShare: String(data.profitShare),
        joinDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const partner = newPartners[0];

    // Update user role to PARTNER
    await db
      .update(usersTable)
      .set({ role: "PARTNER" })
      .where(eq(usersTable.id, data.userId));

    // Add as brand member
    const existingMembers = await db
      .select()
      .from(brandMembers)
      .where(
        and(
          eq(brandMembers.brandId, data.brandId),
          eq(brandMembers.userId, data.userId)
        )
      );

    if (existingMembers.length) {
      await db
        .update(brandMembers)
        .set({ role: "PARTNER" })
        .where(
          and(
            eq(brandMembers.brandId, data.brandId),
            eq(brandMembers.userId, data.userId)
          )
        );
    } else {
      await db.insert(brandMembers).values({
        id: crypto.randomUUID(),
        brandId: data.brandId,
        userId: data.userId,
        role: "PARTNER",
        createdAt: new Date(),
      });
    }

    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "PARTNER_CREATED",
      entityType: "PARTNER",
      entityId: partner.id,
      newData: data,
      createdAt: new Date(),
    });

    revalidatePath("/dashboard/partners");

    return { success: true, data: partner };
  } catch (error) {
    console.error("Create partner error:", error);
    return { success: false, error: "Failed to create partner" };
  }
}

export async function getPartners(): Promise<PartnerWithRelations[]> {
  const session = await getSession();

  if (!session) return [];

  // Get partners based on user role
  let where;
  if (session.user.role === "PARTNER") {
    where = eq(partners.userId, session.user.id);
  }

  const partnerList = await db
    .select({
      id: partners.id,
      userId: partners.userId,
      brandId: partners.brandId,
      revenueShare: partners.revenueShare,
      profitShare: partners.profitShare,
      isActive: partners.isActive,
      joinDate: partners.joinDate,
      createdAt: partners.createdAt,
      updatedAt: partners.updatedAt,
      userId_: usersTable.id,
      userName: usersTable.name,
      userEmail: usersTable.email,
      brandId_: brands.id,
      brandName: brands.name,
    })
    .from(partners)
    .innerJoin(usersTable, eq(partners.userId, usersTable.id))
    .innerJoin(brands, eq(partners.brandId, brands.id))
    .where(where);

  // Calculate earnings for each partner
  const partnersWithEarnings = await Promise.all(
    partnerList.map(async (partner) => {
      const transactionsList = await db
        .select({
          usdValue: transactions.usdValue,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.brandId, partner.brandId),
            eq(transactions.type, "INCOME")
          )
        );

      const totalRevenue = transactionsList.reduce(
        (sum, t) => sum + Number(t.usdValue),
        0
      );
      const totalEarnings =
        totalRevenue * (Number(partner.revenueShare) / 100);

      const pendingWithdrawalsResult = await db
        .select({ total: sum(withdrawals.amount) })
        .from(withdrawals)
        .where(
          and(
            eq(withdrawals.partnerId, partner.id),
            eq(withdrawals.status, "PENDING")
          )
        );

      return {
        id: partner.id,
        userId: partner.userId,
        brandId: partner.brandId,
        revenueShare: Number(partner.revenueShare),
        profitShare: Number(partner.profitShare),
        isActive: partner.isActive,
        joinDate: partner.joinDate,
        createdAt: partner.createdAt,
        updatedAt: partner.updatedAt,
        user: {
          id: partner.userId_!,
          name: partner.userName!,
          email: partner.userEmail!,
        },
        brand: {
          id: partner.brandId_!,
          name: partner.brandName!,
        },
        earnings: {
          totalRevenue,
          totalEarnings,
          pendingWithdrawals:
            Number(pendingWithdrawalsResult[0]?.total || 0),
        },
      };
    })
  );

  return partnersWithEarnings as unknown as PartnerWithRelations[];
}

export async function getPartner(id: string) {
  const session = await getSession();

  if (!session) return null;

  const partnerList = await db
    .select({
      id: partners.id,
      userId: partners.userId,
      brandId: partners.brandId,
      revenueShare: partners.revenueShare,
      profitShare: partners.profitShare,
      isActive: partners.isActive,
      joinDate: partners.joinDate,
      createdAt: partners.createdAt,
      updatedAt: partners.updatedAt,
      userName: usersTable.name,
      userId_: usersTable.id,
      userEmail: usersTable.email,
      brandName: brands.name,
      brandId_: brands.id,
    })
    .from(partners)
    .innerJoin(usersTable, eq(partners.userId, usersTable.id))
    .innerJoin(brands, eq(partners.brandId, brands.id))
    .where(eq(partners.id, id))
    .limit(1);

  if (!partnerList.length) return null;

  const partner = partnerList[0];

  // Check access
  if (session.user.role === "PARTNER" && partner.userId !== session.user.id) {
    return null;
  }

  // Get withdrawals
  const partnerWithdrawals = await db
    .select()
    .from(withdrawals)
    .where(eq(withdrawals.partnerId, id))
    .orderBy(desc(withdrawals.requestedAt))
    .limit(10);

  return {
    id: partner.id,
    userId: partner.userId,
    brandId: partner.brandId,
    revenueShare: Number(partner.revenueShare),
    profitShare: Number(partner.profitShare),
    isActive: partner.isActive,
    joinDate: partner.joinDate,
    createdAt: partner.createdAt,
    updatedAt: partner.updatedAt,
    user: {
      id: partner.userId_!,
      name: partner.userName!,
      email: partner.userEmail!,
    },
    brand: {
      id: partner.brandId_!,
      name: partner.brandName!,
    },
    withdrawals: partnerWithdrawals,
  };
}

export async function updatePartner(
  id: string,
  input: Partial<PartnerInput>,
): Promise<ActionResponse> {
  try {
    const session = await getSession();

    if (!session || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    const existing = await db
      .select()
      .from(partners)
      .where(eq(partners.id, id))
      .limit(1);

    if (!existing.length) {
      return { success: false, error: "Partner not found" };
    }

    const updateData: Record<string, any> = {};
    if (input.revenueShare !== undefined) {
      updateData.revenueShare = input.revenueShare;
    }
    if (input.profitShare !== undefined) {
      updateData.profitShare = input.profitShare;
    }
    updateData.updatedAt = new Date();

    const partner = await db
      .update(partners)
      .set(updateData)
      .where(eq(partners.id, id))
      .returning();

    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "PARTNER_UPDATED",
      entityType: "PARTNER",
      entityId: id,
      oldData: existing[0],
      newData: input,
      createdAt: new Date(),
    });

    revalidatePath("/dashboard/partners");

    return { success: true, data: partner[0] };
  } catch (error) {
    console.error("Update partner error:", error);
    return { success: false, error: "Failed to update partner" };
  }
}

export async function requestWithdrawal(
  partnerId: string,
  amount: number,
  currency: string = "USD",
): Promise<ActionResponse> {
  try {
    const session = await getSession();

    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    const partnerResult = await db
      .select()
      .from(partners)
      .where(eq(partners.id, partnerId))
      .limit(1);

    if (!partnerResult.length) {
      return { success: false, error: "Partner not found" };
    }

    const partner = partnerResult[0];

    // Partners can only request for themselves
    if (session.user.role === "PARTNER" && partner.userId !== session.user.id) {
      return { success: false, error: "Unauthorized" };
    }

    const withdrawalId = crypto.randomUUID();
    await db.insert(withdrawals).values({
      id: withdrawalId,
      partnerId,
      amount: String(amount),
      currency: currency.toUpperCase(),
      status: "PENDING",
      requestedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "WITHDRAWAL_REQUESTED",
      entityType: "WITHDRAWAL",
      entityId: withdrawalId,
      newData: {
        partnerId,
        amount,
        currency,
      },
      createdAt: new Date(),
    });

    revalidatePath("/dashboard/partners");

    return { success: true, data: { id: withdrawalId } };
  } catch (error) {
    console.error("Request withdrawal error:", error);
    return { success: false, error: "Failed to request withdrawal" };
  }
}

export async function processWithdrawal(
  withdrawalId: string,
  approve: boolean,
): Promise<ActionResponse> {
  try {
    const session = await getSession();

    if (!session || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    const withdrawalResult = await db
      .select()
      .from(withdrawals)
      .where(eq(withdrawals.id, withdrawalId))
      .limit(1);

    if (!withdrawalResult.length) {
      return { success: false, error: "Withdrawal not found" };
    }

    const withdrawal = withdrawalResult[0];

    if (withdrawal.status !== "PENDING") {
      return { success: false, error: "Withdrawal has already been processed" };
    }

    await db
      .update(withdrawals)
      .set({
        status: approve ? "PAID" : "PENDING",
        processedAt: approve ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(withdrawals.id, withdrawalId));

    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: approve ? "WITHDRAWAL_APPROVED" : "WITHDRAWAL_REJECTED",
      entityType: "WITHDRAWAL",
      entityId: withdrawalId,
      createdAt: new Date(),
    });

    revalidatePath("/dashboard/partners");

    return { success: true };
  } catch (error) {
    console.error("Process withdrawal error:", error);
    return { success: false, error: "Failed to process withdrawal" };
  }
}

