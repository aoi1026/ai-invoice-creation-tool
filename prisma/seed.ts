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
    console.log("シードデータは既に存在します（demo@invoice.app）。スキップします。");
    return;
  }

  const company = await prisma.company.create({
    data: {
      name: "株式会社アオイウェブスタジオ",
      email: "billing@aoi-webstudio.example",
      phone: "03-1234-5678",
      address: "〒150-0002 東京都渋谷区渋谷1-2-3 アオイビル5F",
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
        name: "管理者 太郎",
        passwordHash,
        role: "ADMIN",
        companyId: company.id,
      },
      {
        email: "manager@invoice.app",
        name: "鈴木 花子",
        passwordHash,
        role: "MANAGER",
        companyId: company.id,
      },
      {
        email: "member@invoice.app",
        name: "佐藤 健",
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
      name: "株式会社アクメ",
      email: "keiri@acme.example",
      address: "〒100-0005 東京都千代田区丸の内5-6-7",
      taxId: "T9876543210987",
    },
  });
  const globex = await prisma.client.create({
    data: {
      companyId: company.id,
      name: "グローベックス商事株式会社",
      email: "finance@globex.example",
      address: "〒530-0001 大阪府大阪市北区梅田8-8-8",
    },
  });

  await prisma.invoiceTemplate.create({
    data: {
      companyId: company.id,
      name: "月額顧問契約",
      description: "標準の月額デザイン顧問契約",
      currency: "JPY",
      taxRate: 10,
      paymentTerms: "月末締め翌月末払い",
      notes: "いつもお取引いただきありがとうございます。",
      itemsJson: JSON.stringify([
        { description: "デザイン顧問料（月額）", quantity: 1, unitPrice: 300000 },
        { description: "追加修正対応（時間）", quantity: 5, unitPrice: 12000 },
      ]),
    },
  });

  type Item = { description: string; quantity: number; unitPrice: number };
  const make = (
    number: string,
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
        number,
        status,
        currency: "JPY",
        taxRate: 10,
        issueDate: issue,
        dueDate: due,
        subtotal,
        taxAmount,
        total: round2(subtotal + taxAmount),
        paymentTerms: "月末締め翌月末払い",
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

  // Recent invoices in various statuses
  await make("INV-2026-001", acme, "PAID", [
    { description: "ブランドアイデンティティ一式", quantity: 1, unitPrice: 850000 },
    { description: "ロゴバリエーション", quantity: 3, unitPrice: 40000 },
  ], 40);
  await make("INV-2026-002", globex, "SENT", [
    { description: "Webサイトリニューアル", quantity: 1, unitPrice: 1200000 },
    { description: "CMS構築（人日）", quantity: 8, unitPrice: 90000 },
  ], 12);
  await make("INV-2026-003", acme, "OVERDUE", [
    { description: "月額顧問料（3月分）", quantity: 1, unitPrice: 300000 },
  ], 55);

  // Paid invoices spread across the last 6 months for the revenue chart
  const monthly: { amount: number; client: typeof acme; n: number }[] = [
    { amount: 420000, client: acme, n: 100 },
    { amount: 780000, client: globex, n: 101 },
    { amount: 540000, client: acme, n: 102 },
    { amount: 910000, client: globex, n: 103 },
    { amount: 660000, client: acme, n: 104 },
    { amount: 1250000, client: globex, n: 105 },
  ];
  const now = new Date();
  let idx = 0;
  for (const m of monthly) {
    const monthsAgo = 5 - idx;
    const issue = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 12);
    const due = new Date(issue.getTime() + 30 * 86400000);
    const tax = round2(m.amount * 0.1);
    await prisma.invoice.create({
      data: {
        companyId: company.id,
        createdById: admin.id,
        clientId: m.client.id,
        number: `INV-2026-1${m.n.toString().slice(-2)}`,
        status: "PAID",
        currency: "JPY",
        taxRate: 10,
        issueDate: issue,
        dueDate: due,
        subtotal: m.amount,
        taxAmount: tax,
        total: round2(m.amount + tax),
        paymentTerms: "月末締め翌月末払い",
        clientName: m.client.name,
        clientEmail: m.client.email,
        clientAddress: m.client.address,
        clientTaxId: m.client.taxId,
        items: {
          create: [
            { description: "業務委託料", quantity: 1, unitPrice: m.amount, amount: m.amount, position: 0 },
          ],
        },
      },
    });
    idx++;
  }

  console.log("✅ シードデータを作成しました。");
  console.log("   ログイン: demo@invoice.app / password123（管理者）");
  console.log("   他: manager@invoice.app, member@invoice.app / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
