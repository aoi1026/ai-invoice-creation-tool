import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ToastProvider } from "@/components/ui";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <ToastProvider>
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50 px-4 py-12">
        <Link href="/" className="mb-8 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-500 text-white">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <path d="M6 3h9l3 3v15H6V3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              <path d="M9 9h6M9 13h6M9 17h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">Invora</span>
        </Link>
        <div className="w-full max-w-md">{children}</div>
      </div>
    </ToastProvider>
  );
}
