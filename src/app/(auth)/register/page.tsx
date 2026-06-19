"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import { Button, Card, Field, Input } from "@/components/ui";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    companyName: "",
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api("/api/auth/register", { method: "POST", json: form });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "登録に失敗しました");
      setLoading(false);
    }
  }

  return (
    <Card className="p-8">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">アカウントを作成</h1>
      <p className="mt-1 text-sm text-slate-500">
        数分で請求業務を開始できます。あなたが会社の管理者になります。
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-200">
            {error}
          </div>
        )}
        <Field label="会社名">
          <Input required value={form.companyName} onChange={set("companyName")} placeholder="株式会社サンプル" />
        </Field>
        <Field label="お名前">
          <Input required value={form.name} onChange={set("name")} placeholder="山田 太郎" />
        </Field>
        <Field label="メールアドレス">
          <Input type="email" autoComplete="email" required value={form.email} onChange={set("email")} placeholder="you@company.com" />
        </Field>
        <Field label="パスワード" hint="8文字以上で入力してください。">
          <Input type="password" autoComplete="new-password" required value={form.password} onChange={set("password")} placeholder="••••••••" />
        </Field>
        <Button type="submit" loading={loading} className="w-full">
          アカウントを作成
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        すでにアカウントをお持ちの方は{" "}
        <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
          ログイン
        </Link>
      </p>
    </Card>
  );
}
