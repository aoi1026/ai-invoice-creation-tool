"use client";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatMoney, formatDate } from "@/lib/format";

export type PdfInvoice = {
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
  items: { description: string; quantity: number; unitPrice: number; amount: number }[];
};

export type PdfCompany = {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  taxId?: string | null;
};

export function downloadInvoicePdf(invoice: PdfInvoice, company: PdfCompany) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 40;
  const cur = invoice.currency;

  // Header
  doc.setFontSize(24);
  doc.setTextColor(40, 40, 80);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", margin, 60);

  doc.setFontSize(11);
  doc.setTextColor(90, 90, 110);
  doc.setFont("helvetica", "normal");
  doc.text(invoice.number, margin, 78);

  // Company block (right aligned)
  doc.setFontSize(12);
  doc.setTextColor(20, 20, 40);
  doc.setFont("helvetica", "bold");
  doc.text(company.name, pageW - margin, 56, { align: "right" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(90, 90, 110);
  let cy = 72;
  const compLines = [
    company.address ?? "",
    company.email ?? "",
    company.phone ?? "",
    company.taxId ? `Tax ID: ${company.taxId}` : "",
  ].filter(Boolean);
  for (const line of compLines) {
    for (const wrapped of doc.splitTextToSize(line, 200)) {
      doc.text(wrapped, pageW - margin, cy, { align: "right" });
      cy += 12;
    }
  }

  // Bill to + meta
  const top = Math.max(cy, 100) + 16;
  doc.setFontSize(9);
  doc.setTextColor(130, 130, 150);
  doc.text("BILL TO", margin, top);
  doc.setFontSize(11);
  doc.setTextColor(20, 20, 40);
  doc.setFont("helvetica", "bold");
  doc.text(invoice.clientName, margin, top + 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(90, 90, 110);
  let by = top + 30;
  const billLines = [
    invoice.clientAddress ?? "",
    invoice.clientEmail ?? "",
    invoice.clientTaxId ? `Tax ID: ${invoice.clientTaxId}` : "",
  ].filter(Boolean);
  for (const line of billLines) {
    for (const wrapped of doc.splitTextToSize(line, 240)) {
      doc.text(wrapped, margin, by);
      by += 12;
    }
  }

  // Meta (right)
  const meta: [string, string][] = [
    ["Issue date", formatDate(invoice.issueDate)],
    ["Due date", formatDate(invoice.dueDate)],
    ["Status", invoice.status],
  ];
  let my = top;
  for (const [k, v] of meta) {
    doc.setTextColor(130, 130, 150);
    doc.text(k, pageW - margin - 120, my);
    doc.setTextColor(20, 20, 40);
    doc.text(v, pageW - margin, my, { align: "right" });
    my += 16;
  }

  // Items table
  autoTable(doc, {
    startY: Math.max(by, my) + 20,
    head: [["Description", "Qty", "Unit price", "Amount"]],
    body: invoice.items.map((it) => [
      it.description,
      String(it.quantity),
      formatMoney(it.unitPrice, cur),
      formatMoney(it.amount, cur),
    ]),
    theme: "striped",
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: "bold" },
    columnStyles: {
      1: { halign: "right", cellWidth: 50 },
      2: { halign: "right", cellWidth: 90 },
      3: { halign: "right", cellWidth: 90 },
    },
    margin: { left: margin, right: margin },
  });

  // Totals
  // @ts-expect-error lastAutoTable is attached by the plugin at runtime
  const endY: number = doc.lastAutoTable.finalY + 16;
  const labelX = pageW - margin - 160;
  const valX = pageW - margin;
  const rows: [string, string, boolean][] = [
    ["Subtotal", formatMoney(invoice.subtotal, cur), false],
    [`Tax (${invoice.taxRate}%)`, formatMoney(invoice.taxAmount, cur), false],
    ["Total", formatMoney(invoice.total, cur), true],
  ];
  let ty = endY;
  for (const [label, value, bold] of rows) {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 12 : 10);
    doc.setTextColor(bold ? 79 : 90, bold ? 70 : 90, bold ? 229 : 110);
    doc.text(label, labelX, ty);
    doc.text(value, valX, ty, { align: "right" });
    ty += bold ? 20 : 16;
  }

  // Notes / terms
  let ny = ty + 16;
  if (invoice.paymentTerms) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 80);
    doc.text("Payment terms", margin, ny);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(90, 90, 110);
    ny += 14;
    for (const line of doc.splitTextToSize(invoice.paymentTerms, pageW - 2 * margin)) {
      doc.text(line, margin, ny);
      ny += 12;
    }
    ny += 6;
  }
  if (invoice.notes) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 80);
    doc.text("Notes", margin, ny);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(90, 90, 110);
    ny += 14;
    for (const line of doc.splitTextToSize(invoice.notes, pageW - 2 * margin)) {
      doc.text(line, margin, ny);
      ny += 12;
    }
  }

  doc.save(`${invoice.number}.pdf`);
}
