import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { LayoutShell } from "@/components/layout/layout-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect("/login");
  }

  return (
    <LayoutShell nombre={session.nombre} rol={session.rol}>
      {children}
    </LayoutShell>
  );
}
