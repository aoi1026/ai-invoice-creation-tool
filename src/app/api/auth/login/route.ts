import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
import { ok, fail } from "@/lib/api";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return fail("Invalid input", 400);
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active) {
    return fail("Invalid email or password", 401);
  }
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return fail("Invalid email or password", 401);

  await createSession({
    userId: user.id,
    companyId: user.companyId,
    role: user.role,
    email: user.email,
    name: user.name,
  });

  return ok({ id: user.id, email: user.email, name: user.name, role: user.role });
}
