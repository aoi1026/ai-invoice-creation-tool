import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { ToastProvider } from "@/components/ui";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <ToastProvider>
      <AppShell
        user={{
          name: user.name,
          email: user.email,
          role: user.role,
          companyName: user.company.name,
        }}
      >
        {children}
      </AppShell>
    </ToastProvider>
  );
}
