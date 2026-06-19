"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client";
import { Button, Card, Field, Input } from "@/components/ui";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [devUrl, setDevUrl] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api<{ devResetUrl?: string }>("/api/auth/request-reset", {
        method: "POST",
        json: { email },
      });
      setSent(true);
      setDevUrl(res.devResetUrl ?? null);
    } catch {
      setSent(true); // generic — never reveal whether the email exists
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-8">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Reset your password</h1>
      <p className="mt-1 text-sm text-slate-500">
        Enter your email and we&apos;ll send you a reset link.
      </p>

      {sent ? (
        <div className="mt-6 space-y-4">
          <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-inset ring-emerald-200">
            If an account exists for that email, a reset link has been sent.
          </div>
          {devUrl && (
            <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-inset ring-amber-200">
              <p className="font-medium">Dev mode — no email provider configured.</p>
              <Link href={devUrl} className="mt-1 block font-medium text-indigo-600 underline">
                Open reset link →
              </Link>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Field label="Email">
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
          </Field>
          <Button type="submit" loading={loading} className="w-full">
            Send reset link
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-slate-500">
        <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
          ← Back to sign in
        </Link>
      </p>
    </Card>
  );
}
