import { prisma } from "@/lib/prisma";
import { requireUser, ok, fail } from "@/lib/api";
import { clientSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const existing = await prisma.client.findFirst({
    where: { id, companyId: auth.user.companyId },
  });
  if (!existing) return fail("Client not found", 404);
  const body = await req.json().catch(() => null);
  const parsed = clientSchema.safeParse(body);
  if (!parsed.success) return fail("Invalid input", 400, parsed.error.flatten().fieldErrors);
  const client = await prisma.client.update({ where: { id }, data: parsed.data });
  return ok({ client });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const existing = await prisma.client.findFirst({
    where: { id, companyId: auth.user.companyId },
  });
  if (!existing) return fail("Client not found", 404);
  await prisma.client.delete({ where: { id } });
  return ok({ success: true });
}
