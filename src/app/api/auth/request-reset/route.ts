import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { requestResetSchema } from "@/lib/validation";
import { ok, fail } from "@/lib/api";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = requestResetSchema.safeParse(body);
  if (!parsed.success) return fail("メールアドレスが正しくありません", 400);

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });

  // Always respond success to avoid leaking which emails exist.
  if (!user) {
    return ok({ success: true });
  }

  const token = randomBytes(32).toString("hex");
  await prisma.passwordReset.create({
    data: {
      token,
      userId: user.id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour
    },
  });

  const resetUrl = `/reset-password?token=${token}`;
  // No email provider is wired up in this build. In development we surface the
  // link directly so the flow is testable; in production, send it via email.
  if (process.env.NODE_ENV !== "production") {
    console.log(`\n🔑 Password reset link for ${user.email}: ${resetUrl}\n`);
    return ok({ success: true, devResetUrl: resetUrl });
  }
  return ok({ success: true });
}
