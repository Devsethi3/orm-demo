"use server";

import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";
import { partnerSchema, type PartnerInput } from "@/lib/validations";
import type { ActionResponse, PartnerWithRelations } from "@/types";
import { Prisma } from "@/generated/prisma/client";

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
    const existingPartner = await db.partner.findUnique({
      where: { userId: data.userId },
    });

    if (existingPartner) {
      return { success: false, error: "User is already a partner" };
    }

    const partner = await db.$transaction(async (tx) => {
      // Create partner
      const newPartner = await tx.partner.create({
        data: {
          userId: data.userId,
          brandId: data.brandId,
          revenueShare: data.revenueShare,
          profitShare: data.profitShare,
        },
      });

      // Update user role to PARTNER
      await tx.user.update({
        where: { id: data.userId },
        data: { role: "PARTNER" },
      });

      // Add as brand member
      await tx.brandMember.upsert({
        where: {
          brandId_userId: {
            brandId: data.brandId,
            userId: data.userId,
          },
        },
        create: {
          brandId: data.brandId,
          userId: data.userId,
          role: "PARTNER",
        },
        update: {
          role: "PARTNER",
        },
      });

      return newPartner;
    });

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "PARTNER_CREATED",
        entityType: "PARTNER",
        entityId: partner.id,
        newData: data as unknown as Prisma.JsonObject,
      },
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

  // Partners can only see themselves
  const where: Prisma.PartnerWhereInput = {};

  if (session.user.role === "PARTNER") {
    where.userId = session.user.id;
  }

  const partners = await db.partner.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true } },
      brand: { select: { id: true, name: true } },
    },
  });

  // Calculate earnings for each partner
  const partnersWithEarnings = await Promise.all(
    partners.map(async (partner) => {
      const transactions = await db.transaction.findMany({
        where: {
          brandId: partner.brandId,
          type: "INCOME",
        },
      });

      const totalRevenue = transactions.reduce(
        (sum, t) => sum + Number(t.usdValue),
        0,
      );
      const totalEarnings = totalRevenue * (Number(partner.revenueShare) / 100);

      const pendingWithdrawals = await db.withdrawal.aggregate({
        where: {
          partnerId: partner.id,
          status: "PENDING",
        },
        _sum: { amount: true },
      });

      return {
        ...partner,
        earnings: {
          totalRevenue,
          totalEarnings,
          pendingWithdrawals: Number(pendingWithdrawals._sum.amount || 0),
        },
      };
    }),
  );

  return partnersWithEarnings as unknown as PartnerWithRelations[];
}

export async function getPartner(id: string) {
  const session = await getSession();

  if (!session) return null;

  const partner = await db.partner.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      brand: { select: { id: true, name: true } },
      withdrawals: {
        orderBy: { requestedAt: "desc" },
        take: 10,
      },
    },
  });

  // Check access
  if (session.user.role === "PARTNER" && partner?.userId !== session.user.id) {
    return null;
  }

  return partner;
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

    const existing = await db.partner.findUnique({ where: { id } });

    if (!existing) {
      return { success: false, error: "Partner not found" };
    }

    const partner = await db.partner.update({
      where: { id },
      data: {
        revenueShare: input.revenueShare,
        profitShare: input.profitShare,
      },
    });

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "PARTNER_UPDATED",
        entityType: "PARTNER",
        entityId: id,
        oldData: existing as unknown as Prisma.JsonObject,
        newData: input as unknown as Prisma.JsonObject,
      },
    });

    revalidatePath("/dashboard/partners");

    return { success: true, data: partner };
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

    const partner = await db.partner.findUnique({
      where: { id: partnerId },
    });

    if (!partner) {
      return { success: false, error: "Partner not found" };
    }

    // Partners can only request for themselves
    if (session.user.role === "PARTNER" && partner.userId !== session.user.id) {
      return { success: false, error: "Unauthorized" };
    }

    const withdrawal = await db.withdrawal.create({
      data: {
        partnerId,
        amount,
        currency: currency.toUpperCase(),
        status: "PENDING",
      },
    });

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "WITHDRAWAL_REQUESTED",
        entityType: "WITHDRAWAL",
        entityId: withdrawal.id,
        newData: {
          partnerId,
          amount,
          currency,
        } as unknown as Prisma.JsonObject,
      },
    });

    revalidatePath("/dashboard/partners");

    return { success: true, data: withdrawal };
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

    const withdrawal = await db.withdrawal.findUnique({
      where: { id: withdrawalId },
    });

    if (!withdrawal) {
      return { success: false, error: "Withdrawal not found" };
    }

    if (withdrawal.status !== "PENDING") {
      return { success: false, error: "Withdrawal has already been processed" };
    }

    await db.withdrawal.update({
      where: { id: withdrawalId },
      data: {
        status: approve ? "PAID" : "PENDING",
        processedAt: approve ? new Date() : null,
      },
    });

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: approve ? "WITHDRAWAL_APPROVED" : "WITHDRAWAL_REJECTED",
        entityType: "WITHDRAWAL",
        entityId: withdrawalId,
      },
    });

    revalidatePath("/dashboard/partners");

    return { success: true };
  } catch (error) {
    console.error("Process withdrawal error:", error);
    return { success: false, error: "Failed to process withdrawal" };
  }
}

