import { prisma } from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth";
import { registerSchema } from "@/lib/validation";
import { ok, fail } from "@/lib/api";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return fail("入力内容が正しくありません", 400, parsed.error.flatten().fieldErrors);
  }
  const { companyName, name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return fail("そのメールアドレスは既に登録されています", 409);

  const passwordHash = await hashPassword(password);
  const company = await prisma.company.create({
    data: {
      name: companyName,
      users: {
        create: { name, email, passwordHash, role: "ADMIN" },
      },
    },
    include: { users: true },
  });
  const user = company.users[0];

  await createSession({
    userId: user.id,
    companyId: company.id,
    role: user.role,
    email: user.email,
    name: user.name,
  });

  return ok({ id: user.id, email: user.email, name: user.name });
}
