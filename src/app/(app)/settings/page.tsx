"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { Button, Card, Field, Input, Spinner, Textarea, useToast } from "@/components/ui";
import { PageHeader } from "@/components/AppShell";

type Company = {
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  taxId: string | null;
  invoicePrefix: string;
  nextNumber: number;
};

export default function SettingsPage() {
  const toast = useToast();
  const [me, setMe] = useState<{ role: string } | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", taxId: "", invoicePrefix: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<{ role: string }>("/api/me").then(setMe).catch(() => {});
    api<{ company: Company }>("/api/company").then((r) => {
      setCompany(r.company);
      setForm({
        name: r.company.name,
        email: r.company.email ?? "",
        phone: r.company.phone ?? "",
        address: r.company.address ?? "",
        taxId: r.company.taxId ?? "",
        invoicePrefix: r.company.invoicePrefix,
      });
    });
  }, []);

  const isAdmin = me?.role === "ADMIN";

  async function save() {
    setSaving(true);
    try {
      await api("/api/company", {
        method: "PATCH",
        json: {
          name: form.name,
          email: form.email || null,
          phone: form.phone || null,
          address: form.address || null,
          taxId: form.taxId || null,
          invoicePrefix: form.invoicePrefix || undefined,
        },
      });
      toast.push("Company settings saved", "success");
    } catch (e) {
      toast.push(e instanceof Error ? e.message : "Save failed", "error");
    } finally {
      setSaving(false);
    }
  }

  if (!company)
    return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="animate-fade-in max-w-2xl">
      <PageHeader
        title="Settings"
        description={isAdmin ? "Your company profile appears on every invoice." : "Only admins can edit company settings."}
      />

      <Card className="p-6">
        <h2 className="text-sm font-semibold text-slate-900">Company profile</h2>
        <div className="mt-4 space-y-4">
          <Field label="Company name"><Input value={form.name} onChange={set("name")} disabled={!isAdmin} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email"><Input type="email" value={form.email} onChange={set("email")} disabled={!isAdmin} /></Field>
            <Field label="Phone"><Input value={form.phone} onChange={set("phone")} disabled={!isAdmin} /></Field>
          </div>
          <Field label="Address"><Textarea rows={2} value={form.address} onChange={set("address")} disabled={!isAdmin} /></Field>
          <Field label="Tax ID / 登録番号"><Input value={form.taxId} onChange={set("taxId")} disabled={!isAdmin} /></Field>
        </div>

        <h2 className="mt-8 text-sm font-semibold text-slate-900">Invoice numbering</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Number prefix" hint="e.g. INV-2026-">
            <Input value={form.invoicePrefix} onChange={set("invoicePrefix")} disabled={!isAdmin} />
          </Field>
          <Field label="Next number" hint="Auto-incremented per invoice">
            <Input value={company.nextNumber} disabled />
          </Field>
        </div>

        {isAdmin && (
          <div className="mt-6 flex justify-end">
            <Button onClick={save} loading={saving}>Save changes</Button>
          </div>
        )}
      </Card>
    </div>
  );
}
