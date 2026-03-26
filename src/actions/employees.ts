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
import { Prisma } from "@/generated/prisma/client";
import { convertToUSD } from "@/lib/currency.server";
import { endOfMonth, startOfMonth } from "date-fns";

function toSerializableEmployee(employee: {
  id: string;
  brandId: string;
  userId: string | null;
  name: string;
  email: string;
  position: string;
  department: string | null;
  salaryAmount: Prisma.Decimal;
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
  amount: Prisma.Decimal;
  currency: string;
  conversionRate: Prisma.Decimal;
  usdValue: Prisma.Decimal;
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

    const employee = await db.employee.create({
      data: {
        brandId: data.brandId,
        name: data.name,
        email: data.email.toLowerCase(),
        position: data.position,
        department: data.department,
        salaryAmount: data.salaryAmount,
        salaryCurrency: data.salaryCurrency.toUpperCase(),
        paymentDay: data.paymentDay,
        joinDate: data.joinDate,
      },
    });

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "EMPLOYEE_CREATED",
        entityType: "EMPLOYEE",
        entityId: employee.id,
        newData: data as unknown as Prisma.JsonObject,
      },
    });

    revalidatePath("/dashboard/employees");

    return { success: true, data: toSerializableEmployee(employee) };
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

  const where: Prisma.EmployeeWhereInput = { isActive: true };

  if (brandId) {
    where.brandId = brandId;
  }

  const employees = await db.employee.findMany({
    where,
    include: {
      brand: { select: { id: true, name: true } },
      _count: { select: { salaryPayments: true } },
      salaryPayments: {
        take: 1,
        orderBy: { paymentDate: "desc" },
        select: { paymentDate: true, status: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return employees.map((emp) => ({
    ...emp,
    salaryAmount: Number(emp.salaryAmount), 
    lastPayment: emp.salaryPayments[0] || null,
  })) satisfies EmployeeWithRelations[];
}

export async function getEmployee(id: string) {
  const session = await getSession();

  if (!session || session.user.role !== "ADMIN") {
    return null;
  }

  const employee = await db.employee.findUnique({
    where: { id },
    include: {
      brand: { select: { id: true, name: true } },
      salaryPayments: {
        orderBy: { paymentDate: "desc" },
        take: 12,
      },
      bonuses: {
        orderBy: { paymentDate: "desc" },
      },
    },
  });

  if (!employee) {
    return null;
  }

  return {
    ...employee,
    salaryAmount: Number(employee.salaryAmount),
    salaryPayments: employee.salaryPayments.map((payment) => ({
      ...payment,
      amount: Number(payment.amount),
      conversionRate: Number(payment.conversionRate),
      usdValue: Number(payment.usdValue),
    })),
    bonuses: employee.bonuses.map((bonus) => ({
      ...bonus,
      amount: Number(bonus.amount),
    })),
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

    const existing = await db.employee.findUnique({ where: { id } });

    if (!existing) {
      return { success: false, error: "Employee not found" };
    }

    const employee = await db.employee.update({
      where: { id },
      data: {
        name: input.name,
        email: input.email?.toLowerCase(),
        position: input.position,
        department: input.department,
        salaryAmount: input.salaryAmount,
        salaryCurrency: input.salaryCurrency?.toUpperCase(),
        paymentDay: input.paymentDay,
      },
    });

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "EMPLOYEE_UPDATED",
        entityType: "EMPLOYEE",
        entityId: id,
        oldData: existing as unknown as Prisma.JsonObject,
        newData: input as unknown as Prisma.JsonObject,
      },
    });

    revalidatePath("/dashboard/employees");

    return { success: true, data: toSerializableEmployee(employee) };
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

    await db.employee.update({
      where: { id },
      data: {
        isActive: false,
        terminationDate: new Date(),
      },
    });

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "EMPLOYEE_TERMINATED",
        entityType: "EMPLOYEE",
        entityId: id,
      },
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

    // Calculate USD value
    const { usdValue, conversionRate } = await convertToUSD(
      data.amount,
      data.currency,
    );

    const payment = await db.$transaction(async (tx) => {
      // Create payment record
      const salaryPayment = await tx.salaryPayment.create({
        data: {
          employeeId: data.employeeId,
          amount: data.amount,
          currency: data.currency.toUpperCase(),
          conversionRate,
          usdValue,
          paymentDate: data.paymentDate,
          periodStart: data.periodStart,
          periodEnd: data.periodEnd,
          status: "PAID",
          notes: data.notes,
        },
      });

      // Create expense transaction
      const employee = await tx.employee.findUnique({
        where: { id: data.employeeId },
        select: { brandId: true, name: true },
      });

      if (employee) {
        await tx.transaction.create({
          data: {
            brandId: employee.brandId,
            type: "EXPENSE",
            source: "BANK",
            description: `Salary payment - ${employee.name}`,
            originalAmount: data.amount,
            originalCurrency: data.currency.toUpperCase(),
            conversionRate,
            usdValue,
            transactionDate: data.paymentDate,
            createdById: session.user.id,
          },
        });
      }

      return salaryPayment;
    });

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "SALARY_PAYMENT_CREATED",
        entityType: "SALARY_PAYMENT",
        entityId: payment.id,
        newData: data as unknown as Prisma.JsonObject,
      },
    });

    revalidatePath("/dashboard/employees");

    return { success: true, data: toSerializableSalaryPayment(payment) };
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

    const employee = await db.employee.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        brandId: true,
        name: true,
        salaryAmount: true,
        salaryCurrency: true,
        isActive: true,
      },
    });

    if (!employee) {
      return { success: false, error: "Employee not found" };
    }

    if (!employee.isActive) {
      return { success: false, error: "Cannot mark a terminated employee as paid" };
    }

    const now = new Date();
    const periodStart = startOfMonth(now);
    const periodEnd = endOfMonth(now);
    const amount = Number(employee.salaryAmount);
    const currency = employee.salaryCurrency.toUpperCase();

    const { usdValue, conversionRate } = await convertToUSD(amount, currency);

    const payment = await db.$transaction(async (tx) => {
      const createdPayment = await tx.salaryPayment.create({
        data: {
          employeeId: employee.id,
          amount,
          currency,
          conversionRate,
          usdValue,
          paymentDate: now,
          periodStart,
          periodEnd,
          status: "PAID",
          notes: "Marked paid from employees table",
        },
      });

      await tx.transaction.create({
        data: {
          brandId: employee.brandId,
          type: "EXPENSE",
          source: "BANK",
          description: `Salary payment - ${employee.name}`,
          originalAmount: amount,
          originalCurrency: currency,
          conversionRate,
          usdValue,
          transactionDate: now,
          createdById: session.user.id,
          notes: "Marked paid from employees table",
        },
      });

      return createdPayment;
    });

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "SALARY_PAYMENT_MARKED_PAID",
        entityType: "EMPLOYEE",
        entityId: employee.id,
        newData: {
          amount,
          currency,
          paymentDate: now,
        } as unknown as Prisma.JsonObject,
      },
    });

    revalidatePath("/dashboard/employees");

    return { success: true, data: toSerializableSalaryPayment(payment) };
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

    const bonus = await db.bonus.create({
      data: {
        employeeId,
        amount,
        currency: currency.toUpperCase(),
        reason,
        paymentDate: new Date(),
      },
    });

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "BONUS_ADDED",
        entityType: "BONUS",
        entityId: bonus.id,
        newData: {
          employeeId,
          amount,
          currency,
          reason,
        } as unknown as Prisma.JsonObject,
      },
    });

    revalidatePath("/dashboard/employees");

    return {
      success: true,
      data: {
        ...bonus,
        amount: Number(bonus.amount),
      },
    };
  } catch (error) {
    console.error("Add bonus error:", error);
    return { success: false, error: "Failed to add bonus" };
  }
}
