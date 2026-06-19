import "server-only";
import { prisma } from "@/lib/prisma";
import { computeTotals, round2 } from "@/lib/format";
import type { InvoiceInput } from "@/lib/validation";

/** Reserve and return the next invoice number for a company (atomic increment). */
export async function nextInvoiceNumber(companyId: string): Promise<string> {
  const company = await prisma.company.update({
    where: { id: companyId },
    data: { nextNumber: { increment: 1 } },
    select: { invoicePrefix: true, nextNumber: true },
  });
  // nextNumber is now the *incremented* value; the reserved one is one less.
  const reserved = company.nextNumber - 1;
  return `${company.invoicePrefix}${String(reserved).padStart(3, "0")}`;
}

export function buildInvoiceData(input: InvoiceInput) {
  const items = input.items.map((it, idx) => ({
    description: it.description,
    quantity: round2(it.quantity),
    unitPrice: round2(it.unitPrice),
    amount: round2(it.quantity * it.unitPrice),
    position: idx,
  }));
  const totals = computeTotals(input.items, input.taxRate);
  return {
    items,
    totals,
    base: {
      currency: input.currency,
      taxRate: input.taxRate,
      status: input.status ?? "DRAFT",
      issueDate: input.issueDate ? new Date(input.issueDate) : new Date(),
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      notes: input.notes ?? null,
      paymentTerms: input.paymentTerms ?? null,
      clientId: input.clientId || null,
      clientName: input.clientName,
      clientEmail: input.clientEmail ?? null,
      clientAddress: input.clientAddress ?? null,
      clientTaxId: input.clientTaxId ?? null,
      subtotal: totals.subtotal,
      taxAmount: totals.taxAmount,
      total: totals.total,
    },
  };
}
