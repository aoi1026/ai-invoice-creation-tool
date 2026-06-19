"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client";
import { Badge, Button, Card, Spinner } from "@/components/ui";
import { PageHeader } from "@/components/AppShell";
import { formatMoney, formatDate, STATUS_LABELS, STATUS_STYLES } from "@/lib/format";

type Dashboard = {
  stats: {
    invoiceCount: number;
    clientCount: number;
    employeeCount: number;
    outstanding: number;
    paid: number;
    currency: string;
    byStatus: Record<string, { count: number; total: number }>;
    months: { label: string; total: number }[];
  };
  recent: {
    id: string;
    number: string;
    clientName: string;
    total: number;
    currency: string;
    status: string;
    issueDate: string;
  }[];
};

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Dashboard>("/api/dashboard")
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!data)
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    );

  const { stats, recent } = data;
  const maxMonth = Math.max(1, ...stats.months.map((m) => m.total));

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Dashboard"
        description="Your invoicing at a glance."
        action={
          <Link href="/invoices/new">
            <Button>+ New invoice</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Outstanding" value={formatMoney(stats.outstanding, stats.currency)} accent="text-amber-600" />
        <StatCard label="Paid (total)" value={formatMoney(stats.paid, stats.currency)} accent="text-emerald-600" />
        <StatCard label="Invoices" value={String(stats.invoiceCount)} />
        <StatCard label="Clients" value={String(stats.clientCount)} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <h2 className="text-sm font-semibold text-slate-900">Revenue (last 6 months)</h2>
          <div className="mt-6 flex h-48 items-stretch gap-3">
            {stats.months.map((m) => (
              <div key={m.label} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-indigo-500 to-violet-400 transition-all hover:from-indigo-600"
                    style={{ height: `${Math.max(3, (m.total / maxMonth) * 100)}%` }}
                    title={formatMoney(m.total, stats.currency)}
                  />
                </div>
                <span className="text-xs font-medium text-slate-500">{m.label}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-sm font-semibold text-slate-900">By status</h2>
          <div className="mt-4 space-y-3">
            {["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"].map((s) => {
              const v = stats.byStatus[s];
              if (!v) return null;
              return (
                <div key={s} className="flex items-center justify-between">
                  <Badge className={STATUS_STYLES[s]}>{STATUS_LABELS[s]}</Badge>
                  <span className="text-sm font-medium text-slate-700">
                    {v.count} · {formatMoney(v.total, stats.currency)}
                  </span>
                </div>
              );
            })}
            {Object.keys(stats.byStatus).length === 0 && (
              <p className="text-sm text-slate-500">No invoices yet.</p>
            )}
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Recent invoices</h2>
          <Link href="/invoices" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
            View all →
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-slate-500">
            No invoices yet.{" "}
            <Link href="/invoices/new" className="font-medium text-indigo-600">
              Create your first one
            </Link>
            .
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recent.map((inv) => (
              <li key={inv.id}>
                <Link
                  href={`/invoices/${inv.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{inv.number}</p>
                    <p className="truncate text-xs text-slate-500">
                      {inv.clientName} · {formatDate(inv.issueDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-900">
                      {formatMoney(inv.total, inv.currency)}
                    </span>
                    <Badge className={STATUS_STYLES[inv.status]}>{STATUS_LABELS[inv.status]}</Badge>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <Card className="p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${accent ?? "text-slate-900"}`}>{value}</p>
    </Card>
  );
}
