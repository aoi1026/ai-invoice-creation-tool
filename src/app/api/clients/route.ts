import { prisma } from "@/lib/prisma";
import { requireUser, ok, fail } from "@/lib/api";
import { clientSchema } from "@/lib/validation";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const clients = await prisma.client.findMany({
    where: { companyId: auth.user.companyId },
    orderBy: { name: "asc" },
    include: { _count: { select: { invoices: true } } },
  });
  return ok({ clients });
}

export async function POST(req: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const body = await req.json().catch(() => null);
  const parsed = clientSchema.safeParse(body);
  if (!parsed.success) return fail("入力内容が正しくありません", 400, parsed.error.flatten().fieldErrors);
  const client = await prisma.client.create({
    data: { ...parsed.data, companyId: auth.user.companyId },
  });
  return ok({ client });
}
