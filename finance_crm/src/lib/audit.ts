import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { generateId } from "./utils";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "void"
  | "login"
  | "logout"
  | "invite"
  | "settings_change";

export type AuditEntity =
  | "transaction"
  | "bank_account"
  | "brand"
  | "project"
  | "employee"
  | "salary_payment"
  | "subscription"
  | "exchange_rate"
  | "currency"
  | "user"
  | "invitation";

export async function createAuditLog(params: {
  userId: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    await db.insert(auditLogs).values({
      id: generateId("audit"),
      userId: params.userId,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  } catch (error) {
    // Never let audit logging failures break the main flow
    console.error("[Audit Log Error]:", error);
  }
}
