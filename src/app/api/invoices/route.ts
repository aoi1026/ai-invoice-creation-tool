import { prisma } from "@/lib/prisma";
import { requireUser, ok, fail } from "@/lib/api";
import { invoiceSchema } from "@/lib/validation";
import { buildInvoiceData, nextInvoiceNumber } from "@/lib/invoices";
import type { Prisma } from "@/generated/prisma";

export async function GET(req: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  const status = url.searchParams.get("status")?.trim();
  const clientId = url.searchParams.get("clientId")?.trim();

  const where: Prisma.InvoiceWhereInput = { companyId: user.companyId };
  if (status && status !== "ALL") {
    where.status = status as Prisma.InvoiceWhereInput["status"];
  }
  if (clientId) where.clientId = clientId;
  if (q) {
    where.OR = [
      { number: { contains: q } },
      { clientName: { contains: q } },
      { clientEmail: { contains: q } },
    ];
  }

  const invoices = await prisma.invoice.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { items: true } } },
    take: 200,
  });

  return ok({ invoices });
}

export async function POST(req: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const body = await req.json().catch(() => null);
  const parsed = invoiceSchema.safeParse(body);
  if (!parsed.success) {
    return fail("請求書の内容が正しくありません", 400, parsed.error.flatten().fieldErrors);
  }

  const { items, base } = buildInvoiceData(parsed.data);
  const number =
    parsed.data.number?.trim() || (await nextInvoiceNumber(user.companyId));

  // Guard against duplicate number within the company.
  const dupe = await prisma.invoice.findUnique({
    where: { companyId_number: { companyId: user.companyId, number } },
  });
  if (dupe) return fail(`請求書番号 ${number} は既に存在します`, 409);

  const invoice = await prisma.invoice.create({
    data: {
      ...base,
      number,
      companyId: user.companyId,
      createdById: user.id,
      items: { create: items },
    },
    include: { items: true },
  });

  return ok({ invoice });
}
