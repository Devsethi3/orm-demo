import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession, hasPermission } from "@/lib/auth";
import { transactionSchema, type TransactionInput } from "@/lib/validations";
import { eq, and, gte, lte, or, inArray, desc } from "drizzle-orm";
import { transactions, auditLogs, partners } from "@/db/schema";
import { convertToUSD } from "@/lib/currency.server";
import type { ActionResponse, PaginatedResponse, TransactionWithRelations } from "@/types";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({
        data: [],
        total: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0,
      }, { status: 403 });
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const pageSize = parseInt(url.searchParams.get("pageSize") || "10");
    const brandId = url.searchParams.get("brandId");
    const type = url.searchParams.get("type");
    const source = url.searchParams.get("source");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    const where: any[] = [];

    if (brandId) where.push(eq(transactions.brandId, brandId));
    if (type) where.push(eq(transactions.type, type as any));
    if (source) where.push(eq(transactions.source, source as any));
    if (startDate) where.push(gte(transactions.transactionDate, new Date(startDate)));
    if (endDate) where.push(lte(transactions.transactionDate, new Date(endDate)));

    // Restrict by role
    if (session.user.role === "PARTNER") {
      const partnerList = await db
        .select()
        .from(partners)
        .where(eq(partners.userId, session.user.id))
        .limit(1);

      const partner = partnerList[0];
      if (partner) {
        where.push(eq(transactions.brandId, partner.brandId));
      } else {
        return NextResponse.json({
          data: [],
          total: 0,
          page,
          pageSize,
          totalPages: 0,
        });
      }
    }

    const whereClause = where.length > 0 ? and(...where) : undefined;

    const txList = await db
      .select()
      .from(transactions)
      .where(whereClause)
      .orderBy((tx) => desc(tx.transactionDate))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    const totalResult = await db
      .select({ id: transactions.id })
      .from(transactions)
      .where(whereClause);

    return NextResponse.json({
      data: txList.map((tx) => ({
        ...tx,
        originalAmount: Number(tx.originalAmount),
        conversionRate: Number(tx.conversionRate),
        usdValue: Number(tx.usdValue),
      })),
      total: totalResult.length,
      page,
      pageSize,
      totalPages: Math.ceil(totalResult.length / pageSize),
    });
  } catch (error) {
    console.error("Get transactions error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch transactions",
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ActionResponse>> {
  try {
    const session = await getSession();

    if (!session || !hasPermission(session.user.role, "transactions:write")) {
      return NextResponse.json({
        success: false,
        error: "Unauthorized",
      }, { status: 403 });
    }

    const body = await request.json() as TransactionInput;
    const validated = transactionSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({
        success: false,
        errors: validated.error.flatten().fieldErrors as Record<
          string,
          string[]
        >,
      }, { status: 400 });
    }

    const data = validated.data;

    // Get conversion rate if not provided
    let conversionRate = data.conversionRate ?? 1;
    let usdValue = data.originalAmount;

    if (data.originalCurrency !== "USD") {
      const conversion = await convertToUSD(
        data.originalAmount,
        data.originalCurrency,
      );
      conversionRate = data.conversionRate ?? conversion.conversionRate;
      usdValue = Number((data.originalAmount * conversionRate).toFixed(2));
    } else {
      conversionRate = 1;
    }

    const result = await db.insert(transactions).values({
      id: crypto.randomUUID(),
      brandId: data.brandId,
      projectId: data.projectId || null,
      type: data.type,
      source: data.source,
      description: data.description || null,
      originalAmount: String(data.originalAmount),
      originalCurrency: data.originalCurrency,
      conversionRate: String(conversionRate),
      usdValue: String(usdValue),
      transactionDate: data.transactionDate,
      reference: data.reference || null,
      notes: data.notes || null,
      createdById: session.user.id,
    }).returning();

    const transaction = result[0];

    await db.insert(auditLogs).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      action: "TRANSACTION_CREATED",
      entityType: "TRANSACTION",
      entityId: transaction.id,
      newData: JSON.stringify(data),
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "",
      userAgent: request.headers.get("user-agent") || "",
    });

    return NextResponse.json({
      success: true,
      data: {
        ...transaction,
        originalAmount: Number(transaction.originalAmount),
        conversionRate: Number(transaction.conversionRate),
        usdValue: Number(transaction.usdValue),
      },
    });
  } catch (error) {
    console.error("Create transaction error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to create transaction",
    }, { status: 500 });
  }
}
