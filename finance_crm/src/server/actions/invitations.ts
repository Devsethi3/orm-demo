"use server";

import { db } from "@/db";
import { invitations, users } from "@/db/schema";
import { requirePermission } from "@/server/auth";
import { generateId } from "@/lib/utils";
import { createAuditLog } from "@/lib/audit";
import { handleActionError } from "@/lib/errors";
import { eq, and, isNull, gt } from "drizzle-orm";
import { invalidateTag } from "@/lib/cache";
import { z } from "zod";
import { nanoid } from "nanoid";
import type { ActionResponse } from "@/types";

const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "finance", "hr", "viewer"]),
});

export async function createInvitation(
  formData: z.infer<typeof inviteSchema>,
): Promise<ActionResponse<{ token: string }>> {
  try {
    const session = await requirePermission("manage:invitations");
    const validated = inviteSchema.parse(formData);

    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, validated.email))
      .limit(1);

    if (existingUser.length > 0) {
      return { success: false, error: "User with this email already exists" };
    }

    const existingInvite = await db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.email, validated.email),
          isNull(invitations.usedAt),
          gt(invitations.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (existingInvite.length > 0) {
      return {
        success: false,
        error: "Active invitation already exists for this email",
      };
    }

    const token = nanoid(32);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const id = generateId("inv");

    await db.insert(invitations).values({
      id,
      email: validated.email,
      role: validated.role,
      token,
      invitedBy: session.user.id,
      expiresAt,
    });

    await createAuditLog({
      userId: session.user.id,
      action: "invite",
      entity: "invitation",
      entityId: id,
      metadata: { email: validated.email, role: validated.role },
    });

    invalidateTag("invitations");

    return { success: true, data: { token } };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function validateInvitation(
  token: string,
): Promise<ActionResponse<{ email: string; role: string }>> {
  try {
    const invite = await db
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.token, token),
          isNull(invitations.usedAt),
          gt(invitations.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (invite.length === 0) {
      return { success: false, error: "Invalid or expired invitation" };
    }

    return {
      success: true,
      data: { email: invite[0].email, role: invite[0].role },
    };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function markInvitationUsed(token: string): Promise<void> {
  await db
    .update(invitations)
    .set({ usedAt: new Date() })
    .where(eq(invitations.token, token));

  invalidateTag("invitations");
}

export async function revokeInvitation(id: string): Promise<ActionResponse> {
  try {
    const session = await requirePermission("manage:invitations");

    const invite = await db
      .select()
      .from(invitations)
      .where(eq(invitations.id, id))
      .limit(1);

    if (invite.length === 0) {
      return { success: false, error: "Invitation not found" };
    }

    if (invite[0].usedAt) {
      return { success: false, error: "Invitation already used" };
    }

    await db
      .update(invitations)
      .set({ expiresAt: new Date() })
      .where(eq(invitations.id, id));

    await createAuditLog({
      userId: session.user.id,
      action: "delete",
      entity: "invitation",
      entityId: id,
      metadata: { email: invite[0].email },
    });

    invalidateTag("invitations");

    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}
