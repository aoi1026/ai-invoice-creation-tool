import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

async function main() {
  const email = "demo@invoice.app";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Seed already present (demo@invoice.app). Skipping.");
    return;
  }

  const company = await prisma.company.create({
    data: {
      name: "Aurora Studio Inc.",
      email: "billing@aurora.example",
      phone: "+81 3-1234-5678",
      address: "1-2-3 Shibuya, Shibuya-ku, Tokyo 150-0002, Japan",
      taxId: "T1234567890123",
      invoicePrefix: "INV-2026-",
      nextNumber: 4,
    },
  });

  const passwordHash = await bcrypt.hash("password123", 10);

  await prisma.user.createMany({
    data: [
      {
        email,
        name: "Demo Admin",
        passwordHash,
        role: "ADMIN",
        companyId: company.id,
      },
      {
        email: "manager@invoice.app",
        name: "Mei Manager",
        passwordHash,
        role: "MANAGER",
        companyId: company.id,
      },
      {
        email: "member@invoice.app",
        name: "Kai Member",
        passwordHash,
        role: "MEMBER",
        companyId: company.id,
      },
    ],
  });

  const admin = await prisma.user.findUniqueOrThrow({ where: { email } });

  const acme = await prisma.client.create({
    data: {
      companyId: company.id,
      name: "Acme Robotics K.K.",
      email: "ap@acme.example",
      address: "5-6-7 Marunouchi, Chiyoda-ku, Tokyo",
      taxId: "T9876543210987",
    },
  });
  const globex = await prisma.client.create({
    data: {
      companyId: company.id,
      name: "Globex Trading Ltd.",
      email: "finance@globex.example",
      address: "88 Orchard Road, Singapore",
    },
  });

  await prisma.invoiceTemplate.create({
    data: {
      companyId: company.id,
      name: "Monthly Retainer",
      description: "Standard monthly design retainer",
      currency: "JPY",
      taxRate: 10,
      paymentTerms: "Net 30",
      notes: "Thank you for your continued partnership.",
      itemsJson: JSON.stringify([
        { description: "Design retainer — monthly", quantity: 1, unitPrice: 300000 },
        { description: "Additional revisions (hours)", quantity: 5, unitPrice: 12000 },
      ]),
    },
  });

  type Item = { description: string; quantity: number; unitPrice: number };
  const make = (
    n: number,
    client: { id: string; name: string; email: string | null; address: string | null; taxId: string | null },
    status: "DRAFT" | "SENT" | "PAID" | "OVERDUE",
    items: Item[],
    daysAgo: number,
  ) => {
    const subtotal = round2(items.reduce((s, i) => s + i.quantity * i.unitPrice, 0));
    const taxAmount = round2(subtotal * 0.1);
    const issue = new Date(Date.now() - daysAgo * 86400000);
    const due = new Date(issue.getTime() + 30 * 86400000);
    return prisma.invoice.create({
      data: {
        companyId: company.id,
        createdById: admin.id,
        clientId: client.id,
        number: `INV-2026-00${n}`,
        status,
        currency: "JPY",
        taxRate: 10,
        issueDate: issue,
        dueDate: due,
        subtotal,
        taxAmount,
        total: round2(subtotal + taxAmount),
        paymentTerms: "Net 30",
        clientName: client.name,
        clientEmail: client.email,
        clientAddress: client.address,
        clientTaxId: client.taxId,
        items: {
          create: items.map((it, idx) => ({
            description: it.description,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            amount: round2(it.quantity * it.unitPrice),
            position: idx,
          })),
        },
      },
    });
  };

  await make(1, acme, "PAID", [
    { description: "Brand identity package", quantity: 1, unitPrice: 850000 },
    { description: "Logo variations", quantity: 3, unitPrice: 40000 },
  ], 40);
  await make(2, globex, "SENT", [
    { description: "Website redesign", quantity: 1, unitPrice: 1200000 },
    { description: "CMS integration (days)", quantity: 8, unitPrice: 90000 },
  ], 12);
  await make(3, acme, "OVERDUE", [
    { description: "Monthly retainer — March", quantity: 1, unitPrice: 300000 },
  ], 55);

  console.log("✅ Seed complete.");
  console.log("   Login: demo@invoice.app / password123 (ADMIN)");
  console.log("   Also: manager@invoice.app, member@invoice.app / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
