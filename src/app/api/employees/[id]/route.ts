import { prisma } from "@/lib/prisma";
import { requireUser, ok, fail } from "@/lib/api";
import { employeeSchema } from "@/lib/validation";
import { hashPassword } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const auth = await requireUser("ADMIN");
  if ("error" in auth) return auth.error;
  const { id } = await params;

  const target = await prisma.user.findFirst({
    where: { id, companyId: auth.user.companyId },
  });
  if (!target) return fail("Employee not found", 404);

  const body = await req.json().catch(() => null);
  const parsed = employeeSchema.partial().safeParse(body);
  if (!parsed.success) return fail("Invalid input", 400, parsed.error.flatten().fieldErrors);
  const data = parsed.data;

  // Don't allow demoting/deactivating the last active admin.
  if (
    target.role === "ADMIN" &&
    ((data.role && data.role !== "ADMIN") || data.active === false)
  ) {
    const adminCount = await prisma.user.count({
      where: { companyId: auth.user.companyId, role: "ADMIN", active: true },
    });
    if (adminCount <= 1) {
      return fail("You cannot remove the last active administrator", 400);
    }
  }

  const update: Record<string, unknown> = {};
  if (data.name !== undefined) update.name = data.name;
  if (data.role !== undefined) update.role = data.role;
  if (data.active !== undefined) update.active = data.active;
  if (data.password) update.passwordHash = await hashPassword(data.password);

  const employee = await prisma.user.update({
    where: { id },
    data: update,
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
  });
  return ok({ employee });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const auth = await requireUser("ADMIN");
  if ("error" in auth) return auth.error;
  const { id } = await params;
  if (id === auth.user.id) return fail("You cannot delete your own account", 400);

  const target = await prisma.user.findFirst({
    where: { id, companyId: auth.user.companyId },
  });
  if (!target) return fail("Employee not found", 404);

  await prisma.user.delete({ where: { id } });
  return ok({ success: true });
}
