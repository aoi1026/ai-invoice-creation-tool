"use client";

import { InvoiceEditor } from "@/components/InvoiceEditor";
import { PageHeader } from "@/components/AppShell";

export default function NewInvoicePage() {
  return (
    <div className="animate-fade-in">
      <PageHeader title="New invoice" description="Build an invoice manually or with AI." />
      <InvoiceEditor />
    </div>
  );
}
