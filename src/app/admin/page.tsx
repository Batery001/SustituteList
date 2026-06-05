import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/AdminDashboard";
import { getAdminStoreId } from "@/lib/auth";

export default async function AdminPage() {
  const storeId = await getAdminStoreId();
  if (!storeId) {
  if (!storeId) redirect("/auth/login?callbackUrl=%2Fadmin");
  }

  return <AdminDashboard />;
}
