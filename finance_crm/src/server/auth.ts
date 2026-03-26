import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { AuthError, ForbiddenError } from "@/lib/errors";
import { ROLE_PERMISSIONS } from "@/lib/constants";
import type { UserRole } from "@/types";

export async function getServerSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

export async function requireSession() {
  const session = await getServerSession();
  if (!session) {
    throw new AuthError();
  }
  // console.log(session);
  return session;
}

export async function requireRole(allowedRoles: UserRole[]) {
  const session = await requireSession();
  const userRole = (session.user as { role: UserRole }).role;

  if (!allowedRoles.includes(userRole)) {
    throw new ForbiddenError("Insufficient permissions");
  }

  return session;
}

export async function requirePermission(permission: string) {
  const session = await requireSession();
  const userRole = (session.user as { role: UserRole }).role;
  const permissions = ROLE_PERMISSIONS[userRole] as readonly string[];

  if (!permissions.includes(permission)) {
    throw new ForbiddenError("Insufficient permissions");
  }

  return session;
}
