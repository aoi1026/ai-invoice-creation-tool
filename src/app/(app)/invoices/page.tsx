"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client";
import { Badge, Button, Card, EmptyState, Input, Select, Spinner } from "@/components/ui";
import { PageHeader } from "@/components/AppShell";
import { formatMoney, formatDate, STATUS_LABELS, STATUS_STYLES } from "@/lib/format";

type InvoiceRow = {
  id: string;
  number: string;
  clientName: string;
  total: number;
  currency: string;
  status: string;
  issueDate: string;
  dueDate: string | null;
  _count: { items: number };
};

const STATUSES = ["ALL", "DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"];

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ALL");

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status !== "ALL") params.set("status", status);
    const res = await api<{ invoices: InvoiceRow[] }>(`/api/invoices?${params}`);
    setInvoices(res.invoices);
    setLoading(false);
  }

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="請求書"
        description="請求書履歴を検索・絞り込み・管理できます。"
        action={
          <Link href="/invoices/new">
            <Button>＋ 新規請求書</Button>
          </Link>
        }
      />

      <div className="no-print mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <svg viewBox="0 0 24 24" fill="none" className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-slate-400" strokeWidth="1.7" stroke="currentColor">
            <path d="M21 21l-4.3-4.3M11 19a8 8 0 100-16 8 8 0 000 16z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="番号・取引先・メールで検索…"
            className="pl-10"
          />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-48">
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === "ALL" ? "すべてのステータス" : STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner className="h-8 w-8" />
        </div>
      ) : invoices.length === 0 ? (
        <EmptyState
          title="請求書が見つかりません"
          description={q || status !== "ALL" ? "検索条件や絞り込みを変更してみてください。" : "最初の請求書を作成して始めましょう。"}
          action={
            <Link href="/invoices/new">
              <Button>＋ 新規請求書</Button>
            </Link>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          {/* Desktop table */}
          <table className="hidden w-full text-left text-sm md:table">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-3 font-medium">番号</th>
                <th className="px-6 py-3 font-medium">取引先</th>
                <th className="px-6 py-3 font-medium">発行日</th>
                <th className="px-6 py-3 font-medium">支払期限</th>
                <th className="px-6 py-3 text-right font-medium">合計</th>
                <th className="px-6 py-3 font-medium">ステータス</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3">
                    <Link href={`/invoices/${inv.id}`} className="font-medium text-indigo-600 hover:text-indigo-500">
                      {inv.number}
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-slate-700">{inv.clientName}</td>
                  <td className="px-6 py-3 text-slate-500">{formatDate(inv.issueDate)}</td>
                  <td className="px-6 py-3 text-slate-500">{formatDate(inv.dueDate)}</td>
                  <td className="px-6 py-3 text-right font-medium text-slate-900">
                    {formatMoney(inv.total, inv.currency)}
                  </td>
                  <td className="px-6 py-3">
                    <Badge className={STATUS_STYLES[inv.status]}>{STATUS_LABELS[inv.status]}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile cards */}
          <ul className="divide-y divide-slate-100 md:hidden">
            {invoices.map((inv) => (
              <li key={inv.id}>
                <Link href={`/invoices/${inv.id}`} className="block px-4 py-4 hover:bg-slate-50">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-900">{inv.number}</span>
                    <Badge className={STATUS_STYLES[inv.status]}>{STATUS_LABELS[inv.status]}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{inv.clientName}</p>
                  <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                    <span>{formatDate(inv.issueDate)}</span>
                    <span className="font-semibold text-slate-900">{formatMoney(inv.total, inv.currency)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
