import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { StoreProfileForm } from "@/components/StoreProfileForm";

export default async function StoreProfilePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/login?callbackUrl=%2Fdashboard%2Fstore%2Fprofile");
  }

  if (session.user.role === "PLAYER") {
    redirect("/dashboard/player");
  }

  return <StoreProfileForm />;
}
