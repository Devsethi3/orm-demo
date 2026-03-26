import { NextResponse } from "next/server";
import { getProjects } from "@/server/queries/finance";
import { getServerSession } from "@/server/auth";

export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const brandId = searchParams.get("brandId") || undefined;
  const data = await getProjects(brandId);
  return NextResponse.json({ data });
}
