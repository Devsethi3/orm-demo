"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  employeeSchema,
  salaryPaymentSchema,
  type EmployeeInput,
  type SalaryPaymentInput,
} from "@/lib/validations";
import type { ActionResponse, EmployeeWithRelations } from "@/types";
import { convertToUSD } from "@/lib/currency.server";
import { endOfMonth, startOfMonth } from "date-fns";
import {
  employees,
  salaryPayments,
  bonuses,
  transactions,
  auditLogs,
  brands,
} from "@/db/schema";

function toSerializableEmployee(employee: {
  id: string;
  brandId: string;
  userId: string | null;
  name: string;
  email: string;
  position: string;
  department: string | null;
  salaryAmount: string | number;
  salaryCurrency: string;
  paymentDay: number;
  joinDate: Date;
  terminationDate: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...employee,
    salaryAmount: Number(employee.salaryAmount),
  };
}

function toSerializableSalaryPayment(payment: {
  id: string;
  employeeId: string;
  amount: string | number;
  currency: string;
  conversionRate: string | number;
  usdValue: string | number;
  paymentDate: Date;
  periodStart: Date;
  periodEnd: Date;
  status: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...payment,
    amount: Number(payment.amount),
    conversionRate: Number(payment.conversionRate),
    usdValue: Number(payment.usdValue),
  };
}

export async function createEmployee(
  input: EmployeeInput,
): Promise<ActionResponse> {
  try {
    const session = await getSession();

    if (!session || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    const validated = employeeSchema.safeParse(input);

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
    const employeeId = crypto.randomUUID();

    await db.insert(employees).values({
      id: employeeId,
      brandId: data.brandId,
      userId: null,
      name: data.name,
      email: data.email.toLowerCase(),
      position: data.position,
      department: data.department || null,
      salaryAmount: String(data.salaryAmount),
      salaryCurrency: data.salaryCurrency.toUpperCase(),
      paymentDay: data.paymentDay,
      joinDate: data.joinDate,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "EMPLOYEE_CREATED",
      entityType: "EMPLOYEE",
      entityId: employeeId,
      newData: JSON.stringify(data),
      createdAt: new Date(),
    });

    revalidatePath("/dashboard/employees");

    return { success: true, data: { id: employeeId, ...data } };
  } catch (error) {
    console.error("Create employee error:", error);
    return { success: false, error: "Failed to create employee" };
  }
}

export async function getEmployees(
  brandId?: string,
): Promise<EmployeeWithRelations[]> {
  const session = await getSession();

  if (
    !session ||
    (session.user.role !== "ADMIN" && session.user.role !== "ACCOUNT_EXECUTIVE")
  ) {
    return [];
  }

  // Build the where conditions array
  const conditions = [eq(employees.isActive, true)];

  if (brandId) {
    conditions.push(eq(employees.brandId, brandId));
  }

  const results = await db
    .select({
      employee: employees,
      brand: {
        id: brands.id,
        name: brands.name,
        slug: brands.slug,
        description: brands.description,
        logoUrl: brands.logoUrl,
        ownerId: brands.ownerId,
        isActive: brands.isActive,
        createdAt: brands.createdAt,
        updatedAt: brands.updatedAt,
      },
    })
    .from(employees)
    .leftJoin(brands, eq(employees.brandId, brands.id))
    .where(and(...conditions));

  return results.map((row) => ({
    ...row.employee,
    salaryAmount: Number(row.employee.salaryAmount),
    brand: row.brand!,
  })) as unknown as EmployeeWithRelations[];
}

export async function getEmployee(id: string) {
  const session = await getSession();

  if (!session || session.user.role !== "ADMIN") {
    return null;
  }

  const result = await db
    .select({
      employee: employees,
      brand: {
        id: brands.id,
        name: brands.name,
        slug: brands.slug,
        description: brands.description,
        logoUrl: brands.logoUrl,
        ownerId: brands.ownerId,
        isActive: brands.isActive,
        createdAt: brands.createdAt,
        updatedAt: brands.updatedAt,
      },
    })
    .from(employees)
    .leftJoin(brands, eq(employees.brandId, brands.id))
    .where(eq(employees.id, id))
    .limit(1);

  const row = result[0];

  if (!row) {
    return null;
  }

  return {
    ...row.employee,
    salaryAmount: Number(row.employee.salaryAmount),
    brand: row.brand,
  };
}

export async function updateEmployee(
  id: string,
  input: Partial<EmployeeInput>,
): Promise<ActionResponse> {
  try {
    const session = await getSession();

    if (!session || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    const existingResult = await db
      .select()
      .from(employees)
      .where(eq(employees.id, id))
      .limit(1);

    const existing = existingResult[0];

    if (!existing) {
      return { success: false, error: "Employee not found" };
    }

    await db
      .update(employees)
      .set({
        name: input.name,
        email: input.email?.toLowerCase(),
        position: input.position,
        department: input.department,
        salaryAmount: input.salaryAmount
          ? String(input.salaryAmount)
          : existing.salaryAmount,
        salaryCurrency: input.salaryCurrency?.toUpperCase(),
        paymentDay: input.paymentDay,
        updatedAt: new Date(),
      })
      .where(eq(employees.id, id));

    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "EMPLOYEE_UPDATED",
      entityType: "EMPLOYEE",
      entityId: id,
      oldData: JSON.stringify(existing),
      newData: JSON.stringify(input),
      createdAt: new Date(),
    });

    revalidatePath("/dashboard/employees");

    return { success: true, data: { id, ...input } };
  } catch (error) {
    console.error("Update employee error:", error);
    return { success: false, error: "Failed to update employee" };
  }
}

export async function terminateEmployee(id: string): Promise<ActionResponse> {
  try {
    const session = await getSession();

    if (!session || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    await db
      .update(employees)
      .set({
        isActive: false,
        terminationDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(employees.id, id));

    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "EMPLOYEE_TERMINATED",
      entityType: "EMPLOYEE",
      entityId: id,
      createdAt: new Date(),
    });

    revalidatePath("/dashboard/employees");

    return { success: true };
  } catch (error) {
    console.error("Terminate employee error:", error);
    return { success: false, error: "Failed to terminate employee" };
  }
}

export async function createSalaryPayment(
  input: SalaryPaymentInput,
): Promise<ActionResponse> {
  try {
    const session = await getSession();

    if (!session || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    const validated = salaryPaymentSchema.safeParse(input);

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

    const { usdValue, conversionRate } = await convertToUSD(
      data.amount,
      data.currency,
    );

    const paymentId = crypto.randomUUID();

    await db.insert(salaryPayments).values({
      id: paymentId,
      employeeId: data.employeeId,
      amount: String(data.amount),
      currency: data.currency.toUpperCase(),
      conversionRate: String(conversionRate),
      usdValue: String(usdValue),
      paymentDate: data.paymentDate,
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
      status: "PAID",
      notes: data.notes || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const employeeResult = await db
      .select()
      .from(employees)
      .where(eq(employees.id, data.employeeId))
      .limit(1);

    const employee = employeeResult[0];

    if (employee) {
      await db.insert(transactions).values({
        id: crypto.randomUUID(),
        brandId: employee.brandId,
        projectId: null,
        type: "EXPENSE",
        source: "BANK",
        description: `Salary payment - ${employee.name}`,
        originalAmount: String(data.amount),
        originalCurrency: data.currency.toUpperCase(),
        conversionRate: String(conversionRate),
        usdValue: String(usdValue),
        transactionDate: data.paymentDate,
        reference: null,
        notes: null,
        createdById: session.user.id,
        isReconciled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "SALARY_PAYMENT_CREATED",
      entityType: "SALARY_PAYMENT",
      entityId: paymentId,
      newData: JSON.stringify(data),
      createdAt: new Date(),
    });

    revalidatePath("/dashboard/employees");

    return {
      success: true,
      data: {
        id: paymentId,
        amount: Number(data.amount),
        conversionRate,
        usdValue,
      },
    };
  } catch (error) {
    console.error("Create salary payment error:", error);
    return { success: false, error: "Failed to create salary payment" };
  }
}

export async function markEmployeePaid(
  employeeId: string,
): Promise<ActionResponse> {
  try {
    const session = await getSession();

    if (!session || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    const employeeResult = await db
      .select()
      .from(employees)
      .where(eq(employees.id, employeeId))
      .limit(1);

    const employee = employeeResult[0];

    if (!employee) {
      return { success: false, error: "Employee not found" };
    }

    if (!employee.isActive) {
      return {
        success: false,
        error: "Cannot mark a terminated employee as paid",
      };
    }

    const now = new Date();
    const periodStart = startOfMonth(now);
    const periodEnd = endOfMonth(now);
    const amount = Number(employee.salaryAmount);
    const currency = employee.salaryCurrency.toUpperCase();

    const { usdValue, conversionRate } = await convertToUSD(amount, currency);

    const paymentId = crypto.randomUUID();

    await db.insert(salaryPayments).values({
      id: paymentId,
      employeeId: employee.id,
      amount: String(amount),
      currency,
      conversionRate: String(conversionRate),
      usdValue: String(usdValue),
      paymentDate: now,
      periodStart,
      periodEnd,
      status: "PAID",
      notes: "Marked paid from employees table",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.insert(transactions).values({
      id: crypto.randomUUID(),
      brandId: employee.brandId,
      projectId: null,
      type: "EXPENSE",
      source: "BANK",
      description: `Salary payment - ${employee.name}`,
      originalAmount: String(amount),
      originalCurrency: currency,
      conversionRate: String(conversionRate),
      usdValue: String(usdValue),
      transactionDate: now,
      reference: null,
      notes: "Marked paid from employees table",
      createdById: session.user.id,
      isReconciled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "SALARY_PAYMENT_MARKED_PAID",
      entityType: "EMPLOYEE",
      entityId: employee.id,
      newData: JSON.stringify({
        amount,
        currency,
        paymentDate: now,
      }),
      createdAt: new Date(),
    });

    revalidatePath("/dashboard/employees");

    return {
      success: true,
      data: {
        id: paymentId,
        amount,
        conversionRate,
        usdValue: Number(usdValue),
      },
    };
  } catch (error) {
    console.error("Mark employee paid error:", error);
    return { success: false, error: "Failed to mark employee as paid" };
  }
}

export async function addBonus(
  employeeId: string,
  amount: number,
  currency: string,
  reason: string,
): Promise<ActionResponse> {
  try {
    const session = await getSession();

    if (!session || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    const bonusId = crypto.randomUUID();

    await db.insert(bonuses).values({
      id: bonusId,
      employeeId,
      amount: String(amount),
      currency: currency.toUpperCase(),
      reason,
      paymentDate: new Date(),
      createdAt: new Date(),
    });

    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "BONUS_ADDED",
      entityType: "BONUS",
      entityId: bonusId,
      newData: JSON.stringify({
        employeeId,
        amount,
        currency,
        reason,
      }),
      createdAt: new Date(),
    });

    revalidatePath("/dashboard/employees");

    return {
      success: true,
      data: {
        id: bonusId,
        amount,
        currency,
        reason,
      },
    };
  } catch (error) {
    console.error("Add bonus error:", error);
    return { success: false, error: "Failed to add bonus" };
  }
}
