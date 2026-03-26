import { getBrands } from "@/actions/brands";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { BrandsGrid } from "./brands-grid";

export default async function BrandsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const brands = await getBrands();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Brands"
        description="Manage your brands and organizations"
      />
      <BrandsGrid brands={brands} userRole={session.user.role} />
    </div>
  );
}
