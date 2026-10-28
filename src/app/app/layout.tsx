import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ToastProvider } from "@/components/Toast";
import { getSession } from "@/lib/auth";
import { canAccessRecords } from "@/lib/access";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <ToastProvider>
      <AppShell
        userName={session.name}
        showRecords={canAccessRecords(session)}
      >
        {children}
      </AppShell>
    </ToastProvider>
  );
}
