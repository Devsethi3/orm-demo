"use server";

import { revalidatePath } from "next/cache";
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
import { eq, desc, and } from "drizzle-orm";
import { employees, salaryPayments, brands as brandsTable } from "@/db/schema";

function toSerializableEmployee(employee: any) {
  return {
    ...employee,
    salaryAmount: Number(employee.salaryAmount),
  };
}

function toSerializableSalaryPayment(payment: any) {
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

    const result = await db.insert(employees).values({
      id: crypto.randomUUID(),
      brandId: data.brandId,
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
    }).returning();

    revalidatePath("/dashboard/employees");

    return { success: true, data: toSerializableEmployee(result[0]) };
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
    (session.user.role !== "ADMIN" &&
      session.user.role !== "ACCOUNT_EXECUTIVE")
  ) {
    return [];
  }

  const empList = await db
    .select({
      id: employees.id,
      userId: employees.userId,
      brandId_val: employees.brandId,
      name: employees.name,
      email: employees.email,
      position: employees.position,
      department: employees.department,
      salaryAmount: employees.salaryAmount,
      salaryCurrency: employees.salaryCurrency,
      paymentDay: employees.paymentDay,
      joinDate: employees.joinDate,
      terminationDate: employees.terminationDate,
      isActive: employees.isActive,
      createdAt: employees.createdAt,
      updatedAt: employees.updatedAt,
      brandId_: brandsTable.id,
      brandName: brandsTable.name,
    })
    .from(employees)
    .innerJoin(brandsTable, eq(employees.brandId, brandsTable.id))
    .where(
      and(
        eq(employees.isActive, true),
        brandId ? eq(employees.brandId, brandId) : undefined,
      ),
    )
    .orderBy(employees.name);

  return empList.map((emp) => ({
    id: emp.id,
    userId: emp.userId,
    brandId: emp.brandId_val,
    name: emp.name,
    email: emp.email,
    position: emp.position,
    department: emp.department,
    salaryAmount: Number(emp.salaryAmount),
    salaryCurrency: emp.salaryCurrency,
    paymentDay: emp.paymentDay,
    joinDate: emp.joinDate,
    terminationDate: emp.terminationDate,
    isActive: emp.isActive,
    createdAt: emp.createdAt,
    updatedAt: emp.updatedAt,
    brand: {
      id: emp.brandId_!,
      name: emp.brandName!,
    },
  })) as EmployeeWithRelations[];
}

export async function getEmployee(id: string) {
  const session = await getSession();

  if (!session || session.user.role !== "ADMIN") {
    return null;
  }

  const result = await db
    .select()
    .from(employees)
    .where(eq(employees.id, id))
    .limit(1);

  const employee = result[0];
  if (!employee) {
    return null;
  }

  return {
    ...employee,
    salaryAmount: Number(employee.salaryAmount),
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

    if (!existingResult.length) {
      return { success: false, error: "Employee not found" };
    }

    const existing = existingResult[0];

    const updateData: Record<string, any> = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.email !== undefined) updateData.email = input.email.toLowerCase();
    if (input.position !== undefined) updateData.position = input.position;
    if (input.department !== undefined) updateData.department = input.department;
    if (input.salaryAmount !== undefined) updateData.salaryAmount = input.salaryAmount;
    if (input.salaryCurrency !== undefined) updateData.salaryCurrency = input.salaryCurrency.toUpperCase();
    if (input.paymentDay !== undefined) updateData.paymentDay = input.paymentDay;
    updateData.updatedAt = new Date();

    const result = await db.update(employees).set(updateData).where(eq(employees.id, id)).returning();

    revalidatePath("/dashboard/employees");

    return { success: true, data: toSerializableEmployee(result[0]) };
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
      })
      .where(eq(employees.id, id));

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

    // Calculate USD value
    const { usdValue, conversionRate } = await convertToUSD(
      data.amount,
      data.currency,
    );

    const result = await db.insert(salaryPayments).values({
      id: crypto.randomUUID(),
      employeeId: data.employeeId,
      amount: String(data.amount),
      currency: data.currency,
      conversionRate: String(conversionRate),
      usdValue: String(usdValue),
      paymentDate: data.paymentDate,
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
      status: "PAID",
      notes: data.notes,
      createdAt: new Date(),
    }).returning();

    revalidatePath("/dashboard/employees");

    return { success: true, data: toSerializableSalaryPayment(result[0]) };
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

    // Get employee details to determine salary and currency
    const emp = await db
      .select()
      .from(employees)
      .where(eq(employees.id, employeeId))
      .limit(1);

    if (!emp.length) {
      return { success: false, error: "Employee not found" };
    }

    const employee = emp[0];
    const today = new Date();

    // Calculate USD value
    const { usdValue, conversionRate } = await convertToUSD(
      Number(employee.salaryAmount),
      employee.salaryCurrency || "USD",
    );

    const result = await db.insert(salaryPayments).values({
      id: crypto.randomUUID(),
      employeeId,
      amount: String(employee.salaryAmount),
      currency: employee.salaryCurrency || "USD",
      conversionRate: String(conversionRate),
      usdValue: String(usdValue),
      paymentDate: today,
      periodStart: today,
      periodEnd: today,
      status: "PAID",
      createdAt: new Date(),
    }).returning();

    revalidatePath("/dashboard/employees");

    return { success: true, data: toSerializableSalaryPayment(result[0]) };
  } catch (error) {
    console.error("Mark employee paid error:", error);
    return { success: false, error: "Failed to mark employee as paid" };
  }
}
