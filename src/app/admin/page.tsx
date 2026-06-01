import { redirect } from "next/navigation";
import { BrandHeader } from "@/components/BrandHeader";
import { AdminDashboard } from "@/components/AdminDashboard";
import { getAdminStoreId } from "@/lib/auth";

export default async function AdminPage() {
  const storeId = await getAdminStoreId();
  if (!storeId) {
    redirect("/admin/login");
  }

  return (
    <div className="mx-auto min-h-full max-w-2xl">
      <BrandHeader subtitle="Panel de la tienda" />
      <main className="px-4 py-6">
        <AdminDashboard />
      </main>
    </div>
  );
}
