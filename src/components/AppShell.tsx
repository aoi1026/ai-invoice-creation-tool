"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api, classNames } from "@/lib/client";
import { ROLE_LABELS } from "@/lib/format";
import type { Role } from "@/generated/prisma";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  minRole?: Role;
};

const ROLE_RANK: Record<Role, number> = { MEMBER: 1, MANAGER: 2, ADMIN: 3 };

function icon(path: string) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" strokeWidth="1.7" stroke="currentColor">
      <path d={path} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const NAV: NavItem[] = [
  { href: "/dashboard", label: "ダッシュボード", icon: icon("M3 12l9-9 9 9M5 10v10h14V10") },
  { href: "/invoices", label: "請求書", icon: icon("M7 3h7l4 4v14H6V4M14 3v5h5M9 13h6M9 17h4") },
  { href: "/clients", label: "取引先", icon: icon("M16 14a4 4 0 10-8 0M12 7a3 3 0 100-6 3 3 0 000 6M4 21v-1a4 4 0 014-4h8a4 4 0 014 4v1") },
  { href: "/templates", label: "テンプレート", icon: icon("M4 5h16M4 5v14h16V5M9 9h6M9 13h6") },
  { href: "/employees", label: "チーム", icon: icon("M17 20h5v-1a4 4 0 00-3-3.87M9 20H4v-1a4 4 0 013-3.87m6-1a4 4 0 100-8 4 4 0 000 8z"), minRole: "MANAGER" },
  { href: "/settings", label: "設定", icon: icon("M10.3 3.2a1 1 0 011.4 0l.9.9a1 1 0 001 .25l1.2-.3a1 1 0 011.2.7l.3 1.2a1 1 0 00.7.7l1.2.3a1 1 0 01.7 1.2l-.3 1.2a1 1 0 00.25 1l.9.9a1 1 0 010 1.4M12 15a3 3 0 100-6 3 3 0 000 6z") },
];

export type SessionUser = {
  name: string;
  email: string;
  role: Role;
  companyName: string;
};

export function AppShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const visibleNav = NAV.filter(
    (n) => !n.minRole || ROLE_RANK[user.role] >= ROLE_RANK[n.minRole],
  );

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-500 text-white">
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
            <path d="M6 3h9l3 3v15H6V3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M9 9h6M9 13h6M9 17h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900">Invora</p>
          <p className="truncate text-xs text-slate-500">{user.companyName}</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-2">
        {visibleNav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={classNames(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-200 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
            {user.name.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">{user.name}</p>
            <p className="truncate text-xs text-slate-500">{ROLE_LABELS[user.role] ?? user.role}</p>
          </div>
          <button
            onClick={logout}
            title="ログアウト"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" strokeWidth="1.7" stroke="currentColor">
              <path d="M15 17l5-5-5-5M20 12H9M9 4H5v16h4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="no-print fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white lg:block">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="no-print fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-white shadow-xl">{sidebar}</aside>
        </div>
      )}

      <div className="lg:pl-64">
        {/* Mobile top bar */}
        <header className="no-print sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur lg:hidden">
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" strokeWidth="1.8" stroke="currentColor">
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-slate-900">Invora</span>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-10 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="no-print mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 gap-2">{action}</div>}
    </div>
  );
}
