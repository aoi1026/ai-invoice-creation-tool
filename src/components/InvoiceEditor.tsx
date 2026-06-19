"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import {
  Button,
  Card,
  Field,
  Input,
  Select,
  Textarea,
  useToast,
} from "@/components/ui";
import { CURRENCIES, STATUS_LABELS, computeTotals, formatMoney, toDateInput } from "@/lib/format";

type Item = { description: string; quantity: number; unitPrice: number };

export type InvoiceFormState = {
  id?: string;
  number: string;
  status: string;
  currency: string;
  issueDate: string;
  dueDate: string;
  taxRate: number;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  clientTaxId: string;
  notes: string;
  paymentTerms: string;
  items: Item[];
};

type ClientRow = {
  id: string;
  name: string;
  email: string | null;
  address: string | null;
  taxId: string | null;
};
type TemplateRow = {
  id: string;
  name: string;
  currency: string;
  taxRate: number;
  notes: string | null;
  paymentTerms: string | null;
  itemsJson: string;
};

type AIDraft = {
  clientName?: string;
  clientEmail?: string;
  clientAddress?: string;
  clientTaxId?: string;
  currency?: string;
  taxRate?: number;
  issueDate?: string;
  dueDate?: string;
  notes?: string;
  paymentTerms?: string;
  items?: Item[];
};

const EMPTY: InvoiceFormState = {
  number: "",
  status: "DRAFT",
  currency: "JPY",
  issueDate: toDateInput(new Date()),
  dueDate: "",
  taxRate: 10,
  clientId: "",
  clientName: "",
  clientEmail: "",
  clientAddress: "",
  clientTaxId: "",
  notes: "",
  paymentTerms: "",
  items: [{ description: "", quantity: 1, unitPrice: 0 }],
};

export function InvoiceEditor({ initial }: { initial?: InvoiceFormState }) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<InvoiceFormState>(initial ?? EMPTY);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ clients: ClientRow[] }>("/api/clients").then((r) => setClients(r.clients)).catch(() => {});
    api<{ templates: TemplateRow[] }>("/api/templates").then((r) => setTemplates(r.templates)).catch(() => {});
  }, []);

  const totals = computeTotals(form.items, form.taxRate);

  function update<K extends keyof InvoiceFormState>(key: K, value: InvoiceFormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function applyDraft(d: AIDraft) {
    setForm((f) => ({
      ...f,
      clientName: d.clientName || f.clientName,
      clientEmail: d.clientEmail ?? f.clientEmail,
      clientAddress: d.clientAddress ?? f.clientAddress,
      clientTaxId: d.clientTaxId ?? f.clientTaxId,
      currency: d.currency || f.currency,
      taxRate: typeof d.taxRate === "number" ? d.taxRate : f.taxRate,
      issueDate: d.issueDate ? toDateInput(d.issueDate) : f.issueDate,
      dueDate: d.dueDate ? toDateInput(d.dueDate) : f.dueDate,
      notes: d.notes ?? f.notes,
      paymentTerms: d.paymentTerms ?? f.paymentTerms,
      items:
        d.items && d.items.length
          ? d.items.map((it) => ({
              description: it.description ?? "",
              quantity: Number(it.quantity) || 0,
              unitPrice: Number(it.unitPrice) || 0,
            }))
          : f.items,
      clientId: "",
    }));
  }

  function pickClient(id: string) {
    const c = clients.find((x) => x.id === id);
    if (!c) {
      update("clientId", "");
      return;
    }
    setForm((f) => ({
      ...f,
      clientId: c.id,
      clientName: c.name,
      clientEmail: c.email ?? "",
      clientAddress: c.address ?? "",
      clientTaxId: c.taxId ?? "",
    }));
  }

  function applyTemplate(id: string) {
    const t = templates.find((x) => x.id === id);
    if (!t) return;
    let items: Item[] = [];
    try {
      items = JSON.parse(t.itemsJson);
    } catch {
      items = [];
    }
    setForm((f) => ({
      ...f,
      currency: t.currency,
      taxRate: t.taxRate,
      notes: t.notes ?? f.notes,
      paymentTerms: t.paymentTerms ?? f.paymentTerms,
      items: items.length ? items : f.items,
    }));
    toast.push(`テンプレート「${t.name}」を適用しました`, "info");
  }

  // Line item helpers
  function setItem(i: number, key: keyof Item, value: string) {
    setForm((f) => {
      const items = [...f.items];
      items[i] = {
        ...items[i],
        [key]: key === "description" ? value : Number(value),
      };
      return { ...f, items };
    });
  }
  function addItem() {
    setForm((f) => ({ ...f, items: [...f.items, { description: "", quantity: 1, unitPrice: 0 }] }));
  }
  function removeItem(i: number) {
    setForm((f) => ({
      ...f,
      items: f.items.length > 1 ? f.items.filter((_, idx) => idx !== i) : f.items,
    }));
  }

  async function save() {
    setError("");
    if (!form.clientName.trim()) {
      setError("請求先名を入力してください。");
      return;
    }
    if (!form.items.some((it) => it.description.trim())) {
      setError("内容を入力した明細を1件以上追加してください。");
      return;
    }
    setSaving(true);
    const payload = {
      number: form.number || undefined,
      status: form.status,
      currency: form.currency,
      issueDate: form.issueDate || null,
      dueDate: form.dueDate || null,
      taxRate: form.taxRate,
      clientId: form.clientId || null,
      clientName: form.clientName,
      clientEmail: form.clientEmail || null,
      clientAddress: form.clientAddress || null,
      clientTaxId: form.clientTaxId || null,
      notes: form.notes || null,
      paymentTerms: form.paymentTerms || null,
      items: form.items.filter((it) => it.description.trim()),
    };
    try {
      if (form.id) {
        await api(`/api/invoices/${form.id}`, { method: "PATCH", json: payload });
        toast.push("請求書を更新しました", "success");
        router.push(`/invoices/${form.id}`);
      } else {
        const res = await api<{ invoice: { id: string } }>("/api/invoices", {
          method: "POST",
          json: payload,
        });
        toast.push("請求書を作成しました", "success");
        router.push(`/invoices/${res.invoice.id}`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <AIPanel currency={form.currency} onDraft={applyDraft} />

        <Card className="p-6">
          <h2 className="text-sm font-semibold text-slate-900">請求書情報</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="請求書番号" hint={form.id ? undefined : "空欄の場合は自動採番されます"}>
              <Input value={form.number} onChange={(e) => update("number", e.target.value)} placeholder="自動" />
            </Field>
            <Field label="ステータス">
              <Select value={form.status} onChange={(e) => update("status", e.target.value)}>
                {["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"].map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </Select>
            </Field>
            <Field label="発行日">
              <Input type="date" value={form.issueDate} onChange={(e) => update("issueDate", e.target.value)} />
            </Field>
            <Field label="支払期限">
              <Input type="date" value={form.dueDate} onChange={(e) => update("dueDate", e.target.value)} />
            </Field>
            <Field label="通貨">
              <Select value={form.currency} onChange={(e) => update("currency", e.target.value)}>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </Field>
            <Field label="税率（%）">
              <Input type="number" step="0.1" min="0" max="100" value={form.taxRate}
                onChange={(e) => update("taxRate", Number(e.target.value))} />
            </Field>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">請求先</h2>
            {clients.length > 0 && (
              <Select className="w-48" value={form.clientId} onChange={(e) => pickClient(e.target.value)}>
                <option value="">保存済みの取引先から選択…</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            )}
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="請求先名">
              <Input value={form.clientName} onChange={(e) => update("clientName", e.target.value)} placeholder="株式会社サンプル" />
            </Field>
            <Field label="メールアドレス">
              <Input type="email" value={form.clientEmail} onChange={(e) => update("clientEmail", e.target.value)} placeholder="keiri@example.com" />
            </Field>
            <Field label="住所">
              <Textarea rows={2} value={form.clientAddress} onChange={(e) => update("clientAddress", e.target.value)} />
            </Field>
            <Field label="登録番号（インボイス）">
              <Input value={form.clientTaxId} onChange={(e) => update("clientTaxId", e.target.value)} />
            </Field>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">明細</h2>
            {templates.length > 0 && (
              <Select className="w-44" defaultValue="" onChange={(e) => { applyTemplate(e.target.value); e.target.value = ""; }}>
                <option value="">テンプレートを適用…</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </Select>
            )}
          </div>

          <div className="mt-4 space-y-3">
            <div className="hidden grid-cols-12 gap-2 px-1 text-xs font-medium uppercase tracking-wide text-slate-500 sm:grid">
              <div className="col-span-6">品目・内容</div>
              <div className="col-span-2 text-right">数量</div>
              <div className="col-span-2 text-right">単価</div>
              <div className="col-span-2 text-right">金額</div>
            </div>
            {form.items.map((it, i) => (
              <div key={i} className="grid grid-cols-12 items-start gap-2">
                <div className="col-span-12 sm:col-span-6">
                  <Input value={it.description} onChange={(e) => setItem(i, "description", e.target.value)} placeholder="品目・内容" />
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <Input type="number" step="any" className="text-right" value={it.quantity} onChange={(e) => setItem(i, "quantity", e.target.value)} />
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <Input type="number" step="any" className="text-right" value={it.unitPrice} onChange={(e) => setItem(i, "unitPrice", e.target.value)} />
                </div>
                <div className="col-span-3 flex h-10 items-center justify-end text-sm font-medium text-slate-900 sm:col-span-2">
                  {formatMoney((Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), form.currency)}
                </div>
                <button
                  onClick={() => removeItem(i)}
                  className="col-span-1 flex h-10 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 sm:hidden"
                  title="Remove"
                >
                  ✕
                </button>
                <button
                  onClick={() => removeItem(i)}
                  className="hidden text-slate-300 hover:text-red-600"
                  title="Remove"
                />
              </div>
            ))}
          </div>
          <button onClick={addItem} className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-500">
            ＋ 明細を追加
          </button>
        </Card>

        <Card className="p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="支払条件">
              <Input value={form.paymentTerms} onChange={(e) => update("paymentTerms", e.target.value)} placeholder="月末締め翌月末払い" />
            </Field>
            <Field label="備考">
              <Textarea rows={2} value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="お取引ありがとうございます。" />
            </Field>
          </div>
        </Card>
      </div>

      {/* Summary / actions */}
      <div className="lg:col-span-1">
        <div className="sticky top-6 space-y-4">
          <Card className="p-6">
            <h2 className="text-sm font-semibold text-slate-900">概要</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">小計</dt>
                <dd className="font-medium text-slate-900">{formatMoney(totals.subtotal, form.currency)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">消費税（{form.taxRate}%）</dt>
                <dd className="font-medium text-slate-900">{formatMoney(totals.taxAmount, form.currency)}</dd>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-base">
                <dt className="font-semibold text-slate-900">合計</dt>
                <dd className="font-bold text-indigo-600">{formatMoney(totals.total, form.currency)}</dd>
              </div>
            </dl>

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

            <div className="mt-5 flex flex-col gap-2">
              <Button onClick={save} loading={saving} className="w-full">
                {form.id ? "変更を保存" : "請求書を作成"}
              </Button>
              <Button variant="secondary" className="w-full" onClick={() => router.back()}>
                キャンセル
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* AI generation + OCR panel */
function AIPanel({
  currency,
  onDraft,
}: {
  currency: string;
  onDraft: (d: AIDraft) => void;
}) {
  const toast = useToast();
  const [instruction, setInstruction] = useState("");
  const [genLoading, setGenLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function generate() {
    if (!instruction.trim()) return;
    setGenLoading(true);
    try {
      const res = await api<{ draft: AIDraft }>("/api/ai/generate", {
        method: "POST",
        json: { instruction, defaultCurrency: currency },
      });
      onDraft(res.draft);
      toast.push("ドラフトを生成しました。内容を確認・調整してください", "success");
    } catch (err) {
      toast.push(err instanceof Error ? err.message : "生成に失敗しました", "error");
    } finally {
      setGenLoading(false);
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setOcrLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api<{ draft: AIDraft }>("/api/ai/ocr", { method: "POST", body: fd });
      onDraft(res.draft);
      toast.push("ドキュメントから抽出しました。内容を確認してください", "success");
    } catch (err) {
      toast.push(err instanceof Error ? err.message : "抽出に失敗しました", "error");
    } finally {
      setOcrLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-white p-6">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600 text-white">
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4"><path d="M5 3l1.5 4L11 8.5 6.5 10 5 14l-1.5-4L-1 8.5 3.5 7 5 3z" transform="translate(4 1)" fill="currentColor" /></svg>
        </span>
        <h2 className="text-sm font-semibold text-slate-900">AIで作成</h2>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        請求内容を自然な日本語で入力するか、領収書・PDFをアップロードすると自動で読み取ります。
      </p>
      <Textarea
        rows={3}
        className="mt-3"
        value={instruction}
        onChange={(e) => setInstruction(e.target.value)}
        placeholder="例：株式会社サンプルにコンサルティング20時間（時給15,000円）と初期費用50,000円を請求。消費税10%、支払期限は30日後。"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <Button onClick={generate} loading={genLoading} size="sm">
          ドラフトを生成
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp,application/pdf"
          className="hidden"
          onChange={onFile}
        />
        <Button variant="secondary" size="sm" loading={ocrLoading} onClick={() => fileRef.current?.click()}>
          📎 アップロードして抽出（OCR）
        </Button>
      </div>
    </Card>
  );
}
