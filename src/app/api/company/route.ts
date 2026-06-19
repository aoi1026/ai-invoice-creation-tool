import { prisma } from "@/lib/prisma";
import { requireUser, ok, fail } from "@/lib/api";
import { companySchema } from "@/lib/validation";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const company = await prisma.company.findUnique({
    where: { id: auth.user.companyId },
  });
  return ok({ company });
}

export async function PATCH(req: Request) {
  const auth = await requireUser("ADMIN");
  if ("error" in auth) return auth.error;
  const body = await req.json().catch(() => null);
  const parsed = companySchema.safeParse(body);
  if (!parsed.success) return fail("入力内容が正しくありません", 400, parsed.error.flatten().fieldErrors);
  const company = await prisma.company.update({
    where: { id: auth.user.companyId },
    data: parsed.data,
  });
  return ok({ company });
}
