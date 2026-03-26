import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  console.log("🌱 Starting seed...");

  const currencies = [
    { code: "USD", name: "US Dollar", symbol: "$" },
    { code: "INR", name: "Indian Rupee", symbol: "₹" },
    { code: "EUR", name: "Euro", symbol: "€" },
    { code: "AED", name: "UAE Dirham", symbol: "د.إ" },
    { code: "GBP", name: "British Pound", symbol: "£" },
  ];

  for (const currency of currencies) {
    await prisma.currency.upsert({
      where: { code: currency.code },
      update: {},
      create: currency,
    });
  }
  console.log("✅ Currencies created");

  const adminPassword = await bcrypt.hash("Admin@123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@financecrm.com" },
    update: {},
    create: {
      name: "System Admin",
      email: "admin@financecrm.com",
      passwordHash: adminPassword,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });
  console.log("✅ Admin user created:", admin.email);

  const brand = await prisma.brand.upsert({
    where: { slug: "acme-corp" },
    update: {},
    create: {
      name: "Acme Corp",
      slug: "acme-corp",
      description: "Sample company for demonstration",
      ownerId: admin.id,
    },
  });
  console.log("✅ Sample brand created:", brand.name);

  await prisma.brandMember.upsert({
    where: {
      brandId_userId: {
        brandId: brand.id,
        userId: admin.id,
      },
    },
    update: {},
    create: {
      brandId: brand.id,
      userId: admin.id,
      role: "ADMIN",
    },
  });

  const subscription = await prisma.subscription.findFirst({
    where: { name: "GitHub Teams" },
  });

  if (!subscription) {
    await prisma.subscription.create({
      data: {
        name: "GitHub Teams",
        provider: "GitHub",
        cost: 4,
        currency: "USD",
        billingCycle: "MONTHLY",
        nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        category: "Software",
        autoRenew: true,
        reminderDays: 7,
      },
    });
    console.log("✅ Sample subscription created");
  }

  console.log("🎉 Seed completed successfully!");
  console.log("\n📋 Login credentials:");
  console.log("   Email: admin@financecrm.com");
  console.log("   Password: Admin@123");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
