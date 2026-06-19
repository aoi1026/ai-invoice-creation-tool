"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import { Badge, Button, Card, Select, Spinner, useToast } from "@/components/ui";
import { PageHeader } from "@/components/AppShell";
import { formatMoney, formatDate, STATUS_LABELS, STATUS_STYLES } from "@/lib/format";
import { downloadInvoicePdf, type PdfCompany } from "@/lib/pdf";

type Invoice = {
  id: string;
  number: string;
  status: string;
  currency: string;
  issueDate: string;
  dueDate: string | null;
  taxRate: number;
  subtotal: number;
  taxAmount: number;
  total: number;
  notes: string | null;
  paymentTerms: string | null;
  clientName: string;
  clientEmail: string | null;
  clientAddress: string | null;
  clientTaxId: string | null;
  createdBy: { name: string } | null;
  items: { id: string; description: string; quantity: number; unitPrice: number; amount: number }[];
};

export default function InvoiceViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const toast = useToast();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [company, setCompany] = useState<PdfCompany | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<{ invoice: Invoice }>(`/api/invoices/${id}`)
      .then((r) => setInvoice(r.invoice))
      .catch((e) => setError(e.message));
    api<{ company: PdfCompany }>("/api/company")
      .then((r) => setCompany(r.company))
      .catch(() => {});
  }, [id]);

  async function changeStatus(status: string) {
    if (!invoice) return;
    setBusy(true);
    try {
      await api(`/api/invoices/${id}`, {
        method: "PATCH",
        json: buildPayload(invoice, status),
      });
      setInvoice({ ...invoice, status });
      toast.push("Status updated", "success");
    } catch (e) {
      toast.push(e instanceof Error ? e.message : "Update failed", "error");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm("Delete this invoice? This cannot be undone.")) return;
    setBusy(true);
    try {
      await api(`/api/invoices/${id}`, { method: "DELETE" });
      toast.push("Invoice deleted", "success");
      router.push("/invoices");
      router.refresh();
    } catch (e) {
      toast.push(e instanceof Error ? e.message : "Delete failed", "error");
      setBusy(false);
    }
  }

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!invoice)
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={invoice.number}
        description={`Created by ${invoice.createdBy?.name ?? "—"}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={invoice.status}
              onChange={(e) => changeStatus(e.target.value)}
              disabled={busy}
              className="w-36"
            >
              {["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"].map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </Select>
            <Button
              variant="secondary"
              onClick={() => company && downloadInvoicePdf(invoice, company)}
            >
              ⬇ PDF
            </Button>
            <Link href={`/invoices/${id}/edit`}>
              <Button variant="secondary">Edit</Button>
            </Link>
            <Button variant="danger" onClick={remove} disabled={busy}>
              Delete
            </Button>
          </div>
        }
      />

      {/* Printable document */}
      <Card className="mx-auto max-w-3xl p-8 sm:p-10">
        <div className="flex flex-col justify-between gap-6 sm:flex-row">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">INVOICE</h2>
            <p className="mt-1 font-mono text-sm text-slate-500">{invoice.number}</p>
            <div className="mt-3">
              <Badge className={STATUS_STYLES[invoice.status]}>{STATUS_LABELS[invoice.status]}</Badge>
            </div>
          </div>
          {company && (
            <div className="sm:text-right">
              <p className="text-base font-bold text-slate-900">{company.name}</p>
              {company.address && <p className="mt-1 whitespace-pre-line text-xs text-slate-500">{company.address}</p>}
              {company.email && <p className="text-xs text-slate-500">{company.email}</p>}
              {company.phone && <p className="text-xs text-slate-500">{company.phone}</p>}
              {company.taxId && <p className="text-xs text-slate-500">Tax ID: {company.taxId}</p>}
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-col justify-between gap-6 sm:flex-row">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Bill to</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{invoice.clientName}</p>
            {invoice.clientAddress && <p className="whitespace-pre-line text-xs text-slate-500">{invoice.clientAddress}</p>}
            {invoice.clientEmail && <p className="text-xs text-slate-500">{invoice.clientEmail}</p>}
            {invoice.clientTaxId && <p className="text-xs text-slate-500">Tax ID: {invoice.clientTaxId}</p>}
          </div>
          <div className="space-y-1 text-sm sm:text-right">
            <div><span className="text-slate-400">Issued: </span><span className="text-slate-700">{formatDate(invoice.issueDate)}</span></div>
            <div><span className="text-slate-400">Due: </span><span className="text-slate-700">{formatDate(invoice.dueDate)}</span></div>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-lg ring-1 ring-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Description</th>
                <th className="px-4 py-2 text-right font-medium">Qty</th>
                <th className="px-4 py-2 text-right font-medium">Unit price</th>
                <th className="px-4 py-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.items.map((it) => (
                <tr key={it.id}>
                  <td className="px-4 py-2.5 text-slate-700">{it.description}</td>
                  <td className="px-4 py-2.5 text-right text-slate-600">{it.quantity}</td>
                  <td className="px-4 py-2.5 text-right text-slate-600">{formatMoney(it.unitPrice, invoice.currency)}</td>
                  <td className="px-4 py-2.5 text-right font-medium text-slate-900">{formatMoney(it.amount, invoice.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-end">
          <dl className="w-full max-w-xs space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Subtotal</dt>
              <dd className="font-medium text-slate-900">{formatMoney(invoice.subtotal, invoice.currency)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Tax ({invoice.taxRate}%)</dt>
              <dd className="font-medium text-slate-900">{formatMoney(invoice.taxAmount, invoice.currency)}</dd>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base">
              <dt className="font-semibold text-slate-900">Total</dt>
              <dd className="font-bold text-indigo-600">{formatMoney(invoice.total, invoice.currency)}</dd>
            </div>
          </dl>
        </div>

        {(invoice.paymentTerms || invoice.notes) && (
          <div className="mt-8 space-y-3 border-t border-slate-200 pt-6 text-sm">
            {invoice.paymentTerms && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Payment terms</p>
                <p className="mt-1 text-slate-600">{invoice.paymentTerms}</p>
              </div>
            )}
            {invoice.notes && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Notes</p>
                <p className="mt-1 whitespace-pre-line text-slate-600">{invoice.notes}</p>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

function buildPayload(inv: Invoice, status: string) {
  return {
    number: inv.number,
    status,
    currency: inv.currency,
    issueDate: inv.issueDate,
    dueDate: inv.dueDate,
    taxRate: inv.taxRate,
    clientName: inv.clientName,
    clientEmail: inv.clientEmail,
    clientAddress: inv.clientAddress,
    clientTaxId: inv.clientTaxId,
    notes: inv.notes,
    paymentTerms: inv.paymentTerms,
    items: inv.items.map((it) => ({
      description: it.description,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
    })),
  };
}
