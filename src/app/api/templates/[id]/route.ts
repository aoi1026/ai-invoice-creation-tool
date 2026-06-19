import { prisma } from "@/lib/prisma";
import { requireUser, ok, fail } from "@/lib/api";
import { templateSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const existing = await prisma.invoiceTemplate.findFirst({
    where: { id, companyId: auth.user.companyId },
  });
  if (!existing) return fail("Template not found", 404);
  const body = await req.json().catch(() => null);
  const parsed = templateSchema.safeParse(body);
  if (!parsed.success) return fail("Invalid input", 400, parsed.error.flatten().fieldErrors);
  const { items, ...rest } = parsed.data;
  const template = await prisma.invoiceTemplate.update({
    where: { id },
    data: { ...rest, itemsJson: JSON.stringify(items ?? []) },
  });
  return ok({ template });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const existing = await prisma.invoiceTemplate.findFirst({
    where: { id, companyId: auth.user.companyId },
  });
  if (!existing) return fail("Template not found", 404);
  await prisma.invoiceTemplate.delete({ where: { id } });
  return ok({ success: true });
}
