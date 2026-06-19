import { prisma } from "@/lib/prisma";
import { requireUser, ok, fail } from "@/lib/api";
import { invoiceSchema } from "@/lib/validation";
import { buildInvoiceData } from "@/lib/invoices";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { id } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: { id, companyId: auth.user.companyId },
    include: {
      items: { orderBy: { position: "asc" } },
      createdBy: { select: { name: true, email: true } },
    },
  });
  if (!invoice) return fail("請求書が見つかりません", 404);
  return ok({ invoice });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { id } = await params;

  const existing = await prisma.invoice.findFirst({
    where: { id, companyId: auth.user.companyId },
  });
  if (!existing) return fail("請求書が見つかりません", 404);

  const body = await req.json().catch(() => null);
  const parsed = invoiceSchema.safeParse(body);
  if (!parsed.success) {
    return fail("請求書の内容が正しくありません", 400, parsed.error.flatten().fieldErrors);
  }

  const { items, base } = buildInvoiceData(parsed.data);
  const number = parsed.data.number?.trim() || existing.number;

  if (number !== existing.number) {
    const dupe = await prisma.invoice.findUnique({
      where: { companyId_number: { companyId: auth.user.companyId, number } },
    });
    if (dupe) return fail(`請求書番号 ${number} は既に存在します`, 409);
  }

  const invoice = await prisma.$transaction(async (tx) => {
    await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
    return tx.invoice.update({
      where: { id },
      data: { ...base, number, items: { create: items } },
      include: { items: { orderBy: { position: "asc" } } },
    });
  });

  return ok({ invoice });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { id } = await params;

  const existing = await prisma.invoice.findFirst({
    where: { id, companyId: auth.user.companyId },
  });
  if (!existing) return fail("請求書が見つかりません", 404);

  await prisma.invoice.delete({ where: { id } });
  return ok({ success: true });
}
