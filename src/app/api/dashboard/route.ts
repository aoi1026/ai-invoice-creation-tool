import { prisma } from "@/lib/prisma";
import { requireUser, ok } from "@/lib/api";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const companyId = auth.user.companyId;

  // Mark anything past due that is still SENT as OVERDUE for accurate stats.
  await prisma.invoice.updateMany({
    where: { companyId, status: "SENT", dueDate: { lt: new Date() } },
    data: { status: "OVERDUE" },
  });

  const [invoices, clientCount, employeeCount] = await Promise.all([
    prisma.invoice.findMany({
      where: { companyId },
      select: {
        status: true,
        total: true,
        currency: true,
        createdAt: true,
        issueDate: true,
      },
    }),
    prisma.client.count({ where: { companyId } }),
    prisma.user.count({ where: { companyId, active: true } }),
  ]);

  const byStatus: Record<string, { count: number; total: number }> = {};
  let outstanding = 0;
  let paid = 0;
  for (const inv of invoices) {
    const b = (byStatus[inv.status] ??= { count: 0, total: 0 });
    b.count += 1;
    b.total += inv.total;
    if (inv.status === "PAID") paid += inv.total;
    if (inv.status === "SENT" || inv.status === "OVERDUE") outstanding += inv.total;
  }

  // Last 6 months revenue (paid) trend.
  const months: { label: string; total: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const total = invoices
      .filter(
        (inv) =>
          inv.status === "PAID" &&
          inv.issueDate >= d &&
          inv.issueDate < next,
      )
      .reduce((s, inv) => s + inv.total, 0);
    months.push({
      label: d.toLocaleString(undefined, { month: "short" }),
      total,
    });
  }

  const recent = await prisma.invoice.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      number: true,
      clientName: true,
      total: true,
      currency: true,
      status: true,
      issueDate: true,
    },
  });

  return ok({
    stats: {
      invoiceCount: invoices.length,
      clientCount,
      employeeCount,
      outstanding,
      paid,
      currency: invoices[0]?.currency ?? "JPY",
      byStatus,
      months,
    },
    recent,
  });
}
