"use client";

import { use, useEffect, useState } from "react";
import { api } from "@/lib/client";
import { InvoiceEditor, type InvoiceFormState } from "@/components/InvoiceEditor";
import { PageHeader } from "@/components/AppShell";
import { Spinner } from "@/components/ui";
import { toDateInput } from "@/lib/format";

type ApiInvoice = {
  id: string;
  number: string;
  status: string;
  currency: string;
  issueDate: string;
  dueDate: string | null;
  taxRate: number;
  clientId: string | null;
  clientName: string;
  clientEmail: string | null;
  clientAddress: string | null;
  clientTaxId: string | null;
  notes: string | null;
  paymentTerms: string | null;
  items: { description: string; quantity: number; unitPrice: number }[];
};

export default function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [initial, setInitial] = useState<InvoiceFormState | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ invoice: ApiInvoice }>(`/api/invoices/${id}`)
      .then(({ invoice }) =>
        setInitial({
          id: invoice.id,
          number: invoice.number,
          status: invoice.status,
          currency: invoice.currency,
          issueDate: toDateInput(invoice.issueDate),
          dueDate: toDateInput(invoice.dueDate),
          taxRate: invoice.taxRate,
          clientId: invoice.clientId ?? "",
          clientName: invoice.clientName,
          clientEmail: invoice.clientEmail ?? "",
          clientAddress: invoice.clientAddress ?? "",
          clientTaxId: invoice.clientTaxId ?? "",
          notes: invoice.notes ?? "",
          paymentTerms: invoice.paymentTerms ?? "",
          items: invoice.items.map((it) => ({
            description: it.description,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
          })),
        }),
      )
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!initial)
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    );

  return (
    <div className="animate-fade-in">
      <PageHeader title={`Edit ${initial.number}`} description="Update invoice details." />
      <InvoiceEditor initial={initial} />
    </div>
  );
}
