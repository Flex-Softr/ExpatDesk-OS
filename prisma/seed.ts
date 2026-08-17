import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  const adminEmail = process.env.ADMIN_EMAIL || "admin@expatdesk.com";
  const adminName = process.env.ADMIN_NAME || "System Admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "Pass#123";

  // Hash password using Argon2id algorithm
  const passwordHash = await argon2.hash(adminPassword, {
    type: argon2.argon2id,
  });

  // Upsert seed admin user
  const adminUser = await prisma.adminUser.upsert({
    where: { email: adminEmail.toLowerCase().trim() },
    update: {
      name: adminName,
      passwordHash,
      role: Role.ADMIN,
      isActive: true,
    },
    create: {
      email: adminEmail.toLowerCase().trim(),
      name: adminName,
      passwordHash,
      role: Role.ADMIN,
      isActive: true,
    },
  });

  console.log("✅ Seed Admin User configured:");
  console.log(`   - Email: ${adminUser.email}`);
  console.log(`   - Name:  ${adminUser.name}`);
  console.log(`   - Role:  ${adminUser.role}`);

  // Seed default categories
  const categoriesData = [
    {
      slug: "visa-permits",
      nameEn: "Visas & Work Permits",
      nameIt: "Visti e Permessi di Soggiorno",
    },
    {
      slug: "tax-finance",
      nameEn: "Tax & Financial Services",
      nameIt: "Fisco e Servizi Finanziari",
    },
    {
      slug: "housing-relocation",
      nameEn: "Housing & Relocation",
      nameIt: "Alloggio e Rilocalizzazione",
    },
  ];

  for (const cat of categoriesData) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { nameEn: cat.nameEn, nameIt: cat.nameIt },
      create: cat,
    });
  }
  console.log(`✅ ${categoriesData.length} default categories seeded.`);

  // Seed default dock links
  const dockLinksData = [
    {
      title: "Italian Ministry of Foreign Affairs (Visas)",
      url: "https://vistoperitalia.esteri.it/",
      description: "Official guide to Italian visa requirements.",
      category: "Government",
      order: 1,
    },
    {
      title: "Agenzia delle Entrate",
      url: "https://www.agenziaentrate.gov.it/",
      description: "Italian Revenue Agency for Tax Code (Codice Fiscale).",
      category: "Tax",
      order: 2,
    },
  ];

  for (const link of dockLinksData) {
    const existing = await prisma.dockLink.findFirst({
      where: { url: link.url },
    });
    if (!existing) {
      await prisma.dockLink.create({ data: link });
    }
  }
  console.log(`✅ Default dock links verified.`);

  console.log("🚀 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed with error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
