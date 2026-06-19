import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

const FEATURES = [
  {
    title: "AI invoice generation",
    body: "Describe a job in plain language and Invora drafts a complete invoice — line items, quantities, taxes and all.",
  },
  {
    title: "OCR data extraction",
    body: "Upload a photo or PDF of a receipt or quote and let Claude transcribe it into a structured invoice.",
  },
  {
    title: "Reusable templates",
    body: "Save your common invoices as templates and spin up a new one in seconds.",
  },
  {
    title: "Team & permissions",
    body: "Invite employees with Admin, Manager, or Member roles and control who can do what.",
  },
  {
    title: "Search & history",
    body: "Filter by status, client, or number across your full invoice history.",
  },
  {
    title: "PDF export",
    body: "Download polished, print-ready PDF invoices in a single click.",
  },
];

export default async function Landing() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <Logo />
          <span className="text-lg font-bold tracking-tight text-slate-900">Invora</span>
        </div>
        <nav className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500"
          >
            Get started
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 ring-1 ring-inset ring-indigo-200">
                Powered by Claude
              </span>
              <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
                Invoicing that writes{" "}
                <span className="bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
                  itself
                </span>
              </h1>
              <p className="mt-6 text-lg leading-8 text-slate-600">
                Generate invoices from a sentence, extract data from any receipt with
                OCR, manage clients and your team — all in one beautifully simple tool.
              </p>
              <div className="mt-10 flex items-center justify-center gap-4">
                <Link
                  href="/register"
                  className="rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-indigo-500"
                >
                  Create your account
                </Link>
                <Link
                  href="/login"
                  className="rounded-lg px-6 py-3 text-base font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Sign in →
                </Link>
              </div>
              <p className="mt-4 text-sm text-slate-500">
                Demo login: <code className="font-mono">demo@invoice.app</code> /{" "}
                <code className="font-mono">password123</code>
              </p>
            </div>
          </div>
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 bg-gradient-to-b from-indigo-50 to-transparent" />
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                <h3 className="text-base font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{f.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 py-8">
        <p className="text-center text-sm text-slate-500">
          Invora — AI Invoice Tool. Built with Next.js, Prisma &amp; Claude.
        </p>
      </footer>
    </div>
  );
}

function Logo() {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-500 text-white">
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path
          d="M6 3h9l3 3v15H6V3z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M9 9h6M9 13h6M9 17h4"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
