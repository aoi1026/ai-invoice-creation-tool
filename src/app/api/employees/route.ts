import { prisma } from "@/lib/prisma";
import { requireUser, ok, fail } from "@/lib/api";
import { employeeSchema } from "@/lib/validation";
import { hashPassword } from "@/lib/auth";

export async function GET() {
  const auth = await requireUser("MANAGER");
  if ("error" in auth) return auth.error;
  const employees = await prisma.user.findMany({
    where: { companyId: auth.user.companyId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
      _count: { select: { invoices: true } },
    },
  });
  return ok({ employees });
}

export async function POST(req: Request) {
  const auth = await requireUser("ADMIN");
  if ("error" in auth) return auth.error;
  const body = await req.json().catch(() => null);
  const parsed = employeeSchema.safeParse(body);
  if (!parsed.success) return fail("入力内容が正しくありません", 400, parsed.error.flatten().fieldErrors);
  const { name, email, role, password } = parsed.data;
  if (!password) return fail("新しい従業員にはパスワードが必要です", 400);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return fail("そのメールアドレスは既に使用されています", 409);

  const passwordHash = await hashPassword(password);
  const employee = await prisma.user.create({
    data: { name, email, role, passwordHash, companyId: auth.user.companyId },
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
  });
  return ok({ employee });
}
