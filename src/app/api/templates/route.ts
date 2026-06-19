import { prisma } from "@/lib/prisma";
import { requireUser, ok, fail } from "@/lib/api";
import { templateSchema } from "@/lib/validation";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const templates = await prisma.invoiceTemplate.findMany({
    where: { companyId: auth.user.companyId },
    orderBy: { updatedAt: "desc" },
  });
  return ok({ templates });
}

export async function POST(req: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const body = await req.json().catch(() => null);
  const parsed = templateSchema.safeParse(body);
  if (!parsed.success) return fail("Invalid input", 400, parsed.error.flatten().fieldErrors);
  const { items, ...rest } = parsed.data;
  const template = await prisma.invoiceTemplate.create({
    data: {
      ...rest,
      companyId: auth.user.companyId,
      itemsJson: JSON.stringify(items ?? []),
    },
  });
  return ok({ template });
}
