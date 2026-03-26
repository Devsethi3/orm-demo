"use server";

import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { getSession, invalidateAllUserSessions } from "@/lib/auth";
import type { ActionResponse, UserWithRelations } from "@/types";
import { UserRole, UserStatus } from "@/generated/prisma/enums";
import { Prisma } from "@/generated/prisma/client";
import {
  updateProfileNameSchema,
  type UpdateProfileNameInput,
} from "@/lib/validations";

export async function getUsers(): Promise<UserWithRelations[]> {
  const session = await getSession();

  if (!session || session.user.role !== "ADMIN") {
    return [];
  }

  const users = await db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      lastLoginAt: true,
      createdAt: true,
      _count: {
        select: { transactions: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return users as UserWithRelations[];
}

export async function getUser(id: string) {
  const session = await getSession();

  if (!session || session.user.role !== "ADMIN") {
    return null;
  }

  return db.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      lastLoginAt: true,
      createdAt: true,
      brandMembers: {
        include: {
          brand: { select: { id: true, name: true } },
        },
      },
      _count: {
        select: { transactions: true },
      },
    },
  });
}

export async function updateUserRole(
  userId: string,
  role: UserRole,
): Promise<ActionResponse> {
  try {
    const session = await getSession();

    if (!session || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    if (userId === session.user.id) {
      return { success: false, error: "Cannot change your own role" };
    }

    const user = await db.user.findUnique({ where: { id: userId } });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    await db.user.update({
      where: { id: userId },
      data: { role },
    });

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "USER_ROLE_UPDATED",
        entityType: "USER",
        entityId: userId,
        oldData: { role: user.role } as unknown as Prisma.JsonObject,
        newData: { role } as unknown as Prisma.JsonObject,
      },
    });

    revalidatePath("/dashboard/users");

    return { success: true };
  } catch (error) {
    console.error("Update user role error:", error);
    return { success: false, error: "Failed to update user role" };
  }
}

export async function updateUserStatus(
  userId: string,
  status: UserStatus,
): Promise<ActionResponse> {
  try {
    const session = await getSession();

    if (!session || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    if (userId === session.user.id) {
      return { success: false, error: "Cannot change your own status" };
    }

    const user = await db.user.findUnique({ where: { id: userId } });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    await db.user.update({
      where: { id: userId },
      data: { status },
    });

    // Invalidate sessions if suspending
    if (status === "SUSPENDED") {
      await invalidateAllUserSessions(userId);
    }

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "USER_STATUS_UPDATED",
        entityType: "USER",
        entityId: userId,
        oldData: { status: user.status } as unknown as Prisma.JsonObject,
        newData: { status } as unknown as Prisma.JsonObject,
      },
    });

    revalidatePath("/dashboard/users");

    return { success: true };
  } catch (error) {
    console.error("Update user status error:", error);
    return { success: false, error: "Failed to update user status" };
  }
}

export async function deleteUser(userId: string): Promise<ActionResponse> {
  try {
    const session = await getSession();

    if (!session || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    if (userId === session.user.id) {
      return { success: false, error: "Cannot delete your own account" };
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        _count: { select: { transactions: true } },
      },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Invalidate all sessions
    await invalidateAllUserSessions(userId);

    if (user._count.transactions > 0) {
      // Soft delete - suspend the user
      await db.user.update({
        where: { id: userId },
        data: { status: "SUSPENDED" },
      });
    } else {
      // Hard delete
      await db.user.delete({ where: { id: userId } });
    }

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "USER_DELETED",
        entityType: "USER",
        entityId: userId,
      },
    });

    revalidatePath("/dashboard/users");

    return { success: true };
  } catch (error) {
    console.error("Delete user error:", error);
    return { success: false, error: "Failed to delete user" };
  }
}

export async function updateCurrentUserName(
  input: UpdateProfileNameInput,
): Promise<ActionResponse<{ name: string }>> {
  try {
    const session = await getSession();

    if (!session) {
      return { success: false, error: "Unauthorized" };
    }

    const validated = updateProfileNameSchema.safeParse(input);

    if (!validated.success) {
      return {
        success: false,
        errors: validated.error.flatten().fieldErrors as Record<
          string,
          string[]
        >,
      };
    }

    const { name } = validated.data;

    const currentUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true },
    });

    if (!currentUser) {
      return { success: false, error: "User not found" };
    }

    if (currentUser.name === name) {
      return { success: true, data: { name } };
    }

    await db.user.update({
      where: { id: session.user.id },
      data: { name },
    });

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "USER_NAME_UPDATED",
        entityType: "USER",
        entityId: session.user.id,
        oldData: { name: currentUser.name } as unknown as Prisma.JsonObject,
        newData: { name } as unknown as Prisma.JsonObject,
      },
    });

    revalidatePath("/dashboard", "layout");
    revalidatePath("/dashboard/settings");

    return { success: true, data: { name } };
  } catch (error) {
    console.error("Update current user name error:", error);
    return { success: false, error: "Failed to update name" };
  }
}
