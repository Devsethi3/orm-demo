import { NextResponse } from "next/server";
import { getBrands } from "@/server/queries/finance";
import { getServerSession } from "@/server/auth";

export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await getBrands();
  return NextResponse.json({ data });
}