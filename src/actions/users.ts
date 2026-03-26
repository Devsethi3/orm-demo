"use server";

import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { getSession, invalidateAllUserSessions } from "@/lib/auth";
import type { ActionResponse, UserWithRelations } from "@/types";
import { UserRole, UserStatus } from "@/lib/types/enums";
import { eq, count, desc } from "drizzle-orm";
import { users as usersTable, auditLogs, transactions, brandMembers, brands } from "@/db/schema";
import {
  updateProfileNameSchema,
  type UpdateProfileNameInput,
} from "@/lib/validations";

export async function getUsers(): Promise<UserWithRelations[]> {
  const session = await getSession();

  if (!session || session.user.role !== "ADMIN") {
    return [];
  }

  const users = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      role: usersTable.role,
      status: usersTable.status,
      lastLoginAt: usersTable.lastLoginAt,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .orderBy(desc(usersTable.createdAt));

  // Get transaction count for each user
  const usersWithCounts = await Promise.all(
    users.map(async (user) => {
      const transactionCount = await db
        .select({ count: count() })
        .from(transactions)
        .where(eq(transactions.createdById, user.id));

      return {
        ...user,
        _count: {
          transactions: transactionCount[0]?.count || 0,
        },
      };
    })
  );

  return usersWithCounts as UserWithRelations[];
}

export async function getUser(id: string) {
  const session = await getSession();

  if (!session || session.user.role !== "ADMIN") {
    return null;
  }

  const user = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      role: usersTable.role,
      status: usersTable.status,
      lastLoginAt: usersTable.lastLoginAt,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .where(eq(usersTable.id, id))
    .limit(1);

  if (!user.length) {
    return null;
  }

  // Get brand members with brand info
  const userBrandMembers = await db
    .select({
      id: brandMembers.id,
      brandId: brandMembers.brandId,
      userId: brandMembers.userId,
      role: brandMembers.role,
      brand: {
        id: brands.id,
        name: brands.name,
      },
    })
    .from(brandMembers)
    .leftJoin(brands, eq(brandMembers.brandId, brands.id))
    .where(eq(brandMembers.userId, id));

  // Get transaction count
  const transactionCount = await db
    .select({ count: count() })
    .from(transactions)
    .where(eq(transactions.createdById, id));

  return {
    ...user[0],
    brandMembers: userBrandMembers,
    _count: {
      transactions: transactionCount[0]?.count || 0,
    },
  };
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

    const existingUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!existingUser.length) {
      return { success: false, error: "User not found" };
    }

    const user = existingUser[0];

    await db.update(usersTable).set({ role }).where(eq(usersTable.id, userId));

    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "USER_ROLE_UPDATED",
      entityType: "USER",
      entityId: userId,
      oldData: { role: user.role },
      newData: { role },
      createdAt: new Date(),
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

    const existingUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!existingUser.length) {
      return { success: false, error: "User not found" };
    }

    const user = existingUser[0];

    await db
      .update(usersTable)
      .set({ status })
      .where(eq(usersTable.id, userId));

    // Invalidate sessions if suspending
    if (status === "SUSPENDED") {
      await invalidateAllUserSessions(userId);
    }

    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "USER_STATUS_UPDATED",
      entityType: "USER",
      entityId: userId,
      oldData: { status: user.status },
      newData: { status },
      createdAt: new Date(),
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

    const users = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!users.length) {
      return { success: false, error: "User not found" };
    }

    const user = users[0];

    // Invalidate all sessions
    await invalidateAllUserSessions(userId);

    // Get transaction count
    const transactionCounts = await db
      .select({ count: count() })
      .from(transactions)
      .where(eq(transactions.createdById, userId));

    const transactionCount = transactionCounts[0]?.count || 0;

    if (transactionCount > 0) {
      // Soft delete - suspend the user
      await db
        .update(usersTable)
        .set({ status: "SUSPENDED" })
        .where(eq(usersTable.id, userId));
    } else {
      // Hard delete
      await db.delete(usersTable).where(eq(usersTable.id, userId));
    }

    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "USER_DELETED",
      entityType: "USER",
      entityId: userId,
      createdAt: new Date(),
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

    const currentUsers = await db
      .select({ id: usersTable.id, name: usersTable.name })
      .from(usersTable)
      .where(eq(usersTable.id, session.user.id))
      .limit(1);

    if (!currentUsers.length) {
      return { success: false, error: "User not found" };
    }

    const currentUser = currentUsers[0];

    if (currentUser.name === name) {
      return { success: true, data: { name } };
    }

    await db
      .update(usersTable)
      .set({ name })
      .where(eq(usersTable.id, session.user.id));

    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "USER_NAME_UPDATED",
      entityType: "USER",
      entityId: session.user.id,
      oldData: { name: currentUser.name },
      newData: { name },
      createdAt: new Date(),
    });

    revalidatePath("/dashboard", "layout");
    revalidatePath("/dashboard/settings");

    return { success: true, data: { name } };
  } catch (error) {
    console.error("Update current user name error:", error);
    return { success: false, error: "Failed to update name" };
  }
}
