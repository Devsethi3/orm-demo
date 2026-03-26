import { config } from "dotenv";

config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { currencies, brands, bankAccounts } from "./schema";
import { nanoid } from "nanoid";

async function seed() {
  // Verify DATABASE_URL is loaded
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL not found in .env.local");
    console.error("   Make sure .env.local exists in the project root");
    console.error("   with DATABASE_URL=postgresql://...");
    process.exit(1);
  }

  console.log("✅ DATABASE_URL found");
  console.log("🌱 Starting database seed...\n");

  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql, { schema });

  // ============================================
  // 1. Seed Default Currencies
  // ============================================
  console.log("💱 Seeding currencies...");

  const currencyData = [
    { id: `cur_${nanoid(21)}`, code: "USD", name: "US Dollar", symbol: "$" },
    { id: `cur_${nanoid(21)}`, code: "INR", name: "Indian Rupee", symbol: "₹" },
    { id: `cur_${nanoid(21)}`, code: "EUR", name: "Euro", symbol: "€" },
    { id: `cur_${nanoid(21)}`, code: "AED", name: "UAE Dirham", symbol: "د.إ" },
  ];

  for (const c of currencyData) {
    try {
      await db.insert(currencies).values(c).onConflictDoNothing();
      console.log(`  ✅ ${c.code} - ${c.name}`);
    } catch (e: any) {
      console.log(`  ⏭️  ${c.code} - ${e.message || "already exists"}`);
    }
  }

  // ============================================
  // 2. Seed a Demo Brand
  // ============================================
  console.log("\n🏢 Seeding brand...");

  const brandId = `brand_${nanoid(21)}`;
  try {
    await db.insert(brands).values({
      id: brandId,
      name: "OceanLab",
      slug: "oceanlab",
      description: "Primary brand",
      color: "#6366f1",
    });
    console.log("  ✅ OceanLab brand created");
  } catch (e: any) {
    console.log(`  ⏭️  Brand - ${e.message || "already exists"}`);
  }

  // ============================================
  // 3. Seed a Bank Account
  // ============================================
  console.log("\n🏦 Seeding bank account...");

  try {
    await db.insert(bankAccounts).values({
      id: `acc_${nanoid(21)}`,
      brandId: brandId,
      name: "Primary USD Account",
      bankName: "Chase Bank",
      currency: "USD",
      initialBalance: "10000.00",
      currentBalance: "10000.00",
    });
    console.log("  ✅ Primary USD Account created");
  } catch (e: any) {
    console.log(`  ⏭️  Account - ${e.message || "already exists"}`);
  }

  console.log("\n" + "=".repeat(50));
  console.log("🎉 Seed complete!");
  console.log("=".repeat(50));
  console.log("\n📋 Next steps:");
  console.log("  1. Start dev server: pnpm dev");
  console.log("  2. Create admin user: POST http://localhost:3000/api/setup");
  console.log("  3. Delete /api/setup route after creating admin");
  console.log("  4. Login at http://localhost:3000/login");
}

seed().catch((e) => {
  console.error("❌ Seed failed:", e);
  process.exit(1);
});
