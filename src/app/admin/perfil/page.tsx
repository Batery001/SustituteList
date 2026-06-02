import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandHeader } from "@/components/BrandHeader";
import { StoreProfileForm } from "@/components/StoreProfileForm";
import { getAdminStoreId } from "@/lib/auth";

export default async function StoreProfilePage() {
  const storeId = await getAdminStoreId();
  if (!storeId) redirect("/admin/login");

  return (
    <div className="mx-auto min-h-full max-w-lg">
      <BrandHeader subtitle="Perfil de tienda" />
      <main className="px-4 py-6">
        <StoreProfileForm />
        <Link
          href="/admin"
          className="mt-6 block text-center text-sm text-sky-100/45 underline"
        >
          ← Panel
        </Link>
      </main>
    </div>
  );
}
