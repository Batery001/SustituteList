import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { StoreEventsDashboard } from "@/components/store/StoreEventsDashboard";

export default async function StoreDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login?callbackUrl=%2Fdashboard%2Fstore");

  if (session.user.role === "PLAYER") {
    redirect("/dashboard/player");
  }

  return (
    <StoreEventsDashboard storeName={session.user.name ?? "Tienda"} />
  );
}
