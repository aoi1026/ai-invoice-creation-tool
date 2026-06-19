"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { Button, Card, EmptyState, Field, Input, Modal, Select, Spinner, Textarea, useToast } from "@/components/ui";
import { PageHeader } from "@/components/AppShell";
import { CURRENCIES, formatMoney } from "@/lib/format";

type Item = { description: string; quantity: number; unitPrice: number };
type Template = {
  id: string;
  name: string;
  description: string | null;
  currency: string;
  taxRate: number;
  notes: string | null;
  paymentTerms: string | null;
  itemsJson: string;
};

const BLANK = {
  name: "",
  description: "",
  currency: "JPY",
  taxRate: 10,
  notes: "",
  paymentTerms: "",
  items: [{ description: "", quantity: 1, unitPrice: 0 }] as Item[],
};

export default function TemplatesPage() {
  const toast = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  async function load() {
    const r = await api<{ templates: Template[] }>("/api/templates");
    setTemplates(r.templates);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openNew() {
    setEditing(null);
    setForm(BLANK);
    setOpen(true);
  }
  function openEdit(t: Template) {
    let items: Item[] = [];
    try { items = JSON.parse(t.itemsJson); } catch { items = []; }
    setEditing(t);
    setForm({
      name: t.name,
      description: t.description ?? "",
      currency: t.currency,
      taxRate: t.taxRate,
      notes: t.notes ?? "",
      paymentTerms: t.paymentTerms ?? "",
      items: items.length ? items : [{ description: "", quantity: 1, unitPrice: 0 }],
    });
    setOpen(true);
  }

  async function save() {
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description || null,
        currency: form.currency,
        taxRate: form.taxRate,
        notes: form.notes || null,
        paymentTerms: form.paymentTerms || null,
        items: form.items.filter((i) => i.description.trim()),
      };
      if (editing) await api(`/api/templates/${editing.id}`, { method: "PATCH", json: payload });
      else await api("/api/templates", { method: "POST", json: payload });
      toast.push("テンプレートを保存しました", "success");
      setOpen(false);
      await load();
    } catch (e) {
      toast.push(e instanceof Error ? e.message : "保存に失敗しました", "error");
    } finally {
      setSaving(false);
    }
  }

  async function remove(t: Template) {
    if (!confirm(`テンプレート「${t.name}」を削除しますか？`)) return;
    try {
      await api(`/api/templates/${t.id}`, { method: "DELETE" });
      toast.push("テンプレートを削除しました", "success");
      await load();
    } catch (e) {
      toast.push(e instanceof Error ? e.message : "削除に失敗しました", "error");
    }
  }

  function setItem(i: number, key: keyof Item, value: string) {
    setForm((f) => {
      const items = [...f.items];
      items[i] = { ...items[i], [key]: key === "description" ? value : Number(value) };
      return { ...f, items };
    });
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="テンプレート"
        description="請求書作成を効率化する再利用可能なプリセット。"
        action={<Button onClick={openNew}>＋ テンプレートを追加</Button>}
      />

      {loading ? (
        <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>
      ) : templates.length === 0 ? (
        <EmptyState title="テンプレートがまだありません" description="よく使う請求書をテンプレートとして保存できます。" action={<Button onClick={openNew}>＋ テンプレートを追加</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => {
            let items: Item[] = [];
            try { items = JSON.parse(t.itemsJson); } catch {}
            const total = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
            return (
              <Card key={t.id} className="flex flex-col p-5">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">{t.name}</h3>
                  {t.description && <p className="mt-0.5 text-sm text-slate-500">{t.description}</p>}
                  <p className="mt-2 text-xs text-slate-400">明細 {items.length} 件 · 税率 {t.taxRate}%</p>
                  <p className="mt-1 text-sm font-medium text-slate-700">小計 {formatMoney(total, t.currency)}</p>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => openEdit(t)}>編集</Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(t)}>削除</Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "テンプレートを編集" : "テンプレートを追加"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>キャンセル</Button>
            <Button onClick={save} loading={saving} disabled={!form.name.trim()}>保存</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="テンプレート名"><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></Field>
          <Field label="説明"><Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="通貨">
              <Select value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}>
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="税率（%）">
              <Input type="number" step="0.1" value={form.taxRate} onChange={(e) => setForm((f) => ({ ...f, taxRate: Number(e.target.value) }))} />
            </Field>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">既定の明細</p>
            <div className="space-y-2">
              {form.items.map((it, i) => (
                <div key={i} className="grid grid-cols-12 gap-2">
                  <Input className="col-span-6" placeholder="品目・内容" value={it.description} onChange={(e) => setItem(i, "description", e.target.value)} />
                  <Input className="col-span-2 text-right" type="number" step="any" value={it.quantity} onChange={(e) => setItem(i, "quantity", e.target.value)} />
                  <Input className="col-span-3 text-right" type="number" step="any" value={it.unitPrice} onChange={(e) => setItem(i, "unitPrice", e.target.value)} />
                  <button
                    className="col-span-1 text-slate-400 hover:text-red-600"
                    onClick={() => setForm((f) => ({ ...f, items: f.items.length > 1 ? f.items.filter((_, idx) => idx !== i) : f.items }))}
                  >✕</button>
                </div>
              ))}
            </div>
            <button
              className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-500"
              onClick={() => setForm((f) => ({ ...f, items: [...f.items, { description: "", quantity: 1, unitPrice: 0 }] }))}
            >＋ 明細を追加</button>
          </div>

          <Field label="支払条件"><Input value={form.paymentTerms} onChange={(e) => setForm((f) => ({ ...f, paymentTerms: e.target.value }))} /></Field>
          <Field label="備考"><Textarea rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} /></Field>
        </div>
      </Modal>
    </div>
  );
}
