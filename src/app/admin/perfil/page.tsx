import { redirect } from "next/navigation";
import { StoreProfileForm } from "@/components/StoreProfileForm";
import { getAdminStoreId } from "@/lib/auth";

export default async function StoreProfilePage() {
  const storeId = await getAdminStoreId();
  if (!storeId) redirect("/admin/login");

  return <StoreProfileForm />;
}
