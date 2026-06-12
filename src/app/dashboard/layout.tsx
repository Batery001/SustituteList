import { redirect } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { getDashboardAccess } from "@/lib/auth/dashboard-access";
import { routes } from "@/lib/routes";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const access = await getDashboardAccess();
  if (!access) {
    redirect(`${routes.auth.login}?callbackUrl=%2Fdashboard`);
  }

  return (
    <PageShell subtitle={access.subtitle} area={access.area}>
      {children}
    </PageShell>
  );
}
