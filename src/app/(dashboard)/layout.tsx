import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { DashboardLayoutClient } from "@/components/layout/dashboard-layout-client";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.user.status !== "ACTIVE") {
    redirect("/login");
  }

  return (
    <DashboardLayoutClient user={session.user}>
      {children}
    </DashboardLayoutClient>
  );
}
