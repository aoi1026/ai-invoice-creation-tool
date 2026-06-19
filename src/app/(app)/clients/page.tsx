"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { Button, Card, EmptyState, Field, Input, Modal, Spinner, Textarea, useToast } from "@/components/ui";
import { PageHeader } from "@/components/AppShell";

type Client = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  taxId: string | null;
  notes: string | null;
  _count: { invoices: number };
};

const BLANK = { name: "", email: "", phone: "", address: "", taxId: "", notes: "" };

export default function ClientsPage() {
  const toast = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  async function load() {
    const r = await api<{ clients: Client[] }>("/api/clients");
    setClients(r.clients);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openNew() {
    setEditing(null);
    setForm(BLANK);
    setOpen(true);
  }
  function openEdit(c: Client) {
    setEditing(c);
    setForm({
      name: c.name,
      email: c.email ?? "",
      phone: c.phone ?? "",
      address: c.address ?? "",
      taxId: c.taxId ?? "",
      notes: c.notes ?? "",
    });
    setOpen(true);
  }

  async function save() {
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        email: form.email || null,
        phone: form.phone || null,
        address: form.address || null,
        taxId: form.taxId || null,
        notes: form.notes || null,
      };
      if (editing) {
        await api(`/api/clients/${editing.id}`, { method: "PATCH", json: payload });
      } else {
        await api("/api/clients", { method: "POST", json: payload });
      }
      toast.push("取引先を保存しました", "success");
      setOpen(false);
      await load();
    } catch (e) {
      toast.push(e instanceof Error ? e.message : "保存に失敗しました", "error");
    } finally {
      setSaving(false);
    }
  }

  async function remove(c: Client) {
    if (!confirm(`${c.name} を削除しますか？`)) return;
    try {
      await api(`/api/clients/${c.id}`, { method: "DELETE" });
      toast.push("取引先を削除しました", "success");
      await load();
    } catch (e) {
      toast.push(e instanceof Error ? e.message : "削除に失敗しました", "error");
    }
  }

  const set = (k: keyof typeof BLANK) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="取引先"
        description="請求先を管理します。"
        action={<Button onClick={openNew}>＋ 取引先を追加</Button>}
      />

      {loading ? (
        <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>
      ) : clients.length === 0 ? (
        <EmptyState title="取引先がまだありません" description="取引先を登録すると、請求書をすばやく作成できます。" action={<Button onClick={openNew}>＋ 取引先を追加</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((c) => (
            <Card key={c.id} className="flex flex-col p-5">
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900">{c.name}</h3>
                {c.email && <p className="mt-0.5 text-sm text-slate-500">{c.email}</p>}
                {c.phone && <p className="text-sm text-slate-500">{c.phone}</p>}
                {c.address && <p className="mt-1 text-xs text-slate-400">{c.address}</p>}
                <p className="mt-2 text-xs font-medium text-slate-400">請求書 {c._count.invoices} 件</p>
              </div>
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => openEdit(c)}>編集</Button>
                <Button size="sm" variant="ghost" onClick={() => remove(c)}>削除</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "取引先を編集" : "取引先を追加"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>キャンセル</Button>
            <Button onClick={save} loading={saving} disabled={!form.name.trim()}>保存</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="取引先名"><Input value={form.name} onChange={set("name")} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="メールアドレス"><Input type="email" value={form.email} onChange={set("email")} /></Field>
            <Field label="電話番号"><Input value={form.phone} onChange={set("phone")} /></Field>
          </div>
          <Field label="住所"><Textarea rows={2} value={form.address} onChange={set("address")} /></Field>
          <Field label="登録番号（インボイス）"><Input value={form.taxId} onChange={set("taxId")} /></Field>
          <Field label="備考"><Textarea rows={2} value={form.notes} onChange={set("notes")} /></Field>
        </div>
      </Modal>
    </div>
  );
}
