"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import db from "@/lib/db";
import { getSession, invalidateAllUserSessions } from "@/lib/auth";
import type { ActionResponse, UserWithRelations } from "@/types";
import {
  updateProfileNameSchema,
  type UpdateProfileNameInput,
} from "@/lib/validations";
import { users, auditLogs } from "@/db/schema";

export async function getUsers(): Promise<UserWithRelations[]> {
  const session = await getSession();

  if (!session || session.user.role !== "ADMIN") {
    return [];
  }

  const usersList = await db
    .select()
    .from(users)
    .orderBy((t) => t.createdAt)
    .limit(1000);

  return usersList as UserWithRelations[];
}

export async function getUser(id: string) {
  const session = await getSession();

  if (!session || session.user.role !== "ADMIN") {
    return null;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return result[0] || null;
}

export async function updateUserRole(
  userId: string,
  role: string,
): Promise<ActionResponse> {
  try {
    const session = await getSession();

    if (!session || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    if (userId === session.user.id) {
      return { success: false, error: "Cannot change your own role" };
    }

    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const user = userResult[0];

    if (!user) {
      return { success: false, error: "User not found" };
    }

    await db.update(users).set({
      role: role as any,
      updatedAt: new Date(),
    }).where(eq(users.id, userId));

    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "USER_ROLE_UPDATED",
      entityType: "USER",
      entityId: userId,
      oldData: JSON.stringify({ role: user.role }),
      newData: JSON.stringify({ role }),
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
  status: string,
): Promise<ActionResponse> {
  try {
    const session = await getSession();

    if (!session || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    if (userId === session.user.id) {
      return { success: false, error: "Cannot change your own status" };
    }

    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const user = userResult[0];

    if (!user) {
      return { success: false, error: "User not found" };
    }

    await db.update(users).set({
      status: status as any,
      updatedAt: new Date(),
    }).where(eq(users.id, userId));

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
      oldData: JSON.stringify({ status: user.status }),
      newData: JSON.stringify({ status }),
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

    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const user = userResult[0];

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Invalidate all sessions
    await invalidateAllUserSessions(userId);

    // Soft delete - suspend the user
    await db.update(users).set({
      status: "SUSPENDED" as any,
      updatedAt: new Date(),
    }).where(eq(users.id, userId));

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

    const currentUserResult = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    const currentUser = currentUserResult[0];

    if (!currentUser) {
      return { success: false, error: "User not found" };
    }

    if (currentUser.name === name) {
      return { success: true, data: { name } };
    }

    await db.update(users).set({
      name,
      updatedAt: new Date(),
    }).where(eq(users.id, session.user.id));

    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "USER_NAME_UPDATED",
      entityType: "USER",
      entityId: session.user.id,
      oldData: JSON.stringify({ name: currentUser.name }),
      newData: JSON.stringify({ name }),
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
