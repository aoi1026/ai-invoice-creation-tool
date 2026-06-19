"use client";

import { InvoiceEditor } from "@/components/InvoiceEditor";
import { PageHeader } from "@/components/AppShell";

export default function NewInvoicePage() {
  return (
    <div className="animate-fade-in">
      <PageHeader title="新規請求書" description="手入力またはAIで請求書を作成します。" />
      <InvoiceEditor />
    </div>
  );
}
