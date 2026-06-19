import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { performResetSchema } from "@/lib/validation";
import { ok, fail } from "@/lib/api";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = performResetSchema.safeParse(body);
  if (!parsed.success) return fail("Invalid input", 400);
  const { token, password } = parsed.data;

  const record = await prisma.passwordReset.findUnique({ where: { token } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return fail("This reset link is invalid or has expired", 400);
  }

  const passwordHash = await hashPassword(password);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    prisma.passwordReset.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return ok({ success: true });
}
