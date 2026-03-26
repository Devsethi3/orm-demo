"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";
import { partnerSchema, type PartnerInput } from "@/lib/validations";
import type { ActionResponse, PartnerWithRelations } from "@/types";
import {
  partners,
  users,
  brandMembers,
  withdrawals,
  transactions,
  auditLogs,
} from "@/db/schema";

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
    const existingPartnerResult = await db
      .select()
      .from(partners)
      .where(eq(partners.userId, data.userId))
      .limit(1);

    if (existingPartnerResult.length > 0) {
      return { success: false, error: "User is already a partner" };
    }

    const partnerId = crypto.randomUUID();

    await db.insert(partners).values({
      id: partnerId,
      userId: data.userId,
      brandId: data.brandId,
      revenueShare: String(data.revenueShare),
      profitShare: String(data.profitShare),
      isActive: true,
      joinDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Update user role to PARTNER
    await db
      .update(users)
      .set({
        role: "PARTNER" as any,
        updatedAt: new Date(),
      })
      .where(eq(users.id, data.userId));

    // Add as brand member
    const memberResult = await db
      .select()
      .from(brandMembers)
      .where(eq(brandMembers.userId, data.userId))
      .limit(1);

    if (memberResult.length === 0) {
      await db.insert(brandMembers).values({
        id: crypto.randomUUID(),
        brandId: data.brandId,
        userId: data.userId,
        role: "PARTNER" as any,
        createdAt: new Date(),
      });
    }

    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "PARTNER_CREATED",
      entityType: "PARTNER",
      entityId: partnerId,
      newData: JSON.stringify(data),
      createdAt: new Date(),
    });

    revalidatePath("/dashboard/partners");

    return { success: true, data: { id: partnerId, ...data } };
  } catch (error) {
    console.error("Create partner error:", error);
    return { success: false, error: "Failed to create partner" };
  }
}

export async function getPartners(): Promise<PartnerWithRelations[]> {
  const session = await getSession();

  if (!session) return [];

  // Partners can only see themselves
  let partnersList;

  if (session.user.role === "PARTNER") {
    partnersList = await db
      .select()
      .from(partners)
      .where(eq(partners.userId, session.user.id));
  } else {
    partnersList = await db.select().from(partners);
  }

  // Calculate earnings for each partner
  const partnersWithEarnings = await Promise.all(
    partnersList.map(async (partner) => {
      const partnerTransactions = await db
        .select()
        .from(transactions)
        .where(eq(transactions.brandId, partner.brandId));

      const totalRevenue = partnerTransactions.reduce(
        (sum, t) => sum + Number(t.usdValue),
        0,
      );
      const totalEarnings = totalRevenue * (Number(partner.revenueShare) / 100);

      const pendingWithdrawalsResult = await db
        .select()
        .from(withdrawals)
        .where(eq(withdrawals.partnerId, partner.id));

      const pendingAmount = pendingWithdrawalsResult.reduce(
        (sum, w) => sum + Number(w.amount),
        0,
      );

      return {
        ...partner,
        earnings: {
          totalRevenue,
          totalEarnings,
          pendingWithdrawals: pendingAmount,
        },
      };
    }),
  );

  return partnersWithEarnings as unknown as PartnerWithRelations[];
}

export async function getPartner(id: string) {
  const session = await getSession();

  if (!session) return null;

  const partnerResult = await db
    .select()
    .from(partners)
    .where(eq(partners.id, id))
    .limit(1);

  const partner = partnerResult[0];

  // Check access
  if (session.user.role === "PARTNER" && partner?.userId !== session.user.id) {
    return null;
  }

  return partner || null;
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

    const existingResult = await db
      .select()
      .from(partners)
      .where(eq(partners.id, id))
      .limit(1);

    const existing = existingResult[0];

    if (!existing) {
      return { success: false, error: "Partner not found" };
    }

    await db
      .update(partners)
      .set({
        revenueShare: input.revenueShare
          ? String(input.revenueShare)
          : existing.revenueShare,
        profitShare: input.profitShare
          ? String(input.profitShare)
          : existing.profitShare,
        updatedAt: new Date(),
      })
      .where(eq(partners.id, id));

    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "PARTNER_UPDATED",
      entityType: "PARTNER",
      entityId: id,
      oldData: JSON.stringify(existing),
      newData: JSON.stringify(input),
      createdAt: new Date(),
    });

    revalidatePath("/dashboard/partners");

    return { success: true, data: { id, ...input } };
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

    const partner = partnerResult[0];

    if (!partner) {
      return { success: false, error: "Partner not found" };
    }

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
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "WITHDRAWAL_REQUESTED",
      entityType: "WITHDRAWAL",
      entityId: withdrawalId,
      newData: JSON.stringify({
        partnerId,
        amount,
        currency,
      }),
      createdAt: new Date(),
    });

    revalidatePath("/dashboard/partners");

    return {
      success: true,
      data: {
        id: withdrawalId,
        partnerId,
        amount,
        currency: currency.toUpperCase(),
        status: "PENDING",
      },
    };
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

    const withdrawal = withdrawalResult[0];

    if (!withdrawal) {
      return { success: false, error: "Withdrawal not found" };
    }

    if (withdrawal.status !== "PENDING") {
      return {
        success: false,
        error: "Withdrawal has already been processed",
      };
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
